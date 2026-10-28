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
//  6. ☠️ Storleken. Vercels CDN cachar icke-strömmade svar upp till 10 MB och
//     strömmade upp till 20 MB. Uppmätt 2026-10-19 på förhandsbygget: flödet på
//     15,4 MB gav MISS tre gånger i rad (35–105 s per hämtning), bildsitemapen
//     på 7,6 MB gav HIT andra gången. Därför skrivs varje rad på en rad utan
//     indrag (−1,4 MB) och g:additional_image_link tas bort (−5 MB):
//     extrabilderna är valfria hos Prisjakt, och erbjudandet visas med
//     huvudbilden. Kvar blev 9,30 MB (2026-10-28), och sedan dess strömmas
//     svaret (lib/feed/prisjakt-svar.ts), så gränsen är 20 MB. Över
//     PRISJAKT_VARNING_BYTE_STROMMAT loggar rutterna en varning.
//
//  7. g:color har högst tre färger, skilda med "/" (Googles och Prisjakts
//     regel). Ett värde med fler får varningen "Ogiltlig" i Business Center
//     (fyra varor 2026-10-28), så de tre första står kvar.
//
// Som regel ingen EAN/GTIN, eftersom varorna är omärkta. Undantaget är de varor
// som kartan i prisjakt-gtin.ts pekar ut (testet 2026-10-23, se tillPrisjakt).
//
// ☠️ MÄRKE OCH ARTIKELNUMMER BARA PÅ DEN HEMLIGA ADRESSEN (Leonard 2026-10-28).
// Prisjakt matchade 9 av 6 818 erbjudanden, och deras sidor för Aosom-varor
// heter märke plus Aosoms artikelnummer. I det flöde som byggs på den hemliga
// adressen (app/feed/[fil]/route.ts) får Aosom-varorna g:mpn = Aosoms
// artikelnummer och g:brand = varans riktiga märke, ur motorns
// /api/prisjakt-artiklar. Det är ett medvetet undantag från två husregler (att
// märket är Fyndplats och att artikelnumret aldrig når kunden), och det gäller
// BARA där: Google-, PriceRunner- och det öppna Prisjakt-flödet får aldrig
// `artiklar`. Saknas ett säkert märke står Fyndplats kvar.
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
const GROUP_RE = /<g:item_group_id>([^<]*)<\/g:item_group_id>/;
const GROUP_ALL_RE = /<g:item_group_id>([^<]*)<\/g:item_group_id>/g;
const PRICE_RE = /<g:price>([\d.]+) SEK<\/g:price>/;
const SALE_RE = /<g:sale_price>([\d.]+) SEK<\/g:sale_price>/;
const LABEL_RE = /<g:custom_label_\d>[^<]*<\/g:custom_label_\d>/g;
const IDENTIFIER_RE = /<g:identifier_exists>[^<]*<\/g:identifier_exists>/g;
const SIZE_RE = /<g:size>[^<]*<\/g:size>/g;
const EXTRA_IMAGE_RE = /<g:additional_image_link>[^<]*<\/g:additional_image_link>/g;
const EMPTY_DESCRIPTION_RE = /<g:description>\s*<\/g:description>/g;
const COLOR_RE = /<g:color>([^<]*)<\/g:color>/;
const BRAND_RE = /<g:brand>[^<]*<\/g:brand>/;
/** Blanksteg MELLAN taggar. Text i ett fält rörs inte: där står aldrig `>` direkt före. */
const MELLAN_TAGGAR_RE = />\s+</g;

