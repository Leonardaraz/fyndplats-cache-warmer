// Repot kör node --test (se package.json), inte vitest — och en testfil måste
// importera sin syskonmodul MED .ts-ändelse för att köraren ska hitta den.
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import {
  dodaKategorilankar,
  dodaLankRader,
  dodaProduktlankar,
  kategoriSlugsIInnehall,
  produktSlugsIInnehall,
} from "./blog-product-links.ts";

const LEVANDE = new Set(["lampa", "bord", "stol"]);

describe("produktSlugsIInnehall", () => {
  it("hittar markdown-länkar", () => {
    assert.deepEqual(produktSlugsIInnehall("se vår [lampa](/produkt/lampa) i butiken"), ["lampa"]);
  });

  it("hittar renderade HTML-länkar", () => {
    assert.deepEqual(produktSlugsIInnehall('<a href="/produkt/bord">Bord</a>'), ["bord"]);
  });

  it("hittar produkt-embeds (bild inuti länk)", () => {
    const md = '[![Namn](https://cdn/bild.jpg)](/produkt/stol "Se i butiken →")';
    assert.deepEqual(produktSlugsIInnehall(md), ["stol"]);
  });

  it("tar inte med query eller fragment i sluggen", () => {
    assert.deepEqual(produktSlugsIInnehall("/produkt/lampa?utm=x /produkt/bord#recensioner"), ["lampa", "bord"]);
  });

  it("stannar vid tecken som inte får ingå i en slug", () => {
    // Sluggen får bara innehålla a–z, 0–9 och bindestreck. Å/Ä/Ö och versaler
    // avslutar matchningen — annars hade en felskriven länk gett en påhittad slug.
    assert.deepEqual(produktSlugsIInnehall("/produkt/lampa-Å-fel"), ["lampa-"]);
  });

  it("ger tom lista när inga produktlänkar finns", () => {
    assert.deepEqual(produktSlugsIInnehall("bara text och [en kategori](/kategori/belysning)"), []);
  });

  it("returnerar varje förekomst, inte unika", () => {
    assert.deepEqual(produktSlugsIInnehall("/produkt/lampa och /produkt/lampa igen"), ["lampa", "lampa"]);
  });
});

describe("dodaProduktlankar", () => {
  it("flaggar en länk till en slug som inte finns", () => {
    const ut = dodaProduktlankar([{ slug: "guide", innehall: "[x](/produkt/borttagen)" }], LEVANDE);
    assert.deepEqual(ut, [{ artikel: "guide", slug: "borttagen", antal: 1 }]);
  });

  it("släpper igenom levande länkar", () => {
    const ut = dodaProduktlankar([{ slug: "guide", innehall: "[x](/produkt/lampa)" }], LEVANDE);
    assert.deepEqual(ut, []);
  });

  it("räknar flera förekomster av samma döda slug som EN rad", () => {
    // Projektorduken låg på två ställen i samma artikel. Två rader i rapporten
    // för samma trasiga länk hade sett ut som två problem.
    const ut = dodaProduktlankar(
      [{ slug: "guide", innehall: "/produkt/borta text /produkt/borta" }],
      LEVANDE,
    );
    assert.deepEqual(ut, [{ artikel: "guide", slug: "borta", antal: 2 }]);
  });

  it("håller isär artiklar", () => {
    const ut = dodaProduktlankar(
      [
        { slug: "b-artikel", innehall: "/produkt/borta" },
        { slug: "a-artikel", innehall: "/produkt/aven-borta" },
      ],
      LEVANDE,
    );
    assert.deepEqual(ut.map((x) => x.artikel), ["a-artikel", "b-artikel"], "sorterad på artikel");
  });

  it("TOM KATALOG ger inga fynd — annars rapporteras allt som dött", () => {
    // Går uppslaget av katalogen fel (nätfel, tom Wix-svar) ska rapporten tiga,
    // inte larma om varenda länk på sajten.
    const ut = dodaProduktlankar([{ slug: "guide", innehall: "/produkt/lampa" }], new Set());
    assert.deepEqual(ut, []);
  });

  it("artikel utan produktlänkar ger inget", () => {
    assert.deepEqual(dodaProduktlankar([{ slug: "guide", innehall: "bara text" }], LEVANDE), []);
  });

  it("ordningen är stabil mellan körningar", () => {
    const artiklar = [{ slug: "g", innehall: "/produkt/zzz /produkt/aaa" }];
    const a = dodaProduktlankar(artiklar, LEVANDE);
    const b = dodaProduktlankar(artiklar, LEVANDE);
    assert.deepEqual(a, b);
    assert.deepEqual(a.map((x) => x.slug), ["aaa", "zzz"]);
  });
});

