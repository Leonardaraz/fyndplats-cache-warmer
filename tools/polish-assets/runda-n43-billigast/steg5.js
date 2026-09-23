async function () {
  // Genererad av runda N43:s bygg-steg.py ur ids, namn, seo, slugs, sku, kategori, vantat-hash och media-hash — aldrig skriven av.
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
    {"kort": "5a825b3f", "pid": "5a825b3f-23e6-4733-9868-118784f3ed64", "namn": "Medicinskåp i rostfritt stål med glasdörr – låsbart, tre fack, 20 × 12 × 58 cm", "slug": "medicinskap-rostfritt-stal-glasdorr-las", "seoTitel": "Låsbart medicinskåp i rostfritt stål | Fyndplats", "seoBesk": "Låsbart medicinskåp i rostfritt stål med frostad glasdörr, tre fack och två nycklar. 20 × 12 × 58 cm och kan sitta i badrummet.", "sku": "FP-medicinskap-rostfritt-glasdorr", "variantId": "29956e47-f9ff-4343-b8b2-447343b28aaf", "textHash": "413e2190ade59c2d", "textTecken": 2293, "mediaSumma": 632431004, "mediaTecken": 510, "kat": ["Hem & Inredning", "Badrum & Hemtextil"]},
    {"kort": "923236e5", "pid": "923236e5-ad12-4709-bcf9-7e050dbf6435", "namn": "Väggdekor i metall med monsterablad – guldfärgad, 83 × 39 cm", "slug": "vaggdekor-metall-monsterablad-guld", "seoTitel": "Väggdekor i metall med monsterablad i guld | Fyndplats", "seoBesk": "Väggdekor i metall med monsterablad i guld, 83 × 39 cm. Bladguld som lagts på för hand, lackerad yta och krokar på baksidan – skruvar och pluggar ingår.", "sku": "FP-vaggdekor-metall-monstera-guld", "variantId": "1504cf95-f043-4bcb-8e1b-f3c95327a349", "textHash": "df98f1cfddb1f0ae", "textTecken": 2187, "mediaSumma": 790468496, "mediaTecken": 566, "kat": ["Hem & Inredning", "Dekoration & Prydnad"]},
    {"kort": "b0766f63", "pid": "b0766f63-5fb7-4ca0-b31f-5d056ad721ab", "namn": "Julgran 92 cm med 50 varmvita LED – snöade grenar, kottar och batteridrift", "slug": "julgran-92-cm-led-batteri-kottar", "seoTitel": "Julgran 92 cm med LED och batteridrift | Fyndplats", "seoBesk": "Snöad julgran på 92 cm med 50 varmvita LED, timer på sex timmar och 14 kottar. Batteridriven och med fot av betong. För inomhusbruk.", "sku": "FP-julgran-92-led-batteri", "variantId": "401bbc15-1591-43f3-ba41-2bd9bc96fe60", "textHash": "06e1d58d8b355048", "textTecken": 2312, "mediaSumma": 666465742, "mediaTecken": 442, "kat": ["Hem & Inredning", "Dekoration & Prydnad"]},
    {"kort": "c61ced0e", "pid": "c61ced0e-46be-4577-99c9-798fd819ad0b", "namn": "Hylla i bambu med tre plan – 62 × 33 × 80 cm, för badrum och kök", "slug": "hylla-bambu-tre-plan-62-cm", "seoTitel": "Hylla i bambu med tre plan, 62 × 80 cm | Fyndplats", "seoBesk": "Öppen hylla i naturfärgad bambu med tre plan, 62 × 33 × 80 cm. Varje plan bär 10 kg, och det nedersta sitter 17 cm över golvet. För badrum och kök.", "sku": "FP-hylla-bambu-tre-plan-62", "variantId": "40051df1-b391-4f79-9e02-9ef782ca45ba", "textHash": "6bed1042efc36077", "textTecken": 2136, "mediaSumma": 219273303, "mediaTecken": 543, "kat": ["Hem & Inredning", "Förvaring & Organisering"]},
    {"kort": "e01513c6", "pid": "e01513c6-4d23-4ac8-8b72-3b2749439b7c", "namn": "Sidobord på hjul med C-form – höjd 68–78 cm, lönnlook och vit stomme", "slug": "sidobord-hjul-c-form-hojdjusterbart", "seoTitel": "Sidobord på hjul i C-form, höjd 68–78 cm | Fyndplats", "seoBesk": "Sidobord i C-form på fyra hjul med bromsar. Höjden ställs in mellan 68 och 78 cm, bordet mäter 60 × 40 cm och bär 20 kg. Skiva i lönnlook.", "sku": "FP-sidobord-hjul-c-form-hojdjust", "variantId": "5b675de3-8303-449b-a1b9-44b8419bb00b", "textHash": "ceef594748535f11", "textTecken": 2242, "mediaSumma": 930292558, "mediaTecken": 515, "kat": ["Hem & Inredning"]},
    {"kort": "5bd95c2c", "pid": "5bd95c2c-eae0-48fb-96d0-91228125a5af", "namn": "Väggspegel 50 × 70 cm med svart ram – hängs stående eller liggande", "slug": "vaggspegel-50-x-70-cm-svart-ram", "seoTitel": "Väggspegel 50 × 70 cm med svart ram | Fyndplats", "seoBesk": "Rektangulär väggspegel på 50 × 70 cm med svart ram av MDF. Fyra krokar på baksidan för stående eller liggande upphängning, skruvsats ingår.", "sku": "FP-vaggspegel-50x70-svart-ram", "variantId": "eeb96af1-6410-45f3-a5ac-a57378d063e9", "textHash": "5727d3b9ff9ace7d", "textTecken": 1869, "mediaSumma": 448287006, "mediaTecken": 487, "kat": ["Hem & Inredning", "Dekoration & Prydnad"]},
    {"kort": "60f84a27", "pid": "60f84a27-9823-4d93-9d02-59a18b0bd409", "namn": "Balansstenar för barn, sex stycken – tre storlekar, halkskydd, stapelbara", "slug": "balansstenar-barn-sex-stycken", "seoTitel": "Balansstenar för barn, sex i tre storlekar | Fyndplats", "seoBesk": "Sex balansstenar för barn 3–8 år i tre storlekar, med halkskydd och mönstrad ovansida. Bär upp till 80 kg, kan staplas och passar inne och ute.", "sku": "FP-balansstenar-sex-tre-storlekar", "variantId": "beebf563-f3a4-4e8b-971b-a546efa68099", "textHash": "6ad3ab2626f4cbee", "textTecken": 2132, "mediaSumma": 490219706, "mediaTecken": 542, "kat": ["Barn & Familj", "Leksaker & Spel"]},
    {"kort": "a794b9e7", "pid": "a794b9e7-76ba-40bc-8d06-ba09dc0e49da", "namn": "Smal julgran 180 cm med snö – Ø60 cm, 492 grenspetsar och fällbar fot", "slug": "smal-julgran-180-cm-sno-492-spetsar", "seoTitel": "Smal julgran 180 cm med snö, Ø60 cm | Fyndplats", "seoBesk": "Smal julgran på 180 cm med konstsnö och 492 grenspetsar. Bara Ø60 cm, svårantändliga grenar och en fot som tas av och viks ihop. För inomhusbruk.", "sku": "FP-julgran-smal-180-sno-492", "variantId": "84e8463c-aacb-4060-80bd-2f8d1dcd4a30", "textHash": "37e0dca1d01c28d0", "textTecken": 2098, "mediaSumma": 47528891, "mediaTecken": 539, "kat": ["Hem & Inredning", "Dekoration & Prydnad"]},
    {"kort": "75a38b7b", "pid": "75a38b7b-e6ba-43d5-806b-b378067f148a", "namn": "Fiberoptisk julgran 120 cm med stjärna – ljus i flera färger, Ø60 cm", "slug": "fiberoptisk-julgran-120-cm-stjarna", "seoTitel": "Fiberoptisk julgran 120 cm med stjärna | Fyndplats", "seoBesk": "Julgran på 120 cm med fiberoptik som lyser i flera färger i grenspetsarna, och en stjärna i toppen. 130 grenspetsar, Ø60 cm och fot av metall.", "sku": "FP-julgran-fiberoptik-120-stjarna", "variantId": "46f01ca4-ae9e-4cea-9df1-a20a509064f4", "textHash": "567d1330cb1747af", "textTecken": 2116, "mediaSumma": 802968780, "mediaTecken": 422, "kat": ["Hem & Inredning", "Dekoration & Prydnad"]},
    {"kort": "c4af8541", "pid": "c4af8541-efa6-4fec-8bf5-027e2d3a3f5c", "namn": "Julgirlang 1,8 m med 50 varmvita LED – kottar, röda bär och snöade toppar", "slug": "julgirlang-1-8-m-led-kottar-bar", "seoTitel": "Julgirlang 1,8 m med LED, kottar och bär | Fyndplats", "seoBesk": "Julgirlang på 1,8 m med 50 varmvita LED, timer på sex timmar, röda bär, kottar och snöade toppar. Svårantändlig och klar att hänga upp.", "sku": "FP-julgirlang-1-8m-led-bar", "variantId": "8468428a-6adb-4ce6-9a1b-71f37afd4ff8", "textHash": "51e94c8f18925397", "textTecken": 2083, "mediaSumma": 696765589, "mediaTecken": 393, "kat": ["Hem & Inredning", "Dekoration & Prydnad"]},
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
