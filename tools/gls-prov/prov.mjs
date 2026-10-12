// tools/gls-prov/prov.mjs — tillfälligt prov, 2026-10-12.
//
// Vad svarar GLS egen spårning för ett GLS-paket, och vilken adress frågar
// GLS spårningssida själv? Butikens /sparning visar det 17TRACK har, och för
// GLS är det en enda händelse där GLS sida visar hela resan (Leonards rapport
// 2026-10-12). Körs av .github/workflows/gls-prov.yml.
//
// ☠️ LOGGEN ÄR PUBLIK. Numren finns bara i en fil på löparen, dekrypterad med
// en engångsnyckel. I loggen står bara mallar, statuskoder, storlekar och
// fältnamn, och varje adress tvättas från siffror och koder innan den skrivs.
// Svaren sparas i en fil som workflowen krypterar.

import { chromium } from "playwright";
import fs from "node:fs";

const [inFil, utFil] = process.argv.slice(2);
const nummer = JSON.parse(fs.readFileSync(inFil, "utf8"));
const UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36";
const MAX_KROPP = 120_000;

const DIREKT = [
  "https://gls-group.com/app/service/open/rest/SE/sv/rstt001?match={N}",
  "https://gls-group.com/app/service/open/rest/SE/en/rstt001?match={N}",
  "https://gls-group.com/app/service/open/rest/EU/en/rstt001?match={N}",
  "https://gls-group.com/app/service/open/rest/GROUP/en/rstt001?match={N}",
  "https://gls-group.eu/app/service/open/rest/SE/sv/rstt001?match={N}",
  "https://gls-group.eu/app/service/open/rest/EU/en/rstt001?match={N}",
  "https://api.gls-group.eu/app/service/open/rest/GROUP/en/rstt001?match={N}",
];
const SIDOR = [
  "https://gls-group.eu/EU/en/parcel-tracking?match={N}",
  "https://gls-group.com/SE/en/parcel-tracking?match={N}",
  "https://gls-group.com/SE/sv/spara-paket?match={N}",
];
const BUTIK = "https://www.fyndplats.se/api/track?tn={N}";

const ut = { tid: new Date().toISOString(), nummer, direkt: [], sidor: [], butik: [] };

/** Tvättar en text för loggen: numren, långa siffror och blandade koder bort. */
function tvatta(text) {
  let s = String(text ?? "");
  for (const n of nummer) {
    for (const v of [n, n.toLowerCase(), encodeURIComponent(n)]) s = s.split(v).join("<N>");
  }
  s = s.replace(/\d{5,}/g, "<d>");
  s = s.replace(/\b(?=[A-Za-z0-9]*\d)(?=[A-Za-z0-9]*[A-Za-z])[A-Za-z0-9]{8,}\b/g, "<x>");
  return s;
}

function vag(url) {
  try {
    const u = new URL(url);
    return `${u.host}${u.pathname}${u.search ? "?" + [...u.searchParams.keys()].join("&") : ""}`;
  } catch {
    return "?";
  }
}

async function hamta(url, medUa) {
  const t0 = Date.now();
  try {
    const headers = medUa
      ? { "User-Agent": UA, Accept: "application/json, text/plain, */*", "Accept-Language": "sv-SE,sv;q=0.9,en;q=0.8" }
      : {};
    const r = await fetch(url, { headers, redirect: "follow", signal: AbortSignal.timeout(20000) });
    const text = await r.text();
    let nycklar = null;
    try {
      const j = JSON.parse(text);
      nycklar = j && typeof j === "object" ? Object.keys(j) : typeof j;
    } catch {}
    return {
      status: r.status, ct: r.headers.get("content-type") || "", langd: text.length,
      ms: Date.now() - t0, slut: vag(r.url), nycklar, kropp: text.slice(0, MAX_KROPP),
    };
  } catch (e) {
    return { fel: String(e?.name || "fel"), ms: Date.now() - t0, felText: String(e?.message || e).slice(0, 300) };
  }
}

