// Run: node --test --experimental-strip-types lib/sok-2026-11-21.test.ts
//
// Sökningen efter en extern granskning i tolv punkter (Leonard 2026-11-21).
// Varje påstående prövades först mot den riktiga katalogen (7 948 varor) och
// mot www: de flesta stämde, några inte ("hängmatta", "gazebo", "bilbatteri"
// och "mobilskal" gav redan rätt svar). Varje prov här bär sökningen som gick
// fel och vad den svarade då, mätt mot www samma dag.
//
//   1. ordningen: varan före tillbehöret, och ordets egen kategori först,
//   2. flertal och ental ger samma varor,
//   3. synonymerna jämförs som ord, och ett smalare ord drar inte in det bredare,
//   4. "utan" väljer bort i stället för att strykas,
//   5. frågeord hör inte till varan,
//   6. ett ärligt noll när varan inte finns,
//   7. engelska ord och fraser,
//   8. söksidans prisord, och cachetiden för de stora listorna.
//
// Butiken nedan är påhittad men byggd som den riktiga: namnen är tagna ur
// katalogens mönster, kategorierna ur menyn.
import test from "node:test";
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { hopskrivetBegrepp, nameMatch, normalize, rankaMedInfo, tolkaUtan, varanHeterSa, type Kategoridata, type SokKat } from "./search.ts";
import { billigastForst } from "./sok-ordning.ts";
import { baraPrisgrans, lagstaPris, prisTal, PRISSIDOR, sidaForPristak, tolkaPris, villHaBilligast } from "./sok-pris.ts";
import { parsePriceSlug } from "./price-range.ts";
import { sidaForSokning } from "./sok-sidor.ts";

type Vara = { n: string; k: number[]; kr?: number };

const KAT: SokKat[] = [
  { n: "Trädgård & Utemöbler", f: -1 }, // 0
  { n: "Grill & Utekök", f: 0 }, // 1
  { n: "Kök & Husgeråd", f: -1 }, // 2
  { n: "Köksmaskiner & Apparater", f: 2 }, // 3
  { n: "Leksaker & Spel", f: -1 }, // 4
  { n: "Hem & Inredning", f: -1 }, // 5
  { n: "Belysning", f: 5 }, // 6
  { n: "Möbler", f: -1 }, // 7
  { n: "Soffor & bäddsoffor", f: 7 }, // 8
  { n: "Soffbord & småbord", f: 7 }, // 9
  { n: "Bokhyllor", f: 7 }, // 10
  { n: "Julgranar", f: 5 }, // 11
  { n: "Husdjur", f: -1 }, // 12
  { n: "Kattlådor", f: 12 }, // 13
  { n: "Matbord & stolar", f: 7 }, // 14
  { n: "Bil & Cykel", f: -1 }, // 15
  { n: "Skrivbord", f: 7 }, // 16
  { n: "Barn & Baby", f: -1 }, // 17
  { n: "Förvaring & Organisering", f: 5 }, // 18
  { n: "Elbilar för barn", f: 4 }, // 19
];

const VAROR: Vara[] = [];
const lagg = (k: number, ...namn: string[]) => { for (const n of namn) VAROR.push({ n, k: [k] }); };

// Ordningen i listan är katalogens: nyast först. Stekplattan och köksgrillarna
// ligger därför FÖRE kolgrillarna, som på www den dagen.
lagg(1, "Vändbar grill- och stekplatta i gjutjärn, förkryddad");
lagg(3, "Keramikhäll och grill 2-i-1, 2 000 W", "Raclettegrill för 8 personer med marmorplatta", "Paninigrill i rostfritt stål, 2200 W");
lagg(4, "Leksaksgrill i trä med 21 delar");
lagg(1, "Lägereldsgrill med vridbart galler", "Kolgrill med två lyftbara kolbrickor", "Kamadogrill i keramik på hjul", "Gasolgrill 3 brännare med sidobord", "Hopfällbar kolgrill 40 × 28 cm");
lagg(1, "Grillvagn med bordsskiva i rostfritt stål", "Runt grillgaller för eldstad, 910 mm", "Rökfri eldstad med askfat", "Eldkorg Ø59 cm med vedhylla under", "Eldskål Ø 45 cm i svart stål");
lagg(3, "Airfryer 7 liter med glasfönster och 8 program", "Varmluftsfritös och miniugn 24 liter", "Varmluftsfritös 5 liter med fönster", "Miniugn 30 liter med varmluftsfritös – 1600 W", "Bänkfritös i rostfritt stål, 3000 W");

// "led lampa": varorna som HAR en LED-lampa ligger först i katalogen.
lagg(15, "Bilkretsprovare för 6 till 36 V med 4 m kabel och LED-lampa", "Elektrisk domkraft 5 ton med däckpump, LED-lampa och väska");
lagg(6, "Dimbar LED-pendellampa i svart metall", "LED-golvlampa med fyra hyllfack – 163 cm", "Taklampa LED 50 W med fem ljusrör", "Golvlampa i mässing med marmorfot", "Bordslampa med tygskärm", "Taklampa i mattsvart metall");
lagg(6, "Julbelysning 10 m med 100 lampor", "Solcellslykta 2-pack i konstrotting");
lagg(18, "Sängram 140 × 200 cm med förvaring och LED-belysning", "Sportväska med axelrem och skofack");

