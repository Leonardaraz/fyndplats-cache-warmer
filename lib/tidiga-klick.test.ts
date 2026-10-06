// Tidiga tryck på filterknapparna (lib/tidiga-klick.ts): skriptet i
// sidhuvudet fångar och markerar, ShopBrowser gör om trycken när React är på
// plats. Testet kör skriptet mot en liten låtsas-DOM.

import { test } from "node:test";
import assert from "node:assert/strict";
import { TIDIGA_KLICK_SKRIPT, spelaUppTidigaKlick } from "./tidiga-klick.ts";

class Klasser {
  s = new Set<string>();
  contains(c: string) { return this.s.has(c); }
  toggle(c: string) { if (this.s.has(c)) this.s.delete(c); else this.s.add(c); }
}

class El {
  classList = new Klasser();
  isConnected = true;
  disabled = false;
  klick = 0;
  attr: Record<string, string>;
  forald: El | null;
  constructor(attr: Record<string, string> = {}, forald: El | null = null, klass = "") {
    this.attr = attr;
    this.forald = forald;
    for (const k of klass.split(" ").filter(Boolean)) this.classList.s.add(k);
  }
  getAttribute(n: string) { return this.attr[n] ?? null; }
  closest(sel: string): El | null {
    const traffar = (e: El) =>
      sel === "[data-tidigt]" ? "data-tidigt" in e.attr : sel.startsWith(".") && e.classList.contains(sel.slice(1));
    if (traffar(this)) return this;
    return this.forald ? this.forald.closest(sel) : null;
  }
  click() { this.klick++; }
}

function miljo() {
  const lyssnare: ((e: unknown) => void)[] = [];
  const alla: El[] = [];
  const doc = {
    addEventListener: (_t: string, f: (e: unknown) => void) => lyssnare.push(f),
    querySelector: (sel: string) => {
      const v = /^\[data-tidigt="(.*)"\]$/.exec(sel)?.[1];
      return alla.find((e) => e.isConnected && e.attr["data-tidigt"] === v) ?? null;
    },
  };
  const w: Record<string, unknown> = {};
  new Function("window", "document", TIDIGA_KLICK_SKRIPT)(w, doc);
  const tryck = (mal: El) => {
    const e = { target: mal, hindrad: false, stoppad: false,
      preventDefault() { this.hindrad = true; }, stopImmediatePropagation() { this.stoppad = true; } };
    lyssnare.forEach((f) => f(e));
    return e;
  };
  const nytt = (attr: Record<string, string>, forald: El | null = null, klass = "") => {
    const e = new El(attr, forald, klass);
    alla.push(e);
    return e;
  };
  return { w, doc, tryck, nytt };
}

const vanta = () => new Promise((r) => setTimeout(r, 20));

test("ett tidigt tryck på en färg markeras direkt och görs om efteråt", async () => {
  const m = miljo();
  const bar = m.nytt({}, null, "shopbar");
  const svart = m.nytt({ "data-tidigt": "farg:svart" }, bar, "farg-ruta");
  const e = m.tryck(svart);
  assert.ok(e.hindrad && e.stoppad);
  assert.ok(svart.classList.contains("on"), "syns som vald direkt");
  assert.equal(svart.klick, 0);

  spelaUppTidigaKlick(m.w as never, m.doc as never);
  await vanta();
  assert.equal(svart.klick, 1);
  assert.ok(!svart.classList.contains("on"), "markeringen lämnas tillbaka till React");
});

test("ordningen behålls: öppna panelen, välj färg, stäng", async () => {
  const m = miljo();
  const bar = m.nytt({}, null, "shopbar");
  const filter = m.nytt({ "data-tidigt": "filter" }, bar);
  const gron = m.nytt({ "data-tidigt": "farg:gron" }, bar);
  const stang = m.nytt({ "data-tidigt": "stang" }, bar);
  const ordning: string[] = [];
  for (const [n, el] of [["filter", filter], ["gron", gron], ["stang", stang]] as const) {
    el.click = () => { ordning.push(n); };
  }
  m.tryck(filter);
  assert.ok(bar.classList.contains("open"), "panelen öppnas direkt");
  m.tryck(gron);
  m.tryck(stang);
  assert.ok(!bar.classList.contains("open"));

  spelaUppTidigaKlick(m.w as never, m.doc as never);
  await vanta();
  assert.deepEqual(ordning, ["filter", "gron", "stang"]);
});

test("stäng utan öppen panel, tom eller avstängd knapp fångas inte", () => {
  const m = miljo();
  const bar = m.nytt({}, null, "shopbar");
  const stang = m.nytt({ "data-tidigt": "stang" }, bar);
  const tom = m.nytt({ "data-tidigt": "val:eg:hj" }, bar, "toggle is-tom");
  const av = m.nytt({ "data-tidigt": "farg:rosa" }, bar);
  av.disabled = true;
  const annan = m.nytt({}, bar);
  for (const el of [stang, tom, av, annan]) assert.equal(m.tryck(el).hindrad, false);
});

test("efter uppspelningen fångas ingenting, React tar trycken själv", () => {
  const m = miljo();
  const svart = m.nytt({ "data-tidigt": "farg:svart" });
  spelaUppTidigaKlick(m.w as never, m.doc as never);
  assert.equal(m.tryck(svart).hindrad, false);
  assert.ok(!svart.classList.contains("on"));
});

test("har React bytt ut knappen görs trycket om på den nya", async () => {
  const m = miljo();
  const gammal = m.nytt({ "data-tidigt": "val:mat:tra" }, null, "toggle");
  m.tryck(gammal);
  gammal.isConnected = false;
  const ny = m.nytt({ "data-tidigt": "val:mat:tra" }, null, "toggle");
  spelaUppTidigaKlick(m.w as never, m.doc as never);
  await vanta();
  assert.equal(ny.klick, 1);
  assert.equal(gammal.klick, 0);
});

test("en färg som blivit tom av ett tidigare val trycks inte", async () => {
  const m = miljo();
  const rosa = m.nytt({ "data-tidigt": "farg:rosa" });
  m.tryck(rosa);
  rosa.disabled = true;
  spelaUppTidigaKlick(m.w as never, m.doc as never);
  await vanta();
  assert.equal(rosa.klick, 0);
});
