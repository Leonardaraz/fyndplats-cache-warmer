// Signalerna som avgör om produktsidan ska rullas till bilderna och om en
// listsida ska återställa sina kort (lib/sidminne.ts).

import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { glomListlage, klickadeHit, komMedHistoriken, laddadesOm, lasListlage, sparaListlage, LANDA_SKRIPT, LISTLAGE_MAX_MS, SIGNAL_MS, type Fonster } from "./sidminne.ts";

const T = 1_800_000_000_000;

test("ett färskt tryck mot sökvägen flyttar produktsidan, inget annat gör det", () => {
  const w: Fonster = { __fpKlick: { p: "/produkt/stol", t: T } };
  assert.equal(klickadeHit(w, "/produkt/stol", T + 400), true);
  assert.equal(klickadeHit(w, "/produkt/bord", T + 400), false, "annan sökväg");
  assert.equal(klickadeHit(w, "/produkt/stol", T + SIGNAL_MS + 1), false, "för gammalt");
  assert.equal(klickadeHit({}, "/produkt/stol", T), false, "hel sidladdning, inget tryck");
  assert.equal(klickadeHit({ ...w, __fpTrav: T + 100 }, "/produkt/stol", T + 400), false, "bakåt efter trycket");
});

test("bakåt känns igen mjukt och hårt, men inte efter ett nytt tryck", () => {
  assert.equal(komMedHistoriken({ __fpTrav: T }, T + 300, "navigate"), true, "popstate nyss");
  assert.equal(komMedHistoriken({ __fpTrav: T - SIGNAL_MS - 1 }, T, "navigate"), false, "gammal popstate");
  assert.equal(komMedHistoriken({ __fpTrav: T, __fpKlick: { p: "/k", t: T + 50 } }, T + 300, "navigate"), false, "tryck efter bakåt");
  assert.equal(komMedHistoriken({}, T, "back_forward"), true, "hel sidladdning via bakåt");
  assert.equal(komMedHistoriken({ __fpKlick: { p: "/k", t: T } }, T + 300, "back_forward"), false, "dokumentet har navigerat sedan");
  assert.equal(komMedHistoriken({}, T, "navigate"), false);
  assert.equal(komMedHistoriken({}, T, "reload"), false);
});

test("☠️ en sökning strax efter bakåt är inte bakåt: en ny post i historiken eller en annan adress", () => {
  // Mätt på www 2026-11-20 (audit/sok-hopp.cjs): bakåt från en produkt, och
  // 1,5 s senare en sökning från sökrutan (Enter, alltså inget tryck på en
  // länk). Resultatsidan hade ett sparat läge sedan tidigare, trodde att
  // kunden kommit med bakåt och ställde sidan 9 564 px ner med 72 kort.
  const efterBakat: Fonster = { __fpKlick: { p: "/produkt/stol", t: T - 4000 }, __fpTrav: T, __fpTravTill: "/sok?q=cykel" };
  // Bakåt till resultatsidan: läget återställs, som förut.
  assert.equal(komMedHistoriken(efterBakat, T + 300, "navigate", "/sok?q=cykel"), true);
  // Sökrutan byter sida: history.pushState efter steget.
  assert.equal(komMedHistoriken({ ...efterBakat, __fpNy: T + 1500 }, T + 1600, "navigate", "/sok?q=bilar"), false, "ny post efter bakåt");
  assert.equal(komMedHistoriken({ ...efterBakat, __fpNy: T + 1500 }, T + 1600, "navigate", "/sok?q=cykel"), false, "ny post, samma adress");
  // Var för sig: också utan signalen om en ny post stoppar adressen felet.
  assert.equal(komMedHistoriken(efterBakat, T + 1600, "navigate", "/sok?q=bilar"), false, "steget landade på en annan adress");
  // En post som lades FÖRE steget (trycket som ledde till produkten) hindrar inget.
  assert.equal(komMedHistoriken({ ...efterBakat, __fpNy: T - 3900 }, T + 300, "navigate", "/sok?q=cykel"), true);
  // Äldre skript utan adressen, eller en anropare utan adress: som förut.
  assert.equal(komMedHistoriken({ __fpTrav: T }, T + 300, "navigate", "/sok?q=cykel"), true);
  assert.equal(komMedHistoriken(efterBakat, T + 300, "navigate"), true);
});

