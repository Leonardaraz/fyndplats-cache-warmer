import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/wix/v3-products", () => ({ headlessWixHeaders: () => ({ Authorization: "test" }) }));

import { arLasning, skapaWixAnrop } from "./skrivplan-wix";

type Svar = { status: number; kropp?: string } | "natverksfel";

/** Ett fetch som svarar med nästa svar i listan (det sista upprepas) och räknar anropen. */
function fetchMed(svar: Svar[]) {
  const anrop: { url: string; method: string }[] = [];
  vi.stubGlobal(
    "fetch",
    vi.fn(async (url: string, init?: RequestInit) => {
      anrop.push({ url, method: String(init?.method) });
      const s = svar[Math.min(anrop.length - 1, svar.length - 1)];
      if (s === "natverksfel") throw new Error("socket hang up");
      return new Response(s.kropp ?? "{}", { status: s.status });
    }),
  );
  return anrop;
}

const pauser: number[] = [];
const vanta = async (ms: number) => {
  pauser.push(ms);
};
const wix = () => skapaWixAnrop(vanta, () => ({ Authorization: "test" }));

let varna: ReturnType<typeof vi.spyOn>;

beforeEach(() => {
  varna = vi.spyOn(console, "warn").mockImplementation(() => {});
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
  pauser.length = 0;
});

// Sökvägarna är de som koden använder 2026-10-28 (grep efter wix("POST", …)).
const LASANDE = [
  "/stores/v3/products/query",
  "/stores/v3/products/search",
  "/stores/v3/products/query-variants",
  "/stores/v3/inventory-items/query",
  "/categories/v1/categories/query",
  "/categories/v1/categories/0e2f5c1a-0000-4000-8000-000000000000/list-items",
];
const SKRIVANDE = [
  "/categories/v1/bulk/categories/0e2f5c1a-0000-4000-8000-000000000000/add-items",
  "/stores/v3/bulk/inventory-items/update",
  "/stores/v3/products",
  "/stores/v3/products/bulk-create",
];

describe("skapaWixAnrop: återförsök av läsningar", () => {
  it("en GET försöks om på 503 och lyckas", async () => {
    const anrop = fetchMed([{ status: 503 }, { status: 200, kropp: '{"ok":1}' }]);
    await expect(wix()("GET", "/stores/v3/products/abc")).resolves.toEqual({ ok: 1 });
    expect(anrop).toHaveLength(2);
    expect(pauser).toEqual([1000]);
  });

  it.each(LASANDE)("☠️ läsande POST %s försöks om på 503 och lyckas", async (sokvag) => {
    const anrop = fetchMed([{ status: 503 }, { status: 200, kropp: '{"ok":1}' }]);
    await expect(wix()("POST", sokvag, { query: {} })).resolves.toEqual({ ok: 1 });
    expect(anrop).toHaveLength(2);
    expect(anrop.every((a) => a.method === "POST")).toBe(true);
    expect(pauser).toEqual([1000]);
  });

  it("☠️ frågesträngen räknas inte: en sökning med ?fields= försöks om", async () => {
    const anrop = fetchMed([{ status: 502 }, { status: 200 }]);
    await wix()("POST", "/stores/v3/products/search?fields=MEDIA_ITEMS_INFO", { search: {} });
    expect(anrop).toHaveLength(2);
  });

  it("läsande POST försöks om på 429 och på nätverksfel", async () => {
    const a = fetchMed([{ status: 429 }, "natverksfel", { status: 200 }]);
    await expect(wix()("POST", "/stores/v3/inventory-items/query", {})).resolves.toEqual({});
    expect(a).toHaveLength(3);
    expect(pauser).toEqual([1000, 3000]);
  });

  it("läsande POST ger upp efter tre försök, 1 s och 3 s emellan, med sista felet", async () => {
    const anrop = fetchMed([{ status: 503, kropp: "tillfälligt" }]);
    await expect(wix()("POST", "/stores/v3/products/query-variants", {})).rejects.toThrow(/Wix 503: tillfälligt/);
    expect(anrop).toHaveLength(3);
    expect(pauser).toEqual([1000, 3000]);
  });

  it("varje återförsök loggas med metod, sökväg utan frågesträng och felets början, men inte det första försöket", async () => {
    fetchMed([{ status: 503, kropp: "tillfälligt fel" }, { status: 502 }, { status: 200 }]);
    await wix()("POST", "/stores/v3/products/search?fields=MEDIA_ITEMS_INFO", {});
    expect(varna).toHaveBeenCalledTimes(2);
    expect(varna).toHaveBeenNthCalledWith(1, "[wix-anrop] försöker om POST /stores/v3/products/search (Wix 503: tillfälligt fel)");
    expect(varna).toHaveBeenNthCalledWith(2, "[wix-anrop] försöker om POST /stores/v3/products/search (Wix 502: {})");
  });

  it("ett anrop som lyckas på första försöket och en skrivning loggar ingenting", async () => {
    fetchMed([{ status: 200 }]);
    await wix()("POST", "/stores/v3/products/query", {});
    fetchMed([{ status: 503 }]);
    await expect(wix()("PATCH", "/stores/v3/products/abc", {})).rejects.toThrow(/Wix 503/);
    expect(varna).not.toHaveBeenCalled();
  });

  it("ett nätverksfel som aldrig går över kastas efter tre försök", async () => {
    const anrop = fetchMed(["natverksfel"]);
    await expect(wix()("POST", "/stores/v3/products/query", {})).rejects.toThrow(/nätverksfel: socket hang up/);
    expect(anrop).toHaveLength(3);
  });

  it.each([400, 401, 403, 404, 409])("ett fel som inte är övergående (%i) försöks inte om, inte ens på en läsande POST", async (status) => {
    const anrop = fetchMed([{ status }, { status: 200 }]);
    await expect(wix()("POST", "/stores/v3/products/query", {})).rejects.toThrow(new RegExp(`Wix ${status}`));
    expect(anrop).toHaveLength(1);
    expect(pauser).toEqual([]);
  });
});

