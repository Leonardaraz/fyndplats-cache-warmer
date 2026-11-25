// Run: node --test --experimental-strip-types lib/mobil-finslip.test.ts
//
// Rättelserna efter proven på riktiga telefoner och surfplattor 2026-11-20
// (BrowserStack) och tillgänglighetsprovet (axe) mot www samma natt:
//
//  1. Mobilens fasta köprad glider undan medan sidans egen köpknapp syns.
//  2. Ett ord för korgen: knappen sa "Lägg i kundvagn", lådan heter Varukorg.
//  3. Slutsålda val: texten håller 4,5:1. Hela knappen låg på 50 %.
//  4. Surfplattan på högkant: filtren bakom knappen, inte utfällda före varorna.
//  5. Omdömesraden på startsidan nås med tangentbordet.
//
// Den vita plattan på mobilen vaktas i lib/produktkortet.test.ts och
// reservhöjden för Safari före 15 i lib/reservhojd.test.ts.
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const las = (...delar: string[]) => readFileSync(join(import.meta.dirname, "..", ...delar), "utf8");
const utanKommentarer = (s: string) => s.replace(/\/\*[\s\S]*?\*\//g, "");
const css = utanKommentarer(las("app", "globals.css"));
const vy = las("components", "productview.tsx");

/** WCAG 2.1 kontrast mellan två färger i hex. */
function kontrast(a: string, b: string): number {
  const lum = (hex: string) => {
    const h = hex.replace("#", "");
    const [r, g, bl] = [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16) / 255).map((v) => (v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4));
    return 0.2126 * r + 0.7152 * g + 0.0722 * bl;
  };
  const [ljus, mork] = [lum(a), lum(b)].sort((x, y) => y - x);
  return (ljus + 0.05) / (mork + 0.05);
}

describe("mobilens fasta köprad glider undan medan köpknappen syns", () => {
  it("sidans köpknapp bevakas, och utan IntersectionObserver står raden kvar", () => {
    assert.match(vy, /const kopKnapp = useRef<HTMLButtonElement>\(null\);/);
    assert.match(vy, /if \(!knapp \|\| typeof IntersectionObserver !== "function"\) return;/);
    // Kvoten, inte isIntersecting: den är sann under tröskeln i en del webbläsare.
    // Två mätningar sedan 2026-11-24: under sidhuvudet, och hela skärmen när telefonens sidhuvud
    // följt med sidan ur bild (lib/huvud-gom.test.ts har regeln för valet mellan dem).
    assert.match(vy, /new IntersectionObserver\(\(\[e\]\) => \{ under = e\.intersectionRatio >= 0\.6; valj\(\); \}, \{ threshold: 0\.6, rootMargin: `-\$\{huvud\}px 0px 0px 0px` \}\)/);
    assert.match(vy, /new IntersectionObserver\(\(\[e\]\) => \{ hela = e\.intersectionRatio >= 0\.6; valj\(\); \}, \{ threshold: 0\.6 \}\)/);
    assert.doesNotMatch(vy, /isIntersecting\)/);
    // Det fasta sidhuvudet täcker knappen när den rullar in uppifrån.
    assert.match(vy, /const huvud = Math\.round\(document\.querySelector\("header\.sidhuvud"\)\?\.getBoundingClientRect\(\)\.height \?\? 0\);/);
    assert.match(las("components", "site.tsx"), /<header className="sidhuvud">/);
    assert.match(css, /(^|\})header\{position:sticky;top:0;/m);
    assert.match(vy, /<button\s+ref=\{kopKnapp\}\s+className="buy"/);
  });

  it("raden bär is-gomd och göms för skärmläsare medan knappen syns", () => {
    assert.match(vy, /<div className=\{`sticky-buy-mobile\$\{kopSyns \? " is-gomd" : ""\}`\} aria-hidden=\{!buyable \|\| kopSyns\}>/);
  });

  it("den gömda raden går inte att nå: visibility byts efter glidet", () => {
    assert.match(css, /\.sticky-buy-mobile\.is-gomd\{transform:translateY\(110%\);visibility:hidden;transition:transform \.22s ease,visibility 0s linear \.22s\}/);
    assert.match(css, /@media\(max-width:760px\) and \(prefers-reduced-motion:reduce\)\{\s*\.sticky-buy-mobile,\.sticky-buy-mobile\.is-gomd\{transition:none\}\s*\}/);
  });

  it("sidans utrymme för raden ändras inte, så att inget hoppar när den glider", () => {
    assert.match(css, /body:has\(\.sticky-buy-mobile\)\{padding-bottom:78px\}/);
    assert.doesNotMatch(css, /is-gomd\)\{padding-bottom/);
  });
});

