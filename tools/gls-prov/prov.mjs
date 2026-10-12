// tools/gls-prov/prov.mjs — tillfälligt prov, 2026-10-12.
//
// Vad svarar GLS egen spårning för ett GLS-paket, och hur får man hela
// historiken? Butikens /sparning visar det 17TRACK har, och för GLS är det en
// enda händelse där GLS sida visar hela resan (Leonards rapport 2026-10-12).
// Körs av .github/workflows/gls-prov.yml.
//
// Omgång 2: GLS gamla adress (rstt001) skickar vidare till "Register API
// Access", och GLS egen sida frågar rstt029, som bara ger statusen.
// Omgång 3: GLS spårningskod frågar rstt027 (sökning) och rstt028/<kollinr>
// (detaljer) med postnumret, och 17TRACK tar ett postnummer i "param" för de
// transportörer som står i deras lista över extra fält.
// Omgång 4 sparar:
//   1. GLS spårningskod hel, för att se vilka fält sidan visar,
//   2. 17TRACKs lista över extra fält, för att se om GLS står där,
//   3. rstt027 och rstt028 med postnumret, och med ett felaktigt postnummer,
//   4. GLS sida med postnumret i adressen, som kontroll.
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
const MAX_KROPP = 200_000;

const GLS_JS = [
  "gls_group_witt002_js.js",
  "gls_group_app_js.js",
  "gls_group_common_js.js",
  "gls_group_core_js.js",
].map((f) => `https://gls-group.eu/media/gls_group_resources/${f}?1791375705669`);
const T17_EXTRA = "https://res.17track.net/asset/carrier/info/additional_parameters.json";
const REST = "https://gls-group.eu/app/service/open/rest";
const SIDA = "https://gls-group.eu/EU/en/parcel-tracking";
const FEL_POSTNUMMER = "00000";

const ut = { tid: new Date().toISOString(), nummer, js: [], t17: null, rstt027: [], rstt028: [], sida: null };

async function hamtaText(url, headers = {}) {
  const t0 = Date.now();
  try {
    const r = await fetch(url, {
      headers: { "User-Agent": UA, Accept: "application/json", ...headers },
      redirect: "follow",
      signal: AbortSignal.timeout(25000),
    });
    const text = await r.text();
    return { status: r.status, ct: r.headers.get("content-type") || "", text, ms: Date.now() - t0 };
  } catch (e) {
    return { fel: String(e?.name || "fel"), felText: String(e?.message || e).slice(0, 300), ms: Date.now() - t0 };
  }
}

function json(text) {
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}

async function glsKod() {
  for (const url of GLS_JS) {
    const r = await hamtaText(url, { Accept: "*/*" });
    ut.js.push({ url, status: r.status ?? r.fel, text: r.text?.slice(0, 1_500_000) ?? null });
    console.log(`GLS-kod ${url.split("/").pop().split("?")[0]} → ${r.status ?? r.fel} ${r.text?.length ?? 0} B`);
  }
}

async function sjuttonTrack() {
  const r = await hamtaText(T17_EXTRA);
  const lista = json(r.text);
  const rader = Array.isArray(lista) ? lista : Array.isArray(lista?.data) ? lista.data : null;
  const gls = (rader ?? []).filter((x) => /gls/i.test(JSON.stringify(x)) || [100005, 101109, 101070].includes(x?.key ?? x?.carrier));
  ut.t17 = { status: r.status ?? r.fel, langd: r.text?.length ?? 0, forsta: r.text?.slice(0, 3000) ?? null, gls };
  console.log(`17TRACK extra fält → ${r.status ?? r.fel} ${r.text?.length ?? 0} B, ${rader ? rader.length : "?"} rader, ${gls.length} GLS-rader`);
  for (const g of gls) console.log(`   ${JSON.stringify(g).slice(0, 300)}`);
}

/** Varianter av postnumret: som det skrevs, utan mellanslag. */
function postnummerformer(p) {
  const utan = p.replace(/\s/g, "");
  return [...new Set([utan, p])];
}

async function medPostnummer() {
  const fall = [];
  for (const p of postnummerformer(postnummer)) fall.push({ namn: p.includes(" ") ? "postnummer med mellanslag" : "postnummer", p });
  fall.push({ namn: "fel postnummer", p: FEL_POSTNUMMER });

  for (const [i, n] of nummer.entries()) {
    for (const f of fall) {
      for (const sprak of ["GROUP/en", "SE/sv", "EU/sv"]) {
        const url = `${REST}/${sprak}/rstt027?match=${encodeURIComponent(n)}&postalCode=${encodeURIComponent(f.p)}&type=&caller=witt002&millis=${Date.now()}`;
        const r = await hamtaText(url);
        const j = json(r.text);
        const tu = j?.tuStatus?.[0];
        ut.rstt027.push({ i, fall: f.namn, sprak, status: r.status ?? r.fel, felText: r.felText, ms: r.ms, kropp: r.text?.slice(0, MAX_KROPP) ?? null });
        console.log(`#${i + 1} rstt027 ${sprak} ${f.namn} → ${r.status ?? r.fel} ${r.text?.length ?? 0} B, tuStatus=${j?.tuStatus?.length ?? "-"}, historik=${tu?.history?.length ?? "-"}, fält=${tu ? Object.keys(tu).length : "-"}`);

        // Detaljerna för kollit, som GLS sida hämtar när man väljer det.
        if (tu?.tuNo && f.namn !== "fel postnummer") {
          const agare = (tu.owners || []).find((o) => o.type === "REQUEST")?.code || "";
          const u2 = `${REST}/${sprak}/rstt028/${encodeURIComponent(tu.tuNo)}?caller=witt002&millis=${Date.now()}&tuOwnerCode=${encodeURIComponent(agare)}&postalCode=${encodeURIComponent(f.p)}`;
          const r2 = await hamtaText(u2);
          const j2 = json(r2.text);
          ut.rstt028.push({ i, fall: f.namn, sprak, status: r2.status ?? r2.fel, felText: r2.felText, kropp: r2.text?.slice(0, MAX_KROPP) ?? null });
          console.log(`   rstt028 ${sprak} → ${r2.status ?? r2.fel} ${r2.text?.length ?? 0} B, historik=${j2?.history?.length ?? j2?.tuStatus?.[0]?.history?.length ?? "-"}, fält=${j2 ? Object.keys(j2).length : "-"}`);
        }
      }
    }
  }
}

