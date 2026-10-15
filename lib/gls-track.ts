// lib/gls-track.ts
//
// GLS egen spårning för /sparning: adressen till GLS, tolkningen av svaret och
// svensk text för GLS händelser. Ren modul utan importer, så att node --test
// kan ladda den (samma skäl som lib/ae-track.ts). Nätverket bor i
// lib/gls-source.ts.
//
// ☠️ GLS LÄMNAR UT RESAN FÖRST MED MOTTAGARENS POSTNUMMER. Utan postnummer
// svarar GLS bara med statusen ("In transit"), och det är allt 17TRACK får.
// /sparning visade därför en enda rad, "Paketet är på väg genom
// transportnätet", utan tid och plats, medan GLS egen sida visade hela resan
// från Hamburg till Malmö (Leonards rapport 2026-10-12, order 10075).
//
// Uppmätt samma dag mot GLS egen spårningssida och dess kod:
//   • rstt029 (bara numret) ger statusen, ingen historik.
//   • rstt027 med postnumret ger tuStatus[0].history, samma rader som sidan
//     visar. Det är frågan GLS sida själv gör när postnumret står i adressen,
//     och den svarar likadant från en server.
//   • Fel postnummer ger 404 med lastError E609.
//   • GLS gamla öppna adress, rstt001, skickar vidare till "Register API
//     Access". Slutar rstt027 också svara faller /sparning tillbaka på
//     17TRACK, alltså samma vy som förut.
//
// GLS skriver händelserna på engelska oavsett språk i adressen, och städerna
// utan prickar ("Malmoe", "Neumuenster"). Båda rättas här.

/** GLS sökning med postnummer (rstt027), samma som GLS spårningssida frågar. */
export const GLS_SOK_URL = "https://gls-group.eu/app/service/open/rest/GROUP/en/rstt027";

/**
 * Ser numret ut som ett GLS-nummer? Track ID är åtta tecken (det som står i
 * fraktmejlet), kollinumret 11–12 siffror. Används bara när 17TRACK inte själv
 * sagt GLS, och GLS frågas ändå bara om butiken har ordern bakom numret.
 */
export function liknarGlsNummer(sparningsnummer: string): boolean {
  const s = sparningsnummer.trim().toUpperCase();
  return /^[A-Z0-9]{8}$/.test(s) || /^\d{11,12}$/.test(s);
}

/** Adressen till GLS sökning. Postnumret skickas utan mellanslag, som GLS sida gör. */
export function glsSokUrl(sparningsnummer: string, postnummer: string, nu: number = Date.now()): string {
  const p = new URLSearchParams({
    match: sparningsnummer.trim().toUpperCase(),
    postalCode: postnummer.replace(/\s/g, ""),
    type: "",
    caller: "witt002",
    millis: String(nu),
  });
  return `${GLS_SOK_URL}?${p.toString()}`;
}

/** Status i samma form som 17TRACK-vägen, så att /sparning inte ser skillnad. */
export type GlsStatus =
  | "InfoReceived"
  | "InTransit"
  | "OutForDelivery"
  | "AvailableForPickup"
  | "Delivered"
  | "DeliveryFailure"
  | "Returning";

export interface GlsHandelse {
  /** Lokal tid där händelsen skedde, "2026-01-12T18:30:00", utan offset. */
  tid: string;
  /** Orten, med svenska tecken där GLS skrivit dem utan prickar. */
  stad: string;
  /** Landskoden, "SE". */
  land: string;
  /** Svensk text, eller null när GLS skrivit något tabellen inte känner. */
  beskrivning: string | null;
  /** Rubriken ovanför texten på /sparning, eller null för en okänd text. */
  etikett: string | null;
  /** GLS egen text, som anroparen faller tillbaka på. */
  original: string;
}

export interface GlsSparning {
  status: GlsStatus;
  /** Nyast först, som GLS ger dem. */
  handelser: GlsHandelse[];
  /** Vem som delar ut i Sverige när GLS lämnar över paketet. */
  sistaLed?: "DSV";
  /** DSV:s eget sändnings-id, när GLS anger det. */
  sistaLedNummer?: string;
  /**
   * Hur DSV lämnar paketet, när historiken visar det: hos ett ombud, eller
   * hem efter att leveransdagen bokats med kunden.
   */
  satt?: "ombud" | "bokad";
}

/**
 * Det en GLS-text läses i. Samma text betyder olika saker beroende på vem som
 * delar ut i Sverige och om paketet går till ett ombud.
 */
