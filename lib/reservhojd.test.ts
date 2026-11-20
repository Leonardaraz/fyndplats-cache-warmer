// Run: node --test --experimental-strip-types lib/reservhojd.test.ts
//
// ☠️ aspect-ratio finns först i Safari 15.0. På en riktig iPhone 12 med iOS 14.7
// hade produktkortens platta höjden 0 den 20 november 2026: listorna visade
// namn och pris men inga bilder, och produktsidans miniatyrer var streck.
// Butiken är byggd för iOS 14 och senare (browserslist i package.json).
//
// En ruta som får sin höjd av aspect-ratio och bara har absolut placerade barn
// faller ihop till noll utan den. Varje sådan ruta har därför en reserv i ett
// @supports not (aspect-ratio:1/1)-block: en ::before med padding-top, som ger
// samma höjd. En spärr man måste komma ihåg glöms bort, så det här provet läser
// stilfilerna och fäller om en väljare med aspect-ratio varken har en reserv
// eller står i listan över undantag, med skälet utskrivet.
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const las = (...delar: string[]) => readFileSync(join(import.meta.dirname, "..", ...delar), "utf8");
const utanKommentarer = (s: string) => s.replace(/\/\*[\s\S]*?\*\//g, "");
const FILER = [["app", "globals.css"], ["app", "startsida.css"], ["app", "butik", "butik.css"]];
const css = FILER.map((f) => utanKommentarer(las(...f)));

/** Innehållet i varje @supports not (aspect-ratio:1/1){…}, med klamrarna räknade. */
function reservblock(text: string): string[] {
  const ut: string[] = [];
  const start = "@supports not (aspect-ratio:1/1){";
  let i = text.indexOf(start);
  while (i !== -1) {
    let djup = 1;
    let j = i + start.length;
    while (j < text.length && djup > 0) {
      if (text[j] === "{") djup++;
      else if (text[j] === "}") djup--;
      j++;
    }
    ut.push(text.slice(i + start.length, j - 1));
    i = text.indexOf(start, j);
  }
  return ut;
}

const reserv = css.flatMap(reservblock).join("\n");
const utanReserv = css.map((t) => {
  let ut = t;
  for (const b of reservblock(t)) ut = ut.replace(b, "");
  return ut;
}).join("\n");

/** Varje (väljare, förhållande) som bär aspect-ratio utanför reservblocken. auto räknas inte. */
function medAspectRatio(): { valjare: string; andel: number }[] {
  const ut: { valjare: string; andel: number }[] = [];
  for (const m of utanReserv.matchAll(/([^{}]+)\{([^{}]*)\}/g)) {
    const d = /(?:^|;)\s*aspect-ratio:\s*([^;}]+)/.exec(m[2]);
    if (!d || d[1].trim() === "auto") continue;
    const [b, h] = d[1].split("/").map((x) => Number(x.trim()));
    const andel = (Number.isFinite(h) ? h : 1) / b;
    for (const v of m[1].split(",")) {
      const valjare = v.trim();
      if (valjare && !valjare.startsWith("@")) ut.push({ valjare, andel });
    }
  }
  return ut;
}

// Rutor som inte faller ihop utan aspect-ratio, eller som inte används. Skälet
// står här, så att den som lägger till en rad måste ta ställning.
const UNDANTAG: Record<string, string> = {
  ".herotile": "brickan har text i flödet och fasta rader i startsidans rutnät",
  ".gallery .gmain": "höjden kommer av bilden i flödet (mätt på iOS 14.7: 336 × 336)",
  ".gallery .gmain img": "bilden bär width och height och får sin form av dem",
  ".gallery .gmain img.ghero-layer.ghero-base": "samma bild som ovan",
  ".gallery .gmain-empty": "ikon och text i flödet ger höjden",
  ".gvideo": "videon ligger i flödet och ger rutan sin höjd; rutan blir lägre än bilden",
  ".prose figure.blog-product-img img": "bilden bär sin egen form",
  ".catmtile-grid": "används inte i någon komponent",
  ".butik-cat-imgwrap": "används inte i någon komponent",
  ".homecat-img": "används inte i någon komponent",
  ".homecat-mosaic": "används inte i någon komponent",
};

