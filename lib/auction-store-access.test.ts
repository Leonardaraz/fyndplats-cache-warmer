// ☠️ Ingen fil i butiken läser eller skriver Fyndauktionen i Wix Data.
//
// Tvilling till lib/review-store-access.test.ts. Raderna flyttar till Postgres
// (2026-09-29), och efter raderingen hade en kvarglömd Wix-läsning inte gått
// sönder — den hade blivit TOM. /fyndauktion hade visat noll fynd utan ett
// enda fel. Motorn äger lagret; butiken går via lib/auction-motor.ts.

import { test } from "node:test";
import assert from "node:assert/strict";
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";

const FLYTTAD_KOLLEKTION = "FyndplatsAuctions";

/** Wix Data-anrop i båda adressformerna (`/data/v2/…` och `/wix-data/v2/…`). */
const WIX_DATA_ANROP = /wixapis\.com\/(wix-)?data\/v\d|\/(wix-)?data\/v\d\/(items|bulk)\b|dataCollectionId/;

const HOPPA_OVER = new Set([".next", "node_modules", ".git", "wix-velo", "public", ".vercel"]);

function källfiler(rot: string, träff: string[] = []): string[] {
  for (const namn of readdirSync(rot)) {
    if (HOPPA_OVER.has(namn)) continue;
    const sökväg = join(rot, namn);
    if (statSync(sökväg).isDirectory()) källfiler(sökväg, träff);
    else if (/\.(ts|tsx|js|mjs)$/.test(namn) && !namn.endsWith(".test.ts")) träff.push(sökväg);
  }
  return träff;
}

function utanKommentarer(källa: string): string {
  return källa.replace(/\/\*[\s\S]*?\*\//g, "").replace(/^[ \t]*\/\/.*$/gm, "");
}

test("☠️ ingen fil når auktionskollektionen i Wix Data — motorn äger lagret", () => {
  const skyldiga: string[] = [];
  for (const fil of källfiler(process.cwd())) {
    const kod = utanKommentarer(readFileSync(fil, "utf8"));
    if (kod.includes(FLYTTAD_KOLLEKTION) && WIX_DATA_ANROP.test(kod)) {
      skyldiga.push(fil.replace(process.cwd() + "/", ""));
    }
  }
  assert.deepEqual(
    skyldiga,
    [],
    "Filerna nedan når FyndplatsAuctions direkt i Wix Data. Efter växlingen till\n"
      + "Postgres blir läsningen tom och skrivningen försvinner. Gå via\n"
      + "lib/auction-motor.ts i stället:\n  " + skyldiga.join("\n  "),
  );
});

test("vyn och webhookens avslut går via motorn", () => {
  const vy = readFileSync(join(process.cwd(), "lib/auction-view.ts"), "utf8");
  const sald = readFileSync(join(process.cwd(), "lib/auction-sold.ts"), "utf8");
  assert.match(vy, /hämtaAuktionsrader\("live"\)/);
  assert.match(vy, /hämtaAuktionsrader\("sold"\)/);
  assert.match(sald, /avslutaHosMotorn\(productIds\)/);
});
