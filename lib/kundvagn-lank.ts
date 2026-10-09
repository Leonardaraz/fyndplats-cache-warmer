// Adressen till produktsidan för en rad i varukorgen.
//
// Wix Cart v2 bär `url.relativePath` på varje rad, i Wix egen form
// (`/product-page/<slug>`). Butikens produktsidor ligger på `/produkt/<slug>`,
// så slugen flyttas dit i stället för att gå via omdirigeringen.
//
// En rad utan känd form får ingen länk (null). Hellre ett namn som inte går
// att klicka på än en länk till fel sida.

const WIX_PRODUKT = /^\/product-page\/([^/?#]+)\/?$/;

export function produktLankForRad(li: { url?: { relativePath?: string | null } | null } | null | undefined): string | null {
  const vag = li?.url?.relativePath;
  if (typeof vag !== "string") return null;
  const m = WIX_PRODUKT.exec(vag.trim());
  return m ? `/produkt/${m[1]}` : null;
}
