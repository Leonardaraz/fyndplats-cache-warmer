// Testar att poleringsgrindens ORDLISTOR faktiskt gör sitt jobb — åt båda
// hållen.
//
// ☠️ VARFÖR BÅDA HÅLLEN. Runda G:s grind bar `gungstol(?=en\b)(?!)`, där
// `(?!)` misslyckas alltid: mönstret kunde aldrig träffa något, men såg
// komplett ut och räknades som gjort. En grind som säger "0 fynd" ser exakt
// likadan ut oavsett om texten är ren eller om grinden är död. Det enda som
// skiljer dem är ett test som kräver att den FÄLLER på något känt fel.
//
// Och andra hållet är lika viktigt: 2026-09-07 mättes tre mönster som bara
// fyrade på korrekt svenska ("Rund bädd" -> `und`, "i olika storlek",
// "grönt och gult"). Ett falsklarm som alltid fyrar lär mottagaren att sluta
// läsa, och då är även det äkta larmet borta — samma argument som mot att
// varna vid 48 h på token-förnyelsen.
//
// ⚠️ Testet KÖR gatelib.py, det speglar den inte. En TS-kopia av mönstren
// hade varit precis den tvilling som `gate-kopior.test.ts` finns för att
// hindra. Saknas python3 FÄLLER testet i stället för att hoppa över — en
// grind som hoppas över när binären saknas är ingen grind (samma beslut som
// i jq-syntax-testet).

import { describe, expect, it } from "vitest";
import { execFileSync } from "node:child_process";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const GRINDAR_DIR = join(
  dirname(fileURLToPath(import.meta.url)),
  "..",
  "..",
  "tools",
  "polish-gates",
);

/** Kör gatelib mot en text och returnerar grindnamnen som fyrade. */
function grinda(text: string): string[] {
  const program = [
    "import sys, re, json",
    `sys.path.insert(0, ${JSON.stringify(GRINDAR_DIR)})`,
    "from gatelib import GRINDAR",
    "t = sys.stdin.read()",
    "print(json.dumps(sorted({n for n, m in GRINDAR if re.search(m, t)})))",
  ].join("\n");
  const ut = execFileSync("python3", ["-c", program], { input: text, encoding: "utf-8" });
  return JSON.parse(ut) as string[];
}

/** Kör gatelib.tal() mot en text och returnerar talen sorterade. */
function talen(text: string): string[] {
  const program = [
    "import sys, json",
    `sys.path.insert(0, ${JSON.stringify(GRINDAR_DIR)})`,
    "from gatelib import tal",
    "print(json.dumps(sorted(tal(sys.stdin.read()))))",
  ].join("\n");
  const ut = execFileSync("python3", ["-c", program], { input: text, encoding: "utf-8" });
  return JSON.parse(ut) as string[];
}

describe("gatelib fäller det den ska", () => {
  const FALLER: Array<[string, string, string]> = [
    ["HUSMÄRKE", "husmärke i brödtext", "En rymlig koja från PawHut med tak."],
    ["ARTIKELNUMMER", "Aosoms artikelnummer", "Modellreferens: 844-657V90MX i tabellen."],
    ["FRAKTLAND", "leveransland i texten", "Varan skickas från Tyskland inom två dygn."],
    ["LEVERANTÖR", "leverantören som tredje part", "Leverantören anger 25-35 minuter."],
    ["TYSK REST", "tysk mening kvar", "Sofa mit Rückenlehne und Montage."],
    ["TYSK REST", "tyskt ord först i mening", "Maße: 45 x 40 cm."],
    ["STAVNING", "svenskt ord utan diakriter", "En fatolj med justerbar hojd."],
    ["STAVNING", "dansk falsk vän", "Ställ den på et plant gulv."],
    ["HOMOGLYF", "kyrilliskt t i granträ", "Stommen är i massivt granтrä."],
    ["EN-NORM UTAN KÄLLA", "utskriven EN-norm", "Tyget är testat enligt EN 1021."],
    // Runda H3: tyskans "kippen" läckte in i en rubrik ("Kippskydd") på en
    // sida som var på väg att publiceras. Ordet såg svenskt ut och passerade
    // varje grind — syskonprodukten i samma batch stavade det rätt.
    ["STAVNING", "tyskans kipp- i stället för tipp-", "Kippskydd i fyrhjulsbasen."],
    // Fordonsvokabulären lades till i H3. Utan den grindades rundorna H2–H3
    // med gungstolarnas ordlista, precis som H1 grindades med F2:s.
    ["TYSK REST", "fordonsord ur feeden", "Rutschauto mit Schiebestange und Hupe."],
    ["TYSK REST", "tyska specetiketter för fordon", "Belastbarkeit 25 kg, Stauraum unter dem Sitz."],
  ];

  it.each(FALLER)("[%s] %s", (grind, _vad, text) => {
    expect(grinda(text)).toContain(grind);
  });
});

