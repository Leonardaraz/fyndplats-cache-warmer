// GET /api/kontakt/produkt?p=<slug>
//
// Kontaktformulärets förval: produkten som kunden kom ifrån (länken i
// produktsidans flik "Kontakta oss"), eller som kunden valde i formulärets
// sökning, med bild, pris och val. Vilket val som är utpekat avgör formuläret
// (medValt i lib/kontakt/kontakt.ts), så svaret är detsamma för alla som
// frågar om samma produkt. Bara uppgifter som redan står på produktsidan, så
// svaret får ligga i CDN:et en timme per adress.
//
// Uppslaget går direkt till produkten i Wix, aldrig via hela katalogen
// (getKontaktProdukt i lib/products.ts): rutten anropas sällan och möter
// därför nästan alltid en kall instans.

import { NextResponse } from "next/server";
import { hamtaKontaktProdukt } from "../../../../lib/kontakt/produkt";
import { giltigSlug } from "../../../../lib/kontakt/kontakt";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const CACHE_OK = "public, max-age=300, s-maxage=3600, stale-while-revalidate=86400";
// En adress utan produkt cachas kort, så att en produkt som publiceras syns snart.
const CACHE_SAKNAS = "public, max-age=60, s-maxage=600";

export async function GET(request: Request) {
  const slug = new URL(request.url).searchParams.get("p");
  if (!giltigSlug(slug)) {
    return NextResponse.json({ ok: false, error: "ogiltig" }, { status: 400, headers: { "Cache-Control": CACHE_SAKNAS } });
  }
  try {
    const produkt = await hamtaKontaktProdukt(slug);
    if (!produkt) {
      return NextResponse.json({ ok: false, error: "saknas" }, { status: 404, headers: { "Cache-Control": CACHE_SAKNAS } });
    }
    return NextResponse.json({ ok: true, produkt }, { headers: { "Cache-Control": CACHE_OK } });
  } catch (e) {
    console.error("[kontakt-produkt] uppslaget i Wix felade:", (e as Error).message);
    return NextResponse.json({ ok: false, error: "fel" }, { status: 502, headers: { "Cache-Control": "no-store" } });
  }
}
