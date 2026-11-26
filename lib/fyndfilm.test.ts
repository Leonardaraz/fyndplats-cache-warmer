// lib/fyndfilm.test.ts — fyndauktionens reklamfilm (lib/fyndfilm.ts,
// components/fyndfilm.tsx) och studion på auktionssidan.
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { FYNDFILM, SKARM_MAX_BREDD, aktivFilm, filmKallor, filmStillbild, skarmKalla } from "./fyndfilm.ts";

const ROT = join(import.meta.dirname, "..");
const kod = (rel: string) => readFileSync(join(ROT, rel), "utf8");
const utanKommentarer = (t: string) => t.replace(/\/\*[\s\S]*?\*\//g, "").replace(/^\s*\/\/.*$/gm, "");

describe("filmens slut", () => {
  it("☠️ filmen slutar när Black Friday-auktionen stänger: fredag 27 november kl 19 svensk tid", () => {
    const svensk = new Intl.DateTimeFormat("sv-SE", {
      timeZone: "Europe/Stockholm",
      dateStyle: "short",
      timeStyle: "short",
    }).format(new Date(FYNDFILM.slutarMs));
    assert.equal(svensk, "2026-11-27 19:00");
  });

  it("visas före slutet och aldrig efter", () => {
    assert.equal(aktivFilm(FYNDFILM.slutarMs - 1), FYNDFILM);
    assert.equal(aktivFilm(Date.UTC(2026, 10, 27, 2, 5)), FYNDFILM, "efter nattens deploy");
    assert.equal(aktivFilm(FYNDFILM.slutarMs), null);
    assert.equal(aktivFilm(FYNDFILM.slutarMs + 3_600_000), null);
    assert.equal(aktivFilm(Number.NaN), null);
    assert.equal(aktivFilm(0, null), null);
  });
});

describe("filerna", () => {
  it("fyra mp4-filer på Wix videovärd, stigande bredd, stående 9:16", () => {
    const k = filmKallor(FYNDFILM);
    assert.equal(k.length, 4);
    for (const f of k) {
      assert.match(f.url, /^https:\/\/video\.wixstatic\.com\/video\/b379ce_[0-9a-f]{32}\/(360|480|720|1080)p\/mp4\/file\.mp4$/);
      assert.ok(f.hojd > f.bredd, "stående");
    }
    assert.deepEqual(k.map((f) => f.bredd), [202, 270, 406, 1080]);
  });

  it("skärmen utan ljud får den minsta fil som räcker, aldrig 1080p (19 MB)", () => {
    const k = filmKallor(FYNDFILM);
    assert.equal(skarmKalla(k, 96 * 2)?.bredd, 202, "telefon: 360p");
    assert.equal(skarmKalla(k, 236)?.bredd, 270, "dator med vanlig skärm: 480p");
    assert.equal(skarmKalla(k, 236 * 2)?.bredd, 406, "tät skärm: 720p");
    assert.equal(skarmKalla(k, 5000)?.bredd, SKARM_MAX_BREDD);
    assert.equal(skarmKalla(k, Number.NaN)?.bredd, 202);
    assert.equal(skarmKalla([], 100), null);
  });

  it("☠️ stillbilden är filmens första bild, aldrig räkneverket mitt i en siffra (f002)", () => {
    assert.equal(FYNDFILM.stillbild, "f000");
    const u = filmStillbild(FYNDFILM, 280);
    assert.match(u, /^https:\/\/static\.wixstatic\.com\/media\/b379ce_[0-9a-f]{32}f000\.jpg\/v1\/fill\/w_280,h_498,al_c,q_80,enc_auto\/fyndfilm\.jpg$/);
    assert.doesNotMatch(u, /f002/);
  });
});

describe("skärmen i webbläsaren", () => {
  const t = utanKommentarer(kod("components/fyndfilm.tsx"));

  it("ingenting hämtas i förväg: ingen src i sidan och preload none", () => {
    assert.match(t, /<video ref=\{video\} className=\{s\.video\} muted loop playsInline preload="none" aria-hidden="true" tabIndex=\{-1\} \/>/);
    assert.match(t, /<video\s+ref=\{stor\}[\s\S]*?preload="none"/);
    assert.doesNotMatch(t, /<video[^>]*\ssrc=/, "adressen sätts först i webbläsaren");
    assert.match(t, /loading=\{lage === "band" \? "lazy" : "eager"\}/);
    assert.match(t, /fetchPriority="low"/);
  });

  it("spelar aldrig för den som bett om mindre rörelse eller sparar data", () => {
    const effekt = t.slice(t.indexOf("useEffect(() => {"), t.indexOf("new IntersectionObserver"));
    assert.match(effekt, /if \(ingenRorelse\(\) \|\| sparlage\(\)\) return;/);
    assert.match(t, /prefersDataSaving\(n\.connection\)/);
  });

  it("filmen tonas in först när den spelar, annars står stillbilden kvar", () => {
    assert.match(t, /v\.addEventListener\("playing", spelar\)/);
    assert.match(kod("components/fyndfilm.module.css"), /\.skarm\[data-spelar\] \.video \{\s*opacity: 1;/);
  });

  it("☠️ lagret med ljud finns i sidan innan play() anropas, i samma tryck", () => {
    const oppna = t.slice(t.indexOf("const oppna = useCallback"), t.indexOf("}, [film]);", t.indexOf("const oppna = useCallback")));
    const lagret = oppna.indexOf("flushSync(() => setOppen(true));");
    const spela = oppna.indexOf("v.play()");
    assert.ok(lagret > 0 && spela > lagret, "flushSync före play()");
    assert.match(oppna, /v\.muted = false;/);
    assert.match(t, /createPortal\(\s*<div\s+className=\{s\.spelare\}\s+role="dialog"\s+aria-modal="true"/);
    assert.match(t, /document\.body,\s*\)/);
  });

  it("efter filmens slut ritas ingenting, också ur en sida i cachen", () => {
    assert.match(t, /const \{ nowMs \} = useClientNow\(nuMs, 60_000\);\s*if \(!\(nowMs < film\.slutarMs\)\) return null;/);
  });

  it("bandets skärm är dekor i länken; studions är en knapp med namn", () => {
    assert.match(t, /className=\{`\$\{s\.skarm\} \$\{s\.band\} ff-band`\} aria-hidden="true"/);
    assert.match(t, /type="button"\s+className=\{`\$\{s\.skarm\} \$\{s\.studio\} ff-studio`\}\s+aria-label=\{`\$\{film\.namn\}\. Spela med ljud, \$\{langdTal\(film\.langdSek\)\}`\}/);
  });
});

describe("sidorna", () => {
  it("auktionssidan: filmen bara när den gäller, och pillen utanför studion", () => {
    const t = utanKommentarer(kod("app/fyndauktion/page.tsx"));
    assert.match(t, /\{film && <FyndFilm film=\{film\} lage="studio" nuMs=\{nu\} \/>\}/);
    const studio = t.indexOf("styles.studio");
    const utbud = t.indexOf("styles.utbud");
    const pill = t.indexOf("<AuctionLiveBar");
    assert.ok(studio > 0 && utbud > studio && pill > utbud, "AuctionLiveBar ligger i sektionen under studion");
    assert.match(t, /\{hero \? \(\s*<AuctionHeroCard a=\{hero\} \/>/);
  });

  it("startsidan: filmen i auktionsbandet bara när den gäller, med en rubrik utan antal", () => {
    const t = utanKommentarer(kod("app/page.tsx"));
    assert.match(t, /<section className=\{`auktionsrad\$\{film \? " med-film" : ""\}`\}>/);
    assert.match(t, /\{film && <FyndFilm film=\{film\} lage="band" nuMs=\{filmNu\} \/>\}/);
    const rubrik = t.slice(t.indexOf('<span className="auction-banner-rubrik">'), t.indexOf("</span>", t.indexOf('<span className="auction-banner-rubrik">')));
    assert.ok(rubrik.length > 0);
    assert.doesNotMatch(rubrik, /\d/, "☠️ butikens egna texter nämner aldrig antalet fynd");
  });

  it("☠️ startsidans skärm står inne i bandet, inte upp ur det (Leonard 2026-11-26)", () => {
    const css = utanKommentarer(kod("app/startsida.css"));
    const skarm = [...css.matchAll(/\.med-film \.ff-band\{([^}]*)\}/g)].map((m) => m[1]);
    assert.equal(skarm.length, 2, "skärmens regel för dator och för mobil");
    for (const r of skarm) assert.doesNotMatch(r, /margin/, "en marginal lyfter skärmen ur bandet");
    // Datorn: två tomma rader tar upp skärmens höjd, så att texten står samlad i mitten.
    assert.match(css, /\.hem2 \.med-film \.auction-banner\{display:grid;grid-template-columns:auto minmax\(0,1fr\) auto;\s*grid-template-rows:1fr auto auto auto 1fr;\s*grid-template-areas:"film \. cta" "film badge cta" "film rubrik cta" "film text cta" "film \. cta";/);
    // Mobilen: fyra rader som följer texten, utan datorns tomma rader.
    assert.match(css, /grid-template-columns:minmax\(0,1fr\) auto;grid-template-rows:none;\s*grid-template-areas:"badge film" "rubrik film" "text film" "cta film";/);
  });

  it("☠️ inget i filmens kod eller studion skriver ut ett antal fynd", () => {
    for (const rel of ["components/fyndfilm.tsx", "lib/fyndfilm.ts", "app/fyndauktion/fyndauktion.module.css"]) {
      assert.doesNotMatch(utanKommentarer(kod(rel)), /\d+\s*fynd/i, rel);
    }
  });
});
