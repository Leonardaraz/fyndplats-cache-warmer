async function () {
  // skriv-lounge.js (T118, 2026-11-07): loungesetet 58c5bc3a (AliExpress-sida, tre färger) får rena egna bilder per färg, och Mörk Khaki
  // slutar visa bilder av ett grått set. Samma steg som skriv-fargbilder.js (galleriet ensamt vid fil-id, sedan options och variantsInfo
  // ordagrant ur produktens egen GET med `visible` explicit, återläsning och jämförelse av allt som inte ska ändras), men med ett MÅLTILLSTÅND:
  // hela galleriets ordning och varje färgs länklista anges här, eftersom en länk också tas bort (skriv-fargbilder.js lägger bara till).
  //
  //   TORR = true   skriver inget, kontrollerar utgångsläget och returnerar planen (galleri före → efter och länkarna per färg)
  //   TORR = false  skriver
  //
  // ☠️ Utgångsläget kontrolleras först: galleriet ska vara exakt de sju bilder som listas som E1–E7 i den ordningen, och varje färg ska
  // länka exakt det den länkade när planen gjordes. Annars ändras ingenting (någon har rört sidan sedan planen).
  const ID = "58c5bc3a-d26e-4d42-8b42-1d2461397fc4";
  const TORR = true;
  const E = {
    E1: "b379ce_cf79205186884d718bce871700bb92ac~mv2.jpg", // Mörkgrå, vit studiobild
    E2: "b379ce_30eebbef68e44e9d99f659c905857a4b~mv2.jpg", // Mörkgrå, miljöbild med kvinna som läser
    E3: "b379ce_9cd17198ff174219a603b7254e3cccfa~mv2.jpg", // Mörk Khaki, vit studiobild
    E4: "b379ce_57d77c62e6434c19afb0b7eb74b2f793~mv2.jpg", // Ljusgrå, vit studiobild
    E5: "b379ce_acadb2019c7d4351b6cb8c1da9e74c2e~mv2.jpg", // måttskiss med ljusgrå dynor
    E6: "b379ce_cfd468bacf2940da8b4a5650656c7a34~mv2.jpeg", // specifikationskort (visar det mörkgrå setet)
    E7: "b379ce_c2a232ea068440779209d8404afb6fca~mv2.jpeg", // egenskapskort (visar miljöbilden med det mörkgrå setet)
  };
  // Nya filer (importerade och beskurna i Media Manager). Fylls i efter importen.
  const N = {
    N1: "b379ce_d2b04cbbe06c43fdadb1aba7484f9bba~mv2.jpg", // Mörk Khaki, miljöbild: kvinna med tidning och hund i soffan
    N2: "b379ce_509437011fc347b8bfb2a5bad6e13e0d~mv2.jpg", // Mörk Khaki, kvinna som torkar spillt kaffe från glasskivan
    N3: "b379ce_4f31ca27ae464ec0a3926841f3ccc508~mv2.jpg", // Ljusgrå, miljöbild: familj i soffan
    N4: "b379ce_bc3af4f2481443df84c0621d3ec4fef2~mv2.jpg", // Mörkgrå, måttskiss med mörkgrå dynor
    N5: "b379ce_3e039383ea0e41b4b564fa3adf4bb9d6~mv2.jpg", // Mörkgrå och Ljusgrå, närbild på rottingens flätning
  };
  const ALT = {
    N1: "Loungeset i mörkbrun rotting med khakifärgade dynor på en uteplats, där en kvinna läser en tidning och en golden retriever ligger i soffan",
    N2: "En kvinna torkar spillt kaffe från soffbordets glasskiva vid loungesetet i mörkbrun rotting med khakifärgade dynor, med en hund bredvid",
    N3: "Loungeset i rotting med ljusgrå dynor på en uteplats, där en kvinna, en pojke och en man sitter och skrattar i soffan",
    N4: "Måttskiss av loungeset med mörkgrå dynor: uppställt 188 × 120 × 61 cm, med måtten för fåtöljer, fotpall och bord",
    N5: "Närbild på flätad PE-rotting i beige och grå toner",
  };
  // Målet: galleriets ordning och länkarna per färg (länkarna i galleriets ordning).
  const ORDNING = ["E1", "E2", "E3", "N1", "N2", "E4", "N3", "N5", "N4", "E5", "E6", "E7"];
  const MAL = {
    "Mörkgrå": ["E1", "E2", "N5", "N4", "E6", "E7"],
    "Mörk Khaki": ["E3", "N1", "N2"],
    "Ljusgrå": ["E4", "N3", "N5", "E5"],
  };
  // Utgångsläget, sådant det var när planen gjordes.
  const FORE = {
    "Mörkgrå": ["E1", "E2", "E5", "E6", "E7"],
    "Mörk Khaki": ["E3", "E5", "E6", "E7"],
    "Ljusgrå": ["E4", "E5", "E6", "E7"],
  };

  const URL = "https://www.wixapis.com/stores/v3/products/" + ID;
  const FALT = "?fields=MEDIA_ITEMS_INFO&fields=VARIANT_OPTION_CHOICE_NAMES&fields=MERCHANT_DATA";
  const paus = function (ms) { return new Promise(function (r) { setTimeout(r, ms); }); };
  const las = async function () { return (await wix.request({ method: "GET", url: URL + FALT })).data.product; };
  const galleriAv = function (p) { return ((p.media && p.media.itemsInfo && p.media.itemsInfo.items) || []).map(function (i) { return i.id; }); };
  const fel = function (steg, text) { return { ok: false, steg: steg, fel: text }; };
  const id = function (k) { return E[k] || N[k]; };
  // ☠️ Varukostnaden (revenueDetails.cost) följer med tillbaka: en variantsInfo-PATCH ersätter varianten (lib/wix/produkt-kostnad.ts).
  const utanVinst = function (vi) {
    const ut = JSON.parse(JSON.stringify(vi));
    (ut.variants || []).forEach(function (v) {
      const kost = v.revenueDetails && v.revenueDetails.cost;
      if (kost && typeof kost === "object") v.revenueDetails = { cost: kost }; else delete v.revenueDetails;
    });
    return ut;
  };
  const varV = function (p) {
    return ((p.variantsInfo && p.variantsInfo.variants) || []).map(function (v) {
      return [v.id, v.sku, v.visible, v.price && v.price.actualPrice && v.price.actualPrice.amount, JSON.stringify(v.revenueDetails && v.revenueDetails.cost)].join("|");
    }).join(";");
  };

  const p0 = await las();
  // 0. Utgångsläget.
  const g0 = galleriAv(p0);
  const forvantat = ["E1", "E2", "E3", "E4", "E5", "E6", "E7"].map(id);
  if (g0.join(",") !== forvantat.join(",")) return fel("utgangslage", "galleriet är inte de sju förväntade bilderna i förväntad ordning: " + g0.length + " bilder");
  const fo0 = (p0.options || []).find(function (o) { return o.name === "Färg"; });
  if (!fo0) return fel("utgangslage", "ingen option som heter Färg");
  const val0 = (fo0.choicesSettings && fo0.choicesSettings.choices) || [];
  const lank0 = {};
  for (const c of val0) {
    const nu = (c.linkedMedia || []).map(function (m) { return m.id; });
    const vant = (FORE[c.name] || []).map(id);
    if (nu.join(",") !== vant.join(",")) return fel("utgangslage", "länkarna i " + c.name + " är inte som när planen gjordes");
    lank0[c.name] = nu;
  }
  if (Object.keys(MAL).sort().join(",") !== val0.map(function (c) { return c.name; }).sort().join(",")) return fel("utgangslage", "färgerna är inte de förväntade");
  // 1. Nya filer: ifyllda, nya i galleriet, klara hos Wix.
  const nya = ["N1", "N2", "N3", "N4", "N5"];
  for (const k of nya) {
    if (!/^b379ce_[0-9a-f]{32}~mv2\.(jpg|jpeg)$/i.test(N[k]) && TORR !== "fake") return fel("plan", "filen " + k + " saknas eller har ogiltigt id");
    const a = ALT[k];
    if (a.length < 5 || a.length > 200 || /https?:|www\.|\.(?:com|se|de)\b|homcom|outsunny|aosom|aliexpress|alibaba/i.test(a)) return fel("plan", "alt-texten duger inte för " + k);
    if (TORR === "fake") continue;
    const fr = await wix.request({ method: "GET", url: "https://www.wixapis.com/site-media/v1/files/get-file-by-id?fileId=" + encodeURIComponent(N[k]) });
    const st = fr.data && fr.data.file && fr.data.file.operationStatus;
    if (st !== "READY") return fel("plan", "filen " + k + " är inte klar hos Wix (" + st + ")");
  }
  const nyId = ORDNING.map(function (k) { return TORR === "fake" ? (E[k] || ("fake-" + k)) : id(k); });
  if (new Set(nyId).size !== nyId.length) return fel("plan", "samma fil två gånger i det nya galleriet");
  // Varje bild ska länkas av minst en färg (en olänkad bild visas för alla färger), och ingen färg får tappa en bild den bör ha.
  const lankade = new Set();
  Object.keys(MAL).forEach(function (n) { MAL[n].forEach(function (k) { lankade.add(k); }); });
  const olankade = ORDNING.filter(function (k) { return !lankade.has(k); });
  if (olankade.length) return fel("plan", "olänkade bilder: " + olankade.join(","));
  Object.keys(MAL).forEach(function (n) {
    const i = MAL[n].map(function (k) { return ORDNING.indexOf(k); });
    for (let x = 1; x < i.length; x++) if (i[x] <= i[x - 1]) throw new Error("länkarna i " + n + " ligger inte i galleriets ordning");
  });
  const plan = {
    galleri: g0.length + " → " + ORDNING.length,
    ordning: ORDNING.join(" "),
    lankar: Object.keys(MAL).map(function (n) { return n + ": " + lank0[n].length + " → " + MAL[n].length + " (" + MAL[n].join(",") + ")"; }),
  };
  if (TORR) return { ok: true, torr: TORR, plan: plan };

  // 2. Galleriet, ensamt, vid id (befintliga alt-texter behålls, de nya läggs in).
  const alt0 = {};
  ((p0.media && p0.media.itemsInfo && p0.media.itemsInfo.items) || []).forEach(function (i) { alt0[i.id] = i.altText || ""; });
  const poster = ORDNING.map(function (k) {
    const fid = id(k);
    const a = k.charAt(0) === "N" ? ALT[k] : alt0[fid];
    return a ? { id: fid, altText: a } : { id: fid };
  });
  await wix.request({
    method: "PATCH",
    url: URL,
    body: { product: { revision: p0.revision, media: { itemsInfo: { items: poster } } }, fieldMask: { paths: ["media"] } },
  });
  const vantat = ORDNING.map(id).join(",");
  let p1 = null;
  for (let f = 0; f < 6; f++) {
    await paus(3000);
    p1 = await las();
    if (galleriAv(p1).join(",") === vantat) break;
  }
  if (galleriAv(p1).join(",") !== vantat) return fel("galleri", "Wix visar inte det nya galleriet efter 18 s (galleriet kan vara skrivet, kör om återläsningen)");

  // 3. Länkarna: options + variantsInfo ordagrant ur GET:en, färgernas nya linkedMedia, visible explicit. Försöker om vid 404/409.
  const nyaOptions = JSON.parse(JSON.stringify(p1.options));
  const foN = nyaOptions.find(function (o) { return o.name === "Färg"; });
  foN.choicesSettings.choices.forEach(function (c) {
    c.linkedMedia = MAL[c.name].map(function (k) { return { id: id(k) }; });
  });
  let lankSkriven = false;
  let sistaFel = "";
  let pn = p1;
  for (let f = 0; f < 8 && !lankSkriven; f++) {
    try {
      await wix.request({
        method: "PATCH",
        url: URL,
        body: { product: { revision: pn.revision, visible: pn.visible, options: nyaOptions, variantsInfo: utanVinst(pn.variantsInfo) }, fieldMask: { paths: ["options", "variantsInfo", "visible"] } },
      });
      lankSkriven = true;
    } catch (e) {
      sistaFel = String(e && e.message ? e.message : e).slice(0, 160);
      await paus(3000);
      pn = await las();
    }
  }
  if (!lankSkriven) return fel("lankar", "länkarna skrevs inte (galleriet är skrivet): " + sistaFel);

  // 4. Återläsning: galleri, länkar och allt som inte ska ändras.
  await paus(3000);
  const p2 = await las();
  const avvik = [];
  if (galleriAv(p2).join(",") !== vantat) avvik.push("galleriet");
  const fo2 = (p2.options || []).find(function (o) { return o.name === "Färg"; });
  const lank2 = {};
  (fo2.choicesSettings.choices || []).forEach(function (c) {
    const nu = (c.linkedMedia || []).map(function (m) { return m.id; });
    lank2[c.name] = nu.length;
    if (nu.join(",") !== MAL[c.name].map(id).join(",")) avvik.push("länkar i " + c.name);
  });
  if (varV(p0) !== varV(p2)) avvik.push("varianternas id, SKU, synlighet, pris eller kostnad");
  if (p0.visible !== p2.visible) avvik.push("synligheten");
  if (p0.slug !== p2.slug || p0.name !== p2.name) avvik.push("namn eller adress");
  const alt2 = {};
  ((p2.media && p2.media.itemsInfo && p2.media.itemsInfo.items) || []).forEach(function (i) { alt2[i.id] = i.altText || ""; });
  ORDNING.forEach(function (k) {
    const vantAlt = k.charAt(0) === "N" ? ALT[k] : alt0[id(k)];
    if ((alt2[id(k)] || "") !== (vantAlt || "")) avvik.push("alt-text " + k);
  });
  return { ok: avvik.length === 0, avvikelser: avvik, revision: p0.revision + " → " + p2.revision, galleri: g0.length + " → " + galleriAv(p2).length, valLankar: lank2 };
}
