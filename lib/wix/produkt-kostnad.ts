// Varukostnaden (`revenueDetails.cost`) på en V3-variant, och hur den följer med
// när en variantsInfo skrivs tillbaka.
//
// ☠️ EN variantsInfo-PATCH ERSÄTTER VARIANTEN, och en läsning utan
// `fields=MERCHANT_DATA` bär ingen kostnad. Varje skrivare som läste produkten
// utan fältet och skickade tillbaka `variantsInfo` ordagrant nollade därför
// kostnaden på varje variant den rörde: poleringens SKU-steg, bildkopplingen vid
// import, färgbilderna, miljöbilden, bortplockningen av bilder, sammanslagningens
// länksteg och auktionens prissänkning. Uppmätt 2026-10-24 på hela katalogen
// (products/query-variants, MERCHANT_DATA): 6 221 produkter, 3 595 av 8 644
// varianter med kostnad, 2 633 publicerade produkter utan kostnad alls och 331 med
// den på några av varianterna (CLAUDE.md).
//
// Det driver bara Wix egen vinst- och marginalrapport. Husets lönsamhetsöversikt
// och auktionens golvbud läser mappningens `landedCostSek`. Men det är tyst, och
// det händer vid varje skrivning, så ingen skrivare får lämna kostnaden bakom sig.
//
// ☠️ MERCHANT_DATA kräver SCOPE.STORES.PRODUCT_READ_ADMIN. Motorns nyckel saknade
// den 2026-09-27 (403 NO_PERMISSION_TO_READ_MERCHANT_DATA) och hade den
// 2026-10-24 (variantbild.yml läste fältet på 30 av 30 sidor). Nekas fältet läses
// sidan om utan det, och `kostnadLasbar` är false: skrivningen går som förut, men
// anroparen ska SÄGA att kostnaden inte följde med. Ett nekat kostnadsfält får
// inte stoppa en polering eller en sammanslagning. (`refreshVariantMedia` är
// strängare: den skriver ingenting, för variantbilden kan vänta.)
//
// ☠️ `profit` och `profitMargin` räknas av Wix och är skrivskyddade. Bara
// `cost` går tillbaka (prövat mot skarpa V3 2026-10-24: en PATCH med kostnaden
// ur en MERCHANT_DATA-läsning och de två fälten borttagna gav samma kostnad igen).

import type { WixAnrop } from "../polish/skrivplan";

type Obj = Record<string, unknown>;

const obj = (v: unknown): Obj => (v && typeof v === "object" && !Array.isArray(v) ? (v as Obj) : {});

/** Läsfältet som ger varukostnaden. */
export const KOSTNADSFALT = "fields=MERCHANT_DATA";

/** Raden en skrivare lägger i sitt svar när kostnaden inte gick att läsa, så att det syns att den inte följde med. */
export const KOSTNAD_EJ_LASBAR = "varukostnaden går inte att läsa (MERCHANT_DATA nekas) — den följer inte med";

/** Är felet ett nekat kostnadsfält (403)? Ett `WixAnrop` kastar `Wix <status>: <kropp>`. */
export function arKostnadNekad(e: unknown): boolean {
  return /Wix 403|NO_PERMISSION_TO_READ_MERCHANT_DATA/i.test(String((e as Error)?.message ?? e));
}

/** Samma fråga för kod som anropar Wix med fetch: svarets status och text. */
export function arKostnadNekadSvar(status: number, text: string): boolean {
  return status === 403 || /NO_PERMISSION_TO_READ_MERCHANT_DATA/i.test(text);
}

/**
 * GET med varukostnaden. `sokvag` är läsningen som den ser ut utan fältet; här
 * läggs `fields=MERCHANT_DATA` till. Nekas fältet läses sidan om utan det, och
 * `kostnadLasbar` är då false. Alla andra fel kastas som förut.
 */
export async function lasMedKostnad(
  wix: WixAnrop,
  sokvag: string,
): Promise<{ svar: unknown; kostnadLasbar: boolean }> {
  const med = `${sokvag}${sokvag.includes("?") ? "&" : "?"}${KOSTNADSFALT}`;
  try {
    return { svar: await wix("GET", med), kostnadLasbar: true };
  } catch (e) {
    if (!arKostnadNekad(e)) throw e;
    return { svar: await wix("GET", sokvag), kostnadLasbar: false };
  }
}

/**
 * Varianten att skriva tillbaka: allt ordagrant, men `revenueDetails` bär bara
 * kostnaden. Har varianten ingen kostnad tas fältet bort, så en läsning utan
 * MERCHANT_DATA och en med skickar samma sak.
 */
export function variantMedKostnad<T extends Obj>(v: T): T {
  const ut: Obj = { ...v };
  const kost = obj(v.revenueDetails).cost;
  if (kost && typeof kost === "object") ut.revenueDetails = { cost: kost };
  else delete ut.revenueDetails;
  return ut as T;
}

/** `variantsInfo` med varje variant genom `variantMedKostnad`. Allt annat orört. */
export function variantsInfoMedKostnad<T>(variantsInfo: T): T {
  const vi = obj(variantsInfo);
  if (!Array.isArray(vi.variants)) return variantsInfo;
  return {
    ...vi,
    variants: (vi.variants as unknown[]).map((v) => (v && typeof v === "object" ? variantMedKostnad(v as Obj) : v)),
  } as T;
}

/** Variantens kostnad som text ("50.00"), eller null när den saknas. */
export function kostnadAv(v: unknown): string | null {
  const a = obj(obj(obj(v).revenueDetails).cost).amount;
  if (typeof a === "number" && Number.isFinite(a)) return String(a);
  return typeof a === "string" && a.trim() !== "" ? a : null;
}

/**
 * Är två kostnader samma tal? "50" och "50.00" är det. Saknad kostnad är lika med
 * saknad kostnad, och aldrig lika med ett tal: en kostnad som försvunnit ska fälla.
 */
export function likaKostnad(a: string | null | undefined, b: string | null | undefined): boolean {
  const x = a ?? null;
  const y = b ?? null;
  if (x === null || y === null) return x === y;
  const nx = Number(x);
  const ny = Number(y);
  return Number.isFinite(nx) && Number.isFinite(ny) ? nx === ny : x === y;
}
