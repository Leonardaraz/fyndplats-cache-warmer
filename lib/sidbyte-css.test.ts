// Ingen övergång mellan dokument (app/globals.css, avsnitt #9). Den gav
// dubbla sidor vid kategoribyten och en suddig skärmbild efter bakåt på
// iPhone (2026-10-07).
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const css = readFileSync(new URL("../app/globals.css", import.meta.url), "utf8").replace(/\/\*[\s\S]*?\*\//g, "");

test("globals.css slår inte på övergångar mellan dokument", () => {
  assert.doesNotMatch(css, /@view-transition/);
  assert.doesNotMatch(css, /view-transition-name/);
  assert.doesNotMatch(css, /::view-transition/);
});
