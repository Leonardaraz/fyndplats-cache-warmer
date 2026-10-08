// Fältuppslag i en Wix ecom-order (GET /ecom/v1/orders/{id}).
//
// VARFÖR DEN HÄR FILEN FINNS (granskning 2026-08-19): första versionen av
// lib/wix-orders.ts läste landet på `shippingInfo.shippingDestination.address
// .country`. Den vägen är CHECKOUT-payloadens form — den som
// abandoned-checkout-handler.ts och order-conversion-hook.ts arbetar med. En
// riktig ecom-ORDER lägger adressen på `recipientInfo.address`, vilket kodbasens
// egen extractShippingAddress i app/api/wix-webhook/route.ts redan visste och
// dokumenterade ("Wix v3 ecom: recipientInfo.address har { …, country, … }").
//
// Följden hade varit att landet alltid blev null → ingen Google-modul → noll
// enkäter. Alltså exakt den bugg integrationen skulle rätta, tyst återskapad.
//
// Ordningen nedan är kopierad från webhookens beprövade extraktorer, som körts
// mot skarpa ordrar sedan länge. Fan-outen är inte paranoia: den finns för att
// Wix lägger fälten olika beroende på gäst-/kontoköp och ecom-version.
//
// KVARSTÅR: webhooken har fortfarande sina egna kopior av samma logik. Att låta
// den importera härifrån är rätt nästa steg, men det är en ändring i
// order-mejlens väg och hör inte hemma i samma commit som en /tack-fix.

/**
 * Första värdet som är en icke-tom sträng.
 *
 * Bara strängar och tal accepteras. Kodbasens tre äldre kopior kör `String(v)`
 * på vad som helst, vilket gör ett objekt till den icke-tomma strängen
 * "[object Object]" — via orderNumber hade kunden fått se "#[object Object]"
 * på bekräftelsen. Här kastas de i stället.
 */
export function firstStr(...vals: unknown[]): string | undefined {
  for (const v of vals) {
    if (typeof v !== "string" && typeof v !== "number") continue;
    const s = String(v).trim();
    if (s !== "") return s;
  }
  return undefined;
}

type Loose = Record<string, unknown> | undefined;

function obj(v: unknown): Loose {
  return v && typeof v === "object" ? (v as Record<string, unknown>) : undefined;
}

/**
 * Köparens e-post. Samma fem vägar som extractCustomer i webhooken, i samma
 * ordning — `buyerInfo.email` ensamt visade sig otillräckligt i produktion.
 */
export function orderEmail(order: Loose): string | undefined {
  const buyer = obj(order?.buyerInfo) ?? obj(order?.buyer);
  const billing = obj(order?.billingInfo) ?? obj(order?.billing);
  const recipient = obj(order?.recipientInfo) ?? obj(order?.recipient);
  return firstStr(
    buyer?.email,
    obj(buyer?.contactDetails)?.email,
    obj(billing?.contactDetails)?.email,
    obj(recipient?.contactDetails)?.email,
    order?.buyerEmail,
  );
}

/**
 * Leveranslandet, orört från Wix (normaliseras i lib/gcr.ts). Samma
 * adressupplösning som extractShippingAddress: recipientInfo först, sedan
 * shippingDestination, sist logistics-varianten.
 */
export function orderCountry(order: Loose): string | undefined {
  // VARJE källa provas för sig. Ett första försök valde container först
  // (`recipientInfo ?? recipient ?? shippingInfo`) och letade adress bara i
  // den — så en gästorder med `recipientInfo: { contactDetails }` men adressen
  // under `shippingInfo.shippingDestination` gav undefined, trots att landet
  // låg i svaret. Samma tysta nollresultat som buggen filen skapades för
  // (granskning 2026-08-19, andra vändan).
  const kallor: Loose[] = [
    obj(obj(order?.recipientInfo)?.address),
    obj(obj(order?.recipient)?.address),
    obj(obj(order?.shippingInfo)?.address),
    obj(obj(order?.recipientInfo)?.shippingDestination),
    obj(obj(order?.shippingInfo)?.shippingDestination),
    obj(obj(obj(obj(order?.shippingInfo)?.logistics)?.shippingDestination)?.address),
  ];
  for (const k of kallor) {
    // shippingDestination kan i sin tur bära adressen ett steg ner.
    const land = firstStr(k?.country, obj(k?.address)?.country);
    if (land) return land;
  }
  return undefined;
}

