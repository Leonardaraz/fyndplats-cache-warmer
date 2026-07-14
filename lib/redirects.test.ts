import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { sanitizeRedirectTarget } from "./redirects.ts";

// Valideringen är sista försvarslinjen mellan CMS-datat och Location-headern —
// en felskriven/manipulerad rad får aldrig skicka besökare externt eller
// smuggla headerinnehåll.
describe("sanitizeRedirectTarget", () => {
  it("släpper igenom interna absoluta sökvägar", () => {
    assert.equal(sanitizeRedirectTarget("/produkt/airfryer-7-liter"), "/produkt/airfryer-7-liter");
    assert.equal(sanitizeRedirectTarget("/kategori/leksaker-spel"), "/kategori/leksaker-spel");
    assert.equal(sanitizeRedirectTarget("  /butik  "), "/butik");
  });

  it("stoppar externa och protokoll-relativa URL:er", () => {
    assert.equal(sanitizeRedirectTarget("https://evil.example/phish"), null);
    assert.equal(sanitizeRedirectTarget("//evil.example/phish"), null);
    assert.equal(sanitizeRedirectTarget("http://fyndplats.se/produkt/x"), null);
  });

  it("stoppar relativa sökvägar, tomt och fel typ", () => {
    assert.equal(sanitizeRedirectTarget("produkt/x"), null);
    assert.equal(sanitizeRedirectTarget(""), null);
    assert.equal(sanitizeRedirectTarget(undefined), null);
    assert.equal(sanitizeRedirectTarget(42), null);
  });

  it("stoppar whitespace/CRLF-smuggling i sökvägen", () => {
    assert.equal(sanitizeRedirectTarget("/produkt/x\r\nSet-Cookie: a=b"), null);
    assert.equal(sanitizeRedirectTarget("/produkt/x y"), null);
  });
});
