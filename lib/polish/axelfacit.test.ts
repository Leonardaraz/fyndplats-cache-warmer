// Testar GENERATORN som bygger rundornas `axelfacit.json` — åt båda hållen.
//
// ☠️ VARFÖR DEN BEHÖVER ETT EGET TEST. Facit är det enda gate-axel.py har att
// jämföra mot, så en tyst trasig generator gör axelgrinden till en no-op —
// exakt den klass som SKU-kollen tillhörde: den itererade en tom lista och
// rapporterade "inga krockar" utan att ha jämfört något. Generatorn har
// drivit isär tre gånger redan, och varje gång gick rundan igenom med
// "0 axelfel":
//
//   * M1/M2 skrev talen som STRÄNGAR ("170"); gate-axel slår upp heltal, så
//     uppslaget gav alltid None.
//   * M1:s första generator kände bara etiketten `Gesamtmaße` och missade
//     `Gesamtabmessung`, vilket gav en tom facitrad.
//   * M4:s fallback till den svenska spec-raden gjorde om ett korrekt
//     `axellos` till ett facit som ljög — se `SVENSK FALLBACK` nedan.
//
// ⚠️ Testet KÖR skriptet mot syntetiska kallor.json i en temp-katalog. Det
// speglar inte logiken i TS: en kopia hade varit precis den tvilling som
// `gate-kopior.test.ts` finns för att hindra.

import { describe, expect, it } from "vitest";
import { execFileSync } from "node:child_process";
import { mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const ROT = join(dirname(fileURLToPath(import.meta.url)), "..", "..");
const GENERATOR = join(ROT, "tools", "polish-gates", "bygg-axelfacit.py");

/** En källa i samma form som rundornas kallor.json: rå Wix-HTML. */
function kalla(tyskaRader: string[], svenskMattrad?: string): string {
  const punkter = tyskaRader.map((r) => `<li><p>✔ ${r}</p></li>`).join("");
  const spec =
    svenskMattrad === undefined
      ? ""
      : `<h2>Tekniska specifikationer</h2><ul><li><p>` +
        `<span style="font-weight: 700">Mått:</span> ${svenskMattrad}</p></li></ul>`;
  return `<h3> Technische Daten:</h3><ul>${punkter}</ul>${spec}`;
}

type Rad = Record<string, unknown>;

/** Kör generatorn i en temp-katalog. Kastar om den avbryter (som den ska). */
function bygg(kallor: Record<string, string>): Record<string, Rad> {
  const dir = mkdtempSync(join(tmpdir(), "axelfacit-"));
  writeFileSync(join(dir, "kallor.json"), JSON.stringify(kallor), "utf-8");
  execFileSync("python3", [GENERATOR], { cwd: dir, encoding: "utf-8" });
  return JSON.parse(readFileSync(join(dir, "axelfacit.json"), "utf-8"));
}

describe("bygg-axelfacit läser den tyska totalraden", () => {
  it("positionellt: tal 1 = bredd, tal 2 = djup, H = höjd", () => {
    const ut = bygg({ aaa: kalla(["Gesamtabmessungen: 160L x 90B x 240H cm"]) });
    expect(ut.aaa).toMatchObject({ bredd: 160, djup: 90, hojd: 240, bokstaver: "LBH" });
    expect(ut.aaa.axelkalla).toBeUndefined();
  });

  it("talen är HELTAL, inte strängar", () => {
    // M1/M2:s tysta bugg: gate-axel slår upp heltal, så "240" gav alltid None.
    const ut = bygg({ aaa: kalla(["Maße: L100 x B55 x H120 cm"]) });
    for (const axel of ["bredd", "djup", "hojd"]) {
      expect(typeof ut.aaa[axel]).toBe("number");
    }
  });
});

describe("SVENSK FALLBACK — bara när det finns en tysk totalrad att rädda", () => {
  it("fyrar när den tyska totalraden saknar axelbokstav", () => {
    // Runda M4, 86fdd9af: `Gesamtabmessung: Ø70 x 210 cm` bär ingen H alls,
    // medan den svenska spec-raden gör det. Båda är källans egna rader.
    const ut = bygg({
      aaa: kalla(["Gesamtabmessung: Ø70 x 210 cm"], "Ø70 x 210H cm"),
    });
    expect(ut.aaa).toMatchObject({ hojd: 210, bokstaver: "H" });
    expect(ut.aaa.axelkalla).toMatch(/svenska spec-raden/);
  });

  it("☠️ fyrar INTE när källan saknar totalmått — delmått är inte ett totalmått", () => {
    // Regressionen: isbjörnsparet 5a14cc4d i M1 är TVÅ figurer utan gemensamt
    // mått. Den svenska raden bär den STORA björnens tal, så en fallback utan
    // spärr gjorde om ett korrekt `axellos` till ett facit som påstår att
    // setet är 80 x 30 x 60. Ett facit som ljuger är värre än inget facit:
    // grinden faller då på korrekt text.
    //
    // ⚠️ TVÅ SPÄRRAR TÄCKER DET HÄR FALLET, OCH VAR OCH EN RÄCKER SJÄLV —
    // uppmätt, inte antaget. Jag återinförde buggarna en i taget:
    //
    //     `tysk &&` borttagen ensam        → 7/7 gröna (talkollen tar den:
    //                                        en tom tysk rad har noll tal och
    //                                        kan aldrig matcha den svenska)
    //     talkollen borttagen ensam        → bara AVBRYT-testet fäller
    //     BÅDA borttagna                   → det här testet fäller också
    //
    // Det är alltså ett test som bevisar UTFALLET, inte vilken rad som gav
    // det. Att skriva det som ett test av `tysk &&` hade varit en grind som
    // inte kan fälla — den hade sett komplett ut och räknats som gjord.
    const ut = bygg({
      aaa: kalla(
        [
          "Große Bärenabmessungen: 80L x 30B x 60H cm",
          "Kleine Bärenabmessungen: 53,5L x 20B x 40H cm",
        ],
        "80L x 30B x 60H cm",
      ),
    });
    expect(ut.aaa.axellos).toMatch(/inget totalmått i källan/);
    for (const axel of ["bredd", "djup", "hojd"]) {
      expect(ut.aaa[axel]).toBeUndefined();
    }
  });

  it("☠️ AVBRYTER när de två radernas tal inte är samma tal", () => {
    // Den svenska raden är en översättning av den tyska, inte en andra
    // mätning. Skiljer talen sig åt är det inte en saknad bokstav utan två
    // olika mått — och då vet vi inte vilket som gäller.
    expect(() =>
      bygg({ aaa: kalla(["Gesamtabmessung: Ø70 x 210 cm"], "Ø60 x 180H cm") }),
    ).toThrow();
  });

  it("decimalkomma mot decimalpunkt är notation, inte ett annat mått", () => {
    const ut = bygg({
      aaa: kalla(["Gesamtabmessung: Ø53,5 x 180 cm"], "Ø53.5 x 180H cm"),
    });
    expect(ut.aaa).toMatchObject({ hojd: 180 });
  });
});

describe("en rad utan måttrad AVBRYTER hellre än tiger", () => {
  it("☠️ tom facitrad är en grind som inte kan fälla", () => {
    expect(() => bygg({ aaa: kalla(["Farbe: Grün", "Material: PE, PVC"]) })).toThrow();
  });
});
