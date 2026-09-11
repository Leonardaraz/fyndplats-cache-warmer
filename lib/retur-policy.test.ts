// Run: node --test --experimental-strip-types 'lib/**/*.test.ts'
//
// Texten här är avtalsvillkor mot konsument, inte marknadsföring. Testerna
// låser fast de tre saker som faktiskt var fel på sajten, så de inte kan
// smyga tillbaka nästa gång någon skriver om en sida.
import test from "node:test";
import assert from "node:assert/strict";
import { TOTAL_SUMMARY, TOTAL_SHORT, STATUTORY, VOLUNTARY, COMMON, TIMELINE, COMPLAINT, COMPLAINT_SHORT, SHIPPING_REFUND, REFUND_TIME, REFUND_SENTENCE, AVGIFT_PROCENT, AVGIFT_SENTENCE, POSTA_INOM_DAGAR } from "./retur-policy.ts";

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

const complaintText = [COMPLAINT.lead, ...COMPLAINT.points].join(" ").toLowerCase();

test("reklamationsrätten anges med sin verkliga längd", () => {
  // Treårsrätten stod på exakt en sida i hela repot. Den som fick ett fel efter
  // ett halvår läste "30 dagar" överallt annars och drog fel slutsats.
  assert.equal(/tre års reklamationsrätt|tre år/.test(complaintText), true);
  assert.equal(complaintText.includes("konsumentköplagen"), true);
  assert.equal(/tre år/.test(COMPLAINT_SHORT.toLowerCase()), true);
});

test("reklamationen hålls fristående från 30-dagarsfristen", () => {
  // Det är hela poängen: rättigheten gäller vare sig ångerfristen löpt ut eller
  // inte. Står det inte utskrivet läser kunden in vår 30-dagarsgräns i den.
  for (const t of [complaintText, COMPLAINT_SHORT.toLowerCase()]) {
    assert.equal(/oberoende|fristående|löpt ut/.test(t), true);
  }
});

test("tvåmånadersregeln skrivs som lagen skriver den", () => {
  // 5 kap. 2 § konsumentköplagen: en reklamation inom två månader ska ALLTID
  // anses ha lämnats i rätt tid. Köpvillkoren § 8 skrev "normalt" — svagare än
  // lagen, till kundens nackdel.
  assert.equal(/två månader/.test(complaintText), true);
  assert.equal(/alltid/.test(complaintText), true);
  assert.equal(/normalt anses/.test(complaintText), false);
});

test("vi står för returkostnaden vid godkänd reklamation", () => {
  assert.equal(/returkostnaden|returfrakten/.test(complaintText), true);
});

test("fraktåterbetalningen anges för BÅDA perioderna, aldrig villkorslöst", () => {
  // Ångerkvittot lovade "Har du betalat frakt återbetalas även standardfrakten"
  // utan villkor. Sant dag 1–14, falskt dag 15–30 — och mejlet kan inte veta
  // vilket, för det har varken leveransdatum eller period bland sina props.
  const t = SHIPPING_REFUND.toLowerCase();
  assert.equal(t.includes("14"), true, "dag 1–14-fallet saknas");
  assert.equal(/dag 15–30|15–30/.test(t), true, "dag 15–30-fallet saknas");
  assert.equal(/billigaste standardleverans/.test(t), true);
  assert.equal(/inte frakten till dig|inte.{0,20}frakten/.test(t), true);
});

test("återbetalningstiden är vår handläggning, inte bankens clearing", () => {
  // Sajten sa "5–10 bankdagar" på sju ställen. Leonard: det stämmer inte, ni är
  // klara på 2–3 arbetsdagar. Men de två tiderna får inte slås ihop — bankens
  // clearing ligger utanför vår kontroll, och ett enda löfte om 2–3 dagar vore
  // osant för var och en vars kortutgivare tar en vecka.
  assert.equal(REFUND_TIME, "2–3 arbetsdagar");
  assert.equal(/bankdagar/.test(REFUND_TIME), false, "vår handläggning mäts i arbetsdagar");
  assert.equal(/beror.{0,20}(på )?din bank/i.test(REFUND_SENTENCE), true, "bankens tid ska nämnas separat");
  assert.equal(REFUND_SENTENCE.includes("2–3 arbetsdagar"), true);
});

test("det frivilliga öppna köpet bär sin avgift och sin postningsfrist", () => {
  // De repo-breda proven kan bara se att en yta RENDERAR VOLUNTARY. De kan inte
  // se vad VOLUNTARY innehåller — ett mutationstest visade det: jag tog bort
  // avgiftspunkten ur listan och varenda grind förblev grön, eftersom sidorna
  // fortfarande refererade konstanten. Innehållet måste därför låsas här, i
  // källan, och inte hos konsumenterna.
  const punkter = VOLUNTARY.points.join(" ");
  assert.match(punkter, new RegExp(`${AVGIFT_PROCENT}\\s*%`), "avgiften saknas i VOLUNTARY");
  assert.match(punkter, /bearbetningsavgift/i);
  assert.match(punkter, new RegExp(`inom ${POSTA_INOM_DAGAR} dagar`), "postningsfristen saknas");
  assert.match(AVGIFT_SENTENCE, new RegExp(`${AVGIFT_PROCENT}\\s*%`));
});

test("avgiften och den korta fristen rör aldrig dag 1–14", () => {
  // 1 kap. 4 §: dag 1–14 finns en lagregel att vara sämre än, och ett villkor
  // som är det är utan verkan. Både avgiften och 7-dagarsfristen måste därför
  // säga ut att de gäller det frivilliga öppna köpet — annars kan de läsas som
  // att de gäller ångerrätten.
  const punkter = VOLUNTARY.points.join(" ");
  const avgift = VOLUNTARY.points.find((p) => /bearbetningsavgift/i.test(p)) ?? "";
  assert.match(avgift, /dag 1\s*[–-]\s*14/, "avgiftspunkten avgränsar sig inte mot ångerfristen");
  assert.match(avgift, /aldrig|inte/i);
  const frist = VOLUNTARY.points.find((p) => new RegExp(`inom ${POSTA_INOM_DAGAR} dagar`).test(p)) ?? "";
  assert.match(frist, /14 dagar/, "postningsfristen säger inte att lagen ger 14");
  assert.ok(!/dag 1\s*[–-]\s*14[^.]*(avgift|7 dagar)/i.test(punkter));

  // Och inget av det får ha smugit sig in i den lagstadgade perioden.
  const lag = [STATUTORY.lead, ...STATUTORY.points].join(" ");
  assert.ok(!/bearbetningsavgift/i.test(lag), "avgiften står under den lagstadgade ångerrätten");
  assert.ok(!new RegExp(`inom ${POSTA_INOM_DAGAR} dagar`).test(lag), "kort frist under ångerrätten");
});
