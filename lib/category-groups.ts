// Premium-utvalda huvudgrupper för /butik och hemsidans kategorisektion.
// Mappar Wix-kategorinamn till en uttalad hierarki + curated hero-produkter.
// Eftersom Wix V3 saknar äkta hierarki och hero-bilder per kategori bygger vi
// upplevelsen själva: 1) väl handplockade hero-produkter (clean, ingen text-overlay),
// 2) en kort tagline per kategori, 3) en uttalad underkategori-grupp.

import { cache } from "react";
import { getProducts, getCollections } from "./products";
import type { Product, Collection } from "./products";

export type MainGroup = {
  main: string;          // Wix-katalogens kategorinamn
  tag: string;           // Kort 1-rads tagline för premium UX
  subs: string[];        // Subkategori-namn (måste finnas i Wix-katalogen)
  heroPicks: string[];   // Curated produkt-slugs för hero-bild (clean, premium)
};

// Curated huvudgrupper för /butik- och hemsidans kategorisektioner. Sub-namnen
// MÅSTE matcha Wix V3-katalogens kategorinamn exakt (uppdaterat efter
// omstruktureringen 2026-05-31: 8 huvud + 34 sub). heroPicks är valfria — saknas
// en curated slug i kategorin faller buildGroupCards tillbaka på första rena
// (non-denylisted) produktbilden, så listan behöver inte vara komplett.
export const MAIN_GROUPS: MainGroup[] = [
  {
    main: "Elektronik & Tillbehör",
    tag: "Smart teknik för vardagen",
    subs: ["Mobiltillbehör", "Laddare & Kablar", "Dator & Gaming", "Hörlurar & Ljud"],
    heroPicks: ["mini-luftfuktare"],
  },
  {
    main: "Hem & Inredning",
    tag: "Detaljer som lyfter ditt hem",
    subs: ["Hushållsapparater", "Belysning", "Förvaring & Organisering", "Badrum & Hemtextil", "Verktyg & Hemmafix", "Kalas & Fest", "Dekoration & Prydnad"],
    heroPicks: ["astronaut-stjarnprojektor"],
  },
  {
    main: "Kök & Husgeråd",
    tag: "Allt för matlagning och dukning",
    subs: ["Köksredskap & Tillbehör", "Köksmaskiner & Apparater", "Servering & Glas"],
    heroPicks: ["magnetisk-knivhallare-akacia-vaggmonterad-knivlist", "4-pack-glas-ribbad-design"],
  },
  {
    main: "Barn & Familj",
    tag: "Genomtänkta favoriter för familjen",
    subs: ["Baby & Småbarn", "Leksaker & Spel"],
    heroPicks: ["montessori-musikset-i-tra-5-delars", "babygym-i-tra-stabil-aktivitetsstallning"],
  },
  {
    main: "Skönhet & Hälsa",
    tag: "Egentid för hud och välmående",
    subs: ["Hudvård & Ansikte", "Massage & Återhämtning", "Kropp & Välbefinnande", "Hår & Rakning"],
    heroPicks: ["gua-sha-massagesten-i-akta-jade", "ansiktsroller-massageverktyg-for-ansikte-och-ogon"],
  },
  {
    main: "Husdjur",
    tag: "Det bästa för dina fyrbenta vänner",
    subs: ["Lek & Tillbehör för husdjur", "Selar, Koppel & Transport", "Pälsvård & Skötsel", "Burar, Kläder & Tillbehör", "Mat & Vattenskålar"],
    heroPicks: [],
  },
  {
    main: "Sport & Fritid",
    tag: "Smart utrustning för träning, resa och uteliv",
    subs: ["Bil & Cykel", "Friluftsliv & Resa", "Träning & Gym"],
    heroPicks: ["digital-bagagevag"],
  },
  {
    main: "Mode & Accessoarer",
    tag: "Tidlösa stilval och accessoarer",
    subs: ["Smycken", "Klockor & Solglasögon", "Väskor & Necessärer", "Skor"],
    heroPicks: ["trendigt-snake-chain-kedjehalsband-slat"],
  },
];

