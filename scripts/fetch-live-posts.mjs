// Pull the 7 legacy posts straight from the live-rendered headless pages (the
// authoritative published text — Wix API is unauthenticated for us locally) and
// dump structured raw data to outputs/live-posts-raw.json for the restructurer.
import { promises as fs } from "node:fs";
import path from "node:path";

const SLUGS = [
  "valkommen-till-fyndplats",
  "barbar-projektor-kopguide-2026",
  "husdjursguide-hund-och-katt",
  "leksaker-till-barn-guide",
  "bladlos-nackflakt-kopguide-2026",
  "massagepistol-kopguide-2026",
  "stjarnprojektor-kopguide-2026",
];

// Minimal HTML-entity decoder (named + numeric). The page only emits a handful.
function decodeEntities(s) {
  const named = {
    amp: "&", lt: "<", gt: ">", quot: '"', apos: "'", nbsp: " ",
    aring: "å", Aring: "Å", auml: "ä", Auml: "Ä", ouml: "ö", Ouml: "Ö",
    eacute: "é", hellip: "…", ndash: "–", mdash: "—", rsquo: "’", lsquo: "‘",
    ldquo: "“", rdquo: "”",
  };
  return s
    .replace(/&#x([0-9a-fA-F]+);/g, (_, h) => String.fromCodePoint(parseInt(h, 16)))
    .replace(/&#(\d+);/g, (_, d) => String.fromCodePoint(parseInt(d, 10)))
    .replace(/&([a-zA-Z]+);/g, (m, n) => (n in named ? named[n] : m));
}
function clean(s) {
  return decodeEntities(s.replace(/<[^>]+>/g, "")).replace(/ /g, " ").replace(/[ \t]+/g, " ").trim();
}

const out = [];
for (const slug of SLUGS) {
  const res = await fetch(`https://www.fyndplats.se/blogg/${slug}`);
  const html = await res.text();
  const article = (html.match(/<article class="prose">[\s\S]*?<\/article>/) || [])[0] || "";
  const title = clean((html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/) || [])[1] || "");
  const eyebrow = clean((html.match(/<div class="eyebrow">([\s\S]*?)<\/div>/) || [])[1] || "");
  const lede = clean((html.match(/<p class="pagelede">([\s\S]*?)<\/p>/) || [])[1] || "");
  // cover: next/image encodes the real URL in ?url=
  const imgSrc = (article.match(/<img[^>]*src="([^"]*)"/) || [])[1] || "";
  let cover = "";
  const um = imgSrc.match(/[?&]url=([^&]+)/);
  if (um) cover = decodeURIComponent(um[1]);
  else if (imgSrc.startsWith("http")) cover = imgSrc;

  const rawParas = [...article.matchAll(/<p[^>]*>([\s\S]*?)<\/p>/g)].map((m) => clean(m[1]));
  // Drop the trailing "← Tillbaka till bloggen" link paragraph.
  const body = rawParas.filter((p) => p && !/^←\s*Tillbaka till bloggen$/.test(p));

  out.push({ slug, title, eyebrow, lede, cover, paragraphs: body });
  const totalChars = body.reduce((n, p) => n + p.length, 0);
  console.log(`✓ ${slug} | title="${title.slice(0,40)}" | paras=${body.length} | chars=${totalChars} | longest=${Math.max(...body.map(p=>p.length))}`);
}

const dst = path.join(process.cwd(), "outputs", "live-posts-raw.json");
await fs.writeFile(dst, JSON.stringify(out, null, 2), "utf8");
console.log(`\nWrote ${dst}`);