// Soffor: soffborden heter "soff-", och några soffor står på andra hyllor.
lagg(9, "Runt soffbord med hylla, Ø 80 cm", "Lyftbart soffbord i valnöt", "Sidobord för soffan i svart metall");
lagg(12, "Hundsoffa XL med ryggstöd");
lagg(0, "Trädgårdssoffa i grå polyrotting");
lagg(8, "Soffa 3-sits i grå sammet", "Hörnsoffa i beige manchester", "Bäddsoffa med förvaring i chenille", "Modulsoffa i bouclé, fyra delar", "U-soffa 287 cm i manchester", "Tvåsitssoffa i manchester utan armstöd", "3-sits soffa 220 cm med armstöd ner mot golvet");
lagg(14, "Stolsdyna 40 × 40 cm, 4-pack", "Matstolar i vitt massivt trä, 2-pack", "Barstol med ryggstöd i sammet", "Barstolar 2-pack med svängd rygg", "Barstolar 2-pack i industristil", "Barpall i massivt trä");
lagg(5, "Matta 170 × 120 cm i mörkgrått", "Dörrmatta i grått med halkfri baksida");

// Hyllor: bokhyllorna, och allt annat med "hyll" i namnet.
lagg(10, "Bokhylla för barn med fyra bokfack", "Smal bokhylla med åtta nivåer", "Bokhylla i metall, 176 cm hög");
lagg(0, "Blomställ med tre hyllplan av trådgaller");
lagg(18, "Smal badrumshylla i bambu", "Modulär kubhylla med 16 fack", "Vägghylla i ek, 80 cm", "Förvaringsbox 3-pack med lock", "Förvaringsskåp med 22 lådor");

// Julgranar: med och utan belysning, med och utan snö.
lagg(11, "Förbelyst snöflockad julgran, 1,98 m, med 250 LED-lampor", "Snötäckt julgran 90 cm – 486 grenspetsar", "Julgran 180 cm med konstsnö och kottar", "Julgran med belysning 180 cm – 550 varmvita LED", "Julgran 120 cm i lykta med 100 LED", "Julgran 150 cm med 1 724 grenspetsar", "Smal julgran 210 cm med ledade grenar");
// Belysning som bara heter "LED" eller "ljusslinga": inget av orden är en synonym till belysning.
lagg(11, "Minijulgran 60 cm med 20 varmvita LED i kruka", "Julgran 90 cm med ljusslinga och fot i trä");
lagg(5, "Julren med lykta 52 cm – julfigur", "Lysande ren i guld med röd rosett", "Uppblåsbar tomte i släde med två renar", "Julgirlang 275 cm med realistiska barrgrenar");

// Husdjur.
lagg(13, "Kattlåda med lock och kolfilter", "Öppen kattlåda i rostfritt stål", "Täckt kattlåda med topputgång", "Kattlåda i rostfritt stål med huv", "Självrengörande kattlåda 65 liter", "Kattlådeskåp i vitt med två dörrar");
lagg(12, "Klösträd 120 cm med grotta", "Hundbädd med höga kanter, 91 × 68 cm", "Vattenautomat för katt och hund med filter");
lagg(0, "Sandfilter för pool, flöde 159 l/min", "Växthus i trä med sluttande tak");
lagg(5, "Elektrisk värmefilt 180 × 130 cm", "Fleecefilt 150 × 200 cm i grått");
lagg(15, "Garagematta i filt med vattentät baksida");

// Cyklar, värmare och skrivbord.
lagg(15, "Barncykel 20 tum – 7-växlad mountainbike", "Cykelkärra 170 liter med rött kapell", "LCD-display S866 till elcykel – 36 V", "Motionscykel med magnetmotstånd");
lagg(15, "Dieselvärmare 8 kW med fjärrkontroll", "Dieselvärmare 5 kW 12 V med LCD-panel");
lagg(7, "Massagefåtölj i konstläder som snurrar och har värme");
lagg(16, "Skrivbord 120 cm med fyra lådor", "Hopfällbart skrivbord i vitt", "Gamingskrivbord i L-form");

// "lägsta" står mitt i ordet: ansLAGSTAvla.
lagg(5, "Anslagstavla med linneyta och vit ram, 900 × 600 mm");

// Barn: ordet står efter varan, aldrig först.
lagg(17, "Sparkcykel barn 3–8 år med lysande hjul", "Aktivitetsbord för barn med tågbana", "Gunga för barn med sele", "Röd sparkbil för barn 1–3 år", "Röd brandbil för barn med stege");

// Kategorin heter "Elbilar för barn", och hälften av varorna i den heter något annat.
lagg(19, "Elbil för barn 12 V med fjärrkontroll och mjukstart", "Elbil Audi TT RS för barn 2–3 år", "Elgokart för barn 3–8 år i orange", "Elfyrhjuling för barn 12 V med två motorer", "Eltraktor för barn 1–3 år med avtagbart släp");
// Soffa och bord som två ord i samma namn.
lagg(0, "Loungeset med soffa, två fåtöljer och bord i aluminium");

const kd: Kategoridata<Vara> = { kat: KAT, av: (v) => v.k };
const namn = VAROR.map((v) => normalize(v.n));
const sok = (q: string) => rankaMedInfo(VAROR, (v) => v.n, q, namn, kd);
const traffar = (q: string) => sok(q).traffar.map((v) => v.n);
const plats = (lista: string[], del: string) => lista.findIndex((n) => n.includes(del));
const medl = (k: number) => VAROR.filter((v) => v.k[0] === k).map((v) => v.n);

// ── 1. Ordningen ────────────────────────────────────────────────────────────

