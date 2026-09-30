// lib/auction-motor.test.ts
//
// Run with: `pnpm test` (node --test --experimental-strip-types).
// Fyndauktionen läses och avslutas via motorn. Det som testas är riktningarna
// där ett fel når kunden: en läsning som tyst blir tom, ett avslut som aldrig
// når motorn, och en hemlighet som saknas.

import test from "node:test";
import assert from "node:assert/strict";
import { avslutaHosMotorn, hämtaAuktionsrader } from "./auction-motor.ts";

type Anrop = { url: string; init: RequestInit & { next?: unknown } };

function falskFetch(svar: () => Response | Promise<Response>) {
  const anrop: Anrop[] = [];
  const f = (async (url: string, init: RequestInit) => {
    anrop.push({ url: String(url), init });
    return svar();
  }) as unknown as typeof fetch;
  return { f, anrop };
}

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json" } });

const BAS = "https://motor.test/api/auctions";

test("live: GET med hemligheten, samma cache som förut, rader utan slug sorteras bort", async () => {
  const { f, anrop } = falskFetch(() => json({ ok: true, lager: "postgres", rader: [{ slug: "a", slot: 1 }, { slot: 2 }] }));
  const rader = await hämtaAuktionsrader("live", { fetchImpl: f, hemlighet: "h", bas: BAS });
  assert.deepEqual(rader, [{ slug: "a", slot: 1 }]);
  assert.equal(anrop.length, 1);
  assert.equal(anrop[0].url, `${BAS}/rader?status=live`);
  assert.equal((anrop[0].init.headers as Record<string, string>).authorization, "Bearer h");
  assert.deepEqual(anrop[0].init.next, { revalidate: 15, tags: ["auctions"] });
});

test("sold: ber om 50 (butiken filtrerar och kapar själv)", async () => {
  const { f, anrop } = falskFetch(() => json({ rader: [] }));
  await hämtaAuktionsrader("sold", { fetchImpl: f, hemlighet: "h", bas: BAS });
  assert.equal(anrop[0].url, `${BAS}/rader?status=sold&limit=50`);
});

test("fail-open: fel status, trasig kropp eller nätfel ger tom lista, aldrig ett kast", async () => {
  for (const svar of [() => json({ ok: false }, 500), () => new Response("inte json"), () => { throw new Error("nät"); }]) {
    const { f } = falskFetch(svar);
    assert.deepEqual(await hämtaAuktionsrader("live", { fetchImpl: f, hemlighet: "h", bas: BAS }), []);
  }
});

test("☠️ utan hemlighet frågas motorn inte alls (och det loggas)", async () => {
  const { f, anrop } = falskFetch(() => json({ rader: [{ slug: "a" }] }));
  assert.deepEqual(await hämtaAuktionsrader("live", { fetchImpl: f, hemlighet: undefined, bas: BAS }), []);
  assert.equal(anrop.length, 0);
});

test("avslut: POST med orderns id:n, svaret är de avslutade sluggarna", async () => {
  const { f, anrop } = falskFetch(() => json({ ok: true, avslutade: ["hundbadd", 7], fel: [] }));
  const slugs = await avslutaHosMotorn(["p1", "p2"], { fetchImpl: f, hemlighet: "h", bas: BAS });
  assert.deepEqual(slugs, ["hundbadd"]);
  assert.equal(anrop[0].url, `${BAS}/avsluta`);
  assert.equal(anrop[0].init.method, "POST");
  assert.deepEqual(JSON.parse(String(anrop[0].init.body)), { productIds: ["p1", "p2"] });
  assert.equal((anrop[0].init.headers as Record<string, string>).authorization, "Bearer h");
  assert.equal(anrop[0].init.cache, "no-store");
});

test("avslut utan id:n är det normala — motorn anropas inte", async () => {
  const { f, anrop } = falskFetch(() => json({}));
  assert.deepEqual(await avslutaHosMotorn([], { fetchImpl: f, hemlighet: "h", bas: BAS }), []);
  assert.equal(anrop.length, 0);
});

test("☠️ avslut KASTAR när motorn svarar fel eller hemligheten saknas — webhooken loggar det", async () => {
  const fel = falskFetch(() => json({ ok: false }, 503));
  await assert.rejects(avslutaHosMotorn(["p1"], { fetchImpl: fel.f, hemlighet: "h", bas: BAS }), /503/);
  const utan = falskFetch(() => json({}));
  await assert.rejects(avslutaHosMotorn(["p1"], { fetchImpl: utan.f, hemlighet: undefined, bas: BAS }), /REVIEW_INGEST_SECRET/);
  assert.equal(utan.anrop.length, 0);
});
