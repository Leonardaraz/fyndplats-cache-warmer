import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { DELA_FRAN_ORD, delaIStycken, delaLangaStyckenIHtml, MAX_ORD_PER_STYCKE } from "./stycken.ts";
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

describe("meningsgränserna: tre ställen där ett stycke aldrig får börja", () => {
  // Tre meningar om 30, 40 och 30 ord. Mitten har ett ställe efter 20 ord som SER
  // ut som en meningsgräns. Delas den där blir första stycket 50 ord, precis sin
  // andel, och stycket slutar mitt i uppgiften.
  const ordrad = (n: number, p: string) => Array.from({ length: n }, (_, k) => `${p}${k}`).join(" ");
  const treMeningar = (fore: string, efter: string, skilje = " ") =>
    `Start ${ordrad(28, "a")} slut. Stolen ${ordrad(18, "b")} ${fore}${skilje}${efter} ${ordrad(17, "c")} slut. Sist ${ordrad(28, "d")} slut.`;

  it("☠️ efter en förkortning som följs av mer text: max. 135 kg, ca. 10 cm, kl. 10", () => {
    for (const f of ["max.", "ca.", "c:a.", "min.", "t.ex.", "bl.a.", "inkl.", "exkl.", "resp.", "kl.", "nr.", "dvs.", "Max.", "(max.", "t.o.m."]) {
      const text = treMeningar(f, "135 kg");
      assert.equal(ord(text), 100, f);
      const stycken = delaIStycken(text);
      assert.equal(stycken.length, 2, `${f}: ${stycken.map(ord)}`);
      assert.deepEqual(stycken.map(ord), [70, 30], f);
      for (const s of stycken) assert.ok(!s.endsWith(f), `ett stycke slutar på ${f}`);
      assert.equal(stycken.join(" "), text, f);
    }
  });

  it("också när nästa ord har versal: t.ex. Aosom, bl.a. Sverige", () => {
    for (const f of ["t.ex.", "bl.a.", "inkl."]) {
      const stycken = delaIStycken(treMeningar(f, "Sverige och"));
      for (const s of stycken) assert.ok(!s.endsWith(f), `ett stycke slutar på ${f}`);
    }
  });

  it("☠️ efter ett ensamt tal med punkt: numreringen hör till sin mening", () => {
    const text = treMeningar("2.", "Skruva fast");
    const stycken = delaIStycken(text);
    assert.deepEqual(stycken.map(ord), [70, 30]);
    for (const s of stycken) assert.doesNotMatch(s, /(^|\s)\d+\.$/);
    assert.equal(stycken.join(" "), text);
  });

  it("☠️ vid ett hårt mellanslag: det sattes för att hålla ihop orden, och det står kvar", () => {
    const text = treMeningar("stadigt.", "Den står", " ");
    const stycken = delaIStycken(text);
    assert.deepEqual(stycken.map(ord), [70, 30]);
    assert.equal(stycken.join(" "), text, "texten är densamma, tecken för tecken");
    assert.ok(stycken[0].includes("stadigt. Den"));
  });

  it("en vanlig meningsgräns på samma plats delas som förut", () => {
    const stycken = delaIStycken(treMeningar("stadigt.", "Den står"));
    assert.deepEqual(stycken.map(ord), [50, 50]);
    assert.ok(stycken[0].endsWith("stadigt."));
  });

  it("förkortningar som brukar avsluta en mening delar som vanligt: osv., m.m., etc.", () => {
    for (const f of ["osv.", "m.m.", "etc."]) {
      const stycken = delaIStycken(treMeningar(f, "Den står"));
      assert.deepEqual(stycken.map(ord), [50, 50], f);
      assert.ok(stycken[0].endsWith(f), f);
    }
  });

  it("ett ord som bara SLUTAR som en förkortning är ingen förkortning: klimax., stamina.", () => {
    for (const f of ["klimax.", "kamin.", "ventilnr."]) {
      const stycken = delaIStycken(treMeningar(f, "Den står"));
      assert.deepEqual(stycken.map(ord), [50, 50], f);
    }
  });

  it("en punkt följd av gemen är ingen meningsgräns, vilket ord som än står före", () => {
    for (const f of ["osv.", "m.m.", "stadigt."]) {
      const text = treMeningar(f, "den står");
      const stycken = delaIStycken(text);
      assert.deepEqual(stycken.map(ord), [70, 30], f);
      assert.equal(stycken.join(" "), text, f);
    }
  });

  it("utropstecken och frågetecken efter en förkortning är en meningsgräns", () => {
    const stycken = delaIStycken(treMeningar("max!", "Den står"));
    assert.deepEqual(stycken.map(ord), [50, 50]);
  });
});