test('"grill": grillarna i Grill & Utekök först, inte stekplattan och paninigrillen', () => {
  // www 2026-11-21: stekplatta, keramikhäll, raclette och paninigrill låg före
  // första kolgrillen, som kom på plats 6.
  const t = traffar("grill");
  const riktiga = ["Lägereldsgrill", "Kolgrill med två", "Kamadogrill", "Gasolgrill", "Hopfällbar kolgrill"];
  assert.deepEqual(t.slice(0, 5).map((n) => riktiga.some((r) => n.startsWith(r))), [true, true, true, true, true], t.slice(0, 5).join(" | "));
  // Sedan det som heter grill på andra hyllor, och sist det som bara nämner ordet.
  for (const annan of ["Keramikhäll och grill", "Raclettegrill", "Paninigrill", "Leksaksgrill"]) {
    assert.ok(plats(t, annan) >= 5, `${annan} ska stå efter grillarna`);
    assert.ok(plats(t, annan) < plats(t, "Grillvagn"), `${annan} heter grill och går före grillvagnen`);
  }
  assert.ok(plats(t, "grill- och stekplatta") > plats(t, "Leksaksgrill"), "stekplattan är ingen grill");
  // Inget försvinner: samma varor som förut, i annan ordning.
  assert.equal(t.length, 12);
});

test('"grill- och stekplatta": ordet före ett hängande bindestreck är ett förled', () => {
  // Som eget ord i namnets huvuddel hade stekplattan samma rang som "Grill …".
  assert.equal(nameMatch("Vändbar grill- och stekplatta i gjutjärn", "grill", namn).kant, 2);
  assert.equal(nameMatch("Grill med lock och termometer", "grill", namn).kant, 6);
  assert.equal(nameMatch("Kolgrill med två sidobord", "grill", namn).kant, 5);
  // Ett bindestreck inne i ett ord är inget hängande: "LED-lampa" är som förut.
  assert.equal(nameMatch("LED-golvlampa med fyra hyllfack", "led", namn).kant, 6);
});

test('"led lampa": LED-lamporna före varorna som har en LED-lampa', () => {
  // www: en bilkretsprovare och en domkraft "med LED-lampa" låg först (88),
  // före varenda "LED-golvlampa" (60).
  const t = traffar("led lampa");
  for (const lampa of ["Dimbar LED-pendellampa", "LED-golvlampa", "Taklampa LED"]) {
    assert.ok(plats(t, lampa) < plats(t, "Bilkretsprovare"), `${lampa} ska stå före bilkretsprovaren`);
    assert.ok(plats(t, lampa) < plats(t, "domkraft"), `${lampa} ska stå före domkraften`);
  }
  assert.equal(nameMatch("LED-golvlampa med fyra hyllfack – 163 cm", "led lampa", namn).score, 92);
  assert.equal(nameMatch("Bilkretsprovare för 6 till 36 V med 4 m kabel och LED-lampa", "led lampa", namn).score, 88);
  // Orden i vilken ordning som helst, och färgen var som helst i namnet.
  assert.equal(nameMatch("Taklampa LED 50 W med fem ljusrör", "led lampa", namn).score, 92);
  assert.equal(nameMatch("Soffa 3-sits i grå sammet", "grå soffa", namn).score, 92);
  // Står ett av orden bara efter huvuddelen är det som förut.
  assert.equal(nameMatch("Sängram 140 × 200 cm med förvaring och LED-belysning", "sängram belysning", namn).score, 60);
});

test('"soffa": sofforna i Soffor & bäddsoffor först, hundsoffan och trädgårdssoffan efter', () => {
  const t = traffar("soffa");
  const hemma = medl(8).length;
  assert.deepEqual(new Set(t.slice(0, hemma)), new Set(medl(8)));
  assert.ok(plats(t, "Hundsoffa") >= hemma && plats(t, "Trädgårdssoffa") >= hemma);
  // "Sidobord för soffan" och "Loungeset med soffa" heter inte soffa och går sist.
  assert.deepEqual(new Set(t.slice(-2)), new Set(["Sidobord för soffan i svart metall", "Loungeset med soffa, två fåtöljer och bord i aluminium"]));
});

// ── 2. Flertal och ental ────────────────────────────────────────────────────

test('"soffor" och "soffa" ger samma varor, utan soffborden', () => {
  // www: "soffor" 181 och "soffa" 140. De 41 extra var soffbord: stammen "soff"
  // står i dem.
  assert.deepEqual(new Set(traffar("soffor")), new Set(traffar("soffa")));
  assert.equal(traffar("soffor").some((n) => /soffbord/i.test(n)), false);
  // Också i en sökning på flera ord.
  assert.equal(traffar("grå soffor").some((n) => /soffbord/i.test(n)), false);
});

test('"lampor", "mattor" och "hyllor": stammen är inget ord för sig', () => {
  assert.deepEqual(new Set(traffar("lampor")), new Set(traffar("lampa")));
  // "matt" står i "mattsvart", som är en färg och ingen matta.
  assert.deepEqual(traffar("mattor").sort(), ["Dörrmatta i grått med halkfri baksida", "Garagematta i filt med vattentät baksida", "Matta 170 × 120 cm i mörkgrått"]);
  // "hyll" står i "hyllplan" och "hyllfack": varorna som HAR hyllor är inga hyllor.
  assert.equal(traffar("hyllor").some((n) => /hyllplan|hyllfack/.test(n)), false);
  assert.ok(traffar("hyllor").includes("Vägghylla i ek, 80 cm"));
});

test('"stolar": stammen "stol" ÄR grundformen, och är som förut', () => {
  // Den som skriver "stol" kan vara på väg mot "stolsdyna", och flertalet ska
  // ge samma lista.
  assert.ok(traffar("stol").includes("Stolsdyna 40 × 40 cm, 4-pack"));
  assert.deepEqual(new Set(traffar("stolar")), new Set(traffar("stol")));
});

// ── 3. Synonymerna ──────────────────────────────────────────────────────────

