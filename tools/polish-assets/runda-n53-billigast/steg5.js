async function () {
  // Genererad av runda N53:s bygg-steg.py ur ids, namn, seo, slugs, sku, kategori, vantat-hash och media-hash — aldrig skriven av.
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
    {"kort": "1e139971", "pid": "1e139971-9d92-468b-abc5-1e47e087aaae", "namn": "Gåvagn 3-i-1 i trä med dubbelsidig aktivitetstavla – för barn från 1 år", "slug": "gavagn-3-i-1-tra-aktivitetstavla", "seoTitel": "Gåvagn 3-i-1 i trä med aktivitetstavla | Fyndplats", "seoBesk": "Gåvagn i trä för barn från 1 år med avtagbar, dubbelsidig aktivitetstavla, fack baktill och förvaringspåse. 37 × 33,5 × 47,5 cm.", "sku": "FP-gavagn-3-i-1-tra", "variantId": "c34276d1-4ab7-4628-a14d-c57c40b3fa68", "textHash": "e4c9c577be4884d8", "textTecken": 2469, "mediaSumma": 322228167, "mediaTecken": 500, "kat": ["Barn & Familj", "Baby & Småbarn", "Leksaker & Spel"]},
    {"kort": "3dc622f9", "pid": "3dc622f9-665e-4e12-a55b-2e69ad330b8a", "namn": "Klädställ i bambu med två krokar och skohylla – 116 × 43,5 × 160 cm", "slug": "kladstall-bambu-krokar-skohylla", "seoTitel": "Klädställ i bambu med skohylla | Fyndplats", "seoBesk": "Klädställ i bambu i A-form, 116 × 43,5 × 160 cm, med klädstång, två krokar och en hylla med ribbor för fyra par skor upp till storlek 44.", "sku": "FP-kladstall-bambu-skohylla", "variantId": "70bb97fb-bb41-4a08-8061-456d3f844af4", "textHash": "ac02fedd7c7af573", "textTecken": 2064, "mediaSumma": 50572224, "mediaTecken": 625, "kat": ["Hem & Inredning", "Förvaring & Organisering"]},
    {"kort": "4d7268c1", "pid": "4d7268c1-4c06-4dcd-8c71-82666b6d1d47", "namn": "Två runda sidobord i vit marmorlook med guldfärgad ram – kan skjutas ihop", "slug": "sidobord-runda-marmorlook-guld", "seoTitel": "Runda sidobord i vit marmorlook med guldram | Fyndplats", "seoBesk": "Runda sidobord i vit marmorlook med guldfärgad stålram, som kan skjutas ihop. Stort bord 45 × 45 × 55 cm, litet 40 × 40 × 50 cm.", "sku": "FP-sidobord-marmorlook-guld", "variantId": "c677dec6-f219-4570-b0d5-30767e4becea", "textHash": "bb981dc067069540", "textTecken": 2188, "mediaSumma": 734710770, "mediaTecken": 555, "kat": ["Hem & Inredning"]},
    {"kort": "560edb9f", "pid": "560edb9f-5d79-4bc9-9f41-fa2f95579378", "namn": "Konstgjord bambu 140 cm i svart kruka – 780 blad, för inne och ute", "slug": "konstgjord-bambu-140-cm-svart-kruka", "seoTitel": "Konstgjord bambu 140 cm i kruka | Fyndplats", "seoBesk": "Konstgjord bambu, 140 cm hög med 780 blad, i en kruka på Ø17 × 14,5 cm med konstgjord mossa och cementbas. För inne och ute.", "sku": "FP-konstbambu-140-svart-kruka", "variantId": "ee79566d-da22-4fbe-8297-cad7dff7c84e", "textHash": "a3fa3c83fbc89bff", "textTecken": 1908, "mediaSumma": 137829519, "mediaTecken": 482, "kat": ["Hem & Inredning", "Dekoration & Prydnad"]},
    {"kort": "aa7637fb", "pid": "aa7637fb-e145-46bc-9c9a-c0b278a68434", "namn": "Vedställ i svart stål med fyra brasredskap – 75 cm, bär 100 kg", "slug": "vedstall-svart-stal-brasredskap", "seoTitel": "Vedställ i svart stål med brasredskap | Fyndplats", "seoBesk": "Vedställ i pulverlackat stål med borste, skyffel, eldgaffel och tång som hänger på sidorna. 75 × 30 × 60 cm, botten 15 cm över golvet, bär 100 kg.", "sku": "FP-vedstall-brasredskap-svart", "variantId": "c7320e48-8346-4471-b75b-b8ed6c430772", "textHash": "9f3bc0782b645864", "textTecken": 1961, "mediaSumma": 230257850, "mediaTecken": 586, "kat": ["Hem & Inredning", "Förvaring & Organisering"]},
    {"kort": "bd664764", "pid": "bd664764-2bb5-48b2-bd9d-1002f54757f2", "namn": "Smal bokhylla i vitt, 30 cm bred – två lådor, skåp och öppna fack, 158 cm", "slug": "smal-bokhylla-vit-lador-skap-158", "seoTitel": "Smal bokhylla i vitt med lådor och skåp | Fyndplats", "seoBesk": "Smal vit bokhylla, 30 × 24 × 158 cm, med öppna fack, två lådor och ett skåp med dörr. Ett ställbart hyllplan och tippskydd ingår.", "sku": "FP-bokhylla-smal-vit-lador", "variantId": "ef29d441-4725-4616-b791-282ffd22471b", "textHash": "93970d36c736db1e", "textTecken": 2132, "mediaSumma": 85947708, "mediaTecken": 591, "kat": ["Hem & Inredning", "Förvaring & Organisering"]},
    {"kort": "eca2fa1e", "pid": "eca2fa1e-8c64-43e5-b561-c367c4dc15b2", "namn": "Sittbänk i furu med svarta ben – 102 cm, två sittplatser, bär 220 kg", "slug": "sittbank-furu-svarta-ben-102-cm", "seoTitel": "Sittbänk i furu med svarta ben, 102 cm | Fyndplats", "seoBesk": "Sittbänk i massiv furu med naturfärgad lackad sits och svarta ben. 102 × 36 × 45 cm, plats för två och bär 220 kg.", "sku": "FP-sittbank-furu-svart-102", "variantId": "bee25fbf-9df6-4447-82f8-7f9c1ef42a32", "textHash": "7963469caea3b0c5", "textTecken": 1732, "mediaSumma": 708388211, "mediaTecken": 476, "kat": ["Hem & Inredning"]},
    {"kort": "1ae506e3", "pid": "1ae506e3-a1e6-4d5c-9e95-39762664e253", "namn": "Byrå för barnrummet i rosa och vitt – tre lådor, 60 cm hög, för barn 3–8 år", "slug": "byra-barnrum-rosa-vit-tre-lador", "seoTitel": "Byrå för barnrummet i rosa och vitt | Fyndplats", "seoBesk": "Byrå för barnrummet i rosa och vitt med tre lådor som är lätta för små händer att öppna. 60 × 40 × 60 cm, E1-skivor, för barn 3–8 år.", "sku": "FP-byra-barn-rosa-tre-lador", "variantId": "b67138fb-5b89-48b5-b5b0-233f3a082ce4", "textHash": "fa6c1acc7603e9c7", "textTecken": 2065, "mediaSumma": 567488394, "mediaTecken": 599, "kat": ["Barn & Familj", "Hem & Inredning", "Förvaring & Organisering"]},
    {"kort": "85b1a737", "pid": "85b1a737-f5b2-4a36-afc4-4ebd1325483e", "namn": "Leksaksmotor att reparera – traktor med 55 delar, ljud och dimeffekt", "slug": "leksaksmotor-traktor-ljud-dimeffekt", "seoTitel": "Leksaksmotor att reparera, 55 delar | Fyndplats", "seoBesk": "Leksaksmotor i form av en grön traktor, med tändning, växelljud, dimeffekt och 55 reparationsdelar att skruva isär och bygga ihop. För barn 3–6 år.", "sku": "FP-leksaksmotor-traktor", "variantId": "dd630783-093d-4f58-842b-6cd4a18dcad2", "textHash": "68fff9621e0609b6", "textTecken": 2169, "mediaSumma": 622603730, "mediaTecken": 568, "kat": ["Barn & Familj", "Leksaker & Spel"]},
    {"kort": "a778baf1", "pid": "a778baf1-f987-40f3-8069-a35506c266bc", "namn": "Sensorsoptunna 30 liter i rostfritt stål – lock som öppnas och stängs själv", "slug": "sensorsoptunna-30-liter-rostfritt", "seoTitel": "Sensorsoptunna 30 liter i rostfritt stål | Fyndplats", "seoBesk": "Soptunna på 30 liter med infraröd sensor som öppnar locket när du närmar dig och stänger det själv. Rostfritt stål, Ø30,5 × 51,5 cm.", "sku": "FP-sensorsoptunna-30-rostfri", "variantId": "4e565bb0-4aae-470b-8a41-67d9a8fa17e5", "textHash": "c3103449fdae3b8b", "textTecken": 2147, "mediaSumma": 410495904, "mediaTecken": 386, "kat": ["Kök & Husgeråd", "Hem & Inredning"]},
    {"kort": "b398fe7b", "pid": "b398fe7b-ff80-4911-a267-61ae785d1ce1", "namn": "Stegbräda för aerobics med tre höjder – 10, 15 eller 20 cm, bär 150 kg", "slug": "stegbrada-aerobics-tre-hojder", "seoTitel": "Stegbräda med tre höjder, bär 150 kg | Fyndplats", "seoBesk": "Stegbräda för aerobics och styrketräning, 110 × 40 cm, med halkfri yta och fyra förhöjningar för 10, 15 eller 20 cm. Bär 150 kg.", "sku": "FP-stegbrada-tre-hojder", "variantId": "43e0d228-20b5-4b2e-b5f9-1b889b75cbfb", "textHash": "4b61615b6c9975d0", "textTecken": 2159, "mediaSumma": 657698230, "mediaTecken": 560, "kat": ["Sport & Fritid", "Träning & Gym"]},
    {"kort": "db1f6697", "pid": "db1f6697-5cc7-4431-866e-7f7ae0c28a01", "namn": "Hopfällbart skrivbord i vitt med avtagbar skärmhylla – 100 cm, 5,5 cm hopfällt", "slug": "hopfallbart-skrivbord-vit-skarmhylla", "seoTitel": "Hopfällbart skrivbord med skärmhylla | Fyndplats", "seoBesk": "Hopfällbart skrivbord i vitt, 100 × 48 × 87,5 cm, som fälls ihop till 5,5 cm. Avtagbar skärmhylla, ben i stål med tippskydd, bär 70 kg.", "sku": "FP-skrivbord-hopfallbart-vit", "variantId": "b600ef03-f395-40dc-9989-3c0146da3404", "textHash": "6fae1958f2ebeffb", "textTecken": 2148, "mediaSumma": 142223859, "mediaTecken": 404, "kat": ["Hem & Inredning"]},
    {"kort": "12704344", "pid": "12704344-038f-4a8e-8a3d-03d75c84693d", "namn": "Konstgjord kaktus 95 cm med tre stammar – i ljus kruka, Ø22 cm", "slug": "konstgjord-kaktus-95-cm-tre-stammar", "seoTitel": "Konstgjord kaktus 95 cm i kruka | Fyndplats", "seoBesk": "Konstgjord kaktus, 95 cm hög med tre stammar i EVA och PE med metalltråd som går att forma. Levereras i en kruka på Ø22 × 22 cm.", "sku": "FP-konstkaktus-95-tre-stammar", "variantId": "ba020497-20cd-4804-9702-ba0501883e16", "textHash": "d3eb692923634b65", "textTecken": 1767, "mediaSumma": 469157721, "mediaTecken": 524, "kat": ["Hem & Inredning", "Dekoration & Prydnad"]},
    {"kort": "2af51f93", "pid": "2af51f93-6175-437a-acf5-9701c3bd1eae", "namn": "Gåvagn i trä med xylofon, kulram och formlåda – fem klossar, från 18 månader", "slug": "gavagn-tra-xylofon-kulram-klossar", "seoTitel": "Gåvagn i trä med xylofon och klossar | Fyndplats", "seoBesk": "Gåvagn i trä för barn från 18 månader, med ställbart hjulmotstånd, xylofon, kulram, kugghjul, formlåda och fack baktill. 34,5 × 32,4 × 46 cm.", "sku": "FP-gavagn-tra-xylofon", "variantId": "3a9ac7ae-db45-4e25-ab1b-c5964ffcdb99", "textHash": "6de4668b2d941be7", "textTecken": 2237, "mediaSumma": 341059807, "mediaTecken": 558, "kat": ["Barn & Familj", "Baby & Småbarn", "Leksaker & Spel"]},
    {"kort": "d8af896a", "pid": "d8af896a-dd56-4a46-808a-c72f5f8187bb", "namn": "Skjutdörrsbeslag 122 cm för vikdörr i ladudörrsstil – svart stål, bär 90 kg", "slug": "skjutdorrsbeslag-122-cm-vikdorr-svart", "seoTitel": "Skjutdörrsbeslag 122 cm för vikdörr | Fyndplats", "seoBesk": "Skjutdörrsbeslag i svart stål för vikdörrar, med 122 cm skena och hjul som rullar tyst. För dörrblad på 40–55 mm, bär 90 kg. Dörren ingår inte.", "sku": "FP-skjutdorrsbeslag-vikdorr-122", "variantId": "e7434965-7e4a-4561-8e4a-cec03fe03502", "textHash": "454a2a2cfa147a00", "textTecken": 2122, "mediaSumma": 146608842, "mediaTecken": 551, "kat": ["Hem & Inredning", "Verktyg & Hemmafix"]},
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
