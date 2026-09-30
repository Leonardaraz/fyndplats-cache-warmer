// Provrutten: CRON_SECRET-skyddad, inget läge har en default, och kroppen
// valideras innan något anrop görs mot butiken eller Resend.

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const anrop: { lage: string; id: string; varianter?: string[] }[] = [];
vi.mock("@/lib/restock/prov", async (importOriginal) => {
  const riktig = await importOriginal<typeof import("@/lib/restock/prov")>();
  return {
    ...riktig,
    provaSidan: async (id: string) => {
      anrop.push({ lage: "sidan", id });
      return { http: 200, svar: { ok: true, lage: "sidan", wixProductId: id } };
    },
    provaMejl: async (id: string, varianter?: string[]) => {
      anrop.push({ lage: "mejl", id, varianter });
      if (id.startsWith("00000000")) throw new Error("oväntat fel för kund@example.com");
      return { http: 200, svar: { ok: true, lage: "mejl", wixProductId: id } };
    },
  };
});

let extension = false;
vi.mock("@/lib/auth", () => ({ isAuthorized: () => extension }));

import { POST } from "./route";

const ID = "3f2c1a4e-9b7d-4c21-8e5f-0a1b2c3d4e5f";
const VARIANT = "7a6b5c4d-3e2f-4a1b-9c8d-7e6f5a4b3c2d";
const forut = process.env.CRON_SECRET;

function req(kropp: unknown, auth = "Bearer hemlig") {
  return {
    json: async () => kropp,
    headers: new Headers(auth ? { authorization: auth } : {}),
  } as unknown as Parameters<typeof POST>[0];
}

beforeEach(() => {
  anrop.length = 0;
  extension = false;
  process.env.CRON_SECRET = "hemlig";
});
afterEach(() => {
  if (forut === undefined) delete process.env.CRON_SECRET;
  else process.env.CRON_SECRET = forut;
});

describe("POST /api/admin/restock-prov", () => {
  it("kräver CRON_SECRET", async () => {
    expect((await POST(req({ lage: "sidan", wixProductId: ID }, "Bearer fel"))).status).toBe(401);
    expect((await POST(req({ lage: "sidan", wixProductId: ID }, ""))).status).toBe(401);
    expect(anrop).toEqual([]);
  });

  it("läget sidan", async () => {
    const res = await POST(req({ lage: "sidan", wixProductId: ID }));
    expect(res.status).toBe(200);
    expect(anrop).toEqual([{ lage: "sidan", id: ID }]);
  });

  it("läget mejl, med och utan varianter", async () => {
    await POST(req({ lage: "mejl", wixProductId: ID }));
    await POST(req({ lage: "mejl", wixProductId: ID, varianter: [` ${VARIANT} `] }));
    await POST(req({ lage: "mejl", wixProductId: ID, varianter: [] }));
    expect(anrop).toEqual([
      { lage: "mejl", id: ID, varianter: undefined },
      { lage: "mejl", id: ID, varianter: [VARIANT] },
      { lage: "mejl", id: ID, varianter: undefined },
    ]);
  });

  it("☠️ inget läge har en default — ett utelämnat läge blir aldrig ett mejl", async () => {
    for (const lage of [undefined, "", "MEJL", "allt"]) {
      expect((await POST(req({ lage, wixProductId: ID }))).status).toBe(400);
    }
    expect(anrop).toEqual([]);
  });

  it("bara Wix-id tas emot", async () => {
    for (const wixProductId of [undefined, "", "abc", `${ID}x`, 42]) {
      expect((await POST(req({ lage: "sidan", wixProductId }))).status).toBe(400);
    }
    expect(anrop).toEqual([]);
  });

  it("varianter gäller bara mejl och måste vara Wix-id", async () => {
    expect((await POST(req({ lage: "sidan", wixProductId: ID, varianter: [VARIANT] }))).status).toBe(400);
    expect((await POST(req({ lage: "mejl", wixProductId: ID, varianter: "Vit" }))).status).toBe(400);
    expect((await POST(req({ lage: "mejl", wixProductId: ID, varianter: ["Vit"] }))).status).toBe(400);
    expect((await POST(req({ lage: "mejl", wixProductId: ID, varianter: Array(21).fill(VARIANT) }))).status).toBe(400);
    expect(anrop).toEqual([]);
  });

  it("☠️ ett oväntat fel bär ingen adress — svaret går till en publik logg", async () => {
    const res = await POST(req({ lage: "mejl", wixProductId: "00000000-0000-4000-8000-000000000000" }));
    expect(res.status).toBe(500);
    const kropp = await res.json();
    expect(kropp.ok).toBe(false);
    expect(JSON.stringify(kropp)).not.toContain("@");
  });
});