/** Orderns skapandedatum som ISO-sträng, eller undefined. */
export function orderCreatedDate(order: Loose): string | undefined {
  return firstStr(order?.createdDate, order?._createdDate, order?.dateCreated);
}

/** Det kundvända ordernumret ("10021"). */
export function orderNumber(order: Loose): string | undefined {
  return firstStr(order?.number);
}

/** En rad på tacksidan. Beloppet är radens summa inklusive moms. */
export interface OrderRad {
  readonly namn: string;
  /** "Färg: Svart", flera val med " · " emellan. */
  readonly variant?: string;
  readonly antal: number;
  readonly bild?: string;
  readonly belopp?: number;
}

/** Ett Wix-belopp ({ amount: "769.00" }, "769.00" eller 769) som tal. */
function belopp(v: unknown): number | undefined {
  const s = typeof v === "number" || typeof v === "string" ? v : obj(v)?.amount;
  const n = typeof s === "number" ? s : typeof s === "string" ? Number.parseFloat(s) : NaN;
  return Number.isFinite(n) ? n : undefined;
}

function text(v: unknown): string | undefined {
  return firstStr(v, obj(v)?.translated, obj(v)?.original);
}

/**
 * Orderns rader. Namnet, bilden och valen läses på samma vägar som webhookens
 * extractItems (app/api/wix-webhook/route.ts). Beloppet är `totalPriceAfterTax`,
 * radens summa INKLUSIVE moms: Wix lägger `priceSummary.subtotal` exklusive moms
 * (uppmätt 2026-10-09: 615,20 kr på en order där kunden betalade 769 kr).
 */
export function orderRader(order: Loose): OrderRad[] {
  const rader = order?.lineItems ?? order?.items;
  if (!Array.isArray(rader)) return [];
  return rader.map((r) => {
    const li = obj(r) ?? {};
    const val = Array.isArray(li.descriptionLines)
      ? li.descriptionLines
          .map((d) => {
            const namn = text(obj(d)?.name);
            const varde = text(obj(d)?.plainText) ?? text(obj(d)?.plainTextValue);
            return varde ? (namn ? `${namn}: ${varde}` : varde) : undefined;
          })
          .filter((s): s is string => Boolean(s))
      : [];
    const antal = Number(li.quantity ?? 1);
    return {
      namn: text(li.productName) ?? firstStr(li.name) ?? "Produkt",
      variant: val.length > 0 ? val.join(" · ") : undefined,
      antal: Number.isFinite(antal) && antal > 0 ? antal : 1,
      bild: firstStr(obj(li.image)?.url, li.image, obj(li.productMedia)?.url),
      belopp: belopp(li.totalPriceAfterTax) ?? belopp(li.totalPrice) ?? belopp(li.lineItemPrice),
    };
  });
}

/**
 * Frakten och totalen inklusive moms, och momsen i totalen. Frakten tas ur
 * `shippingInfo.cost`, eftersom `priceSummary.shipping` står exklusive moms.
 */
export function orderSumma(order: Loose): { frakt?: number; totalt?: number; moms?: number } {
  const summa = obj(order?.priceSummary) ?? obj(order?.totals);
  const kostnad = obj(obj(order?.shippingInfo)?.cost);
  return {
    frakt: belopp(kostnad?.totalPriceAfterTax) ?? belopp(kostnad?.price),
    totalt: belopp(summa?.total) ?? belopp(summa?.totalPrice),
    moms: belopp(summa?.tax) ?? belopp(obj(order?.taxInfo)?.totalTax),
  };
}
