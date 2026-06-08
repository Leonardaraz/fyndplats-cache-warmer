import { beforeEach, describe, expect, it } from "vitest";
import { __resetLlmMemoryStore } from "./storage";
import { listVariantTranslations, logVariantTranslation } from "./variant-log";

beforeEach(() => {
  __resetLlmMemoryStore();
  delete process.env.STORE_BACKEND; // default = memory
});

describe("logVariantTranslation / listVariantTranslations", () => {
  it("persisterar ett par och läser tillbaka det", async () => {
    await logVariantTranslation({
      id: "id-glow",
      raw: "Glow",
      sv: "Glöd",
      productTitle: "LED-list 5m",
      provider: "variant-ai",
      at: "2026-06-08T10:00:00.000Z",
    });
    const rows = await listVariantTranslations();
    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject({
      raw: "Glow",
      sv: "Glöd",
      productTitle: "LED-list 5m",
      provider: "variant-ai",
    });
  });

  it("dedupar per id — senaste svenska vinner (en rad per unikt råvärde)", async () => {
    await logVariantTranslation({ id: "same", raw: "Glow", sv: "Glöd", provider: "variant-ai", at: "2026-06-08T10:00:00.000Z" });
    await logVariantTranslation({ id: "same", raw: "Glow", sv: "Sken", provider: "variant-ai", at: "2026-06-08T11:00:00.000Z" });
    const rows = await listVariantTranslations();
    expect(rows).toHaveLength(1);
    expect(rows[0].sv).toBe("Sken");
  });

  it("listar nyast först (JS-sort, oberoende av att memory-backenden inte sorterar)", async () => {
    // Loggas i ÄLDST-först-ordning; listan ska ändå returnera nyast först.
    await logVariantTranslation({ id: "a", raw: "Old", sv: "Gammal", provider: "variant-ai", at: "2026-06-08T10:00:00.000Z" });
    await logVariantTranslation({ id: "b", raw: "New", sv: "Ny", provider: "variant-ai", at: "2026-06-08T12:00:00.000Z" });
    const rows = await listVariantTranslations();
    expect(rows.map((r) => r.raw)).toEqual(["New", "Old"]);
  });

  it("kastar ALDRIG om storage-skrivningen failar (best-effort)", async () => {
    const origBackend = process.env.STORE_BACKEND;
    const origToken = process.env.WIX_API_TOKEN;
    try {
      // Tvinga Wix-vägen utan token → headers() kastar inuti llmSave (ingen
      // nätverkstrafik). logVariantTranslation ska svälja det och resolva.
      process.env.STORE_BACKEND = "wix-data";
      delete process.env.WIX_API_TOKEN;
      await expect(
        logVariantTranslation({ id: "x", raw: "Boom", sv: "Pang", provider: "variant-ai", at: "2026-06-08T10:00:00.000Z" }),
      ).resolves.toBeUndefined();
    } finally {
      if (origBackend === undefined) delete process.env.STORE_BACKEND;
      else process.env.STORE_BACKEND = origBackend;
      if (origToken === undefined) delete process.env.WIX_API_TOKEN;
      else process.env.WIX_API_TOKEN = origToken;
    }
  });
});
