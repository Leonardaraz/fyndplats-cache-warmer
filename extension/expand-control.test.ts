// Skydd för tilläggets utfällningsbeslut (extension/content.js).
//
// Tillägget är ett rent webbläsarskript utan bundler — det kan inte importeras.
// Vi läser därför källfilen och kör de RENA besluten i en sandlåda. Det täcker
// precis den del där ett fel får riktiga konsekvenser: vad vi klickar på när
// användaren står på en levande AliExpress-sida med en köpknapp.
//
// Bakgrund: måleritältet (2026-08-18) importerades med noll specrader eftersom
// spec-blocket antingen inte hade renderats än eller låg avkortat bakom
// "View more". Fixen scrollar och fäller ut före skrapet — och då måste det gå
// att lita på urvalet av knappar.

import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import vm from "node:vm";

const KÄLLA = readFileSync(fileURLToPath(new URL("./content.js", import.meta.url)), "utf8");

/** Plockar ut de tre deklarationerna vi vill testa och kör dem fristående. */
function laddaBeslut(): (text: unknown) => boolean {
  const bitar = [
    /const FP_EXPAND_TEXT_RE = .*?;\n/s,
    /const FP_EXPAND_FORBIDDEN_RE =[\s\S]*?;\n/,
    /function fpIsExpandControl\(text\) \{[\s\S]*?\n\}/,
  ].map((re) => {
    const m = re.exec(KÄLLA);
    if (!m) throw new Error(`hittade inte ${re} i content.js — har koden döpts om?`);
    return m[0];
  });
  const ctx: Record<string, unknown> = {};
  vm.createContext(ctx);
  vm.runInContext(`${bitar.join("\n")}\nglobalThis.__f = fpIsExpandControl;`, ctx);
  return ctx.__f as (text: unknown) => boolean;
}

const fpIsExpandControl = laddaBeslut();

describe("fpIsExpandControl — vad tillägget vågar klicka på", () => {
  it("känner igen utfällning på de språk AE visar för oss", () => {
    for (const t of ["View more", "view More", "See more", "Show more", "More", "Visa mer", "Visa fler", "Visa allt", "Läs mer", "Ver más"]) {
      expect(fpIsExpandControl(t), t).toBe(true);
    }
  });

  it("KLICKAR ALDRIG på något som kan lägga en order", () => {
    // Sidan är en levande butik. Även om texten skulle råka matcha
    // utfällningsmönstret vinner spärrlistan.
    for (const t of [
      "Buy now", "Add to cart", "Köp nu", "Lägg i varukorgen", "Till kassan",
      "Checkout", "Place order", "Beställ", "Betala", "Get coupon", "Hämta kupong",
      "Comprar ahora", "More payment options", "Visa mer i varukorgen",
    ]) {
      expect(fpIsExpandControl(t), t).toBe(false);
    }
  });

  it("hoppar över brödtext och långa etiketter", () => {
    expect(fpIsExpandControl("Se mer information om produktens tekniska specifikationer nedan")).toBe(false);
    expect(fpIsExpandControl("x".repeat(31))).toBe(false);
  });

  it("matchar bara i början — 'more' mitt i en mening är inte en knapp", () => {
    expect(fpIsExpandControl("Learn more about shipping")).toBe(false);
    expect(fpIsExpandControl("Something more")).toBe(false);
  });

  it("tål tom, saknad och konstig indata utan att kasta", () => {
    for (const t of ["", "   ", null, undefined, 0, {}, []]) {
      expect(fpIsExpandControl(t)).toBe(false);
    }
  });

  it("normaliserar blanksteg — radbrytning i etiketten ska inte missa träffen", () => {
    expect(fpIsExpandControl("  View\n  more  ")).toBe(true);
  });
});

describe("content.js — utfällningen är inkopplad och bunden", () => {
  it("körs före BÅDA skrap-vägarna (popup/agent respektive EXTRACT_PRODUCT)", () => {
    const anrop = KÄLLA.match(/await fpPrepareForScrape\(\)/g) ?? [];
    expect(anrop.length).toBe(2);
    // …och alltid FÖRE extract(), aldrig efter.
    for (const m of KÄLLA.matchAll(/const product = extract\(\)/g)) {
      const före = KÄLLA.slice(0, m.index ?? 0);
      expect(före.includes("await fpPrepareForScrape()")).toBe(true);
    }
  });

  it("har både en tidsbudget och ett klicktak — en import får aldrig hänga", () => {
    const budget = /FP_SCRAPE_PREP_BUDGET_MS = (\d+)/.exec(KÄLLA);
    const tak = /FP_MAX_EXPAND_CLICKS = (\d+)/.exec(KÄLLA);
    expect(budget).toBeTruthy();
    expect(tak).toBeTruthy();
    expect(Number(budget![1])).toBeGreaterThan(0);
    expect(Number(budget![1])).toBeLessThanOrEqual(15000);
    expect(Number(tak![1])).toBeGreaterThan(0);
    expect(Number(tak![1])).toBeLessThanOrEqual(20);
  });
});

