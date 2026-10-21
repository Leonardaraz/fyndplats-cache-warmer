// Laglighetsskärmen för djurbostäder (tools/polish-gates/djurbostad.py).
//
// Tabellerna i grinden är lästa ur SJVFS 2019:15 (bilaga 1:1, 1:2, 1:3 och 1:4),
// inte ur runbookens gamla tabell, som saknade kaninernas kortaste sida, bara
// hade ett mått för fåglar och angav ett hamsterhjul som inte finns i
// föreskriften. Testerna kör grinden, de speglar den inte (samma beslut som
// gatelib.test.ts), och varje minimimått prövas åt båda hållen: strax över ska
// gå igenom, strax under ska fälla. Ändras ett tal i ART eller FAGEL utan att
// föreskriften har ändrats fäller något av dem.
import { execFileSync } from "node:child_process";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { afterEach, describe, expect, it } from "vitest";

const ROT = resolve(__dirname, "../..");
const GRIND = join(ROT, "tools/polish-gates/djurbostad.py");
const SKARM = join(ROT, "tools/polish-assets/djurbostader-skarm-2026-10-21");

let katalog = "";
afterEach(() => katalog && rmSync(katalog, { recursive: true, force: true }));

function kor(dir: string): { ut: string; kod: number } {
  try {
    const ut = execFileSync("python3", ["-I", GRIND, dir], { encoding: "utf-8", stdio: ["ignore", "pipe", "pipe"] });
    return { ut, kod: 0 };
  } catch (err) {
    const e = err as { stdout?: string; stderr?: string; status?: number };
    if (typeof e.stdout !== "string") throw err;
    return { ut: e.stdout + (e.stderr ?? ""), kod: e.status ?? 1 };
  }
}

/** Skriver en tillfällig skärm med en rad och kör grinden. */
function rad(art: string, typ: "bostad" | "fagel", a: number, l: number, k: number, h: number, beslut: string, orsak = "x") {
  katalog = mkdtempSync(join(tmpdir(), "djurbostad-"));
  writeFileSync(join(katalog, "djurbostad.tsv"), `abcdef01\t5\t${art}\t${typ}\t${a}\t${l}\t${k}\t${h}\t${beslut}\t${orsak}\n`);
  return kor(katalog);
}

describe("den incheckade skärmen", () => {
  it("klarar sin egen grind: varje uträknat beslut stämmer med filen", () => {
    const { ut, kod } = kor(SKARM);
    expect(ut).not.toContain("FEL");
    expect(kod).toBe(0);
  });

  it("☠️ bär aldrig ett artikelnummer eller ett inköpspris", () => {
    // Rubrikraderna får nämna orden; datat får det inte.
    const text = readFileSync(join(SKARM, "djurbostad.tsv"), "utf-8")
      .split("\n")
      .filter((r) => !r.startsWith("#"))
      .join("\n");
    expect(text).not.toMatch(/\b\d{3}-\d{3}[A-Z]{0,3}\d{0,3}\b/);
    expect(text).not.toMatch(/\b\d{2,3}[A-Z]\d{2}[A-Z]{1,3}\d{0,3}\b/);
    expect(text.toLowerCase()).not.toMatch(/aosom\.|landedcost|costusd|inköpspris/);
  });
});

describe("kaniner (bilaga 1:3): golvyta, kortaste sida och höjd", () => {
  // [art, golvyta cm², kortaste sida cm, höjd cm]
  const MINST: [string, number, number, number][] = [
    ["dvkanin", 5000, 50, 50],
    ["kanin", 7000, 60, 60],
    ["kaninmedel", 8000, 70, 80],
    ["kaninstor", 9000, 70, 80],
  ];

  for (const [art, a, k, h] of MINST) {
    it(`${art}: ${a} cm², ${k} cm och ${h} cm släpps igenom med marginal`, () => {
      expect(rad(art, "bostad", a * 1.1, 200, k + 2, h + 2, "PASS").kod).toBe(0);
    });
    it(`${art}: ytan under minimum fäller`, () => {
      expect(rad(art, "bostad", a * 0.8, 200, k + 10, h + 10, "FAIL").kod).toBe(0);
      expect(rad(art, "bostad", a * 0.8, 200, k + 10, h + 10, "PASS").ut).toContain("måtten ger FAIL");
    });
    it(`${art}: kortaste sida för smal fäller`, () => {
      expect(rad(art, "bostad", a * 2, 200, k - 8, h + 10, "FAIL").kod).toBe(0);
    });
    it(`${art}: för låg höjd fäller`, () => {
      expect(rad(art, "bostad", a * 2, 200, k + 10, h - 8, "FAIL").kod).toBe(0);
    });
  }

  it("☠️ 45 cm i kortaste sida klarar ingen kanin: det är det som fäller de flesta stall", () => {
    expect(rad("dvkanin", "bostad", 8000, 120, 45, 70, "FAIL").kod).toBe(0);
    expect(rad("kanin", "bostad", 8000, 120, 45, 70, "FAIL").kod).toBe(0);
  });

  it("strax under gränsen är HOLD, inte FAIL: ett innermått som saknar några cm avgörs på bilderna", () => {
    expect(rad("dvkanin", "bostad", 7200, 120, 60, 50, "HOLD").kod).toBe(0);
    expect(rad("dvkanin", "bostad", 7200, 120, 60, 50, "PASS").ut).toContain("måtten ger HOLD");
  });
});

