async function () {
  // katalogkontroll-farg-antal.js (2026-10-22): hur många färgval visar GRANS bilder eller färre i butiken, fördelat på antal, och vilka sidor.
  // Som katalogkontroll-farg-givare.js men utan givaruppslaget, så svaret är litet. Skriver ingenting. Kör via ExecuteWixAPI (en körning,
  // ~33 s för 6 100 produkter). Svaret: `fordelning` (färgval per antal bilder: 0, 1, 2, 3, 4, 5, 6+) och `rader`, en per sida med minst ett svagt
  // färgval: "wix-id8:g<galleri>:k<gemensamma>:<färg>=<antal>; …" (k = bilder som butiken visar för ALLA färger).
  // Utfall 2026-10-22 13:00 UTC, efter omgång 18: 576 av 2 553 färgval på fyra bilder eller färre (1 097 av 2 533 den 21 oktober), 263 sidor,
  // varav 167 Aosom-sidor (273 vyer) och 96 AliExpress-sidor (303 vyer). Räknesättet är skriptets (live-validerat 60 av 69 sidor), inte butikens.
  // `SIDOR` (id8, kommaseparerade) begränsar till de sidorna; tom = alla publicerade sidor med färgval.
  const SIDOR = new Set("".split(",").filter(Boolean));
  const GRANS = 4;
  const t0 = Date.now();
  const lika = function (a, b) { return String(a || "").trim().toLowerCase() === String(b || "").trim().toLowerCase(); };
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

  // Hela katalogen, i slim form. `fields` ligger på kroppens toppnivå, `cursorPaging` inuti `search`, utan filter.
  const slim = [];
  let cursor = null;
  while (true) {
    const search = cursor ? { cursorPaging: { limit: 100, cursor: cursor } } : { cursorPaging: { limit: 100 } };
    const r = await wix.request({ method: "POST", url: "https://www.wixapis.com/stores/v3/products/search", body: { search: search, fields: ["MEDIA_ITEMS_INFO"] } });
    const ps = r.data.products || [];
    for (const p of ps) {
      slim.push({
        id: p.id,
        vis: p.visible === true,
        items: ((p.media && p.media.itemsInfo && p.media.itemsInfo.items) || []).map(function (m) { return { id: m.id, alt: String(m.altText || "") }; }).filter(function (b) { return b.id; }),
        options: (p.options || []).map(function (o) {
          return { namn: o.name || "", val: ((o.choicesSettings && o.choicesSettings.choices) || []).map(function (c) {
            return { id: c.choiceId, namn: c.name || "", synligt: c.visible !== false, lankade: (c.linkedMedia || []).map(function (m) { return m.id; }).filter(Boolean) };
          }) };
        }),
      });
    }
    const next = r.data.pagingMetadata && r.data.pagingMetadata.cursors && r.data.pagingMetadata.cursors.next;
    if (!next || ps.length === 0) break;
    cursor = next;
    if (Date.now() - t0 > 52000) return { fel: "tid", sedda: slim.length };
  }
  // En sida: färgvalens bildantal som butiken räknar dem (live-validerat 60 av 69 sidor).
  const farg = function (p) {
    const bilder = p.items;
    const fo = p.options.find(function (o) { return lika(o.namn, "Färg"); });
    if (!fo) return null;
    const synliga = fo.val.filter(function (v) { return v.synligt; });
    if (synliga.length < 2) return null;
    const allaLankade = new Set();
    for (const o of p.options) for (const v of o.val) for (const id of v.lankade) allaLankade.add(id);
    const forstaAgare = {};
    fo.val.forEach(function (v, i) { v.lankade.forEach(function (id) { if (forstaAgare[id] === undefined) forstaAgare[id] = i; }); });
    const huvud = bilder[0] && bilder[0].id;
    const urspr = fo.val.find(function (v) { return !!huvud && v.lankade.indexOf(huvud) >= 0; });
    const ursprung = urspr ? urspr.namn : null;
    const etiketter = fo.val.map(function (v) { return v.namn; }).filter(function (f) { return fargFormer(f); });
    const allaEnkla = etiketter.length === fo.val.length;
    const agare = new Map();
    for (const b of bilder) {
      if (allaLankade.has(b.id) || agare.has(b.id)) continue;
      if (arKort(b.alt)) { agare.set(b.id, null); continue; }
      const t = nammda(b.alt, etiketter);
      if (t.length === 1) agare.set(b.id, t[0]);
      else if (t.length > 1) agare.set(b.id, null);
      else agare.set(b.id, allaEnkla ? ursprung : null);
    }
    const antal = synliga.map(function (c) {
      const idx = fo.val.indexOf(c);
      return bilder.filter(function (b) {
        if (c.lankade.indexOf(b.id) >= 0) return forstaAgare[b.id] === idx;
        if (allaLankade.has(b.id)) return false;
        const a = agare.get(b.id);
        return a === null || (a !== undefined && lika(a, c.namn));
      }).length;
    });
    let gemensamma = 0;
    for (const b of bilder) if (!allaLankade.has(b.id) && agare.get(b.id) === null) gemensamma++;
    return { synliga: synliga, antal: antal, gemensamma: gemensamma };
  };

  const rader = [];
  let sidor = 0, svaga = 0;
  const per = {};
  for (const p of slim) {
    if (!p.vis) continue;
    if (SIDOR.size > 0 && !SIDOR.has(p.id.slice(0, 8))) continue;
    const f = farg(p);
    if (!f) continue;
    sidor++;
    const delar = [];
    f.synliga.forEach(function (c, i) {
      const n = f.antal[i];
      const k = n >= 6 ? "6+" : String(n);
      per[k] = (per[k] || 0) + 1;
      if (n > GRANS) return;
      svaga++;
      delar.push(c.namn.slice(0, 9) + "=" + n);
    });
    if (delar.length > 0) rader.push(p.id.slice(0, 8) + ":g" + p.items.length + ":k" + f.gemensamma + ":" + delar.join(";"));
  }
  // ☠️ En kontroll som inte kan fälla räknas ändå som gjord: `produkter` och `sidorMedFargval` ska vara över noll.
  return { produkter: slim.length, sidorMedFargval: sidor, svagaFarger: svaga, fordelning: per, sidorMedSvaga: rader.length, ms: Date.now() - t0, rader: rader.join("\n") };
}
