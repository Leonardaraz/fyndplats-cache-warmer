// Admin: Prissättningsregler.
//
// Leonard konfigurerar standardmultiplikator, fast påslag, per-kategori-regler,
// intervall-baserad prissättning och avrundning. Sparas i Wix Data-kollektionen
// FyndplatsPricingConfig och läses i import-pipelinen vid varje import.

import Link from "next/link";
import { getPricingRules } from "@/lib/store/pricing-config";
import { getStore } from "@/lib/store/factory";
import { getCollections } from "@/lib/wix/client";
import { DEFAULT_CATEGORY_MULTIPLIERS } from "@/lib/config";
import { PricingEditor, type PricingSample } from "./editor-client";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

export default async function PricingPage() {
  const rules = await getPricingRules();

  // Kategorinamn för tabellen: defaults ∪ ev. Wix-kollektioner ∪ redan sparade.
  let collectionNames: string[] = [];
  try {
    collectionNames = (await getCollections()).map((c) => c.name);
  } catch {
    collectionNames = [];
  }
  const categoryNames = Array.from(
    new Set([
      ...Object.keys(DEFAULT_CATEGORY_MULTIPLIERS),
      ...collectionNames,
      ...Object.keys(rules.categoryMultipliers),
    ]),
  ).sort((a, b) => a.localeCompare(b, "sv"));

  // Förhandsgransknings-urval: upp till 5 redan importerade produkter med känd
  // inköpskostnad. Klienten räknar live om priset med de (ev. osparade) reglerna.
  let samples: PricingSample[] = [];
  try {
    const mappings = await getStore().listMappings();
    samples = mappings
      .map((m): PricingSample | null => {
        const v = m.variants?.find((x) => (x.costUsd ?? 0) > 0) ?? m.variants?.[0];
        if (!v || !(v.costUsd > 0)) return null;
        return {
          name: m.seoTitle || m.wixProductId,
          costUsd: v.costUsd,
          category: m.categorySuggestion?.collectionName ?? null,
          currentGrossSek: v.grossSek ?? null,
        };
      })
      .filter((s): s is PricingSample => s !== null)
      .slice(0, 5);
  } catch {
    samples = [];
  }

  return (
    <main style={{ maxWidth: 900, margin: "20px auto", padding: "0 16px" }}>
      <p style={{ fontSize: 13 }}>
        <Link href="/admin">← Tillbaka till admin</Link>
      </p>
      <h1>Prissättningsregler</h1>
      <p style={{ fontSize: 14, color: "#444" }}>
        Styr hur säljpriset räknas fram vid varje import. Inköpspriset (USD) →
        landad kostnad (SEK) → multiplikator + ev. fast påslag → avrundning. Multiplikatorn ger slutpriset direkt — ingen moms läggs på ovanpå (inköpspriset är redan inkl. moms).
        Sparas i <code>FyndplatsPricingConfig</code> och gäller från nästa import.
      </p>

      <PricingEditor rules={rules} categoryNames={categoryNames} samples={samples} />
    </main>
  );
}
