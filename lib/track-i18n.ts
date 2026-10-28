// Svensk översättning av 17TRACK:s händelsetexter (carrierns originalspråk är
// engelska). Används av /api/track för att visa RIKTIG händelse-detalj per rad
// på /sparning — i stället för att kollapsa allt till ett generiskt "Paketet är
// på väg". Ren modul (inga next-importer) → enhetstestbar.
//
// Matchning: case-insensitive substring, FÖRSTA träff vinner → ordningen är
// medveten: SPECIFIKA fraser (sorterings­terminal, lastad, levererad-till-brevlåda)
// ligger FÖRE den generiska transit-frasen, annars skulle den generiska sluka dem.

/**
 * ☠️ "delivered" betyder inte alltid levererat. Texten kan säga att det INTE
 * har skett ("could not be delivered", "not delivered", "undelivered") eller
 * att det ska ske ("to be delivered", "will be delivered", "is being
 * delivered"). GLS skrev "The parcel is stored in the parcel center to be
 * delivered at a new delivery date." om ett paket som låg kvar på terminalen,
 * och /sparning sa "Paketet är levererat." (order 10075, 2026-10-13).
 *
 * Tvilling i lib/ae-track.ts (den modulen får inte importera härifrån), och
 * ett test fäller om de två glider isär.
 */
