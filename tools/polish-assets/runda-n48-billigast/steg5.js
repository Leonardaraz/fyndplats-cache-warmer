async function () {
  // Genererad av runda N48:s bygg-steg.py ur ids, namn, seo, slugs, sku, kategori, vantat-hash och media-hash — aldrig skriven av.
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
    {"kort": "127ec9c8", "pid": "127ec9c8-2bf5-4512-8fa6-ba516bbeb901", "namn": "Halloweenskelett som kryper upp ur marken, 70 cm – ljus, rörelse och ljud", "slug": "halloweenskelett-kryper-ur-marken-70-cm", "seoTitel": "Halloweenskelett som kryper upp ur marken | Fyndplats", "seoBesk": "Halloweenskelett på 70 cm som vrider huvudet, vinkar och ylar vid beröring eller ljud, med lysande ögon och mun. För inne och ute.", "sku": "FP-halloweenskelett-marken-70", "variantId": "fb42a063-fa8d-4c75-9e91-b67225720484", "textHash": "4932eca717f47cf6", "textTecken": 2212, "mediaSumma": 245589164, "mediaTecken": 496, "kat": ["Hem & Inredning", "Kalas & Fest"]},
    {"kort": "876e7e89", "pid": "876e7e89-6330-4427-9603-95ad2445de63", "namn": "Paraplyställ i svart metall – åtta paraplyer, fyra krokar och droppskål", "slug": "paraplystall-svart-metall-droppskal", "seoTitel": "Paraplyställ i svart metall med droppskål | Fyndplats", "seoBesk": "Smalt paraplyställ i svart metall, 15,5 × 15,5 × 49 cm, för upp till åtta långa paraplyer. Fyra krokar för små paraplyer och löstagbar droppskål.", "sku": "FP-paraplystall-svart-metall", "variantId": "068f4f1c-1ca5-4040-afc7-13a34b804981", "textHash": "b279a1f24d3c2347", "textTecken": 2088, "mediaSumma": 899954529, "mediaTecken": 500, "kat": ["Hem & Inredning", "Förvaring & Organisering"]},
    {"kort": "8cf7b1bb", "pid": "8cf7b1bb-2517-4a6a-96b2-8dcdc7700962", "namn": "Agilityset för hund med fyra bågar – justerbar bredd 95–114 cm och väska", "slug": "agilityset-hund-fyra-bagar", "seoTitel": "Agilityset för hund med fyra bågar | Fyndplats", "seoBesk": "Agilityset för hund med fyra bågar i orange och gult, justerbar bredd 95–114 cm och fötter som fylls med sand eller vatten. Väska ingår.", "sku": "FP-agilityset-hund-fyra-bagar", "variantId": "ddd2b773-7599-494b-9be4-ede8f3d26d0f", "textHash": "7fbb3de91493f603", "textTecken": 2011, "mediaSumma": 407685964, "mediaTecken": 310, "kat": ["Husdjur", "Lek & Tillbehör för husdjur"]},
    {"kort": "a08404ee", "pid": "a08404ee-bc2c-417c-89cc-76dd344db527", "namn": "Skyddsöverdrag för utemöbler, 275 × 205 × 90 cm – oxfordtyg med PE", "slug": "skyddsoverdrag-utemobler-275-cm", "seoTitel": "Skyddsöverdrag för utemöbler, 275 × 205 cm | Fyndplats", "seoBesk": "Skyddsöverdrag för utemöbler, 275 × 205 × 90 cm, i oxfordtyg med PE-beläggning mot regn och UV. Dragsnöre håller det på plats i lätt vind.", "sku": "FP-overdrag-utemobler-275", "variantId": "640cbd84-9f93-408e-b094-72e3df559ba6", "textHash": "71f0e131eea22a5b", "textTecken": 2103, "mediaSumma": 890917449, "mediaTecken": 408, "kat": ["Trädgård & Utemöbler", "Utemöbler"]},
    {"kort": "c031a4bc", "pid": "c031a4bc-ebd7-4e4d-b2b9-71fccfd915cd", "namn": "Förvaringspall i plisserad sammet – gräddvit med guldben, Ø40 cm", "slug": "forvaringspall-plisserad-sammet-guldben", "seoTitel": "Förvaringspall i sammet med guldben | Fyndplats", "seoBesk": "Rund förvaringspall i gräddvit plisserad sammet på guldfärgade stålben, Ø40 × 48 cm. 13,5 l förvaring och vändbart lock som blir ett bord.", "sku": "FP-forvaringspall-sammet-guld", "variantId": "e40c7b28-a735-4a23-96ae-a8b72c05baeb", "textHash": "8a8528167f2dc9df", "textTecken": 2140, "mediaSumma": 759021670, "mediaTecken": 489, "kat": ["Hem & Inredning", "Förvaring & Organisering"]},
    {"kort": "c4c404c5", "pid": "c4c404c5-5b01-4d37-8a11-cc93d22df61b", "namn": "Skräckdocka till halloween, 76 cm – rör sig, lysande ögon och röst", "slug": "skrackdocka-halloween-76-cm", "seoTitel": "Skräckdocka till halloween, 76 cm | Fyndplats", "seoBesk": "Skräckdocka till halloween på 76 cm som vrider sig, lyser med röda ögon och pratar med kuslig röst vid beröring eller ljud. För inne och ute.", "sku": "FP-halloween-docka-76", "variantId": "c8046998-cfd5-4476-bcc6-ea0393fbef1d", "textHash": "d9caced6cfdb41ca", "textTecken": 2070, "mediaSumma": 402300169, "mediaTecken": 482, "kat": ["Hem & Inredning", "Kalas & Fest"]},
    {"kort": "e03a7e2e", "pid": "e03a7e2e-3d5c-40e9-9f5b-f95a4b4fee32", "namn": "Hopfällbar växthylla i metall – tre plan och fjärilsdekor, 96 cm", "slug": "hopfallbar-vaxthylla-metall-fjarilar", "seoTitel": "Hopfällbar växthylla i metall, tre plan | Fyndplats", "seoBesk": "Hopfällbar växthylla i silvergrå metall med tre plan och fjärilsdekor, 44 × 25 × 96 cm. Bär 30 kg och kan stå både inne och ute.", "sku": "FP-vaxthylla-metall-tre-plan", "variantId": "34ddd13b-97a5-49f2-8e7c-f84831e825d8", "textHash": "35617ced2f0fd8c3", "textTecken": 1955, "mediaSumma": 536705779, "mediaTecken": 498, "kat": ["Hem & Inredning", "Trädgård & Utemöbler", "Växthus & Odling"]},
    {"kort": "fa8d498b", "pid": "fa8d498b-2e28-4eb7-8ed5-7922e7ddb718", "namn": "Blomställ i trappform med fyra plan – rustikt brun och svart, 81 cm", "slug": "blomstall-trappform-fyra-plan", "seoTitel": "Blomställ i trappform med fyra plan | Fyndplats", "seoBesk": "Blomställ i trappform för hörnet, 40 × 40 × 81 cm, med fyra plan i rustikt brunt och svart stål. Varje plan bär 20 kg.", "sku": "FP-blomstall-trappform-fyra", "variantId": "f39e51ab-eba1-4cca-8528-d3d133f8e17f", "textHash": "ca9bd94d86e814ce", "textTecken": 2026, "mediaSumma": 472828458, "mediaTecken": 514, "kat": ["Hem & Inredning", "Trädgård & Utemöbler", "Växthus & Odling"]},
    {"kort": "fca0d000", "pid": "fca0d000-c3e1-407a-a423-8df1cf087792", "namn": "Förvaringspall i vit sherpa – 33 l och vändbart lock, Ø36,5 cm", "slug": "forvaringspall-sherpa-vandbart-lock", "seoTitel": "Förvaringspall i vit sherpa med lock | Fyndplats", "seoBesk": "Rund förvaringspall i mjuk vit sherpa, Ø36,5 × 46,5 cm, med 33 l förvaring och vändbart lock som blir bricka. Bär 120 kg.", "sku": "FP-forvaringspall-sherpa-vit", "variantId": "f10ce819-c39b-41f2-b896-028119fa4a31", "textHash": "738bc640fa8dabb9", "textTecken": 2012, "mediaSumma": 293270042, "mediaTecken": 486, "kat": ["Hem & Inredning", "Förvaring & Organisering"]},
    {"kort": "0a5d10dc", "pid": "0a5d10dc-df20-4515-9178-61fbe54a2dbd", "namn": "Skjutdörrsbeslag i svart kolstål – skena 200 cm, bär 90 kg", "slug": "skjutdorrsbeslag-svart-skena-200-cm", "seoTitel": "Skjutdörrsbeslag i svart kolstål, 200 cm | Fyndplats", "seoBesk": "Skjutdörrsbeslag i svart kolstål med skena på 200 cm för dörrblad 34–40 mm. Bär 90 kg, monteringsdetaljer ingår, dörr ingår inte.", "sku": "FP-skjutdorrsbeslag-svart-200cm", "variantId": "60be01da-ecdf-42ac-803c-e987d83b663d", "textHash": "655fe70701166530", "textTecken": 2081, "mediaSumma": 564859743, "mediaTecken": 463, "kat": ["Hem & Inredning", "Verktyg & Hemmafix"]},
    {"kort": "5a6001cf", "pid": "5a6001cf-943c-42a8-8338-f85469b73477", "namn": "Gåvagn i trä med aktivitetspanel – xylofon, formsortering, från 18 månader", "slug": "gavagn-tra-montessori-aktivitetspanel", "seoTitel": "Gåvagn i trä med aktivitetspanel | Fyndplats", "seoBesk": "Gåvagn i trä med xylofon, formsortering, pärlbana och kugghjul, för barn från 18 månader. Justerbart motstånd i hjulen, 33,5 × 36 × 46,8 cm.", "sku": "FP-gavagn-tra-montessori", "variantId": "ec156686-089d-4a2a-ab23-61b51b93d877", "textHash": "38c767e57caf9881", "textTecken": 2172, "mediaSumma": 335637519, "mediaTecken": 484, "kat": ["Barn & Familj", "Baby & Småbarn", "Leksaker & Spel"]},
    {"kort": "eefbc35f", "pid": "eefbc35f-0b9d-466d-b005-5aa820148fa8", "namn": "Zombieskelett till halloween, 75 cm – rör sig, lyser och ylar", "slug": "zombieskelett-halloween-75-cm", "seoTitel": "Zombieskelett till halloween, 75 cm | Fyndplats", "seoBesk": "Zombieskelett till halloween som vrider huvudet, vinkar och ylar vid beröring eller ljud, med röda ögon och grön mun. 102 × 32 × 75 cm.", "sku": "FP-halloween-zombieskelett-75", "variantId": "e332d56e-eb96-4483-b070-eb6796297521", "textHash": "ac13c9c170f955e7", "textTecken": 2040, "mediaSumma": 513093653, "mediaTecken": 473, "kat": ["Hem & Inredning", "Kalas & Fest"]},
    {"kort": "a6a16df2", "pid": "a6a16df2-4a9b-46c1-9b19-0b60b6d9bc20", "namn": "Fotpall med svängd sits – ljusgrå teddyfleece och ben i bok", "slug": "fotpall-svangd-sits-teddyfleece", "seoTitel": "Fotpall med svängd sits och ben i bok | Fyndplats", "seoBesk": "Fotpall med svängd sits i ljusgrå teddyfleece och ben i massiv bok, 67 × 45 × 38 cm. Bär 120 kg och passar framför fåtöljen.", "sku": "FP-fotpall-svangd-ljusgra", "variantId": "03ba0c16-1610-4959-8afd-10f8e44d775d", "textHash": "56821b5a9d818017", "textTecken": 1845, "mediaSumma": 809527498, "mediaTecken": 478, "kat": ["Hem & Inredning"]},
    {"kort": "af9c163f", "pid": "af9c163f-12dc-4204-ae2e-1b52169dcd8c", "namn": "Pedalhink 20 l i mattsvart stål – mjukstängande lock och innerhink", "slug": "pedalhink-20-l-mattsvart", "seoTitel": "Pedalhink 20 l i mattsvart stål | Fyndplats", "seoBesk": "Pedalhink på 20 l i mattsvart rostfritt stål med mjukstängande lock, löstagbar innerhink och påshållare. 34,2 × 30,6 × 44,2 cm.", "sku": "FP-pedalhink-mattsvart-20l", "variantId": "4ff4e7be-f9e2-48ce-a5f8-587663f80692", "textHash": "76e2c77e941fc148", "textTecken": 1926, "mediaSumma": 925479176, "mediaTecken": 467, "kat": ["Kök & Husgeråd"]},
    {"kort": "c311e18f", "pid": "c311e18f-9fce-48ce-b890-8a6169ded050", "namn": "Gräsmattsluftare med spikvals, 45 cm – trettio piggar och långt skaft", "slug": "grasmattsluftare-spikvals-45-cm", "seoTitel": "Gräsmattsluftare med spikvals, 45 cm | Fyndplats", "seoBesk": "Gräsmattsluftare med spikvals på 150 mm och trettio piggar, arbetsbredd 45 cm. Långt skaft med T-handtag, förzinkat stål.", "sku": "FP-grasmattsluftare-45", "variantId": "116fa37a-05bb-45ee-94e9-2970298d4dca", "textHash": "055c5862353165b4", "textTecken": 1962, "mediaSumma": 160485776, "mediaTecken": 460, "kat": ["Trädgård & Utemöbler", "Trädgårdsskötsel & Bevattning"]},
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
