// Påhittade VEVOR-sidor för testerna. Bara för tester.
//
// Formen följer de riktiga sidorna (uppmätt 2026-10-29): `<html lang>`,
// `window.GLOBAL`, `window.PRODUCT_DATA`, JSON-LD med Product och
// BreadcrumbList, specifikationstabellen, punktlistan, den inbäddade
// beskrivningen, bildlistan och syskonlänkarna. Varje nummer, adress och pris
// här är påhittat.

import type { Avlasning } from "./lager";

export interface Testsida {
  sku: string;
  webbId: string;
  lang: string;
  globalLang: string;
  valuta: string;
  /** Sajtens egen valuta i `window.GLOBAL`. Samma som erbjudandets om den inte anges. */
  globalValuta: string | null;
  /** Ett andra erbjudande i JSON-LD, eller null. Har aldrig mätts på en riktig sida. */
  extraErbjudande: { valuta: string; pris: number } | null;
  pris: number | string | null;
  lager: number | string | null;
  tillganglighet: string;
  ldSku: string | null;
  frakt: { land: string[]; belopp: number; valuta: string }[];
  flode: string;
  manual: boolean;
  /** Utan produktdata, som VEVOR:s 404-sida. */
  utanProdukt: boolean;
  /** JSON-LD:s `aggregateRating`, eller null för en sida utan betyg. */
  betyg: Record<string, unknown> | null;
  /** JSON-LD:s `review`. */
  recensioner: Record<string, unknown>[];
  /**
   * Sidmallen. `gammal` har specifikationen och punktlistan i HTML:en, `ny`
   * bara i `PRODUCT_DATA` (uppmätt 2026-10-30), `utan` har dem ingenstans.
   */
  mall: "gammal" | "ny" | "utan";
}

/** En påhittad recension i JSON-LD:s form. */
export function testrecension(over: Record<string, unknown> = {}): Record<string, unknown> {
  return {
    "@type": "Review",
    reviewRating: { "@type": "Rating", ratingValue: 5, bestRating: 5 },
    author: { "@type": "Person", name: "Test P." },
    datePublished: "2026-09-14T08:00:00+02:00",
    reviewBody: "Stabil och lätt att montera, hjulen rullar fint i sanden. Rekommenderas.",
    ...over,
  };
}

export const TESTSKU = "TESTSKUABCDEFGH0001";
export const TESTWEBBID = "000000000001";
export const testSokvag = (webbId = TESTWEBBID) => `/testkategori-c_100/test-produkt-p_${webbId}`;

