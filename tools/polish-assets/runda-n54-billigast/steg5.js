async function () {
  // Genererad av runda N54:s bygg-steg.py ur ids, namn, seo, slugs, sku, kategori, vantat-hash och media-hash — aldrig skriven av.
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
    {"kort": "f267fdc4", "pid": "f267fdc4-47a0-445b-8542-b776029f2371", "namn": "Vedställ 0,6 m³ med vattentätt överdrag – 200 cm långt, bär 200 kg", "slug": "vedstall-overdrag-200-cm-svart", "seoTitel": "Vedställ med vattentätt överdrag, 0,6 m³ | Fyndplats", "seoBesk": "Vedställ i svart metall för 0,6 m³ ved, 200 × 36 × 99 cm, med vattentätt överdrag. Botten ligger 19 cm över marken, och stället bär 200 kg.", "sku": "FP-vedstall-overdrag-200", "variantId": "4ad974bc-4be2-4fed-ae1c-e143d229e350", "textHash": "c50725b3fc09ed6f", "textTecken": 2072, "mediaSumma": 893710544, "mediaTecken": 626, "kat": ["Trädgård & Utemöbler", "Hem & Inredning", "Förvaring & Organisering"]},
    {"kort": "0773ceb6", "pid": "0773ceb6-0c35-4825-aaea-33c219e38d73", "namn": "Sensorsoptunna 50 liter i rostfritt stål – smal, med lock som stängs mjukt", "slug": "sensorsoptunna-50-liter-rostfritt-smal", "seoTitel": "Sensorsoptunna 50 liter i rostfritt stål | Fyndplats", "seoBesk": "Smal soptunna på 50 liter i rostfritt stål. Locket öppnas när du för handen över sensorn och stängs mjukt och tyst. 35,5 × 26 × 67 cm.", "sku": "FP-sensorsoptunna-50-rostfri", "variantId": "b935ea8a-a294-4a63-9c35-a4d1f2f330d8", "textHash": "c9eec2b968c72170", "textTecken": 2213, "mediaSumma": 468301065, "mediaTecken": 527, "kat": ["Kök & Husgeråd", "Hem & Inredning"]},
    {"kort": "0ad9c123", "pid": "0ad9c123-c9b4-4fd2-97eb-6013557a682e", "namn": "Golvspegel i vitt, 148 cm hög – helkroppsspegel med två lutningslägen", "slug": "golvspegel-148-cm-vit-lutning", "seoTitel": "Golvspegel i vitt, 148 cm, helkroppsspegel | Fyndplats", "seoBesk": "Fristående helkroppsspegel i vit MDF, 47 × 46 × 148 cm, som ställs i två lutningslägen. Glaset är 108 × 32 cm.", "sku": "FP-golvspegel-helkropp-vit", "variantId": "6eca57d6-480f-4dee-8837-52110eb395fe", "textHash": "2d21ea195c5b924f", "textTecken": 1934, "mediaSumma": 356866080, "mediaTecken": 535, "kat": ["Hem & Inredning", "Dekoration & Prydnad"]},
    {"kort": "1884a543", "pid": "1884a543-6c2e-49f1-981a-f2fdb206cbfe", "namn": "Pedaltränare för armar och ben – träna sittande, display och steglöst motstånd", "slug": "pedaltranare-armar-ben-display", "seoTitel": "Pedaltränare för armar och ben | Fyndplats", "seoBesk": "Pedaltränare för träning sittande, med handvevar för armarna, pedaler för benen, display och steglöst motstånd. 40 × 42,5 × 100 cm.", "sku": "FP-pedaltranare-armar-ben", "variantId": "60958bf7-c40d-40a2-9e27-14b0a12015cf", "textHash": "a78b691b3041027b", "textTecken": 2000, "mediaSumma": 555723656, "mediaTecken": 382, "kat": ["Sport & Fritid", "Träning & Gym"]},
    {"kort": "2f31a1d9", "pid": "2f31a1d9-5b41-4834-9a75-dd3a58814239", "namn": "Båglampa med vit kupa och marmorfot – 180 cm, med fotbrytare", "slug": "baglampa-vit-kupa-marmorfot-180", "seoTitel": "Båglampa med vit kupa och marmorfot | Fyndplats", "seoBesk": "Båglampa, 180 cm hög, med rund vit kupa, arm i förnicklad metall, fot i marmor och fotbrytare. Sockel E27, högst 40 W, ljuskälla ingår inte.", "sku": "FP-baglampa-marmorfot-vit", "variantId": "5c6626d9-8a3c-4245-a80a-dd09468b04c7", "textHash": "49d30327d51b9aa8", "textTecken": 2008, "mediaSumma": 95519263, "mediaTecken": 574, "kat": ["Hem & Inredning", "Belysning"]},
    {"kort": "383d8de2", "pid": "383d8de2-fa39-4205-acae-fe4e04469f43", "namn": "Fotpall i mörkgrå chenille med svarta stålben – 45 × 41 × 38 cm, bär 120 kg", "slug": "fotpall-morkgra-chenille-stalben", "seoTitel": "Fotpall i mörkgrå chenille med stålben | Fyndplats", "seoBesk": "Fotpall klädd i mörkgrå chenille med 10 cm skumdyna och svarta stålben. 45 × 41 × 38 cm, bär 120 kg.", "sku": "FP-fotpall-chenille-morkgra", "variantId": "de8d8bdc-e7f4-4cf6-8c18-ec503f2c9382", "textHash": "7371d3bcb56dd75b", "textTecken": 1949, "mediaSumma": 567801923, "mediaTecken": 491, "kat": ["Hem & Inredning"]},
    {"kort": "403dfd8d", "pid": "403dfd8d-a812-466f-9a24-beb4965b006d", "namn": "Elektrisk fyrhjuling för barn 18–36 månader – 6 V, 2,5 km/h, framåt och bakåt", "slug": "elektrisk-fyrhjuling-barn-bla", "seoTitel": "Elektrisk fyrhjuling för barn 18–36 mån | Fyndplats", "seoBesk": "Elektrisk fyrhjuling i blått för barn 18–36 månader, med 6 V-batteri, 2,5 km/h, omkopplare för framåt och bakåt och cirka 50 minuters körtid.", "sku": "FP-elfyrhjuling-barn-bla", "variantId": "564478df-2809-4ddf-b379-f09cc8a42158", "textHash": "a9113333d9101b2f", "textTecken": 2179, "mediaSumma": 354093876, "mediaTecken": 509, "kat": ["Barn & Familj", "Leksaker & Spel"]},
    {"kort": "50adf7ed", "pid": "50adf7ed-73e8-4050-9e4c-c6444c6f22ce", "namn": "Tre växtpiedestaler i svart stål med skiva i träimitation – 50, 70 och 90 cm", "slug": "vaxtpiedestaler-tre-svart-stal", "seoTitel": "Tre växtpiedestaler i svart stål | Fyndplats", "seoBesk": "Tre växtpiedestaler i industristil, 50, 70 och 90 cm höga och 21 × 21 cm, med ram i svart stål och skiva i träimitation. Bär 30 kg var.", "sku": "FP-vaxtpiedestal-3-set-svart", "variantId": "7e61b054-acf5-4099-ac24-264c4a1286e2", "textHash": "760543d6cc4d1d87", "textTecken": 1926, "mediaSumma": 434376924, "mediaTecken": 532, "kat": ["Hem & Inredning", "Dekoration & Prydnad"]},
    {"kort": "71341341", "pid": "71341341-db6b-44df-a6ac-98535547e94a", "namn": "Vit bokhylla med åtta öppna fack – 74,3 × 24 × 80 cm, står upp eller ligger ned", "slug": "vit-bokhylla-atta-fack", "seoTitel": "Vit bokhylla med åtta öppna fack | Fyndplats", "seoBesk": "Bokhylla i vit spånskiva med åtta öppna fack, 74,3 × 24 × 80 cm. Står på högkant eller ligger ned och bär 64 kg. Tippskydd ingår.", "sku": "FP-bokhylla-8-fack-vit", "variantId": "217e9290-5c52-4de0-a66e-dfc2d5d97486", "textHash": "330ac3736d3df0ed", "textTecken": 1946, "mediaSumma": 168641427, "mediaTecken": 498, "kat": ["Hem & Inredning", "Förvaring & Organisering"]},
    {"kort": "916d2e9f", "pid": "916d2e9f-6a41-4a26-aaed-550dca7f8191", "namn": "Leksaksmotor att reparera – hjullastare med 63 delar, ljus, ljud och dimeffekt", "slug": "leksaksmotor-hjullastare-ljus-dimeffekt", "seoTitel": "Leksaksmotor formad som en hjullastare | Fyndplats", "seoBesk": "Leksaksmotor att reparera, formad som en gul hjullastare, med 63 delar, 4 verktyg, ljus, ljud och dimeffekt. För barn 3–6 år.", "sku": "FP-leksaksmotor-hjullastare", "variantId": "3e1d7e0b-5ea8-4735-899f-c55da8364e7e", "textHash": "dbb39bb0b1fb37cd", "textTecken": 2164, "mediaSumma": 477163463, "mediaTecken": 537, "kat": ["Barn & Familj", "Leksaker & Spel"]},
    {"kort": "b281ec33", "pid": "b281ec33-cadb-447c-8043-972e2fb6d33a", "namn": "Aktivitetstavla för väggen formad som en larv – sju lekar, 108 cm lång", "slug": "aktivitetstavla-vagg-larv-sju-lekar", "seoTitel": "Aktivitetstavla för väggen, sju lekar | Fyndplats", "seoBesk": "Aktivitetstavla för väggen formad som en larv, med sju lekar som xylofon, kugghjul och pärlor. 108 × 62 cm, för barn från 3 år.", "sku": "FP-aktivitetstavla-vagg-larv", "variantId": "63b34d95-d67a-4c77-8d66-12267f8fa691", "textHash": "dcca2ee8e16b75b2", "textTecken": 2201, "mediaSumma": 362771804, "mediaTecken": 525, "kat": ["Barn & Familj", "Leksaker & Spel"]},
    {"kort": "d2fb42b1", "pid": "d2fb42b1-2a90-4d35-b716-e88232a01508", "namn": "Knästol med gungande ram i björk – grå klädsel, för skrivbord på 75–90 cm", "slug": "knastol-bjork-gra-gungande", "seoTitel": "Knästol med gungande ram i björk | Fyndplats", "seoBesk": "Knästol med gungande ram i björk och grå dynor i linnelook, 50 × 73 × 55 cm. Passar skrivbord på 75–90 cm och bär 120 kg.", "sku": "FP-knastol-bjork-gra", "variantId": "5269065f-2b06-45d4-87f6-0a6c99522092", "textHash": "8ff831dc4aa08f94", "textTecken": 2153, "mediaSumma": 651621206, "mediaTecken": 480, "kat": ["Hem & Inredning"]},
    {"kort": "d444fbae", "pid": "d444fbae-a151-422f-8159-8d620461060a", "namn": "Konstgjord fiolfikus 150 cm i vit kruka – stammar av trä, formbara grenar", "slug": "konstgjord-fiolfikus-150-cm", "seoTitel": "Konstgjord fiolfikus 150 cm | Fyndplats", "seoBesk": "Konstgjord fiolfikus, 150 cm hög, med stammar av trä, blad av plast och grenar som går att forma. Står i en kruka med cementtyngd.", "sku": "FP-konstfikus-fiol-150", "variantId": "420ad98b-0387-4304-af6b-c4373db8cb49", "textHash": "564cbf1236585b2c", "textTecken": 1868, "mediaSumma": 712095170, "mediaTecken": 507, "kat": ["Hem & Inredning", "Dekoration & Prydnad"]},
    {"kort": "f3d0cde9", "pid": "f3d0cde9-3b5c-4631-8646-03236e43f491", "namn": "Elektronisk darttavla – 27 spel, upp till 16 spelare, sex pilar och nätadapter", "slug": "elektronisk-darttavla-27-spel", "seoTitel": "Elektronisk darttavla, 27 spel | Fyndplats", "seoBesk": "Elektronisk darttavla med 27 spel och 243 varianter för upp till 16 spelare. Sex pilar, 24 spetsar och nätadapter ingår.", "sku": "FP-darttavla-elektronisk-27", "variantId": "2d3e09d5-d418-4610-8f46-ada37cd91fce", "textHash": "3cc88012a33f4799", "textTecken": 2198, "mediaSumma": 81034041, "mediaTecken": 489, "kat": ["Sport & Fritid"]},
    {"kort": "fa0c30ac", "pid": "fa0c30ac-c917-46f3-8bc6-3592ad789d28", "namn": "Två konstgjorda eukalyptusklot i vita krukor – 65 cm, för inne och ute", "slug": "tva-konstgjorda-eukalyptusklot-65-cm", "seoTitel": "Två konstgjorda eukalyptusklot, 65 cm | Fyndplats", "seoBesk": "Två konstgjorda eukalyptusklot i vita krukor, 65 cm höga, i UV-beständig plast för inne och ute. Krukorna kan tyngas ned.", "sku": "FP-eukalyptusklot-2-set-65", "variantId": "420121fc-a606-47c4-856c-6705b23f90a3", "textHash": "28322c8301f7d620", "textTecken": 1877, "mediaSumma": 134552576, "mediaTecken": 490, "kat": ["Hem & Inredning", "Dekoration & Prydnad", "Trädgård & Utemöbler", "Trädgårdsdekor & Belysning"]},
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
