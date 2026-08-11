// GET /feed/google.xml
//
// Google Merchant Center-feed på VARIANTNIVÅ (RSS 2.0 + g:-namespace): en
// <item> per köpbar variant, grupperade med g:item_group_id per produkt.
// Ersätter den externa feed-tjänsten (fyndplats-feed-1.vercel.app) som hade
// två fel: (1) inga additional_image_link → Google såg 1 bild/produkt,
// (2) många små Wix-anrop per request → rate limit → olika många items per
// hämtning (produkter tappades ur Google).
//
// Lösningen här: route-nivå-ISR (revalidate 3600) så Wix anropas EN gång i
// timmen oavsett trafik, batchade V3-anrop med retry/backoff (~2 anrop för
// alla varianter + ~4 för gallerierna), och upp till 10 extra bilder per item
// från produktgalleriet. Länkar pekar ALLTID på den headless-sajten
// (https://www.fyndplats.se/produkt/<slug>) — aldrig Wix-URL:er.
//
// /feed/products.xml (produktnivå) behålls orörd för Meta/Pinterest/TikTok.

import {
  getProducts,
  getCollections,
  fetchAllVariantsRaw,
  fetchFeedGalleries,
  imgKey,
  type Collection,
  type Product,
} from "@/lib/products";

export const runtime = "nodejs";
export const revalidate = 3600;

const SITE = "https://www.fyndplats.se";
// Hårdkodat med flit, inte av lättja: 452 av 454 produkter har INGET varumärke
// satt i Wix (räknat 2026-07-31). Det är omärkta dropship-varor, och för dem är
// säljaren det närmaste ett varumärke som finns — g:identifier_exists=no säger
// redan åt Google att GTIN/MPN saknas.
// Bara 2 produkter (HOMCOM, IMILAB) har ett riktigt märke, och varken
// lib/products.ts Product eller productData i query-variants bär fältet, så att
// plumba igenom det vore ny hämtningslogik för två rader. Börjar Leonard fylla
// i varumärken i Wix är det värt att ta då — inte förrän.
const BRAND = "Fyndplats";

function xmlEscape(s: string): string {
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

// Avkoda vanliga HTML-entiteter (seoDescription kan innehålla &amp; m.fl.)
// INNAN vi XML-escapar — annars dubbel-escapas de (&amp;amp;).
function decodeEntities(s: string): string {
  return String(s)
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;|&apos;/gi, "'")
    .replace(/\s+/g, " ")
    .trim();
}

// Kategorislug → Googles produkttaxonomi-ID (audit 2026-08-11: attributet
// saknades helt, 0/916 items — Google fick gissa kategori själv). BARA säkra,
// vedertagna toppnivå-/välkända ID:n; blandkategorier (barn-familj, bil-cykel)
// utelämnas MEDVETET — fel kategori är sämre än ingen (Google gissar då rätt
// oftare själv). Fullständig taxonomi: google.com/basepages/producttype/taxonomy.txt
const GOOGLE_CATEGORY_BY_SLUG: Record<string, number> = {
  // Hem & trädgård (536 = Home & Garden)
  "hem-inredning": 536,
  "dekoration-prydnad": 696,        // Home & Garden > Decor
  "forvaring-organisering": 536,
  "badrum-hemtextil": 536,
  "tradgard-utemobler": 536,
  belysning: 594,                    // Home & Garden > Lighting
  hushallsapparater: 604,            // Home & Garden > Household Appliances
  "kok-husgerad": 638,               // Home & Garden > Kitchen & Dining
  "koksredskap-tillbehor": 638,
  "koksmaskiner-apparater": 730,     // … > Kitchen Appliances
  "servering-glas": 638,
  // Husdjur (1 = Animals & Pet Supplies, 2 = … > Pet Supplies)
  husdjur: 1,
  "burar-klader-tillbehor": 2,
  "lek-tillbehor-for-husdjur": 2,
  "mat-vattenskalar": 2,
  "selar-koppel-transport": 2,
  // Barn & leksaker
  "leksaker-spel": 1239,             // Toys & Games
  "baby-smabarn": 537,               // Baby & Toddler
  "kalas-fest": 96,                  // Arts & Entertainment > Party & Celebration
  // Skönhet & hälsa (469 = Health & Beauty)
  "skonhet-halsa": 469,
  "hudvard-ansikte": 469,
  "har-rakning": 469,
  "kropp-valbefinnande": 469,
  "massage-aterhamtning": 469,
  // Sport & fritid (988 = Sporting Goods)
  "sport-fritid": 988,
  "traning-gym": 990,                // Sporting Goods > Exercise & Fitness
  "friluftsliv-resa": 988,
  // Elektronik & verktyg
  "elektronik-tillbehor": 222,       // Electronics
  "dator-gaming": 222,
  mobiltillbehor: 222,
  "verktyg-hemmafix": 632,           // Hardware
  // Mode
  "mode-accessoarer": 166,           // Apparel & Accessories
  "vaskor-necessarer": 5181,         // Luggage & Bags
};

