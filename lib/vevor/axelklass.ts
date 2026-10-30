// Vilka VEVOR-varianter som får dela en sida (Leonard 2026-10-30: "Följ
// rekommendationen").
//
// Regeln: en familj blir en produkt bara när artiklarna är samma vara i olika
// färg, mönster, storlek, längd eller förpackningsstorlek. Varor som fungerar
// olika, med annan effekt, kapacitet, modell eller ett annat antal av en del
// (lådor, brännare), får en egen sida var.
//
// Skälen, ur granskningen 2026-10-30:
// - Recensionerna. En recension av 1 800 W-sågen hör inte hemma på
//   850 W-sågens sida, inte heller på en gemensam sida (marknadsföringslagen
//   12 c § och EU:s förbud mot vilseledande recensioner). Amazon delar sedan
//   2026 recensioner bara mellan färg-, mönster-, storleks- och
//   förpackningsvarianter.
// - Googles flöde kräver att varianter är samma vara (item_group_id).
//
// Uppmätt 2026-10-30 på 923 länkade familjer: 473 olika axelnamn. Vanligast
// Storlek (197), Färg (131), Kapacitet (54), Stil (46), Kvantitet (44), Typ (43),
// Material (24), Längd (22), Lastkapacitet (20) och Kraft (17).
//
// Fyra egenskaper som inte ska tas bort:
//
// 1. ☠️ En axel som inte går att avgöra är `oklar`, och familjen slås inte
//    ihop. Gränsfallen listas för Leonard i stället för att gissas.
// 2. ☠️ En enhet för funktion (W, V, Ah, bar, liter …) som skiljer mellan
//    värdena gör axeln till `funktion`, vad den än heter. "Storlek: 3 L / 6 L"
//    är kapacitet.
// 3. Ett sammansatt namn ("Färg-Size", "Antal och färg") avgörs del för del,
//    och alla delar måste vara tillåtna.
// 4. Förpackningsstorlek är bara en axel som heter som en förpackning
//    ("Antal", "Kvantitet", "Antal stycken") och vars värden är antal. "Antal
//    lådor" och andra antal av en del är funktion.
//
// Ren modul.

export type Axelklass = "farg" | "storlek" | "langd" | "forpackning" | "funktion" | "oklar";

/** Klasser som får dela en sida. */
export const TILLATNA: ReadonlySet<Axelklass> = new Set(["farg", "storlek", "langd", "forpackning"]);

const lc = (s: string) => s.replace(/\s+/g, " ").trim().toLowerCase();

const FARG = /f[äa]rg|colou?r|nyans|m[öo]nster|motiv|\bprint\b/;
const LANGD = /l[äa]ngd|length/;
const STORLEK =
  /storlek|\bsize\b|m[åa]tt|dimension|bredd|h[öo]jd|djup|diameter|tjocklek|area\b|format|\b(l|b|h)\s*x\s*(l|b|h)\b/;
/** Namn som är en förpackning. Hela namnet (efter rensning) ska matcha. */
const FORPACKNING =
  /^(antal|kvantitet|quantity|pack|förpackning|förpackningsstorlek|paket|paketstorlek|antal stycken|antal st|antal paket|antal per (låda|förpackning|paket)|antal i (förpackningen|paketet)|antal uppsättningar|uppsättningar|totalt antal artiklar|antal artiklar|set|setstorlek|bitar|stycken|st)$/;
/** Namn som är en funktion. */
const FUNKTION =
  /effekt|kraft|watt|driva|spänning|volt|ström|batteri|kapacitet|last|bär(ande|förmåga)|belastning|vridmoment|hastighet|varv|tryck|flöde|motor|modell|version|typ|tpye|program|funktion|fungera|tillbehör|utrustning|konfiguration|kompatib|tillämplig (fordon|modell|bil)|passar (bil|fordon)|fordon|uppvärmning|kontroll|styrning|växl|redskap|\bmed\b|\butan\b|eller (inte|ej)|ja\/nej/;
/** "Antal X" där X är en del av varan, inte förpackningen. */
const ANTAL_DEL = /^antal\s+\S/;

