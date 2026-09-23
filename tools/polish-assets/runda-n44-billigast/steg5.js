async function () {
  // Genererad av runda N44:s bygg-steg.py ur ids, namn, seo, slugs, sku, kategori, vantat-hash och media-hash — aldrig skriven av.
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
    {"kort": "cf92c3bd", "pid": "cf92c3bd-a793-4728-884f-c65c7db5590a", "namn": "Konstgjord dieffenbachia 95 cm – gulrandiga blad och kruka med cement", "slug": "konstgjord-dieffenbachia-95-cm-cementkruka", "seoTitel": "Konstgjord dieffenbachia 95 cm med kruka | Fyndplats", "seoBesk": "Konstgjord dieffenbachia på 95 cm med gulrandiga blad och grenar som går att böja. Kruka med cement ingår – för inomhus och utomhus.", "sku": "FP-konstvaxt-dieffenbachia-95", "variantId": "4ebc0034-4217-4cd7-b1f8-5e065993949a", "textHash": "8df74eabb0060676", "textTecken": 2147, "mediaSumma": 172865826, "mediaTecken": 519, "kat": ["Hem & Inredning", "Dekoration & Prydnad"]},
    {"kort": "e36dab73", "pid": "e36dab73-19e8-4136-9dcf-7b4df9d7cc0e", "namn": "Julgran 150 cm med 294 grenspetsar – Ø46 cm och fot som fälls ihop", "slug": "julgran-150-cm-294-grenspetsar", "seoTitel": "Julgran 150 cm med 294 grenspetsar | Fyndplats", "seoBesk": "Konstgjord julgran på 150 cm, 46 cm i diameter, med 294 grenspetsar och en fot som går att ta av och fälla ihop. Pynt ingår inte.", "sku": "FP-julgran-150-294-spetsar", "variantId": "c67e7899-2992-4cdb-911a-8505b10ed658", "textHash": "de14abcaba60d7e3", "textTecken": 1905, "mediaSumma": 750466444, "mediaTecken": 526, "kat": ["Hem & Inredning", "Dekoration & Prydnad"]},
    {"kort": "a7e88a1b", "pid": "a7e88a1b-c751-4d26-945a-71be8dd7d7f5", "namn": "Ergonomisk sittdyna i memoryskum – urtag för svanskotan, 44 × 39 × 13 cm", "slug": "ergonomisk-sittdyna-memoryskum-svanskota", "seoTitel": "Ergonomisk sittdyna i memoryskum | Fyndplats", "seoBesk": "Ergonomisk sittdyna i memoryskum med urtag för svanskotan, luftigt överdrag i mesh och halkfri undersida. 44 × 39 × 13 cm.", "sku": "FP-sittdyna-ergonomisk-memoryskum", "variantId": "b972db30-952b-4b53-8f3e-ba0b5ed4eb87", "textHash": "e0a743898fa75214", "textTecken": 2034, "mediaSumma": 893473018, "mediaTecken": 408, "kat": ["Skönhet & Hälsa", "Kropp & Välbefinnande"]},
    {"kort": "b5b3b852", "pid": "b5b3b852-94da-4b85-a08d-1b122fdf8227", "namn": "Elektronisk darttavla för 1–8 spelare – LCD-display, 18 spel och sex pilar", "slug": "elektronisk-darttavla-lcd-18-spel", "seoTitel": "Elektronisk darttavla för 1–8 spelare | Fyndplats", "seoBesk": "Elektronisk darttavla med LCD-display, 18 spel i 159 varianter och röstmeddelanden på engelska. Sex pilar och 24 extra mjuka spetsar ingår.", "sku": "FP-darttavla-elektronisk-lcd", "variantId": "0fe0c86b-41a5-4f81-b391-c46c7700d335", "textHash": "c7ec46a64e442122", "textTecken": 2185, "mediaSumma": 604927592, "mediaTecken": 315, "kat": ["Sport & Fritid"]},
    {"kort": "e90dcc5a", "pid": "e90dcc5a-2d4d-4389-b455-979da533367f", "namn": "Balansstenar för barn i TPR, sex stycken – tre storlekar, 3–8 år", "slug": "balansstenar-barn-tpr-sex-stycken", "seoTitel": "Balansstenar i TPR för barn 3–8 år | Fyndplats", "seoBesk": "Sex balansstenar i tre storlekar med strukturerad yta och halkfri kant. För barn mellan 3 och 8 år, inomhus och utomhus – bär upp till 80 kg.", "sku": "FP-balansstenar-tpr-sex", "variantId": "a42f712a-2bcf-4f30-8487-114f49006dc5", "textHash": "037d443857f8a2b3", "textTecken": 2002, "mediaSumma": 700173156, "mediaTecken": 484, "kat": ["Barn & Familj", "Leksaker & Spel"]},
    {"kort": "0dfaa38b", "pid": "0dfaa38b-6792-4598-8dca-c6c71d1578b7", "namn": "Låsbart medicinskåp i rostfritt stål – tre plan och glasdörr, 25 × 12 × 48 cm", "slug": "lasbart-medicinskap-rostfritt-25-cm", "seoTitel": "Medicinskåp 25 × 48 cm med tre plan | Fyndplats", "seoBesk": "Låsbart medicinskåp i rostfritt stål med frostad glasdörr, tre plan på 14 cm och två nycklar. 25 × 12 × 48 cm och klarar badrummet.", "sku": "FP-medicinskap-rostfritt-25x48", "variantId": "e7f87e3f-c2d5-4435-8277-06ea76c7245d", "textHash": "1c2a2c83b63ce161", "textTecken": 2029, "mediaSumma": 109859821, "mediaTecken": 502, "kat": ["Hem & Inredning", "Badrum & Hemtextil"]},
    {"kort": "10cd6afb", "pid": "10cd6afb-34b0-40dc-9c9b-4f7dc510fa58", "namn": "Smalt konsolbord 75 cm i marmorlook – vit stomme, 24 cm djupt, justerbara fötter", "slug": "smalt-konsolbord-75-cm-marmorlook-vit", "seoTitel": "Smalt konsolbord 75 cm i marmorlook | Fyndplats", "seoBesk": "Smalt konsolbord med skiva i marmorlook och vit stomme av metall. 75 × 24 × 76 cm, justerbara fötter och tippskydd – för hall och vardagsrum.", "sku": "FP-konsolbord-75-marmorlook-vit", "variantId": "623c727e-dc05-4fe3-9d49-56fe11625881", "textHash": "ab0e2c9119ecb485", "textTecken": 1851, "mediaSumma": 713056846, "mediaTecken": 537, "kat": ["Hem & Inredning", "Förvaring & Organisering"]},
    {"kort": "00d6f785", "pid": "00d6f785-c15c-4315-afaa-269c53b42fd7", "namn": "LED-björk 150 cm med 120 varmvita lampor – tre ljusstyrkor och IP44", "slug": "led-bjork-150-cm-120-varmvita-lampor", "seoTitel": "LED-björk 150 cm med 120 varmvita lampor | Fyndplats", "seoBesk": "Vit LED-björk på 150 cm med 120 varmvita lampor i tre ljusstyrkor, IP44 och 5 m sladd. För inomhus och utomhus under tak – markankare ingår.", "sku": "FP-led-bjork-150-120-varmvit", "variantId": "8130ed47-156e-4ed4-bd76-b8ad402887a4", "textHash": "e80d7a2b2a5f7e09", "textTecken": 1995, "mediaSumma": 993806717, "mediaTecken": 483, "kat": ["Hem & Inredning", "Belysning", "Dekoration & Prydnad"]},
    {"kort": "0feec456", "pid": "0feec456-5102-4095-990c-b8e2da80727c", "namn": "Tipitält för katt och liten hund – tvättbar dyna, fjäderleksak, 60 × 60 × 76 cm", "slug": "tipitalt-katt-liten-hund-tvattbar-dyna", "seoTitel": "Tipitält för katt och liten hund | Fyndplats", "seoBesk": "Tipitält för katter upp till 5 kg och små hundar, med tvättbar dyna, halkfri bottenmatta och fjäderleksak. 60 × 60 × 76 cm med stänger av furu.", "sku": "FP-tipitalt-katt-hund", "variantId": "a5b457fe-c8fd-4225-b5ee-86546061b471", "textHash": "aa70722f42415a47", "textTecken": 2093, "mediaSumma": 428626290, "mediaTecken": 423, "kat": ["Husdjur", "Burar, Kläder & Tillbehör"]},
    {"kort": "1476f00c", "pid": "1476f00c-8e41-4fef-af8f-ea10972f1002", "namn": "Leksakshylla med sex tygboxar – grön, 63 × 30 × 66 cm, för barn 3–8 år", "slug": "leksakshylla-sex-tygboxar-gron", "seoTitel": "Leksakshylla med sex tygboxar, grön | Fyndplats", "seoBesk": "Grön leksakshylla för barn mellan 3 och 8 år, med sex tygboxar i tre storlekar. 63 × 30 × 66 cm med stomme av MDF och stål.", "sku": "FP-leksakshylla-sex-tygboxar-gron", "variantId": "75fae4bb-e92c-4852-8c7a-8d9e22ecab06", "textHash": "dd5665fc707a4672", "textTecken": 1970, "mediaSumma": 873255041, "mediaTecken": 525, "kat": ["Barn & Familj", "Hem & Inredning", "Förvaring & Organisering"]},
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
