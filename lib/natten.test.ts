// Run: node --test --experimental-strip-types 'lib/**/*.test.ts'
//
// Natten: butikens mörka ton (app/globals.css och app/startsida.css, Leonard
// 2026-11-16), hjältens entré i djupled och favoritknappens eget ritlager.
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const las = (p: string) => readFileSync(new URL(`../${p}`, import.meta.url), "utf8");
const css = las("app/globals.css");
const start = las("app/startsida.css");
const tema = las("app/sasongstema.css");

const rot = css.slice(css.indexOf("--natt:"), css.indexOf("}", css.indexOf("--natt-korn:")));
const variabel = (namn: string) => {
  const m = rot.match(new RegExp(`${namn}:([^;]+);`));
  assert.ok(m, `${namn} saknas`);
  return m[1];
};
const hex = (s: string) => [...s.matchAll(/#([0-9A-Fa-f]{6})\b/g)].map((m) => m[1]);
// WCAG 2: relativ luminans och kontrast.
const lum = (h: string) => {
  const k = [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16) / 255).map((v) => (v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4));
  return 0.2126 * k[0] + 0.7152 * k[1] + 0.0722 * k[2];
};
const kontrast = (a: string, b: string) => {
  const [x, y] = [lum(a), lum(b)].sort((p, q) => q - p);
  return (x + 0.05) / (y + 0.05);
};
// Alla regler med exakt den väljaren, ihopslagna (samma väljare kan stå på flera ställen).
const regel = (kalla: string, valjare: string) => {
  const delar: string[] = [];
  for (let a = kalla.indexOf(`${valjare}{`); a > -1; a = kalla.indexOf(`${valjare}{`, a + 1)) {
    const fore = kalla[a - 1];
    if (a === 0 || fore === "\n" || fore === "}" || fore === "," || fore === " ") delar.push(kalla.slice(a, kalla.indexOf("}", a)));
  }
  assert.ok(delar.length > 0, `${valjare} saknas`);
  return delar.join("\n");
};

describe("nattens färger går att läsa", () => {
  it("vit text på knappens toning klarar 4,5:1 i båda ändar", () => {
    const andar = hex(variabel("--natt-knapp"));
    assert.equal(andar.length, 2);
    for (const h of andar) assert.ok(kontrast("FFFFFF", h) >= 4.5, `#${h}: ${kontrast("FFFFFF", h).toFixed(2)}:1`);
  });

  it("ljus och dämpad text klarar 7:1 mot nattens ljusaste ton", () => {
    const ljusast = hex(variabel("--natt")).sort((a, b) => lum(b) - lum(a))[0];
    for (const namn of ["--natt-ljus", "--natt-dampad", "--glod-ljus"]) {
      const k = kontrast(hex(variabel(namn))[0], ljusast);
      assert.ok(k >= 7, `${namn}: ${k.toFixed(2)}:1`);
    }
  });

  it("accentordets toning klarar 3:1 (stor text) i sin mörkaste ände", () => {
    const ljusast = hex(variabel("--natt")).sort((a, b) => lum(b) - lum(a))[0];
    for (const h of hex(variabel("--glod-ord"))) assert.ok(kontrast(h, ljusast) >= 3, `#${h}`);
  });
});

describe("natten bär toppremsan, hjälten, löftesremsan, auktionsremsan, nyhetsbrevet och sidfoten", () => {
  it("globala ytor", () => {
    assert.match(regel(css, ".promo"), /background:var\(--natt-remsa\)/);
    assert.match(regel(css, ".sidhuvud::after"), /background:var\(--glod-linje\)/);
    assert.match(regel(css, ".auction-banner"), /var\(--natt\)/);
    assert.match(regel(css, ".nl"), /var\(--natt\)/);
    assert.match(regel(css, "footer"), /background:var\(--natt-golv\)/);
  });

  it("startsidans hjälte och löftesremsa", () => {
    assert.match(regel(start, ".hem2 .hero"), /var\(--natt\)/);
    assert.match(regel(start, ".hem2 .usp"), /background:var\(--natt-golv\)/);
    assert.match(regel(start, ".hem2 .hero p"), /color:var\(--natt-dampad\)/);
  });

  it("säsongstemana väger tyngre: varje temaregel för hjälten börjar med :root[data-tema", () => {
    const utanKommentarer = tema.replace(/\/\*[\s\S]*?\*\//g, "");
    const hjalteregler = [...utanKommentarer.matchAll(/(^|\})\s*([^{}@]*\.hero[^{}]*)\{/g)].flatMap((m) => m[2].split(",")).map((v) => v.trim()).filter((v) => v.includes(".hero"));
    assert.ok(hjalteregler.length > 10, `bara ${hjalteregler.length} regler hittade`);
    for (const v of hjalteregler) assert.ok(v.startsWith(":root[data-tema"), v);
  });

  it("toppremsans och sidfotens sociala knappar är enfärgade; mobilmenyns bär märkesfärgerna", () => {
    assert.doesNotMatch(css, /\.(promo|footer)-social \.soc-(ig|fb)[^{]*\{[^}]*(#0866FF|#feda75|#fdf497)/);
    assert.match(css, /\.mm-social \.soc-fb\{background:#0866FF/);
  });
});

describe("hjältens entré i djupled", () => {
  const nyckelrutor = (namn: string) => {
    const a = css.indexOf(`@keyframes ${namn}{`);
    assert.ok(a > -1, `${namn} saknas`);
    return css.slice(a, css.indexOf("\n", a));
  };

  it("rubriken och brickorna rör sig bara med transform, aldrig opacitet (LCP)", () => {
    for (const namn of ["heroRes", "brickaRes"]) {
      assert.doesNotMatch(nyckelrutor(namn), /opacity/);
      assert.match(nyckelrutor(namn), /perspective\(\d+px\)/);
    }
    assert.match(css, /\n\.hero h1\{animation:heroRes /);
    assert.match(css, /\n\.herotile\{animation:brickaRes /);
  });

  it("slutläget är samma funktioner med nollor, inte none", () => {
    for (const namn of ["heroRes", "brickaRes"]) {
      const till = nyckelrutor(namn).split("to{")[1];
      assert.match(till, /perspective\(\d+px\) translate3d\(0,0,0\) rotateX\(0deg\)/);
    }
  });

  it("animationerna släpper elementet efteråt (backwards), så brickans hover fungerar", () => {
    for (const rad of css.split("\n").filter((r) => /^\.(heroinner>\*|hero h1|herotile)\{animation:/.test(r))) {
      assert.match(rad, / backwards[;}]/, rad.slice(0, 80));
      assert.doesNotMatch(rad, / both| forwards/);
    }
  });

  it("hela mosaiken har ingen egen entré längre: brickorna reser sig var för sig", () => {
    assert.doesNotMatch(css, /\n\.heromosaic\{animation:/);
  });
});

describe("favoritknappen ritas i ett eget lager", () => {
  it(".fav-kop har translateZ(0)", () => {
    assert.match(css, /\n\.fav-kop\{transform:translateZ\(0\)\}/);
  });
});
