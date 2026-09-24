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

describe("EN LÄNGD OCH INGET ANNAT — förklarat axellös, inte avbrott", () => {
  it("☠️ ger inget facit alls, bara skälet med raden", () => {
    // Runda N59, skjutdörrsbeslaget 87888f5f: källans enda mått är
    // `Schienenlänge: 183 cm`. Vilken axel längden är går inte att läsa ur
    // raden, så grenen får inte gissa bredd eller höjd.
    const ut = bygg({ aaa: kalla(["Schienenlänge: 183 cm", "Geeignete Türblattbreite: 90 cm"]) });
    expect(ut.aaa.bredd).toBeUndefined();
    expect(ut.aaa.djup).toBeUndefined();
    expect(ut.aaa.hojd).toBeUndefined();
    expect(String(ut.aaa.axellos)).toMatch(/bara en längd: .*Schienenlänge: 183 cm/);
  });

  it("fyrar INTE när en riktig totalrad finns", () => {
    const ut = bygg({ aaa: kalla(["Gesamtmaße: 183L x 5B x 6H cm", "Schienenlänge: 183 cm"]) });
    expect(ut.aaa).toMatchObject({ bredd: 183, djup: 5, hojd: 6 });
    expect(ut.aaa.axellos).toBeUndefined();
  });

  it("☠️ läser en längd i METER, som en kabel mäts i", () => {
    // Runda N60, laddkabeln c28af8df: källans enda mått är `Kabellänge: 5 m`.
    // Grenen krävde `cm`, så generatorn avbröt på en källa som säger
    // sanningen om sig själv.
    const ut = bygg({ aaa: kalla(["Kabellänge: 5 m", "Schutzart: IP65"]) });
    expect(ut.aaa.bredd).toBeUndefined();
    expect(ut.aaa.djup).toBeUndefined();
    expect(ut.aaa.hojd).toBeUndefined();
    expect(String(ut.aaa.axellos)).toMatch(/bara en längd: .*Kabellänge: 5 m/);
  });

  it("släpper INTE igenom millimeter", () => {
    expect(() => bygg({ aaa: kalla(["Kabellänge: 5 mm", "Schutzart: IP65"]) })).toThrow();
  });
});

describe("KVALIFICERAD ETIKETT — bara när den nakna tiger", () => {
  it("läser Gesamtgröße, som inte stod i etikettlistan", () => {
    // Runda N1, hörnsoffan fe56b0e6. Ordet fanns inte i ETIKETT alls, så
    // generatorn avbröt — rätt beteende, men den kunde bättre.
    const ut = bygg({ aaa: kalla(["Gesamtgröße: 193B x 136T x 85H cm"]) });
    expect(ut.aaa).toMatchObject({ bredd: 193, djup: 136, hojd: 85 });
    expect(ut.aaa.axelkalla).toBeUndefined();
  });

  it("läser etiketten med bestämningsord och skriver ut vilket", () => {
    // Runda N1, bäddsoffan d372e8e9: `Gesamtabmessungen Sofa:`.
    const ut = bygg({
      aaa: kalla([
        "Gesamtabmessungen Sofa: 203B x 95T x 75H cm",
        "Gesamtabmessungen Bett: 203B x 121T x 38H cm",
      ]),
    });
    expect(ut.aaa).toMatchObject({ bredd: 203, djup: 95, hojd: 75 });
    expect(String(ut.aaa.axelkalla)).toContain("Sofa");
  });

  it("☠️ SOFFANS mått, inte BÄDDENS — höjden skiljer 37 cm", () => {
    // Hela skälet till att bestämningsordet inte fick tillåtas rakt av: en
    // bäddsoffa har TVÅ totalrader, och tar man fel är facit 38 cm högt i
    // stället för 75. Grinden hade då fällt varje korrekt höjdangivelse.
    const ut = bygg({
      aaa: kalla([
        "Gesamtabmessungen Sofa: 203B x 95T x 75H cm",
        "Gesamtabmessungen Bett: 203B x 121T x 38H cm",
      ]),
    });
    expect(ut.aaa.hojd).toBe(75);
    expect(ut.aaa.hojd).not.toBe(38);
  });

  it("☠️ den NAKNA etiketten vinner alltid över en kvalificerad", () => {
    // Ordningen är spärren: pass 1 är oförändrat beteende, så allt som
    // byggts hittills regenererar byte-identiskt. Här står den kvalificerade
    // raden FÖRST i källan och ska ändå förlora.
    const ut = bygg({
      aaa: kalla([
        "Gesamtabmessungen Bett: 203B x 121T x 38H cm",
        "Gesamtabmessungen: 203B x 95T x 75H cm",
      ]),
    });
    expect(ut.aaa.hojd).toBe(75);
    expect(ut.aaa.axelkalla).toBeUndefined();
  });
});

