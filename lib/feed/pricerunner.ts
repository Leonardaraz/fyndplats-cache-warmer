// lib/feed/pricerunner.ts
//
// PriceRunner-feeden (/feed/pricerunner.xml) byggs OVANPÅ Google-feeden i
// stället för att hämta katalogen från Wix en gång till. PriceRunner läser
// Googles format (RSS 2.0 + g:-namespace), så nästan allt kan gå rakt igenom —
// men tre saker skiljer sig och görs här:
//
//  1. Priset. PriceRunner jämför och sorterar på priset kunden betalar. Google
//     vill ha ordinarie pris i g:price och reapriset i g:sale_price; här slås de
//     ihop så att g:price ÄR det pris kunden betalar och g:sale_price försvinner.
//  2. Frakten. En prisjämförelse visar pris + frakt, så varje rad får en
//     g:shipping med samma regel som kassan: fri frakt från 499 kr, annars 19 kr.
//     Leveranstiden (transit) hämtas ur lib/shipping.ts via routen.
//  3. Bara varor i lager. PriceRunner tar betalt per klick; ett klick till en
//     slutsåld vara kostar pengar och ger ingen försäljning.
//
// Googles interna kampanjetiketter (g:custom_label_*) tas bort — de betyder
// bara något i Google Ads. Ingen EAN/GTIN finns (varorna är omärkta), och
// g:identifier_exists=no följer med som i Google-feeden.
//
// Ren funktion utan importer, så att node:test kan köra den direkt; routen
// skickar in fraktvärdena.

export type PricerunnerShipping = {
  standardKr: number;
  freeFromKr: number;
  service: string;
  minTransitDays: number;
  maxTransitDays: number;
};

const ITEM_RE = /<item>[\s\S]*?<\/item>/g;
const PRICE_RE = /<g:price>([\d.]+) SEK<\/g:price>/;
const SALE_RE = /\n?[ \t]*<g:sale_price>([\d.]+) SEK<\/g:sale_price>/;
const LABEL_RE = /\n?[ \t]*<g:custom_label_\d>[^<]*<\/g:custom_label_\d>/g;

export function fraktFor(pris: number, s: PricerunnerShipping): number {
  return pris >= s.freeFromKr ? 0 : s.standardKr;
}

/** En <item> i Google-format → samma item för PriceRunner, eller null om den ska bort. */
export function pricerunnerItem(item: string, s: PricerunnerShipping): string | null {
  if (!item.includes("<g:availability>in_stock</g:availability>")) return null;

  const regular = item.match(PRICE_RE);
  if (!regular) return null;
  const sale = item.match(SALE_RE);
  const pris = Number(sale ? sale[1] : regular[1]);
  if (!Number.isFinite(pris) || pris <= 0) return null;

  const frakt = fraktFor(pris, s);
  const shipping = `
      <g:shipping>
        <g:country>SE</g:country>
        <g:service>${s.service}</g:service>
        <g:price>${frakt.toFixed(2)} SEK</g:price>
        <g:min_transit_time>${s.minTransitDays}</g:min_transit_time>
        <g:max_transit_time>${s.maxTransitDays}</g:max_transit_time>
      </g:shipping>`;

  return item
    .replace(SALE_RE, "")
    .replace(PRICE_RE, `<g:price>${pris.toFixed(2)} SEK</g:price>`)
    .replace(LABEL_RE, "")
    .replace(/\n?[ \t]*<\/item>$/, `${shipping}\n    </item>`);
}

/** Hela Google-feeden → PriceRunner-feeden. */
export function tillPricerunner(googleXml: string, s: PricerunnerShipping): string {
  const items: string[] = [];
  for (const m of googleXml.matchAll(ITEM_RE)) {
    const out = pricerunnerItem(m[0], s);
    if (out) items.push(`    ${out}`);
  }

  const head = googleXml
    .slice(0, googleXml.search(/<channel>/) + "<channel>".length)
    .trimEnd();
  const channelMeta = (googleXml.match(/<channel>([\s\S]*?)(?=\s*<item>|\s*<\/channel>)/)?.[1] || "")
    .replace(/<description>[^<]*<\/description>/, "<description>Fyndplats produktkatalog för PriceRunner – noga utvalda fynd till smarta priser.</description>")
    .trimEnd();

  return `${head}${channelMeta}
${items.join("\n")}
  </channel>
</rss>`;
}
