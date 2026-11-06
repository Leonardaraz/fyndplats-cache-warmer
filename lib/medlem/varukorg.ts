// lib/medlem/varukorg.ts
//
// Från besökarens Wix-varukorg till prismotorns rader, och från prisbeslutet
// till en ny Cart V2 med låsta priser (medlemskapet E2, kassan).
//
// Reglerna ur provordern i E0 (motorns docs/claude/46-medlemskap.md), som
// annars hade blivit fel:
//   1. `customerInfo.openAccess: true`, annars ägs korgen av den som skapade
//      den, alltså vår adminnyckel, och kunden kommer inte in.
//   2. `deliveryInfo.address.country: "SE"`, annars blir serverns land
//      förvalt i kassan (vid provet USA).
//   3. `source.channelType: "WEB"`, annars får ordern kanalen UNSPECIFIED.
//   4. `settings.lockCouponCode` och `lockGiftCard` går bara att sätta när
//      korgen skapas (E2-10: kupong och presentkort är låsta).
//   5. Priset låses per rad med `catalogOverrideFields.salePrice` och
//      `fullPrice`, samma värde i båda: inget överstruket pris [P8].
//
// Alla rader från Wix Stores låses på det pris prismotorn räknade, också de
// utan rabatt. Då är summan i kassan exakt den som loggen och tacksidan visar
// (E2-11), även om katalogpriset hinner ändras.
//
// Ren modul utan lokala imports utom typer.

import type { Prisbeslut, Prisrad, Undantag } from "./pris";
import type { Foretagsprofil } from "./foretag";

/** Wix Stores app-id: katalogens produkter. */
export const STORES_APP_ID = "215238eb-22a5-4c36-9e7b-e7c08025e04e";

export interface Varukorgsrad {
  /** Radens id i besökarens varukorg. */
  radId: string;
  produktId: string;
  variantId: string | null;
  appId: string;
  antal: number;
  /** Katalogens pris per styck inkl. moms, i öre. */
  aOre: number;
  namn: string;
  /** Raden har ett reapris: Wix `fullPrice` ligger över priset. Medlemspriset
   *  läggs aldrig ovanpå en rea (Leonard 2026-11-05, 2.1). */
  rea?: true;
}

const text = (v: unknown) => (typeof v === "string" ? v : "");

type Katalogref = { catalogItemId?: unknown; appId?: unknown; options?: { variantId?: unknown } };

/**
 * Det vi läser ur en rad i en Wix-varukorg, i båda formerna.
 *
 * ☠️ Servern läser korgen med `GET /ecom/v2/carts/{id}`, och Cart V2 har en
 * annan radform än V1 (se lib/cart-shape.ts): `source.catalogReference`,
 * `quantityInfo`, `pricing.unitPrice` och `name`. Läsaren kände bara V1-formen,
 * så varje riktig korg blev "tom": varukorgen visade listpriset, "Till kassan"
 * gick till den vanliga kassan med fullt pris, och "Spara varukorgen" sparade
 * ingenting (visuell audit 2026-11-06, förhandsbygget). Proven använde
 * V1-formen och såg det inte.
 */
type WixRad = {
  id?: unknown;
  _id?: unknown;
  // Cart V1
  catalogReference?: Katalogref;
  quantity?: unknown;
  price?: { amount?: unknown };
  /** Priset före katalogens rea; samma som `price` när varan inte är på rea. */
  fullPrice?: { amount?: unknown };
  productName?: { original?: unknown; translated?: unknown };
  // Cart V2 (REST)
  source?: { catalogReference?: Katalogref };
  /** `confirmedQuantity` är vad kunden får (lagret kan ha kapat det). */
  quantityInfo?: { confirmedQuantity?: unknown; requestedQuantity?: unknown };
  pricing?: { unitPrice?: { amount?: unknown }; breakdown?: { fullPrice?: { amount?: unknown } } };
  name?: { original?: unknown; translated?: unknown };
};

