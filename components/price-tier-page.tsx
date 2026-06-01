// components/price-tier-page.tsx
// Delad renderare för Pattern 2 — /under-{200,500,1000}-kr/{kategori}.
//
// Next.js App Router stödjer INTE partiella dynamiska segment ("under-[price]-kr"
// är ett ogiltigt mappnamn — ett dynamiskt segment måste utgöra HELA mappnamnet).
// Att istället göra prisnivån till ett dynamiskt rot-segment ([pris]/[kategori])
// skulle bli en girig catch-all som fångar varje 2-segments-URL på sajten. Därför
// är de tre prisnivåerna tre LITERALA mappar (under-200-kr/, under-500-kr/,
// under-1000-kr/) som alla delegerar hit. Vill man lägga till en nivå: skapa en
// mapp till + lägg priset i PRICE_TIERS.
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { pageMeta } from "../lib/seo";
import { getValidPriceTierParams, resolvePriceTier } from "../lib/seo/programmatic";
import { ProductCard } from "./productcard";
import { ProgSchemas, ProgHero, ProgCrossLinks } from "./programmatic";

export async function priceTierStaticParams(price: number): Promise<{ category: string }[]> {
  const params = await getValidPriceTierParams();
  return params.filter((p) => p.price === price).map((p) => ({ category: p.categorySlug }));
}

export async function priceTierMetadata(price: number, category: string): Promise<Metadata> {
  const view = await resolvePriceTier(price, category);
  if (!view) return { title: `Under ${price} kr` };
  return pageMeta(view.metaTitle, view.metaDescription, view.path);
}

export async function PriceTierPage({ price, category }: { price: number; category: string }) {
  const view = await resolvePriceTier(price, category);
  if (!view) notFound();

  return (
    <>
      <ProgSchemas schemas={view.schemas} />

      <ProgHero
        eyebrow={`Fynd under ${price} kr`}
        crumbs={[
          { href: "/", label: "Hem" },
          { href: `/kategori/${view.categorySlug}`, label: view.categoryName },
          { label: `Under ${price} kr` },
        ]}
        h1={view.h1}
        intro={view.intro}
      />

      <section className="sec" style={{ paddingTop: 36 }}>
        <div className="container">
          <div className="prodgrid">
            {view.products.map((p) => (
              <ProductCard p={p} key={p.slug} />
            ))}
          </div>
        </div>
      </section>

      <ProgCrossLinks title="Fortsätt fynda" links={view.related} />
    </>
  );
}
