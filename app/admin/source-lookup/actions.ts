"use server";

import { getStore } from "@/lib/store/factory";
import { getV3ProductBySlug } from "@/lib/wix/v3-products";
import { fetchOrderByNumber } from "@/lib/wix/orders";
import { parseLookupInput, leverantorskallaFor } from "@/lib/import/source-link";

export type LookupResult =
  | {
      ok: true;
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
      matchedBy: "id" | "slug" | "order" | "sku";
      /** Satt när uppslaget gick via ett ordernummer — vad kunden faktiskt köpte. */
      orderrad?: { number: string; sku?: string; quantity: number; productName?: string };
    }
  | { ok: false; error: string };

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
    let orderrad: { number: string; sku?: string; quantity: number; productName?: string } | undefined;

    if (target.kind === "id") {
      wixProductId = target.id;
    } else if (target.kind === "order") {
      // ☠️ FLERA RADER → VÄGRA OCH LISTA DEM. Samma regel som `valj-task.ts` och
      // AE-kopplingen: att gissa vilken rad som menas skickar operatören till
      // fel leverantörssida, och en felbeställd vara är dyrare än en extra
      // klistring. Listan bär allt som behövs för att välja.
      const order = await fetchOrderByNumber(target.number);
      if (!order) {
        return { ok: false, error: `Hittade ingen order med nummer ${target.number}.` };
      }
      const medProdukt = order.rader.filter((r) => r.productId);
      if (medProdukt.length === 0) {
        return {
          ok: false,
          error:
            `Order ${order.number} har ${order.rader.length} rad(er) men ingen av dem bär ett ` +
            "Wix-produkt-id (manuell eller specialrad). Slå upp produkten på dess SKU i stället.",
        };
      }
      if (medProdukt.length > 1) {
        const lista = medProdukt
          .map((r) => `  • ${r.productName ?? "(utan namn)"} — SKU ${r.sku ?? "?"} × ${r.quantity}`)
          .join("\n");
        return {
          ok: false,
          error:
            `Order ${order.number} har ${medProdukt.length} rader. Slå upp en i taget ` +
            `— klistra in dess SKU:\n${lista}`,
        };
      }
      const rad = medProdukt[0];
      wixProductId = rad.productId as string;
      orderrad = {
        number: order.number,
        sku: rad.sku,
        quantity: rad.quantity,
        productName: rad.productName,
      };
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
    if (!mapping) {
      return {
        ok: false,
        error:
          `Produkten (${wixProductId.slice(0, 8)}…) saknar leverantörsmappning i FyndplatsMappings. ` +
          "Importerades den inte via verktyget? Mappa den i så fall via /admin/mappning.",
      };
    }

    const kalla = leverantorskallaFor(mapping);

    return {
      ok: true,
      wixProductId,
      title: mapping.seoTitle,
      leverantor: kalla.namn,
      artikelnummer: kalla.artikelnummer,
      kallUrl: kalla.url,
      sourceUrl: mapping.sourceUrl,
      supplierName: mapping.supplierName,
      variantCount: mapping.variants?.length ?? 0,
      matchedBy: target.kind,
      orderrad,
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    if (/fetch failed|ENOTFOUND|ECONNRESET|timed? ?out|network/i.test(message)) {
      return { ok: false, error: "Kunde inte nå Wix. Prova igen om en stund." };
    }
    return { ok: false, error: message };
  }
}
