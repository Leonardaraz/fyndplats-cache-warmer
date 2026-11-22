// lib/auction-beskrivning.test.ts
//
// Fyndauktionens beskrivning nämner det antal fynd som faktiskt visas (Leonard
// 2026-11-21). Här stod "Fem fynd varje dag" medan sidan hade tio, och Black
// Week har 50 om dagen och 100 på fredagen. Proven låser tre saker:
//
//   1. talet kommer ur raderna, i varje läge under dygnet,
//   2. texten lovar aldrig ett antal "varje dag" och ryms i Googles snippet,
//   3. inget fast antal står kvar i sidans, kortens eller blogginläggets text.

import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";
import { fyndlage } from "./auction-day.ts";
import { auktionsbeskrivning, BESKRIVNING_UTAN_ANTAL } from "./auction-beskrivning.ts";

// Måndag 23 november 2026, första dagen i Black Week. Vintertid: 07:00 i
// Sverige är 06:00Z, och dagen slutar 19:00 = 18:00Z.
const START = "2026-11-23T06:00:00.000Z";
const MITT_PA_DAGEN = Date.parse("2026-11-23T12:20:00.000Z"); // 13:20
const NASTA_SANKNING = "2026-11-23T13:00:00.000Z"; // 14:00
const KVALLEN_FORE = Date.parse("2026-11-22T20:00:00.000Z"); // söndag 21:00

type Rad = { startsAt: string | null; startAt: string | null; nextDropAt: string | null };
/** Ett fynd som går just nu, med nedräkning till nästa sänkning. */
const igang = (o: Partial<Rad> = {}): Rad => ({ startsAt: null, startAt: START, nextDropAt: NASTA_SANKNING, ...o });
/** Ett fynd som ligger ute med nedräkning till starten kl 07. */
const kommande = (): Rad => ({ startsAt: START, startAt: START, nextDropAt: null });
const flera = (n: number, f: () => Rad) => Array.from({ length: n }, f);

const text = (rader: Rad[], nu: number) => auktionsbeskrivning(fyndlage(rader, nu));

test("pågår: talet är antalet fynd som går just nu, 10, 50 och 100", () => {
  for (const n of [10, 50, 100]) {
    assert.equal(
      text(flera(n, igang), MITT_PA_DAGEN),
      `${n} fynd just nu – nya varje dag kl 07–19. Priset sjunker varje timme tills någon slår till. `
        + "Vänta för ett bättre pris, eller köp innan någon hinner före.",
    );
  }
});

test("pågår: när fynd säljs under dagen följer talet med", () => {
  // Tio på morgonen, tre sålda vid lunch: sidan visar sju kort, texten säger sju.
  assert.match(text(flera(10, igang), MITT_PA_DAGEN), /^10 fynd just nu/);
  assert.match(text(flera(7, igang), MITT_PA_DAGEN), /^7 fynd just nu/);
  assert.match(text(flera(1, igang), MITT_PA_DAGEN), /^1 fynd just nu/);
});

test("pågår: golvet (18–19) och en sen sänkning räknas, de går att köpa", () => {
  const sistaTimmen = Date.parse("2026-11-23T17:30:00.000Z"); // 18:30
  const paGolvet = flera(4, () => igang({ nextDropAt: null }));
  assert.deepEqual(fyndlage(paGolvet, sistaTimmen), { lage: "pagar", antal: 4 });
  // Sänkningen kl 14 har passerat men motorn har inte hunnit: kortet säger
  // "Priset uppdateras…", och fyndet erbjuds fortfarande.
  const sen = flera(3, () => igang());
  assert.deepEqual(fyndlage(sen, Date.parse("2026-11-23T13:00:30.000Z")), { lage: "pagar", antal: 3 });
});

