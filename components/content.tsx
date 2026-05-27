import { SiteHeader, SiteFooter } from "./site";

export function ContentPage({
  eyebrow,
  title,
  lead,
  children,
}: {
  eyebrow?: string;
  title: string;
  lead?: string;
  children: React.ReactNode;
}) {
  return (
    <>
      <SiteHeader />
      <div className="pagehero">
        <div className="container">
          {eyebrow && <div className="eyebrow">{eyebrow}</div>}
          <h1>{title}</h1>
          {lead && <p className="pagelede">{lead}</p>}
        </div>
      </div>
      <article className="prose">
        <div className="container-narrow">{children}</div>
      </article>
      <SiteFooter />
    </>
  );
}
