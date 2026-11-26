// Run: node --test --experimental-strip-types lib/namnnycklar-verktyg.test.ts
//
// Verktyget som bygger lib/namnnycklar-data.ts ur filen med jämförelsesajtens
// namn (tools/namnnycklar/bygg.ts, 2026-11-25). Filen med namnen ligger utanför
// repot. Raderna här är påhittade.
import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { markesnyckel, namnnyckel } from "./search.ts";
import { FLEST_VAROR_PER_NYCKEL, byggNycklar, lasCsv, somModul } from "../tools/namnnycklar/bygg.ts";

const rad = (pr_namn: string, sakerhet: string, slug: string) => ({ pr_namn, sakerhet, slug });
const finns = (slug: string) => slug !== "borta";

test("filen läses med citattecken, kommatecken i fälten, BOM och båda radsluten", () => {
  const text = '﻿pr_namn,sakerhet,slug\r\n"Homcom Bord, runt ""Oslo"" 80 cm",A,bord-runt\nOutsunny Paviljong 3x3 m,B,paviljong\n';
  assert.deepEqual(lasCsv(text), [
    { pr_namn: 'Homcom Bord, runt "Oslo" 80 cm', sakerhet: "A", slug: "bord-runt" },
    { pr_namn: "Outsunny Paviljong 3x3 m", sakerhet: "B", slug: "paviljong" },
  ]);
  // Utan avslutande radslut, och med en tom rad på slutet.
  assert.equal(lasCsv("a,b\n1,2").length, 1);
  assert.equal(lasCsv("a,b\n1,2\n\n").length, 1);
  // Ett radslut inne i ett citerat fält hör till fältet.
  assert.deepEqual(lasCsv('a,b\n"rad ett\nrad två",2\n'), [{ a: "rad ett\nrad två", b: "2" }]);
});

test("bara de valda klasserna byggs, och allt som faller bort räknas", () => {
  const rader = [
    rad("Homcom Sittbänk Med Förvaring Grå", "A", "sittbank"),
    rad("Homcom Sittbänk Med Förvaring Grå", "A", "sittbank"), // samma rad två gånger: en nyckel
    rad("Pawhut Kattträd 180 cm Beige", "A", "katttrad"),
    rad("Pawhut Kattträd", "A", "katttrad"), // för få ord
    rad("Outsunny Parasoll 3 m Grön", "A", "borta"), // varan står inte i indexet
    rad("Vinsetto Kontorsstol Mesh Svart", "A", ""), // utan adress
    rad("Kleankin Badrumsskåp Vitt Högt", "B", "badrumsskap"), // fel klass
  ];
  const { perVara, rakning } = byggNycklar(rader, new Set(["A"]), finns);
  assert.deepEqual(Object.keys(perVara).sort(), ["katttrad", "sittbank"]);
  // Namnets nyckel, och märket namnet börjar med som en egen summa (2026-11-26).
  assert.deepEqual(perVara.sittbank, [namnnyckel("Homcom Sittbänk Med Förvaring Grå")!, markesnyckel("homcom")].sort());
  assert.deepEqual(perVara.katttrad, [namnnyckel("Pawhut Kattträd 180 cm Beige")!, markesnyckel("pawhut")].sort());
  assert.deepEqual(rakning, { rader: 6, forFaOrd: 1, varanSaknas: 1, utanAdress: 1, nycklar: 2, flertydiga: 0, forMangaVaror: 0, varor: 2, medMarke: 2, marke_homcom: 1, marke_pawhut: 1 });
  // Med klass B också.
  assert.deepEqual(Object.keys(byggNycklar(rader, new Set(["A", "B"]), finns).perVara).sort(), ["badrumsskap", "katttrad", "sittbank"]);
});

