async function () {
  // skriv-fargbilder.js (2026-10-21): lägger nya, redan importerade filer till en färg på en publicerad sida (AliExpress-sidor, där
  // aosom-fargtillagg inte gäller), och läser tillbaka. Kör via ExecuteWixAPI; filerna ligger i Media Manager (importerade med
  // UploadImageToWixSite, och verifierade mot originalen med verifiera_import.py). Samma steg som lib/aosom/livsbild.ts `skrivSida`:
  // galleriet ensamt vid fil-id, sedan länkarna med options och variantsInfo ordagrant ur produktens egen GET och `visible` explicit,
  // återläsning, och en jämförelse av allt som inte ska ändras (variant-id, SKU, pris, synlighet).
  //
  //   PLANER = [ { id, axel, tillagg: [ { fil, alt, val } ] } ]   (en eller flera sidor, fyra i taget; axel = optionens namn, standard "Färg")
  //     fil  Wix fil-id (b379ce_<32 hex>~mv2.<ext>), redan i Media Manager
  //     alt  svensk alt-text (5–200 tecken, ingen adress och inget leverantörs- eller husmärke)
  //     val  valets namn exakt som i Wix (färgen, eller storleken när axel är "Storlek"), eller null för en bild som ska visas för alla val
  //
  // Placering: en bild för en färg läggs efter färgens sista bild i galleriet och sist i färgens `linkedMedia`. En gemensam bild
  // läggs sist i galleriet och länkas inte. ☠️ En gemensam bild måste bli gemensam i BUTIKEN: alt-texten ska vara ett kort eller
  // nämna minst två färger (eller så ska ingen färg vara ett färgord), annars hör den till huvudbildens färg. Funktionen vägrar
  // en gemensam bild som skulle bli ägd av en färg. Ingen bild tas bort och ingen länk tappas.
  //
  // Tillagt 2026-10-22 (Cowork-rundan, bilder hämtade ur aosom.de:s galleri):
  //   1. ☠️ Varje fil kontrolleras mot Media Manager (`get-file-by-id`, operationStatus READY) innan något skrivs. En uppladdning via
  //      UploadImageToWixSite svarar PENDING, och en fil som aldrig blir klar ska inte hamna i ett galleri.
  //   2. `axel` på en plan (standard "Färg") tar en annan option, till exempel "Storlek" på en sida med ett enda val som inte är färg. Då
  //      gäller butikens regel för en sådan sida (en länkad bild visas bara för det första val som länkar den, en olänkad bild är gemensam).
  //      Färgreglerna för gemensamma bilder (alt-text som kort eller med två färger) gäller bara axeln Färg.
  //   3. Sidorna körs fyra i taget (Promise.allSettled): en körning ryms på 60 s med ungefär tolv sidor.
  //   4. Återläsningen jämför också länkarna i alla andra optioner (en tvåaxlig sida får inte tappa storlekens länkar).
  const PLANER = [{ id: "", tillagg: [] }];
  const T0 = Date.now();

  const lika = function (a, b) { return String(a || "").trim().toLowerCase() === String(b || "").trim().toLowerCase(); };
  const paus = function (ms) { return new Promise(function (r) { setTimeout(r, ms); }); };
  const FORE = "(?<![\\p{L}\\p{N}])";
  const EFTER = "(?![\\p{L}\\p{N}])";
  const BAKGRUND = /(?<![\p{L}])(?:vit|vita|vitt|grå|gråa|grått|svart|svarta|ljus|ljusa|ljusgrå|beige)\s+(?:bakgrund|bakgrunden|studiobakgrund|yta|ytan)(?![\p{L}])/giu;
  const esc = function (s) { return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"); };
  const fargFormer = function (etikett) {
    const w = String(etikett || "").trim().toLowerCase();
    if (!/^\p{L}{3,}$/u.test(w)) return null;
    const former = new Set([w, w + "a", w + "t", w + "tt"]);
    if (w.endsWith("d")) former.add(w.slice(0, -1) + "tt");
    if (w.endsWith("t")) former.add(w + "t");
    return Array.from(former);
  };
  const nammda = function (alt, etiketter) {
    const text = String(alt || "").replace(BAKGRUND, " ");
    const t = [];
    for (const e of etiketter) {
      const f = fargFormer(e);
      if (f && new RegExp(FORE + "(?:" + f.map(esc).join("|") + ")" + EFTER, "iu").test(text)) t.push(e);
    }
    return t;
  };
  const arKort = function (alt) {
    return /^\s*(?:fyndplats|mått|specifikation)/i.test(alt) || /(?:spec(?:ifikations)?|mått|färg|fakta|storleks)kort/i.test(alt) || /mått(?:bild|ritning|skiss|skisser|uppgifter)/i.test(alt);
  };
  const FORBJUDET = /https?:|www\.|\.(?:com|se|de)\b|homcom|outsunny|pawhut|aiyaplay|vinsetto|kleankin|zonekiz|sportnow|durhand|aosom|aliexpress|alibaba|vevor|succebuy|giantex|costway/i;
  const skrivEn = async function (PLAN) {
    const URL = "https://www.wixapis.com/stores/v3/products/" + PLAN.id;
    const FALT = "?fields=MEDIA_ITEMS_INFO&fields=VARIANT_OPTION_CHOICE_NAMES";
    const las = async function () { return (await wix.request({ method: "GET", url: URL + FALT })).data.product; };
    const galleriAv = function (p) { return ((p.media && p.media.itemsInfo && p.media.itemsInfo.items) || []).map(function (i) { return i.id; }); };
    const fel = function (steg, text) { return { ok: false, steg: steg, id: String(PLAN.id).slice(0, 8), fel: text }; };
    const axelNamn = PLAN.axel || "Färg";
    const arFarg = lika(axelNamn, "Färg");

    if (!/^[0-9a-f-]{36}$/.test(PLAN.id) || PLAN.tillagg.length === 0) return fel("plan", "id eller tillägg saknas");
    const p0 = await las();
    for (const t of PLAN.tillagg) {
      const fr = await wix.request({ method: "GET", url: "https://www.wixapis.com/site-media/v1/files/get-file-by-id?fileId=" + encodeURIComponent(t.fil) });
      const st = fr.data && fr.data.file && fr.data.file.operationStatus;
      if (st !== "READY") return fel("plan", "filen är inte klar hos Wix (" + st + "): " + t.fil.slice(7, 15));
    }
    const fo0 = (p0.options || []).find(function (o) { return lika(o.name, axelNamn); });
    if (!fo0) return fel("plan", "sidan har ingen option som heter " + axelNamn);
    const val0 = (fo0.choicesSettings && fo0.choicesSettings.choices) || [];
    const items0 = ((p0.media && p0.media.itemsInfo && p0.media.itemsInfo.items) || []).map(function (i) { return { id: i.id, altText: i.altText || "" }; });
    const finns = new Set(items0.map(function (i) { return i.id; }));
    const etiketter = val0.map(function (c) { return c.name; });
    const anvandbara = etiketter.filter(function (e) { return fargFormer(e); });
    const allaEnkla = anvandbara.length === etiketter.length;

    // 1. Granska tillägget och räkna fram det nya galleriet och de nya länkarna.
    const nytt = items0.slice();
    const lank = {};
    val0.forEach(function (c) { lank[c.choiceId] = (c.linkedMedia || []).map(function (m) { return m.id; }); });
    const agdAvVal = function (c) { return lank[c.choiceId]; };
    const skrivs = [];
    for (const t of PLAN.tillagg) {
      if (!/^b379ce_[0-9a-f]{32}~mv2\.[a-z0-9]+$/i.test(t.fil)) return fel("plan", "ogiltigt fil-id: " + String(t.fil).slice(0, 20));
      if (finns.has(t.fil)) return fel("plan", "filen ligger redan i galleriet: " + t.fil.slice(7, 15));
      const alt = String(t.alt || "").trim();
      if (alt.length < 5 || alt.length > 200 || FORBJUDET.test(alt)) return fel("plan", "alt-texten duger inte för " + t.fil.slice(7, 15));
      if (t.val === null || t.val === undefined) {
        const namnda = nammda(alt, anvandbara);
        const gemensam = !arFarg || arKort(alt) || namnda.length > 1 || (namnda.length === 0 && !allaEnkla);
        if (!gemensam) return fel("plan", "en gemensam bild skulle ägas av en färg (alt-texten måste vara ett kort eller nämna minst två färger): " + t.fil.slice(7, 15));
        nytt.push({ id: t.fil, altText: alt });
        skrivs.push({ fil: t.fil, val: null });
      } else {
        const c = val0.find(function (x) { return lika(x.name, t.val); });
        if (!c) return fel("plan", "färgen finns inte: " + t.val);
        const egna = agdAvVal(c);
        let sista = -1;
        nytt.forEach(function (i, n) { if (egna.indexOf(i.id) >= 0) sista = n; });
        if (sista < 0) return fel("plan", "färgen har ingen bild att placera efter: " + c.name);
        nytt.splice(sista + 1, 0, { id: t.fil, altText: alt });
        lank[c.choiceId] = egna.concat([t.fil]);
        skrivs.push({ fil: t.fil, val: c.choiceId, namn: c.name });
      }
      finns.add(t.fil);
    }
    if (nytt.length > 50) return fel("plan", "galleriet skulle få " + nytt.length + " bilder, Wix tar 50");

    // 2. Galleriet, ensamt, vid id. En tom alt-text skickas inte (Wix svarar 400).
    const post = function (i) { return i.altText ? { id: i.id, altText: i.altText } : { id: i.id }; };
    await wix.request({
      method: "PATCH",
      url: URL,
      body: { product: { revision: p0.revision, media: { itemsInfo: { items: nytt.map(post) } } }, fieldMask: { paths: ["media"] } },
    });
    const vantat = nytt.map(function (i) { return i.id; }).join(",");
    let p1 = null;
    for (let f = 0; f < 6; f++) {
      await paus(3000);
      p1 = await las();
      if (galleriAv(p1).join(",") === vantat) break;
    }
    if (galleriAv(p1).join(",") !== vantat) return fel("galleri", "Wix visar inte det nya galleriet efter 18 s (galleriet kan vara skrivet, kör om återläsningen)");

    // 3. Länkarna: options + variantsInfo ordagrant ur GET:en, valens nya linkedMedia, visible explicit. Försöker om vid 404/409.
    const nyaOptions = JSON.parse(JSON.stringify(p1.options));
    const foN = nyaOptions.find(function (o) { return lika(o.name, axelNamn); });
    foN.choicesSettings.choices.forEach(function (c) {
      const nya = lank[c.choiceId];
      if (nya && nya.length !== (c.linkedMedia || []).length) c.linkedMedia = nya.map(function (id) { return { id: id }; });
    });
    let lankSkriven = false;
    let sistaFel = "";
    let pn = p1;
    for (let f = 0; f < 8 && !lankSkriven; f++) {
      try {
        await wix.request({
          method: "PATCH",
          url: URL,
          body: { product: { revision: pn.revision, visible: pn.visible, options: nyaOptions, variantsInfo: pn.variantsInfo }, fieldMask: { paths: ["options", "variantsInfo", "visible"] } },
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
    const fo2 = (p2.options || []).find(function (o) { return lika(o.name, axelNamn); });
    const avvik = [];
    if (galleriAv(p2).join(",") !== vantat) avvik.push("galleriet");
    (fo2.choicesSettings.choices || []).forEach(function (c) {
      const vant = lank[c.choiceId] || [];
      const nu = (c.linkedMedia || []).map(function (m) { return m.id; });
      if (vant.join(",") !== nu.join(",")) avvik.push("länkar i " + c.name);
    });
    const varV = function (p) { return ((p.variantsInfo && p.variantsInfo.variants) || []).map(function (v) { return [v.id, v.sku, v.visible, v.price && v.price.actualPrice && v.price.actualPrice.amount].join("|"); }).join(";"); };
    if (varV(p0) !== varV(p2)) avvik.push("varianternas id, SKU, synlighet eller pris");
    if (p0.visible !== p2.visible) avvik.push("synligheten");
    if (p0.slug !== p2.slug || p0.name !== p2.name) avvik.push("namn eller adress");
    const andraLankar = function (p) { return (p.options || []).filter(function (o) { return !lika(o.name, axelNamn); }).map(function (o) { return o.name + ":" + ((o.choicesSettings && o.choicesSettings.choices) || []).map(function (c) { return (c.linkedMedia || []).map(function (m) { return m.id; }).join("+"); }).join("/"); }).join(";"); };
    if (andraLankar(p0) !== andraLankar(p2)) avvik.push("länkarna i en annan option");
    return {
      ok: avvik.length === 0,
      id: PLAN.id.slice(0, 8),
      avvikelser: avvik,
      galleri: items0.length + " → " + nytt.length,
      revision: p0.revision + " → " + p2.revision,
      skrivet: skrivs.map(function (s) { return s.fil.slice(7, 15) + (s.namn ? "→" + s.namn : " gemensam"); }),
      valLankar: (fo2.choicesSettings.choices || []).map(function (c) { return c.name + ":" + (c.linkedMedia || []).length; }),
    };
  };

  const ut = [];
  const kor = async function (PLAN) {
    try { return await skrivEn(PLAN); } catch (e) { return { ok: false, steg: "undantag", id: String(PLAN.id).slice(0, 8), fel: String(e && e.message ? e.message : e).slice(0, 200) }; }
  };
  for (let i = 0; i < PLANER.length; i += 4) {
    const grupp = PLANER.slice(i, i + 4);
    if (Date.now() - T0 > 35000) { grupp.forEach(function (PLAN) { ut.push({ ok: false, steg: "tid", id: String(PLAN.id).slice(0, 8), fel: "ej körd, tiden räckte inte (kör om)" }); }); continue; }
    const svar = await Promise.all(grupp.map(kor));
    svar.forEach(function (r) { ut.push(r); });
  }
  return ut;
}
