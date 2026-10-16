// pool_dolda.js: alla dolda produkter (visible=false) med lagersaldo, för ExecuteWixAPI (bara läsning).
// Siten anges i ExecuteWixAPI-anropets siteId. Svaret är id8:saldo (de första åtta tecknen av Wix-id:t), eftersom
// fullständiga id för ~1 200 produkter spränger svarets ~100 000 tecken. Kör den med FRAN satt för att bara lista
// utkast skapade efter en tidpunkt (t.ex. efter nattens import 04:40 UTC).
//
// ☠️ filter hör INUTI search och bara på första sidan; sida två skickas med bara markören (400 SE-1141 annars).
// ☠️ Ett utkast med saldo kan vara ett pensionerat utkast (sammanslagen givare eller avvisad dubblett): saldot står
//    kvar på det synken senast skrev. Jämför mot rundornas ids.tsv och FLAGGADE, och läs mappningen (las.py)
//    innan något räknas som kandidat.
async function () {
  const FRAN = "";
  const alla = [];
  let cursor = null;
  let sidor = 0;
  while (sidor < 120) {
    const body = cursor
      ? { search: { cursorPaging: { limit: 100, cursor: cursor } } }
      : { search: { cursorPaging: { limit: 100 }, filter: { visible: { $eq: false } } } };
    const r = await wix.request({ method: "POST", url: "https://www.wixapis.com/stores/v3/products/search", body: body });
    const d = r.data || r;
    sidor++;
    for (const p of d.products || []) {
      if (FRAN && String(p.createdDate || "") < FRAN) continue;
      alla.push({ id: p.id, skapad: String(p.createdDate || "").slice(5, 16), namn: String(p.name || "").slice(0, 50) });
    }
    cursor = d.pagingMetadata && d.pagingMetadata.cursors && d.pagingMetadata.cursors.next;
    if (!cursor) break;
  }
  const qty = {};
  const grupper = [];
  for (let i = 0; i < alla.length; i += 50) grupper.push(alla.slice(i, i + 50).map(function (x) { return x.id; }));
  const svar = await Promise.allSettled(grupper.map(function (g) {
    return wix.request({ method: "POST", url: "https://www.wixapis.com/stores/v3/inventory-items/query", body: { query: { filter: { productId: { $in: g } }, cursorPaging: { limit: 100 } } } });
  }));
  let fel = 0;
  let avkortade = 0;
  svar.forEach(function (s) {
    if (s.status !== "fulfilled") { fel++; return; }
    const d = s.value.data || s.value;
    if (d.pagingMetadata && d.pagingMetadata.hasNext) avkortade++;
    (d.inventoryItems || []).forEach(function (it) { qty[it.productId] = (qty[it.productId] || 0) + (it.quantity || 0); });
  });
  const medSaldo = alla.filter(function (x) { return (qty[x.id] || 0) > 0; });
  // Med FRAN satt (en handfull rader) skrivs namn och skapad ut; utan FRAN bara id8:saldo.
  const lista = FRAN
    ? medSaldo.map(function (x) { return x.id.slice(0, 8) + "|" + x.skapad + "|q" + qty[x.id] + "|" + x.namn; })
    : medSaldo.map(function (x) { return x.id.slice(0, 8) + ":" + qty[x.id]; });
  return { sidor: sidor, dolda: alla.length, fel: fel, avkortade: avkortade, medSaldo: medSaldo.length, lista: FRAN ? lista : lista.join(",") };
}
