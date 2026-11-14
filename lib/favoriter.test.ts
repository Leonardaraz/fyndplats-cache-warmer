// Favoriterna (lib/favoriter.ts): listan i webbläsaren, ändringarna mot
// kontot och det lådan visar.

import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import {
  FAVORIT_FORSOK,
  MAX_FAVORITER,
  MAX_KO,
  SYNK_LADA_MS,
  SYNK_MAX_ALDER_MS,
  UTLOGGNING,
  andraILager,
  efterSvar,
  favoritFraga,
  favoriterUrRad,
  favoritrader,
  favoritsvar,
  gallraInfo,
  giltigFavorit,
  handling,
  koSomAndring,
  lasAndring,
  lasInfo,
  lasKo,
  lasLista,
  lasMarkor,
  lasSluggar,
  medInfo,
  namnUrSlug,
  somFavoritProdukt,
  synkplan,
  tillampa,
  utanSkickade,
  vaxla,
  vidUtloggning,
  type FavoritFormat,
  type FavoritKalla,
  type FavoritProdukt,
  type Favoritlager,
  type Koad,
} from "./favoriter.ts";
import { giltigSlug } from "./kontakt/kontakt.ts";

const rot = new URL("../", import.meta.url);
const las = (fil: string) => readFileSync(new URL(fil, rot), "utf8");

const P = (over: Partial<FavoritProdukt> = {}): FavoritProdukt => ({
  slug: "julgran-180-cm",
  id: "11111111-1111-4111-8111-111111111111",
  namn: "Konstgjord julgran 180 cm",
  bild: "https://static.wixstatic.com/media/a.jpg",
  pris: "1 149 kr",
  prisNum: 1149,
  iLager: true,
  val: false,
  ...over,
});

// ── Listan ────────────────────────────────────────────────────────────────

test("en favorit är en produktadress, med samma regel som kontaktformuläret", () => {
  const prov = ["julgran-180-cm", "a", "9-x", "", "-borjar-med-streck", "Stor", "med mellanslag", "å", "a/b", "a".repeat(160), "a".repeat(161), null, 7, undefined];
  for (const p of prov) assert.equal(giltigFavorit(p), giltigSlug(p), String(p));
  assert.equal(giltigFavorit("julgran-180-cm"), true);
  assert.equal(giltigFavorit("../admin"), false);
});

test("lasLista tål allt som kan stå i webbläsarens minne", () => {
  assert.deepEqual(lasLista('["a","b"]'), ["a", "b"]);
  assert.deepEqual(lasLista(["a", "b"]), ["a", "b"]);
  // Trasig JSON, fel typ och tomt ger en tom lista, aldrig ett kast.
  for (const skrap of ["{", "", null, undefined, 7, "7", '{"a":1}', '"a"']) assert.deepEqual(lasLista(skrap), [], String(skrap));
  // Ogiltiga poster faller bort, och en dubblett räknas en gång (den första står kvar).
  assert.deepEqual(lasLista(["a", "Stor", 7, null, "b", "a", "../x"]), ["a", "b"]);
});

test("listan rymmer hundra favoriter: de nyaste står kvar", () => {
  // Hela listan ska rymmas i ETT uppslag mot butiken: taket får aldrig gå om uppslagets.
  assert.equal(MAX_FAVORITER, 100);
  const uppslag = /export const MAX_SLUGGAR_PER_UPPSLAG = (\d+);/.exec(las("lib/products.ts"));
  assert.ok(uppslag && MAX_FAVORITER <= Number(uppslag[1]), "listan ryms inte i ett uppslag");
  const manga = Array.from({ length: MAX_FAVORITER + 5 }, (_, i) => `vara-${i}`);
  const kapad = lasLista(manga);
  assert.equal(kapad.length, MAX_FAVORITER);
  assert.equal(kapad[0], "vara-5");
  assert.equal(kapad.at(-1), `vara-${MAX_FAVORITER + 4}`);
  // Samma tak när en ny läggs till en full lista.
  const full = Array.from({ length: MAX_FAVORITER }, (_, i) => `vara-${i}`);
  const efter = vaxla(full, "ny-vara");
  assert.equal(efter.length, MAX_FAVORITER);
  assert.equal(efter[0], "vara-1");
  assert.equal(efter.at(-1), "ny-vara");
});

