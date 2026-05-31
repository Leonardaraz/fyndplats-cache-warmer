// Räknar ut flik-status (vilka tabbade PDP-sektioner som finns) för alla
// produkter — underlag för /admin/enrich-products. Läser produkternas
// beskrivnings-HTML via den anonyma storefront-klienten (samma publika OAuth som
// lib/products.ts — ingen WIX_API_KEY behövs för listningen) och letar efter
// samma <h2>-mönster som storefronten splittar på (productview.tsx).
import { createClient, OAuthStrategy } from "@wix/sdk";
import { products as wixProducts } from "@wix/stores";
import { getCollections } from "./products";

// Publik (icke-hemlig) Headless-OAuth-client-id — identisk med lib/products.ts.
const CLIENT_ID = "3d8fdd09-3b3c-475f-aac2-b6bfa9e05153";
const wix = createClient({ modules: { products: wixProducts }, auth: OAuthStrategy({ clientId: CLIENT_ID }) });

// MÅSTE matcha components/productview.tsx FLIK_TITLE_PATTERNS.
const SPEC_RE = /Tekniska\s+[Ss]pecifikationer/;
const FAQ_RE = /(Vanliga\s+fr[åa]gor|Ofta\s+st[äa]llda\s+fr[åa]gor)/;
const CARE_RE = /Anv[äa]ndning\s+och\s+sk[öo]tsel/;
const CARE_CATEGORY_RE = /k[öo]k|sk[öo]nhet|elektronik/i;

function hasH2(html: string, re: RegExp): boolean {
  return new RegExp(`<h2[^>]*>\\s*(?:${re.source})\\s*</h2>`, "i").test(html || "");
}

export interface EnrichTabStatus {
  /** Beskrivning finns alltid (huvudtexten). */
  beskrivning: boolean;
  specifikationer: boolean;
  vanligaFragor: boolean;
  /** Bara meningsfull när careApplicable=true. */
  anvandningSkotsel: boolean;
  /** Frontenden lägger alltid till Kontakta oss → alltid klar. */
  kontakt: boolean;
}

export interface EnrichRow {
  id: string;
  name: string;
  slug: string;
  categoryName: string | null;
  /** Om "Användning och skötsel" är relevant (Kök/Skönhet/Elektronik). */
  careApplicable: boolean;
  status: EnrichTabStatus;
  /** Antal relevanta data-flikar som SAKNAS (för sortering: flest saknade först). */
  missingCount: number;
}

/* eslint-disable @typescript-eslint/no-explicit-any */
async function fetchAllItems(): Promise<any[]> {
  const all: any[] = [];
  let skip = 0;
  const limit = 100;
  for (let i = 0; i < 10; i++) {
    const res: any = await (wix as any).products.queryProducts().limit(limit).skip(skip).find();
    const items = res.items || [];
    all.push(...items);
    if (items.length < limit) break;
    skip += limit;
  }
  return all;
}

/** Alla produkter med flik-status, sorterade med flest saknade flikar först. */
export async function getEnrichRows(): Promise<EnrichRow[]> {
  const [items, collections] = await Promise.all([fetchAllItems(), getCollections()]);
  const seen = new Set<string>();
  const rows: EnrichRow[] = [];

  for (const p of items) {
    if (p.visible === false) continue;
    const id: string = p._id || p.id || "";
    if (!id || seen.has(id)) continue;
    seen.add(id);

    const desc: string = p.description || "";
    // Specs kan ligga som <h2>-block ELLER i additionalInfoSections (migrerade
    // produkter) — storefronten visar bägge, så bägge räknas som "klar".
    const hasSpecSection = ((p.additionalInfoSections as any[]) || []).some((s) => /specifikation/i.test(s?.title || ""));
    const categoryName: string | null =
      collections.find((c) => (p.collectionIds || []).includes(c.id))?.name ?? null;
    const careApplicable = !!categoryName && CARE_CATEGORY_RE.test(categoryName);

    const status: EnrichTabStatus = {
      beskrivning: true,
      specifikationer: hasH2(desc, SPEC_RE) || hasSpecSection,
      vanligaFragor: hasH2(desc, FAQ_RE),
      anvandningSkotsel: hasH2(desc, CARE_RE),
      kontakt: true,
    };

    const missingCount =
      (status.specifikationer ? 0 : 1) +
      (status.vanligaFragor ? 0 : 1) +
      (careApplicable && !status.anvandningSkotsel ? 1 : 0);

    rows.push({ id, name: p.name || "", slug: p.slug || "", categoryName, careApplicable, status, missingCount });
  }

  rows.sort((a, b) => b.missingCount - a.missingCount || a.name.localeCompare(b.name, "sv"));
  return rows;
}
