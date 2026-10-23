async function () {
  // variantbild-farg.js (2026-10-23): variantens bild (Wix `variantsInfo.variants[].media`: varukorg, kassa, order) blir färgens första länkade foto, på publicerade
  // sidor med färg och en annan option där BÅDA optionerna har länkade bilder. Kör via ExecuteWixAPI, byggt av bygg-variantbild-farg.py ur en lista med produkt-id
  // (högst fem sidor per körning, 60 s-taket). `TORR` skriver ingenting. Läs och skriv bara; galleriet, länkarna och optionernas ordning rörs inte.
  //
  // Varför: en id-skrivning av optionerna (`lank-om-bilder.js`, `bygg-agare.py`, `avlank-delade.js`, `bilder-bort.yml`) NOLLSTÄLLER variantens bild till
  // huvudbilden. Mätt på en dold testprodukt 2026-10-23: en bild som satts av en namn-skrivning blev huvudbilden igen efter en id-skrivning som ändrade en lista, och
  // efter en id-skrivning som länkade den andra optionen. Det är därför varukorgen visade fel färg på sidor som rättats med länkar. Nattens `/api/cron/variantbild`
  // såg det inte förrän motorn lärde sig det (2026-10-23, PR #762): med länkar på båda optionerna ger `forvantadBild` nu färgens första foto (`forsta_val`) i stället
  // för ingen förväntan (`inget_snitt`), och `byggVariantbildKropp` lägger färgen först i varje variant, så svepet rättar sådana sidor själv. Skriptet här är samma
  // skrivning för hand: kör det efter varje id-skrivning på en sådan sida så länge PR #762 inte är mergad, och för att mäta Wix sida i torrläge.
  //
  // Receptet är farg-forst.js steg B utan att optionerna läggs om: varianterna skrivs om med valen bara med namn (`products-with-inventory`, ingen fältmask, aldrig
  // `inventoryItem`), och valen läggs FÄRG FÖRST i varje variant. Då räknar Wix variantens bild ur färgens första länkade foto, även när optionerna står
  // Storlek, Färg och storleken också har länkar (mätt på dold testprodukt 2026-10-23: valen Färg, Storlek med optionerna Storlek > Färg gav färgens första foto).
  // Variantens valordning ändras alltså, men optionernas ordning och därmed väljarna i butiken är oförändrade.
  //
  // Regler som inte ska tas bort:
  //   1. ☠️ Varje färgval ska ha minst en länkad bild, annars blir variantens bild något annat än färgens foto. Sidan hoppas över.
  //   2. ☠️ Det som inte ska ändras jämförs före och efter: galleriet i ordning med alt-texter, varje vals länkar, optionernas ordning, varianternas id, SKU, pris,
  //      jämförpris, kostnad, synlighet och val, lagret, produktens namn, adress och synlighet. Minsta avvikelse syns i svaret (`ok: false`).
  //   3. ☠️ Kostnaden (`revenueDetails.cost`) kräver `MERCHANT_DATA`. Går den inte att läsa kastas 403 och ingenting skrivs.
  //   4. ☠️ Svaret bär bara wix-id, hex6 av fil-id, antal och avvikelser. Aldrig alt-texter, namn eller adresser (loggen är publik).
  //   5. En sida som redan är rätt skrivs inte (`redan_ratt`), så skriptet går att köra om.
  const T0 = Date.now();
  const IDS = [];
  const TORR = false;
  const FARG = "Färg";

  const lika = function (a, b) { return String(a || "").trim().toLowerCase() === String(b || "").trim().toLowerCase(); };
  const paus = function (ms) { return new Promise(function (r) { setTimeout(r, ms); }); };
  const hex = function (id) { return id ? String(id).replace(/^b379ce_/, "").slice(0, 6) : "ingen"; };
  const status = function (e) { const m = /\((\d{3})\)/.exec(String(e && e.message ? e.message : e)); return m ? Number(m[1]) : 0; };
  const meddelande = function (e) { return String(e && e.message ? e.message : e).replace(/request id:[^)]*/g, "").slice(0, 160); };
  const FALT = "?fields=MEDIA_ITEMS_INFO&fields=VARIANT_OPTION_CHOICE_NAMES&fields=MERCHANT_DATA";

  const kor = async function (id) {
    const URL = "https://www.wixapis.com/stores/v3/products/" + id;
    const id8 = String(id).slice(0, 8);
    const fel = function (steg, text, extra) { return Object.assign({ ok: false, steg: steg, id: id8, fel: text }, extra || {}); };
    const las = async function () { return (await wix.request({ method: "GET", url: URL + FALT })).data.product; };
    const items = function (p) { return ((p.media && p.media.itemsInfo && p.media.itemsInfo.items) || []).map(function (i) { return i.id + "|" + (i.altText || ""); }).join(";"); };
    const valAv = function (o) { return (o && o.choicesSettings && o.choicesSettings.choices) || []; };
    const lankar = function (c) { return (c.linkedMedia || []).map(function (m) { return m.id; }); };
    const varianter = function (p) { return (p.variantsInfo && p.variantsInfo.variants) || []; };
    const alla = function (p) { return (p.options || []).map(function (o) { return o.name + ":" + valAv(o).map(function (c) { return c.choiceId + "=" + lankar(c).join("+"); }).join("/"); }).join(";"); };
    const ordning = function (p) { return (p.options || []).map(function (o) { return o.name; }).join(">"); };
    const harBild = function (v) { return v.media && v.media.image ? v.media.image.id : (v.media && v.media.id) || null; };
    const valNamn = function (v) { return (v.choices || []).map(function (c) { return c.optionChoiceNames || {}; }); };
    const fargForst = function (v) { return lika((valNamn(v)[0] || {}).optionName, FARG); };
    const lager = async function () {
      const r = await wix.request({ method: "POST", url: "https://www.wixapis.com/stores/v3/inventory-items/query", body: { query: { filter: { productId: { $in: [id] } }, cursorPaging: { limit: 100 } } } });
      return (r.data.inventoryItems || []).map(function (x) { return x.variantId + ":" + x.quantity + ":" + x.availabilityStatus; }).sort().join(";");
    };
    const variantNyckel = function (v) {
      const namn = valNamn(v).map(function (n) { return n.optionName + "=" + n.choiceName; }).sort().join("|");
      return [v.id, v.sku, v.visible, v.price && v.price.actualPrice && v.price.actualPrice.amount, v.price && v.price.compareAtPrice && v.price.compareAtPrice.amount,
        v.revenueDetails && v.revenueDetails.cost && v.revenueDetails.cost.amount, namn].join(";");
    };

    const p0 = await las();
    const farg0 = (p0.options || []).find(function (o) { return lika(o.name, FARG); });
    if (!farg0) return fel("plan", "sidan har ingen option som heter " + FARG);
    if ((p0.options || []).length !== 2) return fel("plan", "sidan har inte exakt två optioner");
    const fargVal = valAv(farg0);
    for (const c of fargVal) {
      if (lankar(c).length === 0) return fel("plan", "ett färgval har inga länkade bilder (variantens bild skulle inte bli färgens foto)");
    }
    const forvantad = function (v) {
      const fc = valNamn(v).find(function (n) { return lika(n.optionName, FARG); });
      const val = fargVal.find(function (c) { return fc && lika(c.name, fc.choiceName); });
      return val ? lankar(val)[0] : null;
    };
    const bra = function (v) { const vill = forvantad(v); return fargForst(v) && (!vill || harBild(v) === vill); };
    const bildNu = function (p) { return varianter(p).map(function (v) { return valNamn(v).map(function (n) { return n.choiceName; }).join("/") + "→" + hex(harBild(v)); }); };
    if (varianter(p0).every(bra)) return { ok: true, id: id8, redan_ratt: true, variantbilder: bildNu(p0) };
    if (TORR) {
      return { ok: true, torr: true, id: id8, revision: p0.revision, optioner: ordning(p0), variantbildFore: bildNu(p0),
        variantbildEfter: varianter(p0).map(function (v) { return valNamn(v).map(function (n) { return n.choiceName; }).join("/") + "→" + hex(forvantad(v)); }) };
    }

    const lagerFore = await lager();
    const fore = {};
    varianter(p0).forEach(function (v) { fore[v.id] = variantNyckel(v); });
    const galleriFore = items(p0);
    const lankFore = alla(p0);
    const ordningFore = ordning(p0);

    // Skriv med nya försök: läser om före varje försök. Bara 404, 409, 429 och 5xx är övergående.
    let skrivet = false;
    let sista = "";
    for (let f = 0; f < 4 && !skrivet; f++) {
      const p = f === 0 ? p0 : await las();
      try {
        const vs = varianter(p).map(function (v) {
          const val = valNamn(v).map(function (n) {
            if (!n.optionName || !n.choiceName) throw new Error("varianten " + v.id + " saknar valnamn (400)");
            const ut = { optionChoiceNames: { optionName: n.optionName, choiceName: n.choiceName } };
            if (n.renderType) ut.optionChoiceNames.renderType = n.renderType;
            return ut;
          });
          val.sort(function (a, b) { return (lika(a.optionChoiceNames.optionName, FARG) ? 0 : 1) - (lika(b.optionChoiceNames.optionName, FARG) ? 0 : 1); });
          const ut = { id: v.id, choices: val, price: v.price, sku: v.sku, barcode: v.barcode === undefined ? null : v.barcode, visible: v.visible, physicalProperties: v.physicalProperties || {} };
          const kost = v.revenueDetails && v.revenueDetails.cost;
          if (kost && typeof kost === "object") ut.revenueDetails = { cost: kost };
          return ut;
        });
        await wix.request({ method: "PATCH", url: "https://www.wixapis.com/stores/v3/products-with-inventory/" + id, body: { product: { id: id, revision: p.revision, visible: p.visible, options: p.options, variantsInfo: { variants: vs } } } });
        skrivet = true;
      } catch (e) {
        sista = status(e) + " " + meddelande(e);
        const s = status(e);
        if (!(s === 404 || s === 409 || s === 429 || s >= 500)) return fel("varianter", sista, { obs: "ingenting ändrat" });
        await paus(3000);
      }
    }
    if (!skrivet) return fel("varianter", "skrevs inte efter fyra försök: " + sista);

    const avvik = [];
    let pn = null;
    for (let f = 0; f < 5; f++) {
      await paus(3000);
      pn = await las();
      avvik.length = 0;
      if (items(pn) !== galleriFore) avvik.push("galleriet (ordning, innehåll eller alt-texter)");
      if (ordning(pn) !== ordningFore) avvik.push("optionsordningen");
      if (alla(pn) !== lankFore) avvik.push("länkarna");
      const efterV = varianter(pn);
      if (efterV.length !== varianter(p0).length) avvik.push("antalet varianter");
      efterV.forEach(function (v) {
        if (fore[v.id] !== variantNyckel(v)) avvik.push("variant " + String(v.id).slice(0, 8) + ": id, SKU, pris, kostnad, synlighet eller val");
        const vill = forvantad(v);
        if (vill && harBild(v) !== vill) avvik.push("variant " + String(v.id).slice(0, 8) + ": bilden är " + hex(harBild(v)) + ", väntade " + hex(vill));
        if (!fargForst(v)) avvik.push("variant " + String(v.id).slice(0, 8) + ": valen ligger inte Färg först");
      });
      if (p0.name !== pn.name || p0.slug !== pn.slug) avvik.push("namn eller adress");
      if (p0.visible !== pn.visible) avvik.push("synligheten");
      if (avvik.length === 0) break;
    }
    const lagerEfter = await lager();
    if (lagerFore !== lagerEfter) avvik.push("lagret");
    return { ok: avvik.length === 0, id: id8, avvikelser: avvik, revision: p0.revision + " → " + pn.revision, variantbilder: bildNu(pn) };
  };

  const ut = [];
  for (const id of IDS) {
    if (Date.now() - T0 > 42000) { ut.push({ ok: false, steg: "tid", id: String(id).slice(0, 8), fel: "ej körd, tiden räckte inte (kör om)" }); continue; }
    try { ut.push(await kor(id)); } catch (e) { ut.push({ ok: false, steg: "undantag", id: String(id).slice(0, 8), fel: meddelande(e) }); }
  }
  return ut;
}