test("vaxla lägger till sist och tar bort den som finns", () => {
  assert.deepEqual(vaxla(["a"], "b"), ["a", "b"]);
  assert.deepEqual(vaxla(["a", "b"], "a"), ["b"]);
  // En ogiltig adress ändrar ingenting.
  assert.deepEqual(vaxla(["a"], "Inte En Adress"), ["a"]);
  // Listan som gick in är orörd.
  const fore = ["a"];
  vaxla(fore, "b");
  assert.deepEqual(fore, ["a"]);
});

test("tillampa: borttagningar först, sedan tillägg sist, utan dubbletter", () => {
  assert.deepEqual(tillampa(["a", "b", "c"], { lagg: ["d"], taBort: ["b"] }), ["a", "c", "d"]);
  // Det som redan finns behåller sin plats.
  assert.deepEqual(tillampa(["a", "b"], { lagg: ["a", "c"], taBort: [] }), ["a", "b", "c"]);
  // Samma adress i båda: den läggs till (tas bort och läggs sist).
  assert.deepEqual(tillampa(["a", "b"], { lagg: ["a"], taBort: ["a"] }), ["b", "a"]);
  // Ingen ändring ger samma innehåll.
  assert.deepEqual(tillampa(["a"], { lagg: [], taBort: [] }), ["a"]);
  assert.deepEqual(tillampa(["a"], { lagg: [], taBort: ["finns-inte"] }), ["a"]);
});

// ── Rutternas indata ──────────────────────────────────────────────────────

test("lasAndring godtar bara listor av produktadresser", () => {
  assert.deepEqual(lasAndring({ lagg: ["a"], taBort: ["b"] }), { lagg: ["a"], taBort: ["b"] });
  assert.deepEqual(lasAndring({ lagg: ["a"] }), { lagg: ["a"], taBort: [] });
  assert.deepEqual(lasAndring({}), { lagg: [], taBort: [] });
  // Fel form nekas helt: en halv ändring ska inte sparas.
  for (const fel of [null, 7, "a", [], { lagg: "a" }, { lagg: ["Stor"] }, { taBort: [7] }, { lagg: ["a"], taBort: ["../x"] }]) {
    assert.equal(lasAndring(fel), null, JSON.stringify(fel));
  }
  // Fler än listan rymmer nekas.
  assert.equal(lasAndring({ lagg: Array.from({ length: MAX_FAVORITER + 1 }, (_, i) => `v-${i}`) }), null);
  // Dubbletter i anropet räknas en gång.
  assert.deepEqual(lasAndring({ lagg: ["a", "a"] }), { lagg: ["a"], taBort: [] });
});

test("lasSluggar läser frågans lista och favoritFraga bygger den", () => {
  assert.deepEqual(lasSluggar("b,a"), ["b", "a"]);
  assert.deepEqual(lasSluggar("a,,a,Stor,b"), ["a", "b"]);
  for (const tomt of [null, "", ",", "Stor,../x"]) assert.equal(lasSluggar(tomt), null, String(tomt));
  assert.equal(lasSluggar(Array.from({ length: MAX_FAVORITER + 1 }, (_, i) => `v-${i}`).join(","))?.length, MAX_FAVORITER);
  // Adressen är densamma oavsett ordning, så att samma lista delar svar i CDN:et.
  assert.equal(favoritFraga(["b", "a"]), "/api/favoriter?s=a,b");
  assert.equal(favoritFraga(["a", "b"]), favoritFraga(["b", "a"]));
  assert.deepEqual(lasSluggar(new URL(favoritFraga(["julgran-180-cm", "a"]), "https://x.se").searchParams.get("s")), ["a", "julgran-180-cm"]);
});

