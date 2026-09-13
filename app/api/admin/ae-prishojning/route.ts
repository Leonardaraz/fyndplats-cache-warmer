// GET /api/admin/ae-prishojning — höj priset på AliExpress-halvan med X %.
//
// Ingenting annat i repot kan göra det: `price-repair` rättar bara varianter
// som delar inköpspris, och Aosom-synken rör bara Aosom-rader. Höjningen är
// dessutom MENINGSFULL bara på AE-halvan — en Aosom-rad hade fått sitt
// regelpris tillbakaskrivet inom sex timmar.
//
//   ?pct=10&kampanj=hostpris-10                      → torrkörning (plan)
//   ?pct=10&kampanj=hostpris-10&dryRun=false&bekrafta=<summa>   → skriver
//
// ☠️ TORRKÖRNING ÄR DEFAULT, och skrivningen kräver planens kontrollsumma.
// Prisreparationens regel är att det inte finns någon kör-allt-flagga: listan
// med id:n är kvitteringen på att en människa läst planen, för ett pris som
// når kund ska ha passerat ögon. På tusen rader vore en uppräkning teater —
// kontrollsumman gör samma jobb mekaniskt. Du kan bara godkänna den plan du
// faktiskt fick se, och har katalogen rört sig sedan dess stämmer den inte.
//
// ☠️ OCH DEN RÄKNAS OM I SAMMA ANROP SOM SKRIVER. En kontroll i ett eget,
// tidigare anrop bevisar bara att just DEN planen såg rätt ut — samma skäl som
// transkriberingsspärren i poleringen måste ligga i skrivanropet självt.
//
// ☠️ KOSTNADEN RÖRS ALDRIG. Till skillnad från `price-repair`, där inköpspriset
// var FEL och alla tre fälten måste skrivas, är kostnaden här oförändrad — det
// är bara kundens pris som ändras. `costUsd` och `landedCostSek` lämnas därför
// orörda, och `costAmount` skickas inte till Wix: det hade skrivit om Wix egen
// marginalrapport med ett tal som ingen mätt om.
//
// Auth följer huset: CRON_SECRET (så en GitHub-workflow kan möta rutten utan
// att hemligheten passerar chatten) eller EXTENSION_API_TOKEN.

import { type NextRequest, NextResponse } from "next/server";
import { isAuthorized } from "@/lib/auth";
import { getStore } from "@/lib/store/factory";
import type { ProductMappingRecord } from "@/lib/store";
import { getPricingRules } from "@/lib/store/pricing-config";
import { listV3ProductPrices, updateV3VariantPrices } from "@/lib/wix/v3-products";
import {
  MIN_WIX_PRODUKTER,
  OgiltigHojning,
  planeraPrishojning,
  validateraPct,
  type HojningRad,
} from "@/lib/pricing/ae-prishojning";

export const runtime = "nodejs";
export const maxDuration = 300;

/** Paus mellan skrivningar. Samma medicin som `AOSOM_WRITE_DELAY_MS`. */
const SKRIV_PAUS_MS = Number(process.env.AOSOM_WRITE_DELAY_MS ?? 120);

/**
 * Tidsbudget. Rutten har 300 s; vi lämnar marginal så svaret hinner ut.
 *
 * ☠️ Utan den kunde en körning dödas mitt i skopan: priserna ÄR skrivna men
 * inget svar kommer tillbaka, och nästa körning vet inte vad som hände. Samma
 * skäl som media-städningen är tidsbudgeterad. Kampanjstämpeln gör visserligen
 * omkörningen ofarlig, men ett svar man kan läsa är ändå billigare.
 */
const TIDSBUDGET_MS = 240_000;

function auktoriserad(req: NextRequest): boolean {
  if (isAuthorized(req)) return true;
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;
  return (req.headers.get("authorization") ?? "") === `Bearer ${secret}`;
}

