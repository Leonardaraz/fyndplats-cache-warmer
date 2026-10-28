// Aosoms artikelnummer och varumärke per Wix-variant, för butikens
// Prisjakt-flöde. Ren logik, ingen IO.
//
// VARFÖR DEN FINNS (Leonard 2026-10-28). Prisjakt matchade 9 av 6 818
// erbjudanden. Deras produktsidor för Aosom-varor heter märke plus Aosoms
// artikelnummer ("Homcom" och numret), och Business Center ber den som har
// många erbjudanden att skicka EAN och tillverkarens artikelnummer. Beslutet:
// i Prisjakt-flödet, och BARA där, är g:brand varans riktiga märke och g:mpn
// Aosoms artikelnummer. Flödet med de uppgifterna finns bara på en hemlig
// adress i butiken (headless-site, app/feed/[fil]/route.ts).
//
// ☠️ ETT MEDVETET UNDANTAG FRÅN TVÅ HUSREGLER, OCH BARA HÄR. Överallt annars
// gäller att artikelnumret aldrig når kunden och att märket är Fyndplats.
// Svaret från /api/prisjakt-artiklar bär numren i klartext, så det skrivs
// aldrig till en logg, och rutten tar bara butikens hemlighet.
//
// MÄRKET gissas aldrig. Det tas ur adressen till Aosoms egen produktsida
// (markeUrAosomUrl i lib/gpsr/aosom.ts, samma härledning som produktsidans
// GPSR-flik), i den här ordningen:
//   1. Aosom-flödets adress för artikeln — den färska.
//   2. Mappningens `sourceUrl`, men bara när adressen slutar på just den
//      artikeln ("~<artikel>.html"). En ommappad rad kan bära en gammal adress.
//   3. lib/gpsr/aosom-data.json — samma härledning ur flödet, gjord 2026-09-27.
// Ger ingen av dem ett känt märke står Fyndplats kvar i flödet.
//
// "Aosom" räknas inte som ett märke (Leonard 2026-10-28), oavsett stora eller
// små bokstäver. Ger en källa "Aosom" prövas nästa, och ger ingen ett annat
// märke blir märket null. Artikelnumret följer med ändå. markeUrAosomUrl rörs
// inte, eftersom produktsidornas GPSR-flik läser den.

import { createHash, timingSafeEqual } from "node:crypto";
import type { ProductMappingRecord } from "../store";
import { isAosomMapping } from "../store/supplier";
import { aosomArtikelbild, arIAosomSynkensUrval } from "../aosom/artiklar";
import { markeUrAosomUrl } from "../gpsr/aosom";

export interface PrisjaktArtikel {
  /** Aosoms artikelnummer utan prefixet "aosom:". */
  mpn: string;
  /** Varans märke som det står på varan, eller null när ingen säker källa finns. */
  marke: string | null;
}

export interface PrisjaktArtiklar {
  /** Wix-variant-id (flödets g:id) → artikeln. */
  varianter: Record<string, PrisjaktArtikel>;
  /**
   * Wix-produkt-id → artikeln, bara för sidor med EN artikel där mappningen
   * saknar variant-id. Butiken använder den bara när produkten har exakt en
   * variant i flödet.
   */
  produkter: Record<string, PrisjaktArtikel>;
}

export type MarkeKalla = "flodet" | "mappningen" | "gpsr";

export interface PrisjaktArtikelRakning {
  /** Aosom-rader med Wix-id och artikel. */
  aosomRader: number;
  /** Sidor där radens artikel gäller hela sidan. */
  enArtikel: number;
  /** Sammanslagna sidor, en artikel per variant. */
  sammanslagna: number;
  sammanslagnaVarianter: number;
  /** Sidor som inte går att läsa entydigt (aosomArtikelbild "tvetydig"). Får inget. */
  tvetydiga: number;
  /** Sidor med en artikel som fick produktens id som nyckel, eftersom variant-id saknas. */
  utanVariantId: number;
  /** Artiklar som inte ser ut som ett artikelnummer. Får inget. */
  ogiltigtNummer: number;
  /** Nycklar som två rader gav olika artiklar. Ingen av dem får något. */
  konflikter: number;
  medMarke: number;
  utanMarke: number;
  markeKalla: Record<MarkeKalla, number>;
}

export interface MarkeKallor {
  /** Artikel → adressen till Aosoms produktsida ur flödet. Tom när flödet inte gick att läsa. */
  flodetsAdresser: ReadonlyMap<string, string>;
  /** Märket ur lib/gpsr/aosom-data.json, eller null. */
  gpsrMarke: (artikel: string) => string | null;
}

/** Aosoms nummer: versaler, siffror och bindestreck, 7–12 tecken (uppmätt 2026-10-28). Marginal åt båda hållen. */
const ARTIKEL_RE = /^[A-Za-z0-9][A-Za-z0-9-]{2,39}$/;

export function arArtikelnummer(s: string): boolean {
  return ARTIKEL_RE.test(s);
}