export const INTE_LEVERERAT =
  /\bundelivered\b|(?:\b(?:not|never|cannot)\b|n['’]t\b)[^.;]*\bdelivered\b|\b(?:be|being)\s+delivered\b/i;

/** Ett levererat-mönster som inte slår till när texten är INTE_LEVERERAT. Då
 *  hittar matchPhrase ingen fras, och anroparen faller tillbaka på 17TRACK:s
 *  egen stage, som redan vet vad händelsen är. */
function levererat(re: RegExp): RegExp {
  return new RegExp(`^(?![\\s\\S]*(?:${INTE_LEVERERAT.source}))[\\s\\S]*(?:${re.source})`, "i");
}

export const PHRASE_SV: Array<[RegExp, string]> = [
  // — Förberedelse / registrering —
  [/we have received a notification from your shipper.*preparing an item/i,
    "Vi har fått besked från avsändaren om att din vara förbereds. Spårningen uppdateras när paketet lämnats till transportören."],
  // ☠️ GLS registrering säger "the parcel was NOT YET handed over to GLS" och
  // innehåller alltså "handed over to". Utan den här regeln läste upphämtningen
  // nedan den som "Paketet har lämnats till transportören", ett senare steg än
  // sanningen (uppmätt på order 10079, 2026-10-12).
  [/shipment information received|info(rmation)? received|electronic.*info|label (has been )?created|shipping label|data was entered|not yet (been )?handed over/i,
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
  // GLS skriver "The parcel is expected to be delivered during the day." när
  // paketet är ute för leverans.
  [/out for delivery|with (the )?courier for delivery|delivery in progress|on vehicle for delivery|expected to be delivered (today|during the day)|will be delivered today/i,
    "Paketet är ute för leverans."],
  // "pick-up" med bindestreck förekommer också ("Package arrived at pick-up
  // point", uppmätt 2026-10-08) och stod annars kvar på engelska.
  [/available for pick[- ]?up|ready for pick[- ]?up|collect[^.]*pick[- ]?up point|at (the )?(pick[- ]?up|service) point|awaiting collection/i,
    "Paketet finns för upphämtning hos ditt ombud."],
  // — Levererat (SPECIFIK brevlåda/mottagare FÖRE generisk "delivered") —
  // Båda går genom levererat(), så "could not be delivered to the recipient"
  // inte blir levererat (se INTE_LEVERERAT).
  [levererat(/delivered to[^.]*(mailbox|recipient|address)|recipient'?s mailbox|left (in|at)[^.]*mailbox|delivered to (the )?door/),
    "Paketet har levererats till mottagarens brevlåda."],
  [levererat(/delivered|delivery completed|delivery successful|successfully delivered/), "Paketet är levererat."],
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
  const place = ort(address?.city ?? "") || ort(address?.state ?? "");
  const countrySv = svCountry(address?.country);
  if (place || countrySv) return [place, countrySv].filter(Boolean).join(", ");
  const raw = (rawLocation ?? "").trim();
  if (!raw) return "";
  return raw.split(",").map((seg) => ort(svCountry(seg))).filter(Boolean).join(", ");
}

/**
 * Samma ort med två stavningar. DPD skriver "Koege" och PostNord "Køge", så
 * samma terminal stavades olika från paket till paket (16 och 15 paket i
 * genomgången av alla 135 paket 2026-10-28).
 */
const ORTNAMN: Record<string, string> = {
  KOEGE: "Køge",
  "EL PRAT DE LLOBREGAT (BARCELONA)": "El Prat de Llobregat",
};

/** Ett transportörsnamn är ingen plats: PostNords förhandsbesked kom med
 *  platsen "PostNord" (samma genomgång). */
const TRANSPORTOR_SOM_PLATS = /^(?:postnord|posten|dhl|dpd|gls|ups|bring|budbee|instabox|dsv|db schenker)$/i;

function ort(segment: string): string {
  const s = segment.trim();
  if (TRANSPORTOR_SOM_PLATS.test(s)) return "";
  return ORTNAMN[s.toUpperCase()] ?? s;
}

function platsDelar(rawLocation: string | undefined | null): string[] {
  return (rawLocation ?? "").split(",").map((s) => s.trim()).filter(Boolean);
}

/** Händelsens land på svenska: adressens land i första hand, annars sista
 *  ledet i fri-text-platsen om det är ett land vi känner. Annars tomt. */
export function landForHandelse(
  rawLocation: string | undefined | null,
  address?: { country?: string } | null,
): string {
  const fran = svCountry(address?.country);
  if (fran) return fran;
  const delar = platsDelar(rawLocation);
  const sista = delar.length ? svCountry(delar[delar.length - 1]) : "";
  return LANDNAMN.has(sista) ? sista : "";
}

/**
 * Har händelsen en ort, alltså mer än bara ett land? Avgörs på platsen som
 * sidan visar (svLocation), inte på 17TRACK:s fri-text. Uppmätt i produktion
 * 2026-10-09: DPD-leveransen som sidan visade utan ort stod kvar på 21:46 i
 * stället för 19:46. Regeln räknade alltså en ort ur fri-texten, som sidan
 * inte visar när adressen har ett land.
 */
export function harOrt(
  rawLocation: string | undefined | null,
  address?: { city?: string; state?: string; country?: string } | null,
): boolean {
  return platsDelar(svLocation(rawLocation, address)).some((del) => !LANDNAMN.has(del));
}

// ── Tid ──────────────────────────────────────────────────────────────────────
// 17TRACK:s time_iso bär transportörens klockslag, men offseten stämmer inte
// alltid. Uppmätt 2026-10-08 på riktiga paket:
//   • PostNord: fast +01:00 även på sommartid, alltså en timme fel. Samma
//     leverans står som 18:44+02:00 hos DHL och 18:44:08+01:00 hos PostNord,
//     och AliExpress egna UTC-tider för ett PostNord-paket stämmer på minuten
//     först när klockslaget läses som svensk tid.
//   • DPD, serien 0120610…: händelserna som PostNord rapporterar in saknar ort,
//     bär DPD:s land "Tyskland" och är svensk tid märkt +00:00. PostNord säger
//     levererat 19:46, 17TRACK 19:46+00:00, och /sparning visade 21:46. DPD:s
//     egna skanningar med ort är däremot riktig UTC. Lästa så ligger de inom
//     några minuter från DPD-serien 0149 i samma terminaler (Køge, Stockholm),
//     och lästa som svensk tid exakt två timmar före.
//   • DHL och DPD, serien 0149…: rätt offset.
// Därför, för en händelse i ett land med svensk tid eller utan land:
//   • en offset som redan är svensk tid vid det ögonblicket står kvar,
//   • +00:00/Z med ort är riktig UTC och står kvar,
//   • +00:00/Z utan ort, +01:00 och +02:00 som inte stämmer, och en tid utan
//     offset läses som svensk väggklocka,
//   • andra offsets (Kina, USA …) är avsiktliga och står kvar.
const SVENSK_TID_LAND = new Set([
  "Sverige", "Danmark", "Norge", "Tyskland", "Nederländerna", "Belgien",
  "Luxemburg", "Frankrike", "Spanien", "Italien", "Österrike", "Schweiz",
  "Polen", "Tjeckien", "Slovakien", "Ungern", "Slovenien", "Kroatien",
]);

// Skapas vid första användningen: modulen laddas också i webbläsaren.
let stockholmFmt: Intl.DateTimeFormat | null = null;

/** Hur långt före UTC svensk tid ligger vid ögonblicket `utcMs`, i ms. */
function stockholmOffsetMs(utcMs: number): number {
  stockholmFmt ??= new Intl.DateTimeFormat("en-GB", {
    timeZone: "Europe/Stockholm",
    hourCycle: "h23",
    year: "numeric", month: "2-digit", day: "2-digit",
    hour: "2-digit", minute: "2-digit", second: "2-digit",
  });
  const delar = stockholmFmt.formatToParts(new Date(utcMs));
  const v = (typ: string) => Number(delar.find((d) => d.type === typ)?.value);
  const somUtc = Date.UTC(v("year"), v("month") - 1, v("day"), v("hour") % 24, v("minute"), v("second"));
  return somUtc - Math.floor(utcMs / 1000) * 1000;
}

/**
 * Ger händelsens tid i UTC ("…Z") enligt reglerna ovan. `medOrt` är om
 * händelsen har en ort (se harOrt). En tid som inte går att läsa, och en tid i
 * ett land med annan tid, kommer tillbaka oförändrad. Körs en gång per tid:
 * en andra körning på en "…Z"-tid utan ort flyttar den igen.
 */
export function svenskVaggklocka(timeIso: string, land: string, medOrt = false): string {
  if (!timeIso || (land && !SVENSK_TID_LAND.has(land))) return timeIso;
  const m = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})(?::(\d{2})(?:\.(\d{1,3})\d*)?)?(Z|[+-]\d{2}:?\d{2})?$/i
    .exec(timeIso.trim());
  if (!m) return timeIso;
  const [, y, mo, d, h, mi, s = "0", ms = "0", offset = ""] = m;
  const vagg = Date.UTC(+y, +mo - 1, +d, +h, +mi, +s, +ms.padEnd(3, "0"));
  if (offset) {
    const offsetMs = /^z$/i.test(offset)
      ? 0
      : (offset[0] === "-" ? -1 : 1) * (Number(offset.slice(1, 3)) * 60 + Number(offset.slice(-2))) * 60_000;
    const ogonblick = vagg - offsetMs;
    if (stockholmOffsetMs(ogonblick) === offsetMs) return new Date(ogonblick).toISOString();
    if (!/^(z|[+-]00:?00|\+0[12]:?00)$/i.test(offset)) return timeIso;
    if (offsetMs === 0 && medOrt) return new Date(ogonblick).toISOString();
  }
  // Två varv, så att dygnen när sommartiden börjar och slutar blir rätt.
  let utc = vagg - stockholmOffsetMs(vagg);
  utc = vagg - stockholmOffsetMs(utc);
  return new Date(utc).toISOString();
}

/** Händelsens tid i UTC ur 17TRACK:s fält. time_iso rättas enligt
 *  svenskVaggklocka, med händelsens land och om den har en ort. time_utc, som
 *  bara används när time_iso saknas, är redan UTC och lämnas som den är. */
export function tidForHandelse(
  ev: {
    time_iso?: string;
    time_utc?: string;
    location?: string;
    address?: { city?: string; state?: string; country?: string } | null;
  } | undefined | null,
): string {
  if (!ev) return "";
  if (ev.time_iso) {
    return svenskVaggklocka(
      ev.time_iso,
      landForHandelse(ev.location, ev.address),
      harOrt(ev.location, ev.address),
    );
  }
  return ev.time_utc || "";
}

/**
 * En händelse från före 2020 är ingen händelse. DPD-paketen bar 2026-10-08 en
 * rad med "01.01.2000, 00:00", transportörens tomma standardvärde, och den
 * hamnade sist i tidslinjen. En tid som inte går att tolka står kvar som förut,
 * om inte ett år före 2020 går att läsa ur den. Tom tid står också kvar.
 */
export function rimligTid(time: string | undefined | null): boolean {
  const s = (time ?? "").trim();
  if (!s) return true;
  const t = Date.parse(s);
  if (!Number.isNaN(t)) return new Date(t).getUTCFullYear() >= 2020;
  const ar = /\b(1[89]\d{2}|20\d{2})\b/.exec(s);
  return !ar || Number(ar[1]) >= 2020;
}

// ── Plats ────────────────────────────────────────────────────────────────────
const LANDNAMN = new Set(Object.values(COUNTRY_SV));
const SISTA_LEDET = new Set(["Ute för leverans", "Levererad", "Finns för upphämtning", "Leveransförsök misslyckades"]);
const RETUR = new Set(["Returneras", "Returnerad"]);

/**
 * Tar bort ett land som inte kan stämma. DPD fyller i "Tyskland" på händelser
 * utan plats, även när PostNord delar ut paketet i Sverige: "Levererad,
 * Tyskland" efter "På väg, Göteborg, Sverige" (uppmätt 2026-10-08 på tre
 * paket). Ett land utan ort, som inte är Sverige, blankas därför
 *   • på sista ledet (ute för leverans, levererad, ombud, misslyckat försök),
 *     som alltid sker i Sverige, och
 *   • efter den första händelsen med en ort i Sverige.
 * Retur till avsändaren rörs inte, och inte heller en plats med ort. Ett
 * Sverige-land utan ort före den första riktiga skanningen (PostNords förhands-
 * avisering) startar ingenting.
 */
export function rattaPlatser<T extends { time?: string; location?: string; status?: string }>(events: T[]): T[] {
  let iSverige = Infinity;
  for (const e of events) {
    if (!/, Sverige$/.test((e.location ?? "").trim())) continue;
    const t = Date.parse(e.time ?? "");
    if (!Number.isNaN(t) && t < iSverige) iSverige = t;
  }
  return events.map((e) => {
    const plats = (e.location ?? "").trim();
    if (!LANDNAMN.has(plats) || plats === "Sverige" || RETUR.has(e.status ?? "")) return e;
    const t = Date.parse(e.time ?? "");
    const efterSverige = !Number.isNaN(t) && t > iSverige;
    return SISTA_LEDET.has(e.status ?? "") || efterSverige ? { ...e, location: "" } : e;
  });
}

/** Minuten som nyckel, eftersom sidan visar tiden på minuten. Oläsbar tid → texten. */
function minutnyckel(time: string | undefined): string {
  const t = Date.parse(time ?? "");
  return Number.isNaN(t) ? (time ?? "") : String(Math.floor(t / 60_000));
}

/**
 * Tar bort dubbletter (samma minut + beskrivning + plats) ur en händelselista
 * och bevarar ordningen. 17TRACK dubblerar ibland samma scan (t.ex. två
 * identiska "10 juli 08:00 · Spanien"-rader), och när två transportörer följer
 * samma paket står leveransen hos båda, med olika sekunder (18:44:00 hos DHL,
 * 18:44:08 hos PostNord). Sidan visar minuter, så två sådana rader ser ut som
 * samma rad två gånger.
 */
export function dedupeEvents<
  T extends { time?: string; description?: string; location?: string },
>(events: T[]): T[] {
  const seen = new Set<string>();
  const unika: T[] = [];
  for (const e of events) {
    const key = `${minutnyckel(e.time)}|${e.description ?? ""}|${e.location ?? ""}`;
    if (seen.has(key)) continue;
    seen.add(key);
    unika.push(e);
  }
  // Samma händelse från två transportörer där den ena bara anger landet:
  // "Paketet är levererat." i "Uddevalla, Sverige" och i "Sverige" samma
  // minut. DHL och PostNord rapporterade varje leverans så på DHL-paketen
  // (genomgången 2026-10-28). Den mindre exakta raden tas bort. Två olika
  // orter samma minut är två händelser och står kvar.
  return unika.filter((e) => !unika.some((annan) =>
    annan !== e
    && minutnyckel(annan.time) === minutnyckel(e.time)
    && (annan.description ?? "") === (e.description ?? "")
    && sagerMindreOm(e.location, annan.location)));
}

/** Om platsen `a` bara är en del av `b` från slutet: tom, eller samma land
 *  som b utan b:s ort. */
function sagerMindreOm(a: string | undefined, b: string | undefined): boolean {
  const pa = platsDelar(a);
  const pb = platsDelar(b);
  if (pa.length >= pb.length) return false;
  return pa.every((del, i) => del === pb[pb.length - pa.length + i]);
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

/** Fraserna i PHRASE_SV som säger att paketet har kommit fram till kunden. */
const LEVERANSFRASER = new Set(["Paketet har levererats till mottagarens brevlåda.", "Paketet är levererat."]);

/** Ett meddelande till mottagaren om paketet, eller en påminnelse. */
const AVI = /\b(?:notif(?:y|ied|ication)|notice|reminder)\b/i;

export const AVI_FRAS = "Du har fått en avi om paketet.";

/**
 * matchPhrase, kontrollerad mot händelsens stage hos 17TRACK.
 *
 * ☠️ En text som låter som en leverans är inte alltid en. Ett DHL-paket som
 * PostNord delade ut stod som "Paketet har levererats till mottagarens
 * brevlåda." tre gånger (6, 8 och 10 oktober 2026) medan det väntade hos
 * ombudet, och det levererades först den 12:e. 17TRACK kallade de tre
 * händelserna OutForDelivery, inte Delivered. En leveransfras används därför bara när
 * stage är Delivered eller saknas. Annars blir det AVI_FRAS om texten talar om
 * ett meddelande eller en påminnelse, och null i övriga fall, så att anroparen
 * visar stagens egen text, som för INTE_LEVERERAT.
 */
export function matchPhraseForStage(description: string, stage?: string): string | null {
  const fras = matchPhrase(description);
  if (!fras || !LEVERANSFRASER.has(fras) || !stage || stage === "Delivered") return fras;
  return AVI.test(description) ? AVI_FRAS : null;
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
