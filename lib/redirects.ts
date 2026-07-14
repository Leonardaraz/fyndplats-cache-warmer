// 301-omdirigeringar för borttagna produkter (SEO).
//
// När en produkt tas bort permanent (t.ex. AliExpress-listningen är död och
// dropship-kanalen svarar 604) ska den gamla produkt-URL:en INTE bli en 404 —
// då tappas ev. länkvärde och alla gamla länkar (Google-träffar, annonser,
// delningar) landar i väggen. I stället slår produktsidan upp den här tabellen
// och svarar med en permanent redirect (308) till närmaste levande produkt
// eller kategorisida.
//
// Tabellen bor i Wix CMS-collectionen `FyndplatsRedirects` (en rad per slug:
// { _id: fromSlug, fromSlug, toPath, reason }) så nya omdirigeringar kan
// läggas till utan koddeploy — det här kommer hända igen nästa gång en
// säljare försvinner. Uppslaget görs BARA när produkten inte hittas (kall
// 404-väg, låg volym) och cachas i 5 min per slug via Next:s fetch-cache.
//
// Medvetet fail-open: kan tabellen inte läsas (nätfel, saknad nyckel) blir
// det en vanlig 404 — precis som innan funktionen fanns. En trasig redirect-
// tabell får aldrig fälla produktsidor som lever.

const WIX_API_KEY = process.env.WIX_API_KEY;
const WIX_SITE_ID = process.env.WIX_SITE_ID || "e6d27e90-4749-4720-9afe-0bbe91c1b3d3";

const REDIRECTS_COLLECTION = "FyndplatsRedirects";

/**
 * Validerar ett toPath-värde ur CMS:et. Endast interna, absoluta sökvägar
 * släpps igenom ("/produkt/x", "/kategori/y") — allt annat (externa URL:er,
 * protokoll-relativa "//evil.com", tomt, fel typ) ger null så att en felskriven
 * eller manipulerad rad aldrig kan skicka besökare ut från sajten.
 */
export function sanitizeRedirectTarget(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const v = value.trim();
  if (!v.startsWith("/") || v.startsWith("//")) return null;
  // Ingen CRLF/whitespace-smuggling in i Location-headern.
  if (/[\s\r\n]/.test(v)) return null;
  return v;
}

/**
 * Slår upp en permanent redirect för en produkt-slug som inte längre finns.
 * Returnerar intern sökväg ("/produkt/annan-produkt") eller null (→ 404).
 */
export async function getProductRedirect(slug: string): Promise<string | null> {
  if (!WIX_API_KEY || !slug) return null;
  try {
    const res = await fetch("https://www.wixapis.com/wix-data/v2/items/query", {
      method: "POST",
      headers: {
        Authorization: WIX_API_KEY,
        "wix-site-id": WIX_SITE_ID,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        dataCollectionId: REDIRECTS_COLLECTION,
        query: { filter: { fromSlug: slug }, paging: { limit: 1 } },
      }),
      next: { revalidate: 300 },
    });
    if (!res.ok) return null;
    const body = (await res.json()) as {
      dataItems?: { data?: { toPath?: unknown } }[];
    };
    return sanitizeRedirectTarget(body.dataItems?.[0]?.data?.toPath);
  } catch {
    return null;
  }
}
