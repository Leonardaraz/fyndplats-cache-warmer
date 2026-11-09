// Produktvideon i galleriet (lib/produkt-video.ts, components/gallery.tsx).
// Kör: node --test --experimental-strip-types lib/produkt-video.test.ts

import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import {
  MIN_KORTSIDA,
  SPAR_KORTSIDA,
  forstaVideo,
  langdTal,
  langdText,
  valjKalla,
  videoUrPost,
  type VideoKalla,
} from "./produkt-video.ts";

const ID = "b379ce_f1ff79a03afd4a008c5bf0522883a443";
const V = `https://video.wixstatic.com/video/${ID}`;
const P = `https://static.wixstatic.com/media/${ID}`;

// Formen Wix Stores V3 ger för en videopost (media.itemsInfo.items[n]),
// avläst på leksakshjullastaren 2026-11-09. Ordningen är Wix egen: störst först
// och HLS sist.
const wixPost = () => ({
  id: ID,
  mediaType: "VIDEO",
  uploadId: "x",
  video: {
    id: ID,
    url: `${V}/file`,
    resolutions: [
      { url: `${V}/1080p/mp4/file.mp4`, height: 1080, width: 1920, format: "mp4", quality: "1080p", durationInSeconds: 27, durationInMilliseconds: 27000, private: false },
      { url: `${V}/720p/mp4/file.mp4`, height: 720, width: 1280, format: "mp4", quality: "720p", durationInSeconds: 27, durationInMilliseconds: 27000, private: false },
      { url: `${V}/480p/mp4/file.mp4`, height: 480, width: 854, format: "mp4", quality: "480p", durationInSeconds: 27, durationInMilliseconds: 27000, private: false },
      { url: `${V}/360p/mp4/file.mp4`, height: 360, width: 640, format: "mp4", quality: "360p", durationInSeconds: 27, durationInMilliseconds: 27000, private: false },
      { url: `https://files.wix.com/site/media/video/${ID}/site/repackage/hls`, height: 0, width: 0, format: "hls" },
    ],
    filename: "leksaksmotor-hjullastare-fyndplats.mp4",
    posters: [
      { id: `${ID}f000.jpg`, url: `${P}f000.jpg`, height: 1080, width: 1920 },
      { id: `${ID}f001.jpg`, url: `${P}f001.jpg`, height: 1080, width: 1920 },
      { id: `${ID}f002.jpg`, url: `${P}f002.jpg`, height: 1080, width: 1920 },
      { id: `${ID}f003.jpg`, url: `${P}f003.jpg`, height: 1080, width: 1920 },
    ],
    sizeInBytes: "22300048",
    durationInMilliseconds: 27000,
  },
});

const bildPost = {
  id: "b379ce_e93b1b836100411087133562af9ab783~mv2.jpg",
  mediaType: "IMAGE",
  image: { url: "https://static.wixstatic.com/media/b379ce_e93b1b836100411087133562af9ab783~mv2.jpg", width: 2000, height: 2000 },
};

test("Wix videopost: fyra mp4 i stigande bredd, HLS bort, andra stillbilden, 27 s", () => {
  const v = videoUrPost(wixPost());
  assert.ok(v);
  assert.equal(v.id, ID);
  assert.deepEqual(v.kallor.map((k) => k.bredd), [640, 854, 1280, 1920]);
  assert.ok(v.kallor.every((k) => k.url.endsWith("/file.mp4")));
  assert.equal(v.poster, `${P}f001.jpg`);
  assert.equal(v.bredd, 1920);
  assert.equal(v.hojd, 1080);
  assert.equal(v.langdSek, 27);
});

test("en bild, en tom post eller en video utan mp4 är ingen video", () => {
  assert.equal(videoUrPost(bildPost), null);
  assert.equal(videoUrPost(null), null);
  assert.equal(videoUrPost("video"), null);
  assert.equal(videoUrPost({ mediaType: "VIDEO" }), null);
  const baraHls = wixPost();
  baraHls.video.resolutions = baraHls.video.resolutions.filter((r) => r.format === "hls");
  assert.equal(videoUrPost(baraHls), null);
});

test("privata filer, främmande värdar och filer utan mått spelas aldrig", () => {
  const post = wixPost();
  const [r1080, r720, r480, r360] = post.video.resolutions;
  r1080.private = true;
  r720.url = "https://example.com/video/720p.mp4";
  r480.url = r480.url.replace("https://", "http://");
  r360.width = 0;
  assert.equal(videoUrPost(post), null);

  const enKvar = wixPost();
  enKvar.video.resolutions[0].private = true;
  assert.deepEqual(videoUrPost(enKvar)?.kallor.map((k) => k.bredd), [640, 854, 1280]);
  assert.equal(videoUrPost(enKvar)?.bredd, 1280);
});

