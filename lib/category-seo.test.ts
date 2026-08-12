// Run: node --test --experimental-strip-types lib/category-seo.test.ts
import test from "node:test";
import assert from "node:assert/strict";
import { CATEGORY_SEO, categorySeo } from "./category-seo.ts";
import { CATEGORY_CONTENT } from "./category-content.ts";

// Layoutens template är "%s | Fyndplats" (12 tecken). Google klipper runt 60,
// så själva titeln måste hålla sig under 48 för att aldrig kapas i resultatet.
const SUFFIX = " | Fyndplats".length;

test("titlar ryms i Googles klippgräns", () => {
  for (const [slug, seo] of Object.entries(CATEGORY_SEO)) {
    assert.ok(
      seo.title.length + SUFFIX <= 60,
      `${slug}: "${seo.title}" blir ${seo.title.length + SUFFIX} tecken med suffix (max 60)`
    );
    assert.ok(seo.title.length > 0, `${slug}: tom titel`);
  }
});

test("beskrivningar ligger i det spann Google visar", () => {
  for (const [slug, seo] of Object.entries(CATEGORY_SEO)) {
    assert.ok(
      seo.description.length >= 110 && seo.description.length <= 165,
      `${slug}: beskrivningen är ${seo.description.length} tecken (ska vara 110–165)`
    );
  }
});

// Mallen gav 36 nästan identiska sidor — det var halva problemet. Unikhet är
// alltså inte kosmetik utan hela poängen med filen.
test("varje titel och beskrivning är unik", () => {
  const titles = Object.values(CATEGORY_SEO).map((s) => s.title);
  const descs = Object.values(CATEGORY_SEO).map((s) => s.description);
  assert.equal(new Set(titles).size, titles.length, "dubblerad titel");
  assert.equal(new Set(descs).size, descs.length, "dubblerad beskrivning");
});

// Kategorinamnet ("Friluftsliv & Resa") är hyllskylten som INTE rankar — titeln
// ska vara kundens sökord. Stickprov på de tydligaste omskrivningarna.
test("titlarna använder kundspråk, inte den interna hyllskylten", () => {
  assert.match(categorySeo("friluftsliv-resa")!.title, /[Cc]amping/);
  assert.match(categorySeo("mat-vattenskalar")!.title, /skålar/i);
  assert.match(categorySeo("burar-klader-tillbehor")!.title, /[Hh]undgård|bur/);
  assert.match(categorySeo("lek-tillbehor-for-husdjur")!.title, /[Kk]lösträd/);
  assert.match(categorySeo("traning-gym")!.title, /[Hh]antlar|[Tt]räningsutrustning/);
});

test("okänd slug faller tillbaka på mallen (ingen krasch)", () => {
  assert.equal(categorySeo("finns-inte"), undefined);
  assert.equal(categorySeo(""), undefined);
});

// Sidorna fick tidigare bara redaktionell text på 9 av 36 kategorier; resten var
// ren produktgrid utan brödtext. Håll de två filerna i takt.
test("varje kategori med SEO-titel har också redaktionell text", () => {
  for (const slug of Object.keys(CATEGORY_SEO)) {
    assert.ok(CATEGORY_CONTENT[slug], `${slug}: saknar redaktionellt innehåll`);
  }
});

test("redaktionellt innehåll håller måttet: text + minst två frågor", () => {
  for (const [slug, c] of Object.entries(CATEGORY_CONTENT)) {
    const words = c.intro.join(" ").split(/\s+/).filter(Boolean).length;
    assert.ok(words >= 90, `${slug}: bara ${words} ord intro (minst 90)`);
    assert.ok(c.faq.length >= 2, `${slug}: bara ${c.faq.length} FAQ (minst 2)`);
    for (const f of c.faq) {
      assert.ok(f.q.trim().length > 0 && f.a.trim().length > 0, `${slug}: tom FAQ-post`);
    }
  }
});
