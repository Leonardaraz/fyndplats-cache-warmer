// Kategoritexterna mot produkterna i elva kategorier: 2026-10-20.
// tools/kassa-matning/matning.mjs
//
// Mäter hur Wix kassasida laddar för en kund: vad som syns när, vad som hoppar
// och vad som hämtas. Körs av .github/workflows/kassa-matning.yml.
//
// Ingenting fylls i på kassasidan. Mätningen skapar en anonym besökare, lägger
// en vara i en ny varukorg och öppnar kassan för den, alltså samma sak som en
// kund som tittar på kassan och går därifrån. Utan e-postadress blir det inget
// mejl om övergiven kassa.
//
// Loggen är publik: den skriver inga nycklar, bara tider, värdar och storlekar.

import { chromium, devices, firefox, webkit } from "playwright";
import fs from "node:fs";
import path from "node:path";

const CLIENT_ID = "3d8fdd09-3b3c-475f-aac2-b6bfa9e05153";
const STORES_APP_ID = "215238eb-22a5-4c36-9e7b-e7c08025e04e";
const BUTIK = "https://www.fyndplats.se";
const UT = process.env.UT || "tools/kassa-matning/ut";
const MAT_MS = 16000;
fs.mkdirSync(UT, { recursive: true });

const rader = [];
const skriv = (s = "") => { console.log(s); rader.push(s); };

async function wix(vag, { token, body } = {}) {
  const r = await fetch(`https://www.wixapis.com${vag}`, {
    method: "POST",
    headers: { "content-type": "application/json", ...(token ? { authorization: token } : {}) },
    body: JSON.stringify(body ?? {}),
  });
  const text = await r.text();
  if (!r.ok) throw new Error(`POST ${vag} → ${r.status} ${text.slice(0, 300)}`);
  return JSON.parse(text);
}

/** En vara i lager utan alternativ, ur butikens sitemap och produktsidans JSON-LD. */
async function hittaVara() {
  const sm = await (await fetch(`${BUTIK}/sitemap.xml`)).text();
  const adresser = [...sm.matchAll(/<loc>(https:\/\/www\.fyndplats\.se\/produkt\/[^<]+)<\/loc>/g)].map((m) => m[1]);
  for (const adress of adresser.slice(0, 60)) {
    const html = await (await fetch(adress)).text();
    const ld = [...html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)]
      .map((m) => { try { return JSON.parse(m[1]); } catch { return null; } })
      .filter(Boolean)
      .flatMap((x) => (Array.isArray(x) ? x : [x]));
    const p = ld.find((x) => x["@type"] === "Product");
    if (!p || p.hasVariant || !p.sku) continue;
    const erbj = Array.isArray(p.offers) ? p.offers[0] : p.offers;
    if (!erbj || erbj["@type"] !== "Offer" || !/InStock/.test(erbj.availability || "")) continue;
    return { id: p.sku, namn: p.name, adress, pris: erbj.price };
  }
  throw new Error("ingen vara i lager utan alternativ bland de 60 första i sitemapen");
}

/** Kassans adress byggd som butiken bygger den (components/cart.tsx). */
async function kassaAdress(vara, preferences) {
  const tok = await wix("/oauth2/token", { body: { clientId: CLIENT_ID, grantType: "anonymous" } });
  const token = tok.access_token;
  const vagn = await wix("/ecom/v2/carts/current/add-line-items", {
    token,
    body: { catalogItems: [{ catalogReference: { appId: STORES_APP_ID, catalogItemId: vara.id }, quantity: 1 }] },
  });
  const cartId = vagn?.cart?._id || vagn?.cart?.id;
  if (!cartId) throw new Error("varukorgen fick inget id");
  const rs = await wix("/headless/v1/redirect-session", {
    token,
    body: {
      ecomCheckout: { checkoutId: cartId },
      callbacks: { thankYouPageUrl: `${BUTIK}/tack`, postFlowUrl: BUTIK, cartPageUrl: `${BUTIK}/butik` },
      ...(preferences ? { preferences } : {}),
    },
  });
  const full = rs?.redirectSession?.fullUrl || "";
  skriv(`fullUrl-värd: ${full ? new URL(full).host + new URL(full).pathname.slice(0, 40) : "–"}`);
  const inre = full ? new URL(full).searchParams.get("redirectUrl") : null;
  if (!inre) throw new Error(`redirect-sessionen gav ingen inre kassaadress (fullUrl ${full.replace(/[?#].*$/, "")})`);
  const u = new URL(inre);
  u.searchParams.set("hideLoginLogoutBar", "true");
  if (!u.searchParams.has("headlessClientId")) u.searchParams.set("headlessClientId", CLIENT_ID);
  return u.toString();
}

const INSTRUMENT = () => {
  const m = (window.__m = { skift: [], lcp: [], langa: [] });
  const beskriv = (n) => {
    if (!n) return "?";
    if (n.nodeType !== 1) return "#text";
    const kl = typeof n.className === "string" ? n.className.trim().split(/\s+/).slice(0, 2).join(".") : "";
    const dt = n.getAttribute("data-hook") || n.getAttribute("data-testid") || "";
    return `${n.tagName.toLowerCase()}${dt ? `[${dt}]` : ""}${kl ? `.${kl}` : ""}`;
  };
  try {
    new PerformanceObserver((l) => {
      for (const e of l.getEntries()) {
        if (e.hadRecentInput) continue;
        m.skift.push({
          t: Math.round(e.startTime),
          v: Number(e.value.toFixed(4)),
          kallor: (e.sources || []).slice(0, 3).map((s) => `${beskriv(s.node)} "${(s.node?.textContent || "").trim().replace(/\s+/g, " ").slice(0, 36)}" y ${Math.round(s.previousRect.y)}→${Math.round(s.currentRect.y)}, h ${Math.round(s.previousRect.height)}→${Math.round(s.currentRect.height)}`),
        });
      }
    }).observe({ type: "layout-shift", buffered: true });
  } catch {}
  try {
    new PerformanceObserver((l) => {
      for (const e of l.getEntries()) m.lcp.push({ t: Math.round(e.startTime), el: beskriv(e.element), storlek: e.size });
    }).observe({ type: "largest-contentful-paint", buffered: true });
  } catch {}
  try {
    new PerformanceObserver((l) => {
      for (const e of l.getEntries()) m.langa.push({ t: Math.round(e.startTime), ms: Math.round(e.duration) });
    }).observe({ type: "longtask", buffered: true });
  } catch {}
};

// Vad kunden ser just nu: rubriker, knappar, fält och inbäddade rutor.
const LAGE = () => {
  const syns = (el) => {
    const r = el.getBoundingClientRect();
    if (r.width < 2 || r.height < 2) return false;
    const s = getComputedStyle(el);
    return s.visibility !== "hidden" && s.display !== "none" && Number(s.opacity) > 0.05;
  };
  const text = (el) => (el.innerText || el.textContent || "").trim().replace(/\s+/g, " ").slice(0, 34);
  const rubriker = [...document.querySelectorAll("h1,h2,h3,h4,legend,[role=heading]")].filter(syns).map(text).filter(Boolean);
  const knappar = [...document.querySelectorAll("button,[role=button],a[role=link]")].filter(syns).map(text).filter(Boolean);
  const falt = [...document.querySelectorAll("input,select,textarea")].filter((e) => e.type !== "hidden" && syns(e)).length;
  const ramar = [...document.querySelectorAll("iframe")].filter(syns).map((f) => { try { return new URL(f.src).host; } catch { return f.name || "inline"; } });
  const spinnare = [...document.querySelectorAll("[class*=spinner],[class*=Spinner],[class*=loader],[class*=Loader],[class*=skeleton],[class*=Skeleton],[aria-busy=true]")].filter(syns).length;
  return {
    klar: document.readyState,
    textlangd: document.body ? document.body.innerText.length : 0,
    hojd: document.documentElement.scrollHeight,
    falt,
    spinnare,
    ramar: [...new Set(ramar)].sort(),
    rubriker: [...new Set(rubriker)].slice(0, 14),
    knappar: [...new Set(knappar)].slice(0, 14),
  };
};