// ── Kategori-hero-bilder (Unsplash) ───────────────────────────────────────
// Curated lifestyle-hero per kategori (huvud- OCH underkategori), så varje
// /kategori-sida får en vacker, on-brand hjältebild i stället för "första
// produktbilden" (som för Hem & Inredning blev en bukett hjärtballonger —
// granskningens #1 kategori-fel). Kategorier utan curated hero faller fortfarande
// tillbaka på den högst bild-poängsatta produktbilden (categoryHero returnerar "").
//
// Alla bilder är Unsplash License (fri kommersiell användning, ingen attribution
// krävs). Varje rad dokumenterar foto-sidans URL för spårbarhet/attribution.
// Bilderna är visuellt granskade (rätt motiv, inga konkurrent-varumärken) innan
// hårdkodning. images.unsplash.com är whitelistad i next.config.ts.
// Leverera bilden FÖRKROPPAD till kortets bildförhållande (5:4) med center-crop.
// Tidigare (?w=1600&fit=crop utan höjd) returnerade Unsplash källans egna
// landskaps­proportioner (≈3:2), och .butik-cat-img/.kat-hero-img (aspect 5/4,
// object-fit:cover) beskar då bilden en andra gång i webbläsaren → motivet såg
// inzoomat/konstigt beskuret ut (Leonards mobil-rapport). Genom att be Unsplash
// crop:a till exakt 5:4 (w=1600&h=1280) med crop=center matchar levererad bild
// behållaren → ingen dubbelbeskärning, kontrollerad center-framing.
const UNSPLASH = (id: string) =>
  `https://images.unsplash.com/photo-${id}?q=80&w=1600&h=1280&fit=crop&crop=center&auto=format`;

