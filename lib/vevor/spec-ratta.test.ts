// Specifikationsfliken på VEVOR-utkast som importerades utan specifikation,
// mot en låtsas-Wix vars läsning släpar efter skrivningen.

import { describe, expect, it } from "vitest";
import type { ProductMappingRecord } from "@/lib/store";
import type { WixAnrop } from "@/lib/polish/skrivplan";
import { appendTabSections, buildTabSections } from "@/lib/import/tabs";
import type { Avlasning } from "./lager";
import { bytSpecFlik, korSpec, kontrolleraSpec, planeraSpec, saknadeRader, specRader, SpecFel, type SpecProdukt } from "./spec-ratta";
import { testAvlasning } from "./testsida";

type Obj = Record<string, unknown>;

// Påhittade artikelnummer och id.
const sku = (n: number) => `TESTSKUSPEC${String(n).padStart(6, "0")}`;
const pid = (n: number) => `00000000-0000-4000-8000-0000000005${String(n).padStart(2, "0")}`;
const RAA = "<p>Prestanda</p><p>Denna testvagn klarar terräng &amp; grus.</p>";

const SPEC: [string, string][] = [
  ["Material", "Kolstål"],
  ["Maximal lastkapacitet", "90,7 kg"],
];

// Artikel 1 och 2 länkar till varandra, som en länkad familj.
const lankar = (n: number) =>
  [1, 2].filter((m) => m !== n).map((m) => ({ sku: sku(m), webbId: String(m).padStart(12, "0"), kanKopas: true }));

function avl(n: number, over: Partial<Avlasning> = {}): Avlasning {
  return testAvlasning({ sku: sku(n), spec: SPEC, specKalla: "data", egenskaper: [], syskon: lankar(n), ...over } as Partial<Avlasning>);
}

function enkel(n: number, over: Partial<ProductMappingRecord> = {}): ProductMappingRecord {
  return {
    supplier: "vevor",
    supplierProductId: `vevor:${sku(n)}`,
    wixProductId: pid(n),
    needsAiPolish: true,
    variants: [{ supplierVariantId: sku(n), sku: `FP-test-${n}`, wixVariantId: `v${n}`, choices: {}, costUsd: 30, landedCostSek: 300, grossSek: 399 }],
    ...over,
  } as ProductMappingRecord;
}

function familj(over: Partial<ProductMappingRecord> = {}): ProductMappingRecord {
  return {
    ...enkel(1),
    variants: [1, 2].map((n) => ({
      supplierVariantId: sku(n),
      sku: `FP-test-${n}`,
      wixVariantId: `v${n}`,
      choices: { Längd: `${n * 10} m` },
      costUsd: 30,
      landedCostSek: 300,
      grossSek: 399,
    })),
    ...over,
  } as ProductMappingRecord;
}

const sida = (n: number, over: Partial<SpecProdukt> = {}): SpecProdukt => ({
  id: pid(n),
  revision: "3",
  synlig: false,
  beskrivning: RAA,
  ...over,
});

const karta = (...a: Avlasning[]) => new Map(a.map((x) => [x.sku, x]));

