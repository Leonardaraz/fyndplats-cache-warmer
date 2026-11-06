// Klienten mot motorns golvrutt: cache, fel som ger listpris, och ett svar som
// aldrig läcker till loggen.

import { test, beforeEach } from "node:test";
import assert from "node:assert/strict";
import { GOLV_CACHE_MS, golvnyckel, hamtaGolv, tomGolvcache } from "./golv-klient.ts";

beforeEach(() => tomGolvcache());

function motor(rader: unknown[], status = 200) {
  const anrop: { url: string; kropp: { rader: unknown[] }; headers: Record<string, string>; cache?: string }[] = [];
  const fetchImpl = (async (url: string, init: RequestInit) => {
    anrop.push({ url, kropp: JSON.parse(String(init.body)), headers: init.headers as Record<string, string>, cache: init.cache });
    return new Response(JSON.stringify({ ok: true, rader }), { status });
  }) as unknown as typeof fetch;
  return { anrop, fetchImpl };
}

test("hämtar golvet med hemligheten, utan cache i Next, och sparar svaret en minut", async () => {
  const m = motor([{ produktId: "p1", variantId: "v1", golvOre: 15_900, kostnadOre: 11_500 }]);
  const svar = await hamtaGolv([{ produktId: "p1", variantId: "v1" }], { fetchImpl: m.fetchImpl, hemlighet: "h", nuMs: 0 });
  assert.deepEqual(svar.get(golvnyckel("p1", "v1")), { golvOre: 15_900, kostnadOre: 11_500 });
  assert.equal(m.anrop[0].headers.authorization, "Bearer h");
  assert.equal(m.anrop[0].cache, "no-store");
  assert.deepEqual(m.anrop[0].kropp, { rader: [{ produktId: "p1", variantId: "v1" }] });

  await hamtaGolv([{ produktId: "p1", variantId: "v1" }], { fetchImpl: m.fetchImpl, hemlighet: "h", nuMs: GOLV_CACHE_MS - 1 });
  assert.equal(m.anrop.length, 1, "inom minuten: från cachen");
  await hamtaGolv([{ produktId: "p1", variantId: "v1" }], { fetchImpl: m.fetchImpl, hemlighet: "h", nuMs: GOLV_CACHE_MS });
  assert.equal(m.anrop.length, 2, "efter minuten: från motorn igen");
});

test("motorn svarar fel eller inte alls: inget golv, ingenting cachat", async () => {
  const fel = motor([], 503);
  const a = await hamtaGolv([{ produktId: "p1", variantId: null }], { fetchImpl: fel.fetchImpl, hemlighet: "h", nuMs: 0 });
  assert.equal(a.get(golvnyckel("p1", null))?.golvOre, null);
  const kast = (async () => {
    throw new Error("timeout med kostnad 123");
  }) as unknown as typeof fetch;
  const b = await hamtaGolv([{ produktId: "p1", variantId: null }], { fetchImpl: kast, hemlighet: "h", nuMs: 0 });
  assert.equal(b.get(golvnyckel("p1", null))?.golvOre, null);
  const ok = motor([{ produktId: "p1", variantId: null, golvOre: 100, kostnadOre: 80 }]);
  const c = await hamtaGolv([{ produktId: "p1", variantId: null }], { fetchImpl: ok.fetchImpl, hemlighet: "h", nuMs: 1 });
  assert.equal(c.get(golvnyckel("p1", null))?.golvOre, 100, "felen sparades inte");
});

test("utan hemlighet: inget anrop och inget golv", async () => {
  const m = motor([]);
  const svar = await hamtaGolv([{ produktId: "p1", variantId: null }], { fetchImpl: m.fetchImpl, hemlighet: undefined, nuMs: 0 });
  assert.equal(m.anrop.length, 0);
  assert.equal(svar.get(golvnyckel("p1", null))?.golvOre, null);
});

test("trasiga rader i svaret godtas inte", async () => {
  const m = motor([
    { produktId: "p1", variantId: null, golvOre: 10.5, kostnadOre: 8 },
    { produktId: "p2", variantId: null, golvOre: 100, kostnadOre: null },
    { produktId: "p3", variantId: null, golvOre: null, kostnadOre: null, utan: "aliexpress" },
    { produktId: "okand", variantId: null, golvOre: 100, kostnadOre: 80 },
  ]);
  const svar = await hamtaGolv(
    ["p1", "p2", "p3"].map((produktId) => ({ produktId, variantId: null })),
    { fetchImpl: m.fetchImpl, hemlighet: "h", nuMs: 0 },
  );
  assert.equal(svar.get(golvnyckel("p1", null))?.golvOre, null);
  assert.equal(svar.get(golvnyckel("p2", null))?.golvOre, null);
  assert.deepEqual(svar.get(golvnyckel("p3", null)), { golvOre: null, kostnadOre: null, utan: "aliexpress" });
  assert.equal(svar.has(golvnyckel("okand", null)), false, "svar på något som inte efterfrågades tas inte med");
});

test("varje fråga ställs en gång, i delar om högst 200", async () => {
  const fragor = Array.from({ length: 450 }, (_, i) => ({ produktId: `p${i}`, variantId: null }));
  const m = motor([]);
  await hamtaGolv([...fragor, ...fragor], { fetchImpl: m.fetchImpl, hemlighet: "h", nuMs: 0 });
  assert.deepEqual(m.anrop.map((a) => a.kropp.rader.length), [200, 200, 50]);
});
