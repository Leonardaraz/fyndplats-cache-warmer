// Run: node --test --experimental-strip-types 'lib/**/*.test.ts'
//
// Texten här är avtalsvillkor mot konsument, inte marknadsföring. Testerna
// låser fast de tre saker som faktiskt var fel på sajten, så de inte kan
// smyga tillbaka nästa gång någon skriver om en sida.
import test from "node:test";
import assert from "node:assert/strict";
import { TOTAL_SUMMARY, TOTAL_SHORT, STATUTORY, VOLUNTARY, COMMON, TIMELINE } from "./retur-policy.ts";

const statutoryText = [STATUTORY.lead, ...STATUTORY.points].join(" ").toLowerCase();
const voluntaryText = [VOLUNTARY.lead, ...VOLUNTARY.points].join(" ").toLowerCase();

test("den lagstadgade perioden villkoras aldrig med oanvänd vara", () => {
  // Felet på /angra-kop: "Varan ska vara oanvänd och i originalförpackning"
  // stod under rubriken "Så fungerar ångerrätten". Ångerrätten får inte
  // villkoras så — kunden har rätt att undersöka varan som i en butik.
  for (const ord of ["oanvänd", "obruten", "säljbart skick"]) {
    assert.equal(statutoryText.includes(ord), false, `"${ord}" hör inte hemma i dag 1–14`);
  }
});

test("värdeminskningsavdraget nämns — annars får vi inte göra det", () => {
  // 2 kap. 15 § 1 st 2 distansavtalslagen: avdraget kräver att vi informerat
  // om möjligheten i förväg. Ordet fanns inte någonstans på sajten.
  assert.equal(statutoryText.includes("värdeminskning"), true);
});

test("undersökningsrätten står med", () => {
  assert.equal(/fysisk butik|undersöka/.test(statutoryText), true);
});

test("oanvänd-kravet ligger i den frivilliga perioden, där det hör hemma", () => {
  assert.equal(voluntaryText.includes("oanvänd"), true);
  assert.equal(voluntaryText.includes("dag 15–30"), true);
});

test("totalen kan inte läsas som 14 + 30 = 44 dagar", () => {
  // "Utöver detta har du 30 dagars öppet köp" var precis den läsningen.
  assert.equal(TOTAL_SUMMARY.includes("totalt 30 dagar"), true);
  assert.equal(/utöver .{0,20}(har du|erbjuder).{0,20}30 dagar/i.test(TOTAL_SUMMARY), false);
  assert.equal(TOTAL_SHORT.includes("30 dagar"), true);
});

test("båda perioderna namnges och åtskiljs", () => {
  assert.equal(TOTAL_SUMMARY.includes("14"), true);
  assert.equal(TOTAL_SUMMARY.toLowerCase().includes("dag 15–30"), true);
  assert.deepEqual(TIMELINE.map((t) => t.range), ["Dag 1–14", "Dag 15–30"]);
});

test("standardfrakten återbetalas, merkostnaden för dyrare leverans inte", () => {
  // 2 kap. 15 § 1 st 1: konsumenten står bara för förhöjda leveranskostnader
  // som beror på eget val av leveransmetod.
  assert.equal(/billigaste standardleverans/i.test(statutoryText), true);
  assert.equal(/dyrare leveranssätt|merkostnad/i.test(statutoryText), true);
});

test("reklamation hålls skild från ångerrätt", () => {
  const common = COMMON.join(" ").toLowerCase();
  assert.equal(common.includes("reklamation"), true);
  assert.equal(common.includes("inte en ångran"), true);
});

test("ingen period utlovar något utan innehåll", () => {
  for (const p of [STATUTORY, VOLUNTARY]) {
    assert.ok(p.lead.length > 40, p.label);
    assert.ok(p.points.length >= 2, p.label);
    assert.ok(p.points.every((x) => x.trim().endsWith(".")), `${p.label}: varje punkt ska vara en hel mening`);
  }
});
