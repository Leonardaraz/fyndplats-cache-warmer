// GET /api/feed/google-shopping-tillagg?nyckel=<GOOGLE_FEED_SECRET>
//
//   ?nyckel=…                TSV: id + custom_label_0/1/2 för alla Aosom-rader
//   ?lage=status             JSON med räknarna — bär inga produktdata och får
//                            därför även nås med CRON_SECRET, så workflowen kan
//                            läsa den utan att feed-nyckeln lämnar Vercel
//
// TILLÄGGSFEED till Merchant Center (2026-09-15). Huvudfeeden är butiksrepots
// `/feed/google.xml`; den här lägger etiketterna ovanpå — prisgrupp (A/B),
// prisband och konkurrensläge — så kampanjen kan välja produkter på
// `custom_label_0`. Se lib/feed/google-shopping.ts.
//
// ☠️ FEED-ADRESSEN LÄMNAR ALDRIG SERVERN. Nyckeln ligger i GOOGLE_FEED_SECRET
// på Vercel och matas in i Merchant Center av en människa — den passerar
// varken repot, Actions-loggen eller chatten. Fel nyckel svarar 404, inte 401:
// rutten ska inte ens erkänna att den finns.
//
// GOOGLE_FEED_SECRET lades in på Vercel (Production) 2026-09-16; den här raden
// finns för att bygget skulle ta med variabeln — vercel.json ignorerar
// commits som bara rör .md, och en omdeploy av samma commit avbryts.
//
// ☠️ RUTTEN LÄSER. Den skriver ingenting — inte i Wix, inte i mappningen.

import { type NextRequest, NextResponse } from "next/server";
import { timingSafeEqual } from "node:crypto";
import { getStore } from "@/lib/store/factory";
import { listV3ProductPrices } from "@/lib/wix/v3-products";
import { byggTillaggsfeed, tillTsv } from "@/lib/feed/google-shopping";

export const runtime = "nodejs";
export const maxDuration = 300;

/**
 * Under så här många rader är svaret ett läsfel, inte sortimentet. Ett tomt
 * svar hade fått Merchant Center att stryka varje etikett — och därmed varje
 * produkt ur kampanjen — tills nästa hämtning. Samma klass som MIN_FEED_RADER.
 */
const MIN_RADER = 200;

function nyckelStammer(given: string | null): boolean {
  const hemlig = process.env.GOOGLE_FEED_SECRET ?? "";
  if (!hemlig || !given) return false;
  const a = Buffer.from(given);
  const b = Buffer.from(hemlig);
  return a.length === b.length && timingSafeEqual(a, b);
}

function cronAuktoriserad(req: NextRequest): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;
  return (req.headers.get("authorization") ?? "") === `Bearer ${secret}`;
}

export async function GET(req: NextRequest) {
  const sp = req.nextUrl.searchParams;
  const status = sp.get("lage") === "status";
  if (!nyckelStammer(sp.get("nyckel")) && !(status && cronAuktoriserad(req))) {
    return new NextResponse("Not found", { status: 404 });
  }

  const [mappningar, priser] = await Promise.all([getStore().listMappings(), listV3ProductPrices()]);
  const u = byggTillaggsfeed(mappningar, priser);
  const { rader, ...raknare } = u;

  if (rader.length < MIN_RADER) {
    console.error(`[google-tillagg] BARA ${rader.length} rader (minst ${MIN_RADER}) — svarar 503 så Google behåller förra feeden`);
    return NextResponse.json({ ok: false, error: `Tilläggsfeeden gav bara ${rader.length} rader`, ...raknare }, { status: 503 });
  }

  console.log(
    `[google-tillagg] ${rader.length} rader, grupp A ${u.perGrupp.A} / B ${u.perGrupp.B} / ingen ${u.perGrupp.ingen}, `
      + `under ${u.perKonkurrenslage.under_dealproffsen ?? 0} / över ${u.perKonkurrenslage.over_dealproffsen ?? 0} / `
      + `utan jämförelse ${u.perKonkurrenslage.ingen_jamforelse ?? 0}, ${u.utanVariantId} utan variant-id, ${u.utanPris} utan pris`,
  );

  if (status) return NextResponse.json({ ok: true, rader: rader.length, ...raknare });

  return new NextResponse(tillTsv(rader), {
    status: 200,
    headers: {
      "Content-Type": "text/tab-separated-values; charset=utf-8",
      "Content-Disposition": 'inline; filename="fyndplats-google-tillagg.tsv"',
      "Cache-Control": "private, no-store",
    },
  });
}
