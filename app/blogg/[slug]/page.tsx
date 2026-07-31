import type { Metadata } from "next";
import { jsonLdString } from "../../../lib/seo";
import Image from "next/image";
import { notFound } from "next/navigation";
import { ContentPage } from "../../../components/content";
import { getPost, fmtDate } from "../../../lib/blog";
import { getLocalPosts } from "../../../lib/local-blog";

// Lokala markdown-inlägg statisk-genereras vid build. Wix-inlägg fallback-renderas
// on-demand (de skapas i Wix-dashboarden, vi kan inte räkna upp dem reliably vid build).
export async function generateStaticParams() {
  const posts = await getLocalPosts();
  return posts.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const p = await getPost(slug);
  if (!p) return { title: "Inlägg" };
  return {
    // seo_title (frontmatter) = kort SERP-titel så " | Fyndplats" ryms under
    // ~60 tecken; synliga rubriken (p.title) förblir orörd på sidan.
    // Layoutens titel-mall lägger på " | Fyndplats". Skriver någon suffixet
    // redan i frontmatterns seo_title blir det "… | Fyndplats | Fyndplats"
    // (inträffade för fyndauktionen-inlägget) → strippa ett avslutande suffix
    // här så mallen förblir enda källan.
    title: (p.seoTitle || p.title).replace(/(\s*\|\s*Fyndplats)+\s*$/i, ""),
    description: p.excerpt || p.title,
    alternates: { canonical: `https://www.fyndplats.se/blogg/${p.slug}` },
    openGraph: {
      type: "article",
      locale: "sv_SE",
      siteName: "Fyndplats",
      url: `https://www.fyndplats.se/blogg/${p.slug}`,
      title: p.title,
      description: p.excerpt || p.title,
      images: p.cover ? [p.cover] : undefined,
    },
  };
}

export default async function Post({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const p = await getPost(slug);
  if (!p) notFound();

  const articleJsonLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: p.title,
    description: p.excerpt || p.title,
    // Fallback = riktig 1200×630-foto (samma som OG-standarden) — en logo-SVG
    // uppfyller inte Googles Article-bildkrav (foto, rätt bildförhållanden).
    image: p.cover || "https://static.wixstatic.com/media/b379ce_0e6a6260c9f243b3afd79cbaf147b67b~mv2.jpg/v1/fill/w_1200,h_630,al_c,q_85/file.jpg",
    author: { "@type": "Organization", name: "Fyndplats" },
    publisher: {
      "@type": "Organization",
      name: "Fyndplats",
      logo: { "@type": "ImageObject", url: "https://www.fyndplats.se/logo.svg" },
    },
    datePublished: p.date || undefined,
    // dateModified rekommenderas av Google; = publiceringsdatum tills inlägget
    // faktiskt uppdateras (ärligt — vi stämplar inte om utan verklig ändring).
    dateModified: p.date || undefined,
    inLanguage: "sv-SE",
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": `https://www.fyndplats.se/blogg/${p.slug}`,
    },
  };

  // FAQPage-schema för inlägg med en "Vanliga frågor"-sektion (lokala markdown-
  // inlägg) → möjliggör FAQ-rich-results i Google.
  const faqJsonLd =
    p.faq && p.faq.length
      ? {
          "@context": "https://schema.org",
          "@type": "FAQPage",
          mainEntity: p.faq.map((f) => ({
            "@type": "Question",
            name: f.q,
            acceptedAnswer: { "@type": "Answer", text: f.a },
          })),
        }
      : null;

  // ItemList-schema för inlägg som listar produkter (produkt-embeds) → list/carousel-
  // signal + förstärkta interna länkar. (Pris/betyg kommer från produktsidornas egna
  // Product/Offer-schema, inte härifrån.)
  const itemListJsonLd =
    p.products && p.products.length
      ? {
          "@context": "https://schema.org",
          "@type": "ItemList",
          itemListElement: p.products.map((pr, i) => ({
            "@type": "ListItem",
            position: i + 1,
            name: pr.name,
            url: pr.url.startsWith("http") ? pr.url : `https://www.fyndplats.se${pr.url}`,
            image: pr.image,
          })),
        }
      : null;

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: jsonLdString(articleJsonLd) }}
      />
      {faqJsonLd && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: jsonLdString(faqJsonLd) }}
        />
      )}
      {itemListJsonLd && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: jsonLdString(itemListJsonLd) }}
        />
      )}
      <ContentPage eyebrow={fmtDate(p.date) || "Blogg"} title={p.title} lead={p.excerpt || undefined}>
        {p.cover && (
          <div style={{ borderRadius: 18, overflow: "hidden", margin: "0 0 28px", border: "1px solid var(--line)" }}>
            <Image src={p.cover} alt={p.alt || p.title} width={1200} height={630} sizes="(max-width:760px) 100vw, 720px" style={{ width: "100%", height: "auto", display: "block" }} />
          </div>
        )}
        {p.contentHtml ? (
          // Lokala markdown-inlägg renderar redan trygg HTML (escaped + whitelistad
          // av vår egen renderer i lib/local-blog.ts). Wix-inlägg går genom paragraf-
          // splitten nedan eftersom Wix bara ger oss platt text.
          <div dangerouslySetInnerHTML={{ __html: p.contentHtml }} />
        ) : (
          (() => {
            const paragraphs = (p.contentText || "").split(/\n{1,}/).map((s) => s.trim()).filter(Boolean);
            return paragraphs.length ? paragraphs.map((para, i) => <p key={i}>{para}</p>) : <p>{p.excerpt}</p>;
          })()
        )}
        <p style={{ marginTop: 28 }}><a href="/blogg">← Tillbaka till bloggen</a></p>
      </ContentPage>
    </>
  );
}