describe("gatelib fyrar INTE på korrekt svenska", () => {
  // Alla tre första är verkliga meningar ur publicerade rundor. De fällde
  // grinden före 2026-09-07 och gör det inte längre.
  const RENA: Array<[string, string]> = [
    ["versalt svenskt ord som bär ett tyskt bindeord", "Rund bädd överst med uppbyggd kant."],
    ["obestämd singular av storlek", "Två hålor i olika storlek sitter under plattformen."],
    ["gult som färg", "Klösträdet är i grönt och gult med konstgjorda blad."],
    ["svenska ord som liknar tyska", "Metall och filter i botten, med hund och katt i rummet."],
    ["mått och vikt utan tyska rester", "Måtten är 48 x 48 x 192 cm och vikten 17,3 kg."],
    // ☠️ De fyra sista är fordonsordlistans egen risk. Orden nedan stavas
    // LIKA på svenska och tyska, så de får aldrig stå i listan — de kan inte
    // skilja språken åt och hade fällt varje polerad sida i katalogen.
    ["tippskydd stavat rätt", "Tippskydd i fyrhjulsbasen och breda hjul."],
    ["svenska pedaler, inte tyska Pedale", "Pedaler och skyddsbåge lossas var för sig."],
    ["ord som stavas lika på båda språken", "Material: plast och metall. Musik och ljus i ratten."],
    ["svensk ålders- och batteriangivelse", "Rekommenderad ålder 18–36 månader, 2 AA-batterier."],
  ];

  it.each(RENA)("%s", (_vad, text) => {
    expect(grinda(text)).toEqual([]);
  });
});

// ☠️ TUSENTALSAVSKILJAREN ÄR EN FORMATERING, INTE ETT NYTT TAL. Källan skriver
// tyskt "30.000 Stunden"; den svenska texten skriver "30 000 timmar". Före
// 2026-09-07 gav de {"30,000"} mot {"30", "000"}, och siffergrinden fällde en
// KORREKT text för att den bytt notation. Samma fälla på "1 100 lm".
//
// ⚠️ Och andra hållet är minst lika viktigt: sammanslagningen får inte slå
// ihop två OBEROENDE mått till ett tal som inte finns i någon källa. Då fäller
// grinden på fel ställe i stället för att inte fälla alls — och en grind som
// pekar åt fel håll kostar mer felsökning än en som är tyst.
describe("gatelib.tal() jämför notation, inte formatering", () => {
  const LIKA: Array<[string, string, string]> = [
    ["tusental med mellanslag mot punkt", "livslängd 30 000 timmar", "Lebensdauer: 30.000 Stunden"],
    ["ljusflöde med och utan mellanslag", "ger 1 100 lm", "Lichtleistung: 1100 lm"],
    ["decimalkomma mot decimalpunkt", "44,5 cm djup", "44.5 cm tief"],
  ];
  it.each(LIKA)("%s", (_vad, svenska, tyska) => {
    expect(talen(svenska)).toEqual(talen(tyska));
  });

  const SKILJS: Array<[string, string, string[]]> = [
    ["paketmått slås inte ihop", "Paketmått: 126 × 53 × 16 cm", ["126", "16", "53"]],
    ["tal med ord emellan slås inte ihop", "bär 2 kg och är 170 cm", ["170", "2"]],
    ["fyrsiffrigt efterled är inte ett tusental", "3000 K till 6500 K", ["3000", "6500"]],
  ];
  it.each(SKILJS)("%s", (_vad, text, vantat) => {
    expect(talen(text)).toEqual(vantat);
  });
});
