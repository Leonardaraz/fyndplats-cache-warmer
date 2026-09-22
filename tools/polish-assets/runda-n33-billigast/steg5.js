async function () {
  // Genererad av runda N33:s bygg-steg.py ur ids, namn, seo, slugs, sku, kategori, vantat-hash och media-hash — aldrig skriven av.
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
    {"kort": "82000c6b", "pid": "82000c6b-7a34-4485-a954-dfc8d37336ba", "namn": "Basketkorg för vägg 110 × 70 cm – genomskinlig skiva och fjädrande ring Ø45 cm", "slug": "basketkorg-vagg-genomskinlig-110x70-cm", "seoTitel": "Basketkorg för vägg, genomskinlig 110 × 70 cm | Fyndplats", "seoBesk": "Basketkorg för vägg med genomskinlig skiva 110 × 70 cm, fjädrande ring Ø45 cm och rivtåligt nät. Betong, tegel eller trä. Snabb leverans från Fyndplats.", "sku": "FP-basketkorg-genomskinlig-110x70", "textHash": "4fd92d091c006142", "textTecken": 3346, "mediaSumma": 694033123, "mediaTecken": 371, "kat": ["Trädgård & Utemöbler", "Utelek & Spel"]},
    {"kort": "2f251ce3", "pid": "2f251ce3-b737-4b27-9394-cc27325b6519", "namn": "Matstolar 2-pack i grå sammetslook – skalformad rygg och ben i gummiträ", "slug": "matstolar-2-pack-gra-sammetslook-gummitra", "seoTitel": "Matstolar 2-pack i grå sammetslook | Fyndplats", "seoBesk": "Två matstolar 54 × 57 × 80 cm i grå sammetslook med skalformad rygg, låga armstöd och ben i gummiträ. Sitthöjd 47 cm, bär 120 kg. Snabb leverans från Fyndplats.", "sku": "FP-matstolar-sammet-gra-2-pack", "textHash": "4b7deca9d3c0ecf3", "textTecken": 2939, "mediaSumma": 61797460, "mediaTecken": 543, "kat": ["Hem & Inredning"]},
    {"kort": "5c566983", "pid": "5c566983-8079-47a8-9406-0033f451585f", "namn": "Matsalsbänk 120 cm med ryggstöd – gräddvit linnelook, bär 240 kg", "slug": "matsalsbank-120-cm-ryggstod-linnelook", "seoTitel": "Matsalsbänk 120 cm med ryggstöd | Fyndplats", "seoBesk": "Matsalsbänk 120 × 61,5 × 85 cm för två, i gräddvit linnelook med stoppat ryggstöd och metallben. Sitthöjd 47 cm, bär 240 kg. Snabb leverans från Fyndplats.", "sku": "FP-matsalsbank-120-ryggstod", "textHash": "9037f462a8f00168", "textTecken": 2852, "mediaSumma": 68458874, "mediaTecken": 554, "kat": ["Hem & Inredning"]},
    {"kort": "07565140", "pid": "07565140-2873-4c43-9d43-c30f8d21d37b", "namn": "Sideboard 100 cm i lantstil – vit, skiva i träton, låda och kryddhylla i dörren", "slug": "sideboard-lantstil-100-cm-kryddhylla", "seoTitel": "Sideboard 100 cm i lantstil med kryddhylla | Fyndplats", "seoBesk": "Vit sideboard 100 × 40 × 81 cm i lantstil med skiva i träton, låda, två skåp och kryddhylla i dörren. Tippskydd ingår. Snabb leverans från Fyndplats.", "sku": "FP-sideboard-lantstil-100-cm", "textHash": "9fef04a46f77709f", "textTecken": 3308, "mediaSumma": 739311406, "mediaTecken": 532, "kat": ["Hem & Inredning", "Förvaring & Organisering"]},
    {"kort": "30f2151f", "pid": "30f2151f-8142-441b-97db-71236fce027b", "namn": "Varmluftsfritös och miniugn 36 liter – grillspett, 1800 W och 230 °C", "slug": "varmluftsfritos-miniugn-36-liter-grillspett", "seoTitel": "Varmluftsfritös och miniugn 36 liter | Fyndplats", "seoBesk": "Varmluftsfritös och miniugn 36 liter, 1800 W och upp till 230 °C. Grillspett för en hel kyckling på 2 kg och timer på 60 minuter. Snabb leverans från Fyndplats.", "sku": "FP-varmluftsfritos-miniugn-36-l", "textHash": "0c4a6a1192787fbe", "textTecken": 3313, "mediaSumma": 429690438, "mediaTecken": 534, "kat": ["Kök & Husgeråd", "Köksmaskiner & Apparater"]},
    {"kort": "dbedaf4c", "pid": "dbedaf4c-492b-4221-9259-445f305a8a83", "namn": "Sideboard 105 cm med fyra lådor och skåp – vit med svarta handtag", "slug": "sideboard-105-cm-fyra-lador-vit", "seoTitel": "Sideboard 105 cm med fyra lådor, vit | Fyndplats", "seoBesk": "Vit sideboard 105 × 40 × 76 cm med skåp, flyttbart hyllplan och fyra lådor på metallskenor. Tippskydd, bär 70 kg. Snabb leverans från Fyndplats.", "sku": "FP-sideboard-vit-105-fyra-lador", "textHash": "ae15cdfc2464ba43", "textTecken": 2696, "mediaSumma": 79599947, "mediaTecken": 563, "kat": ["Hem & Inredning", "Förvaring & Organisering"]},
    {"kort": "b2b731c7", "pid": "b2b731c7-fb5b-4c47-8d92-a60ed10d0e77", "namn": "Fot- och vadmassage med luftkompression och värme – fälls ihop till pall", "slug": "massageapparat-fotter-vader-luftkompression", "seoTitel": "Fot- och vadmassage med värme, fälls till pall | Fyndplats", "seoBesk": "Massageapparat för fötter och vader med luftkompression, 3 program och 3 styrkor, värme i 2 lägen och avstängning efter 15 minuter. Fälls ihop till en pall.", "sku": "FP-massage-fotter-vader-luft", "textHash": "914e4e096de67cda", "textTecken": 3126, "mediaSumma": 620622736, "mediaTecken": 605, "kat": ["Skönhet & Hälsa", "Massage & Återhämtning"]},
    {"kort": "b3efdd39", "pid": "b3efdd39-70f5-4ad0-bedd-98ab8f4608f0", "namn": "Matbord 120 × 60 cm med två dolda fack under skivan – vitt, för fyra", "slug": "matbord-120x60-cm-dolda-fack-vit", "seoTitel": "Matbord 120 × 60 cm med dolda fack, vitt | Fyndplats", "seoBesk": "Vitt matbord 120 × 60 × 75,5 cm för fyra, med två dolda fack under uppfällbara delar av skivan. Halkskydd under benen. Snabb leverans från Fyndplats.", "sku": "FP-matbord-120x60-dolda-fack", "textHash": "4936879eeb98f77a", "textTecken": 2833, "mediaSumma": 418412571, "mediaTecken": 551, "kat": ["Hem & Inredning"]},
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
      variantId: vs.length === 1 ? vs[0].id : null,
      pris: vs.length === 1 ? ((vs[0].price || {}).actualPrice || {}).amount : null,
      lager: (p.inventory || {}).availabilityStatus
    };
    rad.ALLT = rad.text && rad.namn && rad.slug && rad.visible && rad.seo && rad.media && rad.kat && rad.sku && rad.variantVisible;
    ut.push(rad);
  }
  const ok = ut.filter(function (x) { return x.ALLT; }).length;
  return { rader: ut, SAMMANFATTNING: ok + " av " + ut.length + " helt verifierade" };
}