// ── Kön med ändringar som inte nått kontot ───────────────────────────────

test("kön: den sista ändringen per vara gäller", () => {
  const ko: Koad[] = [
    { t: "l", s: "a" },
    { t: "b", s: "a" },
    { t: "l", s: "b" },
    { t: "b", s: "c" },
    { t: "l", s: "c" },
  ];
  assert.deepEqual(koSomAndring(ko), { lagg: ["b", "c"], taBort: ["a"] });
  assert.deepEqual(koSomAndring([]), { lagg: [], taBort: [] });
});

test("lasKo tål skräp och har ett tak", () => {
  assert.deepEqual(lasKo('[{"t":"l","s":"a"},{"t":"b","s":"b"}]'), [{ t: "l", s: "a" }, { t: "b", s: "b" }]);
  assert.deepEqual(lasKo('[{"t":"x","s":"a"},{"t":"l","s":"Stor"},7,null,{"t":"l"}]'), []);
  for (const skrap of ["{", null, undefined, 7, "{}"]) assert.deepEqual(lasKo(skrap), []);
  const lang = Array.from({ length: MAX_KO + 10 }, (_, i) => ({ t: "l", s: `v-${i}` }));
  assert.equal(lasKo(lang).length, MAX_KO);
  // De senaste ändringarna är de som står kvar.
  assert.equal(lasKo(lang).at(-1)?.s, `v-${MAX_KO + 9}`);
});

test("lasMarkor känner bara sina två värden", () => {
  assert.equal(lasMarkor("1"), "1");
  assert.equal(lasMarkor("ut"), "ut");
  for (const annat of [null, undefined, "", "0", "ja", 1]) assert.equal(lasMarkor(annat), null);
});

// ── Synkplanen ────────────────────────────────────────────────────────────

const NU = 1_800_000_000_000;
const lage = (over: Partial<Parameters<typeof synkplan>[0]> = {}) => ({
  inne: false,
  markor: null,
  lokal: [] as string[],
  ko: [] as Koad[],
  senastMs: 0,
  nuMs: NU,
  maxAlderMs: SYNK_MAX_ALDER_MS,
  ...over,
});

test("utloggad besökare: listan är webbläsarens egen och ingenting skickas", () => {
  assert.deepEqual(synkplan(lage({ lokal: ["a"] })), { typ: "lokal" });
  assert.deepEqual(synkplan(lage({ lokal: ["a"], markor: "ut" })), { typ: "lokal" });
});

test("första gången inloggad: enhetens lista läggs till kontots", () => {
  assert.deepEqual(synkplan(lage({ inne: true, lokal: ["a", "b"] })), { typ: "skicka", andring: { lagg: ["a", "b"], taBort: [] }, sanda: 0 });
  // Också efter en utloggning: det som lagts till sedan dess följer med in.
  assert.deepEqual(synkplan(lage({ inne: true, markor: "ut", lokal: ["c"] })), { typ: "skicka", andring: { lagg: ["c"], taBort: [] }, sanda: 0 });
  // En tom lista skickas också: svaret är kontots lista.
  assert.deepEqual(synkplan(lage({ inne: true })), { typ: "skicka", andring: { lagg: [], taBort: [] }, sanda: 0 });
});

test("första gången inloggad med ändringar gjorda före sändningen: de följer med i samma anrop", () => {
  // Den som hinner trycka på ett hjärta innan första sändningen: tilläggen
  // står redan i listan, och borttagningarna skickas med, så att kundens
  // senaste tryck gäller också mot det kontot redan hade.
  const p = synkplan(lage({ inne: true, lokal: ["a"], ko: [{ t: "l", s: "a" }, { t: "b", s: "x" }] }));
  assert.deepEqual(p, { typ: "skicka", andring: { lagg: ["a"], taBort: ["x"] }, sanda: 2 });
  // En borttagning av något som står i listan igen skickas inte.
  const q = synkplan(lage({ inne: true, lokal: ["a"], ko: [{ t: "b", s: "a" }] }));
  assert.deepEqual(q, { typ: "skicka", andring: { lagg: ["a"], taBort: [] }, sanda: 1 });
});

