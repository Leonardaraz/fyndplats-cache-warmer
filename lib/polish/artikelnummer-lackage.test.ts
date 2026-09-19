// Fäller om ett Aosom-artikelnummer committas under `tools/polish-assets/`.
//
// ☠️ VARFÖR DEN FINNS. Repot är PUBLIKT, och artikelnumret är den sträng
// dealproffsen.se publicerar som `sku`/`mpn` i sin JSON-LD. Ett nummer i
// repot joinar alltså vår produktsida mot deras — och därmed mot vårt
// inköpsled. CLAUDE.md säger det rakt ut: numret hör hemma på
// `supplierProductId` och ingen annanstans.
//
// Regeln har stått nedskriven sedan #222 och glidit ändå. Uppmätt 2026-09-13
// låg FYRA nummer committade under `tools/polish-assets/`, och den fjärde är
// den som gör argumentet: meningen som läckte numret var en anteckning om att
// numret inte får läcka.
//
//     (`D30-907V00LG` på 68f7d530). Numret hör hemma på `supplierProductId` och
//
// ☠️ OCH TVÅ AV DEM VAR OSYNLIGA FÖR VARJE GRIND. Formen med inledande
// BOKSTAV (`D30-…`, `D51-…`) matchade inget av gatelibs två gamla alternativ,
// så varje svep rapporterade rent. En regel utan grind glider — och en grind
// som inte kan se den farligaste formen är värre än ingen, för den räknas
// som gjord. Se kommentaren vid `ARTNR` i gatelib.py för mätningen.
//
// ⚠️ INGEN ALLOWLIST, MED FLIT. Alla fyra är redigerade i arbetsträdet, så
// noll är det ärliga utgångsläget och varje ny träff är ett nytt fel. En
// allowlist hade varit en plats att lägga nästa läcka.
//
// ⚠️ Omfånget är `tools/polish-assets/` — poleringens EGNA artefakter, alltså
// det jag själv skapar varje runda och därmed tillväxtvägen. Att koden och
// testfixturerna längre in i repot bär riktiga nummer är ett äldre, statiskt
// problem som ligger på #222 och kräver ett beslut om historiken; den här
// grinden hindrar att högen växer.
//
// ⚠️ Testet KÖR gatelib.py i stället för att spegla mönstret i TS. En kopia
// hade varit precis den tvilling som `gate-kopior.test.ts` finns för att
// hindra, och den som glider tystast är den som ser ut att fungera.

import { describe, expect, it } from "vitest";
import { execFileSync } from "node:child_process";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const ROT = join(dirname(fileURLToPath(import.meta.url)), "..", "..");
const GRINDAR_DIR = join(ROT, "tools", "polish-gates");
const OMFANG = "tools/polish-assets";

/** Binära filer och hämtade live-sidor är inte våra egna texter. */
const HOPPA_OVER = /\/live\/|\.(jpe?g|png|gif|webp|ico|pdf|zip)$/i;