export const CATEGORY_HERO_IMAGES: Record<string, string> = {
  // Skandinavisk vardagsrumsscen, gul fåtölj, mässingslampa, solljus — lugn & premium.
  // https://unsplash.com/photos/1586023492125-27b2c045efd7
  "Hem & Inredning": UNSPLASH("1586023492125-27b2c045efd7"),
  // Laptop, hörlurar, telefon på rent vitt skrivbord — minimal teknik.
  // https://unsplash.com/photos/1498049794561-7780e7231661
  "Elektronik & Tillbehör": UNSPLASH("1498049794561-7780e7231661"),
  // Ljust vitt kök med marmorbänk, citroner, blommor — varmt & inbjudande.
  // https://unsplash.com/photos/1556911220-bff31c812dba
  "Kök & Husgeråd": UNSPLASH("1556911220-bff31c812dba"),
  // Bebis som leker med träleksaker, flat-lay ovanifrån — genomtänkt & mjukt.
  // https://unsplash.com/photos/1515488042361-ee00e0ddd4e4
  "Barn & Familj": UNSPLASH("1515488042361-ee00e0ddd4e4"),
  // Ansiktsbehandling/spa — hud & välmående, varma toner, inget varumärke.
  // https://unsplash.com/photos/1570172619644-dfd03ed5d881
  "Skönhet & Hälsa": UNSPLASH("1570172619644-dfd03ed5d881"),
  // Katt och hund som myser i gräset — varmt & hjärtligt.
  // https://unsplash.com/photos/1450778869180-41d0601e046e
  "Husdjur": UNSPLASH("1450778869180-41d0601e046e"),
  // Vandrare på väg mot snöklädda berg — friluftsliv & äventyr.
  // https://unsplash.com/photos/1551632811-561732d1e306
  "Sport & Fritid": UNSPLASH("1551632811-561732d1e306"),
  // Stilfull kvinna i vinröd kappa med kassar — mode & accessoarer.
  // https://unsplash.com/photos/1483985988355-763728e1935b
  "Mode & Accessoarer": UNSPLASH("1483985988355-763728e1935b"),

  // ── Merchandising-sidor (REA & Populära) ────────────────────────────────
  // Auto-fyllda säljytor (ej Wix-avdelningar). Egen curated hero så de får SAMMA
  // breda 5:4 lifestyle-behandling som huvudkategorierna ovan (`.kat-hero-img`).
  // OBS: build-miljön kan INTE nå/förhandsgranska Unsplash (alla bild-värdar 403:ar),
  // så REA pekar medvetet på Mode-sidans VERIFIERADE foto (kvinna med shoppingkassar)
  // för att garantera rätt motiv i stället för en blind gissning — byt till valfritt
  // dedikerat foto på en rad. (Det tidigare "1583454110551"-ID:t var felmärkt "läderväska"
  // men visar i själva verket en gym-scen → används även av subkat "Väskor & Necessärer".)
  "REA": UNSPLASH("1483985988355-763728e1935b"),     // shoppingkassar (verifierat, = Mode-sidan)
  "Populära": UNSPLASH("1561828995-aa79a2db86dd"),   // guldsmycken flat-lay (overifierat — kan bytas)

  // ── Underkategori-hero-bilder ───────────────────────────────────────────
  // Curated lifestyle-hero per underkategori (samma kvalité/stil som huvud-
  // kategorierna ovan). Tidigare föll subsidorna tillbaka på första rena
  // produktbilden (categoryHero() → ""), vilket gav ojämn, ibland tråkig hero.
  // Nu får varje sub en egen on-brand lifestyle-bild → samma upplevelse som
  // huvudkategori-sidorna och /butik-korten.
  //
  // Nyckeln MÅSTE matcha Wix V3-katalogens kategorinamn EXAKT (hämtade live via
  // /categories/v1/categories/query 2026-06-01). Bilderna är Unsplash License
  // (fri kommersiell användning, ingen attribution krävs) och visuellt granskade
  // i contact sheet 2026-06-01 (foto-realistiska, varmt ljus, relevant motiv,
  // inga konkurrent-varumärken/vattenstämplar, inga AI-renders). Levereras crop:ade
  // till 5:4 av UNSPLASH() → matchar .kat-hero-img-behållaren utan dubbelbeskärning.

  // Kök & Husgeråd
  "Köksredskap & Tillbehör": UNSPLASH("1556909211-36987daf7b4d"), // ljust kök, skärbrädor + redskap i kanna
  "Köksmaskiner & Apparater": UNSPLASH("1668910231038-e342ad670789"), // vit köksbänk med små apparater
  "Servering & Glas": UNSPLASH("1560145725-8cbf9768b73a"), // eleganta vinglas på dukat bord

  // Skönhet & Hälsa
  "Hudvård & Ansikte": UNSPLASH("1739980104488-408eff709fff"), // hudvårdsflaskor på ljus yta
  "Massage & Återhämtning": UNSPLASH("1610402601271-5b4bd5b3eba4"), // ryggmassage med varma stenar
  "Hår & Rakning": UNSPLASH("1564141696939-9eb6e957ccfc"), // friskt, böljande hår
  "Kropp & Välbefinnande": UNSPLASH("1535007829477-d13662ffb714"), // lugn självomvårdnad vid fönster

  // Mode & Accessoarer
  "Smycken": UNSPLASH("1561828995-aa79a2db86dd"), // guldsmycken flat-lay
  "Klockor & Solglasögon": UNSPLASH("1629139033414-76f3c0eacf84"), // klocka + solglasögon flat-lay
  "Skor": UNSPLASH("1600185365483-26d7a4cc7519"), // ren sneaker, ljus bakgrund
  "Väskor & Necessärer": UNSPLASH("1583454110551-21f2fa2afe61"), // läderväska, mode

  // Barn & Familj
  "Baby & Småbarn": UNSPLASH("1618842676088-c4d48a6a7c9d"), // staplingsleksak i trä, mjuka toner
  "Leksaker & Spel": UNSPLASH("1596066190600-3af9aadaaea1"), // barn leker med träleksaker

  // Elektronik & Tillbehör
  "Hörlurar & Ljud": UNSPLASH("1546435770-a3e426bf472b"), // hörlurar på stativ
  "Laddare & Kablar": UNSPLASH("1557767382-97b28f5488e7"), // telefon som laddas, minimal
  "Mobiltillbehör": UNSPLASH("1573739022854-abceaeb585dc"), // mobil + tillbehör flat-lay
  "Dator & Gaming": UNSPLASH("1614179924047-e1ab49a0a0cf"), // gaming-setup med RGB-ljus

  // Hem & Inredning
  "Belysning": UNSPLASH("1517991104123-1d56a6e81ed9"), // varm bordslampa
  "Dekoration & Prydnad": UNSPLASH("1623244307563-f9ade3df13c0"), // vas med pampasgräs, minimal
  "Förvaring & Organisering": UNSPLASH("1601330862030-1e08c703ac04"), // flätade förvaringskorgar
  "Hushållsapparater": UNSPLASH("1586208958839-06c17cacdf08"), // ljust kök med apparater
  "Badrum & Hemtextil": UNSPLASH("1616663717839-2fea42e1a1f6"), // mjuka handdukar, badrum
  "Verktyg & Hemmafix": UNSPLASH("1426927308491-6380b6a9936f"), // organiserad verktygsvägg
  "Kalas & Fest": UNSPLASH("1556125574-d7f27ec36a06"), // festscen med ljusslingor

  // Husdjur
  "Pälsvård & Skötsel": UNSPLASH("1675430426271-d74b542f21e4"), // hund som borstas
  "Selar, Koppel & Transport": UNSPLASH("1530700131180-d43d9b8cc41f"), // hundpromenad i koppel
  "Burar, Kläder & Tillbehör": UNSPLASH("1581888227599-779811939961"), // hund i mysig bädd
  "Mat & Vattenskålar": UNSPLASH("1695023265600-07f536e8ca4c"), // glad hund, husdjurslivsstil
  "Lek & Tillbehör för husdjur": UNSPLASH("1545249390-6bdfa286032f"), // kattunge som leker

  // Sport & Fritid
  "Träning & Gym": UNSPLASH("1705909237050-7a7625b47fac"), // träning med vikter
  "Friluftsliv & Resa": UNSPLASH("1501555088652-021faa106b9b"), // vandrare med ryggsäck, berg
  "Bil & Cykel": UNSPLASH("1541625602330-2277a4c46182"), // cyklister på väg
};

