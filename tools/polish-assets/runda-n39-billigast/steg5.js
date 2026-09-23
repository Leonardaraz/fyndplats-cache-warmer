async function () {
  // Genererad av runda N39:s bygg-steg.py ur ids, namn, seo, slugs, sku, kategori, vantat-hash och media-hash — aldrig skriven av.
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
    {"kort": "a9360e2a", "pid": "a9360e2a-f8ac-47ff-8be6-4664e5f805d6", "namn": "Balansbom 236 cm i blått – hopfällbar, halkfri undersida, från 3 år, bär 80 kg", "slug": "balansbom-236-cm-bla-hopfallbar", "seoTitel": "Balansbom 236 cm, blå och hopfällbar | Fyndplats", "seoBesk": "Blå balansbom på 236 cm att lägga på golvet, med halkfri undersida och kärna av EVA-skum. Viks ihop på mitten. Från 3 år, bär 80 kg.", "sku": "FP-balansbom-236-bla", "variantId": "534af958-db77-42db-8d2b-e4e58d606164", "textHash": "e63d614a45ee24f7", "textTecken": 2535, "mediaSumma": 371739951, "mediaTecken": 545, "kat": ["Sport & Fritid", "Träning & Gym"]},
    {"kort": "c694dcaa", "pid": "c694dcaa-c927-414c-8111-9a65a5e55015", "namn": "Golvlampa med trebensstativ i svart metall – vit tygskärm Ø37 cm, höjd 152 cm", "slug": "golvlampa-trebensstativ-vit-tygskarm", "seoTitel": "Golvlampa med trebensstativ och vit skärm | Fyndplats", "seoBesk": "Golvlampa 152 cm med trebensstativ i svart metall och vit tygskärm Ø37 cm. Dragkedja, sladd 3 m och sockel E27. Snabb leverans från Fyndplats.", "sku": "FP-golvlampa-trebensstativ-vit-skarm", "variantId": "02b45cb0-2567-4cf4-bc10-6d812a20f0a7", "textHash": "33f8795ab8b0c9e6", "textTecken": 2288, "mediaSumma": 619005182, "mediaTecken": 311, "kat": ["Hem & Inredning", "Belysning"]},
    {"kort": "d3655c3e", "pid": "d3655c3e-c066-4226-9860-0e960aa5315f", "namn": "Tvätthylla i bambu med två tygkorgar – två hyllplan, 44 × 34 × 96 cm", "slug": "tvatthylla-bambu-tva-tygkorgar", "seoTitel": "Tvätthylla i bambu med två tygkorgar | Fyndplats", "seoBesk": "Tvätthylla i bambu med två utdragbara tygkorgar på 17,7 liter och två hyllplan. 44 × 34 × 96 cm, bär 14 kg. Snabb leverans från Fyndplats.", "sku": "FP-tvatthylla-bambu-tva-korgar", "variantId": "9de5f69d-2b41-4b49-bd52-636f7f8cf6ba", "textHash": "ebd14cf2aa6ab849", "textTecken": 2626, "mediaSumma": 723621927, "mediaTecken": 472, "kat": ["Hem & Inredning", "Förvaring & Organisering", "Badrum & Hemtextil"]},
    {"kort": "e514191b", "pid": "e514191b-9ed9-4e31-b595-4bb3f0f7345a", "namn": "Skohylla i svart metall med fyra hyllplan – blomdekor, 59,5 × 30 × 92 cm", "slug": "skohylla-svart-metall-fyra-plan-blomdekor", "seoTitel": "Skohylla i svart metall, fyra hyllplan | Fyndplats", "seoBesk": "Skohylla i svart pulverlackerad metall med fyra hyllplan och blomdekor, 59,5 × 30 × 92 cm. Bär 15 kg och passar även krukväxter.", "sku": "FP-skohylla-fyra-plan-blomdekor", "variantId": "d946ba7f-1573-4294-9f79-87a9b0a40160", "textHash": "aef4e107f5b21cfc", "textTecken": 2410, "mediaSumma": 582973681, "mediaTecken": 547, "kat": ["Hem & Inredning", "Förvaring & Organisering"]},
    {"kort": "f75a8a17", "pid": "f75a8a17-f7e8-4a9f-9e38-1bba760252c4", "namn": "Hörnblomställ i tre plan – kvartscirkelformade hyllor, svart metall, bär 30 kg", "slug": "hornblomstall-tre-plan-svart-metall", "seoTitel": "Hörnblomställ i tre plan, svart metall | Fyndplats", "seoBesk": "Hörnblomställ i svart metall med tre hyllplan formade som kvartscirklar, på 20, 40 och 60 cm höjd. För inne och ute, bär 30 kg.", "sku": "FP-hornblomstall-tre-plan-svart", "variantId": "5558ee7e-0d77-4ce2-a3e7-0c03708a4e80", "textHash": "10e1d83acbc2a096", "textTecken": 2554, "mediaSumma": 324753252, "mediaTecken": 572, "kat": ["Hem & Inredning", "Dekoration & Prydnad", "Trädgård & Utemöbler", "Trädgårdsdekor & Belysning"]},
    {"kort": "ba454107", "pid": "ba454107-f4e8-4e19-b0ec-e4985e647c34", "namn": "Pall med stoppad sits i mörkgrått tyg – svarta stålben, 42 × 42 × 44 cm", "slug": "pall-stoppad-sits-morkgra-stalben", "seoTitel": "Pall med stoppad sits, mörkgrå | Fyndplats", "seoBesk": "Mörkgrå pall med 10 cm tjock stoppad sits och svarta stålben, 42 × 42 × 44 cm. Fotpall eller extra sittplats, bär 120 kg.", "sku": "FP-pall-morkgra-stoppad-sits", "variantId": "5bb76445-c4a7-449b-8c8e-2be33a60077c", "textHash": "e207f10b5ae7a9b3", "textTecken": 2363, "mediaSumma": 601108159, "mediaTecken": 457, "kat": ["Hem & Inredning"]},
    {"kort": "f4bdb64c", "pid": "f4bdb64c-95fa-4127-984c-2e93b416f2f2", "namn": "Pilatesbräda med tillbehör – hopfällbar, gummiband, glidplattor, bär 150 kg", "slug": "pilatesbrada-hopfallbar-med-tillbehor", "seoTitel": "Hopfällbar pilatesbräda med tillbehör | Fyndplats", "seoBesk": "Hopfällbar pilatesbräda med gummiband, stång, glidplattor och armhävningshandtag. 97 × 30 cm, viks till 49 cm och bär 150 kg.", "sku": "FP-pilatesbrada-hopfallbar", "variantId": "b7250801-e6aa-45a3-986a-ee0488c62894", "textHash": "1fa9102869632cc0", "textTecken": 2550, "mediaSumma": 996314358, "mediaTecken": 566, "kat": ["Sport & Fritid", "Träning & Gym"]},
    {"kort": "95b6f5bd", "pid": "95b6f5bd-7b89-45de-98ae-0a535e1e44de", "namn": "Tvättsorterare i bambu – tvättpåse och förvaring i tre fack, 70 × 36 × 70 cm", "slug": "tvattsorterare-bambu-tvattpase-tre-fack", "seoTitel": "Tvättsorterare i bambu, 70 × 36 × 70 cm | Fyndplats", "seoBesk": "Tvättsorterare i bambu med utdragbar tvättpåse, förvaring i tre fack och hylla ovanpå. 70 × 36 × 70 cm, rymmer 83 liter.", "sku": "FP-tvattsorterare-bambu-vit", "variantId": "4ab6ea77-2d70-4a26-ac1e-fb06a8768bfd", "textHash": "b45715d9462ce869", "textTecken": 2572, "mediaSumma": 266166284, "mediaTecken": 573, "kat": ["Hem & Inredning", "Förvaring & Organisering", "Badrum & Hemtextil"]},
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
