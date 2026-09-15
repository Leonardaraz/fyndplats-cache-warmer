import { describe, it, expect } from "vitest";
import {
  ARTIKELNUMMER_FORM,
  BESKRIVNING_MAX_TECKEN,
  FRAKT,
  FRI_FRAKT_FRAN_SEK,
  HUSMARKEN,
  KOLUMNER,
  byggFeed,
  htmlTillText,
  konkurrenslage,
  prisband,
  rensaHusmarken,
  tillTsv,
  type FeedProdukt,
} from "./google-shopping";
import type { ProductMappingRecord } from "../store";

function mappning(nr: string, over: Partial<ProductMappingRecord> = {}): ProductMappingRecord {
  return {
    supplierProductId: `aosom:${nr}`,
    supplier: "aosom",
    wixProductId: `wix-${nr}`,
    variants: [],
    ...over,
  };
}

function produkt(id: string, over: Partial<FeedProdukt> = {}): FeedProdukt {
  return {
    id,
    namn: "Bäddsoffa 4-i-1 med hjul",
    slug: "baddsoffa-4-i-1-hjul",
    visible: true,
    beskrivningHtml: "<p>En <b>skön</b> bäddsoffa &amp; fåtölj.</p><ul><li>120 × 191 cm</li></ul>",
    bilder: ["https://static.wixstatic.com/media/a.jpg", "https://static.wixstatic.com/media/b.jpg"],
    prisSek: 7919,
    lagerstatus: "IN_STOCK",
    ...over,
  };
}

const NR = "83B-129V00GY";

describe("byggFeed", () => {
  it("bygger en komplett rad ur mappning + butiksprodukt", () => {
    const u = byggFeed([mappning(NR, { prisgrupp: "A", konkurrent: { pris: 13129, hamtad: "2026-09-15T00:00:00Z" } })], new Map([[`wix-${NR}`, produkt(`wix-${NR}`)]]));
    expect(u.rader).toHaveLength(1);
    const r = u.rader[0];
    expect(r.id).toBe(`wix-${NR}`);
    expect(r.title).toBe("Bäddsoffa 4-i-1 med hjul");
    expect(r.description).toBe("En skön bäddsoffa & fåtölj. 120 × 191 cm");
    expect(r.link).toBe("https://www.fyndplats.se/produkt/baddsoffa-4-i-1-hjul");
    expect(r.image_link).toBe("https://static.wixstatic.com/media/a.jpg");
    expect(r.additional_image_link).toBe("https://static.wixstatic.com/media/b.jpg");
    expect(r.availability).toBe("in_stock");
    expect(r.price).toBe("7919.00 SEK");
    expect(r.brand).toBe("Fyndplats");
    expect(r.identifier_exists).toBe("no");
    expect(r.shipping).toBe(FRAKT);
    expect(r.custom_label_0).toBe("A");
    expect(r.custom_label_1).toBe("4000_8000");
    expect(r.custom_label_2).toBe("under_dealproffsen");
  });

  it("☠️ feeden bär aldrig Aosoms artikelnummer — en rad med numret i texten utelämnas", () => {
    const m = mappning(NR);
    const p = produkt(`wix-${NR}`, { beskrivningHtml: `<p>Artikelnummer ${NR}. Passar till 845-030CG.</p>` });
    const u = byggFeed([m], new Map([[m.wixProductId, p]]));
    expect(u.rader).toHaveLength(0);
    expect(u.artikelnummerIText).toBe(1);
    expect(tillTsv(u.rader)).not.toContain(NR);
  });

  it("☠️ radens eget nummer fälls även när formen inte matchar mönstret", () => {
    const m = mappning("XY-ABC", {});
    const p = produkt("wix-XY-ABC", { namn: "Bord XY-ABC svart" });
    const u = byggFeed([m], new Map([["wix-XY-ABC", p]]));
    expect(u.rader).toHaveLength(0);
    expect(u.artikelnummerIText).toBe(1);
  });

  it("måttangivelser som 100-150cm fälls INTE — mönstret är snävt med flit", () => {
    const m = mappning(NR);
    const p = produkt(`wix-${NR}`, { beskrivningHtml: "<p>Justerbar 100-150cm, passar 120-19100 mm.</p>" });
    const u = byggFeed([m], new Map([[m.wixProductId, p]]));
    expect(u.rader).toHaveLength(1);
    expect(ARTIKELNUMMER_FORM.test("100-150cm")).toBe(false);
    expect(ARTIKELNUMMER_FORM.test("845-030CG")).toBe(true);
    expect(ARTIKELNUMMER_FORM.test("A91-268V00BK")).toBe(true);
  });

  it("☠️ husmärken rensas ur titel och text, och raden räknas", () => {
    const m = mappning(NR);
    const p = produkt(`wix-${NR}`, {
      namn: "HOMCOM Bäddsoffa 4-i-1",
      beskrivningHtml: "<p>Från Outsunny, i samarbete med PawHut.</p>",
    });
    const u = byggFeed([m], new Map([[m.wixProductId, p]]));
    expect(u.rader[0].title).toBe("Bäddsoffa 4-i-1");
    expect(u.rader[0].description).toBe("Från, i samarbete med.");
    expect(u.varumarkeRensat).toBe(1);
    for (const hm of HUSMARKEN) expect(tillTsv(u.rader).toLowerCase()).not.toMatch(new RegExp(`\\b${hm}\\b`));
  });

  it("☠️ det som saknas utelämnas och räknas per orsak — aldrig gissas", () => {
    const rader = [
      mappning("1"), // utan produkt
      mappning("2"), mappning("3"), mappning("4"), mappning("5"),
      mappning("ae", { supplier: "aliexpress", supplierProductId: "123" }),
    ];
    const produkter = new Map<string, FeedProdukt>([
      ["wix-2", produkt("wix-2", { visible: false })],
      ["wix-3", produkt("wix-3", { slug: "" })],
      ["wix-4", produkt("wix-4", { prisSek: null })],
      ["wix-5", produkt("wix-5", { bilder: [] })],
    ]);
    const u = byggFeed(rader, produkter);
    expect(u.rader).toHaveLength(0);
    expect(u.utanProdukt).toBe(1);
    expect(u.ejPublicerad).toBe(1);
    expect(u.utanSlug).toBe(1);
    expect(u.utanPris).toBe(1);
    expect(u.utanBild).toBe(1);
    expect(u.ejAosom).toBe(1);
  });

  it("slutsålt i butiken blir out_of_stock, och saknad status räknas som i lager", () => {
    const m = mappning(NR);
    const slut = byggFeed([m], new Map([[m.wixProductId, produkt(m.wixProductId, { lagerstatus: "OUT_OF_STOCK" })]]));
    expect(slut.rader[0].availability).toBe("out_of_stock");
    const okand = byggFeed([m], new Map([[m.wixProductId, produkt(m.wixProductId, { lagerstatus: null })]]));
    expect(okand.rader[0].availability).toBe("in_stock");
  });

  it("under fri frakt-gränsen lämnas fraktfältet tomt", () => {
    const m = mappning(NR);
    const u = byggFeed([m], new Map([[m.wixProductId, produkt(m.wixProductId, { prisSek: FRI_FRAKT_FRAN_SEK - 1 })]]));
    expect(u.rader[0].shipping).toBe("");
  });

  it("beskrivningen kapas märkbart och tom beskrivning faller tillbaka på titeln", () => {
    const m = mappning(NR);
    const lang = byggFeed([m], new Map([[m.wixProductId, produkt(m.wixProductId, { beskrivningHtml: "x".repeat(5000) })]]));
    expect(lang.rader[0].description.length).toBe(BESKRIVNING_MAX_TECKEN);
    expect(lang.rader[0].description.endsWith("…")).toBe(true);
    const tom = byggFeed([m], new Map([[m.wixProductId, produkt(m.wixProductId, { beskrivningHtml: "" })]]));
    expect(tom.rader[0].description).toBe("Bäddsoffa 4-i-1 med hjul");
  });

  it("☠️ inga kostnadsfält i feeden — kolumnerna är en sluten lista", () => {
    for (const k of KOLUMNER) expect(k).not.toMatch(/cost|landed|kostnad|frakt|supplier/i);
  });

  it("produkttypen tas bara från en kategori som faktiskt är tilldelad i Wix", () => {
    const auto = mappning("1", { categorySuggestion: { collectionSlug: "soffor", collectionName: "Soffor", confidence: 0.9, reason: "", status: "auto" } });
    const forslag = mappning("2", { categorySuggestion: { collectionSlug: "soffor", collectionName: "Soffor", confidence: 0.5, reason: "", status: "suggested" } });
    const u = byggFeed([auto, forslag], new Map([["wix-1", produkt("wix-1")], ["wix-2", produkt("wix-2")]]));
    expect(u.rader.map((r) => r.product_type)).toEqual(["Soffor", ""]);
  });
});

