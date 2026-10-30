import { describe, expect, it } from "vitest";
import { WIX_MAX_BILDER_PER_PRODUKT, WIX_MAX_OPTIONS_PER_PRODUCT } from "@/lib/wix/limits";
import { valjVevorBilder } from "./bilder";
import type { Avlasning } from "./lager";
import { arPaVag, byggFamilj, egenskaperFor, familjensBilder, rensaVarde, syskonSkus, vevorFamiljeProdukt } from "./familj";
import type { Sidrad } from "./lager";
import { kostnadUsd } from "./to-product";
import { testAvlasning, testgalleri } from "./testsida";

// Påhittade artikelnummer, priser och värden.
const NU = Date.parse("2026-10-29T12:00:00.000Z");
const PRIS = { rabatt: 0.05, usdToSek: 10 };
const sku = (n: number) => `TESTSKUFAMILJ${String(n).padStart(6, "0")}`;

function artikel(n: number, egenskaper: [string, string][], over: Partial<Avlasning> = {}): Avlasning {
  return testAvlasning({
    sku: sku(n),
    bilder: testgalleri(sku(n)),
    egenskaper,
    prisSek: 1000 + n * 100,
    syskon: [1, 2, 3]
      .filter((m) => m !== n)
      .map((m) => ({ sku: sku(m), webbId: String(m).padStart(12, "0"), kanKopas: true })),
    ...over,
  });
}

const lasta = (...a: Avlasning[]) => new Map(a.map((x) => [x.sku, x]));
const ledig = () => false;

