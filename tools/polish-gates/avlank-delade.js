async function () {
  // avlank-delade.js (2026-10-22): en bild som LÄNKAS från två eller flera val i samma option blir gemensam för alla val, och läses tillbaka.
  // Kör via ExecuteWixAPI. Lagar sidor där ett senare val svälts på bilder, som växthusplasten b729a465 (Leonards skärmbild 2026-10-22):
  // 6 × 10 m länkade bara huvudbilden, 7 × 8 m och 8 × 10 m länkade alla sex, och butiken visar en länkad bild bara för det FÖRSTA val som
  // länkar den. Storlekarna visade 1, 5 och 6 bilder. Efter rättningen visar alla tre 6.
  //
  //   PLANER = [ { id, axel } ]   (högst tre sidor per körning, 60 s-taket; axel = optionens namn, standard "Storlek")
  //
  // Regeln, och den är mekanisk: för varje val behålls bara de länkade bilder som INGET annat val i optionen länkar (i sin ordning). Allt som
  // flera val länkade lämnas olänkat och visas därefter för alla val. Ingen vy kan bli sämre: varje val visar efteråt allt det visade förut och
  // alla bilder det länkade. Verktyget räknar före och efter med butikens regel (lib/variant-bilder.ts, mätt live på 17 sidor 2026-10-22):
  //   · en länkad bild visas bara för det FÖRSTA val som länkar den,
  //   · en bild som inget val länkar är gemensam och visas för alla val,
  //   · äger ett val ingenting och ingen bild är gemensam visar butiken hela galleriet.
  // och vägrar skriva om något val skulle visa färre bilder än förut eller om ingenting ändras.
  //
  // Regler som inte ska tas bort (som lank-om-bilder.js):
  //   1. ☠️ Galleriet skrivs ALDRIG här, och ordningen i det ändras inte.
  //   2. ☠️ Ett val som hade länkade bilder och skulle lämnas utan kräver `tomt: true` i planen (variantens bild räknas då ur huvudbilden).
  //   3. options och variantsInfo tas ordagrant ur produktens egen GET, med `visible` explicit. Varianternas id, SKU, synlighet och pris,
  //      produktens synlighet, namn och adress och galleriets ordning ska vara lika före och efter, annars är svaret `ok: false`.
  //   4. Bara EN option rörs. Länkarna i andra optioner läses tillbaka och ska vara lika.
  // ☠️ Gäller sidor med EN option utan färg. På en sida med färg eller två axlar följer butiken andra regler (färgens egna bilder), och verktyget
  // vägrar den (`plan`).
  // Efter en omlänkning: kör variantbild.yml (skarp, ids) så att varukorgens bild är rätt (den visade `redan ratt` på b729a465).
  const PLANER = [{ id: "", axel: "Storlek", tomt: false }];
  const T0 = Date.now();

  const lika = function (a, b) { return String(a || "").trim().toLowerCase() === String(b || "").trim().toLowerCase(); };
  const paus = function (ms) { return new Promise(function (r) { setTimeout(r, ms); }); };
  const vyer = function (items, val) {
    // Butikens räkning för en option utan färglogik. val = [{ synligt, lankade }] i optionens ordning.
    const antal = {};
    val.forEach(function (v) { v.lankade.forEach(function (id) { antal[id] = (antal[id] || 0) + 1; }); });
    const forsta = {};
    val.forEach(function (v, i) { v.lankade.forEach(function (id) { if (forsta[id] === undefined) forsta[id] = i; }); });
    const gem = items.filter(function (id) { return !antal[id]; }).length;
    return val.map(function (v, i) {
      if (!v.synligt) return null;
      const n = items.filter(function (id) { return v.lankade.indexOf(id) >= 0 && forsta[id] === i; }).length + gem;
      return n === 0 ? items.length : n;
    }).filter(function (n) { return n !== null; });
  };
  const lankEn = async function (PLAN) {
    const URL = "https://www.wixapis.com/stores/v3/products/" + PLAN.id;
    const FALT = "?fields=MEDIA_ITEMS_INFO&fields=VARIANT_OPTION_CHOICE_NAMES";
    const las = async function () { return (await wix.request({ method: "GET", url: URL + FALT })).data.product; };
    const galleriAv = function (p) { return ((p.media && p.media.itemsInfo && p.media.itemsInfo.items) || []).map(function (i) { return i.id; }); };
    const fel = function (steg, text) { return { ok: false, steg: steg, id: String(PLAN.id).slice(0, 8), fel: text }; };
    const axelNamn = PLAN.axel || "Storlek";
    if (!/^[0-9a-f-]{36}$/.test(PLAN.id)) return fel("plan", "ogiltigt id");

    const p0 = await las();
    if (p0.visible !== true) return fel("plan", "sidan är inte publicerad");
    const synligaOpt = (p0.options || []).filter(function (o) { return ((o.choicesSettings && o.choicesSettings.choices) || []).filter(function (c) { return c.visible !== false; }).length >= 2; });
    if (synligaOpt.length !== 1) return fel("plan", "sidan har " + synligaOpt.length + " options med två val eller fler, verktyget tar bara en");
    const ax0 = synligaOpt[0];
    if (!lika(ax0.name, axelNamn)) return fel("plan", "optionen heter " + ax0.name + ", inte " + axelNamn);
    if (lika(ax0.name, "Färg")) return fel("plan", "färgoptioner följer andra regler (färgens egna bilder)");
    const val0 = (ax0.choicesSettings && ax0.choicesSettings.choices) || [];
    const galleri0 = galleriAv(p0);
    const gamla = {};
    val0.forEach(function (c) { gamla[c.choiceId] = (c.linkedMedia || []).map(function (m) { return m.id; }); });
    const antal = {};
    val0.forEach(function (c) { gamla[c.choiceId].forEach(function (id) { antal[id] = (antal[id] || 0) + 1; }); });
    const nya = {};
    val0.forEach(function (c) { nya[c.choiceId] = gamla[c.choiceId].filter(function (id) { return antal[id] === 1; }); });

    // 1. Granska effekten mot butikens regel innan något skrivs.
    const fore = vyer(galleri0, val0.map(function (c) { return { synligt: c.visible !== false, lankade: gamla[c.choiceId] }; }));
    const efter = vyer(galleri0, val0.map(function (c) { return { synligt: c.visible !== false, lankade: nya[c.choiceId] }; }));
    if (fore.join() === efter.join()) return fel("plan", "ingen vy ändras (" + fore.join(",") + "): inget att rätta");
    if (efter.some(function (n, i) { return n < fore[i]; })) return fel("plan", "en vy skulle få färre bilder: " + fore.join(",") + " → " + efter.join(","));
    for (const c of val0) {
      if (gamla[c.choiceId].length > 0 && nya[c.choiceId].length === 0 && !PLAN.tomt) return fel("plan", c.name + " hade länkade bilder och skulle lämnas utan (sätt tomt: true om det är meningen)");
    }

    // 2. Länkarna: options + variantsInfo ordagrant ur GET:en, valens nya linkedMedia, visible explicit. Försöker om vid 404/409.
    const nyaOptions = JSON.parse(JSON.stringify(p0.options));
    const axN = nyaOptions.find(function (o) { return lika(o.name, axelNamn); });
    axN.choicesSettings.choices.forEach(function (c) { c.linkedMedia = nya[c.choiceId].map(function (id) { return { id: id }; }); });
    let skriven = false;
    let sistaFel = "";
    let pn = p0;
    for (let f = 0; f < 8 && !skriven; f++) {
      try {
        await wix.request({
          method: "PATCH",
          url: URL,
          body: { product: { revision: pn.revision, visible: pn.visible, options: nyaOptions, variantsInfo: pn.variantsInfo }, fieldMask: { paths: ["options", "variantsInfo", "visible"] } },
        });
        skriven = true;
      } catch (e) {
        sistaFel = String(e && e.message ? e.message : e).slice(0, 160);
        await paus(3000);
        pn = await las();
        const ax = (pn.options || []).find(function (o) { return lika(o.name, axelNamn); });
        const ändrat = ((ax && ax.choicesSettings && ax.choicesSettings.choices) || []).some(function (c) {
          return (c.linkedMedia || []).map(function (m) { return m.id; }).join(",") !== (gamla[c.choiceId] || []).join(",");
        });
        if (ändrat) return fel("lankar", "valens länkar ändrades av något annat under skrivningen, ingenting skrevs över: " + sistaFel);
      }
    }
    if (!skriven) return fel("lankar", "länkarna skrevs inte: " + sistaFel);

    // 3. Återläsning: länkar, galleriets ordning och allt som inte ska ändras.
    let p2 = null;
    const avvik = [];
    for (let f = 0; f < 4; f++) {
      await paus(3000);
      p2 = await las();
      avvik.length = 0;
      const ax2 = (p2.options || []).find(function (o) { return lika(o.name, axelNamn); });
      ((ax2 && ax2.choicesSettings && ax2.choicesSettings.choices) || []).forEach(function (c) {
        const vant = nya[c.choiceId] || [];
        const nu = (c.linkedMedia || []).map(function (m) { return m.id; });
        if (vant.join(",") !== nu.join(",")) avvik.push("länkar i " + c.name);
      });
      if (avvik.length === 0) break;
    }
    if (galleriAv(p2).join(",") !== galleri0.join(",")) avvik.push("galleriets ordning");
    const varV = function (p) { return ((p.variantsInfo && p.variantsInfo.variants) || []).map(function (v) { return [v.id, v.sku, v.visible, v.price && v.price.actualPrice && v.price.actualPrice.amount].join("|"); }).join(";"); };
    if (varV(p0) !== varV(p2)) avvik.push("varianternas id, SKU, synlighet eller pris");
    if (p0.visible !== p2.visible) avvik.push("synligheten");
    if (p0.slug !== p2.slug || p0.name !== p2.name) avvik.push("namn eller adress");
    const andra = (p2.options || []).filter(function (o) { return !lika(o.name, axelNamn); });
    const andraFore = (p0.options || []).filter(function (o) { return !lika(o.name, axelNamn); });
    const andraLankar = function (lista) { return lista.map(function (o) { return o.name + ":" + ((o.choicesSettings && o.choicesSettings.choices) || []).map(function (c) { return (c.linkedMedia || []).map(function (m) { return m.id; }).join("+"); }).join("/"); }).join(";"); };
    if (andraLankar(andra) !== andraLankar(andraFore)) avvik.push("länkarna i en annan option");
    const ax3 = (p2.options || []).find(function (o) { return lika(o.name, axelNamn); });
    const efterLasning = vyer(galleriAv(p2), ((ax3 && ax3.choicesSettings && ax3.choicesSettings.choices) || []).map(function (c) { return { synligt: c.visible !== false, lankade: (c.linkedMedia || []).map(function (m) { return m.id; }) }; }));
    return {
      ok: avvik.length === 0,
      id: PLAN.id.slice(0, 8),
      avvikelser: avvik,
      revision: p0.revision + " → " + p2.revision,
      vyerFore: fore.join(","),
      vyerEfter: efterLasning.join(","),
      valLankar: ((ax3 && ax3.choicesSettings && ax3.choicesSettings.choices) || []).map(function (c) { return c.name + ": " + (gamla[c.choiceId] || []).length + " → " + (c.linkedMedia || []).length; }),
    };
  };

  const ut = [];
  for (const PLAN of PLANER) {
    if (Date.now() - T0 > 40000) { ut.push({ ok: false, steg: "tid", id: String(PLAN.id).slice(0, 8), fel: "ej körd, tiden räckte inte (kör om)" }); continue; }
    try { ut.push(await lankEn(PLAN)); } catch (e) { ut.push({ ok: false, steg: "undantag", id: String(PLAN.id).slice(0, 8), fel: String(e && e.message ? e.message : e).slice(0, 200) }); }
  }
  return ut;
}
