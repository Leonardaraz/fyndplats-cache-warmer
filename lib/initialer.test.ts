import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { initialer } from "./initialer.ts";

test("namn blir initialer", () => {
  assert.equal(initialer("George Galush"), "G. G.");
  assert.equal(initialer("Orlando"), "O.");
  assert.equal(initialer("Macke J"), "M. J.");
  assert.equal(initialer("Elie EL-Zouki"), "E. E.");
  assert.equal(initialer("  Zabina   Petrànyi "), "Z. P.");
  assert.equal(initialer("Åsa Öberg"), "Å. Ö.");
  assert.equal(initialer("zabina"), "Z.");
  assert.equal(initialer(""), "Kund");
});

test("omdömessidan skickar bara initialer och löpnummer till sidan", () => {
  const src = readFileSync(new URL("../app/omdomen/page.tsx", import.meta.url), "utf8");
  assert.match(src, /author: initialer\(r\.author\)/);
  assert.match(src, /id: `omdome-\$\{i\}`/);
  assert.match(src, /reviews=\{omdomen\}/, "komponenten får de omgjorda omdömena, inte data.reviews");
});

// Listan i lib/curated-reviews.ts bär kundens publika namn och ett id som är
// namnet som slug. Inget av dem får nå en sida. Startsidan hade id:t som
// React-nyckel på korten, och nyckeln på ett element i en serverkomponent
// följer med i sidans React-data: "saad-said", "albert" och "kevin-stenroos"
// stod i startsidans HTML till 2026-11-25.
test("startsidans omdömeskort bär varken namn eller id", () => {
  const src = readFileSync(new URL("../app/page.tsx", import.meta.url), "utf8");
  const kort = src.slice(src.indexOf('className="roster"'), src.indexOf("<Newsletter />"));
  assert.ok(kort.length > 200, "hittade inte omdömesraden");
  assert.doesNotMatch(kort, /key=\{r\.id\}/, "id:t är namnet som slug");
  assert.match(kort, /key=\{`omdome-\$\{i\}`\}/);
  assert.match(kort, /\{initialer\(r\.author\)\}/);
  assert.doesNotMatch(kort, /\{r\.author\}/, "hela namnet får inte skrivas ut");
});

// Reglerna överst i lib/curated-reviews.ts, som prov: varje kort har ett eget
// id, ett betyg 1 till 5, en text och ett datum som inte ligger i framtiden.
test("de handinlagda Google-omdömena är hela och utan dubbletter", () => {
  const src = readFileSync(new URL("./curated-reviews.ts", import.meta.url), "utf8");
  const lista = src.slice(src.indexOf("export const CURATED_REVIEWS"), src.indexOf("export const CURATED_RESULT"));
  const block = lista.split(/\n  \{\n/).slice(1);
  assert.ok(block.length >= 31, `väntade minst 31 omdömen, fick ${block.length}`);
  const idn = new Set<string>();
  const texter = new Set<string>();
  const idag = new Date().toISOString().slice(0, 10);
  for (const b of block) {
    const id = /\bid: "([^"]+)"/.exec(b)?.[1];
    const betyg = Number(/\brating: (\d)/.exec(b)?.[1]);
    const namn = /\bauthor: "([^"]+)"/.exec(b)?.[1];
    const datum = /\bdate: "(\d{4}-\d{2}-\d{2})"/.exec(b)?.[1];
    const text = /\btext: "((?:[^"\\]|\\.)+)"/.exec(b)?.[1];
    assert.ok(id && namn && datum && text, `ofullständigt omdöme: ${b.slice(0, 60)}`);
    assert.ok(betyg >= 1 && betyg <= 5, `${id}: betyg ${betyg}`);
    assert.ok(!idn.has(id), `${id} står två gånger`);
    assert.ok(!texter.has(text), `${id}: samma text som ett annat omdöme`);
    assert.ok(datum <= idag, `${id}: datumet ${datum} ligger i framtiden`);
    assert.equal(text, text.trim(), `${id}: blanksteg i kanten`);
    idn.add(id);
    texter.add(text);
  }
  // De fem från 2026-11-25 står överst, de tre utförligaste först.
  assert.deepEqual([...idn].slice(0, 6), ["felix-michel", "johannes-deniz", "maikel-sharro", "balanz", "rami123123", "saad-said"]);
});
