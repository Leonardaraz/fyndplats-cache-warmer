async function () {
  // katalogkontroll-tva-lankade-optioner.js (2026-10-23): publicerade sidor med två optioner där BÅDA bär länkade bilder. Skriver ingenting.
  // Kör via ExecuteWixAPI (en körning, ~35 s för 6 100 produkter).
  //
  // Varför: soptunnan c841717c (3 fack, 45/60 liter × Svart/Silver) hade bilder länkade till både Storlek och Färg. Butiken visar för en kombination
  // UNIONEN av färgens och storlekens länkade bilder plus de olänkade, så Silver visade svarta bilder via storleken och en olänkad svart bild.
  // Variantens bild (varukorgen) räknas av Wix ur det första valet i variantens egen valordning som har länkade bilder (mätt 2026-10-23), och en id-skrivning
  // nollställer den till huvudbilden. Motorn (lib/wix/variant-media.ts) ger sedan 2026-10-23 färgens första foto som förväntan när snittet är tomt (`forsta_val`)
  // och lägger färgen först i varje variant vid skrivning. Före det gav ett tomt snitt ingen förväntan (`inget_snitt`), så varukorgen visade huvudbilden, en svart
  // tunna, även för Silver. Enklaste receptet är fortfarande att EN option bär bilderna (färgen) och den andra inga, men två optioner med en ägare per bild går bra.
  //
  // `rader`: "wix-id|<option A>×<option B>|länkade val A/B|tomma snitt av kombinationer|galleri" för sidor där två optioner har länkade bilder.
  // Ett tomt snitt är en kombination där båda valen har länkar men ingen gemensam bild: då finns ingen förväntad variantbild.
  const t0 = Date.now();
  const lika = function (a, b) { return String(a || "").trim().toLowerCase() === String(b || "").trim().toLowerCase(); };
  const rader = [];
  let cursor = null;
  let publicerade = 0;
  let tvaOptioner = 0;
  let badaLankade = 0;
  let medTomtSnitt = 0;
  while (true) {
    const search = cursor ? { cursorPaging: { limit: 100, cursor: cursor } } : { cursorPaging: { limit: 100 } };
    const r = await wix.request({ method: "POST", url: "https://www.wixapis.com/stores/v3/products/search", body: { search: search, fields: ["MEDIA_ITEMS_INFO"] } });
    const ps = r.data.products || [];
    for (const p of ps) {
      if (p.visible !== true) continue;
      publicerade++;
      const opt = (p.options || []).map(function (o) {
        return {
          namn: o.name || "",
          val: ((o.choicesSettings && o.choicesSettings.choices) || []).map(function (c) {
            return { namn: c.name || "", synligt: c.visible !== false, lank: (c.linkedMedia || []).map(function (m) { return m.id; }).filter(Boolean) };
          }),
        };
      }).filter(function (o) { return o.val.filter(function (v) { return v.synligt; }).length >= 2; });
      if (opt.length < 2) continue;
      tvaOptioner++;
      const medLank = opt.filter(function (o) { return o.val.some(function (v) { return v.lank.length > 0; }); });
      if (medLank.length < 2) continue;
      badaLankade++;
      const A = medLank[0];
      const B = medLank[1];
      let kombos = 0;
      let tomma = 0;
      for (const a of A.val) {
        for (const b of B.val) {
          if (a.lank.length === 0 || b.lank.length === 0) continue;
          kombos++;
          if (!a.lank.some(function (id) { return b.lank.indexOf(id) >= 0; })) tomma++;
        }
      }
      if (tomma > 0) medTomtSnitt++;
      const galleri = ((p.media && p.media.itemsInfo && p.media.itemsInfo.items) || []).length;
      rader.push(p.id + "|" + A.namn + "×" + B.namn + "|" + A.val.filter(function (v) { return v.lank.length > 0; }).length + "/" + B.val.filter(function (v) { return v.lank.length > 0; }).length + "|" + tomma + " av " + kombos + "|g" + galleri);
    }
    const next = r.data.pagingMetadata && r.data.pagingMetadata.cursors && r.data.pagingMetadata.cursors.next;
    if (!next || ps.length === 0) break;
    cursor = next;
    if (Date.now() - t0 > 52000) return { fel: "tid", sedda: publicerade };
  }
  return {
    sek: Math.round((Date.now() - t0) / 100) / 10,
    publicerade: publicerade,
    medTvaOptioner: tvaOptioner,
    badaLankade: badaLankade,
    medTomtSnitt: medTomtSnitt,
    rader: rader.slice(0, 80),
  };
}
