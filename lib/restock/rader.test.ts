import { describe, expect, it } from "vitest";
import {
  byggRestockRader,
  landSv,
  type RestockButiksprodukt,
  type RestockMappning,
  type RestockSynkstatus,
} from "./rader";
import type { RestockProductCount } from "./store";

const count = (productId: string, pending = 1): RestockProductCount => ({
  productId,
  pending,
  notified: 0,
  total: pending,
  latestSubscribedAt: "2026-09-29T10:00:00.000Z",
});

function bygg(opts: {
  ids?: string[];
  produkter?: Record<string, RestockButiksprodukt> | null;
  mappningar?: Record<string, RestockMappning | null>;
  synk?: Record<string, RestockSynkstatus | null>;
}) {
  const ids = opts.ids ?? ["p1"];
  return byggRestockRader({
    counts: ids.map((id) => count(id)),
    produkter: opts.produkter === null ? null : new Map(Object.entries(opts.produkter ?? {})),
    mappningar: new Map(Object.entries(opts.mappningar ?? {})),
    synk: new Map(Object.entries(opts.synk ?? {})),
  });
}

const AE_ID = "1005000000000001";
const aeMappning: RestockMappning = {
  supplierProductId: AE_ID,
  supplier: "aliexpress",
  seoTitle: "Wooden Puzzle Space Shuttle 3D - AliExpress",
  shipsFromCountries: ["ES"],
};
const aosomMappning: RestockMappning = {
  supplierProductId: "",
  supplier: "aosom",
  sourceUrl: "https://leverantor.example/vara-1",
  seoTitle: "Kratzbaum mit Hängematte",
};

describe("namnet", () => {
  // Leonards rapport 2026-09-30: sidan visade mappningens seoTitle, alltså
  // AliExpress sidtitel från importen.
  it("är BUTIKENS namn, inte leverantörens titel ur mappningen", () => {
    const [rad] = bygg({
      produkter: { p1: { name: "Rymdfärja i trä, 3D-pussel", slug: "rymdfarja-3d-pussel", visible: true } },
      mappningar: { p1: aeMappning },
    });
    expect(rad.namn).toBe("Rymdfärja i trä, 3D-pussel");
    expect(rad.iButiken).toBe("finns");
    expect(rad.leverantorensTitel).toBeNull();
  });

  it("faller tillbaka på leverantörens titel bara när Wix inte känner produkten", () => {
    const [rad] = bygg({ produkter: {}, mappningar: { p1: aeMappning } });
    expect(rad.namn).toBeNull();
    expect(rad.iButiken).toBe("saknas");
    expect(rad.leverantorensTitel).toBe("Wooden Puzzle Space Shuttle 3D - AliExpress");
  });

  // Ett fallet uppslag får inte se ut som att produkten är raderad.
  it("ett fallet Wix-uppslag är okänt, inte saknat", () => {
    const [rad] = bygg({ produkter: null, mappningar: { p1: aeMappning } });
    expect(rad.iButiken).toBe("okant");
    expect(rad.synlig).toBeNull();
    expect(rad.butikUrl).toBe("");
  });

  it("ett tomt namn i Wix räknas som saknat namn", () => {
    const [rad] = bygg({ produkter: { p1: { name: "  ", visible: true } }, mappningar: { p1: aeMappning } });
    expect(rad.namn).toBeNull();
    expect(rad.leverantorensTitel).toBe("Wooden Puzzle Space Shuttle 3D - AliExpress");
  });
});

describe("butikslänken", () => {
  it("pekar på butikssidan för en synlig produkt", () => {
    const [rad] = bygg({ produkter: { p1: { name: "X", slug: "x-vara", visible: true } } });
    expect(rad.butikUrl).toMatch(/\/produkt\/x-vara$/);
  });

  // Ett utkast svarar 404 i butiken.
  it("utelämnas för ett utkast", () => {
    const [rad] = bygg({ produkter: { p1: { name: "X", slug: "x-vara", visible: false } } });
    expect(rad.synlig).toBe(false);
    expect(rad.butikUrl).toBe("");
  });

  it("räknar ett saknat visible-fält som synligt", () => {
    const [rad] = bygg({ produkter: { p1: { name: "X", slug: "x-vara" } } });
    expect(rad.synlig).toBe(true);
  });
});

describe("lagret hos oss", () => {
  it.each([
    ["IN_STOCK", "i_lager"],
    ["OUT_OF_STOCK", "slut"],
    ["PARTIALLY_OUT_OF_STOCK", "delvis"],
    ["NÅGOT_NYTT", "okant"],
    [undefined, "okant"],
  ])("%s → %s", (status, vantat) => {
    const [rad] = bygg({ produkter: { p1: { name: "X", availabilityStatus: status } } });
    expect(rad.hosOss).toBe(vantat);
  });
});

