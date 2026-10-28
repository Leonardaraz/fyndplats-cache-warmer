import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { updateV3VariantPrices } from "./v3-products";

// Uppföljningen av variantbilden importerar de här två när den behövs. Här prövas bara att den
// anropas rätt (och att den aldrig fäller prisskrivningen); hur bilden rättas prövas i
// variant-media.test.ts.
const { refreshVariantMedia } = vi.hoisted(() => ({ refreshVariantMedia: vi.fn() }));
vi.mock("./variant-media", () => ({
  refreshVariantMedia: (...args: unknown[]) => refreshVariantMedia(...args),
}));
vi.mock("../polish/skrivplan-wix", () => ({ skapaWixAnrop: () => "wix-anrop" }));

const FORRA = process.env.WIX_API_TOKEN;

beforeEach(() => {
  process.env.WIX_API_TOKEN = "t";
  refreshVariantMedia.mockReset();
  refreshVariantMedia.mockResolvedValue({ productId: "p1", status: "rattad", avvikande: [], okanda: [] });
});

afterEach(() => {
  if (FORRA === undefined) delete process.env.WIX_API_TOKEN;
  else process.env.WIX_API_TOKEN = FORRA;
  vi.unstubAllGlobals();
});

/** Fångar PATCH-kroppen så testet kan läsa exakt vad som skickades till Wix. */
function stubba(produkt: Record<string, unknown>) {
  const patchar: { body: Record<string, unknown> }[] = [];
  vi.stubGlobal("fetch", (async (_u: RequestInfo | URL, init?: RequestInit) => {
    if (!init || init.method !== "PATCH") {
      return new Response(JSON.stringify({ product: produkt }), { status: 200 });
    }
    patchar.push({ body: JSON.parse(String(init.body)) });
    return new Response(JSON.stringify({ product: { revision: "2" } }), { status: 200 });
  }) as unknown as typeof fetch);
  return patchar;
}

const produkt = (visible: boolean | undefined) => ({
  id: "p1",
  revision: "1",
  ...(visible === undefined ? {} : { visible }),
  variantsInfo: { variants: [{ id: "v1", sku: "SKU-1", price: { actualPrice: { amount: "100" } } }] },
});

describe("updateV3VariantPrices — synligheten", () => {
  it("☠️ skickar tillbaka visible:false så ett UTKAST inte publiceras", async () => {
    // Uppmätt mot skarpa V3 2026-08-28: en variantsInfo-PATCH utan `visible` tog
    // ett osynligt Aosom-utkast från visible:false till visible:true. Fältmasken
    // skyddar INTE synligheten. Katalogen bär 2 700+ opolerade tyska utkast, så
    // en prisskrivning som publicerar dem är en riktig incident, inte en detalj.
    const patchar = stubba(produkt(false));
    await updateV3VariantPrices("p1", [{ sku: "SKU-1", actualPrice: 149 }]);

    expect(patchar).toHaveLength(1);
    const body = patchar[0].body as { product: Record<string, unknown>; fieldMask: { paths: string[] } };
    expect(body.product.visible).toBe(false);
    expect(body.fieldMask.paths).toContain("visible");
  });

  it("håller en publicerad produkt publicerad", async () => {
    const patchar = stubba(produkt(true));
    await updateV3VariantPrices("p1", [{ sku: "SKU-1", actualPrice: 149 }]);
    const body = patchar[0].body as { product: Record<string, unknown> };
    expect(body.product.visible).toBe(true);
  });

  it("saknas visible i svaret utelämnas fältet — gissas aldrig", async () => {
    // En gissning här publicerar eller döljer en produkt åt fel håll. Hellre
    // oförändrat beteende än ett påhittat värde.
    const patchar = stubba(produkt(undefined));
    await updateV3VariantPrices("p1", [{ sku: "SKU-1", actualPrice: 149 }]);
    const body = patchar[0].body as { product: Record<string, unknown>; fieldMask: { paths: string[] } };
    expect("visible" in body.product).toBe(false);
    expect(body.fieldMask.paths).toEqual(["variantsInfo"]);
  });

  it("skriver priset som STRÄNG — ett tal avrundas tyst av V3", async () => {
    const patchar = stubba(produkt(false));
    await updateV3VariantPrices("p1", [{ sku: "SKU-1", actualPrice: 1499 }]);
    const body = patchar[0].body as {
      product: { variantsInfo: { variants: { price: { actualPrice: { amount: unknown } } }[] } };
    };
    expect(body.product.variantsInfo.variants[0].price.actualPrice.amount).toBe("1499");
  });

  it("omatchad variant rapporteras i stället för att tyst hoppas över", async () => {
    stubba(produkt(false));
    const res = await updateV3VariantPrices("p1", [{ sku: "FINNS-INTE", actualPrice: 149 }]);
    expect(res.updated).toBe(0);
    expect(res.missing).toEqual(["FINNS-INTE"]);
  });
});

