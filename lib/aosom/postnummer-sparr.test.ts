import { describe, expect, it } from "vitest";
import {
  AOSOM_SPARRADE_POSTNUMMER,
  aosomSparrForAdress,
  arAosomSparratPostnummer,
  normaliseraPostnummer,
} from "./postnummer-sparr";

// Listan ordagrant som Leonard skrev den 2026-10-26. Testet fäller om
// intervallen i koden glider från den.
const LEONARDS_LISTA =
  "10005, 13025, 13033, 13034, 13036, 13038, 13039, 13042, 13043, 13055, 13056, 37022, " +
  "43080–43099, 45204–45205, 47112–47115, 47500–47599, 62000–62999, 74296–74297, " +
  "76017–76019, 91803";

function tolka(lista: string): Set<number> {
  const ut = new Set<number>();
  for (const del of lista.split(",").map((s) => s.trim())) {
    const [fran, till] = del.split("–").map(Number);
    for (let n = fran; n <= (till ?? fran); n++) ut.add(n);
  }
  return ut;
}

describe("AOSOM_SPARRADE_POSTNUMMER", () => {
  it("är exakt Leonards lista", () => {
    const iKoden = new Set<number>();
    for (const [fran, till] of AOSOM_SPARRADE_POSTNUMMER) {
      for (let n = fran; n <= till; n++) iKoden.add(n);
    }
    expect([...iKoden].sort()).toEqual([...tolka(LEONARDS_LISTA)].sort());
  });

  it("spärrar varje nummer i listan och inget av grannarna", () => {
    const sparrade = tolka(LEONARDS_LISTA);
    for (const n of sparrade) {
      expect(arAosomSparratPostnummer(String(n)), String(n)).toBe(true);
      for (const granne of [n - 1, n + 1]) {
        if (!sparrade.has(granne)) {
          expect(arAosomSparratPostnummer(String(granne)), String(granne)).toBe(false);
        }
      }
    }
  });
});

describe("normaliseraPostnummer", () => {
  it("tar mellanslag, bindestreck och landsprefix", () => {
    expect(normaliseraPostnummer("621 52")).toBe("62152");
    expect(normaliseraPostnummer(" 62152 ")).toBe("62152");
    expect(normaliseraPostnummer("SE-621 52")).toBe("62152");
    expect(normaliseraPostnummer("S-62152")).toBe("62152");
    expect(normaliseraPostnummer("se 475 31")).toBe("47531");
  });

  it("svarar null för allt som inte är fem siffror", () => {
    for (const fel of ["", "6215", "621523", "abcde", "621 5x", undefined, null]) {
      expect(normaliseraPostnummer(fel)).toBeNull();
    }
  });
});

describe("aosomSparrForAdress", () => {
  it("ger det formaterade postnumret för en spärrad svensk adress", () => {
    expect(aosomSparrForAdress({ country: "SE", postalCode: "62152" })).toBe("621 52");
    expect(aosomSparrForAdress({ country: "Sverige", postalCode: "475 31" })).toBe("475 31");
    expect(aosomSparrForAdress({ postalCode: "13025" })).toBe("130 25");
  });

  it("släpper igenom andra postnummer, andra länder och saknad adress", () => {
    expect(aosomSparrForAdress({ country: "SE", postalCode: "11122" })).toBeNull();
    expect(aosomSparrForAdress({ country: "NO", postalCode: "62152" })).toBeNull();
    expect(aosomSparrForAdress({ country: "SE" })).toBeNull();
    expect(aosomSparrForAdress(null)).toBeNull();
  });
});
