#!/usr/bin/env node
// Hittar produkt-URL:er som Google fortfarande visar men som butiken inte har kvar.
//
//   node scripts/gsc-doda-urler.mjs <Sidor.csv> [--sitemap URL] [--snabb]
//
// <Sidor.csv> är bladet "Sidor" ur Search Console-exporten (Prestanda →
// Ladda ner → CSV). Kolumnerna är "Vanligaste sidorna, Klick, Exponeringar,
// CTR, Position"; skriptet läser första och tredje kolumnen och struntar i
// resten, så både svensk och engelsk export fungerar.
//
// Varför sitemap och inte Wix-katalogen: sitemap.xml ÄR det Google erbjuds.
// En produkt som finns i Wix men ligger dold saknas där också — och det är
// precis den skillnad som gör URL:en död för en sökare. Dessutom kostar det
// noll Wix-anrop, vilket spelar roll när katalogsvepet redan ätit kvoten.
//
// Varje saknad URL hämtas för att se vad besökaren FAKTISKT får (--snabb
// hoppar över det, och då skrivs ingen batch — se nedan):
//   404                → ärlig död, Google avindexerar den av sig själv
//   308 → /produkt/…   → redan omdirigerad till en levande produkt, inget att göra
//   308 → /kategori/…  → landar rätt avdelning men fel vara
//   308 → /alla-produkter → Google räknar det som soft 404: URL:en blir kvar i
//                           indexet, visas i resultaten, och sökaren landar på
//                           en sida som inte svarar på frågan.
//
// Utdata sist är en `batch`-array att klistra in i workflowen
// "Lägg till 301-redirect" för de URL:er som har en levande ersättare.
// Den skrivs BARA när kontrollen körts. Skälet: skrivningen är en upsert på
// fromSlug, så en gissad rad skulle skriva över en redan korrekt redirect.
// Precis det hade hänt med aktivitetsbordet 2026-08-24 — ordlikheten pekade
// på "aktivitetsbord-barn-musik" medan den riktiga efterföljaren, som redan
// låg i tabellen, var "aktivitetstavla-barn-montessori".

import { readFileSync } from "node:fs";

const SITEMAP = "https://www.fyndplats.se/sitemap.xml";
const args = process.argv.slice(2);
const fil = args.find((a) => !a.startsWith("--"));
const kolla = !args.includes("--snabb");
const sitemapUrl = args[args.indexOf("--sitemap") + 1]?.startsWith("http")
  ? args[args.indexOf("--sitemap") + 1]
  : SITEMAP;

if (!fil) {
  console.error("Ange CSV-filen med bladet Sidor. Se kommentaren överst i filen.");
  process.exit(1);
}

/** Delar en CSV-rad och respekterar citattecken (GSC citerar URL:er med komma). */
function delaRad(rad) {
  const ut = [];
  let cell = "";
  let iCitat = false;
  for (let i = 0; i < rad.length; i++) {
    const c = rad[i];
    if (c === '"') {
      if (iCitat && rad[i + 1] === '"') { cell += '"'; i++; } else iCitat = !iCitat;
    } else if (c === "," && !iCitat) { ut.push(cell); cell = ""; } else cell += c;
  }
  ut.push(cell);
  return ut;
}

/**
 * Siffror kommer som "1 384", "1,384", "1384" eller "1384.0" beroende på om
 * exporten är CSV eller ett ark sparat som CSV. Skilj tusentalstecken från
 * decimaltecken — annars blir 1384.0 avläst som 13840, alltså tio gånger fel.
 */
function tal(varde) {
  const rent = String(varde ?? "").replace(/[\s\u00a0]/g, "");
  if (!rent) return 0;
  if (/^\d{1,3}([.,]\d{3})+$/.test(rent)) return Number(rent.replace(/[.,]/g, ""));
  return Math.round(Number(rent.replace(",", ".")) || 0);
}

function lasExport(sokvag) {
  const rader = readFileSync(sokvag, "utf8").split(/\r?\n/).filter(Boolean);
  const sidor = [];
  for (const rad of rader.slice(1)) {
    const c = delaRad(rad);
    const url = (c[0] || "").trim();
    if (!url.includes("/produkt/")) continue;
    sidor.push({ slug: url.split("/produkt/")[1].replace(/\/$/, ""), klick: tal(c[1]), exp: tal(c[2]) });
  }
  return sidor;
}

