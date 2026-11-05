// POST /api/konto/sparade/kop  JSON { id }
//
// En sparad varukorg till varukorgen (lib/medlem/sparade.ts): vilka av dess
// varor som går att köpa nu, prövat mot katalogen som "Köp igen"
// (lib/medlem/kop-igen.ts). Webbläsaren lägger i dem i ett anrop
// (components/cart.tsx, `addMany`). ☠️ Bara kontots egna korgar.

import { NextResponse } from "next/server";
import { PRIVAT, inloggad } from "@/lib/medlem/inloggad";
import { hamtaMedlem, hamtaSparadKorg } from "@/lib/medlem/lager";
import { arKorgId, somOrderrader } from "@/lib/medlem/sparade";
import { kopIgen, type Katalogvara } from "@/lib/medlem/kop-igen";
import { getProducts } from "@/lib/products";

export const dynamic = "force-dynamic";

const svar = (data: Record<string, unknown>, status = 200) => NextResponse.json(data, { status, headers: PRIVAT });

export async function POST(req: Request) {
  const session = await inloggad();
  if (!session) return svar({ ok: false, skal: "utloggad" }, 401);
  let id: unknown;
  try {
    id = ((await req.json()) as { id?: unknown } | null)?.id;
  } catch {
    // Fel form; svaras nedan.
  }
  if (!arKorgId(id)) return svar({ ok: false, skal: "fel-form" }, 400);

  try {
    const medlem = await hamtaMedlem(session.sub);
    if (!medlem || medlem.status !== "aktiv") return svar({ ok: false, skal: "utloggad" }, 401);
    const korg = await hamtaSparadKorg(id);
    if (!korg || korg.medlemsId !== medlem.id) return svar({ ok: false, skal: "saknas" }, 404);
    const katalog = new Map<string, Katalogvara>((await getProducts()).map((p) => [p.id, p]));
    return svar({ ok: true, ...kopIgen(somOrderrader(korg), katalog) });
  } catch (e) {
    console.error("[konto/sparade/kop] gick inte:", e instanceof Error ? e.message.slice(0, 120) : "okänt");
    return svar({ ok: false, skal: "tillfalligt" }, 503);
  }
}