test("☠️ ett dokument som laddats med bakåt och sedan bytt sida kom inte med historiken", () => {
  // Typen back_forward står kvar så länge dokumentet lever. En sökning från
  // sökrutan i ett sådant dokument sätter inget tryck, bara en ny post.
  assert.equal(komMedHistoriken({}, T, "back_forward", "/kategori/mobler"), true);
  assert.equal(komMedHistoriken({ __fpNy: T - 60_000 }, T, "back_forward", "/sok?q=bilar"), false);
  // Och bara till adressen dokumentet laddades på.
  assert.equal(komMedHistoriken({ __fpStart: "/kategori/mobler" }, T, "back_forward", "/kategori/mobler"), true);
  assert.equal(komMedHistoriken({ __fpStart: "/kassa" }, T, "back_forward", "/kategori/mobler"), false, "sidan byttes utan ny post");
});

test("en omladdad sida ställer tillbaka listan, men inte efter att sidan bytts", () => {
  // En flik som legat i bakgrunden på telefonen laddas om av sig själv.
  assert.equal(laddadesOm({ __fpStart: "/kategori/mobler" }, "reload", "/kategori/mobler"), true);
  assert.equal(laddadesOm({}, "reload", "/kategori/mobler"), true, "äldre skript utan startadress");
  assert.equal(laddadesOm({ __fpStart: "/kategori/mobler" }, "navigate", "/kategori/mobler"), false, "en vanlig ankomst");
  assert.equal(laddadesOm({ __fpStart: "/kategori/mobler" }, "back_forward", "/kategori/mobler"), false, "bakåt har sin egen regel");
  assert.equal(laddadesOm({ __fpStart: "/kategori/mobler" }, "reload", "/sok?q=bilar"), false, "en annan sida än den som laddades om");
  assert.equal(laddadesOm({ __fpStart: "/sok?q=bilar", __fpNy: T }, "reload", "/sok?q=bilar"), false, "sidan har bytts sedan dess");
  assert.equal(laddadesOm({ __fpStart: "/sok?q=bilar", __fpKlick: { p: "/k", t: T } }, "reload", "/sok?q=bilar"), false);
  assert.equal(laddadesOm({ __fpStart: "/sok?q=bilar", __fpTrav: T }, "reload", "/sok?q=bilar"), false);
  // Bakåt-regeln själv säger fortfarande nej till en omladdning.
  assert.equal(komMedHistoriken({}, T, "reload", "/kategori/mobler"), false);
});

function lagring() {
  const m = new Map<string, string>();
  return { getItem: (k: string) => m.get(k) ?? null, setItem: (k: string, v: string) => void m.set(k, v), removeItem: (k: string) => void m.delete(k), m };
}

test("☠️ ett nytt besök på listan glömmer läget från förra besöket", () => {
  // Djupt nere i listan för en kvart sedan, hit igen med en länk, bort utan att
  // rulla, och bakåt: då ska sidan stå överst, inte där den stod förra gången.
  const s = lagring();
  sparaListlage(s, "/kategori/mobler", { shown: 72, href: "", top: 0, y: 9000, t: T });
  sparaListlage(s, "/sok?q=cykel", { shown: 48, href: "", top: 0, y: 5200, t: T });
  glomListlage(s, "/kategori/mobler");
  assert.equal(lasListlage(s, "/kategori/mobler", T + 1000), null);
  assert.ok(lasListlage(s, "/sok?q=cykel", T + 1000), "andra listors lägen står kvar");
  assert.doesNotThrow(() => glomListlage({ removeItem: () => { throw new Error("SecurityError"); } }, "/a"));
  // Listan glömmer bara när kunden INTE kom med bakåt eller en omladdning.
  const sb = readFileSync(new URL("../components/shopbrowser.tsx", import.meta.url), "utf8");
  assert.match(sb, /if \(!komMedHistoriken\(w, Date\.now\(\), nav\?\.type, adress\) && !laddadesOm\(w, nav\?\.type, adress\)\) \{\s+glomListlage\(window\.sessionStorage, adress\);\s+return;\s+\}\s+l = lasListlage\(window\.sessionStorage, adress, Date\.now\(\)\);/);
  assert.equal(sb.split("glomListlage(").length - 1, 1);
});

