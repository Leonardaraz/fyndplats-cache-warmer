// lib/fraktmejl-rader.ts
//
// Rena hjälpfunktioner för det samlade fraktmejlet (lib/shipping-email-batch.ts):
// vilka nummer och rader ett paket bär, om hela ordern är skickad, och flödet
// från webhook till mejl med databas och utskick injicerade. Egen fil utan
// beroenden så att testerna kan köra den direkt.

export interface SandningsRad {
  id: string;
  quantity: number;
}

/** Ett spårningsnummer i kön: ett paket, med de rader det bär. */
export interface KoadSandning {
  trackingNumber: string;
  carrier: string | null;
  lineItems: SandningsRad[];
}

type Obj = Record<string, unknown>;

/** Radernas id och antal i en Wix-fulfillment ({ lineItems: [{ id, quantity }] }). */
export function sandningsRader(fulfillment: Obj | undefined): SandningsRad[] {
  const rader = fulfillment?.lineItems;
  if (!Array.isArray(rader)) return [];
  const ut: SandningsRad[] = [];
  for (const r of rader as Obj[]) {
    const id = String(r.id ?? r._id ?? r.lineItemId ?? "");
    if (id) ut.push({ id, quantity: Number(r.quantity) || 1 });
  }
  return ut;
}

/** Slår ihop flera sändningars rader till en lista med summerat antal per rad. */
export function slaIhopRader(sandningar: Array<{ lineItems: SandningsRad[] }>): SandningsRad[] {
  const antal = new Map<string, number>();
  for (const s of sandningar) {
    for (const r of s.lineItems) antal.set(r.id, (antal.get(r.id) ?? 0) + r.quantity);
  }
  return [...antal].map(([id, quantity]) => ({ id, quantity }));
}

/**
 * Är hela ordern skickad? Wix egen status räcker när den finns; annars jämförs
 * orderns antal per rad med summan över ALLA fulfillments (även de utan
 * spårningsnummer). Hellre "nej" vid tvekan: då går mejlet via cronen i stället.
 */
export function heltSkickad(order: Obj, fulfillments: Obj[]): boolean {
  const status = String(order.fulfillmentStatus ?? "").toUpperCase();
  if (status === "FULFILLED") return true;
  const orderRader = (order.lineItems ?? order.items) as Obj[] | undefined;
  if (!Array.isArray(orderRader) || orderRader.length === 0) return false;
  const skickat = new Map<string, number>();
  for (const r of slaIhopRader(fulfillments.map((f) => ({ lineItems: sandningsRader(f) })))) {
    skickat.set(r.id, r.quantity);
  }
  return orderRader.every((r) => {
    const id = String(r.id ?? r._id ?? "");
    const behov = Number(r.quantity) || 1;
    return id !== "" && (skickat.get(id) ?? 0) >= behov;
  });
}

// ── Flera nummer i ett fält ──────────────────────────────────────────────────
//
// Wix tar ett spårningsnummer per fulfillment och en fulfillment per
// artikelantal. En vara som kommer i två kartonger (order 10095: ett hantelset
// i två DPD-paket) får därför båda numren i samma fält, separerade med komma,
// t.ex. "01234567890123, 01234567890125". En fulfillment utan rader nekas av Wix
// ("lineItems must not be empty", provat 2026-10-17), så ett andra nummer kan
// inte få en egen.
//
// Samma regel står i motorns lib/tracking-link.ts (grenen main), som bygger
// spårlänken på Wix-fulfillmenten. De två historierna kan inte dela kod, så
// regeln finns på båda ställena och måste stämma.

/**
 * Delar ett spårningsfält i nummer: på komma, semikolon och radbrytning,
 * aldrig på mellanslag, eftersom vissa bolags nummer innehåller mellanslag.
 * Trimmar, tar bort tomma och dubbletter och behåller ordningen. Ett enskilt
 * nummer blir exakt det fältet var, trimmat.
 */
export function delaSparningsnummer(falt: unknown): string[] {
  if (typeof falt !== "string") return [];
  const ut: string[] = [];
  for (const del of falt.split(/[,;\r\n]+/)) {
    const nummer = del.trim();
    if (nummer && !ut.includes(nummer)) ut.push(nummer);
  }
  return ut;
}

/** Spårningsfältet i en Wix-fulfillment, som det står där. */
function sparningsfalt(f: Obj | undefined): unknown {
  const info = f?.trackingInfo as Obj | undefined;
  return typeof info?.trackingNumber === "string" && info.trackingNumber.trim() ? info.trackingNumber : f?.trackingNumber;
}

/**
 * En sändning per nummer i fulfillmentens spårningsfält. Raderna hör till det
 * första numret och de övriga paketen får inga. Annars hade varan räknats en
 * gång per paket, och ett hantelset i två kartonger hade stått som 2 st.
 */
export function sandningarIFulfillment(f: Obj | undefined): Array<{ trackingNumber: string; lineItems: SandningsRad[] }> {
  const rader = sandningsRader(f);
  return delaSparningsnummer(sparningsfalt(f)).map((trackingNumber, i) => ({
    trackingNumber,
    lineItems: i === 0 ? rader : [],
  }));
}

/** Fraktmejlets ämnesrad. */
export function fraktmejlAmne(orderNumber: string, antalPaket: number): string {
  return antalPaket > 1
    ? `Dina ${antalPaket} paket är på väg – order ${orderNumber}`
    : `Ditt paket är på väg – order ${orderNumber}`;
}

