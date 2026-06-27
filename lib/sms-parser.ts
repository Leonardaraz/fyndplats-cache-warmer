// lib/sms-parser.ts
//
// Carrier SMS parser for the SMS-forwarding flow.
//
// Leonard puts his iPhone number on AliExpress orders. Carriers (PostNord, DHL,
// DPD, Instabox, Budbee, etc) text Leonard's phone with status updates. An iOS
// Shortcut forwards each SMS to /api/sms-inbound. This module turns the raw
// `{ from, text }` into a structured result the webhook can act on.
//
// The parser is deliberately conservative: when in doubt we leave fields
// undefined rather than guess. The webhook only sends a customer email when we
// have at least a `tracking_number` (to find the order) or a `pickup_code`
// (so the email is useful).
//
// Add a new carrier by appending a CarrierRule to CARRIERS — the order matters
// only for `from` matching (first hit wins). All status/code/ombud patterns are
// merged so it's safe to overlap regexes across carriers.

export type SmsStatus =
  | "out_for_delivery"
  | "available_for_pickup"
  | "delivered"
  | "in_transit"
  | "exception"
  | "unknown";

export type SmsCarrier =
  | "PostNord"
  | "DHL"
  | "DPD"
  | "GLS"
  | "DSV"
  | "Schenker"
  | "Bring"
  | "Instabox"
  | "Budbee"
  | "Cainiao"
  | "Early Bird"
  | "Airmee"
  | "Unknown";

export interface ParsedSms {
  carrier: SmsCarrier;
  status: SmsStatus;
  pickup_location?: string;
  pickup_code?: string;
  tracking_number?: string;
  raw_text: string;
  raw_from: string;
}

interface CarrierRule {
  carrier: SmsCarrier;
  // Match against the `from` field of the SMS. Carriers usually identify by
  // brand name (alphanumeric sender), occasionally by short code.
  fromPatterns: RegExp[];
  // Tracking-number regex (carrier-specific format).
  trackingPatterns: RegExp[];
}

// Carrier identification table. The `from` field of an SMS is typically the
// carrier brand name on Swedish networks ("PostNord", "DHL", "DPD") — short
// codes are rarer here than in the US, so brand-name match is the primary
// signal. We keep them as anchored, case-insensitive substring matches.
const CARRIERS: CarrierRule[] = [
  {
    carrier: "PostNord",
    fromPatterns: [/postnord/i, /pacsoft/i],
    // PostNord tracking: 13 chars starting with two letters and ending with SE
    // (e.g. JJFI6700000000123456789SE) OR 11–20 digit container codes.
    trackingPatterns: [
      /\b[A-Z]{2}\d{9,20}SE\b/,
      /\b\d{13,20}\b/,
    ],
  },
  {
    carrier: "DHL",
    fromPatterns: [/^dhl/i, /dhl[\s_-]?express/i, /dhl[\s_-]?parcel/i],
    // DHL tracking: 10–14 digits, sometimes prefixed JJD.
    trackingPatterns: [
      /\bJJD\d{10,18}\b/,
      /\b\d{10,14}\b/,
    ],
  },
  {
    carrier: "DPD",
    fromPatterns: [/^dpd/i, /dpd[\s_-]?se/i],
    trackingPatterns: [
      /\b\d{14}\b/,
      /\b[0-9A-Z]{14,28}\b/,
    ],
  },
  {
    carrier: "GLS",
    fromPatterns: [/^gls/i],
    trackingPatterns: [/\b\d{11,14}\b/],
  },
  {
    carrier: "DSV",
    fromPatterns: [/^dsv/i],
    trackingPatterns: [/\b\d{10,14}\b/],
  },
  {
    carrier: "Schenker",
    fromPatterns: [/schenker/i, /^db\b/i],
    trackingPatterns: [/\b\d{9,14}\b/],
  },
  {
    carrier: "Bring",
    fromPatterns: [/bring/i],
    trackingPatterns: [/\b\d{9,18}\b/],
  },
  {
    carrier: "Instabox",
    // NB: matcha bara "instabox" — INTE en lös `/instab/` som även fångar
    // "instabee" (Budbee) och felklassar den som Instabox.
    fromPatterns: [/instabox/i],
    trackingPatterns: [/\b[A-Z0-9]{6,12}\b/],
  },
  {
    carrier: "Budbee",
    fromPatterns: [/budbee/i, /instabee/i],
    trackingPatterns: [/\b[A-Z0-9]{6,12}\b/],
  },
  {
    carrier: "Cainiao",
    fromPatterns: [/cainiao/i, /aliexpress/i, /^ae\b/i],
    trackingPatterns: [
      // Cainiao codes commonly end with a country suffix (e.g. CN, SE).
      /\b[A-Z]{2}\d{9,20}[A-Z]{0,2}\b/,
      /\b[A-Z]{4}\d{6,16}\b/,
    ],
  },
  {
    carrier: "Early Bird",
    fromPatterns: [/early[\s_-]?bird/i, /earlybird/i],
    trackingPatterns: [/\b[A-Z0-9]{6,16}\b/],
  },
  {
    carrier: "Airmee",
    fromPatterns: [/airmee/i],
    trackingPatterns: [/\b[A-Z0-9]{6,16}\b/],
  },
];

