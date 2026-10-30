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
 *
 * VEVOR:s form sedan 2026-10-29, när läsaren (lib/vevor) började spara dem:
 * versaler och siffror i ett, 19 eller 22 tecken i de 34 uppmätta. Mönstret
 * tar 17–24 och kräver både en bokstav och en siffra, så att långa tal och
 * versalord går fria. Samma form tvättas bort av `redigera()` i workflowerna.
 *
 * ☠️ Och en form med skiljetecken sedan 2026-10-30: 335 VEVOR-sidor bar ett
 * nummer på 19 tecken med `-`, `.` eller `+` inuti, och det gamla mönstret
 * såg bara delarna, som är kortare än 17. Det nya tar hela sträckan av
 * versaler, siffror och skiljetecken, och bara när den står ensam: en sträcka
 * med gemener (ett Wix-id, en slug) eller längre än 24 tecken går fri.
 */
const VEVOR_MED_SKILJETECKEN =
  /(?<![A-Za-z0-9.+-])(?=[A-Z0-9.+-]*\d)(?=[A-Z0-9.+-]*[A-Z])[A-Z0-9][A-Z0-9.+-]{15,22}[A-Z0-9](?![A-Za-z0-9.+-])/g;
const ARTNR = new RegExp(
  "\\b\\d{2}[A-Z]-\\d{3}(?!\\d)[A-Z0-9]*\\b|\\b[A-Z]\\d{2}-\\d{3}(?!\\d)[A-Z0-9]*\\b|\\b\\d{3}-\\d{3}(?!\\d)[A-Z0-9]{2,}\\b|" +
    "\\b\\d[A-Z]\\d-\\d{3}(?!\\d)[A-Z0-9]*\\b|\\b(?=[A-Z0-9]*\\d)(?=[A-Z0-9]*[A-Z])[A-Z0-9]{17,24}\\b|" +
    VEVOR_MED_SKILJETECKEN.source,
  "g",
);

/** jq-interpolation av ett fält som bär artikelnumret: `\(.sku)`, `map(.sku)`. */
const ARTIKELFALT = /\\\((?:[^()]|\([^()]*\))*\.(?:sku|artikel|artikelnummer|supplierProductId|aosomSku|vevorArtiklar)\b|map\(\s*\.sku\s*\)/g;

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


/**
 * Ersättningarna i en workflows `perl -pe '…'` som körbara JS-mönster. Perls
 * syntax här (`\b`, `\S`, lookbehind, `$1`) är densamma i JavaScript, så
 * grinden kör workflowens EGNA mönster och inte en avskrift av dem.
 */
function perlErsattningar(perl: string): { re: RegExp; ers: string }[] {
  const ut: { re: RegExp; ers: string }[] = [];
  let i = 0;
  const del = (d: string): string => {
    let t = "";
    while (i < perl.length && perl[i] !== d) {
      if (perl[i] === "\\" && i + 1 < perl.length) {
        t += perl[i] + perl[i + 1];
        i += 2;
        continue;
      }
      t += perl[i++];
    }
    i++;
    return t;
  };
  while (i < perl.length) {
    if (perl[i] !== "s" || (i > 0 && !/[\s;]/.test(perl[i - 1]))) {
      i++;
      continue;
    }
    const d = perl[i + 1];
    if (d !== "/" && d !== "#") {
      i++;
      continue;
    }
    i += 2;
    const monster = del(d);
    const ers = del(d);
    const flaggor = /^[a-z]*/.exec(perl.slice(i))![0];
    i += flaggor.length;
    ut.push({ re: new RegExp(monster, flaggor.includes("g") ? flaggor : `${flaggor}g`), ers });
  }
  return ut;
}

/** Redigeringen i en workflow, som den står: alla `perl -pe` som tvättar VEVOR:s nummer. */
function vevorRedigeringar(text: string): string[] {
  return [...text.matchAll(/perl -pe '([^']*vevor:[^']*)'/g)].map((m) => m[1]);
}

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

  it("☠️ varje redigering tvättar VEVOR:s nummer i alla uppmätta former och låter Wix-id, tider och felkoder vara", () => {
    // Påhittade nummer i de uppmätta formerna: versaler och siffror i ett, och
    // 19 tecken med bindestreck, punkt eller plus inuti (2026-10-30).
    const nummer = [
      "QZQZQZQZQZQ123456789",
      "QZQZQZQZQZQZQ123456789Q",
      "TESTQ12XYZ3-45678Q9",
      "QQQ4.5QQ-678QQQQQQ9",
      "12Q3.4-56Q7.8QQQQQ9",
      "QQQ1234+QQQ-56789Q1",
    ];
    const skona = [
      "2f3b1c4d-1111-4222-8333-944455556666",
      "2F3B1C4D-1111-4222-8333-944455556666",
      "2026-10-30T16:30:02.123Z",
      "19011223344",
      "SE-1141",
      "WDE0073",
      "HTTP-500",
    ];
    const fynd: string[] = [];
    let granskade = 0;
    for (const f of workflowFiler()) {
      for (const perl of vevorRedigeringar(las(f))) {
        granskade++;
        const ersattningar = perlErsattningar(perl);
        const tvatta = (t: string) => ersattningar.reduce((acc, { re, ers }) => acc.replace(re, ers), t);
        for (const n of nummer) {
          if (tvatta(`fel: ${n} föll`).includes(n)) fynd.push(`${f}: släppte ${n.replace(/[A-Z0-9]/g, "x")}`);
        }
        for (const t of skona) {
          if (!tvatta(`rad ${t} slut`).includes(t)) fynd.push(`${f}: tog ${t}`);
        }
      }
    }
    expect(granskade).toBeGreaterThanOrEqual(7);
    expect(fynd).toEqual([]);
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
