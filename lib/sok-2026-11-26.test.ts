// Run: node --test --experimental-strip-types lib/sok-2026-11-26.test.ts
//
// Märket ensamt eller halvskrivet, och namnet halvskrivet (Leonard 2026-11-26).
// Leonard skrev "hom", början på jämförelsesajtens namn på en elbil, och
// sökrutan sa "Inga produkter matchade". Mätt mot www samma natt gav "hom",
// "homc", "homco" och "homcom" noll, och varan stod först när hela namnet var
// skrivet, inte förr.
//
//   1. Märket, och en början på minst tre bokstäver som bara passar ett
//      märke, ger varorna som säljs under märket hos jämförelsesajterna.
//   2. Sökningens egna träffar går före: "vin" är vinställ, inte Vinsetto.
//   3. Varje början på namnet har en egen nyckel från fyra ord, och sökningen
//      prövas utan ordet som håller på att skrivas.
//   4. Varken ett namn eller ett märke står i klartext i det som byggs.
//
// ☠️ Namnet här är det enda som redan står i butikens anvisning (Leonards
// skärmbild 2026-11-22). Övriga rader är påhittade.
import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import {
  BORJAN_MINST_ORD,
  LEVERANTORSMARKEN,
  MARKE_MINST_BOKSTAVER,
  markeForstINamn,
  markeUrBorjan,
  markesSvar,
  markesnamn,
  markesnyckel,
  namnetsNycklar,
  namnnyckel,
  rankaMedInfo,
  sokningensNycklar,
  type Kategoridata,
  type SokKat,
  type Sokutfall,
} from "./search.ts";
import { NAMNNYCKLAR } from "./namnnycklar-data.ts";
import { byggNycklar, somModul } from "../tools/namnnycklar/bygg.ts";

const ROT = new URL("..", import.meta.url).pathname;
const las = (...delar: string[]) => readFileSync(join(ROT, ...delar), "utf8");

type Vara = { n: string; s: string; k: number[] };
const KAT: SokKat[] = [
  { n: "Leksaker & Spel", f: -1 }, // 0
  { n: "Elbilar för barn", f: 0 }, // 1
  { n: "Hem & Inredning", f: -1 }, // 2
  { n: "Vinställ", f: 2 }, // 3
];
const VAROR: Vara[] = [
  { n: "Elbil MINI Cooper för barn 12 V med fjärrkontroll och två hastighetslägen", s: "elbil-mini", k: [1] },
  { n: "Elbil barn SUV 12V – svart åkbil med fjärrkontroll, MP3 och bälte, 3–6 år", s: "elbil-suv", k: [1] },
  { n: "Fällbart skrivbord i vitt med hylla", s: "skrivbord", k: [2] },
  { n: "Vinställ i bambu för tolv flaskor", s: "vinstall", k: [3] },
  { n: "Flaskhylla i svart metall, väggmonterad", s: "flaskhylla", k: [3] },
  { n: "Klösträd 72 cm med klösbåge", s: "klostrad", k: [2] },
  { n: "Utbytbar form för VEVOR knappmaskin", s: "knappform", k: [2] },
  { n: "Hundgård med tak för utomhusbruk", s: "hundgard", k: [2] },
];

const SUV_NAMN = "Homcom Barnelbil Med 2.4 G Fjärrkontroll";
const NYCKLAR: Record<string, string[]> = {
  "elbil-suv": [...namnetsNycklar(SUV_NAMN), markesnyckel("homcom")],
  skrivbord: [markesnyckel("homcom")],
  flaskhylla: [markesnyckel("vinsetto")],
  klostrad: [markesnyckel("pawhut")],
  hundgard: [markesnyckel("vevor")],
};
const MED: Kategoridata<Vara> = { kat: KAT, av: (v) => v.k, nycklar: (v) => NYCKLAR[v.s] };
const UTAN: Kategoridata<Vara> = { kat: KAT, av: (v) => v.k };
const sok = (q: string, kd = MED): Sokutfall<Vara> => rankaMedInfo(VAROR, (v) => v.n, q, undefined, kd);
const adresser = (u: Sokutfall<Vara>) => u.traffar.map((v) => v.s);

