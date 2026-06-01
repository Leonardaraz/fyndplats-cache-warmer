import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { pageMeta } from "../../../lib/seo";
import { getValidInterestSlugs, resolveInterest } from "../../../lib/seo/programmatic";
import { ProductCard } from "../../../components/productcard";
import { ProgSchemas, ProgHero, ProgFaq, ProgCrossLinks } from "../../../components/programmatic";

export const revalidate = 86400; // 24h ISR
export const dynamicParams = false; // bara giltiga intressen (>= 4 produkter) renderas

export async function generateStaticParams() {
  const slugs = await getValidInterestSlugs();
  return slugs.map((interest) => ({ interest }));
}

export async function generateMetadata({ params }: { params: Promise<{ interest: string }> }): Promise<Metadata> {
  const { interest } = await params;
  const view = await resolveInterest(interest);
  if (!view) return { title: "För dig som" };
  return pageMeta(view.metaTitle, view.metaDescription, view.path);
}

export default async function ForDigSomPage({ params }: { params: Promise<{ interest: string }> }) {
  const { interest } = await params;
  const view = await resolveInterest(interest);
  if (!view) notFound();

  return (
    <>
      <ProgSchemas schemas={view.schemas} />

      <ProgHero
        eyebrow="Handplockat"
        crumbs={[
          { href: "/", label: "Hem" },
          { href: "/butik", label: "Butik" },
          { label: `För dig som ${view.verb}` },
        ]}
        h1={view.h1}
        intro={view.intro}
      />

      <section className="sec" style={{ paddingTop: 36 }}>
        <div className="container">
          <h2 className="prog-h2">Trendar nu</h2>
          <div className="prodgrid">
            {view.products.map((p) => (
              <ProductCard p={p} key={p.slug} />
            ))}
          </div>
        </div>
      </section>

      <ProgFaq faqs={view.faqs} />

      <ProgCrossLinks title="Mer för dig" links={view.related} blogLinks={view.blogLinks} />
    </>
  );
}
