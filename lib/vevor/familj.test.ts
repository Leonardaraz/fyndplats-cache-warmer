import { describe, expect, it } from "vitest";
import { WIX_MAX_BILDER_PER_PRODUKT, WIX_MAX_OPTIONS_PER_PRODUCT, WIX_MAX_VALNAMN } from "@/lib/wix/limits";
import { valjVevorBilder } from "./bilder";
import type { Avlasning } from "./lager";
import {
  arPaVag,
  byggFamilj,
  byggSpuFamilj,
  egenskaperFor,
  familjeVarden,
  familjensBilder,
  familjensSpec,
  regelFor,
  rensaVarde,
  specAxlar,
  syskonSkus,
  titlarnaForklaras,
  vevorFamiljeProdukt,
} from "./familj";
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
  const a1 = artikel(1, [["Färg", "Svart"], ["Kabellängd", "20 m"]]);
  const a2 = artikel(2, [["Färg", "Svart"], ["Kabellängd", "30 m"]]);
  const a3 = artikel(3, [["Färg", "Röd"], ["Kabellängd", "20 m"]], { status: "slut", saldo: 0 });

  it("syskonen med egna avläsningar blir en familj, ankaret först", () => {
    const f = byggFamilj(a1, lasta(a2, a3), NU, ledig);
    expect(f.typ).toBe("familj");
    if (f.typ !== "familj") return;
    expect(f.medlemmar.map((m) => m.sku)).toEqual([sku(1), sku(2), sku(3)]);
    expect(f.axlar).toEqual(["Färg", "Kabellängd"]);
    // Ingen axel har ett eget värde för varje artikel här.
    expect(f.bildaxel).toBeNull();
  });

  it("ett syskon som är slut följer med, så att det inte blir en egen produkt sedan", () => {
    const f = byggFamilj(a1, lasta(a3), NU, ledig);
    expect(f.typ === "familj" && f.medlemmar.map((m) => m.saldo)).toEqual([12, 0]);
  });

  it("utan syskon, eller utan deras avläsningar, är artikeln ensam", () => {
    expect(byggFamilj(artikel(1, [["Färg", "Svart"]], { syskon: [] }), new Map(), NU, ledig)).toEqual({ typ: "ensam" });
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
    expect(byggFamilj(a1, lasta({ ...a2, egenskaper: [["Färg", "Röd"]] }), NU, ledig)).toEqual({
      typ: "ej_sammanslagen",
      skal: "olika_axlar",
    });
    expect(byggFamilj(a1, lasta({ ...a2, egenskaper: [["Färg", " svart "], ["Kabellängd", "20  m"]] }), NU, ledig)).toEqual({
      typ: "ej_sammanslagen",
      skal: "samma_kombination",
    });
    const sju: [string, string][] = Array.from({ length: WIX_MAX_OPTIONS_PER_PRODUCT + 1 }, (_, i) => [`Axel ${i}`, "x"]);
    const b1 = artikel(1, sju);
    const b2 = artikel(2, sju.map(([k], i) => [k, i === 0 ? "y" : "x"]));
    expect(byggFamilj(b1, lasta(b2), NU, ledig)).toEqual({ typ: "ej_sammanslagen", skal: "for_manga_axlar" });
  });

  it("☠️ ett värde eller en axel över 50 tecken ger egna produkter (Wix avvisar hela produkten)", () => {
    const langt = "x".repeat(WIX_MAX_VALNAMN + 1);
    const precis = "y".repeat(WIX_MAX_VALNAMN);
    const d1 = artikel(1, [["Färg", precis]]);
    expect(byggFamilj(d1, lasta(artikel(2, [["Färg", langt]])), NU, ledig)).toEqual({
      typ: "ej_sammanslagen",
      skal: "for_langt_namn",
    });
    expect(byggFamilj(artikel(1, [[langt, "A"]]), lasta(artikel(2, [[langt, "B"]])), NU, ledig)).toEqual({
      typ: "ej_sammanslagen",
      skal: "for_langt_namn",
    });
    // Exakt 50 tecken går igenom.
    expect(byggFamilj(d1, lasta(artikel(2, [["Färg", "kort"]])), NU, ledig).typ).toBe("familj");
  });

  it("☠️ familjeregeln: en axel för funktion ger egna sidor, en oklar axel likaså (Leonard 2026-10-30)", () => {
    const k1 = artikel(1, [["Kapacitet", "3 L"]]);
    expect(byggFamilj(k1, lasta(artikel(2, [["Kapacitet", "6 L"]])), NU, ledig)).toEqual({ typ: "ej_sammanslagen", skal: "funktion" });
    const m1 = artikel(1, [["Material", "Trä"]]);
    expect(byggFamilj(m1, lasta(artikel(2, [["Material", "Bambu"]])), NU, ledig)).toEqual({ typ: "ej_sammanslagen", skal: "oklar_axel" });
    // En förpackningsstorlek får dela sida.
    expect(byggFamilj(artikel(1, [["Antal", "4 st"]]), lasta(artikel(2, [["Antal", "6 st"]])), NU, ledig).typ).toBe("familj");
  });

  it("en axel med samma värde för alla avgör inte regeln", () => {
    const f = byggFamilj(artikel(1, [["Färg", "Svart"], ["Typ", "Hög"]]), lasta(artikel(2, [["Färg", "Vit"], ["Typ", "Hög"]])), NU, ledig);
    expect(f.typ).toBe("familj");
    expect(regelFor(["Färg", "Typ"], [{ Färg: "Svart", Typ: "Hög" }, { Färg: "Vit", Typ: "Hög" }])).toBeNull();
    expect(regelFor(["Färg", "Typ"], [{ Färg: "Svart", Typ: "Hög" }, { Färg: "Vit", Typ: "Låg" }])).toBe("funktion");
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
  const a1 = artikel(1, [["Färg", "Svart"], ["Antal", "2"]], {
    spec: [["Färg", "Svart"], ["Material", "Stål"]],
  });
  const a2 = artikel(2, [["Färg", "Röd"], ["Antal", "2"]], {
    status: "slut",
    saldo: 0,
    spec: [["Färg", "Röd"], ["Material", "Stål"]],
  });
  const f = byggFamilj(a1, lasta(a2), NU, ledig);
  if (f.typ !== "familj") throw new Error("ska bli en familj");
  const bilder = valjVevorBilder(a1.bilder);
  const p = vevorFamiljeProdukt(f, PRIS, bilder, (m) => valjVevorBilder(m.bilder));

  it("en variant per artikel, med eget artikelnummer, saldo och inköp", () => {
    expect(p.supplierProductId).toBe(`vevor:${sku(1)}`);
    expect(p.variants).toEqual([
      { supplierVariantId: sku(1), options: { Färg: "Svart", Antal: "2" }, costUsd: kostnadUsd(a1, PRIS), stock: 12, included: true },
      { supplierVariantId: sku(2), options: { Färg: "Röd", Antal: "2" }, costUsd: kostnadUsd(a2, PRIS), stock: 0, included: true },
    ]);
    expect(p.variants[0].costUsd).not.toBe(p.variants[1].costUsd);
    expect(p.inStock).toBe(true);
  });

  it("VEVOR:s egen svenska skickas som manuella namn, och axlarna står inte i specifikationen", () => {
    expect(p.variantNameOverrides).toEqual({ Svart: "Svart", Röd: "Röd", "2": "2" });
    expect(p.axisNameOverrides).toEqual({ Färg: "Färg", Antal: "Antal" });
    expect(p.specifications).toEqual({ Material: "Stål" });
  });

  it("☠️ en rad som skiljer mellan artiklarna visar varje varians värde, inte ankarets (2026-10-30)", () => {
    // Förut stod ankarets värde i fliken för alla varianter: den som valde 36 tum
    // såg 24-tumsankarets höjd.
    const k1 = artikel(1, [["Längd", "24 tum"], ["Antal", "4 st"]], {
      spec: [["Totalhöjd", "610 mm"], ["Huvudmaterial", "Stål"], ["Nettovikt", "3 kg"], ["Antal", "4 st"]],
    });
    const k2 = artikel(2, [["Längd", "24 tum"], ["Antal", "6 st"]], {
      spec: [["Totalhöjd", "610 mm"], ["Huvudmaterial", "stål"], ["Nettovikt", "4,5 kg"]],
    });
    const k3 = artikel(3, [["Längd", "36 tum"], ["Antal", "4 st"]], {
      spec: [["Totalhöjd", "914 mm"], ["Huvudmaterial", "Stål"], ["Nettovikt", "5 kg"], ["Spiklängd", "762 mm"]],
    });
    expect(familjensSpec([k1, k2, k3], ["Längd", "Antal"])).toEqual({
      // Samma värde för alla (oavsett skiftläge): en rad som förut.
      Huvudmaterial: "Stål",
      // Varianter med samma värde delar det.
      Totalhöjd: "24 tum / 4 st, 24 tum / 6 st: 610 mm · 36 tum / 4 st: 914 mm",
      Nettovikt: "24 tum / 4 st: 3 kg · 24 tum / 6 st: 4,5 kg · 36 tum / 4 st: 5 kg",
      // En rad bara en artikel har visas för den.
      Spiklängd: "36 tum / 4 st: 762 mm",
    });
  });

  it("☠️ en rad fälls som den står i fliken: en variant som heter 850 mm efter Modell (2026-11-01)", () => {
    // Bara den ena artikeln har raden, så fliken visar "Modell: 850 mm: Modell", och
    // poleringens regel läser 850 som en kod. Importen tar bort raden.
    const k1 = artikel(1, [["Storlek", "625 mm"]], { spec: [["Material", "Stål"]] });
    const k2 = artikel(2, [["Storlek", "850 mm"]], { spec: [["Material", "Stål"], ["Modell", "Modell"]] });
    expect(familjensSpec([k1, k2], ["Storlek"])).toEqual({ Material: "Stål" });
    // En rad som inte fälls står kvar som förut.
    const k3 = artikel(3, [["Storlek", "850 mm"]], { spec: [["Material", "Stål"], ["Fotstöd", "Halkfri gummi"]] });
    expect(familjensSpec([k1, k3], ["Storlek"])).toEqual({ Material: "Stål", Fotstöd: "850 mm: Halkfri gummi" });
  });

  it("varianten namnges bara med de axlar som skiljer", () => {
    const k1 = artikel(1, [["Färg", "Svart"], ["Antal", "2 st"]], { spec: [["Vikt", "1 kg"]] });
    const k2 = artikel(2, [["Färg", "Vit"], ["Antal", "2 st"]], { spec: [["Vikt", "2 kg"]] });
    expect(familjensSpec([k1, k2], ["Färg", "Antal"])).toEqual({ Vikt: "Svart: 1 kg · Vit: 2 kg" });
  });

  it("☠️ varje artikel får alla sina sex bilder, kopplade till dess värde (2026-10-30)", () => {
    // Förut: ankarets galleri och bara huvudbilden från varje syskon. Grön och
    // orange på traktorskopskyddet visade en bild var, och den röda huvudbilden
    // låg två gånger i galleriet.
    expect(f.bildaxel).toBe("Färg");
    const egna1 = valjVevorBilder(a1.bilder).urls;
    const egna2 = valjVevorBilder(a2.bilder).urls;
    expect(egna1).toHaveLength(6);
    expect(p.valBilder).toEqual({ Färg: { Svart: egna1, Röd: egna2 } });
    // Galleriet: ankarets bilder först, så att dess första blir huvudbilden.
    expect(p.imageUrls).toEqual([...egna1, ...egna2]);
    expect(new Set(p.imageUrls).size).toBe(p.imageUrls.length);
    expect(p.swatchImages).toBeUndefined();
  });

  it("utan en bildaxel får produkten ankarets bilder, okopplade", () => {
    const b1 = artikel(1, [["Färg", "Svart"], ["Kabellängd", "20 m"]]);
    const b2 = artikel(2, [["Färg", "Svart"], ["Kabellängd", "30 m"]]);
    const b3 = artikel(3, [["Färg", "Röd"], ["Kabellängd", "20 m"]]);
    const b4 = artikel(4, [["Färg", "Röd"], ["Kabellängd", "30 m"]]);
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

  it("en adress som två artiklar delar tas med en gång, kopplas inte och blir gemensam", () => {
    const a1 = medlem(1);
    const a2 = artikel(2, [["Färg", "F2"]], { bilder: testgalleri(sku(1)) });
    const g = familjensBilder([a1, a2], (a) => valjVevorBilder(a.bilder), varde);
    expect(g.imageUrls).toEqual(valjVevorBilder(a1.bilder).urls);
    expect(g.perVarde).toEqual({});
    expect(g.gemensamma).toEqual(g.imageUrls);
  });

  // Fotots innehåll ur adressens filnamn: samma namn i olika artikelmappar är samma foto.
  const innehall = (u: string) => u.replace(/us%2F[^%]+%2F/, "");

  it("☠️ samma FOTO under olika adresser tas en gång: storlekar med samma bilder får inga kopplingar", () => {
    const fem = [1, 2, 3, 4, 5].map((n) => artikel(n, [["Storlek", `S${n}`]]));
    const g = familjensBilder(fem, (a) => valjVevorBilder(a.bilder), (i) => `S${i + 1}`, innehall);
    expect(g.imageUrls).toEqual(valjVevorBilder(fem[0].bilder).urls);
    expect(g.perVarde).toEqual({});
    expect(g.gemensamma).toEqual(g.imageUrls);
    // Utan innehållsnyckel hade varje storlek fått sina sex: 30 bilder.
    expect(familjensBilder(fem, (a) => valjVevorBilder(a.bilder), (i) => `S${i + 1}`).imageUrls).toHaveLength(30);
  });

  it("☠️ delade foton blir gemensamma och en artikels egna kopplas till den", () => {
    const egna = testgalleri(sku(9)).map((b) => ({ ...b, url: b.url.replace("test-produkt", "annan-vara") }));
    const fyra = [1, 2, 3].map((n) => artikel(n, [["Storlek", `S${n}`]]));
    const herr = artikel(4, [["Storlek", "H"]], { bilder: egna });
    const g = familjensBilder([...fyra, herr], (a) => valjVevorBilder(a.bilder), (i) => (i === 3 ? "H" : `S${i + 1}`), innehall);
    const delade = valjVevorBilder(fyra[0].bilder).urls;
    const hans = valjVevorBilder(herr.bilder).urls;
    expect(g.imageUrls).toEqual([...delade, ...hans]);
    expect(g.gemensamma).toEqual(delade);
    expect(g.perVarde).toEqual({ H: hans });
  });

  it("två färger med samma filnamn men olika foton behåller var sina bilder", () => {
    const g = familjensBilder([medlem(1), artikel(2, [["Färg", "F2"]])], (a) => valjVevorBilder(a.bilder), varde, (u) => u);
    expect(g.gemensamma).toEqual([]);
    expect(Object.keys(g.perVarde)).toEqual(["F1", "F2"]);
  });

  it("en artikel utan egna bilder får inget värde i kartan", () => {
    const a2 = artikel(2, [["Färg", "F2"]], { bilder: [] });
    const g = familjensBilder([medlem(1), a2], (a) => valjVevorBilder(a.bilder), varde);
    expect(Object.keys(g.perVarde)).toEqual(["F1"]);
  });
});

describe("SPU-grupper: syskon utan länkar (Leonard 2026-10-30)", () => {
  const spu = (n: number, farg: string, over: Partial<Avlasning> = {}): Avlasning =>
    testAvlasning({
      sku: sku(n),
      spu: "55555",
      bilder: testgalleri(sku(n)),
      namn: `VEVOR Testhink ${farg}`,
      egenskaper: [],
      syskon: [],
      spec: [
        ["Artikelmodellnummer", `TEST-${n}`],
        ["Färg", farg],
        ["Material", "Plast"],
      ],
      ...over,
    });
  const s1 = spu(1, "Svart");
  const s2 = spu(2, "Vit");

  it("samma SPU, samma betyg och en färg som skiljer blir en familj, med axeln ur specifikationen", () => {
    const f = byggSpuFamilj(s1, [s2], NU, ledig);
    expect(f.typ).toBe("familj");
    if (f.typ !== "familj") return;
    expect(f.medlemmar.map((m) => m.sku)).toEqual([sku(1), sku(2)]);
    expect(f.axlar).toEqual(["Färg"]);
    expect(f.bildaxel).toBe("Färg");
  });

  it("☠️ olika betyg, ett länkat syskon eller ingen annan i gruppen ger ingen grupp", () => {
    expect(byggSpuFamilj(s1, [{ ...s2, betyg: { snitt: 4.1, antal: 12 } }], NU, ledig)).toEqual({ typ: "ensam" });
    expect(byggSpuFamilj(s1, [{ ...s2, syskon: [{ sku: sku(1), webbId: "000000000001", kanKopas: true }] }], NU, ledig)).toEqual({ typ: "ensam" });
    expect(byggSpuFamilj(s1, [], NU, ledig)).toEqual({ typ: "ensam" });
    expect(byggSpuFamilj({ ...s1, spu: null }, [s2], NU, ledig)).toEqual({ typ: "ensam" });
    // En annan SPU i listan räknas inte.
    expect(byggSpuFamilj(s1, [{ ...s2, spu: "66666" }], NU, ledig)).toEqual({ typ: "ensam" });
  });

  it("☠️ en titel som inte förklaras av artikelns egna värden ger ingen grupp", () => {
    expect(byggSpuFamilj(s1, [{ ...s2, namn: "VEVOR Testhink Vit med pump" }], NU, ledig)).toEqual({ typ: "ensam" });
  });

  it("☠️ en rad för funktion som skiljer ger egna sidor, också när den inte är axeln", () => {
    const e1 = spu(1, "Svart", { spec: [["Färg", "Svart"], ["Effekt", "850 W"]], namn: "VEVOR Testhink Svart 850 W" });
    const e2 = spu(2, "Vit", { spec: [["Färg", "Vit"], ["Effekt", "1800 W"]], namn: "VEVOR Testhink Vit 1800 W" });
    expect(byggSpuFamilj(e1, [e2], NU, ledig)).toEqual({ typ: "ej_sammanslagen", skal: "funktion" });
  });

  it("☠️ en oklar axel ger egna sidor", () => {
    const m1 = spu(1, "Svart", { spec: [["Färg", "Svart"], ["Material", "Plast"]], namn: "VEVOR Testhink Plast" });
    const m2 = spu(2, "Svart", { spec: [["Färg", "Svart"], ["Material", "Stål"]], namn: "VEVOR Testhink Stål" });
    expect(byggSpuFamilj(m1, [m2], NU, ledig)).toEqual({ typ: "ej_sammanslagen", skal: "oklar_axel" });
  });

  it("☠️ en medlem vars betyg, specifikation eller recensionsartikel är okänd gör att gruppen väntar", () => {
    expect(byggSpuFamilj(s1, [{ ...s2, specKalla: undefined, spec: [], punkter: [] }], NU, ledig)).toEqual({ typ: "vanta" });
    expect(byggSpuFamilj(s1, [{ ...s2, betyg: undefined }], NU, ledig)).toEqual({ typ: "vanta" });
    // En upptagen medlem utan betyg väntar gruppen inte på.
    expect(byggSpuFamilj(s1, [{ ...s2, betyg: undefined }], NU, (x) => x === sku(2))).toEqual({ typ: "ensam" });
  });

  it("ett medlem som redan sitter på en produkt följer inte med", () => {
    expect(byggSpuFamilj(s1, [s2], NU, (x) => x === sku(2))).toEqual({ typ: "ensam" });
  });

  it("specAxlar: rader som skiljer, grupperade, utan vikt, förpackning och artikelnummer", () => {
    const a = [
      { spec: [["Färg", "Svart"], ["Färgnamn", "Nattsvart"], ["Vikt", "2 kg"], ["Artikelmodellnummer", "A"]] as [string, string][] },
      { spec: [["Färg", "Vit"], ["Färgnamn", "Snövit"], ["Vikt", "3 kg"], ["Artikelmodellnummer", "B"]] as [string, string][] },
    ];
    expect(specAxlar(a)).toEqual({
      axlar: ["Färg"],
      rader: [["Färg", "Färgnamn"]],
      skiljer: ["Färg", "Färgnamn", "Vikt", "Artikelmodellnummer"],
    });
    expect(specAxlar([{ spec: [["Vikt", "2 kg"]] }, { spec: [["Vikt", "3 kg"]] }])).toBe("ingen_axel");
    expect(specAxlar([{ spec: [] }, { spec: [["Färg", "Vit"]] }])).toBe("ingen_axel");
    const tre = (v: string[]): { spec: [string, string][] } => ({ spec: [["A", v[0]], ["B", v[1]], ["C", v[2]]] });
    expect(specAxlar([tre(["1", "1", "1"]), tre(["2", "1", "1"]), tre(["1", "2", "1"]), tre(["1", "1", "2"])])).toBe("for_manga_axlar");
  });

  it("titlarnaForklaras: varje ord som inte är gemensamt ska stå i artikelns egna värden", () => {
    const a = { namn: "VEVOR Hink Svart 10 L", spec: [["Färg", "Svart"]] as [string, string][] };
    const b = { namn: "VEVOR Hink Vit 10 L", spec: [["Färg", "Vit"]] as [string, string][] };
    expect(titlarnaForklaras([a, b], ["Färg"])).toBe(true);
    expect(titlarnaForklaras([a, { ...b, namn: "VEVOR Hink Vit 20 L" }], ["Färg"])).toBe(false);
  });

  it("familjeVarden: egenskapen först, annars specifikationens rad med samma namn", () => {
    expect(familjeVarden({ egenskaper: [["Färg", "Röd"]], spec: [["färg", "Vit"]] }, ["Färg"])).toEqual({ Färg: "Röd" });
    expect(familjeVarden({ egenskaper: [], spec: [["färg ", " Vit "]] }, ["Färg"])).toEqual({ Färg: "Vit" });
    expect(familjeVarden({ egenskaper: [], spec: [] }, ["Färg"])).toEqual({});
  });
});
