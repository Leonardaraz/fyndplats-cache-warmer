import { afterEach, describe, expect, it, vi } from "vitest";
import { uppfriskaProduktsida } from "./produktsida";

const forut = { ADMIN_SECRET: process.env.ADMIN_SECRET, HEADLESS_BASE_URL: process.env.HEADLESS_BASE_URL };
afterEach(() => {
  for (const [k, v] of Object.entries(forut)) {
    if (v === undefined) delete process.env[k];
    else process.env[k] = v;
  }
});

function fejkFetch(svar: (url: string, init: RequestInit) => Response | Promise<Response>) {
  const anrop: { url: string; init: RequestInit }[] = [];
  const f = vi.fn(async (url: string, init: RequestInit) => {
    anrop.push({ url, init });
    return svar(url, init);
  });
  return { f: f as unknown as typeof fetch, anrop };
}

describe("uppfriskaProduktsida", () => {
  it("utan nyckel görs inget anrop, och det sägs", async () => {
    delete process.env.ADMIN_SECRET;
    const { f, anrop } = fejkFetch(() => new Response("{}"));
    expect(await uppfriskaProduktsida("stol", f)).toBe("ingen_nyckel");
    expect(anrop).toHaveLength(0);
  });

  it("☠️ nyckeln går som kaka — proxyns ?key= kräver en kaka som fetch inte sparar", async () => {
    process.env.ADMIN_SECRET = "hemlig";
    delete process.env.HEADLESS_BASE_URL;
    const { f, anrop } = fejkFetch(() => new Response("{}", { status: 200 }));
    expect(await uppfriskaProduktsida("stol-svart", f)).toBe("uppfriskad");

    const [tomning, varmning] = anrop;
    expect(tomning.init.method).toBe("POST");
    expect(tomning.url).toBe(
      "https://www.fyndplats.se/api/admin/revalidate?token=hemlig&path=%2Fprodukt%2Fstol-svart",
    );
    expect(tomning.url).not.toContain("key=");
    expect((tomning.init.headers as Record<string, string>).cookie).toBe("fp_admin=hemlig");
    expect(tomning.init.redirect).toBe("manual");

    // Sidan byggs om av vårt besök, inte av kundens.
    expect(varmning.init.method).toBe("GET");
    expect(varmning.url).toBe("https://www.fyndplats.se/produkt/stol-svart");
    expect((varmning.init.headers as Record<string, string>).cookie).toBeUndefined();
  });

  it("en tömning som inte går igenom säger det, och sidan värms inte", async () => {
    process.env.ADMIN_SECRET = "hemlig";
    const { f, anrop } = fejkFetch(() => new Response("Not found", { status: 404 }));
    expect(await uppfriskaProduktsida("stol", f)).toBe("misslyckades");
    expect(anrop).toHaveLength(1);
  });

  it("ett nätverksfel kastar inte — mejlet ska gå ändå", async () => {
    process.env.ADMIN_SECRET = "hemlig";
    const { f } = fejkFetch(() => {
      throw new Error("ECONNRESET");
    });
    expect(await uppfriskaProduktsida("stol", f)).toBe("misslyckades");
  });

  it("en värmning som faller ändrar inte utfallet — cachen är ändå tömd", async () => {
    process.env.ADMIN_SECRET = "hemlig";
    const { f } = fejkFetch((url) => {
      if (url.includes("/api/admin/")) return new Response("{}", { status: 200 });
      throw new Error("timeout");
    });
    expect(await uppfriskaProduktsida("stol", f)).toBe("uppfriskad");
  });

  it("butikens adress går att byta i miljön", async () => {
    process.env.ADMIN_SECRET = "hemlig";
    process.env.HEADLESS_BASE_URL = "https://preview.example.com/";
    const { f, anrop } = fejkFetch(() => new Response("{}", { status: 200 }));
    await uppfriskaProduktsida("stol", f);
    expect(anrop[0].url.startsWith("https://preview.example.com/api/admin/revalidate?")).toBe(true);
    expect(anrop[1].url).toBe("https://preview.example.com/produkt/stol");
  });
});
