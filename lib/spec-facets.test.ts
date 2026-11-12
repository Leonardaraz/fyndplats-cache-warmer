// Run with: `pnpm test` (node --test --experimental-strip-types).
//
// Specfiltrens tolkning, låst mot verkliga beskrivningar ur katalogen
// (2026-09-27). Regeln är "hellre tom än fel": en produkt utan värde försvinner
// bara när just det filtret används, ett fel värde hamnar på fel ställe.

import { test } from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import {
  lasMatt, lasSpec, lasAlder, specRader, inomIntervall, passarVal,
  specSkala, specOversikt, specFor, specSlug, lasSpecSlug, specEtikett, specUndre, specOvre,
  FACETTER, MATERIAL, VAL, formatTal,
  type Spec,
} from "./spec-facets.ts";

test("mått: tre tal utan förklaring är bredd × djup × höjd", () => {
  assert.deepEqual(lasMatt("82 × 35 × 76 cm"), { b: 82, d: 35, h: 76 });
  assert.deepEqual(lasMatt("200 x 100 x 80 cm"), { b: 200, d: 100, h: 80 });
});

test("mått: förklaring i parentes och justerbar höjd som intervall", () => {
  assert.deepEqual(lasMatt("76 × 56 × 120–187,5 cm (B × D × H)"), { b: 76, d: 56, h: [120, 187.5] });
  assert.deepEqual(lasMatt("103 × 80 × 88 cm (bredd × djup × höjd)"), { b: 103, d: 80, h: 88 });
});

test("mått: bokstäver vid talen, före eller efter", () => {
  assert.deepEqual(lasMatt("600L x 300B x 197H cm"), { b: 600, d: 300, h: 197 });
  assert.deepEqual(lasMatt("L245 x B200 x H198 cm"), { b: 245, d: 200, h: 198 });
  assert.deepEqual(lasMatt("71H × 113–166L cm"), { h: 71, b: [113, 166] });
});

test("mått: diameter och meter", () => {
  assert.deepEqual(lasMatt("Ø16 × 125 cm"), { b: 16, d: 16, h: 125 });
  assert.deepEqual(lasMatt("5,97 × 2,95 m"), { b: 597 });
});

test("mått: två tal utan förklaring ger bara bredden", () => {
  assert.deepEqual(lasMatt("60 × 180 cm"), { b: 60 });
});

test("mått: flera mått där bara ett går att läsa → inget alls", () => {
  assert.equal(lasMatt("ca 60 x ungefär 180 cm"), null);
});

test("spec-rader: tabell och text", () => {
  const r = specRader("<table><tr><td>Mått</td><td>82 × 35 × 76 cm</td></tr></table><p>Vikt: 14,5 kg<br>Maxlast: 30 kg</p>");
  assert.equal(r.get("mått"), "82 × 35 × 76 cm");
  assert.equal(r.get("vikt"), "14,5 kg");
  assert.equal(r.get("maxlast"), "30 kg");
});

test("spec: kartongens mått läses aldrig som produktens", () => {
  const s = lasSpec("Byrå", "<p>Paketmått: 155 × 39 × 12 cm</p><p>Vikt: 20 kg</p>");
  assert.equal(s?.b, undefined);
  assert.equal(s?.kg, 20);
});

test("spec: fåtölj med produktens egen rad och sitthöjd i en mening", () => {
  const html = "<p>Fåtölj:  74 × 82 × 89 cm</p><p>Fotpall:  56 × 44 cm, höjd 45–51 cm</p>"
    + "<p>Sits:  74 × 45 cm, sitthöjd 50 cm</p><p>Paketmått:  79 × 69 × 45 cm</p><p>Material: sammet och stål</p>";
  const s = lasSpec("Läsfåtölj i beige manchester med fotpall – snurrbar, 20 cm tjock sits", html);
  assert.deepEqual([s?.b, s?.d, s?.h, s?.sh], [74, 82, 89, 50]);
  assert.equal(s?.m, "my");
});

test("spec: ett ensamt mått i namnet är ingen bredd (\"bred sits på 79 cm\")", () => {
  const s = lasSpec("Loungefåtölj med fotpall – bred sits på 79 cm", "<p>Material: chenille</p>");
  assert.equal(s?.b, undefined);
});

test("spec: julgranens höjd ur namnet och diametern ur texten", () => {
  const s = lasSpec("Julgran 183 cm med 2380 grenspetsar", "<p>En konstgjord julgran på 183 cm med 2380 grenspetsar och 110 cm diameter.</p>");
  assert.deepEqual([s?.h, s?.b, s?.d], [183, 110, 110]);
});

