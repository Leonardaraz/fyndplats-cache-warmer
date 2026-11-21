// Run: node --test --experimental-strip-types lib/sok-minifierat.test.ts
//
// Sökmotorn SOM DEN BYGGS, inte som den står i källkoden (2026-11-20).
//
// ☠️ Webbläsaren kör det minifierade paketet, och där såg sökmotorns hetaste
// slinga annorlunda ut än i lib/search.ts. Bygget (Next:s swc) bakar in en
// funktion som anropas på ett enda ställe, som ett funktionsuttryck som
// anropas direkt. I slingan över katalogens namn blev det två nya
// funktionsobjekt per varunamn och varv (förfiltret och jämförelsen), och ett
// förvalt parametervärde blev en läsning ur `arguments`. Mätt med fyrdubbelt
// strypt processor var de två inbakade funktionerna de tyngsta posterna i
// webbläsarens profil, fast mätningarna i Node (som kör källkoden) inte såg
// dem.
//
// Anropen i de heta slingorna bär därför /*#__NOINLINE__*/, och de heta
// funktionerna har inga förvalda parametervärden. Det här provet minifierar
// lib/search.ts med samma verktyg som bygget och ser efter att slingorna
// anropar funktionerna i stället för att skapa dem.
import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";

type Swc = {
  loadBindings: () => Promise<unknown>;
  transform: (kod: string, val: object) => Promise<{ code: string }>;
  minify: (kod: string, val: object) => Promise<{ code: string }>;
};

// Det sökrutan använder (lib/sok-rankning.ts). Resten skakas bort ur paketet,
// och det är därför de heta funktionerna anropas på ett enda ställe.
const SOKRUTANS = ["byggOrdforrad", "forberedKatalogSteg", "kortOrd", "markeraTraffar", "markeringsord", "matchaKategorier", "normalize", "rankaMedInfo", "rankByName", "sokforslagINamn", "visaVarorFor"];

async function minifierad(): Promise<string> {
  const swc = createRequire(import.meta.url)("next/dist/build/swc") as Swc;
  await swc.loadBindings();
  const kalla = readFileSync(new URL("./search.ts", import.meta.url), "utf8")
    .replace(/^export (function|const|let) /gm, "$1 ")
    .replace(/^export (type|interface) /gm, "$1 ");
  const paket = JSON.parse(readFileSync(new URL("../package.json", import.meta.url), "utf8")) as { browserslist: string[] };
  const js = await swc.transform(`${kalla}\nexport { ${SOKRUTANS.join(", ")} };\n`, {
    filename: "search.ts",
    jsc: { parser: { syntax: "typescript" } },
    env: { targets: paket.browserslist },
    isModule: true,
  });
  return (await swc.minify(js.code, { compress: true, mangle: true, module: true })).code;
}

test("☠️ den byggda sökmotorn skapar inga funktioner i slingan över namnen", async () => {
  const kod = await minifierad();
  // Slingan över katalogens namn: förfiltret och jämförelsen är anrop.
  const slinga = /for\(let (\w+)=0;\1<\w+\.length;\1\+\+\)\{if\(!(\w+)\(\w+\.nagon,[^)]*\)\)continue;let \w+=([\w$]+)\(/.exec(kod);
  assert.ok(slinga, "hittar inte slingan över namnen i den minifierade koden");
  // Inget funktionsuttryck som anropas direkt efter förfiltrets villkor.
  assert.doesNotMatch(kod, /if\(!function\(/);
  assert.doesNotMatch(kod, /continue;let \w+=function\(/);
  // Jämförelsen per namn läser inte ur `arguments` (inga förvalda värden).
  const jamforelse = slinga[3].replace(/\$/g, "\\$");
  const kropp = new RegExp(`function ${jamforelse}\\(([^)]*)\\)\\{(.{0,400})`).exec(kod);
  assert.ok(kropp, "hittar inte jämförelsen per namn som egen funktion");
  assert.equal(kropp[1].split(",").length, 10, "jämförelsen ska ta alla tio parametrarna som vanliga parametrar");
  assert.doesNotMatch(kropp[2], /arguments/);
  // Ordjämförelsen (tokenQuality) och stavfelstabellen anropas, de skapas inte per sökord.
  assert.doesNotMatch(kod, /\?function\(\w+,\w+,\w+,\w+\)\{let \w+=function\(/);
  // Källan bär markeringarna (det är de som håller bygget ifrån inbakningen).
  const kalla = readFileSync(new URL("./search.ts", import.meta.url), "utf8");
  for (const anrop of ["kanTraffa(pm.nagon", "matchPrepared(namn[i]", "tokenQuality(u, nameNorm", "felINamn(lista, ni", "felPerOrd(lista, s", "kantFor(nameNorm, u", "iBarare(text, s, i)", "katSlag(u, uVikt", "poangFor(", "kategoriformFor(k.name)", "synonymStar(nameNorm, f", "stamStar(nameNorm, s"]) {
    assert.ok(kalla.includes(`/*#__NOINLINE__*/ ${anrop}`), `anropet ${anrop} saknar /*#__NOINLINE__*/`);
  }
  assert.doesNotMatch(kalla, /^function tokenQuality\([^)]*=[^)]*\)/m);
});
