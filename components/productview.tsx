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

        <div className="buybox">
          {hasImageVariants ? (
            <label className="varpick">
              <span>{options?.name || "Variant"}</span>
              <select value={sel} onChange={(e) => setSel(Number(e.target.value))}>
                {imageChoices.map((c, i) => <option key={c.variantId} value={i}>{c.label}</option>)}
              </select>
            </label>
          ) : variants.length > 1 ? (
            <label className="varpick">
              <span>Variant</span>
              <select value={sel} onChange={(e) => setSel(Number(e.target.value))}>
                {variants.map((v, i) => <option key={v.id} value={i}>{v.label}</option>)}
              </select>
            </label>
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
  );
}
