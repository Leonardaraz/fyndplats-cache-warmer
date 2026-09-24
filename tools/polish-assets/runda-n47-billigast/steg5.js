async function () {
  // Genererad av runda N47:s bygg-steg.py ur ids, namn, seo, slugs, sku, kategori, vantat-hash och media-hash — aldrig skriven av.
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
    {"kort": "ccae0705", "pid": "ccae0705-a08d-41de-ae5b-0a48c32f3cc2", "namn": "Medicinskåp i rostfritt stål – låsbar glasdörr med tryckspärr, 30 × 18 × 50 cm", "slug": "medicinskap-rostfritt-stal-tryckoppning", "seoTitel": "Medicinskåp i rostfritt stål med glasdörr | Fyndplats", "seoBesk": "Låsbart medicinskåp i rostfritt stål, 30 × 18 × 50 cm, med dörr av frostat härdat glas som öppnas med ett tryck. Två nycklar och monteringsmaterial ingår.", "sku": "FP-medicinskap-rostfritt-tryck", "variantId": "662364c9-b3f0-4855-b663-0c4047bba910", "textHash": "3c72dd511c634545", "textTecken": 2233, "mediaSumma": 256260543, "mediaTecken": 561, "kat": ["Hem & Inredning", "Badrum & Hemtextil"]},
    {"kort": "f787a854", "pid": "f787a854-c96d-458c-9640-e3d33c5b5c54", "namn": "Julgirlang 180 cm med 50 LED – snöpudrade kvistar, kottar, bär och timer", "slug": "julgirlang-180-cm-50-led-timer", "seoTitel": "Julgirlang 180 cm med 50 LED och timer | Fyndplats", "seoBesk": "Julgirlang på 180 cm med 216 snöpudrade kvistar, kottar, röda bär och 50 varmvita LED. Batteridriven med timer på 6 timmar, för inomhusbruk.", "sku": "FP-julgirlang-180-50-led", "variantId": "f3999650-593d-4be9-b7a4-9620818dd4f9", "textHash": "1c92265dbc34fcfc", "textTecken": 2329, "mediaSumma": 319708446, "mediaTecken": 447, "kat": ["Hem & Inredning", "Dekoration & Prydnad"]},
    {"kort": "f6e74878", "pid": "f6e74878-d96a-4bdd-af71-8cc870658fa4", "namn": "Skrivbord med hylla, 84 × 45 cm – vit metallram, ekfärgad skiva och kabelhål", "slug": "skrivbord-hylla-84-cm-vit-ek", "seoTitel": "Skrivbord med hylla, 84 × 45 cm | Fyndplats", "seoBesk": "Kompakt skrivbord 84 × 45 × 85 cm med upphöjd hylla, kabelgenomföring och vit metallram med ekfärgad skiva. Arbetshöjd 71,5 cm, bär 20 kg.", "sku": "FP-skrivbord-hylla-84-vit-ek", "variantId": "5d22c603-2074-4bd7-9e64-538d098770fe", "textHash": "59613a45dcb6e7af", "textTecken": 2107, "mediaSumma": 964514313, "mediaTecken": 608, "kat": ["Hem & Inredning"]},
    {"kort": "0d42d53f", "pid": "0d42d53f-7470-4f92-a41c-14543893ce24", "namn": "Väggspegel med hylla – svart metallram med rundade övre hörn, 70 × 50 cm", "slug": "vaggspegel-hylla-svart-metallram-70-cm", "seoTitel": "Väggspegel med hylla, svart metallram | Fyndplats", "seoBesk": "Väggspegel 70 × 50 cm med svart ram av järn, rundade övre hörn och en hylla på 50 × 10 cm i underkant. Spegelglas 56 × 47 cm.", "sku": "FP-vaggspegel-hylla-svart-70", "variantId": "d7877780-b852-40e3-81ae-0fc595362e69", "textHash": "b8e63b6a666e25fe", "textTecken": 1915, "mediaSumma": 686436260, "mediaTecken": 568, "kat": ["Hem & Inredning", "Dekoration & Prydnad"]},
    {"kort": "114d37e5", "pid": "114d37e5-692b-47eb-919c-63fc4b15032b", "namn": "Halloweenfigur fågelskrämma 77 cm – rör sig, fnissar och lyser", "slug": "halloween-fagelskramma-77-cm-ljud", "seoTitel": "Halloweenfigur fågelskrämma 77 cm | Fyndplats", "seoBesk": "Fågelskrämma till halloween som rör sig, fnissar och ylar vid beröring eller högt ljud, med lysande pumpa. 60 × 26 × 77 cm, för inne och under tak.", "sku": "FP-halloween-fagelskramma-77", "variantId": "b498f5f2-91a7-4342-be76-e6715abb8202", "textHash": "24e25ec45476136e", "textTecken": 2291, "mediaSumma": 958296620, "mediaTecken": 538, "kat": ["Hem & Inredning", "Kalas & Fest"]},
    {"kort": "760dd23c", "pid": "760dd23c-fe45-41f5-9e11-fce3c51172b4", "namn": "Hopfällbar transportvagn för 200 kg – utdragbart flak och justerbart handtag", "slug": "hopfallbar-transportvagn-200-kg", "seoTitel": "Hopfällbar transportvagn för 200 kg | Fyndplats", "seoBesk": "Hopfällbar transportvagn som bär 200 kg, med utdragbart flak 48–62,5 cm, justerbart handtag och spännband. Hopfälld 48 × 35 × 15 cm.", "sku": "FP-transportvagn-hopfallbar-200", "variantId": "53eb1cff-fd45-40fb-81c0-6604cf777253", "textHash": "151a0011a433ed2d", "textTecken": 2163, "mediaSumma": 878263542, "mediaTecken": 356, "kat": ["Hem & Inredning", "Verktyg & Hemmafix"]},
    {"kort": "b8002629", "pid": "b8002629-89d6-4409-b429-ad6b612d734c", "namn": "Skärmtak för dörr och fönster, 100 × 75 cm – polykarbonat med UV-skikt", "slug": "skarmtak-dorr-fonster-100-cm-polykarbonat", "seoTitel": "Skärmtak för dörr och fönster, 100 × 75 cm | Fyndplats", "seoBesk": "Skärmtak på 100 × 75 cm av 5 mm polykarbonat med UV-skikt och svarta konsoler. Skyddar dörr och fönster mot sol, lätt regn och snö.", "sku": "FP-skarmtak-100x75-polykarbonat", "variantId": "70e2a974-20f3-48e8-b0fb-c6bd8ab7daf6", "textHash": "a3e11a9692d5b02b", "textTecken": 2405, "mediaSumma": 524658476, "mediaTecken": 405, "kat": ["Hem & Inredning", "Verktyg & Hemmafix"]},
    {"kort": "26ec5761", "pid": "26ec5761-9d0c-4c8a-ac99-2a7aae5cb206", "namn": "Gåvagn i trä med aktiviteter – formsortering, kulram och förvaring, från 1 år", "slug": "gavagn-tra-aktiviteter-formsortering", "seoTitel": "Gåvagn i trä med aktiviteter | Fyndplats", "seoBesk": "Gåvagn i trä för barn från 1 år, med formsortering, kulram och förvaring i vagnen. Stadig stomme av flerskiktsskiva, 41 × 31,5 × 47 cm.", "sku": "FP-gavagn-tra-aktivitet-gron", "variantId": "36701492-e58e-47fd-b235-f2c05c815a91", "textHash": "c62f0c8bd15364d0", "textTecken": 2198, "mediaSumma": 788772684, "mediaTecken": 522, "kat": ["Barn & Familj", "Baby & Småbarn", "Leksaker & Spel"]},
    {"kort": "3b3705f5", "pid": "3b3705f5-1faa-40c0-a089-86313c8422a8", "namn": "Bokhylla i trädform, 136 cm – nio plan, vit, med tippskydd", "slug": "bokhylla-tradform-136-cm-nio-plan", "seoTitel": "Bokhylla i trädform, 136 cm, vit | Fyndplats", "seoBesk": "Vit bokhylla formad som ett träd, 136 cm hög med nio plan för böcker och skivor. Bär 27 kg, med stålstomme, tippskydd och filtdynor.", "sku": "FP-bokhylla-tradform-136cm-vit", "variantId": "e07230fd-27a6-45cc-966f-b7fa791ff7b5", "textHash": "ab75fc20f73085dc", "textTecken": 2085, "mediaSumma": 291153093, "mediaTecken": 547, "kat": ["Hem & Inredning", "Förvaring & Organisering"]},
    {"kort": "934297b1", "pid": "934297b1-51c5-48d6-b570-8b1ab4dae1dd", "namn": "Upphöjd hundsäng med tak, 106 × 76 cm – liggyta av nät, stålram och väska", "slug": "upphojd-hundsang-med-tak-106-cm", "seoTitel": "Upphöjd hundsäng med tak, 106 × 76 cm | Fyndplats", "seoBesk": "Upphöjd hundsäng med tak mot sol och regn och liggyta av luftigt nät. 106 × 76 × 94 cm, för hundar under 30 kg, med väska för resan.", "sku": "FP-hundsang-solskydd-106cm", "variantId": "d20cb852-ae05-409f-9e77-3b45687665b2", "textHash": "c8c2531937cdf5f7", "textTecken": 2016, "mediaSumma": 586274192, "mediaTecken": 487, "kat": ["Husdjur", "Burar, Kläder & Tillbehör"]},
    {"kort": "a62db5fd", "pid": "a62db5fd-b7b0-4b98-9cb1-7675949e2958", "namn": "Uppblåsbar tomte i släde med ren, 200 cm – LED-belysning, för inne och ute", "slug": "uppblasbar-tomte-slade-ren-led", "seoTitel": "Uppblåsbar tomte i släde med ren, 200 cm | Fyndplats", "seoBesk": "Uppblåsbar julfigur med ren, tomte i släde och snögubbe, 200 × 80 × 128 cm. Inbyggd LED, blåses upp av fläkten och tål väder enligt IP44.", "sku": "FP-uppblasbar-tomte-slade-ren", "variantId": "51edd0a6-9cc0-4ca1-a000-ba2e3917832f", "textHash": "9ee3fc08ea1cb788", "textTecken": 2348, "mediaSumma": 842416206, "mediaTecken": 547, "kat": ["Hem & Inredning", "Dekoration & Prydnad", "Trädgård & Utemöbler", "Trädgårdsdekor & Belysning"]},
    {"kort": "b51b6e6c", "pid": "b51b6e6c-c86d-4de4-ad1e-9c795aa4d0d7", "namn": "Två konstgjorda granar 120 cm i kruka – 170 grenspetsar per gran", "slug": "tva-konstgjorda-granar-120-cm-kruka", "seoTitel": "Två konstgjorda granar 120 cm i kruka | Fyndplats", "seoBesk": "Två smala konstgjorda granar på 120 cm med 170 grenspetsar var och tvådelad stam, i svarta krukor. Uppställda på 10–15 minuter, för inomhusbruk.", "sku": "FP-tva-granar-120cm-kruka", "variantId": "4528ccf0-2bf3-4f71-b647-d1eeb07e97c3", "textHash": "83896f2fd0d4a4f8", "textTecken": 2086, "mediaSumma": 622849071, "mediaTecken": 500, "kat": ["Hem & Inredning", "Dekoration & Prydnad"]},
    {"kort": "b94fab48", "pid": "b94fab48-8509-42a9-9590-fff84a19172f", "namn": "Badrumsspegel med hyllor, 60 × 48 cm – vit MDF, tre hyllplan", "slug": "badrumsspegel-hyllor-60-cm-vit", "seoTitel": "Badrumsspegel med tre hyllor, vit | Fyndplats", "seoBesk": "Vit badrumsspegel 60 × 48 cm med tre öppna hyllplan i MDF klass E1. Spegelglas 39,5 × 46,5 cm, bär 2 kg per hylla och 6 kg totalt.", "sku": "FP-badrumsspegel-hyllor-60-vit", "variantId": "5d7e1d38-d835-48d3-be40-cc83b0d9e51b", "textHash": "fe1f403ef22da73e", "textTecken": 1990, "mediaSumma": 759211464, "mediaTecken": 553, "kat": ["Hem & Inredning", "Badrum & Hemtextil", "Förvaring & Organisering"]},
    {"kort": "f2aa99d9", "pid": "f2aa99d9-3c12-4c3f-ab09-ffac3d4ed5f9", "namn": "Hängande halloweenfigur 183 cm – lysande ögon och mun, rörelse och ylande", "slug": "hangande-halloweenfigur-183-cm", "seoTitel": "Hängande halloweenfigur 183 cm | Fyndplats", "seoBesk": "Hängande halloweenfigur på 183 cm som vrider huvudet, vinkar och ylar vid beröring eller ljud, med röda ögon och grönt lysande mun.", "sku": "FP-halloween-hangande-183", "variantId": "05c130ec-1230-4389-a9b2-aae1fa3e7664", "textHash": "1a11eac8e474c2fb", "textTecken": 2158, "mediaSumma": 231935998, "mediaTecken": 532, "kat": ["Hem & Inredning", "Kalas & Fest"]},
    {"kort": "0db7e560", "pid": "0db7e560-2f60-416b-8bd2-84b09838f798", "namn": "Hage för smådjur med 36 gallerpaneler – dörr ingår, 146 × 73 × 73 cm", "slug": "smadjurshage-36-gallerpaneler", "seoTitel": "Hage för smådjur, 36 gallerpaneler | Fyndplats", "seoBesk": "Hage för marsvin och andra smådjur av 36 gallerpaneler på 35 × 35 cm, med dörr. Bygg en stor yta eller flera rum, 146 × 73 × 73 cm som på bilderna.", "sku": "FP-smadjurshage-36-paneler", "variantId": "072ddb06-7073-446c-a703-a3bb8459761d", "textHash": "4e34873a30bb7a39", "textTecken": 2162, "mediaSumma": 687681939, "mediaTecken": 509, "kat": ["Husdjur", "Burar, Kläder & Tillbehör"]},
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
