// Pre-deploy sanity: render each new post through the SAME logic as
// lib/local-blog.ts and count the <h2>/<ul> the live site will emit.
import { promises as fs } from "node:fs";
import path from "node:path";

// import the real renderer via dynamic import with type-stripping
const mod = await import("../lib/local-blog.ts").catch(async () => {
  // fallback: minimal inline copy of the heading/list rules if TS import fails
  return null;
});

const SLUGS = [
  "valkommen-till-fyndplats","barbar-projektor-kopguide-2026","husdjursguide-hund-och-katt",
  "leksaker-till-barn-guide","bladlos-nackflakt-kopguide-2026","massagepistol-kopguide-2026",
  "stjarnprojektor-kopguide-2026",
];

if (mod?.getLocalPost) {
  for (const slug of SLUGS) {
    const post = await mod.getLocalPost(slug);
    if (!post) { console.log(`! ${slug}: not found by getLocalPost`); continue; }
    const html = post.contentHtml || "";
    const h2 = (html.match(/<h2>/g) || []).length;
    const h3 = (html.match(/<h3>/g) || []).length;
    const ul = (html.match(/<ul>/g) || []).length;
    const li = (html.match(/<li>/g) || []).length;
    const pc = (html.match(/<p>/g) || []).length;
    console.log(`✓ ${slug}: h2=${h2} h3=${h3} ul=${ul} li=${li} p=${pc}`);
  }
} else {
  console.log("could not import lib/local-blog.ts — falling back to raw ## count");
  for (const slug of SLUGS) {
    const raw = await fs.readFile(path.join(process.cwd(), "content", "blog", `${slug}.md`), "utf8");
    const h2 = (raw.match(/^## /gm) || []).length;
    console.log(`~ ${slug}: '## ' markers = ${h2}`);
  }
}
