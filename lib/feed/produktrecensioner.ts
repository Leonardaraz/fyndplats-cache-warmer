// lib/feed/produktrecensioner.ts
//
// Produktomdömesflödet till Google Merchant Center (/feed/produktrecensioner.xml),
// i Googles format "Product Reviews Feed" version 2.4.
//
// VARFÖR (Leonard 2026-09-26): kundernas egna omdömen — de som kommer via
// länken i leveransmejlet (/omdome/<token>) — ska till Google. De räknas inte
// mot butikens säljarbetyg (det tar Google bara från sin egen enkät och
// godkända omdömessajter), men de ger PRODUKTBETYG: stjärnor på varorna i
// Shopping-annonserna, när det finns ungefär 50 omdömen totalt.
//
// BARA FÖRSTAHANDSOMDÖMEN. Motorns /api/review-customer lämnar bara rader med
// source === "customer" och synlig status. Importerade leverantörsomdömen får
// aldrig hit — Google kräver omdömen från butikens egna köpare, och samma
// gräns gäller aggregateRating i produktsidans JSON-LD.
//
// ALLA OMDÖMEN, ÄVEN DE DÅLIGA. Google kan stänga av programmet för en butik
// som skickar ett urval. Här filtreras ingenting på betyg.
//
// PRODUKTKOPPLINGEN tas ur Google-flödet (/feed/google.xml): omdömet hör till
// en Wix-produkt (= g:item_group_id), och varje köpbar variant är en egen rad
// med sitt g:id. Alla variantens id skickas som <sku> tillsammans med
// varumärket, så att Merchant Center kan matcha omdömet mot vilken variant som
// helst av varan.
//
// Ren modul (bara node:crypto), så att node:test kan köra den direkt.

import { createHash } from "node:crypto";

export const FLODE_VERSION = "2.4";

/** En rad från motorns /api/review-customer. Bara publika fält. */
export interface EgetOmdome {
  productId: string;
  reviewIdAE: string;
  rating: number;
  text: string;
  initials: string;
  date?: string;
}

export interface FlodesProdukt {
  /** Variantens g:id i Google-flödet — ett per köpbar variant. */
  skus: string[];
  name: string;
  url: string;
}

const ITEM_RE = /<item>[\s\S]*?<\/item>/g;

function tagg(item: string, namn: string): string {
  const m = item.match(new RegExp(`<g:${namn}>([\\s\\S]*?)</g:${namn}>`));
  return m ? m[1].trim() : "";
}

function avkoda(s: string): string {
  return s
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&amp;/g, "&");
}

/**
 * Produkt-id (g:item_group_id) → varianternas id, namn och länk, ur
 * Google-flödets XML. Första radens titel och länk får representera varan.
 */
export function produkterUrGoogleflodet(xml: string): Map<string, FlodesProdukt> {
  const ut = new Map<string, FlodesProdukt>();
  for (const item of xml.match(ITEM_RE) ?? []) {
    const grupp = avkoda(tagg(item, "item_group_id"));
    const id = avkoda(tagg(item, "id"));
    if (!grupp || !id) continue;
    const finns = ut.get(grupp);
    if (finns) {
      if (!finns.skus.includes(id)) finns.skus.push(id);
      continue;
    }
    ut.set(grupp, { skus: [id], name: avkoda(tagg(item, "title")), url: avkoda(tagg(item, "link")) });
  }
  return ut;
}

function esc(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;")
    // Styrtecken utom tab/radbrytning är ogiltiga i XML 1.0 och fäller hela
    // flödet i Merchant Center, inte bara raden.
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, "");
}

/**
 * Omdömets id i flödet. Motorns id bär ordernumret ("kund-10025-<produkt>"),
 * och flödet ligger på en publik adress. En hash är lika stabil — samma
 * omdöme får samma id vid varje hämtning, så Google uppdaterar i stället för
 * att dubblera — men röjer ingenting.
 */
export function flodesId(reviewIdAE: string): string {
  return `fp-${createHash("sha256").update(reviewIdAE).digest("hex").slice(0, 24)}`;
}

export interface FlodesResultat {
  xml: string;
  /** Omdömen som kom med. */
  antal: number;
  /** Omdömen som föll bort, med skäl — loggas av routen, tyst tapp är förbjudet. */
  bortfall: { reviewIdAE: string; skal: "okand_produkt" | "saknar_datum" }[];
}

/**
 * Bygger flödet. Omdömen utan känd produkt eller utan giltigt datum kan inte
 * skickas (Google kräver båda) och redovisas i `bortfall`.
 */
export function byggRecensionsflode(
  omdomen: readonly EgetOmdome[],
  produkter: ReadonlyMap<string, FlodesProdukt>,
  opts: { butik: string; favicon: string; varumarke: string },
): FlodesResultat {
  const bortfall: FlodesResultat["bortfall"] = [];
  const rader: string[] = [];
  for (const o of omdomen) {
    const p = produkter.get(o.productId);
    if (!p) { bortfall.push({ reviewIdAE: o.reviewIdAE, skal: "okand_produkt" }); continue; }
    const t = o.date ? Date.parse(o.date) : NaN;
    if (!Number.isFinite(t)) { bortfall.push({ reviewIdAE: o.reviewIdAE, skal: "saknar_datum" }); continue; }
    const betyg = Math.min(5, Math.max(1, Math.round(Number(o.rating) || 0)));
    const namn = o.initials.trim();
    const recensent = namn
      ? `<name>${esc(namn)}</name>`
      : `<name is_anonymous="true">Verifierad köpare</name>`;
    rader.push(`    <review>
      <review_id>${flodesId(o.reviewIdAE)}</review_id>
      <reviewer>${recensent}</reviewer>
      <review_timestamp>${new Date(t).toISOString()}</review_timestamp>
      <content>${esc(o.text)}</content>
      <review_url type="group">${esc(p.url)}</review_url>
      <ratings>
        <overall min="1" max="5">${betyg}</overall>
      </ratings>
      <products>
        <product>
          <product_ids>
            <skus>
${p.skus.map((s) => `              <sku>${esc(s)}</sku>`).join("\n")}
            </skus>
            <brands>
              <brand>${esc(opts.varumarke)}</brand>
            </brands>
          </product_ids>
          <product_name>${esc(p.name)}</product_name>
          <product_url>${esc(p.url)}</product_url>
        </product>
      </products>
      <is_spam>false</is_spam>
      <collection_method>post_fulfillment</collection_method>
    </review>`);
  }
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<feed xmlns:vc="http://www.w3.org/2007/XMLSchema-versioning" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xsi:noNamespaceSchemaLocation="http://www.google.com/shopping/reviews/schema/product/${FLODE_VERSION}/product_reviews.xsd">
  <version>${FLODE_VERSION}</version>
  <publisher>
    <name>${esc(opts.butik)}</name>
    <favicon>${esc(opts.favicon)}</favicon>
  </publisher>
  <reviews>
${rader.join("\n")}
  </reviews>
</feed>
`;
  return { xml, antal: rader.length, bortfall };
}
