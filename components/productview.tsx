"use client";
import { useEffect, useState } from "react";
import { useCart } from "./cart";
import { Gallery } from "./gallery";
import { RestockForm } from "./restock-form";
import { trackAddToCart, trackViewItem } from "../lib/analytics";
import { tightFillUrl } from "../lib/wix-image";
import { findVariant, defaultSelection, isChoiceAvailable, reconcileSelection } from "../lib/variant-multi";
import { DeliveryEstimate } from "./delivery-estimate";
import { PaymentMarks } from "./payment-marks";
import { KlarnaMessage } from "./klarna-message";
import { formatPrice } from "../lib/price-range";
import { EU_STOCK_NOTE } from "../lib/shipping";
import { ratingSummary } from "../lib/rating";
import { Stars } from "./stars";

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

// Visuell putsning av måttetiketter: 590x790 → 590 × 790. Endast siffra-x-siffra
// byts (multiplikationstecken), så färgnamn m.m. ("Blue-Green") aldrig mangas.
function fmtDim(s: string): string {
  // Lookahead på nästa siffra så mellansiffran INTE konsumeras — annars blir
  // kedjor med ensiffriga segment halvkonverterade ("3x3x3" → "3 × 3x3").
  return (s || "").replace(/(\d)\s*[xX]\s*(?=\d)/g, "$1 × ");
}

type VariantCardItem = {
  key: string;
  label: string;
  active: boolean;
  avail: boolean;
  price?: string;
  thumb?: string; // variantbild (image-läge) — visas som miniatyr i kortet
  dot?: string; // färgkod (color-läge) — visas som färgprick i kortet
  onPick: () => void;
};

// Hybrid-beslut: långa etiketter (mått, flerordsvärden som "590x790x40 mm-1 st")
// blir svårlästa som pillar och döljer lätt att det finns fler val → staplade
// valkort. Korta etiketter (färger, "M/L/40") funkar utmärkt som kompakta swatches.
function shouldUseCards(labels: string[]): boolean {
  return labels.reduce((m, l) => Math.max(m, (l || "").length), 0) > 14;
}

// Vänster-visual i kort/swatch: miniatyr (image), färgprick (color) eller inget.
function variantMediaLeft(it: VariantCardItem, cls: "varcard" | "varswatch") {
  if (it.thumb) {
    return (
      <span className={`${cls}-thumb`}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={thumbUrl(it.thumb)} alt="" loading="lazy" width={cls === "varcard" ? 46 : 38} height={cls === "varcard" ? 46 : 38} decoding="async" />
      </span>
    );
  }
  if (it.dot) return <span className={`${cls}-dot`} style={{ background: it.dot }} />;
  return null;
}

// Staplade valkort: en rad per val, allt synligt på en gång, valt kort inramat.
// Miniatyr/färgprick visas när varianten har en (annars en radio-ring). Pris per
// rad bara när varianterna faktiskt skiljer sig i pris (annars upprepat brus).
function renderVariantCards(items: VariantCardItem[]) {
  const priceVaries = new Set(items.map((it) => it.price).filter(Boolean)).size > 1;
  return (
    <div className="varcards">
      {items.map((it) => {
        const media = variantMediaLeft(it, "varcard");
        const shown = fmtDim(it.label);
        return (
          <button
            key={it.key}
            type="button"
            className={`varcard ${media ? "has-media" : ""} ${it.active ? "active" : ""} ${it.avail ? "" : "oos"}`}
            onClick={it.onPick}
            aria-pressed={it.active}
            aria-label={it.avail ? shown : `${shown} – slut i lager`}
            title={it.avail ? shown : `${shown} – slut i lager`}
          >
            {media || <span className="varcard-radio" aria-hidden="true" />}
            <span className="varcard-main">
              <span className="varcard-label">{shown}</span>
              {!it.avail && <span className="varcard-oos">Slut i lager</span>}
            </span>
            {priceVaries && it.price ? <span className="varcard-price">{it.price}</span> : null}
            <span className="varcard-check" aria-hidden="true" />
          </button>
        );
      })}
    </div>
  );
}