describe("☠️ kategorilänkar i bloggen (2026-11-11)", () => {
  const KATEGORIER = new Set(["belysning", "soffbord"]);

  it("hittar kategorilänkar i markdown och HTML, utan fråga och ankare", () => {
    assert.deepEqual(kategoriSlugsIInnehall("[Belysning](/kategori/belysning) och <a href=\"/kategori/soffbord?x=1#topp\">x</a>"), [
      "belysning",
      "soffbord",
    ]);
    assert.deepEqual(kategoriSlugsIInnehall("bara [en produkt](/produkt/lampa)"), []);
  });

  it("bara våra länkar: en annan sajts /kategori/ räknas inte, vår egen hela adress gör det", () => {
    assert.deepEqual(kategoriSlugsIInnehall("[källa](https://www.exempel.se/kategori/leksaker)"), []);
    assert.deepEqual(kategoriSlugsIInnehall('<a href="https://exempel.se/butik/kategori/lampor">x</a>'), []);
    assert.deepEqual(kategoriSlugsIInnehall("[x](https://www.fyndplats.se/kategori/belysning)"), ["belysning"]);
    assert.deepEqual(kategoriSlugsIInnehall("[x](https://fyndplats.se/kategori/soffbord)"), ["soffbord"]);
    assert.deepEqual(kategoriSlugsIInnehall("adressen /kategori/belysning i löptext"), ["belysning"]);
  });

  it("en tom, omdöpt eller borttagen kategori rapporteras, en levande inte", () => {
    const ut = dodaKategorilankar(
      [
        { slug: "halloweenguide", innehall: "Hela sortimentet finns under [Halloweendekoration](/kategori/halloweendekoration)." },
        { slug: "lampguide", innehall: "[Belysning](/kategori/belysning)" },
      ],
      KATEGORIER,
    );
    assert.deepEqual(ut, [{ artikel: "halloweenguide", slug: "halloweendekoration", antal: 1 }]);
  });

  it("produktlänkar räknas inte som kategorier, och tvärtom", () => {
    const artiklar = [{ slug: "g", innehall: "/produkt/belysning /kategori/lampa" }];
    assert.deepEqual(dodaKategorilankar(artiklar, KATEGORIER).map((x) => x.slug), ["lampa"]);
    assert.deepEqual(dodaProduktlankar(artiklar, LEVANDE).map((x) => x.slug), ["belysning"]);
  });

  it("rapportens lista: målet som sökväg, produkterna först, antalet med", () => {
    assert.deepEqual(
      dodaLankRader(
        [{ artikel: "lampguide", slug: "gammal-lampa", antal: 2 }],
        [{ artikel: "halloweenguide", slug: "halloweendekoration", antal: 3 }],
      ),
      [
        { artikel: "lampguide", mal: "/produkt/gammal-lampa", antal: 2 },
        { artikel: "halloweenguide", mal: "/kategori/halloweendekoration", antal: 3 },
      ],
    );
    assert.deepEqual(dodaLankRader([], []), []);
  });

  it("TOM kategorilista ger inga fynd: då gick uppslaget fel", () => {
    assert.deepEqual(dodaKategorilankar([{ slug: "g", innehall: "/kategori/belysning" }], new Set()), []);
  });

  it("inget inlägg länkar till de två kategorier som gav omdirigeringar 2026-11-11", () => {
    // halloweendekoration var tom efter säsongen (307 till /butik) och
    // elektronik-tillbehor har bytt namn (308). Veckorapporten fångar nästa;
    // det här provet håller de två kända borta.
    const mapp = join(import.meta.dirname, "..", "content", "blog");
    const filer = readdirSync(mapp).filter((f) => f.endsWith(".md"));
    assert.ok(filer.length > 30, "blogginläggen hittades inte");
    for (const f of filer) {
      const slugs = kategoriSlugsIInnehall(readFileSync(join(mapp, f), "utf8"));
      for (const dod of ["halloweendekoration", "elektronik-tillbehor"]) {
        assert.ok(!slugs.includes(dod), `${f} länkar till /kategori/${dod}`);
      }
    }
  });
});
