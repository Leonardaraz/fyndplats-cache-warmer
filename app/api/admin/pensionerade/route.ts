// GET /api/admin/pensionerade — radera pensionerade Aosom-utkast ur Wix (2026-09-28).
//
//   ?lage=plan                                    (default) vad skulle raderas, och varför inte resten
//   ?lage=stampla                                 hur många pensionerade rader saknar tidsstämpel
//   ?lage=stampla&skarp=ja&bekrafta=N             starta klockan på dem — N är planens antal
//   ?lage=radera                                  samma som plan
//   ?lage=radera&skarp=ja&bekrafta=N[&limit=25]   radera — N är planens antal raderbara
//   ?lage=radera&skarp=ja&hogst=K&per=<ISO>       följande varv — K är det som återstod
//   &per=<ISO>                                    räkna åldern mot den tiden (se nedan)
//
// VAD SOM RADERAS. En Wix-produkt vars mappningsrad är en pensionerad Aosom-rad
// (`draftStatus: rejected`), som pensionerades för minst MIN_ALDER_DAGAR sedan,
// som är DOLD i butiken, som ingen order har köpt, som inte står i en auktion
// och som ingen omdirigering pekar på. Logiken och alla skäl står i
// lib/aosom/pensionerade.ts.
//
// ☠️ MAPPNINGSRADEN RADERAS INTE. Den märks (`wixRaderad`), och artikeln flyttas
// till `importSparr` så att nattens import inte skapar utkastet igen.
//
// ☠️ BILDFILERNA RADERAS INTE HÄR. Kör bildstädningen (läget `bildstadning`)
// efteråt — den räknar varje fil som en produkt, kategori eller recension
// använder som använd, och tar resten.
//
// `per` LÅSER PLANENS KLOCKA mellan workflowens varv. Utan den kan en produkt
// passera åldersgränsen mitt i en lång körning, planen växer med en, och
// `bekrafta` slutar stämma — ett stopp som ser ut som ett fel men bara är
// klockan. `per` får bara ligga BAKÅT i tiden: en tidigare klocka gör färre
// produkter raderbara, aldrig fler. En framtida tid vägras.
//
// `hogst` ÄR TAKET FÖR WORKFLOWENS FÖLJANDE VARV. Första varvet godkänns med
// `bekrafta` = planens exakta antal. Därefter skickar workflowen det som
// återstod, och planen får vara lika stor eller MINDRE — en produkt som blivit
// synlig eller en radering som syntes först i nästa svep krymper den — men
// aldrig större. `hogst` kräver `per`: utan en låst klocka kan planen växa av
// att tiden går, och då är taket inte längre det en människa godkände.
//
// ☠️ SVARET BÄR ALDRIG ARTIKELNUMMER, NAMN ELLER SLUGGAR. Det hamnar i en publik
// Actions-logg; utkastens namn och sluggar är Aosoms tyska titlar. Bara wix-id
// och räknare.

import { type NextRequest, NextResponse } from "next/server";
import { isAuthorized } from "@/lib/auth";
import { audit } from "@/lib/audit";
import { getStore } from "@/lib/store/factory";
import {
  BekraftaFel,
  MIN_ALDER_DAGAR,
  UnderlagFel,
  lasUnderlag,
  planera,
  radera,
  stampla,
  type KorDeps,
  type Plan,
  type UnderlagIo,
} from "@/lib/aosom/pensionerade";
import {
  collectCategoryMediaIds,
  countProducts,
  getFileStates,
  headlessSiteId,
  listCatalogProductMedia,
} from "@/lib/wix/media-audit";
import { deleteV3Product, lasProduktForRadering, v3ProduktFinns } from "@/lib/wix/v3-products";
import { listRedirects } from "@/lib/wix/redirects";
import { queryAuctions } from "@/lib/auction/store";

export const runtime = "nodejs";
export const maxDuration = 300;

