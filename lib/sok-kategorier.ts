// lib/sok-kategorier.ts
//
// Kategorierna som sökningen kan föreslå (2026-11-19). "utemöbler" gav åtta
// varor, två av de tre första skyddsöverdrag, fast kategorin har hundratals.
// Sökrutan och söksidan visar därför också de kategorier vars namn matchar
// (matchaKategorier i lib/search.ts).
//
// VARIFRÅN LISTAN KOMMER. Menyerna (components/meganav.tsx och mobilenav.tsx)
// får redan hela kategoriträdet som egenskap, så det ligger i sidans
// nyttolast. De registrerar det här när de ritas, och sökrutan läser det
// härifrån. Ingen ny hämtning och inga nya byte i sidan.
//
// LÖVMODUL med flit, så att `node --test` kan ladda den och så att den går att
// ta in i en klientkomponent. Själva matchningen görs av anroparen:
// matchaKategorier(sökning, registreradeKategorier()).

export type SokKategori = { name: string; slug: string };

type Nod = { name: string; slug: string; subs?: readonly { name: string; slug: string }[] };

/**
 * Trädet som en lista: huvudkategorierna först, sedan underkategorierna i
 * trädets ordning. Vid lika poäng går den som står först, alltså avdelningen
 * före dess delar. En slug står bara en gång.
 */
export function plattaKategorier(tree: readonly Nod[]): SokKategori[] {
  const ut: SokKategori[] = [];
  const sedda = new Set<string>();
  const ta = (k: { name: string; slug: string }) => {
    if (!k.slug || !k.name || sedda.has(k.slug)) return;
    sedda.add(k.slug);
    ut.push({ name: k.name, slug: k.slug });
  };
  for (const m of tree) ta(m);
  for (const m of tree) for (const s of m.subs ?? []) ta(s);
  return ut;
}

let senasteTrad: readonly Nod[] | null = null;
let registrerade: SokKategori[] = [];

/** Menyerna anropar den när de ritas. Samma träd räknas bara en gång. */
export function registreraKategorier(tree: readonly Nod[]): void {
  if (tree === senasteTrad) return;
  senasteTrad = tree;
  registrerade = plattaKategorier(tree);
}

/** Det registrerade trädet som lista. Tomt tills en meny har ritats. */
export function registreradeKategorier(): readonly SokKategori[] {
  return registrerade;
}

/** Kategorinamnet utan de mjuka bindestreck som står där för radbrytningen. */
export const rentNamn = (namn: string): string => namn.replace(/\u00ad/g, "");
