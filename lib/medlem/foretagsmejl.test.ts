// Mejlet om ett godkänt företag (lib/medlem/foretagsmejl.ts).

import { test } from "node:test";
import assert from "node:assert/strict";
import { MEJL_PER_KORNING, mejlaGodkandaForetag, type Foretagsmejlberoenden } from "./foretagsmejl.ts";

function beroenden(o: {
  profiler: { medlemsId: string; namn: string }[];
  redanMarkta?: string[];
  utanKonto?: string[];
  mejlFelar?: string[];
}) {
  const markta = new Set(o.redanMarkta ?? []);
  const skickat: string[] = [];
  let fraga = 0;
  const b: Foretagsmejlberoenden = {
    async attMejla(limit) {
      fraga = limit;
      return o.profiler;
    },
    async marka(id) {
      if (markta.has(id)) return false;
      markta.add(id);
      return true;
    },
    async avmarka(id) {
      markta.delete(id);
    },
    async epost(id) {
      return (o.utanKonto ?? []).includes(id) ? null : `${id}@example.se`;
    },
    async skicka(till, namn) {
      if ((o.mejlFelar ?? []).some((id) => till.startsWith(id))) return false;
      skickat.push(`${till}|${namn}`);
      return true;
    },
  };
  return { b, skickat, markta, fraga: () => fraga };
}

test("ett godkänt företag får ett mejl med sitt namn, och profilen märks", async () => {
  const d = beroenden({ profiler: [{ medlemsId: "m_1", namn: "Bygg AB" }] });
  const u = await mejlaGodkandaForetag(d.b);
  assert.deepEqual(u, { provade: 1, skickade: 1, fel: 0 });
  assert.deepEqual(d.skickat, ["m_1@example.se|Bygg AB"]);
  assert.equal(d.markta.has("m_1"), true);
  assert.equal(d.fraga(), MEJL_PER_KORNING);
});

test("en profil som någon annan redan märkt mejlas inte igen", async () => {
  const d = beroenden({ profiler: [{ medlemsId: "m_1", namn: "Bygg AB" }], redanMarkta: ["m_1"] });
  const u = await mejlaGodkandaForetag(d.b);
  assert.equal(u.skickade, 0);
  assert.deepEqual(d.skickat, []);
});

test("ett mejl som inte går iväg tar bort märket, så att nästa körning försöker igen", async () => {
  const d = beroenden({ profiler: [{ medlemsId: "m_1", namn: "Bygg AB" }, { medlemsId: "m_2", namn: "Måleri HB" }], mejlFelar: ["m_1"] });
  const u = await mejlaGodkandaForetag(d.b);
  assert.deepEqual(u, { provade: 2, skickade: 1, fel: 1 });
  assert.equal(d.markta.has("m_1"), false);
  assert.equal(d.markta.has("m_2"), true);
});

test("ett konto som inte finns får inget mejl, och märket står kvar", async () => {
  const d = beroenden({ profiler: [{ medlemsId: "m_1", namn: "Bygg AB" }], utanKonto: ["m_1"] });
  const u = await mejlaGodkandaForetag(d.b);
  assert.deepEqual(u, { provade: 1, skickade: 0, fel: 0 });
  assert.equal(d.markta.has("m_1"), true);
});

test("aldrig fler än en omgång per körning", async () => {
  const manga = Array.from({ length: MEJL_PER_KORNING + 5 }, (_, i) => ({ medlemsId: `m_${i}`, namn: `F${i}` }));
  const d = beroenden({ profiler: manga });
  const u = await mejlaGodkandaForetag(d.b);
  assert.equal(u.provade, MEJL_PER_KORNING);
  assert.equal(d.skickat.length, MEJL_PER_KORNING);
});
