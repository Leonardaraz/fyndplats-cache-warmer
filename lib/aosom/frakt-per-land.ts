// Frakten per land ur Aosoms feed: underlaget för vilka länder vi kan sälja i.
//
// BAKGRUND (2026-10-21). Leonard vill sälja Aosom-varorna i fler länder. Feeden
// har en fraktavgift per land för 39 länder och Tyskland (mätt 2026-09-15), men
// motorn läste bara Sveriges. Den här räknar per land hur många varor som går
// att skicka dit, och vad frakten och den landade kostnaden blir jämfört med
// Sverige. Norge, Schweiz, Storbritannien och Island fanns inte i feeden.
//
// ☠️ SVARET BÄR BARA ANTAL, ANDELAR OCH KVOTER. Avgifterna är inköpsled, som
// SE-frakten, och svaret skrivs till en publik Actions-logg. Inga avgifter,
// inga inköpspriser och inga artikelnummer. Ett test serialiserar svaret och
// letar efter dem.
//
// Tre urval, alla bara rader med inköpspris:
//
//   flodet       hela feeden
//   vara         artiklar på våra mappningar, utom avvisade och raderade utkast
//   publicerade  artiklar på en mappning vars sida är synlig i butiken
//
// "Går att skicka" är samma regel som för Sverige (arVerkligFrakt): ett belopp
// över 0 och under NO_SHIP_SENTINEL_EUR. Saldot räknas inte, eftersom en
// slutsåld rad är ett lagerbesked och inget fraktbesked.
//
// Kvoterna är medianer per rad, inte kvoter av medianer. "landad x1,10" betyder
// att inköp plus frakt till landet är 10 % dyrare än till Sverige för en typisk
// vara. Momsen ingår inte, eftersom landets momssats läggs på kundpriset för sig.

import { isEuCustomsUnion } from "../aliexpress/eu-countries";
import type { ProductMappingRecord } from "../store";
import { MIN_WIX_PRODUKTER } from "../wix/v3-products";
import { aosomArtiklarPaRaden } from "./artiklar";
import { arVerkligFrakt, harVerkligSeFrakt, type AosomRow } from "./feed";
import { MIN_FEED_RADER } from "./sync";

/** Svenska namn på feedens länder (2026-09-15). En okänd kod visas som koden. */
const LANDNAMN: Readonly<Record<string, string>> = {
  AD: "Andorra", AL: "Albanien", AT: "Österrike", BA: "Bosnien och Hercegovina",
  BE: "Belgien", BG: "Bulgarien", CY: "Cypern", CZ: "Tjeckien", DE: "Tyskland",
  DK: "Danmark", EE: "Estland", ES: "Spanien", FI: "Finland", FO: "Färöarna",
  FR: "Frankrike", GI: "Gibraltar", GR: "Grekland", HR: "Kroatien", HU: "Ungern",
  IE: "Irland", IT: "Italien", LT: "Litauen", LU: "Luxemburg", LV: "Lettland",
  MC: "Monaco", ME: "Montenegro", MK: "Nordmakedonien", MT: "Malta",
  NL: "Nederländerna", PL: "Polen", PT: "Portugal", RO: "Rumänien", RS: "Serbien",
  SE: "Sverige", SI: "Slovenien", SK: "Slovakien", SM: "San Marino", TR: "Turkiet",
  VA: "Vatikanstaten", XK: "Kosovo",
};