export function testsida(over: Partial<Testsida> = {}): string {
  const t: Testsida = {
    sku: TESTSKU,
    webbId: TESTWEBBID,
    lang: "sv",
    globalLang: "sv",
    valuta: "SEK",
    globalValuta: null,
    extraErbjudande: null,
    pris: 999.5,
    lager: 12,
    tillganglighet: "https://schema.org/InStock",
    ldSku: null,
    frakt: [
      { land: ["LI", "MC"], belopp: 5, valuta: "EUR" },
      { land: ["DE", "SE", "DK"], belopp: 0, valuta: "EUR" },
    ],
    flode: "EU",
    manual: true,
    utanProdukt: false,
    betyg: { "@type": "AggregateRating", ratingValue: 4.5, reviewCount: 12 },
    recensioner: [testrecension()],
    mall: "gammal",
    ...over,
  };
  const global = `<script>window.GLOBAL = window.GLOBAL || {};</script>
<script>window.GLOBAL = {"CLOSINGDOWN_NOTICE":"null","PIPELINE":"EU","LANG":"${t.globalLang}","CURRENCY":"${t.globalValuta ?? t.valuta}","SITE_NAME":"Test {med} klamrar"};</script>`;
  if (t.utanProdukt) {
    return `<!DOCTYPE html><html lang="${t.lang}"><head><title>404 Ej Hittad</title>${global}</head><body>${"x".repeat(3000)}</body></html>`;
  }
  const produktdata = {
    goodsSn: t.sku,
    goodsSpu: "12345",
    stock: t.lager,
    pipelineCode: t.flode,
    title: "Testprodukt från data",
    attr: { " Färg": "Svart", Storlek: "Stor" },
    // Den nya sidmallens form: numrerade nycklar, inledande mellanslag och
    // nycklarna i en annan ordning än sidans.
    ...(t.mall === "ny"
      ? {
          sellingPoint: ["Hållbar: ram i <b>kolstål</b>.", " Enkel montering &amp; skötsel. ", ""],
          goodsDescAttrList: {
            "9": { descAttrName: " Maximal lastkapacitet", descAttrValue: " 90,7 kg" },
            "8": { descAttrName: "Artikelmodellnummer", descAttrValue: " TEST-1" },
            "10": { descAttrName: " Tom", descAttrValue: " " },
          },
        }
      : {}),
  };
  const bild = (fil: string, mapp = t.sku) =>
    `https://img.example-cdn.test/us/${mapp}/original_img-v2/${fil}?timestamp=1&format=webp&format=webp`;
  const bilder = [
    { type: "img", origin: bild("test-m100-1.2.jpg"), bigSrc: bild("test-m100-1.2.jpg").replace("original_img", "goods_img_big"), alt: "None" },
    { type: "video", video: "https://video.example-cdn.test/test.mp4", cover: bild("test-cover.jpg") },
    { type: "img", origin: bild("test-f1.jpg"), alt: "None" },
    { type: "img", origin: bild("test-annan.jpg", "ANNANMAPP0000000001"), alt: "None" },
  ];
  const syskon = [
    { url: `https://eur.vevor.com/testkategori-c_100/syskon-p_000000000002`, webGoodSn: "000000000002", goodSn: "TESTSKUSYSKON000002", canBuy: 1 },
    { url: `https://eur.vevor.com${testSokvag(t.webbId)}`, webGoodSn: t.webbId, goodSn: t.sku, canBuy: 1 },
  ];
  const ld = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: "VEVOR Testprodukt, 90 kg lastkapacitet &amp; 7 hållare",
    sku: t.ldSku ?? t.sku,
    mpn: t.ldSku ?? t.sku,
    brand: { "@type": "Brand", name: "VEVOR" },
    ...(t.betyg ? { aggregateRating: t.betyg } : {}),
    ...(t.recensioner.length > 0 ? { review: t.recensioner } : {}),
    offers: [
      {
        "@type": "Offer",
        priceCurrency: t.valuta,
        price: t.pris,
        availability: t.tillganglighet,
        shippingDetails: t.frakt.map((f) => ({
          "@type": "OfferShippingDetails",
          shippingDestination: f.land.map((l) => ({ "@type": "DefinedRegion", addressCountry: l })),
          shippingRate: { "@type": "MonetaryAmount", value: f.belopp, currency: f.valuta },
        })),
      },
      ...(t.extraErbjudande
        ? [
            {
              "@type": "Offer",
              priceCurrency: t.extraErbjudande.valuta,
              price: t.extraErbjudande.pris,
              availability: t.tillganglighet,
            },
          ]
        : []),
    ],
  };
  const brod = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: "https://eur.vevor.com" },
      { "@type": "ListItem", position: 3, name: "Underkategori", item: "https://eur.vevor.com/under-c_200" },
      { "@type": "ListItem", position: 2, name: "Toppkategori", item: "https://eur.vevor.com/topp-c_100" },
    ],
  };
  return `<!DOCTYPE html>
<html lang="${t.lang}" class="ROOT-LANG-${t.lang}">
<head><title>Testprodukt</title>${global}
<script type="application/ld+json">${JSON.stringify(ld)}</script>
<script type="application/ld+json">${JSON.stringify(brod)}</script>
<script>window.PRODUCT_DATA = ${JSON.stringify(produktdata)};</script>
<script>window.PRODUCT_DATA_PRICE = "aW50ZSBlbiBzaWZmcmE=";</script>
<script>window.AGGIMAGEANDVIDEOLIST = ${JSON.stringify(bilder)};</script>
<script>window.DETAIL_ATTR_LINK = ${JSON.stringify(syskon)};</script>
</head><body>
${t.mall === "gammal" ? GAMMAL_MALL : ""}
<div id="js-DM_at-goodDescRich"><html><head><style>.x { color: red; }</style></head><body><h3>Prestanda</h3><p>Denna testvagn klarar terräng.</p></body></html></div>
${t.manual ? '<a href="/pages/contact-us/TESTMANUAL01">Manual</a>' : ""}
<a href="https://eur.vevor.com/pages/contact-us">Kontakt</a>
${"<!-- utfyllnad -->".repeat(200)}
</body></html>`;
}

