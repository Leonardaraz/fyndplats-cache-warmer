import { describe, expect, it } from "vitest";
import { KOLLEKTIONER } from "./wix-kollektioner";

/** Drift-kollektionerna som kom tillbaka från Neon 2026-10-29 (förut ur
 *  migreringens tabellista, borttagen med Postgres-vägen 2026-11-05). */
const DRIFTENS = [
  "FyndplatsMappings", "FyndplatsTasks", "FyndplatsWebhookEvents", "FyndplatsAudit",
  "FyndplatsAliExpressSyncLog", "FyndplatsAliExpressSyncState", "FyndplatsAliExpressSyncAlerts",
  "FyndplatsProductHashes", "FyndplatsImportCosts", "FyndplatsImportedReviews", "FyndplatsAuctions",
  "FyndplatsClaudeCache", "FyndplatsAnthropicSpend", "FyndplatsLlmStats", "FyndplatsVariantTranslations",
];

describe("motorns kollektioner i Wix", () => {
  it("☠️ varje drift-kollektion står i listan — annars förbereds den inte", () => {
    const kanda = new Set(KOLLEKTIONER.map((k) => k.id));
    for (const k of DRIFTENS) expect(kanda.has(k), k).toBe(true);
    expect(kanda.has("FyndplatsAliExpressTokens")).toBe(true);
  });

  it("Wix tar högst 3 vanliga index per kollektion, med högst 3 fält var", () => {
    for (const k of KOLLEKTIONER) {
      expect(k.index.length, k.id).toBeLessThanOrEqual(3);
      for (const i of k.index) expect(i.falt.length, `${k.id}/${i.namn}`).toBeLessThanOrEqual(3);
    }
  });
});
