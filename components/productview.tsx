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

type Flik = { title: string; contentHtml: string };

// "Kontakta oss" är statisk och IDENTISK på varje produktsida (Leonards krav:
// alltid med). Läggs till om produktens beskrivning inte redan innehåller den, så
// att även nya import-produkter (utan V1:s H2-block) får kontakt-fliken.
const CONTACT_FLIK_HTML =
  '<p>Har du en fråga om den här produkten – mått, material, leverans eller något annat? Vi svarar normalt inom 24 timmar på vardagar.</p>' +
  '<ul>' +
  '<li>E-post: <a href="mailto:info@fyndplats.com">info@fyndplats.com</a></li>' +
  '<li>Telefon: <a href="tel:+46736630990">+46 (0) 736 630 990</a></li>' +
  '<li>Mer hjälp: <a href="/kontaktaoss">Kontakta oss</a> · <a href="/vanliga-fragor">Vanliga frågor</a></li>' +
  '</ul>';

function escapeHtml(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

const SPEC_FLIK_RE = /Tekniska\s+[Ss]pecifikationer/;
const CONTACT_FLIK_RE = /Kontakta\s+oss/;

// Slår ihop beskrivningens H2-baserade flikar med syntetiserade flikar så ALLA
// produkter (gamla med V1-block + nya importer) får samma tabb-struktur:
//  • Tekniska specifikationer — från specLines om beskrivningen saknar den fliken
//  • Kontakta oss — statisk, läggs alltid till om den saknas (sist)
function buildFlikar(descFlikar: Flik[], specLines: string[]): Flik[] {
  const out = [...descFlikar];
  if (!out.some((f) => SPEC_FLIK_RE.test(f.title)) && specLines.length > 0) {
    const items = specLines.map((s) => `<li>${escapeHtml(s)}</li>`).join("");
    // Lägg specifikationerna efter beskrivningen men före Kontakta oss.
    out.push({ title: "Tekniska specifikationer", contentHtml: `<ul>${items}</ul>` });
  }
  if (!out.some((f) => CONTACT_FLIK_RE.test(f.title))) {
    out.push({ title: "Kontakta oss", contentHtml: CONTACT_FLIK_HTML });
  }
  return out;
}

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

// Variant-pillens miniatyr visas 38×38 px, men c.image pekade på full w_800-bild
// (~90 KB styck). Med 5–7 varianter laddades 300–600 KB onödigt som stal band-
// bredd från hjältebildens LCP (Lighthouse image-delivery: ~304 KB savings, LCP
// sköt i höjden på simulerat 4G). Skala ner till en liten center-cropped webp
// direkt från Wix-CDN (samma mekanism som hjältebildens loader). 120 px täcker
// 38 px @3× retina.
function thumbUrl(url: string): string {
  const m = (url || "").match(/static\.wixstatic\.com\/media\/([^/]+)/);
  if (!m) return url;
  return `https://static.wixstatic.com/media/${m[1]}/v1/fill/w_120,h_120,al_c,q_80/file.webp`;
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
  const hasTextVariants = !hasImageVariants && variants.length > 1;
  // Etikett för vald variant — visas i pickern och i den sticky mobil-knappen.
  const variantLabel = hasImageVariants ? (imageChoices[sel]?.label || "") : hasTextVariants ? (variants[sel]?.label || "") : "";

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

  // En enhetlig variant-picker (named swatches): cirkelbild/färgprick + namn,
  // tydlig vald-state och dimmade övriga. Renderas en gång; CSS-order lyfter den
  // direkt under hero-bilden på mobil men håller den kvar på höger sida på desktop.
  const variantPicker = (hasImageVariants || hasTextVariants) ? (
    <div className="pdp-variants">
      <div className="varhead">
        <span className="varhead-key">{hasImageVariants ? (options?.name || "Variant") : "Variant"}</span>
        <strong className="varhead-val">{variantLabel}</strong>
      </div>
      <div className={`varswatches ${hasImageVariants ? variantMode : "text"}`}>
        {hasImageVariants
          ? imageChoices.map((c, i) => (
              <button
                key={c.variantId}
                type="button"
                className={`varswatch ${variantMode} ${sel === i ? "active" : ""}`}
                onClick={() => pickVariant(i)}
                aria-label={c.label}
                aria-pressed={sel === i}
                title={c.label}
              >
                {variantMode === "image" ? (
                  <span className="varswatch-thumb">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={thumbUrl(c.image)} alt="" loading="lazy" width={38} height={38} decoding="async" />
                  </span>
                ) : variantMode === "color" ? (
                  <span className="varswatch-dot" style={{ background: c.color || "#e5e7eb" }} />
                ) : null}
                <span className="varswatch-name">{c.label}</span>
              </button>
            ))
          : variants.map((v, i) => (
              <button
                key={v.id}
                type="button"
                className={`varswatch text ${sel === i ? "active" : ""}`}
                onClick={() => setSel(i)}
                aria-pressed={sel === i}
              >
                <span className="varswatch-name">{v.label}</span>
              </button>
            ))}
      </div>
    </div>
  ) : null;

  return (
    <>
    <div className="pdp">
      <Gallery
        images={galleryImages}
        alt={name}
        mainBlur={mainBlur}
        active={allHaveImage ? galleryIdx : undefined}
        onActiveChange={allHaveImage ? onGalleryActive : undefined}
        // Förladda variantbilderna (de ligger först i galleryImages) efter LCP så
        // varje variantbyte blir en direkt cache-träff. Galleriets extrabilder
        // (svep-bara, ej i pickern) lämnas lazy.
        eagerCount={allHaveImage ? imageChoices.length : 1}
      />

      <div className="pinfo">
        <div className="pdp-head">
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
        </div>

        {variantPicker}

        <div className="buybox pdp-actions">
          <button
            className="buy"
            disabled={busy || !productId || !inStock || (needsVariant && !variantId)}
            onClick={onAdd}
          >
            {!inStock ? "Slutsåld" : busy ? "Lägger till…" : added ? "✓ Tillagd i varukorgen" : "Lägg i kundvagn"}
          </button>

          {!inStock && productId && <RestockForm productId={productId} />}

          <div className="pdp-trust">
            <span>🚚 Fri frakt över 499 kr</span>
            <span>↩ 30 dagars öppet köp</span>
            <span>🔒 Trygg betalning med Klarna</span>
          </div>
        </div>

        <div className="pdp-detail">
        {(() => {
          // Bygg en enhetlig tabb-uppsättning: beskrivningens egna H2-flikar +
          // syntetiserad Tekniska specifikationer (från specLines) + statisk
          // Kontakta oss. Specbox:en nedan visas BARA om specifikationerna inte
          // redan hamnat i en flik (undviker dubbletter).
          const split = descriptionHtml ? splitFlikar(descriptionHtml) : { mainHtml: "", flikar: [] as Flik[] };
          const flikar = buildFlikar(split.flikar, specLines);
          const specInFlik = flikar.some((f) => SPEC_FLIK_RE.test(f.title));
          return (
            <>
              <div className="pdp-section">
                <h2>Beskrivning</h2>
                {descriptionHtml ? (
                  <div className="pdp-desc" dangerouslySetInnerHTML={{ __html: split.mainHtml }} />
                ) : blurb ? (
                  <p className="pdp-blurb">{blurb}</p>
                ) : null}
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
              </div>

              {specLines.length > 0 && !specInFlik && (
                <div className="specbox">
                  <h2>Specifikationer</h2>
                  <ul>{specLines.map((s, i) => <li key={i}>{s}</li>)}</ul>
                </div>
              )}
            </>
          );
        })()}
        </div>
      </div>
    </div>
    {/* Sticky köp-knapp på mobil — visas bara på små skärmar (CSS) */}
    <div className="sticky-buy-mobile" aria-hidden={!inStock}>
      <div className="sticky-buy-inner">
        <div className="sticky-buy-info">
          <div className="sticky-buy-price">{displayPrice}</div>
          <div className="sticky-buy-name">{variantLabel ? `${name} · ${variantLabel}` : name}</div>
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
