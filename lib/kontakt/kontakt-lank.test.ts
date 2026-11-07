// lib/kontakt/kontakt-lank.test.ts
//
// Run with: `pnpm test` (node --test --experimental-strip-types).
// Kontaktvägarna bär produkten: parametrarna, formulärets adress, e-postlänken
// och produktsidans flik "Kontakta oss".

import test from "node:test";
import assert from "node:assert/strict";
import {
  amneFor,
  giltigSlug,
  giltigVariant,
  KONTAKT_FLIK_HTML as FLIK,
  kontaktFlikLankar,
  kontaktHref,
  kortText,
  lasKontaktParams,
  mailtoHref,
  normVariant,
  produktSokvag,
  produktUrl,
} from "./kontakt.ts";

const V = "10b7ad08-afaa-4668-a840-f4643fd1d2b5";

test("slug och variant: bara katalogens former släpps igenom", () => {
  assert.equal(giltigSlug("baddfatolj-med-armstod"), true);
  assert.equal(giltigSlug("x"), true);
  for (const s of ["", "-borjar-med-streck", "Stora", "å-ä-ö", "a/b", "a b", "a?b=1", "a".repeat(161), null, 5]) {
    assert.equal(giltigSlug(s), false, String(s));
  }
  assert.equal(giltigVariant(V), true);
  assert.equal(giltigVariant(V.toUpperCase()), true);
  assert.equal(giltigVariant("00000000-0000-0000-0000-000000000000"), false, "Wix id för ingen variant");
  assert.equal(giltigVariant("10b7ad08"), false);
  assert.equal(giltigVariant(`${V}x`), false);
  // Varje väg in jämför id med ===, så formen är alltid gemener.
  assert.equal(normVariant(V.toUpperCase()), V);
  assert.equal(normVariant("00000000-0000-0000-0000-000000000000"), undefined);
  assert.equal(normVariant("nej"), undefined);
  assert.equal(normVariant(undefined), undefined);
  assert.equal(normVariant(5), undefined);
});

test("lasKontaktParams läser produkt och variant, och struntar i skräp", () => {
  assert.deepEqual(lasKontaktParams(`?produkt=pallar-4-pack&variant=${V.toUpperCase()}`), { slug: "pallar-4-pack", variantId: V });
  assert.deepEqual(lasKontaktParams("?produkt=pallar-4-pack&variant=nej"), { slug: "pallar-4-pack" });
  assert.equal(lasKontaktParams("?produkt=%3Cscript%3E"), null);
  assert.equal(lasKontaktParams(""), null);
  assert.deepEqual(lasKontaktParams("produkt=a-b"), { slug: "a-b" });
});

test("adresserna: produktsidan med ?variant= och formuläret med ankaret", () => {
  assert.equal(produktUrl({ slug: "a-b" }), "https://www.fyndplats.se/produkt/a-b");
  assert.equal(produktUrl({ slug: "a-b", variantId: V }), `https://www.fyndplats.se/produkt/a-b?variant=${V}`);
  assert.equal(produktSokvag({ slug: "a-b", variantId: V }), `/produkt/a-b?variant=${V}`);
  assert.equal(produktSokvag({ slug: "a-b" }), "/produkt/a-b");
  assert.equal(kontaktHref({ slug: "a-b" }), "/kontaktaoss?produkt=a-b#meddelande");
  assert.equal(kontaktHref({ slug: "a-b", variantId: V }), `/kontaktaoss?produkt=a-b&variant=${V}#meddelande`);
  // Formulärets läsare förstår formulärets länk.
  const href = kontaktHref({ slug: "a-b", variantId: V });
  assert.deepEqual(lasKontaktParams(href.slice(href.indexOf("?"), href.indexOf("#"))), { slug: "a-b", variantId: V });
});

test("e-postlänken: ämne och text ifyllda, mellanslag som %20 och radbrytningar som %0D%0A", () => {
  const href = mailtoHref({ slug: "trehjuling-rod", namn: "Trehjuling i rött med två korgar", val: "Röd", variantId: V });
  assert.ok(href.startsWith("mailto:info@fyndplats.com?subject="));
  assert.ok(!href.includes("+"), "inget plustecken, som vissa mejlprogram visar bokstavligt");
  assert.ok(href.includes("%0D%0A"));
  const q = new URLSearchParams(href.slice(href.indexOf("?") + 1));
  assert.equal(q.get("subject"), "Fråga om: Trehjuling i rött med två korgar");
  const body = q.get("body") ?? "";
  assert.ok(body.includes("Trehjuling i rött med två korgar (Röd)"));
  assert.ok(body.includes(`https://www.fyndplats.se/produkt/trehjuling-rod?variant=${V}`));
  assert.ok(body.startsWith("Hej!\r\n"));
});

