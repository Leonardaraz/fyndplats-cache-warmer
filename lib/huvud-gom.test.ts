// lib/huvud-gom.test.ts — räkningen för sidhuvudet som följer fingret
// (lib/huvud-gom.ts), och att komponenten, omslaget och stilen håller ihop med den.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { ALLTID_OVAN_PX, GOM_MINST_PX, UR_BILD_PX, VISA_MINST_PX, glidMs, sparAvbrutet, sparFran, sparRast, sparStart, sparSteg, sparVila, synligt, type SparLage } from "./huvud-gom.ts";

const UR = UR_BILD_PX;

const H = 133;
const TOPP = 46;
const HOJD = 800;
const SIDA = 6000;
const m = (y: number, over: Partial<{ h: number; topp: number; sidhojd: number }> = {}) => ({ y, hojd: HOJD, sidhojd: SIDA, h: H, topp: TOPP, ...over });

/** Kör en följd av lägen. Ger hur mycket av sidhuvudet som syns efter vart och ett, och hur ofta omslagets höjd skrevs. */
function kor(lagen: number[], fran: SparLage = sparStart(m(lagen[0]))): { syns: number[]; skrivningar: number; slut: SparLage } {
  let l = fran;
  let skrivningar = 0;
  const syns: number[] = [];
  for (const y of lagen) {
    const n = sparSteg(l, m(y));
    if (n.hb !== l.hb) skrivningar++;
    l = n;
    syns.push(synligt(l.hb, m(y)));
  }
  return { syns, skrivningar, slut: l };
}

/** Ett jämnt svep från ett läge till ett annat, i steg om `steg` px. */
function svep(fran: number, till: number, steg = 10): number[] {
  const ut: number[] = [];
  const d = till > fran ? steg : -steg;
  for (let y = fran + d; d > 0 ? y < till : y > till; y += d) ut.push(y);
  ut.push(till);
  return ut;
}

test("sidhuvudet står helt framme från början, också mitt i en sida (bakåtknappen)", () => {
  assert.equal(synligt(sparStart(m(0)).hb, m(0)), H);
  assert.equal(synligt(sparStart(m(2400)).hb, m(2400)), H);
});

test("nära sidans topp står sidhuvudet alltid helt framme", () => {
  // Produktsidan landar 88 px ner, med bilden under sidhuvudet: där ska det stå helt.
  const { syns, skrivningar } = kor(svep(0, ALLTID_OVAN_PX, 4));
  assert.ok(syns.every((s) => s === H), `syns: ${syns.join(",")}`);
  assert.equal(skrivningar, 0, "ingenting skrivs medan sidan rör sig i zonen");
  assert.equal(kor([0, 88]).syns.at(-1), H);
});

test("☠️ ner: sidhuvudet följer med sidan pixel för pixel, utan att något skrivs på vägen", () => {
  const l = kor(svep(0, ALLTID_OVAN_PX + 40, 4));
  // 40 px förbi zonen: 40 px av sidhuvudet har följt med upp ur bild.
  assert.equal(l.syns.at(-1), H - 40);
  assert.equal(l.skrivningar, 0);
  // Helt borta när hela höjden passerat, och det förblir borta längre ner.
  const borta = kor(svep(0, ALLTID_OVAN_PX + H + 300, 7));
  assert.equal(borta.syns.at(-1), 0);
  assert.equal(borta.skrivningar, 0, "rörelsen ner från sidans topp är webbläsarens egen");
  // Varje steg tar exakt så mycket som sidan rörde sig.
  const steg = kor([ALLTID_OVAN_PX, ALLTID_OVAN_PX + 3, ALLTID_OVAN_PX + 10, ALLTID_OVAN_PX + 11]);
  assert.deepEqual(steg.syns, [H, H - 3, H - 10, H - 11]);
});