/** Räknad från requestens början — svep, kontroller och raderingar ska rymmas. */
const TIDSBUDGET_MS = 240_000;
/** Svepet får högst så här mycket av budgeten; resten är raderingarnas. */
const SVEP_BUDGET_MS = 120_000;

function auktoriserad(req: NextRequest): boolean {
  if (isAuthorized(req)) return true;
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;
  return (req.headers.get("authorization") ?? "") === `Bearer ${secret}`;
}

function liveIo(t0: number): UnderlagIo {
  const sajt = headlessSiteId();
  const store = getStore();
  return {
    listMappings: () => store.listMappings(),
    lasKatalog: () => listCatalogProductMedia(sajt, { deadline: t0 + SVEP_BUDGET_MS }),
    raknaProdukter: () => countProducts(sajt),
    listaKategoribilder: async () => [...await collectCategoryMediaIds(sajt)],
    listTasks: async () =>
      (await store.listTasks()).map((t) => ({ wixCatalogItemId: t.wixCatalogItemId, sku: t.sku })),
    listAktivaAuktioner: async () =>
      (await queryAuctions(["queued", "live"])).map((a) => ({ productId: a.productId })),
    listOmdirigeringar: async (max) => (await listRedirects(max)).map((r) => ({ toPath: r.toPath })),
  };
}

function liveDeps(): KorDeps {
  const sajt = headlessSiteId();
  const store = getStore();
  return {
    getMapping: (id) => store.getMappingByWixProductId(id),
    saveMapping: (m) => store.saveMapping(m),
    lasProdukt: (id) => lasProduktForRadering(id),
    raderaProdukt: (id) => deleteV3Product(id),
    produktFinns: (id) => v3ProduktFinns(id),
    filstatus: (nycklar) => getFileStates(sajt, nycklar),
    paus: (ms) => new Promise((r) => setTimeout(r, ms)),
  };
}

/** Planen som den skrivs ut — räknare och wix-id, inget annat. */
function sammanfatta(plan: Plan) {
  return {
    minAlderDagar: MIN_ALDER_DAGAR,
    pensionerade: plan.pensionerade,
    raderbara: plan.raderbara.length,
    saknasIWix: plan.saknasIWix.length,
    utanTidsstampel: plan.utanTidsstampel.length,
    hinder: plan.hinder,
    nastaRaderbar: plan.nastaRaderbar,
    aldstaPensionering: plan.raderbara.map((r) => r.pensioneradAt).sort()[0] ?? null,
    bilder: plan.bilder,
    omdirigeringarFullstandiga: plan.omdirigeringarFullstandiga,
    forstaRaderbara: plan.raderbara.slice(0, 20).map((r) => r.wixProductId),
  };
}

