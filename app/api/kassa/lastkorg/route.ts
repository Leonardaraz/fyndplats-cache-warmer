// POST /api/kassa/lastkorg  JSON
//
//   { steg: "slapp" }             kunden ändrar varukorgen: kassan släpper den låsta korgen
//   { steg: "kopt", orderId }     köpet är klart: de köpta varorna bort ur besökarens korg
//
// Kakan fp_kassa_korg (lib/kassa/lastkorg.ts) tas bort i båda fallen. Rutten
// svarar alltid 200 med vad som gjordes: den får aldrig stoppa kunden på väg
// till tacksidan, och sidan anropar den med keepalive utan att vänta.
// Webhooken tömmer också besökarens korg när ordern godkänns; den som hinner
// först gör det, och bara en gång (lib/kassa/medlemskassa.ts).

import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { LAST_KORG_BORT, LAST_KORG_KAKA, lastKorgId } from "@/lib/kassa/lastkorg";
import { efterMedlemskop } from "@/lib/kassa/medlemskassa";

export const dynamic = "force-dynamic";
export const maxDuration = 20;

const PRIVAT = { "Cache-Control": "private, no-store" } as const;
const ORDER = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function POST(req: Request) {
  let kropp: { steg?: unknown; orderId?: unknown } = {};
  try {
    kropp = ((await req.json()) ?? {}) as typeof kropp;
  } catch {
    // Tom eller trasig kropp: kakan tas ändå bort.
  }
  const lastId = lastKorgId((await cookies()).get(LAST_KORG_KAKA)?.value);
  let rensade = 0;
  if (kropp.steg === "kopt" && lastId && typeof kropp.orderId === "string" && ORDER.test(kropp.orderId)) {
    try {
      rensade = await efterMedlemskop(lastId, kropp.orderId, { vanta: true });
    } catch (e) {
      console.error("[kassa/lastkorg] besökarens korg gick inte att tömma:", e instanceof Error ? e.message.slice(0, 120) : "okänt");
    }
  }
  const res = NextResponse.json({ ok: true, rensade }, { headers: PRIVAT });
  if (lastId) res.cookies.set(LAST_KORG_BORT);
  return res;
}
