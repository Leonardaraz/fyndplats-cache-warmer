// ☠️ POLERINGSGRINDARNA FÅR INTE KOPIERAS IN I EN RUNDAS KATALOG.
//
// VARFÖR DET HÄR TESTET FINNS. Varje runda kopierade in gate.py, gate-alt.py,
// gate-seo.py och hasha.py i sin egen katalog. Uppmätt 2026-09-06:
// **19 kopior av fyra grindar i tre olika versioner** — och det som skilde
// var inte strukturen utan ORDLISTAN över tyska rester:
//
//   runda A/F1   …|Kinder|Sofa|Jahre|Maße|robust|niedlich|gemütlich|…
//   runda F2     …|Kratzbaum|Katzen|Plüsch|…
//   runda G1/G2  …|Stuhl|Bezug|Kufen|Polsterung|Schaukel|kuschelig|flauschig|…
//
// Varje runda ERSATTE föregående rundas ord med sina egna, så unionen har
// aldrig körts. Runda H1 (kattlådor) gatades med gungstolarnas vokabulär:
// `Katzen`, `Deckel`, `Schaufel` och `Edelstahl` kontrollerades aldrig.
//
// Runda G:s STAV-lista bar dessutom `gungstol(?=en\b)(?!)` — `(?!)` misslyckas
// alltid, så mönstret var DÖTT och ersatte runda A:s fungerande `storlek`-koll.
// En grind som ser komplett ut och inte kontrollerar något är värre än ingen.
//
// Samma klass som SHIP_AXIS_RE, EU_TULL_CODES och mapWithConcurrency: en
// tvilling glider isär, och den som glider tystast ser ut att fungera.
// Grindarna bor i tools/polish-gates/ och rundorna anropar dem därifrån —
// precis som livegrind.py redan gjorde.
//
// ⚠️ Rundespecifika grindar (gate-skotsel.py, gate-kort.py) är UNDANTAGNA:
// de kodar en enskild rundas materialgrupper och har ingen delad sanning att
// glida ifrån. Det är de fyra generella som ska bo på ett ställe.

import { describe, expect, it } from "vitest";
import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

// ⚠️ Sökvägarna räknas ut FRÅN TESTFILEN, inte från process.cwd(). Testet
// skrevs först med cwd och gick då sönder när det kördes från en annan
// katalog — samma sorts miljöberoende som grinden finns för att ta bort.
const ROT = join(dirname(fileURLToPath(import.meta.url)), "..", "..");
const RUNDOR = join(ROT, "tools", "polish-assets");
const KANONISKA = ["gate.py", "gate-alt.py", "gate-seo.py", "gate-lager.py",
                   "gate-lankar.py", "gate-sku.py", "hasha.py", "gatelib.py",
                   "livegrind.py", "bygg-media.py"];

// ☠️ MÖNSTER, INTE EN NAMNLISTA. Den första versionen av det här testet letade
// efter de fem filnamnen ovan i rundornas underkataloger. Den missade
// `tools/polish-assets/gate-runda-a.py` — en TJUGONDE kopia, med runda A:s
// smalare ordlista, som låg kvar i ROTEN under ett annat namn. Den escapade
// på båda villkoren samtidigt, och en grind som bara ser de kopior man råkat
// döpa rätt är precis den sortens grind som räknas som gjord utan att
// kontrollera något.
// ⚠️ `bygg-media.py` är ingen GRIND men lyder under samma regel, och den låg
// som en kopia i runda I1 tills 2026-09-07. Den bygger bildnyttolasten ur
// bilder.tsv + alt.tsv och sorterar måttskissen sist; en runda som kopierar
// den och tappar sorteringen får måttskissen som HUVUDBILD och ser ändå ut
// att fungera. Delad sanning ska bo på ett ställe, grind eller inte.
const KOPIA_RE = /^(gate.*\.py|gatelib\.py|hasha\.py|livegrind\.py|bygg-media\.py)$/;

// ⚠️ Undantagen är UTTRYCKLIGA och få. En rundespecifik grind kodar en enskild
// rundas materialgrupper och har ingen delad sanning att glida ifrån — men den
// ska vara ett medvetet tillägg här, inte något som slinker igenom ett mönster.
const RUNDESPECIFIKA = new Set(["gate-skotsel.py", "gate-kort.py"]);

/** Rundornas underkataloger PLUS roten själv — kopian låg i roten. */
function platser(rot: string): string[] {
  if (!existsSync(rot)) return [];
  return ["", ...readdirSync(rot).filter((n) => statSync(join(rot, n)).isDirectory())];
}

function pyFiler(katalog: string): string[] {
  if (!existsSync(katalog)) return [];
  return readdirSync(katalog).filter(
    (n) => n.endsWith(".py") && !statSync(join(katalog, n)).isDirectory(),
  );
}

describe("poleringsgrindarna bor på ett ställe", () => {
  it("ingen runda har en egen kopia av de kanoniska grindarna", () => {
    const kopior: string[] = [];
    for (const katalog of platser(RUNDOR)) {
      for (const fil of pyFiler(join(RUNDOR, katalog))) {
        if (!KOPIA_RE.test(fil)) continue;
        if (RUNDESPECIFIKA.has(fil)) continue;
        kopior.push(join("tools", "polish-assets", katalog, fil));
      }
    }
    expect(
      kopior,
      `Grindarna ska anropas från tools/polish-gates/, inte kopieras:\n` +
        kopior.map((k) => `  ${k}`).join("\n") +
        `\n\nKör i stället:  python3 ../../polish-gates/gate.py`,
    ).toEqual([]);
  });

  // ☠️ EN KOPIA BEHOVER INTE VARA EN FIL. livegrind.py lag i tools/polish-gates/
  // hela tiden och passerade testet ovan — men bar sin EGEN ordlista i koden:
  // sexton tyska ord mot gatelibs dryga hundra, och de sexton var ett avtryck av
  // en enda runda (hundehütte, kaninchenstall, fressnäpfen). Pa en lamprunda
  // kontrollerade den alltsa ingenting, och den ar den SISTA sparren — efter den
  // ligger sidan ute. Verifierad genom att aterinfora buggen.
  it("ingen kanonisk grind bär en egen ordlista vid sidan av gatelib", () => {
    const EGNA_LISTOR = /^\s*(BRANDS|MARKEN|LAND|LEV|TYSKA|ARTNR|KOD|HOMO)\s*=/m;
    const fynd: string[] = [];
    for (const fil of KANONISKA) {
      if (fil === "gatelib.py") continue; // gatelib ÄR listan
      const sokvag = join(ROT, "tools", "polish-gates", fil);
      if (!existsSync(sokvag)) continue;
      const kod = readFileSync(sokvag, "utf-8");
      const m = kod.match(EGNA_LISTOR);
      if (m) fynd.push(`${fil}: ${m[0].trim()}`);
    }
    expect(
      fynd,
      `Ordlistorna bor i gatelib.py och ska importeras darifran:\n` +
        fynd.map((f) => `  ${f}`).join("\n") +
        `\n\nSkriv i stallet:  from gatelib import MARKEN, ARTNR, LAND, LEV, TYSKA, HOMO`,
    ).toEqual([]);
  });

  it("de kanoniska grindarna finns där de ska", () => {
    for (const fil of KANONISKA) {
      expect(
        existsSync(join(ROT, "tools", "polish-gates", fil)),
        `tools/polish-gates/${fil} saknas`,
      ).toBe(true);
    }
  });
});
