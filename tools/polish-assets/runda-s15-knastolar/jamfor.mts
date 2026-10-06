// Jämför butikens poster mot rundans källfiler, tecken för tecken.
//
//   node --experimental-strip-types jamfor.mts <sökväg till headless-site>
//
// Importerar lib/category-seo.ts och lib/category-content.ts ur butiken och
// kontrollerar knastolar och kontorsstolar mot <slug>-text.json här bredvid.
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const har = dirname(fileURLToPath(import.meta.url));
const butik = process.argv[2];
const { CATEGORY_SEO } = await import(pathToFileURL(join(butik, "lib/category-seo.ts")).href);
const { CATEGORY_CONTENT } = await import(pathToFileURL(join(butik, "lib/category-content.ts")).href);

let fel = 0;
for (const slug of ["knastolar", "kontorsstolar"]) {
  const kalla = JSON.parse(readFileSync(join(har, `${slug}-text.json`), "utf8"));
  const lika =
    JSON.stringify(CATEGORY_SEO[slug]) === JSON.stringify(kalla.seo) &&
    JSON.stringify(CATEGORY_CONTENT[slug]) === JSON.stringify(kalla.content);
  if (!lika) fel++;
  console.log(`${slug}: ${lika ? "LIKA källan" : "SKILJER"}`);
}
const mobler = CATEGORY_CONTENT.mobler.intro.join(" ");
const nämner = mobler.includes("Kontorsstolar, Knästolar, Gamingstolar");
if (!nämner) fel++;
console.log(`mobler: ${nämner ? "nämner Knästolar under Kontor & gaming" : "SAKNAR Knästolar"}`);
process.exit(fel ? 1 : 0);