test('"pläd": filtarna, inte filtren', () => {
  // www: 62 träffar, alla med "filter" i namnet. Gruppen har "filt", och nålen
  // stod i varje filter.
  const t = traffar("pläd");
  assert.deepEqual(t.slice(0, 2).sort(), ["Elektrisk värmefilt 180 × 130 cm", "Fleecefilt 150 × 200 cm i grått"]);
  assert.equal(t.some((n) => /filter/i.test(n)), false);
  // Filten som bara är materialet står sist, efter varorna som är filtar.
  assert.equal(t[t.length - 1], "Garagematta i filt med vattentät baksida");
  // Åt andra hållet: "filter" hittar filtren och inga filtar.
  assert.deepEqual(traffar("filter").sort(), ["Kattlåda med lock och kolfilter", "Sandfilter för pool, flöde 159 l/min", "Vattenautomat för katt och hund med filter"]);
});

test('"bokhylla": bokhyllorna, inte allt med "hyll" i namnet', () => {
  // www: 616 träffar, varav 63 bokhyllor.
  assert.deepEqual(new Set(traffar("bokhylla")), new Set(medl(10)));
  // Det breda ordet hittar fortfarande de smala.
  for (const n of medl(10)) assert.ok(traffar("hylla").includes(n));
});

test('"elcykel", "ficklampa" och "necessär": det smala ordet, eller ett ärligt noll', () => {
  // www: "elcykel" 179 träffar, två displayer till elcyklar och sedan varenda
  // cykelkärra och motionscykel.
  assert.deepEqual(traffar("elcykel"), ["LCD-display S866 till elcykel – 36 V"]);
  // Butiken har ingen ficklampa och ingen necessär: förr gav orden alla
  // golvlampor och allt med en väska.
  assert.deepEqual(traffar("ficklampa"), []);
  assert.deepEqual(traffar("necessär"), []);
  assert.deepEqual(traffar("förvaringsbox"), ["Förvaringsbox 3-pack med lock"]);
});

test('"airfryer": också varorna som heter varmluftsfritös', () => {
  // www: två av sex. Miniugnen "med varmluftsfritös" är en träff, sist.
  const t = traffar("airfryer");
  assert.equal(t[0], "Airfryer 7 liter med glasfönster och 8 program");
  assert.deepEqual(t.slice(1, 3).sort(), ["Varmluftsfritös 5 liter med fönster", "Varmluftsfritös och miniugn 24 liter"]);
  assert.equal(t[3], "Miniugn 30 liter med varmluftsfritös – 1600 W");
  assert.equal(t.length, 4);
  assert.deepEqual(new Set(traffar("varmluftsfritös")), new Set(t));
});

test('"lampa": belysningen som är varan, inte sängramen med LED-belysning först', () => {
  const t = traffar("lampa");
  assert.ok(plats(t, "Julbelysning") >= 0);
  assert.ok(plats(t, "Julbelysning") < plats(t, "Sängram"), "det som bara nämner belysning går sist");
});

test('"snöflockad julgran" och "julren": kundens ord för varor som heter något annat', () => {
  // www: två av granarna med snö, och en av renarna.
  const granar = traffar("snöflockad julgran");
  for (const g of ["Förbelyst snöflockad julgran", "Snötäckt julgran", "Julgran 180 cm med konstsnö"]) assert.ok(plats(granar, g) >= 0, g);
  assert.equal(plats(granar, "Julgran 150 cm"), -1);
  const renar = traffar("julren");
  assert.equal(renar[0], "Julren med lykta 52 cm – julfigur");
  assert.ok(renar.includes("Lysande ren i guld med röd rosett") && renar.includes("Uppblåsbar tomte i släde med två renar"));
  // ☠️ "renar" står i "barrgrenar": nålen bär ett mellanslag först.
  assert.equal(plats(renar, "Julgirlang"), -1);
});

// ── 4. "utan" ───────────────────────────────────────────────────────────────

test('"julgran utan belysning": granarna med belysning väljs bort', () => {
  // www: sju träffar, alla MED belysning, och beskedet att "utan" strukits.
  const u = sok("julgran utan belysning");
  assert.deepEqual(u.inte, ["belysning"]);
  assert.deepEqual(u.strukna, []);
  assert.deepEqual(u.traffar.map((v) => v.n).sort(), ["Julgran 150 cm med 1 724 grenspetsar", "Julgran 180 cm med konstsnö och kottar", "Smal julgran 210 cm med ledade grenar", "Snötäckt julgran 90 cm – 486 grenspetsar"]);
});

test('"utan" väljer också bort orden som betyder samma sak', () => {
  // En kattlåda "med huv" eller "täckt" har lock, och en barstol med "svängd rygg" har ryggstöd.
  assert.deepEqual(traffar("kattlåda utan lock").sort(), ["Självrengörande kattlåda 65 liter", "Öppen kattlåda i rostfritt stål"]);
  assert.deepEqual(traffar("barstol utan ryggstöd").sort(), ["Barpall i massivt trä", "Barstolar 2-pack i industristil"]);
});

test('en vara som heter "… utan armstöd" går först, och väljs inte bort', () => {
  const t = traffar("soffa utan armstöd");
  assert.equal(t[0], "Tvåsitssoffa i manchester utan armstöd");
  assert.equal(t.includes("3-sits soffa 220 cm med armstöd ner mot golvet"), false);
  assert.ok(t.includes("Soffa 3-sits i grå sammet"));
});

test("tolkaUtan: vad som är en nekning och vad som inte är det", () => {
  assert.deepEqual(tolkaUtan("julgran utan belysning"), { fraga: "julgran", inte: ["belysning"] });
  assert.deepEqual(tolkaUtan("soffa utan armstöd och rygg"), { fraga: "soffa", inte: ["armstöd", "rygg"] });
  assert.deepEqual(tolkaUtan("Kontorsstol ej armstöd svart"), { fraga: "kontorsstol svart", inte: ["armstöd"] });
  // Något ska sökas, och något ska nekas.
  assert.equal(tolkaUtan("utan lock"), null);
  assert.equal(tolkaUtan("soffa utan"), null);
  assert.equal(tolkaUtan("soffa grå"), null);
  // Nämner varje träff det nekade ordet gäller sökningen som den skrevs.
  assert.equal(sok("dieselvärmare utan kw").inte, undefined);
});