// --- Utfällningsloopen -----------------------------------------------------
//
// fpPrepareForScrape rör bara en handfull DOM-API:er, så den går att köra mot
// en attrapp utan att dra in jsdom i motorns testkörning.
//
// TÄCKS INTE: att container-selektorerna faktiskt matchar AliExpress markup.
// Det kräver en riktig sida och verifieras genom att importera om produkten.

function laddaLoopen() {
  const start = KÄLLA.indexOf("const FP_EXPAND_TEXT_RE");
  const slut = KÄLLA.indexOf("// Säljpunkter/funktioner");
  if (start < 0 || slut < 0 || slut <= start) throw new Error("hittade inte utfällningsblocket i content.js");
  return KÄLLA.slice(start, slut);
}

interface FakeEl {
  text: string;
  barn: FakeEl[];
  synlig?: boolean;
  klickad?: number;
}

function el(text: string, opts: { barn?: FakeEl[]; synlig?: boolean } = {}): FakeEl {
  return { text, barn: opts.barn ?? [], synlig: opts.synlig !== false, klickad: 0 };
}

/** Kör loopen mot en attrapp-DOM och returnerar vad som klickades. */
async function körLoopen(containrar: FakeEl[], startY = 400) {
  const alla = (n: FakeEl): FakeEl[] => [n, ...n.barn.flatMap(alla)];
  const wrap = (n: FakeEl) => ({
    get textContent() { return n.text; },
    get childElementCount() { return n.barn.length; },
    querySelectorAll: () => n.barn.flatMap(alla).map(wrap),
    getBoundingClientRect: () => (n.synlig ? { width: 100, height: 20 } : { width: 0, height: 0 }),
    click: () => { n.klickad = (n.klickad ?? 0) + 1; },
  });

  const scrollTill: number[] = [];
  const ctx: Record<string, unknown> = {
    console: { log: () => {}, warn: () => {} },
    setTimeout: (f: () => void) => { f(); return 0; },
    Date,
    Set,
    Math,
    String,
    Promise,
    window: {
      scrollY: startY,
      innerHeight: 800,
      scrollTo: (_x: number, y: number) => { scrollTill.push(y); },
    },
    document: {
      body: { scrollHeight: 2400 },
      querySelectorAll: () => containrar.map(wrap),
    },
  };
  vm.createContext(ctx);
  vm.runInContext(`${laddaLoopen()}\nglobalThis.__kör = fpPrepareForScrape;`, ctx);
  await (ctx.__kör as () => Promise<void>)();
  return { scrollTill };
}

describe("fpPrepareForScrape — loopen", () => {
  it("klickar på utfällningsknappen men aldrig på köpknappen bredvid", async () => {
    const visaMer = el("View more");
    const köp = el("Buy now");
    await körLoopen([el("spec", { barn: [visaMer, köp] })]);
    expect(visaMer.klickad).toBe(1);
    expect(köp.klickad).toBe(0);
  });

  it("klickar bara på bladnoder — en wrapper vars text börjar med 'Visa mer' lämnas", async () => {
    const blad = el("Visa mer");
    const wrapper = el("Visa mer och massa annat", { barn: [blad] });
    await körLoopen([el("spec", { barn: [wrapper] })]);
    expect(wrapper.klickad).toBe(0);
    expect(blad.klickad).toBe(1);
  });

  it("hoppar över osynliga träffar", async () => {
    const dold = el("View more", { synlig: false });
    await körLoopen([el("spec", { barn: [dold] })]);
    expect(dold.klickad).toBe(0);
  });

  it("klickar varje knapp EN gång — ingen evighetsloop när DOM:en inte ändras", async () => {
    const a = el("View more");
    const b = el("Visa fler");
    await körLoopen([el("spec", { barn: [a, b] })]);
    expect(a.klickad).toBe(1);
    expect(b.klickad).toBe(1);
  });

  it("identiska etiketter i samma block klickas en gång, inte om och om igen", async () => {
    // Nyckeln är container + etikett. Två knappar med exakt samma text i samma
    // block är samma kontroll i praktiken; att klicka båda vore att klicka om.
    const a = el("Show more");
    const b = el("Show more");
    await körLoopen([el("spec", { barn: [a, b] })]);
    expect((a.klickad ?? 0) + (b.klickad ?? 0)).toBe(1);
  });

  it("respekterar klicktaket när sidan har fler utfällbara block än så", async () => {
    const containrar = Array.from({ length: 20 }, (_, i) =>
      el(`block-${i}`, { barn: [el("Show more")] }),
    );
    await körLoopen(containrar);
    const tak = Number(/FP_MAX_EXPAND_CLICKS = (\d+)/.exec(KÄLLA)![1]);
    const totalt = containrar.reduce((n, c) => n + (c.barn[0].klickad ?? 0), 0);
    expect(totalt).toBe(tak);
  });

  it("återställer scrollpositionen så användaren inte kastas ner på sidan", async () => {
    const { scrollTill } = await körLoopen([el("spec", { barn: [el("View more")] })], 640);
    expect(scrollTill.at(-1)).toBe(640);
  });

  it("en sida utan utfällningsknappar ger inga klick och kastar inte", async () => {
    const vanlig = el("Frakt och leverans");
    await expect(körLoopen([el("spec", { barn: [vanlig] })])).resolves.toBeTruthy();
    expect(vanlig.klickad).toBe(0);
  });
});
