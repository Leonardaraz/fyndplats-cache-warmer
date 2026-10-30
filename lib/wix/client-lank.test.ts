// Importens bildkoppling (linkChoiceMedia) mot en låtsas-Wix som beter sig som det
// riktiga: varukostnaden (revenueDetails.cost) kommer bara med fields=MERCHANT_DATA,
// profit och profitMargin är skrivskyddade, och en variantsInfo-PATCH ERSÄTTER
// varianterna — det som inte skickas med finns inte kvar.

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { linkChoiceMedia } from "./client";

const FORRA = { token: process.env.WIX_API_TOKEN, site: process.env.WIX_SITE_ID, dry: process.env.DRY_RUN };

beforeEach(() => {
  process.env.WIX_API_TOKEN = "t";
  process.env.WIX_SITE_ID = "s";
  delete process.env.DRY_RUN;
  vi.spyOn(console, "warn").mockImplementation(() => {});
  vi.spyOn(console, "log").mockImplementation(() => {});
});

afterEach(() => {
  for (const [k, v] of [["WIX_API_TOKEN", FORRA.token], ["WIX_SITE_ID", FORRA.site], ["DRY_RUN", FORRA.dry]] as const) {
    if (v === undefined) delete process.env[k];
    else process.env[k] = v;
  }
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

type Obj = Record<string, unknown>;

const KOSTNAD = { cost: { amount: "850.00", formattedAmount: "850,00 kr" }, profit: { amount: "150.00" }, profitMargin: 15 };
const ID = "00000001-0000-4000-8000-0000000000aa";

/** En produkt med två färger, bilderna uppladdade med en unik alt-text per färg. */
function startProdukt(): Obj {
  return {
    id: ID,
    revision: "1",
    visible: false,
    media: {
      itemsInfo: {
        items: [
          { id: "img-svart", altText: "Svart" },
          { id: "img-bla", altText: "Blå" },
        ],
      },
    },
    options: [
      {
        id: "o1",
        name: "Färg",
        choicesSettings: { choices: [{ choiceId: "c1", name: "Svart" }, { choiceId: "c2", name: "Blå" }] },
      },
    ],
    variantsInfo: {
      variants: [
        { id: "v1", visible: true, sku: "FP-1", revenueDetails: structuredClone(KOSTNAD) },
        { id: "v2", visible: true, sku: "FP-2", revenueDetails: structuredClone(KOSTNAD) },
      ],
    },
  };
}

function lansWix(opts: { kostnadNekad?: boolean; media?: Obj[]; senBild?: { item: Obj; efterGet: number } } = {}) {
  const p = startProdukt();
  if (opts.media) (p.media as Obj).itemsInfo = { items: opts.media };
  let gets = 0;
  const anrop: { metod: string; url: string; kropp?: Obj }[] = [];
  vi.stubGlobal("fetch", (async (u: RequestInfo | URL, init?: RequestInit) => {
    const url = String(u);
    const metod = init?.method ?? "GET";
    const kropp = init?.body ? (JSON.parse(String(init.body)) as Obj) : undefined;
    anrop.push({ metod, url, kropp });
    // Variantbilds-uppföljningen (refreshVariantMedia) hör inte hit; den ser en färdig sida.
    if (metod === "GET") {
      const medKostnad = url.includes("MERCHANT_DATA");
      if (medKostnad && opts.kostnadNekad) {
        return new Response('{"message":"NO_PERMISSION_TO_READ_MERCHANT_DATA"}', { status: 403 });
      }
      gets++;
      // En bild som Wix ännu inte hunnit ta in syns först efter några läsningar.
      if (opts.senBild && gets > opts.senBild.efterGet) {
        const items = ((p.media as Obj).itemsInfo as Obj).items as Obj[];
        if (!items.includes(opts.senBild.item)) items.push(opts.senBild.item);
      }
      const k = structuredClone(p);
      if (!medKostnad) for (const v of ((k.variantsInfo as Obj).variants as Obj[])) delete v.revenueDetails;
      return new Response(JSON.stringify({ product: k }), { status: 200 });
    }
    const body = kropp as { product: Obj };
    for (const v of ((body.product.variantsInfo as Obj).variants as Obj[])) {
      const rd = (v.revenueDetails ?? {}) as Obj;
      if ("profit" in rd || "profitMargin" in rd) return new Response("profit är skrivskyddad", { status: 400 });
    }
    p.options = structuredClone(body.product.options);
    // En variantsInfo-PATCH ERSÄTTER varianterna.
    p.variantsInfo = structuredClone(body.product.variantsInfo);
    p.revision = String(Number(p.revision) + 1);
    return new Response(JSON.stringify({ product: p }), { status: 200 });
  }) as unknown as typeof fetch);
  return { p, anrop };
}

const LANKAR = [
  { optionName: "Färg", choiceName: "Svart", altText: "Svart" },
  { optionName: "Färg", choiceName: "Blå", altText: "Blå" },
];

describe("linkChoiceMedia", () => {
  it("☠️ varukostnaden följer med kopplingen — utan MERCHANT_DATA hade PATCH:en nollat den på varje variant", async () => {
    const w = lansWix();
    const n = await linkChoiceMedia(ID, LANKAR);
    expect(n).toBe(2);
    expect(w.anrop[0].url).toContain("fields=MEDIA_ITEMS_INFO");
    expect(w.anrop[0].url).toContain("fields=MERCHANT_DATA");
    const varianter = (w.p.variantsInfo as Obj).variants as Obj[];
    expect(varianter).toHaveLength(2);
    for (const v of varianter) expect(v.revenueDetails, "varje variant behåller sin kostnad").toEqual({ cost: KOSTNAD.cost });
  });

  it("☠️ nekas kostnadsfältet kopplas bilderna ändå, utan att fälla importen, och loggen säger det", async () => {
    const w = lansWix({ kostnadNekad: true });
    const n = await linkChoiceMedia(ID, LANKAR);
    expect(n).toBe(2);
    expect(w.anrop.some((a) => a.metod === "PATCH")).toBe(true);
    // Efter det nekade svaret läses det aldrig med fältet igen.
    const forsta403 = w.anrop.findIndex((a) => a.url.includes("MERCHANT_DATA"));
    expect(w.anrop.slice(forsta403 + 1).filter((a) => a.metod === "GET" && a.url.includes("MERCHANT_DATA"))).toHaveLength(0);
    expect(console.warn).toHaveBeenCalledWith(expect.stringContaining("MERCHANT_DATA nekas"));
  });
});

describe("linkChoiceMedia — flera bilder per val (VEVOR-familjerna 2026-10-30)", () => {
  const MEDIA = [
    { id: "s1", altText: "Svart" },
    { id: "s2", altText: "Svart, bild 2" },
    { id: "b1", altText: "Blå" },
  ];
  const FLERA = [
    { optionName: "Färg", choiceName: "Svart", altText: "Svart" },
    { optionName: "Färg", choiceName: "Svart", altText: "Svart, bild 2" },
    { optionName: "Färg", choiceName: "Blå", altText: "Blå" },
    { optionName: "Färg", choiceName: "Blå", altText: "Blå, bild 2" },
  ];
  const valen = (p: Obj) => ((p.options as Obj[])[0].choicesSettings as Obj).choices as Obj[];

  it("valet får alla sina bilder, i länkarnas ordning", async () => {
    const w = lansWix({ media: [...MEDIA, { id: "b2", altText: "Blå, bild 2" }] });
    expect(await linkChoiceMedia(ID, FLERA)).toBe(4);
    expect(valen(w.p).map((c) => c.linkedMedia)).toEqual([
      [{ id: "s1" }, { id: "s2" }],
      [{ id: "b1" }, { id: "b2" }],
    ]);
  });

  it("☠️ en bild som Wix inte hunnit ta in kopplas i nästa varv, kopplingen nöjer sig inte med en del", async () => {
    vi.useFakeTimers();
    try {
      const w = lansWix({ media: MEDIA, senBild: { item: { id: "b2", altText: "Blå, bild 2" }, efterGet: 3 } });
      const klar = linkChoiceMedia(ID, FLERA);
      await vi.runAllTimersAsync();
      expect(await klar).toBe(4);
      expect(valen(w.p)[1].linkedMedia).toEqual([{ id: "b1" }, { id: "b2" }]);
      expect(w.anrop.filter((a) => a.metod === "PATCH").length).toBeGreaterThan(1);
    } finally {
      vi.useRealTimers();
    }
  });
});
