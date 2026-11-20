// Run: node --test --experimental-strip-types lib/pdp-val-bild.test.ts
//
// Valets bild när adressen pekar på ett annat val än förvalet (?variant=,
// ?farg=). Reglerna ska följa väljaren i components/productview.tsx: visar
// sidans tidiga skript en annan bild än den väljaren sedan väljer blinkar fel
// färg förbi.
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { valBilder, valBildSkript } from "./pdp-val-bild.ts";
import { colorKeysOf } from "./variant-color-image.ts";
import { flestaHarBild } from "./variant-lage.ts";

const las = (...delar: string[]) => readFileSync(join(import.meta.dirname, "..", ...delar), "utf8");
const bild = (n: string) => `https://static.wixstatic.com/media/b379ce_${n.padEnd(32, "0")}~mv2.jpg/v1/fit/w_1600,h_1600,q_90/f`;
const rakna = (p: Parameters<typeof valBilder>[0]) => valBilder(p, colorKeysOf, flestaHarBild);

describe("en axel: varje val har sin bild", () => {
  const val = [
    { label: "Svart", image: bild("a"), variantId: "v-svart", inStock: true },
    { label: "Ljusgrå", image: bild("b"), variantId: "v-gra", inStock: true },
    { label: "Vit", image: bild("c"), variantId: "v-vit", inStock: false },
  ];

  it("varje variant pekar på sin bild", () => {
    const vb = rakna({ options: { choices: val } });
    assert.deepEqual(vb.bilder, [bild("a"), bild("b"), bild("c")]);
    assert.deepEqual(vb.variant, { "v-svart": 0, "v-gra": 1, "v-vit": 2 });
  });

  it("färgen pekar på valet som bär den, också i en sammansättning", () => {
    const vb = rakna({ options: { choices: val } });
    assert.equal(vb.farg["svart"], 0);
    assert.equal(vb.farg["grå"], 1);
    assert.equal(vb.farg["vit"], 2);
  });

  it("☠️ ett val i lager vinner över ett slutsålt med samma färg", () => {
    const vb = rakna({ options: { choices: [
      { label: "Blå, liten", image: bild("a"), variantId: "1", inStock: false },
      { label: "Blå, stor", image: bild("b"), variantId: "2", inStock: true },
      { label: "Röd", image: bild("c"), variantId: "3", inStock: true },
    ] } });
    assert.equal(vb.bilder[vb.farg["blå"]], bild("b"));
    // Är alla med färgen slut gäller det första.
    const slut = rakna({ options: { choices: [
      { label: "Blå, liten", image: bild("a"), variantId: "1", inStock: false },
      { label: "Blå, stor", image: bild("b"), variantId: "2", inStock: false },
      { label: "Röd", image: bild("c"), variantId: "3", inStock: true },
    ] } });
    assert.equal(slut.bilder[slut.farg["blå"]], bild("a"));
  });

  it("☠️ ett val utan egen bild får ingen: då står rutan dold tills väljaren valt", () => {
    const vb = rakna({ options: { choices: [
      { label: "Svart", image: bild("a"), variantId: "1" },
      { label: "Grå", image: bild("b"), variantId: "2" },
      { label: "Vit", image: bild("c"), variantId: "3" },
      { label: "Röd", image: "", variantId: "4" },
    ] } });
    assert.equal(vb.variant["4"], undefined);
    assert.equal(vb.farg["röd"], undefined);
    assert.equal(vb.variant["1"], 0);
  });

  it("har för få val en bild hoppar galleriet inte, och då visas ingen bild i förväg", () => {
    // Samma gräns som väljaren: alla, eller alla utom ett när valen är minst fyra.
    const vb = rakna({ options: { choices: [
      { label: "Svart", image: bild("a"), variantId: "1" },
      { label: "Grå", image: "", variantId: "2" },
      { label: "Vit", image: "", variantId: "3" },
    ] } });
    assert.deepEqual(vb, { bilder: [], variant: {}, farg: {} });
    assert.deepEqual(rakna({ options: { choices: [val[0]] } }), { bilder: [], variant: {}, farg: {} });
    assert.deepEqual(rakna({ options: null }), { bilder: [], variant: {}, farg: {} });
  });

  it("två val med samma bild delar plats", () => {
    const vb = rakna({ options: { choices: [
      { label: "Svart, 2-pack", image: bild("a"), variantId: "1" },
      { label: "Svart, 4-pack", image: bild("a"), variantId: "2" },
    ] } });
    assert.deepEqual(vb.bilder, [bild("a")]);
    assert.deepEqual(vb.variant, { "1": 0, "2": 0 });
  });
});

