import { describe, it, expect, vi } from "vitest";
import { fyllGpsr, type FyllDeps } from "./fyll";
import { kallHash, kallText, type GpsrPost } from "./aosom";
import type { AosomRow } from "../aosom/feed";
import type { ProductMappingRecord } from "../store";

function rad(sku: string, over: Partial<AosomRow> = {}): AosomRow {
  return {
    sku, name: `Produkt ${sku}`, url: `https://www.aosom.de/item/homcom-produkt-${sku}`,
    imageUrls: [], category: "Möbel", color: "", material: "", size: "", packageSize: "",
    weightKg: null, descriptionHtml: "<p>Belastbarkeit: 100 kg.</p>", bulletsHtml: "",
    qty: 5, normalPriceEur: null, wholesaleEur: null, seFreightEur: null, rowIndex: 1,
    ...over,
  };
}

function mappning(wixProductId: string, sku: string, over: Partial<ProductMappingRecord> = {}) {
  return { wixProductId, supplier: "aosom", supplierProductId: `aosom:${sku}`, ...over } as ProductMappingRecord;
}

function hashFor(r: AosomRow) {
  return kallHash(kallText({ namn: r.name, beskrivningHtml: r.descriptionHtml, punkterHtml: r.bulletsHtml, kategori: r.category }));
}

function deps(over: Partial<FyllDeps> = {}): FyllDeps {
  return {
    listaMappningar: async () => [],
    hamtaFeed: async () => [rad("X")],
    listaPoster: async () => [],
    spara: vi.fn(async () => {}),
    utvinn: vi.fn(async () => ["Maxbelastning: 100 kg."]),
    nu: () => Date.parse("2026-09-27T12:00:00Z"),
    ...over,
  };
}

describe("fyllGpsr", () => {
  it("utvinner och sparar en post per Aosom-produkt, med märket ur adressen", async () => {
    const d = deps({
      listaMappningar: async () => [mappning("w1", "A"), { wixProductId: "w2", supplierProductId: "100500" } as ProductMappingRecord],
      hamtaFeed: async () => [rad("A")],
    });
    const s = await fyllGpsr(d, { dryRun: false });
    expect(s.aosomProdukter).toBe(1); // AliExpress-raden räknas inte
    expect(s.sparade).toBe(1);
    expect(d.spara).toHaveBeenCalledWith(expect.objectContaining({
      wixProductId: "w1", sku: "A", marke: "HOMCOM", sakerhet: ["Maxbelastning: 100 kg."],
    }));
  });

  it("rör inte en produkt vars källa och märke är oförändrade", async () => {
    const r = rad("A");
    const gammal: GpsrPost = { wixProductId: "w1", sku: "A", marke: "HOMCOM", sakerhet: [], kallHash: hashFor(r), at: "x" };
    const d = deps({ listaMappningar: async () => [mappning("w1", "A")], hamtaFeed: async () => [r], listaPoster: async () => [gammal] });
    const s = await fyllGpsr(d, { dryRun: false });
    expect(s.oforandrade).toBe(1);
    expect(d.utvinn).not.toHaveBeenCalled();
  });

  it("gör om posten när Aosom skrivit om texten", async () => {
    const gammal: GpsrPost = { wixProductId: "w1", sku: "A", marke: "HOMCOM", sakerhet: [], kallHash: "gammal", at: "x" };
    const d = deps({ listaMappningar: async () => [mappning("w1", "A")], hamtaFeed: async () => [rad("A")], listaPoster: async () => [gammal] });
    const s = await fyllGpsr(d, { dryRun: false });
    expect(s.sparade).toBe(1);
  });

  it("sparar ingenting när modellen inte svarar, så att produkten försöks igen", async () => {
    const d = deps({ listaMappningar: async () => [mappning("w1", "A")], hamtaFeed: async () => [rad("A")], utvinn: async () => null });
    const s = await fyllGpsr(d, { dryRun: false });
    expect(s.fel).toBe(1);
    expect(s.kvar).toBe(1);
    expect(d.spara).not.toHaveBeenCalled();
  });

  it("torrkörningen sparar ingenting men visar prov", async () => {
    const d = deps({ listaMappningar: async () => [mappning("w1", "A")], hamtaFeed: async () => [rad("A")] });
    const s = await fyllGpsr(d, { dryRun: true });
    expect(d.spara).not.toHaveBeenCalled();
    expect(s.sparade).toBe(0);
    expect(s.prov).toEqual([{ wixProductId: "w1", marke: "HOMCOM", sakerhet: ["Maxbelastning: 100 kg."] }]);
  });

  it("tar publicerade produkter först och respekterar limit", async () => {
    const d = deps({
      listaMappningar: async () => [mappning("utkast", "A", { draftStatus: "pending_review" }), mappning("publ", "B", { draftStatus: "published" })],
      hamtaFeed: async () => [rad("A"), rad("B")],
    });
    const s = await fyllGpsr(d, { dryRun: false, limit: 1 });
    expect(d.spara).toHaveBeenCalledTimes(1);
    expect(d.spara).toHaveBeenCalledWith(expect.objectContaining({ wixProductId: "publ" }));
    expect(s.kvar).toBe(1);
  });

  it("räknar produkter som saknas i feeden utan att röra deras poster", async () => {
    const d = deps({ listaMappningar: async () => [mappning("w1", "BORTA")], hamtaFeed: async () => [rad("A")] });
    const s = await fyllGpsr(d, { dryRun: false });
    expect(s.saknarFeedrad).toBe(1);
    expect(d.spara).not.toHaveBeenCalled();
  });

  it("vägrar köra på en tom feed", async () => {
    await expect(fyllGpsr(deps({ hamtaFeed: async () => [] }), { dryRun: false })).rejects.toThrow(/tom/);
  });

  it("påbörjar inget nytt efter tidsbudgeten", async () => {
    let t = 0;
    const d = deps({
      listaMappningar: async () => [mappning("w1", "A"), mappning("w2", "B")],
      hamtaFeed: async () => [rad("A"), rad("B")],
      nu: () => (t += 1000),
    });
    const s = await fyllGpsr(d, { dryRun: false, timeBudgetMs: 1500, samtidighet: 1 });
    expect(s.bearbetade).toBe(1);
    expect(s.kvar).toBe(1);
  });
});
