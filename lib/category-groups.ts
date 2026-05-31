// Premium-utvalda huvudgrupper för /butik och hemsidans kategorisektion.
// Mappar Wix-kategorinamn till en uttalad hierarki + curated hero-produkter.
// Eftersom Wix V3 saknar äkta hierarki och hero-bilder per kategori bygger vi
// upplevelsen själva: 1) väl handplockade hero-produkter (clean, ingen text-overlay),
// 2) en kort tagline per kategori, 3) en uttalad underkategori-grupp.

import type { Product, Collection } from "./products";

export type MainGroup = {
  main: string;          // Wix-katalogens kategorinamn
  tag: string;           // Kort 1-rads tagline för premium UX
  subs: string[];        // Subkategori-namn (måste finnas i Wix-katalogen)
  heroPicks: string[];   // Curated produkt-slugs för hero-bild (clean, premium)
};

export const MAIN_GROUPS: MainGroup[] = [
  {
    main: "Hem & Inredning",
    tag: "Detaljer som lyfter ditt hem",
    subs: ["Kök & Matlagning", "Köksredskap & Tillbehör", "Hemtextil & Badrum"],
    heroPicks: [
      "magnetisk-knivhallare-akacia-vaggmonterad-knivlist",
      "astronaut-stjarnprojektor",
      "4-pack-glas-ribbad-design",
    ],
  },
  {
    main: "Elektronik",
    tag: "Smart teknik för vardagen",
    subs: ["Mobil & Surfplatta", "Ljud & Hörlurar", "Dator & Gaming"],
    heroPicks: [
      "elektrisk-mjolkskummare",
      "elektrisk-vinoppnare",
      "mini-luftfuktare",
    ],
  },
  {
    main: "Hudvård & Ansikte",
    tag: "Egentid för hud och välmående",
    subs: ["Kropp & Välbefinnande"],
    heroPicks: [
      "gua-sha-massagesten-i-akta-jade",
      "ansiktsroller-massageverktyg-for-ansikte-och-ogon",
      "ultratunna-foundationborstar-2-pack-precisionsborste",
    ],
  },
  {
    main: "Mode & Accessoarer",
    tag: "Tidlösa stilval och accessoarer",
    subs: ["Kläder & Skor", "Smycken"],
    heroPicks: [
      "trendigt-snake-chain-kedjehalsband-slat",
    ],
  },
  {
    main: "Barn & Familj",
    tag: "Genomtänkta favoriter för familjen",
    subs: ["Leksaker & Spel"],
    heroPicks: [
      "montessori-musikset-i-tra-5-delars",
      "babygym-i-tra-stabil-aktivitetsstallning",
      "mjuk-huva-handduk-i-coral-fleece",
    ],
  },
  {
    main: "Husdjur",
    tag: "Det bästa för dina fyrbenta vänner",
    subs: [],
    heroPicks: [],
  },
  {
    main: "Friluftsliv & Resa",
    tag: "Smart utrustning för utomhusliv och resa",
    subs: [],
    heroPicks: ["digital-bagagevag"],
  },
];

// Produkter med text-overlays, brand-loggor eller plastförpackningar — undvik som hero.
export const MOSAIC_DENYLIST = new Set<string>([
  "sladdlos-handdammsugare-bil", "rgb-led-slinga", "digital-stektermometer",
  "tradlos-ergonomisk-mus-4000-dpi-99", "automatisk-tvaldispenser-touchless-sensor-skum",
  "doktorsset-i-silikon-pedagogisk-leksak", "tragavobox-for-bebis-handgjort-presentset",
  "massagepistol-led-skarm", "elektrisk-sonisk-tandborste",
  "tandgnisselskena-for-nattbruk-och-tandskydd",
  "tandblekningsremsor-effektiv-hemmablekning-med-mintsmak",
  "whiskey-stenar-i-rostfritt-stal-4", "oljesprayer-glas-2-i-1",
  "arcade-basketbollspel-for-hemmet-justerbart-stabil",
  "barnens-bilformade-lektalt-inomhus-playhouse-hopfallbart",
  "svart-multifunktionell-makeupborste", "uppvarmd-ogonmask",
  "roterande-sminkforvaring-360",
]);

export type GroupCard = {
  main: Collection;            // huvudkategori
  tag: string;
  count: number;
  heroImg: string;
  subs: { id: string; name: string; slug: string; count: number; img: string }[];
};

// Bygger upp alla huvudgrupper med hero-bild + sub-kategorier från live-katalogen.
// Resilient mot katalog-ändringar: hoppar över saknade kategorier, faller tillbaka
// på första non-denylisted produkten om curated hero saknas.
export function buildGroupCards(products: Product[], collections: Collection[]): GroupCard[] {
  const counts = new Map<string, number>();
  for (const p of products) for (const cid of (p.collectionIds || [])) counts.set(cid, (counts.get(cid) || 0) + 1);
  const collBySlug = new Map<string, Collection>();
  const collByName = new Map<string, Collection>();
  for (const c of collections) { collBySlug.set(c.slug, c); collByName.set(c.name, c); }

  const cards: GroupCard[] = [];
  for (const g of MAIN_GROUPS) {
    const mainCol = collByName.get(g.main);
    if (!mainCol) continue;
    const inCat = products.filter((p) => p.img && (p.collectionIds || []).includes(mainCol.id));
    if (inCat.length === 0) continue;
    const slugMap = new Map(inCat.map((p) => [p.slug, p]));

    // Hero: curated → non-denylisted → any
    let heroImg = "";
    for (const slug of g.heroPicks) {
      const p = slugMap.get(slug);
      if (p) { heroImg = p.img; break; }
    }
    if (!heroImg) {
      const p = inCat.find((x) => !MOSAIC_DENYLIST.has(x.slug)) || inCat[0];
      heroImg = p?.img || "";
    }

    const subs = g.subs
      .map((subName) => {
        const sc = collByName.get(subName);
        if (!sc) return null;
        const subProducts = products.filter((p) => p.img && (p.collectionIds || []).includes(sc.id));
        if (subProducts.length === 0) return null;
        // Sub-thumb: första non-denylisted produkt
        const thumb = subProducts.find((p) => !MOSAIC_DENYLIST.has(p.slug)) || subProducts[0];
        return {
          id: sc.id,
          name: sc.name,
          slug: sc.slug,
          count: counts.get(sc.id) || 0,
          img: thumb?.img || "",
        };
      })
      .filter((x): x is NonNullable<typeof x> => x !== null);

    cards.push({
      main: mainCol,
      tag: g.tag,
      count: counts.get(mainCol.id) || 0,
      heroImg,
      subs,
    });
  }
  return cards;
}
