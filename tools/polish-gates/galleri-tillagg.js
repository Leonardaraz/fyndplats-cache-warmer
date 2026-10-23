async function () {
  // galleri-tillagg.js (2026-10-23): lägger uppladdade filer SIST i galleriet på en publicerad sida, med alt-text. Kör via ExecuteWixAPI, byggt av
  // bygg-galleritillagg.py ur en plan (högst en sida per körning, 60 s-taket). `TORR` skriver ingenting.
  //
  // Varför: måttkorten per storlek (tools/polish-assets/runda-bilder-tva-axlar-kort) ska in i galleriet innan de länkas till sin storlek. Länkverktygen
  // (`bygg-agare.py` → `lank-om-bilder.js`) rör aldrig galleriet, och `skriv-storlekskort.js` vägrar en storlek som redan bär länkade bilder.
  // Det här är den första halvan för sidor där storlekarna redan äger måttbilder: bara galleriet, ingenting annat.
  //
  // Regler som inte ska tas bort:
  //   1. ☠️ Bara tillägg. Galleriets gamla bilder står kvar i samma ordning med samma alt-text, och huvudbilden rörs inte.
  //   2. ☠️ Filerna ska vara uppladdade och READY hos Wix, annars skrivs ingenting (en PENDING-fil i ett galleri hade visats som trasig).
  //   3. ☠️ Kontrollsumman av den inbäddade planen räknas om här. En plan som skrivits av för hand avvisas.
  //   4. ☠️ Det som inte ska ändras jämförs före och efter: varianternas id, SKU, pris, kostnad, synlighet och val, lagret, produktens namn, adress och
  //      synlighet, och varje vals länkade bilder. Minsta avvikelse syns i svaret (`ok: false`).
  //   5. ☠️ Svaret bär bara wix-id, hex6 av fil-id, antal och avvikelser. Aldrig alt-texter, namn eller adresser (loggen är publik).
  //   6. ☠️ Variantens bild (Wix `variantsInfo.variants[].media`) rapporteras före och efter, och ett ändrat läge räknas INTE som fel. Mätt 2026-10-23 på tre
  //      publicerade sidor: en galleriskrivning (`products` PATCH, fältmask `media`) NOLLSTÄLLER variantbilden till huvudbilden på varje variant, fast länkar, id, SKU,
  //      pris och lager står kvar. `variantbild-farg.js` (två optioner) eller `variantbild.yml` (en option) ska därför följa efter varje körning av det här skriptet.
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
  if (!PLAN) return { ok: false, steg: "plan", fel: "ingen plan inbäddad (bygg skriptet med bygg-galleritillagg.py)" };
  const sum = fnv(JSON.stringify(PLAN));
  if (sum !== SUM) return { ok: false, steg: "plan", fel: "inbäddad plan skiljer från facit (avskriftsfel)", sum: sum, vantat: SUM };

  const paus = function (ms) { return new Promise(function (r) { setTimeout(r, ms); }); };
  const hex = function (id) { return String(id || "").replace(/^b379ce_/, "").slice(0, 6); };
  const id8 = String(PLAN.id).slice(0, 8);
  const fel = function (steg, text, extra) { return Object.assign({ ok: false, steg: steg, id: id8, fel: text }, extra || {}); };
  const URL = "https://www.wixapis.com/stores/v3/products/" + PLAN.id;
  const FALT = "?fields=MEDIA_ITEMS_INFO&fields=VARIANT_OPTION_CHOICE_NAMES&fields=MERCHANT_DATA";
  const las = async function () { return (await wix.request({ method: "GET", url: URL + FALT })).data.product; };
  const items = function (p) { return ((p.media && p.media.itemsInfo && p.media.itemsInfo.items) || []).map(function (i) { return { id: i.id, altText: i.altText || "" }; }); };
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
  const allaLankar = function (p) {
    return (p.options || []).map(function (o) { return o.name + ":" + valAv(o).map(function (c) { return c.choiceId + "=" + lankar(c).join("+"); }).join("/"); }).join(";");
  };
  const optionsordning = function (p) { return (p.options || []).map(function (o) { return o.name; }).join(">"); };
  const variantbilder = function (p) {
    return varianter(p).map(function (v) {
      const namn = (v.choices || []).map(function (c) { return (c.optionChoiceNames || {}).choiceName; }).join("/");
      return namn + "→" + hex(v.media && v.media.image ? v.media.image.id : null);
    });
  };
  const FORBJUDET = /aosom|homcom|outsunny|pawhut|vinsetto|aliexpress|leverant/i;

  // 1. Planen mot en färsk läsning.
  if (!/^[0-9a-f-]{36}$/.test(PLAN.id)) return fel("plan", "ogiltigt id");
  if (!Array.isArray(PLAN.filer) || PLAN.filer.length === 0) return fel("plan", "inga filer i planen");
  const p0 = await las();
  const items0 = items(p0);
  const gal0 = items0.map(function (i) { return i.id; });
  const nya = [];
  for (const f of PLAN.filer) {
    if (!/^b379ce_[0-9a-f]{32}~mv2\.[a-z0-9]+$/i.test(f.fil)) return fel("plan", "ogiltigt fil-id: " + String(f.fil).slice(0, 20));
    if (gal0.indexOf(f.fil) >= 0) return fel("plan", "filen ligger redan i galleriet: " + hex(f.fil));
    if (nya.some(function (n) { return n.id === f.fil; })) return fel("plan", "filen står två gånger i planen: " + hex(f.fil));
    const alt = String(f.alt || "").trim();
    if (alt.length < 20 || alt.length > 250 || FORBJUDET.test(alt)) return fel("plan", "alt-texten duger inte för " + hex(f.fil));
    if (TORR !== "fake") {
      const fr = await wix.request({ method: "GET", url: "https://www.wixapis.com/site-media/v1/files/get-file-by-id?fileId=" + encodeURIComponent(f.fil) });
      const st = fr.data && fr.data.file && fr.data.file.operationStatus;
      if (st !== "READY") return fel("plan", "filen är inte klar hos Wix (" + st + "): " + hex(f.fil));
    }
    nya.push({ id: f.fil, altText: alt });
  }
  const nyaItems = items0.concat(nya);
  if (nyaItems.length > 50) return fel("plan", "galleriet skulle få " + nyaItems.length + " bilder, Wix tar 50");
  if (TORR) {
    return { ok: true, torr: true, id: id8, galleri: items0.length + " → " + nyaItems.length, filer: nya.map(function (n) { return hex(n.id); }), variantbilderFore: variantbilder(p0) };
  }

  const lagerFore = await lager();
  const fore = {};
  varianter(p0).forEach(function (v) { fore[v.id] = variantNyckel(v); });
  const lankarFore = allaLankar(p0);
  const ordningFore = optionsordning(p0);

  // 2. Skriv med nya försök: läser om före varje försök och bygger kroppen ur den färska läsningen. Bara 404, 409, 429 och 5xx är övergående.
  const post = function (i) { return i.altText ? { id: i.id, altText: i.altText } : { id: i.id }; };
  let sista = "";
  let skrivet = false;
  for (let f = 0; f < 5 && !skrivet; f++) {
    const p = await las();
    try {
      if (items(p).map(function (i) { return i.id; }).join(",") !== gal0.join(",")) return fel("galleri", "galleriet ändrades av något annat (409)");
      await wix.request({
        method: "PATCH",
        url: URL,
        body: { product: { revision: p.revision, media: { itemsInfo: { items: nyaItems.map(post) } } }, fieldMask: { paths: ["media"] } },
      });
      skrivet = true;
    } catch (e) {
      sista = status(e) + " " + meddelande(e);
      const s = status(e);
      if (!(s === 404 || s === 409 || s === 429 || s >= 500)) return fel("galleri", sista);
      await paus(3000);
    }
  }
  if (!skrivet) return fel("galleri", "efter fem försök: " + sista);

  // 3. Återläsning av allt.
  const vantat = nyaItems.map(function (i) { return i.id; }).join(",");
  const vantatAlt = nyaItems.map(function (i) { return i.altText; }).join("\u0001");
  const avvik = [];
  let pn = null;
  let klar = false;
  for (let f = 0; f < 6 && !klar; f++) {
    await paus(3500);
    pn = await las();
    avvik.length = 0;
    const efter = items(pn);
    if (efter.map(function (i) { return i.id; }).join(",") !== vantat) avvik.push("galleriets innehåll eller ordning");
    else if (efter.map(function (i) { return i.altText; }).join("\u0001") !== vantatAlt) avvik.push("alt-texterna");
    if (allaLankar(pn) !== lankarFore) avvik.push("valens länkar");
    if (optionsordning(pn) !== ordningFore) avvik.push("optionernas ordning");
    const efterV = varianter(pn);
    if (efterV.length !== varianter(p0).length) avvik.push("antalet varianter");
    efterV.forEach(function (v) {
      if (fore[v.id] !== variantNyckel(v)) avvik.push("variant " + String(v.id).slice(0, 8) + ": id, SKU, pris, kostnad, synlighet eller val");
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
    filer: nya.map(function (n) { return hex(n.id); }),
    variantbilderFore: variantbilder(p0),
    variantbilderEfter: variantbilder(pn),
    sek: Math.round((Date.now() - T0) / 100) / 10,
  };
}