describe("flera axlar: varje rad i tabellen bär sin bild", () => {
  const p = {
    variantAxes: [{ name: "Färg" }, { name: "Storlek" }],
    variantTable: [
      { choices: { Färg: "Grön", Storlek: "S" }, variantId: "g-s", inStock: false, image: bild("a") },
      { choices: { Färg: "Grön", Storlek: "L" }, variantId: "g-l", inStock: true, image: bild("a") },
      { choices: { Färg: "Mörkblå", Storlek: "S" }, variantId: "b-s", inStock: true, image: bild("b") },
      { choices: { Färg: "Mörkblå", Storlek: "L" }, variantId: "b-l", inStock: true, image: "" },
    ],
  };

  it("varianten pekar på radens bild, och storlekar av samma färg delar den", () => {
    const vb = rakna(p);
    assert.deepEqual(vb.bilder, [bild("a"), bild("b")]);
    assert.deepEqual(vb.variant, { "g-s": 0, "g-l": 0, "b-s": 1 });
  });

  it("färgen pekar på första raden i lager som bär den", () => {
    const vb = rakna(p);
    assert.equal(vb.farg["grön"], 0);
    assert.equal(vb.farg["blå"], 1);
  });

  it("en axel med en tabell räknas inte som flera axlar", () => {
    const vb = rakna({ variantAxes: [{ name: "Färg" }], variantTable: p.variantTable, options: null });
    assert.deepEqual(vb, { bilder: [], variant: {}, farg: {} });
  });
});

describe("☠️ reglerna är väljarens egna", () => {
  const vy = las("components", "productview.tsx");

  it("flera axlar, och vilka val som har bild", () => {
    assert.match(vy, /const multiAxis = axes\.length >= 2 && table\.length >= 1;/);
    assert.match(vy, /const imageChoices = options\?\.choices \|\| \[\];\s+const hasImageVariants = imageChoices\.length >= 2;/);
    assert.match(vy, /const allHaveImage = hasImageVariants && flestaHarBild\(imageChoices\);/);
    // Bilden som galleriet hoppar till.
    assert.match(vy, /const selectedVariantImage = multiAxis\s+\? currentVariant\?\.image\s+: allHaveImage\s+\? imageChoices\[sel\]\?\.image\s+: undefined;/);
  });

  it("?variant=: raden eller valet med det id:t", () => {
    assert.match(vy, /const rad = table\.find\(\(t\) => t\.variantId === vid\);/);
    assert.match(vy, /const i = imageChoices\.findIndex\(\(c\) => c\.variantId === vid\);/);
  });

  it("?farg=: i lager före slutsålt", () => {
    assert.match(vy, /const med = table\.filter\(\(t\) => Object\.values\(t\.choices\)\.some\(harFarg\)\);\s+const rad = med\.find\(\(t\) => t\.inStock\) \?\? med\[0\];/);
    assert.match(vy, /const kandidater = imageChoices\.map\(\(c, i\) => \(\{ c, i \}\)\)\.filter\(\(\{ c \}\) => harFarg\(c\.label\)\);\s+const val = kandidater\.find\(\(\{ c \}\) => c\.inStock !== false\) \?\? kandidater\[0\];/);
    assert.match(vy, /const harFarg = \(text: string \| undefined\) => !!text && colorKeysOf\(text\)\.has\(nyckel\);/);
  });
});

