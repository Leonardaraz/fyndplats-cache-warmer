import { afterEach, describe, expect, it, vi } from "vitest";
import { uppdateraProduktsidor } from "./produktsidor";

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

const A = "e0b154ec-0779-4cb3-8149-84f0996fbacf";
const B = "a23ea344-b9b0-4052-a28b-3d8b0c1d2e3f";

describe("uppdateraProduktsidor", () => {
  it("utan nyckel görs inget anrop, och det sägs", async () => {
    delete process.env.ADMIN_SECRET;
    const { f, anrop } = fejkFetch(() => new Response("{}"));
    expect(await uppdateraProduktsidor([{ id: A }], "auktion", f)).toEqual({ utfall: "ingen_nyckel" });
    expect(anrop).toHaveLength(0);
  });

  it("inga produkter → inget anrop", async () => {
    process.env.ADMIN_SECRET = "hemlig";
    const { f, anrop } = fejkFetch(() => new Response("{}"));
    expect(await uppdateraProduktsidor([], "auktion", f)).toEqual({ utfall: "tom" });
    expect(anrop).toHaveLength(0);
  });

  it("☠️ nyckeln går som kaka och Bearer, aldrig i adressen; kroppen bär id, slug och orsak, utan dubbletter", async () => {
    process.env.ADMIN_SECRET = "hemlig";
    delete process.env.HEADLESS_BASE_URL;
    const { f, anrop } = fejkFetch(() => new Response(JSON.stringify({ ok: true, produkter: 2 }), { status: 200 }));
    const svar = await uppdateraProduktsidor(
      [{ id: A, slug: "gungstol-beige" }, { id: B }, { id: A, slug: "gungstol-beige" }, { id: "" }],
      "auktion",
      f,
    );
    expect(svar).toEqual({ utfall: "uppdaterad", status: 200, produkter: 2 });
    expect(anrop).toHaveLength(1);
    const [a] = anrop;
    expect(a.url).toBe("https://www.fyndplats.se/api/admin/uppdatera-produkter");
    expect(a.url).not.toContain("hemlig");
    expect(a.init.method).toBe("POST");
    expect((a.init.headers as Record<string, string>).cookie).toBe("fp_admin=hemlig");
    expect((a.init.headers as Record<string, string>).authorization).toBe("Bearer hemlig");
    expect(a.init.redirect).toBe("manual");
    expect(JSON.parse(String(a.init.body))).toEqual({
      produkter: [{ id: A, slug: "gungstol-beige" }, { id: B }],
      orsak: "auktion",
    });
  });

  it("butikens adress följer HEADLESS_BASE_URL", async () => {
    process.env.ADMIN_SECRET = "hemlig";
    process.env.HEADLESS_BASE_URL = "https://preview.example.com/";
    const { f, anrop } = fejkFetch(() => new Response("{}", { status: 200 }));
    await uppdateraProduktsidor([{ id: A }], "auktion", f);
    expect(anrop[0].url).toBe("https://preview.example.com/api/admin/uppdatera-produkter");
  });

  it("ett nej eller ett nätfel kastar aldrig — auktionen ska stega ändå", async () => {
    process.env.ADMIN_SECRET = "hemlig";
    const nej = fejkFetch(() => new Response("nej", { status: 401 }));
    expect(await uppdateraProduktsidor([{ id: A }], "auktion", nej.f)).toEqual({ utfall: "misslyckades", status: 401 });
    const trasig = fejkFetch(() => {
      throw new Error("ECONNRESET");
    });
    expect(await uppdateraProduktsidor([{ id: A }], "auktion", trasig.f)).toEqual({ utfall: "misslyckades" });
  });
});
