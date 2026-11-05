async function () {
  // Elmotorcykeln 5419c746, steg 2 (2026-11-05): länka egenskapskortet c16a7e5e till Himmelsblå. Kortet visar den blå scootern och
  // hade börjat visas under Röd när Röd fick egna bilder. Bara options och variantsInfo skrivs (ordagrant ur GET:en, visible explicit),
  // galleriet rörs inte, och allt utom länkarna läses tillbaka. Kör `variantbild.yml` efteråt (en options-PATCH nollställer variantbilden).
  const ID = "5419c746-2978-4321-83e4-80fba0c86cde";
  const URL = "https://www.wixapis.com/stores/v3/products/" + ID;
  const FALT = "?fields=MEDIA_ITEMS_INFO&fields=VARIANT_OPTION_CHOICE_NAMES&fields=MERCHANT_DATA";
  const paus = function (ms) { return new Promise(function (r) { setTimeout(r, ms); }); };
  const las = async function () { return (await wix.request({ method: "GET", url: URL + FALT })).data.product; };
  const galleriAv = function (p) { return ((p.media && p.media.itemsInfo && p.media.itemsInfo.items) || []).map(function (i) { return i.id; }); };
  const p8 = function (id) { return String(id).slice(7, 15); };
  const fel = function (steg, text) { return { ok: false, steg: steg, fel: text }; };
  const utanVinst = function (vi) {
    const ut = JSON.parse(JSON.stringify(vi));
    (ut.variants || []).forEach(function (v) {
      const kost = v.revenueDetails && v.revenueDetails.cost;
      if (kost && typeof kost === "object") v.revenueDetails = { cost: kost }; else delete v.revenueDetails;
    });
    return ut;
  };
  const p0 = await las();
  const gal0 = galleriAv(p0);
  const fo = (p0.options || []).find(function (o) { return o.name === "Färg"; });
  const val = (fo.choicesSettings && fo.choicesSettings.choices) || [];
  const cH = val.find(function (c) { return c.name === "Himmelsblå"; });
  const cR = val.find(function (c) { return c.name === "Röd"; });
  if (!cH || !cR || val.length !== 2) return fel("plan", "valen är inte Röd och Himmelsblå");
  const e4 = gal0.filter(function (id) { return p8(id) === "c16a7e5e"; });
  if (e4.length !== 1) return fel("plan", "egenskapskortet hittades inte i galleriet");
  const gamlaH = (cH.linkedMedia || []).map(function (m) { return m.id; });
  const gamlaR = (cR.linkedMedia || []).map(function (m) { return m.id; });
  if (gamlaH.indexOf(e4[0]) >= 0 || gamlaR.indexOf(e4[0]) >= 0) return fel("plan", "kortet är redan länkat");
  const nyH = [];
  gamlaH.forEach(function (id) {
    if (p8(id) === "90b469a3") nyH.push(e4[0]);
    nyH.push(id);
  });
  if (nyH.length !== gamlaH.length + 1) return fel("plan", "måttskissen hittades inte bland Himmelsblås länkar");
  const nyaOptions = JSON.parse(JSON.stringify(p0.options));
  const foN = nyaOptions.find(function (o) { return o.name === "Färg"; });
  foN.choicesSettings.choices.forEach(function (c) {
    if (c.choiceId === cH.choiceId) c.linkedMedia = nyH.map(function (id) { return { id: id }; });
  });
  let skriven = false;
  let sistaFel = "";
  let pn = p0;
  for (let f = 0; f < 8 && !skriven; f++) {
    try {
      await wix.request({ method: "PATCH", url: URL, body: { product: { revision: pn.revision, visible: pn.visible, options: nyaOptions, variantsInfo: utanVinst(pn.variantsInfo) }, fieldMask: { paths: ["options", "variantsInfo", "visible"] } } });
      skriven = true;
    } catch (e) {
      sistaFel = String(e && e.message ? e.message : e).slice(0, 160);
      await paus(3000);
      pn = await las();
    }
  }
  if (!skriven) return fel("lankar", "länkarna skrevs inte: " + sistaFel);
  await paus(3000);
  const p2 = await las();
  const fo2 = (p2.options || []).find(function (o) { return o.name === "Färg"; });
  const avvik = [];
  if (galleriAv(p2).join(",") !== gal0.join(",")) avvik.push("galleriet");
  (fo2.choicesSettings.choices || []).forEach(function (c) {
    const vant = (c.choiceId === cH.choiceId ? nyH : gamlaR).join(",");
    const nu = (c.linkedMedia || []).map(function (m) { return m.id; }).join(",");
    if (vant !== nu) avvik.push("länkar i " + c.name);
  });
  const varV = function (p) { return ((p.variantsInfo && p.variantsInfo.variants) || []).map(function (v) { return [v.id, v.sku, v.visible, v.price && v.price.actualPrice && v.price.actualPrice.amount, v.revenueDetails && v.revenueDetails.cost && v.revenueDetails.cost.amount].join("|"); }).join(";"); };
  if (varV(p0) !== varV(p2)) avvik.push("varianternas id, SKU, synlighet, pris eller kostnad");
  if (p0.visible !== p2.visible) avvik.push("synligheten");
  if (p0.slug !== p2.slug || p0.name !== p2.name) avvik.push("namn eller adress");
  return { ok: avvik.length === 0, avvikelser: avvik, revision: p0.revision + " → " + p2.revision };
}
