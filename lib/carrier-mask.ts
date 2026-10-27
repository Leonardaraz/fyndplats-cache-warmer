// lib/carrier-mask.ts
//
// EN enda källa för carrier-maskering i headless. Används av både
// app/api/track (publika spårningssidan) och app/api/track17-webhook
// (17TRACK-push → leverans-mejl). Att ha listan på ETT ställe gör att de två
// kanalerna aldrig kan divergera i vad de råkar visa för kunden.
//
// ALLOWLIST (fail-safe): bara kända EU/SE-transportörer får visas. Allt annat
// — 4PX, Yanwen, China Post, Cainiao, okända kinesiska last-mile-bolag —
// faller igenom till "Fraktpartner". En denylist missar varje ny ursprungs-
// carrier; en allowlist kan aldrig läcka en vi inte räknat med. Varje regel
// normaliserar samtidigt bort landssuffix ("PostNord Sweden" → "PostNord").

const CARRIER_ALLOW: Array<{ test: RegExp; label: string }> = [
  { test: /postnord/i, label: "PostNord" },
  { test: /\bdhl\b/i, label: "DHL" },
  { test: /\bdpd\b/i, label: "DPD" },
  { test: /\bgls\b/i, label: "GLS" },
  { test: /\bdsv\b/i, label: "DSV" },
  { test: /schenker/i, label: "Schenker" },
  { test: /\bbring\b/i, label: "Bring" },
  { test: /instabox/i, label: "Instabox" },
  { test: /budbee|instabee/i, label: "Budbee" },
  { test: /airmee/i, label: "Airmee" },
  { test: /early\s*bird/i, label: "Early Bird" },
  { test: /\bups\b/i, label: "UPS" },
  { test: /fedex/i, label: "FedEx" },
  { test: /\btnt\b/i, label: "TNT" },
  { test: /\b(?:posten|posti)\b/i, label: "Posten" },
  // Bredare EU-bud: produkterna skickas från EU-lager, så riktiga EU-
  // transportörer FÅR visas (mer transparent spårning). Varje mönster är
  // verifierat att INTE matcha "Cainiao"/"AliExpress" (de förblir maskerade).
  { test: /postnl/i, label: "PostNL" },
  { test: /inpost/i, label: "InPost" },
  { test: /colissimo/i, label: "Colissimo" },
  { test: /chronopost/i, label: "Chronopost" },
  { test: /mondial\s*relay/i, label: "Mondial Relay" },
  { test: /deutsche\s*post/i, label: "Deutsche Post" },
  { test: /poste\s*italiane/i, label: "Poste Italiane" },
  { test: /royal\s*mail/i, label: "Royal Mail" },
  { test: /\bevri\b/i, label: "Evri" },
  { test: /\bhermes\b/i, label: "Hermes" },
  { test: /bpost/i, label: "Bpost" },
  { test: /omniva/i, label: "Omniva" },
  { test: /helthjem/i, label: "Helthjem" },
];

/** Neutralt namn för okända/ursprungs-carriers. */
export const MASKED_CARRIER = "Fraktpartner";

/**
 * Maskerar ett carrier-namn. Känd EU/SE-transportör → normaliserad etikett
 * ("PostNord Sweden" → "PostNord"). Tomt → "". Allt annat → "Fraktpartner".
 */
export function maskCarrier(name: string | null | undefined): string {
  if (!name) return "";
  for (const { test, label } of CARRIER_ALLOW) {
    if (test.test(name)) return label;
  }
  return MASKED_CARRIER;
}

/**
 * Som maskCarrier men returnerar undefined för okänd/maskerad carrier i
 * stället för "Fraktpartner". Bra när ett UI hellre döljer transportör-raden
 * helt än visar ett intetsägande "Fraktpartner".
 */
export function maskCarrierOrUndefined(name: string | null | undefined): string | undefined {
  const masked = maskCarrier(name);
  return masked && masked !== MASKED_CARRIER ? masked : undefined;
}

/**
 * DPD:s paketnummer: 14 siffror som börjar på 01, verifierat mot riktiga paket
 * (order 10051, och alla 46 DPD-paket i auditen 2026-10-15). lib/track17.ts bär
 * samma mönster för 17TRACK-registreringen, och carrier-mask.test.ts fäller om
 * de två glider isär. Ingen av filerna kan importera den andra: båda laddas av
 * node --test, som inte löser importer utan filändelse.
 */
export const DPD_NUMMER = /^01\d{12}$/;

