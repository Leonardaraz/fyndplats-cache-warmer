// Raderna i /admin/restock-list: butikens namn, leverantörens länk och var
// varan är slut, per bevakad produkt.
//
// Leonard 2026-09-30, med sidan uppe: *"restock bevakare produkterna står på
// engelska. det borde stå på svenska o länk till leverantören på vart den är
// slutsåld nånstans"*.
//
// ☠️ NAMNET KOM UR MAPPNINGENS `seoTitle`. Det fältet är leverantörens sidtitel
// från importen ("… - AliExpress"), aldrig vårt namn, och det skrivs aldrig om
// av poleringen. Butikens namn bor i Wix. Mappningens titel visas bara när Wix
// inte känner produkten, och då märkt som leverantörens.
//
// Ren logik: sidan hämtar, den här modulen bestämmer vad som visas.

import type { MappingSupplier } from "../store";
import { leverantorskallaFor } from "../import/source-link";
import { storeProductUrl } from "../admin-links";
import type { RestockProductCount } from "./store";

/** Det sidan läser om produkten ur Wix (`searchProductSummaries`). */
export interface RestockButiksprodukt {
  name?: string;
  slug?: string;
  visible?: boolean;
  availabilityStatus?: string;
}

/** Det sidan läser ur mappningsraden. */
export interface RestockMappning {
  supplierProductId?: string;
  supplier?: MappingSupplier;
  sourceUrl?: string;
  seoTitle?: string;
  shipsFromCountries?: string[];
  aosomSyncedQty?: number;
  aosomSyncedAt?: string;
  variants?: Array<{
    choices?: Record<string, string>;
    /** AOSOM: saldot synken senast skrev för just den här varianten. */
    aosomSyncedQty?: number;
    /** ALIEXPRESS: lagerlandet för variantens SKU, t.ex. "ES". */
    shipFrom?: string;
  }>;
}

/** Det sidan läser ur AliExpress-synkens tillstånd för produkten. */
export interface RestockSynkstatus {
  listingStatus?: string;
  currentStock?: number | null;
  outOfStockSince?: string | null;
  lastCheckedAt?: string;
}

export type LagerHosOss = "i_lager" | "slut" | "delvis" | "okant";
export type LagerHosLeverantor = "i_lager" | "slut" | "delvis" | "borttagen" | "okant";

/** Saldot per variant på en sammanslagen Aosom-sida, t.ex. `{ namn: "Beige", antal: 0 }`. */
export interface RestockVariantlager {
  namn: string;
  antal: number | null;
}

export interface RestockLeverantor {
  leverantor: MappingSupplier;
  /** "AliExpress" · "Aosom". */
  namn: string;
  /** Produktsidan hos leverantören, eller null när den inte går att bygga. */
  url: string | null;
  /** Lagerländerna på svenska, t.ex. ["Spanien"]. Tom = okänt. */
  lager: string[];
  status: LagerHosLeverantor;
  /** Senast kända saldo hos leverantören, eller null. */
  antal: number | null;
  /**
   * Saldot per variant när sidan bär flera. ☠️ Radens `aosomSyncedQty` är
   * SUMMAN av varianternas på en sammanslagen sida, så "i lager" på raden kan
   * dölja att just den färg kunden väntar på är slut. Tom för en vanlig rad.
   */
  varianter: RestockVariantlager[];
  /** AliExpress: när listningen gick slut. Aosom har inget sådant fält. */
  slutSedan: string | null;
  /** När statusen senast lästes: AE-synkens kontroll eller Aosom-synkens skrivning. */
  kontrollerad: string | null;
  /**
   * ☠️ BARA ALIEXPRESS-SYNKEN MEJLAR BEVAKARNA. `justRestocked` i
   * `lib/sync/aliexpress-sync.ts` är den enda vägen till ett restock-mejl, och
   * Aosom-synken har ingen motsvarighet. En Aosom-vara som kommer tillbaka
   * lämnar alltså sina bevakare väntande — sidan ska säga det, inte lova mejlet.
   */
  mejlasAutomatiskt: boolean;
}

export interface RestockRad extends RestockProductCount {
  /** Butikens namn. null = Wix känner inte produkten, eller uppslaget föll. */
  namn: string | null;
  /** "saknas" = Wix svarade utan produkten; "okant" = uppslaget föll. */
  iButiken: "finns" | "saknas" | "okant";
  /** Wix `visible`. null när produkten inte lästes. */
  synlig: boolean | null;
  /** Butikssidan. Tom för ett utkast — en dold produkt svarar 404. */
  butikUrl: string;
  hosOss: LagerHosOss;
  /** null = ingen mappningsrad, eller uppslaget föll (se `mappningOkand`). */
  leverantor: RestockLeverantor | null;
  /** True när mappningen inte gick att läsa, till skillnad från att den saknas. */
  mappningOkand: boolean;
  /** Leverantörens titel ur mappningen — BARA när butiken inte gav något namn. */
  leverantorensTitel: string | null;
}

export interface RestockRadIndata {
  counts: RestockProductCount[];
  /** Wix-uppslaget. null = hela uppslaget föll. */
  produkter: Map<string, RestockButiksprodukt> | null;
  /**
   * Mappningen per produkt-id. `null` = raden finns inte. En SAKNAD nyckel
   * betyder att läsningen föll — det är inte samma sak som ingen rad.
   */
  mappningar: Map<string, RestockMappning | null>;
  /** AE-synkens tillstånd per produkt-id. Saknad nyckel eller null = okänt. */
  synk: Map<string, RestockSynkstatus | null>;
}