test("☠️ märket, och början på det, ger varorna som säljs under märket: inte noll", () => {
  for (const q of ["hom", "homc", "homco", "homcom", "Homcom", "HOMCOM", "Homcom:", " homcom "]) {
    const u = sok(q);
    assert.deepEqual(adresser(u), ["elbil-suv", "skrivbord"], q);
    assert.equal(u.marke, "homcom", q);
    // Bara varorna, märket och en tom lista strukna ord: inget besked om en sökning på ord.
    assert.deepEqual(Object.keys(u).sort(), ["marke", "strukna", "traffar"], q);
    assert.deepEqual(u.strukna, []);
  }
  assert.deepEqual(adresser(sok("paw")), ["klostrad"]);
  assert.equal(sok("pawhut").marke, "pawhut");
  // Utan märkesnycklar (ett index utan dem) är svaret som förut: noll.
  for (const q of ["hom", "homcom", "paw"]) {
    assert.deepEqual(sok(q, UTAN).traffar, [], q);
    assert.equal(sok(q, UTAN).marke, undefined, q);
  }
  // Ett märke som ingen vara bär ger också noll som förut.
  assert.deepEqual(sok("outsunny").traffar, []);
  assert.deepEqual(sok("outs").traffar, []);
});

test("bara ETT ord på minst tre bokstäver som passar exakt ett märke", () => {
  assert.equal(MARKE_MINST_BOKSTAVER, 3);
  assert.equal(markeUrBorjan("hom"), "homcom");
  assert.equal(markeUrBorjan("Homcom®"), "homcom");
  assert.equal(markeUrBorjan("outs"), "outsunny");
  for (const q of ["", "h", "ho", "homcom barn", "barn homcom", "homcomx", "xyz", "fyn", "fyndplats", "elbil"]) {
    assert.equal(markeUrBorjan(q), null, q);
  }
  // Ingen början på tre bokstäver passar två märken: annars hade regeln aldrig svarat för dem.
  const sokbara = LEVERANTORSMARKEN.filter((m) => m !== "fyndplats");
  for (const m of sokbara) assert.equal(markeUrBorjan(m.slice(0, 3)), m, m);
  // Två bokstäver i sökningen är aldrig ett märke: "ho" är en diskho.
  assert.equal(sok("ho").marke, undefined);
});

test("☠️ sökningens egna träffar går före märket: \"vin\" är vinställ, inte Vinsetto", () => {
  for (const q of ["vin", "vins"]) {
    const u = sok(q);
    assert.equal(u.marke, undefined, q);
    assert.ok(adresser(u).includes("vinstall"), q);
    assert.ok(!adresser(u).includes("flaskhylla"), q);
    assert.deepEqual(adresser(u), adresser(sok(q, UTAN)), q);
  }
  // Först när inget namn börjar så är det märket.
  const u = sok("vinse");
  assert.equal(u.marke, "vinsetto");
  assert.deepEqual(adresser(u), ["flaskhylla"]);
  // En början som också är ett varuord i ett namn ("vev" i VEVOR knappmaskin) är sökningens.
  assert.equal(sok("vev").marke, undefined);
});

test("hela märket: märkets varor först, och under dem varorna som nämner märket", () => {
  const u = sok("vevor");
  assert.equal(u.marke, "vevor");
  assert.deepEqual(adresser(u), ["hundgard", "knappform"]);
  assert.deepEqual(adresser(sok("vevor", UTAN)), ["knappform"]);
});

