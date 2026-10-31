// Importens beroenden i drift: Wix-lagret, mappningarna, pipelinen,
// prisunderlaget och larmet. Allt annat i lib/vevor/import.ts är rent.

import { innehallsnycklar } from "./bildinnehall";
import { vevorKundbild } from "./recensionsfoton";
import type { FeatureFlags, PricingRules } from "@/lib/import/types";
import { importProduct } from "@/lib/import/pipeline";
import { importReviewsForProduct } from "@/lib/import/review-import";
import { getStore } from "@/lib/store/factory";
import { getPricingRules } from "@/lib/store/pricing-config";
import { getAppConfig } from "@/lib/store/app-config";
import { countProducts, headlessSiteId } from "@/lib/wix/media-audit";
import { tolkaRabatt } from "./pris";
import { larma } from "./drift";
import { WixVevorImportLager } from "./import-lager";
import type { ImportDeps } from "./import";
import { skapaWixAnrop } from "@/lib/polish/skrivplan-wix";
import { kopplaTillKategori, lasKategoritradet } from "@/lib/wix/kategoritrad";
import { byggUppslag, malNyckel, type Mal, type MalIdn } from "./kategorier";

/**
 * Rått läge, alltid: noll AI-anrop och `visible:false` ovillkorligt. Även
 * variantöversättningens AI är av: en familjs värden är VEVOR:s egen svenska
 * och skickas som manuella namn (lib/vevor/familj.ts), och en importkörning
 * ska kosta noll i credits.
 */
export const VEVOR_RAW_FLAGS: FeatureFlags = { qualityMode: "raw", enableAI: false, translateVariants: false };

/**
 * Prisreglerna läses först när körningen behöver dem: en avstängd eller
 * vilande körning var femte minut ska inte kosta en läsning i Wix.
 */
export function liveImportDeps(): ImportDeps {
  const store = getStore();
  const sajt = headlessSiteId();
  let regler: Promise<PricingRules> | null = null;
  const prisregler = () => (regler ??= getPricingRules());
  // Kategoriträdet läses en gång per körning, först när en produkt ska kopplas.
  // ☠️ Saknas något regelmål i Wix kopplas ingenting (lib/vevor/kategorier.ts).
  const wix = skapaWixAnrop();
  let uppslag: Promise<Map<string, MalIdn>> | null = null;
  const lasUppslag = () =>
    (uppslag ??= lasKategoritradet(wix).then((trad) => {
      const u = byggUppslag(trad);
      if (u.fel.length > 0) throw new Error(`kategoriträdet saknar regelmål: ${u.fel.slice(0, 3).join("; ")}`);
      return u.idn;
    }));
  const kopplaKategorier = async (wixProductId: string, mal: Mal): Promise<"ok" | "redan"> => {
    let idn: Map<string, MalIdn>;
    try {
      idn = await lasUppslag();
    } catch (e) {
      uppslag = null; // nästa produkt försöker igen
      throw e;
    }
    const ids = idn.get(malNyckel(mal));
    if (!ids) throw new Error(`okänt kategorimål: ${malNyckel(mal)}`);
    let allaRedan = true;
    for (const kategoriId of [ids.avdelning, ids.kategori]) {
      const u = (await kopplaTillKategori(wix, kategoriId, [wixProductId])).get(wixProductId);
      if (!u || typeof u === "object") throw new Error(`kopplingen föll: ${u && typeof u === "object" ? u.fel : "inget svar"}`);
      if (u === "ok") allaRedan = false;
    }
    return allaRedan ? "redan" : "ok";
  };
  return {
    lager: new WixVevorImportLager(),
    mappningarFor: (ids) => store.mappningarForLeverantorsId(ids),
    importera: async (p) => importProduct(p, await prisregler(), undefined, VEVOR_RAW_FLAGS),
    sparaMappning: (m) => store.saveMapping(m),
    // VEVOR har sagt ja till att vi använder recensionerna (Leonard
    // 2026-10-29). Raderna är dolda tills de översatts och godkänts i
    // /admin/reviews, som Aosoms.
    // Kundernas foton följer med (Leonard 2026-10-30), och läggs i Wix Media
    // med den bekräftade vägen i stället för Import File.
    sparaRecensioner: async (wixProductId, recensioner) =>
      (await importReviewsForProduct(wixProductId, recensioner, { source: "vevor", importImage: (u, id) => vevorKundbild(u, id) }))
        .imported,
    bildnycklar: (urls) => innehallsnycklar(urls),
    prisunderlag: async () => ({
      rabatt: tolkaRabatt((await getAppConfig()).vevorProRabatt),
      usdToSek: (await prisregler()).usdToSek,
    }),
    kopplaKategorier,
    antalProdukter: () => countProducts(sajt),
    larma,
  };
}
