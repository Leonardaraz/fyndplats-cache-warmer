async function () {
  // Genererad av runda N41:s bygg-steg.py ur ids, namn, seo, slugs, sku, kategori, vantat-hash och media-hash — aldrig skriven av.
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
    {"kort": "e3256412", "pid": "e3256412-1ee1-44cb-93aa-c8125eda1e31", "namn": "Regnskydd för cykelvagn – genomskinligt, passar kupéer upp till 76 × 61 × 61 cm", "slug": "regnskydd-cykelvagn-genomskinligt", "seoTitel": "Regnskydd för cykelvagn, 76 × 61 × 61 cm | Fyndplats", "seoBesk": "Genomskinligt regnskydd i vattentät polyeten för cykelvagn för barn. Passar kupéer upp till 76 × 61 × 61 cm. Förstärkta sömmar, väger 0,5 kg.", "sku": "FP-regnskydd-cykelvagn-genomskinligt", "variantId": "839621ed-b56b-4a5f-a8c2-cb6f412cee26", "textHash": "4f77a383e2ed7de1", "textTecken": 2294, "mediaSumma": 26151250, "mediaTecken": 387, "kat": ["Sport & Fritid", "Bil & Cykel"]},
    {"kort": "3d3f90d3", "pid": "3d3f90d3-4bb3-49a4-8ab2-9e504e2afc02", "namn": "LED-björk 120 cm med 72 varmvita lampor – för inomhus och utomhus under tak", "slug": "led-bjork-120-cm-72-lampor", "seoTitel": "LED-björk 120 cm med 72 varmvita lampor | Fyndplats", "seoBesk": "Konstgjord björk på 120 cm med 72 varmvita LED-lampor och åtta böjbara grenar. För inomhus och utomhus under tak. Nätadapter och 5 m sladd.", "sku": "FP-ledbjork-120-72-lampor", "variantId": "c3225c0a-af0e-4b38-a1e8-c5dcf63ca65d", "textHash": "e04062fd7d005376", "textTecken": 2445, "mediaSumma": 984365560, "mediaTecken": 566, "kat": ["Hem & Inredning", "Belysning", "Dekoration & Prydnad"]},
    {"kort": "6baeb38b", "pid": "6baeb38b-464a-4c56-b450-45efbf212fae", "namn": "Vinställ i bambu för 16 flaskor – fyra plan, bär 75 kg, 43 × 23,5 × 38 cm", "slug": "vinstall-bambu-16-flaskor", "seoTitel": "Vinställ i bambu för 16 flaskor | Fyndplats", "seoBesk": "Fristående vinställ i lackad bambu med fyra plan för 16 flaskor. Bär 75 kg, urtag Ø8 cm, 43 × 23,5 × 38 cm. Monteras själv.", "sku": "FP-vinstall-bambu-16-flaskor", "variantId": "85d3360b-03fc-4686-a372-a7c4fde0b2db", "textHash": "25c5538a0c609039", "textTecken": 2098, "mediaSumma": 647028572, "mediaTecken": 549, "kat": ["Hem & Inredning", "Förvaring & Organisering"]},
    {"kort": "8fc578fc", "pid": "8fc578fc-cd6e-4b42-bb5a-2af7af926727", "namn": "Babygunga 3-i-1 med ryggstöd och säkerhetsbygel – rep 120–180 cm, bär 70 kg", "slug": "babygunga-3-i-1-ryggstod-sakerhetsbygel", "seoTitel": "Babygunga 3-i-1 med ryggstöd och bygel | Fyndplats", "seoBesk": "Babygunga för barn 9–36 månader med ryggstöd, säkerhetsbälte och främre bygel som går att ta av. Rep 120–180 cm, bär 70 kg, inne och ute.", "sku": "FP-babygunga-3i1-ryggstod-bygel", "variantId": "690f0ee2-4138-4fdd-acac-252c3da87b70", "textHash": "80d65708ecb9bafd", "textTecken": 2552, "mediaSumma": 88677053, "mediaTecken": 444, "kat": ["Barn & Familj", "Baby & Småbarn", "Trädgård & Utemöbler", "Utelek & Spel"]},
    {"kort": "acc9ab97", "pid": "acc9ab97-9144-4524-8cea-976cf53a4957", "namn": "Vattenkokare 1,7 liter med sju temperaturlägen 40–100 °C – 2200 W, svart", "slug": "vattenkokare-1-7-liter-temperaturval", "seoTitel": "Vattenkokare 1,7 l med sju temperaturlägen | Fyndplats", "seoBesk": "Vattenkokare på 1,7 liter och 2200 W med sju temperaturlägen 40–100 °C, varmhållning i två timmar och insida av rostfritt stål utan PTFE.", "sku": "FP-vattenkokare-17l-temperaturval", "variantId": "1d506418-cf95-46fc-b347-64d5feb9c8af", "textHash": "f6807042c8d98176", "textTecken": 2508, "mediaSumma": 708478973, "mediaTecken": 324, "kat": ["Kök & Husgeråd", "Köksmaskiner & Apparater"]},
    {"kort": "42949f67", "pid": "42949f67-2136-49c9-b5cd-b7c74080d8aa", "namn": "Halloweenspöken, tre stycken – lysande huvuden och rörelsesensor, 60 cm höga", "slug": "halloween-spoken-tre-lysande", "seoTitel": "Tre lysande spöken för halloween | Fyndplats", "seoBesk": "Halloweenpynt: tre vita spöken, 60 cm höga, med huvuden som lyser varmvitt. Rörelsesensor och knapp, 3 AA-batterier (ingår inte). Inne eller ute.", "sku": "FP-halloween-spoken-tre-lysande", "variantId": "274c192d-8943-423b-9087-dfe1c769e501", "textHash": "266e2090bf412146", "textTecken": 2331, "mediaSumma": 529403493, "mediaTecken": 505, "kat": ["Hem & Inredning", "Kalas & Fest", "Trädgård & Utemöbler", "Trädgårdsdekor & Belysning"]},
    {"kort": "5e126c2f", "pid": "5e126c2f-23bd-49cd-a7de-b5a761b3973a", "namn": "Krypande halloweenzombie 140 cm – ljud och ögon som lyser rött", "slug": "halloween-zombie-krypande-140-cm", "seoTitel": "Krypande zombie för halloween, 140 cm | Fyndplats", "seoBesk": "Halloweenpynt: krypande zombie med kusliga ljud och ögon som lyser rött, 140 × 60 × 20 cm. Vattentätt batterifack, 3 AA-batterier (ingår inte).", "sku": "FP-halloween-zombie-krypande-140", "variantId": "5143d825-ff6d-4225-9b04-f97ab2a1ff3b", "textHash": "d5979d7155522168", "textTecken": 2203, "mediaSumma": 155347314, "mediaTecken": 562, "kat": ["Hem & Inredning", "Kalas & Fest"]},
    {"kort": "050db4d8", "pid": "050db4d8-da66-4e13-b0bd-ef13c2abb3dd", "namn": "Väggdekor i metall, två tavlor – blad i svart och natur, 40 × 46 cm", "slug": "vaggdekor-metall-blad-svart-natur-tva", "seoTitel": "Väggdekor i metall, två tavlor med blad | Fyndplats", "seoBesk": "Två väggtavlor med blad i svart järn och naturfärgad MDF, 40 × 46 cm var och 30 mm djupa. Krokar och monteringsmaterial ingår.", "sku": "FP-vaggdekor-metall-blad-tva", "variantId": "9d109e09-b447-4b0a-93ee-20a16f42d855", "textHash": "e805d4ce30d778cf", "textTecken": 2021, "mediaSumma": 346796202, "mediaTecken": 553, "kat": ["Hem & Inredning", "Dekoration & Prydnad"]},
    {"kort": "1c92e587", "pid": "1c92e587-3c14-49af-bf37-1b3efe4431bf", "namn": "Balanscykel med tre hjul för 12–36 månader – tysta EVA-hjul, sitthöjd 26,5 cm", "slug": "balanscykel-tre-hjul-12-36-manader", "seoTitel": "Balanscykel med tre hjul, 12–36 månader | Fyndplats", "seoBesk": "Balanscykel utan pedaler för barn 12–36 månader. Ett hjul fram och två bak, styre som vrids högst 30 grader, tysta EVA-hjul. Sitthöjd 26,5 cm.", "sku": "FP-balanscykel-tre-hjul-12-36", "variantId": "517dc825-fcea-4d63-a278-4ccc8d2ab9f4", "textHash": "cf52fc9adad18b7b", "textTecken": 2433, "mediaSumma": 590705588, "mediaTecken": 430, "kat": ["Barn & Familj", "Leksaker & Spel", "Baby & Småbarn"]},
    {"kort": "1f887213", "pid": "1f887213-5574-4b53-9b7e-19d017afa754", "namn": "Vit julgran 180 cm i smal modell – 390 grentoppar, fot som viks ihop", "slug": "vit-julgran-180-cm-smal", "seoTitel": "Vit julgran 180 cm, smal modell | Fyndplats", "seoBesk": "Vit konstgjord julgran, 180 cm hög och Ø55 cm, med 390 grentoppar. Foten tas av och viks ihop för förvaring. Pynt ingår inte.", "sku": "FP-julgran-vit-180-smal", "variantId": "469de42c-19aa-456e-a7e2-3bb5e8e8d71d", "textHash": "d67e1f209beafb51", "textTecken": 2021, "mediaSumma": 292554550, "mediaTecken": 535, "kat": ["Hem & Inredning", "Dekoration & Prydnad"]},
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
