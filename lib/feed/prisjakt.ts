// lib/feed/prisjakt.ts
//
// Prisjakt-feeden (/feed/prisjakt.xml) byggs OVANPÅ Google-feeden, precis som
// PriceRunner-feeden (lib/feed/pricerunner.ts). Prisjakts eget format ("Prisjakt
// XML") är Googles spec plus några egna fält, så katalogen, länkarna och bilderna
// går rakt igenom. Det som skiljer görs här, mot Prisjakts spec
// (developer.prisjakt.nu, läst 2026-10-13):
//
//  1. Priset. g:price blir priset kunden betalar och g:sale_price försvinner,
//     samma regel som för PriceRunner: en prisjämförelse sorterar på det kunden
//     betalar, och Prisjakt kräver samma pris som på produktsidan.
//  2. Frakten. Varje rad får en g:shipping med kassans regel (fri frakt från
//     500 kr, annars 19 kr) OCH alla fyra tiderna. Prisjakt stryker tiderna om en
//     av de fyra saknas, och PriceRunner-feeden har bara transittiden.
//  3. Bara varor i lager. Ett klick till en slutsåld vara ger ingen försäljning.
//  4. Bort med det Prisjakt inte läser eller kräver mer för: Googles
//     kampanjetiketter (g:custom_label_*), g:identifier_exists (finns inte i
//     Prisjakts fältlista) och g:size, som kräver g:size_system och bara gäller
//     kläder. Varianten står redan i titeln ("Namn - Färg / Storlek").
//  5. Rader vars id inte är ett giltigt Prisjakt-id tas bort: 1–36 tecken, bara
//     ASCII, inga blanksteg och inga av ! @ # $ % ^ & * < > ; :. Feedens id är
//     Wix-variantens id (36 tecken), så det ska aldrig hända.
//
// Ingen EAN/GTIN och ingen mpn: varorna är omärkta, och en mpn får bara vara
// tillverkarens eget nummer.
//
// Ren funktion utan importer, så att node:test kan köra den direkt; routen
// skickar in fraktvärdena.

export type PrisjaktShipping = {
  standardKr: number;
  freeFromKr: number;
  service: string;
  /** Leveranslöftet i arbetsdagar, hela vägen (DELIVERY_MIN_DAYS/MAX_DAYS). */
  minDays: number;
  maxDays: number;
};

/** Hanteringstid: från order till paketet lämnas till transportören. */
export const HANDLING_MIN_DAYS = 1;
export const HANDLING_MAX_DAYS = 2;

export type PrisjaktTider = {
  minHandling: number;
  maxHandling: number;
  minTransit: number;
  maxTransit: number;
};

/**
 * Leveranslöftet (3–6 arbetsdagar) delat i Prisjakts två delar. Hanteringen är
 * 1–2 dagar och transporten resten, så summan blir exakt det sajten lovar. Är
 * fönstret smalare än hanteringens spann krymper maxhanteringen, annars hade
 * transportens min ≤ max drivit summan förbi löftet.
 */
export function prisjaktTider(minDays: number, maxDays: number): PrisjaktTider {
  const minHandling = Math.min(HANDLING_MIN_DAYS, minDays);
  const maxHandling = Math.min(HANDLING_MAX_DAYS, maxDays, minHandling + (maxDays - minDays));
  const minTransit = minDays - minHandling;
  const maxTransit = maxDays - maxHandling;
  return { minHandling, maxHandling, minTransit, maxTransit };
}

const ITEM_RE = /<item>[\s\S]*?<\/item>/g;
const ID_RE = /<g:id>([^<]*)<\/g:id>/;
const PRICE_RE = /<g:price>([\d.]+) SEK<\/g:price>/;
const SALE_RE = /\n?[ \t]*<g:sale_price>([\d.]+) SEK<\/g:sale_price>/;
const LABEL_RE = /\n?[ \t]*<g:custom_label_\d>[^<]*<\/g:custom_label_\d>/g;
const IDENTIFIER_RE = /\n?[ \t]*<g:identifier_exists>[^<]*<\/g:identifier_exists>/g;
const SIZE_RE = /\n?[ \t]*<g:size>[^<]*<\/g:size>/g;
const EMPTY_DESCRIPTION_RE = /\n?[ \t]*<g:description>\s*<\/g:description>/g;

/** Prisjakts regler för g:id. Id:t läses ur XML:en, alltså med entiteterna kvar. */
export function giltigtPrisjaktId(id: string): boolean {
  return /^[\x21-\x7e]{1,36}$/.test(id) && !/[!@#$%^&*<>;:]/.test(id);
}

export function fraktFor(pris: number, s: PrisjaktShipping): number {
  return pris >= s.freeFromKr ? 0 : s.standardKr;
}

/** En <item> i Google-format → samma item för Prisjakt, eller null om den ska bort. */
export function prisjaktItem(item: string, s: PrisjaktShipping): string | null {
  if (!item.includes("<g:availability>in_stock</g:availability>")) return null;

  const id = item.match(ID_RE)?.[1] ?? "";
  if (!giltigtPrisjaktId(id)) return null;

  const regular = item.match(PRICE_RE);
  if (!regular) return null;
  const sale = item.match(SALE_RE);
  const pris = Number(sale ? sale[1] : regular[1]);
  if (!Number.isFinite(pris) || pris <= 0) return null;

  const frakt = fraktFor(pris, s);
  const t = prisjaktTider(s.minDays, s.maxDays);
  const shipping = `
      <g:shipping>
        <g:country>SE</g:country>
        <g:service>${s.service}</g:service>
        <g:price>${frakt.toFixed(2)} SEK</g:price>
        <g:min_handling_time>${t.minHandling}</g:min_handling_time>
        <g:max_handling_time>${t.maxHandling}</g:max_handling_time>
        <g:min_transit_time>${t.minTransit}</g:min_transit_time>
        <g:max_transit_time>${t.maxTransit}</g:max_transit_time>
      </g:shipping>`;

  return item
    .replace(SALE_RE, "")
    .replace(PRICE_RE, `<g:price>${pris.toFixed(2)} SEK</g:price>`)
    .replace(LABEL_RE, "")
    .replace(IDENTIFIER_RE, "")
    .replace(SIZE_RE, "")
    .replace(EMPTY_DESCRIPTION_RE, "")
    .replace(/\n?[ \t]*<\/item>$/, `${shipping}\n    </item>`);
}

/** Hela Google-feeden → Prisjakt-feeden. */
export function tillPrisjakt(googleXml: string, s: PrisjaktShipping): string {
  const items: string[] = [];
  for (const m of googleXml.matchAll(ITEM_RE)) {
    const out = prisjaktItem(m[0], s);
    if (out) items.push(`    ${out}`);
  }

  const head = googleXml
    .slice(0, googleXml.search(/<channel>/) + "<channel>".length)
    .trimEnd();
  const channelMeta = (googleXml.match(/<channel>([\s\S]*?)(?=\s*<item>|\s*<\/channel>)/)?.[1] || "")
    .replace(/<description>[^<]*<\/description>/, "<description>Fyndplats produktkatalog för Prisjakt – noga utvalda fynd till smarta priser.</description>")
    .trimEnd();

  return `${head}${channelMeta}
${items.join("\n")}
  </channel>
</rss>`;
}
