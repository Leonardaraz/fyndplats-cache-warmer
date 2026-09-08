// ☠️ VARFÖR DET HÄR TESTET FINNS.
//
// Bulkorder-CSV:n bär kundens namn, gatuadress, postnummer, ort och telefon
// plus Aosoms artikelnummer. Repot är publikt och Actions-loggar går att läsa
// utan inloggning, så allt workflowen skriver ut är publicerat.
//
// Två försök i rad läckte ändå:
//   1. `cat aosom-bulkorder.csv` — hela filen, rakt ut.
//   2. `awk -F'","'` — ett antagande om att varje fält är citerat. `falt()`
//      citerar BARA värden med `"`, `,` eller `;`, så en order med ETT
//      artikelnummer och ett namn utan komma är helt ociterad: awk hittar
//      ingen avgränsare, och `$NF` blir hela raden. Uppmätt: namn, adress,
//      postnummer, ort och telefon skrevs ut på varje rad.
//
// Båda gick igenom för att en rad i en YAML-fil inte går att testa. Nu ligger
// sammanfattningen i ett skript, och testet kör DET mot riktig byggCsv-utdata.

import { describe, expect, it } from "vitest";
import { execFileSync } from "node:child_process";
import { mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { byggCsv, CSV_KOLUMNER } from "./bulk-order";

const SKRIPT = join(process.cwd(), "tools/aosom/csv-sammanfattning.py");

const KUND = {
  fullName: "Anna Andersson",
  addressLine1: "Storgatan 4",
  addressLine2: "",
  postalCode: "11122",
  city: "Stockholm",
  province: "",
  country: "SE",
  phone: "0701234567",
};

function kor(csv: string): string {
  const dir = mkdtempSync(join(tmpdir(), "aosom-csv-"));
  const fil = join(dir, "bulk.csv");
  writeFileSync(fil, csv, "utf8");
  return execFileSync("python3", [SKRIPT, fil], { encoding: "utf8" });
}

// Två radformer, och det är SKILLNADEN mellan dem som fällde awk:en.
const BATCH = {
  rader: [
    // EN artikel + namn utan komma → INGENTING citeras på raden.
    { orderNumber: "10032", skus: ["000-000V00XX"], antal: [1], adress: KUND },
    // FLERA artiklar → kolumn A och B citeras, resten inte.
    {
      orderNumber: "10033",
      skus: ["000-000V00XX", "111-111V11YY", "222-222V22ZZ"],
      antal: [1, 2, 1],
      adress: { ...KUND, fullName: "Bo Berg", addressLine1: "Lillgatan 9", phone: "0709876543" },
    },
  ],
  enheter: 5,
  unikaSkus: 3,
} as unknown as Parameters<typeof byggCsv>[0];

describe("csv-sammanfattning.py", () => {
  const ut = kor(byggCsv(BATCH));

  it("räknar artikelnummer rätt på BÅDA radformerna", () => {
    // Den ociterade raden är den awk:en tog för en enda kolumn.
    expect(ut).toMatch(/rad 1: 1 artikelnummer, referens 10032/);
    expect(ut).toMatch(/rad 2: 3 artikelnummer, referens 10033/);
  });

  it("☠️ skriver ALDRIG ut en kunduppgift", () => {
    for (const hemligt of [
      "Anna Andersson", "Bo Berg",
      "Storgatan 4", "Lillgatan 9",
      "11122", "Stockholm",
      "0701234567", "0709876543",
    ]) {
      expect(ut).not.toContain(hemligt);
    }
  });

  it("☠️ skriver ALDRIG ut ett artikelnummer", () => {
    // Numret är den sträng dealproffsen.se publicerar som sku/mpn.
    for (const sku of ["000-000V00XX", "111-111V11YY", "222-222V22ZZ"]) {
      expect(ut).not.toContain(sku);
    }
  });

  it("faller på en CSV som saknar en kolumn den behöver — gissar aldrig på position", () => {
    const utanRef = "SKUs,Quantities,Full name\n000-000V00XX,1,Anna Andersson\n";
    expect(() => kor(utanRef)).toThrow();
  });

  it("faller på en fil med rubrik men inga orderrader", () => {
    expect(() => kor(`${CSV_KOLUMNER.join(",")}\n`)).toThrow();
  });
});
