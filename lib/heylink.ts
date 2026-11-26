// Heylink: spårningen åt GoWish (Leonard 2026-11-25).
//
// GoWish (Ønskeskyen) mäter köpen som deras besökare gör hos oss genom Heylink.
// Deras guide (docs.heylink.com/inbound/tracking-guide) har två steg: ett
// skript på varje sida, och ett objekt med ordern på tacksidan
// (window.hlconversion) som skriptet skickar till Heylink.
//
// SKRIPTET ÄR LÄST 2026-11-25 (23 181 tecken, sha256 305ecaae…79b3, serveras
// med no-store och kan ändras hos dem när som helst). Det här gör det:
//
// - En besökare från GoWish landar med ?hltid=<klick-id> i adressen. Skriptet
//   sparar id:t i webbläsarens localStorage (nyckeln _hey), och dessutom
//   gclid, fbclid, msclkid, utm_source, utm_medium, utm_campaign och sidan
//   besökaren kom från, för VARJE besökare, också den som aldrig varit hos
//   GoWish.
// - Det lägger en MutationObserver på hela sidan och kör sin insamling vid
//   varje ändring i DOM:en.
// - ☠️ När window.hlconversion sätts skickar det ordern till
//   heylinkapi.com/connect/v1/callbacks/advertisers UTAN att se efter om
//   besökaren har ett klick-id. Gör man som guiden säger får Heylink alltså
//   varje order i butiken, med belopp och varor.
// - Det skickar också sidans hela adress (pageUrl).
//
// SÅ HÄR ÄR DET BYGGT I STÄLLET, med samma resultat för GoWish:
//
// 1. Klick-id:t fångas av butikens egen kod vid landningen
//    (components/heylink-klick.tsx). Med samtycke till alla cookies sparas det
//    i localStorage i 30 dagar, samma tid som Heylinks egen inställning
//    (cookie_lifetime 2 592 000 s). Utan samtycke finns det bara i minnet så
//    länge fliken lever, och sparas om besökaren samtycker senare.
// 2. Heylinks skript laddas BARA på tacksidan, och bara när besökaren har ett
//    sparat klick-id och har samtyckt (components/heylink-kop.tsx). Ordern
//    sätts i window.hlconversion med klick-id:t före skriptet, så skriptet
//    skickar den en gång. Tacksidans adress är ren: kassan landar alltid på
//    /tack?orderId=… med en hel sidladdning (app/kassa/kassa.tsx).
// 3. Ingen annan besökare får skriptet, och ingen annan order lämnar butiken.
//
// ☠️ Det som då inte når Heylink är vilka andra annonsklick kunden gjort
// (gclid, utm). Vill GoWish räkna bort köp där en annan kanal var sista
// klicket måste deras skript ligga på varje sida, och det är Leonards beslut.
//
// Ren modul utan importer, så att node:test kan köra den.

/** Heylinks skript för Fyndplats konto. Id:t i adressen är kontots, och är inte hemligt. */
export const HEYLINK_TAGG = "https://tag.heylink.com/4ed94d17-6798-423e-a169-e87b70a2de2a/script.js";

/** Id på skript-taggen, så att den aldrig läggs in två gånger. */
export const HEYLINK_TAGG_ID = "heylink-tagg";

/** Parametern Heylink lägger på adressen när någon klickar sig hit från GoWish. */
export const HEYLINK_PARAM = "hltid";

/** localStorage: klick-id:t och när det fångades, som JSON {"id","t"}. */
export const HEYLINK_NYCKEL = "fp_heylink";

/** localStorage: ordernumret som senast lämnades till Heylink. Skyddar mot F5 på tacksidan. */
export const HEYLINK_SKICKAD = "fp_heylink_order";

/** Så länge gäller ett klick. Samma som cookie_lifetime i Heylinks skript för kontot. */
export const HEYLINK_DAGAR = 30;

const DYGN_MS = 24 * 60 * 60 * 1000;

/**
 * Ett klick-id som går att lita på: bokstäver, siffror, punkt, bindestreck och
 * understreck, 8 till 128 tecken (Heylinks exempel är 31 hextecken). Allt annat
 * är null, så att skräp ur en adress aldrig sparas eller skickas vidare.
 */
export function giltigtKlickId(v: unknown): string | null {
  return typeof v === "string" && /^[A-Za-z0-9._-]{8,128}$/.test(v) ? v : null;
}

/**
 * Klick-id:t ur adressens sökdel ("?a=1&hltid=…"). Namnet jämförs utan hänsyn
 * till stora och små bokstäver, som Heylinks eget skript gör. Det första
 * giltiga värdet gäller.
 */
export function klickIdUrSokdel(sokdel: string): string | null {
  const q = sokdel.startsWith("?") ? sokdel.slice(1) : sokdel;
  if (!q) return null;
  for (const del of q.split("&")) {
    const i = del.indexOf("=");
    if (i < 0 || del.slice(0, i).toLowerCase() !== HEYLINK_PARAM) continue;
    let varde = del.slice(i + 1).split("#")[0];
    try {
      varde = decodeURIComponent(varde);
    } catch {
      // ett värde som inte går att avkoda prövas som det står
    }
    const id = giltigtKlickId(varde);
    if (id) return id;
  }
  return null;
}

export interface HeylinkMarke {
  readonly id: string;
  /** När klicket fångades, i millisekunder. */
  readonly t: number;
}

/** Det som sparas i localStorage för ett klick. */
export function nyttMarke(id: string, nu: number): string {
  return JSON.stringify({ id, t: nu });
}

