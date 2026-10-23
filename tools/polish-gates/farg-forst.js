async function () {
  // farg-forst.js (2026-10-23): Färg före Storlek på en publicerad tvåaxlig sida, och variantens bild räknas om. Kör via ExecuteWixAPI, byggt av
  // bygg-farg-forst.py ur en plan ({ id, farg, storlek }), högst en sida per körning (60 s-taket). `TORR` skriver ingenting.
  //
  // Varför: på en sida där färgerna bär sina foton och storlekarna sina måttkort (förvaringskistan b129d5ae, Leonard 2026-10-23) räknar Wix variantens
  // bild (varukorg, kassa, order) ur FÖRSTA valet i variantens egen `choices`-lista som har länkade bilder. Stod Storlek först blev det storlekens
  // måttkort på alla varianter. Mätt på dolda testprodukter 2026-10-23: med Färg först, i optionerna OCH i varje variants val, blir det färgens första
  // foto, och bilden räknas bara om vid en skrivning av `products-with-inventory` med valen enbart med NAMN (se skriv-storlekskort.js och CLAUDE.md,
  // "Tvåaxliga sidor"). Det här är samma steg 2 och 3 som där, utan korten: galleriet och alla länkar rörs inte.
  //
  // Stegen, med återläsning:
  //   A. Optionerna läggs i ordningen Färg, Storlek (`products` PATCH: options + variantsInfo ordagrant ur GET:en, `visible` med). Hoppas över om
  //      de redan ligger så. Länkarna rörs inte.
  //   B. Varianterna skrivs om med valen bara med namn, Färg först (`products-with-inventory`, ingen fältmask, aldrig `inventoryItem`). Hoppas
  //      över om varje variant redan har Färg först och färgens första foto som bild.
  //   C. Allt som inte ska ändras jämförs före och efter: galleriet i ordning med alt-texter, varje vals länkar, varianternas id, SKU, pris, kostnad,
  //      synlighet och val, lagret, produktens namn, adress och synlighet.
  //
  // Regler som inte ska tas bort:
  //   1. ☠️ Varje färgval ska ha minst en länkad bild, annars blir variantens bild något annat än färgens foto. Verktyget vägrar.
  //   2. ☠️ Kontrollsumman av den inbäddade planen räknas om här. En plan som skrivits av för hand avvisas.
  //   3. Verktyget lägger aldrig till eller tar bort en bild, och rör inga länkar.
  //   4. ☠️ Svaret bär bara wix-id, hex6 av fil-id, antal och avvikelser. Aldrig alt-texter, namn eller adresser (loggen är publik).
  const T0 = Date.now();
  const PLAN = null;
  const SUM = "";
  const TORR = false;

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
  if (!PLAN) return { ok: false, steg: "plan", fel: "ingen plan inbäddad (bygg skriptet med bygg-farg-forst.py)" };
  const sum = fnv(JSON.stringify(PLAN));
  if (sum !== SUM) return { ok: false, steg: "plan", fel: "inbäddad plan skiljer från facit (avskriftsfel)", sum: sum, vantat: SUM };

  const lika = function (a, b) { return String(a || "").trim().toLowerCase() === String(b || "").trim().toLowerCase(); };
  const paus = function (ms) { return new Promise(function (r) { setTimeout(r, ms); }); };
  const hex = function (id) { return String(id || "").replace(/^b379ce_/, "").slice(0, 6); };
  const id8 = String(PLAN.id).slice(0, 8);
  const fel = function (steg, text, extra) { return Object.assign({ ok: false, steg: steg, id: id8, fel: text }, extra || {}); };
  const URL = "https://www.wixapis.com/stores/v3/products/" + PLAN.id;
  const FALT = "?fields=MEDIA_ITEMS_INFO&fields=VARIANT_OPTION_CHOICE_NAMES&fields=MERCHANT_DATA";
  const las = async function () { return (await wix.request({ method: "GET", url: URL + FALT })).data.product; };
  const items = function (p) { return ((p.media && p.media.itemsInfo && p.media.itemsInfo.items) || []).map(function (i) { return { id: i.id, altText: i.altText || "" }; }); };
  const optionAv = function (p, namn) { return (p.options || []).find(function (o) { return lika(o.name, namn); }); };
  const valAv = function (o) { return (o && o.choicesSettings && o.choicesSettings.choices) || []; };
  const lankar = function (c) { return (c.linkedMedia || []).map(function (m) { return m.id; }); };
  const varianter = function (p) { return (p.variantsInfo && p.variantsInfo.variants) || []; };
  const status = function (e) { const m = /\((\d{3})\)/.exec(String(e && e.message ? e.message : e)); return m ? Number(m[1]) : 0; };
  const meddelande = function (e) { return String(e && e.message ? e.message : e).replace(/request id:[^)]*/g, "").slice(0, 160); };
  const lager = async function () {
    const r = await wix.request({ method: "POST", url: "https://www.wixapis.com/stores/v3/inventory-items/query", body: { query: { filter: { productId: { $in: [PLAN.id] } }, cursorPaging: { limit: 100 } } } });
    return (r.data.inventoryItems || []).map(function (x) { return x.variantId + ":" + x.quantity + ":" + x.availabilityStatus; }).sort().join(";");
  };
  const variantNyckel = function (v) {
    const namn = (v.choices || []).map(function (c) { const n = c.optionChoiceNames || {}; return n.optionName + "=" + n.choiceName; }).sort().join("|");
    return [v.id, v.sku, v.visible, v.price && v.price.actualPrice && v.price.actualPrice.amount, v.price && v.price.compareAtPrice && v.price.compareAtPrice.amount,
      v.revenueDetails && v.revenueDetails.cost && v.revenueDetails.cost.amount, namn].join(";");
  };
  const ORDNING = [PLAN.farg, PLAN.storlek];
  const ordningAv = function (p) { return (p.options || []).map(function (o) { return o.name; }).join(">"); };

  // 1. Planen mot en färsk läsning.
  const p0 = await las();
  const items0 = items(p0);
  const farg0 = optionAv(p0, PLAN.farg);
  const stor0 = optionAv(p0, PLAN.storlek);
  if (!/^[0-9a-f-]{36}$/.test(PLAN.id)) return fel("plan", "ogiltigt id");
  if (!farg0) return fel("plan", "sidan har ingen option som heter " + PLAN.farg);
  if (!stor0) return fel("plan", "sidan har ingen option som heter " + PLAN.storlek);
  if ((p0.options || []).length !== 2) return fel("plan", "sidan har inte exakt två optioner");
  const fargVal = valAv(farg0);
  const storVal = valAv(stor0);
  for (const c of fargVal) {
    if (lankar(c).length === 0) return fel("plan", "färgvalet " + c.name + " har inga länkade bilder (variantens bild skulle inte bli färgens foto)");
  }
  const lankFore = {};
  fargVal.concat(storVal).forEach(function (c) { lankFore[c.choiceId] = lankar(c).join(","); });
  const galleriFore = items0.map(function (i) { return i.id + "|" + i.altText; }).join(";");

  // Variantens bild enligt Wix regel: första länkade bilden hos det första valet i variantens egen lista som har länkade bilder. Med Färg först är
  // det färgens första foto.
  const forvantad = function (v) {
    const fc = (v.choices || []).map(function (c) { return c.optionChoiceNames || {}; }).find(function (n) { return lika(n.optionName, PLAN.farg); });
    const val = fargVal.find(function (c) { return fc && lika(c.name, fc.choiceName); });
    return val ? lankar(val)[0] : null;
  };
  const harBild = function (v) { return v.media && v.media.image ? v.media.image.id : null; };
  const fargForst = function (v) { const n = ((v.choices || [])[0] || {}).optionChoiceNames || {}; return lika(n.optionName, PLAN.farg); };

  // Butikens vy per kombination efter ändringen: en bild ägs av första valet som länkar den (färgerna före storlekarna), vyn är ägda bilder för färgen
  // och storleken plus olänkade, färgens första bild först.
  const vyEfter = function () {
    const agare = {};
    fargVal.concat(storVal).forEach(function (c) { lankar(c).forEach(function (f) { if (!agare[f]) agare[f] = c.choiceId; }); });
    const ut = {};
    fargVal.forEach(function (f) {
      storVal.forEach(function (s) {
        const ids = items0.map(function (i) { return i.id; }).filter(function (id) { return !agare[id] || agare[id] === f.choiceId || agare[id] === s.choiceId; });
        const forst = lankar(f)[0];
        ids.sort(function (a, b) { return (a === forst ? -1 : 0) - (b === forst ? -1 : 0); });
        ut[f.name + " × " + s.name] = ids.map(hex).join(",");
      });
    });
    return ut;
  };
  const bildNu = function (p) { return varianter(p).map(function (v) { return ((v.choices || []).map(function (c) { return (c.optionChoiceNames || {}).choiceName; }).join(" / ")) + " → " + hex(harBild(v)); }); };
  if (TORR) {
    return {
      ok: true,
      torr: true,
      id: id8,
      revision: p0.revision,
      optionerFore: ordningAv(p0).replace(/>/g, " > "),
      optionerEfter: ORDNING.join(" > "),
      variantbildFore: bildNu(p0),
      variantbildEfter: varianter(p0).map(function (v) { return ((v.choices || []).map(function (c) { return (c.optionChoiceNames || {}).choiceName; }).join(" / ")) + " → " + hex(forvantad(v)); }),
      varianterMedFargForst: varianter(p0).filter(fargForst).length + " av " + varianter(p0).length,
      vyEfter: vyEfter(),
    };
  }

  const lagerFore = await lager();
  const fore = {};
  varianter(p0).forEach(function (v) { fore[v.id] = variantNyckel(v); });

  // Skriv med nya försök: läser om före varje försök och bygger kroppen ur den färska läsningen. Bara 404, 409, 429 och 5xx är övergående.
  const skriv = async function (metod, url, bygg, steg) {
    let sista = "";
    for (let f = 0; f < 5; f++) {
      const p = await las();
      try {
        const kropp = bygg(p);
        await wix.request({ method: metod, url: url, body: kropp });
        return null;
      } catch (e) {
        sista = status(e) + " " + meddelande(e);
        const s = status(e);
        if (!(s === 404 || s === 409 || s === 429 || s >= 500)) return steg + ": " + sista;
        await paus(3000);
      }
    }
    return steg + " (efter fem försök): " + sista;
  };
  let pn = null;
  const vantaTills = async function (kontroll) {
    for (let f = 0; f < 6; f++) {
      await paus(3000);
      pn = await las();
      if (kontroll(pn)) return true;
    }
    return false;
  };
  const gjort = [];

  // Steg A: optionerna Färg först.
  if (ordningAv(p0) !== ORDNING.join(">")) {
    let e = await skriv("PATCH", URL, function (p) {
      const opt = JSON.parse(JSON.stringify(p.options));
      const f = optionAv({ options: opt }, PLAN.farg);
      const s = optionAv({ options: opt }, PLAN.storlek);
      fargVal.concat(storVal).forEach(function (c) {
        const nu = valAv(f).concat(valAv(s)).find(function (x) { return x.choiceId === c.choiceId; });
        if (!nu || lankar(nu).join(",") !== lankFore[c.choiceId]) throw new Error("länkarna ändrades av något annat (409)");
      });
      return { product: { revision: p.revision, visible: p.visible, options: [f, s], variantsInfo: p.variantsInfo }, fieldMask: { paths: ["options", "variantsInfo", "visible"] } };
    }, "optionerna");
    if (e) return fel("optioner", e);
    if (!(await vantaTills(function (p) { return ordningAv(p) === ORDNING.join(">"); }))) return fel("optioner", "optionsordningen läste inte tillbaka som planen");
    gjort.push("optionerna Färg först");
  }

  // Steg B: varianterna med valen bara med namn, Färg först, så att Wix räknar om variantens bild.
  const behover = function (p) { return varianter(p).some(function (v) { return !fargForst(v) || harBild(v) !== forvantad(v); }); };
  if (behover(await las())) {
    const e = await skriv("PATCH", "https://www.wixapis.com/stores/v3/products-with-inventory/" + PLAN.id, function (p) {
      const vs = varianter(p).map(function (v) {
        const val = (v.choices || []).map(function (c) {
          const n = c.optionChoiceNames || {};
          if (!n.optionName || !n.choiceName) throw new Error("varianten " + v.id + " saknar valnamn (400)");
          const ut = { optionChoiceNames: { optionName: n.optionName, choiceName: n.choiceName } };
          if (n.renderType) ut.optionChoiceNames.renderType = n.renderType;
          return ut;
        });
        val.sort(function (a, b) { return ORDNING.indexOf(a.optionChoiceNames.optionName) - ORDNING.indexOf(b.optionChoiceNames.optionName); });
        const ut = { id: v.id, choices: val, price: v.price, sku: v.sku, barcode: v.barcode === undefined ? null : v.barcode, visible: v.visible, physicalProperties: v.physicalProperties || {} };
        const kost = v.revenueDetails && v.revenueDetails.cost;
        if (kost && typeof kost === "object") ut.revenueDetails = { cost: kost };
        return ut;
      });
      return { product: { id: PLAN.id, revision: p.revision, visible: p.visible, options: p.options, variantsInfo: { variants: vs } } };
    }, "varianterna");
    if (e) return fel("varianter", e, { obs: gjort.length ? "optionerna är omordnade; variantbilden är inte omräknad" : "ingenting ändrat" });
    gjort.push("varianterna omskrivna med namn");
  }

  // Steg C: återläsning av allt.
  const avvik = [];
  let klar = false;
  for (let f = 0; f < 6 && !klar; f++) {
    await paus(3500);
    pn = await las();
    avvik.length = 0;
    if (items(pn).map(function (i) { return i.id + "|" + i.altText; }).join(";") !== galleriFore) avvik.push("galleriet (ordning, innehåll eller alt-texter)");
    if (ordningAv(pn) !== ORDNING.join(">")) avvik.push("optionsordningen");
    fargVal.concat(storVal).forEach(function (c) {
      const nu = valAv(optionAv(pn, PLAN.farg)).concat(valAv(optionAv(pn, PLAN.storlek))).find(function (x) { return x.choiceId === c.choiceId; });
      if (!nu || lankar(nu).join(",") !== lankFore[c.choiceId]) avvik.push("länkarna i " + c.name);
    });
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
    klar = avvik.length === 0;
  }
  const lagerEfter = await lager();
  if (lagerFore !== lagerEfter) avvik.push("lagret");
  return {
    ok: avvik.length === 0,
    id: id8,
    gjort: gjort,
    avvikelser: avvik,
    revision: p0.revision + " → " + pn.revision,
    optioner: ordningAv(pn).replace(/>/g, " > "),
    variantbilder: bildNu(pn),
    vyEfter: vyEfter(),
    sek: Math.round((Date.now() - T0) / 100) / 10,
  };
}
