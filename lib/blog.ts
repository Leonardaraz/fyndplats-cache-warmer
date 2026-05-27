import { createClient, OAuthStrategy } from "@wix/sdk";
import { posts as wixPosts } from "@wix/blog";

const CLIENT_ID = process.env.WIX_CLIENT_ID || "";
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
  return {
    title: p?.title || "",
    slug: p?.slug || "",
    excerpt: p?.excerpt || "",
    date: p?.firstPublishedDate || p?.lastPublishedDate || "",
    cover,
    alt: p?.media?.altText || p?.title || "",
  };
}

export async function getPosts(): Promise<Post[]> {
  if (!wix) return [];
  try {
    const r: any = await (wix as any).posts.queryPosts().limit(30).find();
    return (r.items || []).map(mapPost);
  } catch (e) {
    console.error("[wix] getPosts failed:", (e as Error).message);
    return [];
  }
}

export async function getPost(slug: string): Promise<(Post & { contentText: string }) | null> {
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
