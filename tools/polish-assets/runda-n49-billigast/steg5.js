async function () {
  // Genererad av runda N49:s bygg-steg.py ur ids, namn, seo, slugs, sku, kategori, vantat-hash och media-hash — aldrig skriven av.
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
    {"kort": "115d3831", "pid": "115d3831-2ca2-4b50-9d32-8e9736a84d0a", "namn": "Springcykel i trä för barn 3–5 år – justerbar sadel och tysta EVA-hjul", "slug": "springcykel-tra-barn-justerbar-sadel", "seoTitel": "Springcykel i trä för barn 3–5 år | Fyndplats", "seoBesk": "Springcykel i trä för barn 3–5 år med sadelhöjd 38,5–41,5 cm, sadel i PU-läder och tysta EVA-hjul på Ø27,5 cm. Bär 50 kg.", "sku": "FP-springcykel-tra-ljusbla", "variantId": "b3527114-c8c3-4a50-a550-c125b2b6b0d0", "textHash": "579181a6097bb9e5", "textTecken": 2071, "mediaSumma": 708794743, "mediaTecken": 422, "kat": ["Barn & Familj", "Leksaker & Spel"]},
    {"kort": "5eb079d2", "pid": "5eb079d2-4018-43a4-8b1a-dec5cbb2e48d", "namn": "Rund förvaringspall i beige tyg med juteyta – 19 l och lock som blir bord", "slug": "rund-forvaringspall-juteyta-bordslock", "seoTitel": "Rund förvaringspall med lock som blir bord | Fyndplats", "seoBesk": "Rund förvaringspall i beige tyg med juteyta, Ø38,5 × 33,5 cm, med 19 l förvaring och vändbart lock med träyta. Bär 120 kg.", "sku": "FP-forvaringspall-jute-beige", "variantId": "78758545-d653-46dd-8436-e06e49898a7e", "textHash": "cc7921626a1e89c5", "textTecken": 2117, "mediaSumma": 709681583, "mediaTecken": 573, "kat": ["Hem & Inredning", "Förvaring & Organisering"]},
    {"kort": "0dff6d43", "pid": "0dff6d43-4deb-47d2-a7a3-3b43e1b64cb5", "namn": "Pokerset med 500 marker i aluminiumväska – kortlekar, tärningar och dealerknapp", "slug": "pokerset-aluminiumvaska-kortlekar-marker", "seoTitel": "Pokerset med 500 marker i aluminiumväska | Fyndplats", "seoBesk": "Pokerset med 500 marker i fem färger, två kortlekar, fem tärningar och dealerknapp i en låsbar aluminiumväska på 55,5 × 22 × 6,5 cm.", "sku": "FP-pokerset-aluminiumvaska", "variantId": "8eb02fdc-b356-480a-a080-5ad3fdce2172", "textHash": "127f4ff97bb66b35", "textTecken": 2157, "mediaSumma": 960837296, "mediaTecken": 474, "kat": ["Sport & Fritid"]},
    {"kort": "12c11f43", "pid": "12c11f43-1791-4828-8463-d4ef2abd9f25", "namn": "Pall i fransk lantstil – stoppad sits i beige tyg och ram i gummiträ", "slug": "pall-fransk-lantstil-beige", "seoTitel": "Pall i fransk lantstil med stoppad sits | Fyndplats", "seoBesk": "Pall i fransk lantstil med stoppad sits i beige tyg, snidade rosetter och ram i gummiträ, 42 × 32 × 46,5 cm. Bär 120 kg.", "sku": "FP-pall-fransk-lantstil-beige", "variantId": "e58b3b33-cf19-460e-9786-5e66e957d28d", "textHash": "dab3125d7f73fe34", "textTecken": 1918, "mediaSumma": 569119909, "mediaTecken": 499, "kat": ["Hem & Inredning"]},
    {"kort": "4c8d9de4", "pid": "4c8d9de4-fd02-4879-a248-e4bb444980c3", "namn": "Smal konstgjord julgran 183 cm med konstsnö – 479 grenspetsar och stålfot", "slug": "smal-julgran-med-konstsno-183-cm", "seoTitel": "Smal konstgjord julgran 183 cm med konstsnö | Fyndplats", "seoBesk": "Smal konstgjord julgran på 183 cm med konstsnö, 479 grenspetsar och flamskyddade grenar. Ø65 cm, fot av stål och tre delar.", "sku": "FP-smal-julgran-konstsno", "variantId": "3933519a-9ed1-411b-bcb5-035fb952ad74", "textHash": "eb1ae9b93021223f", "textTecken": 1790, "mediaSumma": 525911978, "mediaTecken": 505, "kat": ["Hem & Inredning", "Dekoration & Prydnad"]},
    {"kort": "63a725ab", "pid": "63a725ab-9224-41b7-8e35-c1fe1a2aa5fc", "namn": "Golvlampa i guld med tygskärm – fjärrkontroll, 11 ljuslägen och fotbrytare", "slug": "golvlampa-guld-tygskarm-fjarrkontroll", "seoTitel": "Golvlampa i guld med fjärrkontroll | Fyndplats", "seoBesk": "Golvlampa i guld med tygskärm, 11 steg för ljusstyrka och färgtemperatur, fotbrytare och fjärrkontroll med magnetfäste. 159,6 cm hög.", "sku": "FP-golvlampa-guld-fjarrkontroll", "variantId": "0647c4f8-92a6-4662-96a8-00378d00d2b4", "textHash": "9a9194a8a0d7cbdf", "textTecken": 2466, "mediaSumma": 341534348, "mediaTecken": 525, "kat": ["Hem & Inredning", "Belysning"]},
    {"kort": "7720d168", "pid": "7720d168-8e4d-4391-bd54-15f33ab87191", "namn": "Lekkök för barn 3–6 år med 92 delar – ljud, ljus, ångeffekt och vattenkran", "slug": "lekkok-barn-92-delar-vattenkran", "seoTitel": "Lekkök för barn med 92 delar | Fyndplats", "seoBesk": "Lekkök för barn 3–6 år med 92 tillbehör, ljus, ljud, ångeffekt och en kran som ger vatten. 44,5 × 24 × 79 cm, arbetshöjd 41 cm.", "sku": "FP-lekkok-92-delar-mintgron", "variantId": "58b03b97-c522-4a7e-b006-6a0dce6bb073", "textHash": "9e68baf0c66f52f2", "textTecken": 2173, "mediaSumma": 164582039, "mediaTecken": 428, "kat": ["Barn & Familj", "Leksaker & Spel"]},
    {"kort": "8382289b", "pid": "8382289b-0e16-463b-a09e-17fa2bd242b5", "namn": "Hopfällbart blomställ med sex runda hyllor – svart metall, 80 cm", "slug": "hopfallbart-blomstall-sex-runda-hyllor", "seoTitel": "Hopfällbart blomställ med sex hyllor | Fyndplats", "seoBesk": "Hopfällbart blomställ i svart metall med sex runda hyllor på olika höjd, 60 × 40 × 80 cm. Varje hylla bär 20 kg, för inne och ute.", "sku": "FP-blomstall-sex-runda-hyllor", "variantId": "cf4924fd-7091-4562-a36c-eff5f961c405", "textHash": "7c5e8ad984f0ae78", "textTecken": 1929, "mediaSumma": 638314989, "mediaTecken": 502, "kat": ["Hem & Inredning", "Trädgård & Utemöbler", "Växthus & Odling"]},
    {"kort": "875ca38b", "pid": "875ca38b-a1fc-4fc2-979c-36dc2033b107", "namn": "Vinhylla för väggen – åtta flaskor i svart stålrör, 93,5 cm", "slug": "vinhylla-vagg-atta-flaskor-svart", "seoTitel": "Vinhylla för väggen, åtta flaskor | Fyndplats", "seoBesk": "Vinhylla i svart stålrör för väggen, 27 × 10 × 93,5 cm, med plats för åtta liggande flaskor. Bär 16 kg totalt och 2 kg per plan.", "sku": "FP-vinhylla-vagg-atta-flaskor", "variantId": "5ba56d80-b856-425f-b4dd-26f791755ea5", "textHash": "f798c35b4f904f47", "textTecken": 1779, "mediaSumma": 945868630, "mediaTecken": 494, "kat": ["Kök & Husgeråd", "Servering & Glas"]},
    {"kort": "96451d83", "pid": "96451d83-733f-4ade-bc8d-e02b4f8fb9cc", "namn": "Rutschkana för småbarn formad som en giraff – basketkorg och boll, 1–3 år", "slug": "rutschkana-giraff-basketkorg-smabarn", "seoTitel": "Rutschkana för småbarn formad som giraff | Fyndplats", "seoBesk": "Rutschkana för barn 1–3 år formad som en giraff, med basketkorg och boll, halkfria steg och handtag. 106 × 51,5 × 52 cm, bär 30 kg.", "sku": "FP-rutschkana-giraff-bla", "variantId": "0cf469ba-3ee8-4127-a150-27579ff80872", "textHash": "29d5634893381cc7", "textTecken": 1906, "mediaSumma": 898075497, "mediaTecken": 521, "kat": ["Barn & Familj", "Baby & Småbarn", "Leksaker & Spel"]},
    {"kort": "b69e5b38", "pid": "b69e5b38-0903-4e32-871d-84df5dd899a1", "namn": "Blomställ i trappform med tre plan – svart metall med gallerhyllor, 75 cm", "slug": "blomstall-trappform-tre-plan-galler", "seoTitel": "Blomställ i trappform med tre plan | Fyndplats", "seoBesk": "Blomställ i trappform i svart metall med tre gallerhyllor, 75 × 70 × 66 cm. Bär 75 kg totalt och 25 kg per plan, för inne och ute.", "sku": "FP-blomstall-trappform-tre-plan", "variantId": "85711c82-f1af-493d-9bbb-288d2cdb2b1c", "textHash": "6414a4d1916f65c7", "textTecken": 1953, "mediaSumma": 722647553, "mediaTecken": 526, "kat": ["Hem & Inredning", "Trädgård & Utemöbler", "Växthus & Odling"]},
    {"kort": "cc7ab001", "pid": "cc7ab001-a015-4640-89c6-de69e41dd546", "namn": "Agilityset för hund i tre delar – hinder, slalom och ring med väska", "slug": "agilityset-hund-hinder-slalom-ring", "seoTitel": "Agilityset för hund med hinder och ring | Fyndplats", "seoBesk": "Agilityset för hund med hinder på 9–100 cm, ring, sex slalomkäppar och bärväska. Fötterna fylls med vatten för stadga.", "sku": "FP-agilityset-hund-tre-delar", "variantId": "8a264906-41e4-458c-a209-5d5227f2467b", "textHash": "51d63ddcf5520847", "textTecken": 2093, "mediaSumma": 356824293, "mediaTecken": 511, "kat": ["Husdjur", "Lek & Tillbehör för husdjur"]},
    {"kort": "ce59dcf5", "pid": "ce59dcf5-f188-4d89-8633-a17a66915f02", "namn": "Bambuhylla med fyra plan – för badrum, kök eller vardagsrum, 112 cm", "slug": "bambuhylla-fyra-plan-badrum", "seoTitel": "Bambuhylla med fyra plan | Fyndplats", "seoBesk": "Hylla i bambu med fyra öppna plan, 62 × 33 × 112 cm, för badrum, kök eller vardagsrum. Bär 10 kg per plan och 40 kg totalt.", "sku": "FP-bambuhylla-fyra-plan", "variantId": "4bc7c7f3-2935-499c-9d60-b69234e4872b", "textHash": "20a66c618330f242", "textTecken": 2013, "mediaSumma": 413295647, "mediaTecken": 490, "kat": ["Hem & Inredning", "Förvaring & Organisering", "Badrum & Hemtextil"]},
    {"kort": "f0817bea", "pid": "f0817bea-845b-454a-bf32-8e91ceda1c9c", "namn": "Julby i trä med 20 LED – vinterlandskap med hus, barn och lyktor, 45 cm", "slug": "julby-tra-20-led-vinterlandskap", "seoTitel": "Julby i trä med 20 LED | Fyndplats", "seoBesk": "Upplyst julby i trä med snöiga granar, hus, lekande barn och lyktor, 45 × 12 × 30 cm. 20 LED som drivs med två AA-batterier.", "sku": "FP-julby-tra-20-led", "variantId": "6ea42a09-5dfd-4bd1-ad38-3463f72b52ed", "textHash": "54b1bfea31e39b1e", "textTecken": 1794, "mediaSumma": 750380222, "mediaTecken": 482, "kat": ["Hem & Inredning", "Dekoration & Prydnad"]},
    {"kort": "e0d0d880", "pid": "e0d0d880-9121-4682-8fc3-81c2bb603b16", "namn": "Pedalhink 20 l i gräddvitt – mjukstängande lock som kan stå öppet", "slug": "pedalhink-20-l-gradvit", "seoTitel": "Pedalhink 20 l i gräddvitt | Fyndplats", "seoBesk": "Pedalhink på 20 l i gräddvit metall med mjukstängande lock som kan stå öppet, löstagbar innerhink och hål som håller påsen. 36 × 30 × 44,5 cm.", "sku": "FP-pedalhink-gradvit-20l", "variantId": "28b8a1ea-f762-442a-928e-d5571922ed98", "textHash": "45fd2282329dfd77", "textTecken": 1770, "mediaSumma": 391253575, "mediaTecken": 480, "kat": ["Kök & Husgeråd"]},
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