test("ämnesraden kortas, men aldrig mitt i ett ord utan att det syns", () => {
  assert.equal(kortText("  a   b  ", 10), "a b");
  const lang = "Spegel ".repeat(40);
  const amne = amneFor(lang);
  assert.ok(amne.length <= "Fråga om: ".length + 120);
  assert.ok(amne.endsWith("…"));
});

test("fliken: den statiska texten har länkarna som bytet letar efter", () => {
  // Byts en länk i fliken utan att bytet följer med, ska provet fällas här och
  // inte tyst sluta byta på produktsidorna.
  const ut = kontaktFlikLankar(FLIK, { slug: "a-b", namn: "A" });
  assert.ok(FLIK.includes('href="/kontaktaoss"') && FLIK.includes('href="mailto:info@fyndplats.com"'));
  assert.ok(!ut.includes('href="/kontaktaoss"'), "formulärlänken byttes");
  assert.ok(!ut.includes('href="mailto:info@fyndplats.com"'), "e-postlänken byttes");
});

test("fliken: formuläret och e-posten får produkten, telefonen och vanliga frågor rörs inte", () => {
  const ut = kontaktFlikLankar(FLIK, { slug: "pallar-4-pack", namn: "Stapelbara pallar 4-pack", variantId: V, val: "Grå" });
  assert.ok(ut.includes(`href="/kontaktaoss?produkt=pallar-4-pack&amp;variant=${V}#meddelande"`));
  assert.ok(ut.includes('href="mailto:info@fyndplats.com?subject=F'));
  assert.ok(ut.includes('href="tel:+46736630990"'));
  assert.ok(ut.includes('href="/vanliga-fragor"'));
  // Texten i fliken är densamma; bara adresserna ändras.
  const utanHref = (s: string) => s.replace(/href="[^"]*"/g, 'href=""');
  assert.equal(utanHref(ut), utanHref(FLIK));
});

test("fliken: beskrivningens egna varianter av länkarna byts också", () => {
  const html =
    '<a href="https://www.fyndplats.se/kontaktaoss">A</a> <a href=\'/kontaktaoss/\'>B</a> ' +
    '<a href="/kontaktaoss#meddelande">C</a> <a href="mailto:info@fyndplats.com?subject=Hej">D</a> ' +
    '<a href="/kontaktaoss-gammal">E</a> <a href="mailto:annan@example.com">F</a>';
  const ut = kontaktFlikLankar(html, { slug: "a-b", namn: "A & B" });
  assert.equal((ut.match(/\/kontaktaoss\?produkt=a-b#meddelande/g) || []).length, 3);
  assert.equal((ut.match(/mailto:info@fyndplats\.com\?subject=Fr/g) || []).length, 1);
  assert.ok(ut.includes('href="/kontaktaoss-gammal"'), "en annan sida lämnas orörd");
  assert.ok(ut.includes('href="mailto:annan@example.com"'));
});

test("fliken: ett namn med citattecken och vinkelparenteser bryter inte ut ur attributet", () => {
  const ut = kontaktFlikLankar(FLIK, { slug: "a-b", namn: 'Bord "Lux" <script>alert(1)</script>' });
  assert.ok(!ut.includes("<script>"));
  const href = ut.match(/href="(mailto:[^"]*)"/)?.[1] ?? "";
  assert.ok(href.length > 0);
  assert.ok(!href.includes('"') && !href.includes("<"));
});

test("fliken: en annan variant ger andra länkar, och utan variant följer ingen med", () => {
  const V2 = "2427b440-f23e-45c5-97a6-b50cc02f8033";
  const en = kontaktFlikLankar(FLIK, { slug: "a-b", namn: "A", variantId: V });
  const tva = kontaktFlikLankar(FLIK, { slug: "a-b", namn: "A", variantId: V2 });
  const utan = kontaktFlikLankar(FLIK, { slug: "a-b", namn: "A" });
  assert.ok(en.includes(`variant=${V}`) && !en.includes(V2));
  assert.ok(tva.includes(`variant=${V2}`) && !tva.includes(V));
  assert.ok(!utan.includes("variant="));
});