export async function GET(req: NextRequest) {
  const t0 = Date.now();
  if (!auktoriserad(req)) {
    return NextResponse.json({ ok: false, error: "Otillåten" }, { status: 401 });
  }
  const sp = req.nextUrl.searchParams;
  const lage = sp.get("lage") ?? "plan";
  if (!["plan", "stampla", "radera"].includes(lage)) {
    return NextResponse.json({ ok: false, error: "lage ska vara plan, stampla eller radera" }, { status: 400 });
  }
  const skarp = sp.get("skarp") === "ja";
  const bekrafta = (sp.get("bekrafta") ?? "").trim();
  const perParam = (sp.get("per") ?? "").trim();
  const per = perParam ? Date.parse(perParam) : null;
  if (per !== null && (!Number.isFinite(per) || per > Date.now())) {
    return NextResponse.json(
      { ok: false, error: "per ska vara en tidpunkt som redan passerat (ISO)" },
      { status: 400 },
    );
  }
  const hogstParam = sp.get("hogst");
  let hogst: number | undefined;
  if (hogstParam !== null) {
    if (lage !== "radera") {
      return NextResponse.json({ ok: false, error: "hogst gäller bara lage=radera" }, { status: 400 });
    }
    if (per === null) {
      return NextResponse.json(
        { ok: false, error: "hogst kräver per — utan en låst klocka kan planen växa av att tiden går" },
        { status: 400 },
      );
    }
    hogst = /^\d+$/.test(hogstParam.trim()) ? Number(hogstParam.trim()) : Number.NaN;
  }

  // Bildstädningen läser WIX_SITE_ID när den är satt; raderingen läser butikens
  // sajt. Pekar de på olika sajter tar städningen inte de filer raderingen
  // frigör — det ska stå i svaret, inte upptäckas i efterhand.
  const sammaSajtSomBildstadningen = !process.env.WIX_SITE_ID || process.env.WIX_SITE_ID === headlessSiteId();

  let u;
  try {
    u = await lasUnderlag(liveIo(t0));
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error(`[pensionerade] underlaget: ${msg}`);
    const status = err instanceof UnderlagFel ? 503 : 500;
    return NextResponse.json(
      { ok: false, lage, error: err instanceof UnderlagFel ? msg : "underlaget gick inte att läsa" },
      { status },
    );
  }
  if (per !== null) u = { ...u, nu: new Date(per) };
  const plan = planera(u);
  const bas = {
    ok: true,
    lage,
    skarp,
    per: u.nu.toISOString(),
    sammaSajtSomBildstadningen,
    ...sammanfatta(plan),
  };

  console.log(
    `[pensionerade] ${lage.toUpperCase()} ${skarp ? "SKARP" : "TORR"}: ${plan.pensionerade} pensionerade, `
      + `${plan.raderbara.length} raderbara, ${plan.saknasIWix.length} saknas i Wix, `
      + `${plan.utanTidsstampel.length} utan tidsstämpel, hinder ${JSON.stringify(plan.hinder)}`,
  );

  if (lage === "plan" || !skarp) return NextResponse.json(bas);

  try {
    if (lage === "stampla") {
      const r = await stampla(liveDeps(), plan, { bekrafta });
      await audit(
        "pensionerade",
        "stampla",
        `${r.stamplade} rader fick tidsstämpel, ${r.hoppade} hoppade, ${r.skrivfel} skrivfel`,
      );
      return NextResponse.json({ ...bas, ...r });
    }

    const limitParam = Number(sp.get("limit"));
    const r = await radera(liveDeps(), u, plan, {
      // Båda skickas vidare som de kom; logiken vägrar när båda eller ingen finns.
      bekrafta: sp.get("bekrafta") !== null ? bekrafta : undefined,
      hogst,
      limit: Number.isFinite(limitParam) && limitParam > 0 ? limitParam : undefined,
      timeBudgetMs: Math.max(0, TIDSBUDGET_MS - (Date.now() - t0)),
    });
    const kvar = plan.raderbara.length - r.raderade.length;
    await audit(
      "pensionerade",
      "radera",
      `${r.raderade.length} raderade, ${r.markeradeUtanRadering.length} redan borta, `
        + `${r.obekraftade.length} obekräftade, ${r.markeringsfel.length} märkningsfel, kvar ${kvar}, `
        + `stopp ${r.stoppadAv}${r.fel ? ` (${r.fel})` : ""}`,
    );
    return NextResponse.json({
      ...bas,
      raderade: r.raderade.length,
      markeradeUtanRadering: r.markeradeUtanRadering.length,
      obekraftade: r.obekraftade,
      markeringsfel: r.markeringsfel,
      hoppadeVidKontroll: r.hoppadeVidKontroll,
      stoppadAv: r.stoppadAv,
      fel: r.fel,
      kvar,
      raderadeIds: r.raderade,
    });
  } catch (err) {
    if (err instanceof BekraftaFel) {
      return NextResponse.json(
        { ...bas, ok: false, error: err.message, rad: "Kör planen igen, läs den, och skicka DESS antal." },
        { status: 400 },
      );
    }
    const msg = err instanceof Error ? err.message : String(err);
    console.error(`[pensionerade] ${lage}: ${msg}`);
    return NextResponse.json({ ...bas, ok: false, error: "körningen föll — se Vercel-loggen" }, { status: 500 });
  }
}