describe("AliExpress", () => {
  it("länkar till listningen och visar lagerlandet på svenska", () => {
    const [rad] = bygg({ mappningar: { p1: aeMappning } });
    expect(rad.leverantor?.namn).toBe("AliExpress");
    expect(rad.leverantor?.url).toBe(`https://www.aliexpress.com/item/${AE_ID}.html`);
    expect(rad.leverantor?.lager).toEqual(["Spanien"]);
  });

  // AliExpress bakar in lagerlandet i SKU:n, så varianterna kan bära fler länder än raden.
  it("tar med varianternas lagerländer, en gång per land", () => {
    const [rad] = bygg({
      mappningar: { p1: { ...aeMappning, variants: [{ shipFrom: "PL" }, { shipFrom: "ES" }, {}] } },
    });
    expect(rad.leverantor?.lager).toEqual(["Spanien", "Polen"]);
  });

  it("föredrar den fångade källadressen", () => {
    const [rad] = bygg({ mappningar: { p1: { ...aeMappning, sourceUrl: "https://www.aliexpress.com/item/x.html?a=1" } } });
    expect(rad.leverantor?.url).toBe("https://www.aliexpress.com/item/x.html?a=1");
  });

  it("slut hos leverantören, med datumet synken såg det", () => {
    const [rad] = bygg({
      mappningar: { p1: aeMappning },
      synk: { p1: { listingStatus: "out_of_stock", currentStock: 0, outOfStockSince: "2026-09-20T08:00:00.000Z", lastCheckedAt: "2026-09-30T06:00:00.000Z" } },
    });
    expect(rad.leverantor?.status).toBe("slut");
    expect(rad.leverantor?.slutSedan).toBe("2026-09-20T08:00:00.000Z");
    expect(rad.leverantor?.kontrollerad).toBe("2026-09-30T06:00:00.000Z");
  });

  it("borttagen listning", () => {
    const [rad] = bygg({ mappningar: { p1: aeMappning }, synk: { p1: { listingStatus: "removed", currentStock: 3 } } });
    expect(rad.leverantor?.status).toBe("borttagen");
  });

  // Synken nollar butiken först efter flera läsningar; listningen är slut redan nu.
  it("en levande listning med noll i lager är slut", () => {
    const [rad] = bygg({ mappningar: { p1: aeMappning }, synk: { p1: { listingStatus: "active", currentStock: 0 } } });
    expect(rad.leverantor?.status).toBe("slut");
  });

  it("en levande listning med lager är i lager, med saldot", () => {
    const [rad] = bygg({ mappningar: { p1: aeMappning }, synk: { p1: { listingStatus: "active", currentStock: 12 } } });
    expect(rad.leverantor?.status).toBe("i_lager");
    expect(rad.leverantor?.antal).toBe(12);
  });

  it("utan synktillstånd är statusen okänd", () => {
    const [rad] = bygg({ mappningar: { p1: aeMappning } });
    expect(rad.leverantor?.status).toBe("okant");
    expect(rad.leverantor?.antal).toBeNull();
  });
});

describe("Aosom", () => {
  it("länkar till leverantörens sida", () => {
    const [rad] = bygg({ mappningar: { p1: { ...aosomMappning, aosomSyncedQty: 0, aosomSyncedAt: "2026-09-28T12:00:00.000Z" } } });
    expect(rad.leverantor?.namn).toBe("Aosom");
    expect(rad.leverantor?.url).toBe("https://leverantor.example/vara-1");
    expect(rad.leverantor?.status).toBe("slut");
    expect(rad.leverantor?.kontrollerad).toBe("2026-09-28T12:00:00.000Z");
  });

  it("saldo över noll är i lager", () => {
    const [rad] = bygg({ mappningar: { p1: { ...aosomMappning, aosomSyncedQty: 7 } } });
    expect(rad.leverantor?.status).toBe("i_lager");
    expect(rad.leverantor?.antal).toBe(7);
  });

  // Fältet saknas på en rad som aldrig synkats — det är ingen bevisning om saldot.
  it("ett saknat saldo är okänt, aldrig slut", () => {
    const [rad] = bygg({ mappningar: { p1: aosomMappning } });
    expect(rad.leverantor?.status).toBe("okant");
  });

  // En ommappad rad kan ha kvar AE-synkens tillstånd; det beskriver den gamla listningen.
  it("läser aldrig AliExpress-synkens tillstånd", () => {
    const [rad] = bygg({
      mappningar: { p1: { ...aosomMappning, aosomSyncedQty: 4 } },
      synk: { p1: { listingStatus: "removed", currentStock: 0 } },
    });
    expect(rad.leverantor?.status).toBe("i_lager");
  });

  it("känns igen på prefixet när supplier-fältet saknas", () => {
    const [rad] = bygg({ mappningar: { p1: { supplierProductId: "aosom:x", sourceUrl: "https://leverantor.example/vara-2" } } });
    expect(rad.leverantor?.namn).toBe("Aosom");
  });
});

