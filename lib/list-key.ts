// lib/list-key.ts
//
// Vilken lista en listsida visar, och adressen där ShopBrowser hämtar resten
// av den (app/api/lista). Egen modul utan importer, så att både klienten och
// testerna når den.

/** "alla", "rea" eller "kategori/<slug>". */
export type ListNyckel = "alla" | "rea" | `kategori/${string}`;

export function listaUrl(nyckel: ListNyckel): string {
  return `/api/lista?k=${encodeURIComponent(nyckel)}`;
}

/**
 * Tolkar en nyckel från en URL. null för allt som inte är en giltig nyckel —
 * rutten svarar då 400 i stället för att slå upp något godtyckligt. Slugs är
 * ASCII (asciiSlug i lib/products.ts), så mönstret behöver inte mer.
 */
export function tolkaNyckel(k: string | null | undefined): ListNyckel | null {
  if (k === "alla" || k === "rea") return k;
  const m = /^kategori\/([a-z0-9-]{1,120})$/.exec(k ?? "");
  return m ? `kategori/${m[1]}` : null;
}
