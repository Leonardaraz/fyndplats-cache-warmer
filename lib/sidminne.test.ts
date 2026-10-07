// Signalerna som avgör om produktsidan ska rullas till bilderna och om en
// listsida ska återställa sina kort (lib/sidminne.ts).

import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { klickadeHit, komMedHistoriken, lasListlage, sparaListlage, LISTLAGE_MAX_MS, SIGNAL_MS, type Fonster } from "./sidminne.ts";

const T = 1_800_000_000_000;

test("ett färskt tryck mot sökvägen flyttar produktsidan, inget annat gör det", () => {
  const w: Fonster = { __fpKlick: { p: "/produkt/stol", t: T } };
  assert.equal(klickadeHit(w, "/produkt/stol", T + 400), true);
  assert.equal(klickadeHit(w, "/produkt/bord", T + 400), false, "annan sökväg");
  assert.equal(klickadeHit(w, "/produkt/stol", T + SIGNAL_MS + 1), false, "för gammalt");
  assert.equal(klickadeHit({}, "/produkt/stol", T), false, "hel sidladdning, inget tryck");
  assert.equal(klickadeHit({ ...w, __fpTrav: T + 100 }, "/produkt/stol", T + 400), false, "bakåt efter trycket");
});

test("bakåt känns igen mjukt och hårt, men inte efter ett nytt tryck", () => {
  assert.equal(komMedHistoriken({ __fpTrav: T }, T + 300, "navigate"), true, "popstate nyss");
  assert.equal(komMedHistoriken({ __fpTrav: T - SIGNAL_MS - 1 }, T, "navigate"), false, "gammal popstate");
  assert.equal(komMedHistoriken({ __fpTrav: T, __fpKlick: { p: "/k", t: T + 50 } }, T + 300, "navigate"), false, "tryck efter bakåt");
  assert.equal(komMedHistoriken({}, T, "back_forward"), true, "hel sidladdning via bakåt");
  assert.equal(komMedHistoriken({ __fpKlick: { p: "/k", t: T } }, T + 300, "back_forward"), false, "dokumentet har navigerat sedan");
  assert.equal(komMedHistoriken({}, T, "navigate"), false);
  assert.equal(komMedHistoriken({}, T, "reload"), false);
});

function lagring() {
  const m = new Map<string, string>();
  return { getItem: (k: string) => m.get(k) ?? null, setItem: (k: string, v: string) => void m.set(k, v), m };
}

test("listläget sparas per adress och läses tillbaka", () => {
  const s = lagring();
  sparaListlage(s, "/kategori/mobler?farg=svart", { shown: 72, href: "/produkt/stol", top: 166, t: T });
  assert.deepEqual(lasListlage(s, "/kategori/mobler?farg=svart", T + 5000), { shown: 72, href: "/produkt/stol", top: 166, t: T });
  assert.equal(lasListlage(s, "/kategori/mobler", T + 5000), null, "andra filter är en annan lista");
  assert.equal(lasListlage(s, "/kategori/mobler?farg=svart", T + LISTLAGE_MAX_MS + 1), null, "för gammalt");
});

test("trasigt eller otillgängligt lager ger inget läge och inget fel", () => {
  const s = lagring();
  s.m.set("fp-listlage:/a", "{inte json");
  assert.equal(lasListlage(s, "/a", T), null);
  s.m.set("fp-listlage:/b", JSON.stringify({ shown: "72", href: "/p", top: 1, t: T }));
  assert.equal(lasListlage(s, "/b", T), null);
  const kastar = { getItem: () => { throw new Error("SecurityError"); }, setItem: () => { throw new Error("QuotaExceeded"); } };
  assert.equal(lasListlage(kastar, "/a", T), null);
  assert.doesNotThrow(() => sparaListlage(kastar, "/a", { shown: 24, href: "/p", top: 0, t: T }));
});

test("sidhuvudets skript sätter båda signalerna", () => {
  const src = readFileSync(new URL("../app/layout.tsx", import.meta.url), "utf8");
  assert.match(src, /window\.__fpKlick=\{p:u\.pathname,t:Date\.now\(\)\}/);
  assert.match(src, /addEventListener\('popstate',function\(\)\{window\.__fpTrav=Date\.now\(\)/);
});
