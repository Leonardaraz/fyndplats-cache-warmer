// Google Shopping-feeden (Merchant Center) — ren logik, ingen IO.
//
// BAKGRUNDEN (2026-09-15). Marknadsplan v3: annonsera Aosom-produkterna där vi
// är billigare än dealproffsen i Google Shopping. Merchant Center hämtar en
// TSV-fil från en hemlig adress (app/api/feed/google-shopping) och den här
// modulen bygger raderna ur mappningarna och butikens produktdata.
//
// Beslut som är fattade (GOOGLE-SHOPPING-BRIEF.md §5, ska inte omprövas):
//   brand = Fyndplats, identifier_exists = no, ingen mpn, bara Aosom, bara
//   publicerade sidor, länken byggs på slugen (wix-id:t ger 404).
//
// Fem egenskaper som inte ska tas bort:
//
//   1. ☠️ FEEDEN BÄR ALDRIG AOSOMS ARTIKELNUMMER. Det är samma sträng
//      dealproffsen publicerar som sku/mpn; läcker vi den joinas vår sida mot
//      deras och därmed mot vårt inköpsled. En rad vars text bär formen
//      NNN-NNNXX (eller radens eget artikelnummer) tas UR feeden och räknas i
//      `artikelnummerIText` — hellre en produkt färre än ett läckt nummer.
//      Ett test låser det.
//   2. ☠️ ALDRIG LEVERANTÖRENS HUSMÄRKEN i titel eller beskrivning. Samma
//      lista som SKU-bygget (HOMCOM, Outsunny, PawHut, …). Orden rensas och
//      raden räknas i `varumarkeRensat` så poleringen kan hitta dem.
//   3. ☠️ PRISET ÄR BUTIKENS, inte mappningens. Merchant Center avvisar en
//      produkt vars feed-pris skiljer sig från landningssidan, och mappningens
//      `grossSek` är vad vi TROR att kunden ser. Facit är Wix — samma regel
//      som `jamforelsePris` i synken.
//   4. ☠️ EN PRODUKT SOM SAKNAR NÅGOT UTELÄMNAS OCH RÄKNAS, den gissas aldrig
//      ihop. Ingen slug, inget pris, ingen bild, inte publicerad → egen räknare
//      per orsak. En feed som tyst hoppar över är samma klass som en avkortad
//      produktlista.
//   5. ☠️ INGET INKÖPSPRIS, INGEN FRAKTANDEL, INGEN KOSTNAD i feeden. Raden
//      bär custom_labels för annonsstyrningen (grupp, prisband, konkurrensläge)
//      — inte för bokföringen.
//
// Storleken är en gräns, inte en bekvämlighet: Vercel kapar svar över ~4,5 MB,
// och ~2 000 rader med hela beskrivningar och tio bilder hade passerat den.
// Därför BESKRIVNING_MAX_TECKEN och MAX_EXTRA_BILDER.

import type { ProductMappingRecord } from "../store";
import { isAliExpressMapping } from "../store/supplier";
import type { Prisgrupp } from "../pricing/konkurrentregel";

export const BUTIK_BAS = "https://www.fyndplats.se";
export const VARUMARKE = "Fyndplats";
/** Fri frakt över det här beloppet — under det lämnas fraktfältet till kontots inställning. */
export const FRI_FRAKT_FRAN_SEK = 499;
/** Leveranslöftet 3–7 arbetsdagar: hantering 0–1 dag, transport 3–6. */
export const FRAKT = "SE:::0.00 SEK:0:1:3:6";
export const TITEL_MAX_TECKEN = 150;
export const BESKRIVNING_MAX_TECKEN = 1500;
export const MAX_EXTRA_BILDER = 5;

/**
 * Leverantörens husmärken. Speglar KNOWN_BRAND_TOKENS i lib/import/sku.ts —
 * hålls här som en separat lista med flit, för feeden får inte vara beroende av
 * SKU-bygget och ett test fäller om listorna glider isär.
 */
export const HUSMARKEN = [
  "homcom", "outsunny", "pawhut", "vinsetto", "kleankin", "zonekiz", "durhand",
  "aiyaplay", "sportnow", "aosom",
];

