// Repot kör node --test (se package.json) — syskonmodulen importeras MED .ts.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { aggregateSoldUnits } from "./popularity.ts";

test("orderhämtningen i ISR-renderingen gör aldrig sidan dynamisk", () => {
  // getSoldUnits körs inne i getProducts, alltså i varje ISR-sida. Med
  // `cache: "no-store"` (eller revalidate 0) svarade /produkt/[slug] 500 på
  // varje kall instans: "Page changed from static to dynamic at runtime".
  const t = readFileSync("lib/popularity.ts", "utf8")
    .split("\n")
    .filter((rad) => !rad.trim().startsWith("//"))
    .join("\n");
  assert.doesNotMatch(t, /no-store/, "no-store gör ISR-sidan dynamisk vid körning");
  assert.doesNotMatch(t, /revalidate:\s*0\b/, "revalidate 0 gör ISR-sidan dynamisk vid körning");
});

test("aggregateSoldUnits räknar enheter per produkt och hoppar över annullerade", () => {
  const karta = aggregateSoldUnits([
    { status: "APPROVED", lineItems: [{ quantity: 2, catalogReference: { catalogItemId: "a" } }] },
    { status: "CANCELED", lineItems: [{ quantity: 5, catalogReference: { catalogItemId: "a" } }] },
    { lineItems: [{ catalogReference: { catalogItemId: "a" } }, { quantity: 3, catalogReference: { catalogItemId: "b" } }] },
    { lineItems: [{ quantity: 4 }] },
  ]);
  assert.equal(karta.get("a"), 3);
  assert.equal(karta.get("b"), 3);
  assert.equal(karta.size, 2);
});
