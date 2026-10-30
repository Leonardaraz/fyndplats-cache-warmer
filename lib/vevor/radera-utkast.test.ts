import { beforeEach, describe, expect, it, vi } from "vitest";
import type { ProductMappingRecord } from "@/lib/store";
import type { ProduktForRadering } from "@/lib/wix/v3-products";
import { TOMT_IMPORTTILLSTAND, type Importtillstand } from "./import-lager";
import { OBEKRAFTADE_I_FOLJD, RaderingsFel, raderaOpoleradeUtkast, type UtkastRaderingDeps } from "./radera-utkast";

// Påhittade id och artikelnummer.
const rad = (n: number, over: Partial<ProductMappingRecord> = {}): ProductMappingRecord =>
  ({
    wixProductId: `wix-${n}`,
    supplierProductId: `vevor:TESTSKURADERA${String(n).padStart(6, "0")}`,
    supplier: "vevor",
    needsAiPolish: true,
    draftStatus: "pending_review",
    variants: [],
    ...over,
  }) as ProductMappingRecord;

let mappningar: ProductMappingRecord[];
let wix: Map<string, ProduktForRadering>;
let tillstand: Importtillstand;
let ordrar: Set<string>;
let raderaProdukt: ReturnType<typeof vi.fn>;
let raderaMappning: ReturnType<typeof vi.fn>;

const dold = (): ProduktForRadering => ({ finns: true, visible: false, slug: "x", skus: [], nycklar: [] });

function deps(): UtkastRaderingDeps {
  return {
    mappningar: async () => mappningar,
    produkterIOrdrar: async () => ordrar,
    lasProdukt: async (id) => wix.get(id) ?? { finns: false },
    raderaProdukt,
    raderaMappning,
    lasImport: async () => tillstand,
    uppdateraImport: async (a) => {
      tillstand = { ...tillstand, ...a };
    },
  };
}

beforeEach(() => {
  mappningar = [rad(1), rad(2), rad(3)];
  wix = new Map(mappningar.map((m) => [m.wixProductId, dold()]));
  tillstand = { ...TOMT_IMPORTTILLSTAND, aktiv: false, markor: "satt-av-test", varvImporterade: 1043 };
  ordrar = new Set();
  raderaProdukt = vi.fn(async (id: string) => {
    wix.delete(id);
    return "raderad" as const;
  });
  raderaMappning = vi.fn(async (id: string) => {
    mappningar = mappningar.filter((m) => m.wixProductId !== id);
  });
});

const skarp = (bekrafta: number | null) => ({ dryRun: false, bekrafta, budgetMs: 100_000 });

