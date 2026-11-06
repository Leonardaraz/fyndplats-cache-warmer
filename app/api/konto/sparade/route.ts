// POST   /api/konto/sparade  JSON { cartId, namn }  — sparar varukorgen som den är
// DELETE /api/konto/sparade?id=sk_…                — tar bort en sparad varukorg
//
// Sparade varukorgar på Mina sidor (lib/medlem/sparade.ts). Servern läser
// besökarens Wix-korg själv, så det som sparas är Wix egna rader, aldrig vad
// webbläsaren påstår. ☠️ En korg tas bara bort om den är kontots (villkoret i
// Wix), och ingen loggrad bär e-post eller varor.

import { randomBytes } from "node:crypto";
import { NextResponse } from "next/server";
import { PRIVAT, inloggad } from "@/lib/medlem/inloggad";
import { hamtaMedlem, prisLage, prisOppet, sparadeKorgarFor, sparaNyKorg, taBortSparadKorg } from "@/lib/medlem/lager";
import { MAX_KORGAR, arKorgId, korgnamn, raderAttSpara, sparadKorgVy, type SparadKorg } from "@/lib/medlem/sparade";
import { STORES_APP_ID, lasWixVarukorg } from "@/lib/medlem/varukorg";
import { wixFetch } from "@/lib/wix-client";

export const dynamic = "force-dynamic";

const svar = (data: Record<string, unknown>, status = 200) => NextResponse.json(data, { status, headers: PRIVAT });
const GUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const DAG = new Intl.DateTimeFormat("sv-SE", { day: "numeric", month: "short", timeZone: "Europe/Stockholm" });

async function aktivMedlem() {
  const session = await inloggad();
  if (!session) return null;
  const medlem = await hamtaMedlem(session.sub);
  return medlem && medlem.status === "aktiv" ? medlem : null;
}

export async function POST(req: Request) {
  let cartId = "";
  let namn: unknown;
  try {
    const k = (await req.json()) as { cartId?: unknown; namn?: unknown } | null;
    cartId = typeof k?.cartId === "string" ? k.cartId : "";
    namn = k?.namn;
  } catch {
    // Fel form; svaras nedan.
  }
  if (!GUID.test(cartId)) return svar({ ok: false, skal: "fel-form" }, 400);

  try {
    const medlem = await aktivMedlem();
    if (!medlem) return svar({ ok: false, skal: "utloggad" }, 401);
    // Nya korgar följer växeln för E2/E3 (`sparadeSektion`); att använda och ta bort gör det inte.
    if (!prisOppet(await prisLage(), medlem)) return svar({ ok: false, skal: "stangd" }, 403);
    if ((await sparadeKorgarFor(medlem.id)).length >= MAX_KORGAR) return svar({ ok: false, skal: "for-manga" }, 409);
    const korg = (await wixFetch<{ cart?: unknown }>({ path: `/ecom/v2/carts/${encodeURIComponent(cartId)}` }))?.cart;
    const rader = raderAttSpara(lasWixVarukorg(korg) ?? [], STORES_APP_ID);
    if (rader.length === 0) return svar({ ok: false, skal: "tom" }, 409);
    const k: SparadKorg = {
      id: `sk_${randomBytes(8).toString("hex")}`,
      medlemsId: medlem.id,
      namn: korgnamn(namn, DAG.format(new Date())),
      rader,
      skapad: new Date().toISOString(),
    };
    await sparaNyKorg(k);
    return svar({ ok: true, korg: sparadKorgVy(k) });
  } catch (e) {
    console.error("[konto/sparade] kunde inte spara:", e instanceof Error ? e.message.slice(0, 120) : "okänt");
    return svar({ ok: false, skal: "tillfalligt" }, 503);
  }
}

export async function DELETE(req: Request) {
  const id = new URL(req.url).searchParams.get("id");
  if (!arKorgId(id)) return svar({ ok: false, skal: "fel-form" }, 400);
  try {
    const medlem = await aktivMedlem();
    if (!medlem) return svar({ ok: false, skal: "utloggad" }, 401);
    if (!(await taBortSparadKorg(id, medlem.id))) return svar({ ok: false, skal: "saknas" }, 404);
    return svar({ ok: true });
  } catch (e) {
    console.error("[konto/sparade] kunde inte ta bort:", e instanceof Error ? e.message.slice(0, 120) : "okänt");
    return svar({ ok: false, skal: "tillfalligt" }, 503);
  }
}
