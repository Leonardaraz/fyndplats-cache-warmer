import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { hogstaTrappa, MAX_BARN, MAX_SYSKON, prisgrannar, ringEfter, SVEP_FRAN_LANKAR, svepRad, type TrappKategori, type Trappsteg } from "./grannlankar.ts";

const las = (...delar: string[]) => readFileSync(join(import.meta.dirname, "..", "..", ...delar), "utf8");

describe("ringEfter", () => {
  it("ger de följande elementen och fortsätter från början", () => {
    assert.deepEqual(ringEfter(["a", "b", "c", "d"], 0, 2), ["b", "c"]);
    assert.deepEqual(ringEfter(["a", "b", "c", "d"], 3, 2), ["a", "b"]);
    assert.deepEqual(ringEfter(["a", "b", "c", "d"], 2, 3), ["d", "a", "b"]);
  });

  it("elementet självt är aldrig med, hur många som än begärs", () => {
    assert.deepEqual(ringEfter(["a", "b", "c"], 1, 10), ["c", "a"]);
  });

  it("ett ensamt element, ett index utanför och noll begärda ger en tom lista", () => {
    assert.deepEqual(ringEfter(["a"], 0, 3), []);
    assert.deepEqual(ringEfter(["a", "b"], -1, 3), []);
    assert.deepEqual(ringEfter(["a", "b"], 2, 3), []);
    assert.deepEqual(ringEfter(["a", "b"], 0, 0), []);
    assert.deepEqual(ringEfter([], 0, 3), []);
  });

  it("☠️ varje element får lika många länkar in som det har ut (förr: de första fick alla, de sista inga)", () => {
    for (const n of [2, 3, 5, 9, 40]) {
      for (const antal of [1, 2, 3, 4]) {
        const lista = Array.from({ length: n }, (_, i) => i);
        const in_ = new Map<number, number>(lista.map((i) => [i, 0]));
        for (const i of lista) for (const m of ringEfter(lista, i, antal)) in_.set(m, (in_.get(m) || 0) + 1);
        const vantat = Math.min(antal, n - 1);
        for (const i of lista) assert.equal(in_.get(i), vantat, `n=${n} antal=${antal} element ${i}`);
      }
    }
  });
});

const K = (id: string, parentId: string | null = null): TrappKategori => ({ id, slug: id, name: id.toUpperCase(), parentId });
const kategorier: TrappKategori[] = [
  K("mobler"), K("kok"), K("tradgard"),
  K("soffor", "mobler"), K("stolar", "mobler"), K("bord", "mobler"), K("sangar", "mobler"), K("hyllor", "mobler"), K("pallar", "mobler"),
  K("grytor", "kok"),
];
const steg: Trappsteg[] = [
  { price: 1000, categorySlug: "mobler" }, { price: 500, categorySlug: "mobler" },
  { price: 1000, categorySlug: "kok" },
  { price: 1000, categorySlug: "soffor" }, { price: 1000, categorySlug: "stolar" }, { price: 500, categorySlug: "stolar" },
  { price: 500, categorySlug: "bord" }, { price: 1000, categorySlug: "sangar" }, { price: 1000, categorySlug: "hyllor" },
  { price: 1000, categorySlug: "pallar" },
];