test("inloggad och i takt: kontot frågas högst var femte minut", () => {
  const i = { inne: true, markor: "1" as const, lokal: ["a"] };
  // Talen är löftet till kunden: ett hjärta från en annan enhet syns inom fem minuter, i lådan inom en halv.
  assert.equal(SYNK_MAX_ALDER_MS, 5 * 60_000);
  assert.equal(SYNK_LADA_MS, 30_000);
  assert.deepEqual(synkplan(lage({ ...i, senastMs: NU - SYNK_MAX_ALDER_MS - 1 })), { typ: "hamta" });
  assert.deepEqual(synkplan(lage({ ...i, senastMs: NU - SYNK_MAX_ALDER_MS + 1000 })), { typ: "vanta" });
  // Lådan och Mina sidor nöjer sig med en halv minut.
  assert.deepEqual(synkplan(lage({ ...i, senastMs: NU - 31_000, maxAlderMs: 30_000 })), { typ: "hamta" });
  // En klocka som gått bakåt räknas som gammal, inte som färsk i evighet.
  assert.deepEqual(synkplan(lage({ ...i, senastMs: NU + 60_000 })), { typ: "hamta" });
});

test("inloggad med kö: kön skickas, oavsett hur färskt svaret är", () => {
  const ko: Koad[] = [{ t: "l", s: "b" }, { t: "b", s: "a" }];
  assert.deepEqual(synkplan(lage({ inne: true, markor: "1", lokal: ["b"], ko, senastMs: NU })), {
    typ: "skicka",
    andring: { lagg: ["b"], taBort: ["a"] },
    sanda: 2,
  });
});

test("inloggningen gick ut av sig själv: listan står kvar i webbläsaren", () => {
  // Ingen ska tappa sina favoriter för att tiden gick. Listan blir en vanlig
  // lista igen och läggs till kontots vid nästa inloggning.
  assert.deepEqual(synkplan(lage({ markor: "1", lokal: ["a", "b"], ko: [{ t: "l", s: "b" }] })), { typ: "slapp" });
  assert.deepEqual(synkplan(lage({ markor: "1" })), { typ: "slapp" });
});

test("vidUtloggning: kontots lista lämnar enheten, det osända står kvar", () => {
  // Det som lagts till men aldrig nått kontot är kundens eget och står kvar.
  const ko: Koad[] = [{ t: "l", s: "c" }, { t: "b", s: "a" }, { t: "l", s: "d" }, { t: "b", s: "d" }];
  assert.deepEqual(vidUtloggning({ markor: "1", lokal: ["b", "c"], ko }), { lista: ["c"], markor: "ut" });
  assert.deepEqual(vidUtloggning({ markor: "1", lokal: ["a"], ko: [] }), { lista: [], markor: "ut" });
  // En lista som aldrig stämts av mot kontot är webbläsarens egen och rörs inte.
  assert.deepEqual(vidUtloggning({ markor: null, lokal: ["a"], ko: [] }), { lista: ["a"], markor: null });
  assert.deepEqual(vidUtloggning({ markor: "ut", lokal: ["a"], ko: [] }), { lista: ["a"], markor: "ut" });
});

test("hjärtats lyssnare känner igen formulären som loggar ut", () => {
  // Utloggningen är ett vanligt formulär (sidan laddas om), så listan lämnar
  // enheten i samma stund som formuläret skickas.
  assert.equal(UTLOGGNING, "/api/konto/ut");
  for (const fil of ["app/konto/page.tsx", "app/konto/mina-sidor.tsx"]) {
    assert.ok(las(fil).includes(`<form action="${UTLOGGNING}" method="post">`), `${fil} loggar inte ut med ett formulär till ${UTLOGGNING}`);
  }
  assert.ok(las("components/wishlist.tsx").includes("pathname !== UTLOGGNING"), "hjärtat lyssnar inte på utloggningen");
});

