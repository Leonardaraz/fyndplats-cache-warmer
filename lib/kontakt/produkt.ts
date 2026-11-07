// lib/kontakt/produkt.ts
//
// En produkt för kontaktformuläret, slagen på servern ur slugen. Formulärets
// förval (/api/kontakt/produkt) och mejlet till kundtjänst (/api/contact) går
// båda hit, så att namnet och länken i mejlet alltid kommer ur katalogen och
// aldrig ur det som kunden skickade.

import { getKontaktProdukt } from "../products";
import { formatPrice, listPris } from "../price-range";
import { visaValnamn } from "../variant-lage";
import { byggKontaktProdukt, giltigSlug, type Formatering, type KontaktProdukt } from "./kontakt";

/** Samma pris och valnamn som produktsidan och sökförslagen visar. */
const KONTAKT_FORMAT: Formatering = { pris: formatPrice, listPris, valnamn: visaValnamn };

/** Null när ingen synlig produkt har slugen. Kastar när Wix felar. */
export async function hamtaKontaktProdukt(slug: string, variantId?: string): Promise<KontaktProdukt | null> {
  if (!giltigSlug(slug)) return null;
  const p = await getKontaktProdukt(slug);
  return p ? byggKontaktProdukt(p, variantId, KONTAKT_FORMAT) : null;
}
