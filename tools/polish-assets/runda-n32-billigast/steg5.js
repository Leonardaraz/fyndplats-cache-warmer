async function () {
  // Genererad ur rundans filer (ids, namn, seo, slugs, sku, vantat-hash, media-hash) — aldrig skriven av.
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
    {"kort": "40fb1b24", "pid": "40fb1b24-d4d6-429c-8cbb-012d38678166", "namn": "Elkamin för vägg 89,2 cm med välvd glasfront – 2000 W och 7 ljusfärger", "slug": "elkamin-vagg-89-cm-valvd-glasfront", "seoTitel": "Elkamin för vägg 89,2 cm, 2000 W | Fyndplats", "seoBesk": "Väggmonterad elkamin 89,2 × 13,5 × 48 cm med välvd glasfront, LED-låga och värme 1000/2000 W. Bakgrundsljus i 7 färger. Snabb leverans från Fyndplats.", "sku": "FP-elkamin-vagg-89-cm", "textHash": "a0c8684ad27a2024", "textTecken": 3716, "mediaSumma": 881445969, "mediaTecken": 549, "kat": ["Hem & Inredning", "Dekoration & Prydnad", "Hushållsapparater"]},
    {"kort": "c6f8a0f1", "pid": "c6f8a0f1-b5b6-4b72-9499-abe6b797ba2d", "namn": "Renfamilj med LED i tre delar – 283 lysdioder och röda rosetter, 134 cm", "slug": "renfamilj-led-tre-delar-134-cm", "seoTitel": "Renfamilj med LED, tre delar, 134 cm | Fyndplats", "seoBesk": "Tre upplysta renar på 134, 112 och 70 cm med 283 varmvita lysdioder och röda rosetter. Klassad IP44, 12 markspett ingår. Snabb leverans från Fyndplats.", "sku": "FP-renfamilj-led-134-cm", "textHash": "9573bace3b7393eb", "textTecken": 3908, "mediaSumma": 805212707, "mediaTecken": 434, "kat": ["Hem & Inredning", "Dekoration & Prydnad", "Trädgård & Utemöbler", "Trädgårdsdekor & Belysning"]},
    {"kort": "8f95113c", "pid": "8f95113c-33b4-4de1-afc7-44517fffcc3e", "namn": "Madrass 140 × 200 cm, 20 cm hög – gelmemoryskum och avtagbart överdrag", "slug": "madrass-140x200-cm-gelmemoryskum", "seoTitel": "Madrass 140 × 200 cm med gelskum | Fyndplats", "seoBesk": "Medelfast madrass 140 × 200 × 20 cm med 4 cm gelmemoryskum på 16 cm basskum. Avtagbart överdrag, halkskyddad undersida. Snabb leverans från Fyndplats.", "sku": "FP-madrass-140x200-20-cm", "textHash": "2f8235f2007732d7", "textTecken": 3836, "mediaSumma": 726827812, "mediaTecken": 320, "kat": ["Hem & Inredning"]},
    {"kort": "41b2bc81", "pid": "41b2bc81-592e-4539-ad28-6983fd25f205", "namn": "Matstolar 2-pack i linnelook – ben i gummiträ, sitthöjd 48 cm", "slug": "matstolar-2-pack-linnelook-gummitra", "seoTitel": "Matstolar 2-pack i linnelook | Fyndplats", "seoBesk": "Två matstolar 46 × 52 × 76 cm i krämfärgad linnelook med ben i massivt gummiträ. Sitthöjd 48 cm, bär 120 kg. Snabb leverans från Fyndplats.", "sku": "FP-matstolar-linnelook-2-pack", "textHash": "48ecf8e4cf80606a", "textTecken": 3123, "mediaSumma": 509425288, "mediaTecken": 332, "kat": ["Hem & Inredning"]},
    {"kort": "6ab7b3b0", "pid": "6ab7b3b0-f67d-4f31-a2f9-b820c4ad86b6", "namn": "Motionscykel med magnetmotstånd i 8 steg – Bluetooth, sadel 65–91 cm", "slug": "motionscykel-magnetmotstand-8-steg", "seoTitel": "Motionscykel med magnetmotstånd | Fyndplats", "seoBesk": "Motionscykel 86 × 51 × 128 cm med 8 steg magnetmotstånd, remdrift och Bluetooth. Sadel 65–91 cm, bär 120 kg. Snabb leverans från Fyndplats.", "sku": "FP-motionscykel-8-steg", "textHash": "6c21627362958fd1", "textTecken": 3689, "mediaSumma": 689111046, "mediaTecken": 532, "kat": ["Sport & Fritid", "Träning & Gym"]},
    {"kort": "b42b4802", "pid": "b42b4802-508d-4a7e-af8a-d0bc08b49e07", "namn": "Skrivbord som vrids 360° – hörnbord, rakt eller ihopvridet, med förvaring", "slug": "skrivbord-vridbart-360-forvaring", "seoTitel": "Vridbart skrivbord med förvaring | Fyndplats", "seoBesk": "Skrivbord med skiva som vrids 360°: hörnbord 105 × 85 cm, rakt 150 cm eller 100 × 40 cm. Två skåp och två fack. Snabb leverans från Fyndplats.", "sku": "FP-skrivbord-vridbart-360", "textHash": "99aa75d8b15f9342", "textTecken": 3771, "mediaSumma": 693257782, "mediaTecken": 477, "kat": ["Elektronik & Tillbehör", "Dator & Gaming"]},
    {"kort": "2808fff3", "pid": "2808fff3-6d80-43e1-9be4-abecf7c9fe7c", "namn": "TV-bänk 120 cm med två skjutdörrar – rustik brun, för tv upp till 60 tum", "slug": "tv-bank-120-cm-skjutdorrar-rustik", "seoTitel": "TV-bänk 120 cm med skjutdörrar | Fyndplats", "seoBesk": "Rustik tv-bänk 120 × 40 × 54 cm med två skjutdörrar på svart skena, 6 fack och 6 kabelhål. För tv upp till 60 tum. Snabb leverans från Fyndplats.", "sku": "FP-tv-bank-120-skjutdorrar", "textHash": "f48fec78f3068f3a", "textTecken": 3533, "mediaSumma": 211955632, "mediaTecken": 558, "kat": ["Hem & Inredning", "Förvaring & Organisering"]},
    {"kort": "db1d494f", "pid": "db1d494f-0fc9-444a-b8ad-7e5c91391e6a", "namn": "Basketkorg för väggmontering 110 × 75 cm – fjädrande ring Ø45 cm", "slug": "basketkorg-vaggmontering-110-cm-fjadrande", "seoTitel": "Basketkorg för vägg 110 × 75 cm | Fyndplats", "seoBesk": "Basketkorg för väggmontering med 110 × 75 cm ryggskiva, fjädrande ring Ø45 cm och rivtåligt nät. Betong, tegel eller trä. Snabb leverans från Fyndplats.", "sku": "FP-basketkorg-vagg-110-cm", "textHash": "386b53fa32aef746", "textTecken": 3044, "mediaSumma": 7111469, "mediaTecken": 557, "kat": ["Trädgård & Utemöbler", "Utelek & Spel"]}
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
      variantId: vs.length === 1 ? vs[0].id : null,
      pris: vs.length === 1 ? ((vs[0].price || {}).actualPrice || {}).amount : null
    };
    rad.ALLT = rad.text && rad.namn && rad.slug && rad.visible && rad.seo && rad.media && rad.kat && rad.sku && rad.variantVisible;
    ut.push(rad);
  }
  const ok = ut.filter(function (x) { return x.ALLT; }).length;
  return { rader: ut, SAMMANFATTNING: ok + " av " + ut.length + " helt verifierade" };
}
