// ☠️ En migrerad kollektion nås BARA genom storen.
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

import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { join } from "node:path";
import { ATT_KOPIERA, LLM_SAMLINGAR } from "@/lib/db/tabeller";

const ROT = join(__dirname, "..", "..");

/**
 * Modulerna som ÄGER varsin flyttad kollektion och därför måste kunna nämna
 * den. Alla fyra väljer backend via `lib/store/backend.ts`; det är dem hela
 * migreringen gick ut på att växla.
 */
const ÄGARE = [
  "lib/store/wix-data.ts",
  "lib/store/postgres.ts",
  "lib/store/product-hashes.ts",
  "lib/store/import-costs.ts",
  "lib/sync/sync-log.ts",
  "lib/llm/storage.ts",
  // ☠️ Recensionslagret ÄGER FyndplatsImportedReviews och måste behålla sin
  // Wix-väg, till skillnad från de övriga ägarna vars kollektioner redan är
  // tömda. Två skäl, och båda upphör först vid raderingen:
  //   1. Butiksrepot läser fortfarande kollektionen DIREKT (lib/reviews.ts och
  //      lib/review-aggregates.ts på grenen headless-site). Raderna finns
  //      alltså kvar och är inte tomma.
  //   2. Wix-vägen är kopieringens KÄLLA och tills vidare vägen tillbaka.
  // Filen är därför ägare, inte ett brott. När butiken följt med och raderingen
  // är gjord kan Wix-klassen tas bort helt — och då fäller det här testet om
  // någon lämnat kvar en läsare.
  "lib/store/reviews.ts",
  // Definitionslistan i sig, plus migreringens egna verktyg: de SKA tala med
  // Wix, det är hela deras uppgift.
  "lib/db/tabeller.ts",
  "lib/migration/radera-wix.ts",
  "lib/migration/copy-to-postgres.ts",
];

/** Rutter som skapar kollektionerna. De rör scheman, aldrig rader. */
const UNDANTAG = ["app/api/admin/ensure-collections/route.ts"];

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

/** Kollektionsnamnen som flyttat till Postgres och alltså är TOMMA i Wix. */
const FLYTTADE = [...ATT_KOPIERA.map((s) => s.kollektion), ...LLM_SAMLINGAR];

/** Ett Wix Data-anrop, oavsett vilken hjälpare som byggde adressen. */
const WIX_DATA_ANROP = /wix-data\/v2\/(items|bulk)|dataCollectionId/;

describe("☠️ ingen kod utanför storen talar Wix Data om en flyttad kollektion", () => {
  it("listan över flyttade kollektioner är inte tom (annars mäter testet ingenting)", () => {
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
      "Kollektionen är TOM i Wix sedan migreringen — ett anrop dit svarar 200 med "
        + "noll rader, alltså tyst fel. Gå via lib/store/factory.ts (getStore()) i "
        + "stället.\n" + brott.join("\n"),
    ).toEqual([]);
  });
});

/** `FyndplatsTasks` → `WIX_DATA_COL_TASKS`: fångar den som läser env-namnet. */
function kollektionsEnvFör(kollektion: string): string {
  const spec = ATT_KOPIERA.find((s) => s.kollektion === kollektion);
  return spec ? `WIX_DATA_COL_${spec.tabell.toUpperCase()}` : `__saknas_${kollektion}`;
}
