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

import { KAMPANJ_2026_09 } from "../../../lib/kampanj-2026-09";

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
  // Möbler (436 = Furniture). Underkategorierna får samma toppnivå-ID: de
  // specifika under-ID:na (stolar, soffor, sängar) är inte verifierade här,
  // och regeln ovan gäller — fel kategori är sämre än en bred rätt.
  mobler: 436,
  kontorsstolar: 436,
  fatoljer: 436,
  "soffor-baddsoffor": 436,
  "matbord-stolar": 436,
  skrivbord: 436,
  "soffbord-smabord": 436,
  "sangar-sovrum": 436,
  rumsavdelare: 436,
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
  // Sökordskategorierna 2026-09-24. taxonomyFor tar produktens FÖRSTA under-
  // kategori, och en omappad sådan faller tillbaka på föräldern — för Barn &
  // Familj (medvetet omappad) blir det INGEN kategori alls. Utan raderna nedan
  // hade t.ex. en elbil som förut fick 1239 via leksaker-spel tappat den. Varje
  // ID är alltså samma som produkterna redan fick via sin tidigare kategori.
  klostrad: 2,
  kattlador: 2,
  katthus: 2,
  hundkojor: 2,
  "hundbaddar-hundsoffor": 2,
  hundburar: 2,
  "elbilar-for-barn": 1239,
  "sparkcyklar-for-barn": 1239,
  leksakskok: 1239,
  sandlador: 1239,
  "gunghastar-gungdjur": 1239,
  "redskapsbodar-forrad": 536,
  garagetalt: 536,
  // Säsongskategorierna 2026-09-24. Här är ID:na SMALARE än förut, och vart
  // och ett är kontrollerat mot Googles egen taxonomifil (taxonomy-with-ids,
  // sv-SE och en-US) samma dag. Före: halloweenfigurerna låg i Kalas & Fest
  // (96 Party & Celebration) och Trädgårdsdekor (536), juldekorationerna och
  // konstväxterna i Dekoration & Prydnad (696 Decor), eldkorgarna i Grill &
  // Utekök (536 via Trädgård). Vilket ID en produkt får beror på dess FÖRSTA
  // underkategori, så alla byter inte.
  halloweendekoration: 596,         // Decor > Seasonal & Holiday Decorations
  juldekoration: 596,
  konstvaxter: 6265,                // Decor > Artificial Flora
  "eldkorgar-eldstader": 2918,      // Lawn & Garden > Outdoor Living
  // Två av Trädgårds underkategorier där hela sortimentet ryms i en smalare
  // kategori; resten faller som förut tillbaka på tradgard-utemobler (536).
  utemobler: 4299,                  // Furniture > Outdoor Furniture
  "terrassvarmare-infravarmare": 2649, // … > Climate Control Appliances > Patio Heaters
  // Sökordskategorierna i runda S7 (2026-09-24). Varje ID är kontrollerat mot
  // Googles taxonomifil (sv-SE och en-US) samma dag och är smalare än
  // förälderns: 536 Home & Garden, 436 Furniture, 638 Kitchen & Dining,
  // 988 Sporting Goods. Samma regel som ovan: det är produktens FÖRSTA
  // underkategori som avgör, så alla produkter byter inte.
  badrumsskap: 6356,                // Furniture > Cabinets & Storage
  golvlampor: 4636,                 // Home & Garden > Lighting > Lamps
  elkaminer: 6792,                  // Home & Garden > Fireplaces
  varmeflaktar: 611,                // … > Climate Control Appliances > Space Heaters
  "verktygsvagnar-verktygslador": 3974, // Hardware > … > Tool Storage & Organization
  baddfatoljer: 6499,               // Furniture > Chairs > Arm Chairs, Recliners & Sleeper Chairs
  massagestolar: 1442,              // … > Massage & Relaxation > Massage Chairs
  "tv-bankar": 457,                 // Furniture > Entertainment Centers & TV Stands
  "skoskap-skobankar": 5559,        // … > Clothing & Closet Storage > Shoe Racks & Organizers
  "koksoar-koksvagnar": 442,        // Furniture > Carts & Islands
  boxningssackar: 499720,           // … > Boxing & Martial Arts Training Equipment
  // Runda S8 (2026-09-24), samma kontroll mot taxonomifilen. Hönshus saknar
  // egen nod; 6991 Animal Husbandry är där äggkläckare och hönsfoder ligger.
  "kaninburar-marsvinsburar": 5017, // … > Small Animal Supplies > Small Animal Habitats & Cages
  "hamsterburar-gnagarburar": 5017, // samma nod
  terrarier: 5029,                  // … > Reptile & Amphibian Supplies > Reptile & Amphibian Habitats
  "honshus-honsgardar": 6991,       // Business & Industrial > Agriculture > Animal Husbandry
  hundvagnar: 6276,                 // Animals & Pet Supplies > Pet Supplies > Pet Strollers
  "vedstall-vedbodar": 695,         // Home & Garden > Fireplace & Wood Stove Accessories > Log Racks & Carriers
  // Runda S9 (2026-09-24), samma kontroll. Träning & Gym behåller 990.
  "hantlar-hantelset": 3164,        // … > Weight Lifting > Free Weights
  traningsbankar: 499795,           // Sporting Goods > Exercise & Fitness > Exercise Benches
  motionscyklar: 994,               // … > Cardio > Cardio Machines > Exercise Bikes
  // Runda S10 (2026-09-24), samma kontroll. Badrumsspeglar har ingen egen nod
  // och delar Mirrors med Speglar; 730 Kitchen Appliances rymmer både
  // vattenkokare och brödrostar, eftersom de flesta produkterna är set.
  speglar: 595,                     // Home & Garden > Decor > Mirrors
  badrumsspeglar: 595,              // samma nod
  sidobord: 6369,                   // Furniture > Tables > Accent Tables (sv: Sidobord)
  nattduksbord: 462,                // Furniture > Tables > Nightstands
  byraer: 4195,                     // Furniture > Cabinets & Storage > Dressers
  bokhyllor: 465,                   // Furniture > Shelving > Bookcases & Standing Shelves
  tvattkorgar: 634,                 // … > Laundry Supplies > Laundry Baskets
  "vattenkokare-brodrostar": 730,   // Home & Garden > Kitchen & Dining > Kitchen Appliances
  // Runda S11 (2026-09-24), samma kontroll. Pallar har ingen egen nod för
  // stegpallar, duschpallar och rullpallar tillsammans, så de får Chairs.
  // Vinställ & vinkylar får Kitchen & Dining och inte Wine Racks: sidan har
  // också vinkylar, en köksö och en köksvagn, och taxonomyFor tar produktens
  // första underkategori. Wine Racks hade klassat köksön som ett vinställ.
  pallar: 443,                      // Furniture > Chairs
  "sittpuffar-fotpallar": 458,      // Furniture > Ottomans (sv: Fotpallar)
  "kladhangare-hallmobler": 5708,   // Home & Garden > Decor > Coat & Hat Racks
  "sideboards-vitrinskap": 447,     // Furniture > Cabinets & Storage > Buffets & Sideboards
  "vinstall-vinkylar": 638,         // Home & Garden > Kitchen & Dining
  barnmobler: 554,                  // Furniture > Baby & Toddler Furniture
  projektordukar: 395,              // … > Projector Accessories > Projection Screens
  // Runda S12 (2026-09-24), samma kontroll. Massage & Återhämtning och
  // Kropp & Välbefinnande behåller 469: de blandar stolar, bänkar och hjälpmedel.
  massagebankar: 2074,              // … > Massage & Relaxation > Massage Tables (sv: Massagebord)
  // Runda S13 (2026-09-24), samma kontroll. Barbord får Kitchen & Dining Room
  // Tables: de flesta är set, och Google klassar ett set efter huvudprodukten.
  // Matgrupper har en egen setnod. Skärmtak saknar egen nod; Awnings är
  // närmast (sv-etiketten är Markiser).
  soptunnor: 637,                   // … > Waste Containment > Trash Cans & Wastebaskets
  "miniugnar-airfryers": 761,       // … > Toasters & Grills > Countertop & Toaster Ovens
  barbord: 4355,                    // Furniture > Tables > Kitchen & Dining Room Tables
  snurrfatoljer: 6499,              // Furniture > Chairs > Arm Chairs, Recliners & Sleeper Chairs
  oronlappsfatoljer: 6499,          // samma nod
  matgrupper: 6347,                 // Furniture > Furniture Sets > Kitchen & Dining Furniture Sets
  hornskrivbord: 4191,              // Furniture > Office Furniture > Desks
  "skarmtak-entretak": 499907,      // … > Lawn & Garden > Outdoor Living > Awnings
  gnistskydd: 2365,                 // … > Fireplace & Wood Stove Accessories > Fireplace Screens
  elementskydd: 7110,               // … > Household Appliance Accessories > Heating Radiator Accessories
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

