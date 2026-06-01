// components/programmatic.tsx
// Delade presentations-komponenter för det programmatiska SEO-ramverket
// (Pattern 1–3). All data kommer färdig-löst från lib/seo/programmatic.ts —
// dessa komponenter renderar bara. Återanvänder globala klasser (.container,
// .sec, .eyebrow, .crumbs, .faq, .prodgrid) + .prog-*-klasser i globals.css.
import Image from "next/image";
import type { ResolvedProduct, CrossLink } from "../lib/seo/programmatic";
import { SHIMMER_BLUR } from "../lib/lqip";

export function ProgSchemas({ schemas }: { schemas: object[] }) {
  return (
    <>
      {schemas.map((s, i) => (
        <script key={i} type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(s) }} />
      ))}
    </>
  );
}

export function ProgHero({
  eyebrow,
  crumbs,
  h1,
  intro,
}: {
  eyebrow: string;
  crumbs: { href?: string; label: string }[];
  h1: string;
  intro: string[];
}) {
  return (
    <section className="kat-hero prog-hero">
      <div className="container">
        <nav className="crumbs" aria-label="Brödsmulor">
          {crumbs.map((c, i) => (
            <span key={i}>
              {c.href ? <a href={c.href}>{c.label}</a> : <em>{c.label}</em>}
              {i < crumbs.length - 1 && <span>/</span>}
            </span>
          ))}
        </nav>
        <div className="eyebrow">{eyebrow}</div>
        <h1 className="prog-h1">{h1}</h1>
        <div className="prog-intro">
          {intro.map((para, i) => (
            <p key={i}>{para}</p>
          ))}
        </div>
      </div>
    </section>
  );
}

const ROLE_CLASS: Record<string, string> = {
  "Budget-val": "prog-badge-budget",
  "Mest för pengarna": "prog-badge-value",
  "Premium-val": "prog-badge-premium",
  "Bra köp": "prog-badge-good",
};

export function ComparisonTable({ products, label }: { products: ResolvedProduct[]; label: string }) {
  return (
    <div className="prog-table-wrap">
      <table className="prog-table">
        <caption className="prog-table-caption">Jämförelse: {label}</caption>
        <thead>
          <tr>
            <th scope="col">Produkt</th>
            <th scope="col">Omdöme</th>
            <th scope="col">Pris</th>
            <th scope="col"></th>
          </tr>
        </thead>
        <tbody>
          {products.map((p) => (
            <tr key={p.slug}>
              <th scope="row" className="prog-td-name">
                <a href={`/produkt/${p.slug}`}>
                  {p.img && (
                    <span className="prog-td-thumb">
                      <Image src={p.img} alt={p.name} fill sizes="56px" placeholder="blur" blurDataURL={SHIMMER_BLUR} style={{ objectFit: "cover" }} />
                    </span>
                  )}
                  <span>{p.name}</span>
                </a>
              </th>
              <td>
                <span className={`prog-badge ${ROLE_CLASS[p.role] || "prog-badge-good"}`}>{p.role}</span>
              </td>
              <td className="prog-td-price">{p.hasRange ? `Från ${p.priceFrom}` : p.price}</td>
              <td className="prog-td-cta">
                <a className="btn btn-primary prog-buy" href={`/produkt/${p.slug}`}>Köp</a>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function ProductSection({ p }: { p: ResolvedProduct }) {
  return (
    <article className="prog-prodsec">
      <a className="prog-prodsec-img" href={`/produkt/${p.slug}`} aria-label={p.name}>
        {p.img && (
          <Image src={p.img} alt={p.name} fill sizes="(max-width:760px) 100vw, 280px" placeholder="blur" blurDataURL={SHIMMER_BLUR} style={{ objectFit: "cover" }} />
        )}
        <span className={`prog-badge ${ROLE_CLASS[p.role] || "prog-badge-good"}`}>{p.role}</span>
      </a>
      <div className="prog-prodsec-body">
        <h3>
          <a href={`/produkt/${p.slug}`}>{p.name}</a>
        </h3>
        <p>{p.paragraph}</p>
        <div className="prog-prodsec-foot">
          <span className="pprice-now">{p.hasRange ? `Från ${p.priceFrom}` : p.price}</span>
          <a className="btn btn-primary prog-buy" href={`/produkt/${p.slug}`}>Köp nu</a>
        </div>
      </div>
    </article>
  );
}

export function ProgFaq({ faqs }: { faqs: { q: string; a: string }[] }) {
  return (
    <section className="sec prog-faq-sec">
      <div className="container container-narrow">
        <h2 className="prog-h2">Vanliga frågor</h2>
        <div className="faq">
          {faqs.map((f, i) => (
            <details key={i} {...(i === 0 ? { open: true } : {})}>
              <summary>{f.q}</summary>
              <div className="ans">{f.a}</div>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}

export function ProgCrossLinks({ title, links, blogLinks }: { title: string; links: CrossLink[]; blogLinks?: CrossLink[] }) {
  if (links.length === 0 && (!blogLinks || blogLinks.length === 0)) return null;
  return (
    <section className="sec prog-links-sec">
      <div className="container">
        <h2 className="prog-h2">{title}</h2>
        <div className="prog-links">
          {links.map((l, i) => (
            <a key={`l${i}`} className="prog-link-chip" href={l.href}>
              {l.label}
            </a>
          ))}
        </div>
        {blogLinks && blogLinks.length > 0 && (
          <div className="prog-bloglinks">
            <span className="prog-bloglinks-label">Läs mer på bloggen:</span>
            {blogLinks.map((l, i) => (
              <a key={`b${i}`} href={l.href}>
                {l.label}
              </a>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
