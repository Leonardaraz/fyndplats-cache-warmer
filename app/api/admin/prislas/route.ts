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
// ☠️ VID LÅSNING STÄMS BÖCKERNA AV MOT BUTIKEN. Mappningens `grossSek` är vad
// vi TROR att kunden ser; Wix är vad kunden faktiskt ser. Synken håller normalt
// de två i fas — och i exakt den sekund låset sätts slutar den göra det, så en
// skillnad som finns då blir PERMANENT. Det är samma förväxling som
// `jamforelsePris` byggdes för, och den kostade en månad och tjugo rader.
//
// Konkret på kontorsstolen f13cd415: ommappningen till Aosom rör aldrig priset
// (Leonards beslut), så mappningen bar kvar AliExpress-tidens 879 kr medan
// butiken tog 1 299. Med ett lås ovanpå det hade lönsamhetsöversikten
// (lib/analytics/profit.ts) och marginalbanden för alltid räknat 879 mot en
// landad kostnad på 900,21 — alltså rapporterat en vara som säljs med förlust
// när den i själva verket ger 30 % marginal.
//
// Det är en BOKFÖRINGSRÄTTELSE, inte en prisändring: kundens pris rörs inte,
// och `landedCostSek`/`costUsd` rörs inte heller.
//
// Auth följer huset: CRON_SECRET (så en GitHub-workflow kan möta rutten utan
// att hemligheten passerar chatten) eller EXTENSION_API_TOKEN.

import { type NextRequest, NextResponse } from "next/server";
import { isAuthorized } from "@/lib/auth";
import { getStore } from "@/lib/store/factory";
import type { ProductMappingRecord } from "@/lib/store";
import { getV3ProductPris } from "@/lib/wix/v3-products";

export const runtime = "nodejs";
export const maxDuration = 30;

function auktoriserad(req: NextRequest): boolean {
  if (isAuthorized(req)) return true;
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;
  return (req.headers.get("authorization") ?? "") === `Bearer ${secret}`;
}

type Bokforing =
  | { skrivet: false; skal: string }
  | { skrivet: true; fran: number | null; till: number; skal: string; variants: ProductMappingRecord["variants"] };

/**
 * Rättar mappningens `grossSek` till det butiken faktiskt tar.
 *
 * ☠️ FAIL-OPEN PÅ LÄSNINGEN, MEN ALDRIG TYST. Går Wix inte att läsa ska låset
 * ändå sättas — det är den brådskande halvan, och nästa synk är sex timmar
 * bort. Men skälet går ut i svaret, audit-raden och workflow-loggen, så en
 * utebliven avstämning inte kan se ut som en gjord.
 *
 * ☠️ OKÄNT ELLER TVETYDIGT BUTIKSPRIS SKRIVER INGENTING. `tolkaProduktPris`
 * svarar `null` när varianterna har OLIKA pris — då finns inget entydigt facit,
 * och att gissa hade varit exakt buggen `utanWixPris` finns för att undvika.
 *
 * Rör bara `grossSek`. `landedCostSek` och `costUsd` är kostnadssidan och sätts
 * av importen/ommappningen — de har inget med butikens pris att göra.
 */
async function stamAvMotButiken(
  rad: ProductMappingRecord,
  wixProductId: string,
): Promise<Bokforing> {
  let butiken: number | null;
  try {
    butiken = (await getV3ProductPris(wixProductId)).priceSek;
  } catch (e) {
    return {
      skrivet: false,
      skal: `butikens pris gick inte att läsa (${e instanceof Error ? e.message : String(e)})`,
    };
  }

  if (butiken == null || !Number.isFinite(butiken) || butiken <= 0) {
    return { skrivet: false, skal: "butiken saknar ett entydigt pris (flera olika variantpriser?)" };
  }

  const varianter = rad.variants ?? [];
  if (varianter.length === 0) return { skrivet: false, skal: "raden har inga varianter" };

  const fran = varianter[0]?.grossSek ?? null;
  if (varianter.every((v) => v.grossSek === butiken)) {
    return { skrivet: false, skal: "mappningen är redan i fas med butiken" };
  }

  return {
    skrivet: true,
    fran,
    till: butiken,
    skal: "butiken är facit",
    // Priset är entydigt i butiken (min === max), alltså gäller det varje variant.
    variants: varianter.map((v) => ({ ...v, grossSek: butiken })),
  };
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

    // Stäm av böckerna mot butiken — men BARA vid låsning. Vid upplåsning tar
    // synken över igen och rättar raden av sig själv vid nästa körning.
    const bokforing: Bokforing = last
      ? await stamAvMotButiken(rad, wixProductId)
      : { skrivet: false, skal: "läses inte vid upplåsning — synken äger raden igen" };

    await store.saveMapping({
      ...rad,
      prisLast: last,
      ...(bokforing.skrivet ? { variants: bokforing.variants } : {}),
    });

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
        + ` landat ${rad.variants?.[0]?.landedCostSek ?? "?"} kr)`
        + (bokforing.skrivet
          ? ` — bokföringen rättad ${bokforing.fran ?? "?"} → ${bokforing.till} kr mot butiken`
          : ` — bokföringen orörd: ${bokforing.skal}`),
    });

    return NextResponse.json({
      ok: true,
      wixProductId,
      prisLast: last,
      tidigare: fore,
      bokforing: {
        skrivet: bokforing.skrivet,
        fran: bokforing.skrivet ? bokforing.fran : null,
        till: bokforing.skrivet ? bokforing.till : null,
        skal: bokforing.skal,
      },
    });
  } catch (e) {
    return NextResponse.json(
      { ok: false, error: e instanceof Error ? e.message : String(e) },
      { status: 500 },
    );
  }
}
