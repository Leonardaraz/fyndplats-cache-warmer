// node --experimental-strip-types --no-warnings jamfor.mts <sökväg till headless-site>
import { readFileSync, readdirSync } from "node:fs";
const BUTIK = process.argv[2]; // sökväg till headless-site
const KALLA = new URL(".", import.meta.url).pathname.replace(/\/$/, "");
const { CATEGORY_SEO } = await import(BUTIK + "/lib/category-seo.ts");
const { CATEGORY_CONTENT } = await import(BUTIK + "/lib/category-content.ts");
let fel = 0, n = 0;
for (const f of readdirSync(KALLA).filter((x) => x.endsWith("-text.json"))) {
  const d = JSON.parse(readFileSync(`${KALLA}/${f}`, "utf8"));
  n++;
  const seo = CATEGORY_SEO[d.slug], c = CATEGORY_CONTENT[d.slug];
  if (JSON.stringify(seo) !== JSON.stringify(d.seo)) { fel++; console.log("SEO OLIKA", d.slug); }
  if (JSON.stringify(c) !== JSON.stringify(d.content)) { fel++; console.log("CONTENT OLIKA", d.slug); }
}
console.log(`${n} källfiler jämförda, ${fel} avvikelser`);