describe("GESAMTHÖHE — en totalhöjd utan totalmått", () => {
  it("läser höjden ur den tyska raden, inte ur den svenska spec-raden", () => {
    // Runda N2, konstväxten 67ba375c. Källan har `Gesamthöhe: 110 cm` och
    // `Topfgröße: Ø17 x 14,5H cm` — inget L x B x H finns, för bladverket har
    // ingen kant. Generatorn avbröt på en källa som är entydig om höjden.
    const ut = bygg({
      aaa: kalla(["Gesamthöhe: 110 cm", "Topfgröße: Ø17 x 14,5H cm"], "Ø17 x 110H cm"),
    });
    expect(ut.aaa).toMatchObject({ hojd: 110, bokstaver: "H" });
    expect(String(ut.aaa.axelkalla)).toContain("Gesamthöhe");
  });

  it("☠️ ger INGEN bredd — den svenska raden bär KRUKANS diameter", () => {
    // Hela skälet till en egen gren i stället för den svenska fallbacken:
    // importen skriver `Ø17 x 110H cm`, alltså krukans mått bredvid växtens
    // höjd. Ett facit med bredd 17 hade fällt varje korrekt mening om
    // bladverket, som mäter långt mer än krukan.
    const ut = bygg({
      aaa: kalla(["Gesamthöhe: 110 cm", "Topfgröße: Ø17 x 14,5H cm"], "Ø17 x 110H cm"),
    });
    expect(ut.aaa.bredd).toBeUndefined();
    expect(ut.aaa.djup).toBeUndefined();
  });

  it("☠️ vinner ALDRIG över en riktig totalrad", () => {
    // Grenen ligger efter de vanliga passen med flit. En produkt som har BÅDA
    // ska läsas ur totalraden — annars hade en höjdrad tyst skrivit över tre
    // korrekta axlar med en.
    const ut = bygg({
      aaa: kalla(["Gesamthöhe: 240 cm", "Gesamtabmessungen: 160L x 90B x 240H cm"]),
    });
    expect(ut.aaa).toMatchObject({ bredd: 160, djup: 90, hojd: 240 });
    expect(ut.aaa.axelkalla).toBeUndefined();
  });
});

describe("NAKEN HÖHE — samma totalhöjd utan ordet Gesamt", () => {
  it("läser `Höhe: 150 cm` när källan inte har något annat mått", () => {
    // Runda N65, konstfikusen a6657b3d: `Höhe: 150 cm` och
    // `Topfgröße: Ø15 x 12,5 cm`. Samma form som den publicerade fikusen
    // 63351b54 i L1, där generatorn också avbröt.
    const ut = bygg({
      aaa: kalla(["Höhe: 150 cm", "Topfgröße: Ø15 x 12,5 cm"], "Ø15 x 150H cm"),
    });
    expect(ut.aaa).toMatchObject({ hojd: 150, bokstaver: "H" });
    expect(ut.aaa.bredd).toBeUndefined();
    expect(String(ut.aaa.axelkalla)).toContain("Höhe");
  });

  it("☠️ Gesamthöhe vinner över en naken Höhe", () => {
    const ut = bygg({ aaa: kalla(["Gesamthöhe: 110 cm", "Höhe: 150 cm"]) });
    expect(ut.aaa.hojd).toBe(110);
  });

  it("☠️ ett delmått med Höhe i etiketten blir aldrig produktens höjd", () => {
    // `Sitzhöhe` och `Rückenlehne Höhe` mäter en DEL. Etiketten måste stå
    // först på raden och ensam, annars avbryter generatorn som förr.
    expect(() => bygg({ aaa: kalla(["Sitzhöhe: 45 cm"]) })).toThrow();
    expect(() => bygg({ aaa: kalla(["Rückenlehne Höhe: 50 cm"]) })).toThrow();
  });

  it("☠️ två nakna Höhe-rader är tvetydiga och avbryter", () => {
    expect(() => bygg({ aaa: kalla(["Höhe: 150 cm", "Höhe: 120 cm"]) })).toThrow();
  });
});