describe("updateV3VariantPrices — options på flervariantsprodukter", () => {
  const OPTIONS = [
    { id: "o1", name: "Färg", choicesSettings: { choices: [{ choiceId: "c1", name: "Blå" }] } },
  ];

  it("☠️ skickar med produktens options — annars 428 MISSING_OPTIONS_ON_UPDATE_VARIANTS", async () => {
    // Uppmätt i drift 2026-09-13: 56 av 382 prishöjningar föll på just det
    // felet, alla på flervariantsprodukter. De tidigare anroparna (Aosom-synken,
    // prisreparationen) rör bara enkelvariantsrader, så funktionen hade aldrig
    // prövats på fallet där den inte fungerar.
    const patchar = stubba({ ...produkt(true), options: OPTIONS });
    await updateV3VariantPrices("p1", [{ sku: "SKU-1", actualPrice: 149 }]);

    const body = patchar[0].body as { product: Record<string, unknown> };
    expect(body.product.options).toEqual(OPTIONS);
  });

  it("☠️ och options MÅSTE stå i fältmasken — annars ignorerar Wix dem", async () => {
    // Uppmätt: med options i kroppen men inte i masken föll exakt samma 63
    // produkter på exakt samma 428. En fältmask-PATCH läser bara det som står
    // i masken; resten av kroppen ignoreras.
    const patchar = stubba({ ...produkt(true), options: OPTIONS });
    await updateV3VariantPrices("p1", [{ sku: "SKU-1", actualPrice: 149 }]);

    const body = patchar[0].body as { fieldMask: { paths: string[] } };
    expect(body.fieldMask.paths).toContain("options");
  });

  it("en produkt UTAN options får inget options-fält alls", async () => {
    const patchar = stubba(produkt(true));
    await updateV3VariantPrices("p1", [{ sku: "SKU-1", actualPrice: 149 }]);

    const body = patchar[0].body as {
      product: Record<string, unknown>;
      fieldMask: { paths: string[] };
    };
    expect("options" in body.product).toBe(false);
    expect(body.fieldMask.paths).not.toContain("options");
  });
});

// ── Varukostnaden och variantbilden följer med en prisskrivning (Leonards ja 2026-10-27) ─────────────

/** En flervariantsprodukt som GET:en med MERCHANT_DATA visar den: kostnad, vinst och marginal per variant. */
const tvaVarianter = (revision = "1") => ({
  id: "p1",
  revision,
  visible: true,
  options: [
    { id: "o1", name: "Färg", choicesSettings: { choices: [{ choiceId: "c1", name: "Blå" }, { choiceId: "c2", name: "Röd" }] } },
  ],
  variantsInfo: {
    variants: [
      {
        id: "v1",
        sku: "SKU-1",
        price: { actualPrice: { amount: "100" } },
        revenueDetails: { cost: { amount: "50" }, profit: { amount: "50" }, profitMargin: 0.5 },
      },
      {
        id: "v2",
        sku: "SKU-2",
        price: { actualPrice: { amount: "120" } },
        revenueDetails: { cost: { amount: "60" }, profit: { amount: "60" }, profitMargin: 0.5 },
      },
    ],
  },
});

type Variantkropp = { id: string; revenueDetails?: Record<string, unknown> };
type PatchKropp = { product: { variantsInfo: { variants: Variantkropp[] } }; fieldMask: { paths: string[] } };

/**
 * En fetch som skiljer läsningen med och utan handelsdata (utan den bär svaret ingen kostnad, som
 * Wix) och som minns allt som frågades och skrevs.
 */
function stubbaMedKostnad(
  produkt: Record<string, unknown>,
  over: { merchant?: "ok" | "403" | "500"; patchRevision?: string | null } = {},
) {
  const lasningar: string[] = [];
  const patchar: { body: PatchKropp }[] = [];
  vi.stubGlobal("fetch", (async (u: RequestInfo | URL, init?: RequestInit) => {
    if (init?.method === "PATCH") {
      patchar.push({ body: JSON.parse(String(init.body)) as PatchKropp });
      const rev = over.patchRevision === undefined ? "2" : over.patchRevision;
      return new Response(JSON.stringify({ product: rev === null ? {} : { revision: rev } }), { status: 200 });
    }
    const url = String(u);
    lasningar.push(url);
    if (url.includes("MERCHANT_DATA")) {
      if (over.merchant === "403") {
        return new Response(JSON.stringify({ message: "NO_PERMISSION_TO_READ_MERCHANT_DATA" }), { status: 403 });
      }
      if (over.merchant === "500") return new Response("boom", { status: 500 });
      return new Response(JSON.stringify({ product: produkt }), { status: 200 });
    }
    const utan = structuredClone(produkt) as { variantsInfo: { variants: Array<Record<string, unknown>> } };
    for (const v of utan.variantsInfo.variants) delete v.revenueDetails;
    return new Response(JSON.stringify({ product: utan }), { status: 200 });
  }) as unknown as typeof fetch);
  return { lasningar, patchar };
}

