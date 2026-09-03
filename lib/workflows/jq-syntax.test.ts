// ☠️ jq tillåter INTE åäö i naken fältåtkomst.
//
// VARFÖR DET HÄR TESTET FINNS. `polish-mapping.yml` läste svaret med
// `jq -r '.okändaVariantIds | length'`. Det är inte ett tomt svar — det är ett
// SYNTAXFEL: jq:s grammatik tillåter bara `[A-Za-z_][A-Za-z0-9_]*` efter
// punkten, så `ä` avbryter tolkningen med
//
//   jq: error: syntax error, unexpected INVALID_CHARACTER … at <top-level>
//
// Raden låg EFTER skrivningen, så varje `stampla`-körning gjorde sitt jobb,
// skrev mappningen, och dog sedan på rapporteringen. GitHub mejlade "Run
// failed" för sexton lyckade körningar på tolv timmar (2026-09-01).
//
// Det är samma familj som husets vanligaste bugg, men speglad: i stället för
// ett misslyckande ingen kan se, ett larm som alltid fyrar. Båda slutar med
// att mottagaren slutar läsa mejlen — och då är även det äkta larmet borta.
//
// Övriga svenska fältnamn i samma fil var korrekt citerade
// (`.["stämmer"]`, `.["fält"]`, `.["ändrat"]`), så det gick inte att se genom
// att läsa filen: nitton rader rätt och två fel ser likadana ut. Därför en
// grind i stället för ögon — samma skäl som `store-access-audit.test.ts` och
// `backend.test.ts`.
//
// Statisk kontroll, inte `jq -n`: en grind som hoppas över när binären saknas
// är ingen grind.