describe("prisgrannar", () => {
  it("högsta giltiga nivån per kategori", () => {
    const h = hogstaTrappa(steg);
    assert.equal(h.get("mobler"), 1000);
    assert.equal(h.get("bord"), 500);
    assert.equal(h.has("tradgard"), false);
    assert.equal(h.has("grytor"), false);
  });

  it("en underkategori länkar till avdelningens prissida och till de följande syskonens", () => {
    const l = prisgrannar(kategorier[3], kategorier, steg); // soffor
    assert.deepEqual(l[0], { href: "/under-1000-kr/mobler", label: "MOBLER under 1000 kr" });
    assert.deepEqual(l.slice(1).map((x) => x.href), ["/under-1000-kr/stolar", "/under-500-kr/bord", "/under-1000-kr/sangar", "/under-1000-kr/hyllor"]);
    assert.equal(l.length, 1 + MAX_SYSKON);
  });

  it("ringen går runt hörnet: det sista syskonet länkar till de första", () => {
    const l = prisgrannar(kategorier[8], kategorier, steg); // pallar
    assert.deepEqual(l.slice(1).map((x) => x.href), ["/under-1000-kr/soffor", "/under-1000-kr/stolar", "/under-500-kr/bord", "/under-1000-kr/sangar"]);
  });

  it("ett syskon mitt i raden länkar till de fyra följande, inte till de fyra första", () => {
    const l = prisgrannar(kategorier[4], kategorier, steg); // stolar
    assert.deepEqual(l.slice(1).map((x) => x.href), ["/under-500-kr/bord", "/under-1000-kr/sangar", "/under-1000-kr/hyllor", "/under-1000-kr/pallar"]);
  });

  it("☠️ varje syskon får lika många länkar från sina syskon: fyra av fem möjliga, ingen blir utan", () => {
    const barn = kategorier.filter((c) => c.parentId === "mobler");
    const in_ = new Map<string, number>(barn.map((c) => [c.slug, 0]));
    for (const c of barn) {
      // Första länken är avdelningens, resten syskonens.
      for (const l of prisgrannar(c, kategorier, steg).slice(1)) {
        const slug = l.href.split("/").pop() as string;
        in_.set(slug, (in_.get(slug) || 0) + 1);
      }
    }
    assert.deepEqual([...in_.values()], [4, 4, 4, 4, 4, 4]);
  });

  it("en avdelning utan egen prissida länkas inte från sin underkategori", () => {
    const med = [...kategorier, K("krukor", "tradgard")];
    const l = prisgrannar(med[med.length - 1], med, [...steg, { price: 500, categorySlug: "krukor" }]);
    assert.deepEqual(l, []);
  });

  it("avdelningen länkar till underkategoriernas prissidor och till de andra avdelningarnas", () => {
    const l = prisgrannar(kategorier[0], kategorier, steg).map((x) => x.href); // mobler
    assert.deepEqual(l.slice(0, 6), ["/under-1000-kr/soffor", "/under-1000-kr/stolar", "/under-500-kr/bord", "/under-1000-kr/sangar", "/under-1000-kr/hyllor", "/under-1000-kr/pallar"]);
    assert.deepEqual(l.slice(6), ["/under-1000-kr/kok"]);
  });

  it("en kategori utan giltig prissida länkas aldrig, och en förälder utan prissida hoppas över", () => {
    const alla = kategorier.flatMap((c) => prisgrannar(c, kategorier, steg)).map((x) => x.href);
    assert.equal(alla.some((h) => h.endsWith("/tradgard") || h.endsWith("/grytor")), false);
    const grytor = prisgrannar(kategorier[9], kategorier, [...steg, { price: 200, categorySlug: "grytor" }]);
    assert.deepEqual(grytor.map((x) => x.href), ["/under-1000-kr/kok"]);
  });

  it("☠️ varje prissida med ett syskon eller en avdelning får minst en länk från en annan prissida", () => {
    const hogst = hogstaTrappa(steg);
    const in_ = new Map<string, number>();
    for (const c of kategorier.filter((x) => hogst.has(x.slug))) {
      for (const l of prisgrannar(c, kategorier, steg)) in_.set(l.href, (in_.get(l.href) || 0) + 1);
    }
    for (const [slug, pris] of hogst) assert.ok((in_.get(`/under-${pris}-kr/${slug}`) || 0) >= 1, slug);
  });

  it("avdelningen länkar till högst MAX_BARN underkategorier", () => {
    const manga = [K("a"), ...Array.from({ length: 20 }, (_, i) => K(`b${i}`, "a"))];
    const s = manga.map((c) => ({ price: 1000, categorySlug: c.slug }));
    assert.equal(prisgrannar(manga[0], manga, s).length, MAX_BARN);
  });
});

