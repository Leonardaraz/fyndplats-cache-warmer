// Startsidans stilar (app/startsida.css) och markup (app/page.tsx). Reglerna
// står i stil och markup, så proven läser källan.
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const las = (...delar: string[]) => readFileSync(join(import.meta.dirname, "..", ...delar), "utf8");
const css = las("app", "startsida.css").replace(/\/\*[\s\S]*?\*\//g, "");
const sida = las("app", "page.tsx");

/** Varje regel som [selektorer, deklarationer], med @media-huvudena borttagna. */
const regler = css
  .replace(/@media[^{]*\{/g, "")
  .split("}")
  .map((r) => r.split("{"))
  .filter((r) => r.length === 2 && r[0].trim())
  .map(([s, d]) => [s.split(",").map((x) => x.trim()), d.trim()] as const);

describe("startsidans stilar rör bara startsidan", () => {
  it("varje selektor börjar med .hem2", () => {
    assert.ok(regler.length > 60, `bara ${regler.length} regler lästa`);
    for (const [selektorer] of regler) for (const s of selektorer) assert.match(s, /^\.hem2[ .:>]/, s);
  });

  it("sidan läser stilen och bär klassen runt hela innehållet", () => {
    assert.match(sida, /^import "\.\/startsida\.css";$/m);
    assert.equal(sida.split('<div className="hem2">').length, 2);
  });

  it("inga nya färger: bara butikens tokens och brickans ton", () => {
    const farger = new Set(css.match(/#[0-9a-fA-F]{3,8}\b/g) ?? []);
    assert.deepEqual([...farger].sort(), ["#F4EEE8", "#fff"]);
  });
});

describe("rader som rullar i sidled", () => {
  // .sr-only är position:absolute. Utan en positionerad förälder i raden hamnar
  // den utanför raden och gör hela sidan bredare (mätt: 1 663 px i en 390 px vy).
  const rullar = regler.filter(([, d]) => /overflow-x:auto/.test(d)).flatMap(([s]) => s);
  const positionerade = new Set(regler.filter(([, d]) => /(^|;)position:relative(;|$)/.test(d)).flatMap(([s]) => s));

  it("är fem, och var och en är positionerad", () => {
    assert.deepEqual([...rullar].sort(), [".hem2 .guider", ".hem2 .heromosaic", ".hem2 .katrad", ".hem2 .roster", ".hem2 .usprow"]);
    for (const r of rullar) assert.ok(positionerade.has(r), `${r} saknar position:relative`);
  });

  it("radens delar med dold text är positionerade", () => {
    for (const d of [".hem2 .kat", ".hem2 .guide", ".hem2 .rost", ".hem2 .uspitem"]) assert.ok(positionerade.has(d), `${d} saknar position:relative`);
  });
});

describe("startsidans sektioner", () => {
  it("guider och omdömen visas bara när det finns tre", () => {
    assert.match(sida, /\{guider\.length === 3 && \(/);
    assert.match(sida, /\{roster\.length === 3 && \(/);
  });

  it("omdömena är Googles egna, fem stjärnor och lagom långa", () => {
    assert.match(sida, /CURATED_RESULT\.reviews\s*\.filter\(\(r\) => r\.rating === 5 && r\.text\.length >= 80 && r\.text\.length <= 220\)/);
  });

  it("guidens bild är tyst, rubriken bär länkens namn", () => {
    const kort = sida.slice(sida.indexOf('className="guide"'), sida.indexOf("</PrefetchLink>", sida.indexOf('className="guide"')));
    assert.match(kort, /<Image src=\{g\.cover\} alt="" fill /);
    assert.match(kort, /className="guide-titel"/);
  });
});
