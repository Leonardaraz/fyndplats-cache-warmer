// GET  /api/konto/favoriter                                   — kontots favoriter
// POST /api/konto/favoriter  JSON { lagg?: [slug], taBort?: [slug] } — ändrar och svarar med listan
//
// Favoriterna på medlemskontot (lib/favoriter.ts). Listan är produktadresser,
// äldst först, på medlemsraden. Webbläsaren håller en kopia och skickar varje
// tryck på ett hjärta hit; svaret är alltid kontots hela lista, så att en
// vara som lagts till på en annan enhet följer med tillbaka.
//
// ☠️ Ingen loggrad bär e-post eller varor, och svaret cachas aldrig.

import { NextResponse } from "next/server";
import { PRIVAT, inloggad } from "@/lib/medlem/inloggad";
import { andraFavoriter, favoriterFor } from "@/lib/medlem/lager";
import { lasAndring } from "@/lib/favoriter";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const svar = (data: Record<string, unknown>, status = 200) => NextResponse.json(data, { status, headers: PRIVAT });
const fel = (e: unknown) => (e instanceof Error ? e.message.slice(0, 120) : "okänt");

export async function GET() {
  try {
    const session = await inloggad();
    const sluggar = session ? await favoriterFor(session.sub) : null;
    return sluggar ? svar({ ok: true, sluggar }) : svar({ ok: false, skal: "utloggad" }, 401);
  } catch (e) {
    console.error("[konto/favoriter] kunde inte läsa:", fel(e));
    return svar({ ok: false, skal: "tillfalligt" }, 503);
  }
}

export async function POST(req: Request) {
  let kropp: unknown = null;
  try {
    kropp = await req.json();
  } catch {
    // Fel form; svaras nedan.
  }
  const andring = lasAndring(kropp);
  if (!andring) return svar({ ok: false, skal: "fel-form" }, 400);
  try {
    const session = await inloggad();
    const sluggar = session ? await andraFavoriter(session.sub, andring) : null;
    return sluggar ? svar({ ok: true, sluggar }) : svar({ ok: false, skal: "utloggad" }, 401);
  } catch (e) {
    console.error("[konto/favoriter] kunde inte spara:", fel(e));
    return svar({ ok: false, skal: "tillfalligt" }, 503);
  }
}