// Status detection. Order matters: more specific phrases come first so we
// don't classify "på väg till ombudet" as out_for_delivery when it really
// means "in_transit to a pickup point that isn't open yet". Phrasing is
// drawn from real PostNord/DHL/DPD/Instabox/Budbee SMS examples.
const STATUS_PATTERNS: Array<{ status: SmsStatus; pattern: RegExp }> = [
  // Available for pickup — Swedish ombud phrasing first.
  { status: "available_for_pickup", pattern: /\b(?:är |finns )?(?:nu )?(?:tillgängligt? |klart? )?(?:för )?(?:upphämtning|att hämta?|hämtas)\b/i },
  { status: "available_for_pickup", pattern: /\b(?:vid|hos|på)\s+(?:ditt\s+)?ombud(?:et)?\b/i },
  { status: "available_for_pickup", pattern: /\b(?:available|ready)\s+for\s+pickup\b/i },
  { status: "available_for_pickup", pattern: /\bhämtkod\b/i },

  // Delivered — "levererat" (PostNord) wins over "på väg".
  { status: "delivered", pattern: /\b(?:är\s+)?(?:nu\s+)?levererat?\b/i },
  { status: "delivered", pattern: /\bvid\s+din\s+dörr\b/i },
  { status: "delivered", pattern: /\bi\s+(?:din\s+)?postlåda\b/i },
  { status: "delivered", pattern: /\bdelivered\b/i },

  // Out for delivery (today / on a vehicle).
  { status: "out_for_delivery", pattern: /\bout\s+for\s+delivery\b/i },
  { status: "out_for_delivery", pattern: /\blevereras\s+idag\b/i },
  { status: "out_for_delivery", pattern: /\bkommer\s+(?:hem\s+till\s+dig\s+)?idag\b/i },
  { status: "out_for_delivery", pattern: /\bpå\s+väg\s+(?:hem\s+)?till\s+dig\b/i },

  // Generic in-transit.
  { status: "in_transit", pattern: /\bhar\s+skickats\b/i },
  { status: "in_transit", pattern: /\bär\s+på\s+väg\b/i },
  { status: "in_transit", pattern: /\bin\s+transit\b/i },
  { status: "in_transit", pattern: /\bshipped\b/i },

  // Exception / hold.
  { status: "exception", pattern: /\b(?:försenat?|delayed|hold|problem|misslyckats?)\b/i },
];