// ☠️ `-z` ÄR INTE EN OPTIMERING — UTAN DEN HOPPAR GRINDEN TYST ÖVER FILER.
// `git ls-files` CITERAR sökvägar med icke-ASCII och skriver dem med
// oktala escaper:
//
//     "tools/polish-assets/runda-l2-konstvaxter/L\303\204S-MIG.md"
//
// Den strängen finns inte på disk, så `os.path.isfile` blir falsk och filen
// läses aldrig. Uppmätt 2026-09-13: ELVA spårade filer föll bort, och alla
// elva var `LÄS-MIG.md` — rundornas körlogg, alltså den fil där jag skriver
// PROSA om produkterna och därmed det mest sannolika stället för att ett
// nummer ska slinka in. Grinden gick grön på ett planterat nummer i exakt
// en sådan fil.
//
// Samma klass som `Promise.allSettled` i media.ts och som SKU-kollen: ett
// tomt underlag ser för en grind ut precis som ett rent. `-z` ger råa
// NUL-separerade sökvägar och citerar aldrig.
function sparadeFiler(): string[] {
  const gitFiler = (args: string[]) =>
    execFileSync("git", args, { cwd: ROT, encoding: "utf-8", maxBuffer: 64 * 1024 * 1024 })
      .split("\0")
      .filter(Boolean);
  // ☠️ OSPÅRADE FILER RÄKNAS OCKSÅ. `git ls-files` utan flaggor ser bara det
  // som redan är i indexet — alltså INTE rundans nyskrivna körlogg, som är
  // just den fil där jag skriver PROSA om produkterna. Uppmätt 2026-09-13 på
  // runda M4: grinden gick grön på en `LÄS-MIG.md` den aldrig hade läst.
  //
  // Att den ändå täcker allt vid commit (då är filerna staged) är inget
  // försvar: en grind som är blind när man kör den för hand är blind precis
  // när man använder den. Samma klass som `-z`-buggen nedan och som SKU-kollen
  // — ett tomt underlag ser för en grind ut precis som ett rent.
  //
  // `--exclude-standard` gör att .gitignore fortfarande gäller, så hämtade
  // live-sidor och byggrester räknas inte.
  const filer = [
    ...gitFiler(["ls-files", "-z", OMFANG]),
    ...gitFiler(["ls-files", "-z", "--others", "--exclude-standard", OMFANG]),
  ].filter((f) => !HOPPA_OVER.test(f));
  // En citerad sökväg har tagit sig igenom om någon tar bort -z igen.
  expect(filer.filter((f) => f.startsWith('"'))).toEqual([]);
  return filer;
}

/** Kör gatelibs ARTNR mot filerna och returnerar "fil:rad träff". */
function lackage(filer: string[]): string[] {
  const program = [
    "import sys, re, io, json, os",
    `sys.path.insert(0, ${JSON.stringify(GRINDAR_DIR)})`,
    "from gatelib import ARTNR",
    "p = re.compile(ARTNR)",
    "ut = []",
    "for f in sys.stdin.read().split('\\0'):",
    "    if not f or not os.path.isfile(f):",
    "        continue",
    "    try:",
    "        t = io.open(f, encoding='utf-8').read()",
    "    except (UnicodeDecodeError, OSError):",
    "        continue",
    "    for m in p.finditer(t):",
    "        ut.append('%s:%d %s' % (f, t[:m.start()].count('\\n') + 1, m.group(0)))",
    "print(json.dumps(ut))",
  ].join("\n");
  const ut = execFileSync("python3", ["-c", program], {
    cwd: ROT,
    input: filer.join("\0"),
    encoding: "utf-8",
    maxBuffer: 64 * 1024 * 1024,
  });
  return JSON.parse(ut) as string[];
}

describe("poleringens artefakter läcker inga artikelnummer", () => {
  it("hittar minst en fil att granska", () => {
    // ☠️ Ett tomt underlag ser för en grind ut precis som ett rent. Samma
    // klass som SKU-kollen som itererade en tom lista och rapporterade
    // "inga krockar" utan att ha jämfört något.
    expect(sparadeFiler().length).toBeGreaterThan(100);
  });

  it("noll artikelnummer under tools/polish-assets/", () => {
    const fynd = lackage(sparadeFiler());
    expect(fynd).toEqual([]);
  });

  it("KAN fälla — ett planterat nummer hittas", () => {
    // Utan det här är föregående test omöjligt att skilja från en död grind.
    const program = [
      "import sys, re",
      `sys.path.insert(0, ${JSON.stringify(GRINDAR_DIR)})`,
      "from gatelib import ARTNR",
      "print('JA' if re.search(ARTNR, sys.stdin.read()) else 'NEJ')",
    ].join("\n");
    for (const plant of [
      "| Aosom-artikel | `83A-358V00DR` |",
      "Båda sidorna är Aosom (`aosom:D30-050V00CG`), så det här är",
      "Referens 921-672V00BG i raden.",
    ]) {
      const svar = execFileSync("python3", ["-c", program], {
        input: plant,
        encoding: "utf-8",
      }).trim();
      expect(svar).toBe("JA");
    }
  });
});
