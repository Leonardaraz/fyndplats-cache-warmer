// Run: node --test --experimental-strip-types 'lib/**/*.test.ts'
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { LUGN, vantaPaLugn } from "./hero-entre.ts";

/** En låtsasklocka: bildrutorna kommer vid de tider som anges, i ms. */
function kor(tider: number[], regler = LUGN): { klartVid: number | null; anrop: number } {
  const ko = [...tider];
  let klartVid: number | null = null;
  let anrop = 0;
  let nu = 0;
  let vantar: ((t: number) => void) | null = null;
  vantaPaLugn(
    (f) => {
      vantar = f;
    },
    () => {
      klartVid = nu;
      anrop++;
    },
    regler,
  );
  while (vantar && ko.length) {
    const f: (t: number) => void = vantar;
    vantar = null;
    nu = ko.shift()!;
    f(nu);
  }
  return { klartVid, anrop };
}

describe("vantaPaLugn: entrén startar när bildrutorna kommer jämnt", () => {
  it("fyra bildrutor i tid i rad räcker", () => {
    assert.deepEqual(kor([0, 16, 33, 50, 66, 83]), { klartVid: 66, anrop: 1 });
  });

  it("en lång lucka nollställer räkningen: sidan arbetar fortfarande", () => {
    // 0, 16, 32 i tid, sedan 180 ms stilla, sedan fyra i tid.
    assert.deepEqual(kor([0, 16, 32, 212, 228, 244, 260, 276, 292]), { klartVid: 276, anrop: 1 });
  });

  it("väntar aldrig längre än taket, hur ojämnt det än går", () => {
    const r = kor([0, 100, 200, 300, 400, 500, 600, 700]);
    assert.equal(r.klartVid, 500);
    assert.equal(r.anrop, 1);
  });

  it("en snabb skärm (120 bilder i sekunden) startar efter fyra bildrutor", () => {
    assert.equal(kor([0, 8, 17, 25, 33, 42]).klartVid, 33);
  });

  it("anropar aldrig två gånger, och inte alls efter ett avbrott", () => {
    let anrop = 0;
    let vantar: ((t: number) => void) | null = null;
    const avbryt = vantaPaLugn((f) => (vantar = f), () => anrop++);
    vantar!(0);
    avbryt();
    for (const t of [16, 32, 48, 64, 80]) (vantar as ((t: number) => void) | null)?.(t);
    assert.equal(anrop, 0);
  });

  it("reglerna: fyra bildrutor, 30 bilder i sekunden som gräns, högst en halv sekund", () => {
    assert.deepEqual(LUGN, { jamna: 4, maxLucka: 34, tak: 500 });
  });
});
