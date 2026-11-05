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

/** Det vi läser ur en rad i en Wix-varukorg. */
type WixRad = {
  id?: unknown;
  catalogReference?: { catalogItemId?: unknown; appId?: unknown; options?: { variantId?: unknown } };
  quantity?: unknown;
  price?: { amount?: unknown };
  /** Priset före katalogens rea; samma som `price` när varan inte är på rea. */
  fullPrice?: { amount?: unknown };
  productName?: { original?: unknown; translated?: unknown };
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
 * Besökarens varukorg som rader. En rad som inte går att läsa (inget id, inget
 * pris, antal under 1) gör hela korgen oläslig: hellre den vanliga kassan än en
 * medlemskorg som tappat en vara.
 */
export function lasWixVarukorg(cart: unknown): Varukorgsrad[] | null {
  const items = (cart as { lineItems?: unknown } | null)?.lineItems;
  if (!Array.isArray(items) || items.length === 0) return null;
  const ut: Varukorgsrad[] = [];
  for (const li of items) {
    const r = (li ?? {}) as WixRad;
    const ref = r.catalogReference ?? {};
    const produktId = text(ref.catalogItemId);
    const appId = text(ref.appId);
    const antal = typeof r.quantity === "number" ? r.quantity : Number.NaN;
    const aOre = oreAvBelopp(r.price?.amount);
    if (!produktId || !appId || !Number.isSafeInteger(antal) || antal < 1 || aOre === null) return null;
    const variantId = text(ref.options?.variantId) || null;
    const fore = oreAvBelopp(r.fullPrice?.amount);
    ut.push({
      radId: text(r.id) || `${produktId}:${variantId ?? ""}`,
      produktId,
      variantId,
      appId,
      antal,
      aOre,
      namn: text(r.productName?.translated) || text(r.productName?.original),
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
