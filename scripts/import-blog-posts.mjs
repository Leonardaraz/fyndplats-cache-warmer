// One-shot: copy 10 SEO blog posts from the agent-mode output folder into
// content/blog/, with publish_date set to today (single-batch launch) and
// any stale category-slug links remapped to the actual live slugs on
// fyndplats.se. Idempotent — re-running just overwrites the files.

import { promises as fs } from "node:fs";
import path from "node:path";

const SRC = "C:/Users/leona/AppData/Roaming/Claude/local-agent-mode-sessions/a46acb92-4d63-41fe-9970-42a095b8ea6e/b7a43de4-c7b4-499f-bcb3-3644d398dd8e/local_86463b26-81a9-4746-ab10-8a0d9a683e8c/outputs/blog-posts";
const DST = path.join(process.cwd(), "content", "blog");
const TODAY = "2026-05-30";

// Mappa de slugs som postförfattaren använde till de slugs som faktiskt
// existerar i Fyndplats-katalogen (verifierat mot live /butik).
const CATEGORY_SLUG_REMAP = {
  "hobby-fritid": "sport-fritid",
  "hundtillbehor": "husdjur",
  "klader-accessoarer": "mode-accessoarer",
  "kontor-arbetsplats": "hem-inredning",
  "resor": "friluftsliv-resa",
  "traning": "traning-gym",
  "verktyg": "verktyg-hemmafix",
  // hem-inredning, skonhet-halsa finns redan → ingen remap
};

await fs.mkdir(DST, { recursive: true });

const files = (await fs.readdir(SRC)).filter((f) => /^post-\d+-.*\.md$/.test(f));
files.sort();

for (const file of files) {
  let raw = await fs.readFile(path.join(SRC, file), "utf8");

  // 1. Skriv om publish_date_suggestion → publish_date och sätt till today.
  raw = raw.replace(/^publish_date(_suggestion)?:.*$/m, `publish_date: ${TODAY}`);

  // 2. Remap kategori-slugs i interna länkar.
  for (const [oldSlug, newSlug] of Object.entries(CATEGORY_SLUG_REMAP)) {
    const re = new RegExp(`/kategori/${oldSlug}(?![a-z-])`, "g");
    raw = raw.replace(re, `/kategori/${newSlug}`);
  }

  // 3. Härled filnamnet från slug (ej från källfilens "post-NN-..." prefix).
  const slugMatch = raw.match(/^slug:\s*(.+)$/m);
  if (!slugMatch) {
    console.warn(`! Skipping ${file} — no slug`);
    continue;
  }
  const slug = slugMatch[1].trim().replace(/^["']|["']$/g, "");
  const outFile = path.join(DST, `${slug}.md`);
  await fs.writeFile(outFile, raw, "utf8");
  console.log(`✓ ${file} → content/blog/${slug}.md`);
}

console.log(`\nDone — ${files.length} posts.`);