/**
 * Aosoms artikelnummer: tre tecken, bindestreck, tre siffror, ibland "V" + två
 * siffror, och två versaler för färgen (845-030CG, 83B-129V00GY, A91-268V00BK).
 *
 * ⚠️ MEDVETET SNÄVT och skiftlägeskänsligt. En bredare form ("tre tecken,
 * bindestreck, fem till sju tecken") hade träffat "100-150cm" i varenda
 * måttangivelse och kastat ut halva sortimentet. Radens EGET nummer kollas
 * dessutom exakt, oavsett form.
 */
export const ARTIKELNUMMER_FORM = /\b[0-9A-Z]{3}-\d{3}(?:V\d{2})?[A-Z]{2}\b/;

/** Vad feeden behöver från butiken per produkt. Hämtas i bulk av `listV3FeedProducts`. */
export interface FeedProdukt {
  id: string;
  namn: string;
  slug: string;
  visible: boolean;
  /** HTML-brödtext. Tom = saknar beskrivning. */
  beskrivningHtml: string;
  /** Bildadresser i galleriordning, huvudbilden först. */
  bilder: string[];
  /** Butikens pris, eller null när det inte är entydigt. */
  prisSek: number | null;
  /** Wix `inventory.availabilityStatus`, t.ex. IN_STOCK / OUT_OF_STOCK. */
  lagerstatus: string | null;
}

export interface FeedRad {
  id: string;
  title: string;
  description: string;
  link: string;
  image_link: string;
  additional_image_link: string;
  availability: "in_stock" | "out_of_stock";
  price: string;
  brand: string;
  condition: "new";
  identifier_exists: "no";
  product_type: string;
  shipping: string;
  custom_label_0: string;
  custom_label_1: string;
  custom_label_2: string;
}

export const KOLUMNER: (keyof FeedRad)[] = [
  "id", "title", "description", "link", "image_link", "additional_image_link",
  "availability", "price", "brand", "condition", "identifier_exists",
  "product_type", "shipping", "custom_label_0", "custom_label_1", "custom_label_2",
];

export interface FeedUtfall {
  rader: FeedRad[];
  /** Räknare per orsak. Summan av dem plus `rader.length` är antalet Aosom-mappningar. */
  ejAosom: number;
  utanProdukt: number;
  ejPublicerad: number;
  utanSlug: number;
  utanPris: number;
  utanBild: number;
  /** Raden hade burit ett artikelnummer i titel eller text — utelämnad, med flit. */
  artikelnummerIText: number;
  /** Rader där ett husmärke rensades ur titel/text (raden är MED). */
  varumarkeRensat: number;
  perGrupp: Record<Prisgrupp | "ingen", number>;
  perKonkurrenslage: Record<string, number>;
}

