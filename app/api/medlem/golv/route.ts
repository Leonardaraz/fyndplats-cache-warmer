// POST /api/medlem/golv
//
// Golvpriset G per variant för butikens prismotor (medlemskapet E2 och E3).
// Butiken skickar `{ rader: [{ produktId, variantId }] }` och får tillbaka
// golvet, eller skälet till att raden saknar golv. Logiken och skälen står i
// lib/medlem/golv.ts.
//
// ☠️ SVARET BÄR KOSTNADEN, för butikens prisbeslutslogg. Därför:
//   - bara butikens hemlighet, `Authorization: Bearer REVIEW_INGEST_SECRET`,
//   - `Cache-Control: no-store`, så att inget mellanled sparar svaret,
//   - loggraden bär bara antal, aldrig en kostnad eller ett golv.
//
// Kan mappningarna eller auktionerna inte läsas svarar rutten 503. Butiken
// visar då listpriset: hellre inget medlemspris än ett medlemspris på en vara
// som en levande fyndauktion prissätter.

import { type NextRequest, NextResponse } from "next/server";
import { getStore } from "@/lib/store/factory";
import { queryAuctions } from "@/lib/auction/store";
import { golvAuktoriserad, golvFor, lasFragor, type Utanskal } from "@/lib/medlem/golv";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 30;

const INGEN_CACHE = { "Cache-Control": "no-store" };

/**
 * De levande auktionerna, sparade i 30 sekunder per instans. Butiken frågar
 * för varje produktsida en medlem öppnar, och auktionerna byter läge två
 * gånger om dygnet (07:00 och 19:00).
 */
const AUKTION_TTL_MS = 30_000;
let auktioner: { tid: number; idn: Set<string> } | null = null;

async function levandeAuktioner(): Promise<Set<string>> {
  if (auktioner && Date.now() - auktioner.tid < AUKTION_TTL_MS) return auktioner.idn;
  const docs = await queryAuctions(["live"]);
  auktioner = { tid: Date.now(), idn: new Set(docs.map((d) => d.productId)) };
  return auktioner.idn;
}

export async function POST(req: NextRequest) {
  const auth = golvAuktoriserad(req.headers.get("authorization"));
  if (auth === "osatt") {
    return NextResponse.json({ ok: false, error: "REVIEW_INGEST_SECRET saknas — rutten är avstängd" }, { status: 503, headers: INGEN_CACHE });
  }
  if (auth === "nej") return NextResponse.json({ ok: false, error: "Otillåten" }, { status: 401, headers: INGEN_CACHE });

  let kropp: unknown = null;
  try {
    kropp = await req.json();
  } catch {
    // Fel form; svaras nedan.
  }
  const fragor = lasFragor(kropp);
  if (!fragor) return NextResponse.json({ ok: false, error: "fel form" }, { status: 400, headers: INGEN_CACHE });

  let mappningar;
  let levande;
  try {
    [mappningar, levande] = await Promise.all([
      getStore().getMappingsByWixProductIds([...new Set(fragor.map((f) => f.produktId))]),
      levandeAuktioner(),
    ]);
  } catch {
    console.error("[medlem-golv] mappningarna eller auktionerna gick inte att läsa");
    return NextResponse.json({ ok: false, error: "läsfel" }, { status: 503, headers: INGEN_CACHE });
  }

  const rader = golvFor(fragor, mappningar, levande);
  const utan = new Map<Utanskal, number>();
  for (const r of rader) if (r.utan) utan.set(r.utan, (utan.get(r.utan) ?? 0) + 1);
  const delar = [...utan].map(([skal, antal]) => `${skal} ${antal}`).join(", ");
  console.info(`[medlem-golv] ${rader.length} rader, ${rader.length - [...utan.values()].reduce((s, n) => s + n, 0)} med golv${delar ? ` (utan: ${delar})` : ""}`);

  return NextResponse.json({ ok: true, rader }, { headers: INGEN_CACHE });
}
