import type {
  FulfillmentTask,
  OrderEvent,
  ShippingAddress,
  WixAddress,
  WixLineItem,
  WixOrder,
} from "./types";

/**
 * Plockar ut WixOrder ur rätt event-wrapper. Wix lägger entiteten på olika
 * ställen beroende på event-typ:
 *   createdEvent.entity         — Order Created
 *   updatedEvent.currentEntity  — Order/Fulfillments Updated (currentEntity är
 *                                 den NYA staten; `entity` är en sällsynt variant)
 *   actionEvent.body[.order]    — Order Approved / Paid / Fulfilled. `body` kan
 *                                 vara ett objekt ELLER en JSON-strängad payload,
 *                                 och ordern är ofta wrappad i `.order`.
 * Returnerar undefined om ingen order hittas.
 */
function extractOrder(raw: Record<string, unknown>): WixOrder | undefined {
  const created = raw.createdEvent as { entity?: WixOrder } | undefined;
  if (created?.entity) return created.entity;

  const updated = raw.updatedEvent as { currentEntity?: WixOrder; entity?: WixOrder } | undefined;
  if (updated?.currentEntity) return updated.currentEntity;
  if (updated?.entity) return updated.entity;

  const action = raw.actionEvent as { body?: unknown } | undefined;
  if (action?.body !== undefined) {
    let body: unknown = action.body;
    if (typeof body === "string") {
      try {
        body = JSON.parse(body);
      } catch {
        body = undefined;
      }
    }
    if (body && typeof body === "object") {
      const wrapped = (body as { order?: WixOrder }).order;
      return wrapped ?? (body as WixOrder);
    }
  }
  return undefined;
}

/** Första icke-tomma strängen ur en lista (defensiv mot olika event-shapes). */
function firstStr(...vals: unknown[]): string {
  for (const v of vals) {
    if (typeof v === "string" && v.trim()) return v;
  }
  return "";
}

/**
 * Den råa entiteten ur valfri event-wrapper, OAVSETT om den är en full order eller
 * (för refunds) ett `{orderId, refund}`-objekt utan order-fält. Skiljer sig från
 * extractOrder genom att INTE kräva en WixOrder — refund_completed-payloaden bär
 * `currentEntity = {orderId, refund:{…}}` (ingen `.order`, inget `id`).
 */
function rawEntity(raw: Record<string, unknown>): Record<string, unknown> | undefined {
  const created = raw.createdEvent as { entity?: unknown } | undefined;
  if (created?.entity && typeof created.entity === "object") return created.entity as Record<string, unknown>;

  const updated = raw.updatedEvent as { currentEntity?: unknown; entity?: unknown } | undefined;
  if (updated?.currentEntity && typeof updated.currentEntity === "object") return updated.currentEntity as Record<string, unknown>;
  if (updated?.entity && typeof updated.entity === "object") return updated.entity as Record<string, unknown>;

  const action = raw.actionEvent as { body?: unknown } | undefined;
  if (action?.body !== undefined) {
    let body: unknown = action.body;
    if (typeof body === "string") {
      try {
        body = JSON.parse(body);
      } catch {
        body = undefined;
      }
    }
    if (body && typeof body === "object") {
      const order = (body as { order?: unknown }).order;
      if (order && typeof order === "object") return order as Record<string, unknown>;
      return body as Record<string, unknown>;
    }
  }
  return undefined;
}

export type WixEventKind = "create" | "cancel" | "refund" | "other";

/**
 * Klassificerar ett (redan uppvecklat) Wix-event på (entityFqdn, slug)-PARET — speglar
 * headless `classify()`. KRITISKT: refund ligger under FQDN `order_transactions`
 * (slug `refund_completed`), INTE under `order`, och Wix fyrar ALDRIG `order.refunded`.
 * En cancel är `order` + slug `canceled` (ETT l). Allt annat (created/approved/paid/
 * fulfilled/okänt) → "other" och går den befintliga create-vägen (deriveTasks).
 */
export function classifyWixEvent(raw: Record<string, unknown>): WixEventKind {
  const fqdn = firstStr(raw.entityFqdn).toLowerCase();
  const slug = firstStr(raw.slug).toLowerCase();
  if (fqdn.includes("order_transactions") && slug === "refund_completed") return "refund";
  if (slug.includes("refund")) return "refund"; // defensivt: refund-slug oavsett fqdn
  if (fqdn === "wix.ecom.v1.order" && (slug === "canceled" || slug === "cancelled")) return "cancel";
  if (slug === "canceled" || slug === "cancelled") return "cancel"; // defensivt
  return "other";
}

