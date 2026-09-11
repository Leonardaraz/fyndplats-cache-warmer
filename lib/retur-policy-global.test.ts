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
    // JSX styckar meningar mitt itu. `Då är det en{" "}<a ...>reklamation</a>`
    // läses av kunden som en enda mening, men matchade inget mönster här — det
    // var så ångerformulärets reklamationsnotis slank förbi. Taggar och
    // {" "}-uttryck tas bort så texten läses som den visas.
    .replace(/\{"\s*"\}|\{'\s*'\}/g, " ")
    .replace(/<\/?[A-Za-z][^>]*>/g, "")
    // ...och sedan blanktecknen. Att bara ta bort taggen räckte inte: kvar låg
    // radbrytning och indrag, så "Då är det en\n        reklamation" matchade
    // fortfarande ingenting. Mönstren ska läsa texten som den visas, på en rad.
    .replace(/\s+/g, " ")
    .replace(/\{TOTAL_SUMMARY\}|TOTAL_SUMMARY/g, " totalt 30 dagar dag 15–30 ")
    .replace(/\{TOTAL_SHORT\}|TOTAL_SHORT/g, " totalt 30 dagar ");

const ALL = ROOTS.flatMap((r) => files(r)).map((p) => {
  const raw = readFileSync(p, "utf8");
  return { p, t: prose(raw), raw };
});

// En yta kan bära en regel på två sätt: skriva ut den, eller rendera den delade
// konstanten som bär den. Prosa-vyn ser bara det första — `{AVGIFT_SENTENCE}`
// är ett uttryck, inte text — så proven nedan frågar källan om referensen.
//
// MEN INTE RÅKÄLLAN. Ett mutationstest fällde första versionen: jag rev ut
// `<p>{SKRYMMANDE_RETURKOSTNAD}</p>` ur /returer och provet förblev grönt,
// eftersom `import { SKRYMMANDE_RETURKOSTNAD }` stod kvar på rad 4. Exakt samma
// hål som det kvarlämnade `import { COMPLAINT }` en gång gav. Import-raderna
// måste bort innan referensen räknas — en import är inte en rendering.
const utanImport = (raw: string) =>
  raw.replace(/^\s*import[\s\S]*?from\s+["'][^"']+["'];?\s*$/gm, " ");

const renderar = (e: { raw: string }, ...namn: string[]) => {
  const kropp = utanImport(e.raw);
  return namn.some((n) => new RegExp(`\\b${n}\\b`).test(kropp));
};

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
    // Ingen "peka vidare"-utväg här. Jag provade en, och mutationstestet visade
    // varför den inte håller: /returer friades av en /kopvillkor-länk i sin egen
    // fot, alltså av en länk som inte har med reklamationen att göra. Erbjuder en
    // yta reklamation som väg ska den säga hur länge rätten gäller. Det är en
    // mening.
    const term = /tre års? reklamationsrätt|tre år|konsumentköplagen|COMPLAINT\./i.test(t);
    if (!term) bad.push(p);
  }
  assert.deepEqual(bad, []);
});

test("ingen text lovar frakten tillbaka utan att säga när", () => {
  // "Har du betalat frakt återbetalas även standardfrakten" stod villkorslöst i
  // ångerkvittot medan samma mejls fot sa motsatsen för dag 15–30. Ett löfte om
  // utgående frakt måste bära sin period, annars är det en utfästelse vi bryter
  // mot var tredje retur.
  const bad: string[] = [];
  for (const { p, t } of ALL) {
    const chunks = t.split(/(?<=[.!?])\s+/);
    chunks.forEach((s, i) => {
      if (!/återbetalas (även |också )?(standardfrakten|frakten)|återbetalar (även |också )?frakten/i.test(s)) return;
      const context = [chunks[i - 1] || "", s, chunks[i + 1] || ""].join(" ");
      if (/14 dagar|dag 1–14|ångerfrist|dag 15|15–30|lagstadgad/i.test(context)) return;
      bad.push(`${p}: ${s.trim().replace(/\s+/g, " ").slice(0, 100)}`);
    });
  }
  assert.deepEqual(bad, []);
});

