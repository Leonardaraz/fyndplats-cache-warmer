// Danskt sortiment och pris: vilka publicerade Aosom-sidor som får säljas i
// Danmark, och vad de kostar där.
//
// VARFÖR DEN FINNS (Leonard 2026-10-22). Danmark ska öppnas med en egen kassa
// med Stripe och några hundra Aosom-varor utan el och batterier. Mätningen av
// frakten per land (frakt-per-land.ts) gav medianer. Här blir det en lista:
// sida för sida, om den kan säljas i landet och vad den kostar där.
//
// EN SIDA KAN SÄLJAS i landet när varje artikel på den
//   - finns i Aosoms feed just nu,
//   - har ett inköpspris och en verklig fraktavgift dit,
//   - inte har en frakt dit som kostar mer än varan (samma gräns som nattens
//     import i Sverige, `skipFreightHeavy`), och
//   - inte har el eller batterier (el-och-batteri.ts).
// Bara Aosom-sidor räknas. AliExpress-varorna stannar i Sverige (planen).
//
// PRISET räknas som synkens regelpris (`planeraPris` i sync.ts): inköp plus
// frakten dit, landets moms, husets multiplikator och samma avrundning, men i
// landets valuta. Konkurrentregeln gäller inte, eftersom den jämför med en
// svensk butik.
//
// ☠️ LISTAN BÄR PRISER, VÅRT URVAL OCH UTDRAG UR AOSOMS TEXT. Den får aldrig
// stå i en Actions-logg: workflowen krypterar den mot ett engångskuvert och
// skriver bara räknarna. Listan bär varken artikelnummer, inköpspris eller
// frakt, inte ens krypterad. Utdragen har artikelnummerformer bortredigerade
// (el-och-batteri.ts).

import { applyMarkup, computePriceWithRules, resolveMarkup, roundPrice } from "../import/pricing";
import type { PricingRules } from "../import/types";
import { LEVERANTORER, type Leverantor, type ProductMappingRecord } from "../store";
import { mappingSupplier } from "../store/supplier";
import { MIN_WIX_PRODUKTER, type V3ProduktInfo } from "../wix/v3-products";
import { aosomArtikelbild } from "./artiklar";
import { klassaElOchBatteri, SIGNALORD, SVAGORD, type Klassning, type Signalgrupp, type Traff } from "./el-och-batteri";
import { arVerkligFrakt, harVerkligSeFrakt, type AosomRow } from "./feed";
import { kvantil, procent, tvaDecimaler, UnderlagetOfullstandigt } from "./frakt-per-land";
import { landadKostnadSek, MIN_FEED_RADER } from "./sync";
import { htmlToText } from "./to-product";

/**
 * Länderna listan kan räknas för. Bara Danmark: ett land i euro behöver en
 * egen avrundning (charm99 snäpper 89 till 99, alltså tio euro på en vara
 * för 139 euro), och det beslutet är inte fattat.
 */
export const SALJLANDER = ["DK"] as const;
export type Saljland = (typeof SALJLANDER)[number];

export interface Landsinstallning {
  namn: string;
  valuta: "DKK";
  /** Landets moms, 0,25 = 25 %. Priset visas inklusive den. */
  moms: number;
}

export const LANDSINSTALLNING: Readonly<Record<Saljland, Landsinstallning>> = {
  DK: { namn: "Danmark", valuta: "DKK", moms: 0.25 },
};

export function arSaljland(varde: unknown): varde is Saljland {
  return typeof varde === "string" && (SALJLANDER as readonly string[]).includes(varde);
}

export interface Kurser {
  eurToSek: number;
  /** EUR → landets valuta. */
  eurToLokal: number;
}

/** Skälen en sida inte kan säljas i landet. En sida kan ha flera. */
export const SKAL = [
  "tvetydig",
  "utan_artikel",
  "saknas_i_flodet",
  "utan_inkopspris",
  "ej_skeppbar",
  "frakttung",
  "el_eller_batteri",
] as const;
export type Skal = (typeof SKAL)[number];

export interface Artikelrad {
  /** Wix-variant-id på en sammanslagen sida, annars null. Aldrig ett artikelnummer. */
  variant: string | null;
  /** Aosom har artikeln i lager just nu. */
  iLager: boolean;
  /** Priset i landets valuta, eller null när det inte går att räkna. */
  prisLokal: number | null;
  /** Husets regelpris i Sverige för samma artikel. */
  regelprisSek: number | null;
  /** Priset i landet omräknat till kronor, delat med regelpriset i Sverige. */
  kvot: number | null;
}

