// ☠️ En drift-kollektion nås BARA genom sin ägare.
//
// VARFÖR DET HÄR TESTET FINNS. `/api/tracking-events` hade en egen
// fetch-helper mot `POST /wix-data/v2/items/query` med
// `dataCollectionId: FyndplatsTasks`. Steg 6 i POSTGRES-MIGRATION.md tömde den
// kollektionen 2026-09-01, och rutten svarade från den sekunden 404 "Okänt
// spårningsnummer" för VARJE kund som öppnade sin spårningssida. Uppmätt i
// drift samma dag på en riktig order.
//
// Kodauditen efter raderingen missade den, och det är själva lärdomen: auditen
// letade efter LÄSARE SOM GÅR SÖNDER. Den här läsaren gick inte sönder — den
// blev tom. Ett tomt svar från rätt API på rätt kollektion ser i källkoden
// exakt ut som ett friskt anrop. Ögon räcker inte; det behövs en grind.
//
// Samma form som `backend.test.ts` (STORE_BACKEND har exakt en läsare) och av
// samma skäl som `SHIP_AXIS_RE` och `EU_TULL_CODES` har varsitt tvillingtest:
// huset går sönder när samma sanning bor på två ställen.
//
// Efter flytten tillbaka till Wix (2026-10-29) och Postgres-vägens borttagning
// (2026-11-05) är kollektionerna inte tomma längre, men regeln står kvar: en
// läsare vid sidan av ägaren byter inte lager, format eller markörregler när
// ägaren gör det. Listan nedan stod förut i lib/db/tabeller.ts (Postgres-kartan).

import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { join } from "node:path";

const ROT = join(__dirname, "..", "..");

/**
 * Modulerna som ÄGER varsin drift-kollektion och därför måste kunna nämna
 * den. De väljer lager via `lib/store/backend.ts` (Wix, eller minnet i test).
 */
const ÄGARE = [
  "lib/store/wix-data.ts",
  "lib/store/product-hashes.ts",
  "lib/store/import-costs.ts",
  "lib/sync/sync-log.ts",
  "lib/llm/storage.ts",
  // Recensionerna och auktionerna. Butiken läser båda via motorns rutter
  // (/api/reviews/*, /api/auctions/*), aldrig kollektionerna direkt.
  "lib/store/reviews.ts",
  "lib/auction/store.ts",
];

/**
 * Filer som får nämna en drift-kollektion ändå, var och en med sitt skäl.
 *
 *   - Rutten som skapar kollektionerna rör scheman, aldrig rader.
 *   - `tools/polish-kedja/hamta_vevor.js` är ingen modul utan en MALL för ett
 *     ExecuteWixAPI-anrop i poleringschatten (steg 2 i VEVOR-poleringen). Den
 *     körs i Wix egen sandlåda, där getStore() inte finns, och den läser bara
 *     (`hasMutations: false`). Byter ägaren lager eller format måste mallen
 *     skrivas om för hand — därför står den här med namn, inte som en katalog.
 */
const UNDANTAG = [
  "app/api/admin/ensure-collections/route.ts",
  "tools/polish-kedja/hamta_vevor.js",
];

// ☠️ scripts/ VAR UNDANTAGET, och undantaget dolde tre filer i tre dygn.
//
// Uppmätt 2026-09-03 inför recensionsraderingen: backfill-product-hashes.ts och
// backfill-suppliers.mjs läste FyndplatsMappings — TOM sedan raderingen
// 2026-09-01 — och rapporterade därför "inget att backfilla" utan ett enda fel.
// katalogkoll.mjs läste FyndplatsImportedReviews, och dess --apply hade köat en
// AE-hämtning för HELA katalogen så fort den kollektionen tömdes.
//
// Ett script är inte mindre farligt än en rutt; det är farligare, för det körs
// av en människa som tror på siffran den skriver ut.
function källfiler(): string[] {
  const ut = execFileSync(
    "git",
    ["ls-files", "*.ts", "*.tsx", "*.js", "*.mjs"],
    { cwd: ROT, encoding: "utf8", maxBuffer: 32 * 1024 * 1024 },
  );
  return ut
    .split("\n")
    .filter(Boolean)
    .filter((f) => !f.endsWith(".test.ts") && !f.endsWith(".test.tsx"))
    .filter((f) => !ÄGARE.includes(f) && !UNDANTAG.includes(f));
}

