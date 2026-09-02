// GET/POST /api/admin/mapping — poleringens väg till mappningsraden.
//
// Ersätter de två Wix Data-anrop SEO-poleringen gjorde direkt ur chatten innan
// migreringen (POSTGRES-MIGRATION.md, steg 6 tömde FyndplatsMappings):
//
//   Steg 3/4/6/10  GET  /data/v2/items/{id}?dataCollectionId=FyndplatsMappings
//   Steg 8/13      POST /data/v2/items/save   (hela raden)
//
// ☠️ SKRIVNINGEN VAR DEN FARLIGA. En save mot en TÖMD kollektion skapar en ny
// rad: den rapporterar framgång, ingenting läser den, produkten kommer tillbaka
// i poleringskön för alltid och SKU-skrivningen tappas. Rutten här kan inte
// göra det — den vägrar skriva en rad som inte finns.
//
//   GET  ?wixProductId=<id>   hela raden + färdigräknad prisgrind
//   POST { wixProductId, patch: { needsAiPolish?, draftStatus?, variantSkus? } }
//
// Spärrarna och deras motiv bor i lib/polish/mapping-access.ts och är testade
// där. Auth följer huset: CRON_SECRET (så en GitHub-workflow kan möta rutten
// utan att hemligheten passerar chatten) eller EXTENSION_API_TOKEN.

import { type NextRequest, NextResponse } from "next/server";
import { isAuthorized } from "@/lib/auth";
import { getStore } from "@/lib/store/factory";
import { getPricingRules } from "@/lib/store/pricing-config";
import { applicera, prisgrind, validera, type Patch } from "@/lib/polish/mapping-access";
import { v3ProduktFinns } from "@/lib/wix/v3-products";

export const runtime = "nodejs";
export const maxDuration = 30;

function auktoriserad(req: NextRequest): boolean {
  if (isAuthorized(req)) return true;
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;
  return (req.headers.get("authorization") ?? "") === `Bearer ${secret}`;
}

/** Prisregelns multiplikator för den här produkten. Kategorimultiplikatorer är
 *  rensade sedan 2026-08-27 (CLAUDE.md), så defaulten är regeln. */
async function multiplikatorOchAvrundning() {
  const regler = await getPricingRules();
  return { multiplikator: regler.defaultMultiplier, rounding: regler.rounding };
}


/**
 * Förklarar en saknad mappning med rätt orsak.
 *
 * Bara på 404-vägen, alltså sällan — den kostar ett Wix-anrop och betalar för
 * sig genom att peka mottagaren åt rätt håll.
 */
async function saknadMappningsText(wixProductId: string): Promise<string> {
  const finns = await v3ProduktFinns(wixProductId);
  if (finns === true) {
    return `Ingen mappning för ${wixProductId}, men produkten FINNS i butiken. `
      + "Den är föräldralös (skapad i Wix men mappningsskrivningen föll) — se "
      + "summary.orphans i Aosom-importen. Polera den INTE förrän raden finns.";
  }
  if (finns === false) {
    return `Varken mappning eller produkt finns för ${wixProductId}. Id:t är `
      + "alltså inte en föräldralös produkt utan en felaktig referens — "
      + "kontrollera var det kom ifrån. Ingenting att polera.";
  }
  return `Ingen mappning för ${wixProductId}, och butiken svarade inte på om `
    + "produkten finns. Den kan vara föräldralös (skapad i Wix men "
    + "mappningsskrivningen föll). Polera den INTE förrän raden finns.";
}

