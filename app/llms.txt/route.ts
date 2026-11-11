// GET /llms.txt
//
// En kort karta över butiken för språkmodeller och AI-sök (llmstxt.org).
// Innehållet byggs i lib/llms-txt.ts ur menyn, köpguiderna och samma
// villkorskonstanter som sidorna använder.
//
// Menyn läses med sidhuvudsdata(): en kall instans läser den färdiga menyn i
// stället för att vänta in katalogen, så rutten är billig.
import { getPosts } from "@/lib/blog";
import { byggLlmsTxt } from "@/lib/llms-txt";
import { TOTAL_SHORT } from "@/lib/retur-policy";
import { DELIVERY_TIME, EU_STOCK_NOTE, FREE_SHIPPING_OVER_KR, STANDARD_SHIPPING_KR } from "@/lib/shipping";
import { sidhuvudsdata } from "@/lib/sidhuvud-data";
import { SITE } from "@/lib/site-urls";

export const runtime = "nodejs";
export const revalidate = 3600;

export async function GET() {
  const [meny, guider] = await Promise.all([
    sidhuvudsdata().catch(() => ({ tree: [], hasSale: false })),
    getPosts().catch(() => []),
  ]);
  const text = byggLlmsTxt({
    sajt: SITE,
    kategorier: meny.tree.map((k) => ({ name: k.name, slug: k.slug, subs: k.subs.map((x) => ({ name: x.name, slug: x.slug })) })),
    guider: guider.map((g) => ({ title: g.title, slug: g.slug, excerpt: g.excerpt })),
    harRea: meny.hasSale,
    villkor: {
      leveranstid: DELIVERY_TIME,
      friFraktOverKr: FREE_SHIPPING_OVER_KR,
      fraktKr: STANDARD_SHIPPING_KR,
      retur: TOTAL_SHORT,
      euLager: EU_STOCK_NOTE,
    },
  });
  return new Response(text, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "public, max-age=3600, s-maxage=3600, stale-while-revalidate=86400",
    },
  });
}
