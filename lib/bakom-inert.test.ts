// Run: node --test --experimental-strip-types lib/bakom-inert.test.ts
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { gorBakomInert } from "./bakom-inert.ts";

type N = { tagName: string; parentElement: N | null; children: N[]; attr: Map<string, string>; hasAttribute(n: string): boolean; setAttribute(n: string, v: string): void; removeAttribute(n: string): void; namn: string };
function nod(namn: string, tagg = "DIV", barn: N[] = [], inert = false): N {
  const n: N = {
    namn, tagName: tagg, parentElement: null, children: barn, attr: new Map(inert ? [["inert", ""]] : []),
    hasAttribute(a) { return this.attr.has(a); }, setAttribute(a, v) { this.attr.set(a, v); }, removeAttribute(a) { this.attr.delete(a); },
  };
  for (const b of barn) b.parentElement = n;
  return n;
}

describe("allt utom sidhuvudet blir oåtkomligt", () => {
  const bygg = () => {
    const sokrad = nod("sökrad");
    const loggrad = nod("loggrad");
    const huvud = nod("sidhuvud", "HEADER", [loggrad, sokrad]);
    const remsa = nod("remsa", "ASIDE");
    const main = nod("main", "MAIN");
    const fot = nod("fot", "FOOTER");
    const lada = nod("stängd låda", "DIV", [], true);
    const skript = nod("skript", "SCRIPT");
    const omslag = nod("omslag", "DIV", [skript, remsa, huvud, main, fot, lada]);
    const kakor = nod("kakfråga");
    const body = nod("body", "BODY", [omslag, kakor]);
    return { body, huvud, remsa, main, fot, lada, skript, kakor, loggrad, sokrad, omslag };
  };
  const inerta = (t: Record<string, N>) => Object.values(t).filter((n) => n.attr.has("inert")).map((n) => n.namn).sort();

  it("syskonen till sidhuvudet och till dess förfäder får inert, vägen dit får det inte", () => {
    const t = bygg();
    gorBakomInert(t.huvud, t.body);
    assert.deepEqual(inerta(t), ["fot", "kakfråga", "main", "remsa", "stängd låda"]);
    assert.equal(t.huvud.attr.has("inert"), false);
    assert.equal(t.omslag.attr.has("inert"), false);
    // Det som ligger inne i sidhuvudet rörs inte.
    assert.equal(t.loggrad.attr.has("inert"), false);
    assert.equal(t.sokrad.attr.has("inert"), false);
  });

  it("skript och stilmallar rörs inte", () => {
    const t = bygg();
    gorBakomInert(t.huvud, t.body);
    assert.equal(t.skript.attr.has("inert"), false);
  });

  it("☠️ det som redan var inert ställs inte tillbaka: en stängd låda ska förbli stängd", () => {
    const t = bygg();
    const tillbaka = gorBakomInert(t.huvud, t.body);
    tillbaka();
    assert.deepEqual(inerta(t), ["stängd låda"]);
    // Två gånger gör ingenting mer.
    t.main.setAttribute("inert", "");
    tillbaka();
    assert.equal(t.main.attr.has("inert"), true);
  });
});
