// Skrivplanen: poleringens Wix-skrivning på servern i stället för i chatten.
//
// Testerna låser det som stegen i steg1–5.js redan hade lärt sig den dyra
// vägen: fältmaskerna, att media skrivs ensam utan `media.main`, att SKU:n
// skrivs sist ur en färsk GET med `visible` och `options`, att ett okänt
// kategorinamn inte skriver någonting, och att återläsningen bevisar att
// fälten fanns innan en nolla tolkas. Plus det nya: planen får aldrig bära
// artikelnummerform, och felet citerar aldrig träffen.

import { execFileSync } from "node:child_process";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import {
  ARTNR,
  artikelnummerformer,
  fnv1a64,
  redigera,
  type Skrivplan,
  type SkrivProdukt,
  stegKategorier,
  stegMedia,
  stegSku,
  stegText,
  stegVerifiera,
  valideraPlan,
  type WixAnrop,
  WIX_STORES_APP_ID,
} from "./skrivplan";

const HTML = "<p>Hej.</p>";

function produkt(over: Partial<SkrivProdukt> = {}): SkrivProdukt {
  return {
    kort: "1a2b3c4d",
    pid: "1a2b3c4d-0000-4000-8000-000000000001",
    namn: "Testbord i ek – 40 × 30 cm",
    slug: "testbord-ek",
    html: HTML,
    seoTitel: "Testbord i ek | Fyndplats",
    seoBesk: "Ett testbord i ek, 40 × 30 cm.",
    media: [
      { id: `b379ce_${"0".repeat(32)}~mv2.jpg`, altText: "Testbordet framifrån" },
      { id: `b379ce_${"1".repeat(32)}~mv2.jpg`, altText: "Måttbild: 40 × 30 cm" },
    ],
    kat: ["Hem & Inredning"],
    sku: "FP-testbord-ek",
    variantId: "2b3c4d5e-0000-4000-8000-000000000002",
    textHash: fnv1a64(HTML),
    textTecken: HTML.length,
    ...over,
  };
}

function plan(produkter: SkrivProdukt[] = [produkt()]): Skrivplan {
  return { runda: "runda-t1-test", produkter };
}

interface Anrop {
  metod: string;
  sokvag: string;
  kropp?: unknown;
}

/** En låtsas-Wix som svarar ur en handläggare och minns varje anrop. */
function fakeWix(svara: (a: Anrop) => unknown): { wix: WixAnrop; anrop: Anrop[] } {
  const anrop: Anrop[] = [];
  const wix: WixAnrop = async (metod, sokvag, kropp) => {
    const a = { metod, sokvag, kropp };
    anrop.push(a);
    const s = svara(a);
    if (s instanceof Error) throw s;
    return s;
  };
  return { wix, anrop };
}

const KATEGORIER = {
  categories: [
    { id: "kat-hem", name: "Hem & Inredning" },
    { id: "kat-mobler", name: "Möbler" },
  ],
};

describe("fnv1a64", () => {
  it("räknar samma FNV-1a 64 som gatelib.fnv och steg5.js", () => {
    expect(fnv1a64("")).toBe("cbf29ce484222325");
    expect(fnv1a64("a")).toBe("af63dc4c8601ec8c");
    // UTF-8, inte UTF-16: å, ö, × och tankstreck måste bli rätt byte.
    expect(fnv1a64("Gnistskydd för öppen spis – 122 × 75 cm")).toBe("9b57c5019770eba5");
  });
});

