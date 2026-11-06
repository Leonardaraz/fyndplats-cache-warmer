// Kvittorutten: bara butikens hemlighet, bara köparens egen order, ingen
// cache, och varken e-post eller ordernummer i loggen.

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { FakturaOrder, Foretagsuppgifter } from "@/lib/orders/faktura";

let ordern: FakturaOrder | null = null;
let foretag = new Map<string, Foretagsuppgifter>();
const fragadeFloden: string[][] = [];
vi.mock("@/lib/wix/orders", () => ({
  fetchWixOrderByNumber: async () => ordern,
}));
vi.mock("@/lib/orders/faktura-deps", () => ({
  fakturaDeps: () => ({
    betalning: async () => ({ betalaTill: "Bankgiro 999-0000", fSkatt: true, dagar: 30 }),
    logo: async () => undefined,
    logg: { skickad: async () => null },
    foretagskop: async (f: string[]) => {
      fragadeFloden.push(f);
      return foretag;
    },
  }),
}));

import { POST } from "./route";

function req(kropp: unknown, auth: string | null = "Bearer hemlig") {
  return {
    json: async () => kropp,
    headers: new Headers(auth ? { authorization: auth } : {}),
  } as unknown as Parameters<typeof POST>[0];
}

const webborder = (): FakturaOrder => ({
  id: "order-w",
  number: "10190",
  createdDate: "2026-11-08T10:00:00.000Z",
  status: "APPROVED",
  paymentStatus: "PAID",
  currency: "SEK",
  taxIncludedInPrices: true,
  channelInfo: { type: "WEB" },
  purchaseFlowId: "flode-w",
  buyerInfo: { email: "kund@exempel.se" },
  billingInfo: { address: { country: "SE", city: "Hemorten", postalCode: "111 22", addressLine: "Privatgatan 2" }, contactDetails: { firstName: "Bo", lastName: "Berg" } },
  shippingInfo: { title: "Spårbar standardleverans", cost: { price: { amount: "19.00" } } },
  priceSummary: { subtotal: { amount: "159.20" }, shipping: { amount: "15.20" }, tax: { amount: "43.60" }, total: { amount: "218.00" } },
  lineItems: [{ id: "a", quantity: 1, productName: { original: "Skohylla" }, price: { amount: "199.00" }, totalPriceAfterTax: { amount: "199.00" }, taxDetails: { taxRate: "0.25" } }],
});

const forut = process.env.REVIEW_INGEST_SECRET;
const loggar: string[] = [];

beforeEach(() => {
  process.env.REVIEW_INGEST_SECRET = "hemlig";
  ordern = webborder();
  foretag = new Map();
  fragadeFloden.length = 0;
  loggar.length = 0;
  vi.spyOn(console, "info").mockImplementation((...a) => void loggar.push(a.join(" ")));
  vi.spyOn(console, "error").mockImplementation((...a) => void loggar.push(a.join(" ")));
});

afterEach(() => {
  process.env.REVIEW_INGEST_SECRET = forut;
  vi.restoreAllMocks();
});

const KROPP = { ordernummer: "10190", epost: "kund@exempel.se" };

describe("POST /api/medlem/kvitto", () => {
  it("utan rätt hemlighet: 401, och 503 när hemligheten saknas i miljön", async () => {
    expect((await POST(req(KROPP, "Bearer fel"))).status).toBe(401);
    expect((await POST(req(KROPP, null))).status).toBe(401);
    delete process.env.REVIEW_INGEST_SECRET;
    expect((await POST(req(KROPP))).status).toBe(503);
  });

  it("fel form: 400", async () => {
    expect((await POST(req({ ordernummer: "10190" }))).status).toBe(400);
    expect((await POST(req({ ordernummer: "10190; drop", epost: "kund@exempel.se" }))).status).toBe(400);
    expect((await POST(req(null))).status).toBe(400);
  });

  it("☠️ någon annans order: 404 utan PDF, och varken e-post eller nummer i loggen", async () => {
    const r = await POST(req({ ordernummer: "10190", epost: "annan@exempel.se" }));
    expect(r.status).toBe(404);
    expect(await r.json()).toEqual({ ok: false, skal: "inte-din" });
    expect(loggar.join("\n")).not.toMatch(/exempel\.se|10190/);
    expect(fragadeFloden).toEqual([]);
    ordern = null;
    expect((await POST(req(KROPP))).status).toBe(404);
  });

  it("egen betald order: en PDF som inte cachas, och företaget slås upp på köpflödet", async () => {
    foretag = new Map([["flode-w", { namn: "Exempel AB", orgnr: "556000-0000" }]]);
    const r = await POST(req(KROPP));
    expect(r.status).toBe(200);
    expect(r.headers.get("content-type")).toBe("application/pdf");
    expect(r.headers.get("cache-control")).toBe("no-store");
    const pdf = Buffer.from(await r.arrayBuffer());
    expect(pdf.subarray(0, 5).toString()).toBe("%PDF-");
    expect(fragadeFloden).toEqual([["flode-w"]]);
    expect(loggar).toEqual([]);
  });

  it("en obetald order eller en fakturaorder utan skickat kvitto: 409 utan PDF", async () => {
    ordern = { ...webborder(), paymentStatus: "NOT_PAID" };
    expect((await POST(req(KROPP))).status).toBe(409);
    ordern = { ...webborder(), channelInfo: { type: "BACKOFFICE_MERCHANT" } };
    const r = await POST(req(KROPP));
    expect(r.status).toBe(409);
    expect(await r.json()).toEqual({ ok: false, skal: "inget-kvitto" });
    // En handlagd order slår aldrig upp ett prisbeslut.
    expect(fragadeFloden).toEqual([]);
  });
});