const LAGER_HOS_OSS: Record<string, LagerHosOss> = {
  IN_STOCK: "i_lager",
  OUT_OF_STOCK: "slut",
  PARTIALLY_OUT_OF_STOCK: "delvis",
};

let landsnamn: Intl.DisplayNames | null | undefined;

/** "ES" → "Spanien". Okänd kod → koden som den är, hellre än ingenting. */
export function landSv(kod: string): string {
  const k = kod.trim().toUpperCase();
  if (!k) return "";
  if (landsnamn === undefined) {
    try {
      landsnamn = new Intl.DisplayNames(["sv"], { type: "region" });
    } catch {
      landsnamn = null;
    }
  }
  try {
    return landsnamn?.of(k) ?? k;
  } catch {
    return k;
  }
}

type Leverantorsstatus = Pick<RestockLeverantor, "status" | "antal" | "varianter" | "slutSedan" | "kontrollerad">;

function aliExpressStatus(s: RestockSynkstatus | null | undefined): Leverantorsstatus {
  const tom = { varianter: [] as RestockVariantlager[] };
  if (!s) return { status: "okant", antal: null, slutSedan: null, kontrollerad: null, ...tom };
  const antal = typeof s.currentStock === "number" ? s.currentStock : null;
  const kontrollerad = s.lastCheckedAt ?? null;
  const slutSedan = s.outOfStockSince ?? null;
  const med = (status: LagerHosLeverantor): Leverantorsstatus => ({ status, antal, slutSedan, kontrollerad, ...tom });
  if (s.listingStatus === "removed") return med("borttagen");
  if (s.listingStatus === "out_of_stock") return med("slut");
  if (s.listingStatus === "active") {
    // En levande listning med noll i lager är slut hos leverantören, även om
    // synken ännu inte hunnit samla sina strikes och nolla butiken.
    if (antal === 0) return med("slut");
    if (antal !== null && antal > 0) return med("i_lager");
  }
  return med("okant");
}

function variantnamn(choices: Record<string, string> | undefined, index: number): string {
  const namn = Object.values(choices ?? {}).map((v) => String(v).trim()).filter(Boolean).join(" / ");
  return namn || `Variant ${index + 1}`;
}

function aosomStatus(m: RestockMappning): Leverantorsstatus {
  const kontrollerad = m.aosomSyncedAt ?? null;
  // ☠️ Bara ett uttryckligt tal räknas. Fältet saknas på en rad som aldrig
  // synkats, och det är ingen bevisning om saldot — samma regel som
  // `Prisgrind.slutsald`.
  const tal = (q: unknown): number | null => (typeof q === "number" ? q : null);

  const varianter = m.variants ?? [];
  if (varianter.length >= 2 && varianter.some((v) => tal(v.aosomSyncedQty) !== null)) {
    const lista = varianter.map((v, i) => ({ namn: variantnamn(v.choices, i), antal: tal(v.aosomSyncedQty) }));
    const kanda = lista.filter((v) => v.antal !== null);
    const slut = kanda.filter((v) => v.antal === 0).length;
    const status: LagerHosLeverantor =
      kanda.length < lista.length
        ? slut > 0 ? "delvis" : "okant"
        : slut === lista.length ? "slut" : slut > 0 ? "delvis" : "i_lager";
    const antal = kanda.length === lista.length ? kanda.reduce((s, v) => s + (v.antal ?? 0), 0) : null;
    return { status, antal, varianter: lista, slutSedan: null, kontrollerad };
  }

  const antal = tal(m.aosomSyncedQty);
  if (antal === null) return { status: "okant", antal, varianter: [], slutSedan: null, kontrollerad };
  return { status: antal > 0 ? "i_lager" : "slut", antal, varianter: [], slutSedan: null, kontrollerad };
}

function leverantorFor(
  m: RestockMappning,
  synk: RestockSynkstatus | null | undefined,
): RestockLeverantor {
  const kalla = leverantorskallaFor(m);
  const status = kalla.leverantor === "aosom" ? aosomStatus(m) : aliExpressStatus(synk);
  // Varianternas egna lagerländer räknas med: AliExpress bakar in landet i SKU:n.
  const koder = [...(m.shipsFromCountries ?? []), ...(m.variants ?? []).map((v) => v.shipFrom ?? "")];
  const lager = [...new Set(koder.map(landSv).filter(Boolean))];
  return {
    leverantor: kalla.leverantor,
    namn: kalla.namn,
    url: kalla.url,
    lager,
    ...status,
    mejlasAutomatiskt: kalla.leverantor === "aliexpress",
  };
}

export function byggRestockRader(indata: RestockRadIndata): RestockRad[] {
  return indata.counts.map((c) => {
    const p = indata.produkter?.get(c.productId);
    const iButiken: RestockRad["iButiken"] = indata.produkter === null ? "okant" : p ? "finns" : "saknas";
    const namn = p?.name?.trim() || null;
    const synlig = p ? p.visible !== false : null;

    const mappningLast = indata.mappningar.has(c.productId);
    const m = indata.mappningar.get(c.productId) ?? null;
    const leverantor = m ? leverantorFor(m, indata.synk.get(c.productId)) : null;

    return {
      ...c,
      namn,
      iButiken,
      synlig,
      // Ett utkast svarar 404 i butiken, så länken utelämnas hellre än att leda fel.
      butikUrl: p && synlig ? storeProductUrl(p.slug) : "",
      hosOss: (p?.availabilityStatus && LAGER_HOS_OSS[p.availabilityStatus]) || "okant",
      leverantor,
      mappningOkand: !mappningLast,
      leverantorensTitel: namn ? null : m?.seoTitle?.trim() || null,
    };
  });
}
