#!/usr/bin/env node
// Letar döda bildadresser i bloggens markdown.
//
// ☠️ VARFÖR DET HÄR FINNS. Bloggens produktbilder är FASTA markdown-länkar,
// skrivna när inlägget skrevs. Byter produkten bild, eller städar motorns
// nattliga mediarensning bort den gamla, blir länken 403 — permanent, eftersom
// papperskorgen räknas mot lagringen. Ingenting går sönder i bygget, inga
// tester faller, och sidan renderar perfekt. Bilden är bara borta.
//
// Så låg fyra omslag och åtta produktbilder döda tills någon råkade titta på
// bloggen i sin telefon.
//
// Det här kan inte vara ett vanligt test: det kräver nätverk, och ett test som
// beror på ett externt CDN blir ett test som faller av fel skäl. Det är ett
// skript man kör, till exempel innan man rör bloggen.
//
//   node scripts/blog-image-check.mjs
//
// Avslutar med kod 1 om någon adress inte svarar 200, så det går att haka på
// ett schema senare om vi vill.

import { readdirSync, readFileSync, existsSync } from "node:fs";
import { join } from "node:path";

const KATALOG = join(process.cwd(), "content/blog");
const PUBLIC = join(process.cwd(), "public");
const SAMTIDIGA = 6;

/** Varje bildadress i ett inlägg: omslaget i frontmatter + länkarna i texten. */
function adresser(fil) {
  const text = readFileSync(join(KATALOG, fil), "utf8");
  const ut = [];
  const omslag = text.match(/^cover:\s*(\S+)\s*$/m);
  if (omslag) ut.push({ fil, url: omslag[1], var: "cover" });
  for (const m of text.matchAll(/https:\/\/static\.wixstatic\.com\/media\/[A-Za-z0-9_~.-]+/g)) {
    ut.push({ fil, url: m[0], var: "text" });
  }
  // Samma bild kan förekomma flera gånger i ett inlägg — kolla den en gång.
  const sedda = new Set();
  return ut.filter((a) => !sedda.has(a.url) && sedda.add(a.url));
}

async function kolla(a) {
  // Relativa adresser bor i /public och kollas på disk — snabbare och sant
  // även innan filen är deployad.
  if (a.url.startsWith("/")) {
    return { ...a, status: existsSync(join(PUBLIC, a.url)) ? 200 : 404, lokal: true };
  }
  try {
    const r = await fetch(a.url, { method: "GET", redirect: "follow" });
    return { ...a, status: r.status };
  } catch (e) {
    return { ...a, status: 0, fel: String(e?.message || e) };
  }
}

const alla = readdirSync(KATALOG)
  .filter((f) => f.endsWith(".md"))
  .flatMap(adresser);

const resultat = [];
for (let i = 0; i < alla.length; i += SAMTIDIGA) {
  resultat.push(...(await Promise.all(alla.slice(i, i + SAMTIDIGA).map(kolla))));
}

const doda = resultat.filter((r) => r.status !== 200);

console.log(`${resultat.length} bildadresser i ${new Set(alla.map((a) => a.fil)).size} inlägg`);
if (!doda.length) {
  console.log("Alla svarar 200.");
  process.exit(0);
}

console.log(`\n${doda.length} DÖDA:\n`);
for (const d of doda) {
  console.log(`  ${d.status}  ${d.fil.replace(/\.md$/, "")}  (${d.var})`);
  console.log(`       ${d.url}`);
}
console.log(
  "\nEtt omslag lagas genom att lägga bilden i /public och peka relativt.\n" +
    "En produktbild i texten lagas med produktens NUVARANDE bild — hämta den\n" +
    "från produktsidans og:image, så visar bloggen samma bild som butiken.",
);
process.exit(1);