/**
 * Order-id ur ett cancel/refund-event, defensivt mot alla shapes. För refund är
 * `raw.entityId` transaktions-entitetens id (INTE order-id) — därför läses
 * `entity.orderId` FÖRST. Cancel bär ordern i `actionEvent.body.order` → `entity.id`.
 * Returnerar "" om inget order-id kan härledas (anroparen ack:ar då eventet utan att
 * röra några tasks, i stället för att skapa/avbryta fel).
 */
export function extractCancelOrderId(raw: Record<string, unknown>): string {
  const ent = rawEntity(raw);
  return firstStr(ent?.orderId, ent?.id, raw.entityId);
}

/**
 * Normaliserar en inkommande Wix eCom-webhook (created/approved/paid/fulfilled)
 * till en OrderEvent. Hanterar createdEvent / updatedEvent / actionEvent-formerna
 * (se extractOrder).
 */
export function normalizeOrderEvent(raw: Record<string, unknown>): OrderEvent | null {
  const eventId = typeof raw.id === "string" ? raw.id : "";
  const slug = typeof raw.slug === "string" ? raw.slug : "";
  const entityId = typeof raw.entityId === "string" ? raw.entityId : "";

  const order = extractOrder(raw);

  if (!eventId || !order || !order.id) return null;
  return { eventId, slug, orderId: entityId || order.id, order };
}

/**
 * Skapar en fulfillment-task PER ORDERRAD. En order kan innehålla artiklar från
 * olika AliExpress-leverantörer, så varje rad blir en egen task.
 */
export function deriveTasks(event: OrderEvent): FulfillmentTask[] {
  const order = event.order;
  const address = extractAddress(order);
  const now = new Date().toISOString();

  return (order.lineItems ?? []).map((li) => ({
    taskId: `${order.id}:${li.id}`,
    orderId: order.id,
    orderNumber: order.number ?? "",
    lineItemId: li.id,
    productName: li.productName?.translated || li.productName?.original || "",
    sku: extractSku(li),
    wixCatalogItemId: li.catalogReference?.catalogItemId,
    variantChoices: extractVariantChoices(li),
    quantity: li.quantity ?? 1,
    status: "pending",
    shippingAddress: address,
    createdAt: now,
  }));
}

function extractSku(li: WixLineItem): string | undefined {
  return li.physicalProperties?.sku || undefined;
}

/**
 * Variantval (t.ex. { Färg: "Blå" }) från en orderrad. KRITISKT för att kunna
 * matcha rätt AliExpress-SKU vid orderläggning (placeOrderForTask F49): utan
 * choices och utan SKU-träff kan varianten inte härledas → ordern blockeras.
 *
 * Wix lägger valen i `descriptionLines` på riktiga ordrar (COLOR-rad → `color`/
 * `colorInfo`, text-rad → `plainText`), INTE i `catalogReference.options.options`
 * som bara bär ett variantId. Vi läser catalog-options FÖRST (bakåtkompat med
 * äldre/test-shapes) och faller tillbaka på descriptionLines. Nyckel = radens
 * `name`, värdet trimmas.
 */
function extractVariantChoices(li: WixLineItem): Record<string, string> {
  const clean = (s: string | undefined): string => (s ?? "").trim();

  const fromCatalog = li.catalogReference?.options?.options;
  if (fromCatalog) {
    const out: Record<string, string> = {};
    for (const [k, v] of Object.entries(fromCatalog)) {
      const kk = clean(k);
      const vv = clean(typeof v === "string" ? v : String(v ?? ""));
      if (kk && vv) out[kk] = vv;
    }
    if (Object.keys(out).length > 0) return out;
  }

  const out: Record<string, string> = {};
  for (const dl of li.descriptionLines ?? []) {
    const key = clean(dl.name?.original) || clean(dl.name?.translated);
    // COLOR-rader har värdet i `color`/`colorInfo`; text-rader i `plainText`.
    const val =
      clean(dl.color) ||
      clean(dl.colorInfo?.original) ||
      clean(dl.colorInfo?.translated) ||
      clean(dl.plainText?.original) ||
      clean(dl.plainText?.translated);
    if (key && val) out[key] = val;
  }
  return out;
}

/**
 * Normaliserar en landskod till ISO-3166 alpha-2 (versaler). Returnerar null om
 * värdet inte är exakt två bokstäver. Order-läggningen vägrar då hellre ordern
 * än skickar den fel — tidigare default `"SE"` kunde tyst skicka en kunds paket
 * till Sverige när Wix-adressens land saknades/var i fel format.
 */