async function matKassan(browser, lage, adress) {
  skriv(`\n================ ${lage.namn.toUpperCase()} ================`);
  const ctx = await browser.newContext({ ...lage.enhet, locale: "sv-SE", timezoneId: "Europe/Stockholm" });
  const page = await ctx.newPage();
  const cdp = await ctx.newCDPSession(page);
  if (lage.cpu > 1) await cdp.send("Emulation.setCPUThrottlingRate", { rate: lage.cpu });
  if (lage.natt) {
    await cdp.send("Network.enable");
    await cdp.send("Network.emulateNetworkConditions", { offline: false, ...lage.natt });
  }
  await page.addInitScript(INSTRUMENT);

  const t0 = Date.now();
  const anrop = new Map();
  const fel = [];
  page.on("request", (r) => anrop.set(r, { url: r.url(), typ: r.resourceType(), start: Date.now() - t0 }));
  const klar = async (r, ok) => {
    const a = anrop.get(r);
    if (!a) return;
    a.slut = Date.now() - t0;
    a.ok = ok;
    try { const s = await r.sizes(); a.byte = s.responseBodySize + s.responseHeadersSize; } catch { a.byte = 0; }
  };
  page.on("requestfinished", (r) => klar(r, true));
  page.on("requestfailed", (r) => klar(r, false));
  page.on("console", (m) => { if (m.type() === "error") fel.push(`${Date.now() - t0} ms ${m.text().slice(0, 160)}`); });
  page.on("pageerror", (e) => fel.push(`${Date.now() - t0} ms SIDFEL ${e.message.slice(0, 160)}`));

  await page.goto(adress, { waitUntil: "commit", timeout: 60000 });
  const svar = Date.now() - t0;
  skriv(`dokumentet började komma efter ${svar} ms`);

  let forra = "";
  const bilder = new Set([800, 1500, 2500, 3500, 5000, 6500, 8000, 10000, 13000, 16000]);
  const tagna = new Set();
  while (Date.now() - t0 < MAT_MS) {
    const t = Date.now() - t0;
    let lageNu = null;
    try { lageNu = await page.evaluate(LAGE); } catch { /* sidan byts */ }
    if (lageNu) {
      const nyckel = JSON.stringify({ ...lageNu, textlangd: Math.round(lageNu.textlangd / 40), hojd: Math.round(lageNu.hojd / 20) });
      if (nyckel !== forra) {
        forra = nyckel;
        skriv(`${String(t).padStart(6)} ms  ${lageNu.klar.padEnd(11)} text ${String(lageNu.textlangd).padStart(5)}  höjd ${String(lageNu.hojd).padStart(5)}  fält ${lageNu.falt}  laddar ${lageNu.spinnare}  ramar [${lageNu.ramar.join(", ")}]`);
        skriv(`           rubriker: ${lageNu.rubriker.join(" | ")}`);
        skriv(`           knappar:  ${lageNu.knappar.join(" | ")}`);
      }
    }
    for (const b of bilder) {
      if (!tagna.has(b) && t >= b) {
        tagna.add(b);
        await page.screenshot({ path: path.join(UT, `${lage.namn}-${String(b).padStart(5, "0")}ms.jpg`), type: "jpeg", quality: 55 }).catch(() => {});
      }
    }
    await page.waitForTimeout(150);
  }
  await page.screenshot({ path: path.join(UT, `${lage.namn}-hela-sidan.jpg`), type: "jpeg", quality: 55, fullPage: true }).catch(() => {});

  const m = await page.evaluate(() => window.__m).catch(() => null);
  if (m) {
    const cls = m.skift.reduce((s, x) => s + x.v, 0);
    skriv(`\nLayoutskift (det som hoppar), summa CLS ${cls.toFixed(3)}:`);
    for (const s of m.skift) skriv(`  ${String(s.t).padStart(6)} ms  ${s.v.toFixed(4)}  ${s.kallor.join("  ||  ")}`);
    skriv(`Största innehållet (LCP): ${m.lcp.map((x) => `${x.t} ms ${x.el}`).join(", ")}`);
    const lang = m.langa.reduce((s, x) => s + x.ms, 0);
    skriv(`Långa uppgifter: ${m.langa.length} st, ${lang} ms totalt, längsta ${Math.max(0, ...m.langa.map((x) => x.ms))} ms`);
  }

  const lista = [...anrop.values()];
  const perVard = new Map();
  for (const a of lista) {
    let v = "?";
    try { v = new URL(a.url).host; } catch {}
    const p = perVard.get(v) || { st: 0, byte: 0, forst: Infinity, sist: 0, fel: 0 };
    p.st += 1; p.byte += a.byte || 0; p.forst = Math.min(p.forst, a.start); p.sist = Math.max(p.sist, a.slut ?? a.start); if (a.ok === false) p.fel += 1;
    perVard.set(v, p);
  }
  skriv(`\nAnrop: ${lista.length} st, ${Math.round(lista.reduce((s, a) => s + (a.byte || 0), 0) / 1024)} kB. Per värd:`);
  for (const [v, p] of [...perVard.entries()].sort((a, b) => b[1].byte - a[1].byte)) {
    skriv(`  ${v.padEnd(42)} ${String(p.st).padStart(4)} st ${String(Math.round(p.byte / 1024)).padStart(6)} kB  ${p.forst}–${p.sist} ms${p.fel ? `  (${p.fel} misslyckade)` : ""}`);
  }
  const stora = lista.filter((a) => (a.typ === "script" || a.typ === "stylesheet" || a.typ === "font") && (a.byte || 0) > 40 * 1024)
    .sort((a, b) => b.byte - a.byte).slice(0, 15);
  skriv("Största skript, stilmallar och typsnitt:");
  for (const a of stora) skriv(`  ${String(Math.round(a.byte / 1024)).padStart(5)} kB  ${a.typ.padEnd(10)} ${a.start}–${a.slut} ms  ${a.url.replace(/\?.*$/, "").slice(0, 120)}`);
  if (fel.length) { skriv("Fel i konsolen:"); for (const f of fel.slice(0, 15)) skriv(`  ${f}`); }
  await ctx.close();
}

// Hela vägen som en kund: produktsidan, Lägg i kundvagn, Till kassan.
async function matVagen(browser, lage) {
  skriv(`\n================ HELA VÄGEN, ${lage.namn.toUpperCase()} ================`);
  const ctx = await browser.newContext({ ...lage.enhet, locale: "sv-SE", timezoneId: "Europe/Stockholm" });
  const page = await ctx.newPage();
  const cdp = await ctx.newCDPSession(page);
  if (lage.cpu > 1) await cdp.send("Emulation.setCPUThrottlingRate", { rate: lage.cpu });
  if (lage.natt) { await cdp.send("Network.enable"); await cdp.send("Network.emulateNetworkConditions", { offline: false, ...lage.natt }); }
  const vara = await hittaVara();
  await page.goto(vara.adress, { waitUntil: "load", timeout: 90000 });
  await page.waitForTimeout(2500);
  await page.screenshot({ path: path.join(UT, `vagen-${lage.namn}-1-produktsidan.jpg`), type: "jpeg", quality: 55 }).catch(() => {});
  const knapp = page.locator(".pdp button:has-text('Lägg i kundvagn')").first();
  await knapp.scrollIntoViewIfNeeded().catch(() => {});
  const t0 = Date.now();
  await knapp.click({ timeout: 20000 });
  await page.waitForSelector("aside.drawer.show .buy", { timeout: 20000 });
  await page.waitForFunction(() => !document.querySelector("aside.drawer .li-vantar"), null, { timeout: 30000 }).catch(() => {});
  skriv(`Lägg i kundvagn → raden bekräftad av Wix: ${Date.now() - t0} ms`);
  await page.waitForTimeout(1500);
  await page.screenshot({ path: path.join(UT, `vagen-${lage.namn}-2-varukorgen.jpg`), type: "jpeg", quality: 55 }).catch(() => {});
  const tackt = await page.evaluate(() => {
    const b = document.querySelector("aside.drawer .buy");
    if (!b) return "ingen knapp";
    const r = b.getBoundingClientRect();
    const e = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2);
    return e && !b.contains(e) ? `TÄCKT av ${e.tagName.toLowerCase()}.${String(e.className).slice(0, 40)} "${(e.textContent || "").trim().slice(0, 30)}"` : "synlig";
  });
  skriv(`Knappen Till kassan: ${tackt}`);
  const cookie = page.locator(".cookiebar .ck-ghost");
  if (await cookie.isVisible().catch(() => false)) await cookie.click();
  const t1 = Date.now();
  await page.locator("aside.drawer .buy").click({ timeout: 10000 });
  await page.waitForURL((u) => !u.toString().startsWith(BUTIK), { timeout: 30000, waitUntil: "commit" }).catch(() => {});
  skriv(`Till kassan → kassans adress börjar laddas: ${Date.now() - t1} ms`);
  await page.waitForTimeout(8000);
  await page.screenshot({ path: path.join(UT, `vagen-${lage.namn}-3-kassan-efter-8s.jpg`), type: "jpeg", quality: 55 }).catch(() => {});
  await ctx.close();
}

