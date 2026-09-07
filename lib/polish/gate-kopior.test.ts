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
import { existsSync, readdirSync, statSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

// ⚠️ Sökvägarna räknas ut FRÅN TESTFILEN, inte från process.cwd(). Testet
// skrevs först med cwd och gick då sönder när det kördes från en annan
// katalog — samma sorts miljöberoende som grinden finns för att ta bort.
const ROT = join(dirname(fileURLToPath(import.meta.url)), "..", "..");
const RUNDOR = join(ROT, "tools", "polish-assets");
const KANONISKA = ["gate.py", "gate-alt.py", "gate-seo.py", "hasha.py", "gatelib.py"];

function kataloger(rot: string): string[] {
  if (!existsSync(rot)) return [];
  return readdirSync(rot).filter((n) => statSync(join(rot, n)).isDirectory());
}

describe("poleringsgrindarna bor på ett ställe", () => {
  it("ingen runda har en egen kopia av de kanoniska grindarna", () => {
    const kopior: string[] = [];
    for (const katalog of kataloger(RUNDOR)) {
      for (const fil of KANONISKA) {
        if (existsSync(join(RUNDOR, katalog, fil))) {
          kopior.push(`tools/polish-assets/${katalog}/${fil}`);
        }
      }
    }
    expect(
      kopior,
      `Grindarna ska anropas från tools/polish-gates/, inte kopieras:\n` +
        kopior.map((k) => `  ${k}`).join("\n") +
        `\n\nKör i stället:  python3 ../../polish-gates/gate.py`,
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
