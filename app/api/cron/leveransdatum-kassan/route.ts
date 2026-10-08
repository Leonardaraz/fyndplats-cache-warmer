// app/api/cron/leveransdatum-kassan/route.ts
// Vercel Cron entry: GET /api/cron/leveransdatum-kassan
// Schedule: "5 * * * *" (se vercel.json).
//
// Skriver leveransdatumet i Wix-kassans leveransval: "Beräknad leverans ons 14 –
// mån 19 oktober" i stället för "3–6 arbetsdagar", samma intervall som
// produktsidan och varukorgen visar. Logiken och varför den läser tillbaka står i
// lib/kassans-leveranstid.ts (Leonards ja 2026-10-09).
//
// Varje timme, inte en gång per natt: Vercel Cron går i UTC och det svenska
// dygnet byts 22:00 eller 23:00 UTC beroende på sommartid. Körningen fem över
// varje timme tar båda, och ett anrop som föll tas om nästa timme. En körning där
// texten redan stämmer kostar en läsning och loggar ingenting.

import { NextResponse } from "next/server";
import { DELIVERY_MAX_DAYS, DELIVERY_MIN_DAYS } from "@/lib/shipping";
import { idagISO } from "@/lib/price-history";
import { leveransIntervallForDag } from "@/lib/leveransdatum";
import {
  kassansLeveranstext,
  uppdateraKassansLeveranstid,
  type Fraktalternativ,
} from "@/lib/kassans-leveranstid";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const BAS = "https://www.wixapis.com/ecom/v1/shipping-options";

function isAuthorised(request: Request): boolean {
  const expected = process.env.CRON_SECRET;
  if (!expected) return true; // dev fallback
  return request.headers.get("authorization") === `Bearer ${expected}`;
}

async function wix(path: string, init: { method: string; body?: unknown }): Promise<Record<string, unknown>> {
  const key = process.env.WIX_API_KEY;
  const site = process.env.WIX_SITE_ID;
  if (!key || !site) throw new Error("WIX_API_KEY/WIX_SITE_ID saknas");
  const res = await fetch(`${BAS}${path}`, {
    method: init.method,
    headers: { Authorization: key, "wix-site-id": site, "Content-Type": "application/json" },
    body: init.body === undefined ? undefined : JSON.stringify(init.body),
    cache: "no-store",
    signal: AbortSignal.timeout(8000),
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`${init.method} ${path} → HTTP ${res.status} ${text.slice(0, 200)}`);
  }
  return (await res.json()) as Record<string, unknown>;
}

export async function GET(request: Request) {
  if (!isAuthorised(request)) {
    return NextResponse.json({ ok: false, error: "unauthorised" }, { status: 401 });
  }

  const dag = idagISO(new Date());
  const intervall = leveransIntervallForDag(dag, DELIVERY_MIN_DAYS, DELIVERY_MAX_DAYS);
  if (!intervall) {
    console.error(`[leveransdatum-kassan] dagen ${dag} gick inte att läsa, ingenting skrivet`);
    return NextResponse.json({ ok: false, error: "dag" }, { status: 500 });
  }
  const text = kassansLeveranstext(intervall);

  try {
    const utfall = await uppdateraKassansLeveranstid(text, DELIVERY_MIN_DAYS, DELIVERY_MAX_DAYS, {
      async lasAlla() {
        const svar = await wix("/query", { method: "POST", body: { query: { cursorPaging: { limit: 100 } } } });
        return (svar.shippingOptions as Fraktalternativ[] | undefined) ?? [];
      },
      async las(id) {
        const svar = await wix(`/${encodeURIComponent(id)}`, { method: "GET" });
        const alt = svar.shippingOption as Fraktalternativ | undefined;
        if (!alt) throw new Error(`GET ${id} → svar utan shippingOption`);
        return alt;
      },
      async skrivText(id, revision, nyText) {
        await wix(`/${encodeURIComponent(id)}`, {
          method: "PATCH",
          body: { shippingOption: { id, revision, estimatedDeliveryTime: nyText } },
        });
      },
      async aterstallPriser(id, revision, rates) {
        await wix(`/${encodeURIComponent(id)}`, {
          method: "PATCH",
          body: { shippingOption: { id, revision, rates } },
        });
      },
    });

    if (utfall.status === "fel") {
      console.error(`[leveransdatum-kassan] "${text}": ${utfall.fel.join("; ")}`);
      return NextResponse.json({ ok: false, ...utfall }, { status: 500 });
    }
    if (utfall.status === "skriven") {
      const fore = utfall.skrivna.map((s) => `"${s.fore}"`).join(", ");
      console.info(`[leveransdatum-kassan] "${text}" skrivet, stod ${fore}`);
    }
    return NextResponse.json({ ok: true, ...utfall });
  } catch (err) {
    console.error(`[leveransdatum-kassan] "${text}": läsningen föll`, err);
    return NextResponse.json({ ok: false, error: "wix" }, { status: 500 });
  }
}
