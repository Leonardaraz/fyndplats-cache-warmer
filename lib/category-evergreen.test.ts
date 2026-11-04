// Run: node --test --experimental-strip-types --no-warnings lib/category-evergreen.test.ts
//
// SPÄRR MOT SORTIMENTSBEROENDE UPPGIFTER I KATEGORITEXTERNA (2026-11-04).
//
// Varför: sortimentet ändras vid varje poleringsrunda, och kategorisidorna cachas i
// sex timmar. En text som räknar ("fyra av speglarna har Bluetooth"), anger tak och
// spann ("upp till 100 × 80 cm", "120 till 180 cm") eller säger `flera har` är fel
// så fort en ny vara kommer in eller en gammal går ut, och ingen märker det. Fem
// sökordskategorier hade hunnit bli fel när testet skrevs. En regel som man måste
// komma ihåg glöms bort, så den här filen läser ALLA kategoritexter och fäller.
//
// Vad som fälls och varför står i lib/category-evergreen.ts (mönstren, regeln och
// ett självtest per mönster). Här finns tre saker till:
//   - en BASLINJE (lib/category-evergreen-baseline.ts) för de kategorier som redan
//     bar sådana uppgifter när spärren kom. Den kan bara krympa: en kategori utanför
//     den måste vara ren, och en kategori i den måste fortfarande träffa exakt de
//     mönster som står där. Är den ren ska den strykas, har den fått fler ska den
//     skrivas rätt och inte läggas till.
//   - TILLATNA: ett fåtal meningar som träffar ett mönster utan att säga något om
//     sortimentet. Varje post har ett skäl och fälls om den blir överflödig.
//   - OMSKRIVNA: de fem sökordskategorier som skrevs om 2026-11-04. De får aldrig
//     flyttas in i baslinjen för att få testet grönt.
import test from "node:test";
import assert from "node:assert/strict";
import { CATEGORY_CONTENT } from "./category-content.ts";
import { CATEGORY_SEO } from "./category-seo.ts";
import {
  EVERGREEN_MONSTER,
  SJALVTEST,
  TILLATNA,
  evergreenDetaljer,
  evergreenTraffar,
} from "./category-evergreen.ts";
import { EVERGREEN_BASLINJE } from "./category-evergreen-baseline.ts";

const OMSKRIVNA = ["badrumsspeglar", "speglar", "konstvaxter", "gunghastar-gungdjur", "redskapsbodar-forrad"];

type Enhet = { plats: string; text: string };

/** Varje text kunden eller Google ser för en kategori, med en etikett för felmeddelandet. */
function enheter(slug: string): Enhet[] {
  const u: Enhet[] = [];
  const s = CATEGORY_SEO[slug];
  if (s) u.push({ plats: "title", text: s.title }, { plats: "description", text: s.description });
  const c = CATEGORY_CONTENT[slug];
  if (c) {
    c.intro.forEach((text, i) => u.push({ plats: `intro[${i}]`, text }));
    c.faq.forEach((f, i) => {
      u.push({ plats: `faq[${i}].q`, text: f.q });
      u.push({ plats: `faq[${i}].a`, text: f.a });
    });
  }
  return u;
}

const ALLA_SLUGS = [...new Set([...Object.keys(CATEGORY_CONTENT), ...Object.keys(CATEGORY_SEO)])].sort();
const MONSTERORDNING = EVERGREEN_MONSTER.map((m) => m.namn);

function undantagFor(slug: string): string[] {
  return TILLATNA.filter((t) => t.slug === slug).map((t) => t.fras);
}

/** Mönstren som träffar kategorin, i listans ordning. */
function traffar(slug: string): string[] {
  const undantag = undantagFor(slug);
  const namn = new Set<string>();
  for (const e of enheter(slug)) for (const n of evergreenTraffar(e.text, undantag)) namn.add(n);
  return MONSTERORDNING.filter((n) => namn.has(n));
}

/** Läsbar lista över träffarna (eller bara de mönster som anges), med plats, skäl och biten ur texten. */
function forklara(slug: string, bara?: string[]): string {
  const undantag = undantagFor(slug);
  const rader: string[] = [];
  for (const e of enheter(slug)) {
    for (const d of evergreenDetaljer(e.text, undantag)) {
      if (bara && !bara.includes(d.namn)) continue;
      rader.push(`    ${e.plats} [${d.namn}] «${d.traff}» i …${d.kontext}…\n        ${d.skal}`);
    }
  }
  return rader.join("\n");
}

const RADRAT = (slug: string, namn: string[]) => `  ${JSON.stringify(slug)}: [${namn.map((n) => `"${n}"`).join(", ")}],`;

test("självtest: varje mönster träffar sitt fall, och rena meningar träffar inget", () => {
  const utanFall = MONSTERORDNING.filter((n) => !(n in SJALVTEST.traffar));
  assert.deepEqual(utanFall, [], `mönster utan självtest: ${utanFall.join(", ")}`);
  const okanda = Object.keys(SJALVTEST.traffar).filter((n) => !MONSTERORDNING.includes(n));
  assert.deepEqual(okanda, [], `självtest för mönster som inte finns: ${okanda.join(", ")}`);
  for (const [namn, text] of Object.entries(SJALVTEST.traffar)) {
    assert.ok(evergreenTraffar(text).includes(namn), `${namn} träffar inte sitt eget fall: "${text}"`);
  }
  for (const text of SJALVTEST.rent) {
    assert.deepEqual(evergreenTraffar(text), [], `falsk träff på en sann mening: "${text}"`);
  }
  assert.equal(new Set(MONSTERORDNING).size, MONSTERORDNING.length, "två mönster har samma namn");
});

