import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  validateCustomerReview,
  initialsFromName,
  customerReviewId,
  buildCustomerReviewRow,
  TEXT_MIN,
  TEXT_MAX,
} from "./customer-review.ts";

const OK_TEXT = "Väldigt nöjd med kvaliteten, monteringen tog tjugo minuter.";

describe("validateCustomerReview", () => {
  it("släpper igenom ett rimligt omdöme", () => {
    const r = validateCustomerReview({ rating: 4, text: OK_TEXT, name: "Alice Andersson" });
    assert.equal(r.ok, true);
    if (r.ok) {
      assert.equal(r.value.rating, 4);
      assert.equal(r.value.name, "Alice Andersson");
    }
  });

  it("kräver ett betyg", () => {
    assert.deepEqual(validateCustomerReview({ rating: "", text: OK_TEXT }), { ok: false, error: "rating_saknas" });
  });

  it("avvisar betyg utanför 1–5 och decimaler", () => {
    for (const r of [0, 6, -1, 3.5, "abc"]) {
      const v = validateCustomerReview({ rating: r, text: OK_TEXT });
      assert.equal(v.ok, false);
    }
  });

  it("kräver en text som säger något", () => {
    assert.deepEqual(validateCustomerReview({ rating: 5, text: "Bra" }), { ok: false, error: "text_for_kort" });
    assert.deepEqual(validateCustomerReview({ rating: 5, text: "   ".repeat(20) }), { ok: false, error: "text_for_kort" });
  });

  it("sätter tak på längden", () => {
    assert.deepEqual(
      validateCustomerReview({ rating: 5, text: "a".repeat(TEXT_MAX + 1) }),
      { ok: false, error: "text_for_lang" },
    );
    assert.equal(validateCustomerReview({ rating: 5, text: "a".repeat(TEXT_MIN) }).ok, true);
  });

  it("sätter tak på namnet", () => {
    assert.deepEqual(
      validateCustomerReview({ rating: 5, text: OK_TEXT, name: "n".repeat(61) }),
      { ok: false, error: "namn_for_langt" },
    );
  });
});

// Integritet: hela namnet får aldrig visas, precis som för de importerade.
describe("initialsFromName", () => {
  it("gör initialer av för- och efternamn", () => {
    assert.equal(initialsFromName("Alice Andersson"), "A.A.");
    assert.equal(initialsFromName("  erik  von  sydow "), "E.S.");
  });

  it("ett namn ger en initial", () => {
    assert.equal(initialsFromName("Alice"), "A.");
  });

  it("utan namn blir det Verifierad köpare", () => {
    assert.equal(initialsFromName(""), "Verifierad köpare");
    assert.equal(initialsFromName("   "), "Verifierad köpare");
    assert.equal(initialsFromName("123"), "Verifierad köpare");
  });
});

describe("buildCustomerReviewRow", () => {
  const now = new Date("2026-08-17T10:00:00.000Z");

  it("bygger en pending-rad märkt som förstahandsdata", () => {
    const rad = buildCustomerReviewRow({
      orderId: "o1", orderNumber: "10042", productId: "p1",
      review: { rating: 5, text: OK_TEXT, name: "Alice Andersson" }, now,
    });
    assert.equal(rad.status, "pending");
    assert.equal(rad.source, "customer");
    assert.equal(rad.initials, "A.A.");
    assert.equal(rad.orderNumber, "10042");
    // Kundens text är redan svensk — inget väntar på översättning.
    assert.equal(rad.textSwedish, OK_TEXT);
    assert.equal(rad.textOriginal, OK_TEXT);
  });

  it("samma order och produkt ger samma id — inga dubbletter vid dubbelklick", () => {
    const a = customerReviewId("o1", "p1");
    const b = customerReviewId("o1", "p1");
    assert.equal(a, b);
    assert.notEqual(a, customerReviewId("o1", "p2"));
    assert.notEqual(a, customerReviewId("o2", "p1"));
  });

  it("id:t följer samma form som de importerade raderna", () => {
    const rad = buildCustomerReviewRow({
      orderId: "o1", productId: "p1", review: { rating: 5, text: OK_TEXT, name: "" }, now,
    });
    assert.equal(rad._id, `p1__${rad.reviewIdAE}`);
  });
});
