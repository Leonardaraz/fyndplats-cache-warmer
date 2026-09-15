// Run: node --test --experimental-strip-types 'lib/**/*.test.ts'
//
// FAQ:n sa "Vi delar aldrig uppgifter med tredje part utöver det som krävs för
// leverans och betalning". Sajtens EGEN sekretesspolicy listar samtidigt
// IT- och plattformsleverantörer, marknadsförings- och analysverktyg (Meta,
// TikTok, Google), Google Customer Reviews — dit vi skickar kundens e-post,
// ordernummer, leveransland och leveransdatum — samt myndigheter. Fyra
// mottagarkategorier som FAQ:n förnekade.
//
// App Store-dokumentet hade motsvarande fel i ATT-strängen: "Vi delar aldrig
// dina uppgifter för att identifiera dig personligen", medan Conversions API
// skickar hashad e-post och telefon vars hela syfte är att Meta ska matcha
// besökaren mot ett konto.
//
// Provet fångar formen: ett absolut löfte om att inget delas.
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

const prose = (t: string) =>
  t.replace(/\{\/\*[\s\S]*?\*\/\}/g, " ")
    .replace(/\/\*[\s\S]*?\*\//g, " ")
    .replace(/(^|[^:])\/\/.*$/gm, "$1 ")
    .replace(/<\/?[A-Za-z][^>]*>/g, "")
    .replace(/\s+/g, " ");

const ALL = ROOTS.flatMap((r) => files(r)).map((p) => ({ p, t: prose(readFileSync(p, "utf8")) }));

test("det finns filer att granska", () => {
  assert.ok(ALL.length > 50, `hittade bara ${ALL.length} filer`);
});

test("ingen text lovar absolut att uppgifter aldrig delas", () => {
  // "aldrig" om delning av personuppgifter är nästan alltid osant för en
  // e-handel: betalning, frakt, mejlutskick, drift och analys innebär alla att
  // uppgifter behandlas av någon annan. Skriv vad som gäller i stället.
  const bad: string[] = [];
  for (const { p, t } of ALL) {
    for (const m of t.match(/[^.!?]*\baldrig\b[^.!?]*(uppgifter|personuppgifter|data)[^.!?]*[.!?]/gi) || []) {
      if (!/dela|lämna(r|s)? ut|säljer|skickar|överför/i.test(m)) continue;
      bad.push(`${p}: ${m.trim().slice(0, 110)}`);
    }
    for (const m of t.match(/[^.!?]*(delar|lämnar ut|säljer|överför)[^.!?]*\baldrig\b[^.!?]*[.!?]/gi) || []) {
      if (!/uppgifter|personuppgifter|\bdata\b/i.test(m)) continue;
      bad.push(`${p}: ${m.trim().slice(0, 110)}`);
    }
  }
  assert.deepEqual([...new Set(bad)], []);
});

test("ingen text säger att uppgifterna används ENDAST till några få saker", () => {
  // "används endast för beställning, kundkontakt och nyhetsbrev" utelämnade
  // analys, annonsering och teknisk drift, som policyn själv redovisar.
  const bad: string[] = [];
  for (const { p, t } of ALL) {
    for (const m of t.match(/[^.!?]*(uppgifter|personuppgifter)[^.!?]{0,40}\banvänds endast\b[^.!?]*[.!?]/gi) || []) {
      bad.push(`${p}: ${m.trim().slice(0, 110)}`);
    }
  }
  assert.deepEqual(bad, []);
});