export function normalizeCountryCode(raw: string | undefined | null): string | null {
  const s = (raw ?? "").trim().toUpperCase();
  return /^[A-Z]{2}$/.test(s) ? s : null;
}

/** Trimma + tomma-strängar-till-undefined. Wix padd:ar ofta värden med blanksteg
 *  ("Åkersberga ", "184 36 ") → utan trim läcker de in i AliExpress-ordern. */
function clean(s: string | undefined): string | undefined {
  const t = (s ?? "").trim();
  return t || undefined;
}

// AliExpress kräver en "state/province/region" vid orderläggning. För Sverige
// mappar vi Wix ISO 3166-2 (SE-XX) → AliExpress läns-namn (ASCII, som deras
// adress-dropdown använder). Åkersberga (SE-AB) → "Stockholm".
const SE_SUBDIVISION_TO_PROVINCE: Record<string, string> = {
  "SE-AB": "Stockholm", "SE-AC": "Vasterbotten", "SE-BD": "Norrbotten",
  "SE-C": "Uppsala", "SE-D": "Sodermanland", "SE-E": "Ostergotland",
  "SE-F": "Jonkoping", "SE-G": "Kronoberg", "SE-H": "Kalmar", "SE-I": "Gotland",
  "SE-K": "Blekinge", "SE-M": "Skane", "SE-N": "Halland", "SE-O": "Vastra Gotaland",
  "SE-S": "Varmland", "SE-T": "Orebro", "SE-U": "Vastmanland", "SE-W": "Dalarna",
  "SE-X": "Gavleborg", "SE-Y": "Vasternorrland", "SE-Z": "Jamtland",
};

// Postnummer → län (sista fallback — order #10015, 2026-08-08): svenska kassor
// skickar ofta INGEN subdivision alls → province blev tom → AliExpress avvisade
// ordern ("Selecciona un estado/provincia/región"). Svenska postnummer pekar ut
// länet deterministiskt: tvåsiffrigt prefix räcker för det mesta; de kända
// blandzonerna (län som delar prefix) särskiljs på tre siffror. Ett fel-län i
// någon obskyr kantzon är kosmetiskt — PostNord routar på postnummer+ort, och
// AliExpress vill bara ha ett giltigt värde i fältet — men tabellen träffar
// rätt i praktiken. Namnen matchar AliExpress dropdown (ASCII, som
// SE_SUBDIVISION_TO_PROVINCE ovan).
const SE_ZIP3_EXCEPTIONS: Record<string, string> = {
  "361": "Kalmar", "577": "Kalmar", "579": "Kalmar", "598": "Kalmar",
  "611": "Sodermanland", "613": "Sodermanland", "619": "Sodermanland",
  "662": "Vastra Gotaland", "666": "Vastra Gotaland", "668": "Vastra Gotaland",
  "814": "Uppsala", "815": "Uppsala", "819": "Uppsala",
  "841": "Vasternorrland",
  "933": "Norrbotten", "938": "Norrbotten",
};
const SE_ZIP2_LAN: Record<string, string> = {
  "10": "Stockholm", "11": "Stockholm", "12": "Stockholm", "13": "Stockholm",
  "14": "Stockholm", "15": "Stockholm", "16": "Stockholm", "17": "Stockholm",
  "18": "Stockholm", "19": "Stockholm",
  "20": "Skane", "21": "Skane", "22": "Skane", "23": "Skane", "24": "Skane",
  "25": "Skane", "26": "Skane", "27": "Skane", "28": "Skane", "29": "Skane",
  "30": "Halland", "31": "Halland",
  "33": "Jonkoping",
  "34": "Kronoberg", "35": "Kronoberg", "36": "Kronoberg",
  "37": "Blekinge",
  "38": "Kalmar", "39": "Kalmar",
  "40": "Vastra Gotaland", "41": "Vastra Gotaland", "42": "Vastra Gotaland",
  "43": "Vastra Gotaland", "44": "Vastra Gotaland", "45": "Vastra Gotaland",
  "46": "Vastra Gotaland", "47": "Vastra Gotaland",
  "50": "Vastra Gotaland", "51": "Vastra Gotaland", "52": "Vastra Gotaland",
  "53": "Vastra Gotaland", "54": "Vastra Gotaland",
  "55": "Jonkoping", "56": "Jonkoping", "57": "Jonkoping",
  "58": "Ostergotland", "59": "Ostergotland", "60": "Ostergotland", "61": "Ostergotland",
  "62": "Gotland",
  "63": "Sodermanland", "64": "Sodermanland",
  "65": "Varmland", "66": "Varmland", "67": "Varmland", "68": "Varmland",
  "69": "Orebro", "70": "Orebro", "71": "Orebro",
  "72": "Vastmanland", "73": "Vastmanland",
  "74": "Uppsala", "75": "Uppsala",
  "76": "Stockholm", // Norrtälje/Rimbo/Hallstavik — Stockholms län trots 7-serien
  "77": "Dalarna", "78": "Dalarna", "79": "Dalarna",
  "80": "Gavleborg", "81": "Gavleborg", "82": "Gavleborg",
  "83": "Jamtland", "84": "Jamtland",
  "85": "Vasternorrland", "86": "Vasternorrland", "87": "Vasternorrland",
  "88": "Vasternorrland", "89": "Vasternorrland",
  "90": "Vasterbotten", "91": "Vasterbotten", "92": "Vasterbotten", "93": "Vasterbotten",
  "94": "Norrbotten", "95": "Norrbotten", "96": "Norrbotten", "97": "Norrbotten",
  "98": "Norrbotten",
};

