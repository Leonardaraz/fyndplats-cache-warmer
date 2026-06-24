"use client";
import { useEffect, useState } from "react";
import { useCart } from "./cart";
import { Gallery } from "./gallery";
import { RestockForm } from "./restock-form";
import { trackAddToCart, trackViewItem } from "../lib/analytics";
import { tightFillUrl } from "../lib/wix-image";
import { findVariant, defaultSelection, isChoiceAvailable, reconcileSelection } from "../lib/variant-multi";
import { DeliveryEstimate } from "./delivery-estimate";

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

type Choice = { label: string; image: string; color?: string; variantId: string; price: string; priceNum: number; originalPrice: string; inStock?: boolean };

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
  if (!(url || "").includes("static.wixstatic.com")) return url;
  // tightFillUrl: crop när detection-cache har bbox, annars samma w_120 fill-URL
  // som tidigare. Säker fallback bevarar gamla beteendet vid tom cache.
  return tightFillUrl(url, 120, 120, 80);
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
  variantAxes,
  variantTable,
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
  variantAxes?: { name: string; choices: { label: string; image: string; color: string }[] }[];
  variantTable?: { choices: Record<string, string>; variantId: string; price: string; priceNum: number; originalPrice: string; inStock: boolean; image: string }[];
  category?: string;
  priceNum: number;
}) {
  const { add, busy } = useCart();
  // Förvälj FÖRSTA varianten (index 0) — samma som galleriets startbild nedan,
  // så vald ruta och visad bild alltid stämmer när sidan öppnas. (Tidigare
  // förvaldes billigaste varianten för att matcha "Från X kr" på korten, men då
  // pekade rutan på en variant medan galleriet visade huvudbilden — o-synkat.)
  const [sel, setSel] = useState(0);
  const [galleryIdx, setGalleryIdx] = useState(0); // aktiv galleribild
  const [added, setAdded] = useState(false);

  // Multi-axel (Färg × Storlek): en väljare per axel. `picked` = valt val per axel
  // (startar på första variant i lager). currentVariant = varianten för hela den
  // valda kombinationen → driver pris/lager/bild/kundvagn nedan.
  const axes = variantAxes ?? [];
  const table = variantTable ?? [];
  const multiAxis = axes.length >= 2 && table.length >= 1;
  const [picked, setPicked] = useState<Record<string, string>>(() => (multiAxis ? defaultSelection(table) : {}));
  const currentVariant = multiAxis ? findVariant(table, picked) : undefined;

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
  // Färg-läge bara när MAJORITETEN av valen faktiskt är färger (speglar importens
  // värde-baserade isColorAxis) — inte vid en enda (ev. falsk) färgträff. Annars
  // skulle en pseudo-färgaxel (storlekar/kontakttyper) ritas med gråa prickar.
  const someHaveColor =
    hasImageVariants && imageChoices.filter((c) => c.color).length >= Math.ceil(imageChoices.length / 2);
  const variantMode: "image" | "color" | "text" = allHaveImage ? "image" : someHaveColor ? "color" : "text";

  // I bild-läge behåller vi HELA bildserien men lägger variantbilderna först
  // (index 0..n-1 = variant 0..n-1), så val av variant hoppar till rätt bild
  // utan att övriga galleribilder (instruktioner etc.) försvinner.
  // Galleri: i multi-axel läggs kombinationernas bilder först och huvudbilden hoppar
  // till den valda kombinationens bild. Annars som förut (single-axel).
  // Deduppa på Wix fil-id (mediaKey) — INTE exakt URL — så samma foto i olika
  // transform-params inte ger dubbla galleribilder (samma som single-axel-vägen).
  const comboImages = multiAxis
    ? (() => {
        const seen = new Set<string>();
        const out: string[] = [];
        for (const u of [...table.map((t) => t.image), ...images]) {
          if (!u) continue;
          const k = mediaKey(u);
          if (seen.has(k)) continue;
          seen.add(k);
          out.push(u);
        }
        return out;
      })()
    : [];
  const galleryImages = multiAxis
    ? comboImages.length
      ? comboImages
      : images
    : allHaveImage
      ? mergeGallery(imageChoices, images)
      : images;
  // Matcha på fil-id så rätt slide hittas även om variantens URL har andra params.
  const multiActive = multiAxis && currentVariant?.image
    ? Math.max(0, galleryImages.findIndex((u) => mediaKey(u) === mediaKey(currentVariant.image)))
    : 0;

  // Pickern väljer variant + hoppar galleriet dit. Galleribyte speglar tillbaka
  // till pickern bara om bilden är en av variantbilderna (de n första).
  const pickVariant = (i: number) => { setSel(i); setGalleryIdx(i); };
  const onGalleryActive = (j: number) => { setGalleryIdx(j); if (j < imageChoices.length) setSel(j); };
  // Multi-axel: galleriet följer vald kombinations bild, men kunden ska ÄVEN kunna
  // klicka sig till galleriets extrabilder (instruktioner m.m.) som inte hör till
  // en variant. Vi speglar multiActive → galleryIdx i en effekt och låter Gallery
  // skriva tillbaka via onActiveChange (nedan), så ett miniatyrklick inte snäpper
  // tillbaka till variantbilden utan håller tills man byter kombination. (Bugg före
  // detta: i multi-axel styrdes active av multiActive men UTAN onActiveChange → den
  // controlled-men-callback-lösa galleribilden gick aldrig att byta, klick på
  // miniatyrerna gjorde ingenting. Märktes tydligast på slutsålda produkter.)
  useEffect(() => {
    if (multiAxis) setGalleryIdx(multiActive);
  }, [multiAxis, multiActive]);
  const hasTextVariants = !multiAxis && !hasImageVariants && variants.length > 1;
  const variantId = multiAxis
    ? currentVariant?.variantId
    : hasImageVariants
      ? imageChoices[sel]?.variantId
      : variants.length > 1
        ? variants[sel]?.id
        : variants[0]?.id;
  const displayPrice = multiAxis
    ? currentVariant?.price || price
    : hasImageVariants && imageChoices[sel]?.price
      ? imageChoices[sel].price
      : price;
  const displayOriginal = multiAxis
    ? currentVariant?.originalPrice || ""
    : hasImageVariants
      ? imageChoices[sel]?.originalPrice || ""
      : onSale
        ? originalPrice || ""
        : "";
  const needsVariant = multiAxis ? true : hasImageVariants || variants.length > 0;
  // Etikett för vald variant/kombination — visas i pickern och sticky-knappen.
  const variantLabel = multiAxis
    ? axes.map((a) => picked[a.name]).filter(Boolean).join(" / ")
    : hasImageVariants
      ? imageChoices[sel]?.label || ""
      : hasTextVariants
        ? variants[sel]?.label || ""
        : "";

  // Per-variant lager (V3-hydrerat): den VALDA variantens/kombinationens lager styr
  // köp-knappen så att en slut-variant inte kan läggas i kundvagn. inStock===false =
  // explicit slut; undefined/saknat → i lager. I multi-axel måste kombinationen
  // dessutom EXISTERA (currentVariant) för att vara köpbar.
  const selVariantInStock = multiAxis
    ? !!currentVariant?.inStock
    : hasImageVariants
      ? imageChoices[sel]?.inStock !== false
      : true;
  const buyable = inStock && selVariantInStock && (!multiAxis || !!currentVariant);
  const variantOnlyOOS = inStock && !buyable; // produkten finns men vald variant/kombination ej köpbar

  const onAdd = async () => {
    // GA4: skicka add_to_cart med variantens pris om det finns, annars listpris.
    const itemPrice = multiAxis
      ? currentVariant?.priceNum || priceNum
      : hasImageVariants && imageChoices[sel]?.priceNum
        ? imageChoices[sel].priceNum
        : priceNum;
    trackAddToCart({ id: productId, name, priceNum: itemPrice, category });
    await add(productId, variantId || undefined);
    setAdded(true);
    setTimeout(() => setAdded(false), 1500);
  };

  // Multi-axel: en väljare PER axel (t.ex. Färg + Storlek). Återanvänder swatch-
  // stilen; varje axel får eget läge (bild/färg/text). Slut/omöjliga kombinationer
  // dämpas men går att klicka (visar då slut-läget) → inga återvändsgränder.
  const multiVariantPicker = multiAxis ? (
    <div className="pdp-variants">
      {axes.map((axis) => {
        const allImg = axis.choices.every((c) => c.image);
        const someColor = axis.choices.filter((c) => c.color).length >= Math.ceil(axis.choices.length / 2);
        const mode: "image" | "color" | "text" = allImg ? "image" : someColor ? "color" : "text";
        return (
          <div className="pdp-axis" key={axis.name}>
            <div className="varhead">
              <span className="varhead-key">{axis.name}</span>
              <strong className="varhead-val">{picked[axis.name] || ""}</strong>
            </div>
            <div className={`varswatches ${mode}`}>
              {axis.choices.map((c) => {
                const active = picked[axis.name] === c.label;
                const avail = isChoiceAvailable(table, axis.name, c.label, picked);
                return (
                  <button
                    key={c.label}
                    type="button"
                    className={`varswatch ${mode} ${active ? "active" : ""} ${avail ? "" : "oos"}`}
                    onClick={() => setPicked((prev) => reconcileSelection(table, axis.name, c.label, prev))}
                    aria-pressed={active}
                    aria-label={avail ? c.label : `${c.label} – slut i lager`}
                    title={avail ? c.label : `${c.label} – slut i lager`}
                  >
                    {mode === "image" ? (
                      <span className="varswatch-thumb">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={thumbUrl(c.image)} alt="" loading="lazy" width={38} height={38} decoding="async" />
                      </span>
                    ) : mode === "color" ? (
                      <span className="varswatch-dot" style={{ background: c.color || "#e5e7eb" }} />
                    ) : null}
                    <span className="varswatch-name">{c.label}</span>
                    {!avail && <span className="varswatch-oos">Slut</span>}
                  </button>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  ) : null;

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
                className={`varswatch ${variantMode} ${sel === i ? "active" : ""} ${c.inStock === false ? "oos" : ""}`}
                onClick={() => pickVariant(i)}
                aria-label={c.inStock === false ? `${c.label} – slut i lager` : c.label}
                aria-pressed={sel === i}
                title={c.inStock === false ? `${c.label} – slut i lager` : c.label}
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
                {c.inStock === false && <span className="varswatch-oos">Slut</span>}
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
        active={multiAxis || allHaveImage ? galleryIdx : undefined}
        onActiveChange={multiAxis ? setGalleryIdx : allHaveImage ? onGalleryActive : undefined}
        // Förladda variantbilderna (de ligger först i galleryImages) efter LCP så
        // varje variantbyte blir en direkt cache-träff. Galleriets extrabilder
        // (svep-bara, ej i pickern) lämnas lazy.
        eagerCount={multiAxis ? Math.min(comboImages.length || 1, 8) : allHaveImage ? imageChoices.length : 1}
      />

      <div className="pinfo">
        <div className="pdp-head">
          <div className="eyebrow" style={{ marginBottom: 10 }}>Fyndplats</div>
          <h1>{name}</h1>
          {!buyable && (
            <div className="oos-banner" role="status">
              <span className="oos-banner-chip">Slutsåld</span>
              <span className="oos-banner-text">
                {variantOnlyOOS
                  ? `${variantLabel} är tillfälligt slut – välj en annan variant ovan, eller bevaka nedan så hör vi av oss.`
                  : "Varan är tillfälligt slut hos oss – bevaka nedan så hör vi av oss."}
              </span>
            </div>
          )}
          <div className="pdp-price">
            {displayPrice}
            {displayOriginal && <span className="pdp-price-old">{displayOriginal}</span>}
            {displayOriginal && <span className="pdp-sale">Rea</span>}
          </div>
          <div className={`stock ${buyable ? "in" : "out"}`}>
            {buyable ? "✓ I lager" : variantOnlyOOS ? "Slut i denna variant" : "Tillfälligt slut"}
          </div>
          {buyable && typeof stockQuantity === "number" && stockQuantity > 0 && stockQuantity <= 5 && (
            <div className="low-stock-warn">🔥 Endast <strong>{stockQuantity}</strong> kvar i lager</div>
          )}
        </div>

        {multiAxis ? multiVariantPicker : variantPicker}

        <div className="buybox pdp-actions">
          <button
            className="buy"
            disabled={busy || !productId || !buyable || (needsVariant && !variantId)}
            onClick={onAdd}
          >
            {!buyable ? (variantOnlyOOS ? "Slut i denna variant" : "Slutsåld") : busy ? "Lägger till…" : added ? "✓ Tillagd i varukorgen" : "Lägg i kundvagn"}
          </button>

          {!buyable && productId && <RestockForm productId={productId} />}

          <div className="pdp-trust">
            <span>🚚 Fri frakt över 499 kr</span>
            {inStock && <DeliveryEstimate />}
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
    <div className="sticky-buy-mobile" aria-hidden={!buyable}>
      <div className="sticky-buy-inner">
        <div className="sticky-buy-info">
          <div className="sticky-buy-price">{displayPrice}</div>
          <div className="sticky-buy-name">{variantLabel ? `${name} · ${variantLabel}` : name}</div>
        </div>
        <button
          className="buy sticky-buy-btn"
          disabled={busy || !productId || !buyable || (needsVariant && !variantId)}
          onClick={onAdd}
        >
          {!buyable ? "Slut" : busy ? "..." : added ? "✓" : "Lägg i kundvagn"}
        </button>
      </div>
    </div>
    </>
  );
}