describe("specRader", () => {
  it("en artikel: tabellen och variantens egna värden, som importen", () => {
    const r = specRader(enkel(1), karta(avl(1, { egenskaper: [["Färg", "Svart"]] })));
    expect(r).toEqual([
      { label: "Material", value: "Kolstål" },
      { label: "Maximal lastkapacitet", value: "90,7 kg" },
      { label: "Färg", value: "Svart" },
    ]);
  });

  it("en familj: ankarets tabell utan axlarna, och en axel med samma värde för alla som en rad", () => {
    const a1 = avl(1, { egenskaper: [["Längd", "10 m"], ["Typ", "Sektionell"]], spec: [...SPEC, ["Längd", "10 m"]] });
    const a2 = avl(2, { egenskaper: [["Längd", "20 m"], ["Typ", "Sektionell"]] });
    expect(specRader(familj(), karta(a1, a2))).toEqual([
      { label: "Material", value: "Kolstål" },
      { label: "Maximal lastkapacitet", value: "90,7 kg" },
      { label: "Typ", value: "Sektionell" },
    ]);
  });

  it("en familj med samma SPU: axlarna är mappningens val, och deras rader står inte i fliken", () => {
    const a1 = avl(1, { syskon: [], spec: [...SPEC, ["Längd", "10 m"], ["Vikt", "3 kg"]] });
    const a2 = avl(2, { syskon: [], spec: [...SPEC, ["Längd", "20 m"], ["Vikt", "5 kg"]] });
    expect(specRader(familj(), karta(a1, a2))).toEqual([
      { label: "Material", value: "Kolstål" },
      { label: "Maximal lastkapacitet", value: "90,7 kg" },
      { label: "Vikt", value: "10 m: 3 kg · 20 m: 5 kg" },
    ]);
  });

  it("☠️ en avläsning från före 2026-10-30 räknas inte: en tom specifikation kan vara den gamla läsarens", () => {
    expect(specRader(enkel(1), karta(avl(1, { specKalla: undefined })))).toBe("ej_omlast");
  });

  it("☠️ en familj utan varje artikels avläsning väntar", () => {
    expect(specRader(familj(), karta(avl(1)))).toBe("avlasning_saknas");
    expect(specRader(enkel(1), new Map())).toBe("avlasning_saknas");
  });

  it("☠️ en familj väntar tills varje artikel är läst med den nya läsaren", () => {
    const a1 = avl(1, { egenskaper: [["Längd", "10 m"]] });
    const a2 = avl(2, { egenskaper: [["Längd", "20 m"]], specKalla: undefined });
    expect(specRader(familj(), karta(a1, a2))).toBe("ej_omlast");
  });

  it("en familj: en rad som skiljer visar varje varians värde", () => {
    const a1 = avl(1, { egenskaper: [["Längd", "10 m"]], spec: [...SPEC, ["Vikt", "3 kg"]] });
    const a2 = avl(2, { egenskaper: [["Längd", "20 m"]], spec: [...SPEC, ["Vikt", "5 kg"]] });
    expect(specRader(familj(), karta(a1, a2))).toEqual([
      { label: "Material", value: "Kolstål" },
      { label: "Maximal lastkapacitet", value: "90,7 kg" },
      { label: "Vikt", value: "10 m: 3 kg · 20 m: 5 kg" },
    ]);
  });
});