const varianterIKroppen = (b: PatchKropp) => b.product.variantsInfo.variants;

describe("updateV3VariantPrices — varukostnaden följer med", () => {
  it("☠️ läser produkten MED handelsdata och skickar kostnaden tillbaka på varianten som INTE skrivs", async () => {
    // En variantsInfo-PATCH ersätter varianten. Läst utan MERCHANT_DATA bär den ingen kostnad, och
    // varianterna som inte stod i anropet gick tillbaka utan (2 633 produkter saknade den 2026-10-24).
    const s = stubbaMedKostnad(tvaVarianter());
    await updateV3VariantPrices("p1", [{ sku: "SKU-1", actualPrice: 149 }], { foljUppVariantbild: false });

    expect(s.lasningar).toHaveLength(1);
    expect(s.lasningar[0]).toContain("fields=VARIANT_OPTION_CHOICE_NAMES");
    expect(s.lasningar[0]).toContain("fields=MERCHANT_DATA");
    const v = varianterIKroppen(s.patchar[0].body);
    expect(v.find((x) => x.id === "v2")!.revenueDetails).toEqual({ cost: { amount: "60" } });
    // Den skrivna varianten behåller sin kostnad när anroparen inte ber om en ny.
    expect(v.find((x) => x.id === "v1")!.revenueDetails).toEqual({ cost: { amount: "50" } });
  });

  it("☠️ profit och profitMargin räknas av Wix och skickas aldrig tillbaka", async () => {
    const s = stubbaMedKostnad(tvaVarianter());
    await updateV3VariantPrices("p1", [{ sku: "SKU-1", actualPrice: 149 }], { foljUppVariantbild: false });
    for (const v of varianterIKroppen(s.patchar[0].body)) {
      expect(Object.keys(v.revenueDetails ?? {})).toEqual(["cost"]);
    }
  });

  it("costAmount ersätter kostnaden på den skrivna varianten, de andra behåller sin", async () => {
    const s = stubbaMedKostnad(tvaVarianter());
    await updateV3VariantPrices("p1", [{ sku: "SKU-1", actualPrice: 149, costAmount: 70 }], { foljUppVariantbild: false });
    const v = varianterIKroppen(s.patchar[0].body);
    expect(v.find((x) => x.id === "v1")!.revenueDetails).toEqual({ cost: { amount: "70" } });
    expect(v.find((x) => x.id === "v2")!.revenueDetails).toEqual({ cost: { amount: "60" } });
  });

  it("en variant som saknar kostnad får inget revenueDetails-fält alls", async () => {
    const p = tvaVarianter();
    delete (p.variantsInfo.variants[1] as Record<string, unknown>).revenueDetails;
    const s = stubbaMedKostnad(p);
    await updateV3VariantPrices("p1", [{ sku: "SKU-1", actualPrice: 149 }], { foljUppVariantbild: false });
    expect("revenueDetails" in varianterIKroppen(s.patchar[0].body).find((x) => x.id === "v2")!).toBe(false);
  });

  it("☠️ får nyckeln inte läsa handelsdata (403) läses produkten om utan fältet, och skrivningen går som förut", async () => {
    // Motorns nyckel saknade SCOPE.STORES.PRODUCT_READ_ADMIN 2026-09-27. Ett 403 på ett kosmetiskt fält
    // får inte stoppa varje prisskrivning (synken, prisreparationen och prishöjningen).
    const s = stubbaMedKostnad(tvaVarianter(), { merchant: "403" });
    const res = await updateV3VariantPrices(
      "p1",
      [{ sku: "SKU-1", actualPrice: 149, costAmount: 70 }],
      { foljUppVariantbild: false },
    );

    expect(res.updated).toBe(1);
    expect(s.lasningar).toHaveLength(2);
    expect(s.lasningar[1]).not.toContain("MERCHANT_DATA");
    const v = varianterIKroppen(s.patchar[0].body);
    expect(v.find((x) => x.id === "v1")!.revenueDetails).toEqual({ cost: { amount: "70" } });
    expect("revenueDetails" in v.find((x) => x.id === "v2")!).toBe(false);
  });

  it("andra läsfel än behörighet kastar, utan att försöka igen", async () => {
    const s = stubbaMedKostnad(tvaVarianter(), { merchant: "500" });
    await expect(
      updateV3VariantPrices("p1", [{ sku: "SKU-1", actualPrice: 149 }]),
    ).rejects.toThrow(/GET p1 \(500\)/);
    expect(s.lasningar).toHaveLength(1);
    expect(s.patchar).toHaveLength(0);
  });
});

