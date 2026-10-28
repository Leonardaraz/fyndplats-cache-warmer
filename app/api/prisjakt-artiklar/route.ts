// GET /api/prisjakt-artiklar
//
// Aosoms artikelnummer och varumärke per Wix-variant, för butikens
// Prisjakt-flöde på den hemliga adressen (headless-site, app/feed/[fil]/route.ts).
// Logiken och skälen står i lib/feed/prisjakt-artiklar.ts.
//
// ☠️ SVARET BÄR ARTIKELNUMREN I KLARTEXT. Därför:
//   - bara butikens hemlighet, `Authorization: Bearer REVIEW_INGEST_SECRET`
//     (inte CRON_SECRET, som finns i GitHub Actions),
//   - `Cache-Control: no-store`, så att inget mellanled sparar svaret,
//   - loggraden bär bara antal. Inget nummer, ingen adress och inget
//     felmeddelande från Aosom-flödet, vars adress är hemlig.
//
// Aosom-flödet ger märket för varje artikel. Går det inte att läsa tas märket
// ur mappningen och GPSR-datan i stället, och svaret säger `flodetFel: true`.
// Artikelnumren kommer ur mappningarna och påverkas inte.

import { type NextRequest, NextResponse } from "next/server";
import { getStore } from "@/lib/store/factory";
import { fetchAosomFeed } from "@/lib/aosom/feed";
import { gpsrForSku } from "@/lib/gpsr/data";
import { byggPrisjaktArtiklar, prisjaktAuktoriserad } from "@/lib/feed/prisjakt-artiklar";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 120;

const INGEN_CACHE = { "Cache-Control": "no-store" };
/** Flödet är tiotals MB. Hänger hämtningen får märket komma ur reservkällorna. */
const FLODE_TIDSGRANS_MS = 60_000;

export async function GET(req: NextRequest) {
  const auth = prisjaktAuktoriserad(req.headers.get("authorization"));
  if (auth === "osatt") {
    return NextResponse.json({ ok: false, error: "REVIEW_INGEST_SECRET saknas — rutten är avstängd" }, { status: 503, headers: INGEN_CACHE });
  }
  if (auth === "nej") return NextResponse.json({ ok: false, error: "Otillåten" }, { status: 401, headers: INGEN_CACHE });

  const start = Date.now();
  let mappningar;
  try {
    mappningar = await getStore().listMappings();
  } catch {
    console.error("[prisjakt-artiklar] mappningarna gick inte att läsa");
    return NextResponse.json({ ok: false, error: "läsfel" }, { status: 502, headers: INGEN_CACHE });
  }

  const flodetsAdresser = new Map<string, string>();
  let flodetFel = false;
  try {
    const rader = await fetchAosomFeed(undefined, (input, init) =>
      fetch(input, { ...init, signal: AbortSignal.timeout(FLODE_TIDSGRANS_MS) }),
    );
    for (const r of rader) if (r.sku && r.url) flodetsAdresser.set(r.sku, r.url);
  } catch {
    // Felet kan bära flödets adress, som är hemlig. Bara att det föll.
    flodetFel = true;
  }

  const { artiklar, rakning } = byggPrisjaktArtiklar(mappningar, {
    flodetsAdresser,
    gpsrMarke: (artikel) => gpsrForSku(artikel)?.m ?? null,
  });

  const poster = Object.keys(artiklar.varianter).length + Object.keys(artiklar.produkter).length;
  console.info(
    `[prisjakt-artiklar] ${poster} poster ur ${rakning.aosomRader} Aosom-rader, ` +
      `${rakning.medMarke} med märke (flödet ${rakning.markeKalla.flodet}, mappningen ${rakning.markeKalla.mappningen}, ` +
      `GPSR ${rakning.markeKalla.gpsr}), ${rakning.utanMarke} utan, ${rakning.tvetydiga} tvetydiga, ` +
      `${rakning.ogiltigtNummer} ogiltiga nummer, ${rakning.konflikter} krockar` +
      `${flodetFel ? ", Aosom-flödet gick inte att läsa" : ""} (${Math.round((Date.now() - start) / 100) / 10} s)`,
  );

  return NextResponse.json({ ok: true, ...artiklar, rakning: { ...rakning, flodetFel } }, { headers: INGEN_CACHE });
}
