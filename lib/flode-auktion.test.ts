// Run: node --test --experimental-strip-types 'lib/**/*.test.ts'
//
// Produktflödena utesluter fyndauktionens varor (2026-11-04, lib/flode-auktion.ts).
// Prisjakts två flöden byggs ur Google-flödet och ärver uteslutningen.
import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const rot = join(import.meta.dirname, "..");
const las = (f: string) => readFileSync(join(rot, f), "utf8");

test("Google, Meta och PriceRunner filtrerar bort levande och schemalagda fynd", () => {
  for (const f of ["app/feed/google.xml/route.ts", "app/feed/products.xml/route.ts", "app/api/feed/products.xml/route.ts"]) {
    const s = las(f);
    assert.match(s, /auktionensProdukter\(\)/, `${f}: läser auktionens varor`);
    assert.match(s, /\.filter\(\(p\) => !auktion\.has\(p\.id\)\)/, `${f}: filtrerar på produkt-id`);
  }
});

test("Prisjakts flöden byggs ur Google-flödet och ärver uteslutningen", () => {
  for (const f of ["app/feed/prisjakt.xml/route.ts", "app/feed/[fil]/route.ts"]) {
    assert.match(las(f), /googleFeed\(\)/, f);
  }
});