test("listläget sparas per adress och läses tillbaka", () => {
  const s = lagring();
  sparaListlage(s, "/kategori/mobler?farg=svart", { shown: 72, href: "/produkt/stol", top: 166, t: T });
  assert.deepEqual(lasListlage(s, "/kategori/mobler?farg=svart", T + 5000), { shown: 72, href: "/produkt/stol", top: 166, t: T });
  assert.equal(lasListlage(s, "/kategori/mobler", T + 5000), null, "andra filter är en annan lista");
  assert.equal(lasListlage(s, "/kategori/mobler?farg=svart", T + LISTLAGE_MAX_MS + 1), null, "för gammalt");
});

test("☠️ läget bär också var sidan stod, för den som lämnar listan utan att trycka på ett kort", () => {
  const s = lagring();
  // Sparat av rullningen: inget kort, bara platsen.
  sparaListlage(s, "/sok?q=cykel", { shown: 48, href: "", top: 0, y: 5200, t: T });
  assert.deepEqual(lasListlage(s, "/sok?q=cykel", T + 3000), { shown: 48, href: "", top: 0, y: 5200, t: T });
  // Sparat av trycket: kortet och platsen.
  sparaListlage(s, "/kategori/mobler", { shown: 72, href: "/produkt/stol", top: 166, y: 9462, t: T });
  assert.equal(lasListlage(s, "/kategori/mobler", T + 3000)?.y, 9462);
  // Ett äldre läge utan y läses som förut.
  s.m.set("fp-listlage:/gammalt", JSON.stringify({ shown: 24, href: "/produkt/a", top: 10, t: T }));
  assert.equal(lasListlage(s, "/gammalt", T + 1)?.y, undefined);
  // Ett y som inte är ett tal är ett trasigt läge.
  s.m.set("fp-listlage:/trasigt", JSON.stringify({ shown: 24, href: "", top: 0, y: "5200", t: T }));
  assert.equal(lasListlage(s, "/trasigt", T + 1), null);
  s.m.set("fp-listlage:/negativt", JSON.stringify({ shown: 24, href: "", top: 0, y: -40, t: T }));
  assert.equal(lasListlage(s, "/negativt", T + 1), null);
});

