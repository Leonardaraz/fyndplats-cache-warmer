// Nya kategorier blir synliga av sig själva när de har minst tio publicerade
// produkter (Leonard 2026-10-31: "när nya kategori har minst 10 produkter syns
// dom automatiskt på sidan och för google med").
//
// Cronen /api/cron/kategorier-synlighet går varje timme. Den läser trädet med
// de dolda kategorierna, räknar de synliga produkterna i varje dold kategori
// som reglerna i lib/vevor/kategorier.ts lägger varor i, och gör en kategori
// synlig när talet når MIN_SYNLIGA_PRODUKTER. Butiken visar sedan kategorin i
// menyn, på sin sida och i sitemapen (bara kategorier med köpbara produkter,
// headless-site lib/products.ts), och motorn ber butiken bygga om sitemapen,
// startsidan och /butik direkt.
//
// Åtta egenskaper som inte ska tas bort:
//
// 1. ☠️ Bara nya kategorier: dolda, ett mål för reglerna och skapade från och
//    med NYA_FRAN. En äldre dold kategori (Elektronik & Tillbehör, Mode &
//    Accessoarer) rörs aldrig, och inte heller en som står i HALLS_DOLDA.
// 2. ☠️ Jobbet döljer aldrig något. En kategori som tappar produkter efter att
//    den visats ligger kvar synlig; butiken döljer själv en kategori utan
//    köpbara produkter.
// 3. ☠️ Avdelningen före underkategorin. Wix vägrar visa en underkategori under
//    en dold avdelning (428, uppmätt 2026-10-31), och att visa avdelningen visar
//    inte dess underkategorier. En underkategori under en dold avdelning väntar
//    (`vantarPaAvdelning`).
// 4. Räkningen är Wix egen (Count Products, `allCategoriesInfo` och `visible`):
//    en avdelning räknar med produkterna i sina underkategorier. Utkast räknas
//    inte.
// 5. ☠️ Ett trädfel (ett regelmål saknas eller står fel) stoppar körningen:
//    då vet vi inte vilka kategorier som är reglernas.
// 6. ☠️ En visning räknas först när trädet läses om och kategorin är synlig.
// 7. Butiken får besked best-effort. Ett fel där fäller aldrig körningen, för
//    sitemapen byggs om av sig själv inom en timme.
// 8. Svaret bär bara kategorinamn, id och antal.

import type { Anrop, KategoriNod } from "@/lib/wix/kategoritrad";
import { KATEGORITRAD, lasKategoritradet } from "@/lib/wix/kategoritrad";
import { byggUppslag } from "./kategorier";

/** Så många synliga produkter krävs (Leonard 2026-10-31). */
export const MIN_SYNLIGA_PRODUKTER = 10;
/**
 * Kategorier skapade före den här tiden rörs aldrig. VEVOR-trädet skapades
 * 2026-10-31 09:04 UTC; de äldre dolda kategorierna är dolda med flit.
 */
export const NYA_FRAN = "2026-10-31T00:00:00.000Z";
/** Nya kategorier som ska förbli dolda, med namn. Lägg till ett namn här. */
export const HALLS_DOLDA: readonly string[] = [];

export interface Visad {
  id: string;
  namn: string;
  avdelning: string | null;
  produkter: number;
}

export interface Butiksbesked {
  /** Sökväg → butikens statuskod, eller "ingen_nyckel" / "misslyckades". */
  sokvagar: Record<string, number | "ingen_nyckel" | "misslyckades">;
}

export interface SynlighetDeps {
  wix: Anrop;
  /** Synliga produkter i kategorin, med underkategoriernas. */
  raknaSynliga?: (kategoriId: string) => Promise<number>;
  meddelaButiken?: () => Promise<Butiksbesked>;
}

export interface SynlighetSvar {
  dryRun: boolean;
  /** Dolda nya kategorier som reglerna lägger varor i. */
  kandidater: number;
  /** Visade i körningen (torrt: skulle visas). */
  visade: Visad[];
  /** Under gränsen: namn och antal synliga produkter. */
  underGransen: { namn: string; produkter: number }[];
  /** Över gränsen men avdelningen är dold och visades inte. */
  vantarPaAvdelning: string[];
  /** Fel per kategori, utan id i texten. */
  fel: string[];
  tradFel: string[];
  butiken: Butiksbesked | null;
}

type Obj = Record<string, unknown>;

function data(svar: unknown): Obj {
  const s = (svar ?? {}) as Obj;
  return ((s.data as Obj | undefined) ?? s) as Obj;
}

