import test from "node:test";
import assert from "node:assert/strict";
import { isWixOrderGuid, resolveWixOrderId } from "./wix-order-id.ts";

// Det verkliga id:t och det verkliga numret ur felet 2026-08-22: kunden fick
// länken /omdome/<token med "10019"> och sidan svarade 404.
const GUID = "f7a1c2d4-9b3e-4a11-8c5d-0e6f2a7b9c13";
const NUMMER = "10019";

test("GUID känns igen, ordernummer gör det inte", () => {
  assert.equal(isWixOrderGuid(GUID), true);
  assert.equal(isWixOrderGuid(GUID.toUpperCase()), true);
  assert.equal(isWixOrderGuid(NUMMER), false);
  assert.equal(isWixOrderGuid(""), false);
  // Nästan-GUID: rätt tecken, fel gruppering. Ska inte passera.
  assert.equal(isWixOrderGuid("f7a1c2d49b3e4a118c5d0e6f2a7b9c13"), false);
});

test("ett GUID lämnas orört och kostar ingen sökning", async () => {
  let anrop = 0;
  const ut = await resolveWixOrderId(GUID, async () => {
    anrop++;
    return "fel-id";
  });
  assert.equal(ut, GUID);
  assert.equal(anrop, 0, "webhook-vägen får inte bli ett extra Wix-anrop långsammare");
});

test("ett ordernummer slås upp till orderns id", async () => {
  const sett: string[] = [];
  const ut = await resolveWixOrderId(NUMMER, async (n) => {
    sett.push(n);
    return GUID;
  });
  assert.equal(ut, GUID);
  assert.deepEqual(sett, [NUMMER]);
});

test("blanksteg runt värdet fäller inte uppslaget", async () => {
  assert.equal(await resolveWixOrderId(`  ${GUID}  `, async () => null), GUID);
  assert.equal(await resolveWixOrderId(` ${NUMMER} `, async () => GUID), GUID);
});

test("tomt in ger null ut, utan sökning", async () => {
  let anrop = 0;
  const räkna = async () => {
    anrop++;
    return GUID;
  };
  assert.equal(await resolveWixOrderId("", räkna), null);
  assert.equal(await resolveWixOrderId(null, räkna), null);
  assert.equal(await resolveWixOrderId(undefined, räkna), null);
  assert.equal(await resolveWixOrderId("   ", räkna), null);
  assert.equal(anrop, 0);
});

test("ingen träff ger null — vi gissar aldrig fram ett id", async () => {
  assert.equal(await resolveWixOrderId(NUMMER, async () => null), null);
  assert.equal(await resolveWixOrderId(NUMMER, async () => "   "), null);
});

test("en sökning som kastar ger null i stället för att fälla anroparen", async () => {
  const ut = await resolveWixOrderId(NUMMER, async () => {
    throw new Error("Wix nere");
  });
  assert.equal(ut, null);
});