test("spec: effekt och volym, men aldrig en längd som volym", () => {
  const ugn = lasSpec("Bänkugn 28 liter med två kokplattor, 2600 W totalt", "<p>Effekt: 2600 W</p>");
  assert.equal(ugn?.w, 2600);
  assert.equal(ugn?.l, 28);
  assert.equal(lasSpec("Värmare 2,2 kW", "")?.w, 2200);
  assert.equal(lasSpec("Växthus 200L x 75B x 188H cm", "")?.l, undefined);
});

test("ålder: spann, månader och öppet uppåt", () => {
  assert.deepEqual(lasAlder("3–8 år"), [3, 8]);
  assert.deepEqual(lasAlder("12–60 månader"), [1, 5]);
  assert.deepEqual(lasAlder("från 3 år"), [3, 99]);
  assert.deepEqual(lasAlder("3+ år"), [3, 99]);
});

test("material: flera klasser, och PE-duk räknas som plast", () => {
  assert.equal(lasSpec("Hylla", "<p>Material: stål och MDF</p>")?.m, "tm");
  assert.equal(lasSpec("Växthus", "<p>Material: Stål, PE-nätmaterial</p>")?.m, "mp");
});

test("filter: justerbar höjd passar urval som överlappar", () => {
  const s: Spec = { h: [73, 89] };
  assert.ok(inomIntervall(s, "h", 80, 100));
  assert.ok(inomIntervall(s, "h", 60, 75));
  assert.ok(!inomIntervall(s, "h", 90, 120));
  assert.ok(!inomIntervall({}, "h", 0, 999), "saknat värde passar aldrig");
});

test("filter: material är ELLER mellan valen, egenskaper OCH", () => {
  assert.ok(passarVal({ m: "tm" }, "m", ["m", "y"], false));
  assert.ok(!passarVal({ m: "tm" }, "m", ["y"], false));
  assert.ok(!passarVal({}, "m", ["t"], false));
  assert.ok(passarVal({ eg: "hj" }, "eg", ["h", "j"], true));
  assert.ok(!passarVal({ eg: "h" }, "eg", ["h", "j"], true));
  assert.ok(passarVal({}, "eg", [], true), "inget valt = allt passar");
});

test("filter: antal som knappar, spann och N+", () => {
  assert.ok(passarVal({ sp: [6, 8] }, "sp", ["6"], false));
  assert.ok(passarVal({ sp: [6, 8] }, "sp", ["7"], false));
  assert.ok(!passarVal({ sp: 4 }, "sp", ["6"], false));
  assert.ok(passarVal({ ld: 9 }, "ld", ["6+"], false));
  assert.ok(!passarVal({ ld: 5 }, "ld", ["6+"], false));
  assert.ok(!passarVal({}, "ld", ["2"], false));
});

test("skala: kapar svansen och kräver spridning", () => {
  const v = [40, 45, 50, 55, 60, 65, 70, 75, 80, 85, 90, 95, 100, 105, 110, 115, 120, 125, 130, 400];
  const s = specSkala(v)!;
  assert.ok(s.max < 400 && s.openTop);
  assert.equal(specSkala([50, 50, 50, 50, 50, 50, 50, 50]), null);
  assert.equal(specSkala([10, 20, 30]), null);
});

test("översikt: filtret visas bara när minst 60 % har värdet", () => {
  const med = Array.from({ length: 10 }, (_, i) => ({ spec: { b: 40 + i * 10 } as Spec }));
  const utan = Array.from({ length: 10 }, () => ({ spec: undefined }));
  assert.equal(specOversikt([...med, ...utan.slice(0, 4)], [{ nyckel: "b", namn: "Bredd" }]).length, 1);
  assert.equal(specOversikt([...med, ...utan], [{ nyckel: "b", namn: "Bredd" }]).length, 0);
});

test("översikt: material kräver minst två material med minst två produkter", () => {
  const items = [...Array(5).fill({ spec: { m: "t" } }), ...Array(5).fill({ spec: { m: "m" } })];
  const f = specOversikt(items, [{ nyckel: "m", namn: "Material" }]);
  assert.equal(f.length, 1);
  assert.deepEqual(f[0].nyckel === "m" && "val" in f[0] ? f[0].val.map((v) => v.kod) : null, ["t", "m"]);
  assert.equal(specOversikt(Array(10).fill({ spec: { m: "t" } }), [{ nyckel: "m", namn: "Material" }]).length, 0);
});

