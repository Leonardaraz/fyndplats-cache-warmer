import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { byggLlmsTxt, type LlmsUnderlag } from "./llms-txt.ts";

const underlag = (over: Partial<LlmsUnderlag> = {}): LlmsUnderlag => ({
  sajt: "https://www.fyndplats.se",
  kategorier: [
    { name: "Möbler", slug: "mobler", subs: [{ name: "Soffor", slug: "soffor" }, { name: "Fåtöljer", slug: "fatoljer" }] },
    { name: "Husdjur", slug: "husdjur" },
  ],
  guider: [{ title: "Köpguide: klösträd", slug: "klostrad-kopguide", excerpt: "Så väljer du rätt höjd." }],
  harRea: true,
  villkor: {
    leveranstid: "3–6 arbetsdagar",
    friFraktOverKr: 499,
    fraktKr: 19,
    retur: "Totalt 30 dagar att ångra eller returnera.",
    euLager: "Skickas från EU-lager – ingen importtull eller förtullningsavgift.",
  },
  ...over,
});

describe("byggLlmsTxt", () => {
  it("följer formatet: en H1, ett citat och länklistor under H2", () => {
    const text = byggLlmsTxt(underlag());
    const rader = text.split("\n");
    assert.equal(rader[0], "# Fyndplats");
    assert.equal(rader.filter((r) => r.startsWith("# ")).length, 1);
    assert.match(rader[2], /^> Fyndplats är en svensk nätbutik/);
    assert.deepEqual(rader.filter((r) => r.startsWith("## ")), ["## Handla", "## Kategorier", "## Köpguider", "## Villkor och kundtjänst", "## Maskinläsbart"]);
    assert.ok(text.endsWith("\n"));
  });

  it("villkoren står som de skickades in", () => {
    const text = byggLlmsTxt(underlag());
    assert.match(text, /Leveranstiden är 3–6 arbetsdagar\. Frakten kostar 19 kr och är fri över 499 kr\./);
    assert.match(text, /Skickas från EU-lager – ingen importtull eller förtullningsavgift\./);
    assert.match(text, /Totalt 30 dagar att ångra eller returnera\./);
  });

  it("kategorierna länkas med underkategorierna som beskrivning", () => {
    const text = byggLlmsTxt(underlag());
    assert.match(text, /^- \[Möbler\]\(https:\/\/www\.fyndplats\.se\/kategori\/mobler\): Soffor, Fåtöljer$/m);
    assert.match(text, /^- \[Husdjur\]\(https:\/\/www\.fyndplats\.se\/kategori\/husdjur\)$/m);
  });

  it("reaknappen följer butiken", () => {
    assert.match(byggLlmsTxt(underlag({ harRea: true })), /\/rea\)/);
    assert.doesNotMatch(byggLlmsTxt(underlag({ harRea: false })), /\/rea\)/);
  });

  it("utan kategorier eller guider faller rubrikerna bort, resten står kvar", () => {
    const text = byggLlmsTxt(underlag({ kategorier: [], guider: [] }));
    assert.doesNotMatch(text, /## Kategorier|## Köpguider/);
    assert.match(text, /## Handla/);
    assert.match(text, /\/sitemap\.xml/);
  });

  it("varje länk är absolut och går till butiken", () => {
    const text = byggLlmsTxt(underlag());
    const lankar = [...text.matchAll(/\]\(([^)]+)\)/g)].map((m) => m[1]);
    assert.ok(lankar.length > 15);
    for (const l of lankar) assert.match(l, /^https:\/\/www\.fyndplats\.se\//);
    assert.equal(new Set(lankar).size, lankar.length, "ingen länk två gånger");
  });

  it("radbrytningar och hakparenteser i namn förstör inte listan", () => {
    const text = byggLlmsTxt(underlag({ guider: [{ title: "Guide [2026]\nmed radbrytning", slug: "g", excerpt: "Rad ett.\nRad två." }] }));
    assert.match(text, /^- \[Guide 2026 med radbrytning\]\(https:\/\/www\.fyndplats\.se\/blogg\/g\): Rad ett\. Rad två\.$/m);
  });

  it("filen nämner inga priser på varor, ingen rabatt och inga hemliga adresser", () => {
    const text = byggLlmsTxt(underlag());
    assert.doesNotMatch(text, /prisjakt|admin|api\//i);
    assert.doesNotMatch(text, /\d+\s?%/);
  });

  it("långa listor kapas", () => {
    const subs = Array.from({ length: 30 }, (_, i) => ({ name: `Under ${i + 1}`, slug: `u${i + 1}` }));
    const guider = Array.from({ length: 80 }, (_, i) => ({ title: `Guide ${i + 1}`, slug: `g${i + 1}` }));
    const text = byggLlmsTxt(underlag({ kategorier: [{ name: "Hem", slug: "hem", subs }], guider }));
    assert.match(text, /Under 12$/m);
    assert.doesNotMatch(text, /Under 13/);
    assert.match(text, /\/blogg\/g40\)/);
    assert.doesNotMatch(text, /\/blogg\/g41\)/);
  });
});

describe("rutten", () => {
  const rutt = readFileSync(join(import.meta.dirname, "..", "app", "llms.txt", "route.ts"), "utf8");

  it("läser villkoren ur samma konstanter som sidorna", () => {
    assert.match(rutt, /leveranstid: DELIVERY_TIME,/);
    assert.match(rutt, /friFraktOverKr: FREE_SHIPPING_OVER_KR,/);
    assert.match(rutt, /fraktKr: STANDARD_SHIPPING_KR,/);
    assert.match(rutt, /retur: TOTAL_SHORT,/);
    assert.match(rutt, /euLager: EU_STOCK_NOTE,/);
  });

  it("väntar inte in katalogen och svarar som text", () => {
    assert.match(rutt, /sidhuvudsdata\(\)/);
    assert.doesNotMatch(rutt, /getProducts|getCollections/);
    assert.match(rutt, /"Content-Type": "text\/plain; charset=utf-8"/);
  });
});