/** Texten runt en träff, ur vårt namn eller Aosoms text. Bara i den krypterade listan. */
export interface Utdrag {
  ord: string;
  /** Stark signal (stoppar sidan) eller brett ord (stoppar inte). */
  stark: boolean;
  text: string;
}

/** Högst så många utdrag per sida, de starka först. */
export const MAX_UTDRAG_PER_SIDA = 12;

export interface Sidrad {
  wixProductId: string;
  namn: string;
  slug: string;
  ok: boolean;
  skal: Skal[];
  /** Etiketterna för el och batterier, t.ex. "LED". Tom när inget hittades. */
  signaler: string[];
  /** Breda ord som inte stoppar sidan, för granskning. */
  svaga: string[];
  /** Var i texten träffarna står. Artikelnummerformer är bortredigerade. */
  utdrag: Utdrag[];
  artiklar: Artikelrad[];
}

export interface Landsortiment {
  land: Saljland;
  landnamn: string;
  valuta: Landsinstallning["valuta"];
  kurser: Kurser;
  regel: { multiplikator: number; avrundning: string };
  underlag: {
    flodetRader: number;
    mappningar: number;
    synligaProdukter: number;
    /** Synliga sidor med mer än en mappningsrad. Bara den första räknas. */
    dubbelmappade: number;
  };
  sidor: {
    /** Synliga produkter med en mappningsrad. */
    publicerade: number;
    perLeverantor: Record<Leverantor, number>;
    aosom: number;
    ok: number;
    utesluten: number;
    /** Sidor per skäl. En sida med två skäl räknas under båda. */
    perSkal: Record<Skal, number>;
  };
  artiklar: {
    /** Artiklar på sidor som kan säljas. */
    ok: number;
    /** Av dem: slut hos Aosom just nu. */
    slutHosAosom: number;
  };
  /** Aosom-sidor per grupp och per etikett, oavsett andra skäl. */
  signaler: { perGrupp: Record<Signalgrupp, number>; perOrd: Record<string, number> };
  /**
   * Breda ord som inte stoppar: Aosom-sidor per etikett, och hur många av
   * sidorna som kan säljas som har minst ett. De är granskningens lista.
   */
  svaga: { perOrd: Record<string, number>; sidorSomKanSaljas: number };
  /** Priset i landet mot husets regelpris i Sverige, på sidor som kan säljas. */
  priser: {
    jamforda: number;
    kvotMedian: number | null;
    kvotP25: number | null;
    kvotP75: number | null;
    lagreAnSverigePct: number | null;
  };
}

export interface LandsortimentSvar {
  sammanfattning: Landsortiment;
  /** ☠️ Bär priser och vårt urval. Bara krypterad ut ur rutten. */
  lista: Sidrad[];
}

export interface LandsortimentDeps {
  /** Feeden tolkad med `{ fraktPerLand: true }`. */
  hamtaFlodet: () => Promise<AosomRow[]>;
  listaMappningar: () => Promise<ProductMappingRecord[]>;
  /** Hela katalogen: id → namn, slug och synlighet. */
  listaProdukter: () => Promise<Map<string, V3ProduktInfo>>;
  regler: () => Promise<PricingRules>;
  kurser: Kurser;
}

const nollor = <K extends string>(nycklar: readonly K[]): Record<K, number> =>
  Object.fromEntries(nycklar.map((k) => [k, 0])) as Record<K, number>;

function round2(n: number): number {
  return Math.round((n + Number.EPSILON) * 100) / 100;
}

/**
 * Husets regelpris i Sverige, exakt som synken räknar det: landad kostnad
 * inklusive moms genom `computePriceWithRules`. Null när artikeln saknar
 * inköpspris eller inte går att skicka hit.
 */
export function regelprisSverige(row: AosomRow, regler: PricingRules, eurToSek: number): number | null {
  if (!((row.wholesaleEur ?? 0) > 0) || !harVerkligSeFrakt(row)) return null;
  return computePriceWithRules(landadKostnadSek(row, eurToSek) / regler.usdToSek, regler, null).grossSek;
}

/**
 * Regelpriset i landet, i landets valuta. Samma steg som `computePrice`:
 * landad kostnad inklusive moms gånger multiplikatorn, plus det fasta påslaget
 * omräknat, och sedan samma avrundning. Multiplikatorn väljs på kostnaden i
 * kronor, så att ett prisintervall i regeln betyder samma sak i båda länderna.
 */
