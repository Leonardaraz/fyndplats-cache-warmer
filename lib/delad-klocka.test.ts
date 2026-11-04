// Sidans gemensamma klocka (lib/delad-klocka.ts), Black Week 2026-11-04.
// Med 100 fynd fick /fyndauktion förut 100 timers i sekundtakt. Proven låser
// att korten delar en timer per takt, att tiden aldrig går bakåt vid ett
// taktbyte och att klockan aldrig står still medan fliken syns.

import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { skapaDeladKlocka, type KlockMiljo } from "./delad-klocka.ts";

/** En låtsasvärld: tiden går bara när provet säger det, och timers slår bara
 *  när provet slår dem. */
function varld(start = 1_000_000) {
  let tid = start;
  let dold = false;
  let nasta = 1;
  const timers = new Map<number, { f: () => void; ms: number }>();
  const synlighet = new Set<() => void>();
  const m: KlockMiljo = {
    nu: () => tid,
    dold: () => dold,
    vidSynlighet(f) {
      synlighet.add(f);
      return () => void synlighet.delete(f);
    },
    starta(f, ms) {
      const id = nasta++;
      timers.set(id, { f, ms });
      return id;
    },
    stoppa(id) {
      timers.delete(id as number);
    },
  };
  return {
    klocka: skapaDeladKlocka(m),
    ga(ms: number) {
      tid += ms;
    },
    /** Alla timers med takten `ms` slår en gång. */
    slag(ms: number) {
      for (const t of [...timers.values()]) if (t.ms === ms) t.f();
    },
    /** Takterna som har en timer just nu. */
    takter: () => [...timers.values()].map((t) => t.ms).sort((a, b) => a - b),
    gom(v: boolean) {
      dold = v;
      for (const f of [...synlighet]) f();
    },
    synlighetslyssnare: () => synlighet.size,
    tid: () => tid,
  };
}

function raknare() {
  let n = 0;
  return { l: () => void n++, antal: () => n };
}

test("☠️ hundra kort på samma takt delar en timer, och ett slag meddelar alla", () => {
  const v = varld();
  const kort = Array.from({ length: 100 }, raknare);
  for (const k of kort) v.klocka.prenumerera(1_000, k.l);
  assert.deepEqual(v.takter(), [1_000]);

  v.ga(1_000);
  v.slag(1_000);
  assert.equal(v.klocka.las(), v.tid());
  assert.deepEqual(new Set(kort.map((k) => k.antal())), new Set([1]));
});

test("☠️ ett taktbyte flyttar aldrig tiden bakåt", () => {
  const v = varld();
  // Ett kort på golvet håller 20-sekundersklockan igång sedan start.
  v.klocka.prenumerera(20_000, () => {});
  const kort = raknare();
  let slapp = v.klocka.prenumerera(1_000, kort.l);
  // Nedräkningen går i 15 sekunder; 20-sekundersklockan har inte slagit.
  for (let i = 0; i < 15; i++) {
    v.ga(1_000);
    v.slag(1_000);
  }
  const fore = v.klocka.las();
  assert.equal(fore, v.tid());
  // Sänkningen passeras och kortet byter till 20 s. Tiden får inte falla
  // tillbaka till 20-sekundersklockans senaste slag (15 s tidigare): då hade
  // kortet sett den gamla fasen och bytt tillbaka till 1 s.
  slapp();
  slapp = v.klocka.prenumerera(20_000, kort.l);
  assert.equal(v.klocka.las(), fore);
  slapp();
});

test("☠️ klockan står aldrig still medan fliken syns: varje takt med lyssnare har en timer", () => {
  const v = varld();
  const a = v.klocka.prenumerera(1_000, () => {});
  const b = v.klocka.prenumerera(20_000, () => {});
  const c = v.klocka.prenumerera(60_000, () => {});
  assert.deepEqual(v.takter(), [1_000, 20_000, 60_000]);
  a();
  assert.deepEqual(v.takter(), [20_000, 60_000]);
  b();
  c();
  assert.deepEqual(v.takter(), []);
});

