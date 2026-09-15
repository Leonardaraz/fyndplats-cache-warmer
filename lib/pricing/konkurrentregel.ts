// Konkurrentregeln: vårt pris mot dealproffsens — ren logik, ingen IO.
//
// BAKGRUNDEN (2026-09-15). Leonards strategi: på varor där vi är billigare än
// dealproffsen ska vi ligga strax UNDER dem, inte hundratals kronor under, och
// annonsera just dem i Google Shopping. Marknadsplan v3 gör prisläget till ett
// test: grupp A ligger 2 % under, grupp B 5 % under, och efter fyra veckor
// avgör datan vilken av dem som blir regel för hela sortimentet.
//
// ☠️ REGELN LEVER I SYNKEN, INTE I ETT LÅS. Synken räknar om varje Aosom-pris
// var sjätte timme till husets regel (1,20 × landad kostnad). Ett handsatt pris
// är borta till kvällen, och 900 `prisLast` hade varit fel medicin — ett låst
// pris slutar följa kostnaden. Här får varje rad i stället ETT MÅL som räknas
// om varje körning, med kostnaden som golv:
//
//   golv = husets regelpris (1,20 × landad, charmavrundat)   — aldrig under
//   mål  = (1 − d) × deras pris                              — d per grupp
//   tak  = 1,50 × landad kostnad (inkl. moms)                — aldrig över
//   pris = min(max(mål, golv), tak), avrundat NEDÅT till charmpris
//
// Fyra egenskaper som inte ska tas bort:
//
//   1. ☠️ INGEN GRUPP, INGEN REGEL. En rad utan `prisgrupp` följer husets regel
//      exakt som förut. Utrullningen är opt-in per rad, och att deploya koden
//      ändrar inte ett enda pris. Gruppen sätts av /api/admin/konkurrentpris.
//   2. ☠️ ETT GAMMALT KONKURRENTPRIS FRYSER RADEN, det prissätter den inte.
//      Äldre än KONKURRENT_MAX_ALDER_DAGAR → inget pris skrivs, och raden
//      räknas i synkens `konkurrentFrysta` så en jämförelse som slutat köras
//      SYNS. Att falla tillbaka på golvet hade sänkt priset 200 kr på tusen
//      varor för att ett cron-jobb stod still.
//   3. ☠️ DERAS PRIS UNDER VÅRT GOLV → VI STANNAR PÅ GOLVET. Vi jagar inte
//      konkurrenten nedåt. Utfallet är ett eget besked (`golv`) så
//      annonsurvalet kan lyfta ut raden — vi betalar inte klick vi förlorar.
//   4. ☠️ TAKET FINNS FÖR ATT VI INTE VET VAR AMAZON LIGGER. Gapet mot
//      dealproffsen är 30–40 % på över hundra varor (mätt 2026-09-15: taket
//      binder på 136 av 972), och 2 % under dem hade lyft oss långt över vad
//      marknaden tål. 1,50 × landad är +25 % mot dagens regelpris, vilket
//      också håller varje ändring under synkens spärr MAX_PRISANDRING_PCT = 40
//      — spärren behöver inte röras, och 34 rader som annars fastnat i den
//      gör det inte.
//
// AVRUNDNINGEN GÅR NEDÅT, med flit. Husets charmavrundning rundar UPP (charm9,
// charm99): 2 % under 2 495 kr är 2 445, och charm99 hade gett 2 499 — alltså
// ÖVER konkurrenten, på en regel vars enda poäng är att ligga under. Regeln
// kliver därför ner ett steg i strategins rutnät tills priset ligger på eller
// under målet, men aldrig under golvet.

import { roundPrice } from "../import/pricing";
import type { PricingConfig } from "../import/types";

export type Prisgrupp = "A" | "B";

/** Hur långt under deras pris varje grupp siktar. Testet i marknadsplan v3. */
export const UNDER_PER_GRUPP: Readonly<Record<Prisgrupp, number>> = { A: 0.02, B: 0.05 };

/** Tak: aldrig mer än så här gånger landad kostnad (inkl. moms). +25 % mot regeln. */
export const TAK_MULTIPEL = 1.5;

/** Ett konkurrentpris äldre än så här prissätter ingenting — raden fryser. */
export const KONKURRENT_MAX_ALDER_DAGAR = 7;

/**
 * Under den här gränsen lottas ingen B-grupp: i bandet 1 000–2 000 kr ligger
 * vi bara ~6 % under dealproffsen i median (mätt 2026-09-15), så 5 % under
 * dem är samma sak som ingen höjning alls. Testet är meningsfullt först där
 * det finns utrymme.
 */
export const LOTTNING_FRAN_SEK = 2000;

/** Dealproffsens pris som det sparas på mappningsraden. */
export interface Konkurrentpris {
  /** Vad kunden betalar hos dem, SEK inkl. moms — `price_amount`, aldrig det överstrukna. */
  pris: number;
  /** ISO-tid när priset hämtades. */
  hamtad: string;
}

