// tools/gls-prov/prov.mjs — tillfälligt prov, 2026-10-12.
//
// Vad svarar GLS egen spårning för ett GLS-paket, och hur får man hela
// historiken? Butikens /sparning visar det 17TRACK har, och för GLS är det en
// enda händelse där GLS sida visar hela resan (Leonards rapport 2026-10-12).
// Körs av .github/workflows/gls-prov.yml.
//
// Omgång 2 visade att GLS gamla adress (rstt001) skickar vidare till "Register
// API Access", och att GLS egen sida frågar rstt029. Den svarar bara med
// statusen tills mottagarens postnummer anges. Omgång 3 läser därför:
//   1. GLS egen spårningskod, för att se hur sidan frågar med postnummer,
//   2. 17TRACKs dokumentation och transportörslista, för att se om 17TRACK tar
//      emot ett postnummer för GLS,
//   3. rstt029 direkt från en server, som Vercel gör, och
//   4. om indata bär ett postnummer: GLS sida med postnumret ifyllt.
//
// ☠️ LOGGEN ÄR PUBLIK. Numren och postnumret finns bara i en fil på löparen,
// dekrypterad med en engångsnyckel. I loggen står bara räknare, statuskoder och
// storlekar. Allt annat sparas i en fil som workflowen krypterar.

import { chromium } from "playwright";
import fs from "node:fs";

const [inFil, utFil] = process.argv.slice(2);
const indata = JSON.parse(fs.readFileSync(inFil, "utf8"));
const nummer = Array.isArray(indata) ? indata : indata.nummer;
const postnummer = Array.isArray(indata) ? null : (indata.postnummer ?? null);
const UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36";
const MAX_KROPP = 120_000;
const MAX_ANNAN = 2_000;

const GLS_JS = [
  "gls_group_witt002_js.js",
  "gls_group_app_js.js",
  "gls_group_common_js.js",
  "gls_group_core_js.js",
].map((f) => `https://gls-group.eu/media/gls_group_resources/${f}?1791375705669`);
const T17_DOK = "https://asset.17track.net/api/document/v2.2_en/index.html";
const T17_TRANSPORTORER = "https://res.17track.net/asset/carrier/info/apicarrier.all.json";

const RSTT029 = [
  "https://gls-group.eu/app/service/open/rest/GROUP/en/rstt029?match={N}&type=&caller=witt002&millis={T}",
  "https://gls-group.eu/app/service/open/rest/GROUP/sv/rstt029?match={N}&type=&caller=witt002&millis={T}",
  "https://gls-group.eu/app/service/open/rest/SE/sv/rstt029?match={N}&type=&caller=witt002&millis={T}",
  "https://gls-group.eu/app/service/open/rest/EU/en/rstt029?match={N}&type=&caller=witt002&millis={T}",
  "https://gls-group.com/app/service/open/rest/GROUP/en/rstt029?match={N}&type=&caller=witt002&millis={T}",
];
const SIDA = "https://gls-group.eu/EU/en/parcel-tracking?match={N}";

const ut = { tid: new Date().toISOString(), nummer, js: [], t17: {}, rstt029: [], sida: null };

/** JSON sparas hel (upp till taket), allt annat bara i början. */
function kort(text) {
  try {
    JSON.parse(text);
    return text.slice(0, MAX_KROPP);
  } catch {
    return text.slice(0, MAX_ANNAN);
  }
}

/** Textbitar runt varje träff, utan överlapp. */
function fragment(text, re, bredd = 300, max = 60) {
  const bitar = [];
  let sista = -1;
  for (const m of text.matchAll(re)) {
    if (m.index < sista) continue;
    const a = Math.max(0, m.index - bredd);
    const b = Math.min(text.length, m.index + m[0].length + bredd);
    bitar.push(text.slice(a, b));
    sista = b;
    if (bitar.length >= max) break;
  }
  return bitar;
}

async function hamtaText(url, headers = {}) {
  const t0 = Date.now();
  try {
    const r = await fetch(url, { headers: { "User-Agent": UA, ...headers }, redirect: "follow", signal: AbortSignal.timeout(25000) });
    const text = await r.text();
    return { status: r.status, ct: r.headers.get("content-type") || "", text, ms: Date.now() - t0, slut: r.url };
  } catch (e) {
    return { fel: String(e?.name || "fel"), felText: String(e?.message || e).slice(0, 300), ms: Date.now() - t0 };
  }
}

async function glsKod() {
  for (const url of GLS_JS) {
    const r = await hamtaText(url);
    const bitar = r.text ? fragment(r.text, /rstt0\d\d|postal|postcode|zipcode|plz/gi) : [];
    const rstt = r.text ? [...new Set(r.text.match(/rstt0\d\d/g) || [])] : [];
    ut.js.push({ url, status: r.status ?? r.fel, langd: r.text?.length ?? 0, rstt, bitar });
    console.log(`GLS-kod ${url.split("/").pop().split("?")[0]} → ${r.status ?? r.fel} ${r.text?.length ?? 0} B, ${bitar.length} träffar, ${rstt.join(" ") || "-"}`);
  }
}