describe("byggFamilj", () => {
  const a1 = artikel(1, [["Typ", "Sektionell"], ["Kabellängd", "20 m"]]);
  const a2 = artikel(2, [["Typ", "Sektionell"], ["Kabellängd", "30 m"]]);
  const a3 = artikel(3, [["Typ", "Trumma"], ["Kabellängd", "20 m"]], { status: "slut", saldo: 0 });

  it("syskonen med egna avläsningar blir en familj, ankaret först", () => {
    const f = byggFamilj(a1, lasta(a2, a3), NU, ledig);
    expect(f.typ).toBe("familj");
    if (f.typ !== "familj") return;
    expect(f.medlemmar.map((m) => m.sku)).toEqual([sku(1), sku(2), sku(3)]);
    expect(f.axlar).toEqual(["Typ", "Kabellängd"]);
    // Ingen axel har ett eget värde för varje artikel här.
    expect(f.bildaxel).toBeNull();
  });

  it("ett syskon som är slut följer med, så att det inte blir en egen produkt sedan", () => {
    const f = byggFamilj(a1, lasta(a3), NU, ledig);
    expect(f.typ === "familj" && f.medlemmar.map((m) => m.saldo)).toEqual([12, 0]);
  });

  it("utan syskon, eller utan deras avläsningar, är artikeln ensam", () => {
    expect(byggFamilj(artikel(1, [["Typ", "A"]], { syskon: [] }), new Map(), NU, ledig)).toEqual({ typ: "ensam" });
    expect(byggFamilj(a1, new Map(), NU, ledig)).toEqual({ typ: "ensam" });
  });

  it("☠️ ett syskon som redan sitter på en produkt följer inte med", () => {
    const f = byggFamilj(a1, lasta(a2, a3), NU, (s) => s === sku(2));
    expect(f.typ === "familj" && f.medlemmar.map((m) => m.sku)).toEqual([sku(1), sku(3)]);
  });

  it("☠️ ett syskon med lågt betyg, en annan familj eller utan leverans följer inte med", () => {
    const lagt = { ...a2, betyg: { snitt: 3, antal: 20 } };
    const annan = { ...a3, spu: "99999" };
    expect(byggFamilj(a1, lasta(lagt, annan), NU, ledig)).toEqual({ typ: "ensam" });
    expect(byggFamilj(a1, lasta({ ...a2, levererasTillSe: false }), NU, ledig)).toEqual({ typ: "ensam" });
    expect(byggFamilj(a1, lasta({ ...a2, borta: true }), NU, ledig)).toEqual({ typ: "ensam" });
  });

  it("☠️ ett syskon som saknar betyg (läst före steg 8) gör att familjen väntar", () => {
    expect(byggFamilj(a1, lasta(a2, { ...a3, betyg: undefined }), NU, ledig)).toEqual({ typ: "vanta" });
  });

  it("☠️ ett oläst syskon som står i läsarens kö gör att familjen väntar, annars hoppas det över", () => {
    expect(byggFamilj(a1, lasta(a3), NU, ledig, new Set([sku(2)]))).toEqual({ typ: "vanta" });
    expect(byggFamilj(a1, lasta(a3), NU, ledig).typ).toBe("familj");
    // Ett syskon som redan sitter på en produkt väntar familjen inte på.
    expect(byggFamilj(a1, lasta(a3), NU, (s) => s === sku(2), new Set([sku(2)])).typ).toBe("familj");
  });

  it("arPaVag: bara en sida i kön som inte prövats, eller föll på ett övergående fel", () => {
    const rad = (over: Partial<Sidrad>): Sidrad => ({
      webbId: "000000000002",
      sokvag: "/x",
      klass: "katalog",
      nastaLasning: "2026-10-30T00:00:00.000Z",
      sku: null,
      senastForsokAt: null,
      senastUtfall: null,
      senastOkAt: null,
      iKartan: true,
      saknadIKartanSedan: null,
      saknasForstaAt: null,
      borta: false,
      ...over,
    });
    expect(arPaVag(undefined)).toBe(false);
    expect(arPaVag(rad({}))).toBe(true);
    expect(arPaVag(rad({ senastUtfall: "tillfalligt" }))).toBe(true);
    expect(arPaVag(rad({ senastUtfall: "skrivfel" }))).toBe(true);
    for (const u of ["ok", "saknas", "flyttad", "sparrad", "tolkningsfel:ej_produktsida"] as const) {
      expect(arPaVag(rad({ senastUtfall: u as Sidrad["senastUtfall"] })), u).toBe(false);
    }
    expect(arPaVag(rad({ borta: true }))).toBe(false);
  });

  it("☠️ varianter som inte går att skilja åt blir egna produkter", () => {
    expect(byggFamilj(a1, lasta({ ...a2, egenskaper: [] }), NU, ledig)).toEqual({ typ: "ej_sammanslagen", skal: "utan_egenskaper" });
    expect(byggFamilj(a1, lasta({ ...a2, egenskaper: [["Typ", "Trumma"]] }), NU, ledig)).toEqual({
      typ: "ej_sammanslagen",
      skal: "olika_axlar",
    });
    expect(byggFamilj(a1, lasta({ ...a2, egenskaper: [["Typ", " sektionell "], ["Kabellängd", "20  m"]] }), NU, ledig)).toEqual({
      typ: "ej_sammanslagen",
      skal: "samma_kombination",
    });
    const sju: [string, string][] = Array.from({ length: WIX_MAX_OPTIONS_PER_PRODUCT + 1 }, (_, i) => [`Axel ${i}`, "x"]);
    const b1 = artikel(1, sju);
    const b2 = artikel(2, sju.map(([k], i) => [k, i === 0 ? "y" : "x"]));
    expect(byggFamilj(b1, lasta(b2), NU, ledig)).toEqual({ typ: "ej_sammanslagen", skal: "for_manga_axlar" });
  });

  it("bildaxeln är den första axeln med ett eget värde för varje artikel", () => {
    const c1 = artikel(1, [["Antal hjul", "2"], ["Hjuldiameter", "Φ280 mm"]]);
    const c2 = artikel(2, [["Antal hjul", "2"], ["Hjuldiameter", "Φ330 mm"]]);
    const f = byggFamilj(c1, lasta(c2), NU, ledig);
    expect(f.typ === "familj" && f.bildaxel).toBe("Hjuldiameter");
  });
});

