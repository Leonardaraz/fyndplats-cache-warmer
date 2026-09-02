// ☠️ jq tillåter INTE åäö i naken fältåtkomst.
//
// VARFÖR DET HÄR TESTET FINNS. `polish-mapping.yml` läste svaret med
// `jq -r '.okändaVariantIds | length'`. Det är inte ett tomt svar — det är ett
// SYNTAXFEL: jq:s grammatik tillåter bara `[A-Za-z_][A-Za-z0-9_]*` efter
// punkten, så `ä` avbryter tolkningen med
//
//   jq: error: syntax error, unexpected INVALID_CHARACTER … at <top-level>
//
// Raden låg EFTER skrivningen, så varje `stampla`-körning gjorde sitt jobb,
// skrev mappningen, och dog sedan på rapporteringen. GitHub mejlade "Run
// failed" för sexton lyckade körningar på tolv timmar (2026-09-01).
//
// Det är samma familj som husets vanligaste bugg, men speglad: i stället för
// ett misslyckande ingen kan se, ett larm som alltid fyrar. Båda slutar med
// att mottagaren slutar läsa mejlen — och då är även det äkta larmet borta.
//
// Övriga svenska fältnamn i samma fil var korrekt citerade
// (`.["stämmer"]`, `.["fält"]`, `.["ändrat"]`), så det gick inte att se genom
// att läsa filen: nitton rader rätt och två fel ser likadana ut. Därför en
// grind i stället för ögon — samma skäl som `store-access-audit.test.ts` och
// `backend.test.ts`.
//
// Statisk kontroll, inte `jq -n`: en grind som hoppas över när binären saknas
// är ingen grind.

import { describe, expect, it } from "vitest";
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

const WORKFLOW_KATALOG = join(__dirname, "..", "..", ".github", "workflows");

/**
 * Naken fältåtkomst vars namn bär ett tecken utanför ASCII.
 *
 * Punkt, sedan ett giltigt STARTtecken, sedan en löpa av bokstäver/siffror där
 * `\p{L}` även fångar `å`, `ä`, `ö`. Går löpan utanför ASCII är programmet
 * ogiltigt. `.["namn"]` matchar aldrig — där följer `[` på punkten, och
 * hakparentes-åtkomst är just det korrekta sättet att skriva namnet.
 */
const NAKEN_FÄLTÅTKOMST = /\.([A-Za-z_][\p{L}\p{N}_]*)/gu;
const ICKE_ASCII = /[^\x00-\x7F]/;

export type Fynd = { rad: number; fält: string; text: string };

/**
 * Hittar jq-fältåtkomster som inte kan kompileras. Ren funktion — exporterad
 * så den kan testas mot både den historiska buggen och den lagade raden.
 *
 * Bara rader som faktiskt anropar `jq` granskas. Svensk prosa i kommentarer
 * (`.okända rader`) ska inte fälla ett test om jq-syntax.
 */
export function ogiltigaJqFält(källa: string): Fynd[] {
  const fynd: Fynd[] = [];

  källa.split("\n").forEach((rad, i) => {
    if (!/\bjq\b/.test(rad)) return;
    // Kommentarrader beskriver ofta buggen de skyddar mot — de kör ingenting.
    if (/^\s*#/.test(rad.trimStart())) return;

    for (const m of rad.matchAll(NAKEN_FÄLTÅTKOMST)) {
      if (ICKE_ASCII.test(m[1])) {
        fynd.push({ rad: i + 1, fält: m[1], text: rad.trim() });
      }
    }
  });

  return fynd;
}

describe("ogiltigaJqFält — detektorn själv", () => {
  it("☠️ fäller den historiska raden ur polish-mapping.yml", () => {
    const f = ogiltigaJqFält(`okanda=$(echo "$svar" | jq -r '.okändaVariantIds | length')`);
    expect(f).toHaveLength(1);
    expect(f[0].fält).toBe("okändaVariantIds");
  });

  it("☠️ släpper igenom den lagade raden — hakparentes är rätt form", () => {
    expect(ogiltigaJqFält(`jq -r '.["okändaVariantIds"] | length'`)).toEqual([]);
    expect(ogiltigaJqFält(`jq -r '.prisgrind.["stämmer"]'`)).toEqual([]);
    expect(ogiltigaJqFält(`jq -r '.["ändrat"] | join(", ")'`)).toEqual([]);
    // Escapad form inuti en dubbelciterad shell-sträng (review-translate.yml).
    expect(ogiltigaJqFält(`jq -r '.[\\"iKön\\"]' <<<"$body"`)).toEqual([]);
  });

  it("rena ASCII-fält är alltid giltiga", () => {
    expect(ogiltigaJqFält(`jq -r '.ok'`)).toEqual([]);
    expect(ogiltigaJqFält(`jq -r '.prisgrind.landedCostSek'`)).toEqual([]);
    expect(ogiltigaJqFält(`jq -r '.fel[]? | "\\(.taskId)"'`)).toEqual([]);
  });

  it("rader utan jq granskas inte — svensk prosa är inte ett jq-program", () => {
    expect(ogiltigaJqFält(`echo "se .okända rader i loggen"`)).toEqual([]);
    expect(ogiltigaJqFält(`          # Las .okändaVariantIds ur svaret`)).toEqual([]);
  });

  it("flera fel på samma rad rapporteras var för sig", () => {
    const f = ogiltigaJqFält(`jq -r '.förra + .nästa'`);
    expect(f.map((x) => x.fält)).toEqual(["förra", "nästa"]);
  });
});

describe("☠️ ingen workflow har ett jq-program som inte går att kompilera", () => {
  const filer = readdirSync(WORKFLOW_KATALOG).filter((f) => f.endsWith(".yml") || f.endsWith(".yaml"));

  it("det finns workflows att granska (annars mäter testet ingenting)", () => {
    expect(filer.length).toBeGreaterThan(5);
    expect(filer).toContain("polish-mapping.yml");
  });

  it.each(filer)("%s", (fil) => {
    const fynd = ogiltigaJqFält(readFileSync(join(WORKFLOW_KATALOG, fil), "utf8"));
    expect(
      fynd,
      `jq tillåter bara [A-Za-z_][A-Za-z0-9_]* i naken fältåtkomst. Skriv `
        + `.["namnet"] i stället — annars är det ett SYNTAXFEL, inte ett tomt svar.\n`
        + fynd.map((f) => `  ${fil}:${f.rad}  .${f.fält}\n    ${f.text}`).join("\n"),
    ).toEqual([]);
  });
});
