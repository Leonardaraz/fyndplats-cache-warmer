import type { MetadataRoute } from "next";
import { getProductSlugs, getCollections } from "../lib/products";
import { getPosts } from "../lib/blog";

const BASE = "https://www.fyndplats.se";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [slugs, collections, posts] = await Promise.all([getProductSlugs(), getCollections(), getPosts()]);

  const staticPages = [
    "", "/butik", "/blogg", "/omoss", "/omdomen", "/kundtjanst",
    "/kontaktaoss", "/vanliga-fragor", "/returer", "/kopvillkor", "/sekretesspolicy", "/vara-butikspolicyer",
  ].map((path) => ({
    url: `${BASE}${path}`,
    lastModified: new Date(),
    changeFrequency: (path === "" || path === "/butik" ? "daily" : "monthly") as "daily" | "monthly",
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
