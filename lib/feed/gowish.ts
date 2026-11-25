// lib/feed/gowish.ts
//
// GoWish-flödet (/feed/gowish.xml, Leonard 2026-11-25). GoWish bad om butikens
// Google Shopping-flöde i XML, och Leonard om att det ska bära alla EAN-koder,
// som PriceRunner-flödet. Flödet byggs därför OVANPÅ Google-flödet, som
// PriceRunner-, Prisjakt- och Pinterest-flödena, och är Google-flödet som det
// är med tre skillnader:
//
//  1. EAN/GTIN. Varor som urvalet i lib/feed/prisjakt.ts (gtinUrval med
//     FLODE_GTIN, samma som PriceRunner och Prisjakt) pekar ut får g:gtin, och
//     deras g:identifier_exists=no tas bort (de två motsäger varandra).
//     ☠️ Google-flödet får aldrig koderna (lib/feed/gtin.ts).
//  2. Frakten. GoWish ser inte Merchant Centers fraktinställning, så varje rad
//     får en g:shipping med kassans regel, räknad på priset kunden betalar.
//  3. Googles kampanjetiketter (g:custom_label_*) tas bort. De betyder bara
//     något i Google Ads och är inte till för någon utanför.
//
// Det som INTE ändras, med flit, och som skiljer flödet från PriceRunners:
//
//  - g:price är ordinarie pris och g:sale_price reapriset, som Google vill ha
//    dem. En önskelista kan då visa att varan är nedsatt.
//  - Slutsålda varor står kvar med sin g:availability. En vara som någon
//    önskat sig ska kunna visas som slut, inte försvinna ur flödet. GoWish får
//    betalt per köp, inte per klick, så ett klick till en slutsåld vara kostar
//    ingenting (PriceRunners skäl för att ta bort dem gäller inte här).
//
// Ren funktion utan importer, så att node:test kan köra den direkt; byggaren
// (gowishXml i lib/feed/harledda.ts) skickar in fraktvärdena och koderna.

export type GowishShipping = {
  standardKr: number;
  freeFromKr: number;
  service: string;
  minTransitDays: number;
  maxTransitDays: number;
};

const ITEM_RE = /<item>[\s\S]*?<\/item>/g;
const PRICE_RE = /<g:price>([\d.]+) SEK<\/g:price>/;
const SALE_RE = /<g:sale_price>([\d.]+) SEK<\/g:sale_price>/;
const LABEL_RE = /\n?[ \t]*<g:custom_label_\d>[^<]*<\/g:custom_label_\d>/g;
const ID_RE = /<g:id>([^<]*)<\/g:id>/;
const IDENTIFIER_RE = /\n?[ \t]*<g:identifier_exists>[^<]*<\/g:identifier_exists>/g;

/**
 * En <item> i Google-format → samma item för GoWish, eller null när raden
 * saknar ett pris (en sådan rad går inte att visa). `gtin` (valfri, en GTIN-13
 * ur gtinUrval) skrivs som g:gtin i stället för g:identifier_exists=no. Något
 * annat än 13 siffror skrivs aldrig.
 */
export function gowishItem(item: string, s: GowishShipping, gtin?: string): string | null {
  const ordinarie = item.match(PRICE_RE);
  if (!ordinarie) return null;
  const rea = item.match(SALE_RE);
  const pris = Number(rea ? rea[1] : ordinarie[1]);
  if (!Number.isFinite(pris) || pris <= 0) return null;

  const frakt = pris >= s.freeFromKr ? 0 : s.standardKr;
  const shipping = `
      <g:shipping>
        <g:country>SE</g:country>
        <g:service>${s.service}</g:service>
        <g:price>${frakt.toFixed(2)} SEK</g:price>
        <g:min_transit_time>${s.minTransitDays}</g:min_transit_time>
        <g:max_transit_time>${s.maxTransitDays}</g:max_transit_time>
      </g:shipping>`;

  const kod = gtin && /^\d{13}$/.test(gtin) ? gtin : null;
  const ut = kod ? item.replace(IDENTIFIER_RE, "") : item;
  const gtinTagg = kod ? `\n      <g:gtin>${kod}</g:gtin>` : "";

  return ut.replace(LABEL_RE, "").replace(/\n?[ \t]*<\/item>$/, `${gtinTagg}${shipping}\n    </item>`);
}

/**
 * Hela Google-flödet → GoWish-flödet. `gtin` är g:id → kod för de varor som
 * får en g:gtin (gtinUrval i lib/feed/prisjakt.ts).
 */
export function tillGowish(googleXml: string, s: GowishShipping, gtin: ReadonlyMap<string, string> = new Map()): string {
  const items: string[] = [];
  for (const m of googleXml.matchAll(ITEM_RE)) {
    const id = gtin.size > 0 ? (m[0].match(ID_RE)?.[1] ?? "") : "";
    const ut = gowishItem(m[0], s, gtin.get(id));
    if (ut) items.push(`    ${ut}`);
  }

  const huvud = googleXml.slice(0, googleXml.search(/<channel>/) + "<channel>".length).trimEnd();
  const kanal = (googleXml.match(/<channel>([\s\S]*?)(?=\s*<item>|\s*<\/channel>)/)?.[1] || "")
    .replace(/<description>[^<]*<\/description>/, "<description>Fyndplats produktkatalog för GoWish – noga utvalda fynd till smarta priser.</description>")
    .trimEnd();

  return `${huvud}${kanal}
${items.join("\n")}
  </channel>
</rss>`;
}

/** Antalen till loggraden: varor, i lager, med kod och med reapris. */
export function gowishRakning(xml: string): { varor: number; iLager: number; gtin: number; rea: number } {
  const antal = (s: string) => xml.split(s).length - 1;
  return {
    varor: antal("<item>"),
    iLager: antal("<g:availability>in_stock</g:availability>"),
    gtin: antal("<g:gtin>"),
    rea: antal("<g:sale_price>"),
  };
}