describe("Aosom, sammanslagen sida", () => {
  const sammanslagen = (a: number | undefined, b: number | undefined): RestockMappning => ({
    ...aosomMappning,
    aosomSyncedQty: (a ?? 0) + (b ?? 0),
    variants: [
      { choices: { Färg: "Beige" }, aosomSyncedQty: a },
      { choices: { Färg: "Grå" }, aosomSyncedQty: b },
    ],
  });

  // Radens saldo är SUMMAN av varianternas. Summan säger "i lager" fast den
  // färg kunden väntar på är slut.
  it("visar saldot per färg och kallar sidan delvis slut", () => {
    const [rad] = bygg({ mappningar: { p1: sammanslagen(0, 5) } });
    expect(rad.leverantor?.status).toBe("delvis");
    expect(rad.leverantor?.varianter).toEqual([
      { namn: "Beige", antal: 0 },
      { namn: "Grå", antal: 5 },
    ]);
    expect(rad.leverantor?.antal).toBe(5);
  });

  it("alla färger slut är slut", () => {
    const [rad] = bygg({ mappningar: { p1: sammanslagen(0, 0) } });
    expect(rad.leverantor?.status).toBe("slut");
  });

  it("alla färger i lager är i lager", () => {
    const [rad] = bygg({ mappningar: { p1: sammanslagen(2, 5) } });
    expect(rad.leverantor?.status).toBe("i_lager");
  });

  it("en okänd färg bredvid en slutsåld är delvis, och summan är okänd", () => {
    const [rad] = bygg({ mappningar: { p1: sammanslagen(0, undefined) } });
    expect(rad.leverantor?.status).toBe("delvis");
    expect(rad.leverantor?.antal).toBeNull();
  });

  it("namnger båda axlarna, och en variant utan val får ett nummer", () => {
    const [rad] = bygg({
      mappningar: {
        p1: {
          ...aosomMappning,
          variants: [
            { choices: { Färg: "Grå", Storlek: "110 cm" }, aosomSyncedQty: 1 },
            { choices: {}, aosomSyncedQty: 0 },
          ],
        },
      },
    });
    expect(rad.leverantor?.varianter.map((v) => v.namn)).toEqual(["Grå / 110 cm", "Variant 2"]);
  });

  it("en vanlig rad med en variant läser radens saldo", () => {
    const [rad] = bygg({
      mappningar: { p1: { ...aosomMappning, aosomSyncedQty: 0, variants: [{ choices: {}, aosomSyncedQty: 0 }] } },
    });
    expect(rad.leverantor?.status).toBe("slut");
    expect(rad.leverantor?.varianter).toEqual([]);
  });
});

describe("mappningen", () => {
  it("en rad som inte finns ger ingen leverantör men är inte okänd", () => {
    const [rad] = bygg({ mappningar: { p1: null } });
    expect(rad.leverantor).toBeNull();
    expect(rad.mappningOkand).toBe(false);
  });

  // En fallen läsning ska synas som det, inte som en produkt utan leverantör.
  it("en läsning som föll markeras som okänd", () => {
    const [rad] = bygg({ mappningar: {} });
    expect(rad.leverantor).toBeNull();
    expect(rad.mappningOkand).toBe(true);
  });
});

it("behåller ordningen och räknarna från countByProduct", () => {
  const rader = bygg({ ids: ["b", "a", "c"] });
  expect(rader.map((r) => r.productId)).toEqual(["b", "a", "c"]);
  expect(rader[0].pending).toBe(1);
  expect(rader[0].latestSubscribedAt).toBe("2026-09-29T10:00:00.000Z");
});

describe("landSv", () => {
  it("översätter lagerlandets kod", () => {
    expect(landSv("ES")).toBe("Spanien");
    expect(landSv("pl")).toBe("Polen");
  });

  it("lämnar en okänd kod som den är", () => {
    expect(landSv("ZZZ")).toBe("ZZZ");
    expect(landSv("")).toBe("");
  });
});
