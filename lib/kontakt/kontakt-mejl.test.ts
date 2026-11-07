// lib/kontakt/kontakt-mejl.test.ts
//
// Run with: `pnpm test` (node --test --experimental-strip-types).
// Kundtjänstmejlet från kontaktformuläret: oförändrat utan produkt, produkten
// överst med den, och allt som kunden eller katalogen skrivit escapat.

import test from "node:test";
import assert from "node:assert/strict";
import { kontaktMejl, type MejlProdukt } from "./kontakt.ts";
import { wixMejlBild } from "../wix-media-key.ts";

const kund = { namn: "Anna Andersson", epost: "anna@example.com", meddelande: "Hej!\nFungerar den med projektorn?" };

const hittad: MejlProdukt = {
  typ: "hittad",
  namn: "Lasertag-set med projektor",
  url: "https://www.fyndplats.se/produkt/lasertag-projektor",
  pris: "959 kr",
  bild: wixMejlBild("https://static.wixstatic.com/media/b379ce_abc~mv2.jpg/v1/fill/w_800,h_800/file.jpg"),
  iLager: true,
};

test("utan produkt: exakt samma mejl som före produktväljaren", () => {
  const m = kontaktMejl({ ...kund, produkt: null });
  assert.equal(m.subject, "Kontaktformulär: Anna Andersson");
  assert.equal(m.text, "Hej!\nFungerar den med projektorn?\n\n— — —\nFrån: Anna Andersson\nE-post: anna@example.com");
  assert.equal(
    m.html,
    '<p style="white-space:pre-wrap">Hej!\nFungerar den med projektorn?</p>' +
      '<hr><p><strong>Från:</strong> Anna Andersson<br>' +
      '<strong>E-post:</strong> <a href="mailto:anna@example.com">anna@example.com</a></p>',
  );
});

test("med produkt: ämnet börjar med produkten och produkten står överst", () => {
  const m = kontaktMejl({ ...kund, produkt: { ...hittad, valtNamn: "Blå", iLager: false } });
  assert.equal(m.subject, "Fråga om Lasertag-set med projektor – Anna Andersson");
  assert.ok(m.text.startsWith("Produkt: Lasertag-set med projektor\nVal: Blå\nPris: 959 kr (slutsåld)\nLänk: https://www.fyndplats.se/produkt/lasertag-projektor\n\nHej!"));
  assert.ok(m.html.startsWith("<table"));
  assert.ok(m.html.indexOf("Lasertag-set med projektor") < m.html.indexOf("Fungerar den med projektorn?"));
  assert.ok(m.html.includes("Val: Blå"));
  assert.ok(m.html.includes("959 kr · Slutsåld"));
  assert.ok(m.html.includes('href="https://www.fyndplats.se/produkt/lasertag-projektor"'));
  assert.ok(m.html.includes('src="https://static.wixstatic.com/media/b379ce_abc~mv2.jpg/v1/fill/w_144,h_144,al_c,q_80/file.jpg"'));
});

test("med produkt utan bild: ingen tom bildcell", () => {
  const m = kontaktMejl({ ...kund, produkt: { ...hittad, bild: "" } });
  assert.ok(!m.html.includes("<img"));
});

test("uppslaget svarade inte: mejlet går ändå, med länken ur slugen", () => {
  const m = kontaktMejl({ ...kund, produkt: { typ: "okand", slug: "lasertag-projektor", url: "https://www.fyndplats.se/produkt/lasertag-projektor" } });
  assert.equal(m.subject, "Fråga om lasertag-projektor – Anna Andersson");
  assert.ok(m.text.startsWith("Produkt: kunde inte hämtas just nu (lasertag-projektor)\nLänk: https://www.fyndplats.se/produkt/lasertag-projektor"));
  assert.ok(m.html.includes("inte gick att hämta just nu"));
});

test("allt escapas: namn, val, pris och meddelande", () => {
  const m = kontaktMejl({
    namn: "<b>Eva</b>",
    epost: "eva@example.com",
    meddelande: "<script>alert(1)</script>",
    produkt: { ...hittad, namn: 'Bord "Lux" <img src=x onerror=alert(1)>', valtNamn: "<i>Röd</i>", pris: "<s>1</s>" },
  });
  assert.ok(!m.html.includes("<script>"));
  assert.ok(!m.html.includes("<img src=x"));
  assert.ok(!m.html.includes("<i>Röd</i>"));
  assert.ok(!m.html.includes("<b>Eva</b>"));
  assert.ok(m.html.includes("&lt;script&gt;"));
});

test("långa produktnamn kortas i ämnesraden", () => {
  const m = kontaktMejl({ ...kund, produkt: { ...hittad, namn: "Spegel 50 × 70 cm med svart ram och rundade hörn – hängs stående eller liggande på väggen i hallen" } });
  // Kundens namn står efter det sista tankstrecket; produktnamnet kan ha egna.
  const del = m.subject.slice(0, m.subject.lastIndexOf(" – "));
  assert.ok(del.length <= "Fråga om ".length + 70, m.subject);
  assert.ok(del.endsWith("…"));
});

test("mejlbilden: en Wix-bild blir en liten JPG, annat lämnas orört", () => {
  assert.equal(wixMejlBild("https://static.wixstatic.com/media/b379ce_x~mv2.png"), "https://static.wixstatic.com/media/b379ce_x~mv2.png/v1/fill/w_144,h_144,al_c,q_80/file.jpg");
  assert.equal(wixMejlBild("/bilder/lokal.jpg"), "/bilder/lokal.jpg");
});