/** Län ur ett svenskt postnummer (5 siffror, ev. mellanslag). undefined när
 *  postnumret inte är svenskt-formaterat eller prefixet är okänt. */
export function provinceFromSwedishPostalCode(postalCode: string | undefined): string | undefined {
  const digits = (postalCode ?? "").replace(/\D/g, "");
  if (digits.length !== 5) return undefined;
  return SE_ZIP3_EXCEPTIONS[digits.slice(0, 3)] ?? SE_ZIP2_LAN[digits.slice(0, 2)];
}

/** Härleder en AliExpress-vänlig provins/län från Wix-adressens subdivision,
 *  med postnumret som sista fallback för svenska adresser. */
export function deriveProvince(addr: WixAddress | undefined): string | undefined {
  if (!addr) return undefined;
  const code = clean(addr.subdivision)?.toUpperCase();
  if (code && SE_SUBDIVISION_TO_PROVINCE[code]) return SE_SUBDIVISION_TO_PROVINCE[code];
  // Fallback 1: läns-namnet utan " län"/" county"-suffix (translittereras till ASCII
  // i DTO-bygget). Bättre än tomt → AliExpress avvisar annars med "select a region".
  const full = clean(addr.subdivisionFullname);
  if (full) return full.replace(/\s+(län|lan|county)\s*$/i, "").trim() || full;
  // Fallback 2: postnumret (bara SE — saknat land antas SE, butiken säljer dit).
  const country = clean(addr.country)?.toUpperCase();
  if (!country || country === "SE") return provinceFromSwedishPostalCode(addr.postalCode);
  return undefined;
}

function extractAddress(order: WixOrder): ShippingAddress | undefined {
  const dest = order.shippingInfo?.logistics?.shippingDestination;
  // Adress: leverans → mottagare → faktura (första som finns).
  const addr = dest?.address ?? order.recipientInfo?.address ?? order.billingInfo?.address;
  // Kontakt: Wix använder `contactDetails` på nuvarande V1-ordrar, `contact` på
  // äldre — acceptera båda, samma prioritetsordning som adressen.
  const contact =
    dest?.contactDetails ?? dest?.contact ??
    order.recipientInfo?.contactDetails ?? order.recipientInfo?.contact ??
    order.billingInfo?.contactDetails ?? order.billingInfo?.contact;
  if (!addr && !contact) return undefined;

  // Gatan: `addressLine1` (om satt) → `addressLine` (Fyndplats-ordrarnas fält) →
  // strukturerad `streetAddress` (namn + nummer). KRITISKT: utan denna fallback
  // tappas gatan och F50-adressspärren blockerar AliExpress-ordern.
  const street =
    clean(addr?.addressLine1) ??
    clean(addr?.addressLine) ??
    clean([addr?.streetAddress?.name, addr?.streetAddress?.number].filter(Boolean).join(" "));

  const fullName = [clean(contact?.firstName), clean(contact?.lastName)].filter(Boolean).join(" ") || undefined;
  return {
    fullName,
    addressLine1: street,
    addressLine2: clean(addr?.addressLine2),
    city: clean(addr?.city),
    province: deriveProvince(addr),
    postalCode: clean(addr?.postalCode),
    country: clean(addr?.country),
    phone: clean(contact?.phone),
  };
}