/** Det vi läser ur en variant i en V3-produkt. */
type WixVariant = {
  id?: unknown;
  visible?: unknown;
  price?: { actualPrice?: { amount?: unknown }; compareAtPrice?: { amount?: unknown } };
  inventoryStatus?: { inStock?: unknown };
};

/** Ett belopp från Wix ("499.90", "499.9" eller 499.9) i öre. null: inget giltigt belopp. */
export function oreAvBelopp(v: unknown): number | null {
  const s = typeof v === "number" ? String(v) : typeof v === "string" ? v.trim() : "";
  if (!/^\d+(\.\d{1,2})?$/.test(s)) return null;
  const [kr, ore = ""] = s.split(".");
  return Number(kr) * 100 + Number(ore.padEnd(2, "0"));
}

/** Öre som Wix belopp med två decimaler: 49490 → "494.90". */
export function beloppAvOre(ore: number): string {
  if (!Number.isSafeInteger(ore) || ore < 0) throw new Error(`ogiltigt belopp: ${ore}`);
  return `${Math.floor(ore / 100)}.${String(ore % 100).padStart(2, "0")}`;
}

/**
 * Besökarens varukorg som rader, ur Cart V2 (det servern läser) eller V1. En
 * rad som inte går att läsa (inget id, inget pris, antal under 1) gör hela
 * korgen oläslig: hellre den vanliga kassan än en medlemskorg som tappat en vara.
 */
export function lasWixVarukorg(cart: unknown): Varukorgsrad[] | null {
  const items = (cart as { lineItems?: unknown } | null)?.lineItems;
  if (!Array.isArray(items) || items.length === 0) return null;
  const ut: Varukorgsrad[] = [];
  for (const li of items) {
    const r = (li ?? {}) as WixRad;
    const ref = r.catalogReference ?? r.source?.catalogReference ?? {};
    const produktId = text(ref.catalogItemId);
    const appId = text(ref.appId);
    const st = r.quantity ?? r.quantityInfo?.confirmedQuantity ?? r.quantityInfo?.requestedQuantity;
    const antal = typeof st === "number" ? st : Number.NaN;
    const aOre = oreAvBelopp(r.price?.amount ?? r.pricing?.unitPrice?.amount);
    if (!produktId || !appId || !Number.isSafeInteger(antal) || antal < 1 || aOre === null) return null;
    const variantId = text(ref.options?.variantId) || null;
    const fore = oreAvBelopp(r.fullPrice?.amount ?? r.pricing?.breakdown?.fullPrice?.amount);
    const namn = r.productName ?? r.name;
    ut.push({
      radId: text(r.id) || text(r._id) || `${produktId}:${variantId ?? ""}`,
      produktId,
      variantId,
      appId,
      antal,
      aOre,
      namn: text(namn?.translated) || text(namn?.original),
      ...(fore !== null && fore > aOre ? { rea: true as const } : {}),
    });
  }
  return ut;
}

/** Motorns svar för en rad (lib/medlem/golv-klient.ts). */
export interface Golvsvar {
  golvOre: number | null;
  kostnadOre: number | null;
  utan?: string;
}

export const golvnyckel = (produktId: string, variantId: string | null) => `${produktId}|${variantId ?? ""}`;

/** Varukorgens rader som prismotorns rader. Bara Wix Stores kan få medlemspris. */
export function prisrader(rader: readonly Varukorgsrad[], golv: ReadonlyMap<string, Golvsvar>): Prisrad[] {
  return rader.map((r) => {
    const g = golv.get(golvnyckel(r.produktId, r.variantId));
    const undantag: Undantag | undefined =
      r.appId !== STORES_APP_ID
        ? "tjanst"
        : g?.utan === "auktion"
          ? "auktion"
          : g?.utan === "flaggad"
            ? "flaggad"
            : r.rea
              ? "rea"
              : undefined;
    return {
      id: r.radId,
      produktId: r.produktId,
      ...(r.variantId ? { variantId: r.variantId } : {}),
      antal: r.antal,
      aOre: r.aOre,
      momsProcent: 25,
      golvOre: g?.golvOre ?? null,
      ...(undantag ? { undantag } : {}),
    };
  });
}