describe("planeraSpec", () => {
  it("lägger fliken sist och lämnar texten som den står", () => {
    const p = planeraSpec(enkel(1), sida(1), karta(avl(1)));
    expect(p.typ).toBe("ratta");
    if (p.typ !== "ratta") return;
    expect(p.html.startsWith(RAA)).toBe(true);
    expect(p.html).toBe(
      appendTabSections(RAA, buildTabSections({ specs: p.rader, packageContents: [], faq: [], careHtml: null })).html,
    );
    expect(p.html).toContain("<h2>Tekniska specifikationer</h2>");
  });

  it("☠️ en publicerad eller polerad sida rörs inte", () => {
    expect(planeraSpec(enkel(1), sida(1, { synlig: true }), karta(avl(1)))).toEqual({ typ: "hinder", hinder: "publicerad" });
    expect(planeraSpec(enkel(1, { needsAiPolish: false }), sida(1), karta(avl(1)))).toEqual({ typ: "hinder", hinder: "polerad" });
    expect(planeraSpec(enkel(1, { draftStatus: "published" }), sida(1), karta(avl(1)))).toEqual({
      typ: "hinder",
      hinder: "polerad",
    });
  });

  it("en sida med fliken och alla rader är redan rätt; en flik som saknar rader skrivs inte om", () => {
    const rader = specRader(enkel(1), karta(avl(1)));
    if (typeof rader === "string") throw new Error(rader);
    const med = appendTabSections(RAA, buildTabSections({ specs: rader, packageContents: [], faq: [], careHtml: null })).html;
    expect(planeraSpec(enkel(1), sida(1, { beskrivning: med }), karta(avl(1)))).toEqual({ typ: "redan_ratt" });
    const halv = `${RAA}<h2>Tekniska specifikationer</h2><ul><li><strong>Typ:</strong> Sektionell</li></ul>`;
    expect(planeraSpec(enkel(1), sida(1, { beskrivning: halv }), karta(avl(1)))).toEqual({
      typ: "hinder",
      hinder: "flik_utan_rader",
    });
  });

  it("☠️ en familj vars flik visar ankarets värde får fliken utbytt, och texten runt står kvar", () => {
    const a1 = avl(1, { egenskaper: [["Längd", "10 m"]], spec: [...SPEC, ["Vikt", "3 kg"]] });
    const a2 = avl(2, { egenskaper: [["Längd", "20 m"]], spec: [...SPEC, ["Vikt", "5 kg"]] });
    // Så som importen byggde fliken fram till 2026-10-30: ankarets vikt för alla.
    const gammal =
      `${RAA}<h2>Tekniska specifikationer</h2><ul><li><strong>Material:</strong> Kolstål</li>` +
      `<li><strong>Vikt:</strong> 3 kg</li></ul><h2>Vanliga frågor</h2><p>Fråga</p>`;
    const p = planeraSpec(familj(), sida(1, { beskrivning: gammal }), karta(a1, a2));
    expect(p.typ).toBe("byt");
    if (p.typ !== "byt") return;
    expect(p.html.startsWith(`${RAA}<h2>Tekniska specifikationer</h2><ul>`)).toBe(true);
    expect(p.html.endsWith("<h2>Vanliga frågor</h2><p>Fråga</p>")).toBe(true);
    expect(p.html).toContain("10 m: 3 kg · 20 m: 5 kg");
    expect(p.html).not.toContain("<strong>Vikt:</strong> 3 kg</li>");
    // En enskild artikel med en flik som saknar rader rörs fortfarande inte.
    expect(planeraSpec(enkel(1), sida(1, { beskrivning: gammal }), karta(a1)).typ).toBe("hinder");
  });

  it("☠️ två specifikationsflikar på samma sida byts inte", () => {
    const dubbel = `${RAA}<h2>Tekniska specifikationer</h2><ul></ul><h2 class="x">Tekniska specifikationer</h2><ul></ul>`;
    expect(bytSpecFlik(dubbel, "<ul></ul>")).toBeNull();
    expect(bytSpecFlik(RAA, "<ul></ul>")).toBeNull();
    expect(bytSpecFlik(`${RAA}<h2>Tekniska specifikationer</h2><ul><li>x</li></ul>`, "<ul><li>y</li></ul>")).toBe(
      `${RAA}<h2>Tekniska specifikationer</h2><ul><li>y</li></ul>`,
    );
  });

  it("en avläsning utan specifikation också med den nya läsaren ger inget att lägga till", () => {
    expect(planeraSpec(enkel(1), sida(1), karta(avl(1, { spec: [], specKalla: null })))).toEqual({ typ: "tom" });
  });
});