describe("värdena", () => {
  it("rensar mellanslag, och rättar VEVOR:s miljoner till meter bara på en längd", () => {
    expect(rensaVarde("Kabellängd", " 20  miljoner ")).toBe("20 m");
    expect(rensaVarde("Längd", "7,5 miljoner")).toBe("7,5 m");
    expect(rensaVarde("Antal", "20 miljoner")).toBe("20 miljoner");
    expect(egenskaperFor({ egenskaper: [[" Färg ", " Svart "], ["", "x"], ["Tom", " "]] })).toEqual({ Färg: "Svart" });
  });

  it("syskonSkus tar bort artikeln själv och dubbletter", () => {
    const a = artikel(1, [], {
      syskon: [
        { sku: sku(2), webbId: "2", kanKopas: true },
        { sku: sku(2), webbId: "2", kanKopas: true },
        { sku: sku(1), webbId: "1", kanKopas: true },
      ],
    });
    expect(syskonSkus(a)).toEqual([sku(2)]);
  });
});

describe("vevorFamiljeProdukt", () => {
  const a1 = artikel(1, [["Typ", "Sektionell"], ["Antal", "2"]], {
    spec: [["Typ", "Sektionell"], ["Material", "Stål"]],
  });
  const a2 = artikel(2, [["Typ", "Trumma"], ["Antal", "2"]], { status: "slut", saldo: 0 });
  const f = byggFamilj(a1, lasta(a2), NU, ledig);
  if (f.typ !== "familj") throw new Error("ska bli en familj");
  const bilder = valjVevorBilder(a1.bilder);
  const p = vevorFamiljeProdukt(f, PRIS, bilder, (m) => valjVevorBilder(m.bilder));

  it("en variant per artikel, med eget artikelnummer, saldo och inköp", () => {
    expect(p.supplierProductId).toBe(`vevor:${sku(1)}`);
    expect(p.variants).toEqual([
      { supplierVariantId: sku(1), options: { Typ: "Sektionell", Antal: "2" }, costUsd: kostnadUsd(a1, PRIS), stock: 12, included: true },
      { supplierVariantId: sku(2), options: { Typ: "Trumma", Antal: "2" }, costUsd: kostnadUsd(a2, PRIS), stock: 0, included: true },
    ]);
    expect(p.variants[0].costUsd).not.toBe(p.variants[1].costUsd);
    expect(p.inStock).toBe(true);
  });

  it("VEVOR:s egen svenska skickas som manuella namn, och axlarna står inte i specifikationen", () => {
    expect(p.variantNameOverrides).toEqual({ Sektionell: "Sektionell", Trumma: "Trumma", "2": "2" });
    expect(p.axisNameOverrides).toEqual({ Typ: "Typ", Antal: "Antal" });
    expect(p.specifications).toEqual({ Material: "Stål" });
  });

  it("☠️ varje artikel får alla sina sex bilder, kopplade till dess värde (2026-10-30)", () => {
    // Förut: ankarets galleri och bara huvudbilden från varje syskon. Grön och
    // orange på traktorskopskyddet visade en bild var, och den röda huvudbilden
    // låg två gånger i galleriet.
    expect(f.bildaxel).toBe("Typ");
    const egna1 = valjVevorBilder(a1.bilder).urls;
    const egna2 = valjVevorBilder(a2.bilder).urls;
    expect(egna1).toHaveLength(6);
    expect(p.valBilder).toEqual({ Typ: { Sektionell: egna1, Trumma: egna2 } });
    // Galleriet: ankarets bilder först, så att dess första blir huvudbilden.
    expect(p.imageUrls).toEqual([...egna1, ...egna2]);
    expect(new Set(p.imageUrls).size).toBe(p.imageUrls.length);
    expect(p.swatchImages).toBeUndefined();
  });

  it("utan en bildaxel får produkten ankarets bilder, okopplade", () => {
    const b1 = artikel(1, [["Typ", "Sektionell"], ["Kabellängd", "20 m"]]);
    const b2 = artikel(2, [["Typ", "Sektionell"], ["Kabellängd", "30 m"]]);
    const b3 = artikel(3, [["Typ", "Trumma"], ["Kabellängd", "20 m"]]);
    const b4 = artikel(4, [["Typ", "Trumma"], ["Kabellängd", "30 m"]]);
    const g = byggFamilj(b1, lasta(b2, b3, b4), NU, ledig);
    if (g.typ !== "familj") throw new Error("ska bli en familj");
    expect(g.bildaxel).toBeNull();
    const q = vevorFamiljeProdukt(g, PRIS, valjVevorBilder(b1.bilder), (m) => valjVevorBilder(m.bilder));
    expect(q.imageUrls).toEqual(valjVevorBilder(b1.bilder).urls);
    expect(q.valBilder).toBeUndefined();
    expect(q.swatchImages).toBeUndefined();
  });

  it("☠️ artikelnumren står bara i id:na", () => {
    // Bildadresserna bär VEVOR:s mapp, som är artikelnumret. De laddas upp till
    // Wix och syns aldrig för kunden.
    const utanId = JSON.stringify({
      ...p,
      supplierProductId: "",
      variants: p.variants.map((v) => ({ ...v, supplierVariantId: "" })),
    }).replace(/https:\/\/img\.example-cdn\.test[^"]*/g, "");
    expect(utanId).not.toContain(sku(1));
    expect(utanId).not.toContain(sku(2));
  });
});

describe("familjensBilder", () => {
  const medlem = (n: number) => artikel(n, [["Färg", `F${n}`]]);
  const varde = (i: number) => `F${i + 1}`;

  it("sex bilder per artikel så länge Wix tak räcker", () => {
    const m = [1, 2, 3, 4, 5, 6, 7, 8].map(medlem);
    const g = familjensBilder(m, (a) => valjVevorBilder(a.bilder), varde);
    expect(g.imageUrls).toHaveLength(48);
    for (const [i, a] of m.entries()) expect(g.perVarde[varde(i)]).toEqual(valjVevorBilder(a.bilder).urls);
  });

  it("☠️ fler än åtta artiklar delar lika på taket, och galleriet går aldrig över det", () => {
    const nio = [1, 2, 3, 4, 5, 6, 7, 8, 9].map(medlem);
    const g = familjensBilder(nio, (a) => valjVevorBilder(a.bilder), varde);
    expect(g.imageUrls).toHaveLength(45);
    for (const [i, a] of nio.entries()) expect(g.perVarde[varde(i)]).toEqual(valjVevorBilder(a.bilder).urls.slice(0, 5));

    const sjuttio = Array.from({ length: 70 }, (_, i) => medlem(i + 1));
    const h = familjensBilder(sjuttio, (a) => valjVevorBilder(a.bilder), varde);
    expect(h.imageUrls).toHaveLength(WIX_MAX_BILDER_PER_PRODUKT);
    expect(Object.keys(h.perVarde)).toHaveLength(WIX_MAX_BILDER_PER_PRODUKT);
    expect(h.perVarde[varde(0)]).toHaveLength(1);
  });

  it("en adress som två artiklar delar tas med en gång och kopplas till den första", () => {
    const a1 = medlem(1);
    const a2 = artikel(2, [["Färg", "F2"]], { bilder: testgalleri(sku(1)) });
    const g = familjensBilder([a1, a2], (a) => valjVevorBilder(a.bilder), varde);
    expect(g.imageUrls).toEqual(valjVevorBilder(a1.bilder).urls);
    expect(g.perVarde).toEqual({ F1: valjVevorBilder(a1.bilder).urls });
  });

  it("en artikel utan egna bilder får inget värde i kartan", () => {
    const a2 = artikel(2, [["Färg", "F2"]], { bilder: [] });
    const g = familjensBilder([medlem(1), a2], (a) => valjVevorBilder(a.bilder), varde);
    expect(Object.keys(g.perVarde)).toEqual(["F1"]);
  });
});
