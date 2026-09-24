async function () {
  // Genererad av runda N52:s bygg-steg.py ur ids, namn, seo, slugs, sku, kategori, vantat-hash och media-hash — aldrig skriven av.
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
    {"kort": "80aac077", "pid": "80aac077-d7e4-4d2f-ace1-09d24eb9c284", "namn": "Trehjuling för småbarn i motorcykeldesign – orange, sitthöjd 29 cm, 18–36 mån", "slug": "trehjuling-smabarn-motorcykel-orange", "seoTitel": "Trehjuling för småbarn i motorcykeldesign | Fyndplats", "seoBesk": "Trehjuling för småbarn 18–36 månader i motorcykeldesign, med stålram som bär 30 kg, bred låg sits och tre hjul. 79 × 44 × 50 cm.", "sku": "FP-trehjuling-motorcykel-orange", "variantId": "cf986cc9-8adb-4dce-ba65-f9ace870ff25", "textHash": "3e73bea960ac0d02", "textTecken": 1972, "mediaSumma": 755505102, "mediaTecken": 541, "kat": ["Barn & Familj", "Baby & Småbarn", "Leksaker & Spel"]},
    {"kort": "ac160e8e", "pid": "ac160e8e-1e83-4b72-8847-1a73de6c72ae", "namn": "Barnstaffli 3-i-1 i rosa – krittavla, whiteboard, pappersrulle och två tygkorgar", "slug": "barnstaffli-3-i-1-rosa-tygkorgar", "seoTitel": "Barnstaffli 3-i-1 i rosa med tygkorgar | Fyndplats", "seoBesk": "Barnstaffli 3-i-1 i rosa med krittavla, whiteboard, pappersrulle och två tygkorgar med djurmotiv. 54 × 46,5 × 93 cm, för barn 3–8 år.", "sku": "FP-barnstaffli-rosa-tygkorgar", "variantId": "3019381a-9b36-4bf2-81db-bdbc0e507eae", "textHash": "cfc9beb92acc904a", "textTecken": 2075, "mediaSumma": 306102465, "mediaTecken": 568, "kat": ["Barn & Familj", "Leksaker & Spel"]},
    {"kort": "eb7d67a4", "pid": "eb7d67a4-8e1e-4539-b484-437ab0e46847", "namn": "Uppblåsbar snögubbe 240 cm med hög hatt – kvistarmar, lysdioder och färgljus", "slug": "uppblasbar-snogubbe-240-cm-hog-hatt", "seoTitel": "Uppblåsbar snögubbe 240 cm med hög hatt | Fyndplats", "seoBesk": "Uppblåsbar snögubbe till jul, 240 cm, med hög hatt, kvistarmar, lysdioder och roterande färgljus. IP44, markspett, linor och sandsäckar ingår.", "sku": "FP-snogubbe-hog-hatt-240", "variantId": "1f6d1cbd-5ab6-42fe-a83b-ebd1f3198a16", "textHash": "ff06688fa7690fc2", "textTecken": 2240, "mediaSumma": 297284451, "mediaTecken": 460, "kat": ["Hem & Inredning", "Dekoration & Prydnad", "Trädgård & Utemöbler", "Trädgårdsdekor & Belysning"]},
    {"kort": "a64af3a4", "pid": "a64af3a4-290c-4417-829d-96910ca5494d", "namn": "Dörrgrind för hund med klämmontage – 75–95 cm, dörr som öppnas åt båda hållen", "slug": "dorrgrind-hund-klammontage-75-95-cm", "seoTitel": "Dörrgrind för hund, 75–95 cm | Fyndplats", "seoBesk": "Dörrgrind för hund i svart stål med ställskruvar, för öppningar på 75–95 cm. Dörr som öppnas åt båda hållen och dubbla lås, förlängning ingår.", "sku": "FP-dorrgrind-hund-klammontage", "variantId": "65053150-d9c0-4ed7-9e48-7219ca52d469", "textHash": "45e154394a650881", "textTecken": 2143, "mediaSumma": 982304524, "mediaTecken": 319, "kat": ["Husdjur", "Burar, Kläder & Tillbehör"]},
    {"kort": "0b66ea13", "pid": "0b66ea13-010b-49b3-b126-587c85a11ecd", "namn": "Tvättkorg i bambu med tre avtagbara tygkorgar i grått – hylla med ribbor ovanpå", "slug": "tvattkorg-bambu-tre-tygkorgar", "seoTitel": "Tvättkorg i bambu med tre tygkorgar | Fyndplats", "seoBesk": "Tvättkorg med ram i bambu, tre avtagbara tygkorgar i grått och hylla med ribbor ovanpå. 50 × 32 × 69,7 cm, bär 6 kg.", "sku": "FP-tvattkorg-bambu-tre-korgar", "variantId": "654237cc-f1f0-42c4-ba86-7a3f33f16ca5", "textHash": "802fd0e1f1cd5392", "textTecken": 2100, "mediaSumma": 280066689, "mediaTecken": 612, "kat": ["Hem & Inredning", "Badrum & Hemtextil", "Förvaring & Organisering"]},
    {"kort": "163cd19d", "pid": "163cd19d-d496-4dce-b587-adb01beefb62", "namn": "Leksaksdiskmaskin i trä med diskho och kran – 32 tillbehör, för barn från 3 år", "slug": "leksaksdiskmaskin-tra-diskho-32-tillbehor", "seoTitel": "Leksaksdiskmaskin i trä med 32 tillbehör | Fyndplats", "seoBesk": "Leksaksdiskmaskin i trä med diskho, kran, vred och 32 tillbehör. Arbetshöjd 44 cm, 36 × 26 × 52 cm, för barn från 3 år.", "sku": "FP-leksaksdiskmaskin-tra", "variantId": "f88950df-b98c-4dc1-97c6-df7c57e718a9", "textHash": "4bf0f39614af1c8f", "textTecken": 2019, "mediaSumma": 104673986, "mediaTecken": 480, "kat": ["Barn & Familj", "Leksaker & Spel"]},
    {"kort": "2487e6bb", "pid": "2487e6bb-4412-4524-86b6-5266b4ec1e48", "namn": "Blomhylla i svart metall med tre plan och tre krokar – 137 cm, för inne och ute", "slug": "blomhylla-svart-metall-tre-plan-krokar", "seoTitel": "Blomhylla i svart metall med krokar | Fyndplats", "seoBesk": "Blomhylla i svart pulverlackerad metall med tre plan och tre krokar, 75 × 25 × 137 cm. Bär 20 kg per plan, för inne och ute.", "sku": "FP-blomhylla-svart-krokar", "variantId": "65bd4d45-effd-492a-bda8-1738d02535e2", "textHash": "d5b608537b98f49e", "textTecken": 2109, "mediaSumma": 40093081, "mediaTecken": 538, "kat": ["Hem & Inredning", "Trädgård & Utemöbler", "Växthus & Odling"]},
    {"kort": "43d46471", "pid": "43d46471-c159-41d6-9c02-7c043b14c34c", "namn": "Skoställ i grått och svart med låda – tre hyllor för upp till nio par skor", "slug": "skostall-gra-lada-tre-hyllor", "seoTitel": "Skoställ i grått med låda och tre hyllor | Fyndplats", "seoBesk": "Skoställ i grått och svart med låda och tre hyllor för upp till nio par skor. 70 × 30 × 87,6 cm, med tippskydd och ställbara fötter.", "sku": "FP-skostall-gra-lada", "variantId": "f2bc18fe-e6d1-4dcc-a978-7fb83a43e4f1", "textHash": "7b957866679083ee", "textTecken": 2048, "mediaSumma": 251386189, "mediaTecken": 546, "kat": ["Hem & Inredning", "Förvaring & Organisering"]},
    {"kort": "cb08e980", "pid": "cb08e980-5f24-43fd-a143-b98c61dadd29", "namn": "Ministepper med motståndsband och LCD-display – ställbar steghöjd, bär 100 kg", "slug": "ministepper-motstandsband-display", "seoTitel": "Ministepper med motståndsband och display | Fyndplats", "seoBesk": "Ministepper med avtagbara motståndsband, LCD-display och steghöjd på 10–29 cm. Halkfria pedaler, bär 100 kg, ingen montering.", "sku": "FP-ministepper-band-display", "variantId": "0a31ac2d-9860-40b5-a168-0dd07629442e", "textHash": "3ce530a42bb056f5", "textTecken": 1995, "mediaSumma": 937073276, "mediaTecken": 482, "kat": ["Sport & Fritid", "Träning & Gym"]},
    {"kort": "5f833adb", "pid": "5f833adb-164d-4d79-803a-e9b9b0483927", "namn": "Spegelskåp för badrummet i grått – två skåp, öppen hylla och dämpade gångjärn", "slug": "spegelskap-badrum-gra-oppen-hylla", "seoTitel": "Spegelskåp för badrummet i grått | Fyndplats", "seoBesk": "Spegelskåp för badrummet i mörk- och ljusgrått med spegeldörr, två skåp, öppen hylla och dämpade gångjärn. 55 × 17 × 55 cm.", "sku": "FP-spegelskap-gra-55", "variantId": "9b0b4149-51ca-4226-9436-20adb93e6ed4", "textHash": "ff27e4c2b7c04d71", "textTecken": 2201, "mediaSumma": 977201987, "mediaTecken": 477, "kat": ["Hem & Inredning", "Badrum & Hemtextil", "Förvaring & Organisering"]},
    {"kort": "b0f5b1a5", "pid": "b0f5b1a5-dd26-4c06-8566-446ba23712d0", "namn": "Två sittpallar i gräddvit plisserad sammet – förvaring i den stora, bär 120 kg", "slug": "sittpallar-plisserad-sammet-2-pack", "seoTitel": "Två sittpallar i plisserad sammet | Fyndplats", "seoBesk": "Två runda sittpallar i gräddvit plisserad sammet, där den stora har 34,8 liter förvaring och den lilla får plats inuti. Bär 120 kg vardera.", "sku": "FP-sittpallar-plisse-2-pack", "variantId": "8c8c73e7-cb1b-46b1-8e67-d71ea29b32df", "textHash": "1311a545b3c2dd85", "textTecken": 2088, "mediaSumma": 794224624, "mediaTecken": 591, "kat": ["Hem & Inredning", "Förvaring & Organisering"]},
    {"kort": "e95efc20", "pid": "e95efc20-1c1c-497c-90fc-aa003b932df8", "namn": "Whiteboard i glas, 90 × 60 cm – ramlös med pennhylla, fyra pennor och sudd", "slug": "whiteboard-glas-90-x-60-cm-ramlos", "seoTitel": "Whiteboard i glas, 90 × 60 cm | Fyndplats", "seoBesk": "Ramlös whiteboard i vitt glas, 90 × 60 cm, med pennhylla i aluminium, fyra pennor och sudd. Magnetisk med starka magneter.", "sku": "FP-whiteboard-glas-90", "variantId": "9771e042-d2a2-43f8-af85-6ab48a6cde26", "textHash": "d88911e295cbb9f0", "textTecken": 2022, "mediaSumma": 121047759, "mediaTecken": 563, "kat": ["Hem & Inredning"]},
    {"kort": "e4df6dc7", "pid": "e4df6dc7-91ab-40b7-bdff-3767c14c4a5e", "namn": "Väggspegel i organisk form med ram i furufaner – 91,5 × 45 cm, färdig att hänga", "slug": "vaggspegel-organisk-form-furufaner", "seoTitel": "Väggspegel i organisk form med träram | Fyndplats", "seoBesk": "Väggspegel i asymmetrisk organisk form med ram i furufaner, 91,5 × 45 cm. Klar spegelbild och färdigmonterad med krokar.", "sku": "FP-vaggspegel-organisk-fura", "variantId": "2f832e31-76fe-4a35-8a8a-9ac107471673", "textHash": "06d36da2dbb74982", "textTecken": 1814, "mediaSumma": 914624316, "mediaTecken": 559, "kat": ["Hem & Inredning", "Dekoration & Prydnad"]},
    {"kort": "3edd4198", "pid": "3edd4198-2b09-44e8-9596-f6cb372ac9ca", "namn": "Trappklättrande säckkärra med sex hjul – hopfällbar, bär 70 kg, aluminium", "slug": "trappklattrande-sackkarra-sex-hjul", "seoTitel": "Trappklättrande säckkärra med sex hjul | Fyndplats", "seoBesk": "Hopfällbar säckkärra i aluminium med sex hjul som klättrar i trappor. Bär 70 kg på plant underlag och 30 kg i trappor, teleskophandtag.", "sku": "FP-trappkarra-sex-hjul", "variantId": "f2c8bf95-aad8-4c9b-9b59-93b65b100454", "textHash": "09b57bc4b400f28f", "textTecken": 2204, "mediaSumma": 877203881, "mediaTecken": 509, "kat": ["Hem & Inredning", "Verktyg & Hemmafix"]},
    {"kort": "855bae98", "pid": "855bae98-ef41-4c99-a326-2ebedd70bc72", "namn": "Smal cd- och dvd-hylla i vitt, 140 cm – rymmer 260 cd eller 120 dvd", "slug": "cd-dvd-hylla-vit-140-cm", "seoTitel": "Smal cd- och dvd-hylla i vitt, 140 cm | Fyndplats", "seoBesk": "Smal cd- och dvd-hylla i vitt, 33 × 24 × 140 cm, för upp till 260 cd eller 120 dvd. Ställbara hyllplan och tippskydd ingår.", "sku": "FP-cd-dvd-hylla-vit-140", "variantId": "9c5ad3a3-2061-4a3a-9deb-bf078aab641a", "textHash": "106a2f331d46c2e0", "textTecken": 2035, "mediaSumma": 95861051, "mediaTecken": 391, "kat": ["Hem & Inredning", "Förvaring & Organisering"]},
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
