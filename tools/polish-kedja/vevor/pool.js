// pool.js: ExecuteWixAPI-kod (bara läsning) som bygger kandidatlistan för en VEVOR-runda. Skicka som `code` med hasMutations: false.
//
// Mätt 2026-11-17: avläsningarna (FyndplatsVevorAvlasningar) läses med 0,3 s per hundra rader när bara de små fälten begärs, och
// mappningsraderna (FyndplatsMappings) med 0,8 s per hundra, så hela registret (11 375 rader) tar 94 s och ryms inte i en körning.
// Koden läser därför först avläsningarna med status i_lager och saldo mellan SALDO_MIN och SALDO_MAX (2 292 rader, 7 s) och slår
// sedan upp deras mappningsrader med `supplierProductId $in` (hundra artiklar per fråga, fyra frågor i taget, ungefär 20 s).
// Kandidat = väntande utkast (needsAiPolish, pending_review), en variant, högst en artikel, ingen granskningsflagga, avläsningen
// levererasTillSe inte falskt och inte borta. Bildantal (minst åtta) och specifikationsrader (minst tre) kontrolleras vid den
// detaljerade läsningen (hamta_vevor.js), inte här.
// Svaret `{ n, rader, ... , pad }` har en sträng per kandidat, sorterad på saldo: id8|saldo|bg|fullt id|titel. Artikelnumret
// skrivs aldrig ut. OFF och LEN väljer ett fönster ur den sorterade listan (svaret får inte bli större än 100 000 tecken); ett nytt
// anrop med nästa OFF läser om allt (cirka 30 s).
async function () {
  const SALDO_MIN = 8;
  const SALDO_MAX = 36;
  const OFF = 0;
  const LEN = 700;
  const t0 = Date.now();
  const fel = [];
  const avl = {};
  let off = 0;
  for (;;) {
    const body = { dataCollectionId: "FyndplatsVevorAvlasningar", query: { filter: { $and: [{ status: { $eq: "i_lager" } }, { saldo: { $gte: SALDO_MIN } }, { saldo: { $lte: SALDO_MAX } }] }, paging: { limit: 100, offset: off }, fields: ["saldo", "borta", "levererasTillSe"] } };
    const r = await wix.request({ method: "POST", url: "https://www.wixapis.com/wix-data/v2/items/query", body: body });
    const items = (r.data || r).dataItems || [];
    items.forEach(function (it) {
      const x = it.data || {};
      avl["vevor:" + String(it.id || x._id)] = { saldo: x.saldo, lev: x.levererasTillSe, borta: x.borta };
    });
    if (items.length < 100) break;
    off += 100;
    if (Date.now() - t0 > 20000) { fel.push("avläsningarna avbröts vid offset " + off); break; }
  }
  const keys = Object.keys(avl);
  const kand = [];
  let nmap = 0;
  const grupper = [];
  for (let i = 0; i < keys.length; i += 100) grupper.push(keys.slice(i, i + 100));
  for (let g = 0; g < grupper.length; g += 4) {
    const delar = grupper.slice(g, g + 4);
    const svar = await Promise.all(delar.map(function (batch) {
      return wix.request({ method: "POST", url: "https://www.wixapis.com/wix-data/v2/items/query", body: { dataCollectionId: "FyndplatsMappings", query: { filter: { supplierProductId: { $in: batch } }, paging: { limit: 100 }, fields: ["wixProductId", "seoTitle", "variants", "vevorArtiklar", "supplierProductId", "draftStatus", "vevorGranskning", "needsAiPolish"] } } }).catch(function (e) { fel.push(String(e && e.message || e).slice(0, 80)); return null; });
    }));
    svar.forEach(function (r) {
      if (!r) return;
      ((r.data || r).dataItems || []).forEach(function (it) {
        const m = it.data || {};
        nmap += 1;
        if (m.draftStatus !== "pending_review" || m.needsAiPolish !== true) return;
        if ((m.variants || []).length > 1 || (m.vevorArtiklar || []).length > 1) return;
        const gr = m.vevorGranskning || {};
        if (gr.medicinteknik || gr.vapenskap || gr.spritapparat) return;
        const a = avl[String(m.supplierProductId || "")];
        if (!a || a.lev === false || a.borta) return;
        kand.push({ pid: String(m.wixProductId), t: String(m.seoTitle || ""), saldo: a.saldo, bg: gr.bildgranskning ? 1 : 0 });
      });
    });
    if (Date.now() - t0 > 55000) { fel.push("mappningarna avbröts vid grupp " + g); break; }
  }
  kand.sort(function (x, y) { return y.saldo - x.saldo; });
  const rader = kand.map(function (c) { return [c.pid.slice(0, 8), c.saldo, c.bg, c.pid, c.t.slice(0, 80)].join("|"); });
  return { n: rader.length, nAvl: keys.length, nMap: nmap, fel: fel, ms: Date.now() - t0, off: OFF, rader: rader.slice(OFF, OFF + LEN), pad: "x".repeat(101000) };
}