describe("raderingen av opolerade VEVOR-utkast", () => {
  it("planen räknar och raderar ingenting", async () => {
    const s = await raderaOpoleradeUtkast(deps(), { dryRun: true, bekrafta: null, budgetMs: 1 });
    expect(s).toMatchObject({ utkast: 3, raderbara: 3, raderade: 0, kvar: 3 });
    expect(raderaProdukt).not.toHaveBeenCalled();
  });

  it("raderar produkten, bekräftar med en läsning, tar bort raden och nollställer importen", async () => {
    const s = await raderaOpoleradeUtkast(deps(), skarp(3));
    expect(s).toMatchObject({ raderade: 3, kvar: 0, stoppadAv: "klart", importNollstalld: true });
    expect(mappningar).toEqual([]);
    expect(tillstand).toMatchObject({ aktiv: false, markor: null, varvImporterade: 0 });
  });

  it("☠️ bara opolerade VEVOR-utkast: polerade, publicerade och andra leverantörer rörs inte", async () => {
    mappningar.push(
      rad(4, { needsAiPolish: false }),
      rad(5, { draftStatus: "published" }),
      rad(6, { supplier: "aosom", supplierProductId: "aosom:TEST-1" }),
    );
    const s = await raderaOpoleradeUtkast(deps(), skarp(3));
    expect(s.utkast).toBe(3);
    expect(raderaProdukt.mock.calls.map((c) => c[0])).toEqual(["wix-1", "wix-2", "wix-3"]);
  });

  it("☠️ en synlig produkt, en med order eller en som inte gick att läsa raderas inte", async () => {
    wix.set("wix-1", { finns: true, visible: true, slug: "x", skus: [], nycklar: [] });
    ordrar.add("wix-2");
    const las = deps().lasProdukt;
    const d = { ...deps(), lasProdukt: async (id: string) => (id === "wix-3" ? null : las(id)) };
    const s = await raderaOpoleradeUtkast(d, skarp(2));
    expect(s).toMatchObject({ utkast: 3, raderbara: 2, hinder: { iOrder: 1, synlig: 1, lasfel: 1 }, raderade: 0 });
    expect(s.hoppade).toEqual(["wix-2", "wix-1"]);
    expect(raderaProdukt).not.toHaveBeenCalled();
    // ☠️ Ett läsfel lämnar en rad kvar, och då nollställs inte importen.
    expect(s.importNollstalld).toBe(false);
  });

  it("en produkt som redan är borta i Wix: bara raden tas bort", async () => {
    wix.delete("wix-2");
    const s = await raderaOpoleradeUtkast(deps(), skarp(3));
    expect(s).toMatchObject({ raderade: 2, fannsInte: 1 });
    expect(raderaProdukt).toHaveBeenCalledTimes(2);
    expect(raderaMappning).toHaveBeenCalledTimes(3);
  });

  it(`☠️ en obekräftad radering behåller raden, och ${OBEKRAFTADE_I_FOLJD} i följd stoppar`, async () => {
    mappningar.push(rad(4));
    wix.set("wix-4", dold());
    raderaProdukt.mockImplementation(async () => "raderad");
    const s = await raderaOpoleradeUtkast(deps(), skarp(4));
    expect(s).toMatchObject({ raderade: 0, obekraftade: OBEKRAFTADE_I_FOLJD, stoppadAv: "obekraftade", importNollstalld: false });
    expect(raderaMappning).not.toHaveBeenCalled();
    expect(raderaProdukt).toHaveBeenCalledTimes(OBEKRAFTADE_I_FOLJD);
  });

  it("☠️ godkännandet: utan bekrafta, eller med fler raderbara än bekrafta, raderas ingenting", async () => {
    await expect(raderaOpoleradeUtkast(deps(), skarp(null))).rejects.toBeInstanceOf(RaderingsFel);
    await expect(raderaOpoleradeUtkast(deps(), skarp(2))).rejects.toThrow(/fler än bekrafta/);
    expect(raderaProdukt).not.toHaveBeenCalled();
    // Ett följande varv får ha färre.
    expect((await raderaOpoleradeUtkast(deps(), skarp(10))).raderade).toBe(3);
  });

  it("☠️ importen måste vara avstängd", async () => {
    tillstand.aktiv = true;
    await expect(raderaOpoleradeUtkast(deps(), skarp(3))).rejects.toThrow(/importen är påslagen/);
    await expect(raderaOpoleradeUtkast(deps(), { dryRun: true, bekrafta: null, budgetMs: 1 })).rejects.toBeInstanceOf(RaderingsFel);
  });

  it("stannar på tidsbudgeten och säger hur många som är kvar", async () => {
    let klocka = 0;
    const d = {
      ...deps(),
      nu: () => klocka,
      raderaMappning: async (id: string) => {
        klocka += 60;
        await raderaMappning(id);
      },
    };
    const s = await raderaOpoleradeUtkast(d, { dryRun: false, bekrafta: 3, budgetMs: 100 });
    expect(s).toMatchObject({ raderade: 2, kvar: 1, stoppadAv: "tidsbudget", importNollstalld: false });
  });

  it("☠️ med ett urval raderas bara de utkasten, och markören nollställs när de är raderade", async () => {
    const urval = new Set(["wix-2"]);
    const plan = await raderaOpoleradeUtkast(deps(), { dryRun: true, bekrafta: null, budgetMs: 1, urval });
    expect(plan).toMatchObject({ utkast: 1, raderbara: 1 });
    const s = await raderaOpoleradeUtkast(deps(), { ...skarp(1), urval });
    expect(raderaProdukt.mock.calls.map((c) => c[0])).toEqual(["wix-2"]);
    expect(mappningar.map((m) => m.wixProductId)).toEqual(["wix-1", "wix-3"]);
    expect(s).toMatchObject({ raderade: 1, kvar: 0, importNollstalld: true });
    expect(tillstand.markor).toBeNull();
  });
});