/** Drift-kollektionerna och deras miljönamn (WIX_DATA_COL_…), där det finns ett. */
const KOLLEKTIONER: [string, string | null][] = [
  ["FyndplatsMappings", "WIX_DATA_COL_MAPPINGS"],
  ["FyndplatsTasks", "WIX_DATA_COL_TASKS"],
  ["FyndplatsWebhookEvents", "WIX_DATA_COL_WEBHOOK_EVENTS"],
  ["FyndplatsAudit", "WIX_DATA_COL_AUDIT"],
  ["FyndplatsAliExpressSyncLog", "WIX_DATA_COL_SYNC_LOG"],
  ["FyndplatsAliExpressSyncState", "WIX_DATA_COL_SYNC_STATE"],
  ["FyndplatsAliExpressSyncAlerts", "WIX_DATA_COL_SYNC_ALERTS"],
  ["FyndplatsProductHashes", "WIX_DATA_COL_PRODUCT_HASHES"],
  ["FyndplatsImportCosts", "WIX_DATA_COL_IMPORT_COSTS"],
  ["FyndplatsImportedReviews", "WIX_DATA_COL_REVIEWS"],
  ["FyndplatsAuctions", "WIX_DATA_COL_AUCTIONS"],
  ["FyndplatsClaudeCache", null],
  ["FyndplatsAnthropicSpend", null],
  ["FyndplatsLlmStats", null],
  ["FyndplatsVariantTranslations", null],
];
const FLYTTADE = KOLLEKTIONER.map(([k]) => k);

/** Ett Wix Data-anrop, oavsett vilken hjälpare som byggde adressen. */
const WIX_DATA_ANROP = /wix-data\/v2\/(items|bulk)|dataCollectionId/;

describe("☠️ ingen kod utanför ägaren talar Wix Data om en drift-kollektion", () => {
  it("listan över kollektionerna är inte tom (annars mäter testet ingenting)", () => {
    expect(FLYTTADE.length).toBeGreaterThan(5);
    expect(FLYTTADE).toContain("FyndplatsTasks");
    expect(FLYTTADE).toContain("FyndplatsMappings");
  });

  it("ingen fil nämner både ett Wix Data-anrop och en flyttad kollektion", () => {
    const brott: string[] = [];

    for (const fil of källfiler()) {
      let källa: string;
      try {
        källa = readFileSync(join(ROT, fil), "utf8");
      } catch {
        continue; // borttagen i arbetskopian
      }
      // Kommentarer får beskriva historien — annars går det inte att
      // dokumentera varför regeln finns. Bara KOD räknas.
      const kod = källa
        .replace(/\/\*[\s\S]*?\*\//g, "")
        .split("\n")
        .filter((rad) => !/^\s*(\/\/|\*)/.test(rad))
        .join("\n");

      if (!WIX_DATA_ANROP.test(kod)) continue;

      const nämnda = FLYTTADE.filter(
        (k) => kod.includes(k) || kod.includes(kollektionsEnvFör(k)),
      );
      if (nämnda.length > 0) brott.push(`${fil} → ${nämnda.join(", ")}`);
    }

    expect(
      brott,
      "Kollektionen har en ägare — ett eget anrop dit följer inte med när ägaren "
        + "byter format eller lager. Gå via lib/store/factory.ts (getStore()) eller "
        + "ägarmodulen i stället.\n" + brott.join("\n"),
    ).toEqual([]);
  });
});

/** `FyndplatsTasks` → `WIX_DATA_COL_TASKS`: fångar den som läser env-namnet. */
function kollektionsEnvFör(kollektion: string): string {
  const env = KOLLEKTIONER.find(([k]) => k === kollektion)?.[1];
  return env ?? `__saknas_${kollektion}`;
}
