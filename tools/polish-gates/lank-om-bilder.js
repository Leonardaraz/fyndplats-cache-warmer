async function () {
  // lank-om-bilder.js (2026-10-22): flyttar länkar mellan val på en publicerad sida utan att röra galleriet, och läser tillbaka.
  // Kör via ExecuteWixAPI. Behövs när en bild som redan ligger i galleriet visas i FEL vy: omgång 4 hittade två sådana sidor.
  //   · Miniväxthuset hade tre foton av versionen med vitt överdrag olänkade. Butiken knyter ett olänkat foto till den färg alt-texten
  //     nämner, och två av alt-texterna nämner en grön list och en grön stålram, så fotona visades under Grön.
  //   · Skrivbordet hade ett foto av ekskivan länkat till storleken 63 cm, så det visades som andra bild under Svart och Vit, och
  //     snittet mellan storlekens och färgens länkar var tomt (förut `inget_snitt` i lib/wix/variant-media.ts, sedan 2026-10-23 `forsta_val`: färgens första foto).
  // Samma recept som `skriv-fargbilder.js` steg 3 och som lib/aosom/livsbild.ts `skrivSida`: options och variantsInfo ordagrant ur
  // produktens egen GET, valens nya linkedMedia, `visible` explicit, försök om vid 404/409, återläsning av allt som inte ska ändras.
  //
  //   PLANER = [ { id, axel, tomt, lankar: { "<valets namn>": ["<fil-id>", ...] } } ]   (högst tre sidor per körning, 60 s-taket)
  //     axel    optionens namn, standard "Färg"
  //     lankar  valets NYA lista, ersätter hela den gamla och gäller i den ordningen. Val som inte nämns rörs inte.
  //     tomt    namn på val som får lämnas utan länkade bilder (standard inga): ett val som hade bilder får annars inte tömmas
  //
  // Regler som inte ska tas bort:
  //   1. ☠️ Galleriet skrivs ALDRIG här. Varje fil-id måste redan ligga i galleriet, och ordningen där ändras inte.
  //   2. ☠️ En bild får inte länkas från två val i samma option. Då visas den under två färger, och det är felet verktyget lagar.
  //      Undantaget är `FLERA_I_OPTION` (2026-10-23), som bara bygg-agare.py slår på, och bara när butikens sida bär `imageKopplingar`
  //      (butiksändringen "en bild per kombination"): där syns en bild under VARJE val i optionen som länkar den, i den gamla butiken
  //      bara under det första. Väggspegelns breda foton hör till både 50 × 70 och 60 × 90 cm, men inte till 50 × 110.
  //      Spärren gäller NYA länkar (2026-10-23): en dubbelkoppling som redan finns får stå kvar eller minskas. Trädgårdspallens kort är
  //      kopplade till båda färgerna och ska vara det, medan miljöfotot med den gröna pallen ska bort från Blå. Att ta bort den länken
  //      skapar ingenting nytt, och i den gamla butiken syns kortet fortfarande bara under det första valet, som i dag.
  //   3. ☠️ Ett val som hade länkade bilder får inte lämnas utan, om det inte står i `tomt`. Variantens bild räknas ur länkarna.
  //   4. Ingen bild tas bort ur galleriet, och ingen länk tappas tyst: återläsningen jämför varje vals lista mot planen.
  //   5. Varianternas id, SKU, synlighet och pris, produktens synlighet, namn och adress och galleriets ordning ska vara lika före
  //      och efter. Avviker något är svaret `ok: false`.
  // Efter en omlänkning kan variantens bild (varukorgens bild) vara fel. Kör variantbild.yml (dryRun=false) eller rutten
  // `/api/cron/variantbild`, som räknar om den.
  //
  // `TORR` (2026-10-22): true skriver ingenting och returnerar, på en option som inte är färg, butikens vy per val före och efter
  // (samma regel som katalogkontroll-val-antal.js och skriv-fargbilder.js). Läs att varje val du vill ska växa växer, och att inget
  // val hamnar under fyra bilder, innan du kör skarpt (bygg-lank.py --torr bygger den).
  const PLANER = [{ id: "", axel: "Färg", tomt: [], lankar: {} }];
  const TORR = false;
  const FLERA_I_OPTION = false;
  const T0 = Date.now();

  const lika = function (a, b) { return String(a || "").trim().toLowerCase() === String(b || "").trim().toLowerCase(); };
  const paus = function (ms) { return new Promise(function (r) { setTimeout(r, ms); }); };
  const vyerAv = function (galleriIds, valLista, lankMap) {
    const lankade = new Set();
    valLista.forEach(function (c) { (lankMap[c.choiceId] || []).forEach(function (id) { lankade.add(id); }); });
    const delade = galleriIds.filter(function (id) { return !lankade.has(id); });
    const agda = new Set();
    const ut = {};
    valLista.forEach(function (c) {
      const egna = (lankMap[c.choiceId] || []).filter(function (id) { return galleriIds.indexOf(id) >= 0 && !agda.has(id); });
      egna.forEach(function (id) { agda.add(id); });
      const antal = new Set(egna.concat(delade)).size;
      ut[c.name] = antal > 0 ? antal : galleriIds.length;
    });
    return ut;
  };
  // ☠️ Varukostnaden (revenueDetails.cost) följer med tillbaka. En variantsInfo-PATCH ersätter varianten, och en läsning utan MERCHANT_DATA bär
  // ingen kostnad: förut nollade varje länkskrivning här kostnaden på varje variant (lib/wix/produkt-kostnad.ts). `profit` och `profitMargin` räknas
  // av Wix och är skrivskyddade, så bara kostnaden skickas.
  const utanVinst = function (vi) {
    const ut = JSON.parse(JSON.stringify(vi));
    (ut.variants || []).forEach(function (v) {
      const kost = v.revenueDetails && v.revenueDetails.cost;
      if (kost && typeof kost === "object") v.revenueDetails = { cost: kost }; else delete v.revenueDetails;
    });
    return ut;
  };
  const lankEn = async function (PLAN) {
    const URL = "https://www.wixapis.com/stores/v3/products/" + PLAN.id;
    const FALT = "?fields=MEDIA_ITEMS_INFO&fields=VARIANT_OPTION_CHOICE_NAMES&fields=MERCHANT_DATA";
    const las = async function () { return (await wix.request({ method: "GET", url: URL + FALT })).data.product; };
    const galleriAv = function (p) { return ((p.media && p.media.itemsInfo && p.media.itemsInfo.items) || []).map(function (i) { return i.id; }); };
    const fel = function (steg, text) { return { ok: false, steg: steg, id: String(PLAN.id).slice(0, 8), fel: text }; };
    const axelNamn = PLAN.axel || "Färg";

    if (!/^[0-9a-f-]{36}$/.test(PLAN.id)) return fel("plan", "ogiltigt id");
    const namnen = Object.keys(PLAN.lankar || {});
    if (namnen.length === 0) return fel("plan", "inga länkar i planen");
    const p0 = await las();
    const ax0 = (p0.options || []).find(function (o) { return lika(o.name, axelNamn); });
    if (!ax0) return fel("plan", "sidan har ingen option som heter " + axelNamn);
    const val0 = (ax0.choicesSettings && ax0.choicesSettings.choices) || [];
    const galleri0 = galleriAv(p0);
    const iGalleriet = new Set(galleri0);
    const nya = {};
    const gamla = {};
    val0.forEach(function (c) { gamla[c.choiceId] = (c.linkedMedia || []).map(function (m) { return m.id; }); });

    // 1. Granska planen mot den färska läsningen.
    for (const namn of namnen) {
      const c = val0.find(function (x) { return lika(x.name, namn); });
      if (!c) return fel("plan", "valet finns inte: " + namn);
      const lista = PLAN.lankar[namn];
      if (!Array.isArray(lista)) return fel("plan", "länkarna för " + namn + " är ingen lista");
      for (const f of lista) {
        if (!/^b379ce_[0-9a-f]{32}~mv2\.[a-z0-9]+$/i.test(f)) return fel("plan", "ogiltigt fil-id: " + String(f).slice(0, 20));
        if (!iGalleriet.has(f)) return fel("plan", "filen ligger inte i galleriet (verktyget skriver aldrig galleriet): " + f.slice(7, 15));
      }
      if (new Set(lista).size !== lista.length) return fel("plan", "en fil står två gånger i listan för " + namn);
      const tomtOk = (PLAN.tomt || []).some(function (t) { return lika(t, namn); });
      if (lista.length === 0 && gamla[c.choiceId].length > 0 && !tomtOk) return fel("plan", namn + " hade länkade bilder och skulle lämnas utan (lägg valet i `tomt` om det är meningen)");
      nya[c.choiceId] = lista;
    }
    const slutligt = {};
    val0.forEach(function (c) { slutligt[c.choiceId] = nya[c.choiceId] || gamla[c.choiceId]; });
    const agare = {};
    const nyLank = function (f) { return val0.some(function (x) { return slutligt[x.choiceId].indexOf(f) >= 0 && gamla[x.choiceId].indexOf(f) < 0; }); };
    for (const c of val0) {
      for (const f of slutligt[c.choiceId]) {
        if (agare[f] && !FLERA_I_OPTION && nyLank(f)) return fel("plan", "filen " + f.slice(7, 15) + " skulle vara länkad från både " + agare[f] + " och " + c.name);
        agare[f] = c.name;
      }
    }
    if (TORR) {
      const iFarg = lika(axelNamn, "Färg");
      return {
        ok: true,
        torr: true,
        id: PLAN.id.slice(0, 8),
        vyFore: iFarg ? null : vyerAv(galleri0, val0, gamla),
        vyEfter: iFarg ? null : vyerAv(galleri0, val0, slutligt),
        valLankar: val0.map(function (c) { return c.name + ": " + gamla[c.choiceId].length + " → " + slutligt[c.choiceId].length; }),
      };
    }

    // 2. Länkarna: options + variantsInfo ordagrant ur GET:en, valens nya linkedMedia, visible explicit. Försöker om vid 404/409.
    const nyaOptions = JSON.parse(JSON.stringify(p0.options));
    const axN = nyaOptions.find(function (o) { return lika(o.name, axelNamn); });
    axN.choicesSettings.choices.forEach(function (c) {
      if (nya[c.choiceId]) c.linkedMedia = nya[c.choiceId].map(function (id) { return { id: id }; });
    });
    let skriven = false;
    let sistaFel = "";
    let pn = p0;
    for (let f = 0; f < 8 && !skriven; f++) {
      try {
        await wix.request({
          method: "PATCH",
          url: URL,
          body: { product: { revision: pn.revision, visible: pn.visible, options: nyaOptions, variantsInfo: utanVinst(pn.variantsInfo) }, fieldMask: { paths: ["options", "variantsInfo", "visible"] } },
        });
        skriven = true;
      } catch (e) {
        sistaFel = String(e && e.message ? e.message : e).slice(0, 160);
        await paus(3000);
        pn = await las();
        // Har någon annan ändrat valens länkar under tiden vill vi inte skriva över det.
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
        const vant = slutligt[c.choiceId] || [];
        const nu = (c.linkedMedia || []).map(function (m) { return m.id; });
        if (vant.join(",") !== nu.join(",")) avvik.push("länkar i " + c.name);
      });
      if (avvik.length === 0) break;
    }
    if (galleriAv(p2).join(",") !== galleri0.join(",")) avvik.push("galleriets ordning");
    const varV = function (p) { return ((p.variantsInfo && p.variantsInfo.variants) || []).map(function (v) { return [v.id, v.sku, v.visible, v.price && v.price.actualPrice && v.price.actualPrice.amount, v.revenueDetails && v.revenueDetails.cost && v.revenueDetails.cost.amount].join("|"); }).join(";"); };
    if (varV(p0) !== varV(p2)) avvik.push("varianternas id, SKU, synlighet, pris eller kostnad");
    if (p0.visible !== p2.visible) avvik.push("synligheten");
    if (p0.slug !== p2.slug || p0.name !== p2.name) avvik.push("namn eller adress");
    const andra = (p2.options || []).filter(function (o) { return !lika(o.name, axelNamn); });
    const andraFore = (p0.options || []).filter(function (o) { return !lika(o.name, axelNamn); });
    const andraLankar = function (lista) { return lista.map(function (o) { return o.name + ":" + ((o.choicesSettings && o.choicesSettings.choices) || []).map(function (c) { return (c.linkedMedia || []).map(function (m) { return m.id; }).join("+"); }).join("/"); }).join(";"); };
    if (andraLankar(andra) !== andraLankar(andraFore)) avvik.push("länkarna i en annan option");
    const ax3 = (p2.options || []).find(function (o) { return lika(o.name, axelNamn); });
    return {
      ok: avvik.length === 0,
      id: PLAN.id.slice(0, 8),
      avvikelser: avvik,
      revision: p0.revision + " → " + p2.revision,
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
