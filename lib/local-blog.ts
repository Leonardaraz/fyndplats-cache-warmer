import { promises as fs } from "fs";
import path from "path";

export type LocalPost = {
  title: string;
  slug: string;
  excerpt: string;
  date: string;             // ISO datum (YYYY-MM-DD eller full ISO)
  cover: string;            // tom om bild saknas
  alt: string;
  contentHtml: string;      // renderad markdown → HTML
  contentText: string;      // platt fallback för sökindex etc.
  primaryKeyword?: string;
  category?: string;
  faq?: { q: string; a: string }[];   // utvunna ur "## Vanliga frågor" → FAQPage-schema
  products?: { name: string; image: string; url: string }[];   // produkt-embeds → ItemList-schema
};

const CONTENT_DIR = path.join(process.cwd(), "content", "blog");

// Enkel YAML-frontmatter-parser. Vi behöver bara stödja det format våra inlägg
// faktiskt använder (key: value, key: "value", och listor under en key).
// Att dra in js-yaml för 100 rader markdown är overkill.
function parseFrontmatter(raw: string): { data: Record<string, unknown>; body: string } {
  const m = raw.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n([\s\S]*)$/);
  if (!m) return { data: {}, body: raw };
  const [, fm, body] = m;
  const data: Record<string, unknown> = {};
  let currentListKey: string | null = null;
  let currentList: string[] = [];
  for (const line of fm.split(/\r?\n/)) {
    if (!line.trim()) continue;
    const listItem = line.match(/^\s+-\s+(.*)$/);
    if (listItem && currentListKey) {
      currentList.push(stripQuotes(listItem[1].trim()));
      continue;
    }
    if (currentListKey) {
      data[currentListKey] = currentList;
      currentListKey = null;
      currentList = [];
    }
    const kv = line.match(/^([A-Za-z_][A-Za-z0-9_]*):\s*(.*)$/);
    if (!kv) continue;
    const [, key, valRaw] = kv;
    if (valRaw === "") {
      currentListKey = key;
      currentList = [];
      continue;
    }
    data[key] = stripQuotes(valRaw.trim());
  }
  if (currentListKey) data[currentListKey] = currentList;
  return { data, body };
}

function stripQuotes(s: string): string {
  if ((s.startsWith('"') && s.endsWith('"')) || (s.startsWith("'") && s.endsWith("'"))) {
    return s.slice(1, -1);
  }
  return s;
}

// Minimal markdown → HTML. Stödjer: H2/H3, blockquotes, ul/ol, paragrafer,
// **bold**, *italic*, [text](url), --- som separator. Vi droppar H1 eftersom
// titeln redan renderas via ContentPage.
function escapeHtml(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function renderInline(s: string): string {
  let out = escapeHtml(s);
  // Länkar — gör först så att bold/italic inte korrumperar markdown-syntaxen.
  out = out.replace(/\[([^\]]+)\]\(([^)]+)\)/g, (_, text: string, href: string) => {
    const safeHref = href.replace(/"/g, "&quot;");
    return `<a href="${safeHref}">${text}</a>`;
  });
  // Bold före italic (annars äter italic-regeln upp **).
  out = out.replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>");
  out = out.replace(/(^|[^*])\*([^*\n]+)\*/g, "$1<em>$2</em>");
  return out;
}

// Block-level produktbild: standalone-rad med
//   [![alt](image-url)](product-url "valfri caption")
// renderas som <figure> med länkad <img> + valfri caption. Används av blogg-
// inläggen för att länka in produktbilder från Wix CDN.
// Sänk payloaden: råa Wix-original (ofta flera tusen px) levereras annars i full
// upplösning i en 640px-ruta. Lägg på en fill-transform (webp) som matchar CSS:ens
// 1:1 cover-ruta. Icke-wixstatic eller redan transformerade (/v1/) URL:er lämnas orörda.
function wixThumb(url: string): string {
  if (/^https?:\/\/static\.wixstatic\.com\/media\//.test(url) && !url.includes("/v1/")) {
    return url.replace(/\/+$/, "") + "/v1/fill/w_640,h_640,al_c,q_75/img.webp";
  }
  return url;
}

