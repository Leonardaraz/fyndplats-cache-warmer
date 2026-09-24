async function () {
  // Genererad av runda N37:s bygg-steg.py ur ids, namn, seo, slugs, sku, kategori, vantat-hash och media-hash — aldrig skriven av.
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
    {"kort": "81a3065e", "pid": "81a3065e-df64-4494-8ed4-5641a5ac7d4b", "namn": "Väggkrukor 3-pack i svart stål – runda, akrylfront, Ø30,5, Ø20,5 och Ø15,5 cm", "slug": "vaggkrukor-3-pack-runda-svart-stal", "seoTitel": "Väggkrukor 3-pack i svart stål | Fyndplats", "seoBesk": "Tre runda väggkrukor i svart stål med genomskinlig front, Ø30,5, Ø20,5 och Ø15,5 cm. För suckulenter och konstväxter, inne och ute.", "sku": "FP-vaggkrukor-3-pack-svart", "variantId": "3f8ed257-bbd3-43b1-9c4e-b085ff877d03", "textHash": "37c4cac292450a8f", "textTecken": 2894, "mediaSumma": 140763884, "mediaTecken": 527, "kat": ["Hem & Inredning", "Dekoration & Prydnad"]},
    {"kort": "ff10ccf5", "pid": "ff10ccf5-8837-43d8-8d33-aa47252a4b3f", "namn": "Smalt sidobord med tre plan – 43 × 18 × 62,5 cm, svart metall och brun trälook", "slug": "sidobord-smalt-tre-plan-metall", "seoTitel": "Smalt sidobord med tre plan | Fyndplats", "seoBesk": "Smalt sidobord 43 × 18 × 62,5 cm med tre plan, mellanhylla i metalltråd och justerbara fötter. Bär 12 kg. Snabb leverans från Fyndplats.", "sku": "FP-sidobord-smalt-tre-plan", "variantId": "cd1bf6df-ef70-47bb-8758-568777508f7b", "textHash": "c92728ab3fc70bdb", "textTecken": 2813, "mediaSumma": 488427702, "mediaTecken": 572, "kat": ["Hem & Inredning", "Förvaring & Organisering"]},
    {"kort": "e118ae32", "pid": "e118ae32-a429-493b-9b55-27eff563fe9f", "namn": "Fågelbogunga Ø110 cm – blå, två justerbara rep, bär 100 kg", "slug": "fagelbogunga-110-cm-bla", "seoTitel": "Fågelbogunga Ø110 cm, blå | Fyndplats", "seoBesk": "Blå fågelbogunga Ø110 cm med stålram, elastiskt nät och två justerbara rep på 170 cm. Bär 100 kg, för barn 3–12 år. Snabb leverans.", "sku": "FP-fagelbogunga-110-bla", "variantId": "ee454aa1-48df-4d35-85a1-3ac32e8f579f", "textHash": "79c5a7cfb7efd5b0", "textTecken": 2592, "mediaSumma": 886761727, "mediaTecken": 506, "kat": ["Barn & Familj", "Leksaker & Spel", "Utelek & Spel"]},
    {"kort": "ae2ac5e5", "pid": "ae2ac5e5-6506-49b9-aa3a-c634044272f4", "namn": "Gnistskydd för öppen spis 96 cm – tre paneler, hopfällbart, svart metall", "slug": "gnistskydd-oppen-spis-96-cm-svart", "seoTitel": "Gnistskydd för öppen spis 96 cm | Fyndplats", "seoBesk": "Tredelat gnistskydd i svart metall, 96 × 60 cm utfällt och 50 cm hopvikt. För eldstäder med öppning 50–90 cm. Levereras färdigt.", "sku": "FP-gnistskydd-96-cm-tre-paneler", "variantId": "375bb01d-c8eb-466f-b82c-1e98e1055896", "textHash": "08e190945710ac4b", "textTecken": 2598, "mediaSumma": 175688238, "mediaTecken": 519, "kat": ["Hem & Inredning", "Dekoration & Prydnad"]},
    {"kort": "f1e0a996", "pid": "f1e0a996-66b8-4386-a846-6d34b7cea24c", "namn": "Gunghäst i trä med zebraränder – handtag och ryggstöd, 1–3 år", "slug": "gunghast-tra-zebra-1-3-ar", "seoTitel": "Gunghäst i trä med zebraränder | Fyndplats", "seoBesk": "Gunghäst i MDF och plywood med zebraränder, handtag och ryggstöd. Sitthöjd 29 cm, bär 30 kg, för barn 1–3 år. Snabb leverans från Fyndplats.", "sku": "FP-gunghast-tra-zebra", "variantId": "957b3e0c-073b-4d42-a5c5-fb51d47ff89e", "textHash": "b1b9a5723063a40a", "textTecken": 2380, "mediaSumma": 742226588, "mediaTecken": 412, "kat": ["Barn & Familj", "Leksaker & Spel", "Baby & Småbarn"]},
    {"kort": "af4409b8", "pid": "af4409b8-133a-4dda-a2cd-9dec4c26ac25", "namn": "Sängbord med låda och öppet fack – hylla på ryggskivan, naturfärgad trälook", "slug": "sangbord-lada-oppet-fack-hylla", "seoTitel": "Sängbord med låda och hylla | Fyndplats", "seoBesk": "Sängbord 40 × 35 × 66 cm i naturfärgad trälook med låda, öppet fack och hylla på ryggskivan. Rundade hörn, bär 28 kg. Snabb leverans.", "sku": "FP-sangbord-lada-hylla-natur", "variantId": "7dd20d84-7c43-4c0b-83f5-2d37e7f5ec9b", "textHash": "093e0394c0c741c9", "textTecken": 2770, "mediaSumma": 639539188, "mediaTecken": 527, "kat": ["Hem & Inredning", "Förvaring & Organisering"]},
    {"kort": "9e16bd7c", "pid": "9e16bd7c-527d-4566-800a-af22bdcc5bf6", "namn": "Basketställ för barn 5-i-1 – fiskformad platta, höjd 134–152 cm", "slug": "basketstall-barn-5-i-1-fisk", "seoTitel": "Basketställ för barn 5-i-1 | Fyndplats", "seoBesk": "Basketställ för barn med fiskformad platta, justerbart 134–152 cm. Fem spel: basket, ringkastning, bollkastning, golf och fotboll. Från 3 år.", "sku": "FP-basketstall-barn-5-i-1", "variantId": "378ac23f-bdda-4260-863e-9e9016216e07", "textHash": "ebdb515625804de9", "textTecken": 2590, "mediaSumma": 678539120, "mediaTecken": 540, "kat": ["Barn & Familj", "Leksaker & Spel"]},
    {"kort": "a7bddc08", "pid": "a7bddc08-1d6a-4c51-bb05-677e3a4286ee", "namn": "Sadelpall på hjul i svart konstläder – sitthöjd 55–71 cm, bär 120 kg", "slug": "sadelpall-hjul-svart-konstlader", "seoTitel": "Sadelpall på hjul i svart konstläder | Fyndplats", "seoBesk": "Sadelpall med stoppad sits i svart konstläder, sitthöjd 55–71 cm, 360° vridbar och fem tysta hjul. Bär 120 kg. Snabb leverans från Fyndplats.", "sku": "FP-sadelpall-hjul-svart", "variantId": "e09dedb0-2bbb-480a-a1a7-08d04f348f55", "textHash": "a97cb7e2999fe64d", "textTecken": 2271, "mediaSumma": 473542890, "mediaTecken": 516, "kat": ["Hem & Inredning"]},
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