export interface LandMatt {
  land: string;
  namn: string;
  /** Inom EU:s tullunion, alltså ingen tull från Aosoms lager i Tyskland. */
  inomTullunionen: boolean;
  /** Rader med en verklig fraktavgift till landet. */
  skeppbara: number;
  /** skeppbara av urvalets rader, i procent med en decimal. */
  andelPct: number;
  /** Rader som går att skicka både dit och till Sverige. Kvoterna räknas på dem. */
  jamforda: number;
  /** Median av landets frakt delad med Sveriges. */
  fraktKvot: number | null;
  /** Median av (inköp + landets frakt) delat med (inköp + Sveriges frakt). */
  landadKvot: number | null;
  /** Kvartilerna för landadKvot. Hälften av varorna ligger mellan dem. */
  landadKvotP25: number | null;
  landadKvotP75: number | null;
  /** Av de jämförda: andelen där frakten dit är lägre än till Sverige. */
  billigareFraktPct: number | null;
  /** Av de skeppbara: andelen där frakten kostar mer än varan. */
  frakttungaPct: number | null;
}

export interface UrvalMatt {
  /** Urvalets rader med inköpspris. */
  rader: number;
  /** Ett mått per land, sorterade på landskod. */
  lander: LandMatt[];
}

/** Kvantil ur en sorterad lista, med linjär interpolation. Tom lista ger null. */
function kvantil(sorterad: readonly number[], p: number): number | null {
  if (sorterad.length === 0) return null;
  const pos = (sorterad.length - 1) * p;
  const lag = Math.floor(pos);
  const hog = Math.ceil(pos);
  return sorterad[lag] + (sorterad[hog] - sorterad[lag]) * (pos - lag);
}

function tvaDecimaler(n: number | null): number | null {
  return n === null ? null : Math.round(n * 100) / 100;
}

function procent(del: number, av: number): number | null {
  return av === 0 ? null : Math.round((del / av) * 1000) / 10;
}

/** Måtten per land för ett urval av rader, tolkade med `{ fraktPerLand: true }`. */
export function matFrakt(rader: readonly AosomRow[]): UrvalMatt {
  const medPris = rader.filter((r) => (r.wholesaleEur ?? 0) > 0);
  const lander = new Set<string>();
  for (const r of medPris) for (const land of Object.keys(r.fraktPerLand ?? {})) lander.add(land);

  const ut: LandMatt[] = [];
  for (const land of [...lander].sort()) {
    let skeppbara = 0;
    let frakttunga = 0;
    let billigare = 0;
    const fraktKvoter: number[] = [];
    const landadeKvoter: number[] = [];
    for (const r of medPris) {
      const avgift = r.fraktPerLand?.[land];
      if (!arVerkligFrakt(avgift)) continue;
      const inkop = r.wholesaleEur as number;
      skeppbara++;
      if (avgift > inkop) frakttunga++;
      if (!harVerkligSeFrakt(r)) continue;
      const se = r.seFreightEur as number;
      fraktKvoter.push(avgift / se);
      landadeKvoter.push((inkop + avgift) / (inkop + se));
      if (avgift < se) billigare++;
    }
    fraktKvoter.sort((a, b) => a - b);
    landadeKvoter.sort((a, b) => a - b);
    ut.push({
      land,
      namn: LANDNAMN[land] ?? land,
      inomTullunionen: isEuCustomsUnion(land),
      skeppbara,
      andelPct: procent(skeppbara, medPris.length) ?? 0,
      jamforda: landadeKvoter.length,
      fraktKvot: tvaDecimaler(kvantil(fraktKvoter, 0.5)),
      landadKvot: tvaDecimaler(kvantil(landadeKvoter, 0.5)),
      landadKvotP25: tvaDecimaler(kvantil(landadeKvoter, 0.25)),
      landadKvotP75: tvaDecimaler(kvantil(landadeKvoter, 0.75)),
      billigareFraktPct: procent(billigare, landadeKvoter.length),
      frakttungaPct: procent(frakttunga, skeppbara),
    });
  }
  return { rader: medPris.length, lander: ut };
}

/** Feeden eller butiken gick inte att läsa helt. Svaret vore inte ett mått. */
export class UnderlagetOfullstandigt extends Error {}

