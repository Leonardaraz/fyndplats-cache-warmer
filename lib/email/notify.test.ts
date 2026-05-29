import { describe, expect, it } from "vitest";
import { buildCustomerEmail, buildOwnerEmail, reportLink, type OrderInfo } from "./notify";

const order: OrderInfo = {
  email: "kund@butik.se",
  plan: "audit",
  amountSek: 1495,
  scannedUrl: "https://butik.se",
  baseUrl: "https://fyndplats.com",
};

describe("reportLink", () => {
  it("builds an encoded report link when url + base are known", () => {
    expect(reportLink(order)).toBe(
      "https://fyndplats.com/grade/rapport?url=https%3A%2F%2Fbutik.se",
    );
  });
  it("returns null without a scanned url", () => {
    expect(reportLink({ ...order, scannedUrl: undefined })).toBeNull();
  });
});

describe("buildCustomerEmail", () => {
  it("addresses the customer and includes the report link", () => {
    const m = buildCustomerEmail(order);
    expect(m.to).toBe("kund@butik.se");
    expect(m.subject).toMatch(/Tack/i);
    expect(m.html).toContain("/grade/rapport?url=");
  });
  it("works without a report link", () => {
    const m = buildCustomerEmail({ ...order, scannedUrl: undefined });
    expect(m.html).not.toContain("/grade/rapport");
    expect(m.html).toMatch(/åtgärdsplan/i);
  });
});

describe("buildOwnerEmail", () => {
  it("summarizes the sale to the owner", () => {
    const m = buildOwnerEmail(order, "info@fyndplats.com");
    expect(m.to).toBe("info@fyndplats.com");
    expect(m.subject).toContain("1495 kr");
    expect(m.html).toContain("kund@butik.se");
    expect(m.html).toContain("https://butik.se");
  });
});