test("☠️ dold flik: inga slag; tillbaka: tiden läses om direkt och alla meddelas en gång", () => {
  const v = varld();
  const snabb = raknare();
  const lugn = raknare();
  v.klocka.prenumerera(1_000, snabb.l);
  v.klocka.prenumerera(20_000, lugn.l);

  v.gom(true);
  assert.deepEqual(v.takter(), []);
  // Fliken ligger dold över 19:00.
  v.ga(3 * 60 * 60_000);
  assert.equal(snabb.antal(), 0);

  v.gom(false);
  assert.equal(v.klocka.las(), v.tid());
  assert.equal(snabb.antal(), 1);
  assert.equal(lugn.antal(), 1);
  assert.deepEqual(v.takter(), [1_000, 20_000]);
});

test("en prenumeration i en dold flik startar ingen timer förrän fliken syns", () => {
  const v = varld();
  v.gom(true);
  v.klocka.prenumerera(1_000, () => {});
  assert.deepEqual(v.takter(), []);
  v.gom(false);
  assert.deepEqual(v.takter(), [1_000]);
});

test("en ny takt läser om tiden, ett slag i en annan takt gör det inte förrän det slår", () => {
  const v = varld();
  v.klocka.prenumerera(1_000, () => {});
  const start = v.klocka.las();
  v.ga(500);
  assert.equal(v.klocka.las(), start, "två läsningar utan slag ger samma värde (useSyncExternalStore)");
  v.klocka.prenumerera(20_000, () => {});
  assert.equal(v.klocka.las(), v.tid());
});

test("utan lyssnare är tiden null och synlighetslyssnaren borta", () => {
  const v = varld();
  assert.equal(v.klocka.las(), null);
  const a = v.klocka.prenumerera(1_000, () => {});
  const b = v.klocka.prenumerera(1_000, () => {});
  assert.equal(v.synlighetslyssnare(), 1);
  a();
  a(); // dubbel avregistrering räknas inte två gånger
  assert.notEqual(v.klocka.las(), null);
  assert.deepEqual(v.takter(), [1_000]);
  b();
  assert.equal(v.klocka.las(), null);
  assert.equal(v.synlighetslyssnare(), 0);
  assert.deepEqual(v.takter(), []);

  // En ny sida senare börjar med färsk tid, inte med förra besökets.
  v.ga(5 * 60_000);
  v.klocka.prenumerera(1_000, () => {});
  assert.equal(v.klocka.las(), v.tid());
});

test("samma lyssnare två gånger på samma takt räknas en gång", () => {
  const v = varld();
  const k = raknare();
  const a = v.klocka.prenumerera(1_000, k.l);
  const b = v.klocka.prenumerera(1_000, k.l);
  v.slag(1_000);
  assert.equal(k.antal(), 1);
  b();
  assert.deepEqual(v.takter(), [1_000]);
  a();
  assert.deepEqual(v.takter(), []);
  assert.equal(v.klocka.las(), null);
});

test("takten måste vara ett positivt tal", () => {
  const v = varld();
  for (const ms of [0, -1_000, Number.NaN, Number.POSITIVE_INFINITY]) {
    assert.throws(() => v.klocka.prenumerera(ms, () => {}), /positivt tal/);
  }
});

test("☠️ auktionskorten, luntan och sista timmen har ingen egen klocka", () => {
  // En egen setInterval i ett kort var just det som gav 100 timers.
  const filer = [
    "components/use-client-now.ts",
    "components/use-auction-clock.ts",
    "components/auction-card.tsx",
    "components/auction-hero-card.tsx",
    "components/auction-live-bar.tsx",
    "components/auction-fuse.tsx",
    "components/auction-climax.tsx",
  ];
  const skyldiga = filer.filter((f) => {
    const kod = readFileSync(join(process.cwd(), f), "utf8")
      .replace(/\/\*[\s\S]*?\*\//g, "")
      .replace(/^[ \t]*\/\/.*$/gm, "");
    return /\bsetInterval\s*\(/.test(kod);
  });
  assert.deepEqual(skyldiga, []);
});
