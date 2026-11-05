// POST /api/konto/kop-igen  JSON { ordernummer }
//
// "Köp igen" på Mina sidor (lib/medlem/kop-igen.ts): vilka av orderns varor
// som går att lägga i varukorgen nu. Webbläsaren lägger sedan i dem i ett
// anrop (components/cart.tsx, `addMany`).
//
// ☠️ Bara den inloggade medlemmens egna ordrar: ordern hämtas ur
// orderliggaren på kontots e-post, och numret väljer bara bland dem. Ett annat
// nummer ger "saknas", aldrig någon annans varor.

import { NextResponse } from "next/server";
import { PRIVAT, inloggad } from "@/lib/medlem/inloggad";
import { hamtaMedlem, liggarraderForEpost } from "@/lib/medlem/lager";
import { kopIgen, type Katalogvara } from "@/lib/medlem/kop-igen";
import { getProducts } from "@/lib/products";

export const dynamic = "force-dynamic";

const svar = (data: Record<string, unknown>, status = 200) => NextResponse.json(data, { status, headers: PRIVAT });

export async function POST(req: Request) {
  const session = await inloggad();
  if (!session) return svar({ ok: false, skal: "utloggad" }, 401);

  let ordernummer = "";
  try {
    const v = (await req.json()) as { ordernummer?: unknown } | null;
    ordernummer = typeof v?.ordernummer === "string" ? v.ordernummer.trim() : "";
  } catch {
    // Fel form; svaras nedan.
  }
  if (!/^(\d{1,12}|[0-9a-f-]{36})$/i.test(ordernummer)) return svar({ ok: false, skal: "fel-form" }, 400);

  try {
    const medlem = await hamtaMedlem(session.sub);
    if (!medlem || medlem.status !== "aktiv") return svar({ ok: false, skal: "utloggad" }, 401);
    const order = (await liggarraderForEpost(medlem.epost)).find((r) => r.ordernummer === ordernummer);
    if (!order) return svar({ ok: false, skal: "saknas" }, 404);
    const katalog = new Map<string, Katalogvara>((await getProducts()).map((p) => [p.id, p]));
    return svar({ ok: true, ...kopIgen(order.rader, katalog) });
  } catch (e) {
    console.error("[konto/kop-igen] gick inte:", e instanceof Error ? e.message.slice(0, 120) : "okänt");
    return svar({ ok: false, skal: "tillfalligt" }, 503);
  }
}
