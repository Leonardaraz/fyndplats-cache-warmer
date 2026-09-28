"use server";

import { getStore } from "@/lib/store/factory";
import type { ProductMappingRecord } from "@/lib/store";
import { getV3ProductBySlug } from "@/lib/wix/v3-products";
import { fetchOrderByNumber } from "@/lib/wix/orders";
import { parseLookupInput, leverantorskallaFor } from "@/lib/import/source-link";
import { aosomArtikelForTask } from "@/lib/aosom/artiklar";

/** Leverantörskällan för EN produkt (och, vid ordernummer, en orderrad). */
export interface KallRad {
  wixProductId: string;
  title?: string;
  /** "AliExpress" · "Aosom" — vyn ska aldrig gissa. */
  leverantor: string;
  /** Artikelnumret som det klistras in hos leverantören (utan aosom:-prefix). */
  artikelnummer: string;
  kallUrl: string | null;
  sourceUrl?: string;
  supplierName?: string;
  variantCount: number;
  /** Satt när uppslaget gick via ett ordernummer — vad kunden faktiskt köpte. */
  orderrad?: { sku?: string; quantity: number; productName?: string };
  /** Något att kontrollera innan beställning (t.ex. färgen gick inte att avgöra). */
  varning?: string;
}

/** En orderrad som inte gick att slå upp. Visas i listan i stället för att tystas. */
export interface FelRad {
  fel: string;
  orderrad?: { sku?: string; quantity: number; productName?: string };
}

export type LookupResult =
  | {
      ok: true;
      matchedBy: "id" | "slug" | "order" | "sku";
      /** Ordernumret när uppslaget gick via en order. */
      order?: string;
      /** En rad per produkt; en order ger en rad per orderrad. */
      rader: Array<KallRad | FelRad>;
    }
  | { ok: false; error: string };

type Mapping = ProductMappingRecord;

/** Källan för en mappning, och för en orderrad den färg kunden köpte. */
function kallaFor(
  mapping: Mapping,
  wixProductId: string,
  rad?: { variantId?: string; sku?: string; quantity: number; productName?: string },
): KallRad {
  const kalla = leverantorskallaFor(mapping);
  let artikelnummer = kalla.artikelnummer;
  let varning: string | undefined;
  // En sammanslagen Aosom-sida bär en artikel per färg. Orderradens variant
  // avgör vilken; går den inte att avgöra sägs det, i stället för att gissa.
  if (rad && kalla.leverantor === "aosom") {
    const svar = aosomArtikelForTask({ wixVariantId: rad.variantId, sku: rad.sku, variantChoices: {} }, mapping);
    if ("artikel" in svar) artikelnummer = svar.artikel;
    else varning = `Kontrollera färgen hos Aosom: ${svar.skal}. Numret nedan är sidans huvudartikel.`;
  }
  return {
    wixProductId,
    title: mapping.seoTitle,
    leverantor: kalla.namn,
    artikelnummer,
    kallUrl: kalla.url,
    sourceUrl: mapping.sourceUrl,
    supplierName: mapping.supplierName,
    variantCount: mapping.variants?.length ?? 0,
    ...(rad ? { orderrad: { sku: rad.sku, quantity: rad.quantity, productName: rad.productName } } : {}),
    ...(varning ? { varning } : {}),
  };
}

const SAKNAR_MAPPNING = (id: string) =>
  `Produkten (${id.slice(0, 8)}…) saknar leverantörsmappning i FyndplatsMappings. ` +
  "Importerades den inte via verktyget? Mappa den i så fall via /admin/mappning.";

/**
 * Slår upp vilken LEVERANTÖRSPRODUKT en importerad Wix-produkt är länkad till.
 * Tar ett Wix-produkt-id, en slug eller en storefront-URL och returnerar
 * leverantör, artikelnummer och länk (från mappningen). Inga skrivningar.
 *
 * Fungerar för båda leverantörerna. Den skrevs för AliExpress och märkte varje
 * rad så — även Aosoms, som är merparten av katalogen.
 */
