// Svensk översättning av 17TRACK:s händelsetexter (carrierns originalspråk är
// engelska). Används av /api/track för att visa RIKTIG händelse-detalj per rad
// på /sparning — i stället för att kollapsa allt till ett generiskt "Paketet är
// på väg". Ren modul (inga next-importer) → enhetstestbar.
//
// Matchning: case-insensitive substring, FÖRSTA träff vinner → ordningen är
// medveten: SPECIFIKA fraser (sorterings­terminal, lastad, levererad-till-brevlåda)
// ligger FÖRE den generiska transit-frasen, annars skulle den generiska sluka dem.

export const PHRASE_SV: Array<[RegExp, string]> = [
  // — Förberedelse / registrering —
  [/we have received a notification from your shipper.*preparing an item/i,
    "Vi har fått besked från avsändaren om att din vara förbereds. Spårningen uppdateras när paketet lämnats till transportören."],
  [/shipment information received|info(rmation)? received|electronic.*info|label (has been )?created|shipping label/i,
    "Fraktinformation mottagen – paketet är registrerat."],
  // — Lagerhantering hos avsändaren (AliExpress/Cainiao-feeden) —
  // ☠️ MÅSTE ligga FÖRE upphämtningen. Alla fyra stegen sker innan
  // transportören rör paketet, och "picked and ready for packing" innehåller
  // ordet "picked" — hamnar den efter riskerar den att läsas som en
  // upphämtningsskanning, alltså ett senare skede än det verkligen är.
  //
  // Uppmätt på order 10024 (2026-08-31): alla fyra föll igenom till null och
  // visades i original på /sparning. Kartan täckte transportörens fraser
  // (facility/terminal/hub) men inte avsändarens lager, så en kund vars paket
  // ännu inte lämnat lagret fick hela historiken på engelska.
  [/being packed|order is (being )?pack|packing (has )?start/i,
    "Din order packas."],
  [/picked and ready for pack|picked[^.]*for packing/i,
    "Varan är plockad och klar för packning."],
  [/ready to be shipped|ready for (dispatch|shipment|shipping)|prepared for (dispatch|shipment)/i,
    "Paketet är färdigpackat och väntar på transportören."],
  [/left (the )?warehouse|departed[^.]*warehouse|dispatched from[^.]*warehouse|shipped (out )?from[^.]*warehouse/i,
    "Paketet har lämnat avsändarens lager."],
  // — Upphämtning / inlämning till transportör —
  [/item.*(picked up|collected)|picked up by|has been collected|pickup scan/i,
    "Paketet har hämtats av transportören."],
  [/handed over to|handover to|tendered to|accepted by (the )?carrier|item accepted|posting\/?collection/i,
    "Paketet har lämnats till transportören."],
  // — Sortering / lastning / terminal (SPECIFIKA före generisk transit) —
  [/(processed|being processed|sorted)[^.]*(sorting|sorterings|cent(er|re)|facility|terminal|hub)/i,
    "Paketet behandlas på sorteringsterminalen."],
  [/arrived at[^.]*(facility|terminal|sorting|hub|depot|cent(er|re))|arrival at[^.]*(facility|terminal|hub)|arrived at (the )?destination/i,
    "Paketet har anlänt till en terminal."],
  [/departed[^.]*(facility|terminal|hub|depot|cent(er|re))|left (the )?(facility|terminal|hub)|departure (scan|from)/i,
    "Paketet har lämnat terminalen."],
  [/has been loaded|item[^.]*loaded|loaded (onto|on|for)/i, "Paketet har lastats för transport."],
  // — Tull —
  [/customs/i, "Paketet hanteras i tullen."],
  // — Sista milen —
  [/out for delivery|with (the )?courier for delivery|delivery in progress|on vehicle for delivery/i,
    "Paketet är ute för leverans."],
  [/available for pickup|ready for pickup|collect[^.]*pickup point|at (the )?(pickup|service) point|awaiting collection/i,
    "Paketet finns för upphämtning hos ditt ombud."],
  // — Levererat (SPECIFIK brevlåda/mottagare FÖRE generisk "delivered") —
  [/delivered to[^.]*(mailbox|recipient|address)|recipient'?s mailbox|left (in|at)[^.]*mailbox|delivered to (the )?door/i,
    "Paketet har levererats till mottagarens brevlåda."],
  [/delivered|delivery completed|delivery successful|successfully delivered/i, "Paketet är levererat."],
  // — Avvikelser / retur —
  [/delivery[^.]*(failed|unsuccessful|attempt)|failed delivery|unable to deliver|no.?one (was )?(home|available)/i,
    "Leveransförsök misslyckades – ny leverans planeras."],
  [/returned to sender|return to sender|being returned/i, "Paketet skickas tillbaka till avsändaren."],
  [/exception|delay(ed)?|on hold|held at/i, "Det har uppstått en avvikelse i leveransen."],
  // — Generisk transit (MÅSTE ligga sist bland transit-fraserna) —
  [/in transit|on its way|under transportation|in transport|being transported|forwarded|en route|line-?haul|transport(ing)?/i,
    "Paketet är på väg genom transportnätet."],
];

