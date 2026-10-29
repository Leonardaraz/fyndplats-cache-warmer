import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  __sattVantaForTester,
  aggregera,
  allaRader,
  hamta,
  infoga,
  iOmgangar,
  kanForsokaIgen,
  patcha,
  satt,
  spara,
  sparaManga,
  taBort,
  utanSystemfalt,
} from "./wix-data-klient";

type Svar = { status?: number; body?: unknown; text?: string };

function svar(s: Svar): Response {
  const status = s.status ?? 200;
  const text = s.text ?? (s.body === undefined ? "" : JSON.stringify(s.body));
  return { ok: status < 400, status, text: async () => text, json: async () => JSON.parse(text || "{}"), headers: new Headers() } as Response;
}

let fetchSpion: ReturnType<typeof vi.fn>;
function kropp(i: number): Record<string, unknown> {
  return JSON.parse((fetchSpion.mock.calls[i] as [string, RequestInit])[1].body as string);
}

beforeEach(() => {
  vi.stubEnv("WIX_API_TOKEN", "t");
  vi.stubEnv("WIX_SITE_ID", "s");
  __sattVantaForTester(async () => {});
  vi.spyOn(console, "warn").mockImplementation(() => {});
  fetchSpion = vi.fn();
  vi.stubGlobal("fetch", fetchSpion);
});

