// Kundomdömenas ingång.
//
// Det som testas är inte att en upsert anropas — det är de fyra riktningar där
// ett fel når kunden eller produktsidan:
//
//   1. En osatt hemlighet gör rutten AVSTÄNGD, aldrig öppen.
//   2. Status kan inte sättas utifrån — annars går texten förbi modereringen.
//   3. Ursprunget kan inte sättas utifrån — etiketten och UCPD-upplysningen
//      hänger på det.
//   4. En fallen skrivning blir ett FEL, aldrig ett tyst 200. Hela ruttens
//      existens är att ett omdöme inte får försvinna utan att någon märker det.

import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

const upsert = vi.fn(async () => {});
vi.mock("@/lib/store/reviews", () => ({ getReviewStore: () => ({ upsert }) }));

import { POST } from "./route";

const HEMLIGHET = "s3kr3t";

function begäran(body: unknown, auth = `Bearer ${HEMLIGHET}`): NextRequest {
  return new NextRequest("https://motor.test/api/reviews/customer", {
    method: "POST",
    headers: { "content-type": "application/json", ...(auth ? { authorization: auth } : {}) },
    body: JSON.stringify(body),
  });
}

const GILTIG = {
  productId: "p-1",
  reviewIdAE: "order-9__p-1",
  rating: 5,
  textSwedish: "Precis som beskrivet, snabb leverans.",
  initials: "L.A.",
  orderId: "order-9",
};

beforeEach(() => {
  upsert.mockClear();
  process.env.REVIEW_INGEST_SECRET = HEMLIGHET;
});

describe("☠️ hemligheten är förtroendegränsen", () => {
  it("osatt hemlighet stänger AV rutten (503), öppnar den inte", async () => {
    // En öppen skriv-endpoint mot recensionerna hade låtit vem som helst lägga
    // text på vilken produktsida som helst.
    delete process.env.REVIEW_INGEST_SECRET;
    const res = await POST(begäran(GILTIG));
    expect(res.status).toBe(503);
    expect(upsert).not.toHaveBeenCalled();
  });

  it("fel hemlighet ger 401 och skriver ingenting", async () => {
    const res = await POST(begäran(GILTIG, "Bearer fel"));
    expect(res.status).toBe(401);
    expect(upsert).not.toHaveBeenCalled();
  });

  it("ingen hemlighet alls i anropet ger 401", async () => {
    const res = await POST(begäran(GILTIG, ""));
    expect(res.status).toBe(401);
  });
});

describe("☠️ status och ursprung TVINGAS, de läses inte ur kroppen", () => {
  it("en anropare kan inte publicera direkt förbi modereringen", async () => {
    await POST(begäran({ ...GILTIG, status: "approved" }));
    expect(upsert.mock.calls[0][0]).toMatchObject({ status: "pending" });
  });

  it("inte heller via 'edited', som dessutom ser granskad ut", async () => {
    await POST(begäran({ ...GILTIG, status: "edited" }));
    expect(upsert.mock.calls[0][0]).toMatchObject({ status: "pending" });
  });

  it("ursprunget är alltid customer — etiketten hänger på det", async () => {
    await POST(begäran({ ...GILTIG, source: "aosom" }));
    expect(upsert.mock.calls[0][0]).toMatchObject({ source: "customer" });
  });
});

describe("id:t är samma komposit butiken redan härleder", () => {
  it("productId__reviewIdAE — så ett omskickat formulär uppdaterar, inte dubblerar", async () => {
    const res = await POST(begäran(GILTIG));
    expect(await res.json()).toMatchObject({ ok: true, id: "p-1__order-9__p-1" });
  });
});

describe("indata som inte går att spara avvisas, den halveras inte", () => {
  it.each([
    ["productId saknas", { ...GILTIG, productId: "" }],
    ["reviewIdAE saknas", { ...GILTIG, reviewIdAE: "" }],
    ["tom text", { ...GILTIG, textSwedish: "   " }],
    ["betyg utanför skalan", { ...GILTIG, rating: 9 }],
    ["betyg som inte är ett tal", { ...GILTIG, rating: "bra" }],
  ])("%s → 400", async (_namn, body) => {
    const res = await POST(begäran(body));
    expect(res.status).toBe(400);
    expect(upsert).not.toHaveBeenCalled();
  });
});

describe("☠️ en fallen skrivning blir ett fel, aldrig ett tyst 200", () => {
  it("502 när lagret kastar", async () => {
    upsert.mockRejectedValueOnce(new Error("postgres nere"));
    const res = await POST(begäran(GILTIG));
    expect(res.status).toBe(502);
    // Butiken svarar kunden 503 och ber hen försöka igen. Ett omdöme som tyst
    // försvinner är precis felet rutten finns för.
    expect((await res.json()).ok).toBe(false);
  });
});

describe("bilderna bärs vidare i samma form som lagret väntar sig", () => {
  it("en bild ger imageUrl men ingen imageUrls", async () => {
    await POST(begäran({ ...GILTIG, imageUrls: ["https://static.wixstatic.com/media/a.jpg"] }));
    const rad = upsert.mock.calls[0][0];
    expect(rad).toMatchObject({ hasImage: true, imageUrl: "https://static.wixstatic.com/media/a.jpg" });
    expect(rad.imageUrls).toBeUndefined();
  });

  it("flera bilder ger båda fälten", async () => {
    const urls = ["https://static.wixstatic.com/media/a.jpg", "https://static.wixstatic.com/media/b.jpg"];
    await POST(begäran({ ...GILTIG, imageUrls: urls }));
    expect(upsert.mock.calls[0][0]).toMatchObject({ hasImage: true, imageUrls: urls });
  });

  it("inga bilder ger hasImage false", async () => {
    await POST(begäran(GILTIG));
    expect(upsert.mock.calls[0][0]).toMatchObject({ hasImage: false });
  });
});
