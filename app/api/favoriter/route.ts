// GET /api/favoriter?s=<slug>,<slug>,…
//
// Det favoriternas låda och Mina sidor visar om varje vara: namn, liten bild,
// pris, lager och om varan har val. Bara uppgifter som redan står på
// produktkorten, så svaret får ligga en kort stund i CDN:et per lista
// (adressen är sorterad, favoritFraga i lib/favoriter.ts).
//
// Uppslaget är ETT anrop till Wix för hela listan (högst 100 adresser),
// aldrig hela katalogen: rutten anropas sällan och möter ofta en kall instans.

import { NextResponse } from "next/server";
import { lasSluggar } from "../../../lib/favoriter";
import { hamtaFavoritprodukter } from "../../../lib/favoriter-produkter";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Priset och lagret får vara ett par minuter gamla, som på en produktsida.
const CACHE_OK = "public, max-age=30, s-maxage=120, stale-while-revalidate=300";

export async function GET(request: Request) {
  const sluggar = lasSluggar(new URL(request.url).searchParams.get("s"));
  if (!sluggar) {
    return NextResponse.json({ ok: false, error: "ogiltig" }, { status: 400, headers: { "Cache-Control": "public, max-age=60, s-maxage=600" } });
  }
  try {
    const svar = await hamtaFavoritprodukter(sluggar);
    return NextResponse.json({ ok: true, ...svar }, { headers: { "Cache-Control": CACHE_OK } });
  } catch (e) {
    console.error("[favoriter] uppslaget i Wix felade:", (e as Error).message.slice(0, 160));
    return NextResponse.json({ ok: false, error: "fel" }, { status: 502, headers: { "Cache-Control": "no-store" } });
  }
}
