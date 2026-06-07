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

  it("returns null when signature is invalid and a key is configured", () => {
    const token = signJwt({ data: "{}" }).slice(0, -4) + "AAAA";
    expect(parseWebhookBody(token, publicPem)).toBeNull();
  });

  it("parses raw JSON when no public key is configured (dev/test)", () => {
    expect(parseWebhookBody(JSON.stringify({ id: "evt-2" }))).toEqual({ id: "evt-2" });
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

  it("utan konfigurerad hemlighet → bakåtkompatibelt (bara header-koll)", () => {
    expect(isTrustedForward("fyndplats-webhook", null, undefined)).toBe(true);
    expect(isTrustedForward("fyndplats-webhook", "vadsomhelst", undefined)).toBe(true);
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
