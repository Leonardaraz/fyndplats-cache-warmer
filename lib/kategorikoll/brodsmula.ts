// lib/kategorikoll/brodsmula.ts
//
// KATEGORIKOLLEN: butikens brödsmula före och efter regeln "avdelningen
// produkten är kopplad till går först", räknad över hela katalogen. Ren logik.
//
// VARFÖR DEN BOR I MOTORN. Butikens produktsidor visar inte vilka kategorier
// en produkt är DIREKT kopplad till, och det finns inga Wix-nycklar utanför
// Vercel. Motorn läser katalogen och trädet en gång (app/api/admin/kategorikoll)
// och räknar med samma regel som butiken.
//
// ☠️ DET HÄR ÄR EN KOPIA AV BUTIKENS REGEL, och den används BARA till mätningen.
// Originalet är `valjBrodsmula` i headless-site lib/breadcrumb-category.ts.
// Testfallen i brodsmula.test.ts är butikens, ordagrant, så att en skillnad syns.
// Butiken räknar på V1:s collectionIds, motorn på V3:s directCategoriesInfo;
// båda är produktens direkta kategorier.
//
// Regeln (butiken, 2026-09-24): den SMALASTE indexerbara underkategorin (minst
// 5 produkter i lager på kategorisidan) vars förälder är en avdelning;
// avdelningen blir underkategorins förälder. Lika många → bokstavsordning på
// sluggen. Ingen underkategori → första avdelningen, annars första kategorin.
//
// Efter (planen A2, 2026-11-04): samma regel, men först bland underkategorierna
// i produktens EGNA avdelningar. Finns ingen där gäller regeln ovan.
//
// Efter, rättad (Leonard 2026-11-05): kollens första mätning visade att 150 av
// 204 byten gick från typkategorin (Skoskåp & skobänkar, Bokhyllor, Byråer …)
// till Hem & Inredning > Förvaring & Organisering. Nu går först den egna,
// indexerbara underkategori som ett ord i namnets huvudfras pekar ut, sedan
// egen avdelning, sedan den smalaste av alla. Ordformerna är butikens (led för
// led, "&" och bindestreck delar), inte polerspärrens (lib/polish/typkategori.ts),
// som med flit hoppar över namn med flera ord.

const GEMENER = (s: string) => s.toLocaleLowerCase("sv-SE");

