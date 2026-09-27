// ☠️ AOSOMS ARTIKELNUMMER FÅR INTE NÅ EN GITHUB ACTIONS-LOGG.
//
// Repot är PUBLIKT, och allt en workflow skriver ut är publicerat. Artikel-
// numret är den sträng som kopplar vår produktsida till Aosoms — och till
// dealproffsens, som publicerar den som `sku`/`mpn`. Samma skäl som gör
// feed-adressen hemlig (CLAUDE.md, "Feedens adress är en hemlighet").
//
// Uppmätt 2026-09-27, räknat lokalt utan att ett enda nummer skrevs ut:
//
//   aosom-sync          28 av 35 körningar   prisvarningar, "exempel-artikelnummer",
//                                            inputen i env-blocket, felets URL
//   aosom-import        29 av 29             tre nummer HÅRDKODADE i källan —
//                                            GitHub skriver ut källan i varje logg —
//                                            plus markören i varje varvsrad
//   aosom-feed-search   42 av 53             numret och Aosoms URL som standard;
//                                            29 av dem med inköpspriset bredvid
//   aosom-remap         43 av 57             inputen i env-blocket, före 2026-09-24
//
// 142 loggar. Loggarna är raderade; den här grinden hindrar nästa.
//
// Grinden kontrollerar KANALERNA, inte talen: en läcka i en logg har ingen
// form att grepa efter i förväg. Formerna här är de som faktiskt läckte.
// kostnad-i-logg.test.ts är tvillingen för inköpspriset.

