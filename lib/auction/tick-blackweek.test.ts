// Black Week genom ticken: var tionde minut från söndag 22 november till
// tisdag 1 december 2026, mot ett lager som minns. Varje dag ska starta exakt
// sitt antal (lib/auction/antal.ts), inga fler ska leva än den största av i
// dag och i morgon, och ingen auktion får leva kvar efter kl 19. Samma prov
// för generalrepetitionen, 50 fynd onsdag 18 november (Leonards ja 2026-11-14).

import { describe, expect, it } from "vitest";
import { buildLadder, type AuctionDoc } from "./engine";
import { auktionerFor } from "./antal";
import { korTick, type TickBeroenden } from "./tick";

const LADDER = buildLadder(1000, 850);
const MIN = 60_000;
const TIMME = 60 * MIN;

function lager(antalIKo: number) {
  const rader = new Map<string, AuctionDoc>();
  for (let i = 1; i <= antalIKo; i++) {
    const id = `auction-p${i}`;
    rader.set(id, {
      _id: id,
      productId: `p${i}`,
      slug: `s${i}`,
      name: `Vara ${i}`,
      listPrice: 1000,
      floorPrice: 850,
      ladder: LADDER,
      stepMinutes: 60,
      slot: 0,
      status: "queued",
      queueOrder: i,
    });
  }
  return rader;
}

function beroenden(rader: Map<string, AuctionDoc>, klocka: { t: number }): TickBeroenden {
  return {
    nu: () => klocka.t,
    lasAuktioner: async (statusar, val) => {
      const alla = [...rader.values()].filter((r) => statusar.includes(r.status)).map((r) => structuredClone(r));
      const ko = alla.filter((r) => r.status === "queued").sort((a, b) => a.queueOrder - b.queueOrder);
      const ovriga = alla.filter((r) => r.status !== "queued");
      return [...ovriga, ...(val?.köHuvud !== undefined ? ko.slice(0, val.köHuvud) : ko)];
    },
    hamtaOrdrar: async () => [],
    aterstall: async () => {},
    stega: async () => {},
    // Ingen pris har ändrats sedan seeden: varje variant står på radens listpris.
    produktNu: async (productId) => ({
      finns: true,
      priser: new Map([[`v-${productId}`, rader.get(`auction-${productId}`)?.listPrice ?? 1000]]),
    }),
    taBort: async (id) => {
      rader.delete(id);
    },
    spara: async (docs) => {
      for (const doc of docs) rader.set(doc._id as string, structuredClone(doc));
      return [];
    },
    uppdateraButiken: async () => ({ utfall: "uppdaterad" }),
  };
}

/** 07:00 svensk vintertid är 06:00 UTC. */
const startFor = (dag: string) => `${dag}T06:00:00.000Z`;

/**
 * Kör ticken var tionde minut från `fran` till `till` (ISO, UTC) och prövar
 * varje tick: ingen auktion lever efter dagens slut, och aldrig fler levande
 * än den största av dagens och morgondagens antal. Ger felen och antalet
 * startade per dag, räknat kl 12 svensk tid.
 */
async function genomTicken(fran: string, till: string, antalIKo: number) {
  const rader = lager(antalIKo);
  const klocka = { t: Date.parse(fran) };
  const d = beroenden(rader, klocka);
  const slut = Date.parse(till);
  const startadePerDag = new Map<string, number>();
  let fel = 0;

  for (; klocka.t <= slut; klocka.t += 10 * MIN) {
    const r = await korTick(d);
    fel += r.errors.length;
    const nu = klocka.t;
    const levande = [...rader.values()].filter((x) => x.status === "live");

    // Ingen auktion lever efter dagens slut (start + 12 h), högst ett tick sent.
    for (const x of levande) expect(nu < Date.parse(x.startAt as string) + 12 * TIMME + 10 * MIN, `${x.slug} ${x.startAt}`).toBe(true);

    // Aldrig fler levande än den största av dagens och morgondagens antal.
    const idag = new Date(nu + TIMME).toISOString().slice(0, 10); // svensk dag (UTC+1)
    const imorgon = new Date(nu + TIMME + 24 * TIMME).toISOString().slice(0, 10);
    const tak = Math.max(auktionerFor(startFor(idag)), auktionerFor(startFor(imorgon)));
    expect(levande.length, new Date(nu).toISOString()).toBeLessThanOrEqual(tak);

    // Kl 12 svensk tid: räkna dagens startade.
    if (new Date(nu).getUTCHours() === 11 && new Date(nu).getUTCMinutes() < 10) {
      startadePerDag.set(idag, levande.filter((x) => x.startAt === startFor(idag)).length);
    }
  }

  return { fel, startadePerDag: Object.fromEntries(startadePerDag) };
}

describe("Black Week genom ticken", () => {
  it("☠️ generalrepetitionen: onsdag 18 november startar 50, tisdagen och torsdagen tio", async () => {
    const { fel, startadePerDag } = await genomTicken("2026-11-16T19:00:30Z", "2026-11-19T19:00:30Z", 200);
    expect(fel).toBe(0);
    expect(startadePerDag).toEqual({
      "2026-11-17": 10,
      "2026-11-18": 50,
      "2026-11-19": 10,
    });
  }, 60_000);

  it("☠️ varje dag startar exakt sitt antal, och ingen auktion lever efter kl 19", async () => {
    const { fel, startadePerDag } = await genomTicken("2026-11-21T19:00:30Z", "2026-12-01T19:00:30Z", 700);
    expect(fel).toBe(0);
    expect(startadePerDag).toEqual({
      "2026-11-22": 10,
      "2026-11-23": 50,
      "2026-11-24": 50,
      "2026-11-25": 50,
      "2026-11-26": 50,
      "2026-11-27": 100,
      "2026-11-28": 50,
      "2026-11-29": 50,
      "2026-11-30": 10,
      "2026-12-01": 10,
    });
  }, 60_000);
});