/** Det som avslutar huvudfrasen: en preposition, ett tankstreck, komma, parentes eller kolon. */
const SLUT_PA_HUVUDFRAS = /\s(?:med|för|i|på|till|och|av|utan|från)\s|\s[–—-]\s|[,(:]/i;

/** Orden i produktnamnets huvudfras, gemener. "TV-bänk i ek" → tv, bänk. (Butikens huvudord.) */
export function huvudord(namn: string): Set<string> {
  const s = ` ${namn.trim()} `;
  const m = SLUT_PA_HUVUDFRAS.exec(s);
  const fras = GEMENER((m ? s.slice(0, m.index) : s).trim());
  return new Set(fras.split(/[^a-zåäöéü]+/).filter(Boolean));
}

const typordCache = new Map<string, string[]>();

/**
 * Ordformerna ett kategorinamn kan ha i ett produktnamn: varje led (delat på
 * "&", mellanslag och bindestreck) som det står och i troliga singularer. Led
 * kortare än tre bokstäver ("tv") räknas inte. (Butikens typord.)
 */
export function typord(kategorinamn: string): string[] {
  const sparad = typordCache.get(kategorinamn);
  if (sparad) return sparad;
  const ut = new Set<string>();
  for (const led of GEMENER(kategorinamn).split(/[^a-zåäöéü]+/)) {
    if (led.length < 3) continue;
    ut.add(led);
    if (led.length > 4 && led.endsWith("or")) ut.add(`${led.slice(0, -2)}a`); // soptunnor → soptunna
    if (led.length > 4 && led.endsWith("ar")) {
      ut.add(led.slice(0, -2)); // julgranar → julgran
      ut.add(`${led.slice(0, -2)}e`); // kuddar → kudde
    }
    if (led.length > 4 && led.endsWith("er")) ut.add(led.slice(0, -2)); // byråer → byrå
    if (led.length > 5 && led.endsWith("s") && !led.endsWith("ss")) ut.add(led.slice(0, -1)); // sideboards → sideboard
  }
  const lista = [...ut];
  typordCache.set(kategorinamn, lista);
  return lista;
}

/** Butikens promo-kollektioner (headless-site lib/category-groups.ts NAV_EXCLUDED). */
export const PROMO = new Set(["Populära", "REA", "Sale", "All Products"]);

export interface Kat {
  id: string;
  namn: string;
  foralder: string | null;
}

export interface Brodsmula {
  avdelning?: string;
  underkategori?: string;
}

/** Butikens slugg för en kategori (headless-site lib/category-slug.ts asciiSlug). */
export function asciiSlug(s: string): string {
  return (s || "")
    .toLowerCase()
    .replace(/[åä]/g, "a")
    .replace(/ö/g, "o")
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/** Butikens tröskel: en kategorisida med färre än 5 produkter är noindex. */
export function indexerbar(antal: number): boolean {
  return antal >= 5;
}

/**
 * Produkter per kategorisida: kategorin och dess direkta underkategorier,
 * varje produkt en gång (headless-site lib/category-threshold.ts countPerCategoryPage).
 * Ge den produkterna i lager, som butikens listningar.
 */
export function raknaPerSida(produkter: ReadonlyArray<{ kat: readonly string[] }>, alla: readonly Kat[]): Map<string, number> {
  const foralder = new Map<string, string>();
  for (const c of alla) if (c.foralder) foralder.set(c.id, c.foralder);
  const antal = new Map<string, number>();
  for (const p of produkter) {
    const sidor = new Set<string>();
    for (const cid of p.kat) {
      sidor.add(cid);
      const f = foralder.get(cid);
      if (f) sidor.add(f);
    }
    for (const id of sidor) antal.set(id, (antal.get(id) || 0) + 1);
  }
  return antal;
}

/**
 * Brödsmulan för en produkt. `egna` är produktens kategorier och `alla` hela
 * trädet, båda UTAN promo-kollektionerna (som butikens ownCats och navCols).
 */
export function brodsmula(
  egna: readonly Kat[],
  alla: readonly Kat[],
  antal: ReadonlyMap<string, number>,
  regel: "fore" | "efter",
  produktnamn?: string,
): Brodsmula {
  const avdelningar = new Map(alla.filter((c) => c.foralder === null).map((c) => [c.id, c]));
  const smalaste = (tillats: (c: Kat) => boolean): Kat | undefined => {
    let bast: Kat | undefined;
    for (const c of egna) {
      if (!c.foralder || !avdelningar.has(c.foralder) || !tillats(c)) continue;
      const n = antal.get(c.id) || 0;
      if (!indexerbar(n)) continue;
      if (!bast) {
        bast = c;
        continue;
      }
      const m = antal.get(bast.id) || 0;
      if (n < m || (n === m && asciiSlug(c.namn) < asciiSlug(bast.namn))) bast = c;
    }
    return bast;
  };
  let under: Kat | undefined;
  if (regel === "efter") {
    const ord = produktnamn ? huvudord(produktnamn) : new Set<string>();
    if (ord.size > 0) under = smalaste((c) => typord(c.namn).some((f) => ord.has(f)));
    const egnaAvdelningar = new Set(egna.filter((c) => c.foralder === null).map((c) => c.id));
    under ??= smalaste((c) => egnaAvdelningar.has(c.foralder as string));
  }
  under ??= smalaste(() => true);
  if (under) return { avdelning: avdelningar.get(under.foralder as string)?.namn, underkategori: under.namn };
  const forsta = egna.find((c) => c.foralder === null) || egna[0];
  return forsta ? { avdelning: forsta.namn } : {};
}

/** "Avdelning > Underkategori", eller bara avdelningen. */
export function somText(b: Brodsmula): string {
  return [b.avdelning ?? "–", ...(b.underkategori ? [b.underkategori] : [])].join(" > ");
}
