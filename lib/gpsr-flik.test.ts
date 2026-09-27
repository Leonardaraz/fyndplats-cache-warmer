// Run: node --test --experimental-strip-types 'lib/**/*.test.ts'
import test from "node:test";
import assert from "node:assert/strict";
import { GPSR_BRUKSANVISNING, gpsrFlikHtml, sakerhetUrBeskrivning, tolkaGpsr } from "./gpsr-flik.ts";

const SVAR = {
  marke: "HOMCOM",
  ansvarig: { namn: "Bolag GmbH", gata: "Gatan 1", postnummer: "12345", ort: "Hamburg", land: "Tyskland", epost: "info@example.com" },
  sakerhet: ["Maxbelastning: 120 kg.", "Endast för inomhusbruk."],
};

test("tolkaGpsr godtar ett komplett svar", () => {
  const g = tolkaGpsr(SVAR);
  assert.ok(g);
  assert.equal(g.marke, "HOMCOM");
  assert.deepEqual(g.sakerhet, ["Maxbelastning: 120 kg.", "Endast för inomhusbruk."]);
});

test("tolkaGpsr ger null när en uppgift lagen kräver saknas", () => {
  for (const f of ["namn", "gata", "ort", "epost"]) {
    const ansvarig = { ...SVAR.ansvarig, [f]: "" };
    assert.equal(tolkaGpsr({ ...SVAR, ansvarig }), null, f);
  }
  assert.equal(tolkaGpsr(null), null);
  assert.equal(tolkaGpsr({ saknas: true }), null);
});

test("tolkaGpsr tål fel typer i säkerhetslistan och ett saknat märke", () => {
  const g = tolkaGpsr({ ...SVAR, marke: "", sakerhet: [1, " ", "Ok."] });
  assert.ok(g);
  assert.equal(g.marke, null);
  assert.deepEqual(g.sakerhet, ["Ok."]);
});

test("fliken visar märke, tillverkare med post- och e-postadress, produkten och säkerheten", () => {
  const html = gpsrFlikHtml(tolkaGpsr(SVAR)!, "Soffa 3-sits");
  assert.match(html, /Varumärke:<\/strong> HOMCOM/);
  assert.match(html, /Tillverkare och ansvarig i EU:/);
  assert.match(html, /Bolag GmbH<br \/>Gatan 1<br \/>12345 Hamburg, Tyskland<br \/>E-post: info@example.com/);
  assert.match(html, /Soffa 3-sits/);
  assert.match(html, /<li>Maxbelastning: 120 kg\.<\/li><li>Endast för inomhusbruk\.<\/li>/);
  assert.ok(html.includes(GPSR_BRUKSANVISNING));
});

test("e-postadressen är text, inte en länk", () => {
  assert.doesNotMatch(gpsrFlikHtml(tolkaGpsr(SVAR)!, "X"), /mailto:|<a /);
});

test("allt från motorn escapas", () => {
  const html = gpsrFlikHtml(tolkaGpsr({ ...SVAR, marke: "<b>X</b>", sakerhet: ['<script>alert(1)</script>'] })!, "A & B");
  assert.doesNotMatch(html, /<script>|<b>X/);
  assert.match(html, /&lt;script&gt;/);
  assert.match(html, /A &amp; B/);
});

test("utan säkerhetsrader visas ändå bruksanvisningsraden", () => {
  const html = gpsrFlikHtml(tolkaGpsr({ ...SVAR, sakerhet: [] })!, "X");
  assert.match(html, new RegExp(`<ul><li>${GPSR_BRUKSANVISNING}</li></ul>`));
});

test("sakerhetUrBeskrivning läser listan under rubriken, fram till nästa rubrik", () => {
  const html = "<p>Ingress</p><h2>Vanliga frågor</h2><p>F?</p><h2>Produktsäkerhet</h2><ul><li>Maxbelastning: 120 kg.</li><li><span style=\"font-weight: 700\">Obs!</span> Endast för inomhusbruk.</li></ul><h2>Kontakta oss</h2><p>x</p>";
  assert.deepEqual(sakerhetUrBeskrivning(html), ["Maxbelastning: 120 kg.", "Obs! Endast för inomhusbruk."]);
});

test("sakerhetUrBeskrivning tar stycken när avsnittet saknar lista, och tål ä som a", () => {
  assert.deepEqual(sakerhetUrBeskrivning("<h2>Produktsakerhet</h2><p>Rekommenderad ålder: 3–5 år.</p><p></p>"), ["Rekommenderad ålder: 3–5 år."]);
});

test("sakerhetUrBeskrivning ger null utan avsnitt eller med tomt avsnitt", () => {
  assert.equal(sakerhetUrBeskrivning("<p>Bara text.</p>"), null);
  assert.equal(sakerhetUrBeskrivning("<h2>Produktsäkerhet</h2><h2>Kontakta oss</h2>"), null);
  assert.equal(sakerhetUrBeskrivning(undefined), null);
});
