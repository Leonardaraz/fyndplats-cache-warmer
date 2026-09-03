// ☠️ GRINDEN SOM SAKNADES PÅ DEN HÄR SIDAN AV GRÄNSEN.
//
// Motorn har `store-access-audit.test.ts`, som läser källkoden och fäller om
// en fil utanför de ägande modulerna rör en flyttad Wix-kollektion. Den hittade
// spårningssidan 2026-09-01 på sekunder.
//
// Den kunde inte se det här repot. Och här låg `/api/omdome` och skrev kundens
// omdöme RAKT in i FyndplatsImportedReviews med `POST /data/v2/items/save` —
// en skrivning som blir föräldralös i samma sekund REVIEWS_BACKEND=postgres
// slår igenom. Wix svarar 200, ingenting läser raden, och varken kunden, en
// logg eller en felräknare märker något.
//
// Regeln, tredje gången: en migrering är klar först när alla läsare OCH
// skrivare följt med — och gränsen mellan två repon är precis där en glöms
// bort. Därför bor grinden på båda sidor.
//
// Vad som är TILLÅTET: /api/omdome/bild laddar upp kundens foto till Wix
// MEDIA. Media flyttar inte, och en bild är inte en rad i en kollektion.

import { test } from "node:test";
import assert from "node:assert/strict";
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";

/** Kollektionen som flyttar till Postgres. Ingen fil här får röra den. */
const FLYTTAD_KOLLEKTION = "FyndplatsImportedReviews";

/** Wix Data-anrop. Media (`/site-media/`, `/files/`) är en annan sak. */
const WIX_DATA_ANROP = /wixapis\.com\/data\/v\d|\/data\/v\d\/items\//;

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

/** Kommentarer beskriver historien och ska inte fälla — bara riktig kod. */
function utanKommentarer(källa: string): string {
  return källa.replace(/\/\*[\s\S]*?\*\//g, "").replace(/^[ \t]*\/\/.*$/gm, "");
}

test("☠️ ingen fil skriver recensioner till Wix Data — motorn äger lagret", () => {
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
    "Filerna nedan når recensionskollektionen direkt i Wix Data. Efter växlingen\n"
      + "till Postgres läser ingenting den raden — skrivningen försvinner tyst och\n"
      + "läsningen blir tom. Gå via motorn (/api/reviews/... respektive\n"
      + "/api/reviews/customer) i stället:\n  " + skyldiga.join("\n  "),
  );
});

test("kundomdömet postas till motorn, och hemligheten är fail-closed", () => {
  const rutt = readFileSync(join(process.cwd(), "app/api/omdome/route.ts"), "utf8");

  // Skrivvägen ska vara motorn.
  assert.match(rutt, /CACHE_WARMER_REVIEW_INGEST_URL/);
  assert.match(rutt, /api\/reviews\/customer/);

  // ☠️ Utan hemlighet ska rutten svara FEL, inte spara någon annanstans och
  // inte svara kunden "tack!" på ett omdöme som aldrig lagrades.
  assert.match(rutt, /REVIEW_INGEST_SECRET/);
  assert.match(utanKommentarer(rutt), /if \(!ingestSecret\)/);
});