describe("kontrolleraSpec", () => {
  const p = planeraSpec(enkel(1), sida(1), karta(avl(1)));
  if (p.typ !== "ratta") throw new Error("planen");

  it("Wix omskrivna markup räknas som samma text", () => {
    const wixHtml = p.html.replace(/<strong>/g, '<span style="font-weight:bold">').replace(/<\/strong>/g, "</span>");
    expect(kontrolleraSpec(sida(1), sida(1, { beskrivning: wixHtml }), p)).toEqual([]);
  });

  it("☠️ fäller en saknad rad, en ändrad gammal text och en ändrad synlighet", () => {
    const utanRad = p.html.replace("Kolstål", "");
    expect(kontrolleraSpec(sida(1), sida(1, { beskrivning: utanRad }), p)).toEqual(["1 rader saknas"]);
    expect(kontrolleraSpec(sida(1), sida(1, { beskrivning: p.html.replace("terräng", "väg") }), p)).toEqual([
      "den gamla texten ändrades",
    ]);
    expect(kontrolleraSpec(sida(1), sida(1, { beskrivning: p.html, synlig: true }), p)).toEqual([
      "synligheten ändrades",
    ]);
    expect(saknadeRader(RAA, p.rader)).toHaveLength(2);
  });

  it("☠️ en utbytt flik ska ge exakt planens text: en kvarlämnad gammal rad fäller", () => {
    const a1 = avl(1, { egenskaper: [["Längd", "10 m"]], spec: [...SPEC, ["Vikt", "3 kg"]] });
    const a2 = avl(2, { egenskaper: [["Längd", "20 m"]], spec: [...SPEC, ["Vikt", "5 kg"]] });
    const gammal = `${RAA}<h2>Tekniska specifikationer</h2><ul><li><strong>Vikt:</strong> 3 kg</li></ul>`;
    const b = planeraSpec(familj(), sida(1, { beskrivning: gammal }), karta(a1, a2));
    if (b.typ !== "byt") throw new Error("planen");
    expect(kontrolleraSpec(sida(1, { beskrivning: gammal }), sida(1, { beskrivning: b.html }), b)).toEqual([]);
    const kvar = b.html.replace("</ul>", "<li><strong>Vikt:</strong> 3 kg</li></ul>");
    expect(kontrolleraSpec(sida(1, { beskrivning: gammal }), sida(1, { beskrivning: kvar }), b)).toEqual([
      "texten är inte planens",
    ]);
  });
});

// ── Låtsas-Wix ──────────────────────────────────────────────────────────────

interface Lage {
  produkter: Map<string, { revision: number; visible: boolean; plainDescription: string }>;
  /** Läsningar efter en skrivning som fortfarande svarar med det gamla läget. */
  slapar: number;
  gammal: Map<string, { revision: number; visible: boolean; plainDescription: string }>;
  patchar: Obj[];
  sokningar: number;
  /** Svara med en produkt utanför frågan i sökningen. */
  utanfor?: boolean;
}

function lage(...n: number[]): Lage {
  const produkter = new Map(n.map((i) => [pid(i), { revision: 3, visible: false, plainDescription: RAA }]));
  return { produkter, slapar: 0, gammal: new Map(), patchar: [], sokningar: 0 };
}

function wixFor(l: Lage, slap = 0): WixAnrop {
  return async (metod, sokvag, kropp) => {
    const som = (id: string, p: { revision: number; visible: boolean; plainDescription: string }) => ({
      id,
      revision: String(p.revision),
      visible: p.visible,
      plainDescription: p.plainDescription,
    });
    if (metod === "POST" && sokvag === "/stores/v3/products/search") {
      l.sokningar++;
      const k = kropp as { search: { filter: { id: { $in: string[] } } }; fields: string[] };
      expect(k.fields).toEqual(["PLAIN_DESCRIPTION"]);
      const ut = k.search.filter.id.$in.filter((id) => l.produkter.has(id)).map((id) => som(id, l.produkter.get(id)!));
      if (l.utanfor) ut.push(som(pid(99), { revision: 1, visible: false, plainDescription: RAA }));
      return { products: ut };
    }
    const m = /^\/stores\/v3\/products\/([^/?]+)/.exec(sokvag);
    const id = m ? decodeURIComponent(m[1]) : "";
    const p = l.produkter.get(id);
    if (!p) throw new Error("Wix 404: finns inte");
    if (metod === "GET") {
      expect(sokvag).toContain("fields=PLAIN_DESCRIPTION");
      if (l.slapar > 0 && l.gammal.has(id)) {
        l.slapar--;
        return { product: som(id, l.gammal.get(id)!) };
      }
      return { product: som(id, p) };
    }
    if (metod === "PATCH") {
      const k = kropp as { product: { revision: string; plainDescription: string }; fieldMask: { paths: string[] } };
      l.patchar.push(k as unknown as Obj);
      expect(k.fieldMask.paths).toEqual(["plainDescription"]);
      if (Number(k.product.revision) !== p.revision) throw new Error("Wix 409: INVALID_REVISION");
      l.gammal.set(id, { ...p });
      l.slapar = slap;
      p.plainDescription = k.product.plainDescription;
      p.revision++;
      return { product: { id, revision: String(p.revision) } };
    }
    throw new Error(`oväntat anrop ${metod} ${sokvag}`);
  };
}

