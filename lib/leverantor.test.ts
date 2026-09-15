// Run: node --test --experimental-strip-types 'lib/**/*.test.ts'
//
// "Vi är leverantören för kunden." (Leonard, 2026-09-11.)
//
// Kunden har köpt av Fyndplats. Vem vi i vår tur köper av är en uppgift i vårt
// inköpsled och har inget på en produktsida att göra — den upplyser inte kunden
// om något hen behöver veta, och den bjuder in till att handla förbi oss.
//
// VAD PROVET KAN OCH INTE KAN. Det läser KÄLLAN till de ytor som renderar copy:
// app/, components/, emails/, content/. Det kan alltså fånga att någon skriver
// in ett leverantörsnamn i en mening. Det kan INTE se produktbeskrivningarna —
// de kommer från Wix vid körning, skrivna av importen, och måste tvättas där de
// renderas. Den delen är mätt separat mot skarp HTML.
//
// KODKOMMENTARER OCH IDENTIFIERARE ÄR UNDANTAGNA med flit. `ReviewSource =
// "aosom" | "aliexpress"` är data vi behöver för att veta vems omdöme vi visar,
// och filhuvudet i lib/retur-policy.ts MÅSTE få förklara varifrån dag 15–30
// kommer — annars tappar nästa läsare motiveringen. Kommentarer är till för
// oss; prosa är till för kunden. prose() nedan skiljer dem åt.
//
// app/api och app/admin är inte kundvända och läses inte.
import test from "node:test";
import assert from "node:assert/strict";
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";

const ROOTS = ["app", "components", "emails", "content"];
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

const ALL = ROOTS.flatMap((r) => files(r)).map((p) => ({ p, t: prose(readFileSync(p, "utf8")) }));

test("det finns kundvända ytor att granska", () => {
  assert.ok(ALL.length > 30, `hittade bara ${ALL.length} filer`);
});

test("ingen kundvänd text nämner en leverantör vid namn", () => {
  const LEVERANTOR = /\b(aosom|mh\s*handel|ali\s?express)\b/i;
  const bad: string[] = [];
  for (const { p, t } of ALL) {
    for (const mening of t.split(/(?<=[.!?])\s+/)) {
      const m = mening.match(LEVERANTOR);
      if (m) bad.push(`${p}: ${m[0]} — "${mening.trim().slice(0, 120)}"`);
    }
  }
  assert.deepEqual(bad, []);
});

test("ingen kundvänd text visar ett leverantörsartikelnummer", () => {
  // Aosoms artikelnummer har formen 838-595V00ND: tre siffror, bindestreck, och
  // en blandning av siffror och versaler. Vårt eget FP-prefix är något annat och
  // fälls inte här — det är slug-format och avslöjar ingenting om inköpsledet.
  const SKU = /\b\d{3}-\d{3}[A-Z0-9]{4,}\b/;
  const bad: string[] = [];
  for (const { p, t } of ALL) {
    const m = t.match(SKU);
    if (m) bad.push(`${p}: ${m[0]}`);
  }
  assert.deepEqual(bad, []);
});
