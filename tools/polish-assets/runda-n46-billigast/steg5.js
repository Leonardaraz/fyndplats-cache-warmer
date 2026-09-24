async function () {
  // Genererad av runda N46:s bygg-steg.py ur ids, namn, seo, slugs, sku, kategori, vantat-hash och media-hash — aldrig skriven av.
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
    {"kort": "2fc13340", "pid": "2fc13340-bd10-406e-9c6b-57c90bffe7de", "namn": "Luftmadrass för två, 203 × 152 cm – 22 cm hög, handpump och två kuddar", "slug": "luftmadrass-for-tva-203x152-handpump", "seoTitel": "Luftmadrass för två, 203 × 152 cm | Fyndplats", "seoBesk": "Luftmadrass för två på 203 × 152 cm och 22 cm höjd, med handpump och två kuddar. Bär 200 kg och viks ihop i en förvaringsväska.", "sku": "FP-luftmadrass-tva-203x152", "variantId": "5714695e-1809-4fe9-a84b-1398c2bff07e", "textHash": "eac03735e3ca3f38", "textTecken": 2013, "mediaSumma": 867721126, "mediaTecken": 495, "kat": ["Sport & Fritid", "Friluftsliv & Resa"]},
    {"kort": "308cabee", "pid": "308cabee-0aeb-4ad7-b685-405a672eadfd", "namn": "Konstgjord palm 100 cm med 27 blad – fem stammar och kruka med cement", "slug": "konstgjord-palm-100-cm-27-blad", "seoTitel": "Konstgjord palm 100 cm med kruka | Fyndplats", "seoBesk": "Konstgjord palm på 100 cm med 27 blad, fem stammar och böjbara grenar, i en kruka med cementfyllning. Kan stå inne eller ute och behöver inget vatten.", "sku": "FP-konstpalm-100-27-blad", "variantId": "9ecf1156-002c-4b94-b34b-d3e7892c2df6", "textHash": "0f84dcfc526c9ae6", "textTecken": 2063, "mediaSumma": 184320480, "mediaTecken": 494, "kat": ["Hem & Inredning", "Dekoration & Prydnad"]},
    {"kort": "423edb5d", "pid": "423edb5d-c816-49f0-9d19-8f788ef65d23", "namn": "Bokhylla för barn med fyra hyllor – vit med ribbor i furu, 60 × 10 × 98 cm", "slug": "bokhylla-for-barn-fyra-hyllor-vit", "seoTitel": "Bokhylla för barn med fyra hyllor | Fyndplats", "seoBesk": "Smal bokhylla för barn med fyra hyllor där omslagen syns. Vit MDF med ribbor i furu och vågformade sidor, 60 × 10 × 98 cm, med tippskydd.", "sku": "FP-barnbokhylla-fyra-hyllor-vit", "variantId": "43362a12-456c-4099-bea8-68e220b18401", "textHash": "052cc8163417f2fa", "textTecken": 2080, "mediaSumma": 39154600, "mediaTecken": 522, "kat": ["Barn & Familj", "Hem & Inredning", "Förvaring & Organisering"]},
    {"kort": "4dc2759a", "pid": "4dc2759a-9220-4c3c-a89c-30e53112c502", "namn": "Upphöjd husdjurssäng i grå plysch – rundad rygg och ben i furu, Ø40,5 cm", "slug": "upphojd-husdjurssang-gra-plysch", "seoTitel": "Upphöjd husdjurssäng i grå plysch | Fyndplats", "seoBesk": "Upphöjd säng för katt eller liten hund i grå plysch, med rundad rygg, tvättbar dyna och ben i furu. Ø40,5 × 33 cm, för katter upp till 5 kg.", "sku": "FP-husdjurssang-upphojd-gra", "variantId": "56ed40fe-7510-4103-81b3-a318c61f5c2f", "textHash": "422dea5b87da273f", "textTecken": 2141, "mediaSumma": 60869473, "mediaTecken": 516, "kat": ["Husdjur", "Burar, Kläder & Tillbehör"]},
    {"kort": "61917e9a", "pid": "61917e9a-2313-47aa-9d23-bdd49cece265", "namn": "Sidobord i svart stål med hylla – industristil, 40 × 40 × 45 cm", "slug": "sidobord-svart-stal-hylla-40-cm", "seoTitel": "Sidobord i svart stål med hylla | Fyndplats", "seoBesk": "Sidobord i industristil i pulverlackerat stål, med skiva och en hylla. 40 × 40 × 45 cm, bär 20 kg. Passar bredvid soffan eller som sängbord.", "sku": "FP-sidobord-svart-stal-hylla", "variantId": "38aa56f6-c839-4d85-b4dd-29d1f52c2cca", "textHash": "d118f04de9a66d14", "textTecken": 2044, "mediaSumma": 23994590, "mediaTecken": 550, "kat": ["Hem & Inredning", "Förvaring & Organisering"]},
    {"kort": "6690086e", "pid": "6690086e-9276-43f6-887a-42add3ff880b", "namn": "Hopfällbar skohylla i bambu med fyra plan – 12 par, 60 × 29 × 67 cm", "slug": "hopfallbar-skohylla-bambu-fyra-plan", "seoTitel": "Hopfällbar skohylla i bambu, fyra plan | Fyndplats", "seoBesk": "Skohylla i bambu med fyra plan för upp till 12 par skor, upp till storlek 44. Fälls ut och är klar direkt, utan montering. 60 × 29 × 67 cm.", "sku": "FP-skohylla-bambu-fyra-plan", "variantId": "dc501abe-3d16-4368-81d7-df914d56c456", "textHash": "f4b0700ef5720d44", "textTecken": 1974, "mediaSumma": 601218419, "mediaTecken": 547, "kat": ["Hem & Inredning", "Förvaring & Organisering"]},
    {"kort": "7ba0423b", "pid": "7ba0423b-ec29-4e31-a0f3-1407e1f18364", "namn": "Blomsterhylla i trä med sex plan – karboniserad gran, 95 × 28 × 96,5 cm", "slug": "blomsterhylla-tra-sex-plan-96-cm", "seoTitel": "Blomsterhylla i trä med sex plan | Fyndplats", "seoBesk": "Blomsterhylla i karboniserat granträ med sex plan i olika höjder för krukväxter. 95 × 28 × 96,5 cm, för inomhus och utomhus. Montering krävs.", "sku": "FP-blomsterhylla-tra-sex-plan", "variantId": "ea91243a-fa7c-4b6e-a5c1-4c0632631a3c", "textHash": "3df2f21a5ad8ddb8", "textTecken": 2060, "mediaSumma": 758701444, "mediaTecken": 512, "kat": ["Hem & Inredning", "Trädgård & Utemöbler", "Växthus & Odling"]},
    {"kort": "80de1b65", "pid": "80de1b65-144d-4be1-be23-1fe5546c672e", "namn": "Konstgjorda lavendelträd 60 cm, två stycken – kulformade kronor och kruka", "slug": "konstgjorda-lavendeltrad-60-cm-tva", "seoTitel": "Två konstgjorda lavendelträd 60 cm | Fyndplats", "seoBesk": "Två konstgjorda lavendelträd på 60 cm med kulformad krona, 405 blad och 25 lavendelblommor var. UV-beständiga, i kruka med cementfyllning.", "sku": "FP-lavendeltrad-60-tva", "variantId": "c952e4dc-3ec4-4037-bdad-9923cf4c89ec", "textHash": "257abef318b4bd0e", "textTecken": 2054, "mediaSumma": 618538942, "mediaTecken": 549, "kat": ["Hem & Inredning", "Dekoration & Prydnad"]},
    {"kort": "8aab4f48", "pid": "8aab4f48-6761-4663-9e6a-46fc25d91925", "namn": "Badrumsskåp i bambu – öppen hylla och skåp med lamelldörr, 33 × 36,5 × 67 cm", "slug": "badrumsskap-bambu-oppen-hylla-67-cm", "seoTitel": "Badrumsskåp i bambu med öppen hylla | Fyndplats", "seoBesk": "Litet badrumsskåp i lackad bambu med öppen hylla och skåp med lamelldörr. 33 × 36,5 × 67 cm, med tippskydd och upphöjd botten.", "sku": "FP-badrumsskap-bambu-67", "variantId": "d90667fb-fe4b-4c4d-9830-427120ab13f3", "textHash": "d6d89b7a59406628", "textTecken": 2048, "mediaSumma": 704936391, "mediaTecken": 548, "kat": ["Hem & Inredning", "Badrum & Hemtextil", "Förvaring & Organisering"]},
    {"kort": "97cf9327", "pid": "97cf9327-56b9-4ce2-bb32-f8a6d7c182d9", "namn": "Uppblåsbar snögubbe 180 cm med LED – polkagriskäpp och julklapp, IP44", "slug": "uppblasbar-snogubbe-180-cm-led", "seoTitel": "Uppblåsbar snögubbe 180 cm med LED | Fyndplats", "seoBesk": "Uppblåsbar snögubbe på 180 cm med polkagriskäpp och julklapp, som lyser inifrån med LED. IP44, för trädgården. Fläkt och förankring ingår.", "sku": "FP-snogubbe-uppblasbar-180", "variantId": "87e3a8fd-3a66-4c8d-816c-081dd3d0ed4c", "textHash": "a845bf4ed913f925", "textTecken": 2196, "mediaSumma": 276762694, "mediaTecken": 449, "kat": ["Hem & Inredning", "Dekoration & Prydnad", "Trädgård & Utemöbler", "Trädgårdsdekor & Belysning"]},
    {"kort": "9c3b6e2f", "pid": "9c3b6e2f-e7af-42a5-b768-387ab99c05cb", "namn": "Konstgjort rosenträd 90 cm med rosa rosor – flätad stam och kruka med cement", "slug": "konstgjort-rosentrad-rosa-90-cm", "seoTitel": "Konstgjort rosenträd 90 cm, rosa | Fyndplats", "seoBesk": "Konstgjort rosenträd på 90 cm med rosa rosor och flätad stam, i en vit kruka med cementfyllning och konstmossa. Behöver ingen skötsel.", "sku": "FP-rosentrad-rosa-90", "variantId": "51569aa7-f1ee-4c5f-8fc1-8b820c665538", "textHash": "f8aab606b3dd5fde", "textTecken": 1686, "mediaSumma": 692490157, "mediaTecken": 415, "kat": ["Hem & Inredning", "Dekoration & Prydnad"]},
    {"kort": "af994f2d", "pid": "af994f2d-da41-4aff-adac-e17d052c04a9", "namn": "Barstol med gaslyft, sitthöjd 55–76 cm – svart sits, vridbar 360°", "slug": "barstol-gaslyft-svart-silver", "seoTitel": "Barstol med gaslyft, svart | Fyndplats", "seoBesk": "Vridbar barstol med gaslyft och sitthöjd 55–76 cm, svart sits i PVC och silverfärgad fot i stål. Fotstöd, låg rygg, bär 120 kg.", "sku": "FP-barstol-gaslyft-svart", "variantId": "f7fa6b1a-eae6-4b68-a9ac-c46d096cd98b", "textHash": "7aab07e029a7fb8e", "textTecken": 1913, "mediaSumma": 166654069, "mediaTecken": 591, "kat": ["Hem & Inredning"]},
    {"kort": "b73863ff", "pid": "b73863ff-e852-49d6-9dcc-757415d25f2f", "namn": "Vinställ för väggen, sex flaskor – svart stålrör, 27 × 10 × 71 cm", "slug": "vinstall-vagg-sex-flaskor-svart", "seoTitel": "Vinställ för väggen, sex flaskor | Fyndplats", "seoBesk": "Vinställ i svart pulverlackerat stålrör för sex flaskor, som monteras på väggen. Flaskorna ligger ner så att korken hålls fuktig. 27 × 10 × 71 cm.", "sku": "FP-vinstall-vagg-sex-flaskor", "variantId": "fa126ea1-80f6-444b-abbe-03d992f4b455", "textHash": "bb08f41bb297863d", "textTecken": 1814, "mediaSumma": 330895646, "mediaTecken": 532, "kat": ["Hem & Inredning", "Förvaring & Organisering", "Kök & Husgeråd"]},
    {"kort": "b8d8a982", "pid": "b8d8a982-2c2c-4fe0-b527-f90bbdabfbfe", "namn": "Elektronisk darttavla i skåp – 31 spel, 285 varianter, upp till 8 spelare", "slug": "elektronisk-darttavla-skap-31-spel", "seoTitel": "Elektronisk darttavla i skåp, 31 spel | Fyndplats", "seoBesk": "Elektronisk darttavla med dörrar som skyddar väggen och förvarar pilarna. 31 spel och 285 varianter, LCD och röstutrop, för upp till 8 spelare.", "sku": "FP-darttavla-skap-31-spel", "variantId": "8ba0ecf6-c8e0-40c2-ac40-c496fa4e7c0b", "textHash": "f4388f3877a2cbb4", "textTecken": 2115, "mediaSumma": 214744534, "mediaTecken": 549, "kat": ["Sport & Fritid"]},
    {"kort": "cc18bc6f", "pid": "cc18bc6f-957e-4134-8346-fa664415ffda", "namn": "Konstgjord bananväxt 150 cm med 18 blad – i kruka med cement", "slug": "konstgjord-bananvaxt-150-cm-18-blad", "seoTitel": "Konstgjord bananväxt 150 cm | Fyndplats", "seoBesk": "Konstgjord bananväxt på 150 cm med 18 stora blad, i en svart kruka med cement och konstmossa. Ger rummet tropisk grönska utan vatten eller skötsel.", "sku": "FP-bananvaxt-150-18-blad", "variantId": "19f5aa4d-6ac1-49d2-a370-dd6c6e9784da", "textHash": "23d25e8f5b283de8", "textTecken": 1773, "mediaSumma": 672308922, "mediaTecken": 503, "kat": ["Hem & Inredning", "Dekoration & Prydnad"]},
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
