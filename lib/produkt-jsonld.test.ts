// lib/produkt-jsonld.test.ts
//
// Run: node --test --experimental-strip-types 'lib/**/*.test.ts'
//
// Vaktar rättningarna efter Search Console 2026-10-22 (Säljaruppgifter). Sidan
// och listsidorna är serverkomponenter som hämtar ur Wix, så testet läser
// källkoden i stället för att rendera den.
import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";

/** Källkoden utan rader som bara är kommentarer. */
function kod(fil: string): string {
  return readFileSync(join(process.cwd(), fil), "utf8").replace(/^\s*\/\/.*$/gm, "");
}

test("produktsidan anger hanteringstid, startdatum för priset och att kunden betalar returen", () => {
  const sida = kod("app/produkt/[slug]/page.tsx");
  assert.match(sida, /handlingTime:\s*\{[^}]*minValue:\s*HANDLING_MIN_DAYS[^}]*maxValue:\s*HANDLING_MAX_DAYS/);
  assert.match(sida, /transitTime:\s*\{[^}]*minValue:\s*TRANSIT_MIN_DAYS[^}]*maxValue:\s*TRANSIT_MAX_DAYS/);
  assert.match(sida, /validFrom:\s*prisGiltigFran\(/);
  assert.match(sida, /returnFees:\s*"https:\/\/schema\.org\/ReturnFeesCustomerResponsibility"/);
  // Kunden bokar och betalar returen själv. ReturnShippingFees betyder att vi
  // tar ut en avgift, och då kräver Google ett belopp vi inte har.
  assert.ok(!sida.includes("schema.org/ReturnShippingFees"));
});

test("listsidorna märker inte upp produkterna som varor", () => {
  const listor = kod("lib/seo/programmatic.ts");
  assert.ok(listor.includes("listsidansItemList("));
  for (const typ of ['"@type": "Product"', '"@type": "Offer"']) {
    assert.ok(!listor.includes(typ), `${typ} ska inte finnas i lib/seo/programmatic.ts`);
  }
});