async function direkt() {
  for (const [i, n] of nummer.entries()) {
    for (const mall of DIREKT) {
      for (const medUa of [true, false]) {
        const r = await hamta(mall.replace("{N}", encodeURIComponent(n)), medUa);
        ut.direkt.push({ i, mall, medUa, ...r });
        const rad = r.fel
          ? `fel ${r.fel}`
          : `${r.status} ${r.ct.split(";")[0]} ${r.langd} B ${r.ms} ms slut=${tvatta(r.slut)} nycklar=${tvatta(JSON.stringify(r.nycklar))}`;
        console.log(`#${i + 1} ${medUa ? "ua " : "bar"} ${mall} → ${rad}`);
      }
    }
  }
}

const SAMTYCKE = [
  "#onetrust-accept-btn-handler",
  "button:has-text('Acceptera alla')",
  "button:has-text('Godkänn alla')",
  "button:has-text('Accept all')",
  "button:has-text('Accept All')",
  "button:has-text('Alle akzeptieren')",
];

async function sidor(browser) {
  for (const [i, n] of nummer.entries()) {
    for (const mall of SIDOR) {
      const ctx = await browser.newContext({ locale: "sv-SE", userAgent: UA, viewport: { width: 1280, height: 900 } });
      const page = await ctx.newPage();
      const svar = [];
      const skript = new Set();
      page.on("response", async (resp) => {
        const req = resp.request();
        const typ = req.resourceType();
        const url = resp.url();
        const ct = resp.headers()["content-type"] || "";
        if (typ === "script") skript.add(vag(url));
        const intressant = typ === "xhr" || typ === "fetch" || /json/.test(ct) || /rstt|track|\/rest\//i.test(url);
        if (!intressant) return;
        const post = { typ, url, metod: req.method(), status: resp.status(), ct };
        try {
          if (/json|text\/plain|text\/html/.test(ct) || /rstt|track/i.test(url)) post.kropp = (await resp.text()).slice(0, MAX_KROPP);
        } catch {}
        try { post.postData = req.postData()?.slice(0, 4000) ?? null; } catch {}
        try { post.reqHeaders = await req.allHeaders(); } catch {}
        svar.push(post);
      });
      let dok = null;
      let fel = null;
      try {
        const r = await page.goto(mall.replace("{N}", encodeURIComponent(n)), { waitUntil: "domcontentloaded", timeout: 45000 });
        dok = { status: r?.status() ?? null, slut: page.url() };
        for (const sel of SAMTYCKE) {
          const ok = await page.locator(sel).first().click({ timeout: 2500 }).then(() => true, () => false);
          if (ok) { dok.samtycke = sel; break; }
        }
        await page.waitForLoadState("networkidle", { timeout: 20000 }).catch(() => {});
        await page.waitForTimeout(5000);
      } catch (e) {
        fel = String(e?.message || e).slice(0, 400);
      }
      const text = await page.evaluate(() => document.body?.innerText || "").catch(() => "");
      ut.sidor.push({ i, mall, dok, fel, text: text.slice(0, 30000), svar, skript: [...skript] });
      console.log(`#${i + 1} sida ${mall} → dok ${dok?.status ?? "-"} slut=${tvatta(vag(dok?.slut || ""))} samtycke=${dok?.samtycke ?? "-"} fel=${fel ? "ja" : "nej"} text=${text.length} tecken, ${svar.length} svar`);
      for (const s of svar) {
        console.log(`    ${s.typ} ${s.metod} ${s.status} ${tvatta(vag(s.url))} ${s.ct.split(";")[0]} ${s.kropp?.length ?? "-"} B`);
      }
      for (const s of skript) console.log(`    skript ${tvatta(s)}`);
      await ctx.close();
    }
  }
}

async function butik() {
  for (const [i, n] of nummer.entries()) {
    const r = await hamta(BUTIK.replace("{N}", encodeURIComponent(n)), true);
    let handelser = "-";
    try { handelser = JSON.parse(r.kropp).events?.length ?? "-"; } catch {}
    ut.butik.push({ i, ...r });
    console.log(`#${i + 1} butikens /api/track → ${r.status ?? r.fel} ${r.langd ?? "-"} B händelser=${handelser}`);
  }
}

try {
  await direkt();
  await butik();
  const browser = await chromium.launch();
  try { await sidor(browser); } finally { await browser.close(); }
} catch (e) {
  console.log(`provet föll: ${String(e?.name || "fel")}`);
  ut.fel = String(e?.stack || e).slice(0, 2000);
} finally {
  fs.writeFileSync(utFil, JSON.stringify(ut));
  console.log(`Sparat: ${fs.statSync(utFil).size} B`);
}
