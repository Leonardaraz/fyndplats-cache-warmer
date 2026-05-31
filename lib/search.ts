// Lättviktig svensk sök-tokenisering + stemming, delad mellan klient-autocomplete
// (components/searchbox.tsx) och server-sökresultatsidan (app/sok/page.tsx) så
// matchningen är identisk överallt. Ren TS utan node-beroenden → klient-säker.
//
// Problemet vi löser (re-audit 2026-05-31): den gamla sökningen var
// keyword-literal — `knivset` gav 0 träffar trots att en knivhållare ligger på
// startsidan, och `halsband` matchade en halloween-kattdräkt via beskrivningen.
// Lösning: stamma bort vanliga svenska böjnings-/sammansättningssuffix och matcha
// stammen som delsträng i produktnamnet (så "knivset"→"kniv" träffar
// "knivhållare", "halsband" träffar "kedjehalsband"), och prioritera NAMN-träffar
// före beskrivnings-/spec-träffar så relevansen blir rätt.

// Längsta suffix först — vi tar bort EN matchande ändelse och bara om stammen
// blir ≥3 tecken (annars blir "set"→"" och allt matchar).
const SUFFIXES = [
  "erna", "arna", "orna", "andet", "ningen", "heten",
  "ande", "else", "ning", "het", "set", "are", "ast",
  "en", "et", "ar", "er", "or", "na", "an", "n", "t", "s",
];

export function normalize(s: string): string {
  return (s || "").toLowerCase().trim();
}

// Dela på allt som inte är bokstav/siffra (bindestreck, mellanslag, "&", "/").
export function tokenize(s: string): string[] {
  return normalize(s).split(/[^a-zåäö0-9]+/i).filter((t) => t.length > 0);
}

// Lätt stemmer: ta bort ETT känt suffix om stammen blir ≥3 tecken.
export function stem(tok: string): string {
  for (const suf of SUFFIXES) {
    if (tok.length - suf.length >= 3 && tok.endsWith(suf)) {
      return tok.slice(0, -suf.length);
    }
  }
  return tok;
}

// Hur väl matchar `query` ett produktNAMN? 0 = ingen träff.
//   100 — hela söksträngen finns som delsträng i namnet ("vinöppnare")
//    60 — alla söktermers stammar finns som delsträng i namnet (compound-aware:
//         "knivset"→"kniv" i "knivhållare", "halsband" i "kedjehalsband")
//   1–59 — bara några termer matchade (delvis), proportionellt
export function nameScore(name: string, query: string): number {
  const nameNorm = normalize(name);
  const q = normalize(query);
  if (!q || !nameNorm) return 0;
  if (nameNorm.includes(q)) return 100;
  const stems = tokenize(q).map(stem).filter((s) => s.length >= 2);
  if (stems.length === 0) return 0;
  const matched = stems.filter((s) => nameNorm.includes(s)).length;
  if (matched === 0) return 0;
  if (matched === stems.length) return 60;
  return Math.round((matched / stems.length) * 50); // partiell träff
}