test("specFor: bara kategorins nycklar skickas", () => {
  assert.deepEqual(specFor({ b: 1, kg: 2, m: "t" }, new Set(["b", "m"] as const)), { b: 1, m: "t" });
  assert.equal(specFor({ kg: 2 }, new Set(["b"] as const)), undefined);
});

test("URL: slug fram och tillbaka, skräp ger hela skalan", () => {
  const s = { min: 40, max: 200, step: 5, openTop: false };
  assert.equal(specSlug(40, 200, s), "");
  assert.equal(specSlug(40, 120, s), "under-120");
  assert.equal(specSlug(60, 200, s), "over-60");
  assert.equal(specSlug(60, 120, s), "60-120");
  assert.deepEqual(lasSpecSlug("60-120", s), [60, 120]);
  assert.deepEqual(lasSpecSlug("under-120", s), [40, 120]);
  assert.deepEqual(lasSpecSlug("skräp", s), [40, 200]);
  assert.deepEqual(lasSpecSlug("300-400", s), [40, 200]);
  assert.equal(specEtikett(60, 120, s, "cm"), "60–120 cm");
  assert.equal(specEtikett(40, 120, s, "cm"), "Upp till 120 cm");
  assert.equal(specUndre(40, s), -Infinity);
  assert.equal(specOvre(200, s), Infinity);
});

// ── Egenskaper ur texten (2026-09-27) ──────────────────────────────────────
// Varje fall nedan är ett fel eller en fälla som hittades i stickprov mot
// katalogen.

test("ordgräns: å, ä och ö räknas som bokstäver", () => {
  assert.equal(lasSpec("Byrå", "<p>Material: trä</p>")?.m, "t", "\\bträ\\b hittade aldrig trä");
  assert.equal(lasSpec("Byrå med åtta tyglådor, 80 × 30 × 94,5 cm", "")?.ld, 8);
});

test("lådor: antal i namnet, siffra i raden, aldrig 'en … med lådor'", () => {
  assert.equal(lasSpec("Byrå med 4 lådor 47 cm", "")?.ld, 4);
  assert.equal(lasSpec("Verktygsvagn med lådor 3-i-1", "<p>En verktygsvagn med lådor som är byggd i tre delar och kan användas på tre sätt.</p><p>Antal lådor: 5</p>")?.ld, 5);
  assert.equal(lasSpec("Rullbord 61 cm med låda, hylla och hängkorg", "")?.ld, 1);
  assert.equal(lasSpec("Förvaringstorn", "<p>En verktygsvagn med lådor som rullar dit du jobbar och står stadigt.</p>")?.ld, undefined);
});

test("sittplatser: tresits, 'för sex till åtta', men inte fotpallar eller sitsdynor", () => {
  assert.equal(lasSpec("Tresitssoffa 218 cm i ljusgrå manchester", "")?.sp, 3);
  assert.equal(lasSpec("2-sitssoffa 137 cm i sherpafleece", "")?.sp, 2);
  assert.deepEqual(lasSpec("Utdragbart matbord 160–200 cm för sex till åtta", "")?.sp, [6, 8]);
  assert.equal(lasSpec("Matgrupp 5 delar — furubord 118 cm och fyra stolar", "")?.sp, 4);
  assert.equal(lasSpec("Hörnsoffa med förvaring och två fotpallar", "")?.sp, undefined);
  assert.equal(lasSpec("Soffa med två sitsdynor", "")?.sp, undefined);
  assert.equal(lasSpec("Hundbur för två hundar", "")?.sp, undefined);
});

test("våningar: två eller fler, 'en plan yta' är inget plan", () => {
  assert.equal(lasSpec("Hamsterbur i trä med tre våningar, 68 × 61,5 cm", "")?.vn, 3);
  assert.equal(lasSpec("Hylla", "<p>Hyllan står på en plan yta och tål fukt från krukorna ovanför.</p>")?.vn, undefined);
});

test("sängbredd: madrassmåttet i namnet, åt båda hållen", () => {
  assert.equal(lasSpec("Sängram 140 × 200 cm i grå linnelook", "")?.sb, 140);
  assert.equal(lasSpec("Hopfällbar säng 190 × 80 cm med madrass", "")?.sb, 80);
  assert.equal(lasSpec("Byrå 140 × 40 × 80 cm", "")?.sb, undefined);
});

test("klädsel: namnet först, sedan raden", () => {
  assert.equal(lasSpec("Läsfåtölj i beige manchester", "")?.ky, "m");
  assert.equal(lasSpec("Bred fåtölj i krämvitt tyg", "<p>Material: Sammetsliknande tyg (100 % polyester), gummiträ och stål</p>")?.ky, "s");
  assert.equal(lasSpec("Kontorsstol i mesh", "")?.ky, "n");
});

