// Dry-run: läser sample-products.json, transformerar v1 → v3 och skriver
// ut den resulterande strukturen. Inga API-anrop. Inget skapas.
//
// Körs med:
//   node --experimental-strip-types migration/scripts/dry-run.ts
//   (eller pnpm migrate:dry när scripten är inlagd i package.json)

import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { transformProduct, type TransformContext, type V1Product } from "./transform.ts";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, "..");

interface CollectionsFile {
  total: number;
  collections: { legacyId: string; name: string; slug: string; visible: boolean }[];
}

interface SamplesFile {
  samples: V1Product[];
  totalProductsInSource?: number;
}

function loadJson<T>(file: string): T {
  return JSON.parse(readFileSync(path.join(ROOT, file), "utf8")) as T;
}

// Bygger en simulerad categoryMap: legacyId → "PENDING:<legacyId>". I skarp
// körning ersätts detta med riktiga v3-ID:n från CreateCategory-anropen.
function buildSimulatedCategoryMap(file: CollectionsFile): Record<string, string> {
  const map: Record<string, string> = {};
  for (const c of file.collections) {
    map[c.legacyId] = `PENDING:${c.slug}`;
  }
  return map;
}

function summarise(label: string, items: unknown[]): string {
  return `${label}: ${items.length}`;
}

function header(text: string): void {
  console.log("\n" + "═".repeat(72));
  console.log(text);
  console.log("═".repeat(72));
}

function main(): void {
  console.log("Fyndplats v1 → v3 — DRY RUN");
  console.log(`Working dir: ${ROOT}`);

  const collections = loadJson<CollectionsFile>("collections.json");
  const samples = loadJson<SamplesFile>("sample-products.json");

  console.log(`Kategorier i källan: ${collections.total}`);
  console.log(`Produkter i källan: ${samples.totalProductsInSource ?? "okänt"}`);
  console.log(`Antal sample-produkter att dry-run:a: ${samples.samples.length}`);

  const ctx: TransformContext = {
    imageMap: {}, // Tomt → behåller original-URL:er (bilder importeras i steg 2 vid skarp körning)
    categoryMap: buildSimulatedCategoryMap(collections),
  };

  for (const v1 of samples.samples) {
    header(`PRODUKT: ${v1.name}`);

    const { product, descriptionsToConvert, secondaryCategoryIds, initialStock } =
      transformProduct(v1, ctx);

    // Översikt
    console.log(summarise("infoSections", product.infoSections));
    console.log(summarise("variants", product.variantsInfo.variants));
    console.log(summarise("media-items", product.media?.itemsInfo.items ?? []));
    console.log(`mainCategoryId: ${product.mainCategoryId ?? "—"}`);
    console.log(`sekundära kategorier (Steg 8): ${secondaryCategoryIds.join(", ") || "—"}`);
    console.log(`Ricos-konverteringar att göra: ${descriptionsToConvert.length}`);
    console.log(`Lagersaldon att sätta (Steg 7): ${initialStock.length}`);

    // Full v3-struktur. Förkorta description-HTML i utskriften så loggen är läsbar.
    const printable = JSON.parse(JSON.stringify(product)) as Record<string, unknown>;
    if (typeof printable.plainDescription === "string" && printable.plainDescription.length > 220) {
      printable.plainDescription = printable.plainDescription.slice(0, 220) + " …[trunkerat]";
    }
    if (Array.isArray(printable.infoSections)) {
      printable.infoSections = (printable.infoSections as { plainDescription: string }[]).map((s) => ({
        ...s,
        plainDescription:
          typeof s.plainDescription === "string" && s.plainDescription.length > 140
            ? s.plainDescription.slice(0, 140) + " …[trunkerat]"
            : s.plainDescription,
      }));
    }

    header("Transformerad v3-produkt (Ricos description fylls i vid skarp körning)");
    console.log(JSON.stringify(printable, null, 2));

    header("Ricos-jobb att köra vid skarp körning");
    for (const job of descriptionsToConvert) {
      const preview = job.html.replace(/\s+/g, " ").slice(0, 90);
      console.log(`  • POST /ricos/v1/ricos-document/convert/to-ricos  →  ${job.path}`);
      console.log(`      HTML-preview: "${preview}…"`);
    }

    header("Lager (Steg 7)");
    for (const s of initialStock) {
      console.log(`  • SKU ${s.sku} = ${s.quantity}`);
    }
  }

  console.log("\nDry-run klar. Inget har skapats.");
}

main();