test("efterSvar: kontots lista gäller, med det som hänt under tiden ovanpå", () => {
  // Inga ändringar under tiden: kontots lista rakt av.
  assert.deepEqual(efterSvar(["x", "y"], [], []), { lista: ["x", "y"], ko: [] });
  // Två ändringar skickades, en tredje kom medan svaret var på väg.
  const skickade: Koad[] = [{ t: "l", s: "a" }, { t: "b", s: "x" }];
  const ko: Koad[] = [...skickade, { t: "l", s: "z" }];
  assert.deepEqual(efterSvar(["y", "a"], ko, skickade), { lista: ["y", "a", "z"], ko: [{ t: "l", s: "z" }] });
  // En borttagning under tiden slår igenom direkt, också mot kontots svar.
  assert.deepEqual(efterSvar(["x", "y"], [{ t: "b", s: "y" }], []), { lista: ["x"], ko: [{ t: "b", s: "y" }] });
  // Ett svar med skräp i ger en ren lista.
  assert.deepEqual(efterSvar(["x", "Stor", 7], [], []), { lista: ["x"], ko: [] });
});

test("utanSkickade tar bort det som skickades, efter innehåll och en gång var", () => {
  const la: Koad = { t: "l", s: "a" };
  const ba: Koad = { t: "b", s: "a" };
  // Samma tryck igen efter sändningen står kvar: på, av, på.
  assert.deepEqual(utanSkickade([la, ba, la], [la]), [ba, la]);
  // En kö som en annan flik redan tömt och fyllt på med annat rörs inte.
  assert.deepEqual(utanSkickade([{ t: "l", s: "ny" }], [la]), [{ t: "l", s: "ny" }]);
  assert.deepEqual(utanSkickade([], [la]), []);
  assert.deepEqual(utanSkickade([la, ba], [la, ba]), []);
});

// ── Kontots lista ────────────────────────────────────────────────────────

test("favoriterUrRad: en rad utan fälten är en tom lista i version 0", () => {
  assert.deepEqual(favoriterUrRad({}), { lista: [], version: 0 });
  assert.deepEqual(favoriterUrRad({ favoriter: ["a", "Stor", "a"], favoriterVersion: 3 }), { lista: ["a"], version: 3 });
  for (const v of [-1, 0, 1.5, "2", null]) assert.equal(favoriterUrRad({ favoriterVersion: v }).version, 0, String(v));
});

/** Ett lager i minnet. `andra`: en annan enhet som hinner skriva mellan läsningen och skrivningen, så många gånger. */
function minneslager(start: string[] | null, andra: { ganger: number; lagg: string } = { ganger: 0, lagg: "" }) {
  const lage = { lista: start ? [...start] : null, version: start && start.length ? 1 : 0, skrivningar: 0, lasningar: 0 };
  let kvar = andra.ganger;
  const lager: Favoritlager = {
    las: async () => {
      lage.lasningar++;
      return lage.lista ? { lista: [...lage.lista], version: lage.version } : null;
    },
    skriv: async (lista, foreVersion) => {
      if (!lage.lista) return "saknas";
      if (kvar > 0) {
        kvar--;
        lage.lista = [...lage.lista, `${andra.lagg}-${kvar}`];
        lage.version++;
      }
      if (foreVersion !== lage.version) return "upptagen";
      lage.lista = [...lista];
      lage.version++;
      lage.skrivningar++;
      return "skriven";
    },
  };
  return { lager, lage };
}

test("andraILager: ändringen skrivs en gång och svaret är kontots lista", async () => {
  const { lager, lage } = minneslager(["a"]);
  assert.deepEqual(await andraILager(lager, { lagg: ["b"], taBort: [] }), ["a", "b"]);
  assert.deepEqual(lage.lista, ["a", "b"]);
  assert.equal(lage.skrivningar, 1);
  assert.equal(lage.version, 2);
});

