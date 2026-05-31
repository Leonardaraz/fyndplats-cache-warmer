import { describe, expect, it } from "vitest";
import {
  isValidEmail,
  normalizeEmail,
  subscriberId,
  countByProduct,
  type RestockSubscriber,
} from "./store";

describe("isValidEmail", () => {
  it("godkänner normala adresser", () => {
    expect(isValidEmail("kund@example.com")).toBe(true);
    expect(isValidEmail("a.b+tag@sub.fyndplats.se")).toBe(true);
  });
  it("avvisar skräp", () => {
    expect(isValidEmail("")).toBe(false);
    expect(isValidEmail("ingen-snabel-a")).toBe(false);
    expect(isValidEmail("a@b")).toBe(false);
    expect(isValidEmail("a@@b.com")).toBe(false);
    expect(isValidEmail("a b@c.com")).toBe(false);
  });
});

describe("subscriberId", () => {
  it("är stabilt och case-/whitespace-okänsligt på e-posten", () => {
    expect(subscriberId("p1", "Kund@Example.com")).toBe(subscriberId("p1", "  kund@example.com "));
  });
  it("skiljer på produkt", () => {
    expect(subscriberId("p1", "k@e.com")).not.toBe(subscriberId("p2", "k@e.com"));
  });
});

describe("normalizeEmail", () => {
  it("trimmar och gör gemener", () => {
    expect(normalizeEmail("  Foo@Bar.COM ")).toBe("foo@bar.com");
  });
});

describe("countByProduct", () => {
  const subs: RestockSubscriber[] = [
    { id: "p1:a", productId: "p1", email: "a@e.com", subscribedAt: "2026-05-01", notifiedAt: null },
    { id: "p1:b", productId: "p1", email: "b@e.com", subscribedAt: "2026-05-10", notifiedAt: "2026-05-12" },
    { id: "p2:c", productId: "p2", email: "c@e.com", subscribedAt: "2026-05-03", notifiedAt: null },
  ];

  it("aggregerar pending/notified/total per produkt", () => {
    const counts = countByProduct(subs);
    const p1 = counts.find((c) => c.productId === "p1")!;
    expect(p1.pending).toBe(1);
    expect(p1.notified).toBe(1);
    expect(p1.total).toBe(2);
    expect(p1.latestSubscribedAt).toBe("2026-05-10");
  });

  it("sorterar med flest pending först", () => {
    const counts = countByProduct(subs);
    expect(counts[0].productId).toBe("p1"); // 1 pending vs p2 1 pending → tie-break total
  });
});
