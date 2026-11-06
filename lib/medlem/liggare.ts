// lib/medlem/liggare.ts
//
// Orderliggaren fylls från tre håll (planen för E1, godkänd 2026-11-04):
//   1. Webhooken: godkänd, avbruten och återbetald order läses om från Wix
//      och skrivs direkt (E1-2: inom två minuter).
//   2. Avstämningen varje natt: ordrar ändrade de senaste 48 timmarna jämförs
//      med liggaren. Det som saknas eller skiljer skrivs, och loggas som en
//      avvikelse om webhooken borde ha sett det (E1-10).
//   3. Bakåtläsningen: en gång, alla ordrar 400 dagar bakåt, så att köp före
//      kontot räknas [P3]. Liggaren bär alla ordrar, inte bara medlemmarnas:
//      ett nytt konto ser sina köp direkt, utan något eget uppslag.
//
// Raden räknas alltid om ur den aktuella ordern, aldrig ur händelsens
// payload: den är auktoritativ och bär betalhändelserna.
//
// ☠️ BARA KÖP HÖR HEMMA I LIGGAREN (`arKop`, lib/order-raknas.ts). Vår kassa
// skapar ordern innan kunden betalar, och ett övergivet försök blir en obetald,
// avbruten order med nummer 0. Webhooken hör aldrig om dem, så avstämningen
// kallade varje sådant försök en avvikelse (natten mot 2026-11-06: 12 av 12
// var provordrar ur kassan), och Mina sidor visade det som en avbruten order.

import { behoverTransaktioner, liggarradUrOrder, skillnader, type Liggarrad, type WixOrder } from "./orderliggare";
import { hamtaOrder, hamtaTransaktioner, sokOrdrar } from "./wix-ordrar";
import { hamtaLiggarrad, liggarraderFor, loggaTyst, sparaLiggarrad, sparaLiggarrader, type Kalla } from "./lager";
import { arKop } from "../order-raknas";

const felText = (e: unknown) => (e instanceof Error ? e.message : String(e)).slice(0, 160);

async function radFor(order: WixOrder): Promise<Liggarrad> {
  const id = String(order.id ?? order._id ?? "");
  const tx = behoverTransaktioner(order) ? await hamtaTransaktioner(id) : null;
  return liggarradUrOrder(order, tx);
}

export type Uppdatering = { utfall: "ny" | "andrad" | "oforandrad" | "saknas" | "inget-kop"; falt: string[]; rad: Liggarrad | null };

/** Läser om en order och skriver raden om den är ny eller har ändrats. */
export async function uppdateraOrderliggare(orderId: string, kalla: Kalla): Promise<Uppdatering> {
  const order = await hamtaOrder(orderId);
  if (!order) return { utfall: "saknas", falt: [], rad: null };
  if (!arKop(order)) return { utfall: "inget-kop", falt: [], rad: null };
  const rad = await radFor(order);
  const forra = await hamtaLiggarrad(rad.orderId);
  const falt = forra ? skillnader(forra, rad) : [];
  if (forra && falt.length === 0) return { utfall: "oforandrad", falt, rad };
  await sparaLiggarrad(rad, kalla);
  return { utfall: forra ? "andrad" : "ny", falt, rad };
}

/** Webhookens väg: fäller aldrig webhooken, loggar bara utfallet. */
export async function uppdateraOrderliggareTyst(orderId: string | undefined, kalla: Kalla): Promise<void> {
  if (!orderId) return;
  try {
    const u = await uppdateraOrderliggare(orderId, kalla);
    console.log(`[medlem] orderliggaren: ${u.utfall}${u.falt.length ? ` (${u.falt.join(",")})` : ""}`);
  } catch (e) {
    console.error(`[medlem] orderliggaren kunde inte uppdateras: ${felText(e)}`);
  }
}

export interface Genomgang {
  lasta: number;
  nya: number;
  andrade: number;
  avvikelser: number;
  fel: number;
  summaStammerInte: number;
  klar: boolean;
  /** `createdDate` eller `updatedDate` för den sista lästa ordern. */
  position?: string;
}

const tom = (): Genomgang => ({ lasta: 0, nya: 0, andrade: 0, avvikelser: 0, fel: 0, summaStammerInte: 0, klar: true });

/**
 * Går igenom ordrar sida för sida. `stam` jämför och skriver allt som skiljer
 * (avstämningen); utan `stam` skrivs bara det som saknas (bakåtläsningen).
 */
async function genomga(opts: {
  falt: "createdDate" | "updatedDate";
  sedanIso: string;
  slutMs: number;
  kalla: Kalla;
  stam: boolean;
  /** Ordrar ändrade efter detta är avvikelser om liggaren inte redan hade dem. */
  avvikelseEfterIso?: string;
}): Promise<Genomgang> {
  const g = tom();
  let markor: string | null = null;
  for (;;) {
    if (Date.now() > opts.slutMs) {
      g.klar = false;
      return g;
    }
    const sida = await sokOrdrar(opts.falt, opts.sedanIso, markor);
    const idn = sida.ordrar.map((o) => String(o.id ?? o._id ?? "")).filter(Boolean);
    const befintliga = await liggarraderFor(idn);
    const attSpara: Liggarrad[] = [];
    for (const order of sida.ordrar) {
      g.lasta++;
      const id = String(order.id ?? order._id ?? "");
      const tid = String(order[opts.falt] ?? "");
      if (tid) g.position = tid;
      if (!arKop(order)) continue;
      const forra = befintliga.get(id);
      if (forra && !opts.stam) continue;
      let rad: Liggarrad;
      try {
        rad = await radFor(order);
      } catch (e) {
        g.fel++;
        console.error(`[medlem] ${opts.kalla}: en order gick inte att läsa: ${felText(e)}`);
        continue;
      }
      if (!rad.summaStammer) g.summaStammerInte++;
      const falt = forra ? skillnader(forra, rad) : [];
      if (forra && falt.length === 0) continue;
      attSpara.push(rad);
      if (forra) g.andrade++;
      else g.nya++;
      const andradTid = String(order.updatedDate ?? "");
      if (opts.avvikelseEfterIso && andradTid > opts.avvikelseEfterIso) {
        g.avvikelser++;
        await loggaTyst({ omrade: "avstamning", typ: forra ? "andrad" : "saknades", orderId: id, falt, aktor: "system" });
      }
    }
    const s = await sparaLiggarrader(attSpara, opts.kalla);
    g.fel += s.fel;
    if (!sida.nasta) return g;
    markor = sida.nasta;
  }
}

/** E1-10: ordrar ändrade sedan `sedanIso` (48 timmar) mot liggaren. */
export function stamAv(sedanIso: string, slutMs: number, avvikelseEfterIso: string | undefined): Promise<Genomgang> {
  return genomga({ falt: "updatedDate", sedanIso, slutMs, kalla: "avstamning", stam: true, avvikelseEfterIso });
}

/** [P3]: ordrar skapade sedan `sedanIso`, bara de som saknas i liggaren. */
export function lasBakat(sedanIso: string, slutMs: number): Promise<Genomgang> {
  return genomga({ falt: "createdDate", sedanIso, slutMs, kalla: "bakat", stam: false });
}
