// POST /api/kassa/kontakt  { cartId, epost, telefon? }
//
// Kassan skickar hit när kunden lämnat e-postfältet (och numret, om det är
// giltigt). E-posten läggs på Wix-korgen, så att Wix skapar en övergiven kassa
// om köpet inte blir av och påminnelsemejlen går (lib/kassa/aterta.ts). Ingen
// order skapas och ingenting annat ändras: namn och adress kommer med när
// kunden betalar.
//
// ☠️ Ingen e-post eller korg i loggen, bara att det felade.

import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { egenKassa, kassaLage, PROV_KAKA } from "@/lib/kassa/lage";
import { kontaktUrKropp } from "@/lib/kassa/formular";
import { sattKontakt } from "@/lib/kassa/wix-kassa";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const PRIVAT = { "Cache-Control": "private, no-store" };
const svar = (body: Record<string, unknown>, status = 200) => NextResponse.json(body, { status, headers: PRIVAT });

export async function POST(req: Request) {
  if (!egenKassa(await kassaLage(), (await cookies()).get(PROV_KAKA)?.value)) return svar({ ok: false, kod: "stangd" }, 503);
  let body: unknown = null;
  try {
    body = await req.json();
  } catch {
    return svar({ ok: false, kod: "fel" }, 400);
  }
  const k = kontaktUrKropp(body);
  if (!k) return svar({ ok: false, kod: "fel" }, 400);
  try {
    await sattKontakt(k.cartId, k.epost, k.telefon);
    return svar({ ok: true });
  } catch (e) {
    const status = (e as { status?: unknown } | null)?.status;
    console.error("[kassa] kontakten till korgen föll:", typeof status === "number" ? status : "okänt");
    return svar({ ok: false, kod: "wix" }, 502);
  }
}