// ── 5. Frågeord ─────────────────────────────────────────────────────────────

test('"har ni dieselvärmare": frågan hör inte till varan', () => {
  // www: 50 träffar med en massagefåtölj som "har värme" överst, och beskedet
  // att "ni" och "dieselvärmare" strukits. Butiken hade 33 dieselvärmare.
  for (const q of ["har ni dieselvärmare", "finns det dieselvärmare", "jag söker en dieselvärmare", "säljer ni dieselvärmare"]) {
    const u = sok(q);
    assert.deepEqual(u.traffar.map((v) => v.n).sort(), ["Dieselvärmare 5 kW 12 V med LCD-panel", "Dieselvärmare 8 kW med fjärrkontroll"], q);
    assert.deepEqual(u.strukna, [], q);
  }
  assert.deepEqual(new Set(traffar("vilken grill är bäst")), new Set(traffar("grill")));
  // "typ" är inget frågeord: "elbilsladdare typ 2".
  assert.notDeepEqual(traffar("typ"), traffar("har"));
});

// ── 6. Ett ärligt noll ──────────────────────────────────────────────────────

test('"cykelhjälm barn": varan finns inte, och svaret är inte allt för barn', () => {
  // www: 562 träffar, varenda vara för barn, med beskedet att "cykelhjälm" strukits.
  assert.deepEqual(traffar("cykelhjälm barn"), []);
  // Samma sak när det som blir kvar är en färg.
  assert.deepEqual(traffar("röd cykelhjälm"), []);
  // Är det som blir kvar en VARA visas den, med besked: "soffa" är vad varorna heter.
  const u = sok("chesterfield soffa");
  assert.deepEqual(u.strukna, ["chesterfield"]);
  assert.deepEqual(new Set(u.traffar.map((v) => v.n)), new Set(traffar("soffa")));
});

test('"desk": inget kattlådeskåp, och "skåp" hittar det fortfarande', () => {
  // www: fyra "kattlåDESKåp". Inget ord i katalogen börjar eller slutar med "desk".
  const t = traffar("desk");
  assert.equal(t.some((n) => /kattlådeskåp/i.test(n)), false);
  assert.deepEqual(new Set(t), new Set(medl(16)));
  assert.ok(traffar("skåp").includes("Kattlådeskåp i vitt med två dörrar"));
});

// ── 7. Engelska ─────────────────────────────────────────────────────────────

test("engelska fraser byts mot katalogens ord, med besked", () => {
  // www: "christmas tree" och "fire pit" gav noll, "dog bed" en bulldog-koppling.
  for (const [q, ord, vara] of [["christmas tree", "julgran", "Julgran 150 cm"], ["fire pit", "eldstad", "Rökfri eldstad"], ["dog bed", "hundbädd", "Hundbädd med höga kanter"], ["cat tree", "klösträd", "Klösträd 120 cm"], ["Air Fryer", "airfryer", "Airfryer 7 liter"]] as const) {
    const u = sok(q);
    assert.equal(u.rattat, ord, q);
    assert.ok(u.traffar.some((v) => v.n.startsWith(vara)), `${q} ska hitta ${vara}`);
  }
  // Frasen mitt i en längre sökning.
  assert.equal(sok("christmas tree 150 cm").rattat, "julgran 150 cm");
  // En fras vars ord inte ger någon vara byts inte: butiken här har ingen våningssäng.
  assert.equal(sok("bunk bed").rattat, undefined);
});

test("engelska ord i grupperna", () => {
  assert.deepEqual(traffar("greenhouse"), ["Växthus i trä med sluttande tak"]);
  // "bike" står i "mountainbike", och når resten av cyklarna genom gruppen.
  assert.equal(traffar("bike")[0], "Barncykel 20 tum – 7-växlad mountainbike");
  assert.ok(traffar("bike").includes("Motionscykel med magnetmotstånd"));
  // Gallret "för eldstad" nämner bara ordet och går sist.
  assert.deepEqual(new Set(traffar("firepit").slice(0, 3)), new Set(["Rökfri eldstad med askfat", "Eldkorg Ø59 cm med vedhylla under", "Eldskål Ø 45 cm i svart stål"]));
  assert.deepEqual(traffar("firepit").slice(3), ["Runt grillgaller för eldstad, 910 mm"]);
  // Eldstäderna heter eldstad, eldkorg och eldskål om vartannat.
  assert.equal(traffar("eldkorg").length, 4);
  assert.equal(traffar("eldkorg")[0], "Eldkorg Ø59 cm med vedhylla under");
});

// ── 7b. Samma svar på nästan samma sökning ──────────────────────────────────

test('"elbilar för barn" är kategorins namn och ger samma varor som "elbil barn"', () => {
  // www: 52 varor för "elbilar för barn" och 126 för "elbil barn". Småordet
  // "för" räknades som ett ord kategorin inte har, fast den heter så.
  const utan = traffar("elbil barn");
  assert.equal(utan.length, 5);
  assert.deepEqual(utan.slice(0, 2).sort(), ["Elbil Audi TT RS för barn 2–3 år", "Elbil för barn 12 V med fjärrkontroll och mjukstart"]);
  for (const q of ["elbilar för barn", "elbil för barn", "Elbilar för barn", "elbilar barn"]) assert.deepEqual(traffar(q), utan, q);
  // ☠️ Småordet ska stå i kategorins EGET namn: "matbord med stolar" är en
  // matgrupp, inte kategorin Matbord & stolar.
  assert.ok(traffar("matbord stolar").includes("Barpall i massivt trä"));
  assert.equal(traffar("matbord med stolar").includes("Barpall i massivt trä"), false);
  // "till" står inte i kategorins namn: bara varorna som heter så.
  assert.deepEqual(traffar("elbilar till barn").sort(), ["Elbil Audi TT RS för barn 2–3 år", "Elbil för barn 12 V med fjärrkontroll och mjukstart"]);
});

