import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { colorKeysFromOptions, colorLabel, colorOf } from "./variant-color-image.ts";

// Färgfacetten bygger på V3:s options. Testerna låser att vi läser VÄRDET och
// inte optionsnamnet — katalogen har färger under "Färg", "Variant",
// "Metallfärg" och "Color", och värdena är ofta inte rena färgord
// ("1-pack Borstad silver", "6mm Stil D").

const option = (namn: string, ...värden: string[]) => ({
  name: namn,
  choicesSettings: { choices: värden.map((name) => ({ name })) },
});

describe("colorKeysFromOptions", () => {
  it("hittar färgen oavsett vad optionen heter", () => {
    assert.deepEqual(colorKeysFromOptions([option("Färg", "Svart", "Vit")]), ["svart", "vit"]);
    assert.deepEqual(colorKeysFromOptions([option("Variant", "Svart", "Rosa")]), ["svart", "rosa"]);
    assert.deepEqual(colorKeysFromOptions([option("Metallfärg", "Guld")]), ["guld"]);
    assert.deepEqual(colorKeysFromOptions([option("Color", "Black")]), ["svart"]);
  });

  it("plockar färgordet ur en längre etikett", () => {
    assert.deepEqual(colorKeysFromOptions([option("Variant", "1-pack Borstad silver")]), ["silver"]);
    assert.deepEqual(colorKeysFromOptions([option("Färg", "Matt svart")]), ["svart"]);
  });

  it("böjningar landar på samma nyckel", () => {
    assert.deepEqual(colorKeysFromOptions([option("Färg", "Svarta", "svart", "SVART")]), ["svart"]);
  });

  it("tom lista när inget val bär ett färgord", () => {
    assert.deepEqual(colorKeysFromOptions([option("Storlek", "S", "M", "L")]), []);
    assert.deepEqual(colorKeysFromOptions([option("Variant", "6mm Stil D", "8mm Stil C")]), []);
  });

  it("ordningen är butikens, inte bokstavsordning", () => {
    assert.deepEqual(colorKeysFromOptions([option("Färg", "Vit", "Svart", "Blå")]), ["vit", "svart", "blå"]);
  });

  it("dolda val räknas inte", () => {
    const opts = [{
      name: "Färg",
      choicesSettings: { choices: [{ name: "Svart" }, { name: "Rosa", visible: false }] },
    }];
    assert.deepEqual(colorKeysFromOptions(opts), ["svart"]);
  });

  it("flera options slås ihop utan dubbletter", () => {
    const opts = [option("Färg", "Svart"), option("Metallfärg", "Svart", "Guld")];
    assert.deepEqual(colorKeysFromOptions(opts), ["svart", "guld"]);
  });

  it("tål saknad och trasig indata i stället för att kasta", () => {
    assert.deepEqual(colorKeysFromOptions(null), []);
    assert.deepEqual(colorKeysFromOptions(undefined), []);
    assert.deepEqual(colorKeysFromOptions([]), []);
    assert.deepEqual(colorKeysFromOptions([{}]), []);
    assert.deepEqual(colorKeysFromOptions([{ choicesSettings: null }]), []);
    assert.deepEqual(colorKeysFromOptions([{ choicesSettings: { choices: null } }]), []);
    assert.deepEqual(colorKeysFromOptions([option("Färg", "")]), []);
  });
});

describe("colorLabel / colorOf", () => {
  it("nyckeln är redan svensk — etiketten är den med versal", () => {
    assert.equal(colorLabel("svart"), "Svart");
    assert.equal(colorLabel("vinröd"), "Vinröd");
  });

  it("varje nyckel vi kan producera har en hex-kod att rita pricken med", () => {
    // Utan hex blir pricken osynlig. Om någon lägger till ett färgord i
    // COLOR_WORD_TO_KEY utan motsvarande BASE_HEX fångas det här.
    const alla = colorKeysFromOptions([
      option("Färg", "Svart", "Vit", "Grå", "Blå", "Röd", "Grön", "Gul", "Beige", "Khaki",
        "Natur", "Rosa", "Lila", "Brun", "Orange", "Guld", "Silver", "Turkos", "Marin",
        "Vinröd", "Champagne", "Kräm"),
    ]);
    assert.ok(alla.length >= 20, `förväntade minst 20 färgnycklar, fick ${alla.length}`);
    for (const key of alla) {
      assert.notEqual(colorOf(key), "", `${key} saknar hex`);
    }
  });
});
