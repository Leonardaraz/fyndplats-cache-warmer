// POST /api/wix-validering/v1/get-violations
//
// Wix tillägg Ecom Validations anropar den här rutten när kunden fyller i
// kassan. Tillägget sitter på appen Fyndplats i Wix (Custom Apps), med
// deploymentUri https://fyndplats-cache-warmer.vercel.app/api/wix-validering —
// Wix lägger själv till /v1/get-violations.
//
// Svaret stoppar köpet när kundvagnen har en Aosom-vara och postnumret står i
// lib/aosom/postnummer-sparr.ts. Logiken och skälen bor i
// lib/aosom/kassa-validering.ts.
//
// Anropet är ett JWT signerat med appens nyckel. Tillägget sitter på samma app
// som skickar orderwebhooken (My New App-4), så samma nyckel gäller
// (WIX_WEBHOOK_PUBLIC_KEY). Varje PEM i WIX_VALIDERING_PUBLIC_KEY och
// WIX_WEBHOOK_PUBLIC_KEY provas, så ett värde med flera nycklar fungerar.

import { NextResponse } from "next/server";
import { delaPemNycklar, verifyJwtRs256 } from "@/lib/orders/webhook";
import { kassansOvertradelser, lasKassaAnrop } from "@/lib/aosom/kassa-validering";
import { getStore } from "@/lib/store/factory";
import { isAosomMapping } from "@/lib/store/supplier";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 30;

/** Så länge kunden får vänta på svaret. Därefter släpps köpet igenom. */
const TIDSBUDGET_MS = 3000;

export async function POST(req: Request) {
  const nycklar = [
    ...delaPemNycklar(process.env.WIX_VALIDERING_PUBLIC_KEY),
    ...delaPemNycklar(process.env.WIX_WEBHOOK_PUBLIC_KEY),
  ];
  if (nycklar.length === 0) {
    console.error("[wix-validering] ingen publik nyckel satt — anropet går inte att verifiera");
    return NextResponse.json({ error: "Ingen publik nyckel" }, { status: 500 });
  }

  const token = (await req.text()).trim();
  let payload: Record<string, unknown> | null = null;
  for (const nyckel of nycklar) {
    payload = verifyJwtRs256(token, nyckel);
    if (payload) break;
  }
  if (!payload) {
    console.warn("[wix-validering] ogiltig signatur");
    return NextResponse.json({ error: "Ogiltig signatur" }, { status: 401 });
  }
  const last = lasKassaAnrop(payload, {
    nuSek: Math.floor(Date.now() / 1000),
    appId: process.env.WIX_APP_ID || undefined,
  });
  if ("fel" in last) {
    console.warn(`[wix-validering] avvisat: ${last.fel}`);
    return NextResponse.json({ error: last.fel }, { status: 401 });
  }

  const store = getStore();
  const kontroll = kassansOvertradelser(last.info, {
    arAosomProdukt: async (id) => {
      const m = await store.getMappingByWixProductId(id);
      return m ? isAosomMapping(m) : false;
    },
  });
  let timer: ReturnType<typeof setTimeout> | undefined;
  const tidenUte = new Promise<"tiden-ute">((resolve) => {
    timer = setTimeout(() => resolve("tiden-ute"), TIDSBUDGET_MS);
  });
  try {
    const utfall = await Promise.race([kontroll, tidenUte]);
    if (utfall === "tiden-ute") {
      console.error(`[wix-validering] ingen kontroll inom ${TIDSBUDGET_MS} ms — köpet släpps igenom`);
      return NextResponse.json({ violations: [] });
    }
    if (utfall.length > 0) console.log("[wix-validering] köpet stoppat: Aosom-vara till spärrat postnummer");
    return NextResponse.json({ violations: utfall });
  } catch (e) {
    console.error(
      `[wix-validering] kontrollen föll — köpet släpps igenom: ${e instanceof Error ? e.message : String(e)}`,
    );
    return NextResponse.json({ violations: [] });
  } finally {
    clearTimeout(timer);
  }
}
