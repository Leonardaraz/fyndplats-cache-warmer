async function () {
  // Genererad av runda N50:s bygg-steg.py ur ids, namn, seo, slugs, sku, kategori, vantat-hash och media-hash — aldrig skriven av.
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
    {"kort": "10fe3278", "pid": "10fe3278-cb72-4cbf-90ff-9038506050cc", "namn": "Pokerset med 300 marker och kortblandare – spelmatta och väska med aluminiumhörn", "slug": "pokerset-kortblandare-aluminiumvaska", "seoTitel": "Pokerset med 300 marker och kortblandare | Fyndplats", "seoBesk": "Pokerset med 300 marker i fem färger, två kortlekar, fem tärningar, kortblandare, kortutdelare och spelmatta på 90 × 60 cm, i väska.", "sku": "FP-pokerset-kortblandare", "variantId": "c629a262-38b4-41a7-b6ec-4a0b5b833ad1", "textHash": "b46d075ebfa9c978", "textTecken": 2422, "mediaSumma": 454018157, "mediaTecken": 428, "kat": ["Sport & Fritid"]},
    {"kort": "5fce6a95", "pid": "5fce6a95-9304-4bc0-b74a-38f2b89273ca", "namn": "Vedställ i svart stål, 60 × 100 cm – håller brasveden från golvet, bär 100 kg", "slug": "vedstall-svart-stal-60-cm", "seoTitel": "Vedställ i svart stål, 60 × 100 cm | Fyndplats", "seoBesk": "Vedställ i pulverlackerat svart stål, 60 × 25 × 100 cm, som håller brasveden från golvet. Bär 100 kg och fungerar inne och ute.", "sku": "FP-vedstall-svart-60", "variantId": "7adaa1a0-a6cc-423a-a417-dff566229c94", "textHash": "a3c1dd682ede0d25", "textTecken": 1904, "mediaSumma": 43445217, "mediaTecken": 489, "kat": ["Hem & Inredning", "Förvaring & Organisering"]},
    {"kort": "cc5b0c14", "pid": "cc5b0c14-429c-4263-966a-0bced1ae857d", "namn": "Spökdocka till halloween, 83 cm – sitter, rör överkroppen och skriker", "slug": "spokdocka-halloween-83-cm-rorelsesensor", "seoTitel": "Spökdocka till halloween, 83 cm | Fyndplats", "seoBesk": "Sittande spökdocka till halloween, 83 cm, med rörelsesensor som startar skrik, röda lysande ögon och rörelse i överkroppen. Batterier ingår.", "sku": "FP-spokdocka-halloween-83", "variantId": "86cb5054-aa57-418b-8319-521986dd6032", "textHash": "0123487c11d8ae88", "textTecken": 2047, "mediaSumma": 48552193, "mediaTecken": 527, "kat": ["Hem & Inredning", "Kalas & Fest"]},
    {"kort": "e797e8a4", "pid": "e797e8a4-d87a-4782-8c70-28a6fbe7b21c", "namn": "Tvättkorg i bambu med lock och uttagbar tvättpåse – luftiga ribbor, 60 cm hög", "slug": "tvattkorg-bambu-lock-uttagbar-pase", "seoTitel": "Tvättkorg i bambu med lock och tvättpåse | Fyndplats", "seoBesk": "Tvättkorg i polerad bambu med lock, luftiga ribbor och uttagbar tvättpåse, 50 × 36 × 60 cm. Påsen bär 15 kg tvätt.", "sku": "FP-tvattkorg-bambu-lock", "variantId": "cc883412-16e2-48cc-96a5-88a86d22d710", "textHash": "e2bade4b7652ce24", "textTecken": 1887, "mediaSumma": 67061479, "mediaTecken": 479, "kat": ["Hem & Inredning", "Badrum & Hemtextil", "Förvaring & Organisering"]},
    {"kort": "e947f7aa", "pid": "e947f7aa-0251-4a15-881e-25cd878cdab0", "namn": "Vattenkokare i glas 1,7 l med tesil – fem temperaturlägen, varmhållning, 2200 W", "slug": "vattenkokare-glas-tesil-temperaturval", "seoTitel": "Vattenkokare i glas 1,7 l med tesil | Fyndplats", "seoBesk": "Vattenkokare i glas och rostfritt stål, 1,7 l och 2200 W, med tesil, fem temperaturlägen mellan 60 och 100 °C och varmhållning i 2 timmar.", "sku": "FP-vattenkokare-glas-tesil", "variantId": "c860f1a3-5ef2-4766-ba7b-35c549228d6c", "textHash": "e9b2a25ee90be132", "textTecken": 2123, "mediaSumma": 833978833, "mediaTecken": 435, "kat": ["Kök & Husgeråd", "Köksmaskiner & Apparater"]},
    {"kort": "0598eff2", "pid": "0598eff2-7582-4152-9995-fd78563495c4", "namn": "Väggskåp för badrummet i vitt och trä – mjukstängande dörr och öppet fack, 67 cm", "slug": "vaggskap-badrum-vitt-oppet-fack", "seoTitel": "Väggskåp för badrummet med öppet fack | Fyndplats", "seoBesk": "Väggskåp i vitt med trädetalj, 30 × 17 × 67 cm, med mjukstängande dörr, ställbar hylla och öppet fack. Bär 8 kg totalt.", "sku": "FP-vaggskap-badrum-vitt", "variantId": "5699e6bf-2b62-4ea8-a326-ce7faadfd732", "textHash": "824c6dca02c96df8", "textTecken": 2027, "mediaSumma": 220334098, "mediaTecken": 567, "kat": ["Hem & Inredning", "Badrum & Hemtextil", "Förvaring & Organisering"]},
    {"kort": "007c6422", "pid": "007c6422-b9af-4f68-98c9-73f194dca92b", "namn": "Sängbord med eluttag och USB-C – två hyllor, fack och sidoficka, rustikt brunt", "slug": "sangbord-eluttag-usb-rustikt-brun", "seoTitel": "Sängbord med eluttag och USB-C | Fyndplats", "seoBesk": "Sängbord i rustikt brunt med två eluttag, USB och USB-C, två öppna hyllor, fack och sidoficka. 60 × 29,8 × 58,5 cm, bär 21 kg.", "sku": "FP-sangbord-eluttag-brun", "variantId": "e082bced-db6a-41a4-b054-7fbcc3163d57", "textHash": "70ce6ca544cc581e", "textTecken": 2135, "mediaSumma": 166933629, "mediaTecken": 570, "kat": ["Hem & Inredning"]},
    {"kort": "536e0244", "pid": "536e0244-a8d3-4212-b470-447a558780c6", "namn": "Hopfällbar hage för hund och katt – nätfönster, dörrar och topplucka, 94 × 74 cm", "slug": "hopfallbar-hage-hund-katt-natfonster", "seoTitel": "Hopfällbar hage för hund och katt | Fyndplats", "seoBesk": "Hopfällbar hage för små husdjur under 10 kg, 94 × 74 × 60 cm, med nätfönster, dörrar och topplucka. Markspett och förvaringsväska ingår.", "sku": "FP-hopfallbar-hage-gra", "variantId": "f67f0235-6125-4f46-827f-3ed765c7eae9", "textHash": "e87149d9a52b81f8", "textTecken": 2152, "mediaSumma": 279567384, "mediaTecken": 447, "kat": ["Husdjur", "Burar, Kläder & Tillbehör"]},
    {"kort": "7fdf42e9", "pid": "7fdf42e9-40fb-4975-bb73-788c01da8ca5", "namn": "Runt sidobord med hylla i rökglas – ekfärgad skiva och svarta metallben, 53,5 cm", "slug": "runt-sidobord-rokglas-ekfargad", "seoTitel": "Runt sidobord med hylla i rökglas | Fyndplats", "seoBesk": "Runt sidobord med ekfärgad skiva, hylla i härdat rökglas och svarta metallben, 41,8 × 39,8 × 53,5 cm. Bär 15 kg.", "sku": "FP-sidobord-rokglas-ek", "variantId": "acabef98-3e42-4810-8709-1e9157590de5", "textHash": "fc23bec8db1009c1", "textTecken": 2049, "mediaSumma": 282300350, "mediaTecken": 577, "kat": ["Hem & Inredning"]},
    {"kort": "ad88f2b4", "pid": "ad88f2b4-e89b-42ab-8c86-72bcb28e3c9c", "namn": "Smalt vedställ i svart stål, 40 × 100 cm – för brasved inne och ute, bär 100 kg", "slug": "vedstall-smalt-svart-stal-40-cm", "seoTitel": "Smalt vedställ i svart stål, 40 × 100 cm | Fyndplats", "seoBesk": "Smalt vedställ i pulverlackerat svart stål, 40 × 25 × 100 cm, som tar liten golvyta bredvid kaminen. Bär 100 kg, för inne och ute.", "sku": "FP-vedstall-smalt-svart-40", "variantId": "e0f3cf3f-dc77-4700-914f-ac04fedd9639", "textHash": "cae1aea2d20c05bc", "textTecken": 1790, "mediaSumma": 659508240, "mediaTecken": 515, "kat": ["Hem & Inredning", "Förvaring & Organisering"]},
    {"kort": "e138b637", "pid": "e138b637-5b47-409d-bca3-7b78463b3578", "namn": "Lyftbock för motorcykel i rött stål – höjdlägen 27,5 och 39,5 cm, bär 150 kg", "slug": "lyftbock-motorcykel-tva-hojdlagen", "seoTitel": "Lyftbock för motorcykel, bär 150 kg | Fyndplats", "seoBesk": "Lyftbock för motorcykel i rött stål med gummimatta och två höjdlägen, 27,5 och 39,5 cm. Bär 150 kg, 48 × 34 × 43 cm.", "sku": "FP-lyftbock-motorcykel-rod", "variantId": "a656d800-f5a7-4664-8276-f9695d7f039f", "textHash": "d414505a3e59813f", "textTecken": 1934, "mediaSumma": 590704396, "mediaTecken": 530, "kat": ["Sport & Fritid", "Bil & Cykel"]},
    {"kort": "e7bbadb2", "pid": "e7bbadb2-1e3a-423b-8bd1-ecb63b494f6b", "namn": "Tv-bänk med två tyglådor och öppen hylla – för tv upp till 47 tum, 98 cm", "slug": "tv-bank-tva-tyglador-oppen-hylla", "seoTitel": "Tv-bänk med två tyglådor och hylla | Fyndplats", "seoBesk": "Tv-bänk i svart stål med två tyglådor och öppen hylla, 98 × 29 × 56 cm, för tv upp till 47 tum. Bär 41 kg totalt.", "sku": "FP-tvbank-tyglador-svart", "variantId": "b07c0b53-f0ec-46d1-946d-30aa0debcda0", "textHash": "62ec8976e165ae11", "textTecken": 1989, "mediaSumma": 945575328, "mediaTecken": 533, "kat": ["Hem & Inredning", "Förvaring & Organisering"]},
    {"kort": "17595feb", "pid": "17595feb-4289-4613-aefa-c70ab9e273ea", "namn": "Darttavla i sisal med skyddsring och sex pilar – Ø45,5 cm, 71,5 cm med ringen", "slug": "darttavla-sisal-skyddsring-sex-pilar", "seoTitel": "Darttavla i sisal med skyddsring och pilar | Fyndplats", "seoBesk": "Darttavla i självläkande sisal, Ø45,5 cm, med skyddsring i fyra delar och sex pilar med stålspetsar. 71,5 cm i diameter med ringen.", "sku": "FP-darttavla-sisal-ring", "variantId": "2d199426-ea0b-48f4-8c1c-08de5ba08543", "textHash": "2e29e3a8055bf823", "textTecken": 1862, "mediaSumma": 825877873, "mediaTecken": 575, "kat": ["Sport & Fritid"]},
    {"kort": "261484e7", "pid": "261484e7-7efd-4384-99d5-7464b7e45647", "namn": "Gnistskydd för öppen spis, 110 cm – tre delar med välvd mittpanel och handtag", "slug": "gnistskydd-oppen-spis-valvd-mittpanel", "seoTitel": "Gnistskydd för öppen spis i tre delar | Fyndplats", "seoBesk": "Gnistskydd i svart metallnät för öppen spis, 110 × 24 × 76,5 cm, med välvd mittpanel, sidopaneler och handtag. Fälls ihop.", "sku": "FP-gnistskydd-valvd-svart", "variantId": "6da131e1-afc0-4be1-99fc-205b2576dedb", "textHash": "c743fa60853a3ff5", "textTecken": 2026, "mediaSumma": 469122239, "mediaTecken": 582, "kat": ["Hem & Inredning"]},
    {"kort": "a6820dd0", "pid": "a6820dd0-0bf8-4dee-876d-dc6c62ea6bad", "namn": "Spökbrud till halloween, 178 cm – rörelsesensor, skrik och röda lysande ögon", "slug": "spokbrud-halloween-178-cm-rorelsesensor", "seoTitel": "Spökbrud till halloween, 178 cm | Fyndplats", "seoBesk": "Spökbrud till halloween, 178 cm, med rörelsesensor som startar skrik, röda lysande ögon och rörelse i överkroppen. Batterier ingår.", "sku": "FP-spokbrud-halloween-178", "variantId": "97e2b43d-3dde-4e82-ae85-7453be91e3df", "textHash": "74cd290f28550072", "textTecken": 2075, "mediaSumma": 438612788, "mediaTecken": 507, "kat": ["Hem & Inredning", "Kalas & Fest"]},
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
