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
import { redirect } from "next/navigation";
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
  const meta = pageMeta(view.metaTitle, view.metaDescription, view.path, `under-${price}-${category}`);
  // Pristrapporna är nästlade delmängder ("under 200" ⊂ "under 500" ⊂ "under
  // 1000") — sitemapen listar bara den HÖGSTA giltiga trappan per kategori (se
  // getProgrammaticUrls). Lägre trappor renderar fortfarande via interna länkar,
  // men kanonaliserar till supersetet så länkkraften samlas på EN sida i stället
  // för att splittras över nära-identiska doorway-varianter.
  const params = await getValidPriceTierParams();
  const highest = Math.max(price, ...params.filter((p) => p.categorySlug === category).map((p) => p.price));
  if (highest > price) {
    const canonical = `https://www.fyndplats.se/under-${highest}-kr/${category}`;
    meta.alternates = { canonical };
    if (meta.openGraph) meta.openGraph.url = canonical;
  }
  return meta;
}

export async function PriceTierPage({ price, category }: { price: number; category: string }) {
  const view = await resolvePriceTier(price, category);
  // Tunn/tom pris-tier (t.ex. tömd efter Kina-utfasningen) → redirect till
  // kategorin i stället för 404. Kategorin lever (eller redirectar i sin tur).
  // Self-correcting: blir tiern giltig igen (nya EU-produkter) renderas den vid
  // nästa ISR-regenerering — därför 307 (temporär), inte 308/301: en permanent
  // redirect lär Google att URL:en är borta för gott, vilket motsäger designen.
  if (!view) redirect(`/kategori/${category}`);

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
