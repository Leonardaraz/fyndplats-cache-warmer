async function () {
  // katalogkontroll-farg-givare.js (2026-10-21): för varje publicerad sida med färgval, vilka färgval visar GRANS bilder eller
  // färre i butiken, och finns det en dold givare (ett pensionerat utkast eller en ommappad AliExpress-sida) vars bilder inte
  // ligger på sidan? Skriver ingenting. Kör via ExecuteWixAPI (en körning, ~36 s för 6 100 produkter).
  //
  // Svaret per sida: "wix-id8:g<galleri>:k<gemensamma>:<färg>=<antal>[<<givare4>+<extra>/<givarens galleri>]; …".
  //   g   bilder i sidans galleri
  //   k   bilder som butiken visar för ALLA färger (kort och måttbilder utan länk, eller en alt-text som nämner flera färger)
  //   <färg>=<antal>   en färg som visar GRANS bilder eller färre, med antalet
  //   <givare4>+<extra>/<galleri>   en dold produkt som har färgens första bild i sitt galleri, hur många av dess bilder som
  //                    INTE ligger på sidan, och hur många bilder den har
  // `SIDOR` (id8, kommaseparerade) begränsar till de sidorna; tom = alla publicerade sidor med färgval.
  //
  // Utfall 2026-10-21 på de 442 Aosom-sidorna (798 färgval på fyra bilder eller färre): 298 av dem har en givare i Wix, men bara
  // 26 färgval en givare med bilder kvar (51 bilder). Givarna är alltså i stort sett uttömda; resten av underlaget finns bara
  // i feeden (CLAUDE.md, Färgval med få bilder). 412 av 442 sidor har inga gemensamma bilder alls (k0).
  // ☠️ Givarens egna kort (Faktakort, Måttritning, Specifikationer) flyttas aldrig av färgbildsverktyget ("sidans kort gäller
  // alla färger"), så en `+extra` kan vara ett kort. Titta på bilderna innan något skrivs (tools/polish-gates/ocr-forgranska.py).
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
  // Dolda produkter per fil-id: en givare hittas via färgens första bild.
  const dolda = new Map();
  for (const p of slim) {
    if (p.vis) continue;
    for (const b of p.items) { if (!dolda.has(b.id)) dolda.set(b.id, []); dolda.get(b.id).push(p); }
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
  let sidor = 0, svaga = 0, medGivare = 0, medExtra = 0, extraSumma = 0;
  for (const p of slim) {
    if (!p.vis) continue;
    if (SIDOR.size > 0 && !SIDOR.has(p.id.slice(0, 8))) continue;
    const f = farg(p);
    if (!f) continue;
    sidor++;
    const pg = new Set(p.items.map(function (b) { return b.id; }));
    const delar = [];
    f.synliga.forEach(function (c, i) {
      if (f.antal[i] > GRANS) return;
      svaga++;
      const donorer = new Map();
      for (const id of c.lankade) for (const d of (dolda.get(id) || [])) donorer.set(d.id, d);
      let txt = c.namn.slice(0, 9) + "=" + f.antal[i];
      if (donorer.size > 0) {
        medGivare++;
        let bast = 0;
        const ds = [];
        donorer.forEach(function (d) {
          const extra = d.items.filter(function (b) { return !pg.has(b.id); }).length;
          bast = Math.max(bast, extra);
          ds.push(d.id.slice(0, 4) + "+" + extra + "/" + d.items.length);
        });
        if (bast > 0) { medExtra++; extraSumma += bast; }
        txt += "<" + ds.join(",");
      }
      delar.push(txt);
    });
    if (delar.length > 0) rader.push(p.id.slice(0, 8) + ":g" + p.items.length + ":k" + f.gemensamma + ":" + delar.join(";"));
  }
  // ☠️ En kontroll som inte kan fälla räknas ändå som gjord: `produkter` och `sidor` ska vara över noll.
  return { produkter: slim.length, sidorMedFargval: sidor, svagaFarger: svaga, svagaMedGivare: medGivare, svagaMedBilderKvar: medExtra, bilderKvarSumma: extraSumma, ms: Date.now() - t0, rader: rader.join("\n") };
}