/**
 * Kroppen till `POST /ecom/v2/carts`: samma varor och antal, med prismotorns
 * radpris låst på varje rad från Wix Stores.
 */
export function laastVarukorgKropp(beslut: Prisbeslut, rader: readonly Varukorgsrad[], epost: string): Record<string, unknown> {
  if (beslut.rader.length !== rader.length) throw new Error("beslutet och korgen har olika antal rader");
  const catalogItems = rader.map((r, i) => {
    const b = beslut.rader[i];
    if (b.id !== r.radId || b.antal !== r.antal || b.aOre !== r.aOre) throw new Error(`rad ${i} stämmer inte med beslutet`);
    const item: Record<string, unknown> = {
      catalogReference: {
        catalogItemId: r.produktId,
        appId: r.appId,
        ...(r.variantId ? { options: { variantId: r.variantId } } : {}),
      },
      quantity: r.antal,
    };
    if (r.appId === STORES_APP_ID) {
      const pris = beloppAvOre(b.pOre);
      item.catalogOverrideFields = { salePrice: pris, fullPrice: pris };
    }
    return item;
  });
  return {
    cart: {
      customerInfo: { openAccess: true, email: epost },
      settings: { lockCouponCode: true, lockGiftCard: true },
      deliveryInfo: { address: { country: "SE" } },
      source: { channelType: "WEB" },
    },
    catalogItems,
  };
}

/** En rad med sitt låsta styckpris inkl. moms (E3: offertens rader). */
export interface Lastrad {
  produktId: string;
  variantId: string | null;
  appId: string;
  antal: number;
  pOre: number;
}

/**
 * Kroppen till `POST /ecom/v2/carts` för rader med givna styckpriser, med samma
 * regler som medlemskorgen (E0): ägarlös, Sverige, WEB, låst kupong och
 * presentkort, samma pris i salePrice och fullPrice. Bara rader från Wix
 * Stores; en offert innehåller inga andra.
 */
export function lastKorgKropp(rader: readonly Lastrad[], epost: string): Record<string, unknown> {
  if (rader.length === 0) throw new Error("korgen saknar rader");
  const catalogItems = rader.map((r, i) => {
    if (r.appId !== STORES_APP_ID) throw new Error(`rad ${i} är inte från Wix Stores`);
    if (!Number.isSafeInteger(r.antal) || r.antal < 1) throw new Error(`rad ${i} har fel antal`);
    const pris = beloppAvOre(r.pOre);
    return {
      catalogReference: {
        catalogItemId: r.produktId,
        appId: r.appId,
        ...(r.variantId ? { options: { variantId: r.variantId } } : {}),
      },
      quantity: r.antal,
      catalogOverrideFields: { salePrice: pris, fullPrice: pris },
    };
  });
  return {
    cart: {
      customerInfo: { openAccess: true, email: epost },
      settings: { lockCouponCode: true, lockGiftCard: true },
      deliveryInfo: { address: { country: "SE" } },
      source: { channelType: "WEB" },
    },
    catalogItems,
  };
}

/** Bär den skapade korgen exakt raderna och deras priser? Ordningen spelar ingen roll. */
export function korgenBarRaderna(rader: readonly Lastrad[], skapad: unknown): boolean {
  const lasta = lasWixVarukorg(skapad);
  if (!lasta || lasta.length !== rader.length) return false;
  const vantat = new Map<string, number[]>();
  for (const r of rader) {
    const k = `${golvnyckel(r.produktId, r.variantId)}|${r.antal}|${r.appId}`;
    vantat.set(k, [...(vantat.get(k) ?? []), r.pOre]);
  }
  for (const r of lasta) {
    const priser = vantat.get(`${golvnyckel(r.produktId, r.variantId)}|${r.antal}|${r.appId}`);
    const i = priser ? priser.indexOf(r.aOre) : -1;
    if (!priser || i < 0) return false;
    priser.splice(i, 1);
  }
  return true;
}