/** Prisjakts regler för g:id. Id:t läses ur XML:en, alltså med entiteterna kvar. */
export function giltigtPrisjaktId(id: string): boolean {
  return /^[\x21-\x7e]{1,36}$/.test(id) && !/[!@#$%^&*<>;:]/.test(id);
}

/**
 * GS1:s kontrollsiffra för en GTIN-13: de tolv första siffrorna väger 1, 3, 1, 3 …
 * från vänster och den trettonde fyller ut summan till närmaste tiotal. En
 * slumpad trettonsiffrig kod klarar den i ett fall av tio, så den fångar
 * tangentbordsfel men bevisar inte att koden hör till rätt vara.
 */
export function giltigtGtin13(kod: string): boolean {
  if (!/^\d{13}$/.test(kod)) return false;
  let summa = 0;
  for (let i = 0; i < 12; i++) summa += Number(kod[i]) * (i % 2 === 0 ? 1 : 3);
  return (10 - (summa % 10)) % 10 === Number(kod[12]);
}

/** Högst så många färger i g:color (Googles och Prisjakts regel). */
export const MAX_FARGER = 3;

/**
 * Ett g:color-värde med högst tre färger. Färgerna skiljs med "/", och ett
 * värde med fler behåller de tre första. Allt annat lämnas tecken för tecken.
 */
export function begransaFarger(farg: string): string {
  const delar = farg.split("/");
  if (delar.length <= MAX_FARGER) return farg;
  return delar
    .slice(0, MAX_FARGER)
    .map((d) => d.trim())
    .join("/");
}

/** Aosoms artikelnummer och varans märke för en variant (motorns /api/prisjakt-artiklar). */
export type PrisjaktArtikel = { mpn: string; marke: string | null };

/**
 * Motorns svar: artikeln per Wix-variant-id, och per Wix-produkt-id för de
 * sidor där mappningen saknar variant-id. En produktnyckel används bara när
 * produkten har exakt en variant i Google-flödet.
 */
export type PrisjaktArtiklar = {
  varianter: Readonly<Record<string, PrisjaktArtikel>>;
  produkter: Readonly<Record<string, PrisjaktArtikel>>;
};

/** Ser ut som ett artikelnummer: bokstäver, siffror och bindestreck, högst 40 tecken. */
export function giltigtMpn(mpn: string): boolean {
  return /^[A-Za-z0-9][A-Za-z0-9-]{2,39}$/.test(mpn);
}

/** Ett märke att skriva: inte tomt, högst 70 tecken (Googles gräns), inga styrtecken. */
export function giltigtMarke(marke: string | null | undefined): marke is string {
  return typeof marke === "string" && marke.trim() === marke && marke.length > 0 && marke.length <= 70 && !/[\u0000-\u001f<>&"]/.test(marke);
}

export function fraktFor(pris: number, s: PrisjaktShipping): number {
  return pris >= s.freeFromKr ? 0 : s.standardKr;
}

/**
 * En <item> i Google-format → samma item för Prisjakt på en rad, eller null om den ska bort.
 * `gtin` (valfri) skrivs som g:gtin, men bara om kontrollsiffran stämmer.
 * `artikel` (valfri, bara på den hemliga adressen) skrivs som g:mpn, och dess
 * märke ersätter g:brand. Ett nummer som inte ser ut som ett nummer skrivs inte,
 * och utan ett giltigt märke står flödets märke kvar.
 */
export function prisjaktItem(item: string, s: PrisjaktShipping, gtin?: string, artikel?: PrisjaktArtikel): string | null {
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
  const shipping =
    `<g:shipping><g:country>SE</g:country><g:service>${s.service}</g:service>` +
    `<g:price>${frakt.toFixed(2)} SEK</g:price>` +
    `<g:min_handling_time>${t.minHandling}</g:min_handling_time>` +
    `<g:max_handling_time>${t.maxHandling}</g:max_handling_time>` +
    `<g:min_transit_time>${t.minTransit}</g:min_transit_time>` +
    `<g:max_transit_time>${t.maxTransit}</g:max_transit_time></g:shipping>`;

  const gtinTagg = gtin && giltigtGtin13(gtin) ? `<g:gtin>${gtin}</g:gtin>` : "";
  const mpn = artikel && giltigtMpn(artikel.mpn) ? artikel.mpn : null;
  const mpnTagg = mpn ? `<g:mpn>${mpn}</g:mpn>` : "";
  const marke = artikel && mpn && giltigtMarke(artikel.marke) ? artikel.marke : null;

  let ut = item;
  if (marke) ut = ut.replace(BRAND_RE, `<g:brand>${marke}</g:brand>`);

  return ut
    .replace(MELLAN_TAGGAR_RE, "><")
    .replace(COLOR_RE, (_tagg, farg: string) => `<g:color>${begransaFarger(farg)}</g:color>`)
    .replace(SALE_RE, "")
    .replace(PRICE_RE, `<g:price>${pris.toFixed(2)} SEK</g:price>`)
    .replace(LABEL_RE, "")
    .replace(IDENTIFIER_RE, "")
    .replace(SIZE_RE, "")
    .replace(EXTRA_IMAGE_RE, "")
    .replace(EMPTY_DESCRIPTION_RE, "")
    .replace(/<\/item>$/, `${mpnTagg}${gtinTagg}${shipping}</item>`);
}

/** Variant-id (g:id) → GTIN-13 för just den varianten. */
export type PrisjaktGtin = Readonly<Record<string, string>>;

/** Hur många varianter varje produktgrupp har i Google-feeden, slutsålda medräknade. */
function varianterPerGrupp(googleXml: string): Map<string, number> {
  const antal = new Map<string, number>();
  for (const m of googleXml.matchAll(GROUP_ALL_RE)) antal.set(m[1], (antal.get(m[1]) ?? 0) + 1);
  return antal;
}

/**
 * Artikeln för en rad: variantens egen, annars produktens, men produktens bara
 * när produkten har exakt en variant i Google-flödet (slutsålda medräknade).
 * Annars kunde en färgs nummer hamna på en annan.
 */
function artikelFor(
  artiklar: PrisjaktArtiklar,
  id: string,
  grupp: string,
  grupper: ReadonlyMap<string, number>,
): PrisjaktArtikel | undefined {
  if (Object.hasOwn(artiklar.varianter, id)) return artiklar.varianter[id];
  if (grupp && grupper.get(grupp) === 1 && Object.hasOwn(artiklar.produkter, grupp)) return artiklar.produkter[grupp];
  return undefined;
}

/**
 * Hela Google-feeden → Prisjakt-feeden, en vara per rad.
 *
 * `gtin` pekar ut varianter som får en g:gtin. En kod används bara när alla tre
 * stämmer: kontrollsiffran, att ingen annan vara i kartan har samma kod, och att
 * produkten har EXAKT en variant i Google-feeden, slutsålda medräknade. Annars
 * kunde en kod som hör till en färg hamna på en annan.
 *
 * `artiklar` (bara på den hemliga adressen) ger Aosom-varorna g:mpn och märke,
 * se artikelFor. Utan `artiklar` blir flödet exakt som förut.
 */
export function tillPrisjakt(
  googleXml: string,
  s: PrisjaktShipping,
  gtin: PrisjaktGtin = {},
  artiklar?: PrisjaktArtiklar,
): string {
  const kodAntal = new Map<string, number>();
  for (const kod of Object.values(gtin)) kodAntal.set(kod, (kodAntal.get(kod) ?? 0) + 1);
  const produktnycklar = artiklar ? Object.keys(artiklar.produkter).length > 0 : false;
  const grupper = kodAntal.size > 0 || produktnycklar ? varianterPerGrupp(googleXml) : new Map<string, number>();

  const items: string[] = [];
  for (const m of googleXml.matchAll(ITEM_RE)) {
    const id = m[0].match(ID_RE)?.[1] ?? "";
    const grupp = m[0].match(GROUP_RE)?.[1] ?? "";
    const kod = Object.hasOwn(gtin, id) ? gtin[id] : undefined;
    let saker: string | undefined;
    if (kod && kodAntal.get(kod) === 1 && grupper.get(grupp) === 1) saker = kod;
    const out = prisjaktItem(m[0], s, saker, artiklar ? artikelFor(artiklar, id, grupp, grupper) : undefined);
    if (out) items.push(out);
  }

  const head = googleXml
    .slice(0, googleXml.search(/<channel>/) + "<channel>".length)
    .replace(/<rss([^>]*)>/, (rss, attr: string) =>
      attr.includes("xmlns:pj=") ? rss : `<rss${attr} xmlns:pj="https://schema.prisjakt.nu/ns/1.0">`,
    )
    .trimEnd();
  const channelMeta = (googleXml.match(/<channel>([\s\S]*?)(?=\s*<item>|\s*<\/channel>)/)?.[1] || "")
    .replace(/<description>[^<]*<\/description>/, "<description>Fyndplats produktkatalog för Prisjakt – noga utvalda fynd till smarta priser.</description>")
    .trimEnd();

  return `${head}${channelMeta}
${items.join("\n")}
  </channel>
</rss>`;
}
