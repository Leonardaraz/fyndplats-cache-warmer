// ☠️ COMPLIANCE, INTE PRESENTATION.
//
// UCPD artikel 7.6 kräver upplysning om huruvida och hur vi säkerställer att
// recensionerna kommer från konsumenter som faktiskt använt produkten. Bilaga I
// punkt 23b förbjuder att påstå att de gör det utan rimliga åtgärder för att
// kontrollera det.
//
// Sidan märkte tidigare bara egna kunder ("✓ Verifierat köp") och lämnade
// resten omärkta. Det räckte så länge resten var AliExpress-köpares omdömen om
// samma vara. Aosom-recensionerna är hämtade från en LEVERANTÖRS sajt, och att
// visa dem omärkta under rubriken "Kundrecensioner" är själva överträdelsen.
//
// Testet låser den enda riktning som är farlig: att något okänt räknas som vår
// egen kund.

import { test } from "node:test";
import assert from "node:assert/strict";
import { härkomst, normaliseraSource, upplysning } from "./review-source.ts";

test("☠️ okänt ursprung blir ALDRIG vår egen kund", () => {
  // Alla rader före 2026-08-17 saknar fältet och är AE-importer. Att låta dem
  // falla tillbaka på "customer" hade varit överträdelsen själv.
  for (const rå of [undefined, null, "", "   ", "AliExpress ", "okänt", "CUSTOMERS", "kund"]) {
    const s = normaliseraSource(rå as string | undefined);
    assert.notEqual(s, "customer", `"${rå}" fick inte bli customer`);
    assert.equal(härkomst(s).förstahand, false);
  }
});

test("de tre kända ursprungen känns igen, versalokänsligt", () => {
  assert.equal(normaliseraSource("customer"), "customer");
  assert.equal(normaliseraSource("Customer"), "customer");
  assert.equal(normaliseraSource("aosom"), "aosom");
  assert.equal(normaliseraSource("AOSOM"), "aosom");
  assert.equal(normaliseraSource("aliexpress"), "aliexpress");
});

test("bara egen kund får den gröna verifierings-etiketten", () => {
  assert.equal(härkomst("customer").etikett, "✓ Verifierat köp");
  assert.equal(härkomst("customer").förstahand, true);

  for (const s of ["aosom", "aliexpress", "unknown"] as const) {
    assert.equal(härkomst(s).förstahand, false);
    assert.notEqual(härkomst(s).etikett, "✓ Verifierat köp");
    assert.ok(härkomst(s).etikett.length > 0, "varje rad MÅSTE ha en etikett");
  }
});

test("☠️ en Aosom-recension säger att den kommer från leverantören", () => {
  // Det räcker inte att säga "importerat" — bilaga I §23b handlar om att inte
  // presentera andras omdömen som egna kunders, och en leverantörs sajt är den
  // uppgift som gör skillnaden begriplig för kunden.
  assert.match(härkomst("aosom").etikett, /leverantör/i);
});

test("upplysningen uteblir när ALLA är egna kunder", () => {
  // Då är "✓ Verifierat köp" vid varje rad hela upplysningen som behövs, och
  // en extra brasklapp hade bara varit brus.
  assert.equal(upplysning(["customer", "customer"]), null);
  assert.equal(upplysning([]), null);
});

test("☠️ upplysningen KOMMER så fort en enda rad är importerad", () => {
  for (const blandning of [
    ["aosom"],
    ["unknown"],
    ["aliexpress"],
    ["customer", "aosom"],
    ["customer", "unknown"],
  ] as const) {
    const text = upplysning([...blandning]);
    assert.ok(text, `${blandning.join("+")} måste ge en upplysning`);
    // Den ska säga det obekväma: vi har inte kontrollerat dem.
    assert.match(text!, /kan inte kontrollera/i);
    assert.match(text!, /inte våra kunders/i);
  }
});

test("upplysningen nämner den egna kontrollen bara när det FINNS egna omdömen", () => {
  const blandat = upplysning(["customer", "aosom"])!;
  assert.match(blandat, /Verifierat köp/);

  const baraImporterade = upplysning(["aosom", "unknown"])!;
  // Utan egna omdömen vore meningen om verifierade köp ett tomt löfte.
  assert.ok(!baraImporterade.includes("Verifierat köp"));
});