test("☠️ listan sparar sitt läge vid varje rullning och när den lämnas, och bakåt tar kortet eller platsen", () => {
  // Mätt på www 2026-11-20 (audit/bakat-annan-vag.cjs): kategorin med 72 kort,
  // loggan, bakåt gav 24 kort och "kvar till botten 0". Samma sak via en vara
  // i sökläget och via en vanlig länk.
  const sb = readFileSync(new URL("../components/shopbrowser.tsx", import.meta.url), "utf8");
  // Rullningen noteras med listans egen adress, och skrivs när sidan stannat.
  assert.match(sb, /const rullat = \(\) => \{\s+platsRef\.current = \{ adress: location\.pathname \+ location\.search, y: Math\.max\(0, Math\.round\(window\.scrollY\)\), href: "", top: 0 \};\s+if \(klocka !== undefined\) window\.clearTimeout\(klocka\);\s+klocka = window\.setTimeout\(stannat, 250\);/);
  assert.match(sb, /sparaListlage\(window\.sessionStorage, plats\.adress, \{ shown: shownRef\.current, href: plats\.href, top: plats\.top, y: plats\.y, t: Date\.now\(\) \}\);/);
  // När sidan stannat mäts kortet överst i fönstret som ankare, men bara om
  // sidan står kvar där platsen noterades.
  assert.match(sb, /if \(plats && Math\.abs\(window\.scrollY - plats\.y\) <= 1\) \{\s+for \(const a of document\.querySelectorAll<HTMLElement>\("\.prodgrid\.shoplista a\.prod"\)\) \{\s+const topp = a\.getBoundingClientRect\(\)\.top;\s+if \(topp < 0\) continue;\s+if \(topp < window\.innerHeight\) \{ plats\.href = a\.getAttribute\("href"\) \?\? ""; plats\.top = Math\.round\(topp\); \}\s+break;/);
  // När listan lämnas och när sidan göms.
  assert.match(sb, /window\.addEventListener\("pagehide", spara\);\s+return \(\) => \{\s+window\.removeEventListener\("scroll", rullat\);\s+window\.removeEventListener\("pagehide", spara\);\s+if \(klocka !== undefined\) window\.clearTimeout\(klocka\);\s+spara\(\);\s+\};\s+\}, \[\]\);/);
  // ☠️ useLayoutEffect: en passiv effekt städas efter att Next rullat den nya
  // sidan till toppen, och hade sparat y = 0 under den nya sidans adress.
  const fore = sb.slice(0, sb.indexOf("let klocka: number | undefined;\n    const spara = () => {"));
  assert.ok(fore.trimEnd().endsWith("useLayoutEffect(() => {"), "lyssnaren ska sitta i en useLayoutEffect");
  // Ett läge som väntar på att ställas tillbaka skrivs inte över.
  assert.match(sb, /if \(!plats \|\| aterstall\.current\) return;/);
  // Adressen följer filtren också när kunden inte rullar mer.
  assert.match(sb, /window\.history\.replaceState\(null, "", url\);\s+\/\/[^\n]*\n\s+if \(platsRef\.current\) platsRef\.current\.adress = url;/);
  // Trycket på ett kort sparar kortet och platsen, och är det färskaste tills nästa rullning.
  assert.match(sb, /top: Math\.round\(a\.getBoundingClientRect\(\)\.top\), y: Math\.round\(window\.scrollY\), t: Date\.now\(\),\s+\}\);\s+\/\/[^\n]*\n\s+platsRef\.current = null;/);
  // Bakåt: kortet om det finns, annars platsen.
  assert.match(sb, /const a = l\.href \? document\.querySelector<HTMLElement>\(`\.prodgrid a\.prod\[href="\$\{CSS\.escape\(l\.href\)\}"\]`\) : null;\s+if \(a\) rullaDirekt\(scrollY \+ a\.getBoundingClientRect\(\)\.top - l\.top\);\s+else if \(typeof l\.y === "number"\) rullaDirekt\(l\.y\);/);
});

test("trasigt eller otillgängligt lager ger inget läge och inget fel", () => {
  const s = lagring();
  s.m.set("fp-listlage:/a", "{inte json");
  assert.equal(lasListlage(s, "/a", T), null);
  s.m.set("fp-listlage:/b", JSON.stringify({ shown: "72", href: "/p", top: 1, t: T }));
  assert.equal(lasListlage(s, "/b", T), null);
  const kastar = { getItem: () => { throw new Error("SecurityError"); }, setItem: () => { throw new Error("QuotaExceeded"); } };
  assert.equal(lasListlage(kastar, "/a", T), null);
  assert.doesNotThrow(() => sparaListlage(kastar, "/a", { shown: 24, href: "/p", top: 0, t: T }));
});