import { describe, expect, it } from "vitest";
import { readFileSync, readdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const ROT = join(dirname(fileURLToPath(import.meta.url)), "..", "..");
const WORKFLOWS = join(ROT, ".github", "workflows");

/**
 * Husets tre former (gatelib.ARTNR) plus siffra-bokstav-siffra, som uppmättes
 * 2026-09-27 i en publik logg och som gatelib missar. Formen tre siffror–tre
 * siffror utan svans finns också som artikelnummer, men den går inte att
 * skilja från ett intervall ("800-834") på formen — den kanalen stängs av
 * reglerna nedan i stället.
 */
const ARTNR =
  /\b\d{2}[A-Z]-\d{3}(?!\d)[A-Z0-9]*\b|\b[A-Z]\d{2}-\d{3}(?!\d)[A-Z0-9]*\b|\b\d{3}-\d{3}(?!\d)[A-Z0-9]{2,}\b|\b\d[A-Z]\d-\d{3}(?!\d)[A-Z0-9]*\b/g;

/** jq-interpolation av ett fält som bär artikelnumret: `\(.sku)`, `map(.sku)`. */
const ARTIKELFALT = /\\\((?:[^()]|\([^()]*\))*\.(?:sku|artikel|artikelnummer|supplierProductId|aosomSku)\b|map\(\s*\.sku\s*\)/g;

/**
 * Inputs som bär ett artikelnummer. Varje sådan måste maskeras i ett EGET steg
 * före det steg som läser den: env-blocket skrivs ut innan skriptet kör, så en
 * `::add-mask::` inne i samma steg kommer för sent.
 */
const MASKERADE_INPUTS: Record<string, string[]> = {
  "aosom-sync.yml": ["sku"],
  "aosom-import.yml": ["after"],
  "aosom-remap.yml": ["sku"],
  "aosom-feed-search.yml": ["q"],
};


function workflowFiler(): string[] {
  return readdirSync(WORKFLOWS).filter((n) => n.endsWith(".yml") || n.endsWith(".yaml"));
}

function las(namn: string): string {
  return readFileSync(join(WORKFLOWS, namn), "utf8");
}

/** Kommentarer är inte utskrifter — men källan skrivs ut, så regel 1 läser dem. */
function utanKommentarer(text: string): string {
  return text
    .split("\n")
    .map((r) => (/^\s*#/.test(r) ? "" : r))
    .join("\n");
}

/**
 * `workflow_dispatch`-inputs och deras beskrivningar. Radbaserat, med flit:
 * repot har ingen YAML-parser, och en ny beroende för ett test är fel pris.
 * Husets filer har inputs på indrag 6 och deras nycklar på indrag 8.
 */
function inputs(text: string): Record<string, string> {
  const ut: Record<string, string> = {};
  let iInputs = false;
  let aktuell: string | null = null;
  for (const rad of text.split("\n")) {
    if (/^ {4}inputs:\s*$/.test(rad)) { iInputs = true; continue; }
    if (!iInputs) continue;
    if (/^ {0,4}\S/.test(rad)) break;
    const namn = /^ {6}([A-Za-z_][\w-]*):\s*$/.exec(rad);
    if (namn) { aktuell = namn[1]; ut[aktuell] = ""; continue; }
    const beskr = /^ {8}description:\s*"?(.*?)"?\s*$/.exec(rad);
    if (beskr && aktuell) ut[aktuell] = beskr[1];
  }
  return ut;
}

/** Stegen som råtext, i ordning. Ett steg börjar på `- ` på indrag 6. */
function steg(text: string): string[] {
  const ut: string[] = [];
  let iSteg = false;
  for (const rad of text.split("\n")) {
    if (/^ {4}steps:\s*$/.test(rad)) { iSteg = true; continue; }
    if (!iSteg) continue;
    if (/^ {6}- /.test(rad)) { ut.push(rad); continue; }
    if (ut.length) ut[ut.length - 1] += `\n${rad}`;
  }
  return ut;
}

describe("artikelnummer i Actions-loggen", () => {
  it("☠️ ingen workflow bär ett artikelnummer i sin källa — källan skrivs ut i varje körning", () => {
    const fynd: string[] = [];
    for (const f of workflowFiler()) {
      const n = (las(f).match(ARTNR) ?? []).length;
      if (n) fynd.push(`${f}: ${n}`);
    }
    expect(fynd).toEqual([]);
  });

  it("☠️ ingen workflow interpolerar ett artikelfält i en utskrift", () => {
    const fynd: string[] = [];
    for (const f of workflowFiler()) {
      for (const m of utanKommentarer(las(f)).match(ARTIKELFALT) ?? []) fynd.push(`${f}: ${m}`);
    }
    expect(fynd).toEqual([]);
  });

  it("☠️ ingen workflow skriver ut en anrops-URL — den bär `after` och `sku`", () => {
    const fynd: string[] = [];
    for (const f of workflowFiler()) {
      for (const m of utanKommentarer(las(f)).match(/echo[^\n]*\$\{?url\b/g) ?? []) fynd.push(`${f}: ${m}`);
    }
    expect(fynd).toEqual([]);
  });

  it("☠️ ingen markör i ett commitmeddelande — grenen är lika publik som loggen", () => {
    const fynd: string[] = [];
    for (const f of workflowFiler()) {
      const traff = utanKommentarer(las(f)).match(/git commit[^\n]*\$\{?(?:markor|cursor|after)\b/g) ?? [];
      for (const m of traff) fynd.push(`${f}: ${m}`);
    }
    expect(fynd).toEqual([]);
  });

  describe.each(Object.entries(MASKERADE_INPUTS))("%s", (fil, namn) => {
    it.each(namn)("☠️ `%s` maskeras i ett eget steg FÖRE steget som läser den", (input) => {
      const alla = steg(las(fil));
      // Ett steg LÄSER inputen när den står i ett uttryck: `${{ inputs.x }}`.
      const uttryck = new RegExp(`\\$\\{\\{\\s*inputs\\.${input}\\s*\\}\\}`);
      const forstaLasare = alla.findIndex((s) => uttryck.test(s));
      expect(forstaLasare, `${fil}: inget steg läser ${input}`).toBeGreaterThan(0);
      const maskerare = alla.slice(0, forstaLasare).find((s) =>
        s.includes(`.inputs.${input}`) && s.includes("GITHUB_EVENT_PATH") && s.includes("::add-mask::"));
      expect(maskerare, `${fil}: inget maskeringssteg för ${input}`).toBeTruthy();
      // Maskeringssteget får inte själv få värdet via ett uttryck — då står
      // det i dess eget env-block eller i dess utskrivna källa.
      expect(uttryck.test(maskerare ?? "")).toBe(false);
    });
  });

  it("en input som nämner artikelnummer i sin beskrivning måste stå i listan ovan", () => {
    const fynd: string[] = [];
    for (const f of workflowFiler()) {
      for (const [namn, beskr] of Object.entries(inputs(las(f)))) {
        const beskrivning = beskr.toLowerCase();
        if (!/artikelnummer/.test(beskrivning)) continue;
        // Ett kuvert tar en PUBLIK nyckel, inte ett nummer.
        if (/publik nyckel/.test(beskrivning)) continue;
        if (!(MASKERADE_INPUTS[f] ?? []).includes(namn)) fynd.push(`${f}: ${namn}`);
      }
    }
    expect(fynd).toEqual([]);
  });
});
