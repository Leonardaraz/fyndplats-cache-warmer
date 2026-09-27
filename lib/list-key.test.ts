// Run: node --test --experimental-strip-types 'lib/**/*.test.ts'
//
// Nyckeln till /api/lista kommer från en URL och slås upp mot katalogen —
// bara de tre formerna sidorna faktiskt använder får gå igenom.
import test from "node:test";
import assert from "node:assert/strict";
import { listaUrl, tolkaNyckel } from "./list-key.ts";

test("giltiga nycklar tolkas och går tur och retur genom adressen", () => {
  for (const k of ["alla", "rea", "kategori/hem-inredning", "kategori/tv-bankar-2f1a"] as const) {
    assert.equal(tolkaNyckel(k), k);
    const url = new URL(listaUrl(k), "https://www.fyndplats.se");
    assert.equal(url.pathname, "/api/lista");
    assert.equal(tolkaNyckel(url.searchParams.get("k")), k);
  }
});

test("allt annat avvisas", () => {
  for (const k of [null, undefined, "", "Alla", "kategori/", "kategori/Hem", "kategori/../x", "kategori/a/b", "produkt/x", `kategori/${"a".repeat(121)}`]) {
    assert.equal(tolkaNyckel(k), null, String(k));
  }
});
