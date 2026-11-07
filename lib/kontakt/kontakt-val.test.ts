// lib/kontakt/kontakt-val.test.ts
//
// Run with: `pnpm test` (node --test --experimental-strip-types).
// Produktens val och pris i kontaktformuläret: en axel, flera axlar, okänt
// variant-id och priset med "Från".

import test from "node:test";
import assert from "node:assert/strict";
import { byggKontaktProdukt, kontaktVal, MAX_VAL, prisText, type Formatering, type ProduktKalla } from "./kontakt.ts";
import { formatPrice } from "../price-range.ts";
import { visaValnamn } from "../variant-lage.ts";

// Samma format som servern skickar in (KONTAKT_FORMAT i lib/kontakt/produkt.ts).
const F: Formatering = { pris: formatPrice, valnamn: visaValnamn };

const V1 = "10b7ad08-afaa-4668-a840-f4643fd1d2b5";
const V2 = "2427b440-f23e-45c5-97a6-b50cc02f8033";
const TOM = "00000000-0000-0000-0000-000000000000";

const val = (label: string, variantId: string, extra: Record<string, unknown> = {}) => ({
  label, image: "", color: "", variantId, price: "", priceNum: 0, originalPrice: "", ...extra,
});

const bas: ProduktKalla = {
  slug: "trehjuling",
  name: "Trehjuling med två korgar",
  img: "https://static.wixstatic.com/media/b379ce_huvud~mv2.jpg",
  inStock: true,
  price: "879,00 kr",
  priceNum: 879,
  options: null,
};

test("en axel: valen med produktsidans namn, i sidans ordning", () => {
  const p: ProduktKalla = {
    ...bas,
    options: {
      name: "Färg",
      choices: [
        val("röd", V1, { priceNum: 879, inStock: true, image: "https://static.wixstatic.com/media/b379ce_rod~mv2.jpg" }),
        val("Blå", V2, { priceNum: 899, inStock: false }),
        val("Utan id", ""),
        val("Tom", TOM),
      ],
    },
  };
  const ut = kontaktVal(p, F);
  assert.deepEqual(ut.map((v) => v.id), [V1, V2], "val utan riktigt variant-id kommer inte med");
  assert.equal(ut[0].namn, "Röd", "stor bokstav som på produktsidan");
  assert.equal(ut[0].pris, "879 kr");
  assert.equal(ut[1].iLager, false);
  assert.equal(ut[0].bild, "https://static.wixstatic.com/media/b379ce_rod~mv2.jpg");
  assert.equal("bild" in ut[1], false);
});

test("flera axlar: varje rad i tabellen blir ett val med axlarnas värden i axlarnas ordning", () => {
  const p: ProduktKalla = {
    ...bas,
    variantAxes: [
      { name: "Färg", choices: [] },
      { name: "Storlek", choices: [] },
    ],
    variantTable: [
      { choices: { Storlek: "140 × 200 cm", Färg: "Svart" }, variantId: V1.toUpperCase(), price: "", priceNum: 1099, originalPrice: "", inStock: true, image: "" },
      { choices: { Storlek: "160 × 200 cm", Färg: "Svart" }, variantId: V2, price: "", priceNum: 1299, originalPrice: "", inStock: false, image: "" },
    ],
  };
  const ut = kontaktVal(p, F);
  assert.deepEqual(ut.map((v) => v.namn), ["Svart · 140 × 200 cm", "Svart · 160 × 200 cm"]);
  assert.equal(ut[0].id, V1, "id:t i gemener, som produktsidans ?variant=");
  assert.equal(ut[1].pris, "1\u00a0299 kr", "hårt mellanslag mellan tusental, som formatPrice");
});

test("aldrig fler än MAX_VAL val", () => {
  const choices = Array.from({ length: MAX_VAL + 15 }, (_, i) =>
    val(`Val ${i}`, `${String(i).padStart(8, "0")}-0000-4000-8000-000000000001`),
  );
  assert.equal(kontaktVal({ ...bas, options: { name: "Modell", choices } }, F).length, MAX_VAL);
});

test("pristexten: Från när varianterna kostar olika, annars priset", () => {
  assert.equal(prisText({ ...bas }, F), "879 kr");
  assert.equal(prisText({ ...bas, hasRange: true, priceFromNum: 1179, priceFrom: "1179,00kr" }, F), "Från 1\u00a0179 kr");
  assert.equal(prisText({ ...bas, hasRange: true, priceFrom: "1179,00kr" }, F), "Från 1179,00kr");
  assert.equal(prisText({ ...bas, priceNum: 0, price: "Pris saknas" }, F), "Pris saknas");
});

test("byggKontaktProdukt: det utpekade valet styr namn, pris, bild, lager och länk", () => {
  const p: ProduktKalla = {
    ...bas,
    hasRange: true,
    priceFromNum: 879,
    options: {
      name: "Färg",
      choices: [
        val("Röd", V1, { priceNum: 879, inStock: true, image: "https://static.wixstatic.com/media/b379ce_rod~mv2.jpg" }),
        val("Blå", V2, { priceNum: 899, inStock: false }),
      ],
    },
  };
  const blå = byggKontaktProdukt(p, V2.toUpperCase(), F);
  assert.equal(blå.valtId, V2);
  assert.equal(blå.valtNamn, "Blå");
  assert.equal(blå.pris, "899 kr");
  assert.equal(blå.iLager, false);
  assert.equal(blå.bild, bas.img, "valet saknar egen bild: produktens");
  assert.equal(blå.url, `https://www.fyndplats.se/produkt/trehjuling?variant=${V2}`);

  const röd = byggKontaktProdukt(p, V1, F);
  assert.equal(röd.bild, "https://static.wixstatic.com/media/b379ce_rod~mv2.jpg");

  const okänd = byggKontaktProdukt(p, "9d3b09cc-df1d-4a80-8349-37ba62f3a5b4", F);
  assert.equal(okänd.valtId, undefined, "ett id som inte finns bland valen är inget val");
  assert.equal(okänd.pris, "Från 879 kr");
  assert.equal(okänd.url, "https://www.fyndplats.se/produkt/trehjuling");
  assert.equal(okänd.val.length, 2);

  const skräp = byggKontaktProdukt(p, "inte-ett-id", F);
  assert.equal(skräp.valtId, undefined);
});