describe("valideraPlan", () => {
  it("godtar en korrekt plan", () => {
    expect("plan" in valideraPlan(plan())).toBe(true);
  });

  it("vägrar fler än 20 produkter", () => {
    const många = Array.from({ length: 21 }, (_, i) => {
      const hex = i.toString(16).padStart(8, "0");
      return produkt({ kort: hex, pid: `${hex}-0000-4000-8000-000000000001`, slug: `bord-${i}`, sku: `FP-bord-${i}` });
    });
    const v = valideraPlan(plan(många));
    expect("fel" in v && v.fel.join(" ")).toMatch(/högst 20/);
  });

  it("vägrar pid som inte börjar med kort, dubbletter och fel SKU-form", () => {
    const v = valideraPlan(plan([
      produkt({ pid: "ffffffff-0000-4000-8000-000000000001" }),
      produkt(),
      produkt({ kort: "2b3c4d5e", pid: "2b3c4d5e-0000-4000-8000-000000000009", slug: "annat", sku: "fp-Versaler" }),
    ]));
    expect("fel" in v).toBe(true);
    const fel = "fel" in v ? v.fel.join("\n") : "";
    expect(fel).toMatch(/pid börjar inte med kort/);
    expect(fel).toMatch(/förekommer två gånger/);
    expect(fel).toMatch(/sku har fel form/);
  });

  it("vägrar brödtext med avslutande radbrytning — den skickas utan", () => {
    const v = valideraPlan(plan([produkt({ html: `${HTML}\n` })]));
    expect("fel" in v && v.fel.join(" ")).toMatch(/radbrytning/);
  });

  it("vägrar artikelnummerform i vilket kundfält som helst, utan att citera träffen", () => {
    // Syntetiskt nummer, aldrig ett riktigt.
    const syntetiskt = "999-000Z00ZZ";
    for (const over of [
      { html: `<p>Referens ${syntetiskt}.</p>` },
      { namn: `Bord ${syntetiskt}` },
      { media: [{ id: `b379ce_${"0".repeat(32)}~mv2.jpg`, altText: `Bild ${syntetiskt}` }] },
    ]) {
      const v = valideraPlan(plan([produkt(over)]));
      expect("fel" in v).toBe(true);
      const fel = "fel" in v ? v.fel.join("\n") : "";
      expect(fel).toMatch(/artikelnummerform/);
      expect(fel).not.toContain(syntetiskt);
    }
  });

  it("släpper mått och spänningar som bara ser ut som artikelnummer", () => {
    expect(artikelnummerformer("höjd 150-190 cm, 230-240V, 12-24V och USB-C")).toBe(0);
    expect(artikelnummerformer("ref 999-000Z00ZZ")).toBe(1);
  });
});

describe("stegText", () => {
  it("torrkörningen läser men skriver aldrig", async () => {
    const { wix, anrop } = fakeWix(() => ({ product: { revision: "3", visible: false } }));
    const u = await stegText(plan(), wix, true);
    expect(u.ok).toBe(true);
    expect(anrop.map((a) => a.metod)).toEqual(["GET"]);
  });

  it("skriver namn, slug, brödtext, två SEO-taggar, tomma nyckelord och synlighet med färsk revision", async () => {
    const { wix, anrop } = fakeWix((a) =>
      a.metod === "GET"
        ? { data: { product: { revision: "7", visible: false } } } // tolerant läsning av .data
        : { product: { revision: "8" } },
    );
    const u = await stegText(plan(), wix, false);
    expect(u.ok).toBe(true);
    const patch = anrop.find((a) => a.metod === "PATCH");
    expect(patch?.sokvag).toBe("/stores/v3/products/1a2b3c4d-0000-4000-8000-000000000001");
    expect(patch?.kropp).toEqual({
      product: {
        revision: "7",
        name: "Testbord i ek – 40 × 30 cm",
        slug: "testbord-ek",
        plainDescription: HTML,
        visible: true,
        seoData: {
          tags: [
            { type: "title", children: "Testbord i ek | Fyndplats" },
            { type: "meta", props: { name: "description", content: "Ett testbord i ek, 40 × 30 cm." } },
          ],
          settings: { keywords: [] },
        },
      },
      fieldMask: { paths: ["name", "slug", "plainDescription", "visible", "seoData"] },
    });
    expect(u.rader[0]).toMatchObject({ ok: true, revisionFore: "7", revisionEfter: "8" });
  });

  it("ett fel på en produkt stoppar inte nästa, och syns i utfallet", async () => {
    const andra = produkt({ kort: "2b3c4d5e", pid: "2b3c4d5e-0000-4000-8000-000000000001", slug: "andra", sku: "FP-andra" });
    const { wix } = fakeWix((a) => {
      if (a.metod === "GET") return { product: { revision: "1" } };
      return a.sokvag.includes("1a2b3c4d") ? new Error("Wix 409: INVALID_REVISION") : { product: { revision: "2" } };
    });
    const u = await stegText(plan([produkt(), andra]), wix, false);
    expect(u.ok).toBe(false);
    expect(u.sammanfattning).toBe("1 av 2 skrivna");
    expect(u.rader[0]).toMatchObject({ ok: false, fel: expect.stringContaining("INVALID_REVISION") });
  });

  it("☠️ ett Wix-fel som citerar ett artikelnummer tvättas innan det lämnar steget", async () => {
    // Syntetiskt nummer. Planen kan inte bära formen, men ett felsvar kan citera
    // data vi aldrig skickade — och svaret går till en publik logg.
    const { wix } = fakeWix((a) =>
      a.metod === "GET" ? { product: { revision: "1" } } : new Error('Wix 400: {"sku":"FP-999-000Z00ZZ-alt"}'),
    );
    const u = await stegText(plan(), wix, false);
    expect(JSON.stringify(u)).not.toContain("999-000Z00ZZ");
    expect(u.rader[0].fel).toContain("‹REDIGERAT›");
  });
});

