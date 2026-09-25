import { NextResponse } from "next/server";
import { getProducts } from "../../../../lib/products";
import { wixMediaKey } from "../../../../lib/wix-media-key";
import { extraKortbilder, kortDel, lasDel, KORT_DELAR } from "../../../../lib/kort-galleri";

// GET /api/kort-galleri/<del> → { slug: ["nyckel", …], … }
//
// Produktkortens bilder utöver de två listan redan har, för de produkter som
// hör till delen (kortDel i lib/kort-galleri.ts). Kortet
// (components/card-gallery.tsx) ber om sina delar direkt när det visas på en
// pekskärm, så bilderna ligger på plats innan någon hinner svepa. Produkter
// utan extrabilder saknas i svaret; kortet läser det som en tom lista.
//
// FÖRBYGGT, INTE EN FRÅGA PER SIDA. Förra versionen tog ?s=a,b,c — varje urval
// en egen nyckel, alltså ett funktionsanrop, och en kall instans läser hela
// katalogen: 47,5 s uppmätt på preview 2026-09-25, och Leonards prickar kom
// först när han laddade om sidan. Alla delar byggs nu vid deployen och förnyas
// i bakgrunden, precis som /api/kort-bilder.
//
// Sex timmar, inte en: galleribilder ändras sällan, och 128 delar som förnyas
// varje timme vore 128 ISR-skrivningar i timmen för ingenting. En ny produkt
// som ännu inte finns i sin del visar under tiden sina två bilder.
export const revalidate = 21600;
export const dynamicParams = false;

// Explicit — `revalidate` ensam ger inget CDN-huvud för en route handler (se
// /api/kort-bilder).
const CACHE = "public, max-age=3600, s-maxage=21600, stale-while-revalidate=86400";

export function generateStaticParams() {
  return Array.from({ length: KORT_DELAR }, (_, i) => ({ del: String(i) }));
}

export async function GET(_req: Request, { params }: { params: Promise<{ del: string }> }) {
  const del = lasDel((await params).del);
  if (del === null) return NextResponse.json({}, { status: 404 });
  const ut: Record<string, string[]> = {};
  for (const p of await getProducts()) {
    if (kortDel(p.slug) !== del) continue;
    const k = extraKortbilder(p.img, p.gallery, wixMediaKey);
    if (k.length) ut[p.slug] = k;
  }
  return NextResponse.json(ut, { headers: { "Cache-Control": CACHE } });
}