/**
 * Kontroll efter att Wix skapat korgen: varje rad ska bära vårt pris. Wix
 * har tidigare tyst ignorerat fält; utan kontrollen hade en korg utan
 * överstyrning gått till kassan med katalogpriset och loggen visat ett annat.
 */
export function korgenBarPriserna(beslut: Prisbeslut, korgensRader: readonly Varukorgsrad[], skapad: unknown): boolean {
  const rader = lasWixVarukorg(skapad);
  if (!rader || rader.length !== beslut.rader.length) return false;
  // Wix lovar inte radernas ordning: para ihop på vara, variant och antal.
  const vantat = new Map<string, number[]>();
  korgensRader.forEach((r, i) => {
    const k = `${golvnyckel(r.produktId, r.variantId)}|${r.antal}|${r.appId}`;
    vantat.set(k, [...(vantat.get(k) ?? []), beslut.rader[i].pOre]);
  });
  for (const r of rader) {
    const k = `${golvnyckel(r.produktId, r.variantId)}|${r.antal}|${r.appId}`;
    const priser = vantat.get(k);
    if (!priser || priser.length === 0) return false;
    if (r.appId !== STORES_APP_ID) {
      priser.shift();
      continue;
    }
    const i = priser.indexOf(r.aOre);
    if (i < 0) return false;
    priser.splice(i, 1);
  }
  return true;
}

// ─────────────────────────────────────────────────────────────────────────────
// Produktsidan: variantpriserna ur Wix V3
// ─────────────────────────────────────────────────────────────────────────────

export interface Variantpris {
  variantId: string;
  /** Aktuellt pris per styck inkl. moms, i öre. */
  aOre: number;
  iLager: boolean;
  /** Varianten har ett jämförpris över priset, alltså en rea (2.1). */
  rea?: true;
}

/**
 * Varje synlig variant med pris ur en V3-produkt (`variantsInfo.variants`).
 * Samma källa som produktsidans variantpriser (lib/products.ts), så att
 * medlemspriset räknas på det pris kunden ser.
 */
export function variantpriserUrV3(product: unknown): Variantpris[] {
  const varianter = (product as { variantsInfo?: { variants?: unknown } } | null)?.variantsInfo?.variants;
  if (!Array.isArray(varianter)) return [];
  const ut: Variantpris[] = [];
  for (const v of varianter) {
    const r = (v ?? {}) as WixVariant;
    if (r.visible === false) continue;
    const variantId = text(r.id);
    const aOre = oreAvBelopp(r.price?.actualPrice?.amount);
    if (!variantId || aOre === null || aOre === 0) continue;
    const jamfor = oreAvBelopp(r.price?.compareAtPrice?.amount);
    ut.push({
      variantId,
      aOre,
      iLager: r.inventoryStatus?.inStock !== false,
      ...(jamfor !== null && jamfor > aOre ? { rea: true as const } : {}),
    });
  }
  return ut;
}

// ─────────────────────────────────────────────────────────────────────────────
// Förskottsordern (E3, villkoren 5.1, Leonards svar 3.3 2026-11-05)
// ─────────────────────────────────────────────────────────────────────────────
//
// Wix har inget API som slår på ett betalsätt, och manuell betalning i panelen
// syns för alla kunder. Ett godkänt företag får därför en knapp i varukorgen,
// och butiken skapar ordern själv med `POST /ecom/v1/orders`: obetald,
// handlagd (`BACKOFFICE_MERCHANT`) och med FORSKOTT_MARKOR först i
// noteringen. Resten gör motorn (lib/orders/faktura.ts där):
//   • fakturan går ut direkt och förfaller efter högst tio dagar;
//   • ☠️ inga leverantörsuppgifter skapas förrän ordern är betald;
//   • när Leonard markerar den betald går kvittot och uppgifterna skapas.
//
// Ordern byggs som Wix själv bygger en order med priser inklusive moms
// (uppmätt på provordern 10167): radens `price` och `totalPriceAfterTax` är
// inklusive moms, `totalPriceBeforeTax` exklusive, och i `priceSummary` är
// delsumman och frakten exklusive moms medan `total` är det kunden betalar.
// Frakten följer butikens enda fraktregel (lib/shipping.ts), samma som kassan.
//
// ☠️ En enskild firmas organisationsnummer är ett personnummer: det skrivs
// aldrig i ordern. Fakturan får då bara företagets namn.