afterEach(() => {
  __sattVantaForTester(null);
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe("kanForsokaIgen", () => {
  it("☠️ kvotstoppet (429/WDE0014) försöks om för ALLA slag — anropet kördes aldrig", () => {
    for (const slag of ["lasning", "idempotent", "engang"] as const) {
      expect(kanForsokaIgen(429, null, slag)).toBe(true);
      expect(kanForsokaIgen(400, "WDE0014", slag)).toBe(true);
    }
  });

  it("☠️ ett anspråk försöks aldrig om blint efter 5xx eller nätverksfel — det kan ha gått igenom", () => {
    expect(kanForsokaIgen(500, null, "engang")).toBe(false);
    expect(kanForsokaIgen(0, null, "engang")).toBe(false);
    expect(kanForsokaIgen(504, "WDE0028", "engang")).toBe(false);
  });

  it("läsningar och idempotenta skrivningar försöks om på 5xx, nätverk och tidsgräns", () => {
    expect(kanForsokaIgen(503, null, "lasning")).toBe(true);
    expect(kanForsokaIgen(0, null, "idempotent")).toBe(true);
    expect(kanForsokaIgen(400, "WDE0028", "lasning")).toBe(true);
    expect(kanForsokaIgen(400, null, "lasning")).toBe(false);
    expect(kanForsokaIgen(404, "WDE0073", "idempotent")).toBe(false);
  });
});

describe("hamta", () => {
  it("en saknad rad är null, men en saknad KOLLEKTION är ett fel", async () => {
    fetchSpion.mockResolvedValueOnce(svar({ status: 404, text: '{"message":"WDE0073: Item x does not exist"}' }));
    expect(await hamta("FyndplatsTasks", "x")).toBeNull();

    fetchSpion.mockResolvedValueOnce(svar({ status: 404, text: '{"message":"WDE0025: The Foo collection does not exist"}' }));
    await expect(hamta("Foo", "x")).rejects.toThrow(/WDE0025/);
  });

  it("tar bort Wix systemfält men behåller _id", async () => {
    fetchSpion.mockResolvedValueOnce(
      svar({ body: { dataItem: { data: { _id: "a", _owner: "o", _createdDate: { $date: "x" }, anspraksToken: "k", v: 1 } } } }),
    );
    expect(await hamta("C", "a")).toEqual({ _id: "a", v: 1 });
  });

  it("försöker om ett kvotstopp och lyckas", async () => {
    fetchSpion
      .mockResolvedValueOnce(svar({ status: 429, text: '{"message":"WDE0014: Requests per minute quota exceeded"}' }))
      .mockResolvedValueOnce(svar({ body: { dataItem: { data: { _id: "a" } } } }));
    expect(await hamta("C", "a")).toEqual({ _id: "a" });
    expect(fetchSpion).toHaveBeenCalledTimes(2);
  });

  it("☠️ tokenkollektionens felkropp loggas aldrig", async () => {
    fetchSpion.mockResolvedValue(svar({ status: 400, text: '{"details":"real-refresh-token"}' }));
    await expect(hamta("FyndplatsAliExpressTokens", "aliexpress-main")).rejects.toThrow(/\[redacted\]/);
    await expect(hamta("FyndplatsAliExpressTokens", "aliexpress-main")).rejects.not.toThrow(/real-refresh-token/);
  });
});

describe("allaRader", () => {
  const sida = (n: number, start: number, nasta?: string) =>
    svar({
      body: {
        dataItems: Array.from({ length: n }, (_, i) => ({ data: { _id: `r${start + i}` } })),
        pagingMetadata: { cursors: nasta ? { next: nasta } : {} },
      },
    });

  it("följer markören och skickar filter och sortering bara i första anropet", async () => {
    fetchSpion.mockResolvedValueOnce(sida(1000, 0, "c1")).mockResolvedValueOnce(sida(3, 1000));
    const rader = await allaRader("C", { filter: { status: "x" }, sort: [{ fieldName: "a", order: "ASC" }] });
    expect(rader).toHaveLength(1003);
    expect((kropp(0).query as Record<string, unknown>).filter).toEqual({ status: "x" });
    expect(kropp(1).query).toEqual({ cursorPaging: { limit: 1000, cursor: "c1" } });
  });

  it("☠️ `falt` skickas med på VARJE sida, inte bara den första", async () => {
    fetchSpion.mockResolvedValueOnce(sida(1000, 0, "c1")).mockResolvedValueOnce(sida(3, 1000));
    await allaRader("C", { filter: { status: "x" }, falt: ["sku", "saldo"] });
    expect((kropp(0).query as Record<string, unknown>).fields).toEqual(["sku", "saldo"]);
    expect(kropp(1).query).toEqual({ cursorPaging: { limit: 1000, cursor: "c1" }, fields: ["sku", "saldo"] });
  });

  it("utan `falt` frågar den efter hela raderna, som förut", async () => {
    fetchSpion.mockResolvedValueOnce(sida(3, 0));
    await allaRader("C");
    expect((kropp(0).query as Record<string, unknown>).fields).toBeUndefined();
  });

  it("☠️ kastar hellre än kapar: över taket", async () => {
    fetchSpion.mockImplementation(async () => sida(1000, Math.random() * 1e9, `c${Math.random()}`));
    await expect(allaRader("C", { tak: 2500 })).rejects.toThrow(/passerade 2500 rader/);
  });

  it("☠️ samma markör två gånger är ett fel, inte en evig loop", async () => {
    fetchSpion
      .mockResolvedValueOnce(sida(1000, 0, "c1"))
      .mockResolvedValueOnce(sida(1000, 1000, "c1"));
    await expect(allaRader("C")).rejects.toThrow(/samma markör/);
  });

  it("☠️ ett fel mitt i svepet kastar — en halv lista ser ut som en hel", async () => {
    fetchSpion.mockResolvedValueOnce(sida(1000, 0, "c1")).mockResolvedValue(svar({ status: 400, text: "{}" }));
    await expect(allaRader("C")).rejects.toThrow(/Wix Data query C \(400/);
  });
});

describe("aggregera", () => {
  const AGGREGATION = {
    groupingFields: ["productId"],
    operations: [{ resultFieldName: "antal", itemCount: {} }],
  };
  const grupper = (fran: number, till: number) =>
    Array.from({ length: till - fran }, (_, i) => ({ productId: `p${String(fran + i).padStart(4, "0")}`, antal: 1 }));

  it("☠️ sorterar på grupperingsfälten i VARJE anrop och läser till sista sidan", async () => {
    fetchSpion.mockResolvedValueOnce(svar({ body: { results: grupper(0, 1000) } }));
    fetchSpion.mockResolvedValueOnce(svar({ body: { results: grupper(1000, 1003) } }));
    const rader = await aggregera("FyndplatsImportedReviews", { aggregation: AGGREGATION });
    expect(rader).toHaveLength(1003);
    for (const i of [0, 1]) {
      expect(kropp(i).sort).toEqual([{ fieldName: "productId", order: "ASC" }]);
      expect(kropp(i).aggregation).toEqual(AGGREGATION);
    }
    expect(kropp(0).paging).toEqual({ limit: 1000, offset: 0 });
    expect(kropp(1).paging).toEqual({ limit: 1000, offset: 1000 });
  });

  it("☠️ samma grupp på två sidor kastar — en överlappande lista har rätt antal rader men saknar grupper", async () => {
    fetchSpion.mockResolvedValueOnce(svar({ body: { results: grupper(0, 1000) } }));
    fetchSpion.mockResolvedValueOnce(svar({ body: { results: [{ productId: "p0005", antal: 1 }, ...grupper(1000, 1002)] } }));
    await expect(aggregera("FyndplatsImportedReviews", { aggregation: AGGREGATION })).rejects.toThrow(/överlappar/);
  });

  it("utan grupperingsfält skickas ingen sortering", async () => {
    fetchSpion.mockResolvedValueOnce(svar({ body: { results: [{ antal: 7 }] } }));
    const rader = await aggregera("FyndplatsImportedReviews", {
      aggregation: { operations: [{ resultFieldName: "antal", itemCount: {} }] },
    });
    expect(rader).toEqual([{ antal: 7 }]);
    expect(kropp(0).sort).toBeUndefined();
  });
});

describe("infoga — anspråket", () => {
  it("skapad när Wix tar raden, fanns när id:t redan finns (WDE0074)", async () => {
    fetchSpion.mockResolvedValueOnce(svar({ body: { dataItem: {} } }));
    expect(await infoga("C", "k", { v: 1 })).toBe("skapad");
    expect(kropp(0)).toMatchObject({ dataCollectionId: "C", dataItem: { id: "k", data: { _id: "k", v: 1 } } });

    fetchSpion.mockResolvedValueOnce(svar({ status: 409, text: '{"message":"WDE0074: WD_ITEM_ALREADY_EXISTS"}' }));
    expect(await infoga("C", "k", { v: 1 })).toBe("fanns");
  });

  it("☠️ efter ett nätverksfel avgör återläsningen: VÅR token = vi äger raden", async () => {
    fetchSpion.mockRejectedValueOnce(new Error("ECONNRESET"));
    fetchSpion.mockImplementationOnce(async () => {
      // Återläsningen: raden finns och bär den token vi skickade.
      const token = (JSON.parse((fetchSpion.mock.calls[0] as [string, RequestInit])[1].body as string).dataItem.data as { anspraksToken: string }).anspraksToken;
      return svar({ body: { dataItem: { data: { _id: "k", anspraksToken: token } } } });
    });
    expect(await infoga("C", "k", { v: 1 })).toBe("skapad");
  });

  it("☠️ efter ett nätverksfel och någon ANNANS rad: fanns", async () => {
    fetchSpion
      .mockRejectedValueOnce(new Error("ECONNRESET"))
      .mockResolvedValueOnce(svar({ body: { dataItem: { data: { _id: "k", anspraksToken: "annan" } } } }));
    expect(await infoga("C", "k", { v: 1 })).toBe("fanns");
  });
});

describe("patcha och taBort", () => {
  it("villkorad patch: 428 WDE0193 är condition-failed, 404 är not-found", async () => {
    fetchSpion.mockResolvedValueOnce(svar({ status: 428, text: '{"message":"WDE0193"}' }));
    expect(await patcha("C", "x", [satt("a", 1)], { a: { $exists: false } })).toBe("condition-failed");
    fetchSpion.mockResolvedValueOnce(svar({ status: 404, text: '{"message":"WDE0073"}' }));
    expect(await patcha("C", "x", [satt("a", 1)])).toBe("not-found");
  });

  it("taBort med villkor skickar villkoret i kroppen", async () => {
    fetchSpion.mockResolvedValueOnce(svar({ body: {} }));
    expect(await taBort("C", "x", { skickadAt: { $exists: false } })).toBe("borttagen");
    expect(kropp(0)).toEqual({ condition: { filter: { skickadAt: { $exists: false } } } });
  });
});

describe("spara och sparaManga", () => {
  it("spara sätter _id till id:t", async () => {
    fetchSpion.mockResolvedValueOnce(svar({ body: {} }));
    await spara("C", "a", { _id: "fel", v: 1 });
    expect(kropp(0)).toEqual({ dataCollectionId: "C", dataItem: { id: "a", dataCollectionId: "C", data: { _id: "a", v: 1 } } });
  });

  it("☠️ en rad räknas bara när Wix uttryckligen bekräftat den", async () => {
    fetchSpion.mockResolvedValueOnce(
      svar({
        body: {
          results: [
            { itemMetadata: { id: "a", success: true } },
            { itemMetadata: { originalIndex: 1, success: false, error: { code: "WDE0009", description: "Document is too large" } } },
            // "c" nämns inte alls
          ],
          bulkActionMetadata: { totalSuccesses: 1, totalFailures: 1 },
        },
      }),
    );
    const u = await sparaManga("C", [
      { id: "a", data: {} },
      { id: "b", data: {} },
      { id: "c", data: {} },
    ]);
    expect(u.sparade).toBe(1);
    expect(u.fel.map((f) => f.id)).toEqual(["b", "c"]);
    expect(u.fel[0].fel).toMatch(/WDE0009/);
  });

  it("odetaljerade fel gör hela omgången obekräftad", async () => {
    fetchSpion.mockResolvedValueOnce(
      svar({ body: { results: [{ itemMetadata: { id: "a", success: true } }], bulkActionMetadata: { undetailedFailures: 1 } } }),
    );
    const u = await sparaManga("C", [{ id: "a", data: {} }]);
    expect(u.sparade).toBe(0);
  });

  it("iOmgangar delar på antal och på byte", () => {
    expect(iOmgangar([1, 2, 3, 4, 5], () => 1, 2, 100)).toEqual([[1, 2], [3, 4], [5]]);
    expect(iOmgangar([1, 2, 3], () => 60, 100, 100)).toEqual([[1], [2], [3]]);
  });
});

describe("utanSystemfalt", () => {
  it("tar bort _owner, _createdDate, _updatedDate och anspråkets token, behåller _id", () => {
    expect(utanSystemfalt({ _id: "a", _owner: 1, _createdDate: 2, _updatedDate: 3, anspraksToken: 4, x: 5 })).toEqual({ _id: "a", x: 5 });
  });
});
