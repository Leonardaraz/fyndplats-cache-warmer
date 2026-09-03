// GET /api/admin/aosom-feed-search?q=... — fritextsök i Aosoms feed.
//
// Svarar på frågan "finns den här varan hos Aosom?" utan att feed-adressen
// lämnar servern. Logiken och motiven bor i lib/aosom/feed-search.ts.
//
//   ?q=24 paneel gehege   termerna måste ALLA finnas (AND), ordning spelar roll noll
//   ?allaRader=1          ta med rader som inte går att skicka till Sverige
//   ?max=20               tak på antalet visade träffar (default 50)
//
// ☠️ RUTTEN SKRIVER INGENTING och kan inte skriva någonting. Den läser feeden,
// filtrerar och svarar. Det finns med flit ingen "importera träffarna"-flagga:
// vilken artikel som ska in i katalogen är en människas bedömning, precis som i
// ommappningen och prisreparationen.
//
// ☠️ SVARET BÄR ALDRIG FEED-ADRESSEN. Varje träff har Aosoms publika
// produkt-URL (`row.url`), som är ofarlig — det är prislistans adress som är
// hemligheten, inte produktsidorna.

import { type NextRequest, NextResponse } from "next/server";
import { isAuthorized } from "@/lib/auth";
import { eurToSekFromEnv } from "@/lib/config";
import { fetchAosomFeed } from "@/lib/aosom/feed";
import { MAX_TRAFFAR, sokFeed } from "@/lib/aosom/feed-search";

export const runtime = "nodejs";
export const maxDuration = 60;

function auktoriserad(req: NextRequest): boolean {
  if (isAuthorized(req)) return true;
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;
  return (req.headers.get("authorization") ?? "") === `Bearer ${secret}`;
}

export async function GET(req: NextRequest) {
  if (!auktoriserad(req)) {
    return NextResponse.json({ ok: false, error: "Otillåten" }, { status: 401 });
  }

  const q = (req.nextUrl.searchParams.get("q") ?? "").trim();
  if (!q) {
    return NextResponse.json(
      { ok: false, error: "q krävs — t.ex. ?q=24 paneel gehege" },
      { status: 400 },
    );
  }

  const allaRader = req.nextUrl.searchParams.get("allaRader") === "1";
  const maxRaw = Number(req.nextUrl.searchParams.get("max"));
  const max = Number.isFinite(maxRaw) && maxRaw > 0
    ? Math.min(Math.trunc(maxRaw), MAX_TRAFFAR)
    : MAX_TRAFFAR;

  try {
    const rader = await fetchAosomFeed();
    const resultat = sokFeed(rader, q, eurToSekFromEnv(), {
      endastSkeppbara: !allaRader,
      max,
    });
    return NextResponse.json({ ok: true, ...resultat });
  } catch (e) {
    return NextResponse.json(
      { ok: false, error: e instanceof Error ? e.message : String(e) },
      { status: 500 },
    );
  }
}