/** Står först i ordernoteringen. Motorn känner igen förskottsordern på den. */
export const FORSKOTT_MARKOR = "Förskottsfaktura";
/** Fakturan förfaller efter högst så här många dagar (motorns FORSKOTT_DAGAR). */
export const FORSKOTT_DAGAR = 10;
/** Fraktens namn, samma som Wix-kassan visar. */
export const FRAKT_TITEL = "Spårbar standardleverans";

const MOMS_PROCENT = 25;
const MOMS_SATS = "0.25";

/** Prismotorns `exklMoms` (pris.ts). Skickas in: en ren modul kan inte importera en annan när node --test kör den. */
export type ExklMoms = (ore: number, momsProcent: number) => number;

export interface Postadress {
  gata: string;
  /** Fem siffror, med eller utan mellanslag. */
  postnr: string;
  ort: string;
}

export interface Forskottskund {
  epost: string;
  foretag: string;
  /** Står på fakturan. Utelämnas för en enskild firma (ett personnummer). */
  orgnr?: string;
  faktura: Postadress;
  /** Saknas: varorna levereras till fakturaadressen. */
  leverans?: Postadress;
}

/**
 * Kunden ur företagsprofilen. ☠️ En enskild firmas organisationsnummer är
 * ägarens personnummer och följer aldrig med till ordern (F4).
 */
export function forskottskund(
  fp: Pick<Foretagsprofil, "namn" | "orgnr" | "form" | "faktura" | "leverans">,
  epost: string,
): Forskottskund {
  return {
    epost,
    foretag: fp.namn,
    ...(fp.form === "juridisk" ? { orgnr: fp.orgnr } : {}),
    faktura: fp.faktura,
    ...(fp.leverans ? { leverans: fp.leverans } : {}),
  };
}

/**
 * Företaget på prisbeslutet, till motorns kvitto för ett köp i kassan
 * (villkoren för företagskonto 5.2: "Kvitto och faktura med köparens namn och
 * adress, och för ett bolag organisationsnumret, skickas med e-post"). Motorn
 * läser fälten med samma namn (`foretagUrBeslut` i lib/orders/faktura.ts) och
 * skickar kvittot när ordern är betald.
 *
 * ☠️ En enskild firmas organisationsnummer är ägarens personnummer och följer
 * aldrig med (F4), samma regel som förskottsordern (`forskottskund`).
 */
export interface ForetagPaBeslut {
  foretagNamn: string;
  /** Bara för ett bolag. */
  foretagOrgnr?: string;
  foretagFaktura: Postadress;
}

export function foretagPaBeslut(fp: Pick<Foretagsprofil, "namn" | "orgnr" | "form" | "faktura">): ForetagPaBeslut {
  return {
    foretagNamn: fp.namn,
    ...(fp.form === "juridisk" ? { foretagOrgnr: fp.orgnr } : {}),
    foretagFaktura: { gata: fp.faktura.gata, postnr: fp.faktura.postnr, ort: fp.faktura.ort },
  };
}

/** Noteringen som motorn läser: markören och, för ett bolag, organisationsnumret. */
export function forskottsnotering(k: Pick<Forskottskund, "orgnr">): string {
  return k.orgnr ? `${FORSKOTT_MARKOR}. Org.nr: ${k.orgnr}.` : `${FORSKOTT_MARKOR}.`;
}

/** "15244" → "152 44", som Wix skriver svenska postnummer. */
export function postnummer(p: string): string {
  const s = p.replace(/\s+/g, "");
  return /^\d{5}$/.test(s) ? `${s.slice(0, 3)} ${s.slice(3)}` : p.trim();
}

function adress(a: Postadress) {
  return { country: "SE", city: a.ort.trim(), postalCode: postnummer(a.postnr), addressLine: a.gata.trim() };
}

