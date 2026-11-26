// syskon_foton.js: ExecuteWixAPI-kod (bara läsning) för tvillingkontrollen: för varje varuord i ORD hämtas ALLA VEVOR-rader i FyndplatsMappings
// vars `seoTitle` innehåller ordet (`$contains` ignorerar skiftläge, sidor om 100 per ord, utan tak), och för varje produkt de sex första bild-id:na
// och en kort titel med P (publicerad) eller D (utkast) först. Svaret läses av `syskon_twin.py` (scratchpad) som laddar ned bilderna med `curl`,
// jämför dem med utkastens `cand/<id8>/d1..d6.jpg` (dHash 16 x 16, rakt och spegelvänt) och skriver närmaste syskon per kandidat.
// Gränsen för samma foto är högst 5 av 256. Skicka som `code` med hasMutations: false.
//
// Svaret paddas med 101 000 tecken så att verktyget sparar det i en fil som `syskon_twin.py` kan läsa; själva datat (högst cirka 60 000 tecken
// för 140 rader) ligger före paddingen och kommer med. Ett svar med fler än cirka 250 rader passar inte i de första 100 000 tecknen: dela då
// ORD i två anrop.
//
// ☠️ Runda 525: den gamla syskonlistan stannade på cirka hundra rader över alla sökord och missade en tvilling i runda 524 (kanalslangen
// `dfcd07b2` delar alla fem foton med `5826436c`). Kör den här listan FÖRE bildgranskningen, så att en tvilling sållar bort kandidaten innan
// någon tid läggs på den, och sök på det enskilda varuordet och på flera stavningar (*kanalslang*, *flexibel kanal*).
// Artikelnummer och bildadresser skrivs aldrig i en fil i repot: id:na är Wix egna media-id:n, och `syskon_twin.py` hämtar bilderna till scratchpad.
async function () {
  const ORD = ["kanalslang", "flexibel kanal"];
  const per = {};
  const ids = {};
  const fel = [];
  for (const ord of ORD) {
    let off = 0;
    let n = 0;
    while (off < 300) {
      const r = await wix.request({ method: "POST", url: "https://www.wixapis.com/wix-data/v2/items/query", body: { dataCollectionId: "FyndplatsMappings", query: { filter: { $and: [{ supplier: { $eq: "vevor" } }, { seoTitle: { $contains: ord } }] }, paging: { limit: 100, offset: off }, fields: ["wixProductId", "seoTitle"] } } });
      const d = r.data || r;
      const rows = d.dataItems || [];
      rows.forEach(function (it) {
        const m = it.data || {};
        const pid = String(m.wixProductId || "");
        if (pid) {
          ids[pid] = String(m.seoTitle || "").replace(/^VEVOR\s+/i, "").slice(0, 48);
          n += 1;
        }
      });
      if (rows.length < 100) break;
      off += 100;
    }
    per[ord] = n;
  }
  const pids = Object.keys(ids);
  const ut = [];
  for (let i = 0; i < pids.length; i += 8) {
    const del = pids.slice(i, i + 8);
    const sv = await Promise.all(del.map(function (pid) {
      return wix.request({ method: "GET", url: "https://www.wixapis.com/stores/v3/products/" + pid + "?fields=MEDIA_ITEMS_INFO" }).then(function (r) {
        const p = (r.data || r).product || {};
        const items = (p.media && p.media.itemsInfo && p.media.itemsInfo.items) || [];
        const b = items.slice(0, 6).map(function (m) {
          const u = (typeof m.image === "string" ? m.image : (m.image && m.image.url)) || "";
          const a = u.indexOf("/media/");
          return a >= 0 ? u.slice(a + 7).split("/")[0] : (m.id || "");
        });
        return { i: pid.slice(0, 8), t: (p.visible ? "P|" : "D|") + ids[pid], b: b };
      }).catch(function (e) {
        fel.push(pid.slice(0, 8) + ": " + String(e && e.message || e).slice(0, 60));
        return null;
      });
    }));
    sv.forEach(function (x) { if (x) ut.push(x); });
  }
  return { antal: ut.length, per: per, fel: fel, ut: ut, pad: "x".repeat(101000) };
}
