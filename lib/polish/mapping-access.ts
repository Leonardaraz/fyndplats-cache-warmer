// Poleringens läs- och skrivväg mot mappningsraden.
//
// VARFÖR DEN FINNS. Poleringen kördes förr av Claude i chatten mot Wix Data
// direkt: `GET /data/v2/items/{id}?dataCollectionId=FyndplatsMappings` i Steg 3
// och `POST /data/v2/items/save` med HELA raden i Steg 13. Efter migreringen
// (POSTGRES-MIGRATION.md, steg 6) är den kollektionen TÖMD, och båda anropen
// gick sönder på var sitt sätt:
//
//   Läsningen  returnerar ingenting — facit för pris, lager och EU-ribbon är borta.
//   Skrivningen är VÄRRE: en save mot en tömd kollektion SKAPAR en ny rad. Den
//              rapporterar framgång, ingen läser den, produkten kommer tillbaka
//              i kön för alltid och SKU-skrivningen tappas.
//
// FYRA EGENSKAPER SOM INTE SKA TAS BORT
//
// 1. ☠️ SKRIVNINGEN ÄR EN ALLOWLIST, INTE EN HELRADSSKRIVNING. Den gamla
//    mekaniken var "läs raden och skicka tillbaka allt du inte ändrar" — en
//    form där ett glömt fält är en tyst radering. Här NAMNGER anroparen de tre
//    saker poleringen får ändra. Allt annat avvisas; det ignoreras inte tyst,
//    för ett tyst ignorerat fält är exakt hur "svaret sa OK men inget hände"
//    uppstår.
//
// 2. ☠️ DEN SKAPAR ALDRIG EN RAD. Saknas mappningen är det ett fel, inte en
//    inbjudan. Det är precis den föräldralösa raden ovan, och den enda regel
//    som gör skrivvägen ofarligare än den den ersätter.
//
// 3. ☠️ SKU MATCHAS PÅ wixVariantId, ALDRIG PÅ POSITION. Två fält heter `sku`
//    och betyder olika saker — feedens artikelnummer och Wix variant-SKU. Den
//    förväxlingen gjorde att prissynken skrev till ingenting i en månad
//    (CLAUDE.md, 2026-08-29). Positionsmatchning hade återinfört den.
//
// 4. Prisgrinden räknas HÄR, inte i chatten. Steg 4 säger "grossSek ska vara
//    charm9(landedCostSek × 1,20)" och lämnar aritmetiken till läsaren. Samma
//    regel som prissättningen använder körs i stället mot samma
//    `roundPrice`-funktion, så grinden kan inte drifta från prissättningen.

import type { ProductMappingRecord } from "@/lib/store";
import type { PricingConfig } from "@/lib/import/types";
import { roundPrice } from "@/lib/import/pricing";

/** Fälten poleringen får skriva. Allt utanför listan avvisas. */
export const TILLÅTNA_FÄLT = ["needsAiPolish", "draftStatus", "variantSkus"] as const;

export type Patch = {
  needsAiPolish?: boolean;
  draftStatus?: string;
  /** wixVariantId → ny SKU. Matchas på id, aldrig på position. */
  variantSkus?: Record<string, string>;
};

export type PatchFel = { fält: string; skäl: string };

/**
 * Validerar en patch mot allowlisten INNAN något rörs.
 *
 * ☠️ Okända fält är ett FEL, inte något som tyst hoppas över. En polering som
 * skickar `visible: true` i tron att den publicerar produkten ska få veta att
 * den inte gjorde det — inte tro att den lyckades.
 */
