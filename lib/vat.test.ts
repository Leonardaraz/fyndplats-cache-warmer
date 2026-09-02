import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { delsummaInklMoms, momssats, momsetikett } from "./vat.ts";

describe("delsummaInklMoms", () => {
  it("fri frakt utan rabatt ger varusumman = totalen", () => {
    // Ordern ur skärmdumpen: raderna visade 1 899,00 men Delsumma stod i netto.
    assert.equal(delsummaInklMoms({ total: 1899, shipping: 0, discount: 0 }), 1899);
  });

  it("rabatt läggs tillbaka så raderna går ihop", () => {
    // 1 899 varor − 200 rabatt = 1 699 att betala.
    const d = delsummaInklMoms({ total: 1699, shipping: 0, discount: 200 });
    assert.equal(d, 1899);
    assert.equal(d - 200 + 0, 1699);
  });

  it("frakt dras av från totalen", () => {
    const d = delsummaInklMoms({ total: 1998, shipping: 99, discount: 0 });
    assert.equal(d, 1899);
    assert.equal(d + 99, 1998);
  });

  it("saknade frakt- och rabattfält behandlas som noll", () => {
    assert.equal(delsummaInklMoms({ total: 500 }), 500);
  });

  it("avrundar bort flyttalsskräp", () => {
    assert.equal(delsummaInklMoms({ total: 0.1 + 0.2, shipping: 0, discount: 0 }), 0.3);
  });

  it("går aldrig under noll", () => {
    assert.equal(delsummaInklMoms({ total: 0, shipping: 99, discount: 0 }), 0);
  });
});

describe("momssats", () => {
  it("hittar 25 % i ordern ur skärmdumpen", () => {
    // 1 899 / 1,25 = 1 519,20 → moms 379,80.
    assert.equal(momssats(379.8, 1899), 25);
  });

  it("hittar 12 %", () => {
    assert.equal(momssats(12, 112), 12);
  });

  it("hittar 6 %", () => {
    assert.equal(momssats(6, 106), 6);
  });

  it("tål öresavrundning", () => {
    assert.equal(momssats(379.79, 1899), 25);
    assert.equal(momssats(379.81, 1899), 25);
  });

  it("ger null för en blandad kundvagn", () => {
    // 1 000 kr varor à 25 % + 1 000 kr à 12 % → snittet är ingen giltig sats.
    const moms = 200 + 107.14;
    assert.equal(momssats(moms, 2000), null);
  });

  it("ger null när ordern är momsfri", () => {
    assert.equal(momssats(0, 1899), null);
  });

  it("ger null för orimliga belopp", () => {
    assert.equal(momssats(-5, 1899), null);
    assert.equal(momssats(1899, 1899), null);
    assert.equal(momssats(2000, 1899), null);
    assert.equal(momssats(Number.NaN, 1899), null);
    assert.equal(momssats(379.8, Number.NaN), null);
  });
});

describe("momsetikett", () => {
  it("skriver ut satsen när den går att fastställa", () => {
    assert.equal(momsetikett(379.8, 1899), "Varav moms (25 %)");
  });

  it("hittar aldrig på en sats", () => {
    assert.equal(momsetikett(200 + 107.14, 2000), "Varav moms");
  });
});
