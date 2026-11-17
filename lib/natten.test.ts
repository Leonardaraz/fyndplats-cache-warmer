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
    for (const namn of ["heroRes", "brickaRes", "brickaResLutad"]) {
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

describe("toppremsan på smala telefoner", () => {
  it("under 390 px står de sociala knapparna inte i remsan, så texten ryms på en rad", () => {
    assert.match(css, /@media\(max-width:389px\)\{\s*\.promo-social\{display:none\}/);
    // Radens höjd är låst för två rader på mobilen (CLS): den regeln ska stå kvar.
    assert.match(css, /\.promorow\{gap:10px;justify-content:space-between;min-height:2\.7em\}/);
  });

});

describe("favoritknappen ritas i ett eget lager", () => {
  it(".fav-kop har translateZ(0)", () => {
    assert.match(css, /\n\.fav-kop\{transform:translateZ\(0\)\}/);
  });
});

// ── Studion (Leonard 2026-11-17) ─────────────────────────────────────────
describe("studion: hjälten som en fotostudio", () => {
  const utan = start.replace(/\/\*[\s\S]*?\*\//g, "");
  const mobil = utan.slice(utan.lastIndexOf("@media(max-width:880px){"));
  const nyckelrutor = (namn: string) => {
    const a = css.indexOf(`@keyframes ${namn}{`);
    assert.ok(a > -1, `${namn} saknas`);
    return css.slice(a, css.indexOf("\n", a));
  };
  const transform = (text: string) => text.match(/transform:([^;}]+)/)?.[1];

  it("ljuset sitter på rutnätet, inte på hjälten: varuväggen står på en andel av rutnätets bredd", () => {
    assert.match(utan, /\.hem2 \.hero::before,\.hem2 \.hero::after\{display:none\}/);
    assert.match(utan, /\.hem2 \.herogrid::before,\.hem2 \.herogrid::after\{content:"";position:absolute;z-index:-1;inset:0 -400px;pointer-events:none\}/);
    // Rutnätet är en egen staplingsordning, annars hamnar z-index:-1 bakom hjältens bakgrund.
    assert.match(css, /\n\.herogrid\{position:relative;z-index:2;/);
    // Väggens mitt: 76 % + 15 px av rutnätet, alltså 76 % − 193 px av ett lager som börjar 400 px till vänster.
    assert.ok(utan.split("calc(76% - 193px)").length - 1 >= 3, "ljuspölens två lager och ljuskäglan ska stå på väggens mitt");
    assert.match(utan, /\.hem2 \.herogrid\{grid-template-columns:minmax\(0,1\.04fr\) minmax\(0,\.96fr\);gap:64px;/);
  });

  it("ljuset och brickans kanter tar färg ur variablerna, så att ett tema byter dem på ett ställe", () => {
    for (const namn of ["--studio-ljus", "--studio-glod"]) assert.match(variabel(namn), /^\d{1,3},\d{1,3},\d{1,3}$/, namn);
    assert.match(regel(start, ".hem2 .hero .herotile"), /background:var\(--studio-bricka\)/);
    // Ljuspölen och ljuskäglan, på dator och mobil: bara studions färger, svart och genomskinligt.
    const ljus = [...utan.matchAll(/\.hem2 \.herogrid::(?:before|after)\{([^}]*)\}/g)].map((m) => m[1]).filter((d) => d.includes("gradient"));
    assert.equal(ljus.length, 4);
    for (const d of ljus) for (const f of d.match(/rgba?\([^)]*\)?/g) ?? []) assert.match(f, /^rgba\(var\(--studio-(ljus|glod)\)|^rgba?\(0,0,0/, f);
  });

  it("inget filter och ingen backdrop-filter i hjälten (Safari, och grafikkortet)", () => {
    const hjalte = utan.slice(utan.indexOf(".hem2 .hero{background:var(--natt-korn)"));
    assert.doesNotMatch(hjalte, /(^|[;{\s])(-webkit-)?(backdrop-)?filter:/);
  });

  it("knappens text är en variabel, och samma knapp i nyhetsbrevet och auktionsremsan bär den", () => {
    assert.match(regel(start, ".hem2 .hero .btn-primary"), /color:var\(--natt-knapp-text\)/);
    assert.match(regel(css, ".nl-btn"), /background:var\(--natt-knapp\);color:var\(--natt-knapp-text\)/);
    assert.match(regel(css, ".auction-banner-badge"), /background:var\(--natt-knapp\);color:var\(--natt-knapp-text\)/);
    assert.equal(hex(variabel("--natt-knapp-text"))[0].toUpperCase(), "FFFFFF");
  });

  it("knappens ljusa ovankant slutar ovanför texten, så textens kontrast är knappens egen färg", () => {
    const m = regel(start, ".hem2 .hero .btn-primary").match(/linear-gradient\(180deg,rgba\(255,255,255,[.\d]+\) 0%,rgba\(255,255,255,0\) (\d+)%\)/);
    assert.ok(m, "ovankantens toning saknas");
    assert.ok(Number(m[1]) <= 38, `toningen når ${m[1]} %: texten börjar vid ungefär 40 %`);
  });

  it("ljussvepet vilar där det slutar, och rör sig bara med transform", () => {
    const till = nyckelrutor("knappSvep").split("to{")[1];
    assert.doesNotMatch(nyckelrutor("knappSvep"), /opacity/);
    assert.equal(transform(regel(start, ".hem2 .hero .btn-primary::after")), transform(till));
    assert.match(regel(start, ".hem2 .hero .btn-primary::after"), /animation:knappSvep [^;}]* backwards/);
  });

  it("mindre rörelse stänger också det som rör sig i ::before och ::after", () => {
    // *{animation:none!important} i globals.css väljer bara element, inte pseudoelement.
    const lugn = (kalla: string) => [...kalla.matchAll(/@media\(prefers-reduced-motion:reduce\)\{([\s\S]*?\})\s*\}/g)].map((m) => m[1]).join("\n");
    assert.match(lugn(utan), /\.hem2 \.hero \.btn-primary::after\{animation:none\}/);
    const temat = lugn(tema.replace(/\/\*[\s\S]*?\*\//g, ""));
    for (const n of ["blackweek", "blackfriday", "blackweekend"]) {
      assert.ok(temat.includes(`:root[data-tema="${n}"] .herogrid::before`), n);
      assert.ok(temat.includes(`:root[data-tema="${n}"] .hero::after`), n);
    }
    assert.match(temat, /\.hero::after\{animation:none\}/);
  });

  it("mobilens bricka: vilan, entréns slutläge och hover är samma läge", () => {
    const vila = transform(mobil.slice(mobil.indexOf(".hem2 .hero .herotile{")));
    const hover = transform(mobil.slice(mobil.indexOf(".hem2 .hero .herotile:hover{")));
    const slut = transform(nyckelrutor("brickaResLutad").split("to{")[1]);
    assert.ok(vila && vila.includes("rotateX(5deg)"), String(vila));
    assert.equal(hover, vila);
    assert.equal(slut, vila);
    assert.match(mobil, /\.hem2 \.hero \.herotile\{[^}]*animation-name:brickaResLutad/);
  });

  it("mobilens spegling sitter på brickan, och raden har plats för den", () => {
    assert.match(mobil, /\.hem2 \.heromosaic\{padding-bottom:44px\}/);
    assert.match(mobil, /\.hem2 \.hero \.herotile\{[^}]*-webkit-box-reflect:below 5px/);
    assert.doesNotMatch(mobil, /\.heromosaic\{[^}]*box-reflect/);
  });

  it("datorns vägg står vinklad, följer --hx och --hy och speglas", () => {
    const dator = utan.slice(utan.lastIndexOf("@media(min-width:881px){"), utan.lastIndexOf("@media(max-width:880px){"));
    assert.match(dator, /\.hem2 \.hero \.heromosaic\{transform:perspective\(1500px\) rotateY\(calc\(-8deg \+ var\(--hx,0\)\*3deg\)\) rotateX\(calc\(2deg - var\(--hy,0\)\*2deg\)\)/);
    assert.match(dator, /-webkit-box-reflect:below 14px/);
    const komponent = las("components/hero-lutning.tsx");
    assert.match(komponent, /vagg\.style\.setProperty\("--hx"/);
    assert.doesNotMatch(komponent, /hjalte\.style\.setProperty/);
    assert.match(komponent, /prefers-reduced-motion:reduce/);
    assert.match(komponent, /\(hover:hover\) and \(pointer:fine\) and \(min-width:881px\)/);
    assert.match(las("app/page.tsx"), /<HeroLutning \/>/);
  });
});

describe("Black Week-temat byter nattens variabler", () => {
  const utan = tema.replace(/\/\*[\s\S]*?\*\//g, "");
  const a = utan.indexOf(':root[data-tema="blackweek"],');
  const block = utan.slice(a, utan.indexOf("}", a));
  const v = (namn: string) => {
    const m = block.match(new RegExp(`${namn}:([^;]+);`));
    assert.ok(m, `${namn} saknas i temat`);
    return m[1];
  };

  it("alla tre temana delar blocket", () => {
    assert.match(utan.slice(a, a + 140), /^:root\[data-tema="blackweek"\],\s*:root\[data-tema="blackfriday"\],\s*:root\[data-tema="blackweekend"\]\{/);
  });

  it("varje variabel som natten och studion bär finns i temat", () => {
    for (const namn of ["--natt", "--natt-remsa", "--natt-golv", "--natt-ljus", "--natt-dampad", "--natt-knapp", "--natt-knapp-over", "--natt-knapp-text",
      "--natt-knapp-kant", "--natt-knapp-skugga", "--studio-ljus", "--studio-glod", "--studio-bricka", "--glod", "--glod-svag", "--glod-sken", "--glod-stark",
      "--glod-lugn", "--glod-sken-stark", "--glod-a", "--glod-ljus", "--glod-linje", "--glod-ord"]) v(namn);
  });

  it("mörk text på guldknappen klarar 4,5:1 i båda ändar, också när pekaren är över", () => {
    const text = hex(v("--natt-knapp-text"))[0];
    for (const namn of ["--natt-knapp", "--natt-knapp-over"]) {
      const andar = hex(v(namn));
      assert.equal(andar.length, 2);
      for (const h of andar) assert.ok(kontrast(text, h) >= 4.5, `${namn} #${h}: ${kontrast(text, h).toFixed(2)}:1`);
    }
  });

  it("ljus, dämpad och guldfärgad text klarar 7:1 mot temats ljusaste ton, och accentordet 3:1", () => {
    const ljusast = hex(v("--natt")).sort((x, y) => lum(y) - lum(x))[0];
    for (const namn of ["--natt-ljus", "--natt-dampad", "--glod-ljus"]) {
      const k = kontrast(hex(v(namn))[0], ljusast);
      assert.ok(k >= 7, `${namn}: ${k.toFixed(2)}:1`);
    }
    for (const h of hex(v("--glod-ord"))) assert.ok(kontrast(h, ljusast) >= 3, `#${h}`);
  });
});
