// lib/hallen.test.ts — fyndauktionens hall (Leonard 2026-11-26: "bakrunden
// ... 3d kodad premium loook och att sidan är hastighetsoptimerad") och
// sidans snabbhet: scenen ska stå still när ingen rör den.
//
// Uppmätt på www samma dag (iPhone 13 i Chromium, processorn strypt 4×):
// huvudtråden var upptagen hela tiden fast ingen rörde sidan, och stilen
// räknades om ungefär 100 ms per sekund. Orsakerna står i
// components/auction-stage.tsx ("SNABBHETEN") och i app/globals.css.
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const ROT = join(import.meta.dirname, "..");
const las = (rel: string) => readFileSync(join(ROT, rel), "utf8");
const utanKommentarer = (t: string) => t.replace(/\/\*[\s\S]*?\*\//g, "").replace(/^\s*\/\/.*$/gm, "");
const css = utanKommentarer(las("app/globals.css"));
const modul = utanKommentarer(las("app/fyndauktion/fyndauktion.module.css"));
const scen = utanKommentarer(las("components/auction-stage.tsx"));

/** Första regeln som börjar med väljaren, fram till första }. */
function regel(t: string, valjare: string): string {
  const i = t.indexOf(valjare + "{");
  assert.ok(i >= 0, `${valjare} finns inte`);
  return t.slice(i, t.indexOf("}", i));
}

describe("hallen", () => {
  it("scenen är mörk, och rummet står i ett eget lager bakom fynden", () => {
    assert.match(regel(css, ".a-stage"), /background:#0B0A09;/);
    assert.match(scen, /<div className="a-rum" aria-hidden="true">\s*<div className="a-rum-vy" \/>\s*<\/div>/);
    assert.ok(scen.indexOf('className="a-rum"') < scen.indexOf('className="a-embers"'), "rummet ligger under glöden");
    assert.match(regel(css, ".a-rum"), /position:absolute;inset:0;z-index:0;pointer-events:none/);
    assert.match(regel(css, ".a-rum-vy"), /position:sticky;top:0;height:100vh;overflow:hidden;/);
  });

  it("☠️ rummet målas en gång: ingen animation, inget filter, ingen blandning", () => {
    const rum = [...css.matchAll(/[^{}]*\.a-rum[^{]*\{[^}]*\}/g)].map((m) => m[0]).join("\n");
    assert.ok(rum.length > 0);
    assert.doesNotMatch(rum, /animation|transition|filter|mix-blend-mode/);
  });

  it("☠️ sticky fungerar bara om html och body klipper med clip, inte hidden", () => {
    assert.match(css, /(?:^|\})\s*html\{[^}]*overflow-x:clip/m);
    assert.match(css, /(?:^|\})\s*body\{[^}]*overflow-x:clip/m);
    assert.doesNotMatch(css, /(?:^|\})\s*(?:html|body)\{[^}]*overflow(?:-x|-y)?:(?:hidden|auto|scroll)/m);
  });

  it("ljuset följer dagen, och sista timmen glöder rummet", () => {
    assert.match(regel(css, ".a-rum-vy::before"), /opacity:calc\(\.62 \+ var\(--a-heat,0\) \* \.38\)/);
    assert.match(css, /\.a-stage\.a-final \.a-rum-vy::before\{opacity:1;/);
    // Rummet tar sina färger ur studions variabler, så Black Week gör det guld.
    assert.match(regel(css, ".a-rum-vy"), /var\(--natt\)/);
    assert.match(regel(css, ".a-rum-vy::after"), /rgba\(var\(--studio-ljus\)/);
  });

  it("studion har ingen egen bakgrund: hallen och glöden syns igenom", () => {
    const i = modul.indexOf(".studio.studio {");
    assert.ok(i >= 0);
    assert.doesNotMatch(modul.slice(i, modul.indexOf("}", i)), /background/);
  });

  it("texten i hallen är ljus, och korten står i studions ljus", () => {
    assert.match(css, /\.a-stage \.a-title\{color:var\(--natt-ljus\)/);
    assert.match(css, /\.a-stage \.a-sold a\{color:var\(--natt-ljus\)\}/);
    assert.match(css, /\.a-stage \.a-sold span\{color:var\(--natt-dampad\)\}/);
    // Rabatten i listan: mörkgrönt syns inte mot hallen.
    assert.match(css, /\.a-stage \.a-sold em\{color:#8EDBA9\}/);
    assert.match(css, /\.a-stage \.a-card\{border-color:rgba\(255,255,255,\.92\);\s*box-shadow:[^}]*rgba\(var\(--studio-glod\),\.5\)/);
    // Sista timmen är korten mörka: ingen vit kant runt dem då.
    assert.match(css, /\.a-stage\.a-final \.a-card\{border-color:var\(--a-line\);/);
  });

  it("stegen står på en glasskiva med ljus text", () => {
    const i = modul.indexOf(".how {");
    const how = modul.slice(i, modul.indexOf("}", i));
    assert.match(how, /background: linear-gradient\(180deg, rgba\(255, 255, 255, 0\.085\)/);
    assert.match(how, /color: var\(--natt-ljus\);/);
    assert.doesNotMatch(how, /backdrop-filter/);
  });

  it("sidfoten tar vid under hallen, och nyhetsbrevet står på golvet", () => {
    assert.match(css, /main:has\(\.a-stage\)\+footer\{margin-top:0\}/);
    assert.match(modul, /\.nlAnchor \{\s*padding-top: 8px;\s*background: var\(--natt-korn\), var\(--natt-golv\);\s*\}/);
  });
});

describe("☠️ snabbheten: scenen står still när ingen rör den", () => {
  it("värmen avrundas, och en variabel skrivs bara när den ändrats", () => {
    assert.match(scen, /heat = final \? 1 : over \? 0 : Math\.round\(dayHeat\(startMs, now\) \* 100\) \/ 100;/);
    assert.match(scen, /if \(skrivet\.get\(namn\) === varde\) return;/);
    assert.match(scen, /satt\("--a-heat", String\(heat\)\);/);
    assert.doesNotMatch(scen, /\.style\.setProperty\("--a-/, "alla variabler går genom satt()");
  });

  it("värmen läses aldrig med getComputedStyle", () => {
    assert.doesNotMatch(scen, /getComputedStyle/);
  });

  it("loopen ritar bara när något syns, och klockan väcker den", () => {
    assert.match(
      scen,
      /const behover = \(\) =>\s*!disposed && !reduce && synlig && !document\.hidden && \(heat > 0 \|\| parts\.length > 0 \|\| bolts\.length > 0\);/,
    );
    const tick = scen.slice(scen.indexOf("function tick()"), scen.indexOf("const io ="));
    assert.match(tick, /raf = 0;\s*if \(!ctx \|\| !behover\(\)\) return;/);
    assert.match(tick, /if \(behover\(\)\) raf = requestAnimationFrame\(tick\);\s*\}\s*$/);
    assert.match(scen, /function applyTheme[\s\S]*?vack\(\);\s*\}/);
    assert.match(scen, /new IntersectionObserver/);
    assert.match(scen, /document\.addEventListener\("visibilitychange", vack\)/);
  });

  it("en glödprick är en färdig bild, inte en ny gradient per prick och bildruta", () => {
    const tick = scen.slice(scen.indexOf("function tick()"), scen.indexOf("const io ="));
    assert.doesNotMatch(tick, /createRadialGradient/);
    assert.match(tick, /ctx\.drawImage\(prick, p\.x - R, p\.y - R, R \* 2, R \* 2\);/);
    assert.match(tick, /ritaPrick\(Math\.round\(heat \* 20\) \/ 20\);/);
  });

  it("en telefon ritar glöden i CSS-pixlar, och canvasen blandas inte med sidan", () => {
    assert.match(scen, /const dpr = innerWidth < 600 \? 1 : Math\.min\(2, window\.devicePixelRatio \|\| 1\);/);
    assert.doesNotMatch(regel(css, ".a-embers"), /mix-blend-mode/);
  });

  it("blobbarna har ingen oskärpa och rör sig bara sista timmen", () => {
    // Ingen regel för blobbarna, inte heller mobilens, har en oskärpa.
    assert.doesNotMatch(css, /\.a-blob\{[^}]*filter/);
    assert.doesNotMatch(regel(css, ".a-b1") + regel(css, ".a-b2"), /animation/);
    assert.match(css, /\.a-stage\.a-final \.a-b1\{animation:aDrift1 /);
    assert.match(css, /\.a-stage\.a-final \.a-b2\{animation:aDrift2 /);
  });

  it("SISTA TIMMEN-märket pulserar bara när bannern syns, med transform och opacity", () => {
    assert.doesNotMatch(regel(css, ".a-climax-badge"), /animation/);
    assert.match(css, /\.a-climax\.show \.a-climax-badge\{animation:aPulseBadge /);
    assert.match(css, /\.a-climax\.show \.a-climax-badge::after\{animation:aBadgeRing /);
    assert.match(css, /\.a-stage\.a-final \.a-hc-cta::before\{animation:aBtnGlow /);
    assert.doesNotMatch(css, /\.a-hc-btn\{[^}]*animation/, "knappens egen skugga pulserar inte");
    for (const namn of ["aPulseBadge", "aBadgeRing", "aShine", "aBtnGlow"]) {
      const kf = css.match(new RegExp(`@keyframes ${namn}\\{((?:[^{}]*\\{[^{}]*\\})*)\\}`))?.[1];
      assert.ok(kf, namn);
      const props = new Set([...kf.matchAll(/([a-z-]+)\s*:/g)].map((m) => m[1]));
      assert.deepEqual([...props].filter((p) => p !== "transform" && p !== "opacity"), [], namn);
    }
  });

  it("pillens linje skalas utan övergång, pillen har ingen oskärpa, och luntan går i halvminutstakt", () => {
    assert.match(las("components/auction-live-bar.tsx"), /style=\{\{ transform: `scaleX\(\$\{progress \/ 100\}\)` \}\}/);
    assert.doesNotMatch(regel(css, ".a-lb-progress"), /transition|width:\s*\d+%;?\s*$/);
    assert.doesNotMatch(css, /\.a-live-bar\{[^}]*backdrop-filter/);
    assert.match(las("components/auction-fuse.tsx"), /useClientNow\(nuMs, 30_000\)/);
  });

  it("auktionssidans moduler: oändliga animationer rör bara transform och opacity", () => {
    for (const rel of ["app/fyndauktion/fyndauktion.module.css", "components/fyndfilm.module.css"]) {
      const t = utanKommentarer(las(rel));
      const kf = new Map<string, string>();
      for (const m of t.matchAll(/@keyframes\s+([\w-]+)\s*\{((?:[^{}]*\{[^{}]*\})*[^{}]*)\}/g)) kf.set(m[1], m[2]);
      for (const [namn, kropp] of kf) {
        const oandlig = new RegExp(`animation[^;{}]*\\b${namn}\\b[^;{}]*infinite`).test(t);
        if (!oandlig) continue;
        const props = new Set([...kropp.matchAll(/([a-z-]+)\s*:/g)].map((m) => m[1]));
        assert.deepEqual([...props].filter((p) => p !== "transform" && p !== "opacity"), [], `${rel}: ${namn}`);
      }
    }
  });
});

describe("☠️ färska priser: en fråga till Wix per hundra fynd, inte en per fynd", () => {
  const produkter = utanKommentarer(las("lib/products.ts"));
  const fn = produkter.slice(produkter.indexOf("export async function getFreshPrices("), produkter.indexOf("function svenskaValnamn("));

  it("frågan går genom favoriternas uppslag, hundra adresser åt gången", () => {
    assert.ok(fn.length > 0);
    assert.match(fn, /i \+= MAX_SLUGGAR_PER_UPPSLAG\) bitar\.push\(unika\.slice\(i, i \+ MAX_SLUGGAR_PER_UPPSLAG\)\)/);
    assert.match(fn, /getProdukterForSluggar\(bit\)/);
    assert.match(produkter, /export const MAX_SLUGGAR_PER_UPPSLAG = 100;/);
    // Ingen fråga per fynd.
    assert.doesNotMatch(fn, /\.eq\("slug"|slugs\.map\(async/);
  });

  it("en fråga som fallerar prövas en gång till, och bara efterfrågade adresser med pris tas med", () => {
    assert.match(fn, /hittade = await fraga\(\)\.catch\(fraga\);/);
    assert.match(fn, /if \(efterfragade\.has\(p\.slug\) && p\.priceNum > 0\) out\.set\(p\.slug, \{ priceNum: p\.priceNum, inStock: p\.inStock \}\);/);
  });
});

describe("☠️ inget hoppar när sidan hydreras", () => {
  it("bannern och luntan ritas av servern med sidans tid, inte först efter mount", () => {
    const climax = utanKommentarer(las("components/auction-climax.tsx"));
    const lunta = utanKommentarer(las("components/auction-fuse.tsx"));
    assert.match(climax, /const \{ nowMs: now \} = useClientNow\(nuMs, 1000\);/);
    assert.match(lunta, /const \{ nowMs: now \} = useClientNow\(nuMs, 30_000\);/);
    assert.doesNotMatch(climax + lunta, /mounted/);
    const sida = utanKommentarer(las("app/fyndauktion/page.tsx"));
    assert.match(sida, /<AuctionClimax startAt=\{startAt\} nuMs=\{nu\} \/>/);
    assert.match(sida, /<AuctionFuse startAt=\{startAt\} nuMs=\{nu\} \/>/);
  });

  it("utanför sista timmen står bannern tom i HTML:en", () => {
    const climax = utanKommentarer(las("components/auction-climax.tsx"));
    assert.match(climax, /\{show && \(\s*<div className="a-climax-inner">/);
  });
});
