// scripts/gpsr-kandidater.ts
//
// Tar fram de Aosom-produkter vars säkerhetstext behöver översättas: nya i
// feeden, eller sådana där Aosom skrivit om den tyska texten sedan senaste
// bygget (kandidatHash skiljer sig). Se lib/gpsr/aosom.ts.
//
// Översättningen görs UTANFÖR motorn (Leonard 2026-09-27: inga API-anrop i
// drift) — i en Claude Code-session som läser filen detta skript skriver och
// lämnar tillbaka {"<sku>": ["svensk rad", …]}. Den förs sedan in med
// scripts/gpsr-bygg.ts.
//
// Körs:  AOSOM_FEED_URL=<adress> npx tsx scripts/gpsr-kandidater.ts ut.json
// Feedadressen bär våra inköpspriser — den ligger i Wix-raden
// FyndplatsAppConfig (aosomFeedUrl) och ska aldrig checkas in.

import { writeFileSync } from "node:fs";
import { fetchAosomFeed } from "../lib/aosom/feed";
import { kandidatHash, kandidatMeningar } from "../lib/gpsr/aosom";
import { gpsrForSku } from "../lib/gpsr/data";

async function main() {
  const ut = process.argv[2];
  if (!ut) throw new Error("Ange utfil: npx tsx scripts/gpsr-kandidater.ts ut.json");
  const url = process.env.AOSOM_FEED_URL;
  if (!url) throw new Error("AOSOM_FEED_URL saknas.");
  const rader = await fetchAosomFeed(url);
  const att: { sku: string; namn: string; k: string[] }[] = [];
  let oforandrade = 0;
  let utanKandidater = 0;
  for (const r of rader) {
    const k = kandidatMeningar(r.descriptionHtml, r.bulletsHtml);
    const post = gpsrForSku(r.sku);
    if (post && post.h === kandidatHash(k)) { oforandrade++; continue; }
    if (k.length === 0) utanKandidater++;
    att.push({ sku: r.sku, namn: r.name.slice(0, 120), k });
  }
  writeFileSync(ut, JSON.stringify(att, null, 0));
  console.log(JSON.stringify({ feedrader: rader.length, oforandrade, attOversatta: att.length, utanKandidater }));
}

main().catch((e) => { console.error(e); process.exit(1); });
