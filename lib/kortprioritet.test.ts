// Listsidornas kortbilder: vilka som förladdas.
// Mätt på /kategori/mobler 2026-11-12: fyra förladdade kortbilder med hög
// prioritet, fast kort tre och fyra låg under vikningen på telefonen och alla
// fyra under vikningen på datorn. Proven läser källan.
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const las = (...delar: string[]) => readFileSync(join(import.meta.dirname, "..", ...delar), "utf8");

describe("kortens bilder på listsidorna", () => {
  it("två kort förladdas, resten väntar", () => {
    const sb = las("components", "shopbrowser.tsx");
    // `bildFonster`: kortets bilder finns bara nära fönstret (components/kort-bildfonster.tsx).
    assert.match(sb, /<ProductCard p=\{f\.p\} href=\{f\.href\} key=\{p\.slug\} priority=\{i < 2\} tvaKolumner bildDirekt=\{bilderDirekt\} bildFonster=\{bildNara\(i\)\} \/>/);
    assert.doesNotMatch(sb, /priority=\{i < [3-9]\}/);
  });

  it("inget kort hämtas eager på servern, för då förladdar Reacts server bilden ändå", () => {
    // React lägger en <link rel="preload"> i <head> för varje <img> som inte är
    // lazy (mätt 2026-11-12: kort tre och fyra med loading="eager" fick var sin).
    const g = las("components", "card-gallery.tsx");
    const huvud = g.slice(g.indexOf('className="pimg-main"'), g.indexOf("/>", g.indexOf('className="pimg-main"')));
    assert.match(huvud, /priority=\{priority\}/);
    assert.match(huvud, /fetchPriority=\{priority \? "high" : undefined\}/);
    // Lat tills listan säger annat. `direkt` är falskt på servern och i första
    // renderingen (se nästa prov), så HTML:en har aldrig en ivrig kortbild.
    assert.match(huvud, /loading=\{priority \? undefined : direkt \? "eager" : "lazy"\}/);
    assert.match(g, /direkt = false,\n\}: \{/);
    assert.doesNotMatch(las("components", "shopbrowser.tsx"), /\beager=/);
  });

  it("☠️ korten hämtar sina bilder direkt först när sidan är färdig, och bara i webbläsaren", () => {
    // Leonard 2026-11-20: "bläddrar man fort ser man vissa som saknas i några
    // 100 ms". Lata bilder börjar hämtas när kortet närmar sig fönstret, och
    // tummen är fortare än hämtningen.
    const sb = las("components", "shopbrowser.tsx");
    assert.match(sb, /const \[bilderDirekt, setBilderDirekt\] = useState\(false\);/);
    const effekt = sb.slice(sb.indexOf("const [bilderDirekt, setBilderDirekt]"), sb.indexOf("// Nästa omgång förladdas när knappen"));
    // Inte för den som sparar data eller sitter på 2G.
    assert.match(effekt, /if \(prefersDataSaving\(conn\)\) return;/);
    // När sidan är färdigladdad och har fått en stund, eller så snart kunden rullar.
    assert.match(effekt, /if \(document\.readyState === "complete"\) start\(\);\s+else window\.addEventListener\("load", start, \{ once: true \}\);/);
    assert.match(effekt, /const start = \(\) => \{ klocka = window\.setTimeout\(nu, BILDER_DIREKT_EFTER_MS\); \};/);
    // Rullningen räknas först efter 300 ms: Next rullar sidan till toppen vid ett sidbyte.
    assert.match(effekt, /const lyssna = window\.setTimeout\(\(\) => window\.addEventListener\("scroll", nu, \{ once: true, passive: true \}\), 300\);/);
    // Tillståndet sätts bara i en effekt: servern och hydreringen ritar lata bilder.
    assert.equal(sb.split("setBilderDirekt(true)").length - 1, 1);
    assert.match(las("components", "productcard.tsx"), /tvaKolumner=\{tvaKolumner\} direkt=\{bildDirekt\} \/>/);
  });

  it("☠️ nästa omgångs bilder förladdas när knappen Visa fler närmar sig", () => {
    const sb = las("components", "shopbrowser.tsx");
    assert.match(sb, /const NARA_FLER_PX = 2400;/);
    assert.match(sb, /new IntersectionObserver\(\(\[e\]\) => setNarFler\(e\.isIntersecting\), \{ rootMargin: `\$\{NARA_FLER_PX\}px 0px` \}\)/);
    assert.match(sb, /<div className="loadmore-wrap" ref=\{flerRef\}>/);
    const effekt = sb.slice(sb.indexOf("if (!narFler || !bilderDirekt) return;"), sb.indexOf("// Söksidans kalla väg: kortens andra bild"));
    assert.match(effekt, /const nasta = list\.slice\(shown, shown \+ PAGE_SIZE\);/);
    // Samma adress som kortet sedan frågar efter: två kolumner, färgfiltrets bild.
    assert.match(effekt, /const bild = iFarg\(medBild\(p\)\)\.p\.img;\s+if \(bild\) forladdaKortbild\(bild, true\);/);
    // Saknas listan eller fotona hämtas de nu, inte först vid trycket.
    assert.match(effekt, /if \(\(lista && !alla\) \|\| nasta\.some\(saknarBild\)\) hamta\(\);/);
    // Utan IntersectionObserver (Safari före 12.2) är allt som förut.
    assert.match(sb, /if \(!visarFler \|\| !el \|\| typeof IntersectionObserver !== "function"\) return;/);
  });
});