// Land: ISO-2 ELLER engelskt namn (versaler) → svenskt namn. Täcker EU/EES +
// Norden + vanliga dropship-transitländer, så platspinnen på /sparning står på
// svenska ("Tyskland" i stället för "Germany"). Okänt land → originalet (så en
// stad felmärkt som land, eller ett omappat land, aldrig försvinner).
export const COUNTRY_SV: Record<string, string> = {
  SE: "Sverige", SWEDEN: "Sverige",
  DE: "Tyskland", GERMANY: "Tyskland",
  ES: "Spanien", SPAIN: "Spanien",
  FR: "Frankrike", FRANCE: "Frankrike",
  NL: "Nederländerna", NETHERLANDS: "Nederländerna",
  PL: "Polen", POLAND: "Polen",
  BE: "Belgien", BELGIUM: "Belgien",
  IT: "Italien", ITALY: "Italien",
  CZ: "Tjeckien", CZECHIA: "Tjeckien", "CZECH REPUBLIC": "Tjeckien",
  DK: "Danmark", DENMARK: "Danmark",
  NO: "Norge", NORWAY: "Norge",
  FI: "Finland", FINLAND: "Finland",
  GB: "Storbritannien", UK: "Storbritannien", "UNITED KINGDOM": "Storbritannien",
  AT: "Österrike", AUSTRIA: "Österrike",
  CH: "Schweiz", SWITZERLAND: "Schweiz",
  PT: "Portugal", PORTUGAL: "Portugal",
  IE: "Irland", IRELAND: "Irland",
  HU: "Ungern", HUNGARY: "Ungern",
  SK: "Slovakien", SLOVAKIA: "Slovakien",
  SI: "Slovenien", SLOVENIA: "Slovenien",
  RO: "Rumänien", ROMANIA: "Rumänien",
  BG: "Bulgarien", BULGARIA: "Bulgarien",
  HR: "Kroatien", CROATIA: "Kroatien",
  GR: "Grekland", GREECE: "Grekland",
  LT: "Litauen", LITHUANIA: "Litauen",
  LV: "Lettland", LATVIA: "Lettland",
  EE: "Estland", ESTONIA: "Estland",
  LU: "Luxemburg", LUXEMBOURG: "Luxemburg",
  US: "USA", USA: "USA", "UNITED STATES": "USA",
};

/** Översätter ett enskilt land (ISO-2 eller engelskt namn) till svenska.
 *  Okänt land → originaltexten (trimmad). Tom → tom. */
export function svCountry(input: string | undefined | null): string {
  const s = (input ?? "").trim();
  if (!s) return "";
  return COUNTRY_SV[s.toUpperCase()] ?? s;
}

/**
 * Bygger den svenska plats-etiketten för en spårningshändelse. Föredrar
 * strukturerad adress (stad + land) när 17TRACK ger den — då syns "exakt vart
 * paketet är" (t.ex. "Årsta, Sverige") — och faller annars tillbaka på fri-
 * text-platsen där varje land-segment översätts ("Germany" → "Tyskland",
 * "Frankfurt, Germany" → "Frankfurt, Tyskland"). Städer passerar oförändrade.
 */
export function svLocation(
  rawLocation: string | undefined | null,
  address?: { city?: string; state?: string; country?: string } | null,
): string {
  const place = (address?.city ?? "").trim() || (address?.state ?? "").trim();
  const countrySv = svCountry(address?.country);
  if (place || countrySv) return [place, countrySv].filter(Boolean).join(", ");
  const raw = (rawLocation ?? "").trim();
  if (!raw) return "";
  return raw.split(",").map((seg) => svCountry(seg)).filter(Boolean).join(", ");
}

/**
 * Tar bort exakta dubbletter (samma tid + beskrivning + plats) ur en
 * händelselista och bevarar ordningen. 17TRACK dubblerar ibland samma scan
 * (t.ex. två identiska "10 juli 08:00 · Spanien"-rader) vilket ser oproffsigt
 * ut i tidslinjen.
 */
export function dedupeEvents<
  T extends { time?: string; description?: string; location?: string },
>(events: T[]): T[] {
  const seen = new Set<string>();
  const out: T[] = [];
  for (const e of events) {
    const key = `${e.time ?? ""}|${e.description ?? ""}|${e.location ?? ""}`;
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(e);
  }
  return out;
}

/**
 * Översätter en 17TRACK-händelsetext till svenska via PHRASE_SV. Returnerar
 * null om ingen fras matchar (anroparen faller då tillbaka på stage-text).
 */
export function matchPhrase(description: string): string | null {
  const d = description || "";
  for (const [re, sv] of PHRASE_SV) {
    if (re.test(d)) return sv;
  }
  return null;
}

/** En spårnings-händelse med någon form av tidsstämpel (fältnamn varierar). */
export type TimedEvent = {
  time?: string;
  time_iso?: string;
  time_utc?: string;
  time_raw?: string;
  date?: string;
};

/**
 * Parsar händelsens tid till epoch-ms (riktig tidpunkt, inte sträng) så att
 * olika tidszons-offset (+02:00 vs Z) sorteras korrekt. Saknad/oparsebar tid →
 * -Infinity (hamnar sist vid nyast-först).
 */
function eventTimeMs(ev: TimedEvent): number {
  const s = ev.time || ev.time_iso || ev.time_utc || ev.time_raw || ev.date || "";
  const t = Date.parse(s);
  return Number.isNaN(t) ? -Infinity : t;
}

/**
 * Sorterar spårnings-händelser NYAST FÖRST (som 17track visar dem). Stabil vid
 * lika tid; händelser utan tid hamnar sist. Används av spårningssidan så att den
 * aktiva markören (första raden) hamnar på NUVARANDE steg i stället för det
 * äldsta ("Registrerad"). Muterar inte indata.
 */
export function orderEventsNewestFirst<T extends TimedEvent>(events: T[]): T[] {
  return events
    .map((ev, i) => ({ ev, i }))
    .sort((a, b) => {
      const ta = eventTimeMs(a.ev);
      const tb = eventTimeMs(b.ev);
      if (ta === tb) return a.i - b.i; // stabil ordning vid lika/avsaknad tid
      return tb - ta; // descending → nyast först
    })
    .map((x) => x.ev);
}
