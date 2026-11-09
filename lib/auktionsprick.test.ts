// Auktionspricken i menyn: platsen hålls hela dagen, bara synligheten byter.

import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

test("auktionspricken tar alltid sin plats, så menyraden inte flyttar sig när den tänds (CLS 0,0002 → 0)", () => {
  const komp = readFileSync(new URL("../components/auction-dot.tsx", import.meta.url), "utf8");
  const css = readFileSync(new URL("../app/globals.css", import.meta.url), "utf8");
  // Pricken renderas alltid; utanför auktionsdagen bär den data-av.
  assert.match(komp, /return <span className="nav-adot" data-av=\{on \? undefined : ""\} aria-hidden="true" \/>;/);
  assert.doesNotMatch(komp, /on \? <span[^>]*\/> : null/);
  // Osynlig utan att lämna sin plats, och ingen puls medan den är släckt.
  assert.match(css, /\.nav-adot\[data-av\]\{visibility:hidden\}/);
  assert.match(css, /\.nav-adot\[data-av\]::after\{animation:none\}/);
  assert.doesNotMatch(css, /\.nav-adot\[data-av\]\{[^}]*display:none/);
});
