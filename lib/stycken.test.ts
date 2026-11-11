import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { delaIStycken, MAX_ORD_PER_STYCKE } from "./stycken.ts";
import { SKRYMMANDE_REGEL, SKRYMMANDE_RETURKOSTNAD } from "./retur-frakt.ts";

const las = (...delar: string[]) => readFileSync(join(import.meta.dirname, "..", ...delar), "utf8");
const ord = (s: string) => s.split(/\s+/).filter(Boolean).length;
const mening = (n: number, i: number) => `Mening ${i} ${Array.from({ length: n - 2 }, (_, k) => `ord${k}`).join(" ")}.`.replace(" .", ".");

describe("delaIStycken", () => {
  it("en kort text kommer tillbaka som ett stycke, orörd", () => {
    assert.deepEqual(delaIStycken("Bra vara. Snabb leverans!"), ["Bra vara. Snabb leverans!"]);
    assert.deepEqual(delaIStycken("  Bra vara.  "), ["Bra vara."]);
    assert.deepEqual(delaIStycken(""), []);
    assert.deepEqual(delaIStycken("   "), []);
  });

  it("☠️ en lång text delas så att inget stycke går över gränsen (mätt: 158–219 ord i ett stycke pekades ut)", () => {
    const text = Array.from({ length: 22 }, (_, i) => mening(10, i)).join(" "); // 220 ord
    assert.equal(ord(text), 220);
    const stycken = delaIStycken(text);
    assert.ok(stycken.length >= 4, String(stycken.length));
    for (const s of stycken) assert.ok(ord(s) <= MAX_ORD_PER_STYCKE, `${ord(s)} ord`);
  });

  it("texten är densamma: samma ord i samma ordning", () => {
    const text = Array.from({ length: 30 }, (_, i) => mening(8 + (i % 5), i)).join(" ");
    assert.equal(delaIStycken(text).join(" "), text);
    const medRadbryt = text.replace(/\. Mening 7 /, ".\n\nMening 7 ");
    assert.equal(delaIStycken(medRadbryt).join(" ").replace(/\s+/g, " "), text);
  });

  it("delar bara mellan meningar: varje stycke slutar med skiljetecken", () => {
    const text = Array.from({ length: 25 }, (_, i) => (i % 3 ? mening(9, i) : mening(9, i).replace(/\.$/, "!"))).join(" ");
    for (const s of delaIStycken(text)) assert.match(s, /[.!?]$/);
  });

  it("en förkortning mitt i en mening delar inte: nästa ord börjar med gemen", () => {
    const text = `${Array.from({ length: 8 }, (_, i) => mening(9, i)).join(" ")} Den passar t.ex. en liten hall och rymmer ca. tio par skor utan problem alls. ${Array.from({ length: 8 }, (_, i) => mening(9, i + 20)).join(" ")}`;
    const stycken = delaIStycken(text);
    assert.equal(stycken.some((s) => /t\.ex\.$|ca\.$/.test(s)), false);
    assert.equal(stycken.join(" "), text);
    // Med en gräns under meningarnas längd syns varje delning: två meningar, inte fyra.
    assert.deepEqual(
      delaIStycken("Den passar t.ex. en liten hall. Och den rymmer ca. tio par skor.", 5),
      ["Den passar t.ex. en liten hall.", "Och den rymmer ca. tio par skor."],
    );
  });

  it("citattecken och parentes efter skiljetecknet hör till meningen före", () => {
    assert.deepEqual(
      delaIStycken('Hon sa "Den är bra." Sedan kom nästa (den var större). Slut på det hela.', 4),
      ['Hon sa "Den är bra."', "Sedan kom nästa (den var större).", "Slut på det hela."],
    );
  });

  it("en enda mening som är längre än gränsen delas aldrig", () => {
    const lang = `Lång mening ${Array.from({ length: 118 }, (_, k) => `ord${k}`).join(" ")}.`;
    assert.deepEqual(delaIStycken(lang), [lang]);
    const tva = `Kort mening först. ${lang}`;
    assert.deepEqual(delaIStycken(tva), ["Kort mening först.", lang]);
  });

  it("gränsen går att ställa", () => {
    const text = Array.from({ length: 10 }, (_, i) => mening(10, i)).join(" ");
    assert.equal(delaIStycken(text, 20).length, 5);
    assert.equal(delaIStycken(text, 100).length, 1);
  });
});

describe("recensionen ritas som stycken i följd", () => {
  const k = las("components", "ProductReviews.tsx");
  const css = las("app", "globals.css");

  it("texten delas med delaIStycken och varje stycke är ett eget <p>", () => {
    assert.match(k, /const stycken = delaIStycken\(text\);/);
    assert.match(k, /\{stycken\.map\(\(s, i\) => \(\s*<Fragment key=\{i\}>\s*\{i > 0 \? " " : null\}\s*<p>\{s\}<\/p>\s*<\/Fragment>\s*\)\)\}/);
  });

  it("klampen och mätningen sitter på behållaren, inte på ett stycke", () => {
    assert.match(k, /<div ref=\{ref\} tabIndex=\{-1\} className=\{`rev-text\$\{lang && !utfalld \? " rev-text-klamp" : ""\}`\}>/);
    assert.match(k, /const ref = useRef<HTMLDivElement>\(null\);/);
  });

  it("☠️ styckena ritas i följd, annars räknar klampen på fem rader fel", () => {
    assert.match(css, /\.rev-text p\{display:inline;margin:0;padding:0;font:inherit;color:inherit\}/);
    assert.match(css, /\.rev-text-klamp\{display:-webkit-box;-webkit-line-clamp:5;-webkit-box-orient:vertical;overflow:hidden\}/);
  });
});

describe("köpvillkoren", () => {
  const k = las("app", "kopvillkor", "page.tsx");

  it("inget stycke i källan är längre än 84 ord (mätt: 184 och 173 ord pekades ut, sidor utan fynd hade högst 84)", () => {
    const stycken = [...k.matchAll(/<p>([\s\S]*?)<\/p>/g)].map((m) => m[1].replace(/<[^>]+>/g, " ").replace(/\{[A-Z_]+\}/g, " "));
    assert.ok(stycken.length > 20, String(stycken.length));
    for (const s of stycken) assert.ok(ord(s) <= 84, `${ord(s)} ord: ${s.trim().slice(0, 60)}`);
  });

  it("kostnadsupplysningen för skrymmande returer ritas som stycken, ord för ord", () => {
    assert.match(k, /\{delaIStycken\(SKRYMMANDE_RETURKOSTNAD\)\.map\(\(t, i\) => <p key=\{i\}>\{t\}<\/p>\)\}/);
    assert.doesNotMatch(k, /<p>\{SKRYMMANDE_RETURKOSTNAD\}<\/p>/);
    const delar = delaIStycken(SKRYMMANDE_RETURKOSTNAD);
    assert.equal(delar.join(" "), SKRYMMANDE_RETURKOSTNAD);
    assert.equal(delar.length, 2);
    assert.ok(ord(SKRYMMANDE_RETURKOSTNAD) > 84, "upplysningen ryms numera i ett stycke: ta bort delningen");
    for (const d of delar) assert.ok(ord(d) <= MAX_ORD_PER_STYCKE, `${ord(d)} ord`);
    // Regeln står först och hel i det första stycket.
    assert.ok(delar[0].startsWith(SKRYMMANDE_REGEL));
  });
});
