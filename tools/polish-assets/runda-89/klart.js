async () => {
  const SITE = "e6d27e90-4749-4720-9afe-0bbe91c1b3d3";
  const APP  = "215238eb-22a5-4c36-9e7b-e7c08025e04e";
  const RADER = [{"kort": "c4375606", "id": "c4375606-60f2-4d79-b577-232e4521e335", "slug": "sparkcykel-barn-143-cm-16-tum-svart", "name": "Sparkcykel barn 143 cm i svart – 16 tum fram och bak, V-bromsar", "title": "Sparkcykel barn 143 cm, svart | Fyndplats", "meta": "Svart sparkcykel 143 cm med 16-tumshjul och luftdäck fram och bak, V-broms på båda hjulen och styre 92–100 cm. Maxlast 100 kg.", "langd": 3735, "hash": 681345393, "sku": "FP-sparkcykel-143-cm-svart", "variantId": "bb18fb6c-4f70-4caf-85d1-6d1ce3d53771", "kortFil": "b379ce_9e96deaf86e043eebabd0f55860c1156~mv2.jpg", "antalBilder": 5}, {"kort": "79186373", "id": "79186373-24e1-41cd-84ea-e7908c0a851d", "slug": "sparkcykel-barn-143-cm-16-tum-rosa", "name": "Sparkcykel barn 143 cm i rosa – 16 tum fram och bak, V-bromsar", "title": "Sparkcykel barn 143 cm, rosa | Fyndplats", "meta": "Rosa sparkcykel 143 cm med 16-tumshjul och luftdäck fram och bak, V-broms på båda hjulen och styre 92–100 cm. Maxlast 100 kg.", "langd": 3750, "hash": 604014425, "sku": "FP-sparkcykel-143-cm-rosa", "variantId": "bd3585c8-440a-43f1-a2b2-5155848ea21b", "kortFil": "b379ce_be6f2863117a45598992e52a11d1e4f5~mv2.jpg", "antalBilder": 6}, {"kort": "479e9c2e", "id": "479e9c2e-2fbc-448f-8d44-2f31ad5bedbe", "slug": "sparkcykel-barn-120-cm-lagt-styre-svart", "name": "Sparkcykel barn 120 cm med lågt styre, svart och röd – 100 kg", "title": "Sparkcykel barn 120 cm, svart och röd | Fyndplats", "meta": "Svart sparkcykel 120 cm med röd framgaffel, Ø12-tumshjul med luftdäck, broms på båda hjulen och styre 75–80 cm. Maxlast 100 kg, väger 8,2 kg.", "langd": 3494, "hash": 742253818, "sku": "FP-sparkcykel-120-cm-svart", "variantId": "a92d9a34-843b-4e0c-b0c4-0c3e9db64e4d", "kortFil": "b379ce_741495d5c1684b6b9bdb23a0d4dae313~mv2.jpg", "antalBilder": 6}, {"kort": "d9239c8e", "id": "d9239c8e-dba1-40d4-940f-fb4f9121954f", "slug": "sparkcykel-barn-120-cm-lagt-styre-turkos", "name": "Sparkcykel barn 120 cm med lågt styre, turkos – 100 kg", "title": "Sparkcykel barn 120 cm, turkos | Fyndplats", "meta": "Turkos sparkcykel 120 cm med Ø12-tumshjul och luftdäck, broms på båda hjulen och styre 75–80 cm. Maxlast 100 kg, väger 8,2 kg.", "langd": 3559, "hash": 551941511, "sku": "FP-sparkcykel-120-cm-turkos", "variantId": "23467568-f2dd-4be2-9a97-80eaa13d7ea2", "kortFil": "b379ce_55131b2da67a4a98ac210919f0cc14c1~mv2.jpg", "antalBilder": 6}, {"kort": "4fd26086", "id": "4fd26086-5b60-4b27-b2ff-8b3377527cd8", "slug": "sparkcykel-barn-stort-framhjul-orange", "name": "Sparkcykel barn med stort framhjul Ø41 cm, orange – broms på båda hjulen", "title": "Sparkcykel barn med stort framhjul, orange | Fyndplats", "meta": "Orange sparkcykel 135 cm med framhjul Ø41 cm och bakhjul Ø30 cm, luftdäck, broms på båda hjulen och styre 88–94 cm. Maxlast 100 kg.", "langd": 3603, "hash": 114681705, "sku": "FP-sparkcykel-framhjul-orange", "variantId": "07bdc936-5dfe-4d9b-967d-3aeb4aa67288", "kortFil": "b379ce_24721b0d2fee4ba9bfeb242f33f5a978~mv2.jpg", "antalBilder": 6}, {"kort": "89deaca7", "id": "89deaca7-0619-4693-9573-176dd97952bb", "slug": "sparkcykel-barn-stort-framhjul-turkos", "name": "Sparkcykel barn med stort framhjul Ø41 cm, turkos – broms på båda hjulen", "title": "Sparkcykel barn med stort framhjul, turkos | Fyndplats", "meta": "Turkos sparkcykel 135 cm med framhjul Ø41 cm och bakhjul Ø30 cm, luftdäck, broms på båda hjulen och styre 88–94 cm. Maxlast 100 kg.", "langd": 3613, "hash": 669258976, "sku": "FP-sparkcykel-framhjul-turkos", "variantId": "fae53e77-dd1d-4d67-9254-dc273fa0e812", "kortFil": "b379ce_38a2fa3caffc4843a66b77621bb130d3~mv2.jpg", "antalBilder": 6}];
  const synlig = (h) => h.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
  const hasha = (s) => { let h = 0; for (const c of s) h = (h * 31 + c.codePointAt(0)) % 1000000007; return h; };
  const TYSKA = new RegExp("(?:pulverbeschichtung|h\u00f6henverstellbar|kinderscooter|luftbereifung|fu\u00dfballdesign|rostbest\u00e4ndig|kinderroller|becherhalter|kickscooter|schutzblech|gummireifen|geschwister|bremssystem|tretroller|kickroller|cityroller|trittbrett|belastbar|hinterrad|fu\u00dfst\u00fctze|vorderrad|fahrspa\u00df|st\u00e4nder|gestell|lenker|bremse|reifen|korb)|(?<![\\w\u00e5\u00e4\u00f6\u00c5\u00c4\u00d6])(?:esszimmerstuhl|liegefunktion|belastbarkeit|artikelnummer|freischwinger|birkenfurnier|lieferumfang|massagestuhl|knopfheftung|r\u00fcckenlehne|ruckenlehne|schaumstoff|abmessungen|gesamtmasse|verstellbar|sitzfl\u00e4che|sitzflache|fussstutze|gesamtma\u00dfe|drehhocker|kunstleder|mikrofaser|wohnzimmer|holzrahmen|fu\u00dfst\u00fctze|gummiholz|bodensofa|sperrholz|gewicht|montage|drehbar|sessel|hocker|farbe)(?![\\w\u00e5\u00e4\u00f6\u00c5\u00c4\u00d6])", "i");
  const FLIKAR = ["Tekniska specifikationer", "Anv\u00e4ndning och sk\u00f6tsel", "Vanliga fr\u00e5gor"];
  // ☠️ PLAIN_DESCRIPTION MASTE begaras — DESCRIPTION ar ett annat falt och
  //    lamnar plainDescription TOM. Kommaseparerat `fields` ger 400; upprepa.
  // ☠️ VARIANTS_INFO ar INGET giltigt faltvarde och ger 400 "Failed to parse
  //    JSON or deserialize protobuf message". Varianterna kommer anda med.
  const FALT = "?fields=MEDIA_ITEMS_INFO&fields=PLAIN_DESCRIPTION";
  const ut = {};
  for (const r of RADER) {
    const brister = [];
    const g = await wix.request({ scope: "site", siteId: SITE, method: "GET",
      url: "https://www.wixapis.com/stores/v3/products/" + r.id + FALT });
    const p = g.data.product;
    const html = p.plainDescription ?? "";

    const s = synlig(html);
    if (s.length !== r.langd) brister.push("langd " + s.length + " != " + r.langd);
    if (hasha(s) !== r.hash) brister.push("hash " + hasha(s) + " != " + r.hash);

    const slug = typeof p.slug === "string" ? p.slug : ((p.slug && p.slug.name) || "");
    if (p.name !== r.name) brister.push("namn: " + p.name);
    if (slug !== r.slug) brister.push("slug: " + slug);
    const tags = p.seoData?.tags ?? [];
    const t = tags.find((x) => x.type === "title");
    const m = tags.find((x) => x.type === "meta" && x.props?.name === "description");
    if ((t?.children ?? "") !== r.title) brister.push("seo-titel: " + (t?.children ?? "SAKNAS"));
    if ((m?.props?.content ?? "") !== r.meta) brister.push("seo-meta: " + (m?.props?.content ?? "SAKNAS"));

    // Grinden laser HELA seoData — settings.keywords overlever annars hela
    // poleringen med leverantorens tyska rubrik.
    const kw = (p.seoData?.settings?.keywords ?? [])
      .map((x) => (typeof x === "string" ? x : (x.term ?? ""))).join(" | ");
    if (TYSKA.test(kw)) brister.push("tyskt keyword: " + kw);

    const tyskT = s.match(TYSKA);
    if (tyskT) brister.push("tyskt ord i texten: " + tyskT[0]);
    if (/Skickas fr\u00e5n/i.test(html)) brister.push("Skickas fran");
    if (/(?:B\u00f6r|Bra) att veta|beh\u00f6ver veta innan du k\u00f6per/i.test(s)) brister.push("varningsblock");
    if (/\d+\s*,\s*\d+\s*,\s*\d+\s*cm/.test(s)) brister.push("kommalista av tal");
    if (/Artikelnummer|Modellreferens|Artikelnr/i.test(s)) brister.push("artikelnummer i texten");
    // ☠️ Rundans tre signaturgrindar, mot det som FAKTISKT ligger i Wix.
    if (/fotboll|f[uo]tball|bollmönster/i.test(s)) brister.push("OBELAGT FOTBOLLSMONSTER");
    const massiv = s.match(/punkteringsfri|EVA[- ]|slangl[öo]s|ing(?:enting|et) att pumpa|beh[öo]ver aldrig pumpas|utan innerslang/i);
    if (massiv) brister.push("massivt-hjul-pastaende: " + massiv[0]);
    const falg = s.match(/(?:r[öo]d|bl[åa]|gr[öo]n|rosa|orange|turkos|svart|vit)\w*\s+f[äa]lg/i);
    if (falg) brister.push("OMATT FALGFARG: " + falg[0]);
    if (/elsparkcykel|elscooter|eldriven|km\/h|batteri/i.test(s)) brister.push("elfordonsord");
    if (/EN\s*\d{2,5}|certifierad|CE-m[äa]rkt|testad enligt/i.test(s)) brister.push("obelagd standard");
    if (!/hj[äa]lm/i.test(s)) brister.push("hjalmradet saknas");
    for (const f of FLIKAR) {
      if (!new RegExp("<h2>\\s*" + f + "\\s*</h2>").test(html)) brister.push("flik ej ren h2: " + f);
    }

    const items = p.media?.itemsInfo?.items ?? [];
    if (items.length !== r.antalBilder) brister.push("bilder: " + items.length + " != " + r.antalBilder);
    if (items.filter((i) => !i.image?.url).length) brister.push("bild utan url");
    const alt = items.map((i) => i.image?.altText ?? "");
    if (alt.some((a) => !a)) brister.push("alt-text saknas");
    if (new Set(alt).size !== alt.length) brister.push("alt-text inte unik");
    if (!((items[2]?.image?.url ?? "").includes(r.kortFil))) brister.push("kortet inte pa plats 3");

    // ☠️ SKU pa RATT variant — aldrig pa position.
    const vs = p.variantsInfo?.variants ?? [];
    const v = vs.find((x) => x.id === r.variantId);
    if (!v) brister.push("variantId hittades inte: " + r.variantId);
    else if ((v.sku ?? "") !== r.sku) brister.push("sku: " + (v.sku ?? "SAKNAS"));

    // ☠️ Kategorier gar inte att lasa ur produkten — bade search och GET
    //    svarar med tomma directCategoriesInfo. Lasaren ar kategori-API:t,
    //    och svarsnyckeln heter `directCategoryIds`, inte `categories`.
    const c = await wix.request({ scope: "site", siteId: SITE, method: "POST",
      url: "https://www.wixapis.com/categories/v1/categories/list-categories-for-item",
      body: { item: { catalogItemId: r.id, appId: APP },
              treeReference: { appNamespace: "@wix/stores" } } });
    const kat = c.data.directCategoryIds ?? [];
    if (kat.length < 3) brister.push("for fa kategorier: " + kat.length);
    for (const c of ["83c8248a-2d41-42fe-a8c8-0202a4630686",
                     "21b366b8-fd1a-4b3c-993c-9574711f5293"]) {
      if (!kat.includes(c)) brister.push("saknar kategori " + c.slice(0, 8));
    }

    ut[r.kort] = { brister, revision: p.revision, synlig: p.visible,
                   variantSynlig: vs.map((x) => x.visible),
                   pris: v?.price?.actualPrice?.amount ?? null,
                   antalKategorier: kat.length, langd: s.length };
  }
  return ut;
}