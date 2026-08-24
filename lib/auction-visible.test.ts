import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { harStartat, synligaFynd } from "./auction-visible.ts";

// Klockan i testerna: 2026-08-24 kl 14:49 svensk tid (12:49 UTC) — samma
// tidpunkt som det verkliga fallet då satsbordet såldes och svängbilen tog
// dess plats 1,2 sekunder senare.
const NU = Date.parse("2026-08-24T12:49:41.695Z");
const IDAG_0700 = "2026-08-24T05:00:00.000Z";
const IMORGON_0700 = "2026-08-25T05:00:00.000Z";

describe("harStartat", () => {
  it("räknar ett fynd med passerad starttid som igång", () => {
    assert.equal(harStartat({ startAt: IDAG_0700 }, NU), true);
  });

  it("räknar ett fynd som startar imorgon som inte igång", () => {
    assert.equal(harStartat({ startAt: IMORGON_0700 }, NU), false);
  });

  it("behandlar avsaknad av startAt som igång — äldre dokument ska inte försvinna", () => {
    assert.equal(harStartat({}, NU), true);
    assert.equal(harStartat({ startAt: null }, NU), true);
    assert.equal(harStartat({ startAt: "" }, NU), true);
  });

  it("behandlar skräp i startAt som igång i stället för att gömma fyndet", () => {
    assert.equal(harStartat({ startAt: "inte ett datum" }, NU), true);
  });

  it("är inklusiv på exakt startsekunden", () => {
    assert.equal(harStartat({ startAt: IDAG_0700 }, Date.parse(IDAG_0700)), true);
  });
});

describe("synligaFynd", () => {
  it("DET VERKLIGA FALLET: ersättaren döljs medan dagens övriga är igång", () => {
    const rader = [
      { slug: "hundvagn", startAt: IDAG_0700 },
      { slug: "tennisbollsvagn", startAt: IDAG_0700 },
      { slug: "gamingbord", startAt: IDAG_0700 },
      { slug: "utomhusmatta", startAt: IDAG_0700 },
      { slug: "svangbil", startAt: IMORGON_0700 }, // befordrad 1,2 s efter köpet
    ];
    assert.deepEqual(
      synligaFynd(rader, NU).map((r) => r.slug),
      ["hundvagn", "tennisbollsvagn", "gamingbord", "utomhusmatta"],
    );
  });

  it("NATTEN: ingen är igång — då visas hela morgondagens omgång", () => {
    // 22:00 svensk tid, alla fem schemalagda till 07:00 imorgon.
    const kvall = Date.parse("2026-08-24T20:00:00.000Z");
    const rader = [1, 2, 3, 4, 5].map((n) => ({ slug: `f${n}`, startAt: IMORGON_0700 }));
    assert.equal(synligaFynd(rader, kvall).length, 5);
  });

  it("tom lista in ger tom lista ut", () => {
    assert.deepEqual(synligaFynd([], NU), []);
  });

  it("rör inte ordningen på det som blir kvar", () => {
    const rader = [
      { slug: "a", startAt: IDAG_0700 },
      { slug: "b", startAt: IMORGON_0700 },
      { slug: "c", startAt: IDAG_0700 },
    ];
    assert.deepEqual(synligaFynd(rader, NU).map((r) => r.slug), ["a", "c"]);
  });

  it("returnerar en ny lista, aldrig indatan", () => {
    const rader = [{ slug: "a", startAt: IMORGON_0700 }];
    assert.notEqual(synligaFynd(rader, NU), rader);
  });
});
