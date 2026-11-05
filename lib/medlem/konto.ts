// lib/medlem/konto.ts
//
// Kontot: inloggningen som skapar det, och underlaget till Mina sidor.
// Nivån räknas direkt ur orderliggaren vid varje besök, så att en
// återbetalning syns samma dag (E1-6) och ett köp som faller ur syns på
// dagen (E1-7). Nattjobbet sparar samma tal på medlemmen för admin och mejl.

import { uppdateraOrderliggareTyst } from "./liggare";
import {
  aktuellaRegler,
  hamtaMedlem,
  liggarraderForEpost,
  loggaTyst,
  skapaMedlem,
  uppdateraMedlem,
  type Medlem,
} from "./lager";
import { lageForMedlem, type Nivalage, type Regler } from "./niva";
import type { Liggarrad } from "./orderliggare";
import { skickaValkommen } from "./mejl";
import { K, allaRader } from "@/lib/wix-lager";

export function lageFor(medlem: Medlem | null, rader: Liggarrad[], regler: Regler, nuMs = Date.now()): Nivalage {
  return lageForMedlem(medlem, rader, regler, nuMs);
}

export type Inloggningsutfall = { ok: true; medlem: Medlem; ny: boolean } | { ok: false; fel: "sparrad" };

/**
 * Efter en godkänd kod eller länk. Det första lyckade inloggningen skapar
 * kontot och skickar välkomstmejlet, en gång. `order` är ordern från
 * tacksidan: den läses in först, så att köpet nyss räknas även om webhooken
 * inte hunnit fram.
 */
export async function loggaIn(epost: string, order?: string): Promise<Inloggningsutfall> {
  if (order) await uppdateraOrderliggareTyst(order, "inloggning");
  const regler = await aktuellaRegler();
  const rader = await liggarraderForEpost(epost);
  const lage = lageFor(null, rader, regler);
  const { medlem, ny } = await skapaMedlem(epost, lage.niva.namn);
  if (medlem.status === "sparrad") {
    await loggaTyst({ omrade: "konto", typ: "nekad-sparrad", medlemsId: medlem.id, aktor: "kund" });
    return { ok: false, fel: "sparrad" };
  }
  const tid = new Date().toISOString();
  const falt: Record<string, unknown> = { senastInloggad: tid };
  if (ny) {
    falt.kOre = lage.kOre;
    falt.niva = lage.niva.namn;
    falt.beraknad = tid;
    if (await skickaValkommen(epost, lage)) falt.valkomstSkickad = tid;
  }
  await uppdateraMedlem(medlem.id, falt);
  return { ok: true, medlem, ny };
}

export interface OrderPaMinaSidor {
  orderId: string;
  ordernummer: string;
  bestalld: string;
  totaltOre: number;
  status: "betald" | "delvis-aterbetald" | "aterbetald" | "avbruten" | "obetald";
  /** Spårningsnummer som /sparning känner till. */
  sparning: string[];
  /** Orderns varor ur orderliggaren, i orderns ordning (högst sex). */
  varor: { namn: string; produktId?: string; antal: number }[];
  /** Har ordern en fysisk vara ur katalogen? Då visas "Köp igen" (lib/medlem/kop-igen.ts). */
  kopIgen: boolean;
}

export interface MinaSidor {
  medlem: Medlem;
  regler: Regler;
  lage: Nivalage;
  ordrar: OrderPaMinaSidor[];
}

function orderstatus(r: Liggarrad): OrderPaMinaSidor["status"] {
  if (r.orsak === "avbruten") return "avbruten";
  if (r.orsak === "obetald") return "obetald";
  if (r.aterbetaltVarorOre > 0 && r.aterbetaltVarorOre >= r.varorOre) return "aterbetald";
  if (r.aterbetaltVarorOre > 0) return "delvis-aterbetald";
  return "betald";
}

/** Underlaget till Mina sidor, eller null om kontot saknas. */
export async function minaSidor(medlemsId: string): Promise<MinaSidor | null> {
  const medlem = await hamtaMedlem(medlemsId);
  if (!medlem || medlem.status !== "aktiv") return null;
  const [regler, rader] = await Promise.all([aktuellaRegler(), liggarraderForEpost(medlem.epost)]);
  const lage = lageFor(medlem, rader, regler);

  // Paketen, i en fråga: spårningstabellen bär orderns nummer, inte dess id.
  // Paket i karantän (`ambiguous`) visas inte, samma regel som /sparning.
  const perOrder = new Map<string, string[]>();
  try {
    const nummer = [...new Set(rader.map((r) => r.ordernummer))];
    for (let i = 0; i < nummer.length; i += 100) {
      const paket = await allaRader(K.sparning, { filter: { orderId: { $in: nummer.slice(i, i + 100) }, status: { $ne: "ambiguous" } } });
      for (const p of paket) {
        const order = typeof p.orderId === "string" ? p.orderId : "";
        const tn = typeof p.trackingNumber === "string" ? p.trackingNumber : "";
        if (order && tn) perOrder.set(order, [...(perOrder.get(order) ?? []), tn]);
      }
    }
  } catch (e) {
    console.error("[medlem] spårningen gick inte att läsa:", e instanceof Error ? e.message.slice(0, 120) : e);
  }

  const ordrar = rader
    .map((r) => ({
      orderId: r.orderId,
      ordernummer: r.ordernummer,
      bestalld: r.bestalld,
      totaltOre: r.totaltOre,
      status: orderstatus(r),
      sparning: perOrder.get(r.ordernummer) ?? [],
      varor: (r.rader ?? [])
        .filter((v) => v.namn && v.antal > 0)
        .slice(0, 6)
        .map((v) => ({ namn: v.namn, antal: v.antal, ...(v.produktId ? { produktId: v.produktId } : {}) })),
      kopIgen: (r.rader ?? []).some((v) => v.raknas && Boolean(v.produktId)),
    }))
    .sort((a, b) => b.bestalld.localeCompare(a.bestalld));
  return { medlem, regler, lage, ordrar };
}