test("markesSvar: reglerna en och en", () => {
  const a = VAROR[0], b = VAROR[1], c = VAROR[2];
  const tomt: Sokutfall<Vara> = { traffar: [], strukna: [] };
  // Inga varor under märket: svaret är orört, samma objekt.
  assert.equal(markesSvar(tomt, [], "homcom", true), tomt);
  // Egna träffar och bara en början: orört.
  const egna: Sokutfall<Vara> = { traffar: [a], strukna: [] };
  assert.equal(markesSvar(egna, [b], "homcom", false), egna);
  // Egna träffar och hela märket: märkets varor först, ingen vara två gånger.
  assert.deepEqual(markesSvar({ traffar: [a, b], strukna: [] }, [b, c], "homcom", true), { traffar: [b, c, a], strukna: [], marke: "homcom" });
  // ☠️ Ett märke är inget stavfel: en rättad stavning och träffar som bara ligger nära räknas inte som egna.
  assert.deepEqual(markesSvar({ traffar: [a], strukna: [], rattat: "hem" }, [b], "homcom", false), { traffar: [b], strukna: [], marke: "homcom" });
  assert.deepEqual(markesSvar({ traffar: [a], strukna: [], liknande: true }, [b], "homcom", false), { traffar: [b], strukna: [], marke: "homcom" });
});

test("märket som det skrivs för kunden", () => {
  assert.equal(markesnamn("homcom"), "Homcom");
  assert.equal(markesnamn("pawhut"), "PawHut");
  assert.equal(markesnamn("vevor"), "VEVOR");
  assert.equal(markeForstINamn(SUV_NAMN), "homcom");
  assert.equal(markeForstINamn("HOMCOM® Soffa Grå Tyg"), "homcom");
  assert.equal(markeForstINamn("Soffa Från Homcom Grå"), null);
  assert.equal(markeForstINamn("Fyndplats Soffa Grå Tyg"), null);
  assert.equal(markeForstINamn(""), null);
});

test("☠️ namnet halvskrivet: varan står först från fyra ord, och med nästa ord påbörjat", () => {
  assert.equal(BORJAN_MINST_ORD, 4);
  // Fem ord när märket är borta: hela namnet, och början på fyra ord.
  const nycklar = namnetsNycklar(SUV_NAMN);
  assert.equal(nycklar.length, 2);
  assert.equal(nycklar[0], namnnyckel(SUV_NAMN));
  assert.equal(nycklar[1], namnnyckel("Homcom Barnelbil Med 2.4 G"));
  assert.equal(new Set(nycklar).size, 2);
  // Tre ord är en nyckel bara när de är hela namnet.
  assert.deepEqual(namnetsNycklar("Homcom Barnelbil Med Fjärrkontroll"), [namnnyckel("Barnelbil Med Fjärrkontroll")]);
  assert.deepEqual(namnetsNycklar("Homcom Barnelbil"), []);

  // Sökningen: alla orden, och orden utan det sista när minst fyra är kvar.
  assert.deepEqual(sokningensNycklar("homcom barnelbil med 2.4 g fjärr"), [namnnyckel("barnelbil med 2.4 g fjärr"), nycklar[1]]);
  assert.deepEqual(sokningensNycklar("barnelbil med 2.4 g"), [nycklar[1]]);
  assert.deepEqual(sokningensNycklar("barnelbil med 2.4"), [namnnyckel("barnelbil med 2.4")]);
  assert.deepEqual(sokningensNycklar("barnelbil med"), []);

  // Steg för steg, som kunden skriver. Före fyra ord är det en sökning på ord.
  for (const q of ["homcom barnelbil", "homcom barnelbil med", "Homcom Barnelbil Med 2.4"]) {
    assert.equal(sok(q).namn, undefined, q);
  }
  for (const q of ["Homcom Barnelbil Med 2.4 G", "homcom barnelbil med 2.4 g f", "homcom barnelbil med 2.4 g fjärrk", SUV_NAMN, "barnelbil med 2,4 g fjärrkontroll"]) {
    const u = sok(q);
    assert.equal(u.namn, 1, q);
    assert.equal(u.traffar[0].s, "elbil-suv", q);
  }
  // Ett namn som skiljer sig före det sista ordet är ett annat namn.
  assert.equal(sok("homcom barnelbil med 2.4 kanaler fjärrkontroll").namn, undefined);
});

