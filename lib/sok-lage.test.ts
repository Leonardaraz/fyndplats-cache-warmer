// Run: node --test --experimental-strip-types lib/sok-lage.test.ts
//
// MOBILENS SÖKLÄGE (2026-11-20). Leonard sökte "bilar" på sin iPhone: med
// tangentbordet uppe rymde panelen ordförslagen, två kategorirader och
// rubriken "Varor", och inte en enda vara. Nu tar sökningen över skärmen på
// mobilen och visar varorna i ett rutnät med stora bilder.
//
// Proven här läser källkoden: läget ritas i en webbläsare, och det som går
// att mäta där (vad som syns över tangentbordet, att sidan står still) mäts
// med Playwright mot bygget. Det som inte får glida isär utan att någon
// märker det står här.
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const las = (...delar: string[]) => readFileSync(join(import.meta.dirname, "..", ...delar), "utf8");
const utanKommentarer = (s: string) => s.replace(/\/\*[\s\S]*?\*\//g, "");
const ruta = las("components", "searchbox.tsx");
const css = utanKommentarer(las("app", "globals.css"));

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
const farg = (namn: string) => {
  const m = new RegExp(`--${namn}:(#[0-9a-fA-F]{6})`).exec(css);
  assert.ok(m, `--${namn} hittades inte`);
  return m[1];
};

describe("sökläget gäller bara mobilens sökrad, under 900 px", () => {
  it("bara rutan i mobilens sökrad bär helskarm", () => {
    const sida = las("components", "site.tsx");
    assert.match(sida, /<div className="hsearch-mobile">\s*<div className="container"><SearchBox helskarm \/><\/div>/);
    assert.equal(sida.split("<SearchBox").length - 1, 2, "datorns ruta och mobilens sökrad");
    assert.match(sida, /<HemLank className="brand"><Mark \/>Fyndplats<\/HemLank>\s*<SearchBox \/>/);
    // Mobilmenyns ruta ligger i en låda som redan täcker skärmen.
    assert.doesNotMatch(las("components", "mobilenav.tsx"), /<SearchBox[^>]*helskarm/);
  });

  it("gränsen är sidhuvudets: där visas mobilens sökrad", () => {
    assert.match(ruta, /const SOKLAGE_MEDIA = "\(max-width: 900px\)";/);
    assert.match(css, /@media\(max-width:900px\)\{[^@]*\.hsearch-mobile\{display:block;padding-bottom:12px\}/);
    assert.match(css, /@media\(max-width:900px\)\{\s*html\[data-sok-lage\] \.promo,html\[data-sok-lage\] \.sidhuvud \.hrow\{display:none\}/);
  });

  it("läget följer skärmens bredd utan en effekt som sätter tillstånd", () => {
    assert.match(ruta, /const smal = useSyncExternalStore\(prenumereraSmal, arSmal, inteSmal\);\s+const rutnat = helskarm && smal;/);
    // På servern och under hydreringen: datorns lista, så att HTML och första ritningen är lika.
    assert.match(ruta, /const inteSmal = \(\) => false;/);
    assert.match(ruta, /const sokLage = rutnat && visas;/);
  });
});

describe("sökläget tar över skärmen och släpper den igen", () => {
  it("html bär data-sok-lage och sidan låses, före första ritningen", () => {
    assert.match(ruta, /useLayoutEffect\(\(\) => \{\s+if \(!sokLage\) return;\s+const rot = document\.documentElement;\s+rot\.setAttribute\("data-sok-lage", ""\);\s+const slapp = lasSidan\(\);/);
    assert.match(ruta, /return \(\) => \{ rot\.removeAttribute\("data-sok-lage"\); slapp\(\); tillbaka\?\.\(\); \};\s+\}, \[sokLage\]\);/);
  });

  it("sidan under går inte att tabba till eller läsa upp medan sökläget är öppet", () => {
    assert.match(ruta, /const huvud = wrapRef\.current\?\.closest\("header"\);\s+const tillbaka = huvud \? gorBakomInert\(huvud, document\.body\) : null;/);
  });

  it("☠️ läget sätts före mätningen: rutan mäts där den står i sökläget", () => {
    const lage = ruta.indexOf('rot.setAttribute("data-sok-lage", "")');
    const matning = ruta.indexOf("const vv = window.visualViewport;");
    assert.ok(lage > 0 && matning > lage, "effekten som sätter läget ska stå före den som mäter");
    assert.match(ruta, /useLayoutEffect\(\(\) => \{\s+const vv = window\.visualViewport;/);
    assert.match(ruta, /\}, \[visas, sokLage\]\);/);
    // Sökläget börjar vid sidhuvudets underkant (sökradens 12 px) och går ända ner.
    assert.match(ruta, /if \(sokLage\) \{[\s\S]{0,700}wrap\.style\.setProperty\("--sok-topp", `\$\{Math\.max\(0, Math\.round\(ruta\.bottom \+ 12\)\)\}px`\);\s+wrap\.style\.setProperty\("--sok-kant", `\$\{Math\.max\(0, Math\.round\(ruta\.left\)\)\}px`\);\s+return;/);
    // Datorns lista hänger 8 px under rutan och slutar 8 px över tangentbordet, som förut.
    assert.match(ruta, /if \(vv\) wrap\.style\.setProperty\("--sok-max", `\$\{Math\.max\(160, Math\.round\(vv\.height \+ vv\.offsetTop - ruta\.bottom - 16\)\)\}px`\);/);
  });

  it("☠️ sökläget följer inte tangentbordet: höjden räknas aldrig ur visualViewport", () => {
    // Leonard 2026-11-20: "När man sökt och klickar på bocken måste bilder
    // visas direkt inte ett tomt fält i några 100 ms". Panelen slutade vid
    // tangentbordet, och iPhone säger till först när det har glidit ner.
    const lage = ruta.slice(ruta.indexOf("if (sokLage) {", ruta.indexOf("const vv = window.visualViewport;")), ruta.indexOf("// Listan hänger 8 px under rutan"));
    assert.ok(lage.length > 100);
    assert.doesNotMatch(lage.replace(/\/\/[^\n]*/g, ""), /vv\.|--sok-max/);
    // Utan visualViewport (Safari före 13) fungerar sökläget ändå.
    assert.match(ruta, /if \(!wrap \|\| !visas\) return;/);
    assert.match(ruta, /vv\?\.addEventListener\("resize", satt\);/);
    // Skärmens höjd för webbläsare utan dvh mäts inte medan rutan har fokus:
    // då kan tangentbordet vara uppe. En vridning ändrar bredden och mäts alltid.
    assert.match(ruta, /const hojd = \(\) => \{ if \(sokLage\) wrap\.style\.setProperty\("--sok-vh", `\$\{window\.innerHeight\}px`\); \};/);
    assert.match(ruta, /if \(document\.activeElement !== inputRef\.current \|\| window\.innerWidth !== bredd\) hojd\(\);\s+bredd = window\.innerWidth;\s+satt\(\);/);
  });

  it("sidhuvudet ligger över sidan, kakfrågan och köpraden, men under bildvisaren och sidbytets rand", () => {
    const z = (regel: RegExp) => Number(regel.exec(css)?.[1] ?? NaN);
    const huvud = z(/html\[data-sok-lage\] \.sidhuvud\{z-index:(\d+);/);
    const tacke = z(/html\[data-sok-lage\] body::before\{content:"";position:fixed;inset:0;z-index:(\d+);background:#fff\}/);
    assert.equal(huvud, tacke + 1);
    assert.ok(tacke > z(/\.cookiebar\{[^}]*z-index:(\d+)/), "över kakfrågan");
    assert.ok(tacke > z(/\.sticky-buy-mobile\{[^}]*z-index:(\d+)/), "över köpraden");
    assert.ok(huvud < z(/\.lightbox\{[^}]*z-index:(\d+)/), "under bildvisaren");
    assert.ok(huvud < z(/\.sidbyte\{[^}]*z-index:(\d+)/), "under sidbytets rand");
    // Sidhuvudets oskärpa gör det till ram för fasta lager: i sökläget är det helvitt.
    assert.match(css, /html\[data-sok-lage\] \.sidhuvud\{z-index:250;background:#fff;-webkit-backdrop-filter:none;backdrop-filter:none\}/);
  });

  it("knappen Stäng finns bara i sökläget, och ett tryck bredvid fältet stänger inte", () => {
    assert.match(ruta, /\{sokLage && <button type="button" className="search-stang" onClick=\{stang\}>Stäng<\/button>\}/);
    assert.match(ruta, /const stang = \(\) => \{ setOpen\(false\); inputRef\.current\?\.blur\(\); \};/);
    assert.match(ruta, /if \(document\.documentElement\.hasAttribute\("data-sok-lage"\)\) return;\s+if \(wrapRef\.current && !wrapRef\.current\.contains\(e\.target as Node\)\) setOpen\(false\);/);
    assert.match(css, /\.search-stang\{[^}]*min-height:44px;/);
  });

  it("bakåt och framåt stänger panelen: annars täcker läget sidan man kom till", () => {
    assert.match(ruta, /const onPop = \(\) => \{ setOpen\(false\); window\.setTimeout\(/);
  });

  it("en skickad sökning fäller tangentbordet", () => {
    assert.match(ruta, /setSkickad\(true\);\s+\/\/[^\n]*\n\s+if \(rutnat\) inputRef\.current\?\.blur\(\);/);
  });
});

describe("varorna står i ett rutnät med stora bilder", () => {
  it("tolv varor: jämna rader med två, tre och fyra kort", () => {
    assert.match(ruta, /const RUTNAT = 12;/);
    assert.equal(12 % 2 + 12 % 3 + 12 % 4, 0);
    assert.match(ruta, /const antal = rutnat \? RUTNAT : SUGGESTION_COUNT;/);
    assert.match(ruta, /const showing: Hit\[\] = rutnat \? \(isPopular \? popular : hits\)\.slice\(0, RUTNAT\) : iListan;/);
    assert.match(css, /\.hsearch-mobile \.sugg \[role="listbox"\]\{display:grid;grid-template-columns:repeat\(2,minmax\(0,1fr\)\);gap:20px 10px;padding:0 16px\}/);
    assert.match(css, /@media\(min-width:600px\) and \(max-width:900px\)\{\s*\.hsearch-mobile \.sugg \[role="listbox"\],\.hsearch-mobile \.sugg-skelett\{grid-template-columns:repeat\(3,minmax\(0,1fr\)\)\}/);
    assert.match(css, /@media\(min-width:800px\) and \(max-width:900px\)\{\s*\.hsearch-mobile \.sugg \[role="listbox"\],\.hsearch-mobile \.sugg-skelett\{grid-template-columns:repeat\(4,minmax\(0,1fr\)\)\}/);
  });

  it("datorns lista ber om sju och sökläget om tolv: båda är början på resultatsidans lista", () => {
    // Det köpbara läggs först bland alla träffar och sedan klipps listan
    // (lib/sok-ordning.ts), så de sju är de tolvs första sju.
    assert.match(ruta, /const antal = rutnat \? RUTNAT : SUGGESTION_COUNT;/);
    assert.doesNotMatch(ruta, /rankaForslagMedAntal\([^)]*RUTNAT/);
  });

  it("kortet: bild, och sedan namn, pris och slutsåld i den ordning de läses upp", () => {
    assert.match(ruta, /className=\{`sugg-kort\$\{i === active \? " active" : ""\}`\}/);
    assert.match(ruta, /<span className="sugg-kort-bild">\s+\{h\.i && <Image src=\{tightFillUrl\(h\.i, 600, 600\)\} alt="" fill sizes=\{RUTNAT_SIZES\} loading=\{hi < BILDER_DIREKT \|\| allaBilder \? "eager" : "lazy"\} \/>\}\s+<\/span>\s+<span className="sugg-kort-namn">\{highlight\(h\.n\)\}<\/span>\s+\{h\.p && <span className="sugg-kort-pris">\{h\.p\}<\/span>\}\s+\{h\.o && <span className="sugg-kort-slut">Slutsåld<\/span>\}/);
    assert.match(css, /\.sugg-kort-bild\{position:relative;display:block;aspect-ratio:1;/);
  });

  it("☠️ det upplästa namnet är den synliga texten: ingen aria-label på kortet", () => {
    // axe (label-content-name-mismatch) fällde tolv kort när kortet bar en
    // aria-label i annan ordning än texten. Priset ligger på bilden genom
    // kortets rutnät, inte genom sin plats i källan.
    const kort = ruta.slice(ruta.indexOf('className={`sugg-kort${'), ruta.indexOf('<span className="sugg-kort-bild">'));
    assert.doesNotMatch(kort, /aria-label/);
    assert.match(css, /\.sugg-kort\{display:grid;grid-template-columns:minmax\(0,1fr\);grid-template-rows:auto auto;row-gap:8px;/);
    assert.match(css, /\.sugg-kort-bild\{grid-area:1\/1\}\s*\.sugg-kort-namn\{grid-area:2\/1\}/);
    assert.match(css, /\.sugg-kort-pris\{grid-area:1\/1;align-self:end;justify-self:start;z-index:1;/);
    assert.match(css, /\.sugg-kort-slut\{grid-area:1\/1;align-self:start;justify-self:start;z-index:1;/);
  });

  it("samma bildadress som produktkorten i listorna, så att filen återanvänds", () => {
    // Korten skalar tightFillUrl(img, 600, 600) med den globala laddaren.
    assert.match(las("components", "card-gallery.tsx"), /src=\{tightFillUrl\(img, 600, 600\)\}/);
    assert.match(ruta, /<Image src=\{tightFillUrl\(h\.i, 600, 600\)\}/);
  });

  it("bildens sizes följer rutnätets bredder, och täta skärmar hämtar 384-filen", () => {
    const sizes = /const RUTNAT_SIZES = "([^"]+)";/.exec(ruta)?.[1] ?? "";
    assert.match(sizes, /^\(-webkit-min-device-pixel-ratio:2\.5\) 128px, \(min-resolution:2\.5dppx\) 128px, /);
    // ☠️ Mellanslaget efter "calc(" är med flit: Next läser vw-talen med en
    // regex som kräver blanksteg före, annars skrivs alla sexton bredder ut.
    const vw = [...sizes.matchAll(/(^|\s)(1?\d?\d)vw/g)].map((m) => Number(m[2]));
    assert.deepEqual(vw, [50, 33, 25]);
    // Panelen har 16 px kant och 10 px mellan korten.
    const bredd = (skarm: number, kolumner: number) => (skarm - 32 - 10 * (kolumner - 1)) / kolumner;
    const sagd = (skarm: number, andel: number, avdrag: number) => (skarm * andel) / 100 - avdrag;
    assert.ok(Math.abs(bredd(390, 2) - sagd(390, 50, 21)) <= 1);
    assert.ok(Math.abs(bredd(700, 3) - sagd(700, 33, 18)) <= 4);
    assert.ok(Math.abs(bredd(850, 4) - sagd(850, 25, 16)) <= 1);
    // 128 px gånger tre är 384: filen som en iPhone då väljer.
    assert.equal(128 * 3, 384);
  });

  it("kategorierna står som chips i sökläget, och som rader i datorns lista", () => {
    assert.match(ruta, /const katRader = rutnat \? \[\] : kategorier;/);
    assert.match(ruta, /const rader = katRader\.length \+ showing\.length;/);
    assert.match(ruta, /\{rutnat && kategorier\.map\(\(k\) => \(\s+<a key=\{k\.slug\} href=\{`\/kategori\/\$\{k\.slug\}`\} className="sugg-chip sugg-chip-kat"/);
    assert.match(ruta, /\{\(visaForslag \|\| \(rutnat && kategorier\.length > 0\)\) && \(/);
  });

  it("rubriken med Visa alla står utanför listboxen: en listbox bär bara val", () => {
    const rubrik = ruta.indexOf('<div className="sugg-rubrik">');
    const listbox = ruta.indexOf('<div role="listbox"');
    assert.ok(rubrik > 0 && rubrik < listbox);
    assert.match(ruta, /<button type="button" className="sugg-alla-lank" onClick=\{\(\) => goSearch\(visar \|\| undefined\)\} disabled=\{soker\}>Visa alla \{totalt\} →<\/button>/);
    // I listboxen ritas bara val i sökläget: rubrikerna där hör till datorns lista.
    assert.match(ruta, /\{!rutnat && isPopular && showing\.length > 0 && \(/);
    assert.match(ruta, /\{!rutnat && !isPopular && showing\.length > 0 && \(kategorier\.length > 0/);
    assert.match(ruta, /\{!rutnat && rader > 0 && \(\s+<div className="sugg-tangenter"/);
  });

  it("fotens knapp är en vanlig knapp sist i listan, inte fäst över tangentbordet", () => {
    assert.match(css, /\.hsearch-mobile \.sugg-all\{position:static;/);
    assert.match(css, /\.sugg-all\{[^}]*position:sticky;bottom:-6px;/, "datorns lista har den kvar");
  });

  it("medan indexet hämtas ritas kortens platser", () => {
    assert.match(ruta, /\{rutnat && laddar && showing\.length === 0 && \(\s+<div className="sugg-skelett" aria-hidden="true">/);
  });
});

describe("sökläget: tangentbordet och fingret", () => {
  it("ett drag uppåt eller nedåt i listan fäller tangentbordet, ett drag i sidled gör det inte", () => {
    assert.match(ruta, /if \(dy > 12 && dy > Math\.abs\(t\.clientX - fran\.x\)\) inputRef\.current\?\.blur\(\);/);
    assert.match(ruta, /if \(!fran \|\| !t \|\| document\.activeElement !== inputRef\.current\) return;/);
    assert.match(ruta, /<div className="sugg" ref=\{panelRef\} onTouchStart=\{rutnat \? onDragStart : undefined\} onTouchMove=\{rutnat \? onDrag : undefined\}>/);
  });

  it("nya förslag börjar överst i listan", () => {
    assert.match(ruta, /panelRef\.current\?\.scrollTo\(0, 0\);/);
  });

  it("☠️ panelen går kant i kant från sidhuvudet ner till skärmens kant, också bakom tangentbordet", () => {
    // dvh ändras inte av tangentbordet. Raden före är för Safari före 15.4.
    assert.match(css, /\.hsearch-mobile \.sugg\{top:calc\(100% \+ 12px\);left:calc\(-1 \* var\(--sok-kant,16px\)\);right:calc\(-1 \* var\(--sok-kant,16px\)\);height:calc\(var\(--sok-vh,100vh\) - var\(--sok-topp,70px\)\);height:calc\(100dvh - var\(--sok-topp,70px\)\);max-height:none;/);
    const regel = /\.hsearch-mobile \.sugg\{[^}]*\}/.exec(css)?.[0] ?? "";
    assert.doesNotMatch(regel, /--sok-max/, "höjden får inte hänga på tangentbordets mått");
    assert.match(css, /html\[data-sok-lage\] \.hsearch-mobile \.container\{padding:0 16px\}/);
  });

  it("☠️ kortens bilder väntar inte på att raden syns: sex direkt, resten när listan stått still", () => {
    assert.match(ruta, /const BILDER_DIREKT = 6;/);
    assert.match(ruta, /const ALLA_BILDER_EFTER_MS = 250;/);
    assert.match(ruta, /const iRutnatet = isPopular \? popular : hits;/);
    assert.match(ruta, /if \(!sokLage \|\| iRutnatet\.length <= BILDER_DIREKT\) return;/);
    assert.match(ruta, /const t = window\.setTimeout\(\(\) => setAllaBilderFor\(iRutnatet\), ALLA_BILDER_EFTER_MS\);\s+return \(\) => window\.clearTimeout\(t\);/);
    // En ny lista börjar om utan att något nollställs: jämförelsen är på listan själv.
    assert.match(ruta, /const allaBilder = allaBilderFor === iRutnatet;/);
    // Den som sparar data hämtar bilderna när de syns, som förut.
    assert.match(ruta, /if \(prefersDataSaving\(\(navigator as Navigator & \{ connection\?: \{ saveData\?: boolean; effectiveType\?: string \} \}\)\.connection\)\) return;/);
  });
});

describe("☠️ samma sökning igen på resultatsidan hämtar ingen ny sida", () => {
  // Mätt på www 2026-11-20 (audit/sok-samma.cjs): /sok?q=cykel, två "Visa
  // fler", rullat 7 236 px ner, sökläget öppnat och "Visa alla" tryckt. Sidan
  // hämtades igen, listan började om med 24 kort och kunden stod vid sidfoten
  // ("kvar till botten 0"). Leonard: "ibland kastas man längst ner på sidan".
  it("står träffarna för sökningen redan framme stängs sökläget och sidan visas från början", () => {
    assert.match(ruta, /const resultatsidanVisar = \(t: string\) =>\s+window\.location\.pathname === "\/sok"\s+&& \(new URLSearchParams\(window\.location\.search\)\.get\("q"\) \?\? ""\)\.trim\(\) === t\s+&& document\.querySelector\("main \.shoplista"\) !== null;/);
    assert.match(ruta, /if \(resultatsidanVisar\(t\)\) \{\s+setOpen\(false\);\s+inputRef\.current\?\.blur\(\);\s+onNavigate\?\.\(\);\s+rullaDirekt\(0\);\s+return;\s+\}\s+setSkickad\(true\);/);
    // Sökningen sparas bland de senaste också då.
    const go = ruta.slice(ruta.indexOf("const goSearch = "), ruta.indexOf("startaSok(() => router.push(`/sok?q="));
    assert.ok(go.indexOf("setTidigare(kommIhagSokning(t));") < go.indexOf("if (resultatsidanVisar(t))"));
  });

  it("resultatlistan bär klassen som sökrutan letar efter", () => {
    assert.match(las("components", "shopbrowser.tsx"), /<div className=\{`prodgrid listgrid shoplista\$\{vantar \? " is-vantar" : ""\}`\}/);
  });
});

describe("sökläget: färgerna håller kontrastkravet", () => {
  it("priset, slutsåld-märket, kategorins chip och Visa alla", () => {
    const pris = /\.sugg-kort-pris\{[^}]*background:rgba\(255,255,255,\.96\);color:var\(--ink\);/.test(css);
    assert.ok(pris, "priset: mörk text på vitt");
    assert.ok(kontrast(farg("ink"), "#ffffff") >= 7);
    const slut = /\.sugg-kort-slut\{[^}]*background:(#[0-9a-fA-F]{6});color:#fff;/.exec(css);
    assert.ok(slut && kontrast("#ffffff", slut[1]) >= 4.5);
    assert.match(css, /\.sugg-chip-kat\{[^}]*background:var\(--warm\);border-color:transparent;color:var\(--brand\);/);
    assert.ok(kontrast(farg("brand"), farg("warm")) >= 4.5, `kategorins chip: ${kontrast(farg("brand"), farg("warm")).toFixed(2)}`);
    assert.match(css, /\.sugg-alla-lank\{[^}]*color:var\(--brand\);/);
    assert.ok(kontrast(farg("brand"), "#ffffff") >= 4.5);
  });
});

describe("produktsidans huvudbild börjar hämtas i trycket", () => {
  const varm = las("lib", "hjaltebild-varm.ts");
  const galleri = las("components", "gallery.tsx");

  it("☠️ förhämtningen och galleriet bygger adressen med samma laddare, sizes och mått", () => {
    assert.match(varm, /getImageProps\(\{ src: bild, alt: "", width: 800, height: 800, sizes: HERO_SIZES, loader: wixMainLoader \}\)/);
    assert.match(galleri, /width=\{800\}\s+height=\{800\}/);
    assert.match(galleri, /loader=\{isWix \? wixMainLoader : undefined\}/);
    assert.match(galleri, /sizes=\{HERO_SIZES\}/);
    assert.match(galleri, /import \{ wixMainLoader \} from "\.\.\/lib\/hjalte-loader";/);
    assert.doesNotMatch(galleri, /function wixMainLoader/);
    assert.match(las("lib", "hjalte-loader.ts"), /return tightFillUrl\(src, width, width, quality \|\| 72\);/);
  });

  it("sizes sätts före srcset, och en bild hämtas bara en gång", () => {
    assert.ok(varm.indexOf("im.sizes = k.sizes") < varm.indexOf("im.srcset = k.srcSet"));
    assert.ok(varm.indexOf("im.srcset = k.srcSet") < varm.indexOf("im.src = k.src"));
    assert.match(varm, /const nyckel = wixMediaKey\(bild\);\s+if \(!nyckel\) return;\s+kommIhagKortbild\(bild, kortet\);\s+if \(varmade\.has\(nyckel\)\) return;/);
    // ☠️ Listsidorna skickar bilden som en naken nyckel: adressen byggs om från den.
    assert.match(varm, /hjaltebildKandidater\(`https:\/\/static\.wixstatic\.com\/media\/\$\{nyckel\}`\)/);
    assert.match(las("lib", "wix-media-key.ts"), /if \(!url\.includes\("\/"\) && !url\.includes\(":"\)\) return url;/);
    assert.match(varm, /if \(prefersDataSaving\(nat\)\) return;/);
  });

  it("produktkortet: musen vid knapptrycket, fingret först vid klicket", () => {
    const lank = las("components", "prefetch-link.tsx");
    assert.match(lank, /if \(e\.pointerType === "mouse"\) varmHjaltebild\(hjaltebild, e\.currentTarget\);/);
    assert.match(lank, /onClick=\{\(e\) => varmHjaltebild\(hjaltebild, e\.currentTarget\)\}/);
    // En beröring kan vara början på en rullning: där hämtas ingen bild.
    const beroring = /onTouchStart=\{\(\) => \{([\s\S]*?)\}\}/.exec(lank)?.[1] ?? "";
    assert.doesNotMatch(beroring, /varmHjaltebild/);
    assert.match(las("components", "productcard.tsx"), /hjaltebild=\{p\.img \|\| undefined\}/);
  });

  it("sökförslagen: både raden och kortet", () => {
    assert.match(ruta, /const goProduct = \(slug: string, bild\?: string, kortet\?: Element\) => \{ varmHjaltebild\(bild, kortet\); setOpen\(false\);/);
    assert.equal(ruta.split("goProduct(h.s, h.i, e.currentTarget)").length - 1, 2);
  });

  it("kortets bild visas medan huvudbilden hämtas: samma foto, hämtad, stor nog och nyss", () => {
    assert.match(varm, /if \(!url \|\| !img\.complete \|\| img\.naturalWidth === 0\) continue;\s+if \(wixMediaKey\(url\) !== nyckel \|\| wixUtbredd\(url\) < KORTBILD_MINSTA_BREDD\) continue;/);
    assert.match(varm, /const KORTBILD_MINSTA_BREDD = 300;/);
    assert.match(varm, /if \(!bild \|\| !kortbild \|\| Date\.now\(\) - kortbild\.nar > KORTBILD_GALLER_MS\) return null;\s+return wixMediaKey\(bild\) === kortbild\.nyckel \? kortbild\.url : null;/);
    // Galleriet: bara det första lagret, och utan kortbild är allt som förut.
    assert.match(galleri, /const \[kortbild\] = useState\(\(\) => kortbildFor\(main\)\);/);
    assert.match(galleri, /placeholder=\{isInitial && kortbild \? "empty" : "blur"\}/);
    assert.match(galleri, /style=\{isInitial && kortbild \? \{ backgroundImage: `url\("\$\{kortbild\.replace\(\/"\/g, "%22"\)\}"\)`, backgroundSize: "cover", backgroundPosition: "center" \} : undefined\}/);
  });

  it("☠️ anslutningen till Wix bildserver öppnas utan crossOrigin: bilder hämtas utan CORS", () => {
    const layout = las("app", "layout.tsx");
    assert.match(layout, /<link rel="preconnect" href="https:\/\/static\.wixstatic\.com" \/>/);
    assert.doesNotMatch(layout, /<link rel="preconnect" href="https:\/\/static\.wixstatic\.com" crossOrigin/);
  });
});
