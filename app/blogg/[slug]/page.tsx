import type { Metadata } from "next";
import Image from "next/image";
import { notFound } from "next/navigation";
import { ContentPage } from "../../../components/content";
import { getPost, fmtDate } from "../../../lib/blog";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const p = await getPost(slug);
  if (!p) return { title: "Inlägg" };
  return {
    title: p.title,
    description: p.excerpt || p.title,
    alternates: { canonical: `https://www.fyndplats.se/blogg/${p.slug}` },
  };
}

export default async function Post({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const p = await getPost(slug);
  if (!p) notFound();
  const paragraphs = (p.contentText || "").split(/\n{1,}/).map((s) => s.trim()).filter(Boolean);

  return (
    <ContentPage eyebrow={fmtDate(p.date) || "Blogg"} title={p.title} lead={p.excerpt || undefined}>
      {p.cover && (
        <div style={{ borderRadius: 18, overflow: "hidden", margin: "0 0 28px", border: "1px solid var(--line)" }}>
          <Image src={p.cover} alt={p.title} width={1200} height={630} sizes="(max-width:760px) 100vw, 720px" style={{ width: "100%", height: "auto", display: "block" }} />
        </div>
      )}
      {paragraphs.length ? paragraphs.map((para, i) => <p key={i}>{para}</p>) : <p>{p.excerpt}</p>}
      <p style={{ marginTop: 28 }}><a href="/blogg">← Tillbaka till bloggen</a></p>
    </ContentPage>
  );
}
