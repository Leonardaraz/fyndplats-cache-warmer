#!/usr/bin/env node
// Injects product images into the 10 published blog posts:
//  - adds `cover:` (and `cover_alt:`) to frontmatter pointing at the hero image
//  - inserts 3 linked product images at fixed positions after H2 sections
//
// Reads pick-map from scripts/blog-image-map.json and rewrites content/blog/*.md
// in place. Idempotent: removes prior injected `cover:` / inline product-img
// blocks before inserting fresh ones, so re-running just refreshes.

import { readFile, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");
const CONTENT_DIR = join(ROOT, "content/blog");

// Wix CDN transform: <base>.<ext>/v1/fit/w_N,h_N,q_Q/file.<ext>
function wixCdn(url, w, q = 85) {
  if (!url) return "";
  const m = url.match(/^(.+\.(jpg|jpeg|png|webp))$/i);
  if (!m) return url;
  const ext = m[2];
  return `${m[1]}/v1/fit/w_${w},h_${w},q_${q}/file.${ext}`;
}

function mdImg(pick, caption = "Se i butiken →") {
  const src = wixCdn(pick.image, 1200);
  const alt = pick.alt.replace(/"/g, "'");
  // Format: [![alt](src)](href "caption") — see lib/local-blog.ts renderProductImage.
  return `[![${alt}](${src})](${pick.url} "${caption}")`;
}

// Hand-tuned placements: which H2 occurrences should be followed by which body
// image. Indexed by post slug. 0 = first body image, 1 = second, 2 = third.
// If a post has fewer H2s than requested, trailing images are appended at end.
const PLACEMENTS = {
  "aktivera-hunden-inomhus": [
    { afterH2Index: 0, bodyImg: 0 }, // after "Snuffelmatta"
    { afterH2Index: 3, bodyImg: 1 }, // after "Lekar med boll"
    { afterH2Index: 7, bodyImg: 2 }, // after "Tugga något stort"
  ],
  "smarta-forvaringslosningar-sma-lagenheter": [
    { afterH2Index: 0, bodyImg: 0 },
    { afterH2Index: 2, bodyImg: 1 },
    { afterH2Index: 4, bodyImg: 2 },
  ],
  "trana-hemma-utan-utrustning": [
    { afterH2Index: 0, bodyImg: 0 },
    { afterH2Index: 2, bodyImg: 1 },
    { afterH2Index: 4, bodyImg: 2 },
  ],
  "hemmakontor-tips": [
    { afterH2Index: 0, bodyImg: 0 },
    { afterH2Index: 2, bodyImg: 1 },
    { afterH2Index: 4, bodyImg: 2 },
  ],
  "mysig-hostinredning": [
    { afterH2Index: 0, bodyImg: 0 },
    { afterH2Index: 2, bodyImg: 1 },
    { afterH2Index: 4, bodyImg: 2 },
  ],
  "skonhetsrutin-torr-hud": [
    { afterH2Index: 0, bodyImg: 0 },
    { afterH2Index: 2, bodyImg: 1 },
    { afterH2Index: 4, bodyImg: 2 },
  ],
  "packlista-helgresa": [
    { afterH2Index: 0, bodyImg: 0 },
    { afterH2Index: 2, bodyImg: 1 },
    { afterH2Index: 4, bodyImg: 2 },
  ],
  "hobby-for-vuxna": [
    { afterH2Index: 0, bodyImg: 0 },
    { afterH2Index: 2, bodyImg: 1 },
    { afterH2Index: 4, bodyImg: 2 },
  ],
  "verktyg-for-nyborjare": [
    { afterH2Index: 0, bodyImg: 0 },
    { afterH2Index: 2, bodyImg: 1 },
    { afterH2Index: 4, bodyImg: 2 },
  ],
  "presenter-till-hundalskaren": [
    { afterH2Index: 0, bodyImg: 0 },
    { afterH2Index: 2, bodyImg: 1 },
    { afterH2Index: 4, bodyImg: 2 },
  ],
};

function splitFrontmatter(raw) {
  const m = raw.match(/^(---\r?\n[\s\S]*?\r?\n---\r?\n)([\s\S]*)$/);
  if (!m) return { fm: "", body: raw };
  return { fm: m[1], body: m[2] };
}

function stripPriorInjections(fm, body) {
  // Drop any prior `cover:` / `cover_alt:` lines we may have written before.
  const cleanedFm = fm
    .replace(/^cover:.*$\r?\n?/m, "")
    .replace(/^cover_alt:.*$\r?\n?/m, "");
  // Strip prior injected product-image blocks. Marker: lines starting with [![ that
  // wrap a Wix CDN URL — we only ever insert those via this script.
  const cleanedBody = body
    .split(/\r?\n/)
    .filter((l) => !/^\[!\[[^\]]*\]\(https:\/\/static\.wixstatic\.com[^)]+\)\]\(\/produkt\//.test(l.trim()))
    .join("\n");
  // Collapse 3+ consecutive blank lines down to 2.
  return { fm: cleanedFm, body: cleanedBody.replace(/\n{3,}/g, "\n\n") };
}

function injectCover(fm, pick) {
  if (!pick) return fm;
  const heroUrl = wixCdn(pick.image, 1600);
  // Insert before closing `---`.
  const lines = fm.split(/\r?\n/);
  // Find last `---` line (closing delimiter).
  let closeIdx = -1;
  for (let i = lines.length - 1; i >= 0; i--) {
    if (lines[i].trim() === "---") { closeIdx = i; break; }
  }
  if (closeIdx === -1) return fm;
  const insertAt = closeIdx;
  lines.splice(
    insertAt,
    0,
    `cover: ${heroUrl}`,
    `cover_alt: ${pick.alt.replace(/"/g, "'")}`,
  );
  return lines.join("\n");
}

function injectBodyImages(body, picks, plan) {
  if (!picks?.length || !plan?.length) return body;
  const lines = body.split(/\r?\n/);
  // Collect all H2 line indices.
  const h2Lines = [];
  for (let i = 0; i < lines.length; i++) {
    if (/^##\s+/.test(lines[i])) h2Lines.push(i);
  }
  // Sort plan by afterH2Index descending so insertions don't shift later indices.
  const sortedPlan = [...plan].sort((a, b) => b.afterH2Index - a.afterH2Index);
  const used = new Set();
  for (const step of sortedPlan) {
    if (used.has(step.bodyImg)) continue;
    const pick = picks[step.bodyImg];
    if (!pick) continue;
    used.add(step.bodyImg);

    const h2Idx = h2Lines[step.afterH2Index];
    if (h2Idx === undefined) continue;

    // Find the end of the H2's paragraph block: scan forward until next H2/H3
    // or `---`, then back up to the last non-blank line. Insert image AFTER
    // the last paragraph of this section, BEFORE the next heading/divider.
    let insertAt = lines.length;
    for (let j = h2Idx + 1; j < lines.length; j++) {
      if (/^(##\s+|---\s*$)/.test(lines[j].trim())) { insertAt = j; break; }
    }
    // Back up over trailing blank lines.
    while (insertAt > h2Idx + 1 && lines[insertAt - 1].trim() === "") insertAt--;

    const block = ["", mdImg(pick), ""];
    lines.splice(insertAt, 0, ...block);
  }
  return lines.join("\n");
}

async function processPost(slug, map) {
  const file = join(CONTENT_DIR, `${slug}.md`);
  const raw = await readFile(file, "utf8");
  const { fm: fmRaw, body: bodyRaw } = splitFrontmatter(raw);
  if (!fmRaw) {
    console.warn(`! ${slug}: no frontmatter, skipping`);
    return null;
  }
  const { fm: fmClean, body: bodyClean } = stripPriorInjections(fmRaw, bodyRaw);
  const entry = map[slug];
  if (!entry) {
    console.warn(`! ${slug}: no entry in map, skipping`);
    return null;
  }
  const fm = injectCover(fmClean, entry.hero);
  const body = injectBodyImages(bodyClean, entry.body, PLACEMENTS[slug] || []);
  const out = fm + body;
  await writeFile(file, out);
  return {
    slug,
    hero: entry.hero?.url,
    body: entry.body.map((b) => b.url),
  };
}

async function main() {
  const mapRaw = await readFile(join(ROOT, "scripts/blog-image-map.json"), "utf8");
  const map = JSON.parse(mapRaw);
  const summary = [];
  for (const slug of Object.keys(PLACEMENTS)) {
    const r = await processPost(slug, map);
    if (r) summary.push(r);
  }
  console.log("\n--- summary ---");
  for (const s of summary) {
    console.log(`${s.slug}`);
    console.log(`  hero: ${s.hero}`);
    for (const u of s.body) console.log(`  body: ${u}`);
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