test("sidhuvudets skript sätter båda signalerna", () => {
  const src = readFileSync(new URL("../app/layout.tsx", import.meta.url), "utf8");
  assert.match(src, /window\.__fpKlick=\{p:u\.pathname,t:Date\.now\(\)\}/);
  assert.match(src, /addEventListener\('popstate',function\(\)\{window\.__fpTrav=Date\.now\(\)/);
});

test("sidhuvudets skript noterar adressen steget landade på och varje ny post i historiken", () => {
  const src = readFileSync(new URL("../app/layout.tsx", import.meta.url), "utf8");
  assert.match(src, /window\.__fpTrav=Date\.now\(\);window\.__fpTravTill=location\.pathname\+location\.search;lugn\(\);av\(\)\}\);/);
  assert.match(src, /try\{var ps=history\.pushState;history\.pushState=function\(\)\{window\.__fpNy=Date\.now\(\);return ps\.apply\(this,arguments\)\}\}catch\(f\)\{\}/);
  assert.match(src, /"window\.__fpStart=location\.pathname\+location\.search\}\)\(\)";/);
  // Listan frågar med sin adress.
  const lista = readFileSync(new URL("../components/shopbrowser.tsx", import.meta.url), "utf8");
  assert.match(lista, /const adress = location\.pathname \+ location\.search;\s+const w = window as unknown as Fonster;\s+(?:\/\/[^\n]*\n\s+)+if \(!komMedHistoriken\(w, Date\.now\(\), nav\?\.type, adress\) && !laddadesOm\(w, nav\?\.type, adress\)\) \{/);
});

test("☠️ bakåt och omladdning ställer platsen direkt: glidet är avstängt medan den ställs tillbaka", () => {
  // Mätt i Chromium 2026-11-20 (audit/loggan-spar.cjs): efter loggan och bakåt
  // gled webbläsaren från sidans topp mot platsen den mindes (y 38, 63, 134 …),
  // listan hoppade till 8 600 mitt i glidet, och sidan stannade på 8 649–8 709.
  const src = readFileSync(new URL("../app/layout.tsx", import.meta.url), "utf8");
  const lugn = /"(function lugn\(\)\{[^"]+\})" \+/.exec(src)?.[1];
  const start = /"(try\{var nv=performance\.getEntriesByType\('navigation'\)\[0\];[^"]+\}catch\(f\)\{\})" \+/.exec(src)?.[1];
  assert.ok(lugn && start, "delarna hittades inte");
  const kor = (typ: string) => {
    const stil = { scrollBehavior: "" };
    const klockor: { f: () => void; ms: number }[] = [];
    const lyssnare: Record<string, () => void> = {};
    const setTimeout = (f: () => void, ms: number) => { klockor.push({ f, ms }); return klockor.length; };
    const clearTimeout = (id: number) => { if (id) klockor[id - 1] = { f: () => undefined, ms: -1 }; };
    new Function("document", "performance", "addEventListener", "setTimeout", "clearTimeout", `var lt;${lugn}${start}`)(
      { documentElement: { style: stil } }, { getEntriesByType: () => [{ type: typ }] },
      (namn: string, f: () => void) => { lyssnare[namn] = f; }, setTimeout, clearTimeout);
    return { stil, klockor, lyssnare };
  };
  for (const typ of ["back_forward", "reload"]) {
    const r = kor(typ);
    assert.equal(r.stil.scrollBehavior, "auto", `${typ}: glidet av medan sidan läses`);
    assert.equal(typeof r.lyssnare.load, "function", `${typ}: och en stund till efter load`);
    r.lyssnare.load();
    const sista = r.klockor.filter((k) => k.ms === 1200).at(-1);
    assert.ok(sista, "glidet slås på igen efter 1,2 s");
    sista.f();
    assert.equal(r.stil.scrollBehavior, "", "tillbaka till stilmallens regel");
  }
  const vanlig = kor("navigate");
  assert.equal(vanlig.stil.scrollBehavior, "", "en vanlig ankomst rörs inte");
  assert.equal(vanlig.lyssnare.load, undefined);
});

