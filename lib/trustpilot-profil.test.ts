// lib/trustpilot-profil.test.ts
//
// Run: node --test --experimental-strip-types 'lib/**/*.test.ts'
//
// Vaktar Trustpilots gratisdel (2026-10-22). Omdömessidan, sidfoten och
// layouten är serverkomponenter, så testet läser källkoden i stället för att
// rendera den.
import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import {
  TRUSTBOX_TEMPLATES,
  TRUSTPILOT_OMDOME_URL,
  TRUSTPILOT_PROFIL_ID,
  TRUSTPILOT_PROFIL_URL,
} from "./trustpilot-profil.ts";

/** Källkoden utan rader som bara är kommentarer. */
function kod(fil: string): string {
  return readFileSync(join(process.cwd(), fil), "utf8").replace(/^\s*\/\/.*$/gm, "");
}

test("profilens ID och adresser har Trustpilots form", () => {
  assert.match(TRUSTPILOT_PROFIL_ID, /^[0-9a-f]{24}$/);
  assert.equal(TRUSTPILOT_PROFIL_URL, "https://se.trustpilot.com/review/fyndplats.se");
  assert.equal(TRUSTPILOT_OMDOME_URL, "https://se.trustpilot.com/evaluate/fyndplats.se");
  for (const mall of Object.values(TRUSTBOX_TEMPLATES)) assert.match(mall, /^[0-9a-f]{24}$/);
});

test("omdömessidan visar gratiskontots knapp och slår inte på de betalda widgetarna", () => {
  const sida = kod("app/omdomen/page.tsx");
  const knapp = kod("components/trustpilot-insamling.tsx");
  assert.ok(sida.includes("<TrustpilotInsamling />"));
  assert.ok(sida.includes("href={TRUSTPILOT_PROFIL_URL}"));
  assert.match(knapp, /templateId=\{TRUSTBOX_TEMPLATES\.reviewCollector\}/);
  assert.match(knapp, /businessUnitId=\{TRUSTPILOT_PROFIL_ID\}/);
  // Variabeln döljer våra egna omdömen på produktsidorna (lib/rating.ts).
  // Läste gratisdelen den, hade den som satte ID:t för knappens skull slagit
  // av omdömena i hela butiken.
  for (const [fil, text] of [
    ["app/omdomen/page.tsx", sida],
    ["components/trustpilot-insamling.tsx", knapp],
  ]) {
    assert.ok(!text.includes("TRUSTPILOT_BUSINESS_UNIT_ID"), `${fil} ska inte läsa TRUSTPILOT_BUSINESS_UNIT_ID`);
  }
});

test("Trustpilots widget visas bara med samtycke till alla cookies", () => {
  const knapp = kod("components/trustpilot-insamling.tsx");
  assert.match(knapp, /useMarketingConsent\(\)/);
  const grind = knapp.indexOf("if (!samtycke)");
  const widget = knapp.indexOf("<TrustBox");
  assert.ok(grind > 0, "grinden saknas");
  assert.ok(widget > grind, "widgeten ska renderas efter grinden");
  // Utan samtycke en vanlig länk till samma sida hos Trustpilot.
  assert.match(knapp.slice(grind, widget), /href=\{TRUSTPILOT_OMDOME_URL\}/);
});

test("klientmodulen exporterar bara komponenten", () => {
  // En serverkomponent som läser en konstant ur en "use client"-fil får en
  // klientreferens i stället för värdet. Sidfoten läste mall-ID:t så.
  const klient = kod("components/trustpilot.tsx");
  assert.ok(klient.startsWith('"use client"'));
  assert.ok(!/export\s+const\b/.test(klient), "components/trustpilot.tsx ska inte exportera konstanter");
  for (const fil of ["components/site.tsx", "components/pdp-reviews-section.tsx"]) {
    assert.match(kod(fil), /import \{ TRUSTBOX_TEMPLATES \} from "\.\.\/lib\/trustpilot-profil";/, fil);
  }
});

test("organisationens sameAs pekar på Trustpilot-profilen", () => {
  const layout = kod("app/layout.tsx");
  const start = layout.indexOf("sameAs: [");
  assert.ok(start > 0, "sameAs saknas");
  const sameAs = layout.slice(start, layout.indexOf("],", start));
  assert.ok(sameAs.includes("TRUSTPILOT_PROFIL_URL"));
});
