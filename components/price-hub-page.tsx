// components/price-hub-page.tsx
// Delad renderare för Pattern 2b: översikten /under-{200,500,1000}-kr.
//
// Genvägarna på /butik pekade på /under-500-kr och /under-1000-kr innan sidorna
// fanns, och båda gav 404 (Leonard 2026-11-13). Datat och giltigheten kommer ur
// lib/seo/programmatic.ts (hubCore), samma källa som sitemapen.
//
// Utseendet är nya /butiks (app/butik/butik.css under .butik2, som sidorna
// importerar): hjälte med faktarad och genvägar, varor utan ram, kategorierna
// som ett register per avdelning och löftena längst ner. Leonard 2026-11-13:
// "Kolla att dessa sidor också har premium utseende innan de mergas". Under
// 1 000 kr har 87 kategorier, och som lösa knappar blev det en vägg.
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { pageMeta } from "../lib/seo";
import { prisText, resolvePriceHub } from "../lib/seo/programmatic";
import { tusental, productCountLabel, categoryCountLabel, kategoriOrd, avdelningOrd } from "../lib/rating";
import { FREE_SHIPPING_OVER_KR, STANDARD_SHIPPING_KR } from "../lib/shipping";
import { ProductCard } from "./productcard";
import { PrefetchLink } from "./prefetch-link";
import { attachRatings } from "../lib/review-aggregates";
import { ProgSchemas } from "./programmatic";

export async function priceHubMetadata(price: number): Promise<Metadata> {
  const view = await resolvePriceHub(price);
  const pris = prisText(price);
  if (!view) return { title: `Fynd under ${pris}` };
  const iKategorier = view.kategorier.length > 0 ? ` i ${categoryCountLabel(view.kategorier.length)}` : "";
  const beskrivning = `${productCountLabel(view.antal)} för högst ${pris}${iKategorier}. Fri frakt över ${FREE_SHIPPING_OVER_KR} kr och 30 dagars öppet köp hos Fyndplats.`;
  return pageMeta(`Fynd under ${pris}`, beskrivning, view.path, `under-${price}`);
}

export async function PriceHubPage({ price }: { price: number }) {
  const view = await resolvePriceHub(price);
  if (!view) notFound();

  const pris = prisText(price);
  const produkter = await attachRatings(view.products);
  const avdelningar = view.grupper.length;
  const antalKategorier = view.kategorier.length;
  // De andra gränserna först (bara de som finns), sedan samma vägar som /butik.
  const genvagar = [
    ...view.andraGranser,
    { href: "/rea", label: "Rea" },
    { href: "/fyndauktion", label: "Fyndauktionen" },
    { href: "/butik", label: "Alla avdelningar" },
  ];

  return (
    <div className="butik2 pris2">
      <ProgSchemas schemas={view.schemas} />

      <section className="b2-hjalte">
        <div className="container">
          <nav className="butik-crumbs" aria-label="Brödsmulor">
            <Link href="/">Hem</Link>
            <span aria-hidden="true">/</span>
            <em>Fynd under {pris}</em>
          </nav>
          <div className="b2-hjalte-rad">
            <div className="b2-hjalte-text">
              <div className="eyebrow">Fynd efter pris</div>
              <h1>Fynd under {pris}</h1>
              <p className="b2-ingress">{view.intro[0]}</p>
            </div>
            {avdelningar > 0 && (
              <a className="btn btn-primary b2-cta" href="#kategorier">
                Välj kategori <span aria-hidden="true">↓</span>
              </a>
            )}
          </div>
          <div className="b2-hjalte-fot">
            <ul className="b2-fakta" aria-label="Fynden i siffror">
              <li><span className="b2-tal">{tusental(view.antal)}</span><span className="b2-etikett">produkter i lager</span></li>
              {avdelningar > 0 && (
                <li><span className="b2-tal">{avdelningar}</span><span className="b2-etikett">{avdelningOrd(avdelningar)}</span></li>
              )}
              {antalKategorier > 0 && (
                <li><span className="b2-tal">{tusental(antalKategorier)}</span><span className="b2-etikett">{kategoriOrd(antalKategorier)}</span></li>
              )}
            </ul>
            <nav className="b2-genvagar" aria-label="Fler sätt att fynda">
              {genvagar.map((l) => (
                <a key={l.href} href={l.href}>{l.label}</a>
              ))}
            </nav>
          </div>
        </div>
      </section>

      <section className="sec p2-urval">
        <div className="container">
          <div className="h2rad">
            <div>
              <div className="eyebrow">Urval ur sortimentet</div>
              <h2>Utvalda fynd</h2>
            </div>
            <PrefetchLink className="h2lank" href="/alla-produkter">Hela sortimentet <span aria-hidden="true">→</span></PrefetchLink>
          </div>
          <div className="prodgrid listgrid">
            {produkter.map((p) => (
              <ProductCard p={p} key={p.slug} tvaKolumner />
            ))}
          </div>
        </div>
      </section>

      {avdelningar > 0 && (
        <section className="sec b2-registersek" id="kategorier">
          <div className="container">
            <div className="h2rad">
              <div>
                <div className="eyebrow">{categoryCountLabel(antalKategorier)}</div>
                <h2>Fynd under {pris} per kategori</h2>
              </div>
            </div>
            {/* Registret som på /butik: en grupp per avdelning. Rubriken länkar när
                avdelningen själv har en prissida för gränsen. */}
            <div className="b2-register">
              {view.grupper.map((g) => (
                <div className="b2-grupp" key={g.namn}>
                  <h3 className="b2-grupp-rubrik">
                    {g.href ? <a href={g.href}>{g.namn}</a> : <span>{g.namn}</span>}
                    <span className="b2-grupp-antal">{tusental(g.antal)}</span>
                  </h3>
                  {g.kategorier.length > 0 && (
                    <ul className="b2-grupp-lista">
                      {g.kategorier.map((k) => (
                        <li key={k.href}>
                          <a href={k.href}>
                            <span>{k.namn}</span>
                            <span className="b2-sub-antal">{tusental(k.antal)}</span>
                          </a>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      <section className="b2-tryggt" aria-label="Därför Fyndplats">
        <div className="container">
          <ul>
            <li>
              <a href="/kopvillkor#leverans">
                <span className="b2-tryggt-rubrik">Fri frakt över {FREE_SHIPPING_OVER_KR} kr</span>
                <span className="b2-tryggt-text">Annars {STANDARD_SHIPPING_KR} kr, till hela Sverige.</span>
              </a>
            </li>
            <li>
              <a href="/returer">
                <span className="b2-tryggt-rubrik">30 dagars öppet köp</span>
                <span className="b2-tryggt-text">14 dagars ångerrätt, sedan öppet köp till dag 30.</span>
              </a>
            </li>
            <li>
              <a href="/eu-lager-garanti">
                <span className="b2-tryggt-rubrik">Ingen tull</span>
                <span className="b2-tryggt-text">Allt skickas från lager inom EU.</span>
              </a>
            </li>
            <li>
              <a href="/kopvillkor#betalning">
                <span className="b2-tryggt-rubrik">Kort, Klarna, Apple Pay</span>
                <span className="b2-tryggt-text">Och Google Pay. Krypterat hela vägen.</span>
              </a>
            </li>
          </ul>
        </div>
      </section>
    </div>
  );
}
