async function () {
  // bildhashkarta.js (2026-10-15): bildhash per produkt för ExecuteWixAPI. Se DUBBLETTMATNING.md, avsnittet om bildhashkartan.
  // START = null första gången, sedan `nasta` ur förra svaret. 12 sidor ger ~94 000 tecken: över 100 000 kapas svaret tyst.
  const START = null;
  const PAGES = 10;
  const bid = function (m) {
    if (!m) return "";
    const img = m.image || {};
    return m.id || img.id || (img.url ? img.url.split("?")[0].split("/").pop() : "") || "";
  };
  const hashMap = {};
  const rows = [];
  let cursor = START;
  let sidor = 0;
  let fel = 0;
  const t0 = Date.now();
  while (sidor < PAGES) {
    const paging = cursor ? { limit: 100, cursor: cursor } : { limit: 100 };
    const body = { search: { cursorPaging: paging }, fields: ["MEDIA_ITEMS_INFO"] };
    const r = await wix.request({ method: "POST", url: "/stores/v3/products/search", body: body });
    const d = r.data || r;
    sidor++;
    const prods = d.products || [];
    const ids = [];
    const perProd = [];
    for (const p of prods) {
      const items = (p.media && p.media.itemsInfo && p.media.itemsInfo.items) || [];
      const lista = items.map(bid).filter(Boolean);
      perProd.push(lista);
      for (const x of lista) {
        if (!(x in hashMap)) {
          hashMap[x] = null;
          ids.push(x);
        }
      }
    }
    const batches = [];
    for (let i = 0; i < ids.length; i += 50) batches.push(ids.slice(i, i + 50));
    for (let i = 0; i < batches.length; i += 4) {
      const grupp = batches.slice(i, i + 4);
      const svar = await Promise.allSettled(grupp.map(function (b) {
        return wix.request({ method: "POST", url: "/site-media/v1/files/get-files", body: { fileIds: b } });
      }));
      for (const s of svar) {
        if (s.status !== "fulfilled") {
          fel++;
          continue;
        }
        const dd = s.value.data || s.value;
        for (const f of dd.files || []) hashMap[f.id] = f.hash || null;
      }
    }
    for (let k = 0; k < prods.length; k++) {
      const p = prods[k];
      const hs = perProd[k].map(function (x) { return hashMap[x] ? hashMap[x].slice(0, 10) : "-"; });
      rows.push(String(p.id || p._id).slice(0, 8) + (p.visible === true ? "P" : "D") + hs.join(","));
    }
    cursor = d.pagingMetadata && d.pagingMetadata.cursors && d.pagingMetadata.cursors.next;
    if (!cursor) break;
  }
  return { rader: rows, nasta: cursor || null, sidor: sidor, fel: fel, ms: Date.now() - t0 };
}
