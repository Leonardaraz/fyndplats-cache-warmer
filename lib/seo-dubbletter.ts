// lib/seo-dubbletter.ts
//
// Hittar publicerade produktsidor som delar <title> eller metabeskrivning.
// Rena funktioner, ingen IO, så de går att prova i node --test.
//
// ☠️ VARFÖR (2026-11-11). Semrush fann 63 produktsidor som delade titel med en
// annan sida (30 grupper) och fyra som delade metabeskrivning. Sökmotorerna
// läser två sidor med samma titel som dubbletter och visar högst en av dem.
// Rubrikerna på sidorna skilde sig: det var SEO-titeln som var för allmän, och
// syskonen hade polerats i olika rundor utan att någon jämförde dem.
//
// Motorn vägrar sedan dess en poleringsplan vars titel redan står på en annan
// publicerad sida (lib/polish/seo-unik.ts i motorn). Den här kontrollen är
// nätet under: en titel som ändras för hand i Wix, eller en sida som publiceras
// på en annan väg, syns i veckorapporten.
//
// NYCKELN är densamma som motorns `seoNyckel`: utan " | Fyndplats", gemener,
// och bara bokstäver och siffror. Två av dubbletterna skilde sig till slut bara
// på ett kommatecken. Ändras regeln här ska den ändras där, och proven i båda
// repona bär samma exempel.

/** En produktsida så som sökmotorn ser den: adress, titel och metabeskrivning. */
export type SeoSida = { slug: string; titel: string; besk: string };

/** Sidor som delar titel (eller beskrivning). `text` är den första sidans text. */
export type DubbelGrupp = { text: string; slugs: string[] };

const SUFFIX = /\s*\|\s*fyndplats\s*$/i;

/** Jämförelsenyckeln för en titel eller beskrivning. */
export function seoNyckel(text: string): string {
  return text
    .normalize("NFKC")
    .replace(SUFFIX, "")
    .toLocaleLowerCase("sv")
    .replace(/[^\p{L}\p{N}]+/gu, " ")
    .trim();
}

/**
 * Titeln och beskrivningen produktsidan visar (app/produkt/[slug]/page.tsx):
 * den kuraterade SEO-titeln när den finns, annars namnet med butikens suffix.
 * Beskrivningen räknas bara när den är kuraterad. Reserven byggs ur brödtexten
 * och jämförs inte här.
 */
export function seoSidaAv(p: { slug: string; name: string; seoTitle?: string; seoDescription?: string }): SeoSida {
  return { slug: p.slug, titel: p.seoTitle || `${p.name} | Fyndplats`, besk: p.seoDescription || "" };
}

function grupper(sidor: readonly SeoSida[], falt: "titel" | "besk"): DubbelGrupp[] {
  const perNyckel = new Map<string, DubbelGrupp>();
  for (const s of sidor) {
    const nyckel = seoNyckel(s[falt]);
    if (!nyckel) continue;
    const g = perNyckel.get(nyckel);
    if (g) g.slugs.push(s.slug);
    else perNyckel.set(nyckel, { text: s[falt], slugs: [s.slug] });
  }
  return [...perNyckel.values()]
    .filter((g) => g.slugs.length > 1)
    .map((g) => ({ text: g.text, slugs: [...g.slugs].sort() }))
    .sort((a, b) => b.slugs.length - a.slugs.length || a.text.localeCompare(b.text, "sv"));
}

/** Grupper av sidor med samma titel, störst först. */
export function dubblaTitlar(sidor: readonly SeoSida[]): DubbelGrupp[] {
  return grupper(sidor, "titel");
}

/** Grupper av sidor med samma metabeskrivning, störst först. Sidor utan beskrivning räknas inte. */
export function dubblaBeskrivningar(sidor: readonly SeoSida[]): DubbelGrupp[] {
  return grupper(sidor, "besk");
}

/** Antalet sidor i grupperna, för rapportens rad. */
export function sidorIGrupper(grupper: readonly DubbelGrupp[]): number {
  return grupper.reduce((n, g) => n + g.slugs.length, 0);
}
