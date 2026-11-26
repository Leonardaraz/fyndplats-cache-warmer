// Run: node --test --experimental-strip-types 'lib/**/*.test.ts'
//
// `sizes` ska säga hur bred bilden VISAS. Provet räknar bredden ur layoutens
// egna tal (marginaler, mellanrum, antal kolumner i app/globals.css) och
// jämför med vad strängarna i lib/bild-sizes.ts ger, och väljer sedan
// srcset-kandidat som en webbläsare gör. En för liten bredd ger en suddig
// bild, en för stor en onödigt tung fil.
//
// ☠️ Sedan 2026-11-25 ska filen på datorn vara EXAKT så bred som rutan: en fil
// som är 2 % för bred ritas suddigare än en som är 40 % för bred (mätningen
// står i lib/bild-sizes.ts). Rutornas mått läses därför ur CSS-filen här, så
// att provet fäller den dag någon ändrar ett mellanrum eller en ram utan att
// ändra bildbredderna.
import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";
import {
  BILD_BREDDER_SMA,
  BILD_BREDDER_STORA,
  FAST_FRAN,
  HERO_SIZES,
  HJALTE_DATOR,
  KORT_DATOR,
  TILE_SIZES,
  kortSizes,
} from "./bild-sizes.ts";

const ROT = join(import.meta.dirname, "..");
const las = (...delar: string[]) => readFileSync(join(ROT, ...delar), "utf8");
/** Källkod utan kommentarer, så att ett prov inte träffar en förklaring. */
const kod = (...delar: string[]) =>
  las(...delar)
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .replace(/^\s*\/\/.*$/gm, "");

/** Bredden en webbläsare läser ur `sizes` vid en viss skärmbredd. */
function visad(sizes: string, vw: number): number {
  const langd = (uttryck: string) => {
    const js = uttryck
      .replace(/calc/g, "")
      .replace(/([\d.]+)vw/g, (_, n) => String((vw * Number(n)) / 100))
      .replace(/([\d.]+)px/g, "$1");
    assert.match(js, /^[\d\s.()*+\-/]+$/, uttryck);
    return Function(`"use strict";return (${js})`)() as number;
  };
  for (const del of sizes.split(",").map((s) => s.trim())) {
    const m = del.match(/^\(max-width:(\d+)px\)\s+(.*)$/);
    if (!m) return langd(del);
    if (vw <= Number(m[1])) return langd(m[2]);
  }
  throw new Error("ingen gren utan villkor");
}

// Kandidaterna i srcset: butikens egna (next.config.ts, speglade i lib/bild-sizes.ts).
const KANDIDATER: number[] = [...BILD_BREDDER_SMA, ...BILD_BREDDER_STORA];
/** Filen webbläsaren väljer: den minsta som har minst så många pixlar som rutan behöver. */
const vald = (sizes: string, vw: number, dpr: number) => KANDIDATER.find((k) => k >= visad(sizes, vw) * dpr - 1e-6)!;

