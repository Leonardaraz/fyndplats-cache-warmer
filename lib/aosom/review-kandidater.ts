// Vilka produkter ska få sina Aosom-recensioner hämtade? — ren logik, ingen IO.
//
// VARFÖR DEN FINNS (2026-09-23). Recensionerna hämtas i Leonards Chrome, för
// Aosoms kant släpper bara igenom riktiga webbläsare (se CLAUDE.md, "Aosom-
// recensioner"). Hämtningen behöver artikelnumret, och det finns bara på
// mappningsraden. Första omgången (2026-09-16) tog numren ur en jämförelsefil
// som bara täckte annonsurvalet; nästa omgång — 297 nyss polerade produkter —
// hade ingen väg alls. /admin/mappings bär numren men laddar inte längre vid
// den här katalogstorleken, och polish-mapping.yml:s kuvert tar en produkt åt
// gången.
//
// Urvalet är exakt i stället för gissat: en produkt är kandidat när den är
// SYNLIG i butiken, är en Aosom-rad och ALDRIG har fått `reviewsCheckedAt`.
// Stämpeln sätts av inläsningen (lib/aosom/review-ingest.ts) och av det gamla
// svepet — men bara vid ett svar, aldrig vid ett fel (review-run.ts), så de
// 403:or svepet fick 2026-08-29 har inte stämplat något.
//
// ☠️ ARTIKELNUMRET LÄMNAR BARA RUTTEN TILL WORKFLOWEN, som krypterar det mot
// anroparens engångsnyckel innan något skrivs till den publika loggen. Samma
// kuvert som polish-mapping.yml. Planen själv loggar aldrig ett nummer.

import type { ProductMappingRecord } from "../store";
import { aosomSkuOf, isAosomMapping } from "../store/supplier";

export interface Recensionskandidat {
  wixProductId: string;
  artikelnummer: string;
}

export interface KandidatPlan {
  /** Synliga Aosom-produkter som aldrig fått recensionerna hämtade. */
  kandidater: Recensionskandidat[];
  /** Aosom-rader i katalogen, synliga eller ej. */
  aosomRader: number;
  /** Aosom-rader vars produkt syns i butiken. */
  synligaAosom: number;
  /** Synliga, men redan kontrollerade (och inte äldre än `fore`). */
  redanKontrollerade: number;
  /** Aosom-rader vars produkt INTE syns — utkast, dolda, raderade. */
  ejSynliga: number;
  /** Synliga Aosom-rader där artikelnumret inte gick att läsa ut. */
  utanArtikelnummer: number;
}

export interface KandidatVal {
  /**
   * Ta även med produkter som kontrollerades FÖRE den här tidpunkten (ISO).
   * För ett omsvep av gamla produkter. Utelämnad = bara aldrig kontrollerade.
   */
  fore?: string;
}

export function planeraRecensionskandidater(
  mappningar: readonly ProductMappingRecord[],
  synliga: ReadonlySet<string>,
  val: KandidatVal = {},
): KandidatPlan {
  const fore = val.fore ? Date.parse(val.fore) : null;
  if (val.fore && (fore === null || Number.isNaN(fore))) {
    throw new Error(`fore är inte ett giltigt datum: ${val.fore}`);
  }
  const plan: KandidatPlan = {
    kandidater: [],
    aosomRader: 0,
    synligaAosom: 0,
    redanKontrollerade: 0,
    ejSynliga: 0,
    utanArtikelnummer: 0,
  };
  const sedda = new Set<string>();
  for (const m of mappningar) {
    if (!isAosomMapping(m)) continue;
    plan.aosomRader++;
    if (!synliga.has(m.wixProductId)) {
      plan.ejSynliga++;
      continue;
    }
    plan.synligaAosom++;
    if (kontrollerad(m.reviewsCheckedAt, fore)) {
      plan.redanKontrollerade++;
      continue;
    }
    const artikelnummer = aosomSkuOf(m);
    if (!artikelnummer) {
      plan.utanArtikelnummer++;
      continue;
    }
    // En produkt med flera mappningsrader ska bara hämtas en gång.
    if (sedda.has(m.wixProductId)) continue;
    sedda.add(m.wixProductId);
    plan.kandidater.push({ wixProductId: m.wixProductId, artikelnummer });
  }
  return plan;
}

function kontrollerad(stampel: string | undefined, fore: number | null): boolean {
  if (!stampel) return false;
  if (fore === null) return true;
  const t = Date.parse(stampel);
  // En oläslig stämpel räknas som okontrollerad: hellre en hämtning för mycket
  // än en produkt som för alltid står utan recensioner.
  if (Number.isNaN(t)) return false;
  return t >= fore;
}
