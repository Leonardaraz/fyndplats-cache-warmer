import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { pageMeta } from "../../../lib/seo";
import { getValidTypeSlugs, resolveBestInTest } from "../../../lib/seo/programmatic";
import { ProgSchemas, ProgHero, ComparisonTable, ProductSection, ProgFaq, ProgCrossLinks } from "../../../components/programmatic";

export const revalidate = 86400; // 24h ISR
export const dynamicParams = false; // bara giltiga typer (>= 3 produkter) renderas

export async function generateStaticParams() {
  const slugs = await getValidTypeSlugs();
  return slugs.map((type) => ({ type }));
}

export async function generateMetadata({ params }: { params: Promise<{ type: string }> }): Promise<Metadata> {
  const { type } = await params;
  const view = await resolveBestInTest(type);
  if (!view) return { title: "Bäst i test" };
  return pageMeta(view.metaTitle, view.metaDescription, view.path);
}

export default async function BastITestPage({ params }: { params: Promise<{ type: string }> }) {
  const { type } = await params;
  const view = await resolveBestInTest(type);
  if (!view) notFound();

  return (
    <>
      <ProgSchemas schemas={view.schemas} />

      <ProgHero
        eyebrow="Bäst i test"
        crumbs={[
          { href: "/", label: "Hem" },
          { href: "/butik", label: "Butik" },
          { label: view.label },
        ]}
        h1={view.h1}
        intro={view.intro}
      />

      <section className="sec" style={{ paddingTop: 36 }}>
        <div className="container">
          <ComparisonTable products={view.products} label={view.label} />

          <div className="prog-prodsecs">
            {view.products.map((p) => (
              <ProductSection key={p.slug} p={p} />
            ))}
          </div>
        </div>
      </section>

      <ProgFaq faqs={view.faqs} />

      <ProgCrossLinks title="Fortsätt utforska" links={view.related} blogLinks={view.blogLinks} />
    </>
  );
}