// Returnerar curated Unsplash-hero för en huvudkategori, annars "" (→ sidan
// faller tillbaka på första rena produktbilden, oförändrat beteende för subs).
export function categoryHero(name: string): string {
  return CATEGORY_HERO_IMAGES[name] || "";
}

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
  thumbs: string[];            // upp till 4 produktbilder för hemsidans 2×2-mosaikkort
  subs: { id: string; name: string; slug: string; count: number; img: string }[];
};

// 2-nivå kategori-träd för navigerings-dropdown:n. Bygger på MAIN_GROUPS-
// hierarkin (samma som /butik), så användaren ser samma struktur överallt.
// Kategorier som finns i katalogen men inte i MAIN_GROUPS hamnar som extra
// rötter utan subs (defensivt mot katalog-ändringar — inga produkter "tappas").
export type CategoryNode = {
  id: string;
  name: string;
  slug: string;
  count: number;
  subs: { id: string; name: string; slug: string; count: number }[];
};

// Marknadsförings-kollektioner som finns i katalogen men inte hör hemma i
// kategori-navigeringen (de är "rea/populärt"-urval, inte en avdelning).
// Varje produkt ligger även i sin riktiga huvudkategori, så inget tappas.
export const NAV_EXCLUDED = new Set<string>(["Populära", "REA", "Sale", "All Products"]);

