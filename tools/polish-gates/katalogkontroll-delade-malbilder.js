async function () {
  // katalogkontroll-delade-malbilder.js (2026-10-22): olänkade (gemensamma) bilder på sidor med ETT val som inte är färg, vars alt-text eller mått
  // pekar på ett visst val. Skriver ingenting. Kör via ExecuteWixAPI (en körning, ~35 s för 6 100 produkter).
  //
  // Skälet: på en sida med Storlek (eller Modell, Volym ...) visas en bild som inget val länkar för ALLA val. En måttbild som anger 180 cm hör
  // alltså inte hemma där under valet 200 cm. Leonards skärmbild 2026-10-22 (skrivbordet `041fa621`): givarens måttbild för 180 × 60 cm låg olänkad
  // i galleriet och visades under 200 × 60 cm. Sammanslagningen länkar bara givarens första bild till valet; resten läggs till som gemensamma.
  //
  // Två träffar, båda gäller bara OLÄNKADE bilder:
  //   namn   alt-texten nämner exakt ett vals namn (till exempel "i storleken 180 × 60 cm")
  //   tal    alt-texten är en måttbild och alla tal i exakt ett vals namn står i den (180 och 60 i "180 × 60 cm", men inte 200 i "200 × 60 cm")
  //   matt   en måttbild som inte går att knyta till ett val på alt-texten: titta på bilden (OCR av talen) innan något sägs
  // ☠️ Alt-texten är ett tips, inget facit: en bild utan nämnt val kan ändå vara ett vals egen. Bilden avgör, och talen i den ska stämma med valet.
  // Räknesättet för vad som visas är katalogkontroll-val-antal.js (en länkad bild visas bara för första valet som länkar den, en olänkad för alla).
  const GRANS_SIDOR = 80;
  const t0 = Date.now();
  const lika = function (a, b) { return String(a || "").trim().toLowerCase() === String(b || "").trim().toLowerCase(); };
  const siffror = function (s) { return String(s || "").replace(/,/g, ".").match(/\d+(?:\.\d+)?/g) || []; };

  const slim = [];
  let cursor = null;
  while (true) {
    const search = cursor ? { cursorPaging: { limit: 100, cursor: cursor } } : { cursorPaging: { limit: 100 } };
    const r = await wix.request({ method: "POST", url: "https://www.wixapis.com/stores/v3/products/search", body: { search: search, fields: ["MEDIA_ITEMS_INFO"] } });
    const ps = r.data.products || [];
    for (const p of ps) {
      if (p.visible !== true) continue;
      slim.push({
        id: p.id,
        items: ((p.media && p.media.itemsInfo && p.media.itemsInfo.items) || []).map(function (m) { return { id: m.id, alt: m.altText || "" }; }).filter(function (m) { return m.id; }),
        options: (p.options || []).map(function (o) {
          return { namn: o.name || "", val: ((o.choicesSettings && o.choicesSettings.choices) || []).map(function (c) {
            return { namn: c.name || "", synligt: c.visible !== false, lankade: (c.linkedMedia || []).map(function (m) { return m.id; }).filter(Boolean) };
          }) };
        }),
      });
    }
    const next = r.data.pagingMetadata && r.data.pagingMetadata.cursors && r.data.pagingMetadata.cursors.next;
    if (!next || ps.length === 0) break;
    cursor = next;
    if (Date.now() - t0 > 52000) return { fel: "tid", sedda: slim.length };
  }

  let sidor = 0;
  let sidorMedDelade = 0;
  const traffar = { namn: 0, tal: 0, matt: 0 };
  const rader = [];
  const detalj = [];
  for (const p of slim) {
    const opt = p.options.filter(function (o) { return o.val.filter(function (v) { return v.synligt; }).length >= 2; });
    if (opt.length !== 1) continue;
    const o = opt[0];
    if (lika(o.namn, "Färg")) continue;
    sidor++;
    const lankade = new Set();
    o.val.forEach(function (v) { v.lankade.forEach(function (id) { lankade.add(id); }); });
    const fynd = [];
    p.items.forEach(function (m, n) {
      if (lankade.has(m.id)) return;
      const alt = m.alt.toLowerCase();
      const namnda = o.val.filter(function (v) { return v.namn && alt.indexOf(v.namn.toLowerCase()) >= 0; });
      if (namnda.length === 1) { fynd.push({ n: n + 1, id: m.id.slice(7, 13), fil: m.id, typ: "namn", val: namnda[0].namn, alt: m.alt.slice(0, 70) }); traffar.namn++; return; }
      if (!/mått/.test(alt)) return;
      const tal = new Set(siffror(m.alt));
      const traff = o.val.filter(function (v) { const t = siffror(v.namn); return t.length > 0 && t.every(function (x) { return tal.has(x); }); });
      if (traff.length === 1) { fynd.push({ n: n + 1, id: m.id.slice(7, 13), fil: m.id, typ: "tal", val: traff[0].namn, alt: m.alt.slice(0, 70) }); traffar.tal++; }
      else { fynd.push({ n: n + 1, id: m.id.slice(7, 13), fil: m.id, typ: "matt", val: traff.length + " val", alt: m.alt.slice(0, 70) }); traffar.matt++; }
    });
    if (fynd.length === 0) continue;
    sidorMedDelade++;
    if (detalj.length < GRANS_SIDOR) detalj.push({ p: p.id, opt: o.namn, val: o.val.map(function (v) { return v.namn; }), g: p.items.length, bilder: fynd.map(function (f) { return { n: f.n, fil: f.fil, typ: f.typ, val: f.val, alt: f.alt }; }) });
    if (rader.length < GRANS_SIDOR) rader.push(p.id.slice(0, 8) + " | " + o.namn + ": " + o.val.map(function (v) { return v.namn; }).join(" / ") + " | g" + p.items.length + " | " + fynd.map(function (f) { return f.typ + " b" + f.n + " " + f.id + " → " + f.val + " «" + f.alt + "»"; }).join(" ; "));
  }
  return { sidorMedEttValUtanFarg: sidor, sidorMedTraff: sidorMedDelade, traffar: traffar, visade: rader.length, detalj: detalj, sekunder: Math.round((Date.now() - t0) / 1000) };
}