export interface KonkurrentInput {
  /** Husets regelpris — golvet. Redan charmavrundat av `computePriceWithRules`. */
  regelPris: number;
  /** Landad kostnad INKLUSIVE moms, husets konvention för `landedCostSek`. */
  landadInklMoms: number;
  konkurrent: Konkurrentpris | undefined;
  prisgrupp: Prisgrupp | undefined;
  /** Klockan nu, ms. */
  nu: number;
  rounding: PricingConfig["rounding"];
}

export type KonkurrentUtfall =
  /** Ingen grupp eller inget konkurrentpris — husets regel, som förut. */
  | { typ: "regel"; pris: number }
  /** Konkurrentpriset är för gammalt eller trasigt — skriv INGET pris. */
  | { typ: "fryst"; skal: "gammalt" | "ogiltigt"; alderDagar: number | null }
  /** Deras pris ligger under vårt golv — vi står kvar på golvet, ej konkurrenskraftig. */
  | { typ: "golv"; pris: number; derasPris: number }
  /** Målet nåddes: så här mycket under dem hamnade vi. */
  | { typ: "mal"; pris: number; derasPris: number; underPct: number }
  /** Målet låg över taket — vi stannar på taket. */
  | { typ: "tak"; pris: number; derasPris: number };

/** Ålder i dagar, eller null när stämpeln inte går att läsa. */
export function alderIDagar(hamtad: string, nu: number): number | null {
  const t = Date.parse(hamtad);
  if (!Number.isFinite(t)) return null;
  return (nu - t) / 86_400_000;
}

/**
 * Rundar ett råpris till strategins rutnät utan att hamna ÖVER råpriset —
 * och aldrig under golvet.
 *
 * Husets strategier rundar uppåt, så första försöket ligger oftast över; då
 * provas nästa steg nedåt tills ett rutnätspris ligger på eller under. Steget
 * är tio kronor för att charm99 snäpper 89 → 99 uppåt, så "ett steg ner" kan
 * kräva två.
 */
export function rundaNedat(
  ra: number,
  rounding: PricingConfig["rounding"],
  golv: number,
): number {
  const EPS = 1e-9;
  let kandidat = roundPrice(ra, rounding);
  for (let steg = 1; kandidat > ra + EPS && steg <= 30; steg++) {
    kandidat = roundPrice(ra - 10 * steg, rounding);
  }
  if (kandidat > ra + EPS) kandidat = Math.floor(ra);
  return Math.max(kandidat, golv);
}

export function tillampaKonkurrentregel(i: KonkurrentInput): KonkurrentUtfall {
  // 1. Ingen grupp, ingen regel. Opt-in per rad.
  if (!i.prisgrupp || !i.konkurrent) return { typ: "regel", pris: i.regelPris };

  // 2. Gammalt eller trasigt konkurrentpris fryser raden.
  const alder = alderIDagar(i.konkurrent.hamtad, i.nu);
  if (alder === null || alder > KONKURRENT_MAX_ALDER_DAGAR) {
    return { typ: "fryst", skal: "gammalt", alderDagar: alder };
  }
  const deras = i.konkurrent.pris;
  if (!Number.isFinite(deras) || deras <= 0) {
    return { typ: "fryst", skal: "ogiltigt", alderDagar: alder };
  }

  const golv = i.regelPris;
  // Taket kan i teorin hamna under golvet (fast påslag, intervallregel) — då
  // vinner golvet, för under det skrivs aldrig något.
  const tak = Math.max(i.landadInklMoms * TAK_MULTIPEL, golv);
  const mal = deras * (1 - UNDER_PER_GRUPP[i.prisgrupp]);

  // 3. Deras pris under vårt golv: stå kvar, och säg det.
  if (mal < golv) return { typ: "golv", pris: golv, derasPris: deras };

  // 4. Taket.
  if (mal > tak) {
    return { typ: "tak", pris: rundaNedat(tak, i.rounding, golv), derasPris: deras };
  }

  const pris = rundaNedat(mal, i.rounding, golv);
  return { typ: "mal", pris, derasPris: deras, underPct: ((deras - pris) / deras) * 100 };
}

/** FNV-1a, 32 bitar. Deterministisk över körningar och maskiner. */
function fnv1a(s: string): number {
  let h = 0x811c9dc5;
  for (let k = 0; k < s.length; k++) {
    h ^= s.charCodeAt(k);
    h = Math.imul(h, 0x01000193) >>> 0;
  }
  return h >>> 0;
}

/**
 * Lottar A/B-grupp för en rad.
 *
 * ☠️ DETERMINISTISK, INTE SLUMPAD. Gruppen räknas ur wix-id:t, så en omkörning
 * ger samma svar och en avbruten lottning går att köra om utan att en produkt
 * byter grupp mitt i testet. Under LOTTNING_FRAN_SEK finns inget att testa,
 * så där blir alla A.
 */
export function lottaGrupp(wixProductId: string, vartPris: number): Prisgrupp {
  if (!(vartPris >= LOTTNING_FRAN_SEK)) return "A";
  return fnv1a(wixProductId) % 2 === 0 ? "A" : "B";
}
