import { createSign, generateKeyPairSync, type KeyObject } from "node:crypto";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { MemoryStore } from "@/lib/store/memory";
import { FYNDPLATS_KASSA_APP_ID } from "@/lib/wix/fyndplats-kassa";

let store: MemoryStore;
vi.mock("@/lib/store/factory", () => ({ getStore: () => store }));

import { POST } from "./route";

// Wix privata nyckel finns inte här, så testerna signerar med ett eget nyckelpar
// och lägger den publika halvan i WIX_VALIDERING_PUBLIC_KEY, som rutten provar
// efter Fyndplats kassas nyckel i koden.
const { privateKey, publicKey } = generateKeyPairSync("rsa", { modulusLength: 2048 });
const PEM = publicKey.export({ type: "spki", format: "pem" }).toString();

const b64url = (s: string | Buffer) => Buffer.from(s).toString("base64url");
function signera(payload: Record<string, unknown>, nyckel: KeyObject = privateKey): string {
  const huvud = b64url(JSON.stringify({ alg: "RS256", typ: "JWT" }));
  const kropp = b64url(JSON.stringify(payload));
  const signer = createSign("RSA-SHA256");
  signer.update(`${huvud}.${kropp}`);
  return `${huvud}.${kropp}.${signer.sign(nyckel).toString("base64url")}`;
}

function anrop(
  postalCode: string,
  { produkt = "wix-aosom", nyckel = privateKey, aud = FYNDPLATS_KASSA_APP_ID }: {
    produkt?: string;
    nyckel?: KeyObject;
    aud?: string;
  } = {},
) {
  const nu = Math.floor(Date.now() / 1000);
  return signera(
    {
      iss: "wix.com",
      aud,
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
    },
    nyckel,
  );
}

const post = (body: string) =>
  POST(new Request("http://localhost/api/wix-validering/v1/get-violations", {
    method: "POST",
    headers: { "content-type": "text/plain" },
    body,
  }));

/** Rutten svarar alltid 200, så det är svarets överträdelser som visar utfallet. */
async function overtradelser(body: string): Promise<unknown[]> {
  const res = await post(body);
  expect(res.status).toBe(200);
  return (await res.json()).violations;
}

beforeEach(async () => {
  store = new MemoryStore();
  await store.saveMapping({
    wixProductId: "wix-aosom",
    supplier: "aosom",
    supplierProductId: "aosom:TEST-1",
    variants: [],
  });
  await store.saveMapping({ wixProductId: "wix-ae", supplierProductId: "1005000000000001", variants: [] });
  process.env.WIX_VALIDERING_PUBLIC_KEY = PEM;
  delete process.env.WIX_WEBHOOK_PUBLIC_KEY;
});

afterEach(() => {
  delete process.env.WIX_VALIDERING_PUBLIC_KEY;
  delete process.env.WIX_WEBHOOK_PUBLIC_KEY;
  vi.useRealTimers();
  vi.restoreAllMocks();
});

describe("/api/wix-validering/v1/get-violations", () => {
  it("stoppar en Aosom-vara till ett spärrat postnummer", async () => {
    const svar = await overtradelser(anrop("621 52"));
    expect(svar).toHaveLength(1);
    expect(svar[0]).toMatchObject({ severity: "ERROR", target: { other: { name: "OTHER_DEFAULT" } } });
    expect((svar[0] as { description: string }).description).toContain("621 52");
  });

  it("släpper igenom samma vara till ett vanligt postnummer och en AE-vara till ett spärrat", async () => {
    expect(await overtradelser(anrop("11122"))).toEqual([]);
    expect(await overtradelser(anrop("62152", { produkt: "wix-ae" }))).toEqual([]);
  });

  it("agerar inte på ett anrop som inte är signerat med appens nyckel, men svarar 200", async () => {
    const annan = generateKeyPairSync("rsa", { modulusLength: 2048 }).privateKey;
    const las = vi.spyOn(store, "getMappingByWixProductId");
    const fel = vi.spyOn(console, "error").mockImplementation(() => {});
    expect(await overtradelser(anrop("62152", { nyckel: annan }))).toEqual([]);
    expect(las).not.toHaveBeenCalled();
    expect(fel).toHaveBeenCalledWith(expect.stringContaining("ogiltig signatur"));
  });

  it("agerar inte på ett anrop till en annan app", async () => {
    const fel = vi.spyOn(console, "error").mockImplementation(() => {});
    expect(await overtradelser(anrop("62152", { aud: "annan-app" }))).toEqual([]);
    expect(fel).toHaveBeenCalledWith(expect.stringContaining("fel mottagare"));
  });

  it("verifierar bara med Fyndplats kassas nyckel när inget env-värde är satt", async () => {
    delete process.env.WIX_VALIDERING_PUBLIC_KEY;
    const fel = vi.spyOn(console, "error").mockImplementation(() => {});
    expect(await overtradelser(anrop("62152"))).toEqual([]);
    expect(fel).toHaveBeenCalledWith(expect.stringContaining("ogiltig signatur"));
  });

  it("litar inte på orderwebhookens nyckel, som hör till en annan app", async () => {
    delete process.env.WIX_VALIDERING_PUBLIC_KEY;
    process.env.WIX_WEBHOOK_PUBLIC_KEY = PEM;
    const fel = vi.spyOn(console, "error").mockImplementation(() => {});
    expect(await overtradelser(anrop("62152"))).toEqual([]);
    expect(fel).toHaveBeenCalledWith(expect.stringContaining("ogiltig signatur"));
  });

  it("tar emot ett env-värde med flera nycklar och inklistrade \\n", async () => {
    const annan = generateKeyPairSync("rsa", { modulusLength: 2048 }).publicKey
      .export({ type: "spki", format: "pem" }).toString();
    process.env.WIX_VALIDERING_PUBLIC_KEY = (annan + PEM).replace(/\n/g, "\\n");
    expect(await overtradelser(anrop("62152"))).toHaveLength(1);
  });

  it("släpper igenom köpet när mappningen inte går att läsa", async () => {
    vi.spyOn(store, "getMappingByWixProductId").mockRejectedValue(new Error("databasen svarar inte"));
    vi.spyOn(console, "error").mockImplementation(() => {});
    expect(await overtradelser(anrop("62152"))).toEqual([]);
  });

  it("släpper igenom köpet när kontrollen tar för lång tid", async () => {
    vi.useFakeTimers({ toFake: ["setTimeout", "clearTimeout"] });
    vi.spyOn(store, "getMappingByWixProductId").mockReturnValue(new Promise(() => {}));
    vi.spyOn(console, "error").mockImplementation(() => {});
    const svar = post(anrop("62152"));
    await vi.advanceTimersByTimeAsync(3000);
    const res = await svar;
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ violations: [] });
  });
});