async function sidaMedPostnummer(browser) {
  const ctx = await browser.newContext({ locale: "sv-SE", userAgent: UA, viewport: { width: 1280, height: 900 } });
  const page = await ctx.newPage();
  const svar = [];
  page.on("response", async (resp) => {
    const req = resp.request();
    const typ = req.resourceType();
    if (typ !== "xhr" && typ !== "fetch") return;
    const post = { typ, url: resp.url(), metod: req.method(), status: resp.status(), ct: resp.headers()["content-type"] || "" };
    try { post.kropp = (await resp.text()).slice(0, MAX_KROPP); } catch {}
    svar.push(post);
  });
  const sida = {};
  try {
    const url = `${SIDA}?match=${encodeURIComponent(nummer[0])}&postalCode=${encodeURIComponent(postnummer.replace(/\s/g, ""))}`;
    await page.goto(url, { waitUntil: "domcontentloaded", timeout: 45000 });
    await page.waitForLoadState("networkidle", { timeout: 20000 }).catch(() => {});
    await page.waitForTimeout(4000);
    // Öppna kollits detaljer om sidan visar en lista.
    const lank = page.locator("a.js-goto-detail").first();
    if (await lank.count()) {
      await lank.click({ timeout: 5000 }).catch(() => {});
      await page.waitForLoadState("networkidle", { timeout: 20000 }).catch(() => {});
      await page.waitForTimeout(3000);
    }
  } catch (e) {
    sida.fel = String(e?.message || e).slice(0, 400);
  }
  sida.text = (await page.evaluate(() => document.body?.innerText || "").catch(() => "")).slice(0, 20000);
  sida.svar = svar;
  ut.sida = sida;
  console.log(`Sidan med postnummer → fel=${sida.fel ? "ja" : "nej"}; ${svar.length} anrop (${svar.map((s) => (s.url.match(/rstt0\d\d/) || ["?"])[0] + ":" + s.status).join(" ")}); text=${sida.text.length} tecken`);
  await ctx.close();
}

/**
 * Omgång 5: butikens /api/track på förhandsbygget med GLS-fixen (#738), och i
 * produktionen som jämförelse. Svaren krypteras som allt annat. I loggen står
 * bara statuskod, antal händelser, transportör och status.
 */
async function forhandsKoll(forhand) {
  ut.forhand = [];
  for (const [i, n] of nummer.entries()) {
    for (const [namn, bas] of [["förhand", forhand], ["produktion", "https://www.fyndplats.se"]]) {
      for (const varv of [1, 2]) {
        const r = await hamtaText(`${bas}/api/track?tn=${encodeURIComponent(n)}`);
        const j = json(r.text);
        ut.forhand.push({ i, namn, varv, status: r.status ?? r.fel, ms: r.ms, kropp: r.text?.slice(0, MAX_KROPP) ?? null });
        console.log(`#${i + 1} ${namn} varv ${varv} → ${r.status ?? r.fel} ${r.ms} ms, händelser=${j?.events?.length ?? "-"}, transportör=${j?.carrier ?? "-"}, sista led=${j?.sistaLed ?? "-"}, status=${j?.status ?? (j?.pending ? "pending" : "-")}`);
      }
    }
  }
}

try {
  if (process.env.FORHAND) {
    await forhandsKoll(process.env.FORHAND);
    throw Object.assign(new Error("klart"), { name: "klart" });
  }
  await glsKod();
  await sjuttonTrack();
  if (postnummer) {
    await medPostnummer();
    const browser = await chromium.launch();
    try { await sidaMedPostnummer(browser); } finally { await browser.close(); }
  } else {
    console.log("Inget postnummer i indata, GLS provas inte med postnummer.");
  }
} catch (e) {
  if (e?.name !== "klart") {
    console.log(`provet föll: ${String(e?.name || "fel")}`);
    ut.fel = String(e?.stack || e).slice(0, 2000);
  }
} finally {
  fs.writeFileSync(utFil, JSON.stringify(ut));
  console.log(`Sparat: ${fs.statSync(utFil).size} B`);
}