test("före start: kvällen före en större dag säger texten morgondagens antal", () => {
  assert.equal(
    text(flera(50, kommande), KVALLEN_FORE),
    "50 fynd startar kl 07 – priset sjunker varje timme till kl 19. "
      + "Vänta för ett bättre pris, eller köp innan någon hinner före.",
  );
  assert.match(text(flera(100, kommande), KVALLEN_FORE), /^100 fynd startar kl 07/);
  // Samma text natten efter midnatt: "kl 07" är sant utan "i dag" eller "i morgon".
  assert.match(text(flera(10, kommande), Date.parse("2026-11-23T02:00:00.000Z")), /^10 fynd startar kl 07/);
});

test("efter kl 19 erbjuds inget: korten säger Stängt och texten nämner inget antal", () => {
  const strax = Date.parse("2026-11-23T18:00:01.000Z"); // 19:00:01, före motorns städning
  assert.deepEqual(fyndlage(flera(6, igang), strax), { lage: "tomt", antal: 0 });
  assert.equal(text(flera(6, igang), strax), BESKRIVNING_UTAN_ANTAL);
});

test("tom lista: texten utan antal, och den säger inte fem", () => {
  assert.equal(text([], MITT_PA_DAGEN), BESKRIVNING_UTAN_ANTAL);
  assert.match(BESKRIVNING_UTAN_ANTAL, /^Nya fynd varje dag kl 07–19\./);
  assert.doesNotMatch(BESKRIVNING_UTAN_ANTAL, /\d+ fynd|fem|tio/i);
});

test("startade fynd vinner över kommande, och avslutade räknas aldrig", () => {
  // Dagen före en större dag ligger morgondagens rader redan i motorn. Butiken
  // döljer dem (lib/auction-visible.ts), men skulle de slinka med är det ändå
  // dagens fynd som erbjuds just nu.
  const nasta = flera(40, (): Rad => ({ startsAt: "2026-11-24T06:00:00.000Z", startAt: "2026-11-24T06:00:00.000Z", nextDropAt: null }));
  assert.deepEqual(fyndlage([...flera(8, igang), ...nasta], MITT_PA_DAGEN), { lage: "pagar", antal: 8 });
  // Efter 19, innan motorn städat: dagens rader är slut, morgondagens väntar.
  const kvall = Date.parse("2026-11-23T18:05:00.000Z");
  assert.deepEqual(fyndlage([...flera(5, igang), ...nasta], kvall), { lage: "fore", antal: 40 });
});

test("en rad utan startAt räknas som igång, som korten gör", () => {
  // Äldre dokument saknar fältet. Fasmaskinen visar dem som pågående, och
  // texten ska räkna det sidan visar.
  assert.deepEqual(fyndlage([{ startsAt: null, startAt: null, nextDropAt: null }], MITT_PA_DAGEN), { lage: "pagar", antal: 1 });
});

test("texten lovar aldrig ett antal varje dag, och säger aldrig i morgon", () => {
  for (const n of [1, 5, 10, 50, 100, 999]) {
    for (const t of [text(flera(n, igang), MITT_PA_DAGEN), text(flera(n, kommande), KVALLEN_FORE)]) {
      assert.doesNotMatch(t, /\d+ fynd (varje dag|om dagen|per dag)/, t);
      assert.doesNotMatch(t, /i morgon|i dag|idag|imorgon/i, t);
      assert.ok(t.startsWith(`${n} fynd `), t);
    }
  }
});

test("texten ryms i Googles snippet, också med tre siffror", () => {
  // Google klipper runt 160 tecken. 155 är marginalen sidan haft sedan förut.
  for (const n of [1, 10, 100, 999]) {
    for (const t of [text(flera(n, igang), MITT_PA_DAGEN), text(flera(n, kommande), KVALLEN_FORE), BESKRIVNING_UTAN_ANTAL]) {
      assert.ok(t.length <= 155, `${t.length} tecken: ${t}`);
      assert.ok(t.length >= 110, `för kort för en snippet (${t.length}): ${t}`);
    }
  }
});

