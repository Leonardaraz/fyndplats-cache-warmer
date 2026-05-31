import { describe, expect, it } from "vitest";
import {
  appendTabSections,
  buildTabSections,
  descriptionHasSection,
  isCareRelevant,
  type GeneratedTabs,
} from "./tabs";

const TABS: GeneratedTabs = {
  specs: [
    { label: "Material", value: "Rostfritt stål" },
    { label: "Färg", value: "Svart" },
  ],
  packageContents: ["1 x Våg", "1 x USB-kabel"],
  faq: [
    { q: "Är den vattentät?", a: "Ja, tål stänk." },
    { q: "Vilket batteri tar den?", a: "Litiumjon, medföljer." },
  ],
  careHtml: "<p>Torka av med en fuktig trasa.</p>",
};

describe("isCareRelevant", () => {
  it("matchar Kök/Skönhet/Elektronik (inkl. fulla kategorinamn)", () => {
    expect(isCareRelevant("Kök & Husgeråd")).toBe(true);
    expect(isCareRelevant("Skönhet & Hälsa")).toBe(true);
    expect(isCareRelevant("Elektronik & Tillbehör")).toBe(true);
  });
  it("är false för irrelevanta/okända kategorier", () => {
    expect(isCareRelevant("Husdjur")).toBe(false);
    expect(isCareRelevant(null)).toBe(false);
    expect(isCareRelevant(undefined)).toBe(false);
  });
});

describe("buildTabSections", () => {
  it("bygger spec-, FAQ- och skötsel-sektioner med rätt titlar", () => {
    const sections = buildTabSections(TABS);
    expect(sections.map((s) => s.title)).toEqual([
      "Tekniska specifikationer",
      "Vanliga frågor",
      "Användning och skötsel",
    ]);
    // Spec-fliken innehåller både specs och paketinnehåll.
    expect(sections[0].html).toContain("Rostfritt stål");
    expect(sections[0].html).toContain("Innehåll i paketet");
    expect(sections[0].html).toContain("USB-kabel");
  });

  it("escaper HTML i specs/FAQ men behåller skötsel-HTML", () => {
    const sections = buildTabSections({
      ...TABS,
      specs: [{ label: "A<b>", value: "x & y" }],
      faq: [{ q: "<i>q</i>", a: "a" }],
    });
    expect(sections[0].html).toContain("A&lt;b&gt;");
    expect(sections[0].html).toContain("x &amp; y");
    expect(sections[1].html).toContain("&lt;i&gt;q&lt;/i&gt;");
    expect(sections[2].html).toBe("<p>Torka av med en fuktig trasa.</p>");
  });

  it("hoppar över tomma sektioner", () => {
    expect(buildTabSections({ specs: [], packageContents: [], faq: [], careHtml: null })).toEqual([]);
  });

  it("saneras bort <script> ur skötsel-HTML", () => {
    const sections = buildTabSections({
      ...TABS,
      careHtml: "<p>ok</p><script>alert(1)</script>",
    });
    const care = sections.find((s) => s.title === "Användning och skötsel");
    expect(care?.html).not.toContain("<script>");
  });
});

describe("appendTabSections / descriptionHasSection", () => {
  it("fogar in <h2>-block som storefronten kan splitta", () => {
    const sections = buildTabSections(TABS);
    const { html, added } = appendTabSections("<p>Beskrivning.</p>", sections);
    expect(added).toEqual(sections.map((s) => s.title));
    // Samma <h2>-mönster som components/productview.tsx FLIK_TITLE_PATTERNS.
    expect(html).toMatch(/<h2>\s*Tekniska specifikationer\s*<\/h2>/);
    expect(html).toMatch(/<h2>\s*Vanliga frågor\s*<\/h2>/);
    expect(html).toMatch(/<h2>\s*Användning och skötsel\s*<\/h2>/);
    expect(descriptionHasSection(html, "Vanliga frågor")).toBe(true);
  });

  it("är idempotent — kör om lägger inte till dubbletter", () => {
    const sections = buildTabSections(TABS);
    const first = appendTabSections("<p>Beskrivning.</p>", sections);
    const second = appendTabSections(first.html, sections);
    expect(second.added).toEqual([]);
    expect(second.html).toBe(first.html);
  });

  it("hoppar över en flik som redan finns men lägger till saknade", () => {
    const existing = "<p>Text.</p><h2>Tekniska specifikationer</h2><ul><li>x</li></ul>";
    const sections = buildTabSections(TABS);
    const { added } = appendTabSections(existing, sections);
    expect(added).not.toContain("Tekniska specifikationer");
    expect(added).toContain("Vanliga frågor");
    expect(added).toContain("Användning och skötsel");
  });
});
