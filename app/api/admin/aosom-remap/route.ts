// POST /api/admin/aosom-remap — pekar om EN Wix-produkt från AliExpress till
// Aosoms feed, och pensionerar valfritt dubblettsidan.
//
// Bakgrunden och spärrarnas motiv bor i lib/aosom/remap.ts och är testade där.
// Rutten är bara transporten: hämta feeden, läs raden, planera, skriv.
//
//   POST { wixProductId, sku?, duplicateWixProductId?, behallVariant?, apply? }
//
// `behallVariant` är Wix-variant-id:t för den variant som finns hos Aosom, på
// en sida med flera varianter. De andra varianterna tas då bort i Wix och på
// mappningsraden före bytet (lib/aosom/remap-kollaps.ts). Utelämnat vägras en
// flervariantssida som förut.
//
// `sku` får utelämnas när dubbletten är ett Aosom-utkast: då läses numret ur
// dubblettens mappningsrad (`väljRemapSku`), och det behöver aldrig passera
// en workflow-input eller en publik Actions-logg.
//
// ☠️ TORRKÖRNING ÄR DEFAULT. Utan `apply: true` skrivs ingenting alls — du får
// planen med ny landad kostnad, ny marginal och eventuella hinder. Samma
// hållning som prisreparationen och Aosom-importen: ett byte som når kassan
// ska ha passerat ögon.
//
// ☠️ EN PRODUKT PER ANROP, ALDRIG EN KLUMP. Paret (wixProductId, sku) är en
// människas bedömning av att två sidor är samma fysiska vara — mått,
// produkttyp och bilder. Det finns med flit ingen "hitta alla dubbletter och
// mappa om"-flagga: en felgissning byter leverantör på fel produkt, och då
// beställs fel artikel hem till en kund.
//
// Auth följer huset: CRON_SECRET (så en GitHub-workflow kan möta rutten utan
// att hemligheten passerar chatten) eller EXTENSION_API_TOKEN.

import { type NextRequest, NextResponse } from "next/server";
import { isAuthorized } from "@/lib/auth";
import { getStore } from "@/lib/store/factory";
import { getPricingRules } from "@/lib/store/pricing-config";
import { eurToSekFromEnv } from "@/lib/config";
import { fetchAosomFeed } from "@/lib/aosom/feed";
import { getV3ProductPris, getV3VariantPriser } from "@/lib/wix/v3-products";
import { skapaWixAnrop } from "@/lib/polish/skrivplan-wix";
import {
  KOLLAPS_FALT,
  kollapsaMappning,
  kollapsaWix,
  planeraKollaps,
  produktAv,
  type KollapsPlan,
} from "@/lib/aosom/remap-kollaps";
import {
  pensioneraDubblett,
  planeraOmmappning,
  tillämpaOmmappning,
  väljRemapSku,
} from "@/lib/aosom/remap";

