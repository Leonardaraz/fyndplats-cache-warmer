// Timjobbets skötsel av offerterna (lib/medlem/offertjobb.ts).

import { test } from "node:test";
import assert from "node:assert/strict";
import { OFFERTER_PER_KORNING, skotOfferter, type Offertjobbsberoenden } from "./offertjobb.ts";

const NU = Date.parse("2026-11-19T12:00:00.000Z");

type O = { id: string; status: string; medlemsId?: string; foretagNamn?: string; giltigTill?: string; meddelad?: boolean; floden?: string[] };

function lager(offerter: O[], o: { ordrar?: string[]; mejlFelar?: boolean; utanKonto?: boolean } = {}) {
  const m = new Map(offerter.map((x) => [x.id, { ...x }]));
  const mejl: string[] = [];
  const b: Offertjobbsberoenden = {
    async iKassan() {
      return [...m.values()].filter((x) => x.status === "accepterad").map((x) => ({ id: x.id }));
    },
    async kopfloden(id) {
      return m.get(id)?.floden ?? [];
    },
    async orderFinns(pf) {
      return (o.ordrar ?? []).includes(pf);
    },
    async attLoptaUt(nuIso) {
      return [...m.values()]
        .filter((x) => (x.status === "prissatt" || x.status === "accepterad") && x.giltigTill && x.giltigTill <= nuIso)
        .map((x) => ({ id: x.id, status: x.status }));
    },
    async byt(id, fran, till) {
      const x = m.get(id);
      if (!x || x.status !== fran) return false;
      x.status = till;
      return true;
    },
    async attMejla() {
      return [...m.values()]
        .filter((x) => x.status === "prissatt" && !x.meddelad)
        .map((x) => ({ id: x.id, medlemsId: x.medlemsId ?? "m_1", foretagNamn: x.foretagNamn ?? "Bygg AB", giltigTill: x.giltigTill }));
    },
    async marka(id) {
      const x = m.get(id);
      if (!x || x.meddelad) return false;
      x.meddelad = true;
      return true;
    },
    async avmarka(id) {
      const x = m.get(id);
      if (x) x.meddelad = false;
    },
    async epost() {
      return o.utanKonto ? null : "inkop@exempel.se";
    },
    async skicka(till, x) {
      if (o.mejlFelar) return false;
      mejl.push(`${till}|${x.id}|${x.foretagNamn}`);
      return true;
    },
  };
  return { b, m, mejl };
}

test("en accepterad offert vars kassa blev en order blir betald, också om ett tidigare köpflöde var det som betalades", async () => {
  const d = lager([{ id: "o_a", status: "accepterad", floden: ["pf-1", "pf-2"] }], { ordrar: ["pf-1"] });
  const u = await skotOfferter(NU, d.b);
  assert.equal(u.betalda, 1);
  assert.equal(d.m.get("o_a")!.status, "betald");
});

test("E3-10: efter sista dagen blir en prissatt eller obetald accepterad offert utgången", async () => {
  const d = lager([
    { id: "o_p", status: "prissatt", giltigTill: "2026-11-18T19:00:00.000Z", meddelad: true },
    { id: "o_a", status: "accepterad", giltigTill: "2026-11-18T19:00:00.000Z", floden: ["pf-9"] },
    { id: "o_g", status: "prissatt", giltigTill: "2026-11-20T19:00:00.000Z", meddelad: true },
  ]);
  const u = await skotOfferter(NU, d.b);
  assert.equal(u.utgangna, 2);
  assert.equal(d.m.get("o_p")!.status, "utgangen");
  assert.equal(d.m.get("o_a")!.status, "utgangen");
  assert.equal(d.m.get("o_g")!.status, "prissatt", "en offert inom giltighetstiden står kvar");
});

test("ett köp i sista stund märks som betalt, inte som utgånget", async () => {
  const d = lager([{ id: "o_a", status: "accepterad", giltigTill: "2026-11-18T19:00:00.000Z", floden: ["pf-1"] }], { ordrar: ["pf-1"] });
  await skotOfferter(NU, d.b);
  assert.equal(d.m.get("o_a")!.status, "betald");
});

test("mejlet om en prissatt offert går exakt en gång, och tillbaka till nästa körning om det inte gick iväg", async () => {
  const d = lager([{ id: "o_p", status: "prissatt", giltigTill: "2026-11-30T19:00:00.000Z", foretagNamn: "Måleri HB" }]);
  assert.equal((await skotOfferter(NU, d.b)).mejlade, 1);
  assert.deepEqual(d.mejl, ["inkop@exempel.se|o_p|Måleri HB"]);
  assert.equal((await skotOfferter(NU, d.b)).mejlade, 0, "andra körningen mejlar inte igen");

  const fel = lager([{ id: "o_p", status: "prissatt", giltigTill: "2026-11-30T19:00:00.000Z" }], { mejlFelar: true });
  const u = await skotOfferter(NU, fel.b);
  assert.equal(u.fel, 1);
  assert.equal(fel.m.get("o_p")!.meddelad, false);
});

test("högst en omgång per steg", async () => {
  const manga = Array.from({ length: OFFERTER_PER_KORNING + 4 }, (_, i) => ({ id: `o_${i}`, status: "prissatt", giltigTill: "2026-11-30T19:00:00.000Z" }));
  const d = lager(manga);
  const u = await skotOfferter(NU, d.b);
  assert.equal(u.mejlade, OFFERTER_PER_KORNING);
});

test("också när steg 1 inte når offerten (fler än en omgång väntar) märks ett köp i sista stund som betalt", async () => {
  const d = lager([{ id: "o_a", status: "accepterad", giltigTill: "2026-11-18T19:00:00.000Z", floden: ["pf-1"] }], { ordrar: ["pf-1"] });
  // Steg 1 ser inga offerter i kassan, som när omgången redan är full.
  d.b.iKassan = async () => [];
  const u = await skotOfferter(NU, d.b);
  assert.equal(d.m.get("o_a")!.status, "betald");
  assert.deepEqual([u.betalda, u.utgangna], [1, 0]);
});
