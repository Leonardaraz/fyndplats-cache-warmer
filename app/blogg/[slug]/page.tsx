import type { Metadata } from "next";
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
    title: p.title,
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
    image: p.cover || "https://www.fyndplats.se/logo.svg",
    author: { "@type": "Organization", name: "Fyndplats" },
    publisher: {
      "@type": "Organization",
      name: "Fyndplats",
      logo: { "@type": "ImageObject", url: "https://www.fyndplats.se/logo.svg" },
    },
    datePublished: p.date || undefined,
    inLanguage: "sv-SE",
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": `https://www.fyndplats.se/blogg/${p.slug}`,
    },
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(articleJsonLd) }}
      />
      <ContentPage eyebrow={fmtDate(p.date) || "Blogg"} title={p.title} lead={p.excerpt || undefined}>
        {p.cover && (
          <div style={{ borderRadius: 18, overflow: "hidden", margin: "0 0 28px", border: "1px solid var(--line)" }}>
            <Image src={p.cover} alt={p.title} width={1200} height={630} sizes="(max-width:760px) 100vw, 720px" style={{ width: "100%", height: "auto", display: "block" }} />
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
