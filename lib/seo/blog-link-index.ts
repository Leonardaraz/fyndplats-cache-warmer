// lib/seo/blog-link-index.ts
//
// OMVÄNT LÄNKINDEX: bloggen → pengasidor, vänt till pengasidor → bloggen.
//
// Problemet det löser: `relatedPosts` i programmatic.ts GISSAR vilket inlägg som
// hör till en produkt genom att leta nyckelord i inläggets titel + excerpt. Det
// missar systematiskt de starkaste kopplingarna — vinterförvarings-guiden ägnar
// ett helt avsnitt åt dieselvärmaren och länkar till produktsidan, men ordet
// finns varken i rubriken eller i meta-beskrivningen, så produktsidan länkade
// aldrig tillbaka. Länkflödet blev enkelriktat: guiden gav sin auktoritet till
// produkten, produkten gav ingenting tillbaka, och Google såg aldrig ett kluster.
//
// Lösningen är exakt i stället för heuristisk: guiden har redan TALAT OM vilka
// sidor den handlar om — den länkar till dem. Vi läser bara den upplysningen
// baklänges. Noll felträffar per konstruktion, och det gäller alla inlägg utan
// att någon behöver underhålla en nyckelordslista.
//
// AVGRÄNSNINGAR (medvetna):
//   • Bara LOKALA inlägg (content/blog/*.md). Wix-inläggens brödtext ingår inte i
//     list-svaret från queryPosts — att indexera dem hade krävt ett extra
//     API-anrop per inlägg vid varje sidrendering. Hela katalogen ligger som
//     markdown i dag, så täckningen är 100 % ändå; skulle Wix-inlägg tillkomma
//     faller de tillbaka på nyckelordsmatchningen precis som förut.
//   • Bara SYNLIGA länkar. Vi skannar den renderade HTML:en, inte råmarkdownen —
//     `renderMarkdown` stannar vid horisontella linjer, så utkastanteckningar och
//     JSON-LD-block efter "---" räknas aldrig som en länk. Ett indexerat samband
//     motsvarar alltid en länk läsaren faktiskt ser.
//
// Modulen är AVSIKTLIGT beroendefri (ingen react, ingen fs) — det är den enda
// formen `npm test` kan köra, eftersom node --test laddar TS-filerna direkt utan
// bundler. Inläsningen och per-request-cachen ligger därför i programmatic.ts.

/** Ett inlägg som länkar till en given sida, med antal länkar dit. */
export type LinkingPost = { title: string; slug: string; date: string; hits: number };

export type IndexablePost = { title: string; slug: string; date: string; contentHtml: string };

// Matchar href till /produkt/… och /kategori/… — både relativa (som allt
// innehåll skriver i dag) och absoluta mot egen domän. Slug-tecken bara
// [a-z0-9-]; frågesträng, fragment eller avslutande citattecken bryter matchen,
// så /produkt/x?variant=2 indexeras som /produkt/x.
const HREF_RE = /href="(?:https?:\/\/(?:www\.)?fyndplats\.se)?(\/(?:produkt|kategori)\/[a-z0-9][a-z0-9-]*)/gi;

/**
 * Alla interna pengasido-sökvägar ett inlägg länkar till, i den ordning de
 * förekommer, MED dubbletter kvar (antalet används som relevanssignal — ett
 * inlägg som länkar tre gånger handlar mer om produkten än ett som nämner den
 * i förbifarten).
 */
export function linkedPathsInHtml(html: string): string[] {
  const out: string[] = [];
  for (const m of (html || "").matchAll(HREF_RE)) out.push(m[1].toLowerCase());
  return out;
}

/**
 * Bygger indexet sökväg → inlägg som länkar dit. Ren funktion (ingen fs, ingen
 * cache) så den går att testa direkt.
 *
 * Sortering per sökväg: flest länkar först, därefter nyast. Ett inlägg med ett
 * eget avsnitt om produkten (rubrik + bild-embed + brödtextlänk) rankas alltså
 * före ett som råkar nämna den i en uppräkning — vilket är precis vad man vill
 * när bara två länkar får plats i "Läs mer på bloggen".
 */
export function buildBlogLinkIndex(posts: IndexablePost[]): Map<string, LinkingPost[]> {
  const index = new Map<string, LinkingPost[]>();
  for (const p of posts) {
    if (!p.slug) continue;
    const counts = new Map<string, number>();
    for (const path of linkedPathsInHtml(p.contentHtml)) {
      counts.set(path, (counts.get(path) || 0) + 1);
    }
    for (const [path, hits] of counts) {
      const list = index.get(path) || [];
      list.push({ title: p.title, slug: p.slug, date: p.date || "", hits });
      index.set(path, list);
    }
  }
  for (const list of index.values()) {
    list.sort((a, b) => b.hits - a.hits || (b.date || "").localeCompare(a.date || ""));
  }
  return index;
}