test("djur: namnet, även sammansatta ord", () => {
  assert.equal(lasSpec("Väggklösträd 73 cm i beige", "")?.dj, "k");
  assert.equal(lasSpec("Gnagarbur i akryl 100 × 50 cm", "")?.dj, "g");
  assert.equal(lasSpec("Ankhus i trä för tre ankor", "")?.dj, "o");
  assert.equal(lasSpec("Sköldpaddshus 91 cm med nätlock", "")?.dj, "r");
});

test("bränsle: bara på det som eldar — ett vedställ drivs inte med ved", () => {
  assert.equal(lasSpec("Gasolgrill 3 brännare med sidobord", "")?.br, "g");
  assert.equal(lasSpec("Kolgrill på vagn i stål", "")?.br, "k");
  assert.equal(lasSpec("Vedställ med brasverktyg – två plan", "<p>Ett vedställ för ved till kaminen.</p>")?.br, undefined);
});

test("form: namn, Ø, mått — men aldrig på stolar eller organiska speglar", () => {
  assert.equal(lasSpec("Runt matbord Ø80 cm", "")?.fo, "r");
  assert.equal(lasSpec("Golvspegel oval 50 × 180 cm", "")?.fo, "o");
  assert.equal(lasSpec("Matbord", "<p>Mått: 120 × 75 × 75 cm</p>")?.fo, "e");
  assert.equal(lasSpec("Soffbord", "<p>Mått: 60 × 60 × 45 cm</p>")?.fo, "k");
  assert.equal(lasSpec("Badrumsspegel LED 80 × 60 cm", "")?.fo, "e");
  assert.equal(lasSpec("Matstolar 2-pack i linnelook", "<p>Mått: 45 × 55 × 80 cm</p>")?.fo, undefined);
  assert.equal(lasSpec("Väggspegel i organisk form 91,5 × 45 cm", "")?.fo, undefined);
  assert.equal(lasSpec("Bågformad badrumsspegel 50 × 70 cm", "")?.fo, undefined);
});

test("placering: vägg eller golv, men tippskyddet gör inget vägghängt", () => {
  assert.equal(lasSpec("Väggspegel 40 × 60 cm med svart ram", "")?.pl, "v");
  assert.equal(lasSpec("Golvspegel i vitt, 148 cm hög", "")?.pl, "f");
  assert.equal(lasSpec("Elelement 1500 W – för vägg eller golv", "")?.pl, "vf");
  assert.equal(lasSpec("Klösträd 200 cm", "<p>Ett klösträd på 200 cm, och en tippskyddslina fästs på väggen.</p>")?.pl, undefined);
});

test("egenskaper: hjul, men inte löphjul, 'inte hjul' eller en rullbar dörr", () => {
  assert.equal(lasSpec("Sidobord på hjul med C-form", "")?.eg, "h");
  assert.equal(lasSpec("Verktygsvagn", "<ul><li><p>Fyra hjul, två av dem med broms</p></li></ul>")?.eg, "h");
  assert.equal(lasSpec("Klaffbord 168 cm", "<h2>Fast underrede, inte hjul</h2>")?.eg, undefined);
  assert.equal(lasSpec("Hamsterbur", "<ul><li><p>Hus, löphjul och vattenflaska</p></li></ul>")?.eg, undefined);
  assert.equal(lasSpec("Tomatväxthus 170 cm med rullport", "<p>Port: Rullbar, 112 × 163 cm</p>")?.eg, undefined);
});

test("egenskaper: höj- och sänkbar bara om varan själv, inte ett råd om en annan", () => {
  assert.equal(lasSpec("Elektriskt skrivbord 120 × 60 cm höj- och sänkbart 72–116 cm", "")?.eg, "j");
  assert.equal(lasSpec("Kontorsstol", "<ul><li><p>Höjdjusterbar med säker klass 3-gasfjäder</p></li></ul>")?.eg, "j");
  assert.equal(lasSpec("Ritstol med fotring", "<p>En hög arbetsstol för dig som sitter vid ritbord eller ett höj- och sänkbart skrivbord i stående läge.</p>")?.eg, undefined);
  assert.equal(lasSpec("Barstolar 2-pack", "<ul><li><p>Vill du ändra höjden, då ska du välja en höj- och sänkbar i stället</p></li></ul>")?.eg, undefined);
  assert.equal(lasSpec("Sparkcykel barn 12 tum", "<ul><li><p>Höjdjusterbart styre, 80 till 88 cm</p></li></ul>")?.eg, undefined);
});

