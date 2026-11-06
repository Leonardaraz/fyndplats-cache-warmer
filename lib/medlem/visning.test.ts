// Run: node --test --experimental-strip-types 'lib/**/*.test.ts'
//
// Texterna på Mina sidor som granskningen 2026-11-04 hittade fel i.
import test from "node:test";
import assert from "node:assert/strict";
import { REGLER_V1, medManuellNiva, nivalage, type KPost } from "./niva.ts";
import { arHogstaNivan, halsning, inteRaknadText, kvittoFelText, visaKvitto, visaSparningVantas, visaUppmaning } from "./visning.ts";

const DAG = 20_400; // ett dagnummer i november 2025
const iso = (dag: number) => new Date(dag * 86_400_000 + 12 * 3_600_000).toISOString();
const kop = (id: string, dag: number, kr: number): KPost => ({ orderId: id, betald: iso(dag), raknas: true, varorOre: kr * 100, aterbetalningar: [] });

test("☠️ 'högsta nivån' bara på den översta nivån, inte på en lägre nivå satt för hand", () => {
  const vip = nivalage([kop("a", DAG - 10, 60_000)], DAG, REGLER_V1);
  assert.equal(vip.niva.namn, "VIP");
  assert.equal(arHogstaNivan(vip, REGLER_V1), true);

  // Räknat Guld (5 000 kr), men kundtjänst har satt Brons: nästa nivå (Silver)
  // är redan passerad, så `nasta` saknas. Det är inte den högsta nivån.
  const guld = nivalage([kop("b", DAG - 10, 5_000)], DAG, REGLER_V1);
  const brons = medManuellNiva(guld, { namn: "Brons" }, REGLER_V1);
  assert.equal(brons.niva.namn, "Brons");
  assert.equal(brons.nasta, null);
  assert.equal(arHogstaNivan(brons, REGLER_V1), false);

  assert.equal(arHogstaNivan(guld, REGLER_V1), false);
});

test("☠️ en ny betald order som inte räknas sägs inte vara äldre än ett år", () => {
  assert.equal(inteRaknadText("betald", 7), "Räknas inte i nivån.");
  assert.equal(inteRaknadText("betald", 364), "Räknas inte i nivån.");
  assert.equal(inteRaknadText("betald", 365), "Räknas inte längre, köpet är äldre än ett år.");
  assert.equal(inteRaknadText("delvis-aterbetald", 400), "Räknas inte längre, köpet är äldre än ett år.");
  assert.equal(inteRaknadText("avbruten", 3), "Räknas inte, ordern är avbruten.");
  assert.equal(inteRaknadText("obetald", 3), "Räknas från dagen du betalar.");
  assert.equal(inteRaknadText("aterbetald", 3), "Räknas inte, hela beloppet är återbetalt.");
});

test("☠️ 'spårning kommer' bara för en ny betald order, inte för ett halvår gammal leverans", () => {
  assert.equal(visaSparningVantas("betald", 0), true);
  assert.equal(visaSparningVantas("betald", 30), true);
  assert.equal(visaSparningVantas("betald", 31), false);
  assert.equal(visaSparningVantas("betald", 180), false);
  assert.equal(visaSparningVantas("delvis-aterbetald", 5), true);
  assert.equal(visaSparningVantas("avbruten", 1), false);
  assert.equal(visaSparningVantas("obetald", 1), false);
  assert.equal(visaSparningVantas("aterbetald", 1), false);
});

test("uppmaningen att handla för att behålla nivån visas bara de sista 60 dagarna", () => {
  assert.equal(visaUppmaning(null, DAG), false);
  assert.equal(visaUppmaning(undefined, DAG), false);
  assert.equal(visaUppmaning(DAG + 353, DAG), false);
  assert.equal(visaUppmaning(DAG + 61, DAG), false);
  assert.equal(visaUppmaning(DAG + 60, DAG), true);
  assert.equal(visaUppmaning(DAG + 14, DAG), true);
  assert.equal(visaUppmaning(DAG + 1, DAG), true);
});

test("kvittolänken bara på en betald order, och varje skäl har en egen text", () => {
  assert.equal(visaKvitto("betald"), true);
  assert.equal(visaKvitto("delvis-aterbetald"), true);
  for (const s of ["aterbetald", "avbruten", "obetald"] as const) assert.equal(visaKvitto(s), false);
  const texter = ["obetald", "avbruten", "inget-kvitto", "inte-din", "utloggad", undefined].map(kvittoFelText);
  assert.equal(new Set(texter).size, texter.length);
  assert.equal(kvittoFelText("saknas"), kvittoFelText("inte-din"));
  assert.match(kvittoFelText("tillfalligt"), /just nu/);
});

test("rubriken: 'Välkommen' den dag kontot skapas, sedan 'Välkommen tillbaka' (audit 2026-11-06)", () => {
  assert.equal(halsning(DAG, DAG), "Välkommen");
  assert.equal(halsning(DAG - 1, DAG), "Välkommen tillbaka");
  assert.equal(halsning(null, DAG), "Välkommen tillbaka", "okänt datum ger det vanliga");
});
