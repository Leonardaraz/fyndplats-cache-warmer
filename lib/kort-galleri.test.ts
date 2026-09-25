import { test } from "node:test";
import assert from "node:assert/strict";
import { extraKortbilder, KORT_MAX_BILDER } from "./kort-galleri.ts";

const W = "https://static.wixstatic.com/media/";
const nyckel = (u: string) => { const m = u.match(/static\.wixstatic\.com\/media\/([^/?#]+)/); return m ? m[1] : null; };

test("hoppar över huvud- och hover-bilden och returnerar resten som nycklar", () => {
  const g = [W + "a~mv2.jpg", W + "b~mv2.jpg", W + "c~mv2.jpg", W + "d~mv2.jpg"];
  assert.deepEqual(extraKortbilder(W + "a~mv2.jpg", g, nyckel), ["c~mv2.jpg", "d~mv2.jpg"]);
});

test("samma fil med olika transform-parametrar räknas som dubblett", () => {
  const g = [W + "a~mv2.jpg", W + "b~mv2.jpg", W + "b~mv2.jpg/v1/fill/w_600,h_600/file.jpg", W + "c~mv2.jpg"];
  assert.deepEqual(extraKortbilder(W + "a~mv2.jpg", g, nyckel), ["c~mv2.jpg"]);
});

test("kapar så att kortet totalt har högst KORT_MAX_BILDER", () => {
  const g = Array.from({ length: 12 }, (_, i) => `${W}x${i}~mv2.jpg`);
  const ut = extraKortbilder(g[0], g, nyckel);
  assert.equal(ut.length, KORT_MAX_BILDER - 2);
  assert.equal(ut[0], "x2~mv2.jpg");
});

test("inget galleri eller bara två bilder ger tom lista", () => {
  assert.deepEqual(extraKortbilder(W + "a~mv2.jpg", undefined, nyckel), []);
  assert.deepEqual(extraKortbilder(W + "a~mv2.jpg", [W + "a~mv2.jpg", W + "b~mv2.jpg"], nyckel), []);
});

test("huvudbilden behöver inte ligga först i galleriet", () => {
  const g = [W + "b~mv2.jpg", W + "a~mv2.jpg", W + "c~mv2.jpg"];
  // hover = första som inte är huvudbilden = b
  assert.deepEqual(extraKortbilder(W + "a~mv2.jpg", g, nyckel), ["c~mv2.jpg"]);
});

import { kortDel, lasDel, KORT_DELAR } from "./kort-galleri.ts";

test("kortDel: stabil, inom intervallet och någorlunda jämnt fördelad", () => {
  assert.equal(kortDel("pelarjulgran-180-cm-46-cm-bred"), kortDel("pelarjulgran-180-cm-46-cm-bred"));
  const antal = new Array(KORT_DELAR).fill(0);
  for (let i = 0; i < 4000; i++) {
    const d = kortDel(`produkt-${i}-cm`);
    assert.ok(Number.isInteger(d) && d >= 0 && d < KORT_DELAR);
    antal[d]++;
  }
  // ~31 per del i snitt; ingen del tom och ingen som bär en orimlig andel.
  assert.ok(Math.min(...antal) > 5, `minsta del ${Math.min(...antal)}`);
  assert.ok(Math.max(...antal) < 70, `största del ${Math.max(...antal)}`);
});

test("lasDel: bara heltal inom antalet delar", () => {
  assert.equal(lasDel("0"), 0);
  assert.equal(lasDel(String(KORT_DELAR - 1)), KORT_DELAR - 1);
  assert.equal(lasDel(String(KORT_DELAR)), null);
  for (const fel of ["", "-1", "01", "1.5", "abc", "1e2", " 3"]) assert.equal(lasDel(fel), null, fel);
});