test("egenskaper: brödtext och Vanliga frågor räknas inte, länkar inte heller", () => {
  const html = "<p>En skänk i vitt med två lådor och tre luckor bakom tryck-öppning, helt utan handtag.</p>"
    + "<p>Det här är motpolen till våra höj- och sänkbara bord.</p>"
    + "<h2>Vanliga frågor</h2><p>Finns den på hjul?</p><p>Ja, se <a href=\"/x\">skänk på hjul</a>.</p>";
  assert.equal(lasSpec("Skänk vit 117 cm", html)?.eg, undefined);
});

test("egenskaper: batteri, men inte 'utan batteri' eller fjärrkontrollens", () => {
  assert.equal(lasSpec("Lysande snögubbe 51 cm med 30 LED – batteridriven", "")?.eg, "lb");
  assert.equal(lasSpec("Frontlastare att sitta på 80 cm", "<ul><li><p>Batteri: tutan kräver inget batteri</p></li></ul>")?.eg, undefined);
  assert.equal(lasSpec("Golvlampa 177 cm med fjärrkontroll", "<ul><li><p>Ingår: golvlampa, fjärrkontroll och bruksanvisning. Två AAA-batterier ingår ej</p></li></ul>")?.eg, "f");
  assert.equal(lasSpec("Elkamin", "<ul><li><p>Fjärrkontroll ingår (batterier ingår inte)</p></li></ul>")?.eg, "f");
});

test("egenskaper: LED bara med versaler, fjärrkontroll inte som ficka", () => {
  assert.equal(lasSpec("Armstöd med led", "")?.eg, undefined);
  assert.equal(lasSpec("Badrumsspegel LED 80 × 60 cm", "")?.eg, "l");
  assert.equal(lasSpec("Tv-fåtölj i chenille", "<ul><li><p>Två sidofickor, 35 × 28 cm, för fjärrkontroll och surfplatta</p></li></ul>")?.eg, undefined);
});

test("översikt: egenskaper visas från tre produkter men inte när nästan alla har dem", () => {
  const med = (eg: string) => ({ spec: { eg } as Spec });
  const items = [med("h"), med("h"), med("h"), med("j"), med("j"), { spec: undefined }, { spec: undefined }, { spec: undefined }, { spec: undefined }, { spec: undefined }];
  const f = specOversikt(items, [{ nyckel: "eg", namn: "" }]);
  assert.deepEqual(f.length && "val" in f[0] ? f[0].val.map((v) => v.kod) : [], ["h"]);
  const alla = Array.from({ length: 10 }, () => med("h"));
  assert.equal(specOversikt(alla, [{ nyckel: "eg", namn: "" }]).length, 0);
  assert.deepEqual(specOversikt(items, [{ nyckel: "eg", namn: "", koder: "j" }]), []);
});

test("översikt: antal blir knappar med N+ på slutet", () => {
  const items = [2, 2, 3, 3, 4, 4, 5, 5, 6, 6, 7, 7, 9, 9].map((ld) => ({ spec: { ld } as Spec }));
  const f = specOversikt(items, [{ nyckel: "ld", namn: "" }]);
  assert.deepEqual(f.length && "val" in f[0] ? f[0].val.map((v) => v.kod) : [], ["2", "3", "4", "5", "6", "7+"]);
  assert.equal(f.length && "val" in f[0] ? f[0].val[5].slug : "", "7-plus");
});

test("översikt: en knappgrupp kräver 40 % och två val", () => {
  const ky = (k?: string) => ({ spec: k ? ({ ky: k } as Spec) : undefined });
  const items = [ky("s"), ky("s"), ky("m"), ky("m"), ky(), ky(), ky(), ky(), ky(), ky()];
  assert.equal(specOversikt(items, [{ nyckel: "ky", namn: "" }]).length, 1);
  assert.equal(specOversikt([...items, ky(), ky()], [{ nyckel: "ky", namn: "" }]).length, 0);
});

// ── Fynden från den oberoende granskningen (2026-09-27) ────────────────────

