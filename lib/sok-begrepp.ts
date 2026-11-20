// lib/sok-begrepp.ts
//
// Kategorierna som sökningen känner, och vilka varje vara ligger i (2026-11-20).
//
// ☠️ "barnmöbler" GAV TVÅ VAROR (Leonards skärmbild samma dag). Butiken har 132
// barnmöbler, men ordet står inte i namnen: en barnmöbel heter "Barnbord".
// Sökningen läser därför också kategorierna (lib/search.ts, "Kategorierna som
// begrepp"). Den här modulen gör om butikens kategorier och varornas
// collectionIds till den form sökningen tar emot, på EN plats, så att
// sökindexet (app/api/search-index/route.ts) och söksidan (app/sok/page.tsx)
// får samma tillhörighet och därmed samma träffar.
//
// Formen är snål med flit: indexet skickas till varje besökare som söker.
//   kat   en rad per kategori: namnet och förälderns plats i listan (-1 = ingen)
//   k     varans kategorier som platser i `kat`
// Föräldrarna räknas in av sökningen, så en vara i Barnmöbler bär inte också
// Barn & Familj. Mätt på katalogen 2026-11-20: 1,3 platser per vara, och
// indexet växte från 478 till 496 kB över nätet (brotli).
//
// LÖVMODUL utan importer, så att `node --test` kan ladda den. Listan över varor
// som bara hör till sin underkategori skickas därför in av anroparen
// (BARA_I_UNDERKATEGORIN i lib/bara-i-underkategorin.ts).

/** Samma form som SokKat i lib/search.ts. */
export type SokKat = { n: string; f: number };

type Kategori = { id: string; name: string; parentId: string | null };

/** Urval som finns i katalogen men inte är kategorier (NAV_EXCLUDED i lib/category-groups.ts). */
const INGA_KATEGORIER = new Set(["Populära", "REA", "Sale", "All Products"]);

export type Sokkategorier = {
  kat: SokKat[];
  /** Kategorins id → plats i `kat`. */
  plats: Map<string, number>;
};

/** Kategorierna i sökningens form, i den ordning de kom. */
export function sokKategorier(kategorier: readonly Kategori[]): Sokkategorier {
  const med = kategorier.filter((c) => c.id && c.name && !INGA_KATEGORIER.has(c.name));
  const plats = new Map(med.map((c, i) => [c.id, i]));
  const kat = med.map((c) => ({ n: c.name, f: c.parentId ? (plats.get(c.parentId) ?? -1) : -1 }));
  return { kat, plats };
}

/** Ligger kategorin `c` under `f`? Högst åtta led, mot en trasig tabell. */
function under(kat: readonly SokKat[], c: number, f: number): boolean {
  for (let x = kat[c]?.f ?? -1, led = 0; x >= 0 && x < kat.length && led < 8; x = kat[x].f, led++) if (x === f) return true;
  return false;
}

/**
 * Varans kategorier som platser i `kat`, eller undefined när den inte ligger i
 * någon känd kategori. En kategori som är förälder till en annan av varans
 * kategorier tas inte med: sökningen räknar in föräldrarna själv.
 *
 * En vara i `baraUnder` (BARA_I_UNDERKATEGORIN) ska inte synas på avdelningens
 * sida, och inte heller när någon söker på avdelningens ord: dess platser är
 * negativa, -(plats + 1), och sökningen ärver då inte uppåt.
 */
export function varansKategorier(
  vara: { id?: string; collectionIds?: readonly string[] },
  k: Sokkategorier,
  baraUnder?: ReadonlySet<string>,
): number[] | undefined {
  const alla: number[] = [];
  for (const id of vara.collectionIds ?? []) {
    const p = k.plats.get(id);
    if (p !== undefined && !alla.includes(p)) alla.push(p);
  }
  if (alla.length === 0) return undefined;
  const egna = alla.filter((p) => !alla.some((annan) => annan !== p && under(k.kat, annan, p)));
  return vara.id && baraUnder?.has(vara.id) ? egna.map((p) => -(p + 1)) : egna;
}

/**
 * Sökindexets sista rad: kategoritabellen, så tätt den går. Raden har inget
 * namn och ingen slug, så en äldre sida som hämtar indexet går förbi den.
 */
export type KategoriRad = { kat: [string, number][] };

export function kategoriRad(kat: readonly SokKat[]): KategoriRad {
  return { kat: kat.map((c) => [c.n, c.f]) };
}

/** Kategoritabellen ur indexets sista rad, eller null när raden inte är en sådan. */
export function lasKategoriRad(rad: unknown): SokKat[] | null {
  const kat = (rad as { kat?: unknown } | null)?.kat;
  if (!Array.isArray(kat)) return null;
  const ut: SokKat[] = [];
  for (const c of kat) {
    if (!Array.isArray(c) || typeof c[0] !== "string" || typeof c[1] !== "number") return null;
    ut.push({ n: c[0], f: c[1] });
  }
  return ut;
}