describe("ARTNR", () => {
  const GRINDAR = join(dirname(fileURLToPath(import.meta.url)), "..", "..", "tools", "polish-gates");

  it("☠️ är gatelibs ARTNR tecken för tecken — samma form som läcktestet kör", () => {
    const python = execFileSync(
      "python3",
      ["-c", `import sys; sys.path.insert(0, ${JSON.stringify(GRINDAR)}); from gatelib import ARTNR; sys.stdout.write(ARTNR)`],
      { encoding: "utf-8" },
    );
    expect(ARTNR.source).toBe(python);
  });

  it("fäller varje form läcktestet fäller, även den formsvepet släpper", () => {
    // Syntetiska nummer, ett per form. `999-000CM` är hålet: formsvepet släpper
    // det som ett mått, men gatelib fäller det — och då ska rutten också göra det.
    for (const s of ["99Z-000Z00ZZ", "Z99-000Z00ZZ", "999-000Z00ZZ", "99Z-000", "999-000CM"]) {
      expect(artikelnummerformer(`ref ${s} här`)).toBe(1);
      expect(redigera(`ref ${s} här`)).toBe("ref ‹REDIGERAT› här");
    }
  });

  it("släpper spänning och effekt, som gatelib också gör", () => {
    expect(artikelnummerformer("220-240V, 850-1000W")).toBe(0);
  });
});

describe("redigera", () => {
  it("byter bara artikelnummerformer och lämnar mått, spänningar och id orörda", () => {
    expect(redigera("ref 999-000Z00ZZ, höjd 150-190 cm, 230-240V")).toBe("ref ‹REDIGERAT›, höjd 150-190 cm, 230-240V");
    expect(redigera("1a2b3c4d-0000-4000-8000-000000000001")).toBe("1a2b3c4d-0000-4000-8000-000000000001");
  });
});

describe("stegMedia", () => {
  it("skriver bildlistan ensam, utan media.main", async () => {
    const { wix, anrop } = fakeWix((a) => (a.metod === "GET" ? { product: { revision: "4" } } : { product: { revision: "5" } }));
    await stegMedia(plan(), wix, false);
    const patch = anrop.find((a) => a.metod === "PATCH");
    expect(patch?.kropp).toEqual({
      product: { revision: "4", media: { itemsInfo: { items: produkt().media } } },
      fieldMask: { paths: ["media"] },
    });
  });
});

describe("stegKategorier", () => {
  it("ett okänt kategorinamn skriver ingenting alls", async () => {
    const { wix, anrop } = fakeWix(() => KATEGORIER);
    const u = await stegKategorier(plan([produkt({ kat: ["Hem & Inredning", "Finns inte"] })]), wix, false);
    expect(u.ok).toBe(false);
    expect(u.avbrutet).toMatch(/Finns inte/);
    expect(anrop.some((a) => a.sokvag.includes("add-items"))).toBe(false);
  });

  it("kopplar per kategori med Wix Stores app-id, och ALREADY_EXISTS räknas som kopplad", async () => {
    const andra = produkt({ kort: "2b3c4d5e", pid: "2b3c4d5e-0000-4000-8000-000000000001", slug: "andra", sku: "FP-andra", kat: ["Hem & Inredning", "Möbler"] });
    const { wix, anrop } = fakeWix((a) => {
      if (a.sokvag.endsWith("/query")) return KATEGORIER;
      if (a.sokvag.includes("kat-hem")) {
        return {
          results: [
            { itemMetadata: { item: { catalogItemId: produkt().pid }, success: true } },
            // id saknas i raden — härleds ur originalIndex mot det vi skickade
            { itemMetadata: { originalIndex: 1, success: false, error: { code: "ALREADY_EXISTS" } } },
          ],
        };
      }
      return { results: [{ itemMetadata: { originalIndex: 0, success: true } }] };
    });
    const u = await stegKategorier(plan([produkt(), andra]), wix, false);
    expect(u.ok).toBe(true);
    expect(u.sammanfattning).toBe("3 av 3 rader kopplade");
    const hem = anrop.find((a) => a.sokvag === "/categories/v1/bulk/categories/kat-hem/add-items");
    expect(hem?.kropp).toEqual({
      items: [
        { catalogItemId: produkt().pid, appId: WIX_STORES_APP_ID },
        { catalogItemId: andra.pid, appId: WIX_STORES_APP_ID },
      ],
      treeReference: { appNamespace: "@wix/stores" },
    });
    expect(u.rader.find((r) => r.kort === "2b3c4d5e" && r.kat === "Hem & Inredning")).toMatchObject({ ok: true, redan: true });
  });

  it("en rad utan utfall är ett fel, inte en tyst framgång", async () => {
    const { wix } = fakeWix((a) => (a.sokvag.endsWith("/query") ? KATEGORIER : { results: [] }));
    const u = await stegKategorier(plan(), wix, false);
    expect(u.ok).toBe(false);
    expect(u.rader[0]).toMatchObject({ ok: false, fel: "inget utfall för raden" });
  });
});