test("egenskaper: spec-raderna i löptext om andra varor räknas inte", () => {
  const html = "<p>En uppresningsfåtölj med 180° liggläge, utan massage och värme, i mörkgrått tyg.</p>"
    + "<p>Fyra andra uppresningsfåtöljer: modellen med hjul, den med massage och två till.</p>"
    + "<table><tr><td>Material</td><td>Polyester</td></tr></table>";
  assert.equal(lasSpec("Uppresningsfåtölj mörkgrå med 180° liggläge", html)?.eg, undefined);
  const tabell = "<table><tr><td>Hjul</td><td>Fyra låsbara hjul</td></tr></table>";
  assert.equal(lasSpec("Rullvagn", tabell)?.eg, "h");
});

test("sittplatser: ett nej efter talet ('en tresitsare inte får plats')", () => {
  const html = "<p>En bäddsoffa för hallen eller arbetsrummet, där en tresitsare inte får plats men gästerna ändå behöver en säng.</p>";
  assert.equal(lasSpec("Bäddsoffa 167 cm med utdragbar bädd", html)?.sp, undefined);
});

test("form: 'en rund pall' i ingressen, och trekantiga skivor är ingen rektangel", () => {
  assert.equal(lasSpec("Sittpuff i vattenhyacint med kattgömma", "<p>En rund pall i flätad vattenhyacint med plats för katten inuti.</p><p>Mått: 41 × 40 × 45 cm</p>")?.fo, "r");
  assert.equal(lasSpec("Satsbord 2-pack – trekantiga vita skivor", "<p>Mått: 50 × 43 × 45 cm</p>")?.fo, undefined);
  assert.equal(lasSpec("Bordslampa med glaskupa", "<p>Mått: 20 × 20 × 40 cm</p>")?.fo, undefined);
});

test("lådor: 'två små och två breda lådor' är fyra", () => {
  assert.equal(lasSpec("Byrå 74 cm i vitt – två små och två breda lådor, 97 cm hög", "")?.ld, 4);
});

test("översikt: en ensam byrå med tio lådor går att välja via N+", () => {
  const items = [3, 3, 4, 4, 5, 5, 10].map((ld) => ({ spec: { ld } as Spec }));
  const f = specOversikt(items, [{ nyckel: "ld", namn: "" }]);
  assert.deepEqual(f.length && "val" in f[0] ? f[0].val.map((v) => v.kod) : [], ["3", "4", "5+"]);
  assert.ok(passarVal({ ld: 10 }, "ld", ["5+"], false));
});

test("egenskaper: en solcellslampa är inte batteridriven", () => {
  assert.equal(lasSpec("Solcellslampa 77 cm", "<ul><li><p>Litiumbatteriet ingår och laddas av solpanelen</p></li></ul>")?.eg, "s");
});

// ☠️ MODULEN GÅR TILL WEBBLÄSAREN med listsidornas filter. Safari före 16.4
// kan inte kompilera ett bakåtblickande uttryck, och butiken lovar iOS 14 och
// uppåt. Proven nedan vaktar tre saker: servern bygger uttrycken som förut, en
// motor utan bakåtblick kan ladda modulen, och inget bakåtblickande uttryck
// står direkt i koden (ett sådant läses när skriptfilen tolkas, och då hjälper
// ingen kontroll).

const FORE_KALLA = String.raw`(?<![\p{L}\p{N}_])`;
const EFTER_KALLA = String.raw`(?![\p{L}\p{N}_])`;
const ROT = join(import.meta.dirname, "..");

test("bakåtblick: på servern byggs uttrycken som förut, med svenska bokstavsgränser", () => {
  const tra = MATERIAL.find((m) => m.kod === "t")!.ord;
  assert.ok(tra.source.startsWith(FORE_KALLA), tra.source.slice(0, 40));
  assert.ok(tra.source.endsWith(EFTER_KALLA), tra.source.slice(-40));
  assert.ok(tra.flags.includes("u"));
  // Varje uttryck som hade ett \b bär gränserna, inget har ett \b kvar.
  const alla = [...MATERIAL.map((m) => m.ord), ...Object.values(VAL).flat().map((v) => v.ord).filter((o): o is RegExp => !!o)];
  assert.ok(alla.length > 40, String(alla.length));
  for (const re of alla) assert.doesNotMatch(re.source, /\\b/, re.source.slice(0, 60));
  assert.ok(alla.filter((re) => re.source.includes(FORE_KALLA)).length > 20);
  // Det som gränserna finns till för: å, ä och ö räknas som bokstäver.
  assert.equal(lasSpec("Byrå", "<ul><li><p>Material: trä</p></li></ul>")?.m, "t");
  assert.equal(lasSpec("Träningsbänk", "<ul><li><p>Material: stål</p></li></ul>")?.m, "m");
});