describe("sidorna använder ringen", () => {
  it("prissidan lägger till grannarna utan dubbletter", () => {
    const k = las("lib", "seo", "programmatic.ts");
    assert.match(k, /for \(const granne of prisgrannar\(cat, collections, allTiers\)\) \{\s*if \(!related\.some\(\(r\) => r\.href === granne\.href\)\) related\.push\(granne\);/);
  });

  it("☠️ intressesidan länkar till de tre följande, inte till de tre första", () => {
    const k = las("lib", "seo", "programmatic.ts");
    assert.match(k, /const giltiga = INTERESTS\.filter\(\(c\) => validSlugs\.includes\(c\.slug\)\);\s*for \(const other of ringEfter\(giltiga, giltiga\.findIndex\(\(c\) => c\.slug === slug\), 3\)\)/);
    assert.doesNotMatch(k, /INTERESTS\.filter\(\(c\) => c\.slug !== slug && validSlugs\.includes\(c\.slug\)\)\.slice\(0, 3\)/);
  });

  it("blogginlägget länkar till de två följande inläggen", () => {
    const k = las("app", "blogg", "[slug]", "page.tsx");
    assert.match(k, /const grannar = ringEfter\(allaInlagg, allaInlagg\.findIndex\(\(x\) => x\.slug === p\.slug\), 2\);/);
    assert.match(k, /\{grannar\.length > 0 && \(\s*<nav aria-label="Fler inlägg"/);
    assert.match(k, /<a href=\{`\/blogg\/\$\{g\.slug\}`\}>\{g\.title\}<\/a>/);
  });
});

describe("☠️ många länkar blir en rad i sidled på mobilen (mätt: 19 länkar var 18 rader och 1 014 px)", () => {
  it("regeln: upp till sex länkar radbryts som förut, från sju blir det en rad", () => {
    assert.equal(SVEP_FRAN_LANKAR, 7);
    assert.equal(svepRad(0), false);
    assert.equal(svepRad(6), false);
    assert.equal(svepRad(7), true);
    assert.equal(svepRad(19), true);
  });

  it("länkraden får klassen bara när sidan bett om det OCH länkarna är många", () => {
    const k = las("components", "programmatic.tsx");
    assert.match(k, /import \{ svepRad \} from "\.\.\/lib\/seo\/grannlankar";/);
    assert.match(k, /<div className=\{svepbar && svepRad\(links\.length\) \? "prog-links prog-links-svep" : "prog-links"\}>/);
    assert.doesNotMatch(k, /^"use client"/, "regeln ska inte följa med till webbläsaren");
  });

  it("prissidan ber om det, de andra sidorna gör det inte", () => {
    assert.match(las("components", "price-tier-page.tsx"), /<ProgCrossLinks title="Fortsätt fynda" links=\{view\.related\} svepbar \/>/);
    for (const sida of [["app", "produkt", "[slug]", "page.tsx"], ["app", "kategori", "[slug]", "page.tsx"], ["app", "for-dig-som", "[interest]", "page.tsx"], ["app", "kopguider", "[type]", "page.tsx"]]) {
      const k = las(...sida);
      assert.match(k, /<ProgCrossLinks /, sida.join("/"));
      assert.doesNotMatch(k, /<ProgCrossLinks [^>]*svepbar/, sida.join("/"));
    }
  });

  it("stilen: bara på mobilen, en rad som rullar i sidled, kant i kant med behållaren", () => {
    const css = las("app", "globals.css");
    const block = css.match(/@media\(max-width:700px\)\{\s*\.prog-links-svep\{([^}]*)\}\s*\.prog-links-svep::-webkit-scrollbar\{display:none\}\s*\.prog-links-svep \.prog-link-chip\{([^}]*)\}\s*\}/);
    assert.ok(block, "regeln ska stå i ett eget mobilblock");
    const [, rad, lank] = block!;
    assert.match(rad, /flex-wrap:nowrap/);
    assert.match(rad, /overflow-x:auto/);
    assert.match(lank, /flex:0 0 auto/);
    assert.match(lank, /white-space:nowrap/);
    // Kant i kant: radens negativa marginal i sidled är behållarens luft, och
    // samma luft står som padding, så första länken börjar där rubriken börjar.
    const luft = css.match(/^\.container\{[^}]*padding:0 (\d+)px\}/m);
    assert.ok(luft, ".container ska ha en fast luft i sidled");
    assert.match(rad, new RegExp(`margin:-4px -${luft![1]}px;padding:4px ${luft![1]}px`));
    // Utanför mobilblocket finns ingen regel för klassen: på datorn radbryts länkarna.
    assert.equal((css.match(/\.prog-links-svep/g) || []).length, 3);
  });
});