test('"katt träd" och "soff bord": två ord som ihop är ett ord söks som det ordet', () => {
  // www: "katt träd" 13 varor och "kattträd" 96, "ute möbler" 12 och "utemöbler" 254.
  assert.equal(hopskrivetBegrepp("katt träd"), "kattträd");
  assert.equal(hopskrivetBegrepp("svart katt träd 120 cm"), "svart kattträd 120 cm");
  // Ett ord ur katalogen eller en kategori räknas när den som anropar säger att det finns.
  assert.equal(hopskrivetBegrepp("soff bord"), null);
  assert.equal(hopskrivetBegrepp("soff bord", (o) => o === "soffbord"), "soffbord");
  assert.equal(hopskrivetBegrepp("barn möbler", (o) => o === "barnmöbler"), "barnmöbler");
  // Aldrig småord, nekningar, tal eller ett halvskrivet andra ord.
  for (const q of ["för varing", "utan lock", "120 cm", "soff bo", "soffbord", ""]) assert.equal(hopskrivetBegrepp(q, () => true), null, q);

  const trad = sok("katt träd");
  assert.equal(trad.sokt, "kattträd");
  assert.deepEqual(trad.strukna, []);
  assert.deepEqual(trad.traffar.map((v) => v.n), traffar("kattträd"));
  assert.ok(traffar("katt träd").includes("Klösträd 120 cm med grotta"));

  // Ordets varor först, och efter dem det som bara orden isär gav: ingen träff försvinner.
  const bord = traffar("soff bord");
  const ihop = traffar("soffbord");
  assert.ok(ihop.length >= 2);
  assert.deepEqual(bord.slice(0, ihop.length), ihop);
  assert.equal(ihop.includes("Loungeset med soffa, två fåtöljer och bord i aluminium"), false);
  assert.ok(bord.indexOf("Loungeset med soffa, två fåtöljer och bord i aluminium") >= ihop.length);
  // Måste ett ord strykas för att det hopskrivna ska ge något gäller sökningen som den skrevs.
  assert.ok(sok("kattträd dieselvärmare").strukna.length > 0);
  assert.equal(sok("katt träd dieselvärmare").sokt, undefined);
  // Ord som inte är ett ord ihop söks som de står.
  assert.equal(sok("led lampa").sokt, undefined);
  assert.equal(sok("grå matta").sokt, undefined);
});

// ── 8. Söksidan ─────────────────────────────────────────────────────────────

test('"soffa billigast": varorna som heter soffa, billigast först', () => {
  assert.equal(villHaBilligast("soffa billigast"), true);
  assert.equal(villHaBilligast("billigaste soffan"), true);
  assert.equal(villHaBilligast("soffa lägst pris"), true);
  // "billig" är ett önskemål, ingen sortering.
  assert.equal(villHaBilligast("billig soffa"), false);
  assert.equal(varanHeterSa("Hörnsoffa i beige manchester", "soffa"), true);
  assert.equal(varanHeterSa("Sidobord för soffan i svart metall", "soffa"), false);
  assert.equal(varanHeterSa("LED-golvlampa med fyra hyllfack", "led lampa"), true);
  // ☠️ Med ordet som begär ordningen KVAR i sökningen: det är så sidan frågar.
  // Första versionen svarade nej på allt då, och ingenting sorterades.
  for (const q of ["soffa billigast", "billigaste soffa", "soffa lägsta pris", "soffa lägst pris"]) {
    assert.equal(varanHeterSa("Hörnsoffa i beige manchester", q), true, q);
    assert.equal(varanHeterSa("Sidobord för soffan i svart metall", q), false, q);
  }
  assert.equal(varanHeterSa("Julgran 150 cm med 1 724 grenspetsar", "billigaste julgranen"), true);
  // Bara ord som hör till frågan: ingen vara heter så, inte heller den som har ordet i namnet.
  assert.equal(varanHeterSa("Hörnsoffa i beige manchester", "billigast"), false);
  assert.equal(varanHeterSa("Billig julgran 180 cm i grönt", "billig"), false);
  assert.equal(varanHeterSa("Billig julgran 180 cm i grönt", "billig julgran"), true);
  // Hela vägen som sidan går: motorns träffar för sökningen, ordnade med samma tre funktioner.
  const pris: Record<string, number> = { "Soffa 3-sits i grå sammet": 4999, "Hörnsoffa i beige manchester": 7999, "Bäddsoffa med förvaring i chenille": 2999, "Hundsoffa XL med ryggstöd": 899, "Sidobord för soffan i svart metall": 399 };
  const svar = sok("soffa billigast");
  // ☠️ Ordets egen kategori för sig. Motorn säger hur många av de första
  // träffarna som ligger i Soffor & bäddsoffor (`hemma`), och de ordnas efter
  // pris först. Mätt mot katalogen: utan det stod barnsoffor och hundsoffor
  // före varenda soffa, och en leksaksgrill före kolgrillarna.
  assert.equal(svar.hemma, medl(8).length);
  const pa = billigastForst(svar.traffar, (v) => varanHeterSa(v.n, "soffa billigast"), (v) => pris[v.n] ?? 0, svar.hemma).map((v) => v.n);
  assert.deepEqual(pa.slice(0, 3), ["Bäddsoffa med förvaring i chenille", "Soffa 3-sits i grå sammet", "Hörnsoffa i beige manchester"]);
  // Hundsoffan heter soffa och är billigast av alla, men står på en annan hylla: efter sofforna.
  assert.equal(pa.indexOf("Hundsoffa XL med ryggstöd"), medl(8).length);
  // Sidobordet är billigare än allt men heter inte soffa.
  assert.ok(pa.indexOf("Sidobord för soffan i svart metall") > pa.indexOf("Trädgårdssoffa i grå polyrotting"));
  // Utan besked om hemmet ordnas alla som heter så tillsammans (sökningar på flera ord).
  const utanHem = billigastForst(svar.traffar, (v) => varanHeterSa(v.n, "soffa billigast"), (v) => pris[v.n] ?? 0).map((v) => v.n);
  assert.equal(utanHem[0], "Hundsoffa XL med ryggstöd");
  // "utan" behåller hemmet: sofforna i sin kategori först, den som heter "utan armstöd" överst.
  const utan = sok("soffa utan armstöd");
  assert.equal(utan.traffar[0].n, "Tvåsitssoffa i manchester utan armstöd");
  assert.ok(utan.hemma !== undefined && utan.hemma > 0 && utan.hemma <= medl(8).length);
  assert.deepEqual(new Set(utan.traffar.slice(0, utan.hemma).map((v) => v.n)).size, utan.hemma);
  for (const v of utan.traffar.slice(0, utan.hemma)) assert.ok(medl(8).includes(v.n), v.n);
  assert.equal(varanHeterSa("Tvåsitssoffa i manchester utan armstöd", "soffa utan armstöd billigast"), true);
  // En sökning utan egen kategori bär inget `hemma`.
  assert.equal(sok("stolar").hemma, undefined);
  // ☠️ Inte hela listan efter pris: överdraget är billigast och är ingen soffa.
  const t = [{ n: "Soffa A", kr: 4999 }, { n: "Överdrag till soffa", kr: 199 }, { n: "Soffa B", kr: 2999 }, { n: "Soffa utan pris", kr: 0 }, { n: "Soffa C", kr: 2999 }];
  const ordnade = billigastForst(t, (x) => x.n.startsWith("Soffa"), (x) => x.kr).map((x) => x.n);
  assert.deepEqual(ordnade, ["Soffa B", "Soffa C", "Soffa A", "Soffa utan pris", "Överdrag till soffa"]);
});