test("en tillåten fras döljer bara sig själv: samma mening utan frasen träffar", () => {
  const mening = "Lasta det tyngsta längst ner och över hjulaxeln.";
  assert.deepEqual(evergreenTraffar(mening, ["Lasta det tyngsta längst ner"]), []);
  assert.deepEqual(evergreenTraffar(mening), ["SUPERLATIV"]);
  // Frasen får inte släcka en träff utanför sig.
  assert.deepEqual(
    evergreenTraffar("Lasta det tyngsta längst ner. Två av dem har broms.", ["Lasta det tyngsta längst ner"]),
    ["ANTAL_AV"]
  );
});

test("de omskrivna sökordskategorierna är rena och står inte i baslinjen", () => {
  for (const slug of OMSKRIVNA) {
    assert.ok(CATEGORY_CONTENT[slug] && CATEGORY_SEO[slug], `${slug}: saknar text eller SEO`);
    assert.ok(!(slug in EVERGREEN_BASLINJE), `${slug}: omskriven 2026-11-04 och får inte stå i baslinjen`);
    assert.deepEqual(traffar(slug), [], `${slug} bär sortimentsberoende uppgifter:\n${forklara(slug)}`);
  }
});

test("varje kategori utanför baslinjen är fri från sortimentsberoende uppgifter", () => {
  const fel: string[] = [];
  for (const slug of ALLA_SLUGS) {
    if (slug in EVERGREEN_BASLINJE) continue;
    if (traffar(slug).length) fel.push(`${slug}:\n${forklara(slug)}`);
  }
  assert.equal(
    fel.length,
    0,
    `${fel.length} kategori(er) utanför baslinjen bär uppgifter som beror på sortimentet.\n` +
      `Skriv om meningen så att den beskriver varutypen och inte sortimentet (regeln står överst i ` +
      `lib/category-evergreen.ts). Lägg ALDRIG en kategori i baslinjen för att få testet grönt.\n\n` +
      fel.join("\n\n")
  );
});

test("baslinjen kan bara krympa: varje post stämmer med vad kategorin bär i dag", () => {
  const fel: string[] = [];
  for (const [slug, namn] of Object.entries(EVERGREEN_BASLINJE)) {
    if (!CATEGORY_CONTENT[slug] && !CATEGORY_SEO[slug]) {
      fel.push(`${slug}: finns inte längre, stryk raden`);
      continue;
    }
    const okanda = namn.filter((n) => !MONSTERORDNING.includes(n));
    if (okanda.length) {
      fel.push(`${slug}: okänt mönster ${okanda.join(", ")}`);
      continue;
    }
    const nu = traffar(slug);
    if (nu.length === 0) {
      fel.push(`${slug}: är ren nu, STRYK raden ur lib/category-evergreen-baseline.ts`);
      continue;
    }
    const nya = nu.filter((n) => !namn.includes(n));
    if (nya.length) {
      fel.push(
        `${slug}: har fått nya träffar (${nya.join(", ")}). Skriv bort dem. Baslinjen får inte växa.\n${forklara(slug, nya)}`
      );
      continue;
    }
    const borta = namn.filter((n) => !nu.includes(n));
    if (borta.length) {
      fel.push(`${slug}: ${borta.join(", ")} träffar inte längre. Korta raden till:\n${RADRAT(slug, nu)}`);
    }
  }
  assert.equal(fel.length, 0, `${fel.length} fel i baslinjen:\n\n${fel.join("\n\n")}`);
});

test("baslinjen är sorterad och utan dubbletter", () => {
  const nycklar = Object.keys(EVERGREEN_BASLINJE);
  assert.deepEqual(nycklar, [...nycklar].sort(), "sortera posterna efter slug");
  for (const [slug, namn] of Object.entries(EVERGREEN_BASLINJE)) {
    assert.equal(new Set(namn).size, namn.length, `${slug}: samma mönster två gånger`);
    assert.deepEqual(namn, MONSTERORDNING.filter((n) => namn.includes(n)), `${slug}: mönstren i listans ordning`);
  }
});

test("tillåtna fraser: varje post har skäl, står kvar i texten och behövs", () => {
  for (const t of TILLATNA) {
    assert.ok(t.skal.trim().length > 10, `${t.slug}: "${t.fras}" saknar skäl`);
    const finns = enheter(t.slug).some((e) => e.text.includes(t.fras));
    assert.ok(finns, `${t.slug}: frasen "${t.fras}" står inte längre i texten, stryk posten ur TILLATNA`);
    assert.ok(
      evergreenTraffar(t.fras).length > 0,
      `${t.slug}: frasen "${t.fras}" träffar inget mönster, så posten behövs inte`
    );
  }
  assert.ok(TILLATNA.length <= 5, "TILLATNA ska vara kort: skriv om meningen i stället för att tillåta den");
});
