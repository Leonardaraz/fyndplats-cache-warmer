// lib/feed/prisjakt-hemlig.ts
//
// Det hemliga Prisjakt-flödet, MED märke och artikelnummer, ur Google-flödets
// XML och motorns nummer. En enda byggare: app/feed/[fil]/route.ts (adressen)
// och /api/cron/farska-floden (som sparar kopian) använder samma funktion.
// Varför flödet finns och vilka regler som gäller står i app/feed/[fil]/route.ts
// och i CLAUDE.md (Leonards beslut 2026-10-28).
//
// ☠️ Adressen står aldrig här. Kopian sparas under namnet PRISJAKT_HEMLIG_KOPIA,
// och loggraderna bär bara antal: aldrig koden, adressen, ett nummer eller ett
// märke.

import { tillPrisjakt } from "@/lib/feed/prisjakt";
import { FLODE_GTIN } from "@/lib/feed/flode-gtin";
import type { PrisjaktArtiklar } from "@/lib/feed/prisjakt";
import { PRISJAKT_VARNING_BYTE_STROMMAT, prisjaktRakning } from "@/lib/feed/prisjakt-svar";
import {
  DELIVERY_MAX_DAYS,
  DELIVERY_MIN_DAYS,
  FREE_SHIPPING_FROM_KR,
  SHIPPING_SERVICE,
  STANDARD_SHIPPING_KR,
} from "@/lib/shipping";

/** Namnet på kopian i lib/feed/flodeslager.ts. Ett namn, aldrig adressen. */
export const PRISJAKT_HEMLIG_KOPIA = "prisjakt-hemlig";

/** Det motorn gav: numren och antalen för loggen. */
export type Motorsvar = { artiklar: PrisjaktArtiklar; poster: number; ogiltiga: number };

export function prisjaktHemligXml(googleXml: string, motorn: Motorsvar): string {
  const xml = tillPrisjakt(
    googleXml,
    {
      standardKr: STANDARD_SHIPPING_KR,
      freeFromKr: FREE_SHIPPING_FROM_KR,
      service: SHIPPING_SERVICE,
      minDays: DELIVERY_MIN_DAYS,
      maxDays: DELIVERY_MAX_DAYS,
    },
    FLODE_GTIN,
    motorn.artiklar,
  );
  const r = prisjaktRakning(xml);
  console.info(
    `[prisjakt-hemlig] ${r.varor} varor, g:mpn på ${r.mpn}, varans märke på ${r.mpnMedMarke} av dem ` +
      `(motorn gav ${motorn.poster} poster, ${motorn.ogiltiga} ogiltiga), g:gtin på ${r.gtin}, ` +
      `${(r.byte / 1e6).toFixed(2)} MB`,
  );
  if (r.byte > PRISJAKT_VARNING_BYTE_STROMMAT) {
    console.warn(`[prisjakt-hemlig] flödet är ${(r.byte / 1e6).toFixed(1)} MB. Vercels CDN cachar inte strömmade svar över 20 MB.`);
  }
  return xml;
}
