// Planerna bakom /api/admin/konkurrentpris — ren logik, ingen IO.
//
// Tre jobb, alla utan ett enda API-anrop:
//
//   planeraSpara   vilka rader ska få dealproffsens pris sparat (`konkurrent`)
//   planeraLotta   vilka rader ska lottas in i A/B-testet (`prisgrupp`)
//   planeraRensa   vilka rader ska UT ur testet och till husets regel
//   konkurrentStatus  hur ser lagret av konkurrentpriser ut just nu
//
// ☠️ INGEN PLAN BÄR ARTIKELNUMRET. Svaren hamnar i en PUBLIK Actions-logg och
// raderna nycklas på `wixProductId` — samma regel och samma test som i
// dealproffsen.ts.
//
// ☠️ ETT UTEBLIVET FYND SPARAR INGENTING OCH RADERAR INGENTING. En vara de
// inte säljer i dag har fortfarande sitt gamla pris på raden, och det får
// åldras: synkens KONKURRENT_MAX_ALDER_DAGAR fryser raden efter sju dagar, och
// `konkurrentFrysta` säger till. Att radera priset hade i stället fått synken
// att falla tillbaka på golvet och SÄNKA ett lyft pris — tyst.

import type { ProductMappingRecord } from "../store";
import { isAliExpressMapping } from "../store/supplier";
import type { WixProduktPris } from "../wix/v3-products";
import { artikelnummerAv, prefixAv, type DerasRad } from "./dealproffsen";
import {
  KONKURRENT_MAX_ALDER_DAGAR,
  alderIDagar,
  lottaGrupp,
  type Prisgrupp,
} from "./konkurrentregel";

/**
 * Ett oförändrat pris skrivs om först när stämpeln är så här gammal.
 *
 * En full körning täcker ~4 000 rader, och en skrivning per rad och körning
 * hade ätit tidsbudgeten. Priset är samma; det enda som ska hållas färskt är
 * `hamtad`, och två dagar räcker med god marginal mot synkens sjudagarsgräns.
 */
export const UPPFRISKNING_DAGAR = 2;

export interface SparaPlan {
  /** Rader som får ett nytt eller uppfriskat konkurrentpris. */
  attSpara: { m: ProductMappingRecord; pris: number; fran: number | null }[];
  /** Träff, samma pris och färsk stämpel — rörs inte. */
  oforandrade: number;
  /** De säljer den inte (i de prefix som hämtades). Raden rörs inte. */
  utanTraff: number;
  /** Rader utan artikelnummer — kunde inte ens fråga. */
  utanArtikelnummer: number;
  ejAosom: number;
  /** Rader vars prefix inte hämtades den här körningen. */
  utanforOmgangen: number;
}

export function planeraSpara(
  mappningar: readonly ProductMappingRecord[],
  deras: ReadonlyMap<string, DerasRad>,
  tacktaPrefix: ReadonlySet<string>,
  nu: number,
): SparaPlan {
  const plan: SparaPlan = {
    attSpara: [],
    oforandrade: 0,
    utanTraff: 0,
    utanArtikelnummer: 0,
    ejAosom: 0,
    utanforOmgangen: 0,
  };
  for (const m of mappningar) {
    if (isAliExpressMapping(m)) {
      plan.ejAosom++;
      continue;
    }
    const nr = artikelnummerAv(m);
    const p = nr ? prefixAv(nr) : null;
    if (!nr || !p) {
      plan.utanArtikelnummer++;
      continue;
    }
    if (!tacktaPrefix.has(p)) {
      plan.utanforOmgangen++;
      continue;
    }
    const rad = deras.get(nr.toUpperCase());
    if (!rad || !(rad.prisSek > 0)) {
      plan.utanTraff++;
      continue;
    }
    const gammalt = m.konkurrent;
    const alder = gammalt ? alderIDagar(gammalt.hamtad, nu) : null;
    const sammaPris = !!gammalt && gammalt.pris === rad.prisSek;
    const farsk = alder !== null && alder <= UPPFRISKNING_DAGAR;
    if (sammaPris && farsk) {
      plan.oforandrade++;
      continue;
    }
    plan.attSpara.push({ m, pris: rad.prisSek, fran: gammalt?.pris ?? null });
  }
  return plan;
}

export interface LottaPlan {
  attLotta: { m: ProductMappingRecord; grupp: Prisgrupp; vartPris: number }[];
  perGrupp: Record<Prisgrupp, number>;
  redanLottade: number;
  utanKonkurrent: number;
  ejPublicerade: number;
  /** Butikspriset är tvetydigt (flera varianter) eller saknas — lottas ALDRIG på gissning. */
  utanVartPris: number;
  ejAosom: number;
}

/**
 * Lottar A/B-grupp på rader som är Aosom, publicerade, bär ett konkurrentpris
 * och ännu inte har någon grupp.
 *
 * ☠️ EN RAD SOM REDAN HAR EN GRUPP RÖRS INTE. Testet bygger på att ingen byter
 * grupp mitt i; en omkörning ska bara fylla på. Lottningen är dessutom
 * deterministisk (se `lottaGrupp`), så även en rad som fått fältet raderat
 * hamnar i samma grupp igen.
 *
 * `bara` begränsar till en given mängd wix-id — det är så annonsurvalet
 * (60–80 produkter i fas 1) styr vilka som går in i testet först.
 */