/** Artikeln i adressen till Aosoms produktsida, som slutar på "~<artikel>.html". */
export function adressensArtikel(url: string): string | null {
  const m = /~([A-Za-z0-9-]+)\.html(?:[?#].*)?$/.exec(url.trim());
  return m ? m[1] : null;
}

/** Ett märke att skriva i Prisjakt-flödet. "Aosom" är leverantörens namn och räknas inte. */
function arVarumarke(marke: string | null): marke is string {
  return !!marke && marke.trim().toLowerCase() !== "aosom";
}

/**
 * Märket för en artikel, och var det kom ifrån. `radensAdress` är mappningens
 * `sourceUrl` och gäller bara när den slutar på samma artikel.
 */
export function markeFor(
  artikel: string,
  radensAdress: string | undefined,
  kallor: MarkeKallor,
): { marke: string | null; kalla: MarkeKalla | null } {
  const flodet = markeUrAosomUrl(kallor.flodetsAdresser.get(artikel));
  if (arVarumarke(flodet)) return { marke: flodet, kalla: "flodet" };

  if (radensAdress && adressensArtikel(radensAdress)?.toUpperCase() === artikel.toUpperCase()) {
    const rad = markeUrAosomUrl(radensAdress);
    if (arVarumarke(rad)) return { marke: rad, kalla: "mappningen" };
  }

  const gpsr = kallor.gpsrMarke(artikel);
  if (arVarumarke(gpsr)) return { marke: gpsr, kalla: "gpsr" };
  return { marke: null, kalla: null };
}

type Rad = Pick<ProductMappingRecord, "wixProductId" | "supplier" | "supplierProductId" | "variants" | "sourceUrl">;

/**
 * Alla Aosom-rader → artikel och märke per variant.
 *
 * ☠️ Ingenting gissas. En tvetydig sida, ett nummer som inte ser ut som ett
 * nummer, och en nyckel som två rader ger olika svar får ingen post alls.
 */
export function byggPrisjaktArtiklar(
  mappningar: readonly Rad[],
  kallor: MarkeKallor,
): { artiklar: PrisjaktArtiklar; rakning: PrisjaktArtikelRakning } {
  const rakning: PrisjaktArtikelRakning = {
    aosomRader: 0,
    enArtikel: 0,
    sammanslagna: 0,
    sammanslagnaVarianter: 0,
    tvetydiga: 0,
    utanVariantId: 0,
    ogiltigtNummer: 0,
    konflikter: 0,
    medMarke: 0,
    utanMarke: 0,
    markeKalla: { flodet: 0, mappningen: 0, gpsr: 0 },
  };
  type Post = PrisjaktArtikel & { kalla: MarkeKalla | null };
  const varianter = new Map<string, Post>();
  const produkter = new Map<string, Post>();
  const krockar = { varianter: new Set<string>(), produkter: new Set<string>() };

  const lagg = (
    karta: Map<string, Post>,
    stangda: Set<string>,
    nyckel: string,
    artikel: string,
    radensAdress: string | undefined,
  ) => {
    if (!arArtikelnummer(artikel)) {
      rakning.ogiltigtNummer++;
      return;
    }
    if (stangda.has(nyckel)) return;
    const fore = karta.get(nyckel);
    if (fore) {
      if (fore.mpn !== artikel) {
        karta.delete(nyckel);
        stangda.add(nyckel);
        rakning.konflikter++;
      }
      return;
    }
    const { marke, kalla } = markeFor(artikel, radensAdress, kallor);
    karta.set(nyckel, { mpn: artikel, marke, kalla });
  };

  for (const m of mappningar) {
    if (!isAosomMapping(m)) continue;
    if (!arIAosomSynkensUrval(m)) continue;
    rakning.aosomRader++;

    const bild = aosomArtikelbild(m);
    switch (bild.typ) {
      case "en": {
        rakning.enArtikel++;
        const varianterPaRaden = m.variants ?? [];
        const variantId = varianterPaRaden.length === 1 ? (varianterPaRaden[0].wixVariantId ?? "").trim() : "";
        if (variantId) {
          lagg(varianter, krockar.varianter, variantId, bild.artikel, m.sourceUrl);
        } else {
          rakning.utanVariantId++;
          lagg(produkter, krockar.produkter, m.wixProductId, bild.artikel, m.sourceUrl);
        }
        break;
      }
      case "flera": {
        rakning.sammanslagna++;
        for (const v of bild.varianter) {
          rakning.sammanslagnaVarianter++;
          // Mappningens adress hör till radens egen artikel, inte till färgerna.
          lagg(varianter, krockar.varianter, v.wixVariantId, v.artikel, v.artikel === bild.artikel ? m.sourceUrl : undefined);
        }
        break;
      }
      case "tvetydig":
        rakning.tvetydiga++;
        break;
    }
  }

  // Märket räknas på posterna som faktiskt följer med, efter krockarna.
  const utan = (karta: Map<string, Post>): Record<string, PrisjaktArtikel> => {
    const ut: Record<string, PrisjaktArtikel> = {};
    for (const [nyckel, { mpn, marke, kalla }] of karta) {
      ut[nyckel] = { mpn, marke };
      if (kalla) {
        rakning.medMarke++;
        rakning.markeKalla[kalla]++;
      } else {
        rakning.utanMarke++;
      }
    }
    return ut;
  };

  return { artiklar: { varianter: utan(varianter), produkter: utan(produkter) }, rakning };
}

/**
 * Rätt hemlighet för /api/prisjakt-artiklar?
 *
 * ☠️ BARA `REVIEW_INGEST_SECRET`, inte `CRON_SECRET`. Svaret bär artikelnumren
 * i klartext. CRON_SECRET finns i GitHub Actions, där loggarna är publika, och
 * en workflow som anropade rutten hade kunnat skriva numren dit. Butikens
 * hemlighet finns bara i de två Vercel-projekten.
 *
 * Jämförelsen tar lika lång tid oavsett var en felaktig nyckel skiljer sig.
 */
export function prisjaktAuktoriserad(
  authorization: string | null,
  hemlighet: string | undefined = process.env.REVIEW_INGEST_SECRET,
): "ok" | "nej" | "osatt" {
  if (!hemlighet) return "osatt";
  const summa = (s: string) => createHash("sha256").update(s).digest();
  return timingSafeEqual(summa(authorization ?? ""), summa(`Bearer ${hemlighet}`)) ? "ok" : "nej";
}