function sov(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

/** Prisband — ger en känsla för planen utan att lista tusen rader. */
function band(rader: readonly HojningRad[]) {
  if (rader.length === 0) return null;
  const diff = rader.map((r) => r.till - r.fran).sort((a, b) => a - b);
  const fran = rader.map((r) => r.fran).sort((a, b) => a - b);
  const p = (xs: number[], q: number) => xs[Math.min(xs.length - 1, Math.floor(xs.length * q))];
  return {
    lagstaPris: fran[0],
    medianPris: p(fran, 0.5),
    hogstaPris: fran[fran.length - 1],
    minstaHojning: diff[0],
    medianHojning: p(diff, 0.5),
    storstaHojning: diff[diff.length - 1],
    summaHojning: Math.round(diff.reduce((a, b) => a + b, 0)),
  };
}

export async function GET(req: NextRequest) {
  if (!auktoriserad(req)) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const sp = req.nextUrl.searchParams;

  let pct: number;
  try {
    pct = validateraPct(sp.get("pct"));
  } catch (err) {
    if (err instanceof OgiltigHojning) {
      return NextResponse.json({ error: err.message }, { status: 400 });
    }
    throw err;
  }

  // ☠️ `kampanj` har ingen default, av exakt samma skäl som `pct`. Namnet ÄR
  // idempotensen: utan det kan en omkörning inte se vad som redan är höjt, och
  // ett autogenererat datum hade gett ett nytt namn vid varje försök — alltså
  // en ny höjning ovanpå den förra.
  const kampanj = (sp.get("kampanj") ?? "").trim();
  if (!kampanj) {
    return NextResponse.json(
      { error: "kampanj saknas — namnge höjningen, t.ex. ?kampanj=hostpris-10. Namnet är det som gör en omkörning ofarlig." },
      { status: 400 },
    );
  }

  const dryRun = sp.get("dryRun") !== "false";
  const limit = Math.max(1, Number(sp.get("limit") ?? 400));

  const store = getStore();
  const [mappningar, rules] = await Promise.all([store.listMappings(), getPricingRules()]);
  const wixPriser = await listV3ProductPrices();

  // ☠️ En halvläst prislista ser ut som "de här produkterna saknar pris" och
  // hade gjort hela höjningen till en tyst no-op med grönt kvitto. Här är
  // avbrott rätt svar: en utebliven prishöjning är ofarlig, en halv är inte.
  if (wixPriser.size < MIN_WIX_PRODUKTER) {
    return NextResponse.json(
      {
        error: `prislistan gav bara ${wixPriser.size} produkter (golv ${MIN_WIX_PRODUKTER}) — läsfel, ingenting planerat`,
      },
      { status: 500 },
    );
  }

  const plan = planeraPrishojning(mappningar, wixPriser, pct, rules.rounding, kampanj);

  const sammanfattning = {
    pct,
    kampanj,
    avrundning: rules.rounding,
    granskade: plan.granskade,
    attHoja: plan.rader.length,
    ejAliExpress: plan.ejAliExpress,
    prisLasta: plan.prisLasta,
    utanWixPris: plan.utanWixPris,
    variantavvikelse: plan.variantavvikelse,
    redanHojda: plan.redanHojda,
    ejNiokrona: plan.ejNiokrona,
    oforandrade: plan.oforandrade,
    drivande: plan.drivande,
    summa: plan.summa,
    band: band(plan.rader),
  };

  if (dryRun) {
    console.log(
      `[ae-prishojning] TORR pct=${pct} kampanj=${kampanj} ${plan.granskade} granskade, `
      + `${plan.rader.length} att höja, ${plan.ejAliExpress} ej-AE, ${plan.prisLasta} prislåsta, `
      + `${plan.utanWixPris} utan butikspris, ${plan.variantavvikelse} variantavvikelse, `
      + `${plan.redanHojda} redan höjda, ${plan.ejNiokrona} ej niokrona, `
      + `${plan.oforandrade} oförändrade, summa=${plan.summa}`,
    );
    return NextResponse.json({
      ...sammanfattning,
      dryRun: true,
      // Ett urval, inte hela listan: svaret hamnar i en PUBLIK Actions-logg.
      // Priser är publika, men en fullständig katalogdump är ändå onödig.
      exempel: plan.rader.slice(0, 20),
    });
  }

  const bekrafta = (sp.get("bekrafta") ?? "").trim();
  if (bekrafta !== plan.summa) {
    return NextResponse.json(
      {
        error: "bekrafta stämmer inte med planens kontrollsumma — ingenting skrivet",
        fick: bekrafta || null,
        vantat: plan.summa,
        rad: "Kör torrläget igen, läs planen, och skicka DESS summa.",
        ...sammanfattning,
      },
      { status: 409 },
    );
  }

  const start = Date.now();
  let hojda = 0;
  let misslyckade = 0;
  const fel: Array<{ wixProductId: string; skal: string }> = [];
  let stoppadAv: "klart" | "limit" | "tidsbudget" = "klart";

  for (const rad of plan.rader) {
    if (hojda + misslyckade >= limit) {
      stoppadAv = "limit";
      break;
    }
    if (Date.now() - start > TIDSBUDGET_MS) {
      stoppadAv = "tidsbudget";
      break;
    }

    try {
      // ☠️ WIX FÖRE MAPPNINGEN, samma ordning och samma skäl som price-repair.
      // Går bara den ena igenom står kunden inför rätt pris medan bokföringen
      // släpar — nästa körning rättar det. Omvänd ordning hade gjort mappningen
      // "höjd" medan kunden köper till det gamla priset, och då hittar ingen
      // felet igen.
      //
      // `costAmount` skickas medvetet INTE: kostnaden har inte ändrats.
      const utfall = await updateV3VariantPrices(
        rad.wixProductId,
        rad.variantIds.map((wixVariantId) => ({ wixVariantId, actualPrice: rad.till })),
      );

      // ☠️ Returvärdet LÄSES. `updateV3VariantPrices` kastar inte på en omatchad
      // nyckel — den hoppar över PATCH:en och returnerar {updated: 0}. Att slänga
      // det var precis buggen som gjorde att prissynken inte skrev ett enda pris
      // på en månad medan den rapporterade framgång.
      if (utfall.updated !== rad.variantIds.length) {
        throw new Error(
          `skrev ${utfall.updated} av ${rad.variantIds.length} varianter `
          + `(omatchade: ${utfall.missing.join(", ") || "inga"}) — priset är halvt eller orört`,
        );
      }

      const m = mappningar.find((x: ProductMappingRecord) => x.wixProductId === rad.wixProductId);
      if (m) {
        await store.saveMapping({
          ...m,
          variants: (m.variants ?? []).map((v: ProductMappingRecord["variants"][number]) => ({ ...v, grossSek: rad.till })),
          prishojning: { kampanj, fran: rad.fran, till: rad.till, nar: new Date().toISOString() },
        });
      }
      hojda++;
    } catch (err) {
      misslyckade++;
      fel.push({
        wixProductId: rad.wixProductId,
        skal: err instanceof Error ? err.message : String(err),
      });
    }

    await sov(SKRIV_PAUS_MS);
  }

  const kvar = plan.rader.length - hojda - misslyckade;
  console.log(
    `[ae-prishojning] SKARP pct=${pct} kampanj=${kampanj} ${hojda} höjda, `
    + `${misslyckade} misslyckade, ${kvar} kvar, stoppad på ${stoppadAv}`,
  );

  return NextResponse.json({
    ...sammanfattning,
    dryRun: false,
    hojda,
    misslyckade,
    kvar,
    stoppadAv,
    fel: fel.slice(0, 25),
  });
}