/** Produktens taxonomi för feeden: g:product_type = kategoristigen ("Husdjur >
 *  Burar, kläder & tillbehör" — barnkategori föredras, den är mest specifik)
 *  och g:google_product_category via slug-mappningen ovan. */
function taxonomyFor(
  product: Product | undefined,
  byColId: Map<string, Collection>,
): { productType?: string; googleCategory?: number } {
  const ids = product?.collectionIds || [];
  const mine = ids.map((id) => byColId.get(id)).filter((c): c is Collection => Boolean(c));
  if (mine.length === 0) return {};
  const child = mine.find((c) => c.parentId) || mine[0];
  const parent = child.parentId ? byColId.get(child.parentId) : undefined;
  const productType = parent && parent.id !== child.id ? `${parent.name} > ${child.name}` : child.name;
  const googleCategory =
    GOOGLE_CATEGORY_BY_SLUG[child.slug] ?? (parent ? GOOGLE_CATEGORY_BY_SLUG[parent.slug] : undefined);
  return { productType, googleCategory };
}

// Google-attribut per optionsnamn. Svenska (katalogens options är översatta
// vid import) + engelska råformer som säkerhetsnät för äldre produkter.
function googleAttr(optionName: string): "color" | "size" | "material" | "pattern" | null {
  const n = optionName.trim().toLowerCase();
  if (n === "färg" || n === "color" || n === "colour") return "color";
  if (n === "storlek" || n === "längd" || n === "size" || n === "length") return "size";
  if (n === "material") return "material";
  if (n === "mönster" || n === "pattern") return "pattern";
  return null;
}

/* eslint-disable @typescript-eslint/no-explicit-any */
function feedItem(
  v: any,
  product: Product | undefined,
  gallery: string[],
  taxonomy: { productType?: string; googleCategory?: number },
): string | null {
  const pd = v?.productData || {};
  const slug: string = pd.slug || product?.slug || "";
  if (!slug || pd.visible === false || v?.visible === false) return null;

  const productName: string = pd.name || product?.name || "";
  const choices: { option: string; choice: string }[] = (v?.optionChoices || [])
    .map((oc: any) => ({
      option: oc?.optionChoiceNames?.optionName || "",
      choice: oc?.optionChoiceNames?.choiceName || "",
    }))
    .filter((c: any) => c.choice);

  const suffix = choices.map((c) => c.choice).join(" / ");
  const title = (suffix ? `${productName} - ${suffix}` : productName).slice(0, 150);

  const amount = Number(v?.price?.actualPrice?.amount);
  if (!Number.isFinite(amount) || amount <= 0) return null;

  // Rea: Google vill ha ORDINARIE pris i g:price och det nedsatta i
  // g:sale_price — då ritas överstrykningen i Shopping. Feeden skickade förut
  // bara actualPrice som g:price: rätt belopp (kunden luras aldrig), men utan
  // "förut 2 999 kr" syns inte att det ÄR ett fynd.
  //
  // compareAtPrice ligger redan i svaret från query-variants som feeden ändå
  // anropar → noll extra requests. Kravet cmp > amount är medvetet strikt:
  // ett compareAt som är lika med eller lägre än priset är inte en rea, och
  // Google avvisar sale_price >= price.
  const cmp = Number(v?.price?.compareAtPrice?.amount);
  const onSale = Number.isFinite(cmp) && cmp > amount;
  const regular = onSale ? cmp : amount;

  const mainImg: string = product?.img || gallery[0] || "";
  const image: string = v?.media?.image?.url || mainImg;
  if (!image) return null;

  // Extra bilder: galleriet exkl. huvudbilden OCH exkl. den valda item-bilden,
  // dedupat på fil-id (samma foto förekommer med olika transform-params), max 10.
  const seen = new Set<string>([imgKey(image), imgKey(mainImg)]);
  const additional = gallery
    .filter((g) => {
      if (!g) return false;
      const k = imgKey(g);
      if (seen.has(k)) return false;
      seen.add(k);
      return true;
    })
    .slice(0, 10)
    .map((g) => `\n      <g:additional_image_link>${xmlEscape(g)}</g:additional_image_link>`)
    .join("");

  // RIKARE beskrivning (audit 2026-08-11): feeden skickade bara seoDescription —
  // metabeskrivningen på ~150 tecken — vilket gav Google nästan inget att matcha
  // sökfrågor mot (median 147 tecken över hela feeden). blurb (första stycket ur
  // produktbeskrivningen) och specs (specifikationssektionen) finns redan i
  // Product utan extra API-anrop. Dubblettskydd: en del som redan ingår i den
  // ackumulerade texten hoppas över (seoDescription inleder ofta som blurb).
  const descParts: string[] = [];
  const pushDesc = (t?: string) => {
    const clean = decodeEntities(t || "");
    if (clean.length < 20) return;
    const acc = descParts.join(" ").toLowerCase();
    if (acc.includes(clean.slice(0, 60).toLowerCase())) return;
    descParts.push(clean);
  };
  pushDesc(product?.seoDescription || pd.seoDescription);
  pushDesc(product?.blurb);
  pushDesc(product?.specs);
  const description = (descParts.join(" ") || decodeEntities(productName)).slice(0, 5000);

  // Variant-attribut: Färg→color, Storlek/Längd→size, Material→material,
  // Mönster→pattern. Custom-options (Modell, Paket …) ligger redan i titeln;
  // som särskiljande fallback sätts g:size till valnamnen om size saknas
  // (Google kräver minst ett särskiljande attribut per item_group).
  const attrs: Record<string, string> = {};
  const custom: string[] = [];
  for (const c of choices) {
    const a = googleAttr(c.option);
    if (a) { if (!attrs[a]) attrs[a] = c.choice; }
    else custom.push(c.choice);
  }
  if (!attrs.size && custom.length) attrs.size = custom.join(" / ");
  const attrLines = (["color", "size", "material", "pattern"] as const)
    .filter((a) => attrs[a])
    .map((a) => `\n      <g:${a}>${xmlEscape(attrs[a])}</g:${a}>`)
    .join("");

  const sku: string = v?.sku || "";
  const inStock = v?.inventoryStatus?.inStock !== false;

  return `    <item>
      <g:id>${xmlEscape(v.id || v.variantId)}</g:id>
      <g:item_group_id>${xmlEscape(pd.productId || "")}</g:item_group_id>
      <g:title>${xmlEscape(title)}</g:title>
      <g:description>${xmlEscape(description)}</g:description>
      <g:link>${xmlEscape(`${SITE}/produkt/${slug}`)}</g:link>
      <g:image_link>${xmlEscape(image)}</g:image_link>${additional}
      <g:availability>${inStock ? "in_stock" : "out_of_stock"}</g:availability>
      <g:price>${regular.toFixed(2)} SEK</g:price>${onSale ? `\n      <g:sale_price>${amount.toFixed(2)} SEK</g:sale_price>` : ""}
      <g:brand>${BRAND}</g:brand>
      <g:condition>new</g:condition>
      <g:identifier_exists>no</g:identifier_exists>${sku ? `\n      <g:mpn>${xmlEscape(sku)}</g:mpn>` : ""}${attrLines}${taxonomy.productType ? `\n      <g:product_type>${xmlEscape(taxonomy.productType)}</g:product_type>` : ""}${taxonomy.googleCategory ? `\n      <g:google_product_category>${taxonomy.googleCategory}</g:google_product_category>` : ""}
    </item>`;
}