/**
 * Prisband för Shopping-kampanjens budgivning (custom_label_0). Räknas på det
 * pris kunden betalar, så bandet följer med när priset ändras — därför ligger
 * det i feeden och inte i en uppladdad fil.
 */
function prisband(pris: number): string {
  if (pris < 500) return "under_500";
  if (pris < 1000) return "500_1000";
  if (pris < 2000) return "1000_2000";
  if (pris < 4000) return "2000_4000";
  if (pris < 8000) return "4000_8000";
  return "8000_plus";
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

  // Anpassade etiketter för Shopping-kampanjen (2026-09-16): prisband ur det
  // pris kunden betalar, kampanjflagga och A/B-grupp ur lib/kampanj-2026-09.
  // Bara etiketter Google Ads styr bud på — inga leverantörsuppgifter.
  const kampanj = KAMPANJ_2026_09[pd.productId || ""];
  const labelLines =
    `\n      <g:custom_label_0>${prisband(amount)}</g:custom_label_0>` +
    (kampanj
      ? `\n      <g:custom_label_1>kampanj-2026-09</g:custom_label_1>\n      <g:custom_label_2>grupp-${kampanj}</g:custom_label_2>`
      : "");

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

  // ☠️ INGEN g:mpn (2026-09-15, GOOGLE-SHOPPING-BRIEF §5 beslut 3). Feeden
  // skickade Wix-variantens SKU ("FP-…") som mpn. Det är vårt eget nummer och
  // läcker inget, men Google förväntar sig INGEN mpn på en rad som säger
  // identifier_exists=no — de två motsäger varandra, och ett påhittat mpn är
  // exakt vad Googles spec förbjuder ("tillverkarens tilldelade MPN").
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
      <g:condition>new</g:condition>${labelLines}
      <g:identifier_exists>no</g:identifier_exists>${attrLines}${taxonomy.productType ? `\n      <g:product_type>${xmlEscape(taxonomy.productType)}</g:product_type>` : ""}${taxonomy.googleCategory ? `\n      <g:google_product_category>${taxonomy.googleCategory}</g:google_product_category>` : ""}
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
    // Galleriet ur V3-svepet, annars produktens eget (upp till 6 bilder ur
    // listningen), samma reserv som /feed/products.xml. Utan reserven fick
    // 2 836 av 3 393 produkter NOLL extrabilder (2026-09-24): svepet läser bara
    // de 1 200 nyaste produkterna, och drygt hälften av dem är dolda utkast.
    const gallery = galleries.get(pid) || byId.get(pid)?.gallery || [];
    const line = feedItem(v, byId.get(pid), gallery, taxonomy);
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
