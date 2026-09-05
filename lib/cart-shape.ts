// lib/cart-shape.ts
// Översätter en kundvagn från Wix Cart API **v2** till den form resten av
// butiken redan läser.
//
// VARFÖR EN ÖVERSÄTTARE OCH INTE EN OMSKRIVNING ÖVERALLT.
// v2 är inte bara omdöpta funktioner — raderna har en helt annan form:
//
//   v1                          v2
//   li.productName.original  →  li.name.original
//   li.quantity              →  li.quantityInfo.confirmedQuantity
//   li.price.amount          →  li.pricing.unitPrice.amount
//   li.catalogReference      →  li.source.catalogReference
//   li.image                 →  li.attributes.image
//
// Den formen läses på ett dussin ställen: varukorgsluckans rader, miniatyrer,
// antalsräknaren, "andra köpte också"-filtret, fri-frakt-mätaren, och hela
// lib/analytics.ts (view_cart, begin_checkout, purchase). Att skriva om alla
// vore ett dussin tillfällen att missa ett fält — och ett missat fält i
// analytics syns inte som ett fel, det syns som att intäkten försvinner ur GA4.
//
// Med en översättare finns bytet på ETT ställe, och det stället är testat.
//
// DEN ANDRA ANLEDNINGEN, OCH DEN VIKTIGARE: KUNDER MITT I ETT KÖP.
// lib/analytics.ts stashar en ögonblicksbild av kundvagnen i webbläsarens
// lagring innan kunden skickas till kassan, och /tack läser tillbaka den för
// att kunna rapportera purchase. Den som lade i kundvagnen FÖRE deployen och
// betalar EFTER den har alltså en v1-bild i lagringen medan koden är v2.
//
// Därför läser normaliseraren BÅDA formerna och lämnar en v1-rad orörd. Utan
// det tappar vi purchase-eventet — och därmed Metas och GA4:s hela
// intäktsrapportering — för varenda kund som råkade handla under deployminuten.

/** En rad i den form butiken renderar (v1-formen). */
export interface NormaliseradRad {
  _id?: string;
  productName?: { original?: string };
  quantity?: number;
  price?: { amount?: string; formattedAmount?: string };
  catalogReference?: { catalogItemId?: string; appId?: string; options?: unknown };
  /** Sträng ELLER Wix bildobjekt — luckans liImageUrl() klarar båda. */
  image?: unknown;
}

export interface NormaliseradKundvagn {
  _id?: string;
  revision?: string;
  lineItems: NormaliseradRad[];
  subtotal?: { amount?: string; formattedAmount?: string };
  currency?: string;
  /** v2-vagnen orörd, för det som behöver fält översättaren inte speglar. */
  raw?: unknown;
}

// v2 SKICKAR INGEN FÄRDIGFORMATERAD SUMMA. v1:s Money bar `formattedAmount`
// ("2 049,00 kr") och varukorgsluckan skriver ut just det fältet på två
// ställen: kundvagnens summa och varje rads pris. v2:s ConvertedMoney har bara
// `amount` och `convertedAmount` — verifierat mot skarpa API:et 2026-09-04 —
// så utan det här hade båda raderna blivit TOMMA. Varken bygget eller
// testerna hade fångat det; det syns bara i webbläsaren.
//
// Vi formaterar därför själva. Att det blir "2 049 kr" och inte "2 049,00 kr"
// är avsiktligt: det är sajtens eget format (formatPrice i lib/price-range.ts),
// alltså blir kundvagnen konsekvent med resten av butiken i stället för att
// bära Wix decimaler.
//
// Valutan kommer från vagnen, inte hårdkodat, så en kassa i EUR skriver "€"
// utan att någon rör den här koden.
function formatera(belopp: string | undefined, valuta: string): string | undefined {
  if (belopp === undefined) return undefined;
  const n = Number(belopp);
  if (!Number.isFinite(n)) return undefined;
  try {
    const ut = new Intl.NumberFormat("sv-SE", {
      style: "currency",
      currency: valuta,
      maximumFractionDigits: 0,
    }).format(n);
    // Intl separerar med HÅRDA blanksteg (U+00A0, och U+202F i vissa
    // lokaler). Sajtens formatPrice använder vanliga. Utan den här raden
    // fick kundvagnen annan teckenbredd än produktsidorna — en skillnad
    // ingen kan sätta fingret på men alla ser.
    return ut.replace(/[\u00a0\u202f]/g, " ");
  } catch {
    // Okänd valutakod → hellre siffran utan symbol än ett kast.
    return `${Math.round(n)}`;
  }
}