// Layoutens tal, lästa ur app/globals.css.
const css = las("app", "globals.css");
const tal = (re: RegExp, vad: string): number => {
  const m = css.match(re);
  assert.ok(m, `hittar inte ${vad} i app/globals.css`);
  return Number(m[1]);
};
const SIDA = tal(/\n\.container\{max-width:(\d+)px;margin:0 auto;padding:0 26px\}/, ".container max-width");
const MARGINAL = 2 * tal(/\n\.container\{max-width:\d+px;margin:0 auto;padding:0 (\d+)px\}/, ".container padding");
const KORT_GAP = tal(/\n\.prodgrid\{display:grid;grid-template-columns:repeat\(4,1fr\);gap:\d+px (\d+)px\}/, ".prodgrid gap");
const KORT_GAP_LUFTIG = tal(/\n\.alla-prod \.prodgrid\{gap:\d+px (\d+)px\}/, ".alla-prod .prodgrid gap");
const KORT_RAM = tal(/@media\(min-width:881px\)\{\s*\.prod:not\(\.auction-card\):not\(\.blogg-kort\) \.pimg\{border:(\d+)px solid/, "kortets ram");
const PDP_GAP = tal(/\n\.pdp\{display:grid;grid-template-columns:1fr 1fr;gap:(\d+)px;/, ".pdp gap");
const HJALTE_RAM = tal(/\n\.gallery \.gmain\{[^}]*border:(\d+)px solid/, ".gmain ram");

const nara = (a: number, b: number, vad: string) => assert.ok(Math.abs(a - b) < 0.75, `${vad}: ${a} mot ${b}`);

test("☠️ rutornas mått på datorn är layoutens: ändras CSS:en ska bildbredderna ändras", () => {
  assert.equal(SIDA, FAST_FRAN);
  assert.equal(MARGINAL, 52);
  // Fyra kort i sidans bredd, minus ramen på var sida.
  assert.equal((SIDA - MARGINAL - 3 * KORT_GAP) / 4 - 2 * KORT_RAM, KORT_DATOR);
  // Två spalter på produktsidan, minus ramen runt bilden.
  assert.equal((SIDA - MARGINAL - PDP_GAP) / 2 - 2 * HJALTE_RAM, HJALTE_DATOR);
  for (const b of [KORT_DATOR, HJALTE_DATOR]) assert.ok(Number.isInteger(b), `${b} är inte ett heltal: då kan filen aldrig bli exakt`);
});

test("☠️ /alla-produkter och /rea: luftigt rutnät, och bilden ritas ändå pixel för pixel i kortets fil", () => {
  // Leonard 2026-11-25: de två sidorna ska ha sina 28 px i sidled. Bildrutan är
  // då 259 px, och kortets fil 265. Skalas filen ned till rutan blir den
  // suddig (2 % för bred: 93 % av den gamla bildens kantskärpa), och en egen
  // fil på 259 px återanvänds inte av Chrome när 265-filen redan ligger i
  // minnet. Därför ritas bilden i sin egen storlek och rutan skär bort kanten.
  assert.equal(KORT_GAP_LUFTIG, 28, ".alla-prod .prodgrid ska ha 28 px i sidled");
  const ruta = (SIDA - MARGINAL - 3 * KORT_GAP_LUFTIG) / 4 - 2 * KORT_RAM;
  assert.equal(ruta, 259);
  // Kanten som skärs bort är ett helt antal pixlar på var sida: annars hamnar
  // bilden mellan två pixlar, och en halv pixel fel är också en omskalning.
  const kant = (KORT_DATOR - ruta) / 2;
  assert.equal(kant, 3);
  assert.ok(Number.isInteger(kant) && kant > 0 && kant / KORT_DATOR < 0.02, "högst 2 % av bilden skärs bort i en kant");
  const regler = css.replace(/\/\*[\s\S]*?\*\//g, "");
  const m = regler.match(/@media\(min-width:(\d+)px\)\{\s*\.alla-prod \.prodgrid \.pimg-slide\{overflow:hidden\}\s*\.alla-prod \.prodgrid \.prod:not\(\.auction-card\):not\(\.blogg-kort\) \.pimg img\{([^}]*)\}\s*\}/);
  assert.ok(m, "regeln som ritar bilden i sin egen storlek saknas i app/globals.css");
  // Samma gräns som `sizes`: där sidan blir fast bred.
  assert.equal(Number(m[1]), FAST_FRAN);
  // next/image sätter bredd, höjd och läge som inline-stil: allt måste vara !important.
  assert.equal(
    m[2],
    `width:${KORT_DATOR}px!important;height:${KORT_DATOR}px!important;max-width:none!important;left:calc((100% - ${KORT_DATOR}px)/2)!important;top:calc((100% - ${KORT_DATOR}px)/2)!important;right:auto!important;bottom:auto!important`,
  );
  // ☠️ max-width:none: grundregeln img{max-width:100%} höll annars bilden på rutans bredd,
  // och den ritades 259 px bred, förskjuten 3 px (provet mot det första bygget fällde det).
  assert.match(regler, /\nimg\{display:block;max-width:100%\}/);
  // Rutan skär: utan overflow:hidden hade bilden stuckit ut över ramen.
  assert.match(regler, /\n\.prod \.pimg\{aspect-ratio:1;position:relative;overflow:hidden;/);
  // Bara de två sidorna har klassen, och bara de får regeln.
  const sidor: string[] = [];
  const ga = (mapp: string) => {
    for (const namn of readdirSync(join(ROT, mapp))) {
      const rel = join(mapp, namn);
      if (statSync(join(ROT, rel)).isDirectory()) ga(rel);
      else if (/\.tsx$/.test(namn) && /className="alla-prod"/.test(las(rel))) sidor.push(rel.replace(/\\/g, "/"));
    }
  };
  ga("app");
  ga("components");
  assert.deepEqual(sidor.sort(), ["app/alla-produkter/page.tsx", "app/rea/page.tsx"]);
  // Ingen annan regel ger rutnätet ett eget mellanrum på datorn. Reglerna för
  // smala fönster står inne i @media(max-width:…) och får ha sina egna.
  const utanMedia = regler.replace(/@media\([^)]*max-width[^{]*\{(?:[^{}]|\{[^{}]*\})*\}/g, "");
  const egna = [...utanMedia.matchAll(/([^{}]*\.prodgrid[^{}]*)\{([^}]*)\}/g)]
    .filter((x) => /(?:^|;)\s*(?:gap|column-gap|grid-template-columns)\s*:/.test(x[2]))
    .map((x) => `${x[1].trim()}{${x[2]}}`);
  assert.deepEqual(egna, [
    ".prodgrid{display:grid;grid-template-columns:repeat(4,1fr);gap:34px 20px}",
    ".alla-prod .prodgrid{gap:38px 28px}",
  ]);
  // Kortet har en enda sizes-sträng: den luftiga sidan ber om samma fil som alla andra.
  assert.equal(kortSizes.length, 1);
});

test("☠️ srcset har rutornas bredder i 1x och 2x, och next.config.ts har samma listor", () => {
  for (const b of [KORT_DATOR, HJALTE_DATOR]) {
    assert.ok(KANDIDATER.includes(b), `${b} saknas`);
    assert.ok(KANDIDATER.includes(2 * b), `${2 * b} saknas`);
  }
  assert.deepEqual(KANDIDATER, [...KANDIDATER].sort((a, b) => a - b), "bredderna står i storleksordning");
  assert.equal(new Set(KANDIDATER).size, KANDIDATER.length);
  // Next: de små bredderna ska alla vara mindre än den minsta stora.
  assert.ok(Math.max(...BILD_BREDDER_SMA) < Math.min(...BILD_BREDDER_STORA));
  const konf = kod("next.config.ts");
  const lista = (namn: string) => {
    const m = konf.match(new RegExp(`${namn}: \\[([\\d, ]+)\\]`));
    assert.ok(m, `${namn} saknas i next.config.ts`);
    return m[1].split(",").map((s) => Number(s.trim()));
  };
  assert.deepEqual(lista("imageSizes"), [...BILD_BREDDER_SMA]);
  assert.deepEqual(lista("deviceSizes"), [...BILD_BREDDER_STORA]);
});

test("☠️ på datorn väljs en fil som är exakt så bred som rutan, i 1x och 2x", () => {
  // Från 1180 px är sidan fast: en bärbar, en stor skärm och en surfplatta på tvären.
  for (const vw of [1180, 1280, 1366, 1440, 1536, 1728, 1920, 2560, 3840]) {
    for (const dpr of [1, 2]) {
      assert.equal(vald(kortSizes(true), vw, dpr), KORT_DATOR * dpr, `kort ${vw}@${dpr}`);
      assert.equal(vald(kortSizes(false), vw, dpr), KORT_DATOR * dpr, `kort ensam ${vw}@${dpr}`);
      assert.equal(vald(HERO_SIZES, vw, dpr), HJALTE_DATOR * dpr, `hjälte ${vw}@${dpr}`);
    }
  }
});

test("mellan 125 och 175 % skalning väljs närmaste större fil, aldrig en mindre", () => {
  for (const dpr of [1.25, 1.5, 1.75, 2.5, 3]) {
    for (const [namn, s, ruta] of [["kort", kortSizes(true), KORT_DATOR], ["hjälte", HERO_SIZES, HJALTE_DATOR]] as const) {
      const fil = vald(s, 1536, dpr);
      assert.ok(fil >= ruta * dpr, `${namn}@${dpr}: ${fil} px för ${ruta * dpr}`);
      assert.ok(fil <= ruta * dpr * 1.65, `${namn}@${dpr}: ${fil} px är mer än 65 % för mycket`);
    }
  }
});

test("hjältebilden: sidans bredd minus marginalen på mobil, spalten mellan 761 och 1179 px", () => {
  // Mobilen: rutan är sidans bredd minus marginalen och ramen. Strängen säger
  // två pixlar mer (ramen), aldrig mindre.
  for (const vw of [360, 390, 414, 430, 760]) {
    const ruta = vw - MARGINAL - 2 * HJALTE_RAM;
    assert.ok(visad(HERO_SIZES, vw) >= ruta && visad(HERO_SIZES, vw) - ruta <= 2, `hjälte ${vw}`);
  }
  // Två spalter: (bredden − marginalen − mellanrummet) / 2, minus ramen.
  for (const vw of [761, 800, 890, 1000, 1100, 1179]) nara(visad(HERO_SIZES, vw), (vw - MARGINAL - PDP_GAP) / 2 - 2 * HJALTE_RAM, `hjälte ${vw}`);
  assert.equal(visad(HERO_SIZES, 1180), HJALTE_DATOR);
  assert.equal(visad(HERO_SIZES, 1440), HJALTE_DATOR);
});

test("bildrutorna: 36 % av galleriets bredd på mobil (.gtile)", () => {
  for (const vw of [360, 390, 430]) nara(visad(TILE_SIZES, vw), (vw - MARGINAL) * 0.36, `ruta ${vw}`);
  assert.equal(visad(TILE_SIZES, 1440), 180);
});

test("kortet: rutnätets kolumnbredd i varje brytpunkt", () => {
  // .prodgrid.listgrid upp till 540 px: inom sidans marginal, 12 px mellanrum.
  const listGap = tal(/\.prodgrid\.listgrid\{grid-template-columns:repeat\(2,1fr\);gap:\d+px (\d+)px\}/, ".prodgrid.listgrid gap");
  for (const vw of [360, 390, 414, 430, 540]) nara(visad(kortSizes(true), vw), (vw - MARGINAL - listGap) / 2, `två kort ${vw}`);
  // Ett kort i full bredd.
  nara(visad(kortSizes(false), 390), 390 - MARGINAL, "ett kort 390");
  // Två kort med 20 px mellanrum, upp till 900 px. Från 881 px har kortet ram,
  // och strängen säger då två pixlar mer än rutan, aldrig mindre.
  for (const vw of [600, 768, 880]) nara(visad(kortSizes(true), vw), (vw - MARGINAL - KORT_GAP) / 2, `två kort ${vw}`);
  // Fyra kort med ram, upp till 1179 px, och sedan fast bredd.
  for (const vw of [901, 1000, 1100, 1179]) nara(visad(kortSizes(true), vw), (vw - MARGINAL - 3 * KORT_GAP) / 4 - 2 * KORT_RAM, `fyra kort ${vw}`);
  for (const vw of [1180, 1181, 1440, 1920, 2560]) assert.equal(visad(kortSizes(true), vw), KORT_DATOR);
});

test("/alla-produkter och /rea: samma kort, men tre i bredd mellan 761 och 900 px", () => {
  // Rutnätet där har egna regler i smala fönster. Strängen är kortets vanliga,
  // och den får säga mer än rutan men aldrig märkbart mindre.
  assert.match(css, /@media\(max-width:900px\)\{\.alla-prod \.prodgrid\{grid-template-columns:repeat\(3,1fr\);gap:28px 20px\}\}/);
  assert.match(css, /@media\(max-width:760px\)\{\.alla-prod \.prodgrid\{grid-template-columns:repeat\(2,1fr\);gap:24px 16px\}\}/);
  const s = kortSizes(true);
  for (const vw of [761, 800, 900]) assert.ok(visad(s, vw) >= (vw - MARGINAL - 2 * 20) / 3, `tre kort ${vw}`);
  // Två kort med 16 px mellanrum: rutan är 2 px bredare än strängen säger (0,7 %).
  for (const vw of [600, 760]) assert.ok((vw - MARGINAL - 16) / 2 - visad(s, vw) <= 2, `två kort ${vw}`);
  // Fyra kort från 901 px, med 28 px mellanrum: rutan är 6 px smalare än
  // strängen säger. Filen blir aldrig för liten, och högst 6 px för stor.
  for (const vw of [901, 1000, 1179]) {
    const ruta = (vw - MARGINAL - 3 * KORT_GAP_LUFTIG) / 4 - 2 * KORT_RAM;
    assert.ok(visad(s, vw) >= ruta && visad(s, vw) - ruta <= 6.01, `fyra kort ${vw}: ${visad(s, vw)} mot ${ruta}`);
  }
});

test("telefonen får aldrig en för liten fil, och en lättare än förut", () => {
  // iPhone 390 px i 3x: hjälten 1084w, bildrutorna 384w.
  assert.equal(vald(HERO_SIZES, 390, 3), 1084);
  assert.equal(vald(TILE_SIZES, 390, 3), 384);
  // Kortet på telefon: rutan är 163 px på en iPhone (390 px), 489 px i 3x.
  // Förut valdes 640w, nu 530w: 31 % färre pixlar.
  assert.equal(vald(kortSizes(true), 390, 3), 530);
  assert.equal(vald(kortSizes(true), 430, 3), 640);
  assert.equal(vald(kortSizes(true), 414, 2), 384);
  // Aldrig färre pixlar än rutan gånger skärmens täthet.
  for (const [vw, dpr] of [[360, 2], [360, 3], [390, 3], [412, 2.625], [414, 2], [430, 3], [768, 2], [1024, 2], [1180, 2], [1440, 1], [1440, 2], [1920, 1]] as const) {
    for (const [namn, s] of [["hjälte", HERO_SIZES], ["ruta", TILE_SIZES], ["kort", kortSizes(true)], ["kort ensam", kortSizes(false)]] as const) {
      assert.ok(vald(s, vw, dpr) >= Math.floor(visad(s, vw) * dpr), `${namn} ${vw}@${dpr}`);
    }
  }
});

test("de första korten hämtas med hög prioritet (next/image sätter den inte själv)", () => {
  // Listsidornas största bild är första kortets. `priority` ger förladdning och
  // eager, men inte fetchpriority=high: på /kategori/fatoljer stod fyra
  // förladdningslänkar utan attributet, och bilderna köade efter skripten.
  const kort = readFileSync(new URL("../components/card-gallery.tsx", import.meta.url), "utf8");
  assert.match(kort, /priority=\{priority\}[\s\S]{0,600}fetchPriority=\{priority \? "high" : undefined\}/);
});

test("Next hittar en vw-term i varje sträng och stryker de minsta kandidaterna", () => {
  // Samma regex som next/dist/shared/lib/get-img-props.js. Minsta termen
  // avgör vilka kandidater som skrivs ut: kortet börjar på 265w, hjälten på 384w.
  const minst = (s: string) => Math.min(...[...s.matchAll(/(^|\s)(1?\d?\d)vw/g)].map((m) => Number(m[2])));
  assert.equal(minst(HERO_SIZES), 50);
  assert.equal(minst(TILE_SIZES), 15);
  assert.equal(minst(kortSizes(true)), 25);
  assert.equal(minst(kortSizes(false)), 25);
  const skrivs = (s: string) => KANDIDATER.filter((k) => k >= BILD_BREDDER_STORA[0] * minst(s) * 0.01);
  assert.equal(skrivs(kortSizes(true))[0], KORT_DATOR);
  assert.equal(skrivs(HERO_SIZES)[0], 384);
});

test("☠️ en bild i exakt storlek zoomar inte vid hover", () => {
  // scale(1.045) på kortets bild och scale(1.07) på huvudbilden skalade om
  // filen så att den blev suddigare än sina grannar (mätt 2026-11-25).
  const regler = css.replace(/\/\*[\s\S]*?\*\//g, "");
  assert.doesNotMatch(regler, /\.prod:hover \.pimg-main[^{]*\{[^}]*transform:scale/);
  assert.doesNotMatch(regler, /\.prod:hover \.pimg-alt[^{]*\{[^}]*transform:scale/);
  assert.doesNotMatch(regler, /\.gallery \.gmain:hover img\{[^}]*transform:scale/);
  // Kortet svarar ändå på pekaren: plattan lyfter.
  assert.match(regler, /\.prod:not\(\.auction-card\):hover \.pimg\{transform:translateY\(-4px\)/);
});

test("☠️ skärpningen står i laddarna, inte i tightFillUrl", () => {
  // Båda laddarna lägger på Wix skärpning (lib/wix-crop.ts)…
  const global = kod("lib", "image-loader.ts");
  assert.match(global, /src\.slice\(0, i\) \+ medSkarpning\(svans\)/);
  assert.match(global, /\/v1\/fit\/w_\$\{width\},h_\$\{width\},q_\$\{quality \|\| 72\},\$\{WIX_SKARPNING\}\/file\.webp/);
  assert.match(kod("lib", "hjalte-loader.ts"), /return medSkarpning\(tightFillUrl\(src, width, width, quality \|\| 72\)\);/);
  // …men adressbyggaren gör det inte: den används också i flöden, mejl,
  // delningsbilder och kassans småbilder, som inte ska byta adress.
  assert.doesNotMatch(kod("lib", "wix-image.ts"), /usm_|medSkarpning|WIX_SKARPNING/);
});

test("☠️ bara kortet och huvudbilden hämtas i de exakta bredderna 530 och 542", () => {
  // Alla andra bilder går genom den globala laddaren och får 640 px för 530w
  // och 542w, som förut: en bild som beskärs i sin ruta behöver fler pixlar än
  // sizes säger (bloggkorten förstorades 1,16 gånger), och Unsplash-fotona har
  // ingen skärpning.
  const global = kod("lib", "image-loader.ts");
  assert.match(global, /const SOM_FORR: Record<number, number> = \{ 530: 640, 542: 640 \};/);
  assert.match(global, /export default function fyndImageLoader\(\{ src, width: begard, quality \}: ImageLoaderProps\): string \{\s+const width = SOM_FORR\[begard\] \?\? begard;/);
  // Tabellen täcker varje bredd som finns för en exakt ruta och inte ersätter
  // en av Nexts egna (256 → 265 och 1080 → 1084 är aldrig mindre än förut).
  const NEXTS = [32, 48, 64, 96, 128, 256, 384, 640, 750, 828, 1080, 1200, 1920, 2048, 3840];
  const nya = KANDIDATER.filter((k) => !NEXTS.includes(k));
  assert.deepEqual(nya, [KORT_DATOR, 2 * KORT_DATOR, HJALTE_DATOR, 2 * HJALTE_DATOR]);
  assert.ok(KORT_DATOR >= 256 && KORT_DATOR < 384 && 2 * HJALTE_DATOR >= 1080 && 2 * HJALTE_DATOR < 1200);
  // Kortet har huvudbildens laddare på alla sina bilder och i förladdningen.
  const kort = kod("components", "card-gallery.tsx");
  assert.equal(kort.split("loader={wixMainLoader}").length - 1, 3, "huvudbilden, andra bilden och svepets bilder");
  assert.match(kort, /getImageProps\(\{ src, alt: "", fill: true, sizes: kortSizes\(tvaKolumner\), loader: wixMainLoader \}\)/);
  assert.match(kod("components", "kort-andra-bild.tsx"), /src=\{src\}\s+loader=\{loader\}/);
  // Fyndauktionens kort har flytande bredd och ska ha den globala laddaren.
  assert.doesNotMatch(kod("components", "auction-card.tsx"), /wixMainLoader/);
});
