async function () {
  // Genererad av runda N42:s bygg-steg.py ur ids, namn, seo, slugs, sku, kategori, vantat-hash och media-hash — aldrig skriven av.
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
    {"kort": "2cfd222e", "pid": "2cfd222e-ab50-4a1c-a020-b9f749a27a5b", "namn": "Konstgjord växt 95 cm med 33 blad – kruka med cementbotten, inne och ute", "slug": "konstgjord-vaxt-95-cm-33-blad", "seoTitel": "Konstgjord växt 95 cm med 33 blad | Fyndplats", "seoBesk": "Konstgjord växt på 95 cm med 33 gröna blad i en kruka med cementbotten och mossa. För inomhus eller utomhus. Behöver aldrig vattnas.", "sku": "FP-konstvaxt-95-33-blad", "variantId": "ba7d99c5-ebea-4fa6-839e-e85c1b796828", "textHash": "2b06a672f4999c79", "textTecken": 2318, "mediaSumma": 107244733, "mediaTecken": 553, "kat": ["Hem & Inredning", "Dekoration & Prydnad"]},
    {"kort": "3e2c7389", "pid": "3e2c7389-93ae-4f21-a556-f7186ff0cdb9", "namn": "Skobänk i bambu med två hyllplan – 70 cm bred, sittyta som bär 130 kg", "slug": "skobank-bambu-70-cm-tva-hyllplan", "seoTitel": "Skobänk i bambu, 70 cm, två hyllplan | Fyndplats", "seoBesk": "Skobänk i naturfärgad bambu med två hyllplan för sex par skor och en sittyta som bär 130 kg. 70 × 28 × 45 cm, för skor upp till storlek 46.", "sku": "FP-skobank-bambu-70-tva-plan", "variantId": "8c58d409-931a-4936-9b19-67e90d538888", "textHash": "40d1616f6043d806", "textTecken": 2152, "mediaSumma": 824318185, "mediaTecken": 577, "kat": ["Hem & Inredning", "Förvaring & Organisering"]},
    {"kort": "5c5aedca", "pid": "5c5aedca-4952-4ead-b2eb-716d2be7d125", "namn": "Vit julgran 150 cm med pynt – kulor, klockor, trummor, klappar och kottar", "slug": "vit-julgran-150-cm-med-pynt", "seoTitel": "Vit julgran 150 cm med pynt | Fyndplats", "seoBesk": "Vit konstgjord julgran, 150 cm hög och Ø85 cm, med metallfot och pynt: 18 kulor, 6 klockor, 6 trummor, 6 klappar och 12 kottar. För inomhusbruk.", "sku": "FP-julgran-vit-150-med-pynt", "variantId": "8347994e-2ad0-4d5c-9126-cf33e39b6906", "textHash": "47b98f6b786e803a", "textTecken": 2212, "mediaSumma": 797271676, "mediaTecken": 565, "kat": ["Hem & Inredning", "Dekoration & Prydnad"]},
    {"kort": "7f21945e", "pid": "7f21945e-3b7b-4700-a943-6558ebe7de08", "namn": "Förvaringskorgar med lock, tre storlekar – grå flätad plast, 18, 12 och 7 liter", "slug": "forvaringskorgar-lock-tre-storlekar-gra", "seoTitel": "Tre förvaringskorgar med lock i grått | Fyndplats", "seoBesk": "Tre förvaringskorgar i grå flätad plast med lock och spänne: 18, 12 och 7 liter. Bär 5 kg vardera och kräver ingen montering.", "sku": "FP-forvaringskorgar-lock-3-gra", "variantId": "390c029a-f31b-4766-8af7-41a97d6a502d", "textHash": "59449168e6ced2af", "textTecken": 2174, "mediaSumma": 977555209, "mediaTecken": 486, "kat": ["Hem & Inredning", "Förvaring & Organisering"]},
    {"kort": "985ff6d3", "pid": "985ff6d3-41a8-4214-8b90-b990a2880bd8", "namn": "Brödrost för två skivor med sju rostlägen – värmegaller och upptining, svart", "slug": "brodrost-tva-skivor-sju-rostlagen", "seoTitel": "Brödrost för två skivor, sju rostlägen | Fyndplats", "seoBesk": "Brödrost för två skivor med sju rostlägen, upptining, uppvärmning och avbryt. Värmegaller för croissanter och utdragbar smulbricka. 780–930 W.", "sku": "FP-brodrost-2-skivor-7-lagen", "variantId": "beeca1a5-ed60-49a5-9d37-0e6f926a4120", "textHash": "48b81f79cb576878", "textTecken": 2363, "mediaSumma": 894894955, "mediaTecken": 601, "kat": ["Kök & Husgeråd", "Köksmaskiner & Apparater"]},
    {"kort": "988ac121", "pid": "988ac121-4920-4ec1-8c14-5e8f525bc8bb", "namn": "Brasskärm i tre delar – svart metall med rutmönster, 100 × 51 cm, fällbar", "slug": "brasskarm-tre-delar-svart-metall", "seoTitel": "Brasskärm i tre delar, svart metall | Fyndplats", "seoBesk": "Brasskärm i tre delar av svart pulverlackerad metall med rutmönster. 100 × 51 cm uppställd, fälls ihop till 58 × 2 × 51 cm. Ingen montering.", "sku": "FP-brasskarm-3-delar-svart", "variantId": "5f3d22b5-4fe8-452d-970d-a8799636e917", "textHash": "3ffb1bd647140c5a", "textTecken": 2192, "mediaSumma": 106866976, "mediaTecken": 428, "kat": ["Hem & Inredning"]},
    {"kort": "b138effc", "pid": "b138effc-0e30-4c25-9bea-36aae4b04545", "namn": "Trimningsarm för hund med bordsklämma – höjdjusterbar, för hundar upp till 20 kg", "slug": "trimningsarm-hund-bordsklamma", "seoTitel": "Trimningsarm för hund med bordsklämma | Fyndplats", "seoBesk": "Höjdjusterbar trimningsarm i rostfritt stål för trimbord upp till 2,7 cm tjocka. Ögla och två magslingor. För hundar upp till 20 kg.", "sku": "FP-trimningsarm-hund-klamma", "variantId": "001fd945-d07c-4615-baa4-3ec11608f516", "textHash": "1e8e5aaa8b9a4e45", "textTecken": 2466, "mediaSumma": 363094672, "mediaTecken": 385, "kat": ["Husdjur", "Pälsvård & Skötsel"]},
    {"kort": "cfb722e4", "pid": "cfb722e4-b588-4fd8-b609-56c5fd15d26e", "namn": "Smal rullvagn med fem plan – 47 × 13 × 96,5 cm, nätkorgar och skiva i trälook", "slug": "smal-rullvagn-fem-plan-13-cm", "seoTitel": "Smal rullvagn med fem plan och fyra korgar | Fyndplats", "seoBesk": "Smal rullvagn på 47 × 13 × 96,5 cm med fyra nätkorgar och en skiva i trälook. Hjul som svänger 360° och broms på två hjul.", "sku": "FP-rullvagn-smal-5-plan", "variantId": "15a98007-b1d9-4cf0-8cc8-aef4c0e71e5c", "textHash": "e54a86fc8b636e15", "textTecken": 2370, "mediaSumma": 69591030, "mediaTecken": 686, "kat": ["Hem & Inredning", "Förvaring & Organisering", "Kök & Husgeråd"]},
    {"kort": "dcf149d1", "pid": "dcf149d1-bc0f-43f7-a8e1-82df588a3a78", "namn": "Pall för barn med tre steg och handtag – ställs om till två steg, 2–5 år", "slug": "pall-for-barn-tre-steg-handtag", "seoTitel": "Pall för barn med tre steg och handtag | Fyndplats", "seoBesk": "Pall för barn 2–5 år med tre steg som kan ställas om till två, handtag och halkfria steg. Bär 30 kg. För kök, badrum eller bredvid sängen.", "sku": "FP-pall-barn-3-steg-handtag", "variantId": "d0d420e4-183b-459f-b085-41d3a1178228", "textHash": "765549efffa0ba54", "textTecken": 2116, "mediaSumma": 182096548, "mediaTecken": 601, "kat": ["Barn & Familj", "Baby & Småbarn"]},
    {"kort": "fd940665", "pid": "fd940665-60f6-472c-922d-11d09cac17bb", "namn": "Sidobord med skåp i industristil – trälook och svart stål, 40 × 30 × 76 cm", "slug": "sidobord-med-skap-industristil", "seoTitel": "Sidobord med skåp i industristil | Fyndplats", "seoBesk": "Sidobord med skåp i trälook på svart stålstomme, 40 × 30 × 76 cm. Skåpet är 37 × 28,5 × 27 cm invändigt. Bär 25 kg, varav 10 kg i skåpet.", "sku": "FP-sidobord-skap-industri", "variantId": "2d289157-dcd0-4b7a-8ccb-15026e0d71e0", "textHash": "fb431af998e43991", "textTecken": 2125, "mediaSumma": 132992597, "mediaTecken": 524, "kat": ["Hem & Inredning", "Förvaring & Organisering"]},
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
