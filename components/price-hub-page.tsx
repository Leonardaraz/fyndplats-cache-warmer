// components/price-hub-page.tsx
// Delad renderare för Pattern 2b: översikten /under-{200,500,1000}-kr.
//
// Genvägarna på /butik pekade på /under-500-kr och /under-1000-kr innan sidorna
// fanns, och båda gav 404 (Leonard 2026-11-13). Sidan visar ett urval varor
// under gränsen först, sedan varje kategori med egen prissida och till sist de
// andra prisgränserna. Datat och giltigheten kommer ur lib/seo/programmatic.ts
// (hubCore), samma källa som sitemapen.
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { pageMeta } from "../lib/seo";
import { resolvePriceHub } from "../lib/seo/programmatic";
import { tusental, productCountLabel, categoryCountLabel } from "../lib/rating";
import { ProductCard } from "./productcard";
import { attachRatings } from "../lib/review-aggregates";
import { ProgSchemas, ProgHero, ProgCrossLinks } from "./programmatic";

export async function priceHubMetadata(price: number): Promise<Metadata> {
  const view = await resolvePriceHub(price);
  if (!view) return { title: `Fynd under ${price} kr` };
  const iKategorier = view.kategorier.length > 0 ? ` i ${categoryCountLabel(view.kategorier.length)}` : "";
  const beskrivning = `${productCountLabel(view.antal)} för högst ${price} kr${iKategorier}. Fri frakt över 499 kr och 30 dagars öppet köp hos Fyndplats.`;
  return pageMeta(`Fynd under ${price} kr`, beskrivning, view.path, `under-${price}`);
}

export async function PriceHubPage({ price }: { price: number }) {
  const view = await resolvePriceHub(price);
  if (!view) notFound();

  const produkter = await attachRatings(view.products);
  const fler = [...view.andraGranser, { href: "/rea", label: "Rea" }, { href: "/alla-produkter", label: "Hela sortimentet" }];

  return (
    <>
      <ProgSchemas schemas={view.schemas} />

      <ProgHero
        eyebrow="Fynd efter pris"
        crumbs={[{ href: "/", label: "Hem" }, { label: `Under ${price} kr` }]}
        h1={`Fynd under ${price} kr`}
        intro={view.intro}
      />

      <section className="sec" style={{ paddingTop: 28 }}>
        <div className="container">
          <div className="prodgrid listgrid">
            {produkter.map((p) => (
              <ProductCard p={p} key={p.slug} tvaKolumner />
            ))}
          </div>
        </div>
      </section>

      {view.kategorier.length > 0 && (
        <section className="sec prog-links-sec">
          <div className="container">
            <h2 className="prog-h2">Fynd under {price} kr per kategori</h2>
            <div className="prog-links">
              {view.kategorier.map((k) => (
                <a key={k.href} className="prog-link-chip" href={k.href}>
                  {k.namn} · {tusental(k.antal)}
                </a>
              ))}
            </div>
          </div>
        </section>
      )}

      <ProgCrossLinks title="Fler sätt att fynda" links={fler} />
    </>
  );
}
