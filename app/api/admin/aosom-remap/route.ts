// POST /api/admin/aosom-remap — pekar om EN Wix-produkt från AliExpress till
// Aosoms feed, och pensionerar valfritt dubblettsidan.
//
// Bakgrunden och spärrarnas motiv bor i lib/aosom/remap.ts och är testade där.
// Rutten är bara transporten: hämta feeden, läs raden, planera, skriv.
//
//   POST { wixProductId, sku, duplicateWixProductId?, apply? }
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
import { getV3ProductPris } from "@/lib/wix/v3-products";
import {
  pensioneraDubblett,
  planeraOmmappning,
  tillämpaOmmappning,
} from "@/lib/aosom/remap";

export const runtime = "nodejs";
export const maxDuration = 60;

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
    apply?: boolean;
    minMarginPct?: number;
  } = {};
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "Ogiltig JSON" }, { status: 400 });
  }

  const wixProductId = body.wixProductId?.trim();
  const sku = body.sku?.trim();
  const dubblett = body.duplicateWixProductId?.trim() || undefined;
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

  if (!wixProductId || !sku) {
    return NextResponse.json(
      { ok: false, error: "wixProductId och sku krävs" },
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
    // ☠️ BUTIKENS PRIS AR FACIT. Mappningens `grossSek` ar vad vi TROR att
    // kunden ser. Glider de isar raknar marginalgrinden pa fel underlag och
    // faller en lonsam ommappning — uppmatt pa kontorsstolen f13cd415
    // 2026-09-05. Ett LASFEL far dock inte se ut som "inget pris": da faller vi
    // tillbaka pa mappningen och sager det i `prisKalla`, i stallet for att
    // avbryta hela ommappningen for en prisfraga.
    const [rader, alla, mappning, regler, butikensPrisSek] = await Promise.all([
      fetchAosomFeed(),
      store.listMappings(),
      store.getMappingByWixProductId(wixProductId),
      getPricingRules(),
      getV3ProductPris(wixProductId)
        .then((p) => p.priceSek)
        .catch(() => null),
    ]);

    const rad = rader.find((r) => r.sku === sku);
    const fx = { eurToSek: eurToSekFromEnv(), usdToSek: regler.usdToSek };
    const plan = planeraOmmappning({ mappning, rad, alla, fx, dubblett, butikensPrisSek, minMarginPct });

    if (plan.hinder.length > 0) {
      return NextResponse.json({ ok: false, torrkörning: !apply, plan }, { status: 422 });
    }
    if (!apply) {
      return NextResponse.json({ ok: true, torrkörning: true, plan });
    }

    // Skrivningen. `mappning` och `rad` är garanterat satta här — hinderlistan
    // ovan innehåller "ingen_mappning"/"saknas_i_feeden" annars.
    await store.saveMapping(tillämpaOmmappning(mappning!, rad!, fx));

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
    const skrevs = efter?.supplierProductId === `aosom:${sku}` && efter?.supplier === "aosom";
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
        + (dubblettPensionerad ? `dubblett ${dubblettPensionerad} pensionerad` : "utan dubblett"),
    });

    return NextResponse.json({ ok: true, torrkörning: false, plan, dubblettPensionerad });
  } catch (e) {
    return NextResponse.json(
      { ok: false, error: e instanceof Error ? e.message : String(e) },
      { status: 500 },
    );
  }
}