const ingenVantan = async () => {};

describe("korSpec", () => {
  it("planen är torr: den räknar och skriver ingenting", async () => {
    const l = lage(1, 2, 3);
    const svar = await korSpec(
      {
        wix: wixFor(l),
        mappningar: async () => [enkel(1), enkel(2, { needsAiPolish: false }), enkel(3)],
        avlasningar: async () => karta(avl(1), avl(3, { specKalla: undefined })),
        vanta: ingenVantan,
      },
      { dryRun: true, bekrafta: null, budgetMs: 200_000 },
    );
    // Den polerade raden räknas inte ens som utkast.
    expect(svar).toMatchObject({ utkast: 2, attRatta: 1, kvar: 1, stoppadAv: "klart", idn: [pid(1)] });
    expect(svar.hinder.ej_omlast).toBe(1);
    expect(l.patchar).toHaveLength(0);
  });

  it("skarpt: skriver fliken, läser om tills revisionen gått fram och kontrollerar sidan", async () => {
    const l = lage(1, 2);
    const svar = await korSpec(
      {
        wix: wixFor(l, 2),
        mappningar: async () => [enkel(1), enkel(2)],
        avlasningar: async () => karta(avl(1), avl(2)),
        vanta: ingenVantan,
      },
      { dryRun: false, bekrafta: 2, budgetMs: 200_000 },
    );
    expect(svar).toMatchObject({ skrivna: 2, stoppadAv: "klart", fel: null });
    expect(l.patchar).toHaveLength(2);
    for (const n of [1, 2]) {
      const p = l.produkter.get(pid(n))!;
      expect(p.plainDescription.startsWith(RAA)).toBe(true);
      expect(p.plainDescription).toContain("<h2>Tekniska specifikationer</h2>");
      expect(p.visible).toBe(false);
    }
    // En omkörning har ingenting att göra.
    const igen = await korSpec(
      { wix: wixFor(l), mappningar: async () => [enkel(1), enkel(2)], avlasningar: async () => karta(avl(1), avl(2)), vanta: ingenVantan },
      { dryRun: true, bekrafta: null, budgetMs: 200_000 },
    );
    expect(igen).toMatchObject({ attRatta: 0, redanRatt: 2 });
  });

  it("☠️ skarpt: en familjs felaktiga flik byts ut och läses tillbaka; en omkörning har inget att göra", async () => {
    const l = lage(1);
    const gammal = `${RAA}<h2>Tekniska specifikationer</h2><ul><li><strong>Vikt:</strong> 3 kg</li></ul>`;
    l.produkter.get(pid(1))!.plainDescription = gammal;
    const avlasningar = async () =>
      karta(
        avl(1, { egenskaper: [["Längd", "10 m"]], spec: [...SPEC, ["Vikt", "3 kg"]] }),
        avl(2, { egenskaper: [["Längd", "20 m"]], spec: [...SPEC, ["Vikt", "5 kg"]] }),
      );
    const deps = { wix: wixFor(l, 1), mappningar: async () => [familj()], avlasningar, vanta: ingenVantan };
    const plan = await korSpec(deps, { dryRun: true, bekrafta: null, budgetMs: 200_000 });
    expect(plan).toMatchObject({ attRatta: 1, attByta: 1 });
    const svar = await korSpec(deps, { dryRun: false, bekrafta: 1, budgetMs: 200_000 });
    expect(svar).toMatchObject({ skrivna: 1, stoppadAv: "klart", fel: null });
    const p = l.produkter.get(pid(1))!;
    expect(p.plainDescription.startsWith(RAA)).toBe(true);
    expect(p.plainDescription).toContain("10 m: 3 kg · 20 m: 5 kg");
    expect(p.plainDescription.match(/Tekniska specifikationer/g)).toHaveLength(1);
    const igen = await korSpec({ ...deps, wix: wixFor(l) }, { dryRun: true, bekrafta: null, budgetMs: 200_000 });
    expect(igen).toMatchObject({ attRatta: 0, redanRatt: 1 });
  });

  it("en annan skrivning på sidan (409) ger en ny läsning och ett nytt försök", async () => {
    const l = lage(1);
    const wix = wixFor(l);
    let synk = 1;
    const svar = await korSpec(
      {
        wix: async (metod, sokvag, kropp) => {
          // Synken skriver lager och pris mellan vår läsning och vår skrivning.
          if (metod === "PATCH" && synk-- > 0) l.produkter.get(pid(1))!.revision++;
          return wix(metod, sokvag, kropp);
        },
        mappningar: async () => [enkel(1)],
        avlasningar: async () => karta(avl(1)),
        vanta: ingenVantan,
      },
      { dryRun: false, bekrafta: 1, budgetMs: 200_000 },
    );
    expect(svar).toMatchObject({ skrivna: 1, stoppadAv: "klart" });
    expect(l.patchar).toHaveLength(2);
  });

  it("☠️ en skarp körning kräver bekrafta, och en plan som växt skriver ingenting", async () => {
    const deps = {
      wix: wixFor(lage(1, 2)),
      mappningar: async () => [enkel(1), enkel(2)],
      avlasningar: async () => karta(avl(1), avl(2)),
      vanta: ingenVantan,
    };
    await expect(korSpec(deps, { dryRun: false, bekrafta: null, budgetMs: 200_000 })).rejects.toBeInstanceOf(SpecFel);
    await expect(korSpec(deps, { dryRun: false, bekrafta: 1, budgetMs: 200_000 })).rejects.toThrow(/fler än bekrafta/);
  });

  it("☠️ en sida som publicerats mellan planen och skrivningen rörs inte, och körningen stannar", async () => {
    const l = lage(1);
    const wix = wixFor(l);
    let sokt = false;
    const svar = await korSpec(
      {
        wix: async (metod, sokvag, kropp) => {
          const r = await wix(metod, sokvag, kropp);
          if (metod === "POST" && !sokt) {
            sokt = true;
            l.produkter.get(pid(1))!.visible = true;
          }
          return r;
        },
        mappningar: async () => [enkel(1)],
        avlasningar: async () => karta(avl(1)),
        vanta: ingenVantan,
      },
      { dryRun: false, bekrafta: 1, budgetMs: 200_000 },
    );
    expect(svar).toMatchObject({ skrivna: 0, stoppadAv: "fel", fel: { id: pid(1), avvikelser: ["planen ändrades: publicerad"] } });
    expect(l.patchar).toHaveLength(0);
  });

  it("☠️ en läsning som aldrig når den skrivna revisionen stoppar körningen", async () => {
    const l = lage(1, 2);
    const svar = await korSpec(
      { wix: wixFor(l, 99), mappningar: async () => [enkel(1), enkel(2)], avlasningar: async () => karta(avl(1), avl(2)), vanta: ingenVantan },
      { dryRun: false, bekrafta: 2, budgetMs: 200_000 },
    );
    expect(svar).toMatchObject({ skrivna: 0, stoppadAv: "fel", kvar: 2, fel: { avvikelser: ["revisionen gick inte fram"] } });
  });

  it("☠️ en sökning som svarar med en sida utanför frågan avbryter allt", async () => {
    const l = lage(1);
    l.utanfor = true;
    await expect(
      korSpec(
        { wix: wixFor(l), mappningar: async () => [enkel(1)], avlasningar: async () => karta(avl(1)), vanta: ingenVantan },
        { dryRun: true, bekrafta: null, budgetMs: 200_000 },
      ),
    ).rejects.toBeInstanceOf(SpecFel);
  });

  it("☠️ svaret bär bara Wix-id och antal, aldrig artikelnummer", async () => {
    const svar = await korSpec(
      { wix: wixFor(lage(1)), mappningar: async () => [enkel(1)], avlasningar: async () => karta(avl(1)), vanta: ingenVantan },
      { dryRun: true, bekrafta: null, budgetMs: 200_000 },
    );
    expect(JSON.stringify(svar)).not.toContain("TESTSKU");
  });
});
