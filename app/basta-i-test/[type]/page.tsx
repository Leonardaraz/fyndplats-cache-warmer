import type { Metadata } from "next";
import { permanentRedirect } from "next/navigation";
import { pageMeta } from "../../../lib/seo";
import { getValidTypeSlugs, resolveBestInTest } from "../../../lib/seo/programmatic";
import { ProgSchemas, ProgHero, ComparisonTable, ProductSection, ProgFaq, ProgCrossLinks } from "../../../components/programmatic";

export const revalidate = 3600; // 1h ISR (i takt med sitemapen + start/kategori)
// dynamicParams=true: resolvern (samma typeCore-guard som sitemap-listan) är ENDA
// sanningskällan för giltighet. dynamicParams=false frös giltiga slugs vid BUILD,
// medan sitemap.xml regenereras ~varje timme (produkt-fetch revalidate:3600) — så
// en tröskel-slug kunde ligga i sitemap men 404:a tills nästa deploy. On-demand +
// resolverns redirect (tunn → /butik) ger thin-content-skyddet utan build-drift.
export const dynamicParams = true;

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
  // Tunn/tom "bäst i test" (t.ex. efter Kina-utfasningen) → /butik i stället för
  // 404. Self-correcting vid nästa ISR-regenerering om typen blir giltig igen.
  if (!view) permanentRedirect("/butik");

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