/** Specifikationen och punktlistan i HTML:en, som den gamla sidmallen har dem. */
const GAMMAL_MALL = `<section><ul class="detailGuide_cont js-toggleCont"> <li> Hållbar: ram i <b>kolstål</b>. </li> <li> Enkel montering &amp; skötsel. </li> </ul></section>
<section><div class="DM_at-goodsDescAttrInner">
<dl class="goodsDesc_item goodsDesc_item_even"> <dt>Artikelmodellnummer</dt> <dd> TEST-1</dd> </dl>
<dl class="goodsDesc_item "> <dt> Maximal lastkapacitet</dt> <dd> 90,7 kg</dd> </dl>
</div></section>`;

/** VEVOR:s robots.txt som den stod 2026-10-29. */
export const VEVOR_ROBOTS = `User-agent: *

Disallow: /deals?categoryIdList=
Disallow: /*?star
Disallow: /*?sort_by
Disallow: /*?sort
Disallow: /*?type
Disallow: /*?rate
Disallow: /products/*
Disallow: /collections/*
Disallow: /product/*
Disallow: /wp-content/uploads/wc-logs/
Disallow: /wp-content/uploads/woocommerce_transient_files/
Disallow: /wp-content/uploads/woocommerce_uploads/
Disallow: /wp-admin/
Allow: /wp-admin/admin-ajax.php

User-agent: facebookcatalog/1.0
Disallow: /*.mp4$

User-agent: Googlebot
Disallow: /api/*
Disallow: /wp/*
Sitemap: https://eur.vevor.com/sitemap/sitemap-index.xml
`;

/** En påhittad bild i produktens egen mapp, i VEVOR:s form (snedstrecken kodade). */
export function testbild(fil: string, mapp = TESTSKU): string {
  return `https://img.example-cdn.test/us%2F${mapp}%2Foriginal_img-v1%2Ftest-produkt-${fil}?timestamp=1`;
}

/** Galleriet i VEVOR:s vanliga mönster: m100-1.2, f1–f6, m100-1.12, m100-9 till m100-12. */
export function testgalleri(mapp = TESTSKU): { url: string; egen: boolean }[] {
  const namn = ["m100-1.2.jpg", "f1.jpg", "f2.jpg", "f3.jpg", "f4.jpg", "f5.jpg", "f6.jpg", "m100-1.12.jpg"];
  for (let i = 9; i <= 12; i++) namn.push(`m100-${i}.jpg`);
  return namn.map((n) => ({ url: testbild(n, mapp), egen: true }));
}

/** En påhittad giltig avläsning i lager. Bara för tester. */
export function testAvlasning(over: Partial<Avlasning> = {}): Avlasning {
  const sku = over.sku ?? TESTSKU;
  return {
    sku,
    spu: "12345",
    namn: "VEVOR Testvagn, 90 kg lastkapacitet",
    prisSek: 1240,
    saldo: 12,
    flode: "EU",
    levererasTillSe: true,
    fraktSe: { belopp: 5, valuta: "EUR" },
    kategorier: [
      { id: "100", namn: "Toppkategori" },
      { id: "200", namn: "Underkategori" },
    ],
    egenskaper: [["Färg", "Svart"]],
    spec: [
      ["Artikelmodellnummer", "TEST-1"],
      ["Maximal lastkapacitet", "90,7 kg"],
    ],
    punkter: ["Hållbar: ram i kolstål.", "Enkel montering & skötsel."],
    beskrivning: "Prestanda\nDenna testvagn klarar terräng & <grus>.",
    bilder: testgalleri(sku),
    manualSokvag: "/pages/contact-us/TESTMANUAL01",
    syskon: [],
    webbId: TESTWEBBID,
    sokvag: testSokvag(),
    lastAt: "2026-10-29T10:00:00.000Z",
    status: "i_lager",
    toppkategoriId: "100",
    toppkategori: "Toppkategori",
    borta: false,
    bortaAt: null,
    misslyckadAt: null,
    betyg: { snitt: 4.5, antal: 12 },
    recensioner: [],
    ...over,
  };
}