// Kompakta swatch-pillar (korta etiketter): miniatyr/färgprick + namn, radbryter.
function renderVariantSwatches(items: VariantCardItem[]) {
  return (
    <div className="varswatches">
      {items.map((it) => {
        const media = variantMediaLeft(it, "varswatch");
        const shown = fmtDim(it.label);
        return (
          <button
            key={it.key}
            type="button"
            className={`varswatch ${it.thumb ? "image" : it.dot ? "color" : "text"} ${it.active ? "active" : ""} ${it.avail ? "" : "oos"}`}
            onClick={it.onPick}
            aria-pressed={it.active}
            aria-label={it.avail ? shown : `${shown} – slut i lager`}
            title={it.avail ? shown : `${shown} – slut i lager`}
          >
            {media}
            <span className="varswatch-name">{shown}</span>
            {!it.avail && <span className="varswatch-oos">Slut</span>}
          </button>
        );
      })}
    </div>
  );
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
  imageOwners,
  imageAlts,
  category,
  priceNum,
  reviewCount,
  reviewAverage,
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
  imageOwners?: Record<string, string>;
  // Wix alt-texter per bild (mediaKey → altText) — skickas vidare till Gallery.
  imageAlts?: Record<string, string>;
  category?: string;
  priceNum: number;
  // Betygssammandraget. Samma siffror som recensionssektionen längre ner —
  // sidan hämtar dem en gång och skickar hit, inget extra anrop.
  reviewCount?: number;
  reviewAverage?: number | null;
}) {
  const { add, busy } = useCart();
  const ratingHead = ratingSummary(reviewCount ?? 0, reviewAverage ?? null);
  // Förvälj FÖRSTA varianten (index 0) — samma som galleriets startbild nedan,
  // så vald ruta och visad bild alltid stämmer när sidan öppnas. (Tidigare
  // förvaldes billigaste varianten för att matcha "Från X kr" på korten, men då
  // pekade rutan på en variant medan galleriet visade huvudbilden — o-synkat.)
  const [sel, setSel] = useState(0);
  // Initiera galleriet till förvald variants bild (= variantActive nedan) så det INTE
  // hoppar hjälte→variant efter mount (flash + LCP-preload-miss). Derivaten (galleryImages
  // m.fl.) definieras längre ned, så vi speglar uppslaget här med bara props + modul-
  // helpers (mediaKey/findVariant/defaultSelection). Saknas bild → 0 (huvudbilden).
  const [galleryIdx, setGalleryIdx] = useState(() => {
    const ch = options?.choices || [];
    const ax = variantAxes ?? [];
    const tb = variantTable ?? [];
    const firstImg =
      ax.length >= 2 && tb.length >= 1
        ? findVariant(tb, defaultSelection(tb))?.image
        : ch.length >= 2 && ch.every((c) => c.image)
          ? ch[0]?.image
          : undefined;
    if (!firstImg) return 0;
    const k = mediaKey(firstImg);
    const idx = images.findIndex((u) => mediaKey(u) === k);
    return idx >= 0 ? idx : 0;
  });
  const [added, setAdded] = useState(false);
  const [qty, setQty] = useState(1); // antal-väljare vid köp

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

  // Galleriet behåller sin NATURLIGA ordning (huvudbild → detaljbilder, så som Wix
  // lagrar dem). Variantbilderna hoistas INTE längre först — det skramlade ordningen
  // vid varje variantbyte. I stället ligger varje variants bild kvar på sin naturliga
  // plats och vi HOPPAR dit vid val (matchat på Wix fil-id). Ev. variantbild som inte
  // redan finns i galleriet läggs sist (sällsynt — linkedMedia pekar normalt på en
  // galleribild). Deduppar på fil-id (mediaKey), inte exakt URL.
  const variantImgList = multiAxis
    ? table.map((t) => t.image)
    : allHaveImage
      ? imageChoices.map((c) => c.image)
      : [];
  const galleryImages = (() => {
    if (!variantImgList.length) return images;
    const seen = new Set(images.map(mediaKey));
    const missing: string[] = [];
    for (const u of variantImgList) {
      if (!u) continue;
      const k = mediaKey(u);
      if (seen.has(k)) continue;
      seen.add(k);
      missing.push(u);
    }
    return missing.length ? [...images, ...missing] : images;
  })();
  // Hitta en variants bild på dess naturliga plats i galleriet (fil-id-match så rätt
  // slide hittas även om variantens URL har andra transform-params). Saknas → 0.
  const galleryIndexOf = (img?: string): number => {
    if (!img) return 0;
    const k = mediaKey(img);
    const i = galleryImages.findIndex((u) => mediaKey(u) === k);
    return i >= 0 ? i : 0;
  };
  // Den valda variantens/kombinationens bild → dess galleri-index.
  const selectedVariantImage = multiAxis
    ? currentVariant?.image
    : allHaveImage
      ? imageChoices[sel]?.image
      : undefined;
  const variantActive = galleryIndexOf(selectedVariantImage);

  // Pickern väljer variant + hoppar galleriet till variantens bild (naturliga plats).
  const pickVariant = (i: number) => { setSel(i); setGalleryIdx(galleryIndexOf(imageChoices[i]?.image)); };
  // Manuell bläddring speglar tillbaka till pickern BARA om bilden tillhör EXAKT EN
  // variant. Delar flera val samma bild (vanligt: 14 val men 6 galleribilder) går det
  // inte att härleda vilket val som avses → då lämnas valet orört (man tittar bara på
  // bilden). Annars kunde en delad/detaljbild tyst byta vald variant → fel variantId/
  // pris/lager i kundvagnen.
  const onGalleryActive = (j: number) => {
    setGalleryIdx(j);
    const k = mediaKey(galleryImages[j] || "");
    const matches = imageChoices.filter((c) => c.image && mediaKey(c.image) === k);
    if (matches.length === 1) setSel(imageChoices.indexOf(matches[0]));
  };
  // Synka galleriet till den valda varianten/kombinationen — även på första render,
  // så vald ruta och visad bild stämmer. Manuell bläddring (onActiveChange) skriver
  // tillbaka galleryIdx och hålls kvar: variantActive ändras bara vid ett faktiskt
  // variantbyte, så effekten fyrar inte vid vanlig bläddring bland detaljbilderna.
  useEffect(() => {
    setGalleryIdx(variantActive);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [variantActive]);
  const hasTextVariants = !multiAxis && !hasImageVariants && variants.length > 1;
  const variantId = multiAxis
    ? currentVariant?.variantId
    : hasImageVariants
      ? imageChoices[sel]?.variantId
      : variants.length > 1
        ? variants[sel]?.id
        : variants[0]?.id;
  // Wix färdiga sträng, kvar som reserv. Product.price rörs inte — feed-parsern
  // i app/api/feed/products.xml läser den.
  const wixPrisStrang = multiAxis
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
  // Numeriskt pris för den VALDA varianten/kombinationen → Klarna-delbeloppet
  // (pris/3) matchar exakt det pris kunden ser. Samma logik som onAdd:s itemPrice.
  const currentPriceNum = multiAxis
    ? currentVariant?.priceNum || priceNum
    : hasImageVariants && imageChoices[sel]?.priceNum
      ? imageChoices[sel].priceNum
      : priceNum;
  // Priset skrivs från talet, inte från Wix sträng: "1 379 kr" i stället för
  // "1 379,00kr". Produktsidan var den SISTA ytan med det gamla formatet —
  // korten, hjältebrickorna och varukorgen byttes 2026-08-22 men den här
  // missades, vilket gjorde den till hela butikens enda avvikare. Samma
  // formatPrice() driver prisreglagets etiketter, så filter och sida aldrig
  // kan säga samma pris på två sätt.
  const displayPrice = currentPriceNum ? formatPrice(currentPriceNum) : wixPrisStrang;
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
    await add(productId, variantId || undefined, qty);
    setAdded(true);
    setQty(1); // nollställ antal efter tillagt → nästa köp börjar om på 1
    setTimeout(() => setAdded(false), 1500);
  };

  // De galleribilder som tillhör den VALDA varianten → markeras i galleriet (ram).
  // En variant kan ha FLERA bilder: imageOwners (mediaKey → variant-etikett) är läst
  // ur ALLA linkedMedia, inte bara första. Multi-axel: alla valda axel-etiketter;
  // single/text: den valda variantens etikett. Matchar inget → tom → ingen markering.
  const selectedVariantLabels = (
    multiAxis
      ? Object.values(picked)
      : hasImageVariants
        ? [imageChoices[sel]?.label]
        : hasTextVariants
          ? [variants[sel]?.label]
          : []
  ).filter(Boolean) as string[];
  const variantImageIndices = imageOwners && selectedVariantLabels.length
    ? galleryImages.reduce<number[]>((acc, u, i) => {
        const owner = imageOwners[mediaKey(u)];
        if (owner && selectedVariantLabels.includes(owner)) acc.push(i);
        return acc;
      }, [])
    : [];

  // Multi-axel: en väljare PER axel (t.ex. Färg + Storlek). Återanvänder swatch-
  // stilen; varje axel får eget läge (bild/färg/text). Slut/omöjliga kombinationer
  // dämpas men går att klicka (visar då slut-läget) → inga återvändsgränder.
  const multiVariantPicker = multiAxis ? (
    <div className="pdp-variants">
      {axes.map((axis) => {
        const allImg = axis.choices.every((c) => c.image);
        const someColor = axis.choices.filter((c) => c.color).length >= Math.ceil(axis.choices.length / 2);
        const mode: "image" | "color" | "text" = allImg ? "image" : someColor ? "color" : "text";
        const axisItems: VariantCardItem[] = axis.choices.map((c) => ({
          key: c.label,
          label: c.label,
          active: picked[axis.name] === c.label,
          avail: isChoiceAvailable(table, axis.name, c.label, picked),
          thumb: mode === "image" ? c.image : undefined,
          dot: mode === "color" ? c.color || "#e5e7eb" : undefined,
          onPick: () => setPicked((prev) => reconcileSelection(table, axis.name, c.label, prev)),
        }));
        return (
          <div className="pdp-axis" key={axis.name}>
            <div className="varhead">
              <span className="varhead-key">{axis.name}</span>
              <strong className="varhead-val">{fmtDim(picked[axis.name] || "")}</strong>
              {axis.choices.length >= 3 && <span className="varcount">{axis.choices.length} val</span>}
            </div>
            {shouldUseCards(axis.choices.map((c) => c.label))
              ? renderVariantCards(axisItems)
              : renderVariantSwatches(axisItems)}
          </div>
        );
      })}
    </div>
  ) : null;

  // En enhetlig variant-picker (named swatches): cirkelbild/färgprick + namn,
  // tydlig vald-state och dimmade övriga. Renderas en gång; CSS-order lyfter den
  // direkt under hero-bilden på mobil men håller den kvar på höger sida på desktop.
  const singleItems: VariantCardItem[] = hasImageVariants
    ? imageChoices.map((c, i) => ({
        key: c.variantId,
        label: c.label,
        active: sel === i,
        avail: c.inStock !== false,
        price: c.price,
        thumb: variantMode === "image" ? c.image : undefined,
        dot: variantMode === "color" ? c.color || "#e5e7eb" : undefined,
        onPick: () => pickVariant(i),
      }))
    : variants.map((v, i) => ({
        key: v.id,
        label: v.label,
        active: sel === i,
        avail: true,
        onPick: () => setSel(i),
      }));
  const singleCount = singleItems.length;
  // Hybrid: långa etiketter → staplade valkort (med ev. miniatyr), korta → swatches.
  const singleCards = shouldUseCards(singleItems.map((it) => it.label));
  const variantPicker = (hasImageVariants || hasTextVariants) ? (
    <div className="pdp-variants">
      <div className="varhead">
        <span className="varhead-key">{hasImageVariants ? (options?.name || "Variant") : "Variant"}</span>
        <strong className="varhead-val">{fmtDim(variantLabel)}</strong>
        {singleCount >= 3 && <span className="varcount">{singleCount} val</span>}
      </div>
      {singleCards ? renderVariantCards(singleItems) : renderVariantSwatches(singleItems)}
    </div>
  ) : null;

  return (
    <>
    <div className="pdp">
      <Gallery
        images={galleryImages}
        alt={name}
        imageAlts={imageAlts}
        mainBlur={mainBlur}
        active={multiAxis || allHaveImage ? galleryIdx : undefined}
        onActiveChange={multiAxis ? setGalleryIdx : allHaveImage ? onGalleryActive : undefined}
        // Variantbilderna ligger nu utspridda i galleriet (naturlig ordning), så
        // förladda hela serien (efter LCP, gated i Gallery) → varje variantbyte blir
        // en direkt cache-träff oavsett var bilden ligger. Capad så payloaden hålls nere.
        eagerCount={multiAxis || allHaveImage ? Math.min(galleryImages.length, 12) : 1}
        variantImageIndices={variantImageIndices}
      />

      <div className="pinfo">
        <div className="pdp-head">
          <div className="eyebrow" style={{ marginBottom: 10 }}>Fyndplats</div>
          <h1>{name}</h1>
          {/* Betyget hör hemma FÖRE köpknappen. Länken hoppar till sektionen
              med själva omdömena, som ligger längre ner på sidan. */}
          {ratingHead && (
            <a className="pdp-rating" href="#recensioner">
              <Stars rating={ratingHead.exact} />
              <strong>{ratingHead.value}</strong>
              {/* Skiljetecken: utan det står "5,0" och "11" intill varandra och
                  läses ett ögonblick som ett enda tal. Samma prick som
                  sammandraget i recensionssektionen. */}
              <span className="pdp-rating-dot" aria-hidden="true">·</span>
              <span className="pdp-rating-count">{ratingHead.label}</span>
              {/* Riktningsvisare: raden ÄR en länk till #recensioner, men inget
                  sa det. Dekorativ — skärmläsaren har redan länktexten. */}
              <span className="pdp-rating-arrow" aria-hidden="true">→</span>
            </a>
          )}
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
          <KlarnaMessage priceNum={currentPriceNum} />
          {/* Lagerstatus visas i leveransboxen ("✓ I lager · Beräknad leverans…")
              — en fristående pill här såg övergiven ut. Slut-i-lager-läget bärs
              redan av oos-bannern ovan + köpknappens text. */}
          {buyable && typeof stockQuantity === "number" && stockQuantity > 0 && stockQuantity <= 5 && (
            <div className="low-stock-warn">🔥 Endast <strong>{stockQuantity}</strong> kvar i lager</div>
          )}
        </div>

        {multiAxis ? multiVariantPicker : variantPicker}

        <div className="buybox pdp-actions">
          {buyable && (
            <div className="pdp-qty">
              <span className="pdp-qty-label">Antal</span>
              <div className="qstep" role="group" aria-label="Antal">
                <button type="button" onClick={() => setQty((q) => Math.max(1, q - 1))} disabled={qty <= 1 || busy} aria-label="Minska antal">−</button>
                <span className="qstep-num" aria-live="polite">{qty}</span>
                <button type="button" onClick={() => setQty((q) => Math.min(99, q + 1))} disabled={busy} aria-label="Öka antal">+</button>
              </div>
            </div>
          )}
          <button
            className="buy"
            disabled={busy || !productId || !buyable || (needsVariant && !variantId)}
            onClick={onAdd}
          >
            {!buyable ? (variantOnlyOOS ? "Slut i denna variant" : "Slutsåld") : busy ? "Lägger till…" : added ? "✓ Tillagd i varukorgen" : "Lägg i kundvagn"}
          </button>

          {!buyable && productId && <RestockForm productId={productId} />}

          {/* Premium leverans-callout — högst upp, direkt under köpknappen, egen
              ruta så den sticker ut (bara i lager). */}
          {inStock && <DeliveryEstimate showStock={buyable} />}

          <div className="pdp-trust">
            <span>
              {/* present = "gratis" (lastbilen äger leverans-callouten ovan) */}
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <polyline points="20 12 20 22 4 22 4 12" />
                <rect x="2" y="7" width="20" height="5" />
                <line x1="12" y1="22" x2="12" y2="7" />
                <path d="M12 7H7.5a2.5 2.5 0 0 1 0-5C11 2 12 7 12 7z" />
                <path d="M12 7h4.5a2.5 2.5 0 0 0 0-5C13 2 12 7 12 7z" />
              </svg>
              Fri frakt över 499 kr
            </span>
            <span>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M9 14L4 9l5-5" />
                <path d="M4 9h11a5 5 0 0 1 5 5v1" />
              </svg>
              30 dagars öppet köp
            </span>
            <span>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M12 2l8 4v6c0 5-3.4 8.5-8 10-4.6-1.5-8-5-8-10V6l8-4Z" />
                <path d="M9 12l2 2 4-4" />
              </svg>
              Trygg betalning med Klarna
            </span>
            <span className="pdp-trust-eu">
              {/* EU-lager: ingen ny importtull/förtullning (1 juli 2026). Sann för
                  HELA sortimentet (ägarens garanti). Texten = single source of truth
                  i lib/shipping.ts; länkar till garanti-sidan med dess gränser. Länken
                  bär en synlig understrykning (inte bara färg) → WCAG 1.4.1. */}
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M12 21s-7-5.2-7-11a7 7 0 0 1 14 0c0 5.8-7 11-7 11Z" />
                <circle cx="12" cy="10" r="2.5" />
              </svg>
              <a href="/eu-lager-garanti">{EU_STOCK_NOTE}</a>
            </span>
          </div>

          {/* Officiella betal-loggor — trygghet i själva köpögonblicket */}
          <PaymentMarks />
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
          <div className="sticky-buy-name">{variantLabel ? `${name} · ${fmtDim(variantLabel)}` : name}</div>
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
