async function () {
  // Genererad av runda N40:s bygg-steg.py ur ids, namn, seo, slugs, sku, kategori, vantat-hash och media-hash — aldrig skriven av.
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
    {"kort": "27ff1a8e", "pid": "27ff1a8e-630e-444e-81c5-761f18c478bb", "namn": "Julgran 60 cm med 50 LED och timer – kottar, röda bär och snötoppar", "slug": "julgran-60-cm-led-timer-kottar-bar", "seoTitel": "Julgran 60 cm med 50 LED och timer | Fyndplats", "seoBesk": "Julgran på 60 cm med 50 varmvita LED-lampor och timer, kottar, röda bär och snötoppar. Stadig fot av cement. För inomhusbruk.", "sku": "FP-julgran-60-led-kottar-bar", "variantId": "fcee7e1f-a5b1-4cd6-9918-20da88f0d4ae", "textHash": "e2ea02530336c66f", "textTecken": 2555, "mediaSumma": 895639924, "mediaTecken": 530, "kat": ["Hem & Inredning", "Dekoration & Prydnad"]},
    {"kort": "c2c6a332", "pid": "c2c6a332-0cb4-49b7-83f9-557ed594ea59", "namn": "Väggspegel 40 × 60 cm med svart ram – hängs stående eller liggande", "slug": "vaggspegel-40x60-svart-ram", "seoTitel": "Väggspegel 40 × 60 cm med svart ram | Fyndplats", "seoBesk": "Rektangulär väggspegel 40 × 60 cm med svart ram i MDF. Fyra krokar på baksidan, så den hängs stående eller liggande. Skruvset ingår.", "sku": "FP-vaggspegel-40x60-svart-ram", "variantId": "a7293315-1d10-4083-85fa-c2ab13af4f33", "textHash": "55a57f1987009563", "textTecken": 2100, "mediaSumma": 871290182, "mediaTecken": 496, "kat": ["Hem & Inredning", "Dekoration & Prydnad"]},
    {"kort": "e2cfbd07", "pid": "e2cfbd07-845c-47b8-aec0-34357681b8df", "namn": "Mikrovågsugnshylla i svart metall – utdragbar 39,5–64 cm, tre krokar, bär 15 kg", "slug": "mikrovagsugnshylla-utdragbar-svart-metall", "seoTitel": "Mikrovågsugnshylla, utdragbar, tre krokar | Fyndplats", "seoBesk": "Utdragbar mikrovågsugnshylla i svart metall, 39,5–64 cm bred, med tre krokar och 40 cm fritt under. Ställbara fötter, bär 15 kg.", "sku": "FP-mikrovagsugnshylla-utdragbar-svart", "variantId": "6f3b32da-6e27-4a4b-b33a-c6c889ee3e7a", "textHash": "91cf60f22551bf25", "textTecken": 2386, "mediaSumma": 28957553, "mediaTecken": 621, "kat": ["Kök & Husgeråd", "Köksredskap & Tillbehör", "Hem & Inredning", "Förvaring & Organisering"]},
    {"kort": "a7d072fc", "pid": "a7d072fc-6409-4f67-9be3-49c94bce9787", "namn": "Vinställ i svart metall för 16 flaskor – fyra stapelbara plan, bär 32 kg", "slug": "vinstall-16-flaskor-svart-metall", "seoTitel": "Vinställ för 16 flaskor i svart metall | Fyndplats", "seoBesk": "Vinställ i svart pulverlackerad metall för 16 flaskor. Fyra plan med vågformade hyllor som staplas eller används var för sig. Bär 32 kg.", "sku": "FP-vinstall-16-flaskor-svart", "variantId": "7d41215e-1d2f-4c5f-87aa-555aeeb2752f", "textHash": "d3c4c1be3a17ab09", "textTecken": 2300, "mediaSumma": 475488382, "mediaTecken": 551, "kat": ["Hem & Inredning", "Förvaring & Organisering"]},
    {"kort": "4a4721fa", "pid": "4a4721fa-8f3e-41dc-a544-c9da0e992854", "namn": "Lekmatta 160 × 100 cm med stadsmotiv – vägar, rondeller och hus, halkskyddad", "slug": "lekmatta-stadsmotiv-160x100", "seoTitel": "Lekmatta 160 × 100 cm med stadsmotiv | Fyndplats", "seoBesk": "Lekmatta med stadsmotiv i 100 % polyester, 160 × 100 cm. Vägar, rondeller och hus att leka med, halkskyddad undersida och 1,6 m² lekyta.", "sku": "FP-lekmatta-stadsmotiv-160x100", "variantId": "4ac11842-2990-41bd-abad-6201872aa998", "textHash": "86fea7103dd20a86", "textTecken": 2273, "mediaSumma": 550180016, "mediaTecken": 487, "kat": ["Barn & Familj", "Leksaker & Spel", "Baby & Småbarn"]},
    {"kort": "8ded5e38", "pid": "8ded5e38-585e-48ed-adcc-0f46393004c1", "namn": "Gunghäst med lejondesign i trä – handtag och ryggstöd, 2–5 år, bär 25 kg", "slug": "gunghast-lejon-tra-handtag-ryggstod", "seoTitel": "Gunghäst med lejon i trä, 2–5 år | Fyndplats", "seoBesk": "Gunghäst formad som ett orange lejon, i plywood med handtag och ryggstöd. Bred, stabil bas och sitthöjd 28,5 cm. För barn 2–5 år, bär 25 kg.", "sku": "FP-gunghast-lejon-tra", "variantId": "92bfc31f-4d56-4129-8250-3339c17bc102", "textHash": "60ce4e586a0a6063", "textTecken": 2319, "mediaSumma": 760350764, "mediaTecken": 541, "kat": ["Barn & Familj", "Leksaker & Spel", "Baby & Småbarn"]},
    {"kort": "5cdc868a", "pid": "5cdc868a-a511-4911-af69-ed8a725ccf47", "namn": "Klädställning på hjul – justerbar höjd 95–170 cm och bredd 86–160 cm, bär 25 kg", "slug": "kladstallning-hjul-justerbar-hojd-bredd", "seoTitel": "Klädställning på hjul, justerbar höjd | Fyndplats", "seoBesk": "Klädställning i rostfritt stål och plast på fyra hjul, två med broms. Höjden ställs in 95–170 cm och bredden 86–160 cm. Bär 25 kg.", "sku": "FP-kladstallning-hjul-justerbar", "variantId": "2b3da225-db54-4891-a696-a19efbf62501", "textHash": "7b1c2b8df2ea5ff5", "textTecken": 2173, "mediaSumma": 258203273, "mediaTecken": 534, "kat": ["Hem & Inredning", "Förvaring & Organisering"]},
    {"kort": "b0627017", "pid": "b0627017-e6af-45f5-b890-e11c071eabda", "namn": "Nattduksbord på hjul, tre hyllor – vitt med grå betonglook, 35 × 29,5 × 65,5 cm", "slug": "nattduksbord-hjul-tre-hyllor-vit-gra", "seoTitel": "Nattduksbord på hjul med tre hyllor | Fyndplats", "seoBesk": "Nattduksbord i vitt med grå skivor i betonglook, tre hyllor och fyra hjul, två med broms. 35 × 29,5 × 65,5 cm, varje hylla bär 10 kg.", "sku": "FP-nattduksbord-hjul-tre-hyllor", "variantId": "65403630-bedb-4e4a-9dba-eda328e5769d", "textHash": "5681941a5d2ce9f7", "textTecken": 2323, "mediaSumma": 626975627, "mediaTecken": 611, "kat": ["Hem & Inredning", "Förvaring & Organisering"]},
    {"kort": "9c456097", "pid": "9c456097-e102-465e-bdc0-f3c67c8c850a", "namn": "Skobänk i bambu med två hyllplan – sittyta som bär 130 kg, 50 × 28 × 45 cm", "slug": "skobank-bambu-tva-hyllplan", "seoTitel": "Skobänk i bambu med två hyllplan | Fyndplats", "seoBesk": "Skobänk i naturfärgad bambu med två hyllplan för skor och en sittyta som bär 130 kg. 50 × 28 × 45 cm, 5 cm fritt mot golvet.", "sku": "FP-skobank-bambu-tva-hyllplan", "variantId": "a18a5504-a3fd-41a6-a9cf-e0b9ca8b8ec7", "textHash": "88a715b6488685ad", "textTecken": 2273, "mediaSumma": 682884296, "mediaTecken": 592, "kat": ["Hem & Inredning", "Förvaring & Organisering"]},
    {"kort": "0c07eb82", "pid": "0c07eb82-7862-452a-8ae4-45486d2f48e6", "namn": "Kubhylla i svart metalltråd med sex kuber – trappform, 109 × 37 × 109 cm", "slug": "kubhylla-metalltrad-sex-kuber-svart", "seoTitel": "Kubhylla i svart metalltråd, sex kuber | Fyndplats", "seoBesk": "Kubhylla av svart metalltråd med sex öppna kuber på 35 cm som sätts ihop med kopplingar. 109 × 37 × 109 cm, bär 30 kg. Klubba ingår.", "sku": "FP-kubhylla-metalltrad-sex-kuber", "variantId": "717de34a-b96a-4dcd-9be3-97e23c87d7e0", "textHash": "0a26c324391b58e7", "textTecken": 2299, "mediaSumma": 314347136, "mediaTecken": 568, "kat": ["Hem & Inredning", "Förvaring & Organisering"]},
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