test("samma bredd två gånger blir en fil, och mått som text godtas", () => {
  const post = wixPost() as unknown as { video: { resolutions: Record<string, unknown>[] } };
  post.video.resolutions.push({ url: `${V}/720p/mp4/annan.mp4`, width: "1280", height: "720", format: "mp4" });
  const v = videoUrPost(post);
  assert.deepEqual(v?.kallor.map((k) => k.bredd), [640, 854, 1280, 1920]);
  assert.equal(v?.kallor[2].url, `${V}/720p/mp4/file.mp4`);
});

test("stillbilden: den andra, annars den första, aldrig en främmande värd", () => {
  const en = wixPost();
  en.video.posters = en.video.posters.slice(0, 1);
  assert.equal(videoUrPost(en)?.poster, `${P}f000.jpg`);

  const fel = wixPost();
  fel.video.posters = [{ id: "x", url: "https://example.com/p.jpg", width: 1, height: 1 }];
  assert.equal(videoUrPost(fel)?.poster, "");

  const ingen = wixPost() as unknown as { video: { posters?: unknown } };
  delete ingen.video.posters;
  const v = videoUrPost(ingen);
  assert.ok(v, "en video utan stillbild spelas ändå");
  assert.equal(v.poster, "");
});

test("längden: ur videon, annars ur en fil, annars 0", () => {
  const post = wixPost() as unknown as { video: { durationInMilliseconds?: number } };
  delete post.video.durationInMilliseconds;
  assert.equal(videoUrPost(post)?.langdSek, 27);

  const utan = wixPost() as unknown as { video: { durationInMilliseconds?: number; resolutions: Record<string, unknown>[] } };
  delete utan.video.durationInMilliseconds;
  for (const r of utan.video.resolutions) delete r.durationInMilliseconds;
  assert.equal(videoUrPost(utan)?.langdSek, 0);
});

test("forstaVideo: den första spelbara posten bland bilderna", () => {
  assert.equal(forstaVideo([bildPost, wixPost()])?.id, ID);
  assert.equal(forstaVideo([bildPost]), null);
  assert.equal(forstaVideo([]), null);
  assert.equal(forstaVideo(undefined), null);
  assert.equal(forstaVideo(null), null);
});

const kallor: VideoKalla[] = videoUrPost(wixPost())!.kallor;

test("valjKalla: minsta som räcker, aldrig under 720p, annars den största", () => {
  assert.equal(MIN_KORTSIDA, 720);
  // Telefon: 390 px × 3 = 1 170 → 720p. Dator: 544 × 2 = 1 088 → 720p.
  assert.equal(valjKalla(kallor, 1170)?.bredd, 1280);
  assert.equal(valjKalla(kallor, 1088)?.bredd, 1280);
  // Liten ruta eller okänd bredd: ändå 720p, 480p blir suddigt.
  assert.equal(valjKalla(kallor, 300)?.bredd, 1280);
  assert.equal(valjKalla(kallor, 0)?.bredd, 1280);
  assert.equal(valjKalla(kallor, Number.NaN)?.bredd, 1280);
  // 544 × 3 = 1 632 → 1080p, och mer än 1080p finns inte.
  assert.equal(valjKalla(kallor, 1632)?.bredd, 1920);
  assert.equal(valjKalla(kallor, 4000)?.bredd, 1920);
  // Bara små filer: den största som finns.
  assert.equal(valjKalla(kallor.slice(0, 2), 1170)?.bredd, 854);
  assert.equal(valjKalla([], 1170), null);
});

test("valjKalla: sparläge tar högst 480p, och den minsta om ingen ryms", () => {
  assert.equal(SPAR_KORTSIDA, 480);
  assert.equal(valjKalla(kallor, 1170, true)?.bredd, 854);
  assert.equal(valjKalla(kallor, 4000, true)?.bredd, 854);
  assert.equal(valjKalla(kallor.slice(2), 1170, true)?.bredd, 1280);
  // Ordningen in spelar ingen roll.
  assert.equal(valjKalla([...kallor].reverse(), 1170)?.bredd, 1280);
});

// En stående video (en reel i 9:16) som Wix ger den: samma kvaliteter, bredd
// och höjd ombytta.
const staende: VideoKalla[] = [
  { url: `${V}/1080p/mp4/file.mp4`, bredd: 1080, hojd: 1920 },
  { url: `${V}/720p/mp4/file.mp4`, bredd: 720, hojd: 1280 },
  { url: `${V}/480p/mp4/file.mp4`, bredd: 480, hojd: 854 },
  { url: `${V}/360p/mp4/file.mp4`, bredd: 360, hojd: 640 },
];