test("ingen yta lovar en annan återbetalningstid än den delade", () => {
  // "5–10 bankdagar" stod på sju ytor och var fel — vi är klara på 2–3
  // arbetsdagar. Ett prov behövs eftersom siffran är den sorts uppgift som
  // ändras i verkligheten och glöms i texten.
  //
  // Bankens clearingtid är något annat och får ha egna tal: mejlen om att
  // pengarna SYNS på kontot talar om kundens bank, inte om oss.
  const bad: string[] = [];
  for (const { p, t } of ALL) {
    const chunks = t.split(/(?<=[.!?])\s+/);
    chunks.forEach((s) => {
      if (!/(vi )?(åter)?betalar (tillbaka )?inom|återbetalning (sker )?(till[^.]*)?inom|Återbetalning inom/i.test(s)) return;
      if (/syns på (ditt )?konto|beror.{0,20}(på )?din bank/i.test(s)) return; // bankens tid
      if (/2–3 arbetsdagar|REFUND_TIME|REFUND_SENTENCE/.test(s)) return;
      if (/lagens|14 § |distansavtalslagen/i.test(s)) return; // lagens yttersta frist
      bad.push(`${p}: ${s.trim().replace(/\s+/g, " ").slice(0, 100)}`);
    });
  }
  assert.deepEqual(bad, []);
});

test("den som tar ut bearbetningsavgiften säger också att den finns", () => {
  // Avgiften dag 15–30 är giltig (1 kap. 4 §: ingen lagregel att vara sämre än
  // när erbjudandet är vårt eget) — men bara så länge kunden får veta om den
  // FÖRE köpet. Ett villkor som är giltigt men outtalat är vilseledande
  // marknadsföring även när avtalsrätten håller.
  //
  // Kravet gäller de ytor som faktiskt skriver ut villkoren för dag 15–30.
  // Brickor och meta-beskrivningar som bara säger "30 dagars öppet köp" fälls
  // inte här; de är inte platsen där villkoren står, och terms är ett klick
  // bort. Var den gränsen ska gå är en fråga för en jurist, inte för mig.
  const AVGIFT = /bearbetningsavgift|10\s*%\s*av vad du betalat|avgift på 10\s*%/i;
  const bad: string[] = [];
  for (const e of ALL) {
    const { p, t } = e;
    // Ytan skriver ut villkoren för det frivilliga öppna köpet om den nämner
    // både perioden och minst ett av dess villkor.
    if (!/dag 15\s*[–-]\s*30/i.test(t)) continue;
    if (!/(oanvänd|säljbart skick|spårbart|skriftligt)/i.test(t)) continue;
    // Pekaren står i href="/returer", alltså INNE i en tagg — och prose() river
    // taggar. Frågas prosa-vyn försvinner varje länk, och provet fäller sidor
    // som gör rätt. Pekaren ska därför läsas ur råkällan.
    const pekar = /\/returer/i.test(e.raw) && !/app\/returer\//.test(p);
    if (!AVGIFT.test(t) && !renderar(e, "AVGIFT_SENTENCE") && !pekar) bad.push(p);
  }
  assert.deepEqual(bad, []);
});

test("den som säger att kunden betalar returen säger också vad skrymmande kostar", () => {
  // 2 kap. 2 § första stycket 11 kräver BELOPPET före köp för varor som inte
  // kan återsändas med post. Står bara "returfrakten betalas av kunden" är
  // upplysningen ofullständig — och då bär vi kostnaden enligt 13 § första
  // stycket. Ytan får antingen bära beloppet eller peka vidare till /returer,
  // men /returer kan inte peka på sig själv.
  const BELOPP = /\d[\d\s]*–[\d\s]*\d\s*kr/;
  const SKRYMMANDE = /skrymmande|styckegods|120\s*cm/i;
  const bad: string[] = [];
  for (const e of ALL) {
    const { p, t } = e;
    if (!/returfrakten betalas av (dig|kunden)|returfrakten betalas av dig som kund/i.test(t)) continue;
    const bar = (SKRYMMANDE.test(t) && BELOPP.test(t))
      || renderar(e, "SKRYMMANDE_RETURKOSTNAD", "SKRYMMANDE_RETURKOSTNAD_KORT");
    const pekar = /\/returer/i.test(e.raw) && !/app\/returer\//.test(p);
    if (!bar && !pekar) bad.push(p);
  }
  assert.deepEqual(bad, []);
});
