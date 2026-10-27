// POST /api/wix-validering/v1/get-violations
//
// Wix tillägg Ecom Validations anropar den här rutten när kunden fyller i
// kassan. Tillägget sitter på appen Fyndplats kassa (lib/wix/fyndplats-kassa.ts),
// med deploymentUri https://fyndplats-cache-warmer.vercel.app/api/wix-validering —
// Wix lägger själv till /v1/get-violations.
//
// Svaret stoppar köpet när kundvagnen har en Aosom-vara och postnumret står i
// lib/aosom/postnummer-sparr.ts. Logiken och skälen bor i
// lib/aosom/kassa-validering.ts.
//
// Anropet är ett JWT signerat med Fyndplats kassas nyckel, och `aud` ska vara
// appens id. Nyckeln står i koden, eftersom den är publik. Byter Wix nyckeln
// läggs den nya i WIX_VALIDERING_PUBLIC_KEY (flera PEM går bra), som provas
// efter den i koden.
//
// ☠️ Rutten svarar alltid 200. Ett anrop som inte går att verifiera får ett
// tomt svar och en felrad i loggen, aldrig en felkod. Wix dokumentation säger
// inte vad kassan gör med ett felsvar, och en fel nyckel får inte kunna stänga
// kassan för alla kunder. Ett tomt svar är samma läge som innan tillägget fanns.

import { NextResponse } from "next/server";
import { delaPemNycklar, verifyJwtRs256 } from "@/lib/orders/webhook";
import { kassansOvertradelser, lasKassaAnrop } from "@/lib/aosom/kassa-validering";
import { getStore } from "@/lib/store/factory";
import { isAosomMapping } from "@/lib/store/supplier";
import { FYNDPLATS_KASSA_APP_ID, FYNDPLATS_KASSA_PUBLIC_KEY } from "@/lib/wix/fyndplats-kassa";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 30;

/** Så länge kunden får vänta på svaret. Därefter släpps köpet igenom. */
const TIDSBUDGET_MS = 3000;

/** Inga överträdelser: köpet går igenom. */
const slappIgenom = () => NextResponse.json({ violations: [] });

export async function POST(req: Request) {
  const nycklar = [FYNDPLATS_KASSA_PUBLIC_KEY, ...delaPemNycklar(process.env.WIX_VALIDERING_PUBLIC_KEY)];

  const token = (await req.text()).trim();
  let payload: Record<string, unknown> | null = null;
  for (const nyckel of nycklar) {
    payload = verifyJwtRs256(token, nyckel);
    if (payload) break;
  }
  if (!payload) {
    console.error(
      "[wix-validering] ogiltig signatur (inte Fyndplats kassas nyckel, eller inte från Wix) — köpet släpps igenom. " +
        "Har Wix bytt nyckel läggs den nya i WIX_VALIDERING_PUBLIC_KEY",
    );
    return slappIgenom();
  }
  const last = lasKassaAnrop(payload, {
    nuSek: Math.floor(Date.now() / 1000),
    appId: FYNDPLATS_KASSA_APP_ID,
  });
  if ("fel" in last) {
    console.error(`[wix-validering] avvisat (${last.fel}) — köpet släpps igenom`);
    return slappIgenom();
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
      return slappIgenom();
    }
    if (utfall.length > 0) console.log("[wix-validering] köpet stoppat: Aosom-vara till spärrat postnummer");
    return NextResponse.json({ violations: utfall });
  } catch (e) {
    console.error(
      `[wix-validering] kontrollen föll — köpet släpps igenom: ${e instanceof Error ? e.message : String(e)}`,
    );
    return slappIgenom();
  } finally {
    clearTimeout(timer);
  }
}
