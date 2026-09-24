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
  assert.match(categorySeo("lek-tillbehor-for-husdjur")!.title, /[Hh]undtrappa/);
  assert.match(categorySeo("klostrad")!.title, /[Kk]lösträd/);
  assert.match(categorySeo("elbilar-for-barn")!.title, /[Ee]lbil/);
  // Runda S9: hantlarna fick en egen sida, och Träning & Gym tog hemmagym i stället.
  assert.match(categorySeo("traning-gym")!.title, /[Hh]emmagym/);
  assert.match(categorySeo("hantlar-hantelset")!.title, /[Hh]antlar/);
});

// Två kategorisidor som siktar på samma huvudord delar på rankingen i stället
// för att lägga den på en sida. 2026-09-24 fick klösträd, elbilar och elva andra
// sökord egna kategorier, och de gamla samlingssidorna (Lek & Tillbehör för
// husdjur, Leksaker & Spel) bytte till ord som ingen annan sida tar.
// Samma dag kom fyra säsongssidor till: halloweendekoration, juldekoration,
// eldkorgar och konstväxter, och Trädgårds åtta underkategorier fick egna titlar.
// Runda S7 lade till elva: badrumsskåp, golvlampor, elkaminer, värmefläktar,
// verktygsvagnar, bäddfåtöljer, massagestolar, tv-bänkar, skoskåp, köksöar och
// boxningssäckar. Belysning och Förvaring släppte golvlampor och skoskåp.
// Runda S8 lade till sex: kaninburar, hamsterburar, terrarier, hönshus, hundvagnar
// och vedställ.
// Runda S9 lade till hantlar, träningsbänkar och motionscyklar, och Träning & Gym
// släppte hantlar för hemmagym.
// Runda S10 lade till speglar, badrumsspeglar, sidobord, nattduksbord, byråer,
// bokhyllor, tvättkorgar och vattenkokare, och Förvaring släppte byrå och bokhylla.
// Runda S11 lade till pallar, sittpuffar, klädhängare och hallmöbler, sideboards,
// vinställ, barnmöbler och projektordukar.
test("ett huvudsökord finns i exakt en kategorititel", () => {
  const ord = [
    /klösträd/i, /elbil/i, /sparkcykel/i, /hundbädd/i, /hundbur/i, /kattlåd/i, /katthus/i,
    /hundkoj/i, /gunghäst/i, /leksakskök/i, /sandlåd/i, /garagetält/i, /redskapsbod/i,
    /halloween/i, /juldekoration/i, /eldkorg/i, /konstgjorda växter/i,
    /tunnelväxthus/i, /loungeset/i, /paviljongtak/i, /plancha/i, /solcellslamp/i,
    /studsmatta/i, /basketkorg/i, /kompostkvarn/i, /terrassvärmare/i,
    /badrumsskåp/i, /golvlamp/i, /elkamin/i, /värmefläkt/i, /verktygsvagn/i, /bäddfåtölj/i,
    /massagestol/i, /tv-bänk/i, /skoskåp/i, /köksö/i, /boxningssäck/i,
    /kaninbur/i, /hamsterbur/i, /terrari/i, /hönshus/i, /hundvagn/i, /vedställ/i,
    /hantl/i, /träningsbänk/i, /motionscykel/i, /hemmagym/i,
    /\bspegel\b/i, /badrumsspegel/i, /sidobord/i, /avlastningsbord/i, /nattduksbord/i,
    /byrå/i, /bokhyll/i, /tvättkorg/i, /vattenkokare/i, /brödrost/i,
    /\bpall\b/i, /stegpall/i, /duschpall/i, /pianopall/i, /rullpall/i, /sittpuff/i, /fotpall/i,
    /klädhängare/i, /klädställning/i, /hallmöbel/i, /hallbänk/i, /sideboard/i, /skänk/i,
    /vitrinskåp/i, /vinställ/i, /vinkyl/i, /vinhylla/i, /barnfåtölj/i, /barnsoffa/i,
    /sminkbord/i, /barngarderob/i, /projektorduk/i,
  ];
  for (const re of ord) {
    const traffar = Object.entries(CATEGORY_SEO).filter(([, s]) => re.test(s.title)).map(([slug]) => slug);
    assert.equal(traffar.length, 1, `${re} finns i ${traffar.length} titlar: ${traffar.join(", ")}`);
  }
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

// Sidan renderar intro och FAQ som ren text (<p>{para}</p>, <dd>{f.a}</dd>), och
// titel och beskrivning hamnar i <title> och metataggen. Markdown eller HTML syns
// alltså ordagrant för kunden: /kategori/belysning visade "**Sockeln**" med
// asteriskerna från #400 (2026-08-12) tills det mättes 2026-09-24.
const MARKUP = /\*+|`+|_+|<[^>]*>|\[[^\]]*\]\([^)]*\)|&[A-Za-z0-9#]+;|^#{1,6}\s/m;

test("kategoritexterna bär ingen markup (sidan visar ren text)", () => {
  const texter: [string, string][] = [];
  for (const [slug, s] of Object.entries(CATEGORY_SEO)) {
    texter.push([slug, s.title], [slug, s.description]);
  }
  for (const [slug, c] of Object.entries(CATEGORY_CONTENT)) {
    for (const t of [...c.intro, ...c.faq.flatMap((f) => [f.q, f.a])]) texter.push([slug, t]);
  }
  for (const [slug, t] of texter) {
    const m = t.match(MARKUP);
    assert.equal(m, null, `${slug}: ${JSON.stringify(m?.[0])} syns ordagrant i "${t.slice(0, 60)}…"`);
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
