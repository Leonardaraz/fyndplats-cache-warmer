// GET /api/feed/google-shopping?nyckel=<GOOGLE_FEED_SECRET> — Merchant Center-feeden.
//
//   ?nyckel=…                TSV med alla publicerade Aosom-produkter
//   ?lage=status             JSON med räknarna (hur många rader, varför resten
//                            föll) — bär inga produktdata och får därför även
//                            nås med CRON_SECRET, så workflowen kan läsa den
//                            utan att feed-nyckeln lämnar Vercel
//
// Merchant Center hämtar adressen schemalagt (dagligen). Adressen är HEMLIG:
// den bär vår produktdata med interna etiketter, och en feed som vem som helst
// kan läsa är en katalog vem som helst kan kopiera.
//
// ☠️ FEED-ADRESSEN LÄMNAR ALDRIG SERVERN. Nyckeln ligger i GOOGLE_FEED_SECRET
// på Vercel och matas in i Merchant Center av en människa — den passerar
// varken repot, Actions-loggen eller chatten. Fel nyckel svarar 404, inte 401:
// rutten ska inte ens erkänna att den finns.
//
// ☠️ RUTTEN LÄSER. Den skriver ingenting — inte i Wix, inte i mappningen.
// Vad som står i feeden avgörs av lib/feed/google-shopping.ts, och det som
// inte får stå där (artikelnummer, husmärken, kostnader) stoppas där, med test.
//
// ☠️ PRISET ÄR BUTIKENS. Feeden läser `actualPriceRange` ur samma Wix-fråga
// som prissynken; det är vad produktsidan visar. Efter en prisändring tar
// ISR-cachen (300 s) en stund — Merchant Center hämtar en gång om dagen, så
// fönstret är litet, och Product-JSON-LD på sidan låter Googles automatiska
// uppdatering rätta det som ändå glider.

import { type NextRequest, NextResponse } from "next/server";
import { timingSafeEqual } from "node:crypto";
import { getStore } from "@/lib/store/factory";
import { listV3FeedProducts } from "@/lib/wix/v3-products";
import { byggFeed, tillTsv } from "@/lib/feed/google-shopping";

export const runtime = "nodejs";
export const maxDuration = 300;

/** Under så här många rader är feeden trasig, inte sortimentet — samma tanke som MIN_FEED_RADER. */
const MIN_FEED_RADER = 200;

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
  const medNyckel = nyckelStammer(sp.get("nyckel"));
  // Feeden själv kräver nyckeln. Räknarna räcker det med CRON_SECRET för.
  if (!medNyckel && !(status && cronAuktoriserad(req))) {
    return new NextResponse("Not found", { status: 404 });
  }

  const [mappningar, produkter] = await Promise.all([
    getStore().listMappings(),
    listV3FeedProducts(),
  ]);
  const u = byggFeed(mappningar, produkter);

  // ☠️ MASSFEL-SPÄRREN. Ett svar med en handfull rader ersätter annars hela
  // feeden hos Google, och Merchant Center hade läst det som "sortimentet är
  // borta" — varje annons pausad tills nästa hämtning.
  if (u.rader.length < MIN_FEED_RADER) {
    console.error(
      `[google-feed] BARA ${u.rader.length} rader (minst ${MIN_FEED_RADER}) — svarar 503 så Google behåller förra feeden`,
    );
    return NextResponse.json(
      { ok: false, error: `Feeden gav bara ${u.rader.length} rader — troligen ett läsfel`, ...utanRader(u) },
      { status: 503 },
    );
  }

  console.log(
    `[google-feed] ${u.rader.length} rader, ${u.ejPublicerad} ej publicerade, ${u.utanPris} utan pris, `
      + `${u.utanBild} utan bild, ${u.utanSlug} utan slug, ${u.utanProdukt} utan produkt, `
      + `${u.artikelnummerIText} ARTIKELNUMMER I TEXT, ${u.varumarkeRensat} husmärke rensat, `
      + `grupp A ${u.perGrupp.A} / B ${u.perGrupp.B} / ingen ${u.perGrupp.ingen}`,
  );

  if (status) {
    return NextResponse.json({ ok: true, rader: u.rader.length, ...utanRader(u) });
  }

  return new NextResponse(tillTsv(u.rader), {
    status: 200,
    headers: {
      "Content-Type": "text/tab-separated-values; charset=utf-8",
      "Content-Disposition": 'inline; filename="fyndplats-google-shopping.tsv"',
      "Cache-Control": "private, no-store",
    },
  });
}

/** Räknarna utan raderna — det som får stå i en logg. */
function utanRader(u: ReturnType<typeof byggFeed>) {
  const { rader: _rader, ...rest } = u;
  return rest;
}
