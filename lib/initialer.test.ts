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