test("☠️ upp: så fort sidan vänder följer sidhuvudet med in, pixel för pixel, och sedan står det kvar", () => {
  const nere = kor(svep(0, 1200)).slut;
  assert.equal(synligt(nere.hb, m(1200)), 0);
  const upp = kor([1197, 1190, 1150, 1100, 1067, 1000, 600], nere);
  // Vändningen själv visar inget (inget hopp). Sidhuvudet ligger då strax ovanför kanten, och
  // sedan kommer det in lika mycket som sidan rör sig.
  assert.deepEqual(upp.syns, [0, 7 - UR, 47 - UR, 97 - UR, 130 - UR, H, H]);
  assert.equal(upp.skrivningar, 1, "en skrivning när rörelsen vänder, sedan ingen");
});

test("ner igen mitt i sidan: sidhuvudet lämnar därifrån det står", () => {
  const nere = kor(svep(0, 1200)).slut;
  const framme = kor(svep(1200, 900), nere).slut;
  assert.equal(synligt(framme.hb, m(900)), H);
  const ner = kor([903, 910, 950, 1033, 1034, 1400], framme);
  assert.deepEqual(ner.syns, [H, H - 7, H - 47, 3, 2, 0]);
  assert.equal(ner.skrivningar, 1);
});

test("vänder rörelsen med sidhuvudet till hälften framme skrivs ingenting: det sitter redan fast i sidan", () => {
  const nere = kor(svep(0, 1200)).slut;
  const halv = kor([1195, 1140], nere);
  assert.equal(halv.syns.at(-1), 55 - UR);
  const darr = kor([1150, 1145, 1160, 1120], halv.slut);
  assert.deepEqual(darr.syns, [45 - UR, 50 - UR, 35 - UR, 75 - UR]);
  assert.equal(darr.skrivningar, 0);
});

test("☠️ studsen i sidans botten på iOS räknas inte som att kunden scrollade upp", () => {
  const langst = SIDA - HOJD;
  const nere = kor(svep(0, langst)).slut;
  const studs = kor([langst + 40, langst + 90, langst + 60, langst + 20, langst], nere);
  assert.ok(studs.syns.every((s) => s === 0), "sidhuvudet kom fram av studsen");
  assert.equal(studs.skrivningar, 0);
  assert.equal(studs.slut.y, langst);
});

test("☠️ sidan dras förbi toppen på iOS: läget blir aldrig negativt, och en kort sida gömmer inget", () => {
  const l = kor([-30, -80, -20, 0]);
  assert.ok(l.syns.every((s) => s === H));
  assert.equal(sparSteg(sparStart(m(0)), m(-80)).y, 0);
  assert.equal(sparStart(m(-40)).y, 0);
  // En sida som är kortare än fönstret kan inte scrollas.
  const kort = { hojd: HOJD, sidhojd: 500, h: H, topp: TOPP };
  let k = sparStart({ y: 0, ...kort });
  for (const y of [50, 200, 400]) {
    k = sparSteg(k, { y, ...kort });
    assert.equal(synligt(k.hb, { y, ...kort }), H);
  }
});

test("ett hopp i sidan räknas som en rörelse åt samma håll: aldrig ett sidhuvud som dyker upp av sig självt", () => {
  const nere = kor(svep(0, 2400)).slut;
  // Rakt till toppen: sidhuvudet står på sin plats i sidan.
  assert.equal(synligt(sparSteg(nere, m(0)).hb, m(0)), H);
  // Ett hopp uppåt till mitt i sidan: sidhuvudet ligger precis ovanför kanten och följer fingret in.
  const mitt = sparSteg(nere, m(1000));
  assert.equal(synligt(mitt.hb, m(1000)), 0);
  assert.equal(synligt(sparSteg(mitt, m(960)).hb, m(960)), 40 - UR);
  // Ett hopp neråt: sidhuvudet står kvar där det stod i sidan, alltså ur bild.
  const hopp = sparSteg(sparStart(m(0)), m(1800));
  assert.equal(synligt(hopp.hb, m(1800)), 0);
  // Landningen efter ett sidbyte eller bakåtknappen går inte den här vägen: komponenten börjar om med sparStart.
  assert.equal(synligt(sparStart(m(1800)).hb, m(1800)), H);
});

