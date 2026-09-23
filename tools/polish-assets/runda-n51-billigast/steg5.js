async function () {
  // Genererad av runda N51:s bygg-steg.py ur ids, namn, seo, slugs, sku, kategori, vantat-hash och media-hash — aldrig skriven av.
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
    {"kort": "279635e9", "pid": "279635e9-ff6b-4092-a4ee-d597b3dbab25", "namn": "Spökbrudgum till halloween, 189 cm – rörelsesensor, ylande ljud och röda ögon", "slug": "spokbrudgum-halloween-189-cm-rorelsesensor", "seoTitel": "Spökbrudgum till halloween, 189 cm | Fyndplats", "seoBesk": "Spökbrudgum till halloween, 189 cm, med rörelsesensor som startar ylande ljud och röda lysande ögon. För inomhus och ute under tak, batterier ingår.", "sku": "FP-spokbrudgum-halloween-189", "variantId": "e4c3b727-4ab0-443f-a4f0-6b63aa9131d8", "textHash": "d8495732948f142f", "textTecken": 2011, "mediaSumma": 178678973, "mediaTecken": 538, "kat": ["Hem & Inredning", "Kalas & Fest"]},
    {"kort": "3068a60b", "pid": "3068a60b-8cce-4dab-9ee0-56d350b473da", "namn": "Sittbänk med förvaring i beige sammetslook – guldfärgade ben, bär 120 kg", "slug": "sittbank-forvaring-beige-sammet-guldben", "seoTitel": "Sittbänk med förvaring i beige sammetslook | Fyndplats", "seoBesk": "Stoppad sittbänk i beige sammetslook med förvaring under sitsen och guldfärgade ben i stål. 79,5 × 37,5 × 43 cm, bär 120 kg.", "sku": "FP-sittbank-forvaring-beige", "variantId": "9d01fd4e-8745-4634-b109-e3866125b2ff", "textHash": "716a6189768cc84b", "textTecken": 2013, "mediaSumma": 280656216, "mediaTecken": 539, "kat": ["Hem & Inredning", "Förvaring & Organisering"]},
    {"kort": "3ae559f2", "pid": "3ae559f2-3ed2-4021-be74-738d9825102e", "namn": "Smalt badrumsskåp i vitt och trä – öppen hylla och mjukstängande dörr, 71,5 cm", "slug": "smalt-badrumsskap-vitt-oppen-hylla", "seoTitel": "Smalt badrumsskåp i vitt med öppen hylla | Fyndplats", "seoBesk": "Smalt badrumsskåp i vitt och trä, 30 × 30 × 71,5 cm, med öppen hylla, ställbar hylla och mjukstängande dörr. Bär 20 kg totalt.", "sku": "FP-badrumsskap-smalt-vitt", "variantId": "ebd296db-32a2-4521-977e-45c4b4a84b96", "textHash": "8fc5e390d408e2fc", "textTecken": 2056, "mediaSumma": 216695023, "mediaTecken": 576, "kat": ["Hem & Inredning", "Badrum & Hemtextil", "Förvaring & Organisering"]},
    {"kort": "5646de67", "pid": "5646de67-0a1e-4662-a591-25a3f070d799", "namn": "Pedaltränare med display – ställbart motstånd och fotremmar, för ben och armar", "slug": "pedaltranare-display-ben-armar", "seoTitel": "Pedaltränare med display och fotremmar | Fyndplats", "seoBesk": "Pedaltränare för ben och armar med steglöst motstånd, LCD-display och fotremmar. 40 × 39 × 29 cm, bär 60 kg.", "sku": "FP-pedaltranare-display", "variantId": "86e3d70e-f3af-45b2-bf47-fc901762c22a", "textHash": "290efe25087020d3", "textTecken": 1960, "mediaSumma": 627819004, "mediaTecken": 486, "kat": ["Sport & Fritid", "Träning & Gym"]},
    {"kort": "5a65a0ea", "pid": "5a65a0ea-b38d-4592-856b-a9249847e40f", "namn": "Rund pall med förvaring i gräddvit sherpa – 38 cm, bär 120 kg", "slug": "rund-pall-forvaring-sherpa-38-cm", "seoTitel": "Rund pall med förvaring i sherpa, 38 cm | Fyndplats", "seoBesk": "Rund pall i gräddvit sherpafleece med förvaring under locket, 38 × 38 × 45 cm. Bär 120 kg och levereras färdigmonterad.", "sku": "FP-rund-pall-sherpa-38", "variantId": "3ec8cb8c-51e2-404c-8cc1-b57c06e5a84d", "textHash": "ebef07470751ff95", "textTecken": 1838, "mediaSumma": 809772666, "mediaTecken": 492, "kat": ["Hem & Inredning", "Förvaring & Organisering"]},
    {"kort": "73457d36", "pid": "73457d36-b7f7-45ac-892a-c7342ee37f0d", "namn": "Blomställ i vitt med sju nivåer – stål och MDF, 94,5 cm, för inne och ute", "slug": "blomstall-sju-nivaer-vitt", "seoTitel": "Blomställ i vitt med sju nivåer | Fyndplats", "seoBesk": "Blomställ i vitt med sju nivåer i tre höjder, stål och MDF, 65 × 23 × 94,5 cm. För krukväxter inne och ute, med tippskydd.", "sku": "FP-blomstall-sju-nivaer", "variantId": "629ac63c-5937-4235-9be6-ebcc6c5c6447", "textHash": "fdd68a87e13f15d7", "textTecken": 1909, "mediaSumma": 234996834, "mediaTecken": 498, "kat": ["Hem & Inredning", "Trädgård & Utemöbler", "Växthus & Odling"]},
    {"kort": "7d09edd9", "pid": "7d09edd9-3cc2-45b2-98d9-76de8502f52c", "namn": "Vägghylla med fem kuber i vitlackat granträ – liggande eller stående, 86 cm", "slug": "vagghylla-fem-kuber-vitt-tra", "seoTitel": "Vägghylla med fem kuber i vitt trä | Fyndplats", "seoBesk": "Vägghylla i vitlackat massivt granträ med fem kuber, 49,5 × 10,2 × 86 cm. Sätts upp liggande eller stående och bär 10 kg.", "sku": "FP-vagghylla-kuber-vit", "variantId": "0dd422f8-f2cb-4899-aed7-3c5c3661e2a2", "textHash": "6c2c8bfab2424284", "textTecken": 1944, "mediaSumma": 999118832, "mediaTecken": 415, "kat": ["Hem & Inredning", "Förvaring & Organisering"]},
    {"kort": "90c066c0", "pid": "90c066c0-5d13-41a2-a3a7-8c847dc58ac2", "namn": "Datorbord i svart, 80 cm – utdragbar tangentbordshylla och fack för datorn", "slug": "datorbord-svart-tangentbordshylla-80-cm", "seoTitel": "Datorbord i svart med tangentbordshylla | Fyndplats", "seoBesk": "Kompakt datorbord i svart, 80 × 45 × 75 cm, med utdragbar tangentbordshylla, fack för datorn och två hyllplan. Bär 20 kg.", "sku": "FP-datorbord-svart-80", "variantId": "23c555fa-0bae-4e37-8880-329f46b59181", "textHash": "36d12ee8bb726d90", "textTecken": 1850, "mediaSumma": 665063236, "mediaTecken": 556, "kat": ["Hem & Inredning"]},
    {"kort": "9b3b4255", "pid": "9b3b4255-3ea1-43f4-ad50-3e77ede70f1e", "namn": "Pianobänk i svart konstläder med förvaring – för två personer, bär 200 kg", "slug": "pianobank-forvaring-svart-konstlader", "seoTitel": "Pianobänk i svart med förvaring | Fyndplats", "seoBesk": "Pianobänk i svart för två personer, med knappad sits i konstläder och förvaring för noter under sitsen. 76 × 36 × 50 cm, bär 200 kg.", "sku": "FP-pianobank-forvaring-svart", "variantId": "233d1ecb-5d3c-41c3-a639-842160f32d74", "textHash": "91d5a7a08abd15a4", "textTecken": 1831, "mediaSumma": 232597669, "mediaTecken": 472, "kat": ["Hem & Inredning"]},
    {"kort": "aab0a1e5", "pid": "aab0a1e5-8edb-43a8-acf4-4c04052d3183", "namn": "Uppblåsbar snögubbe 240 cm – roterande ljus i tre färger, för inne och ute", "slug": "uppblasbar-snogubbe-240-cm-roterande-ljus", "seoTitel": "Uppblåsbar snögubbe 240 cm med ljus | Fyndplats", "seoBesk": "Uppblåsbar snögubbe till jul, 240 cm, med roterande ljus i tre färger, markspett, linor och sandsäckar. IP44, för inne och ute.", "sku": "FP-snogubbe-uppblasbar-240", "variantId": "2627fd07-08c3-4772-85e8-8d31857732e3", "textHash": "b2ba7b7bd2050b63", "textTecken": 2246, "mediaSumma": 635149506, "mediaTecken": 429, "kat": ["Hem & Inredning", "Dekoration & Prydnad", "Trädgård & Utemöbler", "Trädgårdsdekor & Belysning"]},
    {"kort": "c7424c37", "pid": "c7424c37-16c3-40a1-a6c9-11d33c8aa595", "namn": "Barnstaffli 3-i-1 i grått – krittavla, whiteboard, pappersrulle och två lådor", "slug": "barnstaffli-3-i-1-pappersrulle-gra", "seoTitel": "Barnstaffli 3-i-1 med pappersrulle | Fyndplats", "seoBesk": "Barnstaffli 3-i-1 i grått med krittavla, whiteboard, pappersrulle och två förvaringslådor. 51 × 50 × 108 cm, för barn 3–8 år.", "sku": "FP-barnstaffli-pappersrulle", "variantId": "cb1a5d0f-57bc-4dea-86e2-6d16731883d8", "textHash": "ccd85f8baadaedca", "textTecken": 2074, "mediaSumma": 681881982, "mediaTecken": 538, "kat": ["Barn & Familj", "Leksaker & Spel"]},
    {"kort": "ce77f5c4", "pid": "ce77f5c4-7d85-4d24-80c4-bd670362ccc7", "namn": "Vägghylla i svart metall med nio fack – 87,5 × 100 cm, bär 30 kg", "slug": "vagghylla-svart-metall-nio-fack", "seoTitel": "Vägghylla i svart metall med nio fack | Fyndplats", "seoBesk": "Vägghylla i svart metall med nio fack, 87,5 × 18 × 100 cm. Bär 30 kg totalt, och alla fästen för väggmonteringen ingår.", "sku": "FP-vagghylla-metall-nio-fack", "variantId": "8d80198d-34d3-4d73-b9d2-53af9e07f2fb", "textHash": "9f3fd1dfb3f80e1e", "textTecken": 1812, "mediaSumma": 307523223, "mediaTecken": 487, "kat": ["Hem & Inredning", "Förvaring & Organisering"]},
    {"kort": "d227861d", "pid": "d227861d-bb87-4fb9-a19d-73dc40154ac8", "namn": "Fågelmatare i granträ på stativ, 130 cm – åttakantigt tak och öppen plattform", "slug": "fagelmatare-gran-stativ-130-cm", "seoTitel": "Fågelmatare i granträ på stativ | Fyndplats", "seoBesk": "Fågelmatare i granträ på stativ, Ø52 × 130 cm, med åttakantigt tak och plats för fröer, talg eller frukt.", "sku": "FP-fagelmatare-stativ", "variantId": "d6655595-07e3-40b2-996b-fa97e8701326", "textHash": "e5a023e9d34f2170", "textTecken": 1953, "mediaSumma": 887874191, "mediaTecken": 497, "kat": ["Trädgård & Utemöbler"]},
    {"kort": "db607b53", "pid": "db607b53-8780-4cfa-8795-3b03f7299edc", "namn": "Rutschkana för småbarn i raketdesign – 1,35 m rutschbana, för 1,5–3 år", "slug": "rutschkana-smabarn-raketdesign-bla", "seoTitel": "Rutschkana för småbarn i raketdesign | Fyndplats", "seoBesk": "Rutschkana för småbarn 1,5–3 år i raketdesign med klistermärken, halkfria steg och 1,35 m rutschbana. Bär 30 kg.", "sku": "FP-rutschkana-raket-bla", "variantId": "38a5bff3-4a8d-40a6-a7f0-69768e12f0b9", "textHash": "1509667b4130e7fb", "textTecken": 1896, "mediaSumma": 131056855, "mediaTecken": 524, "kat": ["Barn & Familj", "Baby & Småbarn", "Leksaker & Spel"]},
    {"kort": "7a70db2c", "pid": "7a70db2c-a5c4-4a80-9c23-d3f36b95bfa6", "namn": "Fotbollsbord 84,5 cm med 22 spelare – långa och korta ben för golv eller bord", "slug": "fotbollsbord-22-spelare-tva-benhojder", "seoTitel": "Fotbollsbord med 22 spelare, 84,5 cm | Fyndplats", "seoBesk": "Fotbollsbord med 22 spelare på stänger i rostfritt stål och två sorters ben, 84,5 × 40 × 61,2 cm. Bollar och poängräknare ingår.", "sku": "FP-fotbollsbord-22-spelare", "variantId": "22ad235b-796b-4fc4-83e4-c13d46b3a4bc", "textHash": "4993bd2dd6b23c44", "textTecken": 2063, "mediaSumma": 225132631, "mediaTecken": 394, "kat": ["Sport & Fritid"]},
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
