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

describe("hjältens entré: studion vaknar när sidan är lugn", () => {
  const utanK = css.replace(/\/\*[\s\S]*?\*\//g, "");
  const nyckelrutor = (namn: string) => {
    const a = css.indexOf(`@keyframes ${namn}{`);
    assert.ok(a > -1, `${namn} saknas`);
    return css.slice(a, css.indexOf("\n", a));
  };
  const rad = (borjan: string) => {
    const r = utanK.split("\n").map((x) => x.trim()).find((x) => x.startsWith(borjan));
    assert.ok(r, `${borjan} saknas`);
    return r;
  };

  // Leonard 2026-11-18, iPhone 15, två gånger: "den är lite hackig", "det är inte smooth".
  it("ingenting i hjälten rör sig av sig självt vid första bildrutan", () => {
    for (const v of [".heroinner>*", ".hero h1", ".herotile", ".heromosaic", ".heroinner"]) {
      assert.doesNotMatch(css, new RegExp(`\\n${v.replace(/[.*>]/g, "\\$&")}\\{[^}]*animation:`), v);
    }
    assert.doesNotMatch(start.replace(/\/\*[\s\S]*?\*\//g, ""), /animation:(?!none)[a-zA-Z]/);
    for (const borta of ["heroRise", "heroTona", "heroGlid", "heroRes", "brickaResLutad"]) assert.doesNotMatch(css, new RegExp(`@keyframes ${borta}\\{`), borta);
  });

  it("entrén finns bara under data-entre på <html>, i två lägen", () => {
    const regler = [...utanK.matchAll(/(^|\})\s*([^{}@]+)\{[^{}]*animation:(?!none)[^{}]*\}/g)].map((m) => m[2].trim()).filter((v) => /(^|[\s>+~,])\.(hero|heroinner|herotile|heromosaic|herogrid)(?![\w-])/.test(v));
    assert.ok(regler.length >= 6, `bara ${regler.length} regler`);
    // Hjältens två klot (.hero::before och ::after) driver sedan förr; studion släcker dem.
    for (const v of regler) for (const del of v.split(",")) if (!/^\.hero::(before|after)$/.test(del.trim())) assert.match(del.trim(), /^html\[data-entre="(vantar|gar)"\] /, del);
  });

  it("väntläget har en egen utgång: efter 2,4 s spelar det av sig självt", () => {
    for (const v of [".heroinner", ".herotile", ".herogrid::after"]) {
      const r = rad(`html[data-entre="vantar"] ${v}{`);
      assert.match(r, /animation:\w+ \.6s ease-out 2\.4s backwards\}/, r);
    }
    assert.match(utanK, /html\[data-entre="vantar"\] \.hem2 \.hero \.heromosaic\{animation:vantaTona \.6s ease-out 2\.4s backwards\}/);
  });

  it("☠️ väntläget och entrén har egna nyckelrutor med samma startruta, så att entrén startar om vid bytet", () => {
    const namn = (r: string) => r.match(/animation:(\w+)/)![1];
    const start = (n: string) => nyckelrutor(n).match(/from\{([^}]*)\}/)![1];
    const par: Array<[string, string, string]> = [
      [".heroinner", "vantaLyft", "textLyft"],
      [".herotile", "vantaTona", "framTona"],
      [".herogrid::after", "vantaLjus", "ljusTands"],
    ];
    for (const [v, vanta, gar] of par) {
      assert.equal(namn(rad(`html[data-entre="vantar"] ${v}{`)), vanta);
      assert.equal(namn(rad(`html[data-entre="gar"] ${v}{`)), gar);
      assert.notEqual(vanta, gar);
      assert.equal(start(vanta), start(gar), `${vanta} och ${gar} ska börja i samma ruta`);
    }
    assert.match(rad('html[data-entre="gar"] .herotile{'), /animation:framTona \.5s ease-out backwards,brickaRes /);
    assert.match(utanK, /html\[data-entre="vantar"\] \.hem2 \.hero \.heromosaic\{animation:vantaTona \.6s ease-out 2\.4s backwards\}/);
    assert.match(utanK, /html\[data-entre="gar"\] \.hem2 \.hero \.heromosaic\{animation:framTona \.5s ease-out backwards,radRes /);
    // Inget namn står i båda lägena.
    const iLage = (l: string) => new Set([...utanK.matchAll(new RegExp(`html\\[data-entre="${l}"\\][^{]*\\{animation:([^}]*)\\}`, "g"))].flatMap((m) => m[1].split(",").map((d) => d.trim().split(" ")[0])));
    const [v, g] = [iLage("vantar"), iLage("gar")];
    assert.ok(v.size >= 3 && g.size >= 5);
    for (const n of v) assert.ok(!g.has(n), `${n} står i båda lägena`);
  });

  it("texten rör sig bara med transform (LCP), och varorna tonar från 0,01, inte 0", () => {
    for (const n of ["textLyft", "brickaRes", "radRes", "knappSvep"]) assert.doesNotMatch(nyckelrutor(n), /opacity/, n);
    assert.equal(nyckelrutor("framTona"), "@keyframes framTona{from{opacity:.01}to{opacity:1}}");
    for (const n of ["vantaLyft"]) assert.doesNotMatch(nyckelrutor(n), /opacity/, n);
    for (const n of ["brickaRes", "radRes"]) {
      assert.match(nyckelrutor(n), /perspective\(\d+px\)/);
      assert.match(nyckelrutor(n).split("to{")[1], /perspective\(\d+px\) translate3d\(0,0,0\) rotateX\(0deg\)/);
    }
    assert.match(nyckelrutor("textLyft").split("to{")[1], /^transform:translate3d\(0,0,0\)/);
  });

  it("alla lägen släpper elementet efteråt (backwards)", () => {
    for (const r of utanK.split("\n").filter((x) => /html\[data-entre="(vantar|gar)"\][^{]*\{animation:/.test(x))) {
      assert.match(r, / backwards[;}]/, r.slice(0, 90));
      assert.doesNotMatch(r, / both| forwards/);
    }
  });

  it("rörelsen börjar mjukt: högst 6 % på de första 10 % av tiden, högst 20 % på de första 20 %", () => {
    const kurva = (x1: number, y1: number, x2: number, y2: number) => (t: number) => {
      let lo = 0, hi = 1, u = t;
      for (let i = 0; i < 50; i++) {
        u = (lo + hi) / 2;
        if (3 * (1 - u) ** 2 * u * x1 + 3 * (1 - u) * u * u * x2 + u ** 3 < t) lo = u;
        else hi = u;
      }
      return 3 * (1 - u) ** 2 * u * y1 + 3 * (1 - u) * u * u * y2 + u ** 3;
    };
    const rader = [rad('html[data-entre="gar"] .heroinner{'), rad('html[data-entre="gar"] .herotile{').split(",brickaRes ")[1], rad('html[data-entre="gar"] .hem2 .hero .heromosaic{').split(",radRes ")[1]];
    for (const r of rader) {
      const m = r.match(/cubic-bezier\(([^)]+)\)/);
      assert.ok(m, r.slice(0, 70));
      const [x1, y1, x2, y2] = m[1].split(",").map(Number);
      const f = kurva(x1, y1, x2, y2);
      assert.ok(f(0.1) <= 0.06 && f(0.2) <= 0.2, `${r.slice(0, 40)}: ${(f(0.1) * 100).toFixed(0)} % och ${(f(0.2) * 100).toFixed(0)} %`);
      assert.ok(f(0.6) >= 0.85, "landar för sent");
    }
  });

  it("mobilen: raden reser sig som en yta, och brickorna har ingen egen entré i något läge", () => {
    const mobil = start.replace(/\/\*[\s\S]*?\*\//g, "");
    assert.match(mobil.slice(mobil.lastIndexOf("@media(max-width:880px){")), /\.hem2 \.hero \.herotile\{animation:none;/);
    // (0,3,0) väger tyngre än html[data-entre] .herotile (0,2,1): annars doldes varje bricka för sig i väntläget.
  });

  it("skriptet sätter väntläget bara på startsidan, första gången i fliken och aldrig vid mindre rörelse", () => {
    const sidhuvud = las("components/site.tsx");
    assert.match(sidhuvud, /!sessionStorage\.getItem\('fp-intro'\)&&location\.pathname==='\/'&&!\(m&&m\('\(prefers-reduced-motion:reduce\)'\)\.matches\)\)d\.setAttribute\('data-entre','vantar'\)/);
    assert.match(sidhuvud, /^\s*"try\{/m);
    assert.match(sidhuvud, /\}catch\(e\)\{\}";/);
    assert.match(utanK, /@media\(prefers-reduced-motion:reduce\)\{\s*html\[data-entre\] \.herogrid::after,html\[data-entre\] \.hero \.btn-primary::after\{animation:none\}/);
  });

  it("komponenten startar entrén först när innehållet är inne och bildrutorna kommer jämnt", () => {
    const k = las("components/hero-entre.tsx");
    assert.match(k, /getAttribute\("data-entre"\) !== "vantar"\) return;/);
    assert.match(k, /b\.decode\(\)\.catch/);
    assert.match(k, /document\.fonts\?\.ready/);
    assert.match(k, /Promise\.race\(\[Promise\.all\(\[typsnitt, \.\.\.bilder\]\), tak\]\)/);
    assert.match(k, /vantaPaLugn\(requestAnimationFrame, starta\)/);
    assert.match(k, /synlig\(forsta\) && synlig\(rad\)\) return ta_bort\(\)/);
    assert.match(las("app/page.tsx"), /<HeroEntre \/>/);
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

  it("ljussvepet vilar där det slutar", () => {
    const till = nyckelrutor("knappSvep").split("to{")[1];
    assert.equal(transform(regel(start, ".hem2 .hero .btn-primary::after")), transform(till));
    assert.doesNotMatch(regel(start, ".hem2 .hero .btn-primary::after"), /animation:/);
  });

  it("mindre rörelse stänger också temats stoft, som rör sig i ::before och ::after", () => {
    // Stjärnväljaren med animation:none i globals.css väljer bara element, inte pseudoelement.
    const lugn = (kalla: string) => [...kalla.matchAll(/@media\(prefers-reduced-motion:reduce\)\{([\s\S]*?\})\s*\}/g)].map((m) => m[1]).join("\n");
    const temat = lugn(tema.replace(/\/\*[\s\S]*?\*\//g, ""));
    for (const n of ["blackweek", "blackfriday", "blackweekend"]) {
      assert.ok(temat.includes(`:root[data-tema="${n}"] .herogrid::before`), n);
      assert.ok(temat.includes(`:root[data-tema="${n}"] .hero::after`), n);
    }
    assert.match(temat, /\.hero::after\{animation:none\}/);
  });

  it("mobilens brickor står upprätt (skarp text) och rätar inte upp eller lyfter sig vid beröring", () => {
    const vila = mobil.slice(mobil.indexOf(".hem2 .hero .herotile{"), mobil.indexOf("}", mobil.indexOf(".hem2 .hero .herotile{")));
    assert.doesNotMatch(vila, /rotate|perspective|scale/);
    // En egen yta per bricka, utan förflyttning: speglingen ritas av grafikkortet (Safari).
    assert.match(vila, /transform:translate3d\(0,0,0\);will-change:transform;/);
    assert.equal(transform(mobil.slice(mobil.indexOf(".hem2 .hero .herotile:hover{"))), "translate3d(0,0,0)");
  });

  it("mobilens spegling sitter på brickan, och raden har plats för den", () => {
    assert.match(mobil, /\.hem2 \.heromosaic\{padding-bottom:44px\}/);
    assert.match(mobil, /\.hem2 \.hero \.herotile\{[^}]*-webkit-box-reflect:below 5px/);
    assert.doesNotMatch(mobil, /\.heromosaic\{[^}]*box-reflect/);
  });

  // Leonard 2026-11-26: "jag vill ha allt med samma utseende premium deluxe men
  // bara bilderna skarpare". Vinkeln sitter som en 2D-matris på varje bricka
  // (lib/hero-vagg.ts, lib/hero-vagg.test.ts), inte som 3D på väggen: en vägg i
  // 3D ritades som en bild och skalades om, och bilderna blev mjuka.
  it("datorns vägg står vinklad som en 2D-matris per bricka, följer --hx och --hy och speglas", () => {
    const dator = utan.slice(utan.lastIndexOf("@media(min-width:881px){"), utan.lastIndexOf("@media(max-width:880px){"));
    const regel = (v: string) => { const i = dator.indexOf(`${v}{`); assert.ok(i >= 0, `${v} saknas`); return dator.slice(i, dator.indexOf("}", i)); };
    const vagg = regel(".hem2 .hero .heromosaic");
    assert.doesNotMatch(vagg, /transform|perspective|rotate/);
    assert.match(vagg, /-webkit-box-reflect:below 14px/);
    // speglingens plats i sidled: en genomskinlig kant som tas tillbaka, så att ingenting flyttar sig
    assert.match(vagg, /border-inline:24px solid transparent;margin-inline:-24px;/);
    const bricka = regel(".hem2 .hero .herotile");
    assert.match(bricka, /transform:var\(--m\);transform-origin:var\(--vx\) var\(--vy\);transition:transform \.7s cubic-bezier\(\.2,\.8,\.2,1\),box-shadow \.3s/);
    // ingen egen yta i vila: will-change eller en egen spegling på brickan tar tillbaka suddigheten (mätt)
    assert.doesNotMatch(bricka, /will-change|box-reflect|translate3d|perspective/);
    assert.match(regel(".hem2 .hero .herotile:hover"), /transform:var\(--m\) translateY\(-4px\)/);
    for (const v of [".hem2 .hero .herotile-stor", ".hem2 .hero .mcol:first-child .herotile:nth-child(2)", ".hem2 .hero .mcol-offset .herotile:first-child"]) {
      const m = regel(v);
      assert.match(m, /--m:matrix\(/, v);
      assert.doesNotMatch(m, /matrix3d|perspective|rotate/, v);
      assert.match(m, /var\(--hx,0\)/, v);
      assert.match(m, /var\(--hy,0\)/, v);
    }
    // entrén (i globals.css, hos de andra entréreglerna): brickan reser sig kring
    // sin nederkant inne i väggens vinkel och landar på sin matris
    const glob = css.replace(/\/\*[\s\S]*?\*\//g, "");
    assert.match(glob, /@media\(min-width:881px\)\{\s*html\[data-entre="gar"\] \.hem2 \.hero \.herotile\{animation-name:framTona,brickaResVagg\}/);
    const nyckel = glob.slice(glob.indexOf("@keyframes brickaResVagg{"), glob.indexOf("}}", glob.indexOf("@keyframes brickaResVagg{")));
    assert.match(nyckel, /from\{transform:var\(--m\) translate\(calc\(50% - var\(--vx\)\),calc\(100% - var\(--vy\)\)\) perspective\(1000px\) translate3d\(0,44px,-120px\) rotateX\(18deg\) rotateY\(-12deg\) translate\(calc\(var\(--vx\) - 50%\),calc\(var\(--vy\) - 100%\)\)\}/);
    assert.match(nyckel, /to\{transform:var\(--m\) translate\(calc\(50% - var\(--vx\)\),calc\(100% - var\(--vy\)\)\) perspective\(1000px\) translate3d\(0,0,0\) rotateX\(0deg\) rotateY\(0deg\) translate\(calc\(var\(--vx\) - 50%\),calc\(var\(--vy\) - 100%\)\)/);
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

  it("stoftet står stilla på mobilen: ingen drift och inga egna ytor på grafikkortet", () => {
    const mobilen = utan.slice(utan.indexOf("@media(max-width:880px){", a));
    for (const n of ["blackweek", "blackfriday", "blackweekend"]) {
      assert.ok(mobilen.includes(`:root[data-tema="${n}"] .herogrid::before`), n);
      assert.ok(mobilen.includes(`:root[data-tema="${n}"] .hero::after`), n);
    }
    assert.match(mobilen, /\.hero::after\{animation:none;will-change:auto\}/);
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

describe("studiobandet på listsidorna", () => {
  const utan = css.replace(/\/\*[\s\S]*?\*\//g, "");
  const butik = las("app/butik/butik.css").replace(/\/\*[\s\S]*?\*\//g, "");

  it("en regel bär bakgrunden för alla band, ur nattens variabler", () => {
    const m = utan.match(/\.kat-hero,\.butik-hero,\.b2-hjalte,\.sidtopp\{[^}]*\}/);
    assert.ok(m, "bandets regel saknas");
    assert.match(m[0], /background:var\(--natt-korn\),[\s\S]*var\(--natt\)\}/);
    assert.match(m[0], /color:var\(--natt-ljus\)/);
    assert.doesNotMatch(m[0], /#[0-9A-Fa-f]{3,6}\b/);
  });

  it("inget band har kvar en egen ljus bakgrund", () => {
    assert.match(utan, /^\.kat-hero\{padding:20px 0 44px\}$/m);
    assert.match(utan, /^\.butik-hero\{padding:42px 0 64px\}$/m);
    assert.match(butik, /^\.butik2 \.b2-hjalte\{padding:26px 0 34px\}$/m);
    assert.doesNotMatch(utan, /\.kat-hero::after|\.butik-hero::after\{content:"";position:absolute;width/);
  });

  it("en regel bär ljuset, och bara studions trippletter färgar det", () => {
    const m = utan.match(/\.kat-hero-grid::before,\.prog-hero::after,\.butik-hero::after,\.b2-hjalte::after,\.sidtopp::after\{[^}]*\}/);
    assert.ok(m, "ljusets regel saknas");
    assert.match(m[0], /rgba\(var\(--studio-ljus\),var\(--band-pol\)\)/);
    assert.match(m[0], /rgba\(var\(--studio-glod\),var\(--band-glod\)\)/);
    assert.doesNotMatch(m[0], /#[0-9A-Fa-f]{3,6}\b|filter:/);
  });

  it("kategorisidans ljus står på bildens mitt, och mobilens plats är räknad av lagret", () => {
    assert.match(utan, /\.kat-hero:not\(\.prog-hero\)\{--band-ljus:calc\(100% - 570px\)/);
    assert.match(utan, /\.kat-hero:not\(\.prog-hero\)\{--band-ljus:calc\(74% - 192px\)/);
    assert.match(utan, /\.kat-hero-grid::before\{z-index:-1;inset:-96px -400px -44px\}/);
    assert.doesNotMatch(utan, /--band-ljus:calc\(400px \+/);
  });

  it("texten i banden bär nattens färger", () => {
    assert.match(utan, /\.kat-hero-text h1\{[^}]*color:var\(--natt-ljus\)/);
    assert.match(utan, /\.kat-hero-text p\{[^}]*color:var\(--natt-dampad\)/);
    assert.match(utan, /\.butik-hero-title\{[^}]*color:var\(--natt-ljus\)/);
    assert.match(utan, /\.butik-crumbs a\{color:var\(--natt-dampad\)/);
    assert.match(butik, /\.butik2 h1\{[^}]*color:var\(--natt-ljus\)/);
    assert.match(butik, /\.butik2 \.b2-ingress\{[^}]*color:var\(--natt-dampad\)\}/);
    // De programmatiska sidornas brödsmulor: ledet har full styrka, bara avdelaren är svag.
    assert.match(utan, /\.prog-hero \.crumbs>span\{opacity:1\}/);
  });

  it("ingressen klarar 4,5:1 mot natten", () => {
    for (const h of hex(variabel("--natt"))) assert.ok(kontrast(hex(variabel("--natt-dampad"))[0], h) >= 4.5, `#${h}`);
  });

  it("kategoribilden speglas, och speglingen ryms i bandets luft", () => {
    assert.match(utan, /\.kat-hero-img\{[^}]*-webkit-box-reflect:below 6px/);
  });

  it("/sok och /blogg har rubriken i bandet", () => {
    // Söksidans band står i components/sok-vy.tsx sedan 2026-11-19: sidan har två
    // vägar (varm och kall katalog) som ritar samma vy.
    for (const f of ["components/sok-vy.tsx", "app/blogg/page.tsx"]) {
      assert.match(las(f), /<section className="sidtopp">\s*<div className="container">\s*<div className="sechead">/, f);
    }
  });
});

describe("mobilens verktygsrad på en rad", () => {
  const utan = css.replace(/\/\*[\s\S]*?\*\//g, "");
  const rad = utan.slice(utan.indexOf(".kat-lista{padding-top:24px}"));

  it("filterknappen och antalet delar första cellen, sorteringen står bredvid", () => {
    assert.match(rad, /\.shopbar,\.alla-prod \.shopbar\{display:grid;grid-template-columns:minmax\(0,1\.5fr\) minmax\(0,1fr\)/);
    assert.match(rad, /\.shopbar-toggle,\.alla-prod \.shopbar-toggle\{grid-area:1\/1;[^}]*min-height:44px/);
    assert.match(rad, /\.shopcount-inline,\.alla-prod \.shopcount-inline\{grid-area:1\/1;[^}]*pointer-events:none\}/);
    assert.match(rad, /\.shopbar-sort,\.alla-prod \.shopbar-sort\{grid-area:1\/2;[^}]*min-height:44px/);
  });

  it("den riktiga väljaren täcker hela sorteringsknappen, med 16 px mot iOS zoom", () => {
    assert.match(rad, /\.shopbar-sort select\{inset:0;width:100%;height:100%;[^}]*font-size:16px\}/);
    assert.match(rad, /\.shopbar-sort:focus-within\{border-color:var\(--orange\)\}/);
  });

  it("antalet skrivs som tal och ord var för sig, och raden vet när ett filter är valt", () => {
    const k = las("components/shopbrowser.tsx");
    assert.match(k, /<span className="shopcount-tal">\{tusental\(liveCount\)\}<\/span><span className="shopcount-ord">/);
    assert.match(k, /activeFilters > 0 \? " har-filter" : ""/);
    assert.match(rad, /@media\(max-width:349px\)\{\.shopbar\.har-filter \.shopcount-inline\{/);
  });

  it("kategorisidans lista har klassen som bär luften", () => {
    assert.match(las("app/kategori/[slug]/page.tsx"), /<section className="sec kat-lista">/);
  });
});