test("stilla sida ger samma läge tillbaka, och sidhuvudets höjd ryms alltid i omslaget", () => {
  const nere = kor(svep(0, 1200)).slut;
  assert.equal(sparSteg(nere, m(1200)), nere);
  // Sidhuvudet blir högre (typsnittet laddas): omslaget rymmer det.
  const hogre = sparSteg(sparStart(m(0)), m(0, { h: 180 }));
  assert.ok(hogre.hb >= 180);
  assert.equal(synligt(hogre.hb, m(0, { h: 180 })), 180);
});

test("rörelsen stannar på väg upp: sidhuvudet glider fram helt, men inte för en darrning", () => {
  const nere = kor(svep(0, 1200)).slut;
  // Vändningen märks i det första steget uppåt (1195): därifrån följer sidhuvudet med in.
  const kant = 1195 - UR;
  const lite = kor([1195, kant - (VISA_MINST_PX - 1)], nere).slut;
  const darr = sparVila(lite, m(lite.y));
  // Tillbaka ur bild, och lite till: nederkantens linje ska inte ligga kvar som en rand i skärmens kant.
  assert.deepEqual(darr && { visa: darr.visa, flytt: darr.flytt }, { visa: false, flytt: -(VISA_MINST_PX - 1 + UR) });
  const nog = kor([1195, kant - VISA_MINST_PX], nere).slut;
  const v = sparVila(nog, m(nog.y));
  assert.deepEqual(v && { visa: v.visa, flytt: v.flytt }, { visa: true, flytt: H - VISA_MINST_PX });
  // När glidet är klart står sidhuvudet helt framme, respektive är helt borta, utan hopp.
  assert.equal(synligt(v!.hb, m(nog.y)), H);
  assert.equal(synligt(darr!.hb, m(lite.y)), 0);
});

test("rörelsen stannar på väg ner: sidhuvudet glider undan helt, men inte för ett ryck med tummen", () => {
  const framme = kor(svep(1200, 900), kor(svep(0, 1200)).slut).slut;
  // Vändningen märks i det första steget neråt (905): därifrån följer sidhuvudet med ut.
  const ryck = kor([905, 905 + GOM_MINST_PX - 1], framme).slut;
  const r = sparVila(ryck, m(ryck.y));
  assert.deepEqual(r && { visa: r.visa, flytt: r.flytt }, { visa: true, flytt: GOM_MINST_PX - 1 });
  const svepNer = kor([905, 905 + GOM_MINST_PX], framme).slut;
  const g = sparVila(svepNer, m(svepNer.y));
  assert.deepEqual(g && { visa: g.visa, flytt: g.flytt }, { visa: false, flytt: -(H - GOM_MINST_PX + UR) });
  assert.equal(synligt(g!.hb, m(svepNer.y)), 0);
  assert.equal(synligt(r!.hb, m(ryck.y)), H);
});

test("helt framme eller helt borta: ingenting att glida till. Närmast sidans topp glider det alltid fram", () => {
  assert.equal(sparVila(sparStart(m(600)), m(600)), null);
  const nere = kor(svep(0, 1200)).slut;
  assert.equal(sparVila(nere, m(1200)), null);
  // 60 px förbi zonen på väg ner från sidans topp: där står sidhuvudet i sidan och kan inte gömmas.
  const overst = kor(svep(0, ALLTID_OVAN_PX + 60, 5)).slut;
  const v = sparVila(overst, m(overst.y));
  assert.equal(v?.visa, true);
  assert.equal(synligt(v!.hb, m(overst.y)), H);
});