describe("skapaWixAnrop: en skrivning försöks ALDRIG om", () => {
  it.each(SKRIVANDE)("☠️ skrivande POST %s: ett anrop, även på 503", async (sokvag) => {
    const anrop = fetchMed([{ status: 503 }, { status: 200 }]);
    await expect(wix()("POST", sokvag, {})).rejects.toThrow(/Wix 503/);
    expect(anrop).toHaveLength(1);
    expect(pauser).toEqual([]);
  });

  it("☠️ en PATCH försöks aldrig om, hur läsande sökvägen än ser ut", async () => {
    const anrop = fetchMed([{ status: 503 }, { status: 200 }]);
    await expect(wix()("PATCH", "/stores/v3/products/query", {})).rejects.toThrow(/Wix 503/);
    expect(anrop).toHaveLength(1);
  });

  it("☠️ ett nätverksfel på en skrivande POST försöks inte om: den kan ha gått igenom", async () => {
    const anrop = fetchMed(["natverksfel", { status: 200 }]);
    await expect(wix()("POST", "/stores/v3/bulk/inventory-items/update", {})).rejects.toThrow(/nätverksfel/);
    expect(anrop).toHaveLength(1);
  });
});

describe("arLasning", () => {
  it("GET är alltid en läsning", () => {
    expect(arLasning("GET", "/stores/v3/products/abc?fields=X")).toBe(true);
  });

  it.each(LASANDE)("läsande POST: %s", (sokvag) => {
    expect(arLasning("POST", sokvag)).toBe(true);
    expect(arLasning("POST", `${sokvag}?fields=X`)).toBe(true);
  });

  it.each(SKRIVANDE)("skrivande POST: %s", (sokvag) => {
    expect(arLasning("POST", sokvag)).toBe(false);
  });

  it("☠️ slutet avgör: /query mitt i adressen eller i frågesträngen är ingen läsning", () => {
    expect(arLasning("POST", "/stores/v3/query/update")).toBe(false);
    expect(arLasning("POST", "/stores/v3/products/update?next=/query")).toBe(false);
    expect(arLasning("POST", "/stores/v3/products/search/bulk-delete")).toBe(false);
  });

  it("PATCH, PUT och DELETE är aldrig en läsning", () => {
    for (const metod of ["PATCH", "PUT", "DELETE"]) {
      expect(arLasning(metod, "/stores/v3/products/query")).toBe(false);
    }
  });
});