// ── Från webhook till mejl ───────────────────────────────────────────────────

/** Utfallet av upsertTrackingMapping i webhooken. */
export type Mappning = "new" | "duplicate" | "error" | "collision";

/** Ett fraktmejl: Resend-id (undefined när mejl är avstängda), eller varför det inte gick. */
export type Utskick = { resendId?: string } | { fel: "build failed" | "send failed" };

export interface SamlatDeps {
  /** Tar atomiskt alla väntande nummer för ordern (taVantande). */
  taVantande(): Promise<KoadSandning[]>;
  /** Lämnar tillbaka anspråket (slappVantande). */
  slapp(nummer: string[]): Promise<void>;
  /** Bygger och skickar ETT mejl med sändningarna. */
  skicka(sandningar: KoadSandning[]): Promise<Utskick>;
}

/**
 * Skickar ETT fraktmejl med allt som väntar för ordern. Går mejlet inte iväg
 * lämnas numren tillbaka till kön, så att nästa webhook eller cronen tar dem.
 */
export async function skickaVantande(
  deps: SamlatDeps,
): Promise<{ sent: number; resendId?: string; reason?: string; nummer: string[] }> {
  const vantande = await deps.taVantande();
  const nummer = vantande.map((s) => s.trackingNumber);
  if (vantande.length === 0) return { sent: 0, reason: "inget väntande", nummer };
  let utfall: Utskick;
  try {
    utfall = await deps.skicka(vantande);
  } catch (err) {
    await deps.slapp(nummer);
    throw err;
  }
  if ("fel" in utfall) {
    await deps.slapp(nummer);
    return { sent: 0, reason: utfall.fel, nummer };
  }
  return { sent: nummer.length, resendId: utfall.resendId, nummer };
}

export interface TaEmotDeps {
  /** Raden i tracking_mapping för ett nummer (upsertTrackingMapping utan 17TRACK). */
  mappa(trackingNumber: string): Promise<Mappning>;
  /** Registrerar nya nummer hos 17TRACK. Anropas sist, se taEmotFulfillments. */
  registrera(nummer: string[]): Promise<void>;
  /** Transportörsraden för numret, maskerad och med samma ord som /sparning. */
  transportor(trackingNumber: string, fulfillment: Obj): string | null;
  /** Lägger numret i kön (koaSandning). false när kön inte gick att nå. */
  koa(s: KoadSandning): Promise<boolean>;
  /** Kön gick inte att nå: ett mejl direkt för de här sändningarna. */
  skickaDirekt(sandningar: KoadSandning[]): Promise<Utskick>;
  /** Ett mejl med allt som väntar för ordern (skickaVantande). */
  skickaSamlat(): Promise<{ resendId?: string }>;
}

/**
 * Webhookens fraktgren (order_fulfillments_updated). Varje nummer i varje
 * fulfillment blir en egen sändning, med egen rad i tracking_mapping (och
 * därmed i 17TRACK) och egen rad i kön. Ett nummer som redan finns i
 * tracking_mapping är en omskickad webhook och hoppas över, så dedupen gäller
 * per nummer. När ordern är helt skickad går ETT mejl med allt som väntar.
 *
 * 17TRACK registreras sist, efter mejlet. Registreringen kan ta några sekunder
 * per nummer. Låg den mellan två nummer kunde en omskickad webhook hinna ta det
 * andra numret medan den första väntade, och då fick kunden två mejl med ett
 * nummer var (granskningen 2026-10-17).
 */
export async function taEmotFulfillments(
  order: Obj,
  fulfillments: Obj[],
  deps: TaEmotDeps,
): Promise<{ koade: number; dubbletter: number; direkt: number; skickat: string[]; vantar: boolean }> {
  let koade = 0;
  let dubbletter = 0;
  const nya: string[] = [];
  const skickat: string[] = [];
  const direkt: KoadSandning[] = [];
  let vantar = false;
  try {
    for (const f of fulfillments) {
      for (const s of sandningarIFulfillment(f)) {
        // "error" och "collision" köas: hellre ett mejl än ett tyst tappat.
        const mappning = await deps.mappa(s.trackingNumber);
        if (mappning === "duplicate") {
          dubbletter++;
          continue;
        }
        if (mappning === "new") nya.push(s.trackingNumber);
        const sandning: KoadSandning = {
          trackingNumber: s.trackingNumber,
          carrier: deps.transportor(s.trackingNumber, f),
          lineItems: s.lineItems,
        };
        if (await deps.koa(sandning)) koade++;
        else direkt.push(sandning);
      }
    }
    // Kön gick inte att nå: skicka direkt som förr, men ett mejl för alla nummer.
    if (direkt.length > 0) {
      const utfall = await deps.skickaDirekt(direkt);
      if ("resendId" in utfall && utfall.resendId) skickat.push(utfall.resendId);
    }
    if (koade > 0 || dubbletter > 0) {
      if (heltSkickad(order, fulfillments)) {
        const res = await deps.skickaSamlat();
        if (res.resendId) skickat.push(res.resendId);
      } else {
        vantar = koade > 0;
      }
    }
  } finally {
    // Även när utskicket kastar: numren finns redan i tracking_mapping och
    // registreras aldrig igen, eftersom en omskickad webhook ser dubbletter.
    if (nya.length > 0) await deps.registrera(nya);
  }
  return { koade, dubbletter, direkt: direkt.length, skickat, vantar };
}