// Wix kassakod: vilka adressparametrar läser den, och vad styr expressrutan?
// hideLoginLogoutBar är en sådan parameter (Wix supports egen lösning), så
// syskonen bör läsas på samma sätt i samma kod.
async function granskaKassakoden(browser, adress) {
  skriv("\n================ KASSANS KOD ================");
  const ctx = await browser.newContext({ viewport: { width: 1366, height: 900 }, locale: "sv-SE", timezoneId: "Europe/Stockholm" });
  const page = await ctx.newPage();
  const bunter = [];
  page.on("response", async (r) => {
    const u = r.url();
    if (r.request().resourceType() !== "script") return;
    if (!/parastorage\.com\/services\/(ecom-platform-checkout|cashier-express-checkout-widget|cashier-payments-widget)\//.test(u)) return;
    try { bunter.push({ url: u, text: await r.text() }); } catch {}
  });
  await page.goto(adress, { waitUntil: "load", timeout: 60000 });
  await page.waitForTimeout(9000);
  const html = await page.content();
  await ctx.close();

  const sammanhang = (text, i, fore = 650, efter = 750) => text.slice(Math.max(0, i - fore), i + efter).replace(/\s+/g, " ");
  const visa = (text, nyckel, max = 3) => {
    let i = 0;
    let antal = 0;
    while ((i = text.indexOf(nyckel, i)) !== -1 && antal < max) {
      skriv(`  [${nyckel}] …${sammanhang(text, i)}…`);
      i += nyckel.length;
      antal += 1;
    }
  };
  skriv(`Hämtade kassaskript: ${bunter.length}`);
  for (const b of bunter) {
    const namn = b.url.replace(/^https:\/\/static\.parastorage\.com\/services\//, "").replace(/\?.*$/, "");
    skriv(`\n-- ${namn.slice(0, 120)} (${Math.round(b.text.length / 1024)} kB)`);
    visa(b.text, "hideLoginLogoutBar", 4);
    const params = new Set();
    for (const m of b.text.matchAll(/(?:searchParams|query|urlParams|queryParams|URLSearchParams\([^)]*\))\??\.(?:get\(\s*)?["']?([A-Za-z_][A-Za-z0-9_]{2,40})/g)) params.add(m[1]);
    for (const m of b.text.matchAll(/\.get\(\s*["']([A-Za-z_][A-Za-z0-9_]{2,40})["']\s*\)/g)) params.add(m[1]);
    skriv(`  läses ur adressen: ${[...params].sort().join(", ").slice(0, 2500)}`);
    const exp = new Map();
    for (const m of b.text.matchAll(/[A-Za-z_$][A-Za-z0-9_$]*[Ee]xpress[A-Za-z0-9_$]*/g)) exp.set(m[0], (exp.get(m[0]) || 0) + 1);
    skriv(`  namn med express: ${[...exp.entries()].sort((a, c) => c[1] - a[1]).slice(0, 90).map(([k, v]) => `${k}(${v})`).join(", ")}`);
    for (const nyckel of ["shouldDisplayExpressCheckout", "isExpressSupported", "isExpressEmpty", "checkout_showExpressCheckout", "showExpressCheckout", "checkout_showCoupon", "CashierExpressCheckoutWidget", "fetchExpressPaymentMethods", "settingsParams", "useGenericWixPages", "isGeneric", "generic"]) visa(b.text, nyckel, 4);
  }
  skriv("\n-- sidans html");
  for (const nyckel of ["xpress", "hideLoginLogoutBar", "useGenericWixPages", "genericPages"]) visa(html, nyckel, 4);
}

// Efter deployen: indexeras avdelningarna, och ligger de i sitemapen?
async function kollaAvdelningar() {
  const forhands = process.env.FORHANDS || "https://fyndplats-headless-git-claude-kass-4edc42-leonardarazs-projects.vercel.app";
  for (const bas of [BUTIK, forhands]) {
    skriv(`\n================ AVDELNINGARNA på ${bas.replace(/^https:\/\//, "")} ================`);
    try { await kollaAvdelningarPa(bas); } catch (e) { skriv(`gick inte: ${e.message}`); }
  }
  // Vilka adresser skiljer sitemapen åt mellan sajten och förhandsversionen?
  const locs = async (bas) => new Set([...(await (await fetch(`${bas}/sitemap.xml`, { headers: { "cache-control": "no-cache" } })).text()).matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]));
  try {
    const [a, b] = await Promise.all([locs(BUTIK), locs(forhands)]);
    const bara = (x, y) => [...x].filter((u) => !y.has(u)).sort();
    skriv("\nSitemapen, bara i förhandsversionen:");
    for (const u of bara(b, a)) skriv(`  + ${u}`);
    skriv("Sitemapen, bara på sajten:");
    for (const u of bara(a, b)) skriv(`  - ${u}`);
  } catch (e) { skriv(`sitemapjämförelsen gick inte: ${e.message}`); }
}

async function kollaAvdelningarPa(bas) {
  const smSvar = await fetch(`${bas}/sitemap.xml`, { headers: { "cache-control": "no-cache" } });
  const sm = await smSvar.text();
  skriv(`sitemap.xml: HTTP ${smSvar.status}, ${(sm.match(/<loc>/g) || []).length} adresser, ${(sm.match(/\/kategori\//g) || []).length} kategorier`);
  for (const slug of ["jul-hogtider", "verktyg-fordon", "mobler", "hem-inredning"]) {
    const adress = `${bas}/kategori/${slug}`;
    const r = await fetch(adress, { redirect: "manual" });
    const html = r.status === 200 ? await r.text() : "";
    const robots = (html.match(/<meta name="robots" content="([^"]*)"/) || [])[1] || "(ingen robots-tagg)";
    const ogBild = /<meta property="og:image" content="https:\/\/static\.wixstatic\.com/.test(html) ? "egen bild" : "standardbild";
    const iSitemap = sm.includes(`<loc>${BUTIK}/kategori/${slug}</loc>`) ? "i sitemapen" : "SAKNAS i sitemapen";
    skriv(`${slug.padEnd(16)} HTTP ${r.status}  robots: ${robots}  ${iSitemap}  delningsbild: ${ogBild}  cache: ${r.headers.get("x-vercel-cache") || "-"}`);
  }
}

// Täcker cookierutan Till kassan? Mot sajten och förhandsversionen.
async function kollaCookierutan(browser, bas, vara) {
  const ctx = await browser.newContext({ ...devices["iPhone 13"], locale: "sv-SE", timezoneId: "Europe/Stockholm" });
  const page = await ctx.newPage();
  const adress = vara.adress.replace(BUTIK, bas);
  await page.goto(adress, { waitUntil: "load", timeout: 90000 });
  await page.waitForSelector(".cookiebar", { timeout: 30000 }).catch(() => {});
  await page.waitForTimeout(1500);
  const lage = () => page.evaluate(() => {
    const ut = {};
    const c = document.querySelector(".cookiebar");
    ut.ruta = c ? getComputedStyle(c).visibility : "saknas";
    const b = document.querySelector("aside.drawer.show .buy");
    if (b) {
      const r = b.getBoundingClientRect();
      const e = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2);
      ut.tillKassan = e && b.contains(e) ? "synlig och tryckbar" : `TÄCKT av ${e ? `${e.tagName.toLowerCase()}.${String(e.className).slice(0, 30)}` : "?"}`;
    }
    return ut;
  });
  const fore = await lage();
  const knapp = page.locator(".pdp button:has-text('Lägg i kundvagn')").first();
  await knapp.click({ timeout: 20000 });
  await page.waitForSelector("aside.drawer.show .buy", { timeout: 20000 });
  await page.waitForFunction(() => !document.querySelector("aside.drawer .li-vantar"), null, { timeout: 30000 }).catch(() => {});
  await page.waitForTimeout(800);
  const oppen = await lage();
  await page.screenshot({ path: path.join(UT, `cookie-${bas.includes("vercel") ? "forhand" : "sajten"}.jpg`), type: "jpeg", quality: 55 }).catch(() => {});
  await page.locator("aside.drawer.show .drawer-x").click();
  await page.waitForTimeout(800);
  const stangd = await lage();
  skriv(`${bas.replace(/^https:\/\//, "").slice(0, 40).padEnd(40)} före: ${JSON.stringify(fore)}  varukorgen öppen: ${JSON.stringify(oppen)}  stängd: ${JSON.stringify(stangd)}`);
  await ctx.close();
}

const LAGEN = [
  {
    namn: "mobil",
    enhet: devices["iPhone 13"],
    cpu: 4,
    // Vanlig 4G: 70 ms fördröjning, 12 Mbit/s ner, 4 Mbit/s upp.
    natt: { latency: 70, downloadThroughput: (12 * 1024 * 1024) / 8, uploadThroughput: (4 * 1024 * 1024) / 8 },
  },
  { namn: "dator", enhet: { viewport: { width: 1366, height: 900 } }, cpu: 1, natt: null },
];

// ================ VÄRMNING (KOR=varm) ================
// Manuell uppvärmning av butikens cache (Leonard 2026-10-12: "sidan känns
// långsam"). Hämtar varje adress i sitemapen en gång, så att nästa besökare får
// en färdig sida ur cachen i stället för att vänta på renderingen. Samma takt
// som butikens egen värmare (lib/warm.ts: åtta parallellt, 60 s tak per sida).
// Loggen bär bara adresser, statuskoder, cachelägen och tider.
const VARM_PARALLELLT = 8;
const VARM_BUDGET_MS = 13 * 60_000;
const sov = (ms) => new Promise((res) => setTimeout(res, ms));

/** Hämtar en sida helt. Strypning och tillfälliga fel får ett nytt försök.
 *  forstaCache är läget vid FÖRSTA hämtningen, alltså före värmningen. */
async function hamtaEn(url) {
  let forsta = null;
  for (let forsok = 1; ; forsok++) {
    const t0 = performance.now();
    let ut;
    try {
      const r = await fetch(url, {
        headers: { "user-agent": "fyndplats-warmer (manuell)" },
        redirect: "manual",
        signal: AbortSignal.timeout(60_000),
      });
      const ttfb = performance.now() - t0;
      await r.arrayBuffer();
      ut = { status: r.status, cache: (r.headers.get("x-vercel-cache") || "-").toUpperCase(), ttfb, tid: performance.now() - t0 };
    } catch (e) {
      const tid = performance.now() - t0;
      ut = { status: e?.name === "TimeoutError" ? "TIMEOUT" : "NÄTFEL", cache: "-", ttfb: tid, tid };
    }
    if (!forsta) forsta = ut;
    const tillfalligt = ut.status === 429 || ut.status === 503 || ut.status === "TIMEOUT" || ut.status === "NÄTFEL";
    if (!tillfalligt || forsok >= 2) return { url, ...ut, forsok, forstaCache: forsta.cache };
    await sov(5000);
  }
}

/** Kör fn över listan med n samtidiga, och startar inget nytt efter deadline. */
async function iParallell(lista, n, fn, deadline) {
  const ut = new Array(lista.length);
  let nasta = 0;
  await Promise.all(Array.from({ length: n }, async () => {
    while (nasta < lista.length && Date.now() < deadline) {
      const j = nasta++;
      ut[j] = await fn(lista[j]);
    }
  }));
  return ut.filter(Boolean);
}

function sidtyp(url) {
  const p = new URL(url).pathname;
  if (p.startsWith("/produkt/")) return "produkt";
  if (p.startsWith("/kategori/")) return "kategori";
  return "övrigt";
}
const rakna = (xs) => xs.reduce((m, x) => ((m[x] = (m[x] || 0) + 1), m), {});
const visa = (m) => Object.entries(m).sort((a, b) => b[1] - a[1]).map(([k, v]) => `${k} ${v}`).join(", ");
const kvantil = (xs, q) => {
  if (!xs.length) return null;
  const s = [...xs].sort((a, b) => a - b);
  return s[Math.min(s.length - 1, Math.floor(q * s.length))];
};
const sek = (ms) => (ms == null ? "-" : `${(ms / 1000).toFixed(2)} s`);

/** Upplevd laddning i en riktig webbläsare: första byte, första innehåll,
 *  största innehåll (LCP) och när sidan är klar. */
async function upplevdTid(browser, lage, url) {
  const ctx = await browser.newContext({ ...lage.enhet, locale: "sv-SE", timezoneId: "Europe/Stockholm" });
  try {
    const page = await ctx.newPage();
    const cdp = await ctx.newCDPSession(page);
    if (lage.cpu > 1) await cdp.send("Emulation.setCPUThrottlingRate", { rate: lage.cpu });
    if (lage.natt) {
      await cdp.send("Network.enable");
      await cdp.send("Network.emulateNetworkConditions", { offline: false, ...lage.natt });
    }
    await page.addInitScript(() => {
      window.__lcp = 0;
      new PerformanceObserver((l) => { for (const e of l.getEntries()) window.__lcp = e.startTime; })
        .observe({ type: "largest-contentful-paint", buffered: true });
    });
    const svar = await page.goto(url, { waitUntil: "load", timeout: 90_000 });
    await page.waitForTimeout(1500);
    const m = await page.evaluate(() => {
      const n = performance.getEntriesByType("navigation")[0];
      const fcp = performance.getEntriesByName("first-contentful-paint")[0];
      return { ttfb: n?.responseStart ?? null, fcp: fcp ? fcp.startTime : null, lcp: window.__lcp || null, load: n?.loadEventEnd || null };
    });
    return { ...m, cache: (svar?.headers()["x-vercel-cache"] || "-").toUpperCase() };
  } finally {
    await ctx.close();
  }
}

async function varmButiken(browser) {
  const start = Date.now();
  const deadline = start + VARM_BUDGET_MS;
  const sm = await (await fetch(`${BUTIK}/sitemap.xml`, { headers: { "cache-control": "no-cache" } })).text();
  const alla = [...new Set([...sm.matchAll(/<loc>\s*([^<\s]+)\s*<\/loc>/g)].map((m) => m[1]))];
  const antal = rakna(alla.map(sidtyp));
  if (alla.length < 500) throw new Error(`sitemapen gav bara ${alla.length} adresser — avbryter hellre än värmer en bråkdel`);
  // Startsidan och de stora listorna först, sedan produkterna (dit de flesta
  // kommer från Google), sedan kategorierna och resten.
  const nyckel = [`${BUTIK}/`, `${BUTIK}/butik`, `${BUTIK}/alla-produkter`];
  const lista = [...new Set([
    ...nyckel,
    ...alla.filter((u) => sidtyp(u) === "produkt"),
    ...alla.filter((u) => sidtyp(u) === "kategori"),
    ...alla.filter((u) => sidtyp(u) === "övrigt"),
  ])];
  skriv(`Värmning av ${BUTIK.replace("https://", "")}, start ${new Date(start).toISOString()}`);
  skriv(`Sitemapen: ${alla.length} adresser (${visa(antal)}). ${VARM_PARALLELLT} hämtningar åt gången.`);

  const res = await iParallell(lista, VARM_PARALLELLT, hamtaEn, deadline);
  const sekunder = Math.round((Date.now() - start) / 1000);
  skriv(`Hämtade ${res.length} av ${lista.length} på ${sekunder} s${res.length < lista.length ? `. Tidsbudgeten tog slut med ${lista.length - res.length} kvar.` : "."}`);

  skriv("\nLäget FÖRE värmningen (x-vercel-cache vid första hämtningen):");
  for (const typ of ["produkt", "kategori", "övrigt"]) {
    const r = res.filter((x) => sidtyp(x.url) === typ);
    if (r.length) skriv(`  ${typ.padEnd(9)} ${String(r.length).padStart(5)} st   ${visa(rakna(r.map((x) => x.forstaCache)))}   | status: ${visa(rakna(r.map((x) => String(x.status))))}`);
  }
  const kalla = res.filter((x) => x.forstaCache === "MISS" && x.status === 200);
  const varma = res.filter((x) => ["HIT", "STALE", "PRERENDER"].includes(x.forstaCache) && x.status === 200);
  skriv(`\nFörsta byte: kalla sidor (MISS, ${kalla.length} st) median ${sek(kvantil(kalla.map((x) => x.ttfb), 0.5))}, p90 ${sek(kvantil(kalla.map((x) => x.ttfb), 0.9))}`);
  skriv(`             varma sidor (HIT/STALE/PRERENDER, ${varma.length} st) median ${sek(kvantil(varma.map((x) => x.ttfb), 0.5))}, p90 ${sek(kvantil(varma.map((x) => x.ttfb), 0.9))}`);

  skriv("\nLångsammast (första byte):");
  for (const x of [...res].sort((a, b) => b.ttfb - a.ttfb).slice(0, 15)) {
    skriv(`  ${sek(x.ttfb).padStart(8)}  ${x.forstaCache.padEnd(9)} ${String(x.status).padEnd(7)} ${x.url.replace(BUTIK, "")}`);
  }
  const fel = res.filter((x) => x.status !== 200);
  skriv(`\nSvarade inte 200: ${fel.length}`);
  for (const x of fel.slice(0, 40)) skriv(`  ${String(x.status).padEnd(7)} ${x.url.replace(BUTIK, "")}${x.forsok > 1 ? "  (två försök)" : ""}`);

  // Kontroll: ett spritt urval av sidorna som var kalla, hämtade en gång till.
  // De ska nu svara ur cachen.
  const bas = kalla.length ? kalla : res.filter((x) => x.status === 200);
  const steg = Math.max(1, Math.floor(bas.length / 40));
  const urval = bas.filter((_, i) => i % steg === 0).slice(0, 40);
  const kontroll = await iParallell(urval.map((x) => x.url), 4, hamtaEn, Infinity);
  skriv(`\nKontroll efteråt: ${kontroll.length} av sidorna som var kalla, hämtade igen: ${visa(rakna(kontroll.map((x) => x.cache)))}`);
  skriv(`  första byte median ${sek(kvantil(kontroll.map((x) => x.ttfb), 0.5))}, p90 ${sek(kvantil(kontroll.map((x) => x.ttfb), 0.9))}`);

  skriv("\nUpplevd laddning efter värmningen (mobil = iPhone på 4G med fyra gånger långsammare processor, dator = utan strypning):");
  const prov = [...new Set([`${BUTIK}/`, `${BUTIK}/kategori/mobler`, ...urval.filter((x) => sidtyp(x.url) === "produkt").slice(0, 2).map((x) => x.url)])];
  for (const lage of LAGEN) {
    for (const u of prov) {
      try {
        const m = await upplevdTid(browser, lage, u);
        skriv(`  ${lage.namn.padEnd(5)} ${u.replace(BUTIK, "").slice(0, 48).padEnd(48)} ${m.cache.padEnd(9)} första byte ${sek(m.ttfb)}  första innehåll ${sek(m.fcp)}  största innehåll ${sek(m.lcp)}  klar ${sek(m.load)}`);
      } catch (e) {
        skriv(`  ${lage.namn.padEnd(5)} ${u.replace(BUTIK, "")}: gick inte: ${String(e.message).split("\n")[0]}`);
      }
    }
  }
}

// ================ RECENSIONERNA (KOR=recensioner) ================
// Står "Visa mer" där det inte finns mer att visa? Hittar produktsidor med
// långa recensioner i sitemapen och mäter varje avkortad text i en dator- och
// en mobilbredd, på sajten och på förhandsbygget (PR #737).
const RECENSION_FORHANDS = process.env.FORHANDS_RECENSION
  || "https://fyndplats-headless-git-claude-rece-0d51fc-leonardarazs-projects.vercel.app";

async function hittaRecensionssidor(max = 12, tak = 900) {
  const sm = await (await fetch(`${BUTIK}/sitemap.xml`, { headers: { "cache-control": "no-cache" } })).text();
  const produkter = [...sm.matchAll(/<loc>\s*([^<\s]+\/produkt\/[^<\s]+)\s*<\/loc>/g)].map((m) => m[1]).slice(0, tak);
  const traffar = [];
  let nasta = 0;
  await Promise.all(Array.from({ length: 8 }, async () => {
    while (nasta < produkter.length && traffar.length < max) {
      const u = produkter[nasta++];
      try {
        const html = await (await fetch(u, { signal: AbortSignal.timeout(30_000) })).text();
        if (html.includes("rev-text-klamp")) traffar.push(u);
      } catch { /* en sida som inte svarar hoppas över */ }
    }
  }));
  return { sidor: traffar.slice(0, max), lasta: Math.min(nasta, produkter.length) };
}

async function matRecensioner(browser, bas, enhet, sidor) {
  const ctx = await browser.newContext({ ...enhet, locale: "sv-SE", timezoneId: "Europe/Stockholm" });
  await ctx.addInitScript(() => {
    window.__cls = 0;
    try {
      new PerformanceObserver((l) => { for (const e of l.getEntries()) if (!e.hadRecentInput) window.__cls += e.value; })
        .observe({ type: "layout-shift", buffered: true });
    } catch { /* layout-shift finns bara i Chromium */ }
  });
  const page = await ctx.newPage();
  const summa = { sidor: 0, avkortade: 0, knappar: 0, falska: 0, saknade: 0, fel: 0, skriptfel: 0, clsMax: 0 };
  page.on("pageerror", () => { summa.skriptfel++; });
  const falskaPa = new Set();
  for (const u of sidor) {
    try {
      await page.goto(u.replace(BUTIK, bas), { waitUntil: "load", timeout: 60_000 });
      await page.waitForSelector(".rev-item", { timeout: 15_000 });
      await page.waitForTimeout(1500);
      const rader = await page.$$eval(".rev-item", (lis) => lis.map((li) => {
        const p = li.querySelector(".rev-text");
        const klamp = !!p && p.classList.contains("rev-text-klamp");
        return { klamp, doljer: klamp && p.scrollHeight > p.clientHeight + 1, knapp: !!li.querySelector(".rev-expand") };
      }));
      summa.sidor++;
      summa.clsMax = Math.max(summa.clsMax, await page.evaluate(() => window.__cls || 0));
      for (const x of rader) {
        if (x.klamp) summa.avkortade++;
        if (x.knapp) summa.knappar++;
        if (x.knapp && x.klamp && !x.doljer) { summa.falska++; falskaPa.add(u.replace(BUTIK, "")); }
        if (x.doljer && !x.knapp) summa.saknade++;
      }
    } catch {
      summa.fel++;
    }
  }
  await ctx.close();
  return { summa, falskaPa: [...falskaPa].slice(0, 4) };
}

async function kollaRecensioner(browser) {
  const { sidor, lasta } = await hittaRecensionssidor();
  skriv(`Produktsidor med långa recensioner: ${sidor.length} (letade bland ${lasta} produktsidor)`);
  skriv("knappar = antal Visa mer, falska = knapp utan dold text, saknade = dold text utan knapp\n");
  const enheter = [["dator 1366", { viewport: { width: 1366, height: 900 } }], ["mobil 390", devices["iPhone 13"]]];
  for (const bas of [BUTIK, RECENSION_FORHANDS]) {
    for (const [namn, enhet] of enheter) {
      const { summa, falskaPa } = await matRecensioner(browser, bas, enhet, sidor);
      skriv(`${bas.replace(/^https:\/\//, "").slice(0, 40).padEnd(40)} ${namn.padEnd(10)} sidor ${summa.sidor}  klampade texter ${summa.avkortade}  knappar ${summa.knappar}  falska ${summa.falska}  saknade ${summa.saknade}  fel ${summa.fel}  skriptfel ${summa.skriptfel}  största layoutskift ${summa.clsMax.toFixed(3)}`);
      for (const s of falskaPa) skriv(`    falsk knapp på ${s}`);
    }
  }
}

// ================ WEBBLÄSARNA (KOR=webblasare) ================
// Samma recensionskontroll i Safaris och Firefox motorer (WebKit och Gecko).
// Lagningen i #737 mäter scrollHeight mot clientHeight i en ruta med
// -webkit-line-clamp. En motor som räknar annorlunda hade tagit bort knappen
// där den behövs, och de flesta mobilkunder har Safari.
async function provaKnappen(browser, enhet, sidor) {
  for (const url of sidor) {
    const ctx = await browser.newContext({ ...enhet, locale: "sv-SE", timezoneId: "Europe/Stockholm" });
    try {
      const page = await ctx.newPage();
      await page.goto(url, { waitUntil: "load", timeout: 60_000 });
      await page.waitForSelector(".rev-item", { timeout: 15_000 });
      await page.waitForTimeout(1500);
      const knapp = page.locator(".rev-expand").first();
      if (!(await knapp.count())) continue;
      const li = knapp.locator("xpath=..");
      const las = () => li.evaluate((el) => {
        const p = el.querySelector(".rev-text");
        return { h: p.clientHeight, klamp: p.classList.contains("rev-text-klamp"), knapp: el.querySelector(".rev-expand")?.textContent ?? null };
      });
      const fore = await las();
      await li.locator(".rev-expand").click();
      await page.waitForTimeout(400);
      const ut = await las();
      await li.locator(".rev-expand").click();
      await page.waitForTimeout(400);
      const in_ = await las();
      const ok = fore.klamp && !ut.klamp && ut.h > fore.h && ut.knapp === "Visa mindre" && in_.klamp && in_.h === fore.h && in_.knapp === "Visa mer";
      return `${ok ? "OK" : "FEL"}: ${fore.h} px → Visa mer → ${ut.h} px (${ut.knapp}) → Visa mindre → ${in_.h} px (${in_.knapp}) på ${url.replace(/^https:\/\/[^/]+/, "")}`;
    } catch (e) {
      return `gick inte: ${String(e.message).split("\n")[0]}`;
    } finally {
      await ctx.close();
    }
  }
  return "ingen sida hade en knapp i den här bredden";
}

async function kollaWebblasare() {
  const { execSync } = await import("node:child_process");
  execSync("npx playwright install --with-deps webkit firefox", { cwd: "/tmp/pw", stdio: "inherit" });
  const { sidor, lasta } = await hittaRecensionssidor();
  skriv(`Produktsidor med långa recensioner: ${sidor.length} (letade bland ${lasta} produktsidor)`);
  skriv("knappar = antal Visa mer, falska = knapp utan dold text, saknade = dold text utan knapp");
  skriv("Layoutskift (CLS) mäts bara i Chrome-motorn; i de andra står de på 0.\n");
  const dator = { viewport: { width: 1366, height: 900 } };
  const motorer = [
    ["Blink (Chrome)", chromium, [["dator 1366", dator], ["mobil 390", devices["Pixel 7"]]]],
    ["WebKit (Safari)", webkit, [["dator 1366", dator], ["iPhone 13", devices["iPhone 13"]]]],
    ["Gecko (Firefox)", firefox, [["dator 1366", dator], ["mobil 390", { viewport: { width: 390, height: 844 } }]]],
  ];
  for (const [namn, typ, enheter] of motorer) {
    skriv(`================ ${namn} ================`);
    const b = await typ.launch();
    try {
      for (const [enhetNamn, enhet] of enheter) {
        for (const bas of [BUTIK, RECENSION_FORHANDS]) {
          const { summa, falskaPa } = await matRecensioner(b, bas, enhet, sidor);
          skriv(`${bas.replace(/^https:\/\//, "").slice(0, 40).padEnd(40)} ${enhetNamn.padEnd(10)} sidor ${summa.sidor}  klampade texter ${summa.avkortade}  knappar ${summa.knappar}  falska ${summa.falska}  saknade ${summa.saknade}  fel ${summa.fel}  skriptfel ${summa.skriptfel}  CLS ${summa.clsMax.toFixed(3)}`);
          for (const s of falskaPa) skriv(`    falsk knapp på ${s}`);
        }
        skriv(`  fäll ut och in på förhandsbygget, ${enhetNamn}: ${await provaKnappen(b, enhet, sidor.map((u) => u.replace(BUTIK, RECENSION_FORHANDS)))}`);
      }
    } finally {
      await b.close();
    }
  }
}

// ================ KLICKEN (KOR=klick) ================
// Fäller "Visa mer" ut texten vid FÖRSTA klicket, i alla tre motorerna?
// Körning 14 såg i Firefox ett första klick som inte gjorde något och ett andra
// som fällde ut. Det här provet skiljer på två förklaringar: att knappen ännu
// inte var inkopplad (React hade inte hydrerat sidan) eller att lagningen
// stör klicket. Det väntar tills knappen bevisligen är inkopplad (React sätter
// __reactProps$… på elementet), noterar om den var det vid 1,5 s, och klickar
// sedan ut och in på flera sidor, på sajten och på förhandsbygget.
const hydrerad = () => {
  const b = document.querySelector(".rev-expand");
  return !!b && Object.keys(b).some((k) => k.startsWith("__reactProps$"));
};

async function klickaPa(browser, enhet, url) {
  const ctx = await browser.newContext({ ...enhet, locale: "sv-SE", timezoneId: "Europe/Stockholm" });
  try {
    const page = await ctx.newPage();
    const t0 = Date.now();
    await page.goto(url, { waitUntil: "load", timeout: 60_000 });
    await page.waitForSelector(".rev-item", { timeout: 15_000 });
    await page.waitForTimeout(1500);
    if (!(await page.locator(".rev-expand").count())) return null;
    const vid15 = await page.evaluate(hydrerad);
    await page.waitForFunction(hydrerad, null, { timeout: 30_000 });
    const hydrMs = Date.now() - t0;
    const li = page.locator(".rev-expand").first().locator("xpath=..");
    const las = () => li.evaluate((el) => {
      const p = el.querySelector(".rev-text");
      return `${p.clientHeight}px/${el.querySelector(".rev-expand")?.textContent ?? "-"}`;
    });
    const steg = [await las()];
    for (let i = 0; i < 4; i++) {
      await li.locator(".rev-expand").click();
      await page.waitForTimeout(350);
      steg.push(await las());
    }
    // Väntat mönster: ut, in, ut, in. Varje klick ska byta läge.
    const vaxlar = steg.slice(1).every((s, i) => s.endsWith(i % 2 === 0 ? "/Visa mindre" : "/Visa mer"));
    return { ok: vaxlar, vid15, hydrMs, steg: steg.join(" → ") };
  } catch (e) {
    return { ok: false, fel: String(e.message).split("\n")[0] };
  } finally {
    await ctx.close();
  }
}

async function kollaKlick() {
  const { execSync } = await import("node:child_process");
  execSync("npx playwright install --with-deps webkit firefox", { cwd: "/tmp/pw", stdio: "inherit" });
  const { sidor } = await hittaRecensionssidor();
  skriv(`Sidor med långa recensioner: ${sidor.length}. Mobilbredd, fyra klick per sida (ut, in, ut, in).\n`);
  const motorer = [
    ["Blink (Chrome)", chromium, devices["Pixel 7"]],
    ["WebKit (Safari)", webkit, devices["iPhone 13"]],
    ["Gecko (Firefox)", firefox, { viewport: { width: 390, height: 844 } }],
  ];
  for (const [namn, typ, enhet] of motorer) {
    skriv(`================ ${namn} ================`);
    const b = await typ.launch();
    try {
      for (const bas of [BUTIK, RECENSION_FORHANDS]) {
        let provade = 0, ok = 0, inteInkoppladeVid15 = 0;
        for (const u of sidor) {
          if (provade >= 5) break;
          const r = await klickaPa(b, enhet, u.replace(BUTIK, bas));
          if (!r) continue;
          provade++;
          if (r.ok) ok++;
          if (r.vid15 === false) inteInkoppladeVid15++;
          if (!r.ok) skriv(`    FEL på ${u.replace(BUTIK, "")}: ${r.fel ?? r.steg}`);
        }
        skriv(`${bas.replace(/^https:\/\//, "").slice(0, 40).padEnd(40)} sidor ${provade}  alla klick rätt ${ok}/${provade}  knappen inte inkopplad vid 1,5 s: ${inteInkoppladeVid15}`);
      }
    } finally {
      await b.close();
    }
  }
}

// ================ KLICKEN, MED FACIT (KOR=klick2) ================
// Körning 14 och 15 såg enstaka klick som inte bytte läge, bara på
// förhandsbygget och i olika motorer. Två sorters klick skiljer orsakerna åt:
//  - musklick (som en kund): kan missa om något flyttar sig när klicket landar
//  - direkt klick på knappen från sidan (button.click()): kan inte missa målet
// Missar de direkta klicken på förhandsbygget är det ett fel i lagningen. För
// varje missat musklick skrivs ut vad som låg under pekaren och om knappen flyttat sig.
async function klickaMedFacit(browser, enhet, url) {
  const ctx = await browser.newContext({ ...enhet, locale: "sv-SE", timezoneId: "Europe/Stockholm" });
  const ut = { mus: 0, musMiss: 0, js: 0, jsMiss: 0, rullade: 0, detaljer: [] };
  try {
    const page = await ctx.newPage();
    await page.goto(url, { waitUntil: "load", timeout: 60_000 });
    await page.waitForSelector(".rev-item", { timeout: 15_000 });
    if (!(await page.locator(".rev-expand").count())) return null;
    await page.waitForFunction(() => {
      const b = document.querySelector(".rev-expand");
      return !!b && Object.keys(b).some((k) => k.startsWith("__reactProps$"));
    }, null, { timeout: 30_000 });
    await page.waitForTimeout(800);
    // Märk recensionen så att den går att hitta igen efter varje rendering.
    await page.evaluate(() => { document.querySelector(".rev-expand").closest(".rev-item").setAttribute("data-prov", "1"); });
    const lage = () => page.evaluate(() => document.querySelector('[data-prov="1"] .rev-expand')?.textContent ?? "-");
    // Musklick.
    for (let i = 0; i < 8; i++) {
      const fore = await lage();
      // Butiken rullar mjukt (scroll-behavior: smooth). Läs knappens läge först
      // när den stått still i tre avläsningar i rad, annars landar klicket där
      // knappen var en bit in i rullningen.
      const info = await page.evaluate(async () => {
        const b = document.querySelector('[data-prov="1"] .rev-expand');
        b.scrollIntoView({ block: "center" });
        let forra = null, lika = 0;
        for (let i = 0; i < 80 && lika < 3; i++) {
          await new Promise((r) => setTimeout(r, 50));
          const top = Math.round(b.getBoundingClientRect().top);
          lika = top === forra ? lika + 1 : 0;
          forra = top;
        }
        const r = b.getBoundingClientRect();
        return { x: r.left + r.width / 2, y: r.top + r.height / 2, top: Math.round(r.top), scrollY: Math.round(scrollY) };
      });
      const info2 = await page.evaluate(({ x, y }) => {
        const b = document.querySelector('[data-prov="1"] .rev-expand');
        const r = b.getBoundingClientRect();
        const e = document.elementFromPoint(x, y);
        return { top: Math.round(r.top), traff: e ? `${e.tagName.toLowerCase()}.${String(e.className).split(" ")[0]}` : "inget", ar: e === b };
      }, info);
      await page.mouse.click(info.x, info.y);
      await page.waitForTimeout(350);
      const efter = await lage();
      ut.mus++;
      const knappEfter = await page.evaluate(() => Math.round(document.querySelector('[data-prov="1"] .rev-expand').getBoundingClientRect().top));
      // Utfällning skjuter knappen nedåt och ihopfällning uppåt, så det som räknas
      // är om sidan rullat av sig själv: scrollY ska stå still vid själva klicket.
      const scrollEfter = await page.evaluate(() => Math.round(scrollY));
      if (scrollEfter !== info.scrollY) { ut.rullade = (ut.rullade || 0) + 1; ut.detaljer.push(`mus ${i + 1}: sidan rullade ${info.scrollY} → ${scrollEfter} px vid klicket (knappen ${info.top} → ${knappEfter} px)`); }
      if (efter === fore) {
        ut.musMiss++;
        const info3 = await page.evaluate(() => Math.round(document.querySelector('[data-prov="1"] .rev-expand').getBoundingClientRect().top));
        ut.detaljer.push(`mus ${i + 1}: ${fore} låg kvar. Knappens överkant ${info.top} → ${info2.top} → ${info3} px, under pekaren: ${info2.traff}${info2.ar ? " (knappen)" : ""}`);
      }
    }
    // Direkta klick på knappen.
    for (let i = 0; i < 8; i++) {
      const fore = await lage();
      await page.evaluate(() => document.querySelector('[data-prov="1"] .rev-expand').click());
      await page.waitForTimeout(300);
      const efter = await lage();
      ut.js++;
      if (efter === fore) { ut.jsMiss++; ut.detaljer.push(`direkt ${i + 1}: ${fore} låg kvar`); }
    }
    return ut;
  } catch (e) {
    ut.detaljer.push(`gick inte: ${String(e.message).split("\n")[0]}`);
    return ut;
  } finally {
    await ctx.close();
  }
}

async function kollaKlick2() {
  const { execSync } = await import("node:child_process");
  execSync("npx playwright install --with-deps webkit firefox", { cwd: "/tmp/pw", stdio: "inherit" });
  const { sidor } = await hittaRecensionssidor();
  skriv(`Sidor med långa recensioner: ${sidor.length}. Mobilbredd, 8 musklick och 8 direkta klick per sida.\n`);
  const motorer = [
    ["WebKit (Safari)", webkit, devices["iPhone 13"]],
    ["Gecko (Firefox)", firefox, { viewport: { width: 390, height: 844 } }],
    ["Blink (Chrome)", chromium, devices["Pixel 7"]],
  ];
  for (const [namn, typ, enhet] of motorer) {
    skriv(`================ ${namn} ================`);
    const b = await typ.launch();
    try {
      for (const bas of [BUTIK, RECENSION_FORHANDS]) {
        const s = { sidor: 0, mus: 0, musMiss: 0, js: 0, jsMiss: 0, rullade: 0 };
        const detaljer = [];
        for (const u of sidor) {
          if (s.sidor >= 6) break;
          const r = await klickaMedFacit(b, enhet, u.replace(BUTIK, bas));
          if (!r) continue;
          s.sidor++; s.mus += r.mus; s.musMiss += r.musMiss; s.js += r.js; s.jsMiss += r.jsMiss; s.rullade += r.rullade || 0;
          for (const d of r.detaljer) detaljer.push(`${u.replace(BUTIK, "")}: ${d}`);
        }
        skriv(`${bas.replace(/^https:\/\//, "").slice(0, 40).padEnd(40)} sidor ${s.sidor}  musklick ${s.mus - s.musMiss}/${s.mus} rätt  direkta klick ${s.js - s.jsMiss}/${s.js} rätt  sidan rullade av sig själv ${s.rullade} gånger`);
        for (const d of detaljer.slice(0, 6)) skriv(`    ${d}`);
      }
    } finally {
      await b.close();
    }
  }
}

// ================ KATEGORITEXTERNA (KOR=kategorier) ================
// Läser elva kategorisidor och varje produkt i dem, så att kategoritexterna kan
// stämmas av mot det som faktiskt ligger i kategorin (Leonard 2026-10-20). Allt
// som läses är publikt: sidans texter, produktnamn, pris, lagerstatus, flikar.
// Produktlistan tas ur sidans A–Ö-index, som har alla produkter i kategorin
// (rutnätet visar 24 och resten bakom "Visa fler").
const KAT_SLUGS = [
  "boxningssackar", "motionscyklar", "hundbaddar-hundsoffor", "koksredskap-tillbehor",
  "vattenkokare-brodrostar", "matgrupper", "julgranar", "juldekoration", "golvlampor",
  "bollsport", "selar-koppel-transport",
];

async function lasSida(ctx, url) {
  const page = await ctx.newPage();
  try {
    const r = await page.goto(url, { waitUntil: "domcontentloaded", timeout: 90_000 });
    return { status: r?.status() ?? null, page };
  } catch (e) {
    await page.close();
    return { status: null, fel: String(e.message).slice(0, 200) };
  }
}

async function kollaKategorier(browser) {
  // Bara själva HTML:en: utan skript och utan bilder, så att sidan läses som
  // servern skickade den.
  const ctx = await browser.newContext({ javaScriptEnabled: false });
  await ctx.route("**/*", (r) => (r.request().resourceType() === "document" ? r.continue() : r.abort()));
  const ut = { tid: new Date().toISOString(), kategorier: {}, produkter: {} };
  const allaSlugs = new Set();
  for (const slug of KAT_SLUGS) {
    const { status, page, fel } = await lasSida(ctx, `${BUTIK}/kategori/${slug}`);
    if (!page) { ut.kategorier[slug] = { status, fel }; skriv(`${slug}: gick inte (${fel})`); continue; }
    const k = await page.evaluate(() => {
      const t = (el) => (el?.textContent || "").replace(/\s+/g, " ").trim();
      const ld = [...document.querySelectorAll('script[type="application/ld+json"]')]
        .map((s) => { try { return JSON.parse(s.textContent); } catch { return null; } })
        .filter(Boolean);
      const faqLd = ld.find((x) => x["@type"] === "FAQPage");
      const index = [...document.querySelectorAll(".prodindex-body a[href^='/produkt/']")]
        .map((a) => ({ slug: a.getAttribute("href").replace(/^\/produkt\//, "").split(/[?#]/)[0], namn: t(a) }));
      return {
        title: document.title,
        meta: document.querySelector('meta[name="description"]')?.getAttribute("content") || null,
        robots: document.querySelector('meta[name="robots"]')?.getAttribute("content") || null,
        h1: t(document.querySelector(".kat-hero h1")),
        ingress: t(document.querySelector(".kat-hero-text p")),
        intro: [...document.querySelectorAll(".kat-intro p")].map(t),
        faq: [...document.querySelectorAll(".kat-faq-item")].map((d) => ({ q: t(d.querySelector("dt")), a: t(d.querySelector("dd")) })),
        faqLd: faqLd ? faqLd.mainEntity.map((m) => ({ q: m.name, a: m.acceptedAnswer?.text })) : null,
        indexAntal: t(document.querySelector(".prodindex-count")),
        index,
      };
    });
    await page.close();
    ut.kategorier[slug] = { status, ...k };
    for (const p of k.index) allaSlugs.add(p.slug);
    skriv(`${slug}: ${status}, ${k.index.length} produkter i A–Ö (${k.indexAntal}), ${k.intro.length} stycken, ${k.faq.length} frågor, FAQ-data ${k.faqLd ? k.faqLd.length : "saknas"}`);
  }
  const lista = [...allaSlugs];
  await iParallell(lista, 6, async (slug) => {
    const { status, page, fel } = await lasSida(ctx, `${BUTIK}/produkt/${slug}`);
    if (!page) { ut.produkter[slug] = { status, fel }; return true; }
    const p = await page.evaluate(() => {
      const t = (el) => (el?.textContent || "").replace(/\s+/g, " ").trim();
      const ld = [...document.querySelectorAll('script[type="application/ld+json"]')]
        .map((s) => { try { return JSON.parse(s.textContent); } catch { return null; } })
        .filter(Boolean);
      const prod = ld.find((x) => x["@type"] === "Product");
      const erbj = prod ? (Array.isArray(prod.offers) ? prod.offers : [prod.offers]).filter(Boolean) : [];
      return {
        namn: t(document.querySelector("h1")),
        pris: erbj.map((o) => o.price ?? o.lowPrice ?? null),
        lager: erbj.map((o) => String(o.availability || "").replace("https://schema.org/", "")),
        varianter: t(document.querySelector(".pdp-variants")).slice(0, 800),
        beskrivning: t(document.querySelector(".pdp-desc")).slice(0, 5000),
        flikar: [...document.querySelectorAll("details.pdp-flik")]
          .map((d) => ({ titel: t(d.querySelector("summary")), text: t(d.querySelector(".pdp-flik-body")).slice(0, 5000) })),
        specbox: t(document.querySelector(".specbox")).slice(0, 2500),
      };
    });
    await page.close();
    ut.produkter[slug] = { status, ...p };
    return true;
  }, Date.now() + 14 * 60_000);
  const utan200 = Object.values(ut.produkter).filter((p) => p.status !== 200).length;
  skriv(`\nProdukter: ${lista.length} unika, ${Object.keys(ut.produkter).length} lästa, ${utan200} utan 200.`);
  fs.writeFileSync(path.join(UT, "kategorier.json"), JSON.stringify(ut));
  await ctx.close();
}

const KOR = process.env.KOR || "kategorier";
const browser = await chromium.launch();
try {
  if (KOR === "kategorier") {
    await kollaKategorier(browser);
  } else if (KOR === "klick2") {
    await kollaKlick2();
  } else if (KOR === "klick") {
    await kollaKlick();
  } else if (KOR === "webblasare") {
    await kollaWebblasare();
  } else if (KOR === "recensioner") {
    await kollaRecensioner(browser);
  } else if (KOR === "varm") {
    await varmButiken(browser);
  } else {
  const vara = await hittaVara();
  skriv(`Vara: ${vara.namn} (${vara.pris} kr)`);
  // KOR=mat mäter laddningen, KOR=bunt granskar kassans kod.
  const kor = KOR;
  if (kor === "avdelningar") {
    await kollaAvdelningar();
    skriv("\n================ COOKIERUTAN OCH TILL KASSAN ================");
    for (const bas of [BUTIK, process.env.FORHANDS || "https://fyndplats-headless-git-claude-kass-4edc42-leonardarazs-projects.vercel.app"]) {
      try { await kollaCookierutan(browser, bas, vara); } catch (e) { skriv(`${bas}: gick inte: ${e.message}`); }
    }
  } else if (kor === "egen") {
    // Sajtens egen kassasida i stället för Wix standardmall.
    for (const pref of [{ useGenericWixPages: false }, { checkIfPublish: true }]) {
      skriv(`\n######## preferences ${JSON.stringify(pref)} ########`);
      let adress;
      try { adress = await kassaAdress(vara, pref); } catch (e) { skriv(`gick inte: ${e.message}`); continue; }
      const u = new URL(adress);
      skriv(`Kassans adress: ${u.host}${u.pathname}  parametrar: ${[...u.searchParams.keys()].join(", ")}`);
      for (const lage of LAGEN) {
        const kopia = { ...lage, namn: `${pref.useGenericWixPages === false ? "egen" : "publicerad"}-${lage.namn}` };
        await matKassan(browser, kopia, adress);
      }
    }
  } else if (kor === "bunt") {
    await granskaKassakoden(browser, await kassaAdress(vara));
  } else {
    for (const lage of LAGEN) {
      const adress = await kassaAdress(vara);
      skriv(`Kassans värd: ${new URL(adress).host}`);
      await matKassan(browser, lage, adress);
    }
    try { await matVagen(browser, LAGEN[0]); } catch (e) { skriv(`Hela vägen föll: ${e.message}`); }
  }
  }
} finally {
  await browser.close();
  const k = KOR;
  const fil = k === "kategorier" ? "kategorier.txt" : k === "klick2" ? "klick2.txt" : k === "klick" ? "klick.txt" : k === "webblasare" ? "webblasare.txt" : k === "recensioner" ? "recensioner.txt" : k === "varm" ? "varmning.txt" : k === "bunt" ? "kassakod.txt" : k === "egen" ? "egen-kassasida.txt" : k === "avdelningar" ? "avdelningar.txt" : "sammanfattning.txt";
  fs.writeFileSync(path.join(UT, fil), rader.join("\n") + "\n");
}
