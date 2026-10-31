// Butikens kategoriträd i Wix, med de dolda kategorierna, och kopplingen av
// produkter till en kategori. En definition för poleringens kategoristeg
// (lib/polish/skrivplan.ts) och VEVOR:s kategorier (lib/vevor/kategorier-kor.ts).
//
// Tre egenskaper som inte ska tas bort:
//
// 1. ☠️ `returnNonVisibleCategories: true`. Query Categories utelämnar dolda
//    kategorier som standard (Wix dokumentation, mätt 2026-10-31: 134 synliga,
//    203 med de dolda). De 51 nya underkategorierna för VEVOR skapades dolda och
//    visas först när de har publicerade produkter, och poleringen måste kunna
//    koppla produkter till dem innan dess. Butikens egen fråga ska däremot inte
//    se dem, och den rörs inte här.
// 2. ☠️ Hela trädet läses med markör, och ett träd som inte tar slut kastar.
//    Poleringens fråga läste förut en sida om 200 utan markör, och en kategori
//    efter plats 200 hade sett ut att inte finnas.
// 3. ☠️ Bulk-svaret är facit per produkt (`results[].itemMetadata`). En produkt
//    Wix inte nämner är inte kopplad, och `undetailedFailures` gör hela anropet
//    oadresserbart. ALREADY_EXISTS betyder att produkten redan är kopplad.

/** Wix Stores app-id, som item-referens när produkter läggs i en kategori. */
export const WIX_STORES_APP_ID = "215238eb-22a5-4c36-9e7b-e7c08025e04e";
export const KATEGORITRAD = { appNamespace: "@wix/stores" } as const;

/** Wix svarar högst 100 per sida (cursorPaging). */
const SIDA = 100;
const MAX_SIDOR = 20;
/** Bulk add-items: produkter per anrop. */
export const KOPPLA_PER_ANROP = 100;

type Obj = Record<string, unknown>;
export type Anrop = (metod: "GET" | "PATCH" | "POST", sokvag: string, kropp?: unknown) => Promise<unknown>;

export interface KategoriNod {
  id: string;
  namn: string;
  /** Förälderns id, null för en avdelning. */
  foralder: string | null;
  synlig: boolean;
}

function data(svar: unknown): Obj {
  const s = (svar ?? {}) as Obj;
  return ((s.data as Obj | undefined) ?? s) as Obj;
}

/** Hela trädet, med de dolda kategorierna. */
export async function lasKategoritradet(wix: Anrop): Promise<KategoriNod[]> {
  const ut: KategoriNod[] = [];
  let markor: string | undefined;
  for (let sida = 0; sida < MAX_SIDOR; sida++) {
    const d = data(
      await wix("POST", "/categories/v1/categories/query", {
        query: { cursorPaging: markor ? { limit: SIDA, cursor: markor } : { limit: SIDA } },
        treeReference: KATEGORITRAD,
        returnNonVisibleCategories: true,
      }),
    );
    for (const c of (d.categories ?? []) as Obj[]) {
      if (typeof c.id !== "string" || typeof c.name !== "string") continue;
      const f = (c.parentCategory as Obj | undefined)?.id;
      ut.push({ id: c.id, namn: c.name, foralder: typeof f === "string" && f ? f : null, synlig: c.visible !== false });
    }
    const p = (d.pagingMetadata ?? {}) as Obj;
    const nasta = ((p.cursors ?? {}) as Obj).next;
    if (typeof nasta !== "string" || !nasta) return ut;
    markor = nasta;
  }
  throw new Error(`kategoriträdet tog inte slut efter ${MAX_SIDOR} sidor`);
}

/**
 * Namn → id. Ett namn som finns två gånger i trädet ger `null`: det går inte
 * att veta vilken kategori som menas, och då kopplas ingenting till den.
 */
export function idPerNamn(trad: readonly KategoriNod[]): Map<string, string | null> {
  const ut = new Map<string, string | null>();
  for (const k of trad) ut.set(k.namn, ut.has(k.namn) ? null : k.id);
  return ut;
}

export type Kopplingsutfall = "ok" | "redan" | { fel: string };

/**
 * Lägger produkterna i kategorin, högst 100 per anrop. Svarar per produkt-id.
 * En produkt utan rad i svaret räknas som ett fel.
 */
export async function kopplaTillKategori(
  wix: Anrop,
  kategoriId: string,
  produktIds: readonly string[],
): Promise<Map<string, Kopplingsutfall>> {
  const ut = new Map<string, Kopplingsutfall>();
  for (let i = 0; i < produktIds.length; i += KOPPLA_PER_ANROP) {
    const tugga = produktIds.slice(i, i + KOPPLA_PER_ANROP);
    let d: Obj;
    try {
      d = data(
        await wix("POST", `/categories/v1/bulk/categories/${encodeURIComponent(kategoriId)}/add-items`, {
          items: tugga.map((pid) => ({ catalogItemId: pid, appId: WIX_STORES_APP_ID })),
          treeReference: KATEGORITRAD,
        }),
      );
    } catch (e) {
      const fel = String((e as Error)?.message ?? e).slice(0, 200);
      for (const pid of tugga) ut.set(pid, { fel });
      continue;
    }
    const meta = (d.bulkActionMetadata ?? {}) as Obj;
    if (Number(meta.undetailedFailures ?? 0) > 0) {
      for (const pid of tugga) ut.set(pid, { fel: "undetailedFailures: anropet går inte att tolka per produkt" });
      continue;
    }
    const rader = (d.results ?? []) as Obj[];
    tugga.forEach((pid, idx) => {
      const traff =
        rader.find((r) => ((r.itemMetadata as Obj | undefined)?.item as Obj | undefined)?.catalogItemId === pid) ??
        rader.find((r) => ((r.itemMetadata as Obj | undefined)?.originalIndex as number | undefined) === idx);
      const m = (traff?.itemMetadata ?? null) as Obj | null;
      if (!m) {
        ut.set(pid, { fel: "inget utfall för produkten" });
        return;
      }
      if (m.success === true) {
        ut.set(pid, "ok");
        return;
      }
      const felJson = m.error ? JSON.stringify(m.error) : "";
      ut.set(pid, felJson.includes("ALREADY_EXISTS") ? "redan" : { fel: felJson.slice(0, 200) || "misslyckades" });
    });
  }
  return ut;
}

/** Sidor i listan över en kategoris produkter: 500 × 100 = Wix tak på 50 000 produkter. */
const MAX_PRODUKTSIDOR = 500;

/** Produkt-id:na i en kategori (bara den, inte underkategorierna). */
export async function produkterIKategori(wix: Anrop, kategoriId: string): Promise<Set<string>> {
  const ut = new Set<string>();
  let markor: string | undefined;
  for (let sida = 0; sida < MAX_PRODUKTSIDOR; sida++) {
    const d = data(
      await wix("POST", `/categories/v1/categories/${encodeURIComponent(kategoriId)}/list-items`, {
        cursorPaging: markor ? { limit: SIDA, cursor: markor } : { limit: SIDA },
        treeReference: KATEGORITRAD,
      }),
    );
    for (const it of (d.items ?? []) as Obj[]) if (typeof it.catalogItemId === "string") ut.add(it.catalogItemId);
    const nasta = (((d.pagingMetadata ?? {}) as Obj).cursors as Obj | undefined)?.next;
    if (typeof nasta !== "string" || !nasta) return ut;
    markor = nasta;
  }
  throw new Error(`kategorins produktlista tog inte slut efter ${MAX_PRODUKTSIDOR} sidor`);
}