/** En enhet som betyder funktion: effekt, el, tryck, flöde, volym, varvtal. */
const FUNKTIONSENHET =
  /(\d+(?:[.,]\d+)?)\s*(k?w|watt|v|volt|ah|mah|a|bar|psi|rpm|nm|btu|gph|l\/h|l\/min|l\/timme|liter|l|ml|cl|dl|quart|kvart|gallon|gal|ku\.?\s*ft|kg\/24|pund\/24)(?![a-zåäö])/gi;

/** Värdets funktionsenheter med tal, till exempel "5 kw". */
function funktionsenheter(v: string): string {
  return [...v.matchAll(FUNKTIONSENHET)].map((m) => `${m[1].replace(",", ".")} ${m[2].toLowerCase()}`).join("|");
}
const SIFFRA = /\d/;
const STORLEKSORD =
  /^(x{0,3}s|m|x{0,4}l|liten|litet|små|smal|mini|medium|mellan|mellanstor|stor|stort|stora|extra stor|small|large|junior|vuxen|barn)$/;

/** Ett namns delar: "Färg-Size" → ["färg", "size"]. */
export function namndelar(namn: string): string[] {
  return lc(namn)
    .split(/\s*(?:\s-\s|-|&|\+|\/|,|\soch\s)\s*/)
    .map((d) => d.trim())
    .filter(Boolean);
}

function delklass(del: string): Axelklass {
  if (FORPACKNING.test(del)) return "forpackning";
  if (FARG.test(del)) return "farg";
  if (FUNKTION.test(del)) return "funktion";
  if (ANTAL_DEL.test(del)) return "funktion";
  if (LANGD.test(del)) return "langd";
  if (STORLEK.test(del)) return "storlek";
  return "oklar";
}

/**
 * Axelns klass ur namnet och värdena. Ett sammansatt namn får den sämsta
 * delens klass: funktion före oklar före en tillåten klass.
 */
export function axelklass(namn: string, varden: readonly string[]): Axelklass {
  const delar = namndelar(namn);
  if (delar.length === 0) return "oklar";
  const vs = varden.map(lc).filter(Boolean);
  // En funktionsenhet avgör bara när den skiljer: "5 kW-Röd" och "5 kW-Orange"
  // skiljer sig på färgen.
  const enheter = vs.map(funktionsenheter);
  if (enheter.some(Boolean) && new Set(enheter).size > 1) return "funktion";
  const klasser = delar.map(delklass);
  if (klasser.includes("funktion")) return "funktion";
  if (klasser.includes("oklar")) return "oklar";
  // Ett mått, en längd och en förpackning har ett tal (eller "S", "Stor") i
  // varje värde. Ett namn med en färgdel får ha värden utan tal.
  const harFarg = klasser.includes("farg");
  if (!harFarg && vs.some((v) => !SIFFRA.test(v) && !STORLEKSORD.test(v))) return "oklar";
  if (klasser.length === 1) return klasser[0];
  // Ett sammansatt namn med bara tillåtna delar: färgen bär bilden om den finns.
  return harFarg ? "farg" : klasser[0];
}

/** Får axlarna dela en sida? `oklar` och `funktion` säger varför inte. */
export function familjensKlass(axlar: readonly { namn: string; varden: readonly string[] }[]): "tillaten" | "funktion" | "oklar" {
  const k = axlar.map((a) => axelklass(a.namn, a.varden));
  if (k.includes("funktion")) return "funktion";
  if (k.some((x) => !TILLATNA.has(x))) return "oklar";
  return "tillaten";
}

/**
 * Visar raden att varorna fungerar olika, också när den inte är axeln? En
 * effekt, kapacitet, tryck eller last som skiljer, eller en funktionsenhet som
 * skiljer. Ett antal av en del ("Antal spikar") räknas inte: på en större vara
 * följer det storleken.
 */
export function arFunktionsrad(namn: string, varden: readonly string[]): boolean {
  const enheter = varden.map(lc).filter(Boolean).map(funktionsenheter);
  if (enheter.some(Boolean) && new Set(enheter).size > 1) return true;
  return namndelar(namn).some((d) => !FORPACKNING.test(d) && !FARG.test(d) && FUNKTION.test(d));
}