/** Wix egen räkning: synliga produkter i kategorin och dess underkategorier. */
export function raknaSynligaMed(wix: Anrop): (kategoriId: string) => Promise<number> {
  return async (kategoriId) => {
    const d = data(
      await wix("POST", "/stores/v3/products/count", {
        filter: {
          $and: [
            { "allCategoriesInfo.categories": { $matchItems: [{ id: { $eq: kategoriId } }] } },
            { visible: { $eq: true } },
          ],
        },
      }),
    );
    const n = d.count;
    if (typeof n !== "number" || !Number.isFinite(n)) throw new Error("räkningen svarade utan antal");
    return n;
  };
}

function felUtanId(text: string): string {
  return text.replace(/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/gi, "<id>").slice(0, 160);
}

/** Dolda nya kategorier som reglerna lägger varor i, avdelningarna först. */
export function kandidaterFor(trad: readonly KategoriNod[], malIds: ReadonlySet<string>): KategoriNod[] {
  const fran = Date.parse(NYA_FRAN);
  return trad
    .filter(
      (k) =>
        !k.synlig &&
        malIds.has(k.id) &&
        typeof k.skapad === "string" &&
        Date.parse(k.skapad) >= fran &&
        !HALLS_DOLDA.includes(k.namn),
    )
    .sort((a, b) => Number(a.foralder !== null) - Number(b.foralder !== null) || a.namn.localeCompare(b.namn, "sv"));
}

export async function korKategorisynlighet(deps: SynlighetDeps, val: { dryRun: boolean }): Promise<SynlighetSvar> {
  const rakna = deps.raknaSynliga ?? raknaSynligaMed(deps.wix);
  const svar: SynlighetSvar = {
    dryRun: val.dryRun,
    kandidater: 0,
    visade: [],
    underGransen: [],
    vantarPaAvdelning: [],
    fel: [],
    tradFel: [],
    butiken: null,
  };
  const trad = await lasKategoritradet(deps.wix);
  const uppslag = byggUppslag(trad);
  svar.tradFel = uppslag.fel;
  if (uppslag.fel.length > 0) return svar;

  const malIds = new Set<string>();
  for (const m of uppslag.idn.values()) {
    malIds.add(m.avdelning);
    malIds.add(m.kategori);
  }
  const kandidater = kandidaterFor(trad, malIds);
  svar.kandidater = kandidater.length;
  const synliga = new Set(trad.filter((k) => k.synlig).map((k) => k.id));
  const namn = new Map(trad.map((k) => [k.id, k.namn]));

  const attVisa: Visad[] = [];
  for (const k of kandidater) {
    let produkter: number;
    try {
      produkter = await rakna(k.id);
    } catch (e) {
      svar.fel.push(`${k.namn}: räkningen föll (${felUtanId(String((e as Error)?.message ?? e))})`);
      continue;
    }
    if (produkter < MIN_SYNLIGA_PRODUKTER) {
      svar.underGransen.push({ namn: k.namn, produkter });
      continue;
    }
    // ☠️ Avdelningen först (egenskap 3). Kandidaterna är sorterade så att en
    // avdelning som visas i körningen redan står i `synliga`.
    if (k.foralder !== null && !synliga.has(k.foralder)) {
      svar.vantarPaAvdelning.push(k.namn);
      continue;
    }
    const v: Visad = { id: k.id, namn: k.namn, avdelning: k.foralder ? namn.get(k.foralder) ?? null : null, produkter };
    if (val.dryRun) {
      synliga.add(k.id);
      attVisa.push(v);
      continue;
    }
    try {
      await deps.wix("PATCH", "/categories/v1/categories/visibility", {
        categoryId: k.id,
        visible: true,
        revision: k.revision,
        treeReference: KATEGORITRAD,
      });
      synliga.add(k.id);
      attVisa.push(v);
    } catch (e) {
      svar.fel.push(`${k.namn}: Wix tog inte emot synligheten (${felUtanId(String((e as Error)?.message ?? e))})`);
    }
  }

  if (val.dryRun || attVisa.length === 0) {
    svar.visade = attVisa;
    return svar;
  }
  // ☠️ En visning räknas först när trädet läses om (egenskap 6).
  const efter = new Map((await lasKategoritradet(deps.wix)).map((k) => [k.id, k]));
  for (const v of attVisa) {
    if (efter.get(v.id)?.synlig === true) svar.visade.push(v);
    else svar.fel.push(`${v.namn}: kategorin är fortfarande dold efter skrivningen`);
  }
  if (svar.visade.length > 0 && deps.meddelaButiken) {
    try {
      svar.butiken = await deps.meddelaButiken();
    } catch {
      svar.butiken = { sokvagar: {} };
    }
  }
  return svar;
}
