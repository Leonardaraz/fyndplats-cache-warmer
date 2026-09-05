// POST /api/admin/prislas — lås eller lås upp priset på EN produkt.
//
// Aosom-synken räknar om priset ur kostnaden var sjätte timme och skriver
// husets regel (`1,20 × landedCostSek`, charm99). Det är rätt för sortimentet
// i stort, men det finns rader där ett annat pris ska gälla — en vara som
// säljer bra dyrare, eller en nyss ommappad rad där regelpriset skulle SÄNKA
// ett pris kunderna redan betalar.
//
// Utan ett lås finns ingen väg dit: nästa synk skriver tillbaka regelpriset,
// och det ser ut som om ändringen "inte tog".
//
//   POST { wixProductId, last: true | false }
//
// ☠️ LÅSET RÖR BARA PRISET. Lagersynken går vidare som vanligt — att sluta
// spegla saldot hade betytt att vi säljer något vi inte har, och det är ett
// kundfel medan ett oförändrat pris inte är det.
//
// ☠️ OCH DET ÄR INTE GRATIS. Ett låst pris slutar följa kostnaden; stiger
// Aosoms frakt äts marginalen tyst. Därför räknar synken låsta rader i
// `prisLasta` i stället för att bara hoppa över dem.
//
// Auth följer huset: CRON_SECRET (så en GitHub-workflow kan möta rutten utan
// att hemligheten passerar chatten) eller EXTENSION_API_TOKEN.

import { type NextRequest, NextResponse } from "next/server";
import { isAuthorized } from "@/lib/auth";
import { getStore } from "@/lib/store/factory";

export const runtime = "nodejs";
export const maxDuration = 30;

function auktoriserad(req: NextRequest): boolean {
  if (isAuthorized(req)) return true;
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;
  return (req.headers.get("authorization") ?? "") === `Bearer ${secret}`;
}

export async function POST(req: NextRequest) {
  if (!auktoriserad(req)) {
    return NextResponse.json({ ok: false, error: "Otillåten" }, { status: 401 });
  }

  let body: { wixProductId?: string; last?: boolean } = {};
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "Ogiltig JSON" }, { status: 400 });
  }

  const wixProductId = body.wixProductId?.trim();
  if (!wixProductId) {
    return NextResponse.json({ ok: false, error: "wixProductId krävs" }, { status: 400 });
  }
  // ☠️ INGEN DEFAULT. Ett utelämnat `last` ska inte tyst betyda "lås upp" —
  // samma fälla som GitHubs tomma workflow-input, som publicerade utkast i
  // tolv timmar innan någon märkte det.
  if (typeof body.last !== "boolean") {
    return NextResponse.json(
      { ok: false, error: "last måste vara true eller false" },
      { status: 400 },
    );
  }
  const last = body.last;

  try {
    const store = getStore();
    const rad = await store.getMappingByWixProductId(wixProductId);
    // ☠️ SKAPAR ALDRIG EN RAD. Saknas mappningen är produkten föräldralös och
    // ska granskas av en människa — inte få ett prislås på en rad som inget
    // läser. Samma hållning som /api/admin/mapping.
    if (!rad) {
      return NextResponse.json(
        { ok: false, error: `Ingen mappningsrad för ${wixProductId}` },
        { status: 404 },
      );
    }

    const fore = rad.prisLast === true;
    await store.saveMapping({ ...rad, prisLast: last });

    // ☠️ LÄS TILLBAKA. Ett svar utan fel är inget kvitto — `saveMapping` är en
    // tyst no-op på en saknad rad i alla tre backends.
    const efter = await store.getMappingByWixProductId(wixProductId);
    if ((efter?.prisLast === true) !== last) {
      return NextResponse.json(
        {
          ok: false,
          error: "Skrivningen gick igenom utan fel men raden bär inte det nya "
            + "värdet vid återläsning. Ingenting är verifierat — kör om.",
          lästeTillbaka: efter?.prisLast ?? null,
        },
        { status: 500 },
      );
    }

    await store.appendAudit({
      at: new Date().toISOString(),
      kind: "prislas",
      ref: wixProductId,
      detail: `prisLast ${fore} → ${last}`
        + ` (pris ${rad.variants?.[0]?.grossSek ?? "?"} kr,`
        + ` landat ${rad.variants?.[0]?.landedCostSek ?? "?"} kr)`,
    });

    return NextResponse.json({ ok: true, wixProductId, prisLast: last, tidigare: fore });
  } catch (e) {
    return NextResponse.json(
      { ok: false, error: e instanceof Error ? e.message : String(e) },
      { status: 500 },
    );
  }
}