test("andraILager: ingenting att ändra ger ingen skrivning", async () => {
  const { lager, lage } = minneslager(["a", "b"]);
  assert.deepEqual(await andraILager(lager, { lagg: ["a"], taBort: ["finns-inte"] }), ["a", "b"]);
  assert.deepEqual(await andraILager(lager, { lagg: [], taBort: [] }), ["a", "b"]);
  assert.equal(lage.skrivningar, 0);
});

test("andraILager: två enheter samtidigt tappar inget hjärta", async () => {
  // En annan enhet hinner lägga till en vara mellan läsningen och skrivningen.
  // Utan villkoret på versionen hade dess vara skrivits över.
  const { lager, lage } = minneslager(["a"], { ganger: 1, lagg: "annan-enhet" });
  assert.deepEqual(await andraILager(lager, { lagg: ["b"], taBort: [] }), ["a", "annan-enhet-0", "b"]);
  assert.deepEqual(lage.lista, ["a", "annan-enhet-0", "b"]);
  assert.equal(lage.lasningar, 2);
  assert.equal(lage.skrivningar, 1);
});

test("andraILager: ett konto som saknas ger null, och en lista som aldrig blir ledig kastar", async () => {
  assert.equal(await andraILager(minneslager(null).lager, { lagg: ["a"], taBort: [] }), null);
  // Kontot togs bort mellan läsningen och skrivningen: svaret är null direkt, utan fler läsningar.
  let lasningar = 0;
  const borttaget: Favoritlager = {
    las: async () => (lasningar++, { lista: ["a"], version: 1 }),
    skriv: async () => "saknas",
  };
  assert.equal(await andraILager(borttaget, { lagg: ["b"], taBort: [] }), null);
  assert.equal(lasningar, 1);
  const upptagen = minneslager(["a"], { ganger: FAVORIT_FORSOK, lagg: "x" });
  await assert.rejects(() => andraILager(upptagen.lager, { lagg: ["b"], taBort: [] }), /samtidigt/);
  assert.equal(upptagen.lage.lasningar, FAVORIT_FORSOK);
  // Ett försök färre: då går den igenom på det sista.
  const nastan = minneslager(["a"], { ganger: FAVORIT_FORSOK - 1, lagg: "x" });
  assert.ok((await andraILager(nastan.lager, { lagg: ["b"], taBort: [] }))?.includes("b"));
});

// ── Det lådan visar ───────────────────────────────────────────────────────

test("namnUrSlug gör adressen läsbar tills namnet är hämtat", () => {
  assert.equal(namnUrSlug("julgran-180-cm-1696-grenspetsar"), "Julgran 180 cm 1696 grenspetsar");
  assert.equal(namnUrSlug("a"), "A");
});

test("lasInfo och medInfo: det sparade kortet per favorit", () => {
  const info = medInfo({}, "a", { n: "Namn", b: "https://static.wixstatic.com/media/a.jpg", p: "99 kr" });
  assert.deepEqual(info, { a: { n: "Namn", b: "https://static.wixstatic.com/media/a.jpg", p: "99 kr" } });
  assert.deepEqual(lasInfo(JSON.stringify(info)), info);
  // Ett kort utan namn sparas inte, och en bild som inte är en https-adress faller bort.
  assert.deepEqual(medInfo({}, "a", { n: "  " }), {});
  assert.deepEqual(medInfo({}, "a", { n: "Namn", b: "javascript:alert(1)" }), { a: { n: "Namn" } });
  assert.deepEqual(medInfo({}, "Stor", { n: "Namn" }), {});
  // Långa texter kapas, så att minnet inte växer av en märklig sida.
  assert.equal(medInfo({}, "a", { n: "x".repeat(500) }).a.n.length, 160);
  // Skräp i minnet ger en tom karta.
  for (const skrap of ["{", null, "[]", '[{"n":"A"}]', '{"a":7}', '{"Stor":{"n":"x"}}', '{"a":{"n":7}}']) assert.deepEqual(lasInfo(skrap), {}, String(skrap));
  // Bara favoriternas kort sparas: det som tagits bort ur listan gallras.
  assert.deepEqual(gallraInfo({ a: { n: "A" }, b: { n: "B" } }, ["b", "c"]), { b: { n: "B" } });
});

