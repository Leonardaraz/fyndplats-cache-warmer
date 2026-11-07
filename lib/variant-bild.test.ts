// Run: node --test --experimental-strip-types 'lib/**/*.test.ts'
//
// Google-flödets bild per variant (valbilder + bildForVariant i
// lib/variant-color-image.ts). Uppmätt 2026-09-27: varianternas egen `media` i
// query-variants är produktens huvudbild på VARJE variant, så 121 av 122
// produkter med färgvarianter skickade samma bild för olika färger.
// Fixturerna nedan är avskrivna ur de riktiga V3-svaren samma dag.
import test from "node:test";
import assert from "node:assert/strict";
import { bildForVariant, valbilder, type V3Option } from "./variant-color-image.ts";

const U = (id: string) => `https://static.wixstatic.com/media/b379ce_${id}~mv2.jpg`;
const lm = (id: string) => [{ image: { url: U(id) } }];

// Balansbom för hund: Färg = Orange | Grå, båda med länkad bild.
const BALANSBOM: V3Option[] = [{
  id: "0b32a475", name: "Färg",
  choicesSettings: { choices: [
    { choiceId: "orange", name: "Orange", linkedMedia: lm("0f226726") },
    { choiceId: "gra", name: "Grå", linkedMedia: lm("387874c8") },
  ] },
}];
const variant = (...cids: string[]) => cids.map((choiceId) => ({ optionChoiceIds: { choiceId } }));

test("varje färg får sin egen länkade bild, inte huvudbilden", () => {
  const k = valbilder(BALANSBOM);
  assert.equal(bildForVariant(variant("orange"), k), U("0f226726"));
  assert.equal(bildForVariant(variant("gra"), k), U("387874c8"));
});

test("utan länkad bild: den statiska exporten, sedan alt-texten", () => {
  const opts: V3Option[] = [{ id: "f", name: "Färg", choicesSettings: { choices: [
    { choiceId: "svart", name: "Svart" },
    { choiceId: "vit", name: "Vit" },
    { choiceId: "rosa", name: "Rosa" },
  ] } }];
  const k = valbilder(
    opts,
    { Svart: U("statisk-svart") },
    [
      { url: U("huvud"), altText: "Hundgrind i svart stål bredvid en hund" },
      { url: U("vit"), altText: "Samma hundgrind i vitt utförande" },
    ],
  );
  assert.equal(bildForVariant(variant("svart"), k), U("statisk-svart"), "exporten före alt-texten");
  assert.equal(bildForVariant(variant("vit"), k), U("vit"), "alt-texten fyller det som saknas");
  assert.equal(bildForVariant(variant("rosa"), k), "", "ingen bild att hitta → tomt, flödet tar huvudbilden");
});

test("flera axlar: färgens bild vinner, och alt-text används inte (som på produktsidan)", () => {
  const opts: V3Option[] = [
    { id: "s", name: "Storlek", choicesSettings: { choices: [{ choiceId: "l", name: "L", linkedMedia: lm("storlekskort") }] } },
    { id: "f", name: "Färg", choicesSettings: { choices: [
      { choiceId: "bla", name: "Blå", linkedMedia: lm("bla") },
      { choiceId: "rod", name: "Röd" },
    ] } },
  ];
  const k = valbilder(opts, null, [{ url: U("rod"), altText: "Röd variant" }]);
  assert.equal(bildForVariant(variant("l", "bla"), k), U("bla"), "färgen äger bilden även när storleken står först");
  assert.equal(bildForVariant(variant("l", "rod"), k), U("storlekskort"), "saknas färgbild är övriga axlars bild reserv");
});

test("okända val och tomma kartor ger tomt", () => {
  assert.equal(bildForVariant(variant("finns-inte"), valbilder(BALANSBOM)), "");
  assert.equal(bildForVariant(variant("orange"), new Map()), "");
  assert.equal(bildForVariant(undefined, valbilder(BALANSBOM)), "");
  assert.equal(valbilder(undefined).size, 0);
});

// Väggkaminen 2026-11-07: storleken 91,4 cm länkar bara en måttritning, och
// Google avvisade den som huvudbild ("Promotional overlay").
const KAMIN: V3Option[] = [{
  id: "cbe5a7ed", name: "Storlek",
  choicesSettings: { choices: [
    { choiceId: "s91", name: "91,4 cm", linkedMedia: lm("matt-91") },
    { choiceId: "s152", name: "152,4 cm", linkedMedia: [...lm("huvud"), ...lm("matt-152")] },
  ] },
}];

test("utanStorlek: storlekens bild hoppas över, så flödet tar huvudbilden", () => {
  const k = valbilder(KAMIN);
  assert.equal(bildForVariant(variant("s91"), k, { utanStorlek: true }), "");
  assert.equal(bildForVariant(variant("s152"), k, { utanStorlek: true }), "");
  // Utan flaggan som förut: storlekens bild (blir extrabild i flödet).
  assert.equal(bildForVariant(variant("s91"), k), U("matt-91"));
});

test("utanStorlek: färgens bild är kvar, och andra axlar än storlek behåller sin", () => {
  const opts: V3Option[] = [
    { id: "s", name: "Storlek", choicesSettings: { choices: [{ choiceId: "l", name: "L", linkedMedia: lm("storlekskort") }] } },
    { id: "f", name: "Färg", choicesSettings: { choices: [{ choiceId: "bla", name: "Blå", linkedMedia: lm("bla") }, { choiceId: "rod", name: "Röd" }] } },
    { id: "m", name: "Modell", choicesSettings: { choices: [{ choiceId: "pro", name: "Pro", linkedMedia: lm("pro") }] } },
  ];
  const k = valbilder(opts);
  assert.equal(bildForVariant(variant("l", "bla"), k, { utanStorlek: true }), U("bla"));
  assert.equal(bildForVariant(variant("l", "rod"), k, { utanStorlek: true }), "", "bara storleksbild → huvudbilden");
  assert.equal(bildForVariant(variant("l", "rod", "pro"), k, { utanStorlek: true }), U("pro"), "modellens bild är ingen måttritning");
});

test("storleksaxeln känns igen på samma namn som flödets g:size", () => {
  for (const name of ["Storlek", "storlek", "Längd", "Size", "Length", " Storlek "]) {
    const k = valbilder([{ id: "x", name, choicesSettings: { choices: [{ choiceId: "a", name: "A", linkedMedia: lm("a") }] } }]);
    assert.equal(bildForVariant(variant("a"), k, { utanStorlek: true }), "", name);
  }
  for (const name of ["Modell", "Typ", "Förpackning", "Storleksguide", "Volym"]) {
    const k = valbilder([{ id: "x", name, choicesSettings: { choices: [{ choiceId: "a", name: "A", linkedMedia: lm("a") }] } }]);
    assert.equal(bildForVariant(variant("a"), k, { utanStorlek: true }), U("a"), name);
  }
});
