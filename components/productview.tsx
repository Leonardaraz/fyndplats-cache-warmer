"use client";
import { useState } from "react";
import { useCart } from "./cart";
import { Gallery } from "./gallery";

type Choice = { label: string; image: string; variantId: string; price: string; originalPrice: string };

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
  variants,
  options,
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
  variants: { id: string; label: string }[];
  options?: { name: string; choices: Choice[] } | null;
}) {
  const { add, busy } = useCart();
  const [sel, setSel] = useState(0);
  const [added, setAdded] = useState(false);

  const imageChoices = options?.choices || [];
  const hasImageVariants = imageChoices.length >= 2;

  const galleryImages = hasImageVariants ? imageChoices.map((c) => c.image) : images;
  const variantId = hasImageVariants
    ? imageChoices[sel]?.variantId
    : variants.length > 1
      ? variants[sel]?.id
      : variants[0]?.id;
  const displayPrice = hasImageVariants && imageChoices[sel]?.price ? imageChoices[sel].price : price;
  const displayOriginal = hasImageVariants ? (imageChoices[sel]?.originalPrice || "") : (onSale ? (originalPrice || "") : "");
  const needsVariant = hasImageVariants || variants.length > 0;

  const onAdd = async () => {
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
        active={hasImageVariants ? sel : undefined}
        onActiveChange={hasImageVariants ? setSel : undefined}
      />

      <div className="pinfo">
        <div className="eyebrow" style={{ marginBottom: 10 }}>Fyndplats</div>
        <h1>{name}</h1>
        <div className="pdp-price">
          {displayPrice}
          {displayOriginal && <span className="pdp-price-old">{displayOriginal}</span>}
          {displayOriginal && <span className="pdp-sale">Rea</span>}
        </div>
        <div className={`stock ${inStock ? "in" : "out"}`}>
          {inStock ? "✓ I lager – skickas inom 1–2 dagar" : "Tillfälligt slut"}
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
                {imageChoices.map((c, i) => (
                  <button
                    key={c.variantId}
                    type="button"
                    className={`varbubble ${sel === i ? "active" : ""}`}
                    onClick={() => setSel(i)}
                    aria-label={c.label}
                    aria-pressed={sel === i}
                    title={c.label}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={c.image} alt={c.label} loading="lazy" />
                  </button>
                ))}
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
            {!inStock ? "Tillfälligt slut" : busy ? "Lägger till…" : added ? "✓ Tillagd i varukorgen" : "Lägg i kundvagn"}
          </button>
        </div>

        <div className="pdp-trust">
          <span>🚚 Fri frakt över 499 kr</span>
          <span>↩ 14 dagars ångerrätt</span>
          <span>🔒 Trygg betalning med Klarna</span>
        </div>

        {(descriptionHtml || blurb) && (
          <div className="pdp-section">
            <h2>Beskrivning</h2>
            {descriptionHtml
              ? <div className="pdp-desc" dangerouslySetInnerHTML={{ __html: descriptionHtml }} />
              : <p className="pdp-blurb">{blurb}</p>}
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
