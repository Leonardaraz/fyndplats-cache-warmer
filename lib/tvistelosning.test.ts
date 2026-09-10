// Run: node --test --experimental-strip-types 'lib/**/*.test.ts'
//
// Fyra sidor skickade en kund med en tvist till EU:s ODR-plattform. Den stängde
// 20 juli 2025 — förordning (EU) 2024/3228 upphävde 524/2013 — och
// ec.europa.eu/consumers/odr omdirigerar sedan dess till kommissionens egen
// nedläggningsnotis. Länken var alltså inte trasig på ett sätt som syns i en
// länkkontroll; den svarade 200 och ledde till en sida som säger att vägen inte
// finns. Ingenting i repot kunde upptäcka det.
//
// Testet gör två saker. Det spärrar avvecklade tvistevägar, och det kräver att
// varje sida som över huvud taget nämner tvistelösning pekar på ARN — den
// skyldigheten följer av 5 § lagen (2015:671) om alternativ tvistlösning i
// konsumentförhållanden och försvann inte med ODR-plattformen.
import test from "node:test";
import assert from "node:assert/strict";
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";

const ROOTS = ["app", "components", "emails", "content", "docs"];
const EXT = /\.(ts|tsx|md|mdx)$/;
const SKIP = /node_modules|\.next|\.test\.tsx?$/;

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

// Kommentarer strippas: bakgrunden till varför ODR togs bort står som kommentar
// i kopvillkor och butikspolicyer, och den ska få nämna adressen den beskriver.
const prose = (t: string) =>
  t.replace(/\{\/\*[\s\S]*?\*\/\}/g, " ")
    .replace(/\/\*[\s\S]*?\*\//g, " ")
    .replace(/(^|[^:])\/\/.*$/gm, "$1 ");

const ALL = ROOTS.flatMap((r) => files(r)).map((p) => ({ p, t: prose(readFileSync(p, "utf8")) }));

/** Vägar vi en gång hänvisade till och som inte längre tar emot konsumenter. */
const RETIRED: { pattern: RegExp; what: string; since: string }[] = [
  {
    pattern: /ec\.europa\.eu\/consumers\/odr|webgate\.ec\.europa\.eu\/odr/i,
    what: "EU:s ODR-plattform",
    since: "20 juli 2025, förordning (EU) 2024/3228",
  },
];

test("repot innehåller filer att granska", () => {
  assert.ok(ALL.length > 40, `hittade bara ${ALL.length} filer — sökvägarna är fel`);
});

test("ingen kundtext hänvisar till en avvecklad tvisteväg", () => {
  const bad: string[] = [];
  for (const { p, t } of ALL) {
    for (const r of RETIRED) {
      if (r.pattern.test(t)) bad.push(`${p}: ${r.what} (nedlagd ${r.since})`);
    }
  }
  assert.deepEqual(bad, []);
});

test("varje sida som talar om tvistelösning pekar på ARN", () => {
  // ARN är den väg som faktiskt finns. Ryker den ur en sida är sidan sämre än
  // innan ODR togs bort, inte bättre.
  const bad: string[] = [];
  for (const { p, t } of ALL) {
    if (!/tvistelösning|tvistlösning|Kan tvisten inte lösas/i.test(t)) continue;
    if (/arn\.se|reklamationsnämnd/i.test(t)) continue;
    bad.push(p);
  }
  assert.deepEqual(bad, []);
});
