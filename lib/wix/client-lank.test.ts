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

function lansWix(opts: { kostnadNekad?: boolean } = {}) {
  const p = startProdukt();
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