describe("stegSku", () => {
  const variant = {
    id: "2b3c4d5e-0000-4000-8000-000000000002",
    visible: true,
    sku: "FP-gammal-tysk-sku",
    choices: [],
    price: { actualPrice: { amount: "819" } },
    physicalProperties: {},
  };

  it("sätter bara sku, behåller resten av varianten och skickar visible och options i masken", async () => {
    const { wix, anrop } = fakeWix((a) =>
      a.metod === "GET"
        ? { product: { revision: "9", visible: true, options: [{ name: "Färg" }], variantsInfo: { variants: [variant] } } }
        : { product: { revision: "10" } },
    );
    const u = await stegSku(plan(), wix, false);
    expect(u.ok).toBe(true);
    expect(anrop[0].sokvag).toContain("fields=VARIANT_OPTION_CHOICE_NAMES");
    const patch = anrop.find((a) => a.metod === "PATCH");
    expect(patch?.kropp).toEqual({
      product: {
        revision: "9",
        visible: true,
        variantsInfo: { variants: [{ ...variant, sku: "FP-testbord-ek" }] },
        options: [{ name: "Färg" }],
      },
      fieldMask: { paths: ["variantsInfo", "visible", "options"] },
    });
    // Den gamla SKU:n kan bära leverantörens nummer och skrivs aldrig ut.
    expect(JSON.stringify(u)).not.toContain("FP-gammal-tysk-sku");
  });

  it("vägrar flera varianter och ett variant-id som inte stämmer med planen", async () => {
    for (const variants of [[variant, { ...variant, id: "x" }], [{ ...variant, id: "3c4d5e6f-0000-4000-8000-000000000003" }]]) {
      const { wix, anrop } = fakeWix(() => ({ product: { revision: "1", visible: true, variantsInfo: { variants } } }));
      const u = await stegSku(plan(), wix, false);
      expect(u.ok).toBe(false);
      expect(anrop.some((a) => a.metod === "PATCH")).toBe(false);
    }
  });

  it("torrkörningen skriver ingenting", async () => {
    const { wix, anrop } = fakeWix(() => ({ product: { revision: "1", visible: true, variantsInfo: { variants: [variant] } } }));
    const u = await stegSku(plan(), wix, true);
    expect(u.ok).toBe(true);
    expect(anrop.some((a) => a.metod === "PATCH")).toBe(false);
  });
});

describe("stegVerifiera", () => {
  function lagrad(over: Record<string, unknown> = {}) {
    const p = produkt();
    return {
      product: {
        revision: "12",
        name: p.namn,
        slug: p.slug,
        visible: true,
        plainDescription: HTML,
        seoData: {
          tags: [
            { type: "title", children: p.seoTitel },
            { type: "meta", props: { name: "description", content: p.seoBesk } },
          ],
          settings: { keywords: [] },
        },
        media: { itemsInfo: { items: p.media } },
        directCategoriesInfo: { categories: [{ id: "kat-hem" }, { id: "all-products" }] },
        variantsInfo: {
          variants: [{ id: p.variantId, sku: p.sku, visible: true, price: { actualPrice: { amount: "819" } } }],
        },
        inventory: { availabilityStatus: "IN_STOCK" },
        ...over,
      },
    };
  }

  it("godkänner en produkt där allt stämmer", async () => {
    const { wix } = fakeWix((a) => (a.sokvag.endsWith("/query") ? KATEGORIER : lagrad()));
    const u = await stegVerifiera(plan(), wix);
    expect(u.ok).toBe(true);
    expect(u.rader[0]).toMatchObject({ ok: true, bilder: 2, kategorier: 2, pris: "819", lager: "IN_STOCK" });
  });

  it("ett saknat fält i projektionen är inte samma sak som tom text", async () => {
    const { wix } = fakeWix((a) => (a.sokvag.endsWith("/query") ? KATEGORIER : lagrad({ plainDescription: undefined })));
    const u = await stegVerifiera(plan(), wix);
    expect(u.rader[0]).toMatchObject({ ok: false, fel: expect.stringContaining("saknas i projektionen") });
  });

  it("namnger varje kontroll som faller", async () => {
    const p = produkt();
    const fel = lagrad({
      media: { itemsInfo: { items: [p.media[0], { ...p.media[1], altText: "Annan text" }] } },
      seoData: { tags: [{ type: "title", children: p.seoTitel }], settings: { keywords: [] } },
    });
    const { wix } = fakeWix((a) => (a.sokvag.endsWith("/query") ? KATEGORIER : fel));
    const u = await stegVerifiera(plan(), wix);
    expect(u.ok).toBe(false);
    expect(u.rader[0].fel).toBe("seo, media");
  });
});