test("☠️ efter en vila tar nästa rörelse sidhuvudet med sig från första pixeln, utan en enda skrivning", () => {
  // På iPhone får sidans kod veta om rörelsen en eller ett par bildrutor för sent. En skrivning i
  // vändningen kommer alltså för sent med just de bildrutorna. Efter en vila behövs ingen.
  // Borta, långt ner i sidan: fästet läggs strax ovanför skärmens kant, och inget syns av det.
  const nere = kor(svep(0, 1200)).slut;
  const vilat = { ...nere, hb: sparRast(nere, m(1200)) };
  assert.equal(TOPP + vilat.hb, 1200 - UR);
  assert.equal(synligt(vilat.hb, m(1200)), 0);
  const upp = kor([1199, 1195, 1160], vilat);
  assert.deepEqual(upp.syns, [0, 5 - UR, 40 - UR]);
  assert.equal(upp.skrivningar, 0);
  // Framme efter ett långt svep upp: fästet läggs vid sidhuvudets nederkant, och inget syns av det.
  const framme = kor(svep(1200, 700), nere).slut;
  assert.equal(synligt(framme.hb, m(700)), H);
  const vilatFramme = { ...framme, hb: sparRast(framme, m(700)) };
  assert.equal(TOPP + vilatFramme.hb, 700 + H);
  assert.equal(synligt(vilatFramme.hb, m(700)), H);
  const ner = kor([701, 705, 740], vilatFramme);
  assert.deepEqual(ner.syns, [H - 1, H - 5, H - 40]);
  assert.equal(ner.skrivningar, 0);
  // Och uppåt därifrån står det kvar framme.
  assert.deepEqual(kor([690, 500], vilatFramme).syns, [H, H]);
  // Närmast sidans topp står det på sin plats i sidan, och till hälften framme rörs fästet inte.
  assert.equal(sparRast(sparStart(m(60)), m(60)), ALLTID_OVAN_PX + H - TOPP);
  const halv = kor([1195, 1150], nere).slut;
  assert.equal(sparRast(halv, m(1150)), halv.hb);
});

test("☠️ ett långsamt drag uppåt, en halv pixel per bildruta: sidhuvudet kommer in ändå", () => {
  // Vändningen lade sidhuvudet strax ovanför kanten. Gjorde varje bildruta om det sköts det undan
  // lika fort som fingret drog, och sidhuvudet kom aldrig in förrän draget blev snabbare.
  const nere = kor(svep(0, 1200)).slut;
  const sakta = kor([1199.5, 1199, 1198.5, 1198, 1197.5, 1197, 1196.5, 1196], nere);
  assert.deepEqual(sakta.syns, [0, 0, 0, 0, 0, 0.5, 1, 1.5]);
  assert.equal(sakta.skrivningar, 1, "en skrivning i vändningen, sedan ingen");
  // Efter en vila: ingen skrivning alls.
  const vilat = { ...nere, hb: sparRast(nere, m(1200)) };
  const efterVila = kor([1199.5, 1199, 1198.5, 1198, 1197.5, 1197], vilat);
  assert.deepEqual(efterVila.syns, [0, 0, 0, 0, 0.5, 1]);
  assert.equal(efterVila.skrivningar, 0);
});

test("ett avbrutet glid: sidhuvudet står kvar där det syntes", () => {
  for (const syns of [0, 1, 40, 132, H]) assert.equal(synligt(sparFran(syns, m(1500)), m(1500)), syns);
  // Mer än sidhuvudets höjd, eller ett negativt mått, hålls inom det som finns.
  assert.equal(synligt(sparFran(500, m(1500)), m(1500)), H);
  assert.equal(synligt(sparFran(-20, m(1500)), m(1500)), 0);
  assert.equal(sparFran(-20, m(1500)), sparFran(-UR, m(1500)));
});

test("☠️ ett gömt sidhuvud ligger en bit ovanför skärmens kant, inte precis i den", () => {
  // Precis i kanten syntes den glödande linjen i sidhuvudets nederkant som en hårfin rand
  // på skärmar som avrundar halva pixlar.
  assert.ok(UR >= 1 && UR <= 4);
  const nere = kor(svep(0, 1200)).slut;
  const vand = sparSteg(nere, m(1195));
  assert.equal(TOPP + vand.hb, 1195 - UR, "omslagets nederkant i sidan");
  // Närmast toppen går det aldrig ovanför sin plats i sidan.
  assert.ok(sparFran(-UR, m(100)) >= ALLTID_OVAN_PX + H - TOPP);
});

