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
    // Ett säsongstema får stå före: det sätts på <html> av lib/sasongstema.ts.
    for (const [selektorer] of regler) for (const s of selektorer) assert.match(s, /^(:root\[data-tema\] )?\.hem2[ .:>]/, s);
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

describe("hjälten håller huvudtråden stilla", () => {
  // En animation på ett element utan egen ruta (display:contents) kan inte
  // köras på grafikkortet. Dagens heroFloat på .mcol räknade därför om sidans
  // stil i varje bildruta utan att något syntes (mätt 2026-11-12: 300
  // omräkningar per 5 s mot 30 i dag).
  it("ett element utan egen ruta har ingen av butikens oändliga animationer", () => {
    const globals = las("app", "globals.css").replace(/\/\*[\s\S]*?\*\//g, "");
    // Klasser som globals.css animerar utan slut, som .mcol{animation:heroFloat 6s ease-in-out infinite}.
    const animerade = new Set([...globals.matchAll(/\.([\w-]+)\{[^}]*animation:[^;}]*infinite/g)].map((m) => m[1]));
    assert.ok(animerade.has("mcol"), "globals.css animerar inte längre .mcol: se över provet");
    const utanRuta = regler.filter(([, d]) => /(^|;)display:contents/.test(d)).flatMap(([s]) => s);
    assert.ok(utanRuta.includes(".hem2 .mcol"), "hjältens kolumner har inte längre display:contents: se över provet");
    const stilla = new Set(regler.filter(([, d]) => /(^|;)animation:none/.test(d)).flatMap(([s]) => s));
    for (const s of utanRuta) {
      const klass = s.match(/\.([\w-]+)$/)?.[1];
      if (klass && animerade.has(klass)) assert.ok(stilla.has(s), `${s} har display:contents men animeras fortfarande`);
    }
  });

  it("kategorifotona hämtas i rutans form (4:3)", () => {
    assert.match(sida, /unsplashIForm\(categoryHero\(c\.main\.name\), "4:3"\)/);
    assert.match(css, /\.hem2 \.kat-bild\{[^}]*aspect-ratio:4\/3/);
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
  it("guider visas när det finns minst tre, omdömen när det finns tre", () => {
    // Guiderna är en rad man bläddrar i sedan 2026-11-19: alla inlägg, inte tre.
    assert.match(sida, /\{allaGuider\.length >= 3 && \(/);
    assert.match(sida, /\{roster\.length === 3 && \(/);
  });

  it("omdömena visar initialer, aldrig kundens hela namn", () => {
    // Samma regel som /omdomen (lib/initialer.ts). Leonard 2026-11-12: "Ändra så
    // det inte står kundernas för och efternamn utan istället initialer".
    const kort = sida.slice(sida.indexOf('className="roster"'), sida.indexOf("</figure>", sida.indexOf('className="roster"')));
    assert.match(kort, /<span className="rost-namn">\{initialer\(r\.author\)\}<\/span>/);
    assert.doesNotMatch(kort.replace(/initialer\(r\.author\)/g, ""), /r\.author/);
    assert.match(sida, /^import \{ initialer \} from "\.\.\/lib\/initialer";$/m);
  });

  it("omdömena är Googles egna, fem stjärnor och lagom långa", () => {
    assert.match(sida, /CURATED_RESULT\.reviews\s*\.filter\(\(r\) => r\.rating === 5 && r\.text\.length >= 80 && r\.text\.length <= 220\)/);
  });

  it("guidens bild är tyst, rubriken bär länkens namn", () => {
    // Kortet ritas av raden (components/guide-karusell.tsx) sedan 2026-11-19.
    const rad = las("components", "guide-karusell.tsx");
    const kort = rad.slice(rad.indexOf('className="guide"'), rad.indexOf("</PrefetchLink>", rad.indexOf('className="guide"')));
    assert.match(kort, /<Image src=\{g\.cover\} alt="" fill /);
    assert.match(kort, /className="guide-titel"/);
  });
});

describe("köpguiderna: en rad med alla inlägg, lika lätt som förut", () => {
  const rad = las("components", "guide-karusell.tsx");

  it("☠️ startsidan bär bara de första korten: resten hämtas när någon rör raden", () => {
    // Alla inläggs data i sidan vägde 4,2 kB mer över nätet för varje besökare.
    assert.match(sida, /const allaGuider = guideKort\(await getPosts\(\)\.catch\(\(\) => \[\]\)\);/);
    assert.match(sida, /const guider = allaGuider\.slice\(0, GUIDER_FORST\);/);
    assert.match(sida, /<GuideKarusell guider=\{guider\} totalt=\{allaGuider\.length\} \/>/);
    assert.match(rad, /fetch\("\/api\/guider"/);
    // Hämtningen startar vid avsikt, aldrig när sidan laddas.
    assert.match(rad, /onPointerEnter=\{avsikt\} onTouchStart=\{avsikt\} onFocus=\{avsikt\}/);
    assert.doesNotMatch(rad, /useEffect\(\(\) => \{[^}]*hamta\(/);
    const rutt = las("app", "api", "guider", "route.ts");
    assert.match(rutt, /export const revalidate = 3600;/);
    assert.match(rutt, /s-maxage=3600, stale-while-revalidate=86400/);
    assert.match(rutt, /guider\.length \? CACHE : "public, s-maxage=60"/);
  });

  it("☠️ bara de första korten ritas: ett kort som inte är ritat hämtar ingen bild", () => {
    assert.match(rad, /const \[antal, setAntal\] = useState\(guider\.length\);/);
    assert.match(rad, /alla\.slice\(0, antal\)\.map\(/);
    // Inget omslag får hämtas i förväg: ingen priority och inget eager.
    assert.doesNotMatch(rad, /priority|loading="eager"|fetchPriority/);
  });

  it("pilarna är knappar med namn, och dolda på pekskärm", () => {
    assert.match(rad, /aria-label="Föregående guider"/);
    assert.match(rad, /aria-label="Fler guider"/);
    assert.match(css, /@media\(max-width:880px\)\{[\s\S]*?\.hem2 \.guide-pil\{display:none\}/);
  });

  it("korten: nyast först, utan omslag hoppas över, ingressen kortad vid ett ordslut", async () => {
    const { guideKort, kortIngress, flerKort, medResten, GUIDER_FORST, GUIDER_STEG } = await import("./guide-kort.ts");
    const poster = [
      { slug: "a", title: "A", excerpt: "kort", cover: "a.jpg", date: "2026-01-01" },
      { slug: "b", title: "B", excerpt: "", cover: "b.jpg", date: "2026-03-01" },
      { slug: "c", title: "C", excerpt: "x", cover: "", date: "2026-09-01" },
      { slug: "d", title: "D", excerpt: "x", cover: "d.jpg", date: "2025-01-01", updated: "2026-10-01" },
    ];
    assert.deepEqual(guideKort(poster).map((g) => g.slug), ["d", "b", "a"]);
    assert.deepEqual(Object.keys(guideKort(poster)[0]).sort(), ["cover", "excerpt", "slug", "title"]);
    const lang = "Köpguide till leksakskök: storlek, höjd, trä eller många delar, vatten, ljus och ljud. Se alla 23 kök, grillar och diskbänkar för barn som finns i butiken just nu.";
    const kort = kortIngress(lang);
    assert.ok(kort.length <= 131 && kort.endsWith("…"), kort);
    assert.ok(lang.startsWith(kort.slice(0, -1)));
    assert.doesNotMatch(kort, /[\s,]…$/);
    assert.equal(kortIngress("En kort ingress."), "En kort ingress.");
    assert.equal(GUIDER_FORST, 4);
    assert.equal(flerKort(4, 44), 4 + GUIDER_STEG);
    assert.equal(flerKort(40, 44), 44);
    // Resten läggs efter de ritade: inget kort två gånger, skräp hoppas över,
    // och ett kort som står i sidan men inte i filen står kvar.
    const ritade = [{ slug: "a", title: "A", excerpt: "", cover: "a.jpg" }, { slug: "gammal", title: "G", excerpt: "", cover: "g.jpg" }];
    const fil = [{ slug: "a", title: "A2", excerpt: "x", cover: "a.jpg" }, { slug: "b", title: "B", cover: "b.jpg" }, { slug: "", title: "x", cover: "x" }, null, { slug: "c", title: "C", excerpt: "y", cover: "" }, { slug: "b", title: "B igen", cover: "b.jpg" }];
    assert.deepEqual(medResten(ritade, fil).map((g) => g.slug), ["a", "gammal", "b"]);
    assert.equal(medResten(ritade, fil)[0].title, "A");
    assert.equal(medResten(ritade, fil)[2].excerpt, "");
    assert.deepEqual(medResten(ritade, { fel: true }), ritade);
  });
});

describe("hjälten", () => {
  it("rubriken bär samma ord i samma ordning som förut", () => {
    const h1 = sida.slice(sida.indexOf("<h1>"), sida.indexOf("</h1>"));
    assert.equal(h1.replace(/<[^>]+>/g, "").replace(/\s+/g, " ").trim(), "Fyndplats — Noga utvalda fynd, tryggt köp");
    assert.match(h1, /<span className="h1-marke">Fyndplats —<\/span>/);
    assert.match(h1, /<em>tryggt köp<\/em>/);
  });

  it("faktaraden har tre länkar, och orden som döljs på mobilen står kvar i texten", () => {
    const rad = sida.slice(sida.indexOf('<div className="herotrust">'), sida.indexOf("{/* PrefetchLink, inte <a>"));
    assert.equal(rad.split("<a ").length - 1, 3);
    assert.doesNotMatch(rad, /aria-label/);
    assert.match(rad, /<span className="ht-lang">av 5 <\/span>på Google/);
    assert.match(rad, /i tull<span className="ht-lang"> – allt från EU-lager<\/span>/);
    // Dolt för ögat, inte för skärmläsaren.
    assert.match(css, /\.hem2 \.ht-lang\{position:absolute;width:1px;height:1px;overflow:hidden;clip-path:inset\(50%\);white-space:nowrap\}/);
  });

  it("antalet i faktaraden avrundas nedåt, så att det aldrig lovar för mycket", () => {
    assert.match(sida, /const antalIHjalten = `\$\{tusental\(Math\.floor\(iLager \/ 100\) \* 100\)\}\+`;/);
  });

  it("bara första brickan förladdas, och namnet läses en gång", () => {
    const bricka = sida.slice(sida.indexOf("const heroBricka ="), sida.indexOf("  return (\n    <>"));
    assert.match(bricka, /\{\.\.\.\(i === 0 \? \{ preload: true as const, fetchPriority: "high" as const \} : \{\}\)\}/);
    assert.match(bricka, /alt=\{p\.name\}/);
    assert.match(bricka, /<span className="hnamn" aria-hidden="true">\{p\.name\}<\/span>/);
  });

  it("bildrutan är kvadratisk, så att platshållaren aldrig syns bredvid bilden", () => {
    assert.match(css, /\.hem2 \.hbild\{[^}]*aspect-ratio:1;/);
    assert.match(css, /\.hem2 \.herotile img\{object-fit:contain;mix-blend-mode:multiply\}/);
  });

  it("faktaraden ärver hjältens färg, så att den syns i ett mörkt säsongstema", () => {
    assert.match(css, /\.hem2 \.herotrust\{[^}]*color:inherit;/);
    assert.match(css, /\.hem2 \.ht-tal\{[^}]*color:inherit;/);
    assert.match(css, /:root\[data-tema\] \.hem2 \.hero \.herotrust>a\{background:none;box-shadow:none\}/);
  });
});
