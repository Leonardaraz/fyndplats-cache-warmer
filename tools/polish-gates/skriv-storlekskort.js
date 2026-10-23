async function () {
  // skriv-storlekskort.js (2026-10-23): ett måttkort per STORLEK på en publicerad tvåaxlig sida (Färg × Storlek). Kör via ExecuteWixAPI,
  // byggt av bygg-storlekskort.py ur en plan (högst en sida per körning, 60 s-taket). `TORR` skriver ingenting.
  //
  // Varför: soptunnan c841717c hade fem måttbilder som var och en visade EN färg i EN storlek (svart 45, svart 60, silver 45, silverkortet för 60
  // och ett silverfoto med 60-litersmåtten). Wix länkar en bild till ett val, aldrig till en kombination, så en måttbild länkad till en färg
  // följde med under båda storlekarna, och Leonard såg 60-litersbilden när han valde 45 liter (2026-10-23). Det går inte att ordna med länkar:
  // butiken visar för en kombination bilder som ägs av färgens eller storlekens val (`imageOwners` i sidans data), och det finns ingen skärning.
  // Det som går är kort som är färgneutrala och storleksspecifika: ett per storlek, länkat till storleken, medan färgfotona är länkade till färgen.
  //
  // Mätt på dolda testprodukter 2026-10-23 (lib/wix/variant-media.ts har en annan regel, "snittet", som inte stämde):
  //   · Wix räknar om variantens bild (varukorg, kassa, order) bara vid en skrivning av `products-with-inventory` med varianternas val enbart
  //     med NAMN. Skrivningar med val-id och `products` rör den inte.
  //   · Variantens bild är första länkade bilden hos det FÖRSTA valet i variantens egen `choices`-lista som har länkade bilder. Ordningen på
  //     optionerna ensam räcker inte: en skrivning med optionerna omvända men varianternas val i gammal ordning gav storlekskortet.
  //   · Med Storlek först fick varje variant sitt storlekskort som varukorgsbild. Med Färg först, i optionerna OCH i varje variants val, fick
  //     Svart sitt svarta och Silver sitt silverfoto, och ordningen låg kvar efter en omskrivning.
  //   Verktyget lägger därför Färg först på båda ställena och gör namn-skrivningen sist.
  //
  // Stegen, var och en med återläsning (och galleriet rullas tillbaka om länkningen faller):
  //   1. Korten läggs sist i galleriet med alt-text (`products` PATCH, fältmask `media`). Filerna ska vara uppladdade och READY.
  //   2. Varje kort länkas till sin storlek, och optionerna läggs i ordningen Färg, Storlek (`products` PATCH: options + variantsInfo ordagrant ur
  //      GET:en, `visible` med). Färgens länkar rörs inte.
  //   3. Varianterna skrivs om med valen bara med namn, Färg först (`products-with-inventory`, ingen fältmask, aldrig `inventoryItem`), så att
  //      Wix räknar om variantbilden: första bilden i färgens lista.
  //   4. Allt som inte ska ändras jämförs före och efter: varianternas id, SKU, pris, kostnad, synlighet, lagret, produktens namn, adress och
  //      synlighet, färgens länkar och galleriets gamla bilder i ordning.
  //
  // Regler som inte ska tas bort:
  //   1. ☠️ Storleksvalen får inte ha länkade bilder från början. En storlek som redan bär bilder har en annan historia (sammanslagningen) och
  //      ska ses av en människa. Verktyget vägrar.
  //   2. ☠️ Varje färgval ska ha minst en länkad bild, annars blir variantens bild storlekskortet.
  //   3. ☠️ Kontrollsumman av den inbäddade planen räknas om här. En plan som skrivits av för hand avvisas.
  //   4. Verktyget tar aldrig bort en bild. De gamla måttbilderna tas bort med bilder-bort.yml (torrt först, sedan skarpt med planens sha) EFTER
  //      att korten är länkade, så att ingen vy någonsin visar en bild som saknar ägare.
  //   5. ☠️ Svaret bär bara wix-id, hex6 av fil-id, antal och avvikelser. Aldrig alt-texter, namn eller adresser (loggen är publik).
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
  if (!PLAN) return { ok: false, steg: "plan", fel: "ingen plan inbäddad (bygg skriptet med bygg-storlekskort.py)" };
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
  const FORBJUDET = /aosom|homcom|outsunny|pawhut|vinsetto|aliexpress|leverant/i;
  const ORDNING = [PLAN.farg, PLAN.storlek];

  // 1. Planen mot en färsk läsning.
  const p0 = await las();
  const items0 = items(p0);
  const gal0 = items0.map(function (i) { return i.id; });
  const farg0 = optionAv(p0, PLAN.farg);
  const stor0 = optionAv(p0, PLAN.storlek);
  if (!farg0) return fel("plan", "sidan har ingen option som heter " + PLAN.farg);
  if (!stor0) return fel("plan", "sidan har ingen option som heter " + PLAN.storlek);
  if ((p0.options || []).length !== 2) return fel("plan", "sidan har inte exakt två optioner");
  if (!/^[0-9a-f-]{36}$/.test(PLAN.id)) return fel("plan", "ogiltigt id");
  if (!Array.isArray(PLAN.kort) || PLAN.kort.length === 0) return fel("plan", "inga kort i planen");
  const fargVal = valAv(farg0);
  const storVal = valAv(stor0);
  for (const c of fargVal) {
    if (lankar(c).length === 0) return fel("plan", "färgvalet " + c.name + " har inga länkade bilder (variantens bild skulle bli ett storlekskort)");
  }
  for (const c of storVal) {
    if (lankar(c).length > 0) return fel("plan", "storleksvalet " + c.name + " bär redan länkade bilder: ses av en människa först");
  }
  const kortPerVal = {};
  for (const k of PLAN.kort) {
    if (!/^b379ce_[0-9a-f]{32}~mv2\.[a-z0-9]+$/i.test(k.fil)) return fel("plan", "ogiltigt fil-id: " + String(k.fil).slice(0, 20));
    if (gal0.indexOf(k.fil) >= 0) return fel("plan", "kortet ligger redan i galleriet: " + hex(k.fil));
    const alt = String(k.alt || "").trim();
    if (alt.length < 20 || alt.length > 250 || FORBJUDET.test(alt)) return fel("plan", "alt-texten duger inte för " + hex(k.fil));
    const c = storVal.find(function (x) { return lika(x.name, k.val); });
    if (!c) return fel("plan", "storleksvalet finns inte: " + k.val);
    if (kortPerVal[c.choiceId]) return fel("plan", "två kort för samma storlek: " + k.val);
    kortPerVal[c.choiceId] = k;
    if (TORR !== "fake") {
      const fr = await wix.request({ method: "GET", url: "https://www.wixapis.com/site-media/v1/files/get-file-by-id?fileId=" + encodeURIComponent(k.fil) });
      const st = fr.data && fr.data.file && fr.data.file.operationStatus;
      if (st !== "READY") return fel("plan", "filen är inte klar hos Wix (" + st + "): " + hex(k.fil));
    }
  }
  if (Object.keys(kortPerVal).length !== storVal.length) return fel("plan", "varje storlek ska få ett kort (" + storVal.length + " val, " + Object.keys(kortPerVal).length + " kort)");
  const nyaItems = items0.concat(PLAN.kort.map(function (k) { return { id: k.fil, altText: String(k.alt).trim() }; }));
  if (nyaItems.length > 50) return fel("plan", "galleriet skulle få " + nyaItems.length + " bilder, Wix tar 50");

  // Butikens vy per kombination efter ändringen: en bild ägs av första valet som länkar den, vyn är ägda bilder för färgen och storleken plus
  // olänkade, färgens första bild först.
  const vyEfter = function () {
    const agare = {};
    const lankMap = {};
    fargVal.forEach(function (c) { lankMap[c.choiceId] = lankar(c); });
    storVal.forEach(function (c) { lankMap[c.choiceId] = [kortPerVal[c.choiceId].fil]; });
    fargVal.concat(storVal).forEach(function (c) { lankMap[c.choiceId].forEach(function (f) { if (!agare[f]) agare[f] = c.choiceId; }); });
    const ut = {};
    fargVal.forEach(function (f) {
      storVal.forEach(function (s) {
        const ids = nyaItems.map(function (i) { return i.id; }).filter(function (id) { return !agare[id] || agare[id] === f.choiceId || agare[id] === s.choiceId; });
        const forst = lankMap[f.choiceId][0];
        ids.sort(function (a, b) { return (a === forst ? -1 : 0) - (b === forst ? -1 : 0); });
        ut[f.name + " × " + s.name] = ids.map(hex).join(",");
      });
    });
    return ut;
  };
  if (TORR) {
    return {
      ok: true,
      torr: true,
      id: id8,
      galleri: items0.length + " → " + nyaItems.length,
      optionerFore: (p0.options || []).map(function (o) { return o.name; }).join(" > "),
      optionerEfter: ORDNING.join(" > "),
      kort: PLAN.kort.map(function (k) { return k.val + " → " + hex(k.fil); }),
      vyEfter: vyEfter(),
      bildPerVariantEfter: fargVal.map(function (c) { return c.name + " → " + hex(lankar(c)[0]); }),
    };
  }

  const lagerFore = await lager();
  const fore = {};
  varianter(p0).forEach(function (v) { fore[v.id] = variantNyckel(v); });
  const forkropp = {};
  fargVal.forEach(function (c) { forkropp[c.choiceId] = lankar(c).join(","); });

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
  const rullaTillbaka = async function () {
    const r = await skriv("PATCH", URL, function (p) {
      return { product: { revision: p.revision, media: { itemsInfo: { items: items0.map(function (i) { return i.altText ? { id: i.id, altText: i.altText } : { id: i.id }; }) } } }, fieldMask: { paths: ["media"] } };
    }, "tillbakarullning");
    return r === null ? "galleriet återställt" : "GALLERIET KUNDE INTE ÅTERSTÄLLAS: " + r;
  };
  const post = function (i) { return i.altText ? { id: i.id, altText: i.altText } : { id: i.id }; };
  let pn = null;
  const vantaTills = async function (kontroll) {
    for (let f = 0; f < 6; f++) {
      await paus(3000);
      pn = await las();
      if (kontroll(pn)) return true;
    }
    return false;
  };

  // Steg 1: korten i galleriet.
  let e = await skriv("PATCH", URL, function (p) {
    if (items(p).map(function (i) { return i.id; }).join(",") !== gal0.join(",")) throw new Error("galleriet ändrades av något annat (409)");
    return { product: { revision: p.revision, media: { itemsInfo: { items: nyaItems.map(post) } } }, fieldMask: { paths: ["media"] } };
  }, "galleriet");
  if (e) return fel("galleri", e);
  const vantatGalleri = nyaItems.map(function (i) { return i.id; }).join(",");
  if (!(await vantaTills(function (p) { return items(p).map(function (i) { return i.id; }).join(",") === vantatGalleri; }))) {
    return fel("galleri", "galleriet läste inte tillbaka som planen", { tillbaka: await rullaTillbaka() });
  }

  // Steg 2: korten länkas till sin storlek, optionerna läggs Färg först.
  e = await skriv("PATCH", URL, function (p) {
    const opt = JSON.parse(JSON.stringify(p.options));
    const f = optionAv({ options: opt }, PLAN.farg);
    const s = optionAv({ options: opt }, PLAN.storlek);
    valAv(f).forEach(function (c) {
      if (fargVal.some(function (x) { return x.choiceId === c.choiceId && lankar(x).join(",") !== lankar(c).join(","); })) throw new Error("färgens länkar ändrades av något annat (409)");
    });
    valAv(s).forEach(function (c) { c.linkedMedia = [{ id: kortPerVal[c.choiceId].fil }]; });
    const ordnade = [f, s];
    return { product: { revision: p.revision, visible: p.visible, options: ordnade, variantsInfo: p.variantsInfo }, fieldMask: { paths: ["options", "variantsInfo", "visible"] } };
  }, "länkarna");
  if (e) return fel("lankar", e, { tillbaka: await rullaTillbaka() });
  const lankKontroll = function (p) {
    if ((p.options || []).map(function (o) { return o.name; }).join(">") !== ORDNING.join(">")) return false;
    return valAv(optionAv(p, PLAN.storlek)).every(function (c) { return lankar(c).join(",") === kortPerVal[c.choiceId].fil; });
  };
  if (!(await vantaTills(lankKontroll))) return fel("lankar", "länkarna och optionsordningen läste inte tillbaka som planen", { tillbaka: await rullaTillbaka() });

  // Steg 3: varianterna med valen bara med namn, Färg först, så att Wix räknar om variantens bild.
  e = await skriv("PATCH", "https://www.wixapis.com/stores/v3/products-with-inventory/" + PLAN.id, function (p) {
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
  if (e) return fel("varianter", e, { obs: "korten är länkade och optionerna omordnade; variantbilden är inte omräknad" });

  // Steg 4: återläsning av allt.
  const forvantad = function (v) {
    const fc = (v.choices || []).map(function (c) { return c.optionChoiceNames || {}; }).find(function (n) { return lika(n.optionName, PLAN.farg); });
    const val = fargVal.find(function (c) { return fc && lika(c.name, fc.choiceName); });
    return val ? lankar(val)[0] : null;
  };
  const avvik = [];
  let klar = false;
  for (let f = 0; f < 6 && !klar; f++) {
    await paus(3500);
    pn = await las();
    avvik.length = 0;
    if (items(pn).map(function (i) { return i.id; }).join(",") !== vantatGalleri) avvik.push("galleriets ordning eller innehåll");
    if (!lankKontroll(pn)) avvik.push("länkarna eller optionsordningen");
    fargVal.forEach(function (c) {
      const nu = valAv(optionAv(pn, PLAN.farg)).find(function (x) { return x.choiceId === c.choiceId; });
      if (!nu || lankar(nu).join(",") !== forkropp[c.choiceId]) avvik.push("färgens länkar i " + c.name);
    });
    const efterV = varianter(pn);
    if (efterV.length !== varianter(p0).length) avvik.push("antalet varianter");
    efterV.forEach(function (v) {
      if (fore[v.id] !== variantNyckel(v)) avvik.push("variant " + String(v.id).slice(0, 8) + ": id, SKU, pris, kostnad, synlighet eller val");
      const vill = forvantad(v);
      const har = v.media && v.media.image ? v.media.image.id : null;
      if (vill && har !== vill) avvik.push("variant " + String(v.id).slice(0, 8) + ": bilden är " + hex(har) + ", väntade " + hex(vill));
      const forsta = (v.choices || [])[0] && (v.choices[0].optionChoiceNames || {}).optionName;
      if (!lika(forsta, PLAN.farg)) avvik.push("variant " + String(v.id).slice(0, 8) + ": valen ligger inte Färg först");
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
    avvikelser: avvik,
    revision: p0.revision + " → " + pn.revision,
    galleri: items0.length + " → " + items(pn).length,
    optioner: (pn.options || []).map(function (o) { return o.name; }).join(" > "),
    variantbilder: varianter(pn).map(function (v) { return ((v.choices || []).map(function (c) { return (c.optionChoiceNames || {}).choiceName; }).join(" / ")) + " → " + hex(v.media && v.media.image ? v.media.image.id : null); }),
    vyEfter: vyEfter(),
    sek: Math.round((Date.now() - T0) / 100) / 10,
  };
}
