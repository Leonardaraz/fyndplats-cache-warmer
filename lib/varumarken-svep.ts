// lib/varumarken-svep.ts
//
// Varans märke i Wix fält "brand": för produktsidan ur produktens egen V3-rad,
// för flödena ur ett svep över alla produkter som har ett märke.
//
// ☠️ VARFÖR (2026-11-15). Kartan hämtades förut av VARJE produktsida, som en
// kedja av markörsidor med en fetch per sida i Nexts data-cache. Sida 2 och
// framåt hade förra svarets markör i sin cache-nyckel, så när sida 1 hämtades på
// nytt missade resten: ca 20 anrop mot Wix per ombyggnad (1 930 produkter med
// märke, mest VEVOR). I produktion var 4 049 av 4 051 felrader på ett dygn
// "[wix] fetchVarumarken failed: HTTP 429". Ett fel gav dessutom en DELVIS karta
// som såg hel ut, så VEVOR-varor fick märket Fyndplats. Nu:
//  - produktsidan läser varans märke ur V3-raden den redan hämtar (markeUrV3,
//    lib/products.ts produktGrund) och gör inget eget anrop för det;
//  - flödena får hela kartan ur EN cachepost (lib/products.ts fetchVarumarken),
//    och svepet nedan kastar hellre än returnerar en delvis karta, så att cachen
//    behåller den förra hela kartan i stället för att spara en halv;
//  - 429 och 5xx väntas ut, högst tre gånger per sida.
//
// LÖVMODUL med flit (inga importer), så att node --test laddar den direkt.

export const VARUMARKEN_SIDSTORLEK = 100;
/** Rundgångsspärr, inte ett katalogtak: 60 × 100 = 6 000 produkter med märke. */
export const VARUMARKEN_MAX_SIDOR = 60;
/** Nya försök per sida efter 429 eller 5xx. */
export const VARUMARKEN_FORSOK = 3;
/** Längsta väntan på ett Retry-After, så att ett flöde aldrig står still länge. */
export const VARUMARKEN_MAX_VANTAN_MS = 10_000;

export type Svar = {
  ok: boolean;
  status: number;
  headers?: { get(namn: string): string | null };
  json(): Promise<unknown>;
};
export type Hamta = (search: Record<string, unknown>) => Promise<Svar>;

/** Varans märke ur en V3-produkt (fältet brand.name), eller undefined. */
export function markeUrV3(produkt: unknown): string | undefined {
  const namn = (produkt as { brand?: { name?: unknown } } | null | undefined)?.brand?.name;
  if (typeof namn !== "string") return undefined;
  const rent = namn.trim();
  return rent || undefined;
}

/** Väntan före nytt försök: Retry-After i sekunder när Wix anger det, annars 1, 2, 4 s. */
export function vantetid(svar: Pick<Svar, "headers">, forsok: number): number {
  const angivet = Number(svar.headers?.get("retry-after"));
  if (Number.isFinite(angivet) && angivet > 0) return Math.min(angivet * 1000, VARUMARKEN_MAX_VANTAN_MS);
  return Math.min(1000 * 2 ** forsok, VARUMARKEN_MAX_VANTAN_MS);
}

const vantaPaRiktigt = (ms: number) => new Promise<void>((klar) => setTimeout(klar, ms));

/**
 * Alla produkter med ett märke: [produkt-id, märke]. Kastar vid fel och vid
 * sidtaket, och returnerar aldrig en delvis karta. Filtret går bara med på
 * första sidan; markören bär frågan (CLAUDE.md, Wix-hämtningar).
 */
export async function svepaVarumarken(hamta: Hamta, vanta: (ms: number) => Promise<void> = vantaPaRiktigt): Promise<[string, string][]> {
  const ut = new Map<string, string>();
  let markor: string | undefined;
  for (let sida = 0; sida < VARUMARKEN_MAX_SIDOR; sida++) {
    const search: Record<string, unknown> = markor
      ? { cursorPaging: { limit: VARUMARKEN_SIDSTORLEK, cursor: markor } }
      : { filter: { "brand.id": { $exists: true } }, cursorPaging: { limit: VARUMARKEN_SIDSTORLEK } };
    let svar = await hamta(search);
    for (let forsok = 0; (svar.status === 429 || svar.status >= 500) && forsok < VARUMARKEN_FORSOK; forsok++) {
      await vanta(vantetid(svar, forsok));
      svar = await hamta(search);
    }
    if (!svar.ok) throw new Error(`HTTP ${svar.status} på sida ${sida + 1}`);
    const data = (await svar.json()) as {
      products?: unknown[];
      pagingMetadata?: { hasNext?: boolean; cursors?: { next?: string | null } };
    } | null;
    for (const p of data?.products ?? []) {
      const id = (p as { id?: unknown } | null)?.id;
      const namn = markeUrV3(p);
      if (typeof id === "string" && id && namn) ut.set(id, namn);
    }
    markor = data?.pagingMetadata?.cursors?.next || undefined;
    if (!markor || !data?.pagingMetadata?.hasNext) return [...ut];
  }
  // ☠️ Ett tak ska logga ett fel, aldrig kapa tyst (CLAUDE.md): kasta, så att
  // cachen behåller den förra hela kartan och felet syns i loggen.
  throw new Error(`sidtaket ${VARUMARKEN_MAX_SIDOR} sidor nåddes med markören kvar`);
}
