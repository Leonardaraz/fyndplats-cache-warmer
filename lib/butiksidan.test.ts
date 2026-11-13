// Butikssidan (/butik): app/butik/page.tsx och app/butik/butik.css.
// Förslag 2026-11-12. Reglerna står i stil och markup, så proven läser källan.
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const las = (...delar: string[]) => readFileSync(join(import.meta.dirname, "..", ...delar), "utf8");
const css = las("app", "butik", "butik.css").replace(/\/\*[\s\S]*?\*\//g, "");
const sida = las("app", "butik", "page.tsx");

/** Varje regel som [selektorer, deklarationer], med @media-huvudena borttagna. */
const regler = css
  .replace(/@media[^{]*\{/g, "")
  .split("}")
  .map((r) => r.split("{"))
  .filter((r) => r.length === 2 && r[0].trim())
  .map(([s, d]) => [s.split(",").map((x) => x.trim()), d.trim()] as const);

/** Sidans markup mellan två markörer. */
function del(fran: string, till: string): string {
  const a = sida.indexOf(fran);
  assert.ok(a >= 0, `hittar inte ${fran}`);
  const b = sida.indexOf(till, a + fran.length);
  assert.ok(b > a, `hittar inte ${till} efter ${fran}`);
  return sida.slice(a, b);
}

describe("butikssidans stilar rör bara butikssidan", () => {
  it("varje selektor börjar med .butik2", () => {
    assert.ok(regler.length > 60, `bara ${regler.length} regler lästa`);
    for (const [selektorer] of regler) for (const s of selektorer) assert.match(s, /^\.butik2[ .:>]/, s);
  });

  it("sidan läser stilen och bär klassen runt hela innehållet", () => {
    assert.match(sida, /^import "\.\/butik\.css";$/m);
    assert.equal(sida.split('<div className="butik2">').length, 2);
  });

  it("inga nya färger: bara butikens tokens och brickans ton", () => {
    const farger = new Set(css.match(/#[0-9a-fA-F]{3,8}\b/g) ?? []);
    assert.deepEqual([...farger].sort(), ["#F4EEE8", "#fff"]);
  });
});

describe("hastigheten: bilder bara där de bär något", () => {
  // Mätt på produktionen 2026-11-12: 171 bilder och 294 kB srcset, nästan allt
  // tumnaglar på underkategorierna. Registret är text.
  it("registret har inga bilder", () => {
    const register = del('className="b2-register"', "</section>");
    assert.doesNotMatch(register, /<Image|<img/);
    assert.match(register, /href=\{`\/kategori\/\$\{s\.slug\}`\}/);
  });

  it("avdelningarna har en bild var, i rutans form och lägre kvalitet", () => {
    const avd = del('className="b2-avdrad"', "Den tolfte rutan");
    assert.equal((avd.match(/<Image/g) ?? []).length, 1, "en <Image> i slingan");
    assert.match(avd, /unsplashIForm\(categoryHero\(g\.main\.name\), "4:3"\)/);
    assert.match(avd, /sizes="\(max-width:1100px\) 30vw, 270px"/);
    assert.match(avd, /quality=\{60\}/);
    assert.match(css, /\.butik2 \.b2-avd-bild\{[^}]*aspect-ratio:4\/3/);
  });

  it("de fyra första avdelningsbilderna hämtas direkt men utan förtur, resten väntar", () => {
    // Mätt 2026-11-12: på 768–1 200 px är första radens bild större än rubriken,
    // på telefonen är rubriken och ingressen störst.
    const avd = del('className="b2-avdrad"', "Den tolfte rutan");
    assert.match(avd, /\{groups\.map\(\(g, i\) => \{/);
    assert.match(avd, /loading=\{i < 4 \? "eager" : undefined\}/);
    assert.doesNotMatch(sida, /preload|fetchPriority|\bpriority\b/);
  });
});

describe("innehållet", () => {
  it("avdelningarna står en gång, inte både i hjälten och i korten", () => {
    const hjalte = del('className="b2-hjalte"', "</section>");
    assert.doesNotMatch(hjalte, /groups\.map/);
  });

  it("talen räknas ur samma lista som sidan visar", () => {
    assert.match(sida, /const antalKategorier = groups\.reduce\(\(s, g\) => s \+ g\.subs\.length, 0\);/);
    assert.match(sida, /\{categoryCountLabel\(antalKategorier\)\}/);
    assert.match(sida, /<span className="b2-tal">\{tusental\(antalKategorier\)\}<\/span>/);
  });

  it("populärt är det som säljer, och etiketten lovar 'mest köpt' bara när varje vara har sålts", () => {
    assert.match(sida, /populartNu\(pool, 12\)/);
    assert.match(sida, /const allaSalda = populara\.length > 0 && populara\.every\(\(p\) => \(p\.popularity \?\? 0\) > 0\);/);
    assert.match(sida, /\{allaSalda \? "Mest köpt de senaste 90 dagarna" : "Urval ur sortimentet"\}/);
    assert.doesNotMatch(sida, /VECKANS_CURATION|imageScore > /);
  });

  it("frakten står med butikens tal, inte med egna", () => {
    const tryggt = del('className="b2-tryggt"', "</section>");
    assert.match(tryggt, /\{FREE_SHIPPING_OVER_KR\}/);
    assert.match(tryggt, /\{STANDARD_SHIPPING_KR\}/);
    assert.doesNotMatch(tryggt, /\b499\b|\b19 kr/);
  });

  it("öppet köp sägs som i returpolicyn: 14 dagars ångerrätt, sedan till dag 30", () => {
    assert.match(sida, /14 dagars ångerrätt, sedan öppet köp till dag 30\./);
  });

  it("strukturerad data och ankaren står kvar", () => {
    assert.match(sida, /"@type": "BreadcrumbList"/);
    assert.match(sida, /"@type": "CollectionPage",\s*name: "Butik – hela sortimentet"/);
    assert.match(sida, /hasPart: groups\.map/);
    // Gamla länkar till /butik#kategorier landar fortfarande rätt.
    assert.match(sida, /id="kategorier"/);
  });

  it("katalogen läses genom spärren, och sidan är en ISR-sida", () => {
    assert.match(sida, /\bgetHelaKatalogen\(\)/);
    assert.doesNotMatch(sida, /\bgetProducts\(\)/);
    assert.match(sida, /export const revalidate = 3600;/);
  });
});

describe("rader som rullar i sidled", () => {
  // .sr-only och liknande är position:absolute. Utan en positionerad förälder i
  // raden räknas de mot sidan, och då blev startsidan 1 663 px bred på mobilen.
  const rullar = regler.filter(([, d]) => /overflow-x:auto/.test(d)).flatMap(([s]) => s);
  const positionerade = new Set(regler.filter(([, d]) => /(^|;)position:relative(;|$)/.test(d)).flatMap(([s]) => s));

  it("är två, och var och en är positionerad", () => {
    assert.deepEqual([...rullar].sort(), [".butik2 .b2-genvagar", ".butik2 .b2-grupp-lista"]);
    for (const r of rullar) assert.ok(positionerade.has(r) || /position:relative/.test(regler.find(([s]) => s.includes(r))?.[1] ?? ""), `${r} saknar position:relative`);
  });

  it("genvägarnas rad sträcker sig över hela bredden, så att den rullar i stället för att bredda sidan", () => {
    assert.match(css, /\.butik2 \.b2-genvagar\{[^}]*align-self:stretch;margin-inline:-26px/);
  });
});
