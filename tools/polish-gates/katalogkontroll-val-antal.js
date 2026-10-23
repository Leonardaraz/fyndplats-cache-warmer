async function () {
  // katalogkontroll-val-antal.js (2026-10-22): hur många bilder visar butiken för varje val på en sida vars ENDA option inte är färg
  // (Storlek, Modell, Variant …), och vilka val som visar GRANS bilder eller färre. Som katalogkontroll-farg-antal.js men för de sidor den hoppar över.
  // Skriver ingenting. Kör via ExecuteWixAPI (en körning, ~35 s för 6 100 produkter).
  //
  // Räknesättet är farg-antal-skriptets, utan färglogiken (det finns ingen färg att ge en olänkad bild åt):
  //   - en länkad bild visas bara för det FÖRSTA val i optionen som länkar den,
  //   - en bild som ingen val länkar är gemensam och visas för alla val,
  //   - äger ett val ingenting och ingen bild är gemensam visar butiken hela galleriet.
  // Mätt live på växthusplasten b729a465 (2026-10-22): 6 × 10 m länkar bara huvudbilden och visar 1, 7 × 8 m och 8 × 10 m länkar alla sex.
  // 7 × 8 m äger fem (huvudbilden tillhör redan det första valet) och visar 5, 8 × 10 m äger inget och faller tillbaka på alla sex.
  // ☠️ Regeln är härledd ur den sidan och ur färgreglerna, inte läst ur butikens kod. Kontrollerad live mot butiken 2026-10-22 på 17 sidor med
  // 1–8 val vardera (växthusplasten och 16 till, olika mönster: delade länkar, uppdelade galleri, helt olänkade, ett val utan länk): varje val
  // gav exakt samma antal som modellen. Mät ändå en sida live (live-galleri.mjs <slug>) innan du tar ett enskilt tal som givet.
  // Utfall 2026-10-22 18:3x UTC: 6 143 produkter, 5 092 publicerade. 3 923 har ingen option med två val, 910 bara färg, 49 två axlar (mäts live,
  // se tools/polish-gates/FLAGGADE.md lärdom 163) och 210 ett enda val som inte är färg (148 Storlek, 16 Modell, 10 Antal, 7 Typ, 5 Volym …).
  // Av de 210 har 115 sidor minst ett val på fyra bilder eller färre (246 val, fördelning 1: 13, 2: 23, 3: 62, 4: 148), 49 sidor ett val på tre
  // eller färre (98 val), och 9 sidor ett val på en eller två bilder fast galleriet har sex eller fler. 13 av de 115 har högst fyra bilder
  // i hela galleriet, 102 har fler och svälter alltså på länkarna.
  //
  // `rader`: "wix-id|g<galleri>|u<gemensamma>|<option>|<val>=<antal>;…" för sidor med minst ett svagt val.
  // `SIDOR` (id8, kommaseparerade) begränsar till de sidorna; tom = alla publicerade sidor.
  const SIDOR = new Set("".split(",").filter(Boolean));
  const GRANS = 4;
  const t0 = Date.now();
  const lika = function (a, b) { return String(a || "").trim().toLowerCase() === String(b || "").trim().toLowerCase(); };

  const slim = [];
  let cursor = null;
  while (true) {
    const search = cursor ? { cursorPaging: { limit: 100, cursor: cursor } } : { cursorPaging: { limit: 100 } };
    const r = await wix.request({ method: "POST", url: "https://www.wixapis.com/stores/v3/products/search", body: { search: search, fields: ["MEDIA_ITEMS_INFO"] } });
    const ps = r.data.products || [];
    for (const p of ps) {
      slim.push({
        id: p.id,
        namn: p.name || "",
        vis: p.visible === true,
        items: ((p.media && p.media.itemsInfo && p.media.itemsInfo.items) || []).map(function (m) { return m.id; }).filter(Boolean),
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

  const rader = [];
  const per = {};
  const optNamn = {};
  let publicerade = 0, utanOption = 0, farg = 0, flerAxlar = 0, matta = 0, svagaSidor = 0, svagaVal = 0, gallerisvaga = 0, lankvaga = 0;
  for (const p of slim) {
    if (!p.vis) continue;
    if (SIDOR.size > 0 && !SIDOR.has(p.id.slice(0, 8))) continue;
    publicerade++;
    const opt = p.options.filter(function (o) { return o.val.filter(function (v) { return v.synligt; }).length >= 2; });
    if (opt.length === 0) { utanOption++; continue; }
    if (opt.length >= 2) { flerAxlar++; continue; }
    const o = opt[0];
    if (lika(o.namn, "Färg")) { farg++; continue; }
    matta++;
    optNamn[o.namn] = (optNamn[o.namn] || 0) + 1;
    const synliga = o.val.filter(function (v) { return v.synligt; });
    const allaLankade = new Set();
    for (const v of o.val) for (const id of v.lankade) allaLankade.add(id);
    const forsta = {};
    o.val.forEach(function (v, i) { v.lankade.forEach(function (id) { if (forsta[id] === undefined) forsta[id] = i; }); });
    const gemensamma = p.items.filter(function (id) { return !allaLankade.has(id); }).length;
    const antal = synliga.map(function (c) {
      const idx = o.val.indexOf(c);
      const agda = p.items.filter(function (id) { return c.lankade.indexOf(id) >= 0 && forsta[id] === idx; }).length;
      const n = agda + gemensamma;
      return n === 0 ? p.items.length : n;
    });
    const delar = [];
    synliga.forEach(function (c, i) {
      const n = antal[i];
      const k = n >= 6 ? "6+" : String(n);
      per[k] = (per[k] || 0) + 1;
      if (n > GRANS) return;
      svagaVal++;
      delar.push(c.namn + "=" + n);
    });
    if (delar.length > 0) {
      svagaSidor++;
      if (p.items.length <= GRANS) gallerisvaga++; else lankvaga++;
      rader.push([p.id, "g" + p.items.length, "u" + gemensamma, o.namn, p.namn.slice(0, 42), delar.join(";")].join("|"));
    }
  }
  // ☠️ En kontroll som inte kan fälla räknas ändå som gjord: `matta` ska vara över noll.
  return { produkter: slim.length, publicerade: publicerade, utanOption: utanOption, endastFarg: farg, flerAxlar: flerAxlar, mattaSidor: matta, optionnamn: optNamn,
    svagaSidor: svagaSidor, svagaVal: svagaVal, svagaPaGrundAvGalleri: gallerisvaga, svagaPaGrundAvLankning: lankvaga, fordelning: per, ms: Date.now() - t0, rader: rader.join("\n") };
}
