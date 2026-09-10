// Run: node --test --experimental-strip-types 'lib/**/*.test.ts'
//
// retur-policy.test.ts kontrollerar att den delade textkällan är rätt skriven.
// Det här testet kontrollerar något annat: att ingen ANNAN fil i repot säger
// emot den.
//
// Varför det behövs: returtexten lagades först på fyra sidor. En genomsökning
// visade att samma två fel levde kvar på fyra ställen till — orderbekräftelse-
// mejlet, FAQ-mallen för de 36 programmatiska sidorna, app-villkoren och
// App Store-villkoren. Ingenting hade fångat det, för inget test tittade
// utanför de filer som ändrades.
import test from "node:test";
import assert from "node:assert/strict";
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";

const ROOTS = ["app", "lib", "components", "emails", "content", "docs"];
const EXT = /\.(ts|tsx|md|mdx)$/;
const SKIP = /node_modules|\.next|\.test\.tsx?$|retur-policy\.ts$/;

function files(dir: string, out: string[] = []): string[] {
  let entries;
  try { entries = readdirSync(dir); } catch { return out; }
  for (const e of entries) {
    const p = join(dir, e);
    if (SKIP.test(p)) continue;
    if (statSync(p).isDirectory()) files(p, out);
    else if (EXT.test(p)) out.push(p);
  }
  return out;
}