describe("ett ord för korgen i knappar och låda", () => {
  it("köpknapparna säger Lägg i varukorgen", () => {
    assert.equal(vy.split('"Lägg i varukorgen"').length - 1, 2);
    assert.match(vy, /"✓ Tillagd i varukorgen"/);
  });

  it("ingen knapp eller etikett i butikens komponenter säger kundvagn", () => {
    for (const fil of ["productview.tsx", "cart.tsx", "favoriter-rader.tsx", "favoriter-lada.tsx", "wishlist.tsx", "site.tsx"]) {
      const kod = las("components", fil).replace(/\{\/\*[\s\S]*?\*\/\}/g, "").replace(/\/\*[\s\S]*?\*\//g, "").replace(/(^|[^:"'`\\])\/\/[^\n]*/g, "$1");
      // Kundtext är JSX-text, etiketter och knapptexter. Namn på funktioner och
      // filer (forvarmKundvagn, kundvagn-lank) och kastade fel är det inte.
      const utanFel = kod.replace(/new Error\((?:"[^"\n]*"|`[^`]*`)\)/g, "");
      const synligt = utanFel.match(/>[^<>{}]*[Kk]undvagn[^<>{}]*<|(?:aria-label|title|placeholder|alt)="[^"\n]*[Kk]undvagn[^"\n]*"|"[^"\n]*\s[Kk]undvagn[^"\n]*"|"[Kk]undvagn\s[^"\n]*"/g) ?? [];
      assert.deepEqual(synligt, [], `${fil} säger kundvagn till kunden`);
    }
  });
});

describe("slutsålda val: texten håller kontrastkravet", () => {
  it("knappen och kortet dämpas inte som helhet", () => {
    assert.doesNotMatch(css, /\.varswatch\.oos\{[^}]*opacity/);
    assert.doesNotMatch(css, /\.varswatch\.oos\.active\{[^}]*opacity/);
    assert.doesNotMatch(css, /\.varcard\.oos\{[^}]*opacity/);
    assert.doesNotMatch(css, /\.varcard\.oos\.active\{[^}]*opacity/);
  });

  it("bara bilden, pricken och radion dämpas", () => {
    assert.match(css, /\.varswatch\.oos \.varswatch-thumb,\.varswatch\.oos \.varswatch-dot\{opacity:\.5\}/);
    assert.match(css, /\.varcard\.oos \.varcard-thumb,\.varcard\.oos \.varcard-dot,\.varcard\.oos \.varcard-radio\{opacity:\.5\}/);
  });

  it("namnet står i --soft och taggen i rött på ljusrött, båda över 4,5:1", () => {
    assert.match(css, /\.varswatch\.oos \.varswatch-name\{color:var\(--soft\);text-decoration:line-through;/);
    assert.match(css, /\.varcard\.oos \.varcard-label,\.varcard\.oos \.varcard-price\{color:var\(--soft\)\}/);
    const soft = /--soft:(#[0-9a-fA-F]{6})/.exec(css)?.[1];
    assert.ok(soft, "--soft hittades inte");
    assert.ok(kontrast(soft, "#ffffff") >= 4.5, `--soft mot vitt: ${kontrast(soft, "#ffffff").toFixed(2)}`);
    const tagg = /\.varswatch-oos\{[^}]*color:(#[0-9a-fA-F]{6});background:(#[0-9a-fA-F]{6})/.exec(css);
    assert.ok(tagg, ".varswatch-oos har inte färg och bakgrund i hex");
    assert.ok(kontrast(tagg[1], tagg[2]) >= 4.5, `Slut-taggen: ${kontrast(tagg[1], tagg[2]).toFixed(2)}`);
    const kortTagg = /\.varcard-oos\{[^}]*color:(#[0-9a-fA-F]{6})/.exec(css);
    assert.ok(kortTagg && kontrast(kortTagg[1], "#ffffff") >= 4.5);
  });

  it("streckad ram betyder fortfarande bara att kombinationen inte finns", () => {
    assert.match(css, /\.varswatch\.na\{opacity:\.55;border-style:dashed\}/);
    assert.doesNotMatch(css, /\.varswatch\.oos[^{]*\{[^}]*border-style/);
  });
});

describe("surfplattan på högkant har filtren bakom knappen", () => {
  const start = "@media(min-width:701px) and (max-width:880px){";
  const regel = css.slice(css.indexOf(start));
  const block = regel.slice(0, regel.indexOf("\n}") + 2);

  it("knappen visas och panelen är stängd tills man trycker", () => {
    assert.equal(css.split(start).length - 1, 1);
    assert.match(block, /\n  \.shopbar-toggle\{display:inline-flex;align-items:center;gap:8px;min-height:44px;/);
    assert.match(block, /\n  \.shopbar-panel\{display:none\}\n  \.shopbar\.open \.shopbar-panel\{display:flex\}\n\}$/);
  });

  it("regeln står efter datorns och mobilens, så att den vinner vid lika vikt", () => {
    assert.ok(css.indexOf(block) > css.indexOf("@media(min-width:701px){\n  .shopbar-panel{flex-basis:100%"));
    assert.ok(css.indexOf(block) > css.indexOf(".shopbar.open .shopbar-panel{position:fixed;inset:0;"));
  });

  it("lagret över hela sidan är kvar för 700 px och smalare, i stil och i kod", () => {
    assert.match(css, /@media\(max-width:700px\)\{[\s\S]*?\.shopbar\.open \.shopbar-panel\{position:fixed;inset:0;z-index:1300;/);
    assert.match(las("components", "shopbrowser.tsx"), /window\.matchMedia\("\(max-width: 700px\)"\)/);
  });

  it("gränsen 880 är sidhuvudets: där byter butiken till mobilens huvud", () => {
    assert.match(css, /@media\(max-width:880px\)\{\n  \.prod:not\(\.auction-card\)/);
    assert.doesNotMatch(block, /position:fixed/);
  });
});

describe("omdömesraden på startsidan nås med tangentbordet", () => {
  it("raden bär tabIndex, roll och namn", () => {
    assert.match(las("app", "page.tsx"), /<div className="roster" tabIndex=\{0\} role="group" aria-label="Omdömen från kunder">/);
  });

  it("fokus syns", () => {
    assert.match(utanKommentarer(las("app", "startsida.css")), /\.hem2 \.roster:focus-visible\{outline:2px solid var\(--brand\);outline-offset:6px;border-radius:var\(--r-lg\)\}/);
  });
});