export const runtime = "nodejs";
export const maxDuration = 120;

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

  let body: {
    wixProductId?: string;
    sku?: string;
    duplicateWixProductId?: string;
    behallVariant?: string;
    apply?: boolean;
    minMarginPct?: number;
  } = {};
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "Ogiltig JSON" }, { status: 400 });
  }

  const wixProductId = body.wixProductId?.trim();
  const dubblett = body.duplicateWixProductId?.trim() || undefined;
  const behallVariant = body.behallVariant?.trim() || undefined;
  const apply = body.apply === true;
  // ☠️ MARGINALGOLVET GAR ATT SANKA, MEN BARA MEDVETET OCH PER ANROP.
  // Leonards beslut 2026-09-05: alla Aosom-varor kopta via AliExpress ska peka
  // om till Aosoms feed "oavsett om de ar billigare eller inte". Golvet finns
  // anda kvar som DEFAULT — en ommappning som gar med forlust ska krava att
  // nagon skriver ner siffran, och den hamnar i audit-raden. Ett tyst
  // bortkopplat golv hade varit samma sak som inget golv.
  const minMarginPct = Number.isFinite(body.minMarginPct as number)
    ? (body.minMarginPct as number)
    : undefined;

  if (!wixProductId) {
    return NextResponse.json(
      { ok: false, error: "wixProductId krävs" },
      { status: 400 },
    );
  }
  if (dubblett === wixProductId) {
    return NextResponse.json(
      { ok: false, error: "duplicateWixProductId är samma produkt som ska behållas" },
      { status: 400 },
    );
  }

  try {
    const store = getStore();
    // Artikelnumret: angivet, eller ur dubblettens rad. Se väljRemapSku —
    // olika nummer på de två ställena vägras i stället för att ett väljs tyst.
    const dubblettensRad = dubblett ? await store.getMappingByWixProductId(dubblett) : null;
    const skuVal = väljRemapSku(body.sku, dubblettensRad);
    if (!skuVal.ok) {
      return NextResponse.json({ ok: false, error: skuVal.fel }, { status: 400 });
    }
    const sku = skuVal.sku;
    const wix = skapaWixAnrop();
    // ☠️ BUTIKENS PRIS AR FACIT. Mappningens `grossSek` ar vad vi TROR att
    // kunden ser. Glider de isar raknar marginalgrinden pa fel underlag och
    // faller en lonsam ommappning — uppmatt pa kontorsstolen f13cd415
    // 2026-09-05. Ett LASFEL far dock inte se ut som "inget pris": da faller vi
    // tillbaka pa mappningen och sager det i `prisKalla`, i stallet for att
    // avbryta hela ommappningen for en prisfraga.
    //
    // Med `behallVariant` är facit den behållna VARIANTENS pris, inte
    // produktens: en flervariantssida kan ha olika pris per färg, och då har
    // produkten inget entydigt pris alls.
    const [rader, alla, mappning, regler, butikensPrisSek, produkt, oppnaOrdrar] = await Promise.all([
      fetchAosomFeed(),
      store.listMappings(),
      store.getMappingByWixProductId(wixProductId),
      getPricingRules(),
      (behallVariant
        ? getV3VariantPriser(wixProductId).then((m) => m.get(behallVariant) ?? null)
        : getV3ProductPris(wixProductId).then((p) => p.priceSek)
      ).catch(() => null),
      behallVariant
        ? wix("GET", `/stores/v3/products/${encodeURIComponent(wixProductId)}?${KOLLAPS_FALT}`).then(produktAv)
        : Promise.resolve(null),
      // Samma urval som sammanslagningens `oppnaOrdrar`: ordrar som ännu inte
      // lagts hos leverantören.
      behallVariant
        ? store.listTasks().then((t) => t.filter((x) => x.wixCatalogItemId === wixProductId
          && (x.status === "pending" || x.status === "pending_payment")).length)
        : Promise.resolve(0),
    ]);

    const rad = rader.find((r) => r.sku === sku);
    const fx = { eurToSek: eurToSekFromEnv(), usdToSek: regler.usdToSek };
    const plan = planeraOmmappning({
      mappning, rad, alla, fx, dubblett, butikensPrisSek, minMarginPct, behallVariant,
    });
    const kollaps: KollapsPlan | null = behallVariant
      ? planeraKollaps({ produkt, mappning, behallVariant, oppnaOrdrar })
      : null;

    if (plan.hinder.length > 0 || (kollaps?.hinder.length ?? 0) > 0) {
      return NextResponse.json(
        { ok: false, torrkörning: !apply, plan, kollaps, skuKalla: skuVal.kalla },
        { status: 422 },
      );
    }
    if (!apply) {
      return NextResponse.json({ ok: true, torrkörning: true, plan, kollaps, skuKalla: skuVal.kalla });
    }

    // ☠️ WIX FÖRST, MAPPNINGEN BARA OM WIX LÄSTE TILLBAKA RÄTT. En mappning med
    // en variant mot en Wix-produkt med tre hade låtit synken nolla de två
    // okända varianterna (`okandaVarianter`), och en order på dem hade inte
    // gått att lägga. En omkörning ser att Wix är klar och gör bara mappningen.
    if (kollaps && behallVariant) {
      const k = await kollapsaWix(wix, wixProductId, behallVariant, { kostnadSek: plan.nyLandadSek });
      if (!k.ok) {
        return NextResponse.json(
          {
            ok: false,
            error: "Wix läste inte tillbaka som kollapsad — mappningen skrevs INTE. "
              + "Kör om: en omkörning ser om Wix hunnit bli klar.",
            skal: k.skal,
            steg: k.steg,
            plan,
            kollaps,
          },
          { status: 500 },
        );
      }
    }

    // Skrivningen. `mappning` och `rad` är garanterat satta här — hinderlistan
    // ovan innehåller "ingen_mappning"/"saknas_i_feeden" annars.
    const utgangsrad = behallVariant ? kollapsaMappning(mappning!, behallVariant) : mappning!;
    await store.saveMapping(tillämpaOmmappning(utgangsrad, rad!, fx));

    let dubblettPensionerad: string | null = null;
    if (dubblett) {
      const d = await store.getMappingByWixProductId(dubblett);
      if (d) {
        await store.saveMapping(pensioneraDubblett(d));
        dubblettPensionerad = dubblett;
      }
    }

    // ☠️ LÄS TILLBAKA OCH RÄKNA EFTER. Sjunde gången huset lär sig samma sak:
    // ett svar utan fel är inget kvitto. Både bildreparationen ("524 lagade,
    // 214 saknade ändå bilder") och prissynken ("2 priser uppdaterade" mot ett
    // orört Wix) rapporterade framgång på en skrivning som aldrig tog.
    const efter = await store.getMappingByWixProductId(wixProductId);
    const skrevs = efter?.supplierProductId === `aosom:${sku}` && efter?.supplier === "aosom"
      && (!behallVariant
        || ((efter?.variants ?? []).length === 1 && efter?.variants[0]?.wixVariantId === behallVariant));
    if (!skrevs) {
      return NextResponse.json(
        {
          ok: false,
          error: "Skrivningen gick igenom utan fel men raden bär inte det nya "
            + "artikelnumret vid återläsning. Ingenting är verifierat — kör om.",
          plan,
          lästeTillbaka: {
            supplierProductId: efter?.supplierProductId ?? null,
            supplier: efter?.supplier ?? null,
            varianter: efter?.variants?.length ?? null,
          },
        },
        { status: 500 },
      );
    }

    await store.appendAudit({
      at: new Date().toISOString(),
      kind: "aosom-remap",
      ref: wixProductId,
      detail: `${plan.frånLeverantör} → aosom:${sku} `
        + `landat ${plan.gammalLandadSek ?? "?"} → ${plan.nyLandadSek} kr `
        + `marginal ${plan.gammalMarginalPct ?? "?"} → ${plan.nyMarginalPct} % `
        + `(pris ${plan.prisSek} kr ur ${plan.prisKalla}`
        + (minMarginPct == null ? "" : `, golv ${minMarginPct} %`) + ") "
        + (kollaps
          ? `kollapsad till ${behallVariant} (${kollaps.behallVal.join("/") || "utan val"}), `
            + `${kollaps.borttagna.length} varianter bort `
          : "")
        + (dubblettPensionerad ? `dubblett ${dubblettPensionerad} pensionerad` : "utan dubblett"),
    });

    return NextResponse.json({
      ok: true,
      torrkörning: false,
      plan,
      skuKalla: skuVal.kalla,
      kollaps,
      dubblettPensionerad,
    });
  } catch (e) {
    return NextResponse.json(
      { ok: false, error: e instanceof Error ? e.message : String(e) },
      { status: 500 },
    );
  }
}