test("valjKalla: en stående video räknas på kortsidan, inte på bredden", () => {
  // Telefon: spelaren är 190 px bred i 9:16 (338 px hög) × 3 = 570 → 720p,
  // inte 1080p bara för att ingen stående fil är 1 280 px bred.
  assert.equal(valjKalla(staende, 570)?.hojd, 1280);
  assert.equal(valjKalla(staende, 0)?.hojd, 1280);
  // Dator: 306 px × 2 = 612 → 720p; 306 × 3 = 918 → 1080p.
  assert.equal(valjKalla(staende, 612)?.hojd, 1280);
  assert.equal(valjKalla(staende, 918)?.hojd, 1920);
  // Sparläget: 480p (480×854), inte 720p fast 720 är mindre än 854.
  assert.equal(valjKalla(staende, 570, true)?.hojd, 854);
  // 720p i 4:3 (960×720) räcker för en liggande ruta på 900 px.
  const fyraTre: VideoKalla[] = [
    { url: `${V}/720p/mp4/file.mp4`, bredd: 960, hojd: 720 },
    { url: `${V}/480p/mp4/file.mp4`, bredd: 640, hojd: 480 },
  ];
  assert.equal(valjKalla(fyraTre, 900)?.bredd, 960);
  assert.equal(valjKalla(fyraTre, 900, true)?.bredd, 640);
});

test("längden som text och för skärmläsare", () => {
  assert.equal(langdText(27), "0:27");
  assert.equal(langdText(65), "1:05");
  assert.equal(langdText(59.6), "1:00");
  assert.equal(langdText(0), "");
  assert.equal(langdText(Number.NaN), "");
  assert.equal(langdTal(27), "27 sekunder");
  assert.equal(langdTal(1), "1 sekund");
  assert.equal(langdTal(61), "1 minut och 1 sekund");
  assert.equal(langdTal(120), "2 minuter");
  assert.equal(langdTal(0), "");
});

// ── Galleriet och sidan: egenskaper som inte ska försvinna ──────────────────
const galleri = readFileSync(new URL("../components/gallery.tsx", import.meta.url), "utf8");
const produkter = readFileSync(new URL("./products.ts", import.meta.url), "utf8");
const sida = readFileSync(new URL("../app/produkt/[slug]/page.tsx", import.meta.url), "utf8");
const vy = readFileSync(new URL("../components/productview.tsx", import.meta.url), "utf8");
const css = readFileSync(new URL("../app/globals.css", import.meta.url), "utf8");

const videoTagg = (() => {
  // Taggen i JSX (kommentarerna nämner också "<video controls>").
  const start = galleri.indexOf("<video\n");
  assert.ok(start > 0, "galleriet har en <video>");
  return galleri.slice(start, galleri.indexOf("/>", start));
})();

