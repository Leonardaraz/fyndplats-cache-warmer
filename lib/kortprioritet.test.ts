// Listsidornas kortbilder: vilka som förladdas.
// Mätt på /kategori/mobler 2026-11-12: fyra förladdade kortbilder med hög
// prioritet, fast kort tre och fyra låg under vikningen på telefonen och alla
// fyra under vikningen på datorn. Proven läser källan.
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const las = (...delar: string[]) => readFileSync(join(import.meta.dirname, "..", ...delar), "utf8");

describe("kortens bilder på listsidorna", () => {
  it("två kort förladdas, resten väntar", () => {
    const sb = las("components", "shopbrowser.tsx");
    assert.match(sb, /<ProductCard p=\{f\.p\} href=\{f\.href\} key=\{p\.slug\} priority=\{i < 2\} tvaKolumner \/>/);
    assert.doesNotMatch(sb, /priority=\{i < [3-9]\}/);
  });

  it("inget kort hämtas eager, för då förladdar Reacts server bilden ändå", () => {
    // React lägger en <link rel="preload"> i <head> för varje <img> som inte är
    // lazy (mätt 2026-11-12: kort tre och fyra med loading="eager" fick var sin).
    const g = las("components", "card-gallery.tsx");
    const huvud = g.slice(g.indexOf('className="pimg-main"'), g.indexOf("/>", g.indexOf('className="pimg-main"')));
    assert.match(huvud, /priority=\{priority\}/);
    assert.match(huvud, /fetchPriority=\{priority \? "high" : undefined\}/);
    assert.doesNotMatch(huvud, /loading=/);
    assert.doesNotMatch(las("components", "shopbrowser.tsx"), /\beager=/);
  });
});
