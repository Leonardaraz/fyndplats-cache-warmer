"use client";
import { useEffect, useState } from "react";
import { useCart } from "./cart";
import { Gallery } from "./gallery";
import { RestockForm } from "./restock-form";
import { trackAddToCart, trackViewItem } from "../lib/analytics";

// V1-sajten visade dessa fyra sektioner som expanderbara accordion-flikar
// under produktbeskrivningen. Migrationen fogade in dem som H2-block i
// plainDescription → vi splittar och renderar dem som <details> så UX:n
// matchar V1 (klickbart, kollapsat by default). Toleranta mot åäö-variationer
// + valfri "Ofta ställda frågor"-formulering.
const FLIK_TITLE_PATTERNS = [
  /Tekniska\s+[Ss]pecifikationer/,
  /Anv[äa]ndning\s+och\s+sk[öo]tsel/,
  /(Vanliga\s+fr[åa]gor|Ofta\s+st[äa]llda\s+fr[åa]gor)/,
  /Kontakta\s+oss/,
];

function splitFlikar(html: string): { mainHtml: string; flikar: { title: string; contentHtml: string }[] } {
  const combined = FLIK_TITLE_PATTERNS.map((p) => p.source).join("|");
  const regex = new RegExp(`<h2[^>]*>\\s*(${combined})\\s*</h2>`, "gi");
  const matches: { idx: number; len: number; title: string }[] = [];
  let m: RegExpExecArray | null;
  while ((m = regex.exec(html)) !== null) {
    matches.push({ idx: m.index, len: m[0].length, title: m[1] });
  }
  if (matches.length === 0) return { mainHtml: html, flikar: [] };
  const mainHtml = html.substring(0, matches[0].idx);
  const flikar = matches.map((mm, i) => {
    const contentStart = mm.idx + mm.len;
    const contentEnd = i + 1 < matches.length ? matches[i + 1].idx : html.length;
    return { title: mm.title, contentHtml: html.substring(contentStart, contentEnd) };
  });
  return { mainHtml, flikar };
}

type Choice = { label: string; image: string; color?: string; variantId: string; price: string; priceNum: number; originalPrice: string };

// Wixstatic-bilder har samma fil-id men olika transform-params (w_400 vs w_800).
// Dedup:a på fil-id:t så variantbilden inte dyker upp dubbelt i galleriet.
function mediaKey(url: string): string {
  const m = (url || "").match(/\/media\/([^/]+)/);
  return m ? m[1] : url || "";
}

// Variantbilderna först (index = variant-index), sedan övriga galleribilder
// (instruktioner etc.) som inte redan är en variantbild.
function mergeGallery(choices: Choice[], images: string[]): string[] {
  const variantImgs = choices.map((c) => c.image);
  const seen = new Set(variantImgs.map(mediaKey));
  const extras = images.filter((img) => !seen.has(mediaKey(img)));
  return [...variantImgs, ...extras];
}

