async function () {
  // Genererad av runda N34:s bygg-steg.py ur ids, namn, seo, slugs, sku, kategori, vantat-hash och media-hash — aldrig skriven av.
  function fnv(s) {
    const b = new TextEncoder().encode(s);
    let h = 0xcbf29ce484222325n;
    const M = 0xFFFFFFFFFFFFFFFFn;
    for (const c of b) {
      h ^= BigInt(c);
      h = (h * 0x100000001b3n) & M;
    }
    return h.toString(16).padStart(16, "0");
  }
  const SUMMA = function (s) {
    let h = 0;
    for (const c of s) h = (h * 31 + (c.codePointAt(0) & 0xFFFF)) % 1000000007;
    return h;
  };
  const FACIT = [
    {"kort": "5022e9e5", "pid": "5022e9e5-b5af-427a-8d83-3a934aafe654", "namn": "Tvättskåp 70 × 38 cm med två tippbara korgar – vitt, lackerad MDF", "slug": "tvattskap-tva-tippbara-korgar-70x38-cm", "seoTitel": "Tvättskåp med två tippbara korgar | Fyndplats", "seoBesk": "Vitt tvättskåp 70 × 38 × 73 cm med två tippbara tvättkorgar med spjälförsedd front. Bär 30 kg totalt. Snabb leverans från Fyndplats.", "sku": "FP-tvattskap-tva-korgar", "variantId": "da450ae6-0f31-43ec-806c-06fc707f7bec", "textHash": "6e56df093d5fc20a", "textTecken": 2891, "mediaSumma": 624267715, "mediaTecken": 519, "kat": ["Hem & Inredning", "Badrum & Hemtextil"]},
    {"kort": "32140f01", "pid": "32140f01-3110-4126-854f-3bd210b880bf", "namn": "Elektrisk väggkamin 65 × 52 cm – LED-lågor i sju färger", "slug": "elektrisk-vaggkamin-65x52-cm-led-lagor", "seoTitel": "Elektrisk väggkamin, LED-lågor | Fyndplats", "seoBesk": "Svart väggkamin 65 × 11,4 × 52 cm med LED-lågor oberoende av värmen, bakgrundsbelysning i sju färger och två värmesteg, 900/1800 W. Snabb leverans.", "sku": "FP-vaggkamin-led-lagor", "variantId": "531d38ad-1468-4e44-b800-cf92d75366cc", "textHash": "1a173f72577b0516", "textTecken": 2777, "mediaSumma": 914163600, "mediaTecken": 499, "kat": ["Hem & Inredning", "Hushållsapparater", "Dekoration & Prydnad"]},
    {"kort": "4f9ef409", "pid": "4f9ef409-95a2-427a-9095-eff4c2f0d99a", "namn": "TV-bänk 140 cm med skåp och öppet fack – vit, för tv upp till 60 tum", "slug": "tv-bank-140-cm-skap-oppet-fack", "seoTitel": "TV-bänk 140 cm med skåp och fack | Fyndplats", "seoBesk": "Vit tv-bänk 140 × 40 × 48 cm för tv upp till 60 tum, med skåp med dubbeldörr, mjukstängande gångjärn och ett öppet fack. Snabb leverans från Fyndplats.", "sku": "FP-tv-bank-skap-oppet-fack", "variantId": "6ac5e94e-18f2-4160-a5ea-aa07f3fab045", "textHash": "3595875fc95341ff", "textTecken": 2799, "mediaSumma": 244406891, "mediaTecken": 429, "kat": ["Hem & Inredning", "Förvaring & Organisering"]},
    {"kort": "8085d0b6", "pid": "8085d0b6-e58a-41c2-b08c-efb2c9d5c36f", "namn": "Högskåp 180 cm med tre hyllor och tre lådor – vitt", "slug": "hogskap-180-cm-tre-hyllor-tre-lador", "seoTitel": "Högskåp 180 cm, hyllor och lådor | Fyndplats", "seoBesk": "Vitt högskåp 79 × 39,5 × 180 cm med tre öppna hyllplan och tre lådor. Tippskydd för väggmontering ingår. Bär 60 kg totalt. Snabb leverans från Fyndplats.", "sku": "FP-hogskap-hyllor-lador", "variantId": "4a1c9f27-ed13-4f30-8337-75848035be93", "textHash": "e2f77dd3a99e7b5a", "textTecken": 2490, "mediaSumma": 983857616, "mediaTecken": 419, "kat": ["Hem & Inredning", "Förvaring & Organisering"]},
    {"kort": "bd2c7da3", "pid": "bd2c7da3-f4ab-4007-93ac-1c6e530b7793", "namn": "Skoskåp 70 cm i sju nivåer – vitt, för upp till 21 par skor", "slug": "skoskap-70-cm-sju-nivaer-21-par-skor", "seoTitel": "Skoskåp med sju nivåer, 21 par | Fyndplats", "seoBesk": "Vitt skoskåp 70 × 35 × 108 cm med sex justerbara hyllplan i sju nivåer, plats för 21 par skor upp till EU 45. Snabb leverans från Fyndplats.", "sku": "FP-skoskap-sju-nivaer", "variantId": "033251fc-9bd4-4df2-b1f3-9fc50afe5ff5", "textHash": "a22a3903de829f31", "textTecken": 2634, "mediaSumma": 515450530, "mediaTecken": 516, "kat": ["Förvaring & Organisering"]},
    {"kort": "6b91821a", "pid": "6b91821a-de53-4f1e-ba56-d9172d5d3cd9", "namn": "Sminkbord 90 × 144,7 cm med LED-spegel och dold förvaring – vitt", "slug": "sminkbord-led-spegel-90-144-cm", "seoTitel": "Sminkbord med LED-spegel | Fyndplats", "seoBesk": "Vitt sminkbord 90 × 40 × 144,7 cm med LED-spegel i tre ljuslägen, dold förvaring bakom spegeln, sex öppna fack och två lådor. Snabb leverans.", "sku": "FP-sminkbord-led-spegel", "variantId": "1f8faf6d-7f7b-4dde-8e55-7b89b1b4edeb", "textHash": "1df4fd3c6088526c", "textTecken": 2560, "mediaSumma": 299263550, "mediaTecken": 574, "kat": ["Hem & Inredning"]},
    {"kort": "3739257b", "pid": "3739257b-c326-443c-95c3-1ff46dc7fbb2", "namn": "Matstolar 2-pack i linnelook – tunnformad rygg, ben i gummiträ", "slug": "matstolar-tunnform-linnelook-2-pack", "seoTitel": "Matstolar 2-pack i linnelook | Fyndplats", "seoBesk": "Två stoppade matstolar 55 × 56 × 74 cm i linnelook med tunnformad rygg, ben i gummiträ och metallram. Sitthöjd 45 cm, bär 150 kg. Snabb leverans.", "sku": "FP-matstolar-tunnform-2-pack", "variantId": "6ac42173-5aaa-4abd-8bf1-c56810968cf8", "textHash": "903cf12a9d45c701", "textTecken": 2360, "mediaSumma": 266090486, "mediaTecken": 517, "kat": ["Hem & Inredning"]},
    {"kort": "3bf5bd08", "pid": "3bf5bd08-837b-4c80-863a-21101c27b783", "namn": "Matgrupp 5 delar – bord 100 × 63 cm och fyra stolar i trämönster", "slug": "matgrupp-5-delar-bord-fyra-stolar", "seoTitel": "Matgrupp 5 delar, bord och stolar | Fyndplats", "seoBesk": "Matgrupp för fyra: bord 100 × 63 × 76,5 cm och fyra stolar i MDF med trämönster på metallram. Bordet bär 80 kg. Snabb leverans från Fyndplats.", "sku": "FP-matgrupp-5-delar", "variantId": "4d7b5a98-f16c-4fd4-8aa4-f4aafe879948", "textHash": "f3deef153213ae36", "textTecken": 2346, "mediaSumma": 888162740, "mediaTecken": 499, "kat": ["Hem & Inredning"]},
  ];
  const qbody = {
    query: {
      cursorPaging: {
        limit: 200
      }
    },
    treeReference: {
      appNamespace: "@wix/stores"
    }
  };
  const q = await wix.request({ method: "POST", url: "https://www.wixapis.com/categories/v1/categories/query", body: qbody });
  const namnTillId = {};
  for (const c of ((q.data || q).categories || [])) namnTillId[c.name] = c.id;

  const ut = [];
  for (const f of FACIT) {
    const url = "/stores/v3/products/" + f.pid + "?fields=PLAIN_DESCRIPTION&fields=MEDIA_ITEMS_INFO&fields=DIRECT_CATEGORIES_INFO&fields=VARIANT_OPTION_CHOICE_NAMES";
    const r = await wix.request({ method: "GET", url: url });
    const p = (r.data || r).product;
    // ☠️ Bevisa att fälten FANNS i projektionen innan noll tolkas.
    const saknas = [];
    if (typeof p.plainDescription !== "string") saknas.push("plainDescription");
    if (!p.media || !p.media.itemsInfo || !Array.isArray(p.media.itemsInfo.items)) saknas.push("media.itemsInfo");
    if (!p.directCategoriesInfo || !Array.isArray(p.directCategoriesInfo.categories)) saknas.push("directCategoriesInfo");
    if (!p.variantsInfo || !Array.isArray(p.variantsInfo.variants)) saknas.push("variantsInfo");
    if (saknas.length) { ut.push({ kort: f.kort, AVBRUTET: "fält saknas i projektionen", saknas: saknas }); continue; }

    const t = p.plainDescription;
    const tags = ((p.seoData || {}).tags) || [];
    const titel = tags.filter(function (x) { return x.type === "title"; });
    const meta = tags.filter(function (x) { return x.type === "meta" && (x.props || {}).name === "description"; });
    const kw = (((p.seoData || {}).settings || {}).keywords) || [];
    const items = p.media.itemsInfo.items;
    const nyckel = items.map(function (m) { return m.id + "|" + (m.altText || ""); }).join("\n");
    const katIds = p.directCategoriesInfo.categories.map(function (c) { return c.id; });
    const vantadeKat = f.kat.map(function (n) { return namnTillId[n]; });
    const vs = p.variantsInfo.variants;
    const rad = {
      kort: f.kort,
      rev: p.revision,
      text: fnv(t) === f.textHash && t.length === f.textTecken,
      textTecken: t.length,
      namn: p.name === f.namn,
      slug: p.slug === f.slug,
      visible: p.visible === true,
      seo: tags.length === 2 && titel.length === 1 && titel[0].children === f.seoTitel && meta.length === 1 && meta[0].props.content === f.seoBesk && kw.length === 0,
      media: SUMMA(nyckel) === f.mediaSumma && nyckel.length === f.mediaTecken,
      antalBilder: items.length,
      kat: vantadeKat.every(function (id) { return !!id && katIds.indexOf(id) >= 0; }),
      antalKat: katIds.length,
      sku: vs.length === 1 && vs[0].sku === f.sku,
      variantVisible: vs.length === 1 && vs[0].visible === true,
      variantIdStammer: vs.length === 1 && vs[0].id === f.variantId,
      pris: vs.length === 1 ? ((vs[0].price || {}).actualPrice || {}).amount : null,
      lager: (p.inventory || {}).availabilityStatus
    };
    rad.ALLT = rad.text && rad.namn && rad.slug && rad.visible && rad.seo && rad.media && rad.kat && rad.sku && rad.variantVisible && rad.variantIdStammer;
    ut.push(rad);
  }
  const ok = ut.filter(function (x) { return x.ALLT; }).length;
  return { rader: ut, SAMMANFATTNING: ok + " av " + ut.length + " helt verifierade" };
}
