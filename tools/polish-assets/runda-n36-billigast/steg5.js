async function () {
  // Genererad av runda N36:s bygg-steg.py ur ids, namn, seo, slugs, sku, kategori, vantat-hash och media-hash — aldrig skriven av.
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
    {"kort": "46c0fe07", "pid": "46c0fe07-2912-46ca-8fbe-10d87770ce22", "namn": "Sidobord i C-form på hjul – skiva i valnötslook och svart stålram", "slug": "sidobord-c-form-hjul-valnotslook", "seoTitel": "Sidobord i C-form på hjul | Fyndplats", "seoBesk": "Sidobord i C-form på fyra hjul, 51 × 36 × 65 cm, med skiva i valnötslook och svart stålram. Skjuts in under soffan eller sängen. Bär 10 kg.", "sku": "FP-sidobord-c-form-hjul-valnot", "variantId": "be3d5751-592f-413e-beec-ddb4a1c14b38", "textHash": "5948bd587e2ef82b", "textTecken": 2390, "mediaSumma": 76106194, "mediaTecken": 501, "kat": ["Hem & Inredning"]},
    {"kort": "3bfee58b", "pid": "3bfee58b-2473-4149-9864-2c223e576565", "namn": "Mopphink 20 liter på hjul – avtagbar press och skiljevägg, svart", "slug": "mopphink-20-liter-press-svart", "seoTitel": "Mopphink 20 liter med press, svart | Fyndplats", "seoBesk": "Svart mopphink på 20 liter med fyra hjul, avtagbar press och skiljevägg för rent och smutsigt vatten. 60 × 27 × 70,5 cm.", "sku": "FP-mopphink-20-l-press-svart", "variantId": "bf0d5e70-63a5-432e-a325-253cbbb3dcf7", "textHash": "219772d412aee275", "textTecken": 2373, "mediaSumma": 774232326, "mediaTecken": 386, "kat": ["Verktyg & Hemmafix"]},
    {"kort": "265b0f61", "pid": "265b0f61-93f9-4e78-b8e0-d93e994f44e2", "namn": "Matta 170 × 120 cm i mörkgrått – geometriskt randmönster, tål maskintvätt", "slug": "matta-170x120-cm-geometriskt-randmonster", "seoTitel": "Matta 170 × 120 cm i mörkgrått | Fyndplats", "seoBesk": "Mörkgrå matta 170 × 120 cm med geometriskt randmönster i polypropylen. Lugg 1,4 cm, tål maskintvätt och passar på golv med golvvärme.", "sku": "FP-matta-170x120-morkgra", "variantId": "eee645c9-b616-48a8-b8ea-424370f38f61", "textHash": "4e99d092b58cc74d", "textTecken": 2250, "mediaSumma": 158285716, "mediaTecken": 371, "kat": ["Hem & Inredning"]},
    {"kort": "69ba5b8b", "pid": "69ba5b8b-b143-4904-a4cf-406762ad4e10", "namn": "Staffli för barn i trä – krittavla och whiteboard, höjd 70–97 cm", "slug": "staffli-barn-tra-krittavla-whiteboard", "seoTitel": "Staffli för barn, krittavla och whiteboard | Fyndplats", "seoBesk": "Staffli för barn i trä med krittavla och whiteboard, höjd 70–97 cm och ställbar vinkel. Hylla och pappersrulle ingår. Från 3 år.", "sku": "FP-staffli-barn-kritt-whiteboard", "variantId": "5e2b110a-9125-4a47-8419-dec3d1dfeadb", "textHash": "67e099c096f87ee1", "textTecken": 2517, "mediaSumma": 7875271, "mediaTecken": 325, "kat": ["Barn & Familj", "Leksaker & Spel"]},
    {"kort": "2b27c2a4", "pid": "2b27c2a4-449b-4eb4-91f6-8a9a039ca605", "namn": "Brödrost för fyra skivor – grå med vågmönster, sju lägen och högt lyft", "slug": "brodrost-fyra-skivor-gra-vagmonster", "seoTitel": "Brödrost för fyra skivor, grå | Fyndplats", "seoBesk": "Grå brödrost för fyra skivor med sju rostningslägen, upptining, återuppvärmning och högt lyft. Utdragbar smulbricka, 1560–1860 W.", "sku": "FP-brodrost-4-skivor-gra-vag", "variantId": "8fc90f74-e981-464d-b53f-8a4baf99d446", "textHash": "76e9c3b388ba82bb", "textTecken": 2454, "mediaSumma": 863780299, "mediaTecken": 525, "kat": ["Kök & Husgeråd", "Köksmaskiner & Apparater"]},
    {"kort": "37804a40", "pid": "37804a40-bc18-4d88-8d4a-83681440edd9", "namn": "Modulgarderob i plast 111 × 183 cm – två hängfack och nio fack, svart och vit", "slug": "modulgarderob-plast-111x183-cm", "seoTitel": "Modulgarderob i plast 111 × 183 cm | Fyndplats", "seoBesk": "Modulgarderob i plast 111 × 47 × 183 cm med två klädstänger, två höga fack och nio små. Svarta paneler och vita dörrar.", "sku": "FP-modulgarderob-111x183-cm", "variantId": "64afc442-7c3a-4992-85a4-a31a7cb7737b", "textHash": "e179a42215398751", "textTecken": 2565, "mediaSumma": 19658812, "mediaTecken": 520, "kat": ["Hem & Inredning", "Förvaring & Organisering"]},
    {"kort": "6707c9dd", "pid": "6707c9dd-0970-4d6d-99ed-fdfe59c7761c", "namn": "Förvaringshurts för barn med tre lådor – blå, rundade kanter", "slug": "forvaringshurts-barn-tre-lador-bla", "seoTitel": "Förvaringshurts för barn, tre lådor | Fyndplats", "seoBesk": "Blå förvaringshurts för barn med tre lådor, 37 × 37 × 56,5 cm. Rundade kanter, upphöjd bas och 10 kg per låda. Snabb leverans från Fyndplats.", "sku": "FP-forvaringshurts-barn-3-lador", "variantId": "cac74eaa-f6b2-4969-8af8-7ede877520bd", "textHash": "3d7b88a066503c18", "textTecken": 2173, "mediaSumma": 990463742, "mediaTecken": 555, "kat": ["Förvaring & Organisering", "Hem & Inredning"]},
    {"kort": "676e567f", "pid": "676e567f-e41e-421d-9831-36c436f27ea2", "namn": "Brevlåda för vägg med tidningshållare – mörkgrå, lås och två nycklar", "slug": "brevlada-vagg-tidningshallare-las", "seoTitel": "Brevlåda för vägg med tidningshållare | Fyndplats", "seoBesk": "Mörkgrå brevlåda för vägg med rostfria paneler, 13-litersfack, tidningshållare, siktfönster och lås med två nycklar. 37 × 10 × 37 cm.", "sku": "FP-brevlada-vagg-tidningshallare", "variantId": "7e588283-2b97-4fb7-aa53-b716fda1917e", "textHash": "707361b7133e3de3", "textTecken": 2572, "mediaSumma": 837434809, "mediaTecken": 519, "kat": ["Hem & Inredning", "Trädgård & Utemöbler"]},
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
