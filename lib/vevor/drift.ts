// Läsarens beroenden i drift: Wix-lagret, larmet och prioriteringens underlag.
// Allt annat i lib/vevor är rent eller tar sina beroenden som argument.

import { escapeHtml } from "@/lib/email/html";
import { sendEmail } from "@/lib/email/resend";
import { queryAuctions } from "@/lib/auction/store";
import { getStore } from "@/lib/store/factory";
import { vevorSkuOf } from "@/lib/store/supplier";
import { VEVOR_ID_PREFIX } from "@/lib/store/leverantorsprefix";
import { artiklarPaRaden } from "@/lib/aosom/artiklar";
import { WixVevorLager } from "./lager";
import type { LasarDeps } from "./lasare";
import type { Prioritetsunderlag, VevorProdukt } from "./prioritet";

/**
 * VEVOR-produkterna i butiken, deras obeställda ordrar och levande auktioner.
 * Innan steg 4 har importerat något finns inga VEVOR-mappningar, och då läses
 * varken ordrar eller auktioner.
 */
export async function lasPrioritetsunderlag(): Promise<Prioritetsunderlag> {
  const store = getStore();
  const produkter: VevorProdukt[] = [];
  // Bara raderna med VEVOR:s prefix (steg 5). Efter importen är katalogen
  // runt 22 000 rader, och prioriteringen går en gång i timmen inne i
  // läsarens körning, med läsarens tidsbudget.
  for (const m of await store.listMappingsMedPrefix(VEVOR_ID_PREFIX)) {
    if (!vevorSkuOf(m)) continue;
    // Varje artikel på raden: på en familj (steg 8) har varje variant sin
    // egen sida, och synken behöver en färsk avläsning av var och en.
    for (const sku of artiklarPaRaden(m, VEVOR_ID_PREFIX)) {
      produkter.push({ wixProductId: m.wixProductId, sku, publicerad: m.draftStatus === "published" });
    }
  }
  if (produkter.length === 0) return { produkter, obestallda: new Set(), iAuktion: new Set() };
  const [tasks, live] = await Promise.all([store.listTasks("pending"), queryAuctions(["live"])]);
  return {
    produkter,
    obestallda: new Set(tasks.map((t) => t.wixCatalogItemId).filter((id): id is string => !!id)),
    iAuktion: new Set(live.map((a) => a.productId)),
  };
}

/** Larmet går till OPS_ALERT_EMAIL. Saknas adressen syns det i loggen, och läsaren fortsätter. */
export async function larma(amne: string, text: string): Promise<void> {
  const till = process.env.OPS_ALERT_EMAIL?.trim();
  if (!till) {
    console.error(`[vevor-lasare] OPS_ALERT_EMAIL saknas, larmet gick inte: ${amne}`);
    return;
  }
  await sendEmail({
    to: till,
    subject: amne,
    bodyHtml: text
      .split("\n\n")
      .map((stycke) => `<p>${escapeHtml(stycke).replace(/\n/g, "<br>")}</p>`)
      .join(""),
    bodyText: text,
  });
}

export function liveDeps(): LasarDeps {
  return { lager: new WixVevorLager(), prioritetsunderlag: lasPrioritetsunderlag, larma };
}
