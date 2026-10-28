// lib/ae-etikett.test.ts
//
// Run with: `npm test` (node --test --experimental-strip-types).
//
// Händelserna från AliExpress-källan får samma rubriker som 17TRACK-vägen.

import test from "node:test";
import assert from "node:assert/strict";
import { AE_ETIKETT } from "./ae-etikett.ts";
import { deriveAeStatus } from "./ae-track.ts";

const rubrik = (text: string) => AE_ETIKETT[deriveAeStatus([text])];

test("varje händelse får en rubrik ur sin egen text", () => {
  assert.equal(rubrik("Delivered"), "Levererad");
  assert.equal(rubrik("Out for delivery"), "Ute för leverans");
  assert.equal(rubrik("Package arrived at pick-up point"), "Finns för upphämtning");
  assert.equal(rubrik("Arrived at sorting center"), "På väg");
  assert.equal(rubrik("The seller has shipped your package"), "På väg");
  // Ett misslyckat försök är ingen leverans.
  assert.notEqual(rubrik("Delivery attempt failed, package not delivered"), "Levererad");
});

test("rubrikerna är samma ord som 17TRACK-vägens", () => {
  // STAGE_LABEL_SV i app/api/track/route.ts.
  const stage = new Set(["Levererad", "Ute för leverans", "Finns för upphämtning", "På väg"]);
  for (const r of Object.values(AE_ETIKETT)) assert.ok(stage.has(r), r);
});