/**
 * Läser det sparade klicket. Null när det saknas, är trasigt, har ett ogiltigt
 * id, är äldre än HEYLINK_DAGAR eller ligger i framtiden (en klocka som
 * ställts om ska inte ge ett klick som aldrig går ut).
 */
export function tolkaMarke(ratt: string | null | undefined, nu: number): HeylinkMarke | null {
  if (!ratt) return null;
  let v: unknown;
  try {
    v = JSON.parse(ratt);
  } catch {
    return null;
  }
  if (typeof v !== "object" || v === null) return null;
  const id = giltigtKlickId((v as { id?: unknown }).id);
  const t = (v as { t?: unknown }).t;
  if (!id || typeof t !== "number" || !Number.isFinite(t)) return null;
  if (t > nu + DYGN_MS || nu - t > HEYLINK_DAGAR * DYGN_MS) return null;
  return { id, t };
}

/** Det tacksidan vet om ordern (lib/wix-orders.ts). Alla belopp i kronor. */
export interface HeylinkOrder {
  readonly number: string | null;
  readonly rader: readonly {
    readonly namn: string;
    readonly variant?: string;
    readonly antal: number;
    readonly bild?: string;
    /** Radens summa inklusive moms. */
    readonly belopp?: number;
    readonly produktId?: string;
    readonly variantId?: string;
  }[];
  /** Frakten inklusive moms. */
  readonly frakt?: number;
  /** Frakten exklusive moms, som Wix har den i priceSummary.shipping. */
  readonly fraktExMoms?: number;
  /** Det kunden betalade, med frakt och moms. */
  readonly totalt?: number;
  readonly moms?: number;
  readonly valuta?: string;
}

/** En vara i ordern, med Heylinks fältnamn. Priset är per styck, exklusive moms. */
export interface HeylinkVara {
  itemId?: string;
  itemName: string;
  itemPrice?: number;
  itemQuantity: number;
  itemVariant?: string;
  itemImageUrl?: string;
}

/**
 * Ordern med Heylinks fältnamn (docs.heylink.com/inbound/advertiser-callback),
 * utan klick-id:t: det läggs på i webbläsaren. Beloppen är TAL, inte text:
 * skriptet tolkar en text som "1234.500" som tusentalsavgränsad.
 */
export interface HeylinkKop {
  orderId: string;
  /** Varorna exklusive moms och frakt, efter rabatt. Det Heylink räknar på. */
  orderSubTotal: number;
  /** Det kunden betalade, med frakt och moms. */
  orderTotal: number;
  orderTax?: number;
  /** Frakten exklusive moms. */
  orderShippingSubTotal?: number;
  orderCurrencyCode: string;
  orderItems: HeylinkVara[];
}

const ore = (n: number) => Math.round(n * 100) / 100;
const belopp = (v: unknown): number | undefined => (typeof v === "number" && Number.isFinite(v) && v >= 0 ? v : undefined);

/**
 * Ordern så som Heylink vill ha den, eller null när den inte går att räkna:
 * utan total, utan ordernummer eller med varor som inte kostar något.
 *
 * Wix ger totalen och frakten inklusive moms och momsen för sig. Varorna utan
 * moms och frakt är totalen minus momsen minus frakten utan moms, och det tar
 * hänsyn till rabatter eftersom totalen är det kunden betalade. Saknar ordern
 * momsen räknas den som 25 %, den enda sats butikens varor har.
 *
 * `reservId` är Wix interna id, som bara används när ordern saknar ett läsbart
 * nummer (Wix ger "0" innan en order är godkänd).
 */
export function heylinkKop(order: HeylinkOrder, reservId: string): HeylinkKop | null {
  const totalt = belopp(order.totalt);
  if (totalt === undefined || totalt <= 0) return null;
  const nummer = order.number && /^\d+$/.test(order.number) && order.number !== "0" ? order.number : null;
  const orderId = nummer ?? (/^[0-9a-f-]{20,40}$/i.test(reservId) ? reservId : null);
  if (!orderId) return null;

  const momsIn = belopp(order.moms);
  const moms = momsIn !== undefined && momsIn < totalt ? momsIn : undefined;
  const sats = moms !== undefined ? moms / (totalt - moms) : 0.25;
  const netto = moms !== undefined ? totalt - moms : totalt / (1 + sats);
  const fraktEx = belopp(order.fraktExMoms) ?? (belopp(order.frakt) ?? 0) / (1 + sats);
  const varor = ore(netto - fraktEx);
  if (!(varor > 0)) return null;

  const orderItems: HeylinkVara[] = order.rader.map((r) => {
    const antal = Number.isFinite(r.antal) && r.antal > 0 ? r.antal : 1;
    const rad = belopp(r.belopp);
    const vara: HeylinkVara = { itemName: r.namn, itemQuantity: antal };
    const id = r.variantId || r.produktId;
    if (id) vara.itemId = id;
    if (rad !== undefined) vara.itemPrice = ore(rad / antal / (1 + sats));
    if (r.variant) vara.itemVariant = r.variant;
    if (r.bild && /^https:\/\//.test(r.bild)) vara.itemImageUrl = r.bild;
    return vara;
  });

  const kop: HeylinkKop = {
    orderId,
    orderSubTotal: varor,
    orderTotal: ore(totalt),
    orderCurrencyCode: order.valuta && /^[A-Z]{3}$/.test(order.valuta) ? order.valuta : "SEK",
    orderItems,
  };
  if (moms !== undefined) kop.orderTax = ore(moms);
  if (fraktEx > 0) kop.orderShippingSubTotal = ore(fraktEx);
  return kop;
}
