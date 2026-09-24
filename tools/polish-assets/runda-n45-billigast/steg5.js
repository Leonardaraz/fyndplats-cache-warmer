async function () {
  // Genererad av runda N45:s bygg-steg.py ur ids, namn, seo, slugs, sku, kategori, vantat-hash och media-hash — aldrig skriven av.
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
    {"kort": "173bc5bd", "pid": "173bc5bd-59f3-4668-b0c0-824537e1336e", "namn": "Smal julgran 195 cm med 556 grenspetsar och 25 kottar – Ø54 cm, i sektioner", "slug": "smal-julgran-195-cm-556-grenspetsar-kottar", "seoTitel": "Smal julgran 195 cm med kottar | Fyndplats", "seoBesk": "Smal konstgjord julgran på 195 cm, 54 cm i diameter, med 556 grenspetsar och 25 kottar. Delad i sektioner och flamskyddad. Pynt ingår inte.", "sku": "FP-julgran-smal-195-556-spetsar", "variantId": "d2ef4fe9-c4c1-4922-9d4e-ecb69a4378af", "textHash": "fb08574318d9ef22", "textTecken": 1978, "mediaSumma": 73052250, "mediaTecken": 456, "kat": ["Hem & Inredning", "Dekoration & Prydnad"]},
    {"kort": "300d3415", "pid": "300d3415-01c8-4443-badd-9dfb5280a2e9", "namn": "Julby i trä med 10 LED – kyrka, hus och granar, 45 × 10 × 25 cm", "slug": "julby-i-tra-10-led-45-cm", "seoTitel": "Julby i trä med 10 LED | Fyndplats", "seoBesk": "Snötäckt julby i plywood med kyrka, hus och granar som lyser med 10 varmvita LED-lampor. Drivs med 2 AA-batterier, 45 × 10 × 25 cm.", "sku": "FP-julby-tra-10-led", "variantId": "bc163e18-96ec-4ffe-afa9-3e08822618c7", "textHash": "da7ca71102868452", "textTecken": 1896, "mediaSumma": 259208635, "mediaTecken": 523, "kat": ["Hem & Inredning", "Dekoration & Prydnad"]},
    {"kort": "2cb5b77e", "pid": "2cb5b77e-4d59-4b08-99a7-20beb2ad40f4", "namn": "LED-björk 180 cm med 96 LED – vit stam, 12 grenar och 5 m sladd", "slug": "led-bjork-180-cm-96-led", "seoTitel": "LED-björk 180 cm med 96 LED | Fyndplats", "seoBesk": "Konstgjord björk på 180 cm med 96 LED-lampor på 12 böjbara grenar och en stam som efterliknar björkbark. För inomhus och ute under tak.", "sku": "FP-led-bjork-180-96-led", "variantId": "8259b746-df37-4587-8fb5-14052dcfdec6", "textHash": "6c6dcbf44107b1b2", "textTecken": 1857, "mediaSumma": 31703254, "mediaTecken": 485, "kat": ["Hem & Inredning", "Belysning", "Dekoration & Prydnad"]},
    {"kort": "badc577d", "pid": "badc577d-42a4-408b-9a05-d357932656f2", "namn": "Nattduksbord med dold låda – svart, öppet fack med mellanvägg, 40 × 30 × 46 cm", "slug": "nattduksbord-dold-lada-svart", "seoTitel": "Nattduksbord med dold låda, svart | Fyndplats", "seoBesk": "Svart nattduksbord med dold låda utan synligt handtag och ett öppet fack med mellanvägg. Melaminbelagd spånskiva, 40 × 30 × 46 cm.", "sku": "FP-nattduksbord-dold-lada-svart", "variantId": "13c25277-4f97-472b-99f1-172e867023cd", "textHash": "f097ad9eb92414c6", "textTecken": 2018, "mediaSumma": 403306197, "mediaTecken": 443, "kat": ["Hem & Inredning", "Förvaring & Organisering"]},
    {"kort": "db4808e6", "pid": "db4808e6-a557-4345-b6e6-7c5a7aca4981", "namn": "Smart hula hoop med viktkula och räknare – 16 delar för midjor 76–113 cm", "slug": "hula-hoop-viktkula-raknare", "seoTitel": "Smart hula hoop med viktkula | Fyndplats", "seoBesk": "Smart hula hoop med viktkula på 400 g och digital räknare för varv, tid och kalorier. 16 justerbara delar för midjor på 76–113 cm.", "sku": "FP-hula-hoop-viktkula-rosa", "variantId": "c24b83cc-9830-4aa1-ae06-32812bdaa936", "textHash": "a3c649d93df79d81", "textTecken": 1996, "mediaSumma": 114105045, "mediaTecken": 498, "kat": ["Sport & Fritid", "Träning & Gym"]},
    {"kort": "edac1214", "pid": "edac1214-56f4-4815-a06f-b18cdad35855", "namn": "Konstgjord bambu 90 cm med 504 blad – fem stammar och kruka med cement", "slug": "konstgjord-bambu-90-cm-504-blad", "seoTitel": "Konstgjord bambu 90 cm med kruka | Fyndplats", "seoBesk": "Konstgjord bambu på 90 cm med fem stammar och 504 blad, i en kruka med cementbotten och konstmossa. Behöver varken vatten eller ljus.", "sku": "FP-konstbambu-90-504-blad", "variantId": "53b5f93a-55a5-4725-8d7c-130ec938e4e7", "textHash": "547ea54bd666c22f", "textTecken": 1784, "mediaSumma": 549714229, "mediaTecken": 465, "kat": ["Hem & Inredning", "Dekoration & Prydnad"]},
    {"kort": "06675244", "pid": "06675244-e3da-4f4a-9ddb-3176bffd5fe5", "namn": "Julgran 100 cm med snöade spetsar och kottar – Ø60 cm, guldfärgad kruka", "slug": "julgran-100-cm-sno-kottar", "seoTitel": "Julgran 100 cm med snö och kottar | Fyndplats", "seoBesk": "Konstgjord julgran på 100 cm med snöade spetsar, 12 kottar och guldfärgad kruka. 60 cm i diameter, flamskyddad plast, för inomhusbruk.", "sku": "FP-julgran-100-sno-kottar", "variantId": "aaeb0019-d070-466f-8a5a-8b4210901be7", "textHash": "48ed5ab0340734ab", "textTecken": 1937, "mediaSumma": 468862787, "mediaTecken": 432, "kat": ["Hem & Inredning", "Dekoration & Prydnad"]},
    {"kort": "119c6052", "pid": "119c6052-0e5f-4dd2-9d97-56d69328bc1a", "namn": "Medicinskåp med kodlås – 30 × 14 × 30 cm, halvhylla och handtag, för väggen", "slug": "medicinskap-kodlas-30-cm", "seoTitel": "Medicinskåp med kodlås för väggen | Fyndplats", "seoBesk": "Medicinskåp i kallvalsat rostfritt stål med kodlås, halvhylla och handtag. 30 × 14 × 30 cm, bär 5 kg. Skruvar och pluggar ingår.", "sku": "FP-medicinskap-kodlas-30x30", "variantId": "7e96694b-8974-4d0a-a206-4de64d2ec722", "textHash": "8f6dc4c0fe65c1c2", "textTecken": 2054, "mediaSumma": 43354372, "mediaTecken": 515, "kat": ["Hem & Inredning", "Badrum & Hemtextil"]},
    {"kort": "2f1246a1", "pid": "2f1246a1-0966-4a50-ac55-c8c9e3d5bb26", "namn": "Hängande halloweenmumie 142 cm – röda ögon, ljud och spindlar", "slug": "halloween-mumie-142-cm-ljud", "seoTitel": "Hängande halloweenmumie 142 cm | Fyndplats", "seoBesk": "Hängande halloweenmumie på 142 cm med röda ögon och varmvitt ljus som ylar och skrattar. Startar av beröring eller ljud, 3 AA-batterier.", "sku": "FP-halloween-mumie-142", "variantId": "6d3185f7-5b48-4496-9c41-81a98fcaead5", "textHash": "b1f285f52eb066e1", "textTecken": 2045, "mediaSumma": 921737097, "mediaTecken": 481, "kat": ["Hem & Inredning", "Kalas & Fest"]},
    {"kort": "5f8aed80", "pid": "5f8aed80-bf3c-4b2c-a7f0-b8112ecce559", "namn": "Förvaringsskåp med två tyglådor – rustikt brun, stålram, 45 × 40 × 70,5 cm", "slug": "forvaringsskap-tva-tyglador-70-cm", "seoTitel": "Förvaringsskåp med två tyglådor | Fyndplats", "seoBesk": "Förvaringsskåp i industristil med stålram, två hyllplan och två tyglådor som går att fälla ihop. Rustikt brunt, 45 × 40 × 70,5 cm.", "sku": "FP-skap-tva-tyglador-rustik", "variantId": "bf8bab3b-c99c-4b85-8ee0-89dae3a993a1", "textHash": "17310cc3a75ce7b4", "textTecken": 2064, "mediaSumma": 615306947, "mediaTecken": 534, "kat": ["Hem & Inredning", "Förvaring & Organisering"]},
    {"kort": "80558327", "pid": "80558327-0d74-4b04-b720-a79686326646", "namn": "Duschpall i bambu med hylla – bär 100 kg, 47,5 × 26 × 44,5 cm", "slug": "duschpall-bambu-med-hylla", "seoTitel": "Duschpall i bambu med hylla | Fyndplats", "seoBesk": "Pall i bambu för badrummet med ribbad sits och ett hyllplan för tvål och handdukar. Bär 100 kg, 47,5 × 26 × 44,5 cm.", "sku": "FP-duschpall-bambu-hylla", "variantId": "0b12e5c2-9765-4482-bb57-ca29e28d1098", "textHash": "fb097847e15401db", "textTecken": 1862, "mediaSumma": 538169256, "mediaTecken": 455, "kat": ["Hem & Inredning", "Badrum & Hemtextil"]},
    {"kort": "b99bb9cc", "pid": "b99bb9cc-c99d-4100-84ce-5e2594ceb839", "namn": "Bokhylla på hjul med tre plan – vit metall, låsbara hjul, 69 × 26 × 108 cm", "slug": "bokhylla-pa-hjul-tre-plan-vit", "seoTitel": "Bokhylla på hjul med tre plan | Fyndplats", "seoBesk": "Smal bokhylla i vit metall med tre plan på fyra svängbara hjul, två låsbara. Bär 15 kg totalt, 69 × 26 × 108 cm. Kan användas som rullvagn.", "sku": "FP-bokhylla-hjul-tre-plan-vit", "variantId": "62819d7d-2d2f-4108-9df1-28b4450e1850", "textHash": "79371597d7ead89a", "textTecken": 1825, "mediaSumma": 700998665, "mediaTecken": 531, "kat": ["Hem & Inredning", "Förvaring & Organisering"]},
    {"kort": "be52938b", "pid": "be52938b-94bf-4eea-b33c-f861a929c8f3", "namn": "Lekmatta 196 × 176 cm, dubbelsidig och vikbar – 1,5 cm tjockt skum", "slug": "lekmatta-196x176-dubbelsidig", "seoTitel": "Lekmatta 196 × 176 cm, vikbar | Fyndplats", "seoBesk": "Dubbelsidig lekmatta på 196 × 176 cm i 1,5 cm tjockt XPE-skum med vattentät yta och halkfri struktur. Går att vika ihop.", "sku": "FP-lekmatta-196x176-dubbelsidig", "variantId": "1d3e8fee-75e5-466b-b803-1f82565fdd21", "textHash": "be482280f3ffb99d", "textTecken": 1754, "mediaSumma": 222326334, "mediaTecken": 437, "kat": ["Barn & Familj", "Baby & Småbarn"]},
    {"kort": "30fe3828", "pid": "30fe3828-a510-4f3e-b32d-6874a4ce81bd", "namn": "Sidobord med laddstation – eluttag, USB och USB-C, två tyglådor, 63 cm högt", "slug": "sidobord-laddstation-tva-tyglador", "seoTitel": "Sidobord med laddstation | Fyndplats", "seoBesk": "Smalt sidobord med laddstation med eluttag, USB och USB-C, två tyglådor och ett öppet fack. Svart stålram, 20 × 40 × 63 cm.", "sku": "FP-sidobord-laddstation-tyglador", "variantId": "09bdc7ca-9bf9-4b76-9122-ac680af9c789", "textHash": "6379e3dab3b9913e", "textTecken": 2119, "mediaSumma": 963059875, "mediaTecken": 531, "kat": ["Hem & Inredning", "Förvaring & Organisering"]},
    {"kort": "33cf9b15", "pid": "33cf9b15-0375-416c-8bd5-4fb4392bf15f", "namn": "Snöskyffel 45 cm med extra handtag – D-grepp, metallkant och aluminiumskaft", "slug": "snoskyffel-45-cm-extra-handtag", "seoTitel": "Snöskyffel 45 cm med extra handtag | Fyndplats", "seoBesk": "Snöskyffel med 45 cm bred skopa med metallkant, extra handtag och dubbla D-grepp. Lätt skaft av aluminium, för lätt snö.", "sku": "FP-snoskyffel-45-extra-handtag", "variantId": "d4b73734-e81f-40f9-9ae6-42120512cf4c", "textHash": "8b0942ded1009996", "textTecken": 1962, "mediaSumma": 129145121, "mediaTecken": 517, "kat": ["Hem & Inredning", "Verktyg & Hemmafix"]},
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
