// Lägger om en PUBLICERAD AliExpress-rad till dess Aosom-motsvarighet.
//
// ☠️ VARFÖR DEN FINNS
//
// 595 av katalogens 1 004 mappningsrader kommer från "byaosom ES (EU) Store" —
// alltså Aosom-varor vi köper via en AliExpress-återförsäljare. När Aosom-feeden
// importeras skapas ett ANDRA utkast för samma fysiska vara, och dubblettspärren
// kan omöjligt se det: den nycklar på `supplierProductId`, och ett AE-listnings-id
// och ett Aosom-artikelnummer är olika strängar för olika leverantörer.
//
// Rätt svar är inte att publicera båda (två egna URL:er med samma foton är den
// dubblett Google faktiskt straffar) och inte att slänga utkastet (då fortsätter
// vi köpa via mellanhanden). Rätt svar är att peka den LEVANDE sidan — med all
// sin Google-historik — på Aosom-raden, och lämna utkastet osynligt.
//
// ☠️ MEN DET ÄR INTE ALLTID BILLIGARE, OCH DET ÄR HELA POÄNGEN MED GRINDEN.
//
// Aosoms B2B-frakt är PER KOLLI och viktstyrd; AE:s ES-lagerpris är levererat.
// Uppmätt på de fyra första dubbletterna 2026-09-03:
//
//   katthus 96 cm     1 779,65 → 1 374,17 kr   −22,8 %   vinst
//   redskapsskåp      1 617,78 → 1 507,50 kr    −6,8 %   liten vinst
//   agilityset          521,25 →   657,50 kr   +26,1 %   FÖRLUST
//   hundvagn            456,75 →   607,50 kr   +33,0 %   FÖRLUST
//
// Två av fyra hade alltså gjort inköpet DYRARE. Mönstret är feedens eget: SE-
// frakten är i median 40 % av inköpet och slår hårdast på det lätta och billiga.
// Därför räknas deltat FÖRE skrivningen och en fördyring över `MAX_FORDYRING_PCT`
// vägras — inte för att överpröva beslutet, utan för att beslutet ska fattas på
// en siffra i stället för på en förhoppning. `tvingaFordyring` släpper igenom.

import type { ProductMappingRecord } from "./index";
import type { VariantMapping } from "../import/pipeline";
import { isAliExpressMapping, isAosomMapping } from "./supplier";

/**
 * Hur mycket dyrare inköpet får bli innan omläggningen vägras.
 *
 * Noll vore för hårt: växelkurs och feedens avrundning gör att två korrekta
 * beräkningar av samma vara kan skilja någon procent. Tio procent släpper
 * igenom det bruset och stoppar de 26–33 % som mättes ovan.
 */
export const MAX_FORDYRING_PCT = 10;

export type Omlaggningsplan = {
  wixProductId: string;
  /** AE-radens id, sparat så en återställning vet vad den ska tillbaka till. */
  franSupplierProductId: string;
  tillSupplierProductId: string;
  franLandedCostSek: number;
  tillLandedCostSek: number;
  deltaSek: number;
  deltaPct: number;
  /** Raden som ska skrivas. Bara kostnads- och leverantörsfält. */
  patch: Partial<ProductMappingRecord>;
};

export type Omlaggningsfel = { skal: string; detalj?: string };

/** Summan av variantradernas landade kostnad — jämförelsens grund. */
function landad(m: ProductMappingRecord): number {
  const v = m.variants ?? [];
  if (!v.length) return 0;
  return v.reduce((s, x) => s + (Number(x.landedCostSek) || 0), 0) / v.length;
}

/**
 * Planerar en omläggning. Skriver ingenting.
 *
 * ☠️ VARJE VÄGRAN ÄR ETT FEL, INTE ETT TYST HOPP. En omläggning som inte blev
 * av ska synas i svaret med sitt skäl — annars ser en körning där ingenting
 * hände likadan ut som en där allt gick igenom. (Nionde gången i det här
 * huset: ett svar utan fel är inget kvitto.)
 */
