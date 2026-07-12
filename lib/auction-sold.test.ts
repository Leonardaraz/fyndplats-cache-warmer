// lib/auction-sold.test.ts
//
// Run with: `pnpm test` (node --test --experimental-strip-types).
// Verifierar återställningslogiken för direkt-sålda auktioner: per-variant-
// trackar vinner över enkel-pris, och trasiga trackar faller aldrig tillbaka
// på fel pris.

import test from "node:test";
import assert from "node:assert/strict";
import { restoreTargets } from "./auction-sold.ts";

test("restoreTargets: per-variant-trackar → varje variant till SITT listpris, ingen uniform", () => {
  const { byVariant, uniform } = restoreTargets({
    listPrice: 359,
    variantPrices: [
      { wixVariantId: "v1", listPrice: 359 },
      { wixVariantId: "v2", listPrice: 449 },
    ],
  });
  assert.equal(byVariant.get("v1"), 359);
  assert.equal(byVariant.get("v2"), 449);
  assert.equal(uniform, null); // varianter utanför trackarna lämnas orörda
});

test("restoreTargets: utan trackar → uniform = listPrice på alla varianter", () => {
  const { byVariant, uniform } = restoreTargets({ listPrice: 599 });
  assert.equal(byVariant.size, 0);
  assert.equal(uniform, 599);
});

test("restoreTargets: trasiga trackar (saknat id/pris) hoppas över", () => {
  const { byVariant, uniform } = restoreTargets({
    listPrice: 629,
    variantPrices: [{ wixVariantId: "v1" }, { listPrice: 100 }],
  });
  assert.equal(byVariant.size, 0);
  // Alla trackar var trasiga → beter sig som enkel-pris-läget.
  assert.equal(uniform, 629);
});

test("restoreTargets: varken trackar eller listPrice → ingenting röres", () => {
  const { byVariant, uniform } = restoreTargets({});
  assert.equal(byVariant.size, 0);
  assert.equal(uniform, null);
});
