// lib/customer-review.ts
//
// Kundens eget omdöme: validering och radbygge.
//
// Skiljer sig från de importerade AliExpress-omdömena på en avgörande punkt:
// de här är FÖRSTAHANDSDATA — skrivna av någon som handlat hos oss. Därför
// bär raden `source: "customer"`, och bara sådana rader får någonsin räknas in
// i aggregateRating mot Google. Importerade omdömen får visas för kunden men
// aldrig utge sig för att vara vårt eget betyg.
//
// Modulen är avsiktligt fristående (inga relativa körtidsimporter) så att
// `node --test` kan ladda den — samma skäl som lib/rating.ts.

/** Var omdömet kommer ifrån. Rader utan fältet är gamla AE-importer. */
export type ReviewSource = "aliexpress" | "customer";

export interface CustomerReviewInput {
  rating: unknown;
  text: unknown;
  name?: unknown;
}

export interface ValidatedReview {
  rating: number;
  text: string;
  name: string;
}

export type ValidationError =
  | "rating_saknas"
  | "rating_ogiltigt"
  | "text_for_kort"
  | "text_for_lang"
  | "namn_for_langt";

export const TEXT_MIN = 10;
export const TEXT_MAX = 2000;
export const NAMN_MAX = 60;

/**
 * Validerar det kunden skrev. Returnerar antingen den rensade texten eller ett
 * felnamn — aldrig ett halvt resultat.
 */
export function validateCustomerReview(input: CustomerReviewInput): { ok: true; value: ValidatedReview } | { ok: false; error: ValidationError } {
  const rawRating = input.rating;
  if (rawRating === undefined || rawRating === null || rawRating === "") return { ok: false, error: "rating_saknas" };
  const rating = Number(rawRating);
  if (!Number.isInteger(rating) || rating < 1 || rating > 5) return { ok: false, error: "rating_ogiltigt" };

  const text = String(input.text ?? "").trim();
  if (text.length < TEXT_MIN) return { ok: false, error: "text_for_kort" };
  if (text.length > TEXT_MAX) return { ok: false, error: "text_for_lang" };

  const name = String(input.name ?? "").trim();
  if (name.length > NAMN_MAX) return { ok: false, error: "namn_for_langt" };

  return { ok: true, value: { rating, text, name } };
}

export const FELTEXT: Record<ValidationError, string> = {
  rating_saknas: "Välj hur många stjärnor du vill ge.",
  rating_ogiltigt: "Betyget måste vara mellan 1 och 5 stjärnor.",
  text_for_kort: `Skriv gärna minst ${TEXT_MIN} tecken så att andra har nytta av omdömet.`,
  text_for_lang: `Omdömet får vara högst ${TEXT_MAX} tecken.`,
  namn_for_langt: `Namnet får vara högst ${NAMN_MAX} tecken.`,
};

/**
 * Visningsnamn: initialer, aldrig hela namnet — samma integritetsregel som för
 * de importerade omdömena. Utan namn blir det "Verifierad köpare".
 */
export function initialsFromName(name: string): string {
  const bitar = name.trim().split(/\s+/).filter(Boolean);
  if (bitar.length === 0) return "Verifierad köpare";
  const bokstav = (s: string) => {
    const m = s.match(/\p{L}/u);
    return m ? m[0].toUpperCase() : "";
  };
  if (bitar.length === 1) {
    const b = bokstav(bitar[0]);
    return b ? `${b}.` : "Verifierad köpare";
  }
  const f = bokstav(bitar[0]);
  const s = bokstav(bitar[bitar.length - 1]);
  return f && s ? `${f}.${s}.` : "Verifierad köpare";
}

/**
 * Radens id. Härleds ur order + produkt i stället för att slumpas, så att en
 * kund som skickar formuläret två gånger uppdaterar sitt omdöme i stället för
 * att skapa dubbletter.
 */
export function customerReviewId(orderId: string, productId: string): string {
  return `kund-${orderId}-${productId}`;
}

export interface CustomerReviewRow {
  _id: string;
  productId: string;
  reviewIdAE: string;
  rating: number;
  textOriginal: string;
  textSwedish: string;
  initials: string;
  customerNameRaw?: string;
  date: string;
  hasImage: boolean;
  status: "pending";
  source: ReviewSource;
  orderId: string;
  orderNumber?: string;
  importedAt: string;
}

/** Bygger raden som sparas. Alltid `pending` — Leonard godkänner i /admin. */
export function buildCustomerReviewRow(args: {
  orderId: string;
  orderNumber?: string;
  productId: string;
  review: ValidatedReview;
  now?: Date;
}): CustomerReviewRow {
  const now = args.now ?? new Date();
  const reviewIdAE = customerReviewId(args.orderId, args.productId);
  return {
    _id: `${args.productId}__${reviewIdAE}`,
    productId: args.productId,
    reviewIdAE,
    rating: args.review.rating,
    // Kundens egen text ÄR den svenska texten. textOriginal speglar den så att
    // raden har samma form som de importerade — inget behöver översättas.
    textOriginal: args.review.text,
    textSwedish: args.review.text,
    initials: initialsFromName(args.review.name),
    customerNameRaw: args.review.name || undefined,
    date: now.toISOString(),
    hasImage: false,
    status: "pending",
    source: "customer",
    orderId: args.orderId,
    orderNumber: args.orderNumber,
    importedAt: now.toISOString(),
  };
}
