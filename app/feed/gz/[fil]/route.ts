// GET /feed/gz/<fil>
//
// Samma flöde som /feed/<fil>, ALLTID gzip-komprimerat. Det är den här adressen
// CDN:en håller en kopia av: en enda, lika för alla läsare.
//
// Ingen läsare har adressen. next.config.ts skriver om /feed/google.xml,
// /feed/products.xml och /feed/pricerunner.xml hit för den som tar emot gzip,
// och /api/cron/farska-floden hämtar dem varannan timme så att kopian finns.
// Varför det är två adresser i stället för Vary: Accept-Encoding står i
// lib/feed/prisjakt-svar.ts (mätt 2026-11-11: en kopia per rubriksträng).
//
// Flödet byggs av den vanliga ruttens GET utan anrop, som Prisjakt- och
// PriceRunner-rutterna gör, så det finns en enda byggare per flöde.

import { GET as google } from "../../google.xml/route";
import { GET as produkter } from "../../products.xml/route";
import { GET as pricerunner } from "../../pricerunner.xml/route";
import { KOMPRIMERADE_FLODEN, komprimeratFlodessvar } from "@/lib/feed/prisjakt-svar";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 300;

const BYGGARE: Record<(typeof KOMPRIMERADE_FLODEN)[number], () => Promise<Response>> = {
  "google.xml": () => google(),
  "products.xml": () => produkter(),
  "pricerunner.xml": () => pricerunner(),
};

export async function GET(_req: Request, { params }: { params: Promise<{ fil: string }> }) {
  const { fil } = await params;
  const bygg = (BYGGARE as Record<string, (() => Promise<Response>) | undefined>)[fil];
  if (!bygg) {
    return new Response("Not found", {
      status: 404,
      headers: { "Content-Type": "text/plain; charset=utf-8", "Cache-Control": "no-store" },
    });
  }
  const xml = await (await bygg()).text();
  return komprimeratFlodessvar(xml, `/feed/${fil}`);
}