test("spelaren hämtar ingenting förrän kunden trycker", () => {
  assert.match(videoTagg, /preload="none"/);
  assert.match(videoTagg, /playsInline/);
  assert.match(videoTagg, /controls/);
  // Ingen src i sidan: adressen sätts i trycket. Stillbilden bara när videon visas.
  assert.doesNotMatch(videoTagg, /\ssrc=/);
  assert.match(videoTagg, /poster=\{videoPa &&/);
  // En annan produkt får ett nytt element, aldrig förra produktens fil.
  assert.match(videoTagg, /key=\{video!\.id\}/);
});

test("adressen sätts och play() anropas i samma tryck (iPhone spelar annars inte ljud)", () => {
  const start = galleri.indexOf("const spelaVideo = () => {");
  assert.ok(start > 0);
  const kropp = galleri.slice(start, galleri.indexOf("\n  };", start));
  assert.match(kropp, /el\.src = kalla\.url/);
  assert.match(kropp, /el\.play\(\)/);
  // Direkt i trycket: inget som skjuter adressen eller play() till senare.
  assert.doesNotMatch(kropp, /setTimeout|requestAnimationFrame|queueMicrotask|await |\.then\(/);
  assert.ok(kropp.indexOf("el.src = kalla.url") < kropp.indexOf("el.play()"), "adressen före play()");
  assert.match(kropp, /valjKalla\(video\.kallor, behov, skipSpeculative\(\)\)/);
  // Ingen play() i en effekt.
  assert.equal((galleri.match(/\.play\(\)/g) || []).length, 1);
});

test("spelaren ligger utanför hjältens knapp, och bilden under är inert", () => {
  const hjalte = galleri.indexOf("className={`gmain ");
  const slut = galleri.indexOf("</button>", hjalte);
  const spelare = galleri.indexOf('className={`gvideo ');
  assert.ok(hjalte > 0 && slut > hjalte && spelare > slut, "<video> får inte ligga i <button>");
  assert.match(galleri.slice(hjalte, slut), /inert=\{videoPa \|\| undefined\}/);
  assert.match(galleri, /className=\{`gvideo \$\{videoPa \? "is-on" : ""\}`\} inert=\{!videoPa \|\| undefined\}/);
});

test("videorutan är andra ruta, och bilderna får en ruta mindre", () => {
  assert.match(galleri, /return i === 0 && videoRuta \? \[ruta, videoRuta\] : ruta;/);
  assert.match(galleri, /const bildRutor = harVideo \? MAX_TILES - 1 : MAX_TILES;/);
  assert.match(galleri, /imgs\.slice\(0, bildRutor\)/);
  assert.doesNotMatch(galleri, /imgs\.slice\(0, MAX_TILES\)/);
  // Raden visas också för en produkt med en bild och en video.
  assert.match(galleri, /\|\| harVideo\) && \(/);
});

test("en bildruta eller ett annat val stänger videon", () => {
  // Bildrutan stänger, också när bilden redan låg under videon.
  const ruta = galleri.slice(galleri.indexOf("imgs.slice(0, bildRutor).map"), galleri.indexOf("return i === 0 && videoRuta"));
  assert.match(ruta, /stangVideo\(\);/);
  assert.match(ruta, /const vald = i === active && !videoPa;/);
  // Variantvalet: byter active eller bildlistan stängs videon under renderingen.
  assert.match(galleri, /const videoLage = `\$\{active\}\|\$\{listNyckel\}`;/);
  assert.match(galleri, /if \(videoPa && videoStartLage !== videoLage\) \{/);
  // Och den pausas när den döljs.
  assert.match(galleri, /else el\.pause\(\);/);
});

test("en fil som inte går att spela tar bort rutan", () => {
  assert.match(videoTagg, /onError=\{\(\) => \{[\s\S]*setVideoTrasig\(true\)/);
  assert.match(galleri, /const harVideo = !!video && !videoTrasig;/);
});

test("servern läser videon ur samma V3-anrop som bilderna, bara för produktsidan", () => {
  assert.match(produkter, /return \{ urls: out, alts, video: forstaVideo\(items\) \};/);
  assert.match(produkter, /prod\.video = video;/);
  assert.match(sida, /video=\{p\.video \?\? null\}/);
  assert.match(vy, /video=\{video\}/);
  // mapProduct (listsidorna) bär ingen video.
  const mapStart = produkter.indexOf("function mapProduct(");
  const mapSlut = produkter.indexOf("\n}\n", mapStart);
  assert.doesNotMatch(produkter.slice(mapStart, mapSlut), /video/);
});

test("spelaren har hjältens ruta och är dold med visibility, inte display", () => {
  assert.match(css, /\.gvideo\{position:absolute;top:0;left:0;z-index:5;width:100%;aspect-ratio:1;/);
  assert.match(css, /\.gvideo\{[^}]*visibility:hidden/);
  assert.doesNotMatch(css.slice(css.indexOf(".gvideo{"), css.indexOf(".gvideo-el{")), /display:none/);
  assert.match(css, /\.gallery\{position:relative\}/);
  assert.match(css, /\.gvideo-el\{[^}]*object-fit:contain/);
});

test("spelaren har videons format mitt i rutan, så att ✕ ligger utanför Safaris knappar", () => {
  const tagg = galleri.slice(galleri.indexOf("<video\n"), galleri.indexOf("/>", galleri.indexOf("<video\n")));
  assert.match(tagg, /style=\{\{ aspectRatio: `\$\{video!\.bredd\} \/ \$\{video!\.hojd\}` \}\}/);
  assert.match(tagg, /video!\.hojd > video!\.bredd \? " is-staende" : ""/);
  assert.match(css, /\.gvideo\{[^}]*display:flex;align-items:center;justify-content:center/);
  // Liggande: full bredd och videons höjd. Stående: full höjd och videons bredd.
  assert.match(css, /\.gvideo-el\{[^}]*width:100%;height:auto;max-height:100%/);
  assert.match(css, /\.gvideo-el\.is-staende\{width:auto;height:100%;max-width:100%\}/);
  // ✕ är 36 px men går att träffa på 44 px (Apples minsta tryckyta).
  assert.match(css, /\.gvideo-stang\{[^}]*width:36px;height:36px/);
  assert.match(css, /\.gvideo-stang::before\{content:"";position:absolute;inset:-4px/);
});