/** Kör kod i en egen process där RegExp vägrar bakåtblick, som Safari före 16.4. */
function utanBakatblick(kod: string, miljo: Record<string, string> = {}): { status: number | null; ut: string; fel: string } {
  const skript = `
    const Akta = RegExp;
    const vagra = (arg) => {
      const kalla = arg[0] instanceof Akta ? arg[0].source : String(arg[0]);
      if (/\\(\\?<[=!]/.test(kalla)) {
        globalThis.__nekade = (globalThis.__nekade || 0) + 1;
        throw new SyntaxError("Invalid regular expression: invalid group specifier name");
      }
    };
    globalThis.RegExp = new Proxy(Akta, {
      construct(mal, arg, nyMal) { vagra(arg); return Reflect.construct(mal, arg, nyMal); },
      apply(mal, detta, arg) { vagra(arg); return Reflect.apply(mal, detta, arg); },
    });
    const m = await import("./lib/spec-facets.ts");
    ${kod}
  `;
  const r = spawnSync(process.execPath, ["--experimental-strip-types", "--no-warnings", "--input-type=module", "-e", skript], {
    cwd: ROT, encoding: "utf8", env: { ...process.env, ...miljo },
  });
  return { status: r.status, ut: r.stdout, fel: r.stderr };
}

test("☠️ bakåtblick: en motor utan den kan ladda modulen (Safari före 16.4 kastade här)", () => {
  const r = utanBakatblick(`
    const tra = m.MATERIAL.find((x) => x.kod === "t").ord;
    console.log(JSON.stringify({ nekade: globalThis.__nekade || 0, facetter: Object.keys(m.FACETTER).length, material: m.MATERIAL.length, borjan: tra.source.slice(0, 3), slut: tra.source.slice(-2), flaggor: tra.flags }));
  `);
  assert.equal(r.status, 0, r.fel.slice(0, 600));
  const ut = JSON.parse(r.ut);
  // Uttrycket är det som står i koden, med \b kvar och samma flaggor som på servern.
  assert.equal(ut.borjan, "\\b(");
  assert.equal(ut.slut, "\\b");
  assert.equal(ut.flaggor, MATERIAL.find((x) => x.kod === "t")!.ord.flags);
  // Kontrollen frågade motorn en gång och fick nej. Sedan byggdes inget
  // bakåtblickande uttryck alls: ett enda till hade kastat.
  assert.equal(ut.nekade, 1);
  assert.equal(ut.facetter, Object.keys(FACETTER).length);
  assert.equal(ut.material, MATERIAL.length);
});

test("bakåtblick: provmotorn vägrar verkligen, så provet ovan mäter något", () => {
  const r = utanBakatblick(`new RegExp("(?<!a)b");`);
  assert.notEqual(r.status, 0);
  assert.match(r.fel, /invalid group specifier name/);
});