// ── Inget fast antal i texterna ─────────────────────────────────────────────
//
// Det som lät felet stå kvar i fem månader var att talet stod som ett ord i en
// textsträng, långt från motorns inställning. Kommentarer får berätta
// historien; text som når en kund får inte nämna ett antal fynd.

const ROT = new URL("../", import.meta.url);
const las = (v: string) => readFileSync(new URL(v, ROT), "utf8");
/** Källkod utan kommentarer (// till radslut, och block). Grovt, men det räcker för textsträngar. */
const utanKommentarer = (s: string) => s.replace(/\/\*[\s\S]*?\*\//g, "").replace(/(^|[^:"'`])\/\/.*$/gm, "$1");

const TALORD = "en|ett|två|tre|fyra|fem|sex|sju|åtta|nio|tio|elva|tolv|tjugo|trettio|fyrtio|femtio|hundra|\\d+";
// "fem fynd", "fem nya fynd", "fem utvalda produkter", "dagens femma", "väljs fem ut".
// "flera hundra produkter" är poolens storlek, inget antal per dag, och släpps.
const FAST_ANTAL = new RegExp(
  `(?<![\\p{L}\\d])(?<!flera\\s+)(?:${TALORD})\\s+(?:nya\\s+|utvalda\\s+|dagliga\\s+)*(?:fynd|produkter|varor)(?![\\p{L}])`
    + `|dagens\\s+(?:femma|tia)|väljs\\s+(?:${TALORD})\\s+ut`,
  "iu",
);

test("regeln själv: den ser de gamla formuleringarna och släpper de nya", () => {
  for (const fel of [
    "Fem fynd varje dag kl 07–19.",
    "startar fem utvalda produkter på sitt vanliga pris",
    "dagens fem fynd startar",
    "tar fem nya fynd deras plats",
    "Varje dag väljs fem ut",
    "dagens femma kommer aldrig tillbaka",
    "10 fynd om dagen",
  ]) assert.match(fel, FAST_ANTAL, fel);
  for (const ratt of [
    "Nya fynd varje dag kl 07–19.",
    "dagens fynd startar på ordinarie pris",
    "flera hundra produkter ur hela vårt sortiment",
    "Varje fynd säljs bara en gång",
    "30 dagars öppet köp",
    "${l.antal} fynd just nu",
  ]) assert.doesNotMatch(ratt, FAST_ANTAL, ratt);
});

test("sidan, korten och blogginlägget nämner inget fast antal fynd", () => {
  const filer = [
    "app/fyndauktion/page.tsx",
    "lib/auction-beskrivning.ts",
    "content/blog/fyndauktionen-sa-funkar-det.md",
    ...readdirSync(new URL("components/", ROT)).filter((f) => /^auction-.*\.tsx?$/.test(f)).map((f) => `components/${f}`),
  ];
  assert.ok(filer.length >= 10, `för få filer lästa (${filer.length})`);
  for (const fil of filer) {
    const text = fil.endsWith(".md") ? las(fil) : utanKommentarer(las(fil));
    const m = text.match(FAST_ANTAL);
    assert.equal(m, null, `${fil}: "${m?.[0]}"`);
  }
});

test("sidan räknar beskrivningen ur fynden och har ingen fast metadata", () => {
  const sida = utanKommentarer(las("app/fyndauktion/page.tsx"));
  assert.match(sida, /export async function generateMetadata\(/);
  assert.doesNotMatch(sida, /export const metadata\b/);
  assert.match(sida, /description:\s*auktionsbeskrivning\(fyndlage\(/);
  // Samma hämtning i beskrivningen och på sidan: annars frågas motorn och Wix två gånger.
  assert.equal((sida.match(/getLiveAuctions\(/g) ?? []).length, 1);
  assert.equal((sida.match(/visadeFynd\(\)/g) ?? []).length, 2);
});