export function regelprisILand(
  row: AosomRow,
  land: Saljland,
  regler: PricingRules,
  kurser: Kurser,
): number | null {
  const inkop = row.wholesaleEur ?? 0;
  const frakt = row.fraktPerLand?.[land];
  if (!(inkop > 0) || !arVerkligFrakt(frakt)) return null;
  const landadLokal = round2((inkop + frakt) * kurser.eurToLokal * (1 + LANDSINSTALLNING[land].moms));
  const sekPerLokal = kurser.eurToSek / kurser.eurToLokal;
  const markup = resolveMarkup(landadLokal * sekPerLokal, null, regler);
  const brutto = applyMarkup(landadLokal, {
    multiplier: markup.multiplier,
    fixedSek: markup.fixedSek / sekPerLokal,
  });
  return roundPrice(brutto, regler.rounding);
}

function klassaRad(row: AosomRow): Klassning {
  return klassaElOchBatteri([
    row.name,
    row.category,
    htmlToText(row.bulletsHtml),
    htmlToText(row.descriptionHtml),
  ]);
}

export async function matLandsortiment(land: Saljland, deps: LandsortimentDeps): Promise<LandsortimentSvar> {
  const [flodet, mappningar, produkter, regler] = await Promise.all([
    deps.hamtaFlodet(),
    deps.listaMappningar(),
    deps.listaProdukter(),
    deps.regler(),
  ]);

  // ☠️ Samma spärrar som synken och fraktmätningen. En halvläst feed hade
  // gjort varor osäljbara, och en halvläst katalog hade gjort sidor osynliga.
  if (flodet.length < MIN_FEED_RADER) {
    throw new UnderlagetOfullstandigt(`feeden gav ${flodet.length} rader, minst ${MIN_FEED_RADER} krävs`);
  }
  const synliga = [...produkter.values()].filter((p) => p.visible).length;
  if (synliga < MIN_WIX_PRODUKTER) {
    throw new UnderlagetOfullstandigt(`butiken gav ${synliga} synliga produkter, minst ${MIN_WIX_PRODUKTER} krävs`);
  }
  if (!flodet.some((r) => r.fraktPerLand && land in r.fraktPerLand)) {
    throw new UnderlagetOfullstandigt(`feeden saknar fraktkolumnen för ${land}`);
  }

  const perArtikel = new Map(flodet.map((r) => [r.sku, r] as const));
  const sedda = new Set<string>();
  const lista: Sidrad[] = [];
  const sammanfattning: Landsortiment = {
    land,
    landnamn: LANDSINSTALLNING[land].namn,
    valuta: LANDSINSTALLNING[land].valuta,
    kurser: deps.kurser,
    regel: { multiplikator: regler.defaultMultiplier, avrundning: regler.rounding },
    underlag: { flodetRader: flodet.length, mappningar: mappningar.length, synligaProdukter: synliga, dubbelmappade: 0 },
    sidor: {
      publicerade: 0,
      perLeverantor: nollor<Leverantor>([...LEVERANTORER, "okand"]),
      aosom: 0,
      ok: 0,
      utesluten: 0,
      perSkal: nollor<Skal>(SKAL),
    },
    artiklar: { ok: 0, slutHosAosom: 0 },
    signaler: {
      perGrupp: nollor<Signalgrupp>(["batteri", "el", "ljus", "varme_kyla", "ljud", "massage", "hushall", "klocka"]),
      perOrd: nollor<string>(SIGNALORD),
    },
    svaga: { perOrd: nollor<string>(SVAGORD), sidorSomKanSaljas: 0 },
    priser: { jamforda: 0, kvotMedian: null, kvotP25: null, kvotP75: null, lagreAnSverigePct: null },
  };
  const kvoter: number[] = [];

  for (const m of mappningar) {
    const id = m.wixProductId;
    const info = id ? produkter.get(id) : undefined;
    if (!id || !info?.visible) continue;
    if (sedda.has(id)) {
      sammanfattning.underlag.dubbelmappade++;
      continue;
    }
    sedda.add(id);
    sammanfattning.sidor.publicerade++;

    const leverantor = mappingSupplier(m);
    sammanfattning.sidor.perLeverantor[leverantor]++;
    // Bara Aosom går vidare. De andra leverantörerna stannar i Sverige.
    if (leverantor !== "aosom") continue;
    sammanfattning.sidor.aosom++;

    const skal = new Set<Skal>();
    // Etikett → första träffen, ur vårt svenska namn och varje artikels tyska
    // text. Ett brett ord som är en stark signal på en annan artikel räknas
    // som starkt.
    const starka = new Map<string, Traff>();
    const svaga = new Map<string, Traff>();
    const lagg = (k: Klassning) => {
      for (const t of k.starka) if (!starka.has(t.ord)) starka.set(t.ord, t);
      for (const t of k.svaga) if (!svaga.has(t.ord)) svaga.set(t.ord, t);
    };
    lagg(klassaElOchBatteri([info.namn]));
    const artiklar: Artikelrad[] = [];

    const bild = aosomArtikelbild(m);
    const delar: Array<{ artikel: string; variant: string | null }> =
      bild.typ === "flera"
        ? bild.varianter.map((v) => ({ artikel: v.artikel, variant: v.wixVariantId }))
        : bild.typ === "en" && bild.artikel
          ? [{ artikel: bild.artikel, variant: null }]
          : [];
    if (bild.typ === "tvetydig") skal.add("tvetydig");
    else if (delar.length === 0) skal.add("utan_artikel");

    for (const del of delar) {
      const row = perArtikel.get(del.artikel);
      if (!row) {
        skal.add("saknas_i_flodet");
        artiklar.push({ variant: del.variant, iLager: false, prisLokal: null, regelprisSek: null, kvot: null });
        continue;
      }
      const inkop = row.wholesaleEur ?? 0;
      const frakt = row.fraktPerLand?.[land];
      if (!(inkop > 0)) skal.add("utan_inkopspris");
      else if (!arVerkligFrakt(frakt)) skal.add("ej_skeppbar");
      else if (frakt > inkop) skal.add("frakttung");
      lagg(klassaRad(row));

      const prisLokal = regelprisILand(row, land, regler, deps.kurser);
      const regelprisSek = regelprisSverige(row, regler, deps.kurser.eurToSek);
      const kvot =
        prisLokal !== null && regelprisSek
          ? Math.round(((prisLokal * deps.kurser.eurToSek) / deps.kurser.eurToLokal / regelprisSek) * 1000) / 1000
          : null;
      artiklar.push({ variant: del.variant, iLager: row.qty > 0, prisLokal, regelprisSek, kvot });
    }
    for (const ord of starka.keys()) svaga.delete(ord);
    if (starka.size > 0) skal.add("el_eller_batteri");
    for (const ord of starka.keys()) sammanfattning.signaler.perOrd[ord]++;
    for (const grupp of new Set([...starka.values()].map((t) => t.grupp))) sammanfattning.signaler.perGrupp[grupp]++;
    for (const ord of svaga.keys()) sammanfattning.svaga.perOrd[ord]++;

    const ok = skal.size === 0;
    if (ok) {
      sammanfattning.sidor.ok++;
      if (svaga.size > 0) sammanfattning.svaga.sidorSomKanSaljas++;
      sammanfattning.artiklar.ok += artiklar.length;
      sammanfattning.artiklar.slutHosAosom += artiklar.filter((a) => !a.iLager).length;
      for (const a of artiklar) if (a.kvot !== null) kvoter.push(a.kvot);
    } else {
      sammanfattning.sidor.utesluten++;
      for (const s of skal) sammanfattning.sidor.perSkal[s]++;
    }

    lista.push({
      wixProductId: id,
      namn: info.namn,
      slug: info.slug,
      ok,
      skal: SKAL.filter((s) => skal.has(s)),
      signaler: [...starka.keys()],
      svaga: [...svaga.keys()],
      utdrag: [
        ...[...starka.values()].map((t) => ({ ord: t.ord, stark: true, text: t.utdrag })),
        ...[...svaga.values()].map((t) => ({ ord: t.ord, stark: false, text: t.utdrag })),
      ].slice(0, MAX_UTDRAG_PER_SIDA),
      artiklar,
    });
  }

  kvoter.sort((a, b) => a - b);
  sammanfattning.priser = {
    jamforda: kvoter.length,
    kvotMedian: tvaDecimaler(kvantil(kvoter, 0.5)),
    kvotP25: tvaDecimaler(kvantil(kvoter, 0.25)),
    kvotP75: tvaDecimaler(kvantil(kvoter, 0.75)),
    lagreAnSverigePct: procent(kvoter.filter((k) => k < 1).length, kvoter.length),
  };

  // Sidorna som kan säljas först, sedan de uteslutna, båda i namnordning.
  lista.sort((a, b) => Number(b.ok) - Number(a.ok) || a.namn.localeCompare(b.namn, "sv"));
  return { sammanfattning, lista };
}
