async function () {
  // Genererad av runda N38:s bygg-steg.py ur ids, namn, seo, slugs, sku, kategori, vantat-hash och media-hash — aldrig skriven av.
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
    {"kort": "0fda8bfe", "pid": "0fda8bfe-67ec-4360-942b-4d25c9573b0c", "namn": "Konstgjort buxbomsträd 90 cm – tre klot på tvinnade stammar, cementfylld kruka", "slug": "konstgjort-buxbomstrad-90-cm-tre-klot", "seoTitel": "Konstgjort buxbomsträd 90 cm med tre klot | Fyndplats", "seoBesk": "Konstgjort buxbomsträd 90 cm med tre klot, Ø27, Ø23 och Ø18 cm, på tvinnade stammar. Cementfylld kruka Ø17 cm, för inomhus och utomhus.", "sku": "FP-buxbomstrad-90-cm-tre-klot", "variantId": "421f479f-c4e9-4ba9-b97d-9bb30a460074", "textHash": "9b8fb2ea34c2110c", "textTecken": 2506, "mediaSumma": 699660089, "mediaTecken": 572, "kat": ["Hem & Inredning", "Dekoration & Prydnad"]},
    {"kort": "33c51730", "pid": "33c51730-339a-4977-98d6-25f46bffc517", "namn": "Paraplyställ med droppskål – 21 fack och 24 krokar, svart stål", "slug": "paraplystall-droppskal-24-krokar-svart", "seoTitel": "Paraplyställ med droppskål, svart | Fyndplats", "seoBesk": "Svart paraplyställ i stål, 50 × 24 × 68 cm, med 21 fack, 24 krokar och löstagbar droppskål. Rymmer omkring 21–45 paraplyer.", "sku": "FP-paraplystall-droppskal-svart", "variantId": "c73c9943-3562-41c8-baa6-820babdff003", "textHash": "00d925205e420eac", "textTecken": 2553, "mediaSumma": 710738340, "mediaTecken": 537, "kat": ["Hem & Inredning", "Förvaring & Organisering"]},
    {"kort": "1a1487a8", "pid": "1a1487a8-4673-4ecb-9eee-4fc60f89a547", "namn": "Skärmtak 103 cm för dörr och fönster – välvd polykarbonat, svarta konsoler", "slug": "skarmtak-dorr-fonster-103-cm", "seoTitel": "Skärmtak för dörr och fönster, 103 cm | Fyndplats", "seoBesk": "Skärmtak 103 × 96,5 cm i genomskinlig polykarbonat med svarta konsoler. Välvt tak som skyddar entrén mot regn, snö och UV-strålning.", "sku": "FP-skarmtak-103-cm-polykarbonat", "variantId": "9ef9e726-8196-4466-8117-d4bd87aeaa18", "textHash": "25dfab7c6f43035b", "textTecken": 2823, "mediaSumma": 59950585, "mediaTecken": 538, "kat": ["Hem & Inredning", "Verktyg & Hemmafix"]},
    {"kort": "084b987b", "pid": "084b987b-b64b-464c-afc6-486da4a4faef", "namn": "Sidobord med skåp och öppet fack – rustikt brunt med svart stålram, 80 cm", "slug": "sidobord-skap-oppet-fack-rustik-brun", "seoTitel": "Sidobord med skåp och öppet fack | Fyndplats", "seoBesk": "Smalt sidobord 34 × 30 × 80 cm i rustikt brunt med svart stålram. Öppet fack, skåp med magnetdörr och en hylla i tre lägen.", "sku": "FP-sidobord-skap-oppet-fack-brun", "variantId": "797e9185-453a-4039-8199-b9db689ed1a7", "textHash": "e18bc3a892bdce0c", "textTecken": 2707, "mediaSumma": 317109261, "mediaTecken": 440, "kat": ["Hem & Inredning", "Förvaring & Organisering"]},
    {"kort": "12e66c66", "pid": "12e66c66-5a33-4d88-8c72-18445fab61e5", "namn": "Elektronisk darttavla med dörrar – 26 spel, upp till 8 spelare, sex pilar", "slug": "elektronisk-darttavla-dorrar-26-spel", "seoTitel": "Elektronisk darttavla med dörrar | Fyndplats", "seoBesk": "Elektronisk darttavla med två dörrar, LCD-display, 26 spel och upp till 8 spelare. Sex pilar och 30 extra spetsar ingår. Drivs med AA-batterier.", "sku": "FP-darttavla-elektronisk-dorrar", "variantId": "87b93d09-3774-4f83-b63a-2c8c67c3b50d", "textHash": "02f3f9bbf5556d1e", "textTecken": 2865, "mediaSumma": 918062148, "mediaTecken": 527, "kat": ["Sport & Fritid"]},
    {"kort": "285d9ab7", "pid": "285d9ab7-8ef5-482d-8744-5babf7ac6cda", "namn": "Pedalhink 30 liter i krämvitt – mjukstängande lock och löstagbar innerhink", "slug": "pedalhink-30-liter-kramvit", "seoTitel": "Pedalhink 30 liter, krämvit | Fyndplats", "seoBesk": "Krämvit pedalhink på 30 liter, 63,5 cm hög, med mjukstängande lock som kan stå öppet och löstagbar innerhink. Ingen montering.", "sku": "FP-pedalhink-30-l-kramvit", "variantId": "8370394c-1aaa-4392-b2c2-aebc98f0084d", "textHash": "4e50241c8af208b0", "textTecken": 2412, "mediaSumma": 91150696, "mediaTecken": 511, "kat": ["Kök & Husgeråd"]},
    {"kort": "2af7ec2d", "pid": "2af7ec2d-a4a3-4a23-8ec2-a86f5d7726de", "namn": "Staffli för barn 2-i-1 i rosa – krittavla, whiteboard och två tygboxar", "slug": "staffli-barn-2-i-1-tygboxar-rosa", "seoTitel": "Staffli för barn 2-i-1, rosa | Fyndplats", "seoBesk": "Rosa staffli för barn med krittavla och whiteboard, rityta 47 × 32 cm, två tygboxar och djurmotiv. 113 cm högt, för barn 3–8 år.", "sku": "FP-staffli-barn-2-i-1-rosa", "variantId": "18a8e1ac-9d4c-433d-a38b-1cd5e57072e4", "textHash": "428ac50d3fd4cf93", "textTecken": 2467, "mediaSumma": 223585563, "mediaTecken": 541, "kat": ["Barn & Familj", "Leksaker & Spel"]},
    {"kort": "3bd54459", "pid": "3bd54459-485b-4a15-b3bb-edfb18066d90", "namn": "Fågelmatarstation 208 cm – fyra krokar, tre matare och två skålar", "slug": "fagelmatarstation-208-cm-fyra-krokar", "seoTitel": "Fågelmatarstation 208 cm med fyra krokar | Fyndplats", "seoBesk": "Fågelmatarstation i svart stål, 208 cm, med fyra krokar, frö- och nötautomat, talgbur, gallerskål och vattenskål. Fyra piggar för gräsmattan.", "sku": "FP-fagelmatarstation-208-cm", "variantId": "3ccc009b-4517-405e-8223-b6575800c410", "textHash": "483f86b7bf6be587", "textTecken": 2594, "mediaSumma": 880541090, "mediaTecken": 537, "kat": ["Trädgård & Utemöbler", "Trädgårdsdekor & Belysning"]},
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
