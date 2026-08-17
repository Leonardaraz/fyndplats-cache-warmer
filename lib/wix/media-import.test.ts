import { describe, expect, it, beforeEach, afterEach } from "vitest";
import { isExternalSupplierImage, ownImageUrlForReview } from "./media-import";

const EGEN = "https://static.wixstatic.com/media/abc~mv2.jpg";
const LEVERANTOR = "https://ae-pic-a1.aliexpress-media.com/kf/A123.jpg";

function svar(body: unknown, status = 200): Response {
  return { ok: status >= 200 && status < 300, status, json: async () => body } as Response;
}

describe("isExternalSupplierImage", () => {
  it("känner igen leverantörens värdar", () => {
    expect(isExternalSupplierImage(LEVERANTOR)).toBe(true);
    expect(isExternalSupplierImage("https://img.alicdn.com/x.jpg")).toBe(true);
  });

  it("släpper igenom våra egna och tomma", () => {
    expect(isExternalSupplierImage(EGEN)).toBe(false);
    expect(isExternalSupplierImage(undefined)).toBe(false);
  });
});

describe("ownImageUrlForReview", () => {
  const gamla = { ...process.env };
  beforeEach(() => {
    process.env.WIX_API_TOKEN = "test-token";
  });
  afterEach(() => {
    process.env = { ...gamla };
  });

  it("byter leverantörsadress mot vår egen", async () => {
    const f = async () => svar({ file: { url: EGEN } });
    expect(await ownImageUrlForReview(LEVERANTOR, "42", f as unknown as typeof fetch)).toBe(EGEN);
  });

  it("rör inte en adress som redan är vår", async () => {
    const f = async () => {
      throw new Error("skulle inte anropas");
    };
    expect(await ownImageUrlForReview(EGEN, "42", f as unknown as typeof fetch)).toBe(EGEN);
  });

  // Det viktiga fallet: hellre ingen bild än en länk som pekar ut leverantören.
  it("ger ingen bild när importen misslyckas", async () => {
    const f = async () => svar({ error: "nope" }, 500);
    expect(await ownImageUrlForReview(LEVERANTOR, "42", f as unknown as typeof fetch)).toBeUndefined();
  });

  it("ger ingen bild när svaret inte är en wixstatic-adress", async () => {
    const f = async () => svar({ file: { url: LEVERANTOR } });
    expect(await ownImageUrlForReview(LEVERANTOR, "42", f as unknown as typeof fetch)).toBeUndefined();
  });

  it("kastar inte när nätet fallerar", async () => {
    const f = async () => {
      throw new Error("ECONNRESET");
    };
    expect(await ownImageUrlForReview(LEVERANTOR, "42", f as unknown as typeof fetch)).toBeUndefined();
  });

  it("utan bild blir det ingen bild", async () => {
    const f = async () => svar({ file: { url: EGEN } });
    expect(await ownImageUrlForReview(undefined, "42", f as unknown as typeof fetch)).toBeUndefined();
  });
});
