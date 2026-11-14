import { generateKeyPairSync, createSign } from "node:crypto";
import { describe, expect, it } from "vitest";
import { decodeJwtUnsafe, parseWebhookBody, verifyJwtRs256, isTrustedForward } from "./webhook";

const { privateKey, publicKey } = generateKeyPairSync("rsa", { modulusLength: 2048 });
const publicPem = publicKey.export({ type: "spki", format: "pem" }).toString();

function b64url(input: string | Buffer): string {
  return Buffer.from(input).toString("base64").replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function signJwt(payload: Record<string, unknown>): string {
  const header = b64url(JSON.stringify({ alg: "RS256", typ: "JWT" }));
  const body = b64url(JSON.stringify(payload));
  const signer = createSign("RSA-SHA256");
  signer.update(`${header}.${body}`);
  signer.end();
  const sig = b64url(signer.sign(privateKey));
  return `${header}.${body}.${sig}`;
}

describe("verifyJwtRs256", () => {
  it("verifies a correctly signed token", () => {
    const token = signJwt({ hello: "world" });
    expect(verifyJwtRs256(token, publicPem)).toEqual({ hello: "world" });
  });

  it("rejects a tampered token", () => {
    const token = signJwt({ hello: "world" });
    const tampered = token.slice(0, -4) + "AAAA";
    expect(verifyJwtRs256(tampered, publicPem)).toBeNull();
  });

  it("rejects malformed tokens", () => {
    expect(verifyJwtRs256("not.a.jwt", publicPem)).toBeNull();
    expect(verifyJwtRs256("onlyonepart", publicPem)).toBeNull();
  });
});

describe("parseWebhookBody", () => {
  it("verifies + unwraps a Wix-style JWT with embedded data string", () => {
    const inner = { id: "evt-1", slug: "created" };
    const token = signJwt({ data: JSON.stringify(inner) });
    expect(parseWebhookBody(token, publicPem)).toEqual(inner);
  });

  it("unwraps a DOUBLY-wrapped data envelope down to the canonical envelope", () => {
    // Wix v2 paketerar ibland envelopen som en data-sträng inuti ÄNNU en
    // data-sträng. Den gamla en-hopps-avpackningen lämnade mellanlagret (utan
    // createdEvent) → normalizeOrderEvent null → 422 på varje forwardad order.
    // Lås multi-hoppet: vi måste nå envelopen med de kanoniska claims:en.
    const envelope = {
      id: "evt-dw",
      entityFqdn: "wix.ecom.v1.order",
      slug: "created",
      entityId: "order-dw",
      createdEvent: { entity: { id: "order-dw" } },
    };
    const doublyWrapped = { data: JSON.stringify({ data: JSON.stringify(envelope) }) };
    const token = signJwt(doublyWrapped);
    expect(parseWebhookBody(token, publicPem)).toEqual(envelope);
  });

  it("returns null when signature is invalid and a key is configured", () => {
    const token = signJwt({ data: "{}" }).slice(0, -4) + "AAAA";
    expect(parseWebhookBody(token, publicPem)).toBeNull();
  });

  it("☠️ utan nyckel och utan betrodd forward nekas en osignerad kropp", () => {
    // Förut tolkades kroppen som rå JSON så fort nyckeln saknades: en tappad
    // WIX_WEBHOOK_PUBLIC_KEY gjorde att vem som helst kunde skicka in en order.
    const kropp = JSON.stringify({ id: "evt-2" });
    expect(parseWebhookBody(kropp)).toBeNull();
    expect(parseWebhookBody(kropp, undefined)).toBeNull();
    expect(parseWebhookBody(kropp, "")).toBeNull();
    expect(parseWebhookBody(kropp, undefined, {})).toBeNull();
    expect(parseWebhookBody(kropp, undefined, { trustedForwarded: false, tillatOsignerat: false })).toBeNull();
  });

  it("en osignerad kropp tas emot bara med uttryckligt tillstånd (lokalt och i prov)", () => {
    expect(parseWebhookBody(JSON.stringify({ id: "evt-2" }), undefined, { tillatOsignerat: true })).toEqual({
      id: "evt-2",
    });
    expect(parseWebhookBody("inte json", undefined, { tillatOsignerat: true })).toBeNull();
  });

  it("☠️ tillståndet kringgår aldrig en nyckel som finns: med nyckel krävs signatur", () => {
    const kropp = JSON.stringify({ id: "evt-2" });
    expect(parseWebhookBody(kropp, publicPem, { tillatOsignerat: true })).toBeNull();
    const [h, p, sig] = signJwt({ id: "evt-3" }).split(".");
    const forfalskad = `${h}.${p}.${sig.slice(0, -4)}AAAA`;
    expect(parseWebhookBody(forfalskad, publicPem, { tillatOsignerat: true })).toBeNull();
  });

  it("accepts a forwarded JWT body without verifying the signature", () => {
    // En tampered JWT — signaturen skulle aldrig verifieras under normal flöde,
    // men i fan-out:en från fyndplats-headless har vi redan verifierat upstream
    // och vill kunna avkoda payloaden ändå.
    const inner = { id: "evt-forwarded", slug: "created" };
    const token = signJwt({ data: JSON.stringify(inner) });
    const tampered = token.slice(0, -4) + "AAAA";

    // Utan trustedForwarded: avvisas pga ogiltig signatur
    expect(parseWebhookBody(tampered, publicPem)).toBeNull();

    // Med trustedForwarded: payloaden plockas ut även om signaturen är trasig
    expect(parseWebhookBody(tampered, publicPem, { trustedForwarded: true })).toEqual(inner);
  });

  it("accepts a forwarded raw-JSON body without verifying the signature", () => {
    const body = JSON.stringify({ id: "evt-forwarded-json" });
    expect(parseWebhookBody(body, publicPem, { trustedForwarded: true })).toEqual({
      id: "evt-forwarded-json",
    });
  });

  it("decodeJwtUnsafe extracts payload from a well-formed JWT without verifying", () => {
    const token = signJwt({ hello: "from-headless" });
    expect(decodeJwtUnsafe(token)).toEqual({ hello: "from-headless" });
    // För få delar → null
    expect(decodeJwtUnsafe("only.two")).toBeNull();
    // 3 delar men payload-delen är inte giltig JSON → null
    expect(decodeJwtUnsafe("not.a.jwt")).toBeNull();
  });
});

describe("isTrustedForward", () => {
  it("kräver rätt X-Forwarded-From", () => {
    expect(isTrustedForward("nån-annan", null, undefined)).toBe(false);
    expect(isTrustedForward(null, null, undefined)).toBe(false);
  });

  it("☠️ utan konfigurerad hemlighet litas forwarden INTE på", () => {
    // Förut räckte rubriken, som vem som helst kan skriva, för att slippa
    // signaturkollen. En tappad WEBHOOK_FORWARD_SECRET öppnade orderflödet.
    expect(isTrustedForward("fyndplats-webhook", null, undefined)).toBe(false);
    expect(isTrustedForward("fyndplats-webhook", "vadsomhelst", undefined)).toBe(false);
    expect(isTrustedForward("fyndplats-webhook", "", "")).toBe(false);
    expect(isTrustedForward("fyndplats-webhook", null, undefined, false)).toBe(false);
  });

  it("öppet läge (lokalt och i prov): utan hemlighet räcker rubriken, som förut", () => {
    expect(isTrustedForward("fyndplats-webhook", null, undefined, true)).toBe(true);
    expect(isTrustedForward("fyndplats-webhook", "vadsomhelst", undefined, true)).toBe(true);
    // Rubriken krävs fortfarande.
    expect(isTrustedForward("nån-annan", null, undefined, true)).toBe(false);
    expect(isTrustedForward(null, null, undefined, true)).toBe(false);
  });

  it("öppet läge försvagar aldrig en hemlighet som ÄR satt", () => {
    expect(isTrustedForward("fyndplats-webhook", "fel", "rätt-hemlis", true)).toBe(false);
    expect(isTrustedForward("fyndplats-webhook", null, "rätt-hemlis", true)).toBe(false);
    expect(isTrustedForward("fyndplats-webhook", "rätt-hemlis", "rätt-hemlis", true)).toBe(true);
  });

  it("med hemlighet satt → kräver matchande X-Forward-Secret", () => {
    expect(isTrustedForward("fyndplats-webhook", "rätt-hemlis", "rätt-hemlis")).toBe(true);
    expect(isTrustedForward("fyndplats-webhook", "fel", "rätt-hemlis")).toBe(false);
    expect(isTrustedForward("fyndplats-webhook", null, "rätt-hemlis")).toBe(false);
    // Rätt from men ingen hemlighet medskickad (forwarder ej uppdaterad) → ej betrodd
    // → faller tillbaka på JWT-verifiering i routen (bryter inte order om nyckel finns).
    expect(isTrustedForward("fyndplats-webhook", "", "rätt-hemlis")).toBe(false);
  });
});
