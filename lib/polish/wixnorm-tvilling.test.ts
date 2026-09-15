// ☠️ EN ENDA SANNING OM WIX NORMALISERING — och den bor i `wixnorm.py`.
//
// Uppmätt i runda N2: återläsningen rapporterade SKILJER på alla åtta
// produkterna, och avvikelsen var exakt 7 × antalet `<li>` i varje text.
// Skrivningarna var byte-exakta. Det var FACIT som var fel: `hasha.py`
// hämtade sin `normalisera` ur `gatelib`, som kände två av Wix fem åtgärder.
//
// Tre kopior fanns samtidigt, med tre olika svar på samma fråga:
//
//     gatelib.normalisera   2 regler   (vitrymd + target="_self")
//     kvitto.py             4 regler   (saknade den avslutande radbrytningen)
//     wixnorm.normalisera   5 regler   uppmätt mot skarpa V3
//
// ⚠️ RIKTNINGEN ÄR DET FARLIGA. En korrekt skrivning rapporteras som
// misslyckad, och den som sett det nog många gånger slutar titta efter vilket
// det var — precis som en byte-avvikelse i #249. Samma familj som
// `SHIP_AXIS_RE` och `EU_TULL_CODES`, fast en nivå upp: här var det GRINDEN
// som glidit, inte koden den grindar.

import { describe, expect, it } from "vitest";
import { execFileSync } from "node:child_process";
import { mkdtempSync, readFileSync, readdirSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const ROT = join(dirname(fileURLToPath(import.meta.url)), "..", "..");
const GRINDAR = join(ROT, "tools", "polish-gates");

describe("wixnorm är den enda definitionen", () => {
  it("☠️ ingen annan fil i polish-gates definierar normalisera", () => {
    const traffar: string[] = [];
    for (const f of readdirSync(GRINDAR)) {
      if (!f.endsWith(".py") || f === "wixnorm.py") continue;
      const txt = readFileSync(join(GRINDAR, f), "utf-8");
      if (/^def normalisera\(/m.test(txt)) traffar.push(f);
    }
    expect(traffar, `en tvilling till wixnorm.normalisera: ${traffar.join(", ")}`).toEqual([]);
  });

  it("☠️ hasha.py hashar det Wix FAKTISKT lagrar — <li> räknas in", () => {
    // En spec-flik är en <ul>. Modelleras inte <li><p>-inslaget ligger varje
    // rundas facit 7 tecken för kort per rad, och återläsningen fäller på en
    // felfri skrivning.
    const dir = mkdtempSync(join(tmpdir(), "wixnorm-"));
    const html = "<p>Ett.</p><h2>Tekniska specifikationer</h2><ul><li>Mått: 40 cm</li><li>Vikt: 8 kg</li></ul>\n";
    writeFileSync(join(dir, "aaa.html"), html, "utf-8");
    execFileSync("python3", [join(GRINDAR, "hasha.py")], { cwd: dir, encoding: "utf-8" });
    const [, , langd] = readFileSync(join(dir, "vantat-hash.tsv"), "utf-8").trim().split("\t");

    // rå 95 tecken; Wix lägger 7 per <li> och strippar den sista radbrytningen
    const raa = html.length;
    expect(Number(langd)).toBe(raa - 1 + 2 * 7);
  });

  it("hashen är densamma som wixnorm ger direkt", () => {
    const dir = mkdtempSync(join(tmpdir(), "wixnorm-"));
    const html = "<p>Två.</p><ul><li><strong>Fet</strong> rad</li></ul>\n";
    writeFileSync(join(dir, "bbb.html"), html, "utf-8");
    execFileSync("python3", [join(GRINDAR, "hasha.py")], { cwd: dir, encoding: "utf-8" });
    const [, hash] = readFileSync(join(dir, "vantat-hash.tsv"), "utf-8").trim().split("\t");

    const direkt = execFileSync(
      "python3",
      ["-c", `import sys; sys.path.insert(0, ${JSON.stringify(GRINDAR)});\nfrom wixnorm import normalisera\nfrom gatelib import fnv\nimport io\nprint(fnv(normalisera(io.open("${join(dir, "bbb.html")}", encoding="utf-8").read())))`],
      { encoding: "utf-8" },
    ).trim();
    expect(hash).toBe(direkt);
  });
});