// Pickup-code extraction. Common Swedish phrasings:
//   "Hämtkod: 1234"   "hämtkoden är 1234"   "kod 12345"   "code: 12345"
// We require a digit run between 4 and 7 chars to dodge phone numbers and
// dates. Anchored to one of the keywords so we don't pick up tracking digits.
const PICKUP_CODE_PATTERNS: RegExp[] = [
  /(?:hämtkod(?:en)?|hamtkod(?:en)?|pickup\s+code|code|kod|kollikod)[^\d]{0,6}(\d{4,7})\b/i,
  /\bkod\s*[:#-]\s*(\d{4,7})\b/i,
];

// Ombud / pickup location patterns. Swedish carriers usually say
// "vid ICA Maxi Södertälje", "hos Pressbyrån Hötorget", "på Coop Östermalm".
// We capture the brand + the trailing identifier on the same line, stopping
// at a period or "med" (which usually precedes "med hämtkod ...").
const OMBUD_BRANDS = [
  "ICA Maxi",
  "ICA Kvantum",
  "ICA Supermarket",
  "ICA Nära",
  "ICA",
  "Pressbyrån",
  "Pressbyran",
  "7-Eleven",
  "COOP",
  "Coop",
  "Hemköp",
  "Hemkop",
  "Tempo",
  "Willys",
  "City Gross",
  "Lidl",
  "Apotek Hjärtat",
  "Mathem",
  "Direkten",
  "Handlarn",
  "Matöppet",
  "Instabox",
  "Budbee Box",
  "Schenker ServicePoint",
  "DHL Servicepoint",
  "DHL Service Point",
];

// Ursprungs-/leverantörsord som ALDRIG får hamna i pickup_location (och därmed
// i mejlets ämne/brödtext). Fångar i synnerhet catch-all-fallbackens läcka
// "AliExpress Logistics" utan att blockera riktiga ombud ("Hållplatsens
// Lakritshandel", "ICA Maxi" osv).
const ORIGIN_LEAK =
  /\b(?:aliexpress|ali\s*express|alibaba|cainiao|4px|yanwen|china\s*post|chinapost|china|chinese|kina|shenzhen|guangzhou|yiwu|hong\s*kong|hongkong)\b/i;

function findOmbud(text: string): string | undefined {
  for (const brand of OMBUD_BRANDS) {
    // Match the brand plus an optional trailing identifier (e.g. "Maxi Södertälje"),
    // bounded by sentence-end punctuation, the word "med", or end-of-string.
    // Escape brand for regex use. `\\b` won't anchor cleanly after a hyphen so
    // we use a positive lookahead on word boundary OR non-letter.
    const escaped = brand.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const re = new RegExp(
      `\\b${escaped}\\b[^\\.\\n,]*?(?=\\s+(?:med|och|samt)\\b|[\\.\\n,!\\?]|$)`,
      "i",
    );
    const m = text.match(re);
    if (m && m[0]) {
      // Trim trailing whitespace + commas + the connecting word if it slipped in.
      const candidate = m[0].replace(/\s+$/, "").trim();
      if (!ORIGIN_LEAK.test(candidate)) return candidate;
    }
  }
  // Fallback: explicit "vid <name>" / "hos <name>" / "på <name>" pattern.
  const explicit = text.match(
    /\b(?:vid|hos|på)\s+((?:[A-ZÅÄÖ][\wÅÄÖåäö-]+)(?:\s+[A-ZÅÄÖ0-9][\wÅÄÖåäö0-9-]+){0,4})/,
  );
  if (explicit && explicit[1]) {
    // Don't accept generic words ("vid din dörr", "vid postlådan") and NEVER an
    // origin-revealing name (the catch-all could otherwise grab "på AliExpress
    // Logistics" → leak till kunden).
    const candidate = explicit[1].trim();
    if (
      !/^(?:din|ditt|dina|er|ert)\b/i.test(candidate) &&
      candidate.length >= 3 &&
      !ORIGIN_LEAK.test(candidate)
    ) {
      return candidate;
    }
  }
  return undefined;
}

function identifyCarrier(from: string, text: string): { carrier: SmsCarrier; rule?: CarrierRule } {
  // `from` (avsändar-ID:t) är auktoritativt — det är transportörens egna
  // sändarnamn. Matcha det FÖRST, så ett namn som råkar nämnas i brödtexten
  // ("...lämnat till DHL Servicepoint") inte felklassar en PostNord-SMS.
  for (const rule of CARRIERS) {
    if (rule.fromPatterns.some((p) => p.test(from))) {
      return { carrier: rule.carrier, rule };
    }
  }
  // Fallback: vissa vidarebefordrare tappar avsändaren → sniffa brödtexten
  // som sista utväg (t.ex. AliExpress/Cainiao som skickar från en sifferkod).
  for (const rule of CARRIERS) {
    if (rule.fromPatterns.some((p) => p.test(text))) {
      return { carrier: rule.carrier, rule };
    }
  }
  return { carrier: "Unknown" };
}

function detectStatus(text: string): SmsStatus {
  for (const { status, pattern } of STATUS_PATTERNS) {
    if (pattern.test(text)) return status;
  }
  return "unknown";
}

function extractPickupCode(text: string): string | undefined {
  for (const re of PICKUP_CODE_PATTERNS) {
    const m = text.match(re);
    if (m && m[1]) return m[1];
  }
  return undefined;
}

function extractTrackingNumber(text: string, rule?: CarrierRule): string | undefined {
  const patterns = rule?.trackingPatterns ?? [
    // Generic fallback patterns.
    /\b[A-Z]{2}\d{9,20}[A-Z]{2}\b/,
    /\b\d{12,20}\b/,
  ];
  // Prefer explicit "Tracking:" / "Spårningsnummer:" labelled values first —
  // they're unambiguous and not subject to false positives from pickup codes.
  const labelled = text.match(
    /(?:spårningsnummer|sparingsnummer|sparningsnummer|tracking(?:\s+number)?|kollinr|kolli[\s-]?nr|sändningsnummer|forsändelsenummer|försändelsenummer)[\s:#-]*([A-Z0-9]{8,30})/i,
  );
  if (labelled && labelled[1]) return labelled[1];

  for (const re of patterns) {
    const m = text.match(re);
    // Kräv minst en siffra: de breda mönstren (t.ex. Instabox/Budbee
    // `[A-Z0-9]{6,12}`) matchar annars vanliga versala ord ("PAKETET",
    // "LEVERANS") och skapar fantom-spårnummer. Riktiga spårnummer har siffror.
    if (m && /\d/.test(m[0])) return m[0];
  }
  return undefined;
}

/**
 * Parse a forwarded carrier SMS into a structured result.
 *
 * @param input Raw SMS as forwarded by Leonard's iOS Shortcut.
 * @returns A ParsedSms describing what we can infer. Fields are optional —
 *          callers should branch on `status` and on the presence of
 *          `tracking_number` / `pickup_code`.
 */
export function parseSms(input: { from: string; text: string }): ParsedSms {
  const from = (input.from ?? "").trim();
  const text = (input.text ?? "").trim();
  const { carrier, rule } = identifyCarrier(from, text);
  return {
    carrier,
    status: detectStatus(text),
    pickup_location: findOmbud(text),
    pickup_code: extractPickupCode(text),
    tracking_number: extractTrackingNumber(text, rule),
    raw_text: text,
    raw_from: from,
  };
}