export async function GET(req: NextRequest) {
  if (!auktoriserad(req)) {
    return NextResponse.json({ ok: false, error: "Otillåten" }, { status: 401 });
  }

  const wixProductId = req.nextUrl.searchParams.get("wixProductId")?.trim();
  if (!wixProductId) {
    return NextResponse.json(
      { ok: false, error: "wixProductId krävs" },
      { status: 400 },
    );
  }

  try {
    const rad = await getStore().getMappingByWixProductId(wixProductId);
    if (!rad) {
      // ☠️ TVÅ HELT OLIKA LÄGEN, OCH DE HAR OLIKA ÅTGÄRD. Meddelandet påstod
      // förr alltid "kan vara föräldralös" — alltså skapad i Wix men utan
      // mappningsrad — och skickade därmed mottagaren att leta efter en
      // föräldralös produkt även när id:t inte fanns i butiken över huvud
      // taget. Uppmätt 2026-09-02 på 3b64881e: noll träffar i Wix.
      //
      // Samma klass som "läste inte tillbaka som förväntat": ett felmeddelande
      // som pekar åt fel håll kostar mer än inget meddelande alls.
      return NextResponse.json(
        { ok: false, error: await saknadMappningsText(wixProductId) },
        { status: 404 },
      );
    }

    const { multiplikator, rounding } = await multiplikatorOchAvrundning();
    const grind = prisgrind(rad, { rounding }, multiplikator);

    return NextResponse.json({
      ok: true,
      mappning: rad,
      // Färdigräknad så Steg 4 inte behöver göra aritmetik i chatten — och så
      // grinden inte kan drifta från prissättningens egen regel.
      prisgrind: grind,
      prisregel: { multiplikator, rounding },
      // Bekvämlighet: Steg 4 sorterar poleringsordning på den här.
      aosomFreightShare: rad.aosomFreightShare ?? null,
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error(`[mapping] GET ${wixProductId} misslyckades: ${msg.slice(0, 300)}`);
    return NextResponse.json({ ok: false, error: msg.slice(0, 300) }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  if (!auktoriserad(req)) {
    return NextResponse.json({ ok: false, error: "Otillåten" }, { status: 401 });
  }

  let kropp: { wixProductId?: unknown; patch?: unknown };
  try {
    kropp = (await req.json()) as typeof kropp;
  } catch {
    return NextResponse.json({ ok: false, error: "Ogiltig JSON" }, { status: 400 });
  }

  const wixProductId = typeof kropp.wixProductId === "string" ? kropp.wixProductId.trim() : "";
  if (!wixProductId) {
    return NextResponse.json({ ok: false, error: "wixProductId krävs" }, { status: 400 });
  }

  const rå = (kropp.patch ?? {}) as Record<string, unknown>;
  if (typeof rå !== "object" || rå === null || Array.isArray(rå)) {
    return NextResponse.json({ ok: false, error: "patch måste vara ett objekt" }, { status: 400 });
  }
  if (Object.keys(rå).length === 0) {
    return NextResponse.json({ ok: false, error: "patch är tom" }, { status: 400 });
  }

  // ☠️ Validera FÖRE läsningen. Ett okänt fält ska avvisas, inte tyst tappas.
  const fel = validera(rå);
  if (fel.length > 0) {
    return NextResponse.json({ ok: false, error: "Ogiltig patch", fel }, { status: 400 });
  }

  try {
    const store = getStore();
    const före = await store.getMappingByWixProductId(wixProductId);

    // ☠️ SKAPAR ALDRIG. Det här är hela skälet till att rutten finns: en save
    // mot den tömda Wix-kollektionen hade skapat en föräldralös rad och sagt OK.
    if (!före) {
      return NextResponse.json(
        {
          ok: false,
          error:
            `Ingen mappning för ${wixProductId} — rutten skapar aldrig en rad. `
            + "Skulle den göra det blev resultatet en mappning utan import bakom sig.",
        },
        { status: 404 },
      );
    }

    const { ny, okändaVariantIds } = applicera(före, rå as Patch);

    // ☠️ AVVISA FÖRE SKRIVNINGEN, inte efter. Ett wixVariantId som inte finns
    // på raden får ingen SKU — och SKU:n är inte kosmetisk: Aosom-prissynken
    // matchar Wix-varianten på just det fältet, så en utebliven SKU är samma
    // klass av fel som förväxlingen 2026-08-29 (prissynken skrev till
    // ingenting i en månad).
    //
    // Tidigare skrevs raden först, och verifieringen nedan såg det omatchade
    // id:t som "skrivningen tog inte" → 500. Två fel i det: meddelandet ljög
    // (de andra fälten HADE skrivits), och en halvt applicerad patch lämnades
    // kvar. Nu skrivs ingenting alls, och felet namnger id:na.
    if (okändaVariantIds.length > 0) {
      const kända = före.variants.map((v) => v.wixVariantId).filter(Boolean);
      return NextResponse.json(
        {
          ok: false,
          error:
            `Okända wixVariantId: ${okändaVariantIds.join(", ")}. INGENTING skrevs. `
            + `Radens variant-id är: ${kända.join(", ") || "(inga)"}.`,
          okändaVariantIds,
        },
        { status: 422 },
      );
    }

    await store.saveMapping(ny);

    // ☠️ Räkna efter, lita inte på svaret. Sjunde gången huset lär sig det:
    // prissynken rapporterade "2 priser uppdaterade" utan att skriva något.
    const efter = await store.getMappingByWixProductId(wixProductId);
    const patch = rå as Patch;
    const verifierat =
      efter !== null
      && (patch.needsAiPolish === undefined || efter.needsAiPolish === patch.needsAiPolish)
      && (patch.draftStatus === undefined || efter.draftStatus === patch.draftStatus)
      // Alla id här är kända — okända avvisades ovan utan att något skrevs.
      && Object.entries(patch.variantSkus ?? {}).every(([id, sku]) =>
        efter.variants.some((v) => v.wixVariantId === id && v.sku === sku),
      );

    if (!verifierat) {
      console.error(`[mapping] POST ${wixProductId}: skrivningen tog inte`);
      return NextResponse.json(
        {
          ok: false,
          error: "Skrivningen gick igenom men läste inte tillbaka som förväntat.",
          efter,
        },
        { status: 500 },
      );
    }

    console.log(
      `[mapping] ${wixProductId} uppdaterad: ${Object.keys(rå).join(", ")}`
        + (okändaVariantIds.length ? ` (okända variant-id: ${okändaVariantIds.join(", ")})` : ""),
    );

    return NextResponse.json({
      ok: true,
      wixProductId,
      ändrat: Object.keys(rå),
      // Ett wixVariantId som inte finns på raden är inte ett fel som fäller —
      // men det skrevs ingenting för det, och då ska anroparen få veta.
      okändaVariantIds,
      mappning: efter,
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error(`[mapping] POST ${wixProductId} misslyckades: ${msg.slice(0, 300)}`);
    return NextResponse.json({ ok: false, error: msg.slice(0, 300) }, { status: 500 });
  }
}
