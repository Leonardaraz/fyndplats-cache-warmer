import { NextResponse } from "next/server";
import { fetchAndradeKortbilder } from "../../../../lib/products";
import { wixMediaKey } from "../../../../lib/wix-media-key";
import { extraKortbilder } from "../../../../lib/kort-galleri";

// GET /api/kort-galleri/andrade → { slug: ["nyckel", …], … }
//
// Extrabilderna för produkter som ÄNDRATS i Wix de senaste två dygnen, lästa
// direkt från Wix. Leonard 2026-10-07: bilder som lagts till på en befintlig
// produkt syntes på produktsidan men inte på kortet, där prickarna stod kvar på
// två. Delarna (/api/kort-galleri/<del>) byggs ur katalogen i instansens minne,
// som kan vara flera timmar gammal, och förnyas var sjätte timme. /nya täcker
// bara produkter som är NYARE än delen, inte ändrade.
//
// Kortet (components/card-gallery.tsx) hämtar det här svaret en gång per
// sidbesök, och för en produkt som finns här vinner det över delen. Ett anrop
// mot Wix per fem minuter (CDN), oavsett antal besökare.
export const dynamic = "force-dynamic";

const CACHE = "public, max-age=120, s-maxage=300, stale-while-revalidate=600";
const FONSTER_MS = 48 * 3600_000;

export async function GET() {
  const ut: Record<string, string[]> = {};
  try {
    const andrade = await fetchAndradeKortbilder(new Date(Date.now() - FONSTER_MS).toISOString());
    for (const [slug, p] of andrade) ut[slug] = extraKortbilder(p.img, p.gallery, wixMediaKey);
  } catch (e) {
    console.warn("[kort-galleri/andrade] Wix svarade inte:", (e as Error).message);
    // Kort cache: kortet faller tillbaka på delen, och nästa minut försöker igen.
    return NextResponse.json({}, { headers: { "Cache-Control": "public, s-maxage=60" } });
  }
  return NextResponse.json(ut, { headers: { "Cache-Control": CACHE } });
}