describe("gnagare (bilaga 1:4)", () => {
  const MINST: [string, number, number, number][] = [
    ["marsvin", 3000, 40, 25],
    ["guldhamster", 1200, 25, 20],
    ["dvarghamster", 900, 20, 20],
    ["chinchilla", 5000, 50, 100],
    ["degu", 3000, 40, 40],
    ["rattor", 1800, 30, 30],
    ["gerbil", 1200, 25, 20],
    ["mus", 900, 20, 20],
    ["iller", 50000, 100, 100],
  ];
  for (const [art, a, k, h] of MINST) {
    it(`${art}: precis över minimum går igenom, klart under fäller`, () => {
      expect(rad(art, "bostad", a * 1.1, 300, k + 2, h + 2, "PASS").kod).toBe(0);
      expect(rad(art, "bostad", a * 0.8, 300, k + 10, h + 10, "FAIL").kod).toBe(0);
    });
    it(`${art}: kortaste sida och höjd prövas var för sig`, () => {
      expect(rad(art, "bostad", a * 3, 300, k - 8, h + 10, "FAIL").kod).toBe(0);
      expect(rad(art, "bostad", a * 3, 300, k + 10, h - 8, "FAIL").kod).toBe(0);
      expect(rad(art, "bostad", a * 3, 300, k + 10, h + 10, "PASS").kod).toBe(0);
    });
  }

  it("en hamsterbur på 58 x 36 cm klarar minimimåttet, men bara för hamster", () => {
    expect(rad("guldhamster,dvarghamster", "bostad", 2088, 58, 36, 81, "PASS").kod).toBe(0);
    expect(rad("marsvin", "bostad", 2088, 58, 36, 81, "FAIL").kod).toBe(0);
  });

  it("flera arter: det räcker att en klarar sig, och bara de som klarar sig listas som passande", () => {
    const { ut, kod } = rad("guldhamster,dvarghamster,marsvin", "bostad", 6300, 112, 56, 25, "PASS");
    expect(kod).toBe(0);
    expect(ut).toContain("guldhamster,dvarghamster");
    expect(ut).not.toContain("marsvin");
  });
});

describe("sällskapsfåglar (bilaga 1:1)", () => {
  it("☠️ en bur på 63 x 53 cm klarar ytan men inte längsta sidan på 70 cm", () => {
    // Leverantören marknadsför den för kanariefåglar och undulater.
    expect(rad("fagel", "fagel", 58 * 49, 58, 49, 74, "FAIL").kod).toBe(0);
    expect(rad("fagel", "fagel", 63 * 53, 63, 53, 144, "FAIL").kod).toBe(0);
  });

  it("☠️ en lågt byggd bur faller på höjden även när ytan räcker", () => {
    expect(rad("fagel", "fagel", 76 * 46, 76, 46, 41, "FAIL").kod).toBe(0);
  });

  it("en vintagebur på 46,5 x 36 cm fäller på yta och längd", () => {
    expect(rad("fagel", "fagel", 46.5 * 36, 46.5, 36, 59, "FAIL").kod).toBe(0);
  });

  it("klassen följer ytan: 0,31 m² för upp till 20 cm, 0,45 m² för 21-25 cm, 0,84 m² för 26-35 cm", () => {
    expect(rad("fagel", "fagel", 4108, 79, 52, 115, "PASS").ut).toContain("fagel20");
    expect(rad("fagel", "fagel", 5358, 94, 57, 113, "PASS").ut).toContain("fagel25");
    expect(rad("fagel", "fagel", 11000, 190, 75, 160, "PASS").ut).toContain("fagel35");
  });

  it("bredden ska vara minst två gånger fågelns längd: en smal voljär når inte klassen för stora fåglar", () => {
    const { ut } = rad("fagel", "fagel", 11760, 196, 60, 160, "PASS");
    expect(ut).toContain("fagel25");
    expect(ut).not.toContain("fagel35");
  });
});

describe("filens form", () => {
  it("☠️ ett beslut som skiljer sig från måtten fäller grinden och säger vad måtten ger", () => {
    const { ut, kod } = rad("kanin", "bostad", 3000, 80, 40, 40, "PASS");
    expect(kod).toBe(1);
    expect(ut).toContain("filen säger PASS men måtten ger FAIL");
  });

  it("HOLD och FAIL kräver en orsak", () => {
    const { ut, kod } = rad("kanin", "bostad", 3000, 80, 40, 40, "FAIL", "");
    expect(kod).toBe(1);
    expect(ut).toContain("saknar orsak");
  });

  it("en okänd art avvisas i stället för att tyst klara sig", () => {
    const { ut, kod } = rad("papegoja", "bostad", 90000, 300, 300, 300, "PASS");
    expect(kod).toBe(1);
    expect(ut).toContain("okänd art");
  });

  it("saknas filen avbryter grinden med kod 2", () => {
    katalog = mkdtempSync(join(tmpdir(), "djurbostad-"));
    expect(kor(katalog).kod).toBe(2);
  });

  it("samma kort två gånger fäller", () => {
    katalog = mkdtempSync(join(tmpdir(), "djurbostad-"));
    const r = "abcdef01\t5\t-\thons\t-\t-\t-\t-\tPASS\tx\n";
    writeFileSync(join(katalog, "djurbostad.tsv"), r + r);
    const { ut, kod } = kor(katalog);
    expect(kod).toBe(1);
    expect(ut).toContain("förekommer två gånger");
  });
});