// Rutor vars reserv inte är en ::before med padding-top.
const EGEN_RESERV: Record<string, RegExp> = {
  // Hjältens bildruta får bredden av höjden. Utan aspect-ratio fyller den
  // brickans bredd, och fotot står centrerat i den (object-fit:contain).
  ".hem2 .hbild": /\.hem2 \.hbild\{justify-self:stretch\}/,
  // Rutan "Hela sortimentet" har text i flödet; de andra avdelningsrutorna
  // får reserven, och väljaren undantar den uttryckligen.
  ".butik2 .b2-avd-bild": /\.butik2 \.b2-avd-bild:not\(\.b2-alla-yta\)::before\{content:"";display:block;padding-top:75%\}/,
};

const esc = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

describe("rutor med aspect-ratio har en reservhöjd för Safari före 15", () => {
  const alla = medAspectRatio();

  it("provet hittar stilfilernas rutor och reservblocken", () => {
    assert.ok(alla.length >= 20, `bara ${alla.length} väljare med aspect-ratio hittades`);
    assert.ok(alla.some((r) => r.valjare === ".prod .pimg" && r.andel === 1));
    assert.equal(css.flatMap(reservblock).length, 3, "ett reservblock per stilfil väntas");
  });

  it("varje väljare har en reserv med rätt höjd, eller står bland undantagen med skäl", () => {
    const saknar: string[] = [];
    for (const { valjare, andel } of alla) {
      if (UNDANTAG[valjare]) continue;
      if (EGEN_RESERV[valjare]) {
        if (!EGEN_RESERV[valjare].test(reserv)) saknar.push(`${valjare}: den egna reserven står inte i reservblocket`);
        continue;
      }
      // Väljaren ska stå med ::before i en regel som sätter padding-top till
      // höjden i procent av bredden.
      const procent = [...reserv.matchAll(new RegExp(`(?:^|[{},\\n])\\s*${esc(valjare)}::before(?:,[^{]*)?\\{[^}]*padding-top:([\\d.]+)%`, "g"))].map((m) => Number(m[1]));
      const vantad = andel * 100;
      if (!procent.some((p) => Math.abs(p - vantad) < 0.01)) {
        saknar.push(`${valjare}: väntade ::before med padding-top ${vantad.toFixed(3)} %, fann ${procent.length ? procent.join(", ") : "ingen"}`);
      }
    }
    assert.deepEqual(saknar, [], `lägg en reserv i @supports not (aspect-ratio:1/1), eller ett undantag med skäl:\n${saknar.join("\n")}`);
  });

  it("undantagen och de egna reserverna pekar på väljare som finns kvar", () => {
    const finns = new Set(alla.map((r) => r.valjare));
    for (const v of [...Object.keys(UNDANTAG), ...Object.keys(EGEN_RESERV)]) assert.ok(finns.has(v), `${v} bär inte längre aspect-ratio: ta bort raden`);
  });

  it("reserven fyller rutan: ::before är ett block med innehåll", () => {
    for (const m of reserv.matchAll(/([^{}]+::before)\{([^}]*padding-top:[^}]*)\}/g)) {
      // Regeln som bara byter höjden i en mediefråga ärver resten.
      if (/^padding-top:[\d.]+%$/.test(m[2])) continue;
      assert.match(m[2], /^content:"";display:block;padding-top:[\d.]+%$/, m[1].trim());
    }
  });

  it("menyernas bilder läggs absolut i reservrutan", () => {
    assert.match(reserv, /\.mm-alla-bild,\.meganav-feature-bild\{position:relative\}/);
    assert.match(reserv, /\.mm-alla-bild img,\.meganav-feature-bild img\{position:absolute;top:0;left:0\}/);
  });

  it("butiken är fortfarande byggd för iOS 14: annars kan reserven tas bort", () => {
    const paket = JSON.parse(las("package.json")) as { browserslist?: string[] };
    assert.ok(paket.browserslist?.includes("iOS >= 14"), "browserslist säger inte längre iOS >= 14");
  });
});