describe("☠️ modulen går till webbläsaren: inga uttryck som Safari före 16.4 inte kan läsa", () => {
  const BAKATBLICK = /\(\?<[=!]/;
  it("lib/stycken.ts har inget bakåtblickande reguljärt uttryck", () => {
    assert.doesNotMatch(las("lib", "stycken.ts"), BAKATBLICK);
  });
  it("recensionskomponenten, som laddar modulen i webbläsaren, har det inte heller", () => {
    const komponent = las("components", "ProductReviews.tsx");
    assert.match(komponent, /^"use client";/);
    assert.match(komponent, /from "\.\.\/lib\/stycken"/);
    assert.doesNotMatch(komponent, BAKATBLICK);
  });
  it("butiken lovar fortfarande webbläsare som saknar stödet (annars kan vakten tas bort)", () => {
    assert.match(las("package.json"), /"iOS >= 1[0-5]"/);
  });
});

describe("styckena blir ungefär lika långa", () => {
  it("90 ord blir 45 + 45, inte 70 + 20", () => {
    const text = Array.from({ length: 6 }, (_, i) => mening(15, i)).join(" ");
    assert.deepEqual(delaIStycken(text).map(ord), [45, 45]);
  });

  it("170 ord blir tre stycken om 50–60 ord", () => {
    const text = Array.from({ length: 17 }, (_, i) => mening(10, i)).join(" ");
    assert.deepEqual(delaIStycken(text).map(ord), [60, 60, 50]);
  });

  it("ojämna meningar: inget stycke över gränsen, och texten är densamma", () => {
    const langder = [31, 9, 24, 40, 12, 18, 35, 7, 22, 29, 14];
    const text = langder.map((n, i) => mening(n, i)).join(" ");
    const delar = delaIStycken(text);
    assert.equal(delar.join(" "), text);
    for (const d of delar) assert.ok(ord(d) <= MAX_ORD_PER_STYCKE, `${ord(d)} ord`);
    assert.ok(delar.length >= Math.ceil(ord(text) / MAX_ORD_PER_STYCKE));
  });
});

describe("delaLangaStyckenIHtml: produkttextens långa stycken", () => {
  const lang = (n: number) => Array.from({ length: n }, (_, i) => mening(10, i)).join(" ");
  const utanTaggar = (h: string) => h.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();

  it("☠️ ett stycke på 170 ord blir flera stycken med samma ord (mätt: 164–185 ord under Användning och skötsel)", () => {
    const html = `<h3>Användning och skötsel</h3><p>${lang(17)}</p><h3>Leverans</h3><p>Kort text.</p>`;
    const ut = delaLangaStyckenIHtml(html);
    const stycken = [...ut.matchAll(/<p>([^<]*)<\/p>/g)].map((m) => m[1]);
    assert.deepEqual(stycken.map(ord), [60, 60, 50, 2]);
    assert.equal(utanTaggar(ut), utanTaggar(html));
    // Rubrikerna och ordningen är orörda.
    assert.match(ut, /^<h3>Användning och skötsel<\/h3><p>Mening 0 /);
    assert.match(ut, /<\/p><h3>Leverans<\/h3><p>Kort text\.<\/p>$/);
  });

  it("gränsen: 84 ord lämnas, 90 ord delas", () => {
    const precis = `<p>${Array.from({ length: 7 }, (_, i) => mening(12, i)).join(" ")}</p>`;
    assert.equal(ord(precis.replace(/<[^>]+>/g, "")), DELA_FRAN_ORD);
    assert.equal(delaLangaStyckenIHtml(precis), precis);
    const over = `<p>${lang(9)}</p>`;
    assert.equal((delaLangaStyckenIHtml(over).match(/<p>/g) || []).length, 2);
  });

  it("en text utan långa stycken kommer tillbaka byte för byte", () => {
    const html = `<p>En kort text.</p>\n<ul><li>${lang(12)}</li></ul><p class="x">${lang(8)}</p>`;
    assert.equal(delaLangaStyckenIHtml(html), html);
    assert.equal(delaLangaStyckenIHtml(""), "");
    assert.equal(delaLangaStyckenIHtml("<div>Ingen stycketagg alls.</div>"), "<div>Ingen stycketagg alls.</div>");
  });

  it("attributen på stycket följer med till varje del", () => {
    const ut = delaLangaStyckenIHtml(`<p class="ingress" data-x="1">${lang(12)}</p>`);
    const oppnar = ut.match(/<p[^>]*>/g) || [];
    assert.equal(oppnar.length, 2);
    for (const o of oppnar) assert.equal(o, '<p class="ingress" data-x="1">');
  });

  it("☠️ ett stycke med ett id lämnas som det är: ett id får bara stå på ett ställe", () => {
    const lang = Array.from({ length: 17 }, (_, i) => mening(10, i)).join(" ");
    const medId = `<p id="skotsel">${lang}</p>`;
    assert.equal(delaLangaStyckenIHtml(medId), medId);
    const medIdSist = `<p class="x" ID = "skotsel">${lang}</p>`;
    assert.equal(delaLangaStyckenIHtml(medIdSist), medIdSist);
    // data-id är inget id: det stycket delas som vanligt.
    const delat = delaLangaStyckenIHtml(`<p data-id="7">${lang}</p>`);
    assert.ok((delat.match(/<p data-id="7">/g) || []).length >= 3, delat.slice(0, 80));
  });

  it("☠️ ett stycke med en tagg i sig lämnas som det är: en delning får aldrig hamna mitt i en länk", () => {
    const html = `<p>${lang(8)} <a href="/produkt/x">Se den här. Den är bra</a> ${lang(8)}</p>`;
    assert.equal(delaLangaStyckenIHtml(html), html);
    const fet = `<p><strong>Viktigt.</strong> ${lang(15)}</p>`;
    assert.equal(delaLangaStyckenIHtml(fet), fet);
  });

  it("bara <p>: varken <pre> eller <picture> räknas som stycke", () => {
    const html = `<pre>${lang(15)}</pre><picture>${lang(15)}</picture>`;
    assert.equal(delaLangaStyckenIHtml(html), html);
  });

  it("en enda lång mening går inte att dela och lämnas orörd", () => {
    const html = `<p>Lång mening ${Array.from({ length: 118 }, (_, k) => `ord${k}`).join(" ")}.</p>`;
    assert.equal(delaLangaStyckenIHtml(html), html);
  });

  it("produktsidan ritar den delade texten, och JSON-LD, FAQ och säkerhetsraderna läser den råa", () => {
    const sida = las("app", "produkt", "[slug]", "page.tsx");
    assert.match(sida, /const beskrivningHtml = delaLangaStyckenIHtml\(descriptionHtml\);/);
    assert.match(sida, /descriptionHtml=\{beskrivningHtml\}/);
    assert.match(sida, /faqPageJsonLd\(p\.descriptionHtml \|\| ""\)/);
    assert.match(sida, /sakerhetUrBeskrivning\(p\.descriptionHtml\)/);
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