export async function lookupSourceAction(input: string): Promise<LookupResult> {
  const target = parseLookupInput(input);
  if (!target) {
    return {
      ok: false,
      error: "Klistra in ett ordernummer, en variant-SKU, ett Wix-produkt-id, en slug eller en produkt-URL.",
    };
  }

  try {
    let wixProductId: string;

    if (target.kind === "id") {
      wixProductId = target.id;
    } else if (target.kind === "order") {
      // EN RAD PER ORDERRAD. Tidigare vägrade uppslaget vid flera rader och bad
      // om en SKU i taget. Nu slås varje rad upp för sig och visas under
      // ordern, med sin egen leverantör, sitt eget artikelnummer och den färg
      // kunden köpte (Leonard 2026-09-28). Ingen rad gissas: en rad som inte
      // går att slå upp visas med sitt skäl.
      const order = await fetchOrderByNumber(target.number);
      if (!order) {
        return { ok: false, error: `Hittade ingen order med nummer ${target.number}.` };
      }
      if (order.rader.length === 0) {
        return { ok: false, error: `Order ${order.number} har inga rader.` };
      }
      const store = getStore();
      const rader = await Promise.all(
        order.rader.map(async (r): Promise<KallRad | FelRad> => {
          const orderrad = { sku: r.sku, quantity: r.quantity, productName: r.productName };
          if (!r.productId) {
            return { fel: "Raden bär inget Wix-produkt-id (manuell eller specialrad).", orderrad };
          }
          const m = await store.getMappingByWixProductId(r.productId);
          return m ? kallaFor(m, r.productId, r) : { fel: SAKNAR_MAPPNING(r.productId), orderrad };
        }),
      );
      return { ok: true, matchedBy: "order", order: order.number, rader };
    } else if (target.kind === "sku") {
      // ⚠️ EN SKU KAN SITTA PÅ FLERA PRODUKTER. Importen härleder variant-SKU:n
      // ur den tyska titelns första ord, så syskon får samma sträng — batch 66
      // hade sex produkter på två SKU:er. Också här: vägra och lista.
      const traffar = (await getStore().listMappings()).filter((m) =>
        (m.variants ?? []).some((v) => (v.sku ?? "").toLowerCase() === target.sku.toLowerCase()),
      );
      if (traffar.length === 0) {
        return {
          ok: false,
          error:
            `Ingen mappning har en variant med SKU "${target.sku}". Kontrollera stavningen, ` +
            "eller slå upp produkten på dess Wix-produkt-id.",
        };
      }
      if (traffar.length > 1) {
        const lista = traffar
          .map((m) => `  • ${m.seoTitle ?? "(utan titel)"} — ${m.wixProductId}`)
          .join("\n");
        return {
          ok: false,
          error:
            `SKU "${target.sku}" sitter på ${traffar.length} produkter. Slå upp en i taget ` +
            `med dess Wix-produkt-id:\n${lista}`,
        };
      }
      wixProductId = traffar[0].wixProductId;
    } else {
      const prod = await getV3ProductBySlug(target.slug);
      if (!prod) {
        return {
          ok: false,
          error: `Hittade ingen produkt med slug "${target.slug}". Kontrollera slug:en eller använd Wix-produkt-id.`,
        };
      }
      wixProductId = prod.id;
    }

    const mapping = await getStore().getMappingByWixProductId(wixProductId);
    if (!mapping) return { ok: false, error: SAKNAR_MAPPNING(wixProductId) };
    return { ok: true, matchedBy: target.kind, rader: [kallaFor(mapping, wixProductId)] };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    if (/fetch failed|ENOTFOUND|ECONNRESET|timed? ?out|network/i.test(message)) {
      return { ok: false, error: "Kunde inte nå Wix. Prova igen om en stund." };
    }
    return { ok: false, error: message };
  }
}
