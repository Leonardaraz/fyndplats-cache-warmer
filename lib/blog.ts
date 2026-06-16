import { createClient, OAuthStrategy } from "@wix/sdk";
import { posts as wixPosts } from "@wix/blog";
import { getLocalPosts, getLocalPost } from "./local-blog";

// Faller tillbaka på samma publika storefront-klient (samma Wix-site) så bloggen
// kan läsa inlägg utan en separat WIX_CLIENT_ID-env. Saknas blogg-appen/inlägg
// returnerar queryPosts tomt → footern/menyn döljer blogg-länken (se SiteHeader).
const CLIENT_ID = process.env.WIX_CLIENT_ID || "3d8fdd09-3b3c-475f-aac2-b6bfa9e05153";
const wix = CLIENT_ID ? createClient({ modules: { posts: wixPosts }, auth: OAuthStrategy({ clientId: CLIENT_ID }) }) : null;

export type Post = { title: string; slug: string; excerpt: string; date: string; cover: string; alt: string };

/* eslint-disable @typescript-eslint/no-explicit-any */
function wixImageToUrl(u: any): string {
  if (!u) return "";
  if (typeof u === "object") u = u.url || u.image || "";
  if (typeof u !== "string") return "";
  if (u.startsWith("http")) return u;
  const m = u.match(/wix:image:\/\/v1\/([^/#]+)/);
  return m ? `https://static.wixstatic.com/media/${m[1]}` : "";
}

function mapPost(p: any): Post {
  const cover =
    wixImageToUrl(p?.media?.wixMedia?.image) ||
    wixImageToUrl(p?.heroImage) ||
    wixImageToUrl(p?.coverMedia?.image?.url);
  // Wix returnerar firstPublishedDate som ett Date-objekt vid lyckad call —
  // tvinga string så att Sort/fmtDate fungerar oavsett källa.
  const rawDate = p?.firstPublishedDate || p?.lastPublishedDate || "";
  const date = rawDate instanceof Date ? rawDate.toISOString() : String(rawDate);
  return {
    title: p?.title || "",
    slug: p?.slug || "",
    excerpt: p?.excerpt || "",
    date,
    cover,
    alt: p?.media?.altText || p?.title || "",
  };
}

// Modul-cache (samma mönster som getCollections) så header + footer + sitemap
// delar EN hämtning i stället för tre per sidladdning. I dev nollställs cachen
// via Fast Refresh när någon av blog-filerna ändras.
let postsPromise: Promise<Post[]> | null = null;
export function getPosts(): Promise<Post[]> {
  if (!postsPromise) postsPromise = fetchPosts();
  return postsPromise;
}
async function fetchPosts(): Promise<Post[]> {
  // Lokala markdown-inlägg (content/blog/*.md) ligger först och vinner över
  // ev. Wix-inlägg med samma slug. Wix Blog finns kvar för historiskt innehåll
  // när det publiceras via Wix-dashboarden.
  const local = await getLocalPosts();
  const localList: Post[] = local.map((p) => ({
    title: p.title,
    slug: p.slug,
    excerpt: p.excerpt,
    date: p.date,
    cover: p.cover,
    alt: p.alt,
  }));
  const seen = new Set(localList.map((p) => p.slug));
  let wixList: Post[] = [];
  if (wix) {
    try {
      const r: any = await (wix as any).posts.queryPosts().limit(30).find();
      wixList = (r.items || []).map(mapPost).filter((p: Post) => p.slug && !seen.has(p.slug));
    } catch (e) {
      // Cacha tomt även vid fel (t.ex. blogg-appen ej installerad) så vi inte
      // hamrar Wix vid varje render.
      console.error("[wix] getPosts failed:", (e as Error).message);
    }
  }
  const all = [...localList, ...wixList];
  all.sort((a, b) => (b.date || "").localeCompare(a.date || ""));
  return all;
}

export type FullPost = Post & {
  contentText: string;
  contentHtml?: string;     // satt för lokala inlägg
  primaryKeyword?: string;
  category?: string;
  faq?: { q: string; a: string }[];   // satt för lokala inlägg med FAQ-sektion
  products?: { name: string; image: string; url: string }[];   // satt för lokala inlägg med produkt-embeds
};

export async function getPost(slug: string): Promise<FullPost | null> {
  // Lokal markdown vinner. Wix används som fallback för historiska Wix-inlägg.
  const local = await getLocalPost(slug);
  if (local) {
    return {
      title: local.title,
      slug: local.slug,
      excerpt: local.excerpt,
      date: local.date,
      cover: local.cover,
      alt: local.alt,
      contentText: local.contentText,
      contentHtml: local.contentHtml,
      primaryKeyword: local.primaryKeyword,
      category: local.category,
      faq: local.faq,
      products: local.products,
    };
  }
  if (!wix) return null;
  try {
    const r: any = await (wix as any).posts.queryPosts().eq("slug", slug).find();
    const base = r.items?.[0];
    if (!base) return null;
    let contentText = "";
    try {
      const full: any = await (wix as any).posts.getPost(base._id, { fieldsets: ["RICH_CONTENT", "CONTENT_TEXT"] });
      contentText = (full.post || full)?.contentText || "";
    } catch (e) {
      console.error("[wix] getPost full content failed:", (e as Error).message);
    }
    return { ...mapPost(base), contentText: contentText || base.excerpt || "" };
  } catch (e) {
    console.error("[wix] getPost failed:", (e as Error).message);
    return null;
  }
}

export function fmtDate(iso: string): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (isNaN(d.getTime())) return "";
  return d.toLocaleDateString("sv-SE", { day: "numeric", month: "long", year: "numeric" });
}