describe("BARA EN DIAMETER — en ring har inga axlar att binda", () => {
  it("märker raden axellös med skälet i stället för att avbryta", () => {
    // Runda N66, kantskyddet till en studsmatta 14fb0f98: `Durchmesser:
    // Ø305 cm` och `Dicke der Polsterung: 15 mm`. Ingen bredd, inget djup,
    // ingen höjd — och generatorn avbröt på en källa som säger sanningen.
    const ut = bygg({
      aaa: kalla(["Durchmesser: Ø305 cm", "Dicke der Polsterung: 15 mm"], "Ø 305cm"),
    });
    expect(String(ut.aaa.axellos)).toContain("bara en diameter");
    expect(ut.aaa.bredd).toBeUndefined();
    expect(ut.aaa.hojd).toBeUndefined();
  });

  it("☠️ en naken Höhe vinner över diametern — en cylinder har en höjd", () => {
    const ut = bygg({ aaa: kalla(["Durchmesser: Ø30 cm", "Höhe: 50 cm"]) });
    expect(ut.aaa.hojd).toBe(50);
    expect(ut.aaa.axellos).toBeUndefined();
  });

  it("☠️ en diameter på en DEL gör inte produkten axellös", () => {
    // `Rädergröße: Durchm. 24 cm` och `Sockelgröße: Ø64,5 cm` mäter delar.
    // Etiketten måste stå först på raden och ensam, annars avbryter
    // generatorn som förr.
    expect(() => bygg({ aaa: kalla(["Raddurchmesser: 24 cm"]) })).toThrow();
    expect(() => bygg({ aaa: kalla(["Rädergröße: Durchm. 24 cm"]) })).toThrow();
  });
});

describe("TREVÄGSKEDJA — en tredje siffra får inte tystas bort", () => {
  it("☠️ 54/62/70H behåller ALLA tre talen, inte bara de sista två", () => {
    // Runda N19, campingbordet ecb304cd: `Gesamtabmessungen: 240L x 60B x
    // 54/62/70H cm`. Den gamla TAL-gruppen tillät bara EN `/`-förlängning,
    // så den matchade "54/62" utan bokstav direkt efter (nästa tecken var
    // "/70H") och gav därför inget par vid "54". Regexet hittade i stället
    // en träff längre fram, "62/70H", och facit blev tyst {hojd: [62, 70]}
    // — 54 försvann utan ett ord.
    const ut = bygg({
      aaa: kalla(["Gesamtabmessungen: 240L x 60B x 54/62/70H cm"]),
    });
    expect(ut.aaa).toMatchObject({ bredd: 240, djup: 60, hojd: [54, 62, 70] });
  });

  it("en vanlig tvåvägskedja (73-110H) är oförändrad", () => {
    // Regressionsskydd åt andra hållet: den absoluta merparten av husets
    // höjdintervall är tvåvärdiga, och fixet får inte ändra deras utfall.
    const ut = bygg({ aaa: kalla(["Gesamtmaße: 65L x 48B x 73-110H cm"]) });
    expect(ut.aaa).toMatchObject({ bredd: 65, djup: 48, hojd: [73, 110] });
  });
});

describe("TVÅ TAL UTAN H ELLER T — positionen räcker inte", () => {
  it("☠️ ger inget facit alls i stället för ett som gissar djupet", () => {
    // Runda N2, häckrullen c8376256: `Gesamtmaße: L300 x B100 cm`. Den
    // positionella regeln gav {bredd: 300, djup: 100}, men produkten är en
    // platt rulle som hängs på ett staket och Aosoms EGEN måttritning sätter
    // 100 som HÖJD. Ett facit som säger djup hade fällt varje korrekt mening
    // om höjden.
    const ut = bygg({ aaa: kalla(["Gesamtmaße: L300 x B100 cm"]) });
    expect(ut.aaa.bredd).toBeUndefined();
    expect(ut.aaa.djup).toBeUndefined();
    expect(ut.aaa.hojd).toBeUndefined();
    expect(String(ut.aaa.axellos)).toMatch(/utan H eller T/);
  });

  it("AVBRYTER inte — en förklarad axellös rad är ett utfall, inte ett tomt facit", () => {
    expect(() => bygg({ aaa: kalla(["Gesamtmaße: L300 x B100 cm"]) })).not.toThrow();
  });

  it("två tal MED H läggs ut som vanligt", () => {
    // Spärren får bara gälla när båda bokstäverna saknas. `Ø40 x 56H` och
    // liknande rader ska fortsätta ge sin höjd.
    const ut = bygg({ aaa: kalla(["Gesamtmaße: 40B x 56H cm"]) });
    expect(ut.aaa).toMatchObject({ bredd: 40, hojd: 56 });
  });
});
