// ☠️ INKÖPSPRISER FÅR INTE SKRIVAS TILL EN GITHUB ACTIONS-LOGG.
//
// Repot är PUBLIKT, och Actions-loggar på ett publikt repo går att läsa utan
// inloggning. Allt en workflow `echo`:ar är därmed publicerat.
//
// Uppmätt 2026-09-07 i körning 34 av `aosom-feed-search.yml`, ordagrant ur en
// publik logg:
//
//   83A-358V00DR  747.72 kr landat (inkl. moms)  saldo 130  frakt 44%
//
// Det är Aosoms artikelnummer, vårt exakta inköpspris, vårt saldo och
// fraktandelen — som dessutom låter en läsare räkna ut grossistpris och frakt
// var för sig. Åtta sådana rader i EN körning, 34 körningar totalt.
//
// Det är ordagrant det CLAUDE.md säger att den hemliga feed-adressen skyddar:
// "en inbakad adress är detsamma som att publicera vad vi betalar för varje
// vara — för de svenska återförsäljare vi konkurrerar med om exakt samma
// artikelnummer". Adressen var skyddad. Utskriften var det inte.
//
// Värst var `polish-mapping.yml`, som skrev `jq '.mappning'` — HELA
// mappningsraden, alltså `supplierProductId` (artikelnumret) tillsammans med
// `costUsd`, `landedCostSek`, `aosomFreightShare` och `sourceUrl`. 1 689
// körningar.
//
// ⚠️ Kundpriser (`grossSek`, `prisSek`, `faktisktSek`) är INTE hemliga — de
// står på vår egen sajt. Det är inköpsledet som är det.
//
// Grinden finns för att regeln annars glider: den är lätt att komma ihåg när
// man just läst det här, och omöjlig att komma ihåg om ett halvår. Samma skäl
// som `SHIP_AXIS_RE`, `EU_TULL_CODES` och `store-access-audit.test.ts`.

import { describe, expect, it } from "vitest";
import { readFileSync, readdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const ROT = join(dirname(fileURLToPath(import.meta.url)), "..", "..");
const WORKFLOWS = join(ROT, ".github", "workflows");

/** Fält som avslöjar vad vi BETALAR — aldrig vad kunden betalar. */
const KOSTNADSFALT = [
  "landatSek",
  "landedCostSek",
  "LandadSek",
  "costUsd",
  "fraktandel",
  "MarginalPct",
  "nyMarginalPct",
  "Wholesale",
  "grossist",
];

/**
 * En hel mappningsrad dumpad utan projektion. `.mappning` bär
 * supplierProductId + costUsd + landedCostSek; en `{...}`-projektion efter
 * den är det som gör utskriften säker.
 */
const HELRADSDUMP = /jq\s+(-r\s+)?'?\.mappning'?(?!\s*\|)/;

function workflowFiler(): string[] {
  return readdirSync(WORKFLOWS).filter((n) => n.endsWith(".yml") || n.endsWith(".yaml"));
}

/** Rader utanför en `if [ "${VISA_...}" = "true" ]`-grind. */
function oskyddadeRader(text: string): Array<{ rad: number; innehall: string }> {
  const ut: Array<{ rad: number; innehall: string }> = [];
  let djupIGrind = 0; // > 0 = vi står inuti en VISA_-guard
  let ifDjup = 0;

  text.split("\n").forEach((rå, i) => {
    const rad = rå.replace(/#.*$/, ""); // kommentarer är inte utskrifter
    const trimmad = rad.trim();

    if (djupIGrind > 0) {
      if (/^if\b/.test(trimmad)) ifDjup += 1;
      if (/^fi\b/.test(trimmad)) {
        if (ifDjup > 0) ifDjup -= 1;
        else djupIGrind = 0;
        return;
      }
      // ☠️ ELSE-GRENEN ÄR INTE SKYDDAD. Första versionen av den här parsern
      // släppte allt mellan `if` och `fi`, alltså även `else`-grenen — som är
      // precis den gren som körs när flaggan är AV. Verifierad genom att
      // återinföra `landatSek` i else-grenen i aosom-feed-search.yml: grinden
      // gick grön. Samma klass som runda G:s döda `(?!)` — en grind som ser
      // komplett ut och inte kontrollerar det som räknas.
      if (/^(else|elif)\b/.test(trimmad) && ifDjup === 0) {
        djupIGrind = 0;
        return;
      }
      return; // inuti grindens THEN-gren är allt tillåtet
    }

    if (/^if\s+\[\s*"\$\{VISA_[A-Z_]+\}"\s*=\s*"true"\s*\]/.test(trimmad)) {
      djupIGrind = 1;
      ifDjup = 0;
      return;
    }

    if (!/echo|jq/.test(rad)) return;
    if (KOSTNADSFALT.some((f) => rad.includes(f)) || HELRADSDUMP.test(rad)) {
      ut.push({ rad: i + 1, innehall: trimmad.slice(0, 120) });
    }
  });
  return ut;
}

describe("inköpspriser når aldrig en publik Actions-logg", () => {
  it.each(workflowFiler())("%s", (fil) => {
    const fynd = oskyddadeRader(readFileSync(join(WORKFLOWS, fil), "utf-8"));
    expect(
      fynd,
      `Actions-loggar på ett PUBLIKT repo går att läsa utan inloggning.\n` +
        `Följande rader i .github/workflows/${fil} skriver inköpsled till loggen ` +
        `utan att ligga bakom en "if [ \"\${VISA_...}\" = \"true\" ]"-grind:\n` +
        fynd.map((f) => `  rad ${f.rad}: ${f.innehall}`).join("\n") +
        `\n\nKundpriser (grossSek, prisSek, faktisktSek) är OK — de står på sajten.`,
    ).toEqual([]);
  });
});