export interface GlsSammanhang {
  /** "DSV" när DSV (tidigare DB Schenker) delar ut i Sverige. */
  partner?: "DSV";
  /** Historiken visar att paketet går till ett ombud (GLS "ParcelShop"). */
  ombud?: boolean;
  /** Händelsens landskod, "SE". */
  land?: string;
}

// ☠️ DSV DELAR UT VARJE GLS-PAKET I SVERIGE (audit 2026-10-15, åtta paket av
// åtta). GLS lämnar över i Malmö och skriver sedan DSV:s händelser på sitt eget
// språk. Uppmätt mot DSV:s spårning för samma paket:
//   • "stored in the parcel center to be delivered at a new delivery date" är
//     DSV:s "Mottagaren aviseras om leverans": DSV ringer, sms:ar eller mejlar
//     för att boka leveransdag (tunga paket, DSV:s Logistikpaket). /sparning sa
//     "ligger kvar på terminalen och delas ut en annan dag".
//   • "ParcelShop" är ett DSV-ombud (DSV Ombud Standard), inte ett GLS-ombud,
//     och avin kommer från DSV. "expected to be delivered during the day" är då
//     "utkörning pågår" till ombudet, inte hem till kunden.
//   • "reached the ParcelShop" stod på engelska: ingen regel kände igen den.
type Regel = [RegExp, (s: GlsSammanhang) => readonly [text: string, etikett: string]];

function ombudet(s: GlsSammanhang): string {
  return s.partner === "DSV" ? "DSV-ombudet" : "GLS-ombudet";
}

// I Sverige är terminalerna DSV:s, inte GLS (Malmö är där GLS lämnar över).
function terminal(s: GlsSammanhang): string {
  return s.partner === "DSV" && s.land === "SE" ? "en terminal" : "en GLS-terminal";
}

/** Raden där DSV bokar leveransdag. tolkaGlsSvar läser satt "bokad" ur den. */
const BOKNING = "Leveransen bokas";

// Första träff vinner, så den specifika texten står före den allmänna:
//   • "the parcel was not yet handed over to GLS" innehåller "handed over to
//     GLS". Läst som upphämtning hade registreringen sett ut som ett senare
//     steg än det är.
//   • "delivered at the ParcelShop" innehåller "delivered". Paketet ligger hos
//     ombudet och är inte utlämnat.
//   • "expected to be delivered during the day" är ute för leverans, inte levererat.
//   • "stored in the parcel center to be delivered at a new delivery date"
//     innehåller "delivered". Paketet ligger kvar på terminalen. Utan regeln
//     sa /sparning "Paketet är levererat." om ett paket som låg på terminalen
//     klockan ett på natten (order 10075, 2026-10-13).
const GLS_SV: Regel[] = [
  [/data was entered|not yet (been )?handed over/i,
    () => ["Fraktinformation mottagen – paketet är registrerat hos GLS.", "Registrerad"]],
  [/return(ed)? to (the )?(sender|shipper)|being returned|on its way back/i,
    () => ["Paketet skickas tillbaka till avsändaren.", "Returneras"]],
  [/(delivered|handed over) (at|to) the parcel ?shop/i,
    (s) => s.partner === "DSV"
      ? ["Paketet finns hos DSV-ombudet. Invänta avin från DSV innan du hämtar det.", "Finns för upphämtning"]
      : ["Paketet finns att hämta hos ett GLS-ombud.", "Finns för upphämtning"]],
  [/(picked up|collected) (by the consignee )?(from|at) the parcel ?shop/i,
    (s) => [`Paketet är hämtat hos ${ombudet(s)}.`, "Levererad"]],
  [/(reached|arrived at) the parcel ?shop/i,
    (s) => [`Paketet har kommit fram till ${ombudet(s)}.`, "Hos ombudet"]],
  // Bokningen är uppmätt på hempaket i Sverige (order 10082 mot DSV:s egen
  // spårning: "Mottagaren aviseras om leverans"). Inget av de granskade
  // ombudspaketen hade texten. Går paketet till ett ombud, eller står texten
  // på en tysk terminal, betyder den bara att paketet ligger kvar en dag till.
  [/new delivery date|rescheduled/i,
    (s) => s.partner === "DSV" && !s.ombud && s.land === "SE"
      ? ["DSV kontaktar dig via sms, e-post eller telefon för att boka leveransdag.", BOKNING]
      : ["Paketet ligger kvar på terminalen och delas ut en annan dag.", "Ny leveransdag"]],
  [/stored in the (gls )?parcel cent(er|re)/i,
    () => ["Paketet ligger på terminalen.", "På terminalen"]],
  [/on its way to the (final )?parcel cent(er|re)/i,
    (s) => [`Paketet är på väg till ${terminal(s)}.`, "På väg"]],
  [/could not be delivered|not be delivered|consignee was (absent|not present)/i,
    () => ["Leveransförsök misslyckades – ny leverans planeras.", "Leveransförsök misslyckades"]],
  // Ett DSV-paket kan vara på väg till ett ombud innan historiken visar det,
  // så då står det inte "hem till dig". Ombudet syns i historiken en halvtimme
  // senare, och då skrivs raden om.
  [/expected to be delivered|out for delivery/i,
    (s) => s.ombud
      ? [`Paketet är på väg till ${ombudet(s)}.`, "På väg till ombudet"]
      : s.partner === "DSV"
        ? ["Paketet har lämnat terminalen och kommer fram i dag.", "Ute för leverans"]
        : ["Paketet är ute för leverans och väntas komma i dag.", "Ute för leverans"]],
  [/has been delivered|was delivered|successfully delivered/i,
    (s) => s.ombud
      ? [`Paketet är hämtat hos ${ombudet(s)}.`, "Levererad"]
      : ["Paketet är levererat.", "Levererad"]],
  [/(handed over|forwarded) to (the )?(final )?(delivery )?partner/i,
    (s) => s.partner === "DSV"
      ? ["Paketet har lämnats till DSV, som delar ut det i Sverige.", "På väg"]
      : ["Paketet har lämnats till leveranspartnern.", "På väg"]],
  [/handed over to GLS/i,
    () => ["Paketet har lämnats till GLS.", "Hämtad"]],
  [/(reached|arrived at) the final parcel cent(er|re)/i,
    () => ["Paketet har kommit till terminalen som delar ut det.", "Ankommen till terminal"]],
  [/(reached|arrived at) the parcel cent(er|re)/i,
    (s) => [`Paketet har kommit till ${terminal(s)}.`, "Ankommen till terminal"]],
  [/left the parcel cent(er|re)/i,
    () => ["Paketet har lämnat terminalen.", "Avgått"]],
];

