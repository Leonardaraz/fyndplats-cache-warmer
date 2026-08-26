import type { Metadata } from "next";
import Image from "next/image";
import { getPosts, fmtDate } from "../../lib/blog";
import { pageMeta, jsonLdString } from "../../lib/seo";

export async function generateMetadata(): Promise<Metadata> {
  const meta = pageMeta(
    "Blogg",
    "Tips, guider och nyheter från Fyndplats – inspiration för dina nästa fynd.",
    "/blogg",
    "bde2fbb141b9fd62"
  );
  // Undvik thin-content-flaggning: noindex så länge inga inlägg finns.
  // Auto-läker — sidan indexeras igen så snart första inlägget publiceras.
  const posts = await getPosts();
  if (posts.length === 0) meta.robots = { index: false, follow: true };
  return meta;
}

export default async function Blogg() {
  const posts = await getPosts();

  // JSON-LD för blogg-index. Två block:
  //   1. BreadcrumbList — samma mönster som /butik, /alla-produkter, /kategori/[slug].
  //      Innan denna commit var /blogg enda top-level-navnoden UTAN breadcrumb, vilket
  //      hindrade Google från att rita rich-result-brödsmulor i SERP:en (audit 2026-08-21).
  //   2. Blog + blogPost[] — schema.org/Blog signalerar att sidan ÄR en blogg (inte bara
  //      en produktkategori som råkar länka till artiklar). Ger möjlighet till rich results
  //      för publiceringsdatum, författare, och kan trigga Discover-ytor i mobilsök.
  const breadcrumbLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Hem", item: "https://www.fyndplats.se/" },
      { "@type": "ListItem", position: 2, name: "Blogg", item: "https://www.fyndplats.se/blogg" },
    ],
  };
  const blogLd = {
    "@context": "https://schema.org",
    "@type": "Blog",
    "@id": "https://www.fyndplats.se/blogg#blog",
    name: "Fyndplats Blogg",
    url: "https://www.fyndplats.se/blogg",
    description: "Tips, guider och nyheter från Fyndplats.",
    publisher: { "@id": "https://www.fyndplats.se/#organization" },
    inLanguage: "sv-SE",
    blogPost: posts.slice(0, 20).map((p) => ({
      "@type": "BlogPosting",
      headline: p.title,
      url: `https://www.fyndplats.se/blogg/${p.slug}`,
      ...(p.date && { datePublished: p.date }),
      ...(p.excerpt && { description: p.excerpt.slice(0, 200) }),
      ...(p.cover && { image: p.cover }),
    })),
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLdString(breadcrumbLd) }} />
      {posts.length > 0 && (
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLdString(blogLd) }} />
      )}
      <section className="sec">
        <div className="container">
          <div className="sechead">
            <div className="eyebrow">Blogg</div>
            <h1>Tips, guider &amp; nyheter</h1>
            <p>Inspiration för dina nästa fynd.</p>
          </div>

          {posts.length === 0 ? (
            <p className="empty" style={{ textAlign: "center", color: "var(--soft)" }}>
              Inga blogginlägg publicerade än – håll utkik, vi fyller på snart!
            </p>
          ) : (
            <div className="prodgrid">
              {posts.map((p) => (
                <a className="prod" key={p.slug} href={`/blogg/${p.slug}`}>
                  <div className="pimg" style={p.cover ? undefined : { background: "linear-gradient(135deg,#FFB078,#F47A35)" }}>
                    {p.cover && <Image src={p.cover} alt={p.alt || p.title} fill sizes="(max-width:540px) 100vw, (max-width:900px) 50vw, 25vw" style={{ objectFit: "cover" }} />}
                  </div>
                  <div className="pbody">
                    {p.date && <div style={{ fontSize: 12, color: "var(--soft)", marginBottom: 6 }}>{fmtDate(p.date)}</div>}
                    <div className="pname" style={{ minHeight: 0 }}>{p.title}</div>
                    {p.excerpt && <p style={{ fontSize: 14, color: "var(--soft)", marginTop: 8, lineHeight: 1.5 }}>{p.excerpt.slice(0, 120)}</p>}
                  </div>
                </a>
              ))}
            </div>
          )}
        </div>
      </section>
    </>
  );
}