export function validera(rå: Record<string, unknown>): PatchFel[] {
  const fel: PatchFel[] = [];

  for (const nyckel of Object.keys(rå)) {
    if (!(TILLÅTNA_FÄLT as readonly string[]).includes(nyckel)) {
      fel.push({
        fält: nyckel,
        skäl: `inte skrivbart härifrån. Tillåtna: ${TILLÅTNA_FÄLT.join(", ")}`,
      });
    }
  }

  if ("needsAiPolish" in rå && typeof rå.needsAiPolish !== "boolean") {
    fel.push({ fält: "needsAiPolish", skäl: "måste vara boolean" });
  }
  if ("draftStatus" in rå && typeof rå.draftStatus !== "string") {
    fel.push({ fält: "draftStatus", skäl: "måste vara sträng" });
  }
  if ("variantSkus" in rå) {
    const v = rå.variantSkus;
    if (typeof v !== "object" || v === null || Array.isArray(v)) {
      fel.push({ fält: "variantSkus", skäl: "måste vara ett objekt wixVariantId → sku" });
    } else {
      for (const [id, sku] of Object.entries(v as Record<string, unknown>)) {
        if (typeof sku !== "string" || sku.trim() === "") {
          fel.push({ fält: `variantSkus.${id}`, skäl: "SKU måste vara en icke-tom sträng" });
        }
      }
    }
  }

  return fel;
}

/**
 * Applicerar patchen på en rad och returnerar den nya raden.
 *
 * Rör ALDRIG något utanför allowlisten — `costUsd`, `landedCostSek`,
 * `supplierVariantId`, `aosomBildFiler` och resten bärs vidare oförändrade.
 * Det är skillnaden mot helradsskrivningen den ersätter.
 */
export function applicera(
  rad: ProductMappingRecord,
  patch: Patch,
): { ny: ProductMappingRecord; okändaVariantIds: string[] } {
  const okändaVariantIds: string[] = [];

  let variants = rad.variants;
  if (patch.variantSkus) {
    const kända = new Set(
      rad.variants.map((v) => v.wixVariantId).filter((id): id is string => Boolean(id)),
    );
    for (const id of Object.keys(patch.variantSkus)) {
      if (!kända.has(id)) okändaVariantIds.push(id);
    }
    variants = rad.variants.map((v) => {
      const ny = v.wixVariantId ? patch.variantSkus?.[v.wixVariantId] : undefined;
      return ny ? { ...v, sku: ny } : v;
    });
  }

  return {
    ny: {
      ...rad,
      ...(patch.needsAiPolish !== undefined ? { needsAiPolish: patch.needsAiPolish } : {}),
      ...(patch.draftStatus !== undefined
        ? { draftStatus: patch.draftStatus as ProductMappingRecord["draftStatus"] }
        : {}),
      variants,
    },
    okändaVariantIds,
  };
}

export type Prisgrind = {
  /** Vad prisregeln säger att priset SKA vara. */
  förväntatSek: number;
  /** Vad mappningen säger att priset ÄR. */
  faktisktSek: number;
  landedCostSek: number;
  stämmer: boolean;
};

/**
 * Räknar Steg 4:s prisgrind ur samma regel som prissättningen använder.
 *
 * Grinden finns för att fånga en produkt vars kostnad ändrats sedan importen:
 * då är priset i Wix gammalt, och poleringens sista handling är att PUBLICERA.
 * CLAUDE.md, 2026-08-29: "poleringen säger uttryckligen 'rör inte priset', så
 * den som polerar en av de tjugo publicerar det gamla priset utan att märka
 * något."
 *
 * ☠️ Returnerar null när underlaget saknas i stället för att gissa. En grind
 * som svarar "stämmer" på tomma tal är värre än ingen grind — samma skäl som
 * att en saknad hyllstatus blir `unknown` och aldrig `offline`.
 */
export function prisgrind(
  rad: ProductMappingRecord,
  config: Pick<PricingConfig, "rounding">,
  multiplikator: number,
): Prisgrind | null {
  const v = rad.variants[0];
  if (!v) return null;
  if (!Number.isFinite(v.landedCostSek) || v.landedCostSek <= 0) return null;
  if (!Number.isFinite(v.grossSek) || v.grossSek <= 0) return null;
  if (!Number.isFinite(multiplikator) || multiplikator <= 0) return null;

  const förväntatSek = roundPrice(v.landedCostSek * multiplikator, config.rounding);
  return {
    förväntatSek,
    faktisktSek: v.grossSek,
    landedCostSek: v.landedCostSek,
    stämmer: förväntatSek === v.grossSek,
  };
}