test('☠️ "soffa lägsta pris": prisorden hör till frågan, inte till varan', () => {
  // Mätt samma dag: "soffa" ströks och svaret var tre anslagstavlor, för
  // "lägsta" lästes som ett varuord och står mitt i "ansLAGSTAvla".
  const soffor = traffar("soffa");
  assert.ok(soffor.length >= 7);
  for (const q of ["soffa lägsta pris", "soffa lägst pris", "lägsta priset soffa", "soffa billigast"]) {
    assert.deepEqual(sok(q).strukna, [], q);
    assert.deepEqual(traffar(q), soffor, q);
    assert.equal(villHaBilligast(q), true, q);
  }
  assert.equal(traffar("soffa lägsta pris").some((n) => n.startsWith("Anslagstavla")), false);
});

test("billigast: sökrutan och resultatsidan ger samma ordning", () => {
  // Rutan läser priset ur indexets text ("1 599 kr"), sidan ur varans tal
  // (1 599,40). Jämförs ören står tre varor som alla visar 1 599 kr i olika
  // ordning på de två ställena.
  const varor = [
    { n: "Soffa A", tal: 1599.4 }, { n: "Soffa B", tal: 1599 }, { n: "Soffa C", tal: 1598.6 },
    { n: "Soffa D", tal: 1000.4 }, { n: "Soffa E", tal: 999.6 }, { n: "Soffa F", tal: 0 },
  ];
  const text = (kr: number) => (kr > 0 ? `${String(Math.round(kr)).replace(/\B(?=(\d{3})+(?!\d))/g, "\u00a0")} kr` : "");
  assert.equal(text(1599.4), "1\u00a0599 kr");
  const sidan = billigastForst(varor, () => true, (v) => lagstaPris({ priceNum: v.tal })).map((v) => v.n);
  const rutan = billigastForst(varor, () => true, (v) => prisTal(text(v.tal))).map((v) => v.n);
  assert.deepEqual(sidan, rutan);
  assert.deepEqual(sidan, ["Soffa D", "Soffa E", "Soffa A", "Soffa B", "Soffa C", "Soffa F"]);
  // Från-priset är samma tal på båda ställena.
  assert.equal(prisTal("Från 1\u00a0659 kr"), 1659);
  assert.equal(lagstaPris({ hasRange: true, priceFromNum: 1659, priceNum: 1899 }), 1659);
  // Rutan ordnar med samma tre funktioner som sidan (lib/sok-rankning.ts går inte att ladda här).
  const rutansKod = readFileSync(new URL("./sok-rankning.ts", import.meta.url), "utf8");
  assert.match(rutansKod, /billigastForst\(utfall\.traffar, \(h\) => varanHeterSa\(h\.n, term\), \(h\) => prisTal\(h\.p\), utfall\.hemma\)/);
});