/** Ett belopp inklusive moms delat i delen utan moms och momsen, i öre. */
export function momsdelar(inklOre: number, exklMoms: ExklMoms): { exklOre: number; momsOre: number } {
  const exklOre = exklMoms(inklOre, MOMS_PROCENT);
  return { exklOre, momsOre: inklOre - exklOre };
}

export interface Forskottssummor {
  /** Varorna inklusive moms. */
  varorOre: number;
  fraktOre: number;
  momsOre: number;
  /** Att betala. */
  totalOre: number;
}

/**
 * Kroppen till `POST /ecom/v1/orders`. Kastar om beslutet och korgen inte hör
 * ihop, eller om korgen har något annat än varor ur Wix Stores (ett presentkort
 * eller en tjänst går inte att förskottsfakturera härifrån).
 */
export function forskottsorderKropp(
  beslut: Prisbeslut,
  rader: readonly Varukorgsrad[],
  kund: Forskottskund,
  fraktOre: number,
  exklMoms: ExklMoms,
): { kropp: Record<string, unknown>; summor: Forskottssummor } {
  if (beslut.rader.length !== rader.length || rader.length === 0) throw new Error("beslutet och korgen har olika antal rader");
  if (!Number.isSafeInteger(fraktOre) || fraktOre < 0) throw new Error(`ogiltig frakt: ${fraktOre}`);
  let varorOre = 0;
  let varorExklOre = 0;
  let momsOre = 0;
  const lineItems = rader.map((r, i) => {
    const b = beslut.rader[i];
    if (b.id !== r.radId || b.antal !== r.antal || b.aOre !== r.aOre) throw new Error(`rad ${i} stämmer inte med beslutet`);
    if (r.appId !== STORES_APP_ID) throw new Error(`rad ${i} är ingen vara ur Wix Stores`);
    const inkl = b.pOre * r.antal;
    const { exklOre, momsOre: moms } = momsdelar(inkl, exklMoms);
    varorOre += inkl;
    varorExklOre += exklOre;
    momsOre += moms;
    return {
      productName: { original: r.namn.trim() || "Vara" },
      catalogReference: {
        catalogItemId: r.produktId,
        appId: r.appId,
        ...(r.variantId ? { options: { variantId: r.variantId } } : {}),
      },
      quantity: r.antal,
      itemType: { preset: "PHYSICAL" },
      physicalProperties: { shippable: true },
      price: { amount: beloppAvOre(b.pOre) },
      totalPriceBeforeTax: { amount: beloppAvOre(exklOre) },
      totalPriceAfterTax: { amount: beloppAvOre(inkl) },
      taxDetails: { taxRate: MOMS_SATS, totalTax: { amount: beloppAvOre(moms) } },
      paymentOption: "FULL_PAYMENT_OFFLINE",
    };
  });
  const frakt = momsdelar(fraktOre, exklMoms);
  momsOre += frakt.momsOre;
  const totalOre = varorOre + fraktOre;

  const faktura = adress(kund.faktura);
  const leverans = adress(kund.leverans ?? kund.faktura);
  const kontakt = { company: kund.foretag.trim() };

  const kropp = {
    order: {
      buyerInfo: { email: kund.epost },
      buyerNote: forskottsnotering(kund),
      buyerLanguage: "sv",
      currency: "SEK",
      weightUnit: "KG",
      taxIncludedInPrices: true,
      channelInfo: { type: "BACKOFFICE_MERCHANT" },
      status: "APPROVED",
      paymentStatus: "NOT_PAID",
      lineItems,
      priceSummary: {
        subtotal: { amount: beloppAvOre(varorExklOre) },
        shipping: { amount: beloppAvOre(frakt.exklOre) },
        tax: { amount: beloppAvOre(momsOre) },
        discount: { amount: "0.00" },
        total: { amount: beloppAvOre(totalOre) },
      },
      billingInfo: { address: faktura, contactDetails: kontakt },
      shippingInfo: {
        title: FRAKT_TITEL,
        logistics: { shippingDestination: { address: leverans, contactDetails: kontakt } },
        cost: {
          price: { amount: beloppAvOre(fraktOre) },
          totalPriceBeforeTax: { amount: beloppAvOre(frakt.exklOre) },
          totalPriceAfterTax: { amount: beloppAvOre(fraktOre) },
          taxDetails: { taxRate: MOMS_SATS, totalTax: { amount: beloppAvOre(frakt.momsOre) } },
        },
      },
      recipientInfo: { address: leverans, contactDetails: kontakt },
    },
  };
  return { kropp, summor: { varorOre, fraktOre, momsOre, totalOre } };
}

