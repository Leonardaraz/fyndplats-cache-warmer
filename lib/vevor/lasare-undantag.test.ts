// En tolkning som kastar får inte fälla körningen: samma sida hade annars
// fällt varje körning, och läsaren hade stått still. Tolkningen ersätts här
// med en som kastar för en viss sida.

import { describe, expect, it, vi } from "vitest";
import type { Sidrad } from "./lager";
import { testsida } from "./testsida";

vi.mock("./sida", async (original) => {
  const riktig = await original<typeof import("./sida")>();
  return {
    ...riktig,
    tolkaProduktsida: (html: string) => {
      if (html.includes("KASTA-HÄR")) throw new RangeError("trasig sida");
      return riktig.tolkaProduktsida(html);
    },
  };
});

const { behandla } = await import("./lasare");

const rad: Sidrad = {
  webbId: "000000000001",
  sokvag: "/test-c_1/produkt-1-p_000000000001",
  klass: "utkast",
  nastaLasning: "2026-10-29T11:59:00.000Z",
  sku: "TESTSKU000000000001",
  senastForsokAt: null,
  senastUtfall: null,
  senastOkAt: null,
  iKartan: true,
  saknadIKartanSedan: null,
  saknasForstaAt: null,
  borta: false,
};

describe("☠️ en tolkning som kastar", () => {
  it("blir ett tolkningsfel, och artikeln blir okänd", () => {
    const b = behandla(rad, { typ: "sida", html: testsida().replace("</body>", "KASTA-HÄR</body>") }, Date.parse("2026-10-29T12:00:00.000Z"));
    expect(b.typ).toBe("tolkningsfel");
    expect(b.fel).toBe("undantag");
    expect(b.misslyckad).toEqual({ sku: rad.sku, webbId: rad.webbId });
    expect(b.rad.senastUtfall).toBe("tolkningsfel:undantag");
  });

  it("andra sidor tolkas som vanligt", () => {
    expect(behandla(rad, { typ: "sida", html: testsida() }, Date.parse("2026-10-29T12:00:00.000Z")).typ).toBe("giltig");
  });
});