/**
 * UPS:s nummer: "1Z", sex tecken för avsändaren, två för tjänsten och åtta
 * siffror, 18 tecken i allt. Bara UPS använder formen. VEVOR skickar med UPS
 * (Leonard 2026-10-27).
 */
export const UPS_NUMMER = /^1Z[0-9A-Z]{16}$/;

/**
 * PostNords egna former: UPU S10 utfärdat i Sverige, och parcel connect (14
 * siffror som börjar på 07). Samma mönster som lib/track17.ts registrerar med,
 * och carrier-mask.test.ts fäller om de glider isär, som för DPD_NUMMER.
 */
const POSTNORD_NUMMER = [/^[A-Z]{2}\d{9}SE$/, /^07\d{12}$/];

/**
 * Fraktbolaget när numret ensamt avgör det. /sparning visar då bara det
 * bolagets knapp innan några händelser finns. Bara prövade former som ingen
 * annan använder räknas. Ett GLS-nummer liknar för mycket annat
 * (lib/gls-track.ts), så det och allt annat ger undefined, och då visas alla
 * fraktbolagen.
 */
export function transportorAvNummer(trackingNumber: string): "UPS" | "DPD" | "PostNord" | undefined {
  const nummer = trackingNumber.trim().toUpperCase();
  if (UPS_NUMMER.test(nummer)) return "UPS";
  if (DPD_NUMMER.test(nummer)) return "DPD";
  if (POSTNORD_NUMMER.some((re) => re.test(nummer))) return "PostNord";
  return undefined;
}

/**
 * Transportören som numret hör till, och vem som delar ut i Sverige när det är
 * en annan. 17TRACK anger SISTA ledet: ett DHL-paket från Tyskland med nummer
 * på formen "CC145357991DE" (UPU S10, utfärdat av Deutsche Post DHL) står som
 * PostNord, eftersom PostNord delar ut det här. Kunden har fått veta att
 * paketet skickas med DHL, så sidan sa emot fraktmejlet (Leonard 2026-10-01).
 *
 * DPD lämnar över till PostNord i Sverige, med samma nummer (Leonard
 * 2026-10-15). 17TRACK kallar paketen DPD, men 42 av 46 stod som "Postnord" i
 * Wix, så fraktmejlet sa PostNord och spårningen DPD. Numret avgör nu båda,
 * utom när källan uttryckligen säger ett annat bud: mönstret är bara prövat på
 * DPD:s egna paket, och ett GLS- eller DHL-besked väger tyngre än en gissning
 * på formen.
 *
 * Bara ett bud ur listan ovan är ett besked. Källornas neutrala ord säger inget
 * om vem som kör: AliExpress-källan skriver "Transportör" för "Seller
 * Shipping …" (lib/ae-source.ts), och maskeringen "Fraktpartner".
 */
export function transportorForNummer(
  trackingNumber: string,
  carrier: string,
): { carrier: string; sistaLed?: string } {
  const nummer = trackingNumber.trim().toUpperCase();
  const bud = maskCarrierOrUndefined(carrier);
  if (/^[A-Z]{2}\d{9}DE$/.test(nummer)) {
    return bud && bud !== "DHL" ? { carrier: "DHL", sistaLed: bud } : { carrier: "DHL" };
  }
  if (bud === "DPD" || (DPD_NUMMER.test(nummer) && (!bud || bud === "PostNord"))) {
    return { carrier: "DPD", sistaLed: "PostNord" };
  }
  return { carrier };
}

/**
 * "DPD, delas ut av PostNord i Sverige". Samma ord på /sparning och i
 * kundmejlen, så de två aldrig säger olika saker om samma paket.
 */
export function transportorRad(carrier: string, sistaLed?: string): string {
  return sistaLed ? `${carrier}, delas ut av ${sistaLed} i Sverige` : carrier;
}

/**
 * Raden "Transportör: …" i kundmejlen (transportorRad). `carrier` ska redan
 * vara maskerad (maskCarrierOrUndefined). Saknas den blir det ingen rad, utom
 * för ett DPD-nummer: numret säger själv vilket fraktbolag det är.
 */
export function transportorText(
  trackingNumber: string | null | undefined,
  carrier: string | null | undefined,
): string | undefined {
  const nummer = (trackingNumber ?? "").trim().toUpperCase();
  if (!carrier && !DPD_NUMMER.test(nummer)) return undefined;
  const t = transportorForNummer(nummer, carrier ?? "");
  return t.carrier ? transportorRad(t.carrier, t.sistaLed) : undefined;
}