type SkapadOrder = {
  id?: unknown;
  number?: unknown;
  paymentStatus?: unknown;
  channelInfo?: { type?: unknown };
  priceSummary?: { total?: { amount?: unknown } };
  lineItems?: { quantity?: unknown; price?: { amount?: unknown }; catalogReference?: { catalogItemId?: unknown } }[];
};

export type Kontroll = { ok: true; orderId: string; nummer: string } | { ok: false; fel: string };

/**
 * Bär ordern Wix skapade det vi skickade? Wix får justera status och
 * betalstatus när ordern skapas (en order på 0 kr blir betald). En order som
 * inte är obetald, inte handlagd eller har andra belopp får aldrig stå kvar som
 * en förskottsorder.
 */
export function kontrolleraForskottsorder(summor: Forskottssummor, rader: readonly { produktId: string; antal: number; pOre: number }[], skapad: unknown): Kontroll {
  const o = (skapad ?? {}) as SkapadOrder;
  const orderId = typeof o.id === "string" ? o.id : "";
  const nummer = typeof o.number === "string" || typeof o.number === "number" ? String(o.number) : "";
  if (!orderId || !nummer) return { ok: false, fel: "ordern saknar id eller nummer" };
  if (o.paymentStatus !== "NOT_PAID") return { ok: false, fel: `betalstatus ${String(o.paymentStatus)}` };
  if (o.channelInfo?.type !== "BACKOFFICE_MERCHANT") return { ok: false, fel: "fel kanal" };
  if (oreAvBelopp(o.priceSummary?.total?.amount) !== summor.totalOre) return { ok: false, fel: "totalen skiljer sig" };
  const li = Array.isArray(o.lineItems) ? o.lineItems : [];
  if (li.length !== rader.length) return { ok: false, fel: "antalet rader skiljer sig" };
  // Wix lovar inte radernas ordning: para ihop på vara, antal och pris.
  const kvar = rader.map((r) => `${r.produktId}|${r.antal}|${r.pOre}`);
  for (const l of li) {
    const k = `${String(l.catalogReference?.catalogItemId ?? "")}|${String(l.quantity ?? "")}|${oreAvBelopp(l.price?.amount) ?? ""}`;
    const i = kvar.indexOf(k);
    if (i < 0) return { ok: false, fel: "en rad bär inte vårt pris" };
    kvar.splice(i, 1);
  }
  return { ok: true, orderId, nummer };
}

// ─────────────────────────────────────────────────────────────────────────────
// Kassans adress
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Adressen kunden skickas till, ur redirect-sessionens `fullUrl`. Samma
 * behandling som den vanliga kassan (components/cart.tsx): den inre länken
 * till `/__ecom/checkout` plockas ut, eftersom den yttre pekar på en sida som
 * 404:ar på vår domän, och inloggningsraden döljs så att kunden handlar som
 * gäst. null: ingen användbar adress.
 */
export function kassaAdress(fullUrl: unknown, headlessClientId: string): string | null {
  if (typeof fullUrl !== "string" || !fullUrl) return null;
  try {
    const inre = new URL(fullUrl).searchParams.get("redirectUrl");
    if (!inre || !inre.includes("/__ecom/checkout")) return null;
    const u = new URL(inre);
    u.searchParams.set("hideLoginLogoutBar", "true");
    if (!u.searchParams.has("headlessClientId")) u.searchParams.set("headlessClientId", headlessClientId);
    return u.toString();
  } catch {
    return null;
  }
}
