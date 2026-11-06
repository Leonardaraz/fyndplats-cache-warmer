// POST /api/kassa/aterta  { k }
//
// Påminnelsemejlets länk (/kassa/aterta?k=…, lib/kassa/aterta.ts): vilka av
// den övergivna korgens varor som går att köpa nu. Servern läser korgen själv
// och prövar varorna mot katalogen som "Köp igen" (lib/medlem/kop-igen.ts);
// webbläsaren lägger i dem i besökarens varukorg och öppnar kassan.
//
// Svar: { ok: true, cartId, rader, slut, borta } eller { ok: false, skal }
// med skal "ogiltig" (länken), "saknas" (korgen finns inte eller är tom),
// "kopt" (korgen blev redan en order) eller "tillfalligt".
//
// ☠️ Ingen korg, e-post eller vara i loggen.

import { NextResponse } from "next/server";
import { aterHemlighet, lasAterNyckel } from "@/lib/kassa/aterta";
import { STORES_APP_ID, lasWixVarukorg } from "@/lib/medlem/varukorg";
import { raderAttSpara } from "@/lib/medlem/sparade";
import { kopIgen, type Katalogvara } from "@/lib/medlem/kop-igen";
import { getProducts } from "@/lib/products";
import { wixFetch, WixApiError } from "@/lib/wix-client";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const PRIVAT = { "Cache-Control": "private, no-store" };
const svar = (body: Record<string, unknown>, status = 200) => NextResponse.json(body, { status, headers: PRIVAT });

export async function POST(req: Request) {
  let k: unknown;
  try {
    k = ((await req.json()) as { k?: unknown } | null)?.k;
  } catch {
    // Fel form; svaras nedan.
  }
  const cartId = lasAterNyckel(k, aterHemlighet());
  if (!cartId) return svar({ ok: false, skal: "ogiltig" }, 400);

  try {
    let korg: { orderPlaced?: boolean; lineItems?: unknown } | null = null;
    try {
      korg = (await wixFetch<{ cart?: { orderPlaced?: boolean; lineItems?: unknown } }>({ path: `/ecom/v2/carts/${encodeURIComponent(cartId)}` }))?.cart ?? null;
    } catch (e) {
      if (!(e instanceof WixApiError && (e.status === 404 || e.status === 400))) throw e;
    }
    if (korg?.orderPlaced) return svar({ ok: false, skal: "kopt" }, 409);
    const rader = raderAttSpara(lasWixVarukorg(korg) ?? [], STORES_APP_ID);
    if (!korg || rader.length === 0) return svar({ ok: false, skal: "saknas" }, 404);
    const katalog = new Map<string, Katalogvara>((await getProducts()).map((p) => [p.id, p]));
    const prov = kopIgen(
      rader.map((r) => ({ produktId: r.produktId, ...(r.variantId ? { variantId: r.variantId } : {}), antal: r.antal, raknas: true })),
      katalog,
    );
    return svar({ ok: true, cartId, ...prov });
  } catch (e) {
    console.error("[kassa/aterta] gick inte:", e instanceof WixApiError ? e.status : "okänt");
    return svar({ ok: false, skal: "tillfalligt" }, 503);
  }
}