// Bygger 2-nivå-trädet direkt ur Wix V3-hierarkin (collection.parentId/index)
// i stället för en hårdkodad namn-mappning — så navet följer katalogen
// automatiskt när butiken omstruktureras. Räknar produkter per kategori via
// collectionIds (exakt det /kategori-sidan filtrerar på, så count = vad sidan visar).
//   • roots  = parentlösa kategorier (de 8 huvudkategorierna), promo-urval bortfiltrerade
//   • subs   = barn vars parentId pekar på huvudkategorin, sorterade på Wix-index
//   • ordning: huvudkategorier efter antal (störst först), tom kategori utesluts
export function buildCategoryTree(products: Product[], collections: Collection[]): CategoryNode[] {
  const counts = new Map<string, number>();
  for (const p of products) for (const cid of (p.collectionIds || [])) counts.set(cid, (counts.get(cid) || 0) + 1);

  const childrenByParent = new Map<string, Collection[]>();
  for (const c of collections) {
    if (!c.parentId) continue;
    const arr = childrenByParent.get(c.parentId) || [];
    arr.push(c);
    childrenByParent.set(c.parentId, arr);
  }

  const roots = collections
    .filter((c) => !c.parentId && !NAV_EXCLUDED.has(c.name) && (counts.get(c.id) || 0) > 0)
    .map((mainCol) => {
      const children = childrenByParent.get(mainCol.id) || [];
      const subs = children
        .filter((sc) => (counts.get(sc.id) || 0) > 0)
        .sort((a, b) => a.index - b.index)
        .map((sc) => ({ id: sc.id, name: sc.name, slug: sc.slug, count: counts.get(sc.id) || 0 }));
      // Huvudkategorins antal = distinkta produkter i kategorin ELLER någon
      // underkategori (samma mängd som /kategori/<huvud-slug>-sidan visar), så
      // nav-siffran matchar sidan exakt.
      const ids = new Set([mainCol.id, ...children.map((c) => c.id)]);
      const count = products.filter((p) => (p.collectionIds || []).some((cid) => ids.has(cid))).length;
      return { id: mainCol.id, name: mainCol.name, slug: mainCol.slug, count, subs };
    })
    .sort((a, b) => b.count - a.count);

  return roots;
}

// Cachad hierarki för site-headern (mega-meny + mobil-drawer) och kategori-
// sidorna. getProducts/getCollections är redan promise-cachade, så detta
// round-trippar aldrig Wix mer än en gång per render; React cache() memoiserar
// dessutom själva träd-bygget per request.
export const getCategoryTree = cache(async (): Promise<CategoryNode[]> => {
  const [products, collections] = await Promise.all([getProducts(), getCollections()]);
  return buildCategoryTree(products, collections);
});

