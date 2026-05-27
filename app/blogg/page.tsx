import Image from "next/image";
import { getPosts, fmtDate } from "../../lib/blog";
import { pageMeta } from "../../lib/seo";

export const metadata = pageMeta(
  "Blogg",
  "Tips, guider och nyheter från Fyndplats – inspiration för dina nästa fynd.",
  "/blogg"
);

export default async function Blogg() {
  const posts = await getPosts();
  return (
    <>
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
                    {p.cover && <Image src={p.cover} alt={p.title} fill sizes="(max-width:540px) 100vw, (max-width:900px) 50vw, 25vw" style={{ objectFit: "cover" }} />}
                  </div>
                  <div className="pbody">
                    {p.date && <div style={{ fontSize: 12, color: "var(--soft)", marginBottom: 6 }}>{fmtDate(p.date)}</div>}
                    <div className="pname" style={{ minHeight: 0 }}>{p.title}</div>
                    {p.excerpt && <p style={{ fontSize: 13.5, color: "var(--soft)", marginTop: 8, lineHeight: 1.5 }}>{p.excerpt.slice(0, 120)}</p>}
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
