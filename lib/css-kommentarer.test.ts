// ☠️ EN KOMMENTAR SOM SVÄLJER EN REGEL SYNS INTE — VARKEN I BYGGET ELLER PÅ SIDAN.
//
// Designsystemet (#491, 2026-08-22) bytte `box-shadow:0 0 0 3px` mot en token
// i hela app/globals.css. En av träffarna stod INUTI en kommentar, och
// ersättningen åt upp kommentarens slut och selektorn efter den:
//
//   före   …Tidigare låg här en yttre ring (box-shadow:0 0 0 3px) + … */
//          .varswatch.active{opacity:1;border-color:…}
//   efter  …Tidigare låg här en yttre ring (box-shadow:var(--e2){opacity:1;border-color:…}
//
// Kommentaren stängdes först sju rader längre ned, så allt däremellan var
// bortkommenterat i fem veckor: markeringen av vald variant, fokusringen,
// miniatyrens storlek och färgprickarna. Bygget var grönt och sidan
// renderade. Variantväljaren såg bara ut som om ingenting var valt, och på
// sidor med färgprickar syntes prickarna inte alls.
//
// Två grindar, och de mäter olika saker:
//   1. Ingen kommentar i butikens CSS får bära en regelkropp (`{ … : … }`).
//      Det är FORMEN på felet, vilken regel som än slukas nästa gång.
//   2. Variantväljarens regler finns UTANFÖR kommentarerna, med den
//      deklaration som gör dem synliga. Det är UTFALLET på just den del av
//      butiken där felet redan har kostat en gång.
//
// ☠️ Grind 2 letar efter DEKLARATIONEN, inte bara selektorn: raden
// `@media(prefers-reduced-motion:reduce){.varswatch.active{animation:none}}`
// stod kvar hela tiden, så en koll på `.varswatch.active{` hade gått grön på
// den trasiga filen.

import { test } from "node:test";
import assert from "node:assert/strict";
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative } from "node:path";

const ROT = process.cwd();
const HOPPA_OVER = new Set([".next", "node_modules", ".git", "wix-velo", "public", ".vercel"]);

function cssFiler(dir: string, traff: string[] = []): string[] {
  for (const namn of readdirSync(dir)) {
    if (HOPPA_OVER.has(namn)) continue;
    const sokvag = join(dir, namn);
    if (statSync(sokvag).isDirectory()) cssFiler(sokvag, traff);
    else if (namn.endsWith(".css")) traff.push(sokvag);
  }
  return traff;
}

const KOMMENTAR = /\/\*[\s\S]*?\*\//g;
/** En deklarationskropp: klammer, egenskap, kolon, värde, klammer. */
const REGELKROPP = /\{[^{}]*:[^{}]*\}/;

test("ingen kommentar i butikens CSS bär en regelkropp", () => {
  const filer = cssFiler(ROT);
  assert.ok(filer.length > 0, "hittade ingen CSS alls — grinden hade inte kunnat fälla");
  const fynd: string[] = [];
  for (const fil of filer) {
    const css = readFileSync(fil, "utf8");
    for (const m of css.matchAll(KOMMENTAR)) {
      if (!REGELKROPP.test(m[0])) continue;
      const rad = css.slice(0, m.index).split("\n").length;
      fynd.push(`${relative(ROT, fil)}:${rad}`);
    }
  }
  assert.deepEqual(fynd, []);
});

/** Reglerna variantväljaren i components/productview.tsx bygger på. */
const VARIANTREGLER: [string, RegExp][] = [
  ["vald variant markeras", /\.varswatch\.active\{[^}]*border-color:/],
  // Sedan 2026-10-01 har alla grupper samma vald-stil (ram + ljus ton), även textvalen.
  ["vald variant tonas", /\.varswatch\.active\{[^}]*background:/],
  ["tangentbordsfokus syns", /\.varswatch:focus-visible\{[^}]*outline:/],
  ["miniatyren har storlek", /\.varswatch-thumb\{[^}]*width:/],
  ["färgpricken har storlek", /\.varswatch-dot\{[^}]*width:/],
];

test("variantväljarens regler står utanför kommentarerna", () => {
  const css = readFileSync(join(ROT, "app", "globals.css"), "utf8").replace(KOMMENTAR, "");
  const saknas = VARIANTREGLER.filter(([, re]) => !re.test(css)).map(([namn]) => namn);
  assert.deepEqual(saknas, []);
});