test("ett namn som pekar på några få varor behålls, på för många stryks det", () => {
  assert.equal(FLEST_VAROR_PER_NYCKEL, 3);
  const namn = "Homcom Tresitssoffa Skandinavisk Stil";
  const tre = byggNycklar(["a", "b", "c"].map((s) => rad(namn, "A", s)), new Set(["A"]), finns);
  assert.deepEqual(Object.keys(tre.perVara).sort(), ["a", "b", "c"]);
  assert.equal(tre.rakning.flertydiga, 1);
  const fyra = byggNycklar(["a", "b", "c", "d"].map((s) => rad(namn, "A", s)), new Set(["A"]), finns);
  // Namnets nyckel stryks. Märket gäller varorna ändå: det säger inte vilken vara det är.
  assert.deepEqual(fyra.perVara, Object.fromEntries(["a", "b", "c", "d"].map((s) => [s, [markesnyckel("homcom")]])));
  assert.equal(fyra.rakning.forMangaVaror, 1);
  // En vara med flera namn bär en nyckel per namn, sorterade: en ombyggnad
  // ska ge samma fil. Namnen står i en ordning där nycklarna inte redan är sorterade.
  const namnen = ["Homcom Byrå Vit Sex Lådor", "Homcom Lådhurts Vit Bred Modell", "Homcom Sänggavel Vit Med Förvaring", "Homcom Klädskåp Vit Tre Dörrar"];
  const iTur = namnen.map((n) => namnnyckel(n)!);
  assert.notDeepEqual(iTur, [...iTur].sort());
  const flera = byggNycklar(namnen.map((n) => rad(n, "A", "byra")), new Set(["A"]), finns);
  assert.deepEqual(flera.perVara.byra, [...iTur, markesnyckel("homcom")].sort());
});

test("☠️ det som byggs bär aldrig ett namn: varken svaret eller filen", () => {
  const rader = [rad("Homcom Zyxgrundbord Qvartell Brumbass", "A", "bord-ett"), rad("Outsunny Flimmerparasoll Snedställd Grafitgrå", "A", "parasoll")];
  const bygge = byggNycklar(rader, new Set(["A"]), finns);
  const modul = somModul(bygge.perVara, "2026-11-25", "A");
  // Varornas nycklar och filen bär varken namnets ord eller märket. Räkningen
  // (som verktyget skriver ut) säger hur många varor varje märke har, och
  // nämner därför märket, men aldrig ett ord ur namnet.
  for (const text of [JSON.stringify(bygge.perVara), modul]) {
    for (const ord of ["Zyxgrundbord", "Qvartell", "Brumbass", "Flimmerparasoll", "Snedställd", "Grafitgrå", "Homcom", "Outsunny"]) {
      assert.equal(text.toLowerCase().includes(ord.toLowerCase()), false, ord);
    }
  }
  for (const ord of ["Zyxgrundbord", "Qvartell", "Brumbass", "Flimmerparasoll", "Snedställd", "Grafitgrå"]) {
    assert.equal(JSON.stringify(bygge.rakning).toLowerCase().includes(ord.toLowerCase()), false, ord);
  }
  // Filen: huvudet som kommentarer, sedan en rad per vara i bokstavsordning.
  const rad1 = modul.split("\n");
  const start = rad1.findIndex((r) => r.startsWith("export const NAMNNYCKLAR"));
  assert.deepEqual(rad1.slice(start + 1, start + 3).map((r) => r.split('"')[1]), ["bord-ett", "parasoll"]);
  for (const r of rad1.slice(start + 1, start + 3)) assert.match(r, /^  "[a-z0-9-]+": \["[0-9a-z]{6,11}"(?:,"[0-9a-z]{6,11}")*\],$/);
  assert.match(modul, /BYGGD AV tools\/namnnycklar\/bygg\.ts 2026-11-25, klass A\. Ändra inte för hand\./);
});

test("☠️ verktyget skriver bara ut antal, och läser namnen från en fil utanför repot", () => {
  const kod = readFileSync(new URL("../tools/namnnycklar/bygg.ts", import.meta.url), "utf8");
  // De enda utskrifterna: användningen, inställningarna och räkningen.
  const utskrifter = kod.match(/console\.(?:log|error)\([^\n]*/g) ?? [];
  assert.equal(utskrifter.length, 3);
  for (const u of utskrifter) assert.doesNotMatch(u, /pr_namn|\br\.|rader\[/, u);
  // Filen med namnen kommer som argument: ingen sökväg till den står i repot.
  assert.match(kod, /const \[csv, indexfil, klassval = "A"\] = process\.argv\.slice\(2\);/);
  assert.doesNotMatch(kod, /koppling\.csv["'`]\s*[,)]/);
});