/** Svensk text och rubrik för en GLS-händelse, eller null för en okänd text. */
export function oversattGls(text: string, s: GlsSammanhang = {}): { text: string; etikett: string } | null {
  for (const [re, regel] of GLS_SV) {
    if (re.test(text)) {
      const [sv, etikett] = regel(s);
      return { text: sv, etikett };
    }
  }
  return null;
}

/** GLS progressBar.statusInfo i 17TRACK-vägens form. Okänt blir InTransit. */
export function glsStatus(statusInfo: unknown, retur: unknown): GlsStatus {
  if (retur === true) return "Returning";
  switch (String(statusInfo ?? "").trim().toUpperCase()) {
    case "DELIVERED": return "Delivered";
    case "DELIVEREDPS": return "AvailableForPickup";
    case "INDELIVERY": return "OutForDelivery";
    case "NOTDELIVERED": return "DeliveryFailure";
    case "PREADVICE": return "InfoReceived";
    default: return "InTransit";
  }
}

// GLS skriver tyska orter utan prickar. En allmän regel går inte här: "oe" är
// ingen omljud i Itzehoe, Soest eller Coesfeld. Bara kända orter rättas.
const TYSKA_ORTER: Record<string, string> = {
  NEUMUENSTER: "Neumünster",
  MUENCHEN: "München",
  KOELN: "Köln",
  NUERNBERG: "Nürnberg",
  DUESSELDORF: "Düsseldorf",
  MUENSTER: "Münster",
  OSNABRUECK: "Osnabrück",
  LUEBECK: "Lübeck",
  GOETTINGEN: "Göttingen",
  SAARBRUECKEN: "Saarbrücken",
  WUERZBURG: "Würzburg",
};

/**
 * Orten som /sparning visar. Svenska orter skrivs med å, ä och ö ("Malmoe"
 * → "Malmö", "Vaesteraas" → "Västerås"). Svenska ortnamn har i praktiken inga
 * äkta "aa", "ae" eller "oe", så där räcker en regel. Tyska orter rättas bara
 * när de står i listan ovan, och andra länder visas som GLS skrev dem.
 */
export function glsStad(stad: string, land: string): string {
  const s = stad.trim();
  if (!s) return "";
  const kand = TYSKA_ORTER[s.toUpperCase()];
  if (kand) return kand;
  if (land.trim().toUpperCase() !== "SE") return s;
  return s
    .replace(/aa/g, "å").replace(/A[aA]/g, "Å")
    .replace(/ae/g, "ä").replace(/A[eE]/g, "Ä")
    .replace(/oe/g, "ö").replace(/O[eE]/g, "Ö");
}