function renderProductImage(line: string): string | null {
  const m = line.match(/^\[!\[([^\]]*)\]\(([^)]+)\)\]\(([^\s)]+)(?:\s+"([^"]*)")?\)$/);
  if (!m) return null;
  const [, alt, src, href, caption] = m;
  const safeAlt = escapeHtml(alt);
  const safeSrc = escapeHtml(wixThumb(src));
  const safeHref = escapeHtml(href);
  const cap = caption ? `<figcaption><a href="${safeHref}">${escapeHtml(caption)}</a></figcaption>` : "";
  return `<figure class="blog-product-img"><a href="${safeHref}"><img src="${safeSrc}" alt="${safeAlt}" loading="lazy" decoding="async" /></a>${cap}</figure>`;
}

function renderMarkdown(md: string): string {
  const lines = md.split(/\r?\n/);
  const out: string[] = [];
  let i = 0;
  let paraBuf: string[] = [];
  let bqBuf: string[] = [];
  let ulBuf: string[] = [];
  let olBuf: string[] = [];

  const flushPara = () => {
    if (paraBuf.length) {
      out.push(`<p>${renderInline(paraBuf.join(" "))}</p>`);
      paraBuf = [];
    }
  };
  const flushBq = () => {
    if (bqBuf.length) {
      out.push(`<blockquote>${bqBuf.map((l) => `<p>${renderInline(l)}</p>`).join("")}</blockquote>`);
      bqBuf = [];
    }
  };
  const flushUl = () => {
    if (ulBuf.length) {
      out.push(`<ul>${ulBuf.map((l) => `<li>${renderInline(l)}</li>`).join("")}</ul>`);
      ulBuf = [];
    }
  };
  const flushOl = () => {
    if (olBuf.length) {
      out.push(`<ol>${olBuf.map((l) => `<li>${renderInline(l)}</li>`).join("")}</ol>`);
      olBuf = [];
    }
  };
  const flushAll = () => {
    flushPara();
    flushBq();
    flushUl();
    flushOl();
  };

  while (i < lines.length) {
    const line = lines[i];
    const trimmed = line.trim();

    if (!trimmed) {
      flushAll();
      i++;
      continue;
    }

    // Hoppa över trailing "JSON-LD" sektion + dess kodblock — vi genererar schema
    // ur frontmatter istället. Allt från en horizontal rule och ner ignoreras
    // eftersom det bara är trailing meta i våra utkast.
    if (/^---\s*$/.test(trimmed)) {
      flushAll();
      break;
    }

    // Produktbild på egen rad: [![alt](img)](href "caption")
    const prodImg = renderProductImage(trimmed);
    if (prodImg) {
      flushAll();
      out.push(prodImg);
      i++;
      continue;
    }

    // H1 droppas — titeln renderas via ContentPage.
    if (/^#\s+/.test(trimmed)) {
      flushAll();
      i++;
      continue;
    }

    const h2 = trimmed.match(/^##\s+(.*)$/);
    if (h2) {
      flushAll();
      out.push(`<h2>${renderInline(h2[1])}</h2>`);
      i++;
      continue;
    }

    const h3 = trimmed.match(/^###\s+(.*)$/);
    if (h3) {
      flushAll();
      out.push(`<h3>${renderInline(h3[1])}</h3>`);
      i++;
      continue;
    }

    const bq = trimmed.match(/^>\s*(.*)$/);
    if (bq) {
      flushPara();
      flushUl();
      flushOl();
      bqBuf.push(bq[1]);
      i++;
      continue;
    } else {
      flushBq();
    }

    const ul = trimmed.match(/^[-*]\s+(.*)$/);
    if (ul) {
      flushPara();
      flushOl();
      ulBuf.push(ul[1]);
      i++;
      continue;
    } else {
      flushUl();
    }

    const ol = trimmed.match(/^\d+\.\s+(.*)$/);
    if (ol) {
      flushPara();
      flushUl();
      olBuf.push(ol[1]);
      i++;
      continue;
    } else {
      flushOl();
    }

    paraBuf.push(trimmed);
    i++;
  }
  flushAll();
  return out.join("\n");
}

// Strippar HTML-taggar för enkel platt text (sökindex etc.).
function stripHtml(html: string): string {
  return html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
}

// Härled excerpt från första riktiga paragrafen om ingen finns i frontmatter.
function deriveExcerpt(md: string): string {
  for (const line of md.split(/\r?\n/)) {
    const t = line.trim();
    if (!t) continue;
    if (/^#/.test(t)) continue;
    if (/^[-*>]/.test(t)) continue;
    return t.replace(/\[([^\]]+)\]\([^)]+\)/g, "$1").slice(0, 240);
  }
  return "";
}

// Plocka FAQ-par ur en "## Vanliga frågor"-sektion (### Fråga → följande stycke)
// för FAQPage-schema. Markdown-länkar/betoning strippas till ren text.
function faqPlain(s: string): string {
  return s
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
    .replace(/\*\*([^*]+)\*\*/g, "$1")
    .replace(/(^|[^*])\*([^*\n]+)\*/g, "$1$2")
    .trim();
}
function extractFaq(md: string): { q: string; a: string }[] {
  const faq: { q: string; a: string }[] = [];
  let inFaq = false;
  let q: string | null = null;
  let aLines: string[] = [];
  const flush = () => {
    if (q && aLines.length) faq.push({ q: faqPlain(q), a: faqPlain(aLines.join(" ")) });
    q = null;
    aLines = [];
  };
  for (const raw of md.split(/\r?\n/)) {
    const t = raw.trim();
    const h2 = t.match(/^##\s+(.*)$/);
    if (h2) {
      flush();
      inFaq = /vanliga frågor/i.test(h2[1]);
      continue;
    }
    if (!inFaq) continue;
    const h3 = t.match(/^###\s+(.*)$/);
    if (h3) {
      flush();
      q = h3[1];
      continue;
    }
    if (q && t) aLines.push(t);
  }
  flush();
  return faq;
}

// Plocka produkt-embeds (alt=namn, bild, href) → ItemList-schema. Samma rad-mönster
// som renderProductImage. Dedupar på url.
function extractProducts(md: string): { name: string; image: string; url: string }[] {
  const out: { name: string; image: string; url: string }[] = [];
  const seen = new Set<string>();
  for (const raw of md.split(/\r?\n/)) {
    const m = raw.trim().match(/^\[!\[([^\]]*)\]\(([^)]+)\)\]\(([^\s)]+)(?:\s+"[^"]*")?\)$/);
    if (!m) continue;
    const [, alt, image, url] = m;
    if (seen.has(url)) continue;
    seen.add(url);
    out.push({ name: alt.trim(), image: image.trim(), url: url.trim() });
  }
  return out;
}

let cache: Promise<LocalPost[]> | null = null;

export function getLocalPosts(): Promise<LocalPost[]> {
  // I dev (NODE_ENV !== "production") läser vi alltid om — annars håller
  // modul-cachen kvar gamla .md-innehåll genom Fast Refresh och vi ser inte
  // ändringar i innehåll/frontmatter förrän servern startas om manuellt.
  if (process.env.NODE_ENV !== "production") return readAllPosts();
  if (!cache) cache = readAllPosts();
  return cache;
}

async function readAllPosts(): Promise<LocalPost[]> {
  let files: string[] = [];
  try {
    files = await fs.readdir(CONTENT_DIR);
  } catch {
    return [];
  }
  const posts: LocalPost[] = [];
  for (const f of files) {
    if (!f.endsWith(".md")) continue;
    const full = path.join(CONTENT_DIR, f);
    let raw: string;
    try {
      raw = await fs.readFile(full, "utf8");
    } catch {
      continue;
    }
    const { data, body } = parseFrontmatter(raw);
    const slug = String(data.slug || f.replace(/\.md$/, ""));
    const title = String(data.title || slug);
    const contentHtml = renderMarkdown(body);
    const contentText = stripHtml(contentHtml);
    const excerpt = String(data.meta_description || deriveExcerpt(body));
    const date = String(data.publish_date || data.publish_date_suggestion || "");
    posts.push({
      title,
      slug,
      excerpt,
      date,
      cover: String(data.cover || ""),
      alt: String(data.alt || title),
      contentHtml,
      contentText,
      primaryKeyword: data.primary_keyword ? String(data.primary_keyword) : undefined,
      category: data.category ? String(data.category) : undefined,
      faq: extractFaq(body),
      products: extractProducts(body),
    });
  }
  posts.sort((a, b) => (b.date || "").localeCompare(a.date || ""));
  return posts;
}

export async function getLocalPost(slug: string): Promise<LocalPost | null> {
  const all = await getLocalPosts();
  return all.find((p) => p.slug === slug) || null;
}