// Bygger upp alla huvudgrupper med hero-bild + sub-kategorier från live-katalogen.
// Resilient mot katalog-ändringar: hoppar över saknade kategorier, faller tillbaka
// på första non-denylisted produkten om curated hero saknas.
//
// PAGE-WIDE DEDUP: efter omklassningen ligger 207 produkter i BÅDE en huvud-
// kategori OCH 1–3 subkategorier. Utan dedup skulle samma produktbild kunna
// dyka upp som hero i en huvudkategori och som thumb i en sub i samma kort
// (eller som thumb i två olika sub-chips). Vi spårar därför använda product-
// slugs över HELA utdata och hoppar över redan-använda när vi väljer bilder.
export function buildGroupCards(products: Product[], collections: Collection[]): GroupCard[] {
  const counts = new Map<string, number>();
  for (const p of products) for (const cid of (p.collectionIds || [])) counts.set(cid, (counts.get(cid) || 0) + 1);
  const collByName = new Map<string, Collection>();
  for (const c of collections) collByName.set(c.name, c);

  // Huvudkategorins antal MÅSTE räknas på samma sätt som buildCategoryTree (och
  // /kategori-sidan): distinkta produkter i huvudkategorin ELLER någon underkategori
  // (via Wix parentId), inte bara de som ligger direkt i huvud-kollektionen. Annars
  // driftar siffran (startsida/butik visade 55 = enbart direkt, medan mega-nav och
  // /kategori visade 56 = huvud+sub). Re-audit 2026-05-31, fix #6.
  const childrenByParent = new Map<string, Collection[]>();
  for (const c of collections) {
    if (!c.parentId) continue;
    const arr = childrenByParent.get(c.parentId) || [];
    arr.push(c);
    childrenByParent.set(c.parentId, arr);
  }
  const mainCount = (mainId: string): number => {
    const ids = new Set([mainId, ...(childrenByParent.get(mainId) || []).map((c) => c.id)]);
    return products.filter((p) => (p.collectionIds || []).some((cid) => ids.has(cid))).length;
  };

  const usedImg = new Set<string>(); // product slug → redan visad någonstans i mosaiken
  const cards: GroupCard[] = [];
  for (const g of MAIN_GROUPS) {
    const mainCol = collByName.get(g.main);
    if (!mainCol) continue;
    const inCat = products.filter((p) => p.img && (p.collectionIds || []).includes(mainCol.id));
    if (inCat.length === 0) continue;
    const slugMap = new Map(inCat.map((p) => [p.slug, p]));

    // Hero: curated (oanvänd) → non-denylisted oanvänd → oanvänd → non-denylisted → any
    let heroImg = "";
    let heroSlug = "";
    for (const slug of g.heroPicks) {
      const p = slugMap.get(slug);
      if (p && !usedImg.has(slug)) { heroImg = p.img; heroSlug = slug; break; }
    }
    if (!heroImg) {
      const pick =
        inCat.find((x) => !MOSAIC_DENYLIST.has(x.slug) && !usedImg.has(x.slug)) ||
        inCat.find((x) => !usedImg.has(x.slug)) ||
        inCat.find((x) => !MOSAIC_DENYLIST.has(x.slug)) ||
        inCat[0];
      heroImg = pick?.img || "";
      heroSlug = pick?.slug || "";
    }
    if (heroSlug) usedImg.add(heroSlug);

    const subs = g.subs
      .map((subName) => {
        const sc = collByName.get(subName);
        if (!sc) return null;
        const subProducts = products.filter((p) => p.img && (p.collectionIds || []).includes(sc.id));
        if (subProducts.length === 0) return null;
        // Sub-thumb: non-denylisted oanvänd → oanvänd → non-denylisted → any
        const thumb =
          subProducts.find((p) => !MOSAIC_DENYLIST.has(p.slug) && !usedImg.has(p.slug)) ||
          subProducts.find((p) => !usedImg.has(p.slug)) ||
          subProducts.find((p) => !MOSAIC_DENYLIST.has(p.slug)) ||
          subProducts[0];
        if (thumb) usedImg.add(thumb.slug);
        return {
          id: sc.id,
          name: sc.name,
          slug: sc.slug,
          count: counts.get(sc.id) || 0,
          img: thumb?.img || "",
        };
      })
      .filter((x): x is NonNullable<typeof x> => x !== null);

    // Quad-mosaik-thumbs för hemsidans kategorikort: upp till 4 produktbilder ur
    // huvudkategorin ELLER någon av dess underkategorier. heroImg leder (curated,
    // ren bild), sedan fylls med oanvända non-denylisted bilder. Vi spårar valda
    // slugs i usedImg så de fyra korten på startsidan inte delar samma bild.
    const subIds = new Set(subs.map((s) => s.id));
    const thumbPool = products.filter(
      (p) => p.img && (p.collectionIds || []).some((cid) => cid === mainCol.id || subIds.has(cid))
    );
    const thumbs: string[] = [];
    if (heroImg) thumbs.push(heroImg); // heroSlug ligger redan i usedImg → ej dubblerad nedan
    const addThumbs = (clean: boolean) => {
      for (const p of thumbPool) {
        if (thumbs.length >= 4) break;
        if (usedImg.has(p.slug)) continue;
        if (clean && MOSAIC_DENYLIST.has(p.slug)) continue;
        thumbs.push(p.img);
        usedImg.add(p.slug);
      }
    };
    addThumbs(true);   // 1. oanvända, rena bilder
    addThumbs(false);  // 2. oanvända (tillåt denylistade hellre än tomt)
    // 3. sista utväg: < 4 produkter i kategorin → upprepa befintliga (CSS-padding
    //    täcker resten om poolen är helt tom).
    for (let i = 0; thumbs.length < 4 && thumbPool.length > 0; i++) {
      thumbs.push(thumbPool[i % thumbPool.length].img);
    }

    cards.push({
      main: mainCol,
      tag: g.tag,
      count: mainCount(mainCol.id),
      heroImg,
      thumbs,
      subs,
    });
  }
  return cards;
}