test("bakåtblick: det webbläsaren använder ger samma svar i en motor utan den", () => {
  // Det här är allt components/shopbrowser.tsx hämtar ur modulen.
  const specar: (Spec | undefined)[] = [
    lasSpec("Byrå med fyra lådor", "<ul><li><p>Mått: 82 × 35 × 76 cm</p></li><li><p>Material: trä och stål</p></li><li><p>Vikt: 21,5 kg</p></li></ul>"),
    lasSpec("Kontorsstol", "<ul><li><p>Sitthöjd: 45–55 cm</p></li><li><p>Maxlast: 120 kg</p></li><li><p>Material: nätrygg och konstläder</p></li></ul>"),
    { b: 120, d: 60, h: [72, 118], ld: 3, m: "tm", eg: "hj" } as Spec,
    undefined,
  ];
  assert.ok(specar[0]?.b && specar[0]?.m, JSON.stringify(specar[0]));
  const kod = `
    const specar = JSON.parse(process.env.SPECAR).map((s) => s ?? undefined);
    const skala = { min: 40, max: 200, step: 5, openTop: true };
    console.log(JSON.stringify({
      facetter: m.FACETTER,
      inom: specar.map((s) => ["b", "d", "h", "sh", "ml", "kg"].map((k) => [m.inomIntervall(s, k, 0, 60), m.inomIntervall(s, k, 61, 5000)])),
      val: specar.map((s) => [m.passarVal(s, "m", ["t"], false), m.passarVal(s, "m", ["t", "m"], true), m.passarVal(s, "eg", ["h", "j"], true), m.passarVal(s, "ld", ["3"], false), m.passarVal(s, "ld", ["4+"], false), m.passarVal(s, "m", [], false)]),
      tal: [m.formatTal(1234.5), m.formatTal(80), m.formatTal(2000)],
      etikett: [m.specEtikett(40, 120, skala, "cm"), m.specEtikett(60, 120, skala, "cm"), m.specEtikett(60, 200, skala, "W"), m.specEtikett(40, 200, skala, "")],
      slug: [m.specSlug(40, 120, skala), m.specSlug(60, 120, skala), m.specSlug(60, 200, skala), m.specSlug(40, 200, skala)],
      last: [m.lasSpecSlug("under-120", skala), m.lasSpecSlug("over-60", skala), m.lasSpecSlug("60-120", skala), m.lasSpecSlug("57.5-90", skala), m.lasSpecSlug("skräp", skala), m.lasSpecSlug(null, skala)],
      granser: [m.specOvre(200, skala) === Infinity, m.specOvre(120, skala), m.specUndre(40, skala) === -Infinity, m.specUndre(60, skala)],
    }));
  `;
  const r = utanBakatblick(kod, { SPECAR: JSON.stringify(specar.map((s) => s ?? null)) });
  assert.equal(r.status, 0, r.fel.slice(0, 600));
  const skala = { min: 40, max: 200, step: 5, openTop: true };
  const nycklar = ["b", "d", "h", "sh", "ml", "kg"] as const;
  const har = {
    facetter: FACETTER,
    inom: specar.map((s) => nycklar.map((k) => [inomIntervall(s, k, 0, 60), inomIntervall(s, k, 61, 5000)])),
    val: specar.map((s) => [passarVal(s, "m", ["t"], false), passarVal(s, "m", ["t", "m"], true), passarVal(s, "eg", ["h", "j"], true), passarVal(s, "ld", ["3"], false), passarVal(s, "ld", ["4+"], false), passarVal(s, "m", [], false)]),
    tal: [formatTal(1234.5), formatTal(80), formatTal(2000)],
    etikett: [specEtikett(40, 120, skala, "cm"), specEtikett(60, 120, skala, "cm"), specEtikett(60, 200, skala, "W"), specEtikett(40, 200, skala, "")],
    slug: [specSlug(40, 120, skala), specSlug(60, 120, skala), specSlug(60, 200, skala), specSlug(40, 200, skala)],
    last: [lasSpecSlug("under-120", skala), lasSpecSlug("over-60", skala), lasSpecSlug("60-120", skala), lasSpecSlug("57.5-90", skala), lasSpecSlug("skräp", skala), lasSpecSlug(null, skala)],
    granser: [specOvre(200, skala) === Infinity, specOvre(120, skala), specUndre(40, skala) === -Infinity, specUndre(60, skala)],
  };
  assert.deepEqual(JSON.parse(r.ut), JSON.parse(JSON.stringify(har)));
  // Och svaren är inte tomma: provet jämför något.
  assert.ok(har.inom.flat(2).includes(true) && har.inom.flat(2).includes(false));
  assert.ok(har.val.flat().includes(true) && har.val.flat().includes(false));
});

test("☠️ bakåtblick: inget sådant uttryck står direkt i koden, bara i strängen som kontrollen prövar", () => {
  const kalla = readFileSync(join(ROT, "lib", "spec-facets.ts"), "utf8");
  const BAKATBLICK = /\(\?<[=!]/g;
  // Ett enda ställe: strängen FORE. Den byggs med new RegExp först efter att
  // KAN_BAKATBLICK frågat motorn.
  const rader = kalla.split("\n").filter((r) => r.match(BAKATBLICK));
  assert.deepEqual(rader, ["const FORE = String.raw`(?<![\\p{L}\\p{N}_])`;"]);
  assert.match(kalla, /const KAN_BAKATBLICK = \(\(\) => \{\s*try \{\s*new RegExp\(FORE, "u"\);\s*return true;\s*\} catch \{\s*return false;\s*\}\s*\}\)\(\);/);
  assert.match(kalla, /if \(!KAN_BAKATBLICK\) return new RegExp\(re\.source, flaggor\);/);
  // Klientkomponenten som laddar modulen har inget sådant uttryck själv.
  const klient = readFileSync(join(ROT, "components", "shopbrowser.tsx"), "utf8");
  assert.match(klient, /^"use client";/);
  assert.match(klient, /from "\.\.\/lib\/spec-facets"/);
  assert.doesNotMatch(klient, BAKATBLICK);
  // Butiken lovar fortfarande webbläsare som saknar stödet (annars kan vakten tas bort).
  assert.match(readFileSync(join(ROT, "package.json"), "utf8"), /"iOS >= 1[0-5]"/);
});