// Kodkommentarer strippas: ord som "oanvänd" förekommer där om oanvända
// variabler och bilder, vilket inte är kundtext. Identifierare som importeras
// ur retur-policy.ts räknas som att de säger vad den källan säger.
const prose = (t: string) =>
  t.replace(/\/\*[\s\S]*?\*\//g, " ")
    .replace(/(^|[^:])\/\/.*$/gm, "$1 ")
    // Import-raden räknas inte. Ett mutationstest avslöjade varför: jag tog bort
    // hela reklamationsavsnittet ur /returer och provet förblev grönt, eftersom
    // ett kvarlämnat `import { COMPLAINT }` såg ut som att sidan sa något. En
    // oanvänd import är inte kundtext.
    .replace(/^\s*import\s[\s\S]*?from\s+["'][^"']+["'];?\s*$/gm, " ")
    .replace(/\{TOTAL_SUMMARY\}|TOTAL_SUMMARY/g, " totalt 30 dagar dag 15–30 ")
    .replace(/\{TOTAL_SHORT\}|TOTAL_SHORT/g, " totalt 30 dagar ");

const ALL = ROOTS.flatMap((r) => files(r)).map((p) => ({ p, t: prose(readFileSync(p, "utf8")) }));

test("repot innehåller filer att granska", () => {
  assert.ok(ALL.length > 50, `hittade bara ${ALL.length} filer — sökvägarna är fel`);
});

test("ingen text läser som 14 + 30 = 44 dagar", () => {
  // "Utöver detta har du 30 dagars öppet köp" direkt efter ångerrätten var
  // precis den läsningen. "Utöver" är däremot i sin ordning när det följs av
  // "till och med dag 30" eller "räknat från leveransen", som säger totalen.
  const bad = ALL.filter(({ t }) =>
    /[Uu]töver (detta|den lagstadgade ångerrätten)[^.]{0,60}30 dagars öppet köp(?![^.]{0,80}(till och med dag 30|räknat från))/.test(t),
  );
  assert.deepEqual(bad.map((b) => b.p), []);
});

test("ingen text villkorar de lagstadgade 14 dagarna med oanvänd vara", () => {
  // Kunden får undersöka varan som i en butik under ångerfristen. Kravet på
  // oanvänd vara hör till dag 15–30, vårt eget erbjudande — så varje mening
  // som kräver "oanvänd" måste också nämna vilken period den talar om.
  const bad: string[] = [];
  for (const { p, t } of ALL) {
    const chunks = t.split(/(?<=[.!?])\s+/);
    chunks.forEach((s, i) => {
      if (!/oanvänd/i.test(s)) return;
      const context = [chunks[i - 1] || "", s, chunks[i + 1] || ""].join(" ");
      if (/dag 15|15–30|15-30|öppna köp|öppet köp/i.test(context)) return;
      bad.push(`${p}: ${s.trim().replace(/\s+/g, " ").slice(0, 110)}`);
    });
  }
  assert.deepEqual(bad, []);
});

test("ingen text utlovar bara 14 dagar när butiken ger 30", () => {
  // Orderbekräftelsemejlet sa "Du har 14 dagars ångerrätt" — sant om lagen,
  // men det underskattar erbjudandet med mer än hälften för varje kund som
  // handlar. Nämns 14 dagar ska totalen nämnas i samma mening eller nästa.
  const bad: string[] = [];
  for (const { p, t } of ALL) {
    if (/betalningstid|faktura|betala inom/i.test(t) && !/ångerrätt/i.test(t)) continue;
    const chunks = t.split(/(?<=[.!?])\s+/);
    chunks.forEach((s, i) => {
      if (!/14 dagars? (lagstadgad )?ångerrätt/i.test(s)) return;
      const context = [s, chunks[i + 1] || "", chunks[i + 2] || ""].join(" ");
      if (/30 dagar|dag 30|dag 15/i.test(context)) return;
      bad.push(`${p}: ${s.trim().replace(/\s+/g, " ").slice(0, 110)}`);
    });
  }
  assert.deepEqual(bad, []);
});

test("den som ställer villkor för dag 15–30 säger också vad de kostar", () => {
  // Villkoren och prislappen hör ihop. Sex ytor spelade upp "oanvänd, komplett
  // och i säljbart skick" men teg om att utgående frakt INTE återbetalas dag
  // 15–30 — den enda punkt där vårt erbjudande är sämre än lagens. Ett villkor
  // utan sin motprestation är halva avtalet. Antingen står hela regeln, eller
  // också pekar texten vidare till /returer där den står.
  const bad: string[] = [];
  for (const { p, t } of ALL) {
    if (!/oanvänd(,| och) komplett|oanvänd och komplett|oanvänd vara/i.test(t)) continue;
    const refund = /(frakten till dig|leveransen till sig|leveransen till dig|inte frakten till)/i.test(t);
    const pointer = /\/returer|fyndplats\.se\/returer/i.test(t);
    if (!refund && !pointer) bad.push(p);
  }
  assert.deepEqual(bad, []);
});

test("ingen yta låter paketets ankomstdag avgöra vilken period som gäller", () => {
  // "Dag 15–30" utan utpekad utlösare kan läsas som att perioden bestäms av när
  // returen kommer fram. Den läsningen är fel och dyr: en kund som anmäler dag
  // 12 och postar dag 20 står under lagens regler, med standardfrakten
  // återbetald. Varje yta som skriver ut dag 15–30-villkoren ska därför säga
  // att det är ANMÄLAN som räknas — eller peka vidare till den som gör det.
  const bad: string[] = [];
  for (const { p, t } of ALL) {
    if (!/oanvänd(,| och) komplett|oanvänd och komplett|oanvänd vara/i.test(t)) continue;
    const trigger = /(dagen du anmäl|när du anmäl|dagen du anmälde|anmäler returen)/i.test(t);
    const pointer = /\/returer|fyndplats\.se\/returer/i.test(t);
    if (!trigger && !pointer) bad.push(p);
  }
  assert.deepEqual(bad, []);
});

test("den som talar om reklamation säger också hur länge rätten gäller", () => {
  // Treårsrätten stod på EXAKT EN sida i repot: köpvillkoren § 8. Inte på
  // /returer, inte i FAQ:n, inte i app-villkoren, inte i ett enda mejl — alltså
  // ingenstans där en kund med en trasig produkt faktiskt letar. Där stod bara
  // "30 dagar", och den som fick ett fel efter ett halvår drog slutsatsen att
  // hen var för sen. Villkoret behövde inte vara felskrivet för att vilseleda;
  // det räckte att det saknades där frågan ställs.
  const bad: string[] = [];
  for (const { p, t } of ALL) {
    // Bara ytor som erbjuder reklamation som väg till kunden. ARN-stycket i
    // tvistelösning nämner "reklamationsnämnden" och är något annat.
    if (!/(är|blir) det (i stället |istället )?en \*?\*?reklamation|gör en reklamation|reklamera /i.test(t)) continue;
    const term = /tre års? reklamationsrätt|tre år|konsumentköplagen|COMPLAINT/i.test(t);
    if (!term) bad.push(p);
  }
  assert.deepEqual(bad, []);
});