describe("updateV3VariantPrices — variantbilden rättas direkt efter skrivningen", () => {
  it("☠️ flervariantsprodukt: uppföljningen körs EFTER PATCH:en, med revisionen från svaret", async () => {
    // Aosom-synken skrev regelpriset på klöspelaren `81a60db2` 2026-10-24 09:21:21 UTC, och direkt
    // efteråt hade Beige och Brun huvudbilden som variantbild. Nattens cron rättade det först 05:35.
    const s = stubbaMedKostnad(tvaVarianter("1"));
    let patchadeVidAnrop = -1;
    refreshVariantMedia.mockImplementation(async () => {
      patchadeVidAnrop = s.patchar.length;
      return { productId: "p1", status: "rattad", avvikande: [], okanda: [] };
    });

    const res = await updateV3VariantPrices("p1", [{ sku: "SKU-1", actualPrice: 149 }]);

    expect(refreshVariantMedia).toHaveBeenCalledTimes(1);
    expect(refreshVariantMedia).toHaveBeenCalledWith("wix-anrop", "p1", { minRevision: 2 });
    expect(patchadeVidAnrop).toBe(1);
    expect(res.updated).toBe(1);
    expect(res.variantbild).toBe("rattad");
  });

  it("svarar PATCH:en utan revision räknas den fram: en lyckad skrivning går alltid minst ett steg", async () => {
    stubbaMedKostnad(tvaVarianter("7"), { patchRevision: null });
    await updateV3VariantPrices("p1", [{ sku: "SKU-1", actualPrice: 149 }]);
    expect(refreshVariantMedia).toHaveBeenCalledWith("wix-anrop", "p1", { minRevision: 8 });
  });

  it("en produkt med en variant har ingen färg att visa fel och följs inte upp", async () => {
    stubba(produkt(true));
    const res = await updateV3VariantPrices("p1", [{ sku: "SKU-1", actualPrice: 149 }]);
    expect(refreshVariantMedia).not.toHaveBeenCalled();
    expect("variantbild" in res).toBe(false);
  });

  it("`foljUppVariantbild: false` hoppar uppföljningen", async () => {
    stubbaMedKostnad(tvaVarianter());
    const res = await updateV3VariantPrices("p1", [{ sku: "SKU-1", actualPrice: 149 }], { foljUppVariantbild: false });
    expect(refreshVariantMedia).not.toHaveBeenCalled();
    expect(res.updated).toBe(1);
    expect("variantbild" in res).toBe(false);
  });

  it("ingen skrivning, ingen uppföljning: matchar ingen variant rörs ingenting", async () => {
    const s = stubbaMedKostnad(tvaVarianter());
    const res = await updateV3VariantPrices("p1", [{ sku: "FINNS-INTE", actualPrice: 149 }]);
    expect(res).toEqual({ updated: 0, missing: ["FINNS-INTE"] });
    expect(s.patchar).toHaveLength(0);
    expect(refreshVariantMedia).not.toHaveBeenCalled();
  });

  it("☠️ uppföljningen fäller aldrig prisskrivningen: kastar den är priset ändå skrivet", async () => {
    const varna = vi.spyOn(console, "warn").mockImplementation(() => {});
    try {
      const s = stubbaMedKostnad(tvaVarianter());
      refreshVariantMedia.mockRejectedValue(new Error("Wix 500"));

      const res = await updateV3VariantPrices("p1", [{ sku: "SKU-1", actualPrice: 149 }]);

      expect(res.updated).toBe(1);
      expect(s.patchar).toHaveLength(1);
      expect("variantbild" in res).toBe(false);
      expect(varna).toHaveBeenCalled();
    } finally {
      varna.mockRestore();
    }
  });

  it("en uppföljning som hittar något annat än bilden syns i svaret och loggas", async () => {
    const varna = vi.spyOn(console, "warn").mockImplementation(() => {});
    try {
      stubbaMedKostnad(tvaVarianter());
      refreshVariantMedia.mockResolvedValue({
        productId: "p1",
        status: "avvikelse",
        avvikande: [],
        okanda: [],
        avvikelser: ["pris ändrades"],
      });

      const res = await updateV3VariantPrices("p1", [{ sku: "SKU-1", actualPrice: 149 }]);

      expect(res.variantbild).toBe("avvikelse");
      expect(varna.mock.calls.map((a) => String(a[0])).join("\n")).toMatch(/avvikelse.*pris ändrades/);
    } finally {
      varna.mockRestore();
    }
  });
});