import { describe, expect, it } from "vitest";
import { readdirSync, readFileSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { join } from "node:path";

const WORKFLOW_KATALOG = join(__dirname, "..", "..", ".github", "workflows");

/**
 * Naken fältåtkomst vars namn bär ett tecken utanför ASCII.
 *
 * Punkt, sedan ett giltigt STARTtecken, sedan en löpa av bokstäver/siffror där
 * `\p{L}` även fångar `å`, `ä`, `ö`. Går löpan utanför ASCII är programmet
 * ogiltigt. `.["namn"]` matchar aldrig — där följer `[` på punkten, och
 * hakparentes-åtkomst är just det korrekta sättet att skriva namnet.
 */
const NAKEN_FÄLTÅTKOMST = /\.([A-Za-z_][\p{L}\p{N}_]*)/gu;
const ICKE_ASCII = /[^\x00-\x7F]/;

export type Fynd = { rad: number; fält: string; text: string };

/**
 * Hittar jq-fältåtkomster som inte kan kompileras. Ren funktion — exporterad
 * så den kan testas mot både den historiska buggen och den lagade raden.
 *
 * Bara rader som faktiskt anropar `jq` granskas. Svensk prosa i kommentarer
 * (`.okända rader`) ska inte fälla ett test om jq-syntax.
 */
export function ogiltigaJqFält(källa: string): Fynd[] {
  const fynd: Fynd[] = [];

  källa.split("\n").forEach((rad, i) => {
    if (!/\bjq\b/.test(rad)) return;
    // Kommentarrader beskriver ofta buggen de skyddar mot — de kör ingenting.
    if (/^\s*#/.test(rad.trimStart())) return;

    for (const m of rad.matchAll(NAKEN_FÄLTÅTKOMST)) {
      if (ICKE_ASCII.test(m[1])) {
        fynd.push({ rad: i + 1, fält: m[1], text: rad.trim() });
      }
    }
  });

  return fynd;
}

describe("ogiltigaJqFält — detektorn själv", () => {
  it("☠️ fäller den historiska raden ur polish-mapping.yml", () => {
    const f = ogiltigaJqFält(`okanda=$(echo "$svar" | jq -r '.okändaVariantIds | length')`);
    expect(f).toHaveLength(1);
    expect(f[0].fält).toBe("okändaVariantIds");
  });

  it("☠️ släpper igenom den lagade raden — hakparentes är rätt form", () => {
    expect(ogiltigaJqFält(`jq -r '.["okändaVariantIds"] | length'`)).toEqual([]);
    expect(ogiltigaJqFält(`jq -r '.prisgrind.["stämmer"]'`)).toEqual([]);
    expect(ogiltigaJqFält(`jq -r '.["ändrat"] | join(", ")'`)).toEqual([]);
    // Escapad form inuti en dubbelciterad shell-sträng (review-translate.yml).
    expect(ogiltigaJqFält(`jq -r '.[\\"iKön\\"]' <<<"$body"`)).toEqual([]);
  });

  it("rena ASCII-fält är alltid giltiga", () => {
    expect(ogiltigaJqFält(`jq -r '.ok'`)).toEqual([]);
    expect(ogiltigaJqFält(`jq -r '.prisgrind.landedCostSek'`)).toEqual([]);
    expect(ogiltigaJqFält(`jq -r '.fel[]? | "\\(.taskId)"'`)).toEqual([]);
  });

  it("rader utan jq granskas inte — svensk prosa är inte ett jq-program", () => {
    expect(ogiltigaJqFält(`echo "se .okända rader i loggen"`)).toEqual([]);
    expect(ogiltigaJqFält(`          # Las .okändaVariantIds ur svaret`)).toEqual([]);
  });

  it("flera fel på samma rad rapporteras var för sig", () => {
    const f = ogiltigaJqFält(`jq -r '.förra + .nästa'`);
    expect(f.map((x) => x.fält)).toEqual(["förra", "nästa"]);
  });
});

describe("☠️ ingen workflow har ett jq-program som inte går att kompilera", () => {
  const filer = readdirSync(WORKFLOW_KATALOG).filter((f) => f.endsWith(".yml") || f.endsWith(".yaml"));

  it("det finns workflows att granska (annars mäter testet ingenting)", () => {
    expect(filer.length).toBeGreaterThan(5);
    expect(filer).toContain("polish-mapping.yml");
  });

  it.each(filer)("%s", (fil) => {
    const fynd = ogiltigaJqFält(readFileSync(join(WORKFLOW_KATALOG, fil), "utf8"));
    expect(
      fynd,
      `jq tillåter bara [A-Za-z_][A-Za-z0-9_]* i naken fältåtkomst. Skriv `
        + `.["namnet"] i stället — annars är det ett SYNTAXFEL, inte ett tomt svar.\n`
        + fynd.map((f) => `  ${fil}:${f.rad}  .${f.fält}\n    ${f.text}`).join("\n"),
    ).toEqual([]);
  });
});

// ---------------------------------------------------------------------------
// Andra lagret: kompilera programmen, inte bara granska fältnamnen.
// ---------------------------------------------------------------------------
//
// ☠️ ANDRA GÅNGEN ETT JQ-SYNTAXFEL NÅDDE DRIFT (2026-09-02). Först
// `.okändaVariantIds`, som checken ovan fångar. Sedan det här, i aosom-sync:
//
//     jq -r '... join(\", \") ...'
//
// Inuti en ENKELCITERAD shell-sträng är backslashen bokstavlig — skalet lämnar
// den ifred, och jq ser `\` där ett uttryck ska stå. Programmet kompilerar
// aldrig. Fältnamns-checken ovan kan inte se det: fälten är ren ASCII.
//
// Felet uppstod för att uttrycket testades i EN form och levererades i en
// ANNAN: kört för hand i skalet utan escaper, skrivet till filen med. Det är
// hela lärdomen — validera artefakten som skickas, inte en variant av den.
// Därför läses programmen HÄR ur workflow-filerna och skickas till jq.
//
// Shell-semantiken gör extraktionen exakt: en enkelciterad sträng kan inte
// innehålla ett enkelfnutt, så nästa `'` avslutar alltid programmet.
const JQ_PROGRAM = /\bjq\s+(?:-[A-Za-z]+\s+)*'([^']*)'/g;

export function jqProgram(källa: string): string[] {
  return [...källa.matchAll(JQ_PROGRAM)].map((m) => m[1]);
}

