// Tullunions-grinden i extension/popup.js.
//
// Leonards rapport 2026-08-21 (SucceBuy-klädstället 1005005972133031): sex
// storlekar i sju lager gav fyrtio rader att läsa igenom, och tilläggets
// "EU-först" bockade i GB-raderna åt honom — Storbritannien ligger i
// snabb-leverans-listan men utanför tullunionen.
//
// Testet läser den RIKTIGA källkoden och kör funktionerna. popup.js är ett
// browser-skript utan exporter, så de plockas ut med regex och körs med
// new Function med FP_EU stubbat.

import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const POPUP = readFileSync(join(process.cwd(), "extension/popup.js"), "utf8");
const EU_JS = readFileSync(join(process.cwd(), "extension/eu-countries.js"), "utf8");

/** Plockar ut koderna ur EU_TULL_CODES-setet i eu-countries.js. */
function tullKoder(): Set<string> {
  const m = EU_JS.match(/const EU_TULL_CODES = new Set\(\[([\s\S]*?)\]\)/);
  if (!m) throw new Error("EU_TULL_CODES hittades inte");
  return new Set([...m[1].matchAll(/"([A-Z]{2})"/g)].map((x) => x[1]));
}

/** Snabb-leverans-listan ligger som en array av [kod, namn, flagga]-tripplar. */
function snabbKoder(): Set<string> {
  const m = EU_JS.match(/const COUNTRIES = \[([\s\S]*?)\n {2}\];/);
  if (!m) throw new Error("COUNTRIES hittades inte");
  return new Set([...m[1].matchAll(/\[\s*"([A-Z]{2})"/g)].map((x) => x[1]));
}

interface Variant {
  options?: Record<string, string>;
  shipFrom?: string;
  included?: boolean;
  costUsd?: number;
}

/** Bygger en körbar miljö med popup.js:s tullunionsfunktioner. */
function grind() {
  const bitar = [
    /function harTullunionslager\(variants\) \{[\s\S]*?\n\}/,
    /function fårKöpasIn\(v, finnsTull\) \{[\s\S]*?\n\}/,
    /function variantShipCode\([\s\S]*?\n\}/,
  ].map((re) => {
    const m = POPUP.match(re);
    if (!m) throw new Error(`hittade inte ${re}`);
    return m[0];
  });

  // variantShipCode läser SHIP_AXIS_EDIT_RE och globalThis.FP_EU — ta med båda
  // ur den riktiga källan i stället för att återskapa dem här.
  const shipRe = POPUP.match(/const SHIP_AXIS_EDIT_RE = .*;/);
  if (!shipRe) throw new Error("SHIP_AXIS_EDIT_RE hittades inte");

  const src = `
    globalThis.FP_EU = FP_EU;
    const EU_WAREHOUSE_CODES = FP_EU.EU_CODES;
    const EU_TULL_CODES = FP_EU.EU_TULL_CODES;
    ${shipRe[0]}
    ${bitar.join("\n")}
    return { harTullunionslager, fårKöpasIn, variantShipCode };
  `;
  // eslint-disable-next-line no-new-func
  return new Function("FP_EU", src)({
    EU_CODES: snabbKoder(),
    EU_TULL_CODES: tullKoder(),
    NAME_TO_ISO: {
      "UNITED KINGDOM": "GB",
      SPAIN: "ES",
      POLAND: "PL",
      CHINA: "CN",
      NORWAY: "NO",
      "UNITED STATES": "US",
    },
  }) as {
    harTullunionslager: (v: Variant[]) => boolean;
    fårKöpasIn: (v: Variant, finnsTull: boolean) => boolean;
    variantShipCode: (v: Variant) => string;
  };
}

const v = (land: string): Variant => ({
  options: { Size: "M", "Ships From": land },
  included: true,
  costUsd: 29.99,
});

describe("tullunions-grinden i popup.js", () => {
  const g = grind();

  it("GB räknas INTE som tullunion", () => {
    expect(g.harTullunionslager([v("United Kingdom")])).toBe(false);
  });

  it("Norge räknas inte heller", () => {
    expect(g.harTullunionslager([v("Norway")])).toBe(false);
  });

  it("Spanien och Polen gör det", () => {
    expect(g.harTullunionslager([v("spain")])).toBe(true);
    expect(g.harTullunionslager([v("Poland")])).toBe(true);
  });

  // KÄRNAN: finns ett tullunionslager ska GB-raden bort.
  it("GB stängs ute när ett tullunionslager finns", () => {
    const rader = [v("United Kingdom"), v("spain"), v("United States")];
    const finnsTull = g.harTullunionslager(rader);
    expect(finnsTull).toBe(true);
    expect(g.fårKöpasIn(rader[0], finnsTull)).toBe(false); // GB
    expect(g.fårKöpasIn(rader[1], finnsTull)).toBe(true); // ES
    expect(g.fårKöpasIn(rader[2], finnsTull)).toBe(false); // US
  });

  // BRASKLAPPEN: utan den blev varenda Kina-produkt oimporterbar, och de är
  // de allra flesta i katalogen.
  it("utan tullunionslager släpps allt igenom — annars går inget att importera", () => {
    const rader = [v("China"), v("United Kingdom")];
    const finnsTull = g.harTullunionslager(rader);
    expect(finnsTull).toBe(false);
    expect(g.fårKöpasIn(rader[0], finnsTull)).toBe(true);
    expect(g.fårKöpasIn(rader[1], finnsTull)).toBe(true);
  });

  it("tom produkt kraschar inte", () => {
    expect(g.harTullunionslager([])).toBe(false);
    expect(g.harTullunionslager(undefined as unknown as Variant[])).toBe(false);
  });
});

describe("inkopplingen i popup.js", () => {
  // Dold rad som fortsätter följa med i importen vore en tyst bugg — värre än
  // att visa den. Dölj och avbocka måste sitta ihop.
  it("dolda rader bockas också av", () => {
    const block = POPUP.slice(POPUP.indexOf("$variants.innerHTML"));
    const fönster = block.slice(0, block.indexOf("renderNameEdit"));
    expect(fönster).toMatch(/if \(!fårKöpasIn\(v, finnsTull\)\)/);
    expect(fönster).toMatch(/product\.variants\[i\]\.included = false/);
  });

  it("användaren får veta vad som dolts", () => {
    expect(POPUP).toMatch(/variant-hidden-note/);
    expect(POPUP).toMatch(/utanför EU:s\s*\n?\s*[""]?\s*\+?\s*"?tullunion/);
  });

  // Badgarna ska INTE ha bytt lista — GB levererar fortfarande snabbt, det är
  // inköpet som är problemet. Byter någon ut den här raden mot EU_TULL_CODES
  // börjar brittiska lager visas som "Kina" i listan.
  it("badgen använder fortfarande snabb-leverans-listan", () => {
    const badge = POPUP.slice(POPUP.indexOf("function badgeForShipFrom"));
    expect(badge.slice(0, badge.indexOf("function summarizeShipsFrom"))).toMatch(
      /EU_WAREHOUSE_CODES\.has\(up\)/,
    );
  });
});