type Obj = Record<string, unknown>;
const obj = (v: unknown): Obj | undefined =>
  v !== null && typeof v === "object" ? (v as Obj) : undefined;
const str = (v: unknown): string | undefined => (typeof v === "string" ? v : undefined);
const num = (v: unknown): number | undefined =>
  typeof v === "number" && Number.isFinite(v) ? v : undefined;

/** Sant för en rad som redan har v1-form — då ska den lämnas ifred. */
function arV1Rad(rad: Obj): boolean {
  return "productName" in rad || "quantity" in rad || "price" in rad;
}

function normaliseraRad(rad: Obj, valuta: string): NormaliseradRad {
  if (arV1Rad(rad)) return rad as NormaliseradRad;

  const namn = obj(rad.name);
  const antal = obj(rad.quantityInfo);
  const pris = obj(rad.pricing);
  const kalla = obj(rad.source);
  const attr = obj(rad.attributes);

  const ut: NormaliseradRad = {};
  if (str(rad._id)) ut._id = str(rad._id);

  const titel = str(namn?.original) ?? str(namn?.translated);
  if (titel) ut.productName = { original: titel };

  // confirmedQuantity är vad kunden FÅR (lagret kan ha kapat den);
  // requestedQuantity är vad hen bad om. Vi visar det som faktiskt säljs.
  const q = num(antal?.confirmedQuantity) ?? num(antal?.requestedQuantity);
  if (q !== undefined) ut.quantity = q;

  // `amount` är butikens valuta och det är den lib/analytics.ts rapporterar
  // till GA4 och Meta. Visningen får `convertedAmount` (kundens valuta) när
  // den finns — annars hade en EUR-kassa rapporterat euro som om det vore
  // kronor.
  const enhet = obj(pris?.unitPrice);
  const belopp = str(enhet?.amount);
  if (belopp !== undefined) {
    ut.price = { amount: belopp };
    const visa = formatera(str(enhet?.convertedAmount) ?? belopp, valuta);
    if (visa) ut.price.formattedAmount = visa;
  }

  const ref = obj(kalla?.catalogReference);
  if (ref) ut.catalogReference = ref as NormaliseradRad["catalogReference"];

  // BILDEN SKICKAS ORÖRD VIDARE. Typerna säger `image?: string`, men skarpa
  // API:et svarar med ett OBJEKT ({ id, url, width, height, altText }) —
  // verifierat 2026-09-04. Luckans liImageUrl() tar båda formerna, så det
  // enda som kan gå fel är om vi kräver en sträng här. Gjorde vi det försvann
  // varenda miniatyr ur kundvagnen.
  if (attr?.image !== undefined && attr.image !== null) ut.image = attr.image;

  return ut;
}

/**
 * Normaliserar en kundvagn från v2 till den form butiken renderar.
 *
 * Tål allt: null, undefined, en redan normaliserad v1-vagn, och ett svar som
 * ligger inkapslat som `{ cart }` (v2:s getCurrentCart svarar så, medan v1
 * svarade med vagnen direkt).
 */
export function normaliseraKundvagn(indata: unknown): NormaliseradKundvagn | null {
  const yttre = obj(indata);
  if (!yttre) return null;
  // v2 svarar { cart: … }, v1 svarade med vagnen själv.
  const k = obj(yttre.cart) ?? yttre;

  // Kundens valuta styr visningen; butikens är reserven.
  const valuta =
    str(obj(k.customerInfo)?.currencyCode) ??
    str(obj(k.businessInfo)?.currencyCode) ??
    str(k.currency) ??
    "SEK";

  const rader = Array.isArray(k.lineItems) ? k.lineItems : [];
  const ut: NormaliseradKundvagn = {
    lineItems: rader.map((r) => normaliseraRad(obj(r) ?? {}, valuta)),
    currency: valuta,
    raw: k,
  };

  if (str(k._id)) ut._id = str(k._id);
  if (str(k.revision)) ut.revision = str(k.revision);

  const sub = obj(k.subtotal) ?? obj(obj(k.priceSummary)?.subtotal);
  if (sub) {
    ut.subtotal = {};
    const belopp = str(sub.amount);
    if (belopp) ut.subtotal.amount = belopp;
    // v1 hade en färdig sträng; v2 har den inte, så vi formaterar den.
    const visa = str(sub.formattedAmount) ?? formatera(str(sub.convertedAmount) ?? belopp, valuta);
    if (visa) ut.subtotal.formattedAmount = visa;
  }

  return ut;
}