test("favoritrader: nyast först, med det som är känt om varje vara", () => {
  const lista = ["gammal", "julgran-180-cm", "borta", "ny"];
  const info = {
    gammal: { n: "Sparat namn", p: "99 kr" },
    borta: { n: "Fanns förut", p: "49 kr" },
    "julgran-180-cm": { n: "Namnet när hjärtat tändes", p: "1 kr" },
  };
  const svar = { produkter: { "julgran-180-cm": P() }, saknas: ["borta"] };
  const rader = favoritrader(lista, info, svar);
  assert.deepEqual(rader.map((r) => r.slug), ["ny", "borta", "julgran-180-cm", "gammal"]);
  // Inget känt än: adressens namn, och raden väntar på svaret.
  assert.deepEqual(rader[0], { slug: "ny", lage: "laddar", namn: "Ny", gissat: true, sokvag: "/produkt/ny" });
  // Varan finns inte längre: det sparade namnet står kvar, utan pris.
  assert.deepEqual(rader[1], { slug: "borta", lage: "borta", namn: "Fanns förut", sokvag: "/produkt/borta" });
  // Svaret från butiken gäller framför det sparade.
  assert.equal(rader[2].lage, "klar");
  assert.equal(rader[2].namn, "Konstgjord julgran 180 cm");
  assert.equal(rader[2].pris, "1 149 kr");
  assert.deepEqual(rader[2].produkt, P());
  // Bara det sparade kortet: det visas medan svaret hämtas.
  assert.deepEqual(rader[3], { slug: "gammal", lage: "laddar", namn: "Sparat namn", pris: "99 kr", sokvag: "/produkt/gammal" });
});

test("favoritrader utan svar alls: varje rad väntar, ingen sägs vara borta", () => {
  const rader = favoritrader(["a"], {}, null);
  assert.equal(rader[0].lage, "laddar");
  assert.equal(rader[0].gissat, true);
  // Ett svar som misslyckades (fel) lämnar det sparade kortet synligt som färdigt nog.
  const fel = favoritrader(["a"], { a: { n: "Namn", p: "99 kr" } }, "fel");
  assert.deepEqual(fel[0], { slug: "a", lage: "okand", namn: "Namn", pris: "99 kr", sokvag: "/produkt/a" });
});

test("handling: köp direkt bara när varan finns och inget val krävs", () => {
  assert.equal(handling(P()), "kop");
  assert.equal(handling(P({ val: true })), "valj");
  assert.equal(handling(P({ iLager: false })), "bevaka");
  // Slut går före val: en slutsåld vara med färger bevakas.
  assert.equal(handling(P({ iLager: false, val: true })), "bevaka");
  // Utan produkt-id går varan inte att lägga i varukorgen härifrån.
  assert.equal(handling(P({ id: "" })), "valj");
});

// ── Uppslaget: produkten som lådan visar den ─────────────────────────────

const F: FavoritFormat = {
  listPris: (p) => (p.hasRange ? `Från ${p.priceFromNum} kr` : `${p.priceNum} kr`),
  pris: (n) => `${n} kr`,
  bild: (url) => `${url}?liten`,
};
const K = (over: Partial<FavoritKalla> = {}): FavoritKalla => ({
  id: "11111111-1111-4111-8111-111111111111",
  slug: "julgran-180-cm",
  name: "Konstgjord julgran 180 cm",
  img: "https://static.wixstatic.com/media/a.jpg",
  inStock: true,
  priceNum: 1149,
  ...over,
});

