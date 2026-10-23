async function () {
  // katalogkontroll-tva-axlar-slugs.js (2026-10-23): ger "<åtta första tecknen i Wix-id> <slug>" för publicerade sidor med två val som har minst två synliga värden.
  // Skriver ingenting. Kör via ExecuteWixAPI (en körning, ~35 s för 6 100 produkter). Raderna är indata till katalogkontroll-tva-axlar-bilder.py --hamta.
  const t0 = Date.now();
  const rader = [];
  let publicerade = 0;
  let cursor = null;
  while (true) {
    const search = cursor ? { cursorPaging: { limit: 100, cursor: cursor } } : { cursorPaging: { limit: 100 } };
    const r = await wix.request({ method: "POST", url: "https://www.wixapis.com/stores/v3/products/search", body: { search: search } });
    const ps = r.data.products || [];
    for (const p of ps) {
      if (p.visible !== true) continue;
      publicerade++;
      const val = (p.options || []).filter(function (o) {
        return ((o.choicesSettings && o.choicesSettings.choices) || []).filter(function (c) { return c.visible !== false; }).length >= 2;
      });
      if (val.length >= 2) rader.push(p.id.slice(0, 8) + " " + p.slug);
    }
    const next = r.data.pagingMetadata && r.data.pagingMetadata.cursors && r.data.pagingMetadata.cursors.next;
    if (!next || ps.length === 0) break;
    cursor = next;
    if (Date.now() - t0 > 52000) return { fel: "tid", sedda: publicerade };
  }
  return { sek: Math.round((Date.now() - t0) / 100) / 10, publicerade: publicerade, medTvaVal: rader.length, rader: rader };
}
