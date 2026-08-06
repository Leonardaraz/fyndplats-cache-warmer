// lib/faq-jsonld.test.ts
//
// Rökprov för FAQPage-modulen i BUTIKENS miljö (node --test). Fullständiga
// sviten (26 fall, inkl. golden-test mot generatorn buildTabSections) bor i
// motor-repot bredvid modulen — det här låser bara att kopian fungerar här:
// båda HTML-formerna ur produktionen, null-fallet, och script-escapingen.

import test from "node:test";
import assert from "node:assert/strict";
import { faqPageJsonLd, faqPageJsonLdScript, parseFaq } from "./faq-jsonld.ts";

const RICOS =
  '<h2>Vanliga frågor</h2><p><span style="font-weight: 700">Vilken ålder passar den för?</span></p>' +
  "<p>3–6 år, maxvikt 30 kg.</p>";

const GENERATOR =
  "<h2>Vanliga frågor</h2><p><strong>Ingår batterier?</strong><br/>Nej, de köps separat.</p>";

test("läser Ricos-formen (två stycken per par)", () => {
  assert.deepEqual(parseFaq(RICOS), [{ q: "Vilken ålder passar den för?", a: "3–6 år, maxvikt 30 kg." }]);
});

test("läser generatorns form (ett stycke per par)", () => {
  assert.deepEqual(parseFaq(GENERATOR), [{ q: "Ingår batterier?", a: "Nej, de köps separat." }]);
});

test("null utan FAQ-sektion — ingen script-tagg ska skrivas", () => {
  assert.equal(faqPageJsonLd("<h2>Tekniska specifikationer</h2><p>x</p>"), null);
  assert.equal(faqPageJsonLd(""), null);
});

test("giltig FAQPage-struktur", () => {
  const ld = faqPageJsonLd(RICOS) as { "@type": string; mainEntity: unknown[] };
  assert.equal(ld["@type"], "FAQPage");
  assert.equal(ld.mainEntity.length, 1);
});

test("script-serialiseringen kan inte bryta ut ur taggen", () => {
  const html = "<h2>Vanliga frågor</h2><p><strong>Vad händer vid &lt;/script&gt;?</strong><br/>Inget.</p>";
  const s = faqPageJsonLdScript(html);
  assert.ok(!s.includes("</script>"));
  assert.ok(!s.includes("<"));
});
