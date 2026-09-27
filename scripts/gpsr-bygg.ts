// scripts/gpsr-bygg.ts
//
// För in översatt säkerhetstext i lib/gpsr/aosom-data.json.
//
// Indata: feeden (för märke och kandidatmeningar) och en eller flera
// resultatfiler {"<sku>": ["svensk rad", …]} från översättningen.
// Varje rad tvättas (tvattaSakerhet) och kontrolleras mot källan: en rad med
// ett tal som inte finns i den tyska texten stoppar bygget, eftersom en
// påhittad maxbelastning eller åldersgräns är en felaktig säkerhetsuppgift.
// Produkter utan kandidatmeningar får en tom lista utan översättning.
//
// Körs:  AOSOM_FEED_URL=<adress> npx tsx scripts/gpsr-bygg.ts resultat1.json [resultat2.json …]

import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { fetchAosomFeed } from "../lib/aosom/feed";
import {
  kandidatHash,
  kandidatMeningar,
  markeUrAosomUrl,
  paHittadeTal,
  tvattaSakerhet,
  type GpsrDataFil,
} from "../lib/gpsr/aosom";

// Körs från repots rot.
const DATAFIL = join(process.cwd(), "lib", "gpsr", "aosom-data.json");

async function main() {
  const filer = process.argv.slice(2);
  const url = process.env.AOSOM_FEED_URL;
  if (!url) throw new Error("AOSOM_FEED_URL saknas.");

  const oversatt: Record<string, unknown> = {};
  for (const f of filer) Object.assign(oversatt, JSON.parse(readFileSync(f, "utf8")));

  const data = JSON.parse(readFileSync(DATAFIL, "utf8")) as GpsrDataFil;
  const rader = await fetchAosomFeed(url);
  const fel: string[] = [];
  let nya = 0;
  let saknas = 0;

  for (const r of rader) {
    const k = kandidatMeningar(r.descriptionHtml, r.bulletsHtml);
    const h = kandidatHash(k);
    const m = markeUrAosomUrl(r.url);
    const gammal = data.poster[r.sku];
    if (gammal && gammal.h === h) {
      if (gammal.m !== m) gammal.m = m;
      continue;
    }
    let s: string[];
    if (k.length === 0) {
      s = [];
    } else if (r.sku in oversatt) {
      s = tvattaSakerhet(oversatt[r.sku]);
      for (const rad of s) {
        const tal = paHittadeTal(rad, k);
        if (tal.length) fel.push(`${r.sku}: "${rad}" har tal som inte finns i källan: ${tal.join(", ")}`);
      }
    } else {
      saknas++;
      continue; // ingen översättning än — posten lämnas som den var
    }
    data.poster[r.sku] = { m, s, h };
    nya++;
  }

  if (fel.length) {
    console.error(fel.join("\n"));
    throw new Error(`${fel.length} rader har tal som inte finns i källan — rätta översättningen.`);
  }
  data.genererad = new Date().toISOString().slice(0, 10);
  const sorterad = Object.fromEntries(Object.entries(data.poster).sort(([a], [b]) => a.localeCompare(b)));
  writeFileSync(DATAFIL, JSON.stringify({ ...data, poster: sorterad }) + "\n");
  console.log(JSON.stringify({ poster: Object.keys(sorterad).length, nya, utanOversattning: saknas }));
}

main().catch((e) => { console.error(e); process.exit(1); });
