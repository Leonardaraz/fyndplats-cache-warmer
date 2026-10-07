import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { MARGINAL_MS, kanStadas, steg, utanSrsltid, type Miljo } from "./srsltid.ts";

describe("utanSrsltid", () => {
  it("tar bort koden och lämnar den rena adressen", () => {
    assert.equal(utanSrsltid("?srsltid=AU7gw4Ulx_d"), "");
  });

  it("behåller andra parametrar tecken för tecken och i samma ordning", () => {
    assert.equal(
      utanSrsltid("?variant=e062415b-aae0&srsltid=AU7gw4&farg=svart,gra&q=a+b%20c"),
      "?variant=e062415b-aae0&farg=svart,gra&q=a+b%20c",
    );
    assert.equal(utanSrsltid("?srsltid=AU7gw4&variant=x"), "?variant=x");
    assert.equal(utanSrsltid("?variant=x&srsltid=AU7gw4"), "?variant=x");
  });

  it("returnerar null när koden saknas, så att ingenting skrivs", () => {
    for (const s of ["", "?", "?variant=x", "?srsltidx=1", "?xsrsltid=1", "?SRSLTID=1"]) {
      assert.equal(utanSrsltid(s), null, s);
    }
  });

  it("tar bort koden även utan värde och när den står två gånger", () => {
    assert.equal(utanSrsltid("?srsltid"), "");
    assert.equal(utanSrsltid("?srsltid=a&variant=x&srsltid=b"), "?variant=x");
  });

  it("klarar en sökdel utan inledande frågetecken", () => {
    assert.equal(utanSrsltid("srsltid=a&variant=x"), "?variant=x");
  });
});

describe("kanStadas", () => {
  it("kräver både ett val i bannern och en laddad Google-tagg", () => {
    assert.equal(kanStadas({ samtycke: "all", taggLaddad: true }), true);
    assert.equal(kanStadas({ samtycke: "necessary", taggLaddad: true }), true);
  });

  it("väntar så länge besökaren inte har valt", () => {
    // Beviljas samtycket senare på samma sida ska taggen fortfarande hitta
    // koden i adressen.
    for (const samtycke of [null, "", "ja", "ALL"]) {
      assert.equal(kanStadas({ samtycke, taggLaddad: true }), false);
    }
  });

  it("väntar så länge Googles tagg inte har laddats", () => {
    // Taggen laddas med lazyOnload och läser adressen först när den kommer.
    assert.equal(kanStadas({ samtycke: "all", taggLaddad: false }), false);
    assert.equal(kanStadas({ samtycke: "necessary", taggLaddad: false }), false);
  });
});

function fakeMiljo(start: { sok: string; samtycke: string | null; tagg: boolean }) {
  const l = { ...start, t: 0, skrivningar: [] as string[] };
  const m: Miljo = {
    sokdel: () => l.sok,
    ersatt: (ny) => {
      l.skrivningar.push(ny);
      l.sok = ny;
    },
    samtycke: () => l.samtycke,
    taggLaddad: () => l.tagg,
    nu: () => l.t,
  };
  return { l, m };
}

// Kör varv var 1000:e ms, som komponenten.
function kor(m: Miljo, l: { t: number }, ms: number, klar: number | null = null): number | null {
  for (let slut = l.t + ms; l.t < slut; l.t += 1000) klar = steg(m, klar);
  return klar;
}

describe("steg", () => {
  it("städar först när villkoren hållit i MARGINAL_MS", () => {
    const { l, m } = fakeMiljo({ sok: "?variant=x&srsltid=AU7", samtycke: "all", tagg: true });
    const klar = kor(m, l, MARGINAL_MS);
    assert.deepEqual(l.skrivningar, []);
    kor(m, l, 1000, klar);
    assert.deepEqual(l.skrivningar, ["?variant=x"]);
  });

  it("rör aldrig adressen utan val i bannern eller utan Googles tagg", () => {
    for (const s of [{ samtycke: null, tagg: true }, { samtycke: "all", tagg: false }]) {
      const { l, m } = fakeMiljo({ sok: "?srsltid=AU7", ...s });
      kor(m, l, 60_000);
      assert.deepEqual(l.skrivningar, []);
    }
  });

  it("räknar marginalen från det ögonblick besökaren väljer i bannern", () => {
    // Taggen läser samtycket och adressen när valet görs, så marginalen
    // börjar om där och inte när taggen laddades.
    const { l, m } = fakeMiljo({ sok: "?srsltid=AU7", samtycke: null, tagg: true });
    let klar = kor(m, l, 20_000);
    l.samtycke = "all";
    klar = kor(m, l, MARGINAL_MS, klar);
    assert.deepEqual(l.skrivningar, []);
    kor(m, l, 2000, klar);
    assert.deepEqual(l.skrivningar, [""]);
  });

  it("börjar om marginalen när valet försvinner och görs igen", () => {
    // Till exempel när besökaren rensar webblagringen mitt på sidan. Då finns
    // inget val förrän bannern besvaras på nytt.
    const { l, m } = fakeMiljo({ sok: "?srsltid=AU7", samtycke: "all", tagg: true });
    let klar = kor(m, l, 2000);
    l.samtycke = null;
    klar = kor(m, l, 5000, klar);
    l.samtycke = "necessary";
    klar = kor(m, l, MARGINAL_MS, klar);
    assert.deepEqual(l.skrivningar, []);
    kor(m, l, 1000, klar);
    assert.deepEqual(l.skrivningar, [""]);
  });

  it("tar bort koden direkt om Next skriver tillbaka den efteråt", () => {
    const { l, m } = fakeMiljo({ sok: "?srsltid=AU7", samtycke: "necessary", tagg: true });
    let klar = kor(m, l, 5000);
    assert.equal(l.skrivningar.length, 1);
    l.sok = "?srsltid=AU7"; // router.refresh() skrev tillbaka sin adress
    klar = kor(m, l, 1000, klar);
    assert.equal(l.skrivningar.length, 2);
  });

  it("skriver ingenting när koden inte finns", () => {
    const { l, m } = fakeMiljo({ sok: "?variant=x", samtycke: "all", tagg: true });
    kor(m, l, 60_000);
    assert.deepEqual(l.skrivningar, []);
  });
});