test('"rea" och "fyndauktion" namnger en sida, inte en vara', () => {
  // Mätt samma dag: "rea" gav fem julgirlanger med REAlistiska barrgrenar,
  // "rean", "fyndauktion" och "auktion" noll träffar.
  assert.ok(traffar("rea").some((n) => n.includes("realistiska")));
  assert.equal(sidaForSokning("rea", true), "/rea");
  assert.equal(sidaForSokning("  REA ", true), "/rea");
  assert.equal(sidaForSokning("rean", true), "/rea");
  // Utan reavaror är reasidan tom: då söks ordet som förut.
  assert.equal(sidaForSokning("rea", false), null);
  assert.equal(sidaForSokning("fyndauktion", false), "/fyndauktion");
  assert.equal(sidaForSokning("Fyndauktionen", true), "/fyndauktion");
  assert.equal(sidaForSokning("fyndaktion", false), "/fyndauktion");
  assert.equal(sidaForSokning("auktion", false), "/fyndauktion");
  // Bara hela sökningen: med en vara i är det en sökning på varan.
  for (const q of ["rea soffa", "auktion klocka", "realistisk julgran", "fynd", ""]) assert.equal(sidaForSokning(q, true), null, q);
  // Kampanjorden är ett beslut om kampanjen och står inte i listan.
  assert.equal(sidaForSokning("black friday", true), null);
  assert.equal(sidaForSokning("black week", true), null);
  // Sidorna finns, och söksidan skickar dit UTANFÖR try: redirect kastar.
  for (const s of ["rea", "fyndauktion"]) assert.ok(existsSync(new URL(`../app/${s}/page.tsx`, import.meta.url)), s);
  const sida = readFileSync(new URL("../app/sok/page.tsx", import.meta.url), "utf8");
  assert.match(sida, /const \{ tree, hasSale \} = await sidhuvudsdata\(\);\s+harRea = hasSale;/);
  assert.match(sida, /\} catch \{\s+\/\/ hellre inga kategorier än en trasig söksida\s+\}\s+(?:\/\/[^\n]*\n\s*)+const sida = sidaForSokning\(term, harRea\);\s+if \(sida\) redirect\(sida\);/);
});

test('"under 500": en ensam prisgräns är ingen sökning på ord', () => {
  // www: 26 varor med "500" i namnet.
  assert.equal(baraPrisgrans("under 500"), 500);
  assert.equal(baraPrisgrans("Under 500 kr"), 500);
  assert.equal(baraPrisgrans("max 1 000 kr"), 1000);
  assert.equal(baraPrisgrans("under 200 kr"), 200);
  // Utan "kr" är ett litet tal ett mått, och "över" har ingen sida.
  assert.equal(baraPrisgrans("under 200"), null);
  assert.equal(baraPrisgrans("över 500"), null);
  assert.equal(baraPrisgrans("soffa under 500"), null);
  assert.equal(baraPrisgrans("under 500 kr soffa"), null);
  // Sökningar med ord tolkas som förut.
  assert.deepEqual(tolkaPris("kontorsstol under 1000"), { fraga: "kontorsstol", max: 1000 });
  // Gränserna är de som har en sida.
  const sidor = /export const PRICE_TIERS = \[([^\]]+)\]/.exec(readFileSync(new URL("./seo/programmatic.ts", import.meta.url), "utf8"));
  assert.deepEqual(sidor![1].split(",").map((x) => Number(x.trim())), [...PRISSIDOR]);
  const sida = readFileSync(new URL("../app/sok/page.tsx", import.meta.url), "utf8");
  // Gränser med en sida går dit, andra tak till alla varor med taket som filter.
  assert.equal(sidaForPristak("under 500"), "/under-500-kr");
  assert.equal(sidaForPristak("max 1 000 kr"), "/under-1000-kr");
  assert.equal(sidaForPristak("under 300 kr"), "/alla-produkter?pris=under-300");
  assert.equal(sidaForPristak("högst 750 kr"), "/alla-produkter?pris=under-750");
  // Listans prisreglage läser just den adressen.
  assert.deepEqual(parsePriceSlug("under-300"), { min: 0, max: 300 });
  // Ett golv, ett litet tal utan "kr" och en sökning med ord går inte dit.
  for (const q of ["över 5000 kr", "under 200", "soffa under 500", ""]) assert.equal(sidaForPristak(q), null, q);
  assert.match(sida, /const prissida = sidaForPristak\(term\);\s+if \(prissida\) redirect\(prissida\);/);
});

test("söksidan säger vad den valt bort och hur den ordnat", () => {
  const vy = readFileSync(new URL("../components/sok-vy.tsx", import.meta.url), "utf8");
  assert.match(vy, /klar\.inte && klar\.inte\.length > 0/);
  assert.match(vy, /klar\.billigast &&/);
  // Antalet följer listans filter: "Visar 64 av 123 produkter".
  assert.match(vy, /`Visar \$\{tusental\(filtrerat\)\} av \$\{productCountLabel\(antal\)\}`/);
  assert.match(vy, /onAntal=\{omAntal\}/);
  // Båda vägarna skickar beskeden vidare.
  for (const fil of ["../app/sok/page.tsx", "../components/sok-kall.tsx"]) {
    const kod = readFileSync(new URL(fil, import.meta.url), "utf8");
    assert.match(kod, /\binte\b/, fil);
    assert.match(kod, /billigastForst\(/, fil);
  }
});

test("☠️ de stora listorna: webbläsarens cachetid är lika lång som CDN:ts", () => {
  // Mätt på www 2026-11-21: sökindexet kom med `age: 2356` och `max-age=300`,
  // alltså för gammalt redan när det kom fram, utan ETag. Varje sidladdning
  // hämtade om 561 kB (varulistan 792 kB, bildkartan 410 kB).
  for (const fil of ["../app/api/search-index/route.ts", "../app/api/lista/route.ts", "../app/api/kort-bilder/route.ts"]) {
    const m = /const CACHE = "public, max-age=(\d+), s-maxage=(\d+), stale-while-revalidate=\d+";/.exec(readFileSync(new URL(fil, import.meta.url), "utf8"));
    assert.ok(m, `${fil}: hittar inte CACHE`);
    assert.equal(m[1], m[2], `${fil}: max-age ska vara lika med s-maxage`);
  }
});