export interface FraktPerLandDeps {
  /** Feeden tolkad med `{ fraktPerLand: true }`. */
  hamtaFlodet: () => Promise<AosomRow[]>;
  listaMappningar: () => Promise<ProductMappingRecord[]>;
  /** Wix-id för produkterna som är synliga i butiken. */
  listaSynliga: () => Promise<Set<string>>;
}

export interface Tackning {
  /** Unika Aosom-artiklar på mappningarna i urvalet. */
  mappade: number;
  /** Hur många av dem som finns i feeden just nu. */
  iFlodet: number;
}

export interface FraktPerLandSvar {
  flodetRader: number;
  landskolumner: number;
  tackning: { vara: Tackning; publicerade: Tackning };
  urval: { flodet: UrvalMatt; vara: UrvalMatt; publicerade: UrvalMatt };
}

export async function matFraktPerLand(deps: FraktPerLandDeps): Promise<FraktPerLandSvar> {
  const [flodet, mappningar, synliga] = await Promise.all([
    deps.hamtaFlodet(),
    deps.listaMappningar(),
    deps.listaSynliga(),
  ]);

  // ☠️ Samma spärrar som synken. En halvläst feed eller en halvläst katalog
  // hade gett ett svar som ser ut som ett mått men inte är det.
  if (flodet.length < MIN_FEED_RADER) {
    throw new UnderlagetOfullstandigt(`feeden gav ${flodet.length} rader, minst ${MIN_FEED_RADER} krävs`);
  }
  if (synliga.size < MIN_WIX_PRODUKTER) {
    throw new UnderlagetOfullstandigt(
      `butiken gav ${synliga.size} synliga produkter, minst ${MIN_WIX_PRODUKTER} krävs`,
    );
  }
  const landskolumner = new Set(flodet.flatMap((r) => Object.keys(r.fraktPerLand ?? {})));
  if (!landskolumner.has("SE")) {
    throw new UnderlagetOfullstandigt("feeden saknar Sveriges fraktkolumn, så inget land går att jämföra");
  }

  const vara = new Set<string>();
  const publicerade = new Set<string>();
  for (const m of mappningar) {
    const artiklar = aosomArtiklarPaRaden(m);
    if (artiklar.length === 0) continue;
    const synlig = !!m.wixProductId && synliga.has(m.wixProductId);
    const avvisad = m.draftStatus === "rejected" || !!m.wixRaderad;
    for (const a of artiklar) {
      if (synlig || !avvisad) vara.add(a);
      if (synlig) publicerade.add(a);
    }
  }
  const iFlodet = (artiklar: ReadonlySet<string>) => flodet.filter((r) => artiklar.has(r.sku));
  const varaRader = iFlodet(vara);
  const publRader = iFlodet(publicerade);

  return {
    flodetRader: flodet.length,
    landskolumner: landskolumner.size,
    tackning: {
      vara: { mappade: vara.size, iFlodet: new Set(varaRader.map((r) => r.sku)).size },
      publicerade: { mappade: publicerade.size, iFlodet: new Set(publRader.map((r) => r.sku)).size },
    },
    urval: { flodet: matFrakt(flodet), vara: matFrakt(varaRader), publicerade: matFrakt(publRader) },
  };
}

/**
 * Status och text när mätningen faller.
 *
 * ☠️ Svaret når en publik Actions-logg. Bara våra egna spärrar svarar med sin
 * text, eftersom den bara bär antal. Ett annat fel kan bära feedens adress
 * eller värdnamn, och det står bara i Vercels logg (`loggtext`).
 */
export function felSvar(err: unknown): { status: number; error: string } {
  if (err instanceof UnderlagetOfullstandigt) return { status: 503, error: err.message };
  return { status: 502, error: "mätningen föll, se aosom-lander i Vercels logg" };
}

/** Feltexten för Vercels logg, med adresser bortbytta. */
export function loggtext(err: unknown): string {
  return (err instanceof Error ? err.message : String(err))
    .replace(/https?:\/\/\S+/gi, "‹adress›")
    .slice(0, 300);
}