test("gränserna", () => {
  // Sidhuvudet på mobilen är 133 px: närmare toppen än så står det på sin plats i sidan.
  assert.ok(ALLTID_OVAN_PX >= 133);
  assert.ok(VISA_MINST_PX >= 8 && VISA_MINST_PX <= 30, "så fort man scrollar upp, men inte för en darrning");
  assert.ok(GOM_MINST_PX > VISA_MINST_PX && GOM_MINST_PX <= 60);
});

// ─── komponenten, omslaget och stilen ───────────────────────────────────────

const komponent = readFileSync(new URL("../components/huvud-gom.tsx", import.meta.url), "utf8");
const css = readFileSync(new URL("../app/globals.css", import.meta.url), "utf8");
const sajt = readFileSync(new URL("../components/site.tsx", import.meta.url), "utf8");

test("komponenten: lyssnar passivt, räknar en gång per bildruta och skriver bara när omslagets höjd ändras", () => {
  assert.match(komponent, /addEventListener\("scroll", vidScroll, \{ passive: true \}\)/);
  assert.match(komponent, /if \(!ram\) ram = requestAnimationFrame\(rakna\);/);
  assert.match(komponent, /if \(nytt\.hb !== lage\.hb\) skriv\(nytt\.hb, m\.h\);/);
  // Ett glid som aldrig får sitt transitionend (fliken göms mitt i) avslutas ändå.
  assert.match(komponent, /glidvakt = window\.setTimeout\(klart, ms \+ 200\);/);
  assert.match(komponent, /const utanGlid = \(\) => \{\s+if \(glidvakt\) window\.clearTimeout\(glidvakt\);/);
  // Höjden och lika mycket tillbaka i marginalen, i samma skrivning: sidan under flyttar sig aldrig.
  assert.match(komponent, /spar\.style\.height = `\$\{hb\}px`;\s+spar\.style\.marginBottom = `\$\{h - hb\}px`;/);
  // Ingen rörelse görs i kod medan fingret drar: transform sätts bara när rörelsen stannat.
  assert.equal(komponent.split("huvud.style.transform = `translate3d").length - 1, 1);
  assert.match(komponent, /if \(fingret\) \{\s+vilar = window\.setTimeout\(vila, VILA_MS\);\s+return;/);
  // Fingret släpper: vilan prövas strax, inte vid nästa hela väntan. Rör sig sidan vidare börjar väntan om.
  assert.match(komponent, /const upp = \(\) => \{\s+fingret = false;[\s\S]{0,330}if \(!vilar\) return;\s+window\.clearTimeout\(vilar\);\s+vilar = window\.setTimeout\(vila, SLAPP_MS\);\s+\};/);
  assert.match(komponent, /const SLAPP_MS = (\d+);/);
  assert.ok(Number(/const SLAPP_MS = (\d+);/.exec(komponent)?.[1]) >= 50, "längre än två bildrutor: farten efter släppet ska hinna märkas");
  assert.match(komponent, /if \(vilar\) window\.clearTimeout\(vilar\);\s+vilar = window\.setTimeout\(vila, VILA_MS\);\s+\};\s+const vidScroll/);
  // Vilan med sidhuvudet helt framme eller helt borta lägger fästet där det står, också med fingret kvar på skärmen.
  assert.match(komponent, /if \(!v\) \{[\s\S]{0,260}const hb = sparRast\(lage, m\);\s+if \(hb !== lage\.hb\) \{\s+lage = \{ \.\.\.lage, hb \};\s+skriv\(hb, m\.h\);\s+\}\s+return;\s+\}[\s\S]{0,120}if \(fingret\)/);
});

test("komponenten: bara telefonens sidhuvud, och allt städas bort", () => {
  // 760 px, inte 900: över 760 fäster produktsidans galleri under sidhuvudet (--ankare).
  assert.match(komponent, /const MOBIL = "\(max-width:760px\)";/);
  assert.match(css, /@media\(min-width:761px\)\{\.pdp>\.gallery\{position:sticky;top:min\(var\(--ankare\)/);
  assert.match(komponent, /const vidBredd = \(\) => \(mobil\.matches \? start\(\) : stopp\(\)\);/);
  const stopp = /const stopp = \(\) => \{([\s\S]*?)\n    \};/.exec(komponent)?.[1] ?? "";
  assert.match(stopp, /spar\.removeAttribute\("data-spar"\);\s+spar\.style\.height = "";\s+spar\.style\.marginBottom = "";\s+arBorta = false;\s+rot\.removeAttribute\(BORTA\);/);
  assert.match(komponent, /removeEventListener\("scroll", vidScroll\)/);
  assert.match(komponent, /sok\.disconnect\(\);\s+stopp\(\);/);
  // Ett sidhuvud som inte ritas (kassan har sitt eget) får inget omslag.
  assert.match(komponent, /if \(pa \|\| huvud\.getBoundingClientRect\(\)\.height < 1\) return;/);
  // Sidhuvudets höjd ändras: stod det helt framme gör det det efteråt också.
  assert.match(komponent, /if \(synligt\(lage\.hb, \{ \.\.\.m, h: hojd \}\) >= hojd\) \{\s+fram\(\);\s+return;/);
  // Den som bett om mindre rörelse får inget glid: sidhuvudet byter läge direkt.
  assert.match(komponent, /if \(lugn\.matches\) \{\s+lage = \{ \.\.\.lage, hb: v\.hb \};\s+skriv\(lage\.hb, m\.h\);\s+markera\(m\);\s+return;/);
});

test("☠️ komponenten: sidan landar med sidhuvudet framme, vilken ordning webbläsaren än ställer tillbaka läget i", () => {
  // Efter bakåtknappen flyttar webbläsaren sidan till det gamla läget, ibland före och ibland efter att
  // den här koden startat. Räknades den flytten som en rörelse neråt var sidhuvudet borta när sidan kom tillbaka.
  assert.match(komponent, /pa = true;\s+landar = true;/);
  assert.match(komponent, /if \(landar\) \{\s+fram\(\);\s+return;\s+\}\s+if \(glid && m\.y !== lage\.y\) stanna\(\);/);
  // Landningen slutar när kunden själv rör sidan: fingret, hjulet, tangenterna eller rullningslisten.
  assert.match(komponent, /const ner = \(\) => \{\s+fingret = true;\s+landar = false;\s+\};/);
  for (const h of ["wheel", "keydown", "pointerdown"]) {
    assert.ok(komponent.includes(`window.addEventListener("${h}", rord`), h);
    assert.ok(komponent.includes(`window.removeEventListener("${h}", rord)`), h);
  }
});

test("komponenten: sökläget och tangentbordets fokus får sidhuvudet framme", () => {
  // ☠️ När sökläget stängs kommer remsan och loggans rad tillbaka ovanför, och Chrome flyttar sidan
  // lika mycket. Sidan landar därför på nytt: annars gled sidhuvudet undan när sökläget stängdes.
  assert.match(komponent, /const sok = new MutationObserver\(\(\) => \{\s+if \(!pa \|\| rot\.hasAttribute\("data-sok-lage"\)\) return;\s+landar = true;\s+fram\(\);\s+\}\);/);
  assert.match(komponent, /huvud\.addEventListener\("focusin", fram\);/);
  assert.match(komponent, /if \(!pa \|\| rot\.hasAttribute\("data-sok-lage"\)\) return;/);
  // I sökläget finns omslaget inte för layouten: ingenting mäts där.
  assert.match(komponent, /const fram = \(\) => \{[\s\S]{0,160}if \(rot\.hasAttribute\("data-sok-lage"\)\) return;\s+const m = matt\(\);/);
});

test("omslaget: sidhuvudet ligger i .huvudspar, som inte finns för layouten utan skriptet", () => {
  assert.match(sajt, /<HuvudGom \/>\s+<div className="huvudspar">\s+<header className="sidhuvud">/);
  // Utanför mediafrågan: datorn, och varje webbläsare där skriptet inte körts.
  const fore = css.slice(0, css.indexOf("@media(max-width:760px){\n  .sidhuvud{background:#fff"));
  assert.match(fore, /\.huvudspar\{display:contents\}\s*$/);
});

test("stilen: omslaget får sin ruta bara på telefonen och bara när skriptet satt den", () => {
  const block = /\.huvudspar\{display:contents\}\s*@media\(max-width:760px\)\{([\s\S]*?)\n\}/.exec(css)?.[1] ?? "";
  // overflow-anchor: omslaget ändrar höjd och ska aldrig vara det webbläsaren håller sidan still mot.
  assert.match(block, /\.huvudspar\[data-spar\]\{display:block;pointer-events:none;overflow-anchor:none\}/);
  assert.match(block, /\.huvudspar\[data-spar\]>\.sidhuvud\{pointer-events:auto;will-change:transform\}/);
  // Sökläget: som förut, fäst överst och utan glid.
  assert.match(block, /html\[data-sok-lage\] \.huvudspar\[data-spar\]\{display:contents\}/);
  assert.match(block, /html\[data-sok-lage\] \.huvudspar>\.sidhuvud\{transform:none!important;transition:none!important\}/);
  // Ogenomskinligt på mobilen: den suddiga bakgrunden ritades om för varje bildruta.
  assert.match(block, /\.sidhuvud\{background:#fff;-webkit-backdrop-filter:none;backdrop-filter:none\}/);
  // Den gamla övergången vid en gräns finns inte kvar.
  assert.doesNotMatch(css, /data-huvud="gomt"/);
});

test("☠️ kassan gömmer butikens sidhuvud också när det ligger i omslaget", () => {
  // Regeln pekade på body>.sidhuvud. Med omslaget emellan hade butikens meny stått överst i kassan.
  assert.match(css, /body:has\(\[data-kassa-sida\]\)>\.huvudspar,\s*body:has\(\[data-kassa-sida\]\)>\.huvudspar>\.sidhuvud,/);
  assert.doesNotMatch(css, /body:has\(\[data-kassa-sida\]\)>\.sidhuvud/);
});

test("omslagets överkant mäts med decimaler", () => {
  // offsetTop är avrundad till hela px. Kampanjremsan ovanför är 46,4 px hög, och med 46 hamnade
  // sidhuvudet 0,4 px fel när glidet var klart.
  assert.match(komponent, /topp: spar\.getBoundingClientRect\(\)\.top \+ window\.scrollY,/);
  assert.doesNotMatch(komponent, /topp: spar\.offsetTop/);
});

test("☠️ produktsidans köprad vet när sidhuvudet är borta: aldrig två köpknappar i samma skärm", () => {
  // Köpraden i nederkant göms medan sidans egen köpknapp syns. Förr räknades skärmens översta 133 px
  // alltid som täckta av sidhuvudet. När sidhuvudet följt med sidan ur bild syns knappen där.
  assert.match(komponent, /const BORTA = "data-huvud-borta";/);
  assert.match(komponent, /const borta = pa && synligt\(lage\.hb, m\) <= 0;\s+if \(borta === arBorta\) return;\s+arBorta = borta;\s+rot\.toggleAttribute\(BORTA, borta\);/);
  // Märket följer varje ändring av läget: steget, glidets slut, ett avbrutet glid och landningen.
  assert.ok(komponent.split("markera(m);").length - 1 >= 5, "markera(m) efter varje ändring");
  const vy = readFileSync(new URL("../components/productview.tsx", import.meta.url), "utf8");
  assert.match(vy, /const valj = \(\) => setKopSyns\(rot\.hasAttribute\("data-huvud-borta"\) \? hela : under\);/);
  assert.match(vy, /const ioUnder = new IntersectionObserver\(\(\[e\]\) => \{ under = e\.intersectionRatio >= 0\.6; valj\(\); \}, \{ threshold: 0\.6, rootMargin: `-\$\{huvud\}px 0px 0px 0px` \}\);/);
  assert.match(vy, /const ioHela = new IntersectionObserver\(\(\[e\]\) => \{ hela = e\.intersectionRatio >= 0\.6; valj\(\); \}, \{ threshold: 0\.6 \}\);/);
  assert.match(vy, /huvudLage\.observe\(rot, \{ attributes: true, attributeFilter: \["data-huvud-borta"\] \}\);/);
  assert.match(vy, /ioUnder\.disconnect\(\);\s+ioHela\.disconnect\(\);\s+huvudLage\.disconnect\(\);/);
});

test("☠️ glidet den sista biten börjar stilla: ingen kurva som går i full fart från första bildrutan", () => {
  // Sidhuvudet har stått still när glidet börjar. Med en kurva som börjar i full fart gick det
  // 16–21 px i första bildrutan, och det är hoppet Leonard såg på sin iPhone i första versionen.
  const kurva = /const GLIDKURVA = "cubic-bezier\(([\d.]+),([\d.]+),([\d.]+),([\d.]+)\)";/.exec(komponent);
  assert.ok(kurva, "kurvan står som en konstant");
  const [x1, y1, x2, y2] = kurva.slice(1).map(Number);
  assert.equal(y1, 0, "farten är noll i början");
  assert.ok(x1 >= 0.3, "och den tar fart över en tredjedel av tiden eller mer");
  assert.equal(y2, 1, "farten är noll i slutet");
  assert.ok(x2 <= 0.4);
  assert.match(komponent, /const ms = glidMs\(v\.flytt\);\s+huvud\.style\.transition = `transform \$\{ms\}ms \$\{GLIDKURVA\}`;/);
  // Längden följer biten som är kvar: kort för en kort bit, aldrig över en tredjedels sekund.
  assert.equal(glidMs(10), 200);
  assert.equal(glidMs(-10), 200);
  assert.equal(glidMs(117), 307);
  assert.equal(glidMs(135), 325);
  assert.equal(glidMs(400), 340);
  assert.ok(glidMs(1) >= 180);
});

test("☠️ ett avbrutet glid räknas ur glidets förflyttning och sidans rörelse, inte ur sidhuvudets avlästa läge", () => {
  // I Safari 27 står det fästa sidhuvudets avlästa läge en bildruta efter sidans medan sidan flyttas
  // (riktig iPhone 2026-11-25: 125 i stället för 133). Läget räknas därför ur det koden själv vet.
  const nere = kor(svep(0, 1200)).slut;
  const vilat = { ...nere, hb: sparRast(nere, m(1200)) };
  const upp = kor([1150], vilat).slut; // 48 px framme (50 minus marginalen), sidan står på 1150
  assert.equal(synligt(upp.hb, m(1150)), 50 - UR);
  // Glidet fram har hunnit 30 px när sidan går 10 px ner: 48 + 30 - 10 = 68 px framme.
  assert.equal(synligt(sparAvbrutet(upp, m(1160), 30), m(1160)), 50 - UR + 30 - 10);
  // Sidan går upp i stället: 48 + 30 + 10.
  assert.equal(synligt(sparAvbrutet(upp, m(1140), 30), m(1140)), 50 - UR + 30 + 10);
  // Glidet undan (förflyttningen är negativ) har hunnit 20 px när sidan går 5 px ner.
  assert.equal(synligt(sparAvbrutet(upp, m(1155), -20), m(1155)), 50 - UR - 20 - 5);
  // Aldrig mer än hela sidhuvudet, och aldrig längre bort än marginalen ovanför kanten.
  assert.equal(synligt(sparAvbrutet(upp, m(1100), 80), m(1100)), H);
  assert.equal(sparAvbrutet(upp, m(1190), -40), sparFran(-UR, m(1190)));
  // Glidet har inte hunnit röra sig alls: sidhuvudet följer bara sidan.
  assert.equal(synligt(sparAvbrutet(upp, m(1152), 0), m(1152)), 50 - UR - 2);
  // Komponenten: förflyttningen ur transformen, sidhuvudets läge bara som reserv.
  assert.match(komponent, /sparAvbrutet\(lage, m, new DOMMatrixReadOnly\(getComputedStyle\(huvud\)\.transform\)\.m42\)/);
  assert.match(komponent, /typeof DOMMatrixReadOnly === "function"\s+\? sparAvbrutet[\s\S]{0,120}: sparFran\(huvud\.getBoundingClientRect\(\)\.bottom, m\);/);
});
