async function () {
  // Genererad av runda N35:s bygg-steg.py ur ids, namn, seo, slugs, sku, kategori, vantat-hash och media-hash — aldrig skriven av.
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
    {"kort": "8a076c08", "pid": "8a076c08-9287-4f7e-8dab-ed9735d60209", "namn": "Barstolar 2-pack i konstläder – svarta, snurrbara, sitthöjd 68 cm", "slug": "barstolar-konstlader-2-pack-68-cm", "seoTitel": "Barstolar 2-pack i konstläder | Fyndplats", "seoBesk": "Svarta barstolar 2-pack i konstläder, 47 × 54,5 × 97,5 cm, vridbara 360° och sitthöjd 68 cm. Bär 120 kg. Snabb leverans från Fyndplats.", "sku": "FP-barstolar-konstlader-2-pack", "variantId": "1c0ec192-9bf5-4a3c-a823-d64e4136a483", "textHash": "623353612be5f5ed", "textTecken": 2579, "mediaSumma": 602499222, "mediaTecken": 450, "kat": ["Hem & Inredning"]},
    {"kort": "b28e1cbe", "pid": "b28e1cbe-fb7f-4866-abfd-5786f34bb596", "namn": "Barnsoffa i jordgubbsdesign – rosa, med två kuddar, 90 cm", "slug": "barnsoffa-jordgubbsdesign-90-cm", "seoTitel": "Barnsoffa i jordgubbsdesign | Fyndplats", "seoBesk": "Rosa barnsoffa 90 × 53 × 48 cm i jordgubbsdesign med två mjuka kuddar och stomme i trä. Bär 60 kg. Snabb leverans från Fyndplats.", "sku": "FP-barnsoffa-jordgubbe", "variantId": "15ce1c5f-f4da-46eb-8dc4-4f8379e13741", "textHash": "9398988de403dd42", "textTecken": 2559, "mediaSumma": 491091524, "mediaTecken": 512, "kat": ["Barn & Familj", "Hem & Inredning"]},
    {"kort": "1bc0c04e", "pid": "1bc0c04e-4e8d-4daa-9f38-be92490afb0b", "namn": "Klätterställning 5-i-1 för barn – gunga, rutschkana och klätternät", "slug": "klatterstallning-5-i-1-barn", "seoTitel": "Klätterställning 5-i-1 för barn | Fyndplats", "seoBesk": "Klätterställning i trä med gunga, rutschkana, klätternät och basketkorg. Hopfällbar, 140 × 133 × 43 cm, bär 50 kg. Rekommenderad ålder 3–6 år.", "sku": "FP-klatterstallning-5-i-1", "variantId": "e3917de0-bda8-4b98-96b2-e7d894764826", "textHash": "fc126cedc4674b0f", "textTecken": 2763, "mediaSumma": 744086082, "mediaTecken": 435, "kat": ["Barn & Familj", "Leksaker & Spel"]},
    {"kort": "69513a61", "pid": "69513a61-9e15-429f-9a28-2d31d2a86a2b", "namn": "Gungbänk 3-sits för trädgård och balkong – svart, nätklädsel", "slug": "gungbank-3-sits-tradgard-balkong", "seoTitel": "Gungbänk 3-sits för trädgården | Fyndplats", "seoBesk": "Svart gungbänk 147 × 70 × 85 cm i stål med andningsbar nätklädsel, plats för tre personer. Bär 300 kg. Snabb leverans från Fyndplats.", "sku": "FP-gungbank-3-sits-tradgard", "variantId": "5aa897e9-2467-47e7-873c-ea5c681b356e", "textHash": "509cdb7fc8b892c1", "textTecken": 2401, "mediaSumma": 405185050, "mediaTecken": 385, "kat": ["Utemöbler"]},
    {"kort": "3847b7ba", "pid": "3847b7ba-85cc-4c3e-9257-4e159809064d", "namn": "Tvåsitssoffa 115 cm i linnelook – grå, ram i gummiträ", "slug": "tvasitssoffa-115-cm-linnelook-gra", "seoTitel": "Tvåsitssoffa 115 cm i linnelook | Fyndplats", "seoBesk": "Grå tvåsitssoffa 115 × 66,5 × 73 cm i linnelook med knapptuftad rygg och ram i gummiträ. Bär 240 kg. Snabb leverans från Fyndplats.", "sku": "FP-tvasitssoffa-115-cm-gra", "variantId": "a3b43040-7d13-49e6-aae3-a9cd2170fdb2", "textHash": "0160ae0faf78927b", "textTecken": 2219, "mediaSumma": 197776925, "mediaTecken": 487, "kat": ["Hem & Inredning"]},
    {"kort": "965ba956", "pid": "965ba956-907e-4cf6-ae37-4bba05db730d", "namn": "Elkamin i konsolmodell med 9 lågfärger – vit, 1800 W", "slug": "elkamin-konsol-9-lagfarger-vit", "seoTitel": "Elkamin i konsolmodell, 9 färger | Fyndplats", "seoBesk": "Vit elkamin 62,5 × 20 × 72,5 cm med 1800 W, nio lågfärger, termostat 17–27 °C och öppen hylla för ved. Snabb leverans från Fyndplats.", "sku": "FP-elkamin-konsol-9-farger", "variantId": "d469c862-6dd0-47bb-ada9-39f3510dbe1b", "textHash": "6f0e8baba6c1095f", "textTecken": 2649, "mediaSumma": 739497741, "mediaTecken": 479, "kat": ["Hushållsapparater", "Dekoration & Prydnad"]},
    {"kort": "c4d8cb93", "pid": "c4d8cb93-732d-4ba5-9d37-77bd165e4a53", "namn": "Köksskåp 170 cm i lantstil – vitt, med öppen mellanhylla", "slug": "koksskap-170-cm-lantstil-vitt", "seoTitel": "Köksskåp 170 cm i lantstil | Fyndplats", "seoBesk": "Vitt köksskåp 70 × 40 × 170 cm i lantstil med två skåp, öppen mellanhylla och svarta metallhandtag. Bär 60 kg. Snabb leverans.", "sku": "FP-koksskap-lantstil-170-cm", "variantId": "7300490a-d7b3-467b-9062-c1bf4e00b546", "textHash": "6dbf0d10d445f9bb", "textTecken": 2581, "mediaSumma": 498997569, "mediaTecken": 499, "kat": ["Hem & Inredning", "Förvaring & Organisering"]},
    {"kort": "093aedd2", "pid": "093aedd2-bd79-4bfa-8195-18ee97156187", "namn": "Konstväxt cypress 2-pack, spiralformad – 120 cm med kruka", "slug": "konstvaxt-cypress-2-pack-120-cm", "seoTitel": "Konstväxt cypress 2-pack, 120 cm | Fyndplats", "seoBesk": "Två spiralformade konstväxter, 120 cm höga, med cementfyllda krukor för stabilitet. Underhållsfria. Snabb leverans från Fyndplats.", "sku": "FP-konstvaxt-cypress-2-pack", "variantId": "f619ff57-0383-42ec-8c44-4e1acff5c36a", "textHash": "962874ea75b2fbfc", "textTecken": 2393, "mediaSumma": 72673032, "mediaTecken": 483, "kat": ["Dekoration & Prydnad", "Trädgårdsdekor & Belysning"]},
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