/** jq skiljer på kompileringsfel (3) och körningsfel (5). Bara 3 är vårt. */
function kompilerar(program: string): { ok: boolean; fel: string } {
  const r = spawnSync("jq", ["-n", program], { encoding: "utf8" });
  if (r.error) return { ok: true, fel: "" }; // hanteras av tillgänglighetstestet
  if (r.status === 3) return { ok: false, fel: (r.stderr || "").trim().split("\n")[0] };
  return { ok: true, fel: "" };
}

describe("☠️ varje jq-program i en workflow går att kompilera", () => {
  const filer = readdirSync(WORKFLOW_KATALOG).filter((f) => f.endsWith(".yml") || f.endsWith(".yaml"));

  it("jq finns — annars är det här ingen grind", () => {
    const r = spawnSync("jq", ["--version"], { encoding: "utf8" });
    expect(
      r.error === undefined && r.status === 0,
      "jq saknas i miljön. Den här grinden HOPPAS INTE ÖVER — en grind som "
        + "tystnar när binären fattas är ingen grind. Installera jq.",
    ).toBe(true);
  });

  it("extraktionen plockar ut hela det enkelciterade programmet", () => {
    expect(jqProgram(`x=$(echo "$b" | jq -r '.ok // false')`)).toEqual([".ok // false"]);
    expect(jqProgram(`jq -r '.a' && jq -sRr '.b'`)).toEqual([".a", ".b"]);
    // Flerradiga program (aosom-sync grupperar fel över sju rader).
    expect(jqProgram("jq -r '\n  .a\n  | .b\n'")).toEqual(["\n  .a\n  | .b\n"]);
  });

  it("☠️ fäller den historiska raden: escapade fnuttar i enkelciterad jq", () => {
    const [p] = jqProgram(`jq -r '$e | map(.sku) | join(\", \")'`);
    expect(kompilerar(p).ok).toBe(false);
  });

  it.each(filer)("%s", (fil) => {
    const trasiga = jqProgram(readFileSync(join(WORKFLOW_KATALOG, fil), "utf8"))
      .map((p) => ({ p, ...kompilerar(p) }))
      .filter((x) => !x.ok);
    expect(
      trasiga,
      `jq kunde inte kompilera programmet. Kör det som det STÅR I FILEN, inte `
        + `en handskriven variant — det var precis den skillnaden som släppte `
        + `igenom felet 2026-09-02.\n`
        + trasiga.map((x) => `  ${fil}\n    ${x.p.slice(0, 200)}\n    → ${x.fel}`).join("\n"),
    ).toEqual([]);
  });
});

// ☠️ EN WORKFLOW SOM INTE GÅR ATT LÄSA REGISTRERAS ALDRIG — OCH SYNS INGENSTANS.
//
// `aosom-feed-search.yml` (2026-09-03) hade ett jq-program vars format-sträng
// bröts över flera rader. Fortsättningsraderna började i KOLUMN 1, vilket
// avslutar YAML:ens `run: |`-blockskalär mitt i steget. Filen blev ogiltig
// YAML, GitHub kunde inte läsa den, och `workflow_dispatch` registrerades
// aldrig. Symtomet var
//
//   failed to run workflow: Workflow does not have 'workflow_dispatch' trigger
//
// på en fil som demonstrativt HAR den triggern — så felsökningen gick åt fel
// håll ("indexeringsfördröjning") i flera minuter.
//
// Testerna ovan var GRÖNA hela tiden. De läser jq-programmen ur filtexten men
// parsar aldrig YAML:en, så en fil GitHub inte kan läsa passerar dem galant.
// Samma familj som resten av huset: ett misslyckande ingen kan se.
//
// Ingen YAML-parser finns installerad, och en grind som hoppas över när ett
// beroende saknas är ingen grind (samma skäl som `jq -n` valdes bort ovan).
// Kontrollen är därför strukturell och riktad mot just det här felet: i en
// GitHub-workflow är ALLT utom en handfull toppnycklar indenterat, så en rad
// som börjar i kolumn 1 har med stor sannolikhet fallit ur ett block.
/**
 * Rader som fallit ur en `run: |`-blockskalär.
 *
 * En blockskalär slutar vid FÖRSTA raden som är mindre indenterad än blockets
 * innehåll. Är den raden inte en giltig ny nyckel på förälderns nivå blir
 * YAML:en ogiltig.
 *
 * ☠️ FÖRSTA VERSIONEN AV DEN HÄR GRINDEN VAR FÖR SMAL. Den letade bara efter
 * rader i KOLUMN 1, eftersom det var så `aosom-feed-search.yml` gick sönder.
 * Men `aosom-remap.yml` hade exakt samma fel med två stegs indrag — mitt i ett
 * jq-program — och passerade galant. Den workflowen hade aldrig gått att
 * starta sedan den skapades, och ingen märkte det: den skrevs, testades grönt
 * och rapporterades klar. Grinden mäter därför indrag mot blocket, inte mot
 * kolumn 1.
 */
