async function () {
  // Genererad av runda N55:s bygg-steg.py ur ids, namn, seo, slugs, sku, kategori, vantat-hash och media-hash — aldrig skriven av.
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
    {"kort": "07e3cb1d", "pid": "07e3cb1d-855d-4a77-8336-3bd687e24893", "namn": "Uppblåsbar tomte i släde med tre renar – 319 cm lång, LED och inbyggd fläkt", "slug": "uppblasbar-tomte-slade-tre-renar", "seoTitel": "Uppblåsbar tomte i släde med tre renar | Fyndplats", "seoBesk": "Uppblåsbar tomte i släde med tre renar, 319 × 59 × 132 cm, med LED-lampor och inbyggd fläkt. Vattentät polyester, IP44, för inne och ute.", "sku": "FP-tomte-slade-tre-renar", "variantId": "58ac0f79-863c-41e5-ae6a-dd36e84ed8c2", "textHash": "53b23009b437dca9", "textTecken": 2404, "mediaSumma": 28112933, "mediaTecken": 577, "kat": ["Hem & Inredning", "Dekoration & Prydnad", "Trädgård & Utemöbler", "Trädgårdsdekor & Belysning"]},
    {"kort": "16fe3c28", "pid": "16fe3c28-7409-49d8-88f6-e4bcd02d87d8", "namn": "Nattduksbord i vitt med två lådor – 48 × 39,5 × 51 cm, kullagrade skenor", "slug": "nattduksbord-vitt-tva-lador", "seoTitel": "Nattduksbord i vitt med två lådor | Fyndplats", "seoBesk": "Vitt nattduksbord med två lådor på kullagrade skenor, 48 × 39,5 × 51 cm. Skivan bär 20 kg, och en list på baksidan fäster bordet i väggen.", "sku": "FP-nattduksbord-tva-lador-vit", "variantId": "35cdc810-0932-4a3d-8199-bc0ad6300999", "textHash": "9a61402352ae0a8b", "textTecken": 2085, "mediaSumma": 89081724, "mediaTecken": 589, "kat": ["Hem & Inredning", "Förvaring & Organisering"]},
    {"kort": "494e0dab", "pid": "494e0dab-6481-4b44-a6c6-cd1b6c17f77f", "namn": "Sittpuff i svart sammet med förvaring – Ø42 cm, guldfärgad stålram, bär 120 kg", "slug": "sittpuff-svart-sammet-forvaring-guld", "seoTitel": "Sittpuff i svart sammet med förvaring | Fyndplats", "seoBesk": "Rund sittpuff i svart sammet med guldfärgad stålram och 24 liters förvaring under dynan. Ø42 × 39 cm, bär 120 kg och kommer färdigmonterad.", "sku": "FP-sittpuff-sammet-svart-guld", "variantId": "ea662ab9-dbbe-4125-9d4f-b508e20dd93b", "textHash": "e06b7f80f4634712", "textTecken": 1818, "mediaSumma": 604683228, "mediaTecken": 539, "kat": ["Hem & Inredning", "Förvaring & Organisering"]},
    {"kort": "4bd41e91", "pid": "4bd41e91-e988-4c57-9fdf-5fb6909bd2cf", "namn": "Stativ för kapsåg med utdragbara rullstöd – 94–195 cm långt, bär 150 kg", "slug": "stativ-kapsag-rullstod-hopfallbart", "seoTitel": "Stativ för kapsåg med rullstöd, bär 150 kg | Fyndplats", "seoBesk": "Hopfällbart stativ för kapsåg med utdragbara rullstöd, 94–195 cm långt. Monteringsarmar med 62,5 cm spännvidd, bär 150 kg. Kapsåg ingår inte.", "sku": "FP-kapsagsstativ-rullstod", "variantId": "8b40f955-e841-4db5-b19b-f558a9695ef1", "textHash": "fc54cf13f97c89aa", "textTecken": 2195, "mediaSumma": 11888744, "mediaTecken": 590, "kat": ["Hem & Inredning", "Verktyg & Hemmafix"]},
    {"kort": "4f0fa784", "pid": "4f0fa784-9661-47d4-9fc0-d4f303e59968", "namn": "Gnistskydd för öppen spis med tre paneler – 132,5 × 76,5 cm, svart metall", "slug": "gnistskydd-oppen-spis-tre-paneler-svart", "seoTitel": "Gnistskydd för öppen spis, tre paneler | Fyndplats", "seoBesk": "Gnistskydd i svart pulverlackerat stål med tre paneler, 132,5 × 76,5 cm. Fälls ihop till 5 cm och behöver ingen montering.", "sku": "FP-gnistskydd-tre-paneler", "variantId": "d92b9dc2-14f8-4faf-a6bb-ab9b7b293514", "textHash": "76a52a981c510a60", "textTecken": 2024, "mediaSumma": 877106260, "mediaTecken": 584, "kat": ["Hem & Inredning"]},
    {"kort": "4fb02f99", "pid": "4fb02f99-ae11-4c9a-8482-bcbdb70e8a11", "namn": "Shoppingvagn som klättrar i trappor – vit låda på 51 liter, bär 80 kg", "slug": "shoppingvagn-trappor-vit-lada-51-liter", "seoTitel": "Shoppingvagn som klättrar i trappor, 51 liter | Fyndplats", "seoBesk": "Hopfällbar shoppingvagn i vitt med låda på 51 liter, hjulstjärnor för trappor och teleskophandtag. Bär 80 kg, och locket fungerar som bord eller pall.", "sku": "FP-shoppingvagn-trappor-vit", "variantId": "77214006-aef1-4b9f-8391-37a393faa0c2", "textHash": "c28904d4c8587a32", "textTecken": 2281, "mediaSumma": 505635301, "mediaTecken": 521, "kat": ["Hem & Inredning", "Förvaring & Organisering"]},
    {"kort": "53386372", "pid": "53386372-173f-4c7f-8aa8-c9504de4467b", "namn": "Gnistskydd för öppen spis med två paneler – 141 × 50 cm, svart metall", "slug": "gnistskydd-oppen-spis-tva-paneler-svart", "seoTitel": "Gnistskydd för öppen spis, två paneler | Fyndplats", "seoBesk": "Gnistskydd i svart pulverlackerad metall med två paneler, 141 × 50 cm. Passar spisöppningar på 76,2–94 cm och behöver ingen montering.", "sku": "FP-gnistskydd-tva-paneler", "variantId": "3631cac8-2fc8-4344-88d1-ceb1663d71d4", "textHash": "9a2bd804ed7cf824", "textTecken": 1986, "mediaSumma": 854283111, "mediaTecken": 330, "kat": ["Hem & Inredning"]},
    {"kort": "6200b3c9", "pid": "6200b3c9-0eba-4dde-810c-9843bf9d9af5", "namn": "Sängram 90 × 200 cm i vit metall – 28 cm fritt under, bär 136 kg", "slug": "sangram-90x200-vit-metall", "seoTitel": "Sängram 90 × 200 cm i vit metall | Fyndplats", "seoBesk": "Sängram i vit metall för madrass 90 × 200 cm, utan huvudgavel. 28 cm fritt under sängen för förvaring, sex ben och 11 ribbor, bär 136 kg.", "sku": "FP-sangram-90x200-vit", "variantId": "425b87bb-90ad-4ad3-8cc1-a61ee68dd004", "textHash": "010e120d40eb3d83", "textTecken": 1980, "mediaSumma": 871942409, "mediaTecken": 442, "kat": ["Hem & Inredning"]},
    {"kort": "92afa6e3", "pid": "92afa6e3-103a-4ff7-ad1f-b7a4ab43ff59", "namn": "Fyra stapelbara pallar med stoppad sits – grått tyg, svarta stålben, 45 cm höga", "slug": "fyra-stapelbara-pallar-gra-sits", "seoTitel": "Fyra stapelbara pallar med stoppad sits | Fyndplats", "seoBesk": "Fyra runda pallar med stoppad sits i grått tyg och svarta stålben. 40 × 40 × 45 cm, bär 120 kg per pall och staplas när de inte används.", "sku": "FP-pallar-stapelbara-gra", "variantId": "08cdc90a-24df-4630-a762-cd8830e0b930", "textHash": "5695a34e388557b2", "textTecken": 1856, "mediaSumma": 827210283, "mediaTecken": 512, "kat": ["Hem & Inredning"]},
    {"kort": "a1c98be2", "pid": "a1c98be2-42c2-4e8f-8705-3c8cae9b9684", "namn": "Snurrbar pall i grå sammet med förvaring – höj- och sänkbar 49–65 cm, bär 120 kg", "slug": "snurrbar-pall-gra-sammet-forvaring", "seoTitel": "Snurrbar pall i grå sammet med förvaring | Fyndplats", "seoBesk": "Snurrbar pall i grå sammet med knappad sits och fack under dynan. Höjden ställs in på 49–65 cm, foten har en halkfri gummiring, bär 120 kg.", "sku": "FP-snurrpall-sammet-gra", "variantId": "94615427-812a-48c1-bc3c-7bc819f604ec", "textHash": "43192a1e544442d4", "textTecken": 2018, "mediaSumma": 8438839, "mediaTecken": 542, "kat": ["Hem & Inredning", "Förvaring & Organisering"]},
    {"kort": "c40a2b10", "pid": "c40a2b10-6597-4cb6-8b72-840609a8e71a", "namn": "Smal mediahylla i vitt med åtta fack – 360 cd-skivor, 58 × 24 × 126,3 cm", "slug": "smal-mediahylla-vit-atta-fack", "seoTitel": "Smal mediahylla i vitt med åtta fack | Fyndplats", "seoBesk": "Smal mediahylla i vitt, 58 × 24 × 126,3 cm, med åtta fack för 360 cd-skivor eller 185 dvd-filmer. Sex flyttbara hyllplan och band mot tippning.", "sku": "FP-mediahylla-atta-fack-vit", "variantId": "119cde03-fb0f-4a98-9d27-d55e66f09a37", "textHash": "deb0f98ed6e7a56f", "textTecken": 2096, "mediaSumma": 240983521, "mediaTecken": 417, "kat": ["Hem & Inredning", "Förvaring & Organisering"]},
    {"kort": "c6ff6fe8", "pid": "c6ff6fe8-2f00-4c3d-881f-06c6630a8150", "namn": "Hantelset med ställ – sex sexkantiga hantlar på 1, 3 och 5 kg", "slug": "hantelset-stall-sex-hantlar", "seoTitel": "Hantelset med ställ, 1, 3 och 5 kg | Fyndplats", "seoBesk": "Sex sexkantiga hantlar, två vardera på 1, 3 och 5 kg, med ett ställ som också fungerar som kettlebell. Plasthölje som skonar golvet.", "sku": "FP-hantelset-sex-stall", "variantId": "79af63f1-d727-424a-82a2-c10f1a0ad337", "textHash": "740cc6a12a68f06d", "textTecken": 2054, "mediaSumma": 477420980, "mediaTecken": 559, "kat": ["Sport & Fritid", "Träning & Gym"]},
    {"kort": "cbbabd2c", "pid": "cbbabd2c-d6d3-4364-aaa8-906b6ac7f5eb", "namn": "Vinhylla med glashållare och låda – 12 flaskor och 9 glas, 148 cm hög", "slug": "vinhylla-glashallare-lada-12-flaskor", "seoTitel": "Vinhylla med glashållare och låda | Fyndplats", "seoBesk": "Vinhylla i svart metall och rustikt brun spånskiva för 12 flaskor och 9 glas, med öppen hylla och låda. 40 × 30 × 148 cm, bär 31 kg.", "sku": "FP-vinhylla-glas-lada", "variantId": "239baeb8-153c-4bae-894c-f0cd2e866b65", "textHash": "e095e9b87b06c1fb", "textTecken": 2245, "mediaSumma": 493434253, "mediaTecken": 600, "kat": ["Hem & Inredning", "Förvaring & Organisering"]},
    {"kort": "d5ed3e90", "pid": "d5ed3e90-a4d8-4c1c-8941-6cb570e824e9", "namn": "Bambuhylla med sex hyllplan – 60 × 26 × 161 cm, hyllplan i elva lägen", "slug": "bambuhylla-sex-hyllplan-161-cm", "seoTitel": "Bambuhylla med sex hyllplan, 161 cm | Fyndplats", "seoBesk": "Smal hylla i lackad bambu, 60 × 26 × 161 cm, med sex hyllplan som ställs i 11 lägen. Bär 36 kg, och ett band mot tippning ingår.", "sku": "FP-bambuhylla-sex-plan", "variantId": "a4c9090a-0c25-4609-8314-5c2b482907a8", "textHash": "c4dab8193471daa4", "textTecken": 2097, "mediaSumma": 168069925, "mediaTecken": 548, "kat": ["Hem & Inredning", "Förvaring & Organisering"]},
    {"kort": "d60cd696", "pid": "d60cd696-293a-4c7c-9336-41ea9614413c", "namn": "Julby i trä som ljusbåge – 20 LED, 45 × 10 × 35 cm, drivs med batterier", "slug": "julby-tra-ljusbage-20-led", "seoTitel": "Julby i trä som ljusbåge med 20 LED | Fyndplats", "seoBesk": "Julby i trä formad som en ljusbåge, 45 × 10 × 35 cm, med hus, kyrka och tomte i tre nivåer och 20 LED-lampor. Drivs med 3 AA-batterier.", "sku": "FP-julby-ljusbage-tra", "variantId": "1c37fa0d-85a5-4a36-a7e2-6ea29f1b5209", "textHash": "9fd315802c165411", "textTecken": 1958, "mediaSumma": 148726842, "mediaTecken": 539, "kat": ["Hem & Inredning", "Dekoration & Prydnad"]},
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
