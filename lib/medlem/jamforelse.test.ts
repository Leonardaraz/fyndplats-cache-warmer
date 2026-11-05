// Medlemsprisets jämförelse (lib/medlem/jamforelse.ts): som kedjorna, och
// bara det som går att belägga enligt 7 a § prisinformationslagen.

import { test } from "node:test";
import assert from "node:assert/strict";
import { ettPris, jamforelseForMedlem } from "./jamforelse.ts";

test("det tidigare priset är listpriset: beloppet och procenten står", () => {
  assert.deepEqual(jamforelseForMedlem(186_900, 183_162, 186_900), { tidigareOre: 186_900, visaProcent: true });
});

test("☠️ ett lägre pris de senaste 30 dagarna: det står, men nivåns procent gör det inte", () => {
  // Nivåns 2 % räknas mot listpriset 1 869 kr. Mot det belagda priset 1 849 kr
  // är sänkningen mindre, och en procent ska räknas mot det belagda priset.
  assert.deepEqual(jamforelseForMedlem(186_900, 183_162, 184_900), { tidigareOre: 184_900, visaProcent: false });
});

test("☠️ inget belagt pris, eller ett som inte ligger över medlemspriset: ingen jämförelse och ingen procent", () => {
  assert.deepEqual(jamforelseForMedlem(186_900, 183_162, null), { visaProcent: false });
  assert.deepEqual(jamforelseForMedlem(186_900, 183_162, 183_162), { visaProcent: false });
  assert.deepEqual(jamforelseForMedlem(186_900, 183_162, 180_000), { visaProcent: false });
  assert.deepEqual(jamforelseForMedlem(186_900, 183_162, Number.NaN), { visaProcent: false });
});

test("prishistoriken gäller varianten bara när alla varianter har samma pris", () => {
  assert.equal(ettPris([49_900, 49_900, 49_900]), true);
  assert.equal(ettPris([49_900]), true);
  assert.equal(ettPris([49_900, 54_900]), false);
  assert.equal(ettPris([]), false);
});
