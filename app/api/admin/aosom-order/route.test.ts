// Auth-grinden på bulkorder-rutten.
//
// ☠️ VARFÖR DET HÄR TESTET FINNS. Rutten gatades av `isAuthorized` ensamt,
// alltså EXTENSION_API_TOKEN i x-fyndplats-token. Workflowen `aosom-order.yml`
// skickar `Authorization: Bearer $CRON_SECRET` som varenda annan
// workflow-vänd admin-rutt i huset (prislas, mapping, aosom-remap). De två
// kördes aldrig ihop, så rutten svarade 401 "Otillåten" varje gång och
// workflowen har aldrig kunnat lägga en enda Aosom-order.
//
// Det är samma klass som en grind som inte kan fälla: den fanns, den var
// dokumenterad, och den kunde inte göra sitt jobb. Skälet den byggdes för —
// att CRON_SECRET är märkt Sensitive i Vercel och inte går att läsa tillbaka
// ens för ägaren — gällde alltså oförändrat hela tiden.

import { beforeEach, describe, expect, it, vi } from "vitest";
import { MemoryStore } from "@/lib/store/memory";

let store: MemoryStore;
vi.mock("@/lib/store/factory", () => ({ getStore: () => store }));

// Tillägget presenterar sig ALDRIG i de här testerna — vi mäter uteslutande
// CRON_SECRET-vägen, som är den workflowen faktiskt går.
vi.mock("@/lib/auth", () => ({ isAuthorized: () => false }));

import { GET } from "./route";

function req(headers: Record<string, string>) {
  return {
    headers: new Headers(headers),
    nextUrl: { searchParams: new URLSearchParams() },
  } as unknown as Parameters<typeof GET>[0];
}

beforeEach(() => {
  store = new MemoryStore();
  process.env.CRON_SECRET = "hemlig";
});

describe("aosom-order auth", () => {
  it("släpper in en workflow som bär Bearer CRON_SECRET", async () => {
    const res = await GET(req({ authorization: "Bearer hemlig" }));
    expect(res.status).toBe(200);
    expect(await res.json()).toMatchObject({ ok: true });
  });

  it("avvisar fel hemlighet", async () => {
    const res = await GET(req({ authorization: "Bearer fel" }));
    expect(res.status).toBe(401);
  });

  it("avvisar ett anrop utan någon header alls", async () => {
    const res = await GET(req({}));
    expect(res.status).toBe(401);
  });

  it("avvisar allt när CRON_SECRET saknas i miljön — aldrig fail-open", async () => {
    delete process.env.CRON_SECRET;
    const res = await GET(req({ authorization: "Bearer hemlig" }));
    expect(res.status).toBe(401);
  });
});