test("somFavoritProdukt: namn, liten bild, pris och lager som på produktkortet", () => {
  assert.deepEqual(somFavoritProdukt(K(), false, F), {
    slug: "julgran-180-cm",
    id: "11111111-1111-4111-8111-111111111111",
    namn: "Konstgjord julgran 180 cm",
    bild: "https://static.wixstatic.com/media/a.jpg?liten",
    pris: "1149 kr",
    prisNum: 1149,
    iLager: true,
    val: false,
  });
  // Olika pris per val: "Från", och det lägsta priset som tal.
  const spann = somFavoritProdukt(K({ hasRange: true, priceFromNum: 899 }), true, F);
  assert.equal(spann.pris, "Från 899 kr");
  assert.equal(spann.prisNum, 899);
  assert.equal(spann.val, true);
  // Utan bild: tom adress, aldrig en trasig bild.
  assert.equal(somFavoritProdukt(K({ img: "" }), false, F).bild, "");
});

test("somFavoritProdukt: det tidigare priset bara vid en sänkning, få kvar bara i lager", () => {
  assert.equal(somFavoritProdukt(K({ onSale: true, originalPriceNum: 1499 }), false, F).tidigare, "1499 kr");
  assert.equal("tidigare" in somFavoritProdukt(K({ originalPriceNum: 1499 }), false, F), false);
  assert.equal("tidigare" in somFavoritProdukt(K({ onSale: true }), false, F), false);
  assert.equal(somFavoritProdukt(K({ stockQuantity: 5 }), false, F).faKvar, 5);
  assert.equal(somFavoritProdukt(K({ stockQuantity: 1 }), false, F).faKvar, 1);
  for (const antal of [0, 6, 40, undefined]) assert.equal("faKvar" in somFavoritProdukt(K({ stockQuantity: antal }), false, F), false, String(antal));
  // En slutsåld vara har inget "få kvar", vad saldot än säger.
  const slut = somFavoritProdukt(K({ inStock: false, stockQuantity: 3 }), false, F);
  assert.equal(slut.iLager, false);
  assert.equal("faKvar" in slut, false);
});

test("favoritsvar: det som finns, och det som inte längre finns", () => {
  const svar = favoritsvar(["a", "julgran-180-cm", "borta"], [P(), P({ slug: "a" }), P({ slug: "inte-fragad" })]);
  assert.deepEqual(Object.keys(svar.produkter).sort(), ["a", "julgran-180-cm"]);
  assert.deepEqual(svar.saknas, ["borta"]);
  assert.deepEqual(favoritsvar(["a"], []), { produkter: {}, saknas: ["a"] });
});

// ── Källtextprov: det som inte syns i en ren funktion ────────────────────

test("kortets hjärta läser namn, pris och bild ur kortet det sitter på", () => {
  // Hjärtat får bara adressen som egenskap (listsidorna bär redan namnet och
  // priset en gång), och läser resten ur kortets egna element vid trycket.
  const kort = las("components/productcard.tsx");
  for (const klass of ['className="prod"', 'className="pname"', 'className="pprice-now"']) {
    assert.ok(kort.includes(klass), `produktkortet har inte kvar ${klass}`);
  }
  const hjarta = las("components/wishlist.tsx");
  for (const valjare of [".prod", ".pname", ".pprice-now"]) assert.ok(hjarta.includes(`"${valjare}"`), `hjärtat läser inte ${valjare}`);
});

test("lådan visar aldrig adressen som namn med versaler på varje ord", () => {
  const hjarta = las("components/wishlist.tsx");
  assert.ok(!/slug\.replace\(\/-\/g/.test(hjarta), "lådan bygger namnet ur adressen själv");
  assert.ok(!/text-transform:\s*capitalize/.test(las("app/globals.css").match(/\.fav-[^}]*\}/g)?.join("") ?? ""), "favoritraden gör om texten till versaler");
});