export function raderSomFallitUrBlock(text: string): string[] {
  const rader = text.split("\n");
  const fel: string[] = [];
  const indrag = (r: string) => /^(\s*)/.exec(r)![1].length;

  for (let i = 0; i < rader.length; i++) {
    const m = /^(\s*)(?:-\s+)?[A-Za-z_][\w-]*:\s*[|>][-+]?\d*\s*$/.exec(rader[i]);
    if (!m) continue;
    const nyckelIndrag = m[1].length;

    let j = i + 1;
    while (j < rader.length && rader[j].trim() === "") j++;
    if (j >= rader.length) break;
    const blockIndrag = indrag(rader[j]);
    if (blockIndrag <= nyckelIndrag) continue;

    for (; j < rader.length; j++) {
      const rad = rader[j];
      if (rad.trim() === "") continue;
      if (indrag(rad) >= blockIndrag) continue;
      // Dedent. Legitimt slut på blocket = ny nyckel eller listpost på
      // förälderns nivå. Allt annat är en rad som ramlat ur.
      const slutarBlocket = indrag(rad) <= nyckelIndrag
        && /^\s*(?:-\s+)?[A-Za-z_][\w-]*:|^\s*-\s/.test(rad);
      if (!slutarBlocket) fel.push(rad);
      break;
    }
  }
  return fel;
}

describe("☠️ ingen workflow har en rad som fallit ur sitt block", () => {
  const filer = readdirSync(WORKFLOW_KATALOG).filter((f) => f.endsWith(".yml") || f.endsWith(".yaml"));

  it("hittar alla workflow-filer", () => {
    expect(filer.length).toBeGreaterThan(5);
  });

  it("☠️ fäller det historiska felet: jq-format-sträng bruten till kolumn 1", () => {
    const trasig = [
      "jobs:",
      "  sok:",
      "    steps:",
      "      - run: |",
      `          echo "$svar" | jq -r '"Fraga: \\(.fraga)`,
      "Rader i feeden: \\(.raderILista)",
      `"'`,
    ].join("\n");
    // En rapport per block räcker — den första dedenten är där YAML:en bröts.
    expect(raderSomFallitUrBlock(trasig)).toEqual(["Rader i feeden: \\(.raderILista)"]);
  });

  it("släpper igenom en frisk fil", () => {
    expect(raderSomFallitUrBlock("name: X\non:\n  workflow_dispatch:\njobs:\n  a:\n    steps: []\n")).toEqual([]);
  });

  it.each(filer)("%s", (fil) => {
    const fallna = raderSomFallitUrBlock(readFileSync(join(WORKFLOW_KATALOG, fil), "utf8"));
    expect(
      fallna,
      `Rader som börjar i kolumn 1 utan att vara en toppnyckel. En sådan rad `
        + `avslutar en \`run: |\`-blockskalär, gör filen till ogiltig YAML och `
        + `får GitHub att svara "Workflow does not have 'workflow_dispatch' `
        + `trigger" på en fil som har den. Skriv radbrytningar i jq som \\n.\n`
        + fallna.map((r) => `  ${fil}: ${r.slice(0, 120)}`).join("\n"),
    ).toEqual([]);
  });
});