test("verktyget: en nyckel per början, och märket som en summa – aldrig i klartext", () => {
  const rad = (pr_namn: string, slug: string) => ({ pr_namn, sakerhet: "A", slug });
  const bygge = byggNycklar(
    [rad(SUV_NAMN, "elbil-suv"), rad("Homcom Skrivbord Vitt", "skrivbord"), rad("Pawhut Klösträd Med Klösbåge Och Två Plattformar", "klostrad"), rad("Lådhurts Vit Bred Modell", "hurts")],
    new Set(["A"]),
    () => true,
  );
  assert.deepEqual(bygge.perVara["elbil-suv"], [...namnetsNycklar(SUV_NAMN), markesnyckel("homcom")].sort());
  // För få ord för en nyckel, men märket gäller varan ändå.
  assert.deepEqual(bygge.perVara.skrivbord, [markesnyckel("homcom")]);
  // Inget märke i namnet: bara namnets nycklar.
  assert.deepEqual(bygge.perVara.hurts, [...namnetsNycklar("Lådhurts Vit Bred Modell")].sort());
  assert.equal(bygge.rakning.medMarke, 3);
  assert.equal(bygge.rakning.marke_homcom, 2);
  assert.equal(bygge.rakning.marke_pawhut, 1);
  assert.equal(bygge.rakning.forFaOrd, 1);
  const text = JSON.stringify(bygge.perVara) + somModul(bygge.perVara, "2026-11-26", "A");
  for (const ord of ["homcom", "pawhut", "barnelbil", "klösträd", "lådhurts"]) assert.equal(text.toLowerCase().includes(ord), false, ord);
  // Märkesnyckeln är två ord och kan aldrig vara ett namns nyckel (minst tre).
  assert.match(markesnyckel("homcom"), /^[0-9a-z]{6,11}$/);
  assert.notEqual(markesnyckel("homcom"), markesnyckel("pawhut"));
});

test("datafilen bär märkesnycklarna, och inget märke i klartext", () => {
  const medHomcom = Object.values(NAMNNYCKLAR).filter((n) => n.includes(markesnyckel("homcom"))).length;
  assert.ok(medHomcom >= 100, `bara ${medHomcom} varor under Homcom`);
  const fil = las("lib", "namnnycklar-data.ts").toLowerCase();
  for (const m of LEVERANTORSMARKEN) assert.equal(fil.includes(m), false, m);
});

test("vyerna säger vilket märke listan gäller", () => {
  const ruta = las("components", "searchbox.tsx");
  assert.match(ruta, /setMarkeFor\(!visar && svar\.marke \? \{ q: val, marke: svar\.marke \} : null\);/);
  assert.match(ruta, /marke \? `Säljs som \$\{marke\} hos prisjämförelsesajterna`/);
  assert.match(ruta, /\(kategorier\.length > 0 \|\| harPris\(pris\) \|\| visar \|\| marke \|\| liknande\)/);
  assert.equal((ruta.match(/setMarkeFor\(null\);/g) ?? []).length, 2);
  // Sökrutans rankning och de två vägarna till söksidan skickar märket vidare, skrivet för kunden.
  assert.match(las("lib", "sok-rankning.ts"), /\.\.\.\(utfall\.marke && kvar\.length > 0 \? \{ marke: markesnamn\(utfall\.marke\) \} : \{\}\),/);
  assert.match(las("app", "sok", "page.tsx"), /if \(utfall\.marke\) marke = markesnamn\(utfall\.marke\);/);
  assert.match(las("app", "sok", "page.tsx"), /\.\.\.\(marke \? \{ marke \} : \{\}\),/);
  assert.match(las("components", "sok-kall.tsx"), /\.\.\.\(u\.marke \? \{ marke: markesnamn\(u\.marke\) \} : \{\}\),/);
  assert.match(las("components", "sok-vy.tsx"), /De här varorna säljs som <b>\{klar\.marke\}<\/b> hos prisjämförelsesajterna\./);
});
