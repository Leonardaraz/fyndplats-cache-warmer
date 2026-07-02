import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { pageMeta } from "../../../lib/seo";
import { getValidInterestSlugs, resolveInterest } from "../../../lib/seo/programmatic";
import { ProductCard } from "../../../components/productcard";
import { ProgSchemas, ProgHero, ProgFaq, ProgCrossLinks } from "../../../components/programmatic";

export const revalidate = 3600; // 1h ISR (i takt med sitemapen + start/kategori)
// dynamicParams=true: resolvern (samma interestCore-guard som sitemap-listan) är
// ENDA sanningskällan för giltighet. dynamicParams=false frös giltiga slugs vid
// BUILD, medan sitemap.xml regenereras ~varje timme (produkt-fetch revalidate:3600)
// — så en tröskel-slug kunde ligga i sitemap men 404:a tills nästa deploy. On-demand
// + resolverns redirect (tunn → /butik) ger thin-content-skyddet utan build-drift.
export const dynamicParams = true;

export async function generateStaticParams() {
  const slugs = await getValidInterestSlugs();
  return slugs.map((interest) => ({ interest }));
}

export async function generateMetadata({ params }: { params: Promise<{ interest: string }> }): Promise<Metadata> {
  const { interest } = await params;
  const view = await resolveInterest(interest);
  if (!view) return { title: "För dig som" };
  return pageMeta(view.metaTitle, view.metaDescription, view.path, `fds-${interest}`);
}

export default async function ForDigSomPage({ params }: { params: Promise<{ interest: string }> }) {
  const { interest } = await params;
  const view = await resolveInterest(interest);
  // Tunn/tom "för dig som" (t.ex. efter Kina-utfasningen) → /butik i stället för
  // 404. Self-correcting vid nästa ISR-regenerering om intresset blir giltigt igen —
  // därför 307 (redirect), inte 308: tillståndet är uttryckligen temporärt.
  if (!view) redirect("/butik");

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