function str(v: unknown): string {
  return typeof v === "string" ? v.trim() : "";
}

function obj(v: unknown): Record<string, unknown> | undefined {
  return v && typeof v === "object" ? (v as Record<string, unknown>) : undefined;
}

/**
 * DSV:s eget sändnings-id ur GLS referenser, eller undefined. Det är numret
 * DSV:s spårning söker på (uppmätt 2026-10-15: GLS "Swedish shipment number"
 * = DSV:s "Sändnings-ID", tio siffror).
 *
 * ☠️ ALLOWLIST PÅ NAMN OCH TYP. Referenslistan bär också avsändarens egna
 * ordernummer (CUSTREF) och avsändarens GLS-kundnummer ("Origin National
 * Reference"), och de leder till leverantören. Bara den här raden läses.
 */
function dsvSandningsId(referenser: unknown[]): string | undefined {
  for (const r of referenser) {
    const ref = obj(r);
    if (str(ref?.type).toUpperCase() !== "GLSREF") continue;
    if (!/^swedish shipment number:?$/i.test(str(ref?.name))) continue;
    const varde = str(ref?.value);
    return /^\d{6,14}$/.test(varde) ? varde : undefined;
  }
  return undefined;
}

/**
 * Tolkar GLS svar på rstt027. Null när svaret inte har någon historik: fel
 * postnummer (404, E609), ett okänt nummer eller en ny form.
 *
 * ☠️ Bara händelserna, statusen och DSV:s sändnings-id följer med. Svaret bär
 * också referenser (avsändarens egna ordernummer), vikt och postnummer, och
 * inget av det får nå sidan. Av referenserna läses NAMNET, för att se om DSV
 * (tidigare DB Schenker) delar ut paketet i Sverige, och värdet på exakt en
 * rad: DSV:s sändnings-id (dsvSandningsId).
 */
export function tolkaGlsSvar(svar: unknown): GlsSparning | null {
  const lista = obj(svar)?.tuStatus;
  const tu = Array.isArray(lista) ? obj(lista[0]) : undefined;
  if (!tu || !Array.isArray(tu.history)) return null;

  const referenser = Array.isArray(tu.references) ? tu.references : [];
  // GLS kallar referenserna "DB Schenker Sweden …". DSV köpte DB Schenker, och
  // det är DSV kunden möter: på spårningssidan, på ombudet och i avin. Byter
  // GLS till DSV:s namn känns paketet igen ändå.
  const dsv = referenser.some((r) => /schenker|\bdsv\b/i.test(str(obj(r)?.name)));
  // Ombudet syns i historiken som en ParcelShop-händelse, och raderna före den
  // läses om när den kommit.
  const ombud = tu.history.some((h) => /parcel ?shop/i.test(str(obj(h)?.evtDscr)));

  const handelser: GlsHandelse[] = [];
  for (const rad of tu.history) {
    const h = obj(rad);
    const original = str(h?.evtDscr);
    const datum = str(h?.date);
    if (!original || !/^\d{4}-\d{2}-\d{2}$/.test(datum)) continue;
    const tid = str(h?.time);
    const adress = obj(h?.address);
    const land = str(adress?.countryCode).toUpperCase();
    const svensk = oversattGls(original, { partner: dsv ? "DSV" : undefined, ombud, land });
    handelser.push({
      tid: /^\d{2}:\d{2}(:\d{2})?$/.test(tid) ? `${datum}T${tid}` : datum,
      stad: glsStad(str(adress?.city), land),
      land,
      beskrivning: svensk?.text ?? null,
      etikett: svensk?.etikett ?? null,
      original,
    });
  }
  if (handelser.length === 0) return null;

  const progress = obj(tu.progressBar);
  const nummer = dsv ? dsvSandningsId(referenser) : undefined;
  // Bokningen är raden GLS_SV redan kallat "Leveransen bokas", så rutan och
  // raden kan inte säga olika saker.
  const bokad = handelser.some((h) => h.etikett === BOKNING);
  const satt = dsv && ombud ? "ombud" : bokad ? "bokad" : undefined;
  return {
    status: glsStatus(progress?.statusInfo, progress?.retourFlag),
    handelser,
    ...(dsv ? { sistaLed: "DSV" } : {}),
    ...(nummer ? { sistaLedNummer: nummer } : {}),
    ...(satt ? { satt } : {}),
  };
}
