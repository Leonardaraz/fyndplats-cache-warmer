// lib/carrier-mask.ts
//
// EN enda källa för carrier-maskering i headless. Används av både
// app/api/track (publika spårningssidan) och app/api/track17-webhook
// (17TRACK-push → leverans-mejl). Att ha listan på ETT ställe gör att de två
// kanalerna aldrig kan divergera i vad de råkar visa för kunden.
//
// ALLOWLIST (fail-safe): bara kända EU/SE-transportörer får visas. Allt annat
// — 4PX, Yanwen, China Post, Cainiao, okända kinesiska last-mile-bolag —
// faller igenom till "Fraktpartner". En denylist missar varje ny ursprungs-
// carrier; en allowlist kan aldrig läcka en vi inte räknat med. Varje regel
// normaliserar samtidigt bort landssuffix ("PostNord Sweden" → "PostNord").

const CARRIER_ALLOW: Array<{ test: RegExp; label: string }> = [
  { test: /postnord/i, label: "PostNord" },
  { test: /\bdhl\b/i, label: "DHL" },
  { test: /\bdpd\b/i, label: "DPD" },
  { test: /\bgls\b/i, label: "GLS" },
  { test: /\bdsv\b/i, label: "DSV" },
  { test: /schenker/i, label: "Schenker" },
  { test: /\bbring\b/i, label: "Bring" },
  { test: /instabox/i, label: "Instabox" },
  { test: /budbee|instabee/i, label: "Budbee" },
  { test: /airmee/i, label: "Airmee" },
  { test: /early\s*bird/i, label: "Early Bird" },
  { test: /\bups\b/i, label: "UPS" },
  { test: /fedex/i, label: "FedEx" },
  { test: /\btnt\b/i, label: "TNT" },
  { test: /\b(?:posten|posti)\b/i, label: "Posten" },
  // Bredare EU-bud: produkterna skickas från EU-lager, så riktiga EU-
  // transportörer FÅR visas (mer transparent spårning). Varje mönster är
  // verifierat att INTE matcha "Cainiao"/"AliExpress" (de förblir maskerade).
  { test: /postnl/i, label: "PostNL" },
  { test: /inpost/i, label: "InPost" },
  { test: /colissimo/i, label: "Colissimo" },
  { test: /chronopost/i, label: "Chronopost" },
  { test: /mondial\s*relay/i, label: "Mondial Relay" },
  { test: /deutsche\s*post/i, label: "Deutsche Post" },
  { test: /poste\s*italiane/i, label: "Poste Italiane" },
  { test: /royal\s*mail/i, label: "Royal Mail" },
  { test: /\bevri\b/i, label: "Evri" },
  { test: /\bhermes\b/i, label: "Hermes" },
  { test: /bpost/i, label: "Bpost" },
  { test: /omniva/i, label: "Omniva" },
  { test: /helthjem/i, label: "Helthjem" },
];

/** Neutralt namn för okända/ursprungs-carriers. */
export const MASKED_CARRIER = "Fraktpartner";

/**
 * Maskerar ett carrier-namn. Känd EU/SE-transportör → normaliserad etikett
 * ("PostNord Sweden" → "PostNord"). Tomt → "". Allt annat → "Fraktpartner".
 */
export function maskCarrier(name: string | null | undefined): string {
  if (!name) return "";
  for (const { test, label } of CARRIER_ALLOW) {
    if (test.test(name)) return label;
  }
  return MASKED_CARRIER;
}

/**
 * Som maskCarrier men returnerar undefined för okänd/maskerad carrier i
 * stället för "Fraktpartner". Bra när ett UI hellre döljer transportör-raden
 * helt än visar ett intetsägande "Fraktpartner".
 */
export function maskCarrierOrUndefined(name: string | null | undefined): string | undefined {
  const masked = maskCarrier(name);
  return masked && masked !== MASKED_CARRIER ? masked : undefined;
}