export async function GET() {
  // Tre batchade, cachade källor — inga per-produkt-anrop:
  //   getProducts()        → visible-filtrerad katalog (seoDescription, img, slug)
  //   fetchFeedGalleries() → fulla gallerier, id → URL:er (~4 anrop)
  //   fetchAllVariantsRaw()→ alla varianter (~2 anrop, retry/backoff)
  let products: Product[] = [];
  try { products = await getProducts(); } catch { products = []; }
  const byId = new Map(products.map((p) => [p.id, p]));
  // Kollektioner → g:product_type + g:google_product_category. Best-effort:
  // utan kollektioner skickas items som förut (bara utan taxonomi-fälten).
  let byColId = new Map<string, Collection>();
  try {
    const collections = await getCollections();
    byColId = new Map(collections.map((c: Collection) => [c.id, c]));
  } catch { /* taxonomin är berikning — får aldrig fälla feeden */ }
  const galleries = await fetchFeedGalleries();
  const variants = await fetchAllVariantsRaw();

  const items: string[] = [];
  const taxonomyCache = new Map<string, { productType?: string; googleCategory?: number }>();
  for (const v of variants) {
    const pid = v?.productData?.productId || "";
    let taxonomy = taxonomyCache.get(pid);
    if (!taxonomy) {
      taxonomy = taxonomyFor(byId.get(pid), byColId);
      taxonomyCache.set(pid, taxonomy);
    }
    const line = feedItem(v, byId.get(pid), galleries.get(pid) || [], taxonomy);
    if (line) items.push(line);
  }

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:g="http://base.google.com/ns/1.0">
  <channel>
    <title>Fyndplats</title>
    <link>${SITE}</link>
    <description>Fyndplats produktkatalog för Google Merchant Center – noga utvalda fynd till smarta priser.</description>
${items.join("\n")}
  </channel>
</rss>`;

  return new Response(xml, {
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
      "Cache-Control": "public, max-age=3600, s-maxage=3600, stale-while-revalidate=86400",
    },
  });
}
