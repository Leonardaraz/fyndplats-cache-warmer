// Auktionens prissänkning mot en låtsas-Wix som beter sig som det riktiga:
// varukostnaden (revenueDetails.cost) kommer bara med fields=MERCHANT_DATA,
// profit och profitMargin är skrivskyddade, och en variantsInfo-PATCH ERSÄTTER
// varianterna — det som inte skickas med finns inte kvar.

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { patchProductPrice, patchProductVariants } from "./store";

const FORRA = { token: process.env.WIX_API_TOKEN, site: process.env.WIX_SITE_ID };

beforeEach(() => {
  process.env.WIX_API_TOKEN = "t";
  process.env.WIX_SITE_ID = "s";
  vi.spyOn(console, "warn").mockImplementation(() => {});
});

afterEach(() => {
  for (const [k, v] of [["WIX_API_TOKEN", FORRA.token], ["WIX_SITE_ID", FORRA.site]] as const) {
    if (v === undefined) delete process.env[k];
    else process.env[k] = v;
  }
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

type Obj = Record<string, unknown>;

const KOSTNAD = { cost: { amount: "850.00", formattedAmount: "850,00 kr" }, profit: { amount: "150.00" }, profitMargin: 15 };
const ID = "00000001-0000-4000-8000-0000000000bb";

function lansWix(opts: { kostnadNekad?: boolean } = {}) {
  const p: Obj = {
    id: ID,
    revision: "4",
    visible: true,
    options: [{ id: "o1", name: "Storlek", choicesSettings: { choices: [{ choiceId: "c1", name: "M" }, { choiceId: "c2", name: "L" }] } }],
    variantsInfo: {
      variants: [
        { id: "v1", visible: true, sku: "FP-m", price: { actualPrice: { amount: "999" } }, revenueDetails: structuredClone(KOSTNAD) },
        { id: "v2", visible: true, sku: "FP-l", price: { actualPrice: { amount: "1099" } }, revenueDetails: structuredClone(KOSTNAD) },
      ],
    },
  };
  const anrop: { metod: string; url: string }[] = [];
  vi.stubGlobal("fetch", (async (u: RequestInfo | URL, init?: RequestInit) => {
    const url = String(u);
    const metod = init?.method ?? "GET";
    anrop.push({ metod, url });
    if (metod === "GET") {
      const medKostnad = url.includes("MERCHANT_DATA");
      if (medKostnad && opts.kostnadNekad) {
        return new Response('{"message":"NO_PERMISSION_TO_READ_MERCHANT_DATA"}', { status: 403 });
      }
      const k = structuredClone(p);
      if (!medKostnad) for (const v of ((k.variantsInfo as Obj).variants as Obj[])) delete v.revenueDetails;
      return new Response(JSON.stringify({ product: k }), { status: 200 });
    }
    const body = JSON.parse(String(init?.body)) as { product: Obj };
    for (const v of ((body.product.variantsInfo as Obj).variants as Obj[])) {
      const rd = (v.revenueDetails ?? {}) as Obj;
      if ("profit" in rd || "profitMargin" in rd) return new Response("profit är skrivskyddad", { status: 400 });
    }
    // En variantsInfo-PATCH ERSÄTTER varianterna.
    p.variantsInfo = structuredClone(body.product.variantsInfo);
    p.revision = String(Number(p.revision) + 1);
    return new Response(JSON.stringify({ product: p }), { status: 200 });
  }) as unknown as typeof fetch);
  const varianter = () => (p.variantsInfo as { variants: Obj[] }).variants;
  return { anrop, varianter };
}

describe("auktionens prissänkning", () => {
  it("☠️ varukostnaden följer med — utan MERCHANT_DATA nollades den vid varje sänkning", async () => {
    const w = lansWix();
    await patchProductPrice(ID, 799, 1099);
    expect(w.anrop[0].url).toContain("fields=MERCHANT_DATA");
    const v = w.varianter();
    expect(v.map((x) => (x.price as { actualPrice: { amount: string } }).actualPrice.amount)).toEqual(["799", "799"]);
    for (const x of v) expect(x.revenueDetails, "varje variant behåller sin kostnad").toEqual({ cost: KOSTNAD.cost });
  });

  it("☠️ också en variant som inte får nytt pris behåller sin kostnad (per-variant-läget)", async () => {
    const w = lansWix();
    await patchProductVariants(ID, new Map([["v1", { price: 799, compareAt: 999 }]]));
    const v = w.varianter();
    expect((v[0].price as { actualPrice: { amount: string } }).actualPrice.amount).toBe("799");
    expect((v[1].price as { actualPrice: { amount: string } }).actualPrice.amount).toBe("1099");
    for (const x of v) expect(x.revenueDetails).toEqual({ cost: KOSTNAD.cost });
  });

  it("☠️ nekas kostnadsfältet sänks priset ändå — en sänkning stoppas inte av ett kosmetiskt fält — och loggen säger det", async () => {
    const w = lansWix({ kostnadNekad: true });
    await patchProductPrice(ID, 799, 1099);
    expect(w.anrop.some((a) => a.metod === "PATCH")).toBe(true);
    expect(w.varianter().map((x) => (x.price as { actualPrice: { amount: string } }).actualPrice.amount)).toEqual(["799", "799"]);
    expect(console.warn).toHaveBeenCalledWith(expect.stringContaining("MERCHANT_DATA nekas"));
  });
});
