// lib/kassa/forsprang.test.ts — kassans två genvägar (lib/kassa/flode.ts):
// landets PATCH hoppas bara över när den inte skulle ändra något, och
// förberedelsens första läsningar startar före växeln utan att göras två gånger.
import { test } from "node:test";
import assert from "node:assert/strict";
import { landRedanSatt, medForsprang, type Korg, type StripeKassaDeps } from "./flode.ts";

const korgMed = (address?: { country?: string; postalCode?: string }): Korg => ({ id: "k", deliveryInfo: address ? { address } : {} });

test("landRedanSatt: bara Sverige med samma postnummer (eller inget i båda) hoppar över", () => {
  assert.equal(landRedanSatt(korgMed({ country: "SE", postalCode: "434 30" }), "434 30"), true);
  assert.equal(landRedanSatt(korgMed({ country: "SE", postalCode: "43430" }), "434 30"), true, "Wix kan skriva numret utan mellanslag");
  assert.equal(landRedanSatt(korgMed({ country: "SE" }), null), true);
  // Annars görs PATCH:en som förut.
  assert.equal(landRedanSatt(korgMed({ country: "SE", postalCode: "434 30" }), "111 22"), false);
  assert.equal(landRedanSatt(korgMed({ country: "SE", postalCode: "434 30" }), null), false, "numret i korgen men inte i formuläret");
  assert.equal(landRedanSatt(korgMed({ country: "SE" }), "434 30"), false);
  assert.equal(landRedanSatt(korgMed({ country: "US", postalCode: "434 30" }), "434 30"), false, "serverns land (E0-provet)");
  assert.equal(landRedanSatt(korgMed(), null), false, "ingen adress än");
  assert.equal(landRedanSatt(null, null), false);
});

/** Låtsas-beroenden som räknar varje läsning. */
function rakneverk(opt: { korgFel?: boolean } = {}) {
  const anrop = { korg: [] as string[], avsikt: [] as string[] };
  const deps = {
    hamtaKorg: async (id: string) => {
      anrop.korg.push(id);
      if (opt.korgFel) throw new Error("wix 503");
      return { id, lineItems: [] } as Korg;
    },
    hamtaAvsikt: async (id: string) => {
      anrop.avsikt.push(id);
      return { id, status: "requires_payment_method" } as never;
    },
  } as unknown as StripeKassaDeps;
  return { deps, anrop };
}

test("medForsprang: läsningarna startar direkt och första anropet får dem", async () => {
  const { deps, anrop } = rakneverk();
  const med = medForsprang(deps, "korg-1", "pi_1");
  // Startade innan förberedelsen frågat (medan rutten läser växeln).
  assert.deepEqual(anrop, { korg: ["korg-1"], avsikt: ["pi_1"] });
  assert.equal((await med.hamtaKorg("korg-1"))?.id, "korg-1");
  assert.equal(((await med.hamtaAvsikt("pi_1")) as { id: string } | null)?.id, "pi_1");
  assert.deepEqual(anrop, { korg: ["korg-1"], avsikt: ["pi_1"] }, "ingen läsning görs två gånger");
  // Nästa anrop läser på nytt, som förut.
  await med.hamtaKorg("korg-1");
  await med.hamtaAvsikt("pi_1");
  assert.deepEqual(anrop, { korg: ["korg-1", "korg-1"], avsikt: ["pi_1", "pi_1"] });
});

test("medForsprang: ett annat id läses som vanligt, och utan avsikt läses ingen", async () => {
  const { deps, anrop } = rakneverk();
  const med = medForsprang(deps, "korg-1", null);
  assert.deepEqual(anrop.avsikt, []);
  await med.hamtaKorg("korg-2");
  assert.deepEqual(anrop.korg, ["korg-1", "korg-2"]);
  await med.hamtaAvsikt("pi_9");
  assert.deepEqual(anrop.avsikt, ["pi_9"]);
});

test("medForsprang: ett fel når förberedelsen, och en oanvänd läsning fäller inget", async () => {
  const fel: unknown[] = [];
  const lyssnare = (e: unknown) => fel.push(e);
  process.on("unhandledRejection", lyssnare);
  try {
    // Stängd kassa: läsningen används aldrig.
    medForsprang(rakneverk({ korgFel: true }).deps, "korg-1", null);
    // Öppen kassa: felet kommer fram som förut.
    const med = medForsprang(rakneverk({ korgFel: true }).deps, "korg-1", null);
    await assert.rejects(med.hamtaKorg("korg-1"), /wix 503/);
    await new Promise((r) => setTimeout(r, 20));
    assert.deepEqual(fel, []);
  } finally {
    process.off("unhandledRejection", lyssnare);
  }
});
