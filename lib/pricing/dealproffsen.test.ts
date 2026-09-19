import { describe, expect, it } from "vitest";
import type { ProductMappingRecord } from "../store";
import type { WixProduktPris } from "../wix/v3-products";
import {
  artikelnummerAv,
  jamforPriser,
  prefixAv,
  prefixLista,
  samlaDeras,
  tolkaDerasSvar,
  type DerasRad,
} from "./dealproffsen";

function mappning(
  over: Partial<ProductMappingRecord> & { wixProductId: string },
): ProductMappingRecord {
  return {
    supplierProductId: "aosom:845-030CG",
    supplier: "aosom",
    variants: [{ wixVariantId: "v1", grossSek: 3599 }],
    ...over,
  } as unknown as ProductMappingRecord;
}
const pris = (p: number | null): WixProduktPris => ({ priceSek: p, variantCount: 1 });
const deras = (rader: DerasRad[]) => new Map(rader.map((r) => [r.reference, r]));

describe("tolkaDerasSvar", () => {
  it("☠️ läser price_amount — ALDRIG det överstrukna regular_price_amount", () => {
    // Uppmätt på 845-030CG: 4 289 kr är vad kunden betalar, 6 049 är
    // överstruket. Fel fält gör dem 41 % dyrare än de är — och eftersom ALLA
    // deras rader är "Kampanj" hade felet gällt hela katalogen, inte en rad.
    const r = tolkaDerasSvar({
      products: [{ reference: "845-030CG", price_amount: 4289, regular_price_amount: 6049 }],
    });
    expect(r[0].prisSek).toBe(4289);
    expect(r[0].ordinariePrisSek).toBe(6049);
  });

  it("plockar EAN ur produktlänken när den finns, annars null", () => {
    const r = tolkaDerasSvar({
      products: [
        { reference: "A", price_amount: 1, link: "https://x.se/bod/56592-nagot-4251774948586.html" },
        { reference: "B", price_amount: 1, link: "https://x.se/bod/123-utan-kod.html" },
      ],
    });
    expect(r[0].ean).toBe("4251774948586");
    expect(r[1].ean).toBeNull();
  });

  it("rader utan referens eller pris hoppas över i stället för att bli noll", () => {
    const r = tolkaDerasSvar({
      products: [
        { reference: "", price_amount: 100 },
        { reference: "C", price_amount: 0 },
        { reference: "D" },
        { reference: "E", price_amount: 499 },
      ],
    });
    expect(r.map((x) => x.reference)).toEqual(["E"]);
  });

  it("ett trasigt svar ger tom lista, inte ett undantag", () => {
    expect(tolkaDerasSvar({})).toEqual([]);
    expect(tolkaDerasSvar(null)).toEqual([]);
  });
});

describe("prefix", () => {
  it("tar prefixet ur artikelnumret, även bokstavsformen 83A-", () => {
    expect(prefixAv("845-030CG")).toBe("845-");
    expect(prefixAv("83A-526V00RB")).toBe("83A-");
    expect(prefixAv("skrot")).toBeNull();
  });

  it("artikelnumret skalas av aosom:-prefixet", () => {
    expect(artikelnummerAv(mappning({ wixProductId: "p" }))).toBe("845-030CG");
  });

  it("listan härleds ur VÅR katalog och hoppar över AliExpress-rader", () => {
    const m = [
      mappning({ wixProductId: "a", supplierProductId: "aosom:845-030CG" }),
      mappning({ wixProductId: "b", supplierProductId: "aosom:921-471LG" }),
      mappning({ wixProductId: "c", supplierProductId: "aosom:845-999XX" }),
      mappning({ wixProductId: "d", supplier: "aliexpress", supplierProductId: "1005001" } as never),
    ];
    expect(prefixLista(m)).toEqual(["845-", "921-"]);
  });
});

describe("samlaDeras", () => {
  it("☠️ samma artikelnummer två gånger → LÄGSTA priset vinner, aldrig det sista", () => {
    // Riktningen är hela poängen. Ett prefix-svep hämtar hundra rader i taget
    // och samma vara kan ligga i mer än en träfflista; låter man den SISTA
    // vinna beror utfallet på sidordningen. Det lägsta priset gör oss mindre
    // billiga i rapporten — fel åt det hållet kostar en utebliven annons, fel
    // åt det andra en prishöjning byggd på ett pris kunden aldrig betalade.
    const m = samlaDeras([
      { reference: "845-030CG", prisSek: 4289, ordinariePrisSek: null, ean: null },
      { reference: "845-030CG", prisSek: 3990, ordinariePrisSek: null, ean: null },
      { reference: "845-030CG", prisSek: 4500, ordinariePrisSek: null, ean: null },
    ]);
    expect(m.size).toBe(1);
    expect(m.get("845-030CG")!.prisSek).toBe(3990);
  });
});