async function hamtaSitemap(url) {
  const svar = await fetch(url);
  if (!svar.ok) throw new Error(`sitemap ${svar.status}`);
  const xml = await svar.text();
  const loc = [...xml.matchAll(/<loc>(.*?)<\/loc>/g)].map((m) => m[1]);
  return new Set(loc.filter((l) => l.includes("/produkt/")).map((l) => l.split("/produkt/")[1]));
}

/** Enkel ordöverlappning + teckenlikhet. Räcker för att hitta omdöpta slugar. */
const STOPP = new Set(["och", "med", "for", "i", "av", "till", "pa", "den", "det", "en", "ett", "st", "cm", "mm", "set", "pack", "delar"]);
const dela = (s) => s.split("-").filter((t) => t && !STOPP.has(t) && !/^\d+$/.test(t));

function likhet(a, b) {
  const A = new Set(dela(a));
  const B = new Set(dela(b));
  if (!A.size || !B.size) return 0;
  let gemensamt = 0;
  for (const t of A) if (B.has(t)) gemensamt++;
  const jaccard = gemensamt / (A.size + B.size - gemensamt);
  const tecken = [...a].filter((c, i) => b[i] === c).length / Math.max(a.length, b.length);
  return 0.75 * jaccard + 0.25 * tecken;
}

function bastaMatch(slug, levande) {
  let bast = { poang: 0, slug: "" };
  for (const l of levande) {
    const p = likhet(slug, l);
    if (p > bast.poang) bast = { poang: p, slug: l };
  }
  return bast;
}

async function kollaUrl(slug) {
  try {
    const svar = await fetch(`https://www.fyndplats.se/produkt/${slug}`, { redirect: "manual" });
    return { kod: svar.status, mal: svar.headers.get("location") || "" };
  } catch {
    return { kod: 0, mal: "" };
  }
}

const levande = await hamtaSitemap(sitemapUrl);
const sidor = lasExport(fil);
const doda = sidor.filter((s) => !levande.has(s.slug)).sort((a, b) => b.exp - a.exp);

console.log(`produktsidor i exporten : ${sidor.length}`);
console.log(`levande i sitemap       : ${levande.size}`);
console.log(`saknas (döda URL:er)    : ${doda.length}`);
console.log(`exponeringar på döda    : ${doda.reduce((n, d) => n + d.exp, 0)}`);
console.log(`klick på döda           : ${doda.reduce((n, d) => n + d.klick, 0)}\n`);

const status = new Map();
if (kolla) {
  console.log("Kontrollerar vad varje död URL svarar…\n");
  // Sekventiellt i småklungor: sajten ligger på Vercel och en burst på 200
  // parallella anrop ger 429 som ser ut som döda sidor.
  for (let i = 0; i < doda.length; i += 8) {
    const klunga = doda.slice(i, i + 8);
    const svar = await Promise.all(klunga.map((d) => kollaUrl(d.slug)));
    klunga.forEach((d, n) => status.set(d.slug, svar[n]));
  }
}

const forslag = [];
for (const d of doda) {
  const st = status.get(d.slug);
  if (st && st.mal.includes("/produkt/")) continue; // redan omdirigerad rätt
  const m = bastaMatch(d.slug, levande);
  const rad = `${String(d.exp).padStart(6)} exp ${String(d.klick).padStart(4)} kl  ${st ? String(st.kod).padStart(3) : "  -"}  ${d.slug}`;
  if (m.poang >= 0.45) {
    console.log(`${rad}\n${" ".repeat(20)}→ ersättare: ${m.slug}  (${m.poang.toFixed(2)})`);
    forslag.push({ fromSlug: d.slug, toPath: `/produkt/${m.slug}`, reason: "omdöpt/borttagen – GSC-svep" });
  }
}

if (kolla) {
  console.log(`\n── batch till workflowen "Lägg till 301-redirect" (${forslag.length} rader) ──`);
  console.log(JSON.stringify(forslag));
} else {
  console.log(
    `\n${forslag.length} kandidater har en tänkbar ersättare, men ingen batch skrivs` +
      `\ni --snabb-läge: utan kontrollen syns inte vilka som redan är omdirigerade.`,
  );
}
console.log(
  `\nUtan ersättare: ${doda.length - forslag.length} URL:er. Peka dem mot kategorin,` +
    `\neller låt dem 404:a — men lämna dem INTE på /alla-produkter.`,
);