test("skriptet i sidhuvudet: pushState går fram som förut och lämnar en tidsstämpel", () => {
  const src = readFileSync(new URL("../app/layout.tsx", import.meta.url), "utf8");
  const bit = /"(try\{var ps=history\.pushState;[^"]+?\}catch\(f\)\{\})" \+/.exec(src)?.[1];
  assert.ok(bit, "pushState-delen hittades inte");
  const anrop: unknown[][] = [];
  const history = { pushState(...a: unknown[]) { anrop.push([this === history, ...a]); return "svar"; } };
  const window: Record<string, unknown> = {};
  new Function("history", "window", "Date", bit)(history, window, { now: () => T + 7 });
  assert.equal(history.pushState({ a: 1 }, "", "/sok?q=bilar"), "svar");
  assert.deepEqual(anrop, [[true, { a: 1 }, "", "/sok?q=bilar"]], "samma this och samma argument");
  assert.equal(window.__fpNy, T + 7);
});

function korLanda(o: { lagrat: unknown; sokvag: string; typ: string; smal?: boolean; hash?: string; nu?: number }) {
  const m = new Map<string, string>();
  if (o.lagrat !== undefined) m.set("fp-klick", JSON.stringify(o.lagrat));
  const rullat: number[] = [];
  let y = 0;
  const galleri = { getBoundingClientRect: () => ({ top: 435 - y }) };
  const huvud = { getBoundingClientRect: () => ({ bottom: y > 46 ? 133 : 179 - y }) };
  const sessionStorage = { getItem: (k: string) => m.get(k) ?? null, removeItem: (k: string) => void m.delete(k) };
  const doc = { documentElement: { style: { scrollBehavior: "" } }, querySelector: (s: string) => (s === "header" ? huvud : galleri) };
  // scrollY följer rullningen: byt den mot en funktion.
  const run = new Function("sessionStorage", "performance", "location", "matchMedia", "document", "scrollTo", "Date", "__Y",
    LANDA_SKRIPT.replace(/scrollY/g, "__Y()"));
  run(sessionStorage, { getEntriesByType: () => [{ type: o.typ }] }, { pathname: o.sokvag, hash: o.hash ?? "" },
    () => ({ matches: o.smal !== false }), doc, (_x: number, v: number) => { y = v; rullat.push(v); },
    { now: () => o.nu ?? T + 500 }, () => y);
  return { rullat, kvar: m.has("fp-klick") };
}

test("hel sidladdning efter ett tryck: sidan rullas till bilderna, signalen förbrukas", () => {
  const r = korLanda({ lagrat: { p: "/produkt/stol", t: T }, sokvag: "/produkt/stol", typ: "navigate" });
  assert.equal(r.rullat.at(-1), 435 - 133 - 12, "bilderna 12 px under sidhuvudet");
  assert.equal(r.kvar, false);
});

test("hel sidladdning utan tryck, vid omladdning, bakåt, annan sida eller på dator: ingen rullning", () => {
  for (const o of [
    { lagrat: undefined, sokvag: "/produkt/stol", typ: "navigate" },
    { lagrat: { p: "/produkt/stol", t: T }, sokvag: "/produkt/stol", typ: "reload" },
    { lagrat: { p: "/produkt/stol", t: T }, sokvag: "/produkt/stol", typ: "back_forward" },
    { lagrat: { p: "/produkt/bord", t: T }, sokvag: "/produkt/stol", typ: "navigate" },
    { lagrat: { p: "/produkt/stol", t: T }, sokvag: "/produkt/stol", typ: "navigate", smal: false },
    { lagrat: { p: "/produkt/stol", t: T }, sokvag: "/produkt/stol", typ: "navigate", hash: "#recensioner" },
    { lagrat: { p: "/produkt/stol", t: T }, sokvag: "/produkt/stol", typ: "navigate", nu: T + SIGNAL_MS + 1 },
  ]) assert.deepEqual(korLanda(o).rullat, [], JSON.stringify(o));
});
