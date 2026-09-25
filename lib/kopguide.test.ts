// Run: node --test --experimental-strip-types 'lib/**/*.test.ts'
//
// PUNKT 2: en sida får inte kalla sig ett test när inget test har utförts.
//
// /kopguider/{typ} väljer ut produkter ur vårt EGET sortiment efter kategori
// och nyckelord. Det är ett urval och en jämförelse — inte ett jämförande test.
// Att skriva "Bäst i test" över det är ett påstående om en metod vi inte har
// använt, och det är påståendet lagen och åtgärdslistan tar sikte på, inte
// ambitionen bakom urvalet.
//
// VAD SOM FORTFARANDE ÄR TILLÅTET, och med flit: "vi har jämfört", "vi har
// gått igenom", "våra val", "vårt toppval", "rankade", "Budget-val",
// "Premium-val", "Mest för pengarna". Allt det är sant om vad vi gör. Det är
// ordet TEST — och rollerna testvinnare/vann vårt test — som ljuger.
//
// VARFÖR PROVET LÄSER lib/seo: copyn för de här sidorna bor INTE i app/ utan i
// lib/seo/programmatic-templates.ts, som slot-fyller titlar, H1 och meta ur
// varianter. Ett prov som bara läste app/ och components/ hade friat sidorna
// helt — hela texten ligger utanför dem.
//
// KODKOMMENTARER OCH IDENTIFIERARE ÄR UNDANTAGNA, samma gräns som
// lib/leverantor.test.ts drar: filhuvudet ovan MÅSTE få skriva ut frasen för
// att kunna förbjuda den. prose() skiljer kommentar från copy.
import test from "node:test";
import assert from "node:assert/strict";
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";

const ROOTS = ["app", "components", "emails", "content", "lib/seo"];
const EXT = /\.(ts|tsx|md|mdx)$/;
const SKIP = /node_modules|\.next|\.test\.tsx?$|^app\/api\/|^app\/admin\//;

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

const prose = (t: string) =>
  t.replace(/\{\/\*[\s\S]*?\*\/\}/g, " ")
    .replace(/\/\*[\s\S]*?\*\//g, " ")
    .replace(/(^|[^:])\/\/.*$/gm, "$1 ")
    .replace(/^\s*import[\s\S]*?from\s+["'][^"']+["'];?\s*$/gm, " ")
    .replace(/<\/?[A-Za-z][^>]*>/g, "")
    .replace(/\{"\s*"\}/g, " ")
    .replace(/\s+/g, " ");

const RAW = ROOTS.flatMap((r) => files(r)).map((p) => ({ p, raw: readFileSync(p, "utf8") }));
const ALL = RAW.map(({ p, raw }) => ({ p, t: prose(raw) }));

test("copyn för köpguiderna finns där provet letar", () => {
  // Utan den här kontrollen blir provet grönt även om filen byter namn eller
  // mapp — och då vaktar det ingenting alls.
  const harTemplates = RAW.some((f) => f.p.includes("programmatic-templates"));
  assert.ok(harTemplates, "hittade inte lib/seo/programmatic-templates.ts");
  assert.ok(ALL.length > 30, `hittade bara ${ALL.length} filer`);
});

test("ingen kundvänd text påstår att vi utfört ett test", () => {
  // Fraser, inte ordet "test" ensamt: "vi testar produkter" är punkt 11 och
  // ett påstående Leonard säger är sant. Det här provet gäller bara
  // jämförande-test-påståendet.
  const TESTPASTAENDE =
    /\bbäst(a)?\s+i\s+test\b|\btestvinnare\b|\bvann\s+(vårt|våra)\s+test\b|\bbäst\s+enligt\s+(vårt|våra)\s+test\b|\bi\s+hela\s+testet\b|\bvårt\s+test\b/i;
  const bad: string[] = [];
  for (const { p, t } of ALL) {
    for (const mening of t.split(/(?<=[.!?])\s+/)) {
      const m = mening.match(TESTPASTAENDE);
      if (m) bad.push(`${p}: "${m[0]}" — ${mening.trim().slice(0, 120)}`);
    }
  }
  assert.deepEqual(bad, []);
});

test("ingen kundvänd yta länkar till den gamla adressen", () => {
  // Länkar läses ur RÅTEXTEN: href ligger inne i en tagg, och prose() plockar
  // bort taggar. Samma fälla som pekar-undantaget i retur-policy-global gick i.
  const bad = RAW.filter((f) => f.raw.includes("/basta-i-test/")).map((f) => f.p);
  assert.deepEqual(bad, []);
});

test("den gamla adressen 301:as till den nya", () => {
  // Sidorna är indexerade under /basta-i-test/. Byter vi adress utan redirect
  // tappar vi rankningen och lämnar döda URL:er åt crawlern — hela poängen med
  // att flytta i stället för att döpa om på plats.
  const cfg = readFileSync("next.config.ts", "utf8");
  assert.match(
    cfg,
    /source:\s*"\/basta-i-test\/:type"[\s\S]{0,120}?destination:\s*"\/kopguider\/:type"[\s\S]{0,80}?permanent:\s*true/,
    "saknar permanent redirect /basta-i-test/:type → /kopguider/:type",
  );
});

test("massagepistolerna går till bloggens guide, och regeln står före den generella", () => {
  // Butiken säljer inga massagepistoler, så /kopguider/massagepistoler är tunn
  // och svarar 307 → /butik. /basta-i-test/massagepistoler rankade ändå
  // (plats 18 på "massageapparat bäst i test", Semrush 2026-09-24), och kedjan
  // tog rankningen till /butik. Next tar FÖRSTA regeln som matchar: står den
  // generella /basta-i-test/:type först når adressen aldrig guiden.
  const cfg = readFileSync("next.config.ts", "utf8");
  const specifik = cfg.indexOf('source: "/basta-i-test/massagepistoler"');
  const generell = cfg.indexOf('source: "/basta-i-test/:type"');
  assert.ok(specifik >= 0, "saknar regeln för /basta-i-test/massagepistoler");
  assert.ok(specifik < generell, "regeln för massagepistolerna måste stå före /basta-i-test/:type");
  for (const src of ["/basta-i-test/massagepistoler", "/kopguider/massagepistoler"]) {
    const rad = new RegExp(
      `source:\\s*"${src}"\\s*,\\s*destination:\\s*"/blogg/massagepistol-kopguide-2026"\\s*,\\s*permanent:\\s*true`,
    );
    assert.match(cfg, rad, `${src} ska gå permanent till bloggens massagepistolguide`);
  }
  // Målet måste finnas, annars blir lagningen en 404 i stället för en 307.
  assert.ok(statSync("content/blog/massagepistol-kopguide-2026.md").isFile());
});