export function planeraLotta(
  mappningar: readonly ProductMappingRecord[],
  vartPris: ReadonlyMap<string, WixProduktPris>,
  publicerade: ReadonlySet<string>,
  bara: ReadonlySet<string> | null = null,
): LottaPlan {
  const plan: LottaPlan = {
    attLotta: [],
    perGrupp: { A: 0, B: 0 },
    redanLottade: 0,
    utanKonkurrent: 0,
    ejPublicerade: 0,
    utanVartPris: 0,
    ejAosom: 0,
  };
  for (const m of mappningar) {
    if (bara && !bara.has(m.wixProductId)) continue;
    if (isAliExpressMapping(m)) {
      plan.ejAosom++;
      continue;
    }
    if (m.prisgrupp) {
      plan.redanLottade++;
      continue;
    }
    if (!m.konkurrent) {
      plan.utanKonkurrent++;
      continue;
    }
    if (!publicerade.has(m.wixProductId)) {
      plan.ejPublicerade++;
      continue;
    }
    const w = vartPris.get(m.wixProductId);
    if (!w || w.priceSek === null || w.variantCount > 1) {
      plan.utanVartPris++;
      continue;
    }
    const grupp = lottaGrupp(m.wixProductId, w.priceSek);
    plan.attLotta.push({ m, grupp, vartPris: w.priceSek });
    plan.perGrupp[grupp]++;
  }
  return plan;
}

export interface RensaPlan {
  /** Rader som ska tappa sin prisgrupp och därmed återgå till husets regel. */
  attRensa: ProductMappingRecord[];
  /** Vilka grupper de låg i — så en avbruten körning går att läsa av. */
  perGrupp: Record<Prisgrupp, number>;
  /** Rader utan grupp. De följer redan husets regel och rörs inte. */
  utanGrupp: number;
  ejAosom: number;
}

/**
 * Vilka rader ska lämna A/B-testet och gå tillbaka till husets regel?
 *
 * Vägen tillbaka ur utrullningen. Regeln är opt-in per rad (`prisgrupp`), och
 * utan grupp räknar synken husets regelpris — 1,20 × landad kostnad — precis
 * som före den 16 september.
 *
 * ☠️ BARA `prisgrupp` TAS BORT. `konkurrent` lämnas kvar med flit: mätningen
 * mot dealproffsen kostar timmars hämtning att göra om, och ett konkurrentpris
 * utan grupp prissätter ingenting (konkurrentregel.ts: ingen grupp, ingen
 * regel). Att radera båda hade slängt data utan att ändra ett enda pris.
 *
 * ☠️ ATT LÅTA PRISET ÅLDRAS ÄR INTE SAMMA SAK. Ett konkurrentpris äldre än
 * KONKURRENT_MAX_ALDER_DAGAR FRYSER raden — synken skriver inget pris alls och
 * räknar den i `konkurrentFrysta`. Ett höjt pris försvinner alltså inte av sig
 * självt när jämförelsen slutar köras; någon måste ta bort gruppen.
 */
export function planeraRensa(
  mappningar: readonly ProductMappingRecord[],
  bara: ReadonlySet<string> | null = null,
): RensaPlan {
  const plan: RensaPlan = {
    attRensa: [],
    perGrupp: { A: 0, B: 0 },
    utanGrupp: 0,
    ejAosom: 0,
  };
  for (const m of mappningar) {
    if (bara && !bara.has(m.wixProductId)) continue;
    if (isAliExpressMapping(m)) {
      plan.ejAosom++;
      continue;
    }
    if (!m.prisgrupp) {
      plan.utanGrupp++;
      continue;
    }
    plan.perGrupp[m.prisgrupp]++;
    plan.attRensa.push(m);
  }
  return plan;
}

/**
 * Raden som synken ska prissätta med husets regel igen.
 *
 * ☠️ NYCKELN TAS BORT, den sätts inte till undefined. Postgres sparar raden som
 * `JSON.stringify(record)` och Wix Data sparar hela objektet — en kvarlämnad
 * nyckel är skillnaden mellan en rensning som tar och en som ser ut att ta.
 */
export function utanPrisgrupp(m: ProductMappingRecord): ProductMappingRecord {
  const resten = { ...m };
  delete resten.prisgrupp;
  return resten;
}

export interface KonkurrentStatus {
  aosomRader: number;
  medKonkurrentpris: number;
  /** Yngre än synkens gräns — de här prissätter. */
  farska: number;
  /** Äldre än gränsen — de här FRYSER i synken. Ska vara noll efter en körning. */
  gamla: number;
  medGrupp: Record<Prisgrupp, number>;
  /** Har grupp men saknar konkurrentpris — regeln kan inte verka. */
  gruppUtanPris: number;
  aldstaDagar: number | null;
}

export function konkurrentStatus(
  mappningar: readonly ProductMappingRecord[],
  nu: number,
): KonkurrentStatus {
  const s: KonkurrentStatus = {
    aosomRader: 0,
    medKonkurrentpris: 0,
    farska: 0,
    gamla: 0,
    medGrupp: { A: 0, B: 0 },
    gruppUtanPris: 0,
    aldstaDagar: null,
  };
  for (const m of mappningar) {
    if (isAliExpressMapping(m)) continue;
    s.aosomRader++;
    if (m.prisgrupp) {
      s.medGrupp[m.prisgrupp]++;
      if (!m.konkurrent) s.gruppUtanPris++;
    }
    if (!m.konkurrent) continue;
    s.medKonkurrentpris++;
    const alder = alderIDagar(m.konkurrent.hamtad, nu);
    if (alder === null || alder > KONKURRENT_MAX_ALDER_DAGAR) s.gamla++;
    else s.farska++;
    if (alder !== null && (s.aldstaDagar === null || alder > s.aldstaDagar)) {
      s.aldstaDagar = Math.round(alder * 10) / 10;
    }
  }
  return s;
}
