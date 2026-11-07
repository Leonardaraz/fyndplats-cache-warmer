async function () {
  // Elmotorcykeln 5419c746: rena foton till Röd och Himmelsblå, ur syskonsidan 5c506192 (samma modell och samma färger).
  // Samma steg som tools/polish-gates/skriv-fargbilder.js: filerna kontrolleras mot Media Manager, galleriet skrivs ensamt vid fil-id,
  // länkarna skrivs med options och variantsInfo ordagrant ur GET:en och visible explicit, och allt läses tillbaka.
  // Skillnaden: ordningen är utpekad (packshot först, miljöbild som bild två, måttbilden sist), inte "efter färgens sista bild".
  // Ingen bild tas bort och ingen länk tappas (kontrolleras före skrivningen).
  const ID = "5419c746-2978-4321-83e4-80fba0c86cde";
  const KALLA = "5c506192-c794-45a1-a41c-1114fc0f2642";
  const TORR = true;
  const URL = "https://www.wixapis.com/stores/v3/products/" + ID;
  const FALT = "?fields=MEDIA_ITEMS_INFO&fields=VARIANT_OPTION_CHOICE_NAMES&fields=MERCHANT_DATA";
  const paus = function (ms) { return new Promise(function (r) { setTimeout(r, ms); }); };
  const las = async function () { return (await wix.request({ method: "GET", url: URL + FALT })).data.product; };
  const galleriAv = function (p) { return ((p.media && p.media.itemsInfo && p.media.itemsInfo.items) || []).map(function (i) { return i.id; }); };
  const p8 = function (id) { return String(id).slice(7, 15); };
  const FORBJUDET = /https?:|www\.|\.(?:com|se|de)\b|homcom|outsunny|pawhut|aiyaplay|vinsetto|kleankin|zonekiz|sportnow|durhand|aosom|aliexpress|alibaba|vevor|succebuy|giantex|costway/i;
  const fel = function (steg, text) { return { ok: false, steg: steg, fel: text }; };
  const utanVinst = function (vi) {
    const ut = JSON.parse(JSON.stringify(vi));
    (ut.variants || []).forEach(function (v) {
      const kost = v.revenueDetails && v.revenueDetails.cost;
      if (kost && typeof kost === "object") v.revenueDetails = { cost: kost }; else delete v.revenueDetails;
    });
    return ut;
  };

  // Nya filer: de åtta första tecknen efter b379ce_ och en svensk alt-text. Hela fil-id:t läses ur syskonsidan, skrivs inte av.
  const NYA = {
    "2174fb74": "Den himmelsblå elmotorcykeln med brun sits och stödhjul på en asfalterad bana med linjer och en orange markeringskon",
    "960fdead": "Himmelsblå elmotorcykel för barn i Vespa-stil med brun sits och stödhjul, sedd snett framifrån mot vit bakgrund",
    "349021c6": "Närbild på den himmelsblå elmotorcykelns bruna sits sedd uppifrån",
    "82f3c75d": "Närbild på den himmelsblå elmotorcykelns runda strålkastare med blank infattning",
    "f9c7bbf5": "Röd elmotorcykel för barn i Vespa-stil med svart sits och två stödhjul, sedd snett framifrån mot vit bakgrund",
    "24b059dc": "Den röda elmotorcykeln med stödhjul på en gångväg framför en trädgård med buskar och träd",
    "0574f5f5": "Röd elmotorcykel för barn i Vespa-stil på en lekmatta i ett barnrum",
    "a0365a06": "Närbild på den röda elmotorcykelns svarta fotpedal och ett av stödhjulen på en mjuk lekmatta",
    "5d09d6d4": "Närbild på den röda elmotorcykelns svarta sits sedd uppifrån",
    "203291b3": "Måttbild: röd elmotorcykel för barn med längd 66,5 cm, bredd 38 cm, höjd 52 cm, sitthöjd 30 cm och sits 23 × 13 cm"
  };
  const ORDNING = ["ecd6a4fe", "2174fb74", "960fdead", "349021c6", "82f3c75d", "43f68eeb", "c16a7e5e", "90b469a3", "f9c7bbf5", "857bcf63", "24b059dc", "0574f5f5", "a0365a06", "5d09d6d4", "203291b3"];
  const HIMMEL = ["ecd6a4fe", "2174fb74", "960fdead", "349021c6", "82f3c75d", "43f68eeb", "90b469a3"];
  const ROD = ["f9c7bbf5", "857bcf63", "24b059dc", "0574f5f5", "a0365a06", "5d09d6d4", "203291b3"];

  const p0 = await las();
  const src = (await wix.request({ method: "GET", url: "https://www.wixapis.com/stores/v3/products/" + KALLA + "?fields=MEDIA_ITEMS_INFO" })).data.product;
  const items0 = ((p0.media && p0.media.itemsInfo && p0.media.itemsInfo.items) || []).map(function (i) { return { id: i.id, altText: i.altText || "" }; });
  const alla = {};
  items0.forEach(function (i) { alla[p8(i.id)] = alla[p8(i.id)] || {}; alla[p8(i.id)][i.id] = 1; });
  galleriAv(src).forEach(function (id) { alla[p8(id)] = alla[p8(id)] || {}; alla[p8(id)][id] = 1; });
  const full = function (k) {
    const l = Object.keys(alla[k] || {});
    if (l.length !== 1) throw new Error("fil-id " + k + " ger " + l.length + " träffar");
    return l[0];
  };
  const fo = (p0.options || []).find(function (o) { return o.name === "Färg"; });
  if (!fo) return fel("plan", "ingen option Färg");
  const val = (fo.choicesSettings && fo.choicesSettings.choices) || [];
  const cH = val.find(function (c) { return c.name === "Himmelsblå"; });
  const cR = val.find(function (c) { return c.name === "Röd"; });
  if (!cH || !cR || val.length !== 2) return fel("plan", "valen är inte Röd och Himmelsblå");

  // Kontroller före allt: inget tappas, inga dubbletter, filerna är klara hos Wix, alt-texterna duger.
  const nyOrdning = ORDNING.map(full);
  if (new Set(nyOrdning).size !== nyOrdning.length) return fel("plan", "dubblett i galleriet");
  if (nyOrdning.length > 50) return fel("plan", "galleriet skulle få " + nyOrdning.length + " bilder");
  const saknas = items0.filter(function (i) { return nyOrdning.indexOf(i.id) < 0; });
  if (saknas.length) return fel("plan", "en nuvarande bild skulle tappas: " + saknas.map(function (i) { return p8(i.id); }).join(","));
  const lankNy = {};
  lankNy[cH.choiceId] = HIMMEL.map(full);
  lankNy[cR.choiceId] = ROD.map(full);
  for (const c of val) {
    const gamla = (c.linkedMedia || []).map(function (m) { return m.id; });
    const tappade = gamla.filter(function (id) { return lankNy[c.choiceId].indexOf(id) < 0; });
    if (tappade.length) return fel("plan", "en länk skulle tappas i " + c.name + ": " + tappade.map(p8).join(","));
  }
  const lankade = new Set(lankNy[cH.choiceId].concat(lankNy[cR.choiceId]));
  const olankade = nyOrdning.filter(function (id) { return !lankade.has(id); }).map(p8);
  if (olankade.join(",") !== "c16a7e5e") return fel("plan", "olänkade bilder blev " + olankade.join(","));
  if (lankNy[cH.choiceId].some(function (id) { return lankNy[cR.choiceId].indexOf(id) >= 0; })) return fel("plan", "en bild länkas till båda färgerna");
  const nyaFiler = Object.keys(NYA).map(full);
  for (const k of Object.keys(NYA)) {
    const alt = NYA[k];
    if (alt.length < 5 || alt.length > 200 || FORBJUDET.test(alt)) return fel("plan", "alt-texten duger inte för " + k);
    const fr = await wix.request({ method: "GET", url: "https://www.wixapis.com/site-media/v1/files/get-file-by-id?fileId=" + encodeURIComponent(full(k)) });
    const f = fr.data && fr.data.file;
    const st = f && f.operationStatus;
    if (st !== "READY") return fel("plan", "filen är inte klar hos Wix (" + st + "): " + k);
    const im = (f.media && f.media.image && f.media.image.image) || {};
    if (!(im.width >= 800 && im.height >= 600)) return fel("plan", "filen är för liten: " + k + " " + im.width + "x" + im.height);
  }
  const altAv = {};
  items0.forEach(function (i) { altAv[i.id] = i.altText; });
  Object.keys(NYA).forEach(function (k) { altAv[full(k)] = NYA[k]; });
  const nytt = nyOrdning.map(function (id) { return altAv[id] ? { id: id, altText: altAv[id] } : { id: id }; });
  const plan = {
    revision: p0.revision,
    galleriFore: items0.map(function (i) { return p8(i.id); }).join(" "),
    galleriEfter: nyOrdning.map(p8).join(" "),
    rodFore: (cR.linkedMedia || []).map(function (m) { return p8(m.id); }).join(" "),
    rodEfter: lankNy[cR.choiceId].map(p8).join(" "),
    himmelFore: (cH.linkedMedia || []).map(function (m) { return p8(m.id); }).join(" "),
    himmelEfter: lankNy[cH.choiceId].map(p8).join(" "),
    olankade: olankade,
    varianterFore: ((p0.variantsInfo && p0.variantsInfo.variants) || []).map(function (v) { return p8(v.media && v.media.id || "x_xxxxxxxx") + "|" + v.sku + "|" + v.visible + "|" + (v.price && v.price.actualPrice && v.price.actualPrice.amount); })
  };
  if (TORR) return { ok: true, torr: true, plan: plan, nyaFiler: nyaFiler.length };

  // 2. Galleriet, ensamt, vid id.
  await wix.request({ method: "PATCH", url: URL, body: { product: { revision: p0.revision, media: { itemsInfo: { items: nytt } } }, fieldMask: { paths: ["media"] } } });
  const vantat = nyOrdning.join(",");
  let p1 = null;
  for (let f = 0; f < 6; f++) {
    await paus(3000);
    p1 = await las();
    if (galleriAv(p1).join(",") === vantat) break;
  }
  if (galleriAv(p1).join(",") !== vantat) return fel("galleri", "Wix visar inte det nya galleriet efter 18 s (galleriet kan vara skrivet, kör om återläsningen)");

  // 3. Länkarna: options + variantsInfo ordagrant ur GET:en, valens nya linkedMedia, visible explicit. Försöker om vid 404/409.
  const nyaOptions = JSON.parse(JSON.stringify(p1.options));
  const foN = nyaOptions.find(function (o) { return o.name === "Färg"; });
  foN.choicesSettings.choices.forEach(function (c) {
    if (lankNy[c.choiceId]) c.linkedMedia = lankNy[c.choiceId].map(function (id) { return { id: id }; });
  });
  let lankSkriven = false;
  let sistaFel = "";
  let pn = p1;
  for (let f = 0; f < 8 && !lankSkriven; f++) {
    try {
      await wix.request({ method: "PATCH", url: URL, body: { product: { revision: pn.revision, visible: pn.visible, options: nyaOptions, variantsInfo: utanVinst(pn.variantsInfo) }, fieldMask: { paths: ["options", "variantsInfo", "visible"] } } });
      lankSkriven = true;
    } catch (e) {
      sistaFel = String(e && e.message ? e.message : e).slice(0, 160);
      await paus(3000);
      pn = await las();
    }
  }
  if (!lankSkriven) return fel("lankar", "länkarna skrevs inte (galleriet är skrivet): " + sistaFel);

  // 4. Återläsning.
  await paus(3000);
  const p2 = await las();
  const fo2 = (p2.options || []).find(function (o) { return o.name === "Färg"; });
  const avvik = [];
  if (galleriAv(p2).join(",") !== vantat) avvik.push("galleriet");
  (fo2.choicesSettings.choices || []).forEach(function (c) {
    const vant = (lankNy[c.choiceId] || []).join(",");
    const nu = (c.linkedMedia || []).map(function (m) { return m.id; }).join(",");
    if (vant !== nu) avvik.push("länkar i " + c.name);
  });
  const varV = function (p) { return ((p.variantsInfo && p.variantsInfo.variants) || []).map(function (v) { return [v.id, v.sku, v.visible, v.price && v.price.actualPrice && v.price.actualPrice.amount, v.revenueDetails && v.revenueDetails.cost && v.revenueDetails.cost.amount].join("|"); }).join(";"); };
  if (varV(p0) !== varV(p2)) avvik.push("varianternas id, SKU, synlighet, pris eller kostnad");
  if (p0.visible !== p2.visible) avvik.push("synligheten");
  if (p0.slug !== p2.slug || p0.name !== p2.name) avvik.push("namn eller adress");
  const altNu = {};
  ((p2.media && p2.media.itemsInfo && p2.media.itemsInfo.items) || []).forEach(function (i) { altNu[i.id] = i.altText || ""; });
  Object.keys(altAv).forEach(function (id) { if (altNu[id] !== altAv[id]) avvik.push("alt-text " + p8(id)); });
  return {
    ok: avvik.length === 0,
    avvikelser: avvik,
    revision: p0.revision + " → " + p2.revision,
    galleri: items0.length + " → " + nyOrdning.length,
    valLankar: (fo2.choicesSettings.choices || []).map(function (c) { return c.name + ":" + (c.linkedMedia || []).length; }),
    varianterEfter: ((p2.variantsInfo && p2.variantsInfo.variants) || []).map(function (v) { return p8(v.media && v.media.id || "x_xxxxxxxx") + "|" + v.sku; })
  };
}