describe("tillTsv", () => {
  it("skriver rubrikrad + en rad per produkt, utan tabbar eller radbrytningar i fälten", () => {
    const m = mappning(NR);
    const u = byggFeed([m], new Map([[m.wixProductId, produkt(m.wixProductId, { namn: "Bord\tmed\nradbrytning" })]]));
    const tsv = tillTsv(u.rader);
    const rader = tsv.trimEnd().split("\n");
    expect(rader).toHaveLength(2);
    expect(rader[0]).toBe(KOLUMNER.join("\t"));
    expect(rader[1].split("\t")).toHaveLength(KOLUMNER.length);
    expect(rader[1]).toContain("Bord med radbrytning");
  });
});

describe("hjälpfunktioner", () => {
  it("htmlTillText tar bort taggar och återställer entiteter", () => {
    expect(htmlTillText("<p>A &amp; B</p><br><p>C&nbsp;D</p>")).toBe("A & B C D");
  });
  it("rensaHusmarken rör inte vanliga ord", () => {
    expect(rensaHusmarken("Fåtölj i sammet").rensat).toBe(false);
  });
  it("prisband och konkurrensläge", () => {
    expect(prisband(999)).toBe("500_1000");
    expect(prisband(2499)).toBe("2000_4000");
    expect(konkurrenslage(2499, undefined)).toBe("ingen_jamforelse");
    expect(konkurrenslage(2499, { pris: 2495, hamtad: "" })).toBe("over_dealproffsen");
    expect(konkurrenslage(2449, { pris: 2495, hamtad: "" })).toBe("under_dealproffsen");
  });
});
