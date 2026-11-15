// Favoriternas fart (2026-11-15). Proven håller ihop det som mättes på www i
// telefonläge med processorn strypt 4×: en stilla sida två sekunder efter ett
// tryck på ett hjärta arbetade 248 ms av 2 000 (en väntepuls i den stängda
// lådan och auktionspricken i den stängda mobilmenyn), mot 2 ms utan dem.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const rot = new URL("../", import.meta.url);
const las = (fil: string) => readFileSync(new URL(fil, rot), "utf8");

test("lådans rader står bara i en öppen låda, och medan den glider ut", () => {
  const s = las("components/favoriter-lada.tsx");
  assert.match(s, /\) : monterad \? \(\s*<Favoritrader /);
  assert.match(s, /if \(open && !monterad\) setMonterad\(true\);/);
  assert.match(s, /setTimeout\(\(\) => setMonterad\(false\), UTGLIDNING_MS\)/);
  // Raderna står kvar tills lådan glidit ut (.drawer i globals.css).
  const ms = Number(s.match(/const UTGLIDNING_MS = (\d+);/)?.[1]);
  const glid = las("app/globals.css").match(/\n\.drawer\{[^}]*transition:transform (\.\d+)s/)?.[1];
  assert.ok(glid, "lådans glidning hittades inte i globals.css");
  assert.ok(ms >= Number(`0${glid}`) * 1000, `${ms} ms räcker inte för glidningen ${glid} s`);
});

test("hjärtknappen frågar i förväg: musen över, fingret ner och tangentbordets fokus", () => {
  const s = las("components/wishlist.tsx");
  const knapp = s.slice(s.indexOf("export function WishlistButton"));
  assert.match(knapp, /const forvarna = \(\) => forvarmFavoriter\(lista\);/);
  for (const h of ["onPointerEnter", "onPointerDown", "onFocus"]) assert.match(knapp, new RegExp(`${h}=\\{forvarna\\}`), h);
});

test("hämtningen är en liten fil utan React, delad av raderna och hjärtknappen", () => {
  const h = las("components/favoriter-hamtning.ts");
  assert.doesNotMatch(h, /from "react"/);
  assert.doesNotMatch(h, /from "\.\/[a-z-]+"/, "går med sidhuvudet till varje sida: inga komponenter");
  // Ingen fråga för en tom lista eller när svaret är färskt.
  assert.match(h, /if \(lista\.length === 0 \|\| farsktSvar\(lista\)\) return;/);
  // En fråga per lista åt gången.
  assert.match(h, /if \(pagaende\?\.adress === adress\) return pagaende\.lofte;/);
  const r = las("components/favoriter-rader.tsx");
  assert.match(r, /from "\.\/favoriter-hamtning"/);
  assert.doesNotMatch(r, /fetch\(/, "raderna frågar bara genom den delade hämtningen");
  assert.doesNotMatch(r, /let senaste|let pagaende/);
  assert.match(las("components/wishlist.tsx"), /import \{ forvarmFavoriter \} from "\.\/favoriter-hamtning";/);
});

test("ingen oskärpa bakom kortens hjärta, och ingen puls i en stängd mobilmeny", () => {
  const css = las("app/globals.css");
  const hjarta = css.match(/\.wl-heart\{[^}]*\}/g) ?? [];
  assert.ok(hjarta.length > 0);
  for (const r of hjarta) assert.doesNotMatch(r, /backdrop-filter/);
  assert.match(css, /\n\.mobilemenu:not\(\.open\) \.nav-adot::after\{animation:none\}/);
});
