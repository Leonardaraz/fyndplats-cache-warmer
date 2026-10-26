import { createSign, generateKeyPairSync } from "node:crypto";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { MemoryStore } from "@/lib/store/memory";

let store: MemoryStore;
vi.mock("@/lib/store/factory", () => ({ getStore: () => store }));

import { POST } from "./route";

const { privateKey, publicKey } = generateKeyPairSync("rsa", { modulusLength: 2048 });
const PEM = publicKey.export({ type: "spki", format: "pem" }).toString();

const b64url = (s: string | Buffer) => Buffer.from(s).toString("base64url");
function signera(payload: Record<string, unknown>, nyckel = privateKey): string {
  const huvud = b64url(JSON.stringify({ alg: "RS256", typ: "JWT" }));
  const kropp = b64url(JSON.stringify(payload));
  const signer = createSign("RSA-SHA256");
  signer.update(`${huvud}.${kropp}`);
  return `${huvud}.${kropp}.${signer.sign(nyckel).toString("base64url")}`;
}

function anrop(postalCode: string, produkt = "wix-aosom") {
  const nu = Math.floor(Date.now() / 1000);
  return signera({
    iss: "wix.com",
    aud: "app-1",
    iat: nu,
    exp: nu + 300,
    data: {
      request: {
        sourceInfo: { source: "CHECKOUT" },
        validationInfo: {
          lineItems: [
            { id: "l1", catalogReference: { catalogItemId: produkt }, productName: { original: "Fåtölj" } },
          ],
          shippingAddress: { address: { country: "SE", postalCode } },
        },
      },
      metadata: {},
    },
  });
}

const post = (body: string) =>
  POST(new Request("http://localhost/api/wix-validering/v1/get-violations", {
    method: "POST",
    headers: { "content-type": "text/plain" },
    body,
  }));

beforeEach(async () => {
  store = new MemoryStore();
  await store.saveMapping({
    wixProductId: "wix-aosom",
    supplier: "aosom",
    supplierProductId: "aosom:TEST-1",
    variants: [],
  });
  await store.saveMapping({ wixProductId: "wix-ae", supplierProductId: "1005000000000001", variants: [] });
  process.env.WIX_WEBHOOK_PUBLIC_KEY = PEM;
  delete process.env.WIX_VALIDERING_PUBLIC_KEY;
  delete process.env.WIX_APP_ID;
});

afterEach(() => {
  delete process.env.WIX_WEBHOOK_PUBLIC_KEY;
  vi.useRealTimers();
  vi.restoreAllMocks();
});

describe("/api/wix-validering/v1/get-violations", () => {
  it("stoppar en Aosom-vara till ett spärrat postnummer", async () => {
    const res = await post(anrop("621 52"));
    expect(res.status).toBe(200);
    const svar = await res.json();
    expect(svar.violations).toHaveLength(1);
    expect(svar.violations[0]).toMatchObject({ severity: "ERROR", target: { other: { name: "OTHER_DEFAULT" } } });
    expect(svar.violations[0].description).toContain("621 52");
  });

  it("släpper igenom samma vara till ett vanligt postnummer och en AE-vara till ett spärrat", async () => {
    expect(await (await post(anrop("11122"))).json()).toEqual({ violations: [] });
    expect(await (await post(anrop("62152", "wix-ae"))).json()).toEqual({ violations: [] });
  });

  it("avvisar ett anrop som inte är signerat med appens nyckel", async () => {
    const annan = generateKeyPairSync("rsa", { modulusLength: 2048 }).privateKey;
    const nu = Math.floor(Date.now() / 1000);
    const res = await post(signera({ iss: "wix.com", iat: nu, exp: nu + 300, data: {} }, annan));
    expect(res.status).toBe(401);
  });

  it("avvisar fel mottagare när WIX_APP_ID är satt", async () => {
    process.env.WIX_APP_ID = "app-2";
    expect((await post(anrop("62152"))).status).toBe(401);
  });

  it("provar WIX_VALIDERING_PUBLIC_KEY när webhookens nyckel inte passar", async () => {
    process.env.WIX_WEBHOOK_PUBLIC_KEY = "fel nyckel";
    process.env.WIX_VALIDERING_PUBLIC_KEY = PEM;
    expect((await post(anrop("62152"))).status).toBe(200);
  });

  it("tar emot ett värde med flera nycklar och inklistrade \\n", async () => {
    const annan = generateKeyPairSync("rsa", { modulusLength: 2048 }).publicKey
      .export({ type: "spki", format: "pem" }).toString();
    process.env.WIX_WEBHOOK_PUBLIC_KEY = (annan + PEM).replace(/\n/g, "\\n");
    expect((await post(anrop("62152"))).status).toBe(200);
  });

  it("släpper igenom köpet när mappningen inte går att läsa", async () => {
    vi.spyOn(store, "getMappingByWixProductId").mockRejectedValue(new Error("databasen svarar inte"));
    vi.spyOn(console, "error").mockImplementation(() => {});
    const res = await post(anrop("62152"));
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ violations: [] });
  });

  it("släpper igenom köpet när kontrollen tar för lång tid", async () => {
    vi.useFakeTimers({ toFake: ["setTimeout", "clearTimeout"] });
    vi.spyOn(store, "getMappingByWixProductId").mockReturnValue(new Promise(() => {}));
    vi.spyOn(console, "error").mockImplementation(() => {});
    const svar = post(anrop("62152"));
    await vi.advanceTimersByTimeAsync(3000);
    expect(await (await svar).json()).toEqual({ violations: [] });
  });
});
