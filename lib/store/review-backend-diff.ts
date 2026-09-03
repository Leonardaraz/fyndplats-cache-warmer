// Jämför recensionsaggregatet mellan Wix-lagret och Postgres-lagret.
//
// ☠️ VARFÖR DEN FINNS. Steg 3 i recensionsmigreringen är att sätta
// `REVIEWS_BACKEND=postgres`. Efter den växlingen läser butikens produktkort
// sina stjärnor ur en ANNAN databas — och om kopian skiljer sig ser ingen det,
// för båda sidorna svarar 200 med ett giltigt aggregat. Ett kort som tappat
// sina stjärnor ser exakt ut som en produkt utan omdömen.
//
// Radantalen är redan verifierade (2 514 = 2 514, noll fältavvikelser), men det
// är INTE samma fråga. Aggregatet filtrerar på `status` och `rating` och
// grupperar per produkt: en status som kopierats som fel typ, ett `rating` som
// blivit sträng i JSONB, en produkt-id som tappat sin trimning — allt sådant
// passerar en radräkning och fäller ett aggregat.
//
// Därför mäts det som butiken FAKTISKT konsumerar, före växlingen i stället för
// efter. Samma hållning som `jamforelsePris` i Aosom-synken: facit är det
// kunden ser, inte det vi tror att den ser.

import type { ProduktBetyg } from "./reviews";

/** Ett produkt-id där de två lagren inte säger samma sak. */
export interface Avvikelse {
  productId: string;
  /** Antal/snitt i Wix-lagret, null när produkten saknas där. */
  wix: { antal: number; snitt: number } | null;
  /** Antal/snitt i Postgres, null när produkten saknas där. */
  postgres: { antal: number; snitt: number } | null;
}

export interface BetygsDiff {
  wixProdukter: number;
  postgresProdukter: number;
  wixOmdomen: number;
  postgresOmdomen: number;
  /** Produkter som skiljer sig, kapade till MAX_AVVIKELSER i svaret. */
  avvikande: Avvikelse[];
  /** Hela antalet avvikande, även när listan kapats. */
  avvikandeTotalt: number;
  /** Sant bara när växlingen är ofarlig: båda sidor lästa, noll avvikelser. */
  saker: boolean;
  /**
   * ☠️ Wix-sidan är TOM medan Postgres är frisk — alltså steg 5 gjort, källan
   * raderad. Då finns det ingenting kvar att jämföra mot, och jämförelsen är
   * EJ TILLÄMPLIG i stället för underkänd.
   *
   * Utan den skillnaden hade rutten fällt vid varenda körning efter
   * raderingen, för alltid. Ett falsklarm som alltid fyrar är lika illa som ett
   * fel ingen ser — båda slutar med att mottagaren slutar läsa. Samma hållning
   * som `källanTömd` i migreringens verifiering.
   */
  kallanTomd: boolean;
  /** Klartext om varför den inte är säker. Tom sträng när den är det. */
  varning: string;
}

/** Fler än så i ett svar hjälper ingen — mönstret syns i de första. */
export const MAX_AVVIKELSER = 50;

/**
 * ☠️ ETT TOMT AGGREGAT ÄR INTE ETT GODKÄNNANDE.
 *
 * Faller läsningen mot ett av lagren, eller är tabellen tom, blir listan tom —
 * och två tomma listor är per definition identiska. Utan golvet hade en
 * fullständigt misslyckad Postgres-läsning rapporterats som "noll avvikelser,
 * växla på". Samma spärr-form som `MIN_FEED_RADER` och `MIN_WIX_PRODUKTER`:
 * skydda mot att allt rasar, inte mot att en rad rör sig.
 */
export const MIN_PRODUKTER = 100;

function nyckla(rader: ProduktBetyg[]): Map<string, { antal: number; snitt: number }> {
  const m = new Map<string, { antal: number; snitt: number }>();
  for (const r of rader) m.set(r.productId, { antal: r.antal, snitt: r.snitt });
  return m;
}

function summera(rader: ProduktBetyg[]): number {
  return rader.reduce((s, r) => s + r.antal, 0);
}

/**
 * Snittet jämförs med tolerans, antalet exakt.
 *
 * Postgres avrundar i SQL (`round(avg(rating), 1)`) och Wix i JavaScript. Två
 * korrekta implementationer kan därför landa på 4,6 mot 4,7 vid exakt 4,65 —
 * en skillnad kunden aldrig kan se och som inte får fälla en växling. Antalet
 * har ingen sådan ursäkt: skiljer det sig är en rad borta.
 */
const SNITT_TOLERANS = 0.11;

export function jamforBetyg(wix: ProduktBetyg[], postgres: ProduktBetyg[]): BetygsDiff {
  const w = nyckla(wix);
  const p = nyckla(postgres);

  const avvikande: Avvikelse[] = [];
  for (const productId of new Set([...w.keys(), ...p.keys()])) {
    const a = w.get(productId) ?? null;
    const b = p.get(productId) ?? null;
    if (a && b && a.antal === b.antal && Math.abs(a.snitt - b.snitt) <= SNITT_TOLERANS) continue;
    avvikande.push({ productId, wix: a, postgres: b });
  }
  avvikande.sort((x, y) => x.productId.localeCompare(y.productId));

  // ☠️ Tömd källa prövas FÖRE golvet. Annars hade en raderad Wix-sida (steg 5)
  // fallit ut som "för få produkter" och fällt jobbet vid varje körning
  // därefter — ett larm som alltid fyrar, alltså inget larm alls.
  const kallanTomd = wix.length === 0 && postgres.length >= MIN_PRODUKTER;

  const tunt = !kallanTomd && (wix.length < MIN_PRODUKTER || postgres.length < MIN_PRODUKTER);
  const varning = kallanTomd
    ? `Wix-sidan är tom (steg 5 gjort). Ingenting att jämföra mot — `
      + `Postgres har ${postgres.length} produkter och ${summera(postgres)} synliga omdömen.`
    : tunt
      ? `För få produkter för att kunna dra en slutsats (wix=${wix.length}, `
        + `postgres=${postgres.length}, golv=${MIN_PRODUKTER}). Ett tomt aggregat `
        + "matchar ett annat tomt aggregat — det är ett LÄSFEL, inte ett godkännande."
      : avvikande.length > 0
        ? `${avvikande.length} produkter skiljer sig. Växla INTE förrän de är förklarade.`
        : "";

  return {
    wixProdukter: wix.length,
    postgresProdukter: postgres.length,
    wixOmdomen: summera(wix),
    postgresOmdomen: summera(postgres),
    avvikande: avvikande.slice(0, MAX_AVVIKELSER),
    avvikandeTotalt: avvikande.length,
    // Tömd källa är varken säker eller underkänd — den svarar inte på frågan.
    saker: !kallanTomd && !tunt && avvikande.length === 0,
    kallanTomd,
    varning,
  };
}
