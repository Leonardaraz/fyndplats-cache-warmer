async function () {
  // sida-bilder.js (2026-10-21): en sidas galleri som en människa behöver det för att välja fler bilder till en färg. Skriver
  // ingenting. Kör via ExecuteWixAPI med sidans wix-id i `IDS`. För varje sida: valen (färg, storlek) med de bilder de länkar,
  // och för varje galleribild plats, Wix fil-id, leverantörens filnamn ur Wix egen `sourceUrl` (get-files, ett hopp för Wix
  // omimporterade kopior), alt-text och vilket val som äger bilden. Filnamnet (inte adressen) räcker för att se vilka av
  // leverantörens bilder som redan sitter på sidan. ☠️ Svaret är bara till den som läser det här: skriv aldrig ut leverantörens
  // adresser i en publik logg.
  const IDS = [];
  const out = [];
  for (const id of IDS) {
    const r = await wix.request({
      method: "GET",
      url: "https://www.wixapis.com/stores/v3/products/" + id + "?fields=MEDIA_ITEMS_INFO&fields=VARIANT_OPTION_CHOICE_NAMES",
    });
    const p = r.data.product;
    const items = (p.media && p.media.itemsInfo && p.media.itemsInfo.items) || [];
    const owner = {};
    const opts = (p.options || []).map(function (o) {
      return o.name + ": " + ((o.choicesSettings && o.choicesSettings.choices) || []).map(function (c) {
        (c.linkedMedia || []).forEach(function (m) { if (!owner[m.id]) owner[m.id] = o.name.slice(0, 1) + ":" + c.name.slice(0, 14); });
        return c.name + (c.visible === false ? "(dold)" : "") + "[" + (c.linkedMedia || []).map(function (m) { return m.id.slice(7, 11); }).join(",") + "]";
      }).join(" | ");
    });
    const fids = items.map(function (i) { return i.id; });
    const src = {};
    if (fids.length > 0) {
      const f = await wix.request({ method: "POST", url: "https://www.wixapis.com/site-media/v1/files/get-files", body: { fileIds: fids } });
      const lista = (f.data && f.data.files) || [];
      const kopior = [];
      for (const x of lista) {
        if (!x.sourceUrl) continue;
        if (x.sourceUrl.indexOf("static.wixstatic.com") >= 0) kopior.push({ id: x.id, ref: x.sourceUrl.split("/media/")[1] ? x.sourceUrl.split("/media/")[1].split("/")[0] : "" });
        else src[x.id] = x.sourceUrl;
      }
      const refs = kopior.map(function (k) { return k.ref; }).filter(Boolean);
      if (refs.length > 0) {
        const g = await wix.request({ method: "POST", url: "https://www.wixapis.com/site-media/v1/files/get-files", body: { fileIds: refs } });
        const byId = {};
        for (const y of ((g.data && g.data.files) || [])) if (y.sourceUrl) byId[y.id] = y.sourceUrl;
        for (const k of kopior) if (byId[k.ref]) src[k.id] = byId[k.ref];
      }
    }
    const bas = function (u) { return u ? String(u).split("?")[0].split("/").pop().slice(0, 44) : "-"; };
    out.push({
      id: id,
      namn: p.name.slice(0, 70),
      rev: p.revision,
      synlig: p.visible,
      val: opts,
      galleri: items.map(function (i, n) {
        return (n + 1) + "|" + i.id + "|" + bas(src[i.id]) + "|" + (owner[i.id] || "-") + "|" + String(i.altText || "").slice(0, 60);
      }),
    });
  }
  return out;
}