describe("sidans tidiga skript hämtar och visar valets bild", () => {
  const vb = { bilder: ["a", "b"], variant: { "id-1": 0, "id-2": 1 }, farg: { "blå": 1 } };
  const kandidater = [["https://x/a-1080.webp", "https://x/a-640.webp 640w, https://x/a-1080.webp 1080w"], ["https://x/b-1080.webp", ""]] as const;
  const skript = valBildSkript(vb, kandidater, "(max-width:760px) calc( 100vw - 52px), 544px");

  it("utan bilder läggs ingenting till", () => {
    assert.equal(valBildSkript({ bilder: [], variant: {}, farg: {} }, [], "100vw"), "");
  });

  it("varianten i adressen går före färgen, och ett okänt värde ger ingen bild", () => {
    assert.match(skript, /i=v\?\{"id-1":0,"id-2":1\}\[v\]:\{"blå":1\}\[f\],b=typeof i==='number'\?B\[i\]:null;/);
  });

  it("sizes sätts före srcset och src sist, som i förhämtningen", () => {
    assert.ok(skript.indexOf("im.sizes=") < skript.indexOf("im.srcset="));
    assert.ok(skript.indexOf("im.srcset=") < skript.indexOf("im.src=b[0]"));
  });

  it("bilden visas bara medan sidans egna bilder är dolda, och tas bort av sig själv", () => {
    assert.match(skript, /im\.onload=function\(\)\{if\(!document\.getElementById\('pdp-val-vantar'\)\)return;/);
    assert.match(skript, /t\.id='pdp-val-bild';/);
    assert.match(skript, /setTimeout\(function\(\)\{t\.remove\(\)\},8000\)/);
    assert.match(skript, /\.pdp \.gallery \.gmain\{background-image:url\(/);
  });

  it("☠️ skriptet går att köra: en riktig bild väljs och ritas som bakgrund", () => {
    const skapade: { id?: string; textContent?: string }[] = [];
    const bilder: { sizes?: string; srcset?: string; src?: string; currentSrc?: string; onload?: () => void }[] = [];
    const miljo = {
      v: "id-2", f: null as string | null,
      Image: function (this: object) { bilder.push(this); } as unknown as { new (): object },
      document: {
        getElementById: (id: string) => (id === "pdp-val-vantar" ? {} : null),
        createElement: () => { const e = { remove() {} }; skapade.push(e); return e; },
        head: { appendChild() {} },
      },
      setTimeout: () => 0,
    };
    new Function("v", "f", "Image", "document", "setTimeout", skript)(miljo.v, miljo.f, miljo.Image, miljo.document, miljo.setTimeout);
    assert.equal(bilder.length, 1);
    assert.equal(bilder[0].src, "https://x/b-1080.webp");
    assert.equal(bilder[0].sizes, "(max-width:760px) calc( 100vw - 52px), 544px");
    assert.equal(bilder[0].srcset, undefined, "utan srcset sätts ingen");
    bilder[0].currentSrc = "https://x/b-1080.webp";
    bilder[0].onload?.();
    assert.equal(skapade.length, 1);
    assert.equal(skapade[0].id, "pdp-val-bild");
    assert.match(skapade[0].textContent ?? "", /background-image:url\("https:\/\/x\/b-1080\.webp"\)/);
  });

  it("färgen i adressen väljer bild när ingen variant står där", () => {
    const bilder: { src?: string; srcset?: string }[] = [];
    const Bild = function (this: object) { bilder.push(this); } as unknown as { new (): object };
    const dok = { getElementById: () => ({}), createElement: () => ({ remove() {} }), head: { appendChild() {} } };
    new Function("v", "f", "Image", "document", "setTimeout", skript)(null, "blå", Bild, dok, () => 0);
    assert.equal(bilder[0]?.src, "https://x/b-1080.webp");
    new Function("v", "f", "Image", "document", "setTimeout", skript)("id-1", "blå", Bild, dok, () => 0);
    assert.equal(bilder[1]?.src, "https://x/a-1080.webp");
    assert.match(bilder[1]?.srcset ?? "", /a-640\.webp 640w/);
    // Okända värden, också namn som finns på varje objekt: ingen bild.
    for (const [v, f] of [["finns-inte", null], [null, "rosa"], ["constructor", null], ["__proto__", null]] as const) {
      const fore = bilder.length;
      new Function("v", "f", "Image", "document", "setTimeout", skript)(v, f, Bild, dok, () => 0);
      assert.equal(bilder.length, fore, `${v ?? f}`);
    }
  });

  it("ett < i en adress kan inte stänga skripttaggen", () => {
    const farligt = valBildSkript({ bilder: ["a"], variant: { x: 0 }, farg: {} }, [["https://x/</script><b>", ""]], "100vw");
    assert.doesNotMatch(farligt, /<\/script>/);
    assert.match(farligt, /\\u003c\/script>/);
  });
});

describe("sidan, väljaren och galleriet hänger ihop", () => {
  const sida = las("app", "produkt", "[slug]", "page.tsx");
  const galleri = las("components", "gallery.tsx");
  const vy = las("components", "productview.tsx");

  it("sidan bygger bilderna med galleriets laddare och väljarens regler", () => {
    assert.match(sida, /const vb = valBilder\(p, colorKeysOf, flestaHarBild\);/);
    assert.match(sida, /vb\.bilder\.map\(\(b\) => \{ const k = hjaltebildKandidater\(b\); return \[k\.src, k\.srcSet \?\? ""\] as const; \}\),\s+HERO_SIZES,/);
    // Tillägget står inne i grenen "adressen pekar på ett annat val".
    assert.match(sida, /"document\.head\.appendChild\(s\);setTimeout\(function\(\)\{s\.remove\(\)\},4000\);" \+\s+bildSkript \+\s+"\}\}catch\(e\)\{\}\}\)\(\)"/);
  });

  it("☠️ galleriet tar bort bilden när dess eget lager visas, inte vid monteringen", () => {
    assert.match(galleri, /const forstaVisad = useRef\(true\);\s+useEffect\(\(\) => \{\s+if \(forstaVisad\.current\) \{ forstaVisad\.current = false; return; \}\s+if \(shown\) document\.getElementById\("pdp-val-bild"\)\?\.remove\(\);\s+\}, \[shown\]\);/);
  });

  it("blev det inget byte tar väljaren bort den", () => {
    assert.match(vy, /if \(!bytt\) document\.getElementById\("pdp-val-bild"\)\?\.remove\(\);/);
  });
});