export function planeraOmlaggning(
  live: ProductMappingRecord,
  utkast: ProductMappingRecord,
  opts: { tvingaFordyring?: boolean } = {},
): { plan?: Omlaggningsplan; fel?: Omlaggningsfel } {
  if (live.wixProductId === utkast.wixProductId) {
    return { fel: { skal: "samma_produkt", detalj: "live och utkast är samma wixProductId" } };
  }
  if (!isAliExpressMapping(live)) {
    return {
      fel: {
        skal: "live_ar_inte_aliexpress",
        detalj: `live-raden har supplier=${live.supplier ?? "(saknas)"} — `
          + "det finns inget att lägga om. Är den redan Aosom är dubbletten en "
          + "ren utkastdubblett: lämna utkastet osynligt.",
      },
    };
  }
  if (!isAosomMapping(utkast)) {
    return {
      fel: {
        skal: "utkast_ar_inte_aosom",
        detalj: `utkastet har supplier=${utkast.supplier ?? "(saknas)"} — `
          + "omläggningen kräver en Aosom-rad att peka på.",
      },
    };
  }

  const liveV = live.variants ?? [];
  const utkastV = utkast.variants ?? [];
  if (!utkastV.length) {
    return { fel: { skal: "utkast_saknar_varianter" } };
  }
  // ☠️ Antalet måste stämma. En tvåvariantsprodukt som pekas på en
  // envariants-feedrad får två varianter med samma supplierVariantId — och då
  // beställs fel artikel med rätt kvitto. Feeden är en rad per produkt, så en
  // äkta flervariantsprodukt hör inte hemma här alls.
  if (liveV.length !== utkastV.length) {
    return {
      fel: {
        skal: "olika_antal_varianter",
        detalj: `live har ${liveV.length}, utkastet ${utkastV.length}. `
          + "Aosom-feeden är en rad per produkt; en flervariantsprodukt kräver "
          + "en pärning per variant och görs för hand.",
      },
    };
  }

  const fran = landad(live);
  const till = landad(utkast);
  if (!(till > 0)) {
    return {
      fel: {
        skal: "utkast_saknar_kostnad",
        detalj: "utkastets varianter har ingen landedCostSek — utan den finns "
          + "inget att jämföra mot och auktionens golvbud hade blivit noll.",
      },
    };
  }
  const deltaSek = Math.round((till - fran) * 100) / 100;
  const deltaPct = fran > 0 ? Math.round((1000 * deltaSek) / fran) / 10 : 0;

  if (!opts.tvingaFordyring && deltaPct > MAX_FORDYRING_PCT) {
    return {
      fel: {
        skal: "fordyring",
        detalj: `omläggningen höjer inköpet ${deltaPct} % `
          + `(${fran.toFixed(2)} → ${till.toFixed(2)} kr). Aosoms SE-frakt är per `
          + "kolli och slår hårdast på lätta, billiga varor. Skicka "
          + "tvingaFordyring om det ändå är rätt.",
      },
    };
  }

  // Varianterna paras på POSITION här, och det är försvarbart bara för att
  // antalet är kontrollerat till 1 ovanför i praktiken — men skriv aldrig om
  // det till en tyst position-parning för flera varianter.
  const variants: VariantMapping[] = liveV.map((v, i) => ({
    ...v,
    supplierVariantId: utkastV[i].supplierVariantId,
    costUsd: utkastV[i].costUsd,
    landedCostSek: utkastV[i].landedCostSek,
    // ☠️ grossSek ÄR KUNDENS PRIS OCH RÖRS INTE HÄR. Omläggningen ändrar vad
    // varan KOSTAR oss; vad den SÄLJS för är Leonards beslut. Aosom-synken
    // upptäcker skillnaden vid nästa körning och skriver priset då — som en
    // egen, synlig händelse i stället för en tyst följd av den här skrivningen.
    grossSek: v.grossSek,
  }));

  return {
    plan: {
      wixProductId: live.wixProductId,
      franSupplierProductId: live.supplierProductId,
      tillSupplierProductId: utkast.supplierProductId,
      franLandedCostSek: Math.round(fran * 100) / 100,
      tillLandedCostSek: Math.round(till * 100) / 100,
      deltaSek,
      deltaPct,
      patch: {
        supplier: "aosom",
        supplierProductId: utkast.supplierProductId,
        variants,
        ...(utkast.sourceUrl ? { sourceUrl: utkast.sourceUrl } : {}),
        ...(typeof utkast.aosomFreightShare === "number"
          ? { aosomFreightShare: utkast.aosomFreightShare }
          : {}),
      },
    },
  };
}

/**
 * Applicerar planen på live-raden. Rör bara fälten i patchen.
 *
 * ☠️ SEO, slug, bilder, draftStatus och grossSek är ORÖRDA. Sidan är publicerad
 * och rankad — det enda som byter är var varan köps.
 */
export function applicera(
  live: ProductMappingRecord,
  plan: Omlaggningsplan,
): ProductMappingRecord {
  return { ...live, ...plan.patch };
}

/**
 * Kvitto: läs tillbaka raden och verifiera att omläggningen faktiskt tog.
 *
 * ☠️ Räkna efter, lita inte på svaret — huset har brunnit på det fem gånger.
 */
export function verifiera(
  efter: ProductMappingRecord,
  plan: Omlaggningsplan,
): { ok: boolean; avvikelser: string[] } {
  const a: string[] = [];
  if (efter.supplier !== "aosom") a.push(`supplier=${efter.supplier ?? "(saknas)"}`);
  if (efter.supplierProductId !== plan.tillSupplierProductId) {
    a.push(`supplierProductId=${efter.supplierProductId}`);
  }
  if (isAliExpressMapping(efter)) a.push("raden klassas fortfarande som AliExpress");
  const landadEfter = Math.round(landad(efter) * 100) / 100;
  if (Math.abs(landadEfter - plan.tillLandedCostSek) > 0.02) {
    a.push(`landedCostSek=${landadEfter}, väntat ${plan.tillLandedCostSek}`);
  }
  return { ok: a.length === 0, avvikelser: a };
}
