import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { signReviewToken, verifyReviewToken, reviewFormUrl, TOKEN_TTL_DAYS } from "./review-token.ts";

const HEM = "hemlighet-för-test";
const NU = Date.UTC(2026, 7, 17, 12, 0, 0);
const DYGN = 24 * 3600 * 1000;

describe("review-token", () => {
  it("signerar och läser tillbaka order-id", () => {
    const t = signReviewToken("order-123", HEM, NU)!;
    assert.deepEqual(verifyReviewToken(t, HEM, NU), { orderId: "order-123", issuedAtMs: NU });
  });

  // Kärnan i hela funktionen: bara den som fått mejlet ska kunna skriva.
  it("avvisar manipulerad signatur", () => {
    const t = signReviewToken("order-123", HEM, NU)!;
    const [nyttlast] = t.split(".");
    assert.equal(verifyReviewToken(`${nyttlast}.PAHITTAD`, HEM, NU), null);
  });

  it("avvisar token signerad med en annan hemlighet", () => {
    const t = signReviewToken("order-123", "annan-hemlighet", NU)!;
    assert.equal(verifyReviewToken(t, HEM, NU), null);
  });

  it("avvisar utbytt order-id (nyttlasten är signerad, inte bara bifogad)", () => {
    const t = signReviewToken("order-123", HEM, NU)!;
    const sig = t.split(".")[1];
    const fusk = Buffer.from(`order-999.${NU.toString(36)}`, "utf8").toString("base64url");
    assert.equal(verifyReviewToken(`${fusk}.${sig}`, HEM, NU), null);
  });

  it("går ut efter TTL:n", () => {
    const t = signReviewToken("order-123", HEM, NU)!;
    assert.ok(verifyReviewToken(t, HEM, NU + (TOKEN_TTL_DAYS - 1) * DYGN));
    assert.equal(verifyReviewToken(t, HEM, NU + (TOKEN_TTL_DAYS + 1) * DYGN), null);
  });

  it("avvisar token daterad långt fram i tiden", () => {
    const t = signReviewToken("order-123", HEM, NU + 5 * DYGN)!;
    assert.equal(verifyReviewToken(t, HEM, NU), null);
  });

  it("skräp in ger null, inte krasch", () => {
    for (const skräp of ["", "abc", "a.b.c", "!!!.???", undefined]) {
      assert.equal(verifyReviewToken(skräp, HEM, NU), null);
    }
  });

  // Fail-closed: utan hemlighet ska funktionen vara helt avstängd.
  it("utan hemlighet signeras ingenting och inget verifieras", () => {
    assert.equal(signReviewToken("order-123", undefined), null);
    assert.equal(reviewFormUrl("order-123", "https://x.se", undefined), null);
    const t = signReviewToken("order-123", HEM, NU)!;
    assert.equal(verifyReviewToken(t, undefined, NU), null);
  });

  it("bygger länken utan dubbla snedstreck", () => {
    const u = reviewFormUrl("order-123", "https://www.fyndplats.se/", HEM, NU)!;
    assert.ok(u.startsWith("https://www.fyndplats.se/omdome/"));
    assert.ok(!u.includes("//omdome"));
  });
});
