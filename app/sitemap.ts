import type { MetadataRoute } from "next";
import { getProductSlugs, getCollections } from "../lib/products";
import { getPosts } from "../lib/blog";

const BASE = "https://www.fyndplats.se";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [slugs, collections, posts] = await Promise.all([getProductSlugs(), getCollections(), getPosts()]);

  const staticPaths = [
    "", "/butik", "/alla-produkter", "/omoss", "/omdomen", "/kundtjanst",
    "/kontaktaoss", "/vanliga-fragor", "/returer", "/kopvillkor", "/sekretesspolicy", "/vara-butikspolicyer",
  ];
  // /blogg är noindex tills det finns inlägg → lista bloggindex i sitemap först då
  // (annars flaggar Search Console "URL i sitemap men noindex").
  if (posts.length > 0) staticPaths.splice(1, 0, "/blogg");
  const staticPages = staticPaths.map((path) => ({
    url: `${BASE}${path}`,
    lastModified: new Date(),
    changeFrequency: (path === "" || path === "/butik" || path === "/alla-produkter" ? "daily" : "monthly") as "daily" | "monthly",
    priority: path === "" ? 1 : 0.7,
  }));

  const categories = collections.map((c) => ({
    url: `${BASE}/kategori/${c.slug}`,
    lastModified: new Date(),
    changeFrequency: "weekly" as const,
    priority: 0.7,
  }));

  const products = slugs.map((slug) => ({
    url: `${BASE}/produkt/${slug}`,
    lastModified: new Date(),
    changeFrequency: "weekly" as const,
    priority: 0.8,
  }));

  const blog = posts.map((p) => ({
    url: `${BASE}/blogg/${p.slug}`,
    lastModified: p.date ? new Date(p.date) : new Date(),
    changeFrequency: "monthly" as const,
    priority: 0.6,
  }));

  return [...staticPages, ...categories, ...products, ...blog];
}
