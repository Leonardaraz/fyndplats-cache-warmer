// Run: node --test --experimental-strip-types 'lib/**/*.test.ts'
//
// A–Ö-listan skickas som färdig HTML-sträng (se lib/product-index-html.ts).
// Den ska ge exakt samma länkar och markup som JSX-versionen gjorde, och ett
// produktnamn får aldrig kunna bli markup.
import test from "node:test";
import assert from "node:assert/strict";
import { escHtml, indexGrupper, indexHtml } from "./product-index-html.ts";

const P = [
  { slug: "zebra-matta", name: "Zebramatta 160 cm" },
  { slug: "angsmatta", name: "Ängsmatta" },
  { slug: "3d-pussel", name: "3D-pussel raket" },
  { slug: "adventskalender", name: "Adventskalender i trä" },
  { slug: "adventskalender", name: "Adventskalender i trä (dubblett)" },
  { slug: "ostron-kniv", name: "Östronkniv" },
  { slug: "armstod", name: "armstöd till stol" },
];

test("svensk ordning, en grupp per bokstav, siffror under 0–9, dubbletter bort", () => {
  const g = indexGrupper(P);
  assert.deepEqual(g.map((x) => x.letter), ["0–9", "A", "Z", "Ä", "Ö"]);
  assert.deepEqual(g[1].items.map((p) => p.slug), ["adventskalender", "armstod"]);
  assert.equal(g.reduce((n, x) => n + x.items.length, 0), 6);
});

test("samma markup som komponenten renderade", () => {
  const html = indexHtml(indexGrupper([{ slug: "a-b", name: "Abc" }]));
  assert.equal(
    html,
    '<div class="prodindex-group"><div class="prodindex-letter" aria-hidden="true">A</div><ul><li><a href="/produkt/a-b">Abc</a></li></ul></div>',
  );
});

test("varje produkt får exakt en länk", () => {
  const html = indexHtml(indexGrupper(P));
  for (const p of new Set(P.map((x) => x.slug))) {
    assert.equal(html.split(`href="/produkt/${p}"`).length - 1, 1, p);
  }
});

test("namn och slugs escapas", () => {
  const html = indexHtml(indexGrupper([{ slug: 'x"><script>', name: 'Skål <b>"Stor"</b> & liten' }]));
  assert.doesNotMatch(html, /<script>|<b>/);
  assert.match(html, /Skål &lt;b&gt;&quot;Stor&quot;&lt;\/b&gt; &amp; liten/);
  assert.equal(escHtml(`'`), "&#39;");
});
