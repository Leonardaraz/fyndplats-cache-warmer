// Repot kör node --test (se package.json) — syskonmodulen importeras MED .ts.
//
// ☠️ VARFÖR TESTET FINNS. Morgonmejlet sa "⚠️ 2 sak(er) att kolla" varje dag,
// för lager som alltid är slut någonstans i en dropship-katalog (2026-10-29:
// 529 slut och 133 med lågt lager). Leonard 2026-10-29: bara avvikelser i
// rutan, lagersiffrorna står kvar i statusraden.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { morgonVarningar } from "./morgon-varningar.ts";

test("inga ej återhämtade kundvagnar → ingen varning", () => {
  assert.deepEqual(morgonVarningar({ available: true, notRecovered24h: 0 }), []);
});

test("ej återhämtade kundvagnar → en varning med antalet", () => {
  assert.deepEqual(morgonVarningar({ available: true, notRecovered24h: 3 }), [
    "3 ej återhämtade kundvagnar (24h)",
  ]);
});

test("kundvagnar som inte gick att läsa larmar inte", () => {
  // Felet syns redan i dashboardens egen not; en nolla är inte en avvikelse.
  assert.deepEqual(morgonVarningar({ available: false, notRecovered24h: 5 }), []);
});

test("☠️ dashboard.ts tar varningarna härifrån och lägger inga lagervarningar själv", () => {
  const kalla = readFileSync(new URL("./dashboard.ts", import.meta.url), "utf8");
  assert.match(kalla, /from "\.\/morgon-varningar"/);
  assert.match(kalla, /const warnings = morgonVarningar\(abandoned\);/);
  assert.doesNotMatch(kalla, /warnings\.push\(/);
});
