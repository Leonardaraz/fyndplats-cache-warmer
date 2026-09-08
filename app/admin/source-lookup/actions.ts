"use server";

import { getStore } from "@/lib/store/factory";
import { getV3ProductBySlug } from "@/lib/wix/v3-products";
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
      matchedBy: "id" | "slug";
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
    return { ok: false, error: "Klistra in ett Wix-produkt-id, en slug eller en produkt-URL." };
  }

  try {
    let wixProductId: string;
    if (target.kind === "id") {
      wixProductId = target.id;
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
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    if (/fetch failed|ENOTFOUND|ECONNRESET|timed? ?out|network/i.test(message)) {
      return { ok: false, error: "Kunde inte nå Wix. Prova igen om en stund." };
    }
    return { ok: false, error: message };
  }
}
