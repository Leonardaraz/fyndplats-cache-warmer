// Kortens andra bild läggs in först när besökaren rört sidan (Google Bilder,
// Leonards skärmbild 2026-11-14). Kör: node --test --experimental-strip-types lib/kort-andra-bild.test.ts

import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import {
  RORELSE_HANDELSER,
  harRortSidan,
  harRortSidanServer,
  nollstallRorelseForProv,
  prenumereraPaRorelse,
} from "./forsta-rorelse.ts";

const las = (fil: string) => readFileSync(new URL(`../${fil}`, import.meta.url), "utf8");

function medFonster<T>(f: (w: EventTarget & { lyssnare: Map<string, number> }) => T): T {
  const g = globalThis as { window?: unknown };
  const fore = g.window;
  const mal = new EventTarget() as EventTarget & { lyssnare: Map<string, number> };
  mal.lyssnare = new Map();
  const add = mal.addEventListener.bind(mal);
  const rem = mal.removeEventListener.bind(mal);
  mal.addEventListener = (typ: string, cb: EventListenerOrEventListenerObject | null, o?: AddEventListenerOptions | boolean) => {
    mal.lyssnare.set(typ, (mal.lyssnare.get(typ) ?? 0) + 1);
    add(typ, cb, o);
  };
  mal.removeEventListener = (typ: string, cb: EventListenerOrEventListenerObject | null, o?: EventListenerOptions | boolean) => {
    mal.lyssnare.set(typ, (mal.lyssnare.get(typ) ?? 0) - 1);
    rem(typ, cb, o);
  };
  g.window = mal;
  nollstallRorelseForProv();
  try {
    return f(mal);
  } finally {
    nollstallRorelseForProv();
    if (fore === undefined) delete g.window;
    else g.window = fore;
  }
}

test("☠️ bara en människas rörelse räknas: aldrig scroll, som sidan kan göra själv", () => {
  assert.deepEqual([...RORELSE_HANDELSER].sort(), ["keydown", "pointerdown", "pointermove", "touchstart", "wheel"]);
  assert.ok(!(RORELSE_HANDELSER as readonly string[]).includes("scroll"));
  // Servern och hydreringen säger alltid nej: bilden står aldrig i HTML:en.
  assert.equal(harRortSidanServer(), false);
});

test("flaggan slår om vid första rörelsen, meddelar alla kort en gång och släpper lyssnarna", () => {
  medFonster((w) => {
    let a = 0;
    let b = 0;
    assert.equal(harRortSidan(), false);
    const avA = prenumereraPaRorelse(() => a++);
    prenumereraPaRorelse(() => b++);
    // Lyssnarna läggs en gång, hur många kort som än prenumererar.
    for (const h of RORELSE_HANDELSER) assert.equal(w.lyssnare.get(h), 1, h);
    // En sida som rullar av sig själv räknas inte.
    w.dispatchEvent(new Event("scroll"));
    w.dispatchEvent(new Event("resize"));
    assert.equal(harRortSidan(), false);
    assert.equal(a + b, 0);
    w.dispatchEvent(new Event("pointermove"));
    assert.equal(harRortSidan(), true);
    assert.deepEqual([a, b], [1, 1]);
    for (const h of RORELSE_HANDELSER) assert.equal(w.lyssnare.get(h), 0, `${h} borttagen`);
    // Fler rörelser ändrar ingenting.
    w.dispatchEvent(new Event("keydown"));
    assert.deepEqual([a, b], [1, 1]);
    avA();
  });
  for (const h of RORELSE_HANDELSER) {
    medFonster((w) => {
      prenumereraPaRorelse(() => {});
      w.dispatchEvent(new Event(h));
      assert.equal(harRortSidan(), true, h);
    });
  }
  // Ett kort som slutat lyssna meddelas inte.
  medFonster((w) => {
    let n = 0;
    const av = prenumereraPaRorelse(() => n++);
    av();
    w.dispatchEvent(new Event("touchstart"));
    assert.equal(n, 0);
  });
});

test("båda korten lägger in andra bilden genom KortAndraBild, aldrig direkt i HTML:en", () => {
  const galleri = las("components/card-gallery.tsx");
  const auktion = las("components/auction-card.tsx");
  for (const [namn, text] of [["card-gallery", galleri], ["auction-card", auktion]] as const) {
    assert.doesNotMatch(text, /className="pimg-alt"/, namn);
    assert.match(text, /<KortAndraBild src=\{tightFillUrl\(/, namn);
    assert.match(text, /import \{ KortAndraBild \} from "\.\/kort-andra-bild";/, namn);
  }
  // Svepets ruta står kvar från början: prickarna och raden ändras inte av rörelsen.
  assert.match(galleri, /<div className="pimg-slide">\s*<KortAndraBild/);
  const komp = las("components/kort-andra-bild.tsx");
  assert.match(komp, /^"use client";/);
  assert.match(komp, /useSyncExternalStore\(prenumereraPaRorelse, harRortSidan, harRortSidanServer\)/);
  assert.match(komp, /if \(!rord\) return null;/);
  assert.match(komp, /className="pimg-alt"/);
  assert.match(komp, /alt=""/);
  assert.match(komp, /data-klar=\{klar \? "" : undefined\}/);
  assert.match(komp, /onLoad=\{\(\) => setKlar\(true\)\}/);
});

test("☠️ hover-bytet tömmer aldrig kortet: huvudbilden tonas bort bara när andra bilden är laddad", () => {
  const css = las("app/globals.css");
  const hover = /@media \(hover:hover\)\{\n([\s\S]*?)\n\}/.exec(css);
  assert.ok(hover, "hover-blocket saknas");
  assert.match(hover[1], /\.prod:hover \.pimg-alt\[data-klar\]\{opacity:1\}/);
  assert.match(hover[1], /\.prod:hover \.pimg:has\(\.pimg-alt\[data-klar\]\) \.pimg-main\{opacity:0\}/);
  // Ingen regel i hela filen tonar bort huvudbilden utan villkoret.
  assert.doesNotMatch(css, /\.prod:hover \.pimg-main\{opacity:0\}/);
  assert.doesNotMatch(css, /\.prod:hover \.pimg-alt\{opacity:1\}/);
});