export function ProductView({
  productId,
  name,
  price,
  inStock,
  stockQuantity,
  blurb,
  descriptionHtml,
  originalPrice,
  onSale,
  specLines,
  images,
  mainBlur,
  variants,
  options,
  category,
  priceNum,
}: {
  productId: string;
  name: string;
  price: string;
  inStock: boolean;
  stockQuantity?: number;
  blurb: string;
  descriptionHtml?: string;
  originalPrice?: string;
  onSale?: boolean;
  specLines: string[];
  images: string[];
  mainBlur?: string;
  variants: { id: string; label: string }[];
  options?: { name: string; choices: Choice[] } | null;
  category?: string;
  priceNum: number;
}) {
  const { add, busy } = useCart();
  // Förvälj billigaste varianten så att produktsidans pris matchar "Från X kr" på
  // kort/listor (annars hoppade priset eftersom variant 0 inte är billigast).
  const [sel, setSel] = useState(() => {
    const cs = options?.choices || [];
    let bi = 0, bv = Infinity;
    cs.forEach((c, i) => { if (c.priceNum > 0 && c.priceNum < bv) { bv = c.priceNum; bi = i; } });
    return bi;
  });
  const [galleryIdx, setGalleryIdx] = useState(0); // aktiv galleribild
  const [added, setAdded] = useState(false);

  // GA4 view_item — fires once per produkt-sidvisning. productId i dep-arrayen
  // gör att events skickas korrekt vid client-side route mellan produkter.
  useEffect(() => {
    if (!productId) return;
    trackViewItem({ id: productId, name, priceNum, category });
  }, [productId, name, priceNum, category]);

  const imageChoices = options?.choices || [];
  const hasImageVariants = imageChoices.length >= 2;
  // Rendering-läge för variant-pickern: bild > färg-swatch > text-pill.
  // Färg-swatch är fallback när per-choice-bild saknas (colorOf på namnet).
  const allHaveImage = hasImageVariants && imageChoices.every((c) => c.image);
  const someHaveColor = hasImageVariants && imageChoices.some((c) => c.color);
  const variantMode: "image" | "color" | "text" = allHaveImage ? "image" : someHaveColor ? "color" : "text";

  // I bild-läge behåller vi HELA bildserien men lägger variantbilderna först
  // (index 0..n-1 = variant 0..n-1), så val av variant hoppar till rätt bild
  // utan att övriga galleribilder (instruktioner etc.) försvinner.
  const galleryImages = allHaveImage ? mergeGallery(imageChoices, images) : images;

  // Pickern väljer variant + hoppar galleriet dit. Galleribyte speglar tillbaka
  // till pickern bara om bilden är en av variantbilderna (de n första).
  const pickVariant = (i: number) => { setSel(i); setGalleryIdx(i); };
  const onGalleryActive = (j: number) => { setGalleryIdx(j); if (j < imageChoices.length) setSel(j); };
  const variantId = hasImageVariants
    ? imageChoices[sel]?.variantId
    : variants.length > 1
      ? variants[sel]?.id
      : variants[0]?.id;
  const displayPrice = hasImageVariants && imageChoices[sel]?.price ? imageChoices[sel].price : price;
  const displayOriginal = hasImageVariants ? (imageChoices[sel]?.originalPrice || "") : (onSale ? (originalPrice || "") : "");
  const needsVariant = hasImageVariants || variants.length > 0;

  const onAdd = async () => {
    // GA4: skicka add_to_cart med variantens pris om det finns, annars listpris.
    const itemPrice = hasImageVariants && imageChoices[sel]?.priceNum
      ? imageChoices[sel].priceNum
      : priceNum;
    trackAddToCart({ id: productId, name, priceNum: itemPrice, category });
    await add(productId, variantId || undefined);
    setAdded(true);
    setTimeout(() => setAdded(false), 1500);
  };

  return (
    <>
    <div className="pdp">
      <Gallery
        images={galleryImages}
        alt={name}
        mainBlur={mainBlur}
        active={allHaveImage ? galleryIdx : undefined}
        onActiveChange={allHaveImage ? onGalleryActive : undefined}
      />

      <div className="pinfo">
        <div className="eyebrow" style={{ marginBottom: 10 }}>Fyndplats</div>
        <h1>{name}</h1>
        {!inStock && (
          <div className="oos-banner" role="status">
            <span className="oos-banner-chip">Slutsåld</span>
            <span className="oos-banner-text">Varan är tillfälligt slut hos oss – bevaka nedan så hör vi av oss.</span>
          </div>
        )}
        <div className="pdp-price">
          {displayPrice}
          {displayOriginal && <span className="pdp-price-old">{displayOriginal}</span>}
          {displayOriginal && <span className="pdp-sale">Rea</span>}
        </div>
        <div className={`stock ${inStock ? "in" : "out"}`}>
          {inStock ? "✓ I lager" : "Tillfälligt slut"}
        </div>
        {inStock && typeof stockQuantity === "number" && stockQuantity > 0 && stockQuantity <= 5 && (
          <div className="low-stock-warn">🔥 Endast <strong>{stockQuantity}</strong> kvar i lager</div>
        )}

        <div className="buybox">
          {hasImageVariants ? (
            <div className="varbubbles">
              <div className="varbubbles-label">
                <span>{options?.name || "Variant"}:</span>
                <strong>{imageChoices[sel]?.label}</strong>
              </div>
              <div className="varbubbles-row">
                {imageChoices.map((c, i) => {
                  const cls = `${variantMode === "image" || variantMode === "color" ? "varbubble" : "varpill"} ${variantMode === "color" ? "varcolor" : ""} ${sel === i ? "active" : ""}`;
                  return (
                    <button
                      key={c.variantId}
                      type="button"
                      className={cls.trim()}
                      onClick={() => pickVariant(i)}
                      aria-label={c.label}
                      aria-pressed={sel === i}
                      title={c.label}
                      style={variantMode === "color" ? { background: c.color || "#e5e7eb" } : undefined}
                    >
                      {variantMode === "image" ? (
                        /* eslint-disable-next-line @next/next/no-img-element */
                        <img src={c.image} alt={c.label} loading="lazy" />
                      ) : variantMode === "color" ? null : (
                        c.label
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          ) : variants.length > 1 ? (
            <div className="varbubbles">
              <div className="varbubbles-label">
                <span>Variant:</span>
                <strong>{variants[sel]?.label}</strong>
              </div>
              <div className="varbubbles-row">
                {variants.map((v, i) => (
                  <button
                    key={v.id}
                    type="button"
                    className={`varpill ${sel === i ? "active" : ""}`}
                    onClick={() => setSel(i)}
                    aria-pressed={sel === i}
                  >
                    {v.label}
                  </button>
                ))}
              </div>
            </div>
          ) : null}

          <button
            className="buy"
            disabled={busy || !productId || !inStock || (needsVariant && !variantId)}
            onClick={onAdd}
          >
            {!inStock ? "Slutsåld" : busy ? "Lägger till…" : added ? "✓ Tillagd i varukorgen" : "Lägg i kundvagn"}
          </button>

          {!inStock && productId && <RestockForm productId={productId} />}
        </div>

        <div className="pdp-trust">
          <span>🚚 Fri frakt över 499 kr</span>
          <span>↩ 30 dagars öppet köp</span>
          <span>🔒 Trygg betalning med Klarna</span>
        </div>

        {(descriptionHtml || blurb) && (
          <div className="pdp-section">
            <h2>Beskrivning</h2>
            {descriptionHtml ? (() => {
              const { mainHtml, flikar } = splitFlikar(descriptionHtml);
              return (
                <>
                  <div className="pdp-desc" dangerouslySetInnerHTML={{ __html: mainHtml }} />
                  {flikar.length > 0 && (
                    <div className="pdp-flikar">
                      {flikar.map((f, i) => (
                        <details key={i} className="pdp-flik">
                          <summary>{f.title}</summary>
                          <div className="pdp-flik-body" dangerouslySetInnerHTML={{ __html: f.contentHtml }} />
                        </details>
                      ))}
                    </div>
                  )}
                </>
              );
            })() : <p className="pdp-blurb">{blurb}</p>}
          </div>
        )}

        {specLines.length > 0 && (
          <div className="specbox">
            <h2>Specifikationer</h2>
            <ul>{specLines.map((s, i) => <li key={i}>{s}</li>)}</ul>
          </div>
        )}
      </div>
    </div>
    {/* Sticky köp-knapp på mobil — visas bara på små skärmar (CSS) */}
    <div className="sticky-buy-mobile" aria-hidden={!inStock}>
      <div className="sticky-buy-inner">
        <div className="sticky-buy-info">
          <div className="sticky-buy-price">{displayPrice}</div>
          <div className="sticky-buy-name">{name}</div>
        </div>
        <button
          className="buy sticky-buy-btn"
          disabled={busy || !productId || !inStock || (needsVariant && !variantId)}
          onClick={onAdd}
        >
          {!inStock ? "Slut" : busy ? "..." : added ? "✓" : "Lägg i kundvagn"}
        </button>
      </div>
    </div>
    </>
  );
}
