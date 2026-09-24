async function () {
  // Genererad av runda N56:s bygg-steg.py ur ids, namn, seo, slugs, sku, kategori, vantat-hash och media-hash — aldrig skriven av.
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
    {"kort": "1355eec8", "pid": "1355eec8-4b26-40ef-ac51-fce1db893004", "namn": "Handbagagekoffert 56 cm i mörkgrått – 40 liter, TSA-lås och fyra snurrhjul", "slug": "handbagagekoffert-56-cm-morkgra", "seoTitel": "Handbagagekoffert 56 cm med TSA-lås | Fyndplats", "seoBesk": "Handbagagekoffert i mörkgrå ABS, 56 × 36 × 24 cm, som rymmer 40 liter. TSA-lås, fyra snurrhjul och teleskophandtag i aluminium.", "sku": "FP-handbagage-koffert-56-gra", "variantId": "92f44cbb-8af6-485c-9330-9b2681e39110", "textHash": "b67d5756b41f8d06", "textTecken": 2145, "mediaSumma": 103768105, "mediaTecken": 553, "kat": ["Sport & Fritid", "Friluftsliv & Resa"]},
    {"kort": "1c908b3f", "pid": "1c908b3f-9029-4dff-a3f9-e424e345da8b", "namn": "Pokerset med 400 marker i väska – två kortlekar, fem tärningar och spelmatta", "slug": "pokerset-marker-vaska-400", "seoTitel": "Pokerset med 400 marker i väska | Fyndplats", "seoBesk": "Pokerset med 400 marker i fem valörer, två kortlekar, fem tärningar, dealerknapp och spelmatta i väska. Räcker för upp till 10 spelare.", "sku": "FP-pokerset-marker-400", "variantId": "61cbf72b-2a4b-47f9-b313-0c636544371e", "textHash": "bf8440c64da7e0ef", "textTecken": 2228, "mediaSumma": 772460007, "mediaTecken": 551, "kat": ["Sport & Fritid"]},
    {"kort": "1da6b037", "pid": "1da6b037-1532-40c6-af48-cb756b693a62", "namn": "Gnistskydd för öppen spis i svart metall – tre paneler, 122 × 75 cm, bågmönster", "slug": "gnistskydd-svart-metall-bagmonster", "seoTitel": "Gnistskydd i svart metall, tre paneler | Fyndplats", "seoBesk": "Gnistskydd i svart metall med tre paneler och bågmönster, 122 × 75 cm. Fälls ihop till 70 cm och kräver ingen montering.", "sku": "FP-gnistskydd-svart-bagmonster", "variantId": "1129fde0-a55c-40b6-aff1-53ffaac5207e", "textHash": "0cd4474a7cdf1f78", "textTecken": 1893, "mediaSumma": 461652511, "mediaTecken": 474, "kat": ["Hem & Inredning"]},
    {"kort": "3ad8c7a4", "pid": "3ad8c7a4-9d12-4480-94b7-fcb625ca69ee", "namn": "Klättervägg för katt i fyra delar – sisalstolpe, hängbro, liggskål och trappa", "slug": "klattervagg-katt-fyra-delar", "seoTitel": "Klättervägg för katt i fyra delar | Fyndplats", "seoBesk": "Klättervägg för katt i fyra delar: sisalstolpe på 96 cm med liggkorg, hängbro, liggskål och trappa. Plysch och sisal, för katter under 5 kg.", "sku": "FP-klattervagg-katt-fyra-delar", "variantId": "660cbc61-60a5-46dd-89b1-a5ea7ca0fd32", "textHash": "32ea37dc7ad4423b", "textTecken": 2400, "mediaSumma": 781438011, "mediaTecken": 559, "kat": ["Husdjur", "Lek & Tillbehör för husdjur"]},
    {"kort": "6d0e2d27", "pid": "6d0e2d27-3ffe-4e11-b5c5-90e2c12d9e95", "namn": "Gnistskydd i guldfärg med dubbeldörrar – tre paneler, 122 × 75 cm", "slug": "gnistskydd-guld-dubbeldorrar", "seoTitel": "Gnistskydd i guldfärg med dubbeldörrar | Fyndplats", "seoBesk": "Gnistskydd i guldfärgad metall med tre paneler och dubbeldörrar för att lägga in ved. 122 × 10 × 75 cm, för öppningar på 76,2–94,0 cm.", "sku": "FP-gnistskydd-guld-dubbeldorrar", "variantId": "10015c41-c3f1-4de9-9520-6a44643d96fe", "textHash": "924bdc2bbd64bd87", "textTecken": 2032, "mediaSumma": 858954995, "mediaTecken": 506, "kat": ["Hem & Inredning"]},
    {"kort": "6f4baeef", "pid": "6f4baeef-f998-4701-8829-63816e0d40a1", "namn": "Vinställ för 30 flaskor – sex plan, rustik skiva och svart metallram, 88,5 cm", "slug": "vinstall-30-flaskor-metall", "seoTitel": "Vinställ för 30 flaskor i metall | Fyndplats", "seoBesk": "Vinställ för 30 flaskor i sex plan, 59 × 30 × 88,5 cm. Rustikt brun skiva, svart metallram, ställbara fötter och remmar mot tippning.", "sku": "FP-vinstall-30-flaskor", "variantId": "80cf4503-8f91-442a-8ca5-81fefc6ab84c", "textHash": "5ec450da88ec24ab", "textTecken": 2213, "mediaSumma": 434981663, "mediaTecken": 602, "kat": ["Hem & Inredning", "Förvaring & Organisering"]},
    {"kort": "7e3d0a23", "pid": "7e3d0a23-7665-45fe-82db-141e6bc7a720", "namn": "Vedställ 0,33 m³ med överdrag och bärväska – svart metall, 120 cm, bär 150 kg", "slug": "vedstall-overdrag-barvaska", "seoTitel": "Vedställ med överdrag och bärväska | Fyndplats", "seoBesk": "Vedställ i svart metall för 0,33 m³ ved, 120 × 36 × 99 cm, med vattentätt överdrag och bärväska i canvas. Bär 150 kg, 19 cm över marken.", "sku": "FP-vedstall-overdrag-barvaska", "variantId": "bf01a5fb-0a87-4429-b4ea-4c2b4123bfbb", "textHash": "c2283213f18287ec", "textTecken": 2102, "mediaSumma": 788476181, "mediaTecken": 331, "kat": ["Trädgård & Utemöbler", "Hem & Inredning", "Förvaring & Organisering"]},
    {"kort": "856bdf7e", "pid": "856bdf7e-bd81-4377-8df8-ad96fbada5a0", "namn": "Hantlar och skivstång i ett – 20 kg, åtta viktskivor och stjärnlås", "slug": "hantlar-skivstang-20-kg", "seoTitel": "Hantlar och skivstång i ett, 20 kg | Fyndplats", "seoBesk": "Hantlar som blir en skivstång: 20 kg med åtta viktskivor i järn, räfflat grepp och stjärnlås. Hantlarna är 35 cm och skivstången 95 cm.", "sku": "FP-hantlar-skivstang-20kg", "variantId": "a1689b43-0a21-4f87-9370-3681385ae892", "textHash": "1758a719a99366c4", "textTecken": 2260, "mediaSumma": 292799299, "mediaTecken": 507, "kat": ["Sport & Fritid", "Träning & Gym"]},
    {"kort": "868b82c8", "pid": "868b82c8-5206-45c9-ade5-c6b082a5412b", "namn": "Leksaksaffär i trä med kassa och skanner – 34 tillbehör, 92,5 cm hög, från 3 år", "slug": "leksaksaffar-tra-kassa-skanner", "seoTitel": "Leksaksaffär i trä med kassa | Fyndplats", "seoBesk": "Leksaksaffär i trä med kassa, skanner, krittavla och 34 tillbehör, bland annat mat i trä som går att dela. 52 × 30 × 92,5 cm, från 3 år.", "sku": "FP-leksaksaffar-tra-kassa", "variantId": "ae27b7dd-d0ab-4880-b8b2-d77b41821214", "textHash": "89cd31851bf76e4c", "textTecken": 2159, "mediaSumma": 690571782, "mediaTecken": 514, "kat": ["Barn & Familj", "Leksaker & Spel"]},
    {"kort": "95a0993c", "pid": "95a0993c-df23-499d-acc7-156b42aff4c7", "namn": "Fotpall i gräddvit manchester – 70 × 46 × 40 cm, ben i gummiträ, bär 120 kg", "slug": "fotpall-graddvit-manchester", "seoTitel": "Fotpall i gräddvit manchester | Fyndplats", "seoBesk": "Fotpall i gräddvit manchester med ben i gummiträ, 70 × 46 × 40 cm. Stoppad sits på 16 cm som bär 120 kg, som fotstöd eller extra sittplats.", "sku": "FP-fotpall-manchester-graddvit", "variantId": "cfa9c1dd-35a5-4d03-bbab-15c5779efa9d", "textHash": "a82bd46697439538", "textTecken": 1935, "mediaSumma": 470414792, "mediaTecken": 503, "kat": ["Möbler"]},
    {"kort": "98da447a", "pid": "98da447a-8700-4465-bc57-e6f9271b4c6f", "namn": "Staffli i bokträ med låda – ställbar höjd upp till 190 cm, dukar upp till 92 cm", "slug": "staffli-boktra-lada", "seoTitel": "Staffli i bokträ med låda | Fyndplats", "seoBesk": "Staffli i bokträ med låda och hylla, upp till 190 cm högt, för dukar upp till 92 cm. Vinkeln går att justera, och staffliet fälls ihop.", "sku": "FP-staffli-boktra-lada", "variantId": "44615cac-9ed7-4ae0-a324-1138e4b638ca", "textHash": "2da655be622b6b68", "textTecken": 2138, "mediaSumma": 150156749, "mediaTecken": 516, "kat": ["Hem & Inredning"]},
    {"kort": "b62bb65c", "pid": "b62bb65c-d933-4a61-bda5-b12aca4a5b25", "namn": "Hantelställ med två hyllor – gul och svart stålram, bär 270 kg", "slug": "hantelstall-tva-hyllor", "seoTitel": "Hantelställ med två hyllor | Fyndplats", "seoBesk": "Hantelställ med två hyllor på 80 × 23 cm och gul och svart stålram. Bär 135 kg per hylla och 270 kg totalt, 92,5 × 50,5 × 80,5 cm.", "sku": "FP-hantelstall-tva-hyllor", "variantId": "59c2f83f-a52e-4e0c-971a-555936d7178c", "textHash": "8c9d750cecda60cc", "textTecken": 1947, "mediaSumma": 167546060, "mediaTecken": 466, "kat": ["Sport & Fritid", "Träning & Gym"]},
    {"kort": "e248e9db", "pid": "e248e9db-a5ce-4f72-8f32-a5689ca18bfe", "namn": "Smalt badrumsskåp i bambu – 30 × 30 × 80 cm, öppet fack och lamelldörr", "slug": "badrumsskap-bambu-lamelldorr", "seoTitel": "Smalt badrumsskåp i bambu | Fyndplats", "seoBesk": "Smalt badrumsskåp i bambu, 30 × 30 × 80 cm, med öppet fack och lamelldörr. Hyllan går att ställa i tre lägen, och skåpet bär 12 kg.", "sku": "FP-badrumsskap-bambu-30", "variantId": "bd86de7d-1786-4e6a-a19f-504afd84fa97", "textHash": "3e153dd75b300ca2", "textTecken": 2246, "mediaSumma": 808106962, "mediaTecken": 601, "kat": ["Hem & Inredning", "Badrum & Hemtextil", "Förvaring & Organisering"]},
    {"kort": "ed39cd4c", "pid": "ed39cd4c-d5a6-41ab-9d95-a677a100e9e0", "namn": "Toaletthylla i bambu med tre hyllplan – 68 × 20 × 165 cm, bär 15 kg", "slug": "toaletthylla-bambu-tre-hyllplan", "seoTitel": "Toaletthylla i bambu med tre hyllplan | Fyndplats", "seoBesk": "Toaletthylla i bambu med tre öppna hyllplan, 68 × 20 × 165 cm. Fritt mått under hyllplanen 64 × 92 cm, bär 15 kg och fästs mot tippning.", "sku": "FP-toaletthylla-bambu", "variantId": "504832b6-9ee2-44d0-85d1-c211f9d643b2", "textHash": "b3743e7164ac56c0", "textTecken": 2504, "mediaSumma": 164033740, "mediaTecken": 647, "kat": ["Hem & Inredning", "Badrum & Hemtextil", "Förvaring & Organisering"]},
    {"kort": "f2756389", "pid": "f2756389-3bbe-4926-9d10-6c189eb090d8", "namn": "Satsbord i tre storlekar – skivor i trämönster och svart stålram", "slug": "satsbord-tre-storlekar-stalram", "seoTitel": "Satsbord i tre storlekar med stålram | Fyndplats", "seoBesk": "Tre satsbord med skivor i trämönster och svart stålram, 45, 40 och 34 cm breda. Varje bord bär 60 kg och har ställbara fötter.", "sku": "FP-satsbord-tre-stalram", "variantId": "9e20fda0-2421-43aa-b4bb-20dbfd8f374e", "textHash": "27bf31cd93ac055d", "textTecken": 1982, "mediaSumma": 466766137, "mediaTecken": 563, "kat": ["Möbler", "Soffbord & småbord"]},
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