/** HTML → text: taggar bort, entiteter tillbaka, blanksteg ihop. */
export function htmlTillText(html: string): string {
  return html
    .replace(/<br\s*\/?>|<\/p>|<\/li>|<\/h[1-6]>|<\/div>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&quot;/gi, "\"")
    .replace(/&#39;|&apos;/gi, "'")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/\s+/g, " ")
    .trim();
}

const HUSMARKE_RE = new RegExp(`\\b(${HUSMARKEN.join("|")})\\b`, "gi");

/** Tar bort leverantörens husmärken. Svarar med texten och om något rensades. */
export function rensaHusmarken(text: string): { text: string; rensat: boolean } {
  const rensad = text.replace(HUSMARKE_RE, "").replace(/\s{2,}/g, " ").replace(/\s+([,.;:])/g, "$1").trim();
  return { text: rensad, rensat: rensad !== text.trim() };
}

/** Kapar märkbart: ett kapat fält slutar på ellips, aldrig mitt i ett ord utan tecken. */
export function kapa(text: string, max: number): string {
  if (text.length <= max) return text;
  return text.slice(0, max - 1).trimEnd() + "…";
}

export function prisband(pris: number): string {
  if (pris < 500) return "under_500";
  if (pris < 1000) return "500_1000";
  if (pris < 2000) return "1000_2000";
  if (pris < 4000) return "2000_4000";
  if (pris < 8000) return "4000_8000";
  return "8000_plus";
}

/**
 * Konkurrensläget styr annonsurvalet: en rad som ligger ÖVER dealproffsen ska
 * inte få klick vi förlorar, och en rad utan jämförelse vet vi inget om.
 */
export function konkurrenslage(pris: number, konkurrent: ProductMappingRecord["konkurrent"]): string {
  if (!konkurrent || !(konkurrent.pris > 0)) return "ingen_jamforelse";
  return pris <= konkurrent.pris ? "under_dealproffsen" : "over_dealproffsen";
}

/** TSV-säkert fält: tabb och radbrytning blir blanksteg. */
export function tsvFalt(s: string): string {
  return s.replace(/[\t\r\n]+/g, " ");
}

export function tillTsv(rader: readonly FeedRad[]): string {
  const ut = [KOLUMNER.join("\t")];
  for (const r of rader) ut.push(KOLUMNER.map((k) => tsvFalt(String(r[k] ?? ""))).join("\t"));
  return ut.join("\n") + "\n";
}

export function byggFeed(
  mappningar: readonly ProductMappingRecord[],
  produkter: ReadonlyMap<string, FeedProdukt>,
): FeedUtfall {
  const ut: FeedUtfall = {
    rader: [],
    ejAosom: 0,
    utanProdukt: 0,
    ejPublicerad: 0,
    utanSlug: 0,
    utanPris: 0,
    utanBild: 0,
    artikelnummerIText: 0,
    varumarkeRensat: 0,
    perGrupp: { A: 0, B: 0, ingen: 0 },
    perKonkurrenslage: {},
  };

  for (const m of mappningar) {
    if (isAliExpressMapping(m)) {
      ut.ejAosom++;
      continue;
    }
    const p = produkter.get(m.wixProductId);
    if (!p) {
      ut.utanProdukt++;
      continue;
    }
    if (!p.visible) {
      ut.ejPublicerad++;
      continue;
    }
    if (!p.slug) {
      ut.utanSlug++;
      continue;
    }
    if (p.prisSek === null || !(p.prisSek > 0)) {
      ut.utanPris++;
      continue;
    }
    const bilder = p.bilder.filter((b) => /^https?:\/\//i.test(b));
    if (bilder.length === 0) {
      ut.utanBild++;
      continue;
    }

    const titelRensad = rensaHusmarken(htmlTillText(p.namn));
    const textRensad = rensaHusmarken(htmlTillText(p.beskrivningHtml));
    const title = kapa(titelRensad.text, TITEL_MAX_TECKEN);
    const description = kapa(textRensad.text || titelRensad.text, BESKRIVNING_MAX_TECKEN);

    // ☠️ Punkt 1 i filhuvudet. Radens EGET artikelnummer (utan "aosom:") och
    // den allmänna formen — båda, för en polerad text kan bära ett annat
    // artikelnummer än radens (tillbehör, "passar till").
    // Det egna numret kollas exakt när det är långt nog att inte vara en
    // slump — Aosoms är alltid åtta tecken eller fler; "1" i "4-i-1" är inget nummer.
    const eget = (m.supplierProductId ?? "").replace(/^aosom:/, "").trim();
    const text = `${title} ${description}`;
    const egetITexten = eget.length >= 6 && text.toUpperCase().includes(eget.toUpperCase());
    if (ARTIKELNUMMER_FORM.test(text) || egetITexten) {
      ut.artikelnummerIText++;
      continue;
    }
    if (titelRensad.rensat || textRensad.rensat) ut.varumarkeRensat++;

    const pris = p.prisSek;
    const lage = konkurrenslage(pris, m.konkurrent);
    const grupp = m.prisgrupp ?? "ingen";
    ut.perGrupp[grupp]++;
    ut.perKonkurrenslage[lage] = (ut.perKonkurrenslage[lage] ?? 0) + 1;

    const iLager = (p.lagerstatus ?? "IN_STOCK").toUpperCase() === "IN_STOCK";
    const typ = m.categorySuggestion?.status === "auto" ? (m.categorySuggestion.collectionName ?? "") : "";

    ut.rader.push({
      id: m.wixProductId,
      title,
      description,
      link: `${BUTIK_BAS}/produkt/${encodeURIComponent(p.slug)}`,
      image_link: bilder[0],
      additional_image_link: bilder.slice(1, 1 + MAX_EXTRA_BILDER).join(","),
      availability: iLager ? "in_stock" : "out_of_stock",
      price: `${pris.toFixed(2)} SEK`,
      brand: VARUMARKE,
      condition: "new",
      identifier_exists: "no",
      product_type: typ,
      shipping: pris >= FRI_FRAKT_FRAN_SEK ? FRAKT : "",
      custom_label_0: m.prisgrupp ?? "",
      custom_label_1: prisband(pris),
      custom_label_2: lage,
    });
  }
  return ut;
}