describe("jamforPriser", () => {
  it("räknar ut hur mycket vi ligger under", () => {
    const j = jamforPriser(
      [mappning({ wixProductId: "p1" })],
      new Map([["p1", pris(3599)]]),
      deras([{ reference: "845-030CG", prisSek: 4289, ordinariePrisSek: 6049, ean: null }]),
      new Set(["p1"]),
    );
    expect(j.viBilligare).toBe(1);
    expect(j.rader[0].underMedKr).toBe(690);
    expect(j.rader[0].underMedPct).toBe(16.1);
  });

  it("☠️ en vara de INTE säljer blir utanTraff — aldrig 'vi är billigast'", () => {
    // Den farliga riktningen: ett uteblivet fynd som räknas som ett försprång
    // blir en prishöjning på en jämförelse som aldrig gjordes.
    const j = jamforPriser(
      [mappning({ wixProductId: "p1" })],
      new Map([["p1", pris(3599)]]),
      deras([]),
      new Set(["p1"]),
    );
    expect(j.utanTraff).toBe(1);
    expect(j.viBilligare).toBe(0);
    expect(j.rader).toHaveLength(0);
  });

  it("☠️ okänt pris hos OSS gissas aldrig ur mappningen", () => {
    const j = jamforPriser(
      [mappning({ wixProductId: "p1" })],
      new Map([["p1", pris(null)]]),
      deras([{ reference: "845-030CG", prisSek: 4289, ordinariePrisSek: null, ean: null }]),
      new Set(),
    );
    expect(j.utanVartPris).toBe(1);
    expect(j.rader).toHaveLength(0);
  });

  it("☠️ rapporten bär ALDRIG artikelnumret — den hamnar i en publik logg", () => {
    const j = jamforPriser(
      [mappning({ wixProductId: "p1" })],
      new Map([["p1", pris(3599)]]),
      deras([{ reference: "845-030CG", prisSek: 4289, ordinariePrisSek: null, ean: null }]),
      new Set(["p1"]),
    );
    expect(JSON.stringify(j)).not.toContain("845-030CG");
    expect(JSON.stringify(j)).not.toMatch(/\b[0-9A-Z]{3}-[0-9]{3}[A-Z0-9]*\b/);
  });

  it("utkast kommer med och är utmärkta — de är poleringskön", () => {
    const j = jamforPriser(
      [mappning({ wixProductId: "p1", needsAiPolish: true })],
      new Map([["p1", pris(3599)]]),
      deras([{ reference: "845-030CG", prisSek: 4289, ordinariePrisSek: null, ean: null }]),
      new Set(), // inte publicerad
    );
    expect(j.rader[0].publicerad).toBe(false);
    expect(j.rader[0].behoverPolering).toBe(true);
  });

  it("AliExpress-rader jämförs inte — dealproffsen säljer Aosom", () => {
    const j = jamforPriser(
      [mappning({ wixProductId: "p1", supplier: "aliexpress", supplierProductId: "100500" } as never)],
      new Map([["p1", pris(999)]]),
      deras([]),
      new Set(),
    );
    expect(j.ejAosom).toBe(1);
    expect(j.utanTraff).toBe(0);
  });

  it("☠️ en rad UTAN artikelnummer är inte ett besked om deras sortiment", () => {
    // "De säljer den inte" och "vi kunde inte ens fråga" är två olika utfall.
    // Slås de ihop ser en trasig mappningsrad ut som ett mätvärde om dem.
    const j = jamforPriser(
      [mappning({ wixProductId: "p1", supplierProductId: "" })],
      new Map([["p1", pris(3599)]]),
      deras([]),
      new Set(),
    );
    expect(j.utanArtikelnummer).toBe(1);
    expect(j.utanTraff).toBe(0);
  });

  it("störst gap först — det är där pengarna ligger", () => {
    const m = [
      mappning({ wixProductId: "liten", supplierProductId: "aosom:845-001" }),
      mappning({ wixProductId: "stor", supplierProductId: "aosom:845-002" }),
    ];
    const j = jamforPriser(
      m,
      new Map([["liten", pris(990)], ["stor", pris(3000)]]),
      deras([
        { reference: "845-001", prisSek: 1090, ordinariePrisSek: null, ean: null },
        { reference: "845-002", prisSek: 4000, ordinariePrisSek: null, ean: null },
      ]),
      new Set(),
    );
    expect(j.rader.map((r) => r.wixProductId)).toEqual(["stor", "liten"]);
  });
});