async function sjuttonTrack() {
  const dok = await hamtaText(T17_DOK);
  const sidor = [];
  if (dok.text) {
    sidor.push({ url: T17_DOK, bitar: fragment(dok.text, /"?param"?|postal|post ?code|zip|changeinfo|retrack|GLS/gi, 400, 80) });
    const lankar = [...new Set([...dok.text.matchAll(/href="([^"#]+\.html)"/g)].map((m) => m[1]))].slice(0, 40);
    for (const l of lankar) {
      const url = new URL(l, T17_DOK).href;
      const r = await hamtaText(url);
      if (!r.text) continue;
      const bitar = fragment(r.text, /"?param"?|postal|post ?code|zip|changeinfo|retrack|GLS/gi, 400, 40);
      if (bitar.length) sidor.push({ url, bitar });
    }
  }
  ut.t17.dok = { status: dok.status ?? dok.fel, langd: dok.text?.length ?? 0, sidor };
  console.log(`17TRACK-dokumentation → ${dok.status ?? dok.fel} ${dok.text?.length ?? 0} B, ${sidor.length} sidor med träffar`);

  const lista = await hamtaText(T17_TRANSPORTORER);
  let gls = [];
  try {
    gls = JSON.parse(lista.text).filter((c) => /gls/i.test(JSON.stringify(c)));
  } catch {}
  ut.t17.transportorer = { status: lista.status ?? lista.fel, gls };
  console.log(`17TRACK-transportörer → ${lista.status ?? lista.fel}, ${gls.length} GLS-rader`);
}

async function direkt() {
  for (const [i, n] of nummer.entries()) {
    for (const mall of RSTT029) {
      for (const medHuvud of [true, false]) {
        const url = mall.replace("{N}", encodeURIComponent(n)).replace("{T}", String(Date.now()));
        const headers = medHuvud
          ? { Accept: "application/json", "Accept-Language": "sv-SE", Referer: SIDA.replace("{N}", encodeURIComponent(n)) }
          : {};
        const r = await hamtaText(url, headers);
        let nycklar = null;
        try {
          const j = JSON.parse(r.text);
          nycklar = Object.keys(j?.tuStatus?.[0] ?? j ?? {});
        } catch {}
        ut.rstt029.push({ i, mall, medHuvud, status: r.status, ct: r.ct, fel: r.fel, felText: r.felText, ms: r.ms, kropp: r.text ? kort(r.text) : null });
        console.log(`#${i + 1} ${medHuvud ? "huvud" : "bar  "} ${mall.split("/rest/")[0].replace("https://", "")} …/${mall.split("/rest/")[1].split("?")[0]} → ${r.status ?? r.fel} ${(r.ct || "").split(";")[0]} ${r.text?.length ?? 0} B ${r.ms} ms fält=${nycklar ? nycklar.length : "-"}`);
      }
    }
  }
}

async function medPostnummer(browser) {
  const ctx = await browser.newContext({ locale: "sv-SE", userAgent: UA, viewport: { width: 1280, height: 900 } });
  const page = await ctx.newPage();
  const svar = [];
  page.on("response", async (resp) => {
    const req = resp.request();
    const typ = req.resourceType();
    if (typ !== "xhr" && typ !== "fetch") return;
    const post = { typ, url: resp.url(), metod: req.method(), status: resp.status(), ct: resp.headers()["content-type"] || "" };
    try { post.kropp = kort(await resp.text()); } catch {}
    try { post.postData = req.postData()?.slice(0, 4000) ?? null; } catch {}
    try { post.reqHeaders = await req.allHeaders(); } catch {}
    svar.push(post);
  });
  const sida = { steg: [] };
  try {
    await page.goto(SIDA.replace("{N}", encodeURIComponent(nummer[0])), { waitUntil: "domcontentloaded", timeout: 45000 });
    await page.waitForLoadState("networkidle", { timeout: 20000 }).catch(() => {});
    const falt = page
      .locator("input[name*='postal' i], input[id*='postal' i], input[placeholder*='postal' i], input[name*='zip' i]")
      .first();
    const finns = await falt.count();
    sida.steg.push(`fält: ${finns}`);
    const mal = finns ? falt : page.getByLabel(/postal code/i).first();
    await mal.fill(postnummer, { timeout: 10000 });
    sida.steg.push("ifyllt");
    const knapp = page.getByRole("button", { name: /submit/i }).first();
    await knapp.click({ timeout: 10000 });
    sida.steg.push("skickat");
    await page.waitForLoadState("networkidle", { timeout: 20000 }).catch(() => {});
    await page.waitForTimeout(5000);
  } catch (e) {
    sida.fel = String(e?.message || e).slice(0, 400);
  }
  sida.text = (await page.evaluate(() => document.body?.innerText || "").catch(() => "")).slice(0, 20000);
  sida.svar = svar;
  ut.sida = sida;
  console.log(`Sidan med postnummer → steg: ${sida.steg.join(", ")}; fel=${sida.fel ? "ja" : "nej"}; ${svar.length} anrop; text=${sida.text.length} tecken`);

  // Samma anrop från en server, utan webbläsarens kakor: går det från Vercel?
  for (const s of svar.filter((x) => /\/rest\//.test(x.url))) {
    const r = await hamtaText(s.url, { Accept: "application/json", Referer: SIDA.replace("{N}", encodeURIComponent(nummer[0])) });
    s.franServer = { status: r.status ?? r.fel, kropp: r.text ? kort(r.text) : null };
    console.log(`  samma anrop från server → ${r.status ?? r.fel} ${r.text?.length ?? 0} B (webbläsaren fick ${s.status}, ${s.kropp?.length ?? 0} B)`);
  }
  await ctx.close();
}

try {
  await glsKod();
  await sjuttonTrack();
  await direkt();
  if (postnummer) {
    const browser = await chromium.launch();
    try { await medPostnummer(browser); } finally { await browser.close(); }
  } else {
    console.log("Inget postnummer i indata, sidan provas inte.");
  }
} catch (e) {
  console.log(`provet föll: ${String(e?.name || "fel")}`);
  ut.fel = String(e?.stack || e).slice(0, 2000);
} finally {
  fs.writeFileSync(utFil, JSON.stringify(ut));
  console.log(`Sparat: ${fs.statSync(utFil).size} B`);
}
