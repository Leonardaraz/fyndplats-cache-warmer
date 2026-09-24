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

import { lasSlugs, KORT_GALLERI_MAX_SLUGS } from "./kort-galleri.ts";

test("lasSlugs: giltiga, unika, sorterade och kapade", () => {
  assert.deepEqual(lasSlugs("b-2,a-1,b-2, c ,<script>,../x"), ["a-1", "b-2", "c"]);
  assert.deepEqual(lasSlugs(null), []);
  assert.deepEqual(lasSlugs(""), []);
  const många = Array.from({ length: 100 }, (_, i) => `p${String(i).padStart(3, "0")}`).join(",");
  assert.equal(lasSlugs(många).length, KORT_GALLERI_MAX_SLUGS);
});
