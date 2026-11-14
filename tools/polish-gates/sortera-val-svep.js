async function () {
  // sortera-val-svep.js (2026-11-06): hittar sidor där valen i en option (Storlek, Modell, Antal, Längd …) INTE ligger i storleksordning.
  // Skriver ingenting. Kör via ExecuteWixAPI. Rättar gör `sortera-val.js`, som bygger målordningen med samma funktion (`analysera`, kopierad ordagrant).
  //
  // Utfall 2026-11-06 07:0x UTC: 6 016 publicerade sidor (30 s för alla med filtret visible: true), 1 220 med en option som har minst två val,
  // och av 238 val som inte är färg med tal i varje val var 16 tydligt fel (nio Storlek, tre Modell, en vardera Bärförmåga, Antal, Typ och
  // Längd): hantlarna 2 × 4, 5, 10, 6 kg, rosenträdet 2 träd före 1 träd, fyra mattor och skrivbord, ett taktält, en pump, ett sortimentskåp, en
  // bänk, ett katthjul, ett arbetsbord och en hundgård. Alla 16 rättades samma morgon. Bokstavsstorlekar (13 val) låg alla rätt.
  //
  // Vad som flaggas (`flaggade`) och vad som lämnas (`diskutabla`):
  //   · bara options med minst två val som inte heter Färg, där varje val har minst ett tal, lika många tal i varje val och inga blandade enheter;
  //   · tydligt fel: ett val som är mindre än ett val före det i varje mått (det domineras), inom samma grupp (texten före första siffran);
  //   · diskutabelt: bara produkten av måtten går åt fel håll (till exempel 6 × 10 m före 7 × 8 m). Sådana rörs inte, de listas bara.
  //   · `ovrigt` (val utan tal, som Liten – Mellan – Stor), `blandat` (olika antal tal eller blandade enheter) och Färg bedöms inte.
  // ☠️ Ett mått som kräver ett visst optionnamn mäter namnet, inte katalogen: svaret räknar vad som hoppades över.
  //
  // `SYNLIGA`: true = publicerade sidor (filtret visible: true), false = dolda utkast (filtret visible: false, ~7 000 sidor, flera körningar).
  // `START`: markören `markor` ur förra körningen när tiden tog slut (50 s-taket); null = från början.
  // ☠️ Filtret skickas bara med första sidan: markören bär det redan (Wix 400 INVALID_CURSOR annars, se lib/kategorikoll/produkter.ts).
  const SYNLIGA = true;
  const START = null;
  const T0 = Date.now();
  const lika = function (a, b) { return String(a || "").trim().toLowerCase() === String(b || "").trim().toLowerCase(); };

  const slim = [];
  let cursor = START;
  let markor = null;
  while (true) {
    const search = cursor ? { cursorPaging: { limit: 100, cursor: cursor } } : { filter: { visible: { $eq: SYNLIGA } }, cursorPaging: { limit: 100 } };
    const r = await wix.request({ method: "POST", url: "https://www.wixapis.com/stores/v3/products/search", body: { search: search } });
    const ps = r.data.products || [];
    for (const q of ps) {
      slim.push({
        id: q.id,
        namn: q.name || "",
        options: (q.options || []).map(function (o) {
          return { namn: o.name || "", val: ((o.choicesSettings && o.choicesSettings.choices) || []).map(function (c) { return c.name || ""; }) };
        }),
      });
    }
    const next = r.data.pagingMetadata && r.data.pagingMetadata.cursors && r.data.pagingMetadata.cursors.next;
    if (!next || ps.length === 0) { markor = null; break; }
    cursor = next;
    markor = next;
    if (Date.now() - T0 > 50000) break;
  }

  const NUM = /\d+(?:[.,]\d+)?/g;
  const talAv = function (s) { return (String(s).match(NUM) || []).map(function (t) { return parseFloat(t.replace(",", ".")); }); };
  const BOKSTAV = { xxs: 0, xs: 1, s: 2, m: 3, l: 4, xl: 5, xxl: 6, "2xl": 6, xxxl: 7, "3xl": 7, "4xl": 8, "5xl": 9, "6xl": 10, "7xl": 11 };
  const bokstavAv = function (s) { const k = String(s).toLowerCase().replace(/\s+/g, ""); return Object.prototype.hasOwnProperty.call(BOKSTAV, k) ? BOKSTAV[k] : null; };
  const ENH = { mm: ["l", 0.1], cm: ["l", 1], dm: ["l", 10], m: ["l", 100], ml: ["v", 0.001], cl: ["v", 0.01], dl: ["v", 0.1], l: ["v", 1], liter: ["v", 1], g: ["w", 0.001], kg: ["w", 1] };
  const enhetAv = function (s) {
    const m = String(s).toLowerCase().match(/\d\s*(mm|cm|dm|ml|cl|dl|kg|liter|m|l|g)(?![a-zåäö])/);
    return m ? ENH[m[1]] : null;
  };
  const prod = function (a) { return a.reduce(function (x, y) { return x * y; }, 1); };
  const domineras = function (b, a) { return b.every(function (x, k) { return x <= a[k]; }) && b.some(function (x, k) { return x < a[k]; }); };
  // { typ, inv: tydligt fel, area: diskutabel ordning, mal: namnen i målordning } eller { typ } när valen inte går att bedöma.
  const analysera = function (namnen) {
    const bok = namnen.map(bokstavAv);
    if (bok.every(function (x) { return x !== null; })) {
      const mal0 = namnen.map(function (_, i) { return i; }).sort(function (a, b) { return bok[a] - bok[b] || a - b; });
      return { typ: "bokstav", inv: mal0.some(function (v, i) { return v !== i; }), area: false, mal: mal0.map(function (i) { return namnen[i]; }) };
    }
    const tal = namnen.map(talAv);
    if (!tal.every(function (t) { return t.length > 0; })) return { typ: "ovrigt" };
    const dims = tal[0].length;
    if (!tal.every(function (t) { return t.length === dims; })) return { typ: "blandatAntalTal" };
    const enh = namnen.map(enhetAv);
    const fam = enh.filter(Boolean).map(function (e) { return e[0]; });
    if (fam.length > 0 && (fam.length !== enh.length || fam.some(function (f) { return f !== fam[0]; }))) return { typ: "blandadeEnheter" };
    const fakt = enh[0] ? enh.map(function (e) { return e[1]; }) : namnen.map(function () { return 1; });
    const nyckel = tal.map(function (t, i) { return t.map(function (x) { return x * fakt[i]; }); });
    const lead = namnen.map(function (n) { return String(n).split(/\d/)[0].trim().toLowerCase(); });
    const grupper = {};
    lead.forEach(function (l, i) { (grupper[l] = grupper[l] || []).push(i); });
    let inv = false;
    let area = false;
    const mal = namnen.map(function (_, i) { return i; });
    Object.keys(grupper).forEach(function (g) {
      const pos = grupper[g];
      for (let x = 0; x < pos.length; x++) {
        for (let y = x + 1; y < pos.length; y++) {
          const a = nyckel[pos[x]];
          const b = nyckel[pos[y]];
          if (domineras(b, a)) inv = true;
          else if (prod(b) < prod(a)) area = true;
        }
      }
      const sorterad = pos.slice().sort(function (a, b) {
        const d = prod(nyckel[a]) - prod(nyckel[b]);
        if (d !== 0) return d;
        for (let k = 0; k < dims; k++) { if (nyckel[a][k] !== nyckel[b][k]) return nyckel[a][k] - nyckel[b][k]; }
        return a - b;
      });
      pos.forEach(function (p, i) { mal[p] = sorterad[i]; });
    });
    return { typ: "tal" + dims, inv: inv, area: area, mal: mal.map(function (i) { return namnen[i]; }) };
  };

  const hist = {};
  const flaggade = [];
  const diskutabla = [];
  const blandat = [];
  const ovrigt = [];
  const typer = { bokstav: 0, tal: 0, ovrigt: 0, blandat: 0 };
  let medFlerval = 0;
  for (const q of slim) {
    const flera = q.options.filter(function (o) { return o.val.length >= 2; });
    if (flera.length > 0) medFlerval++;
    for (const o of flera) {
      hist[o.namn] = (hist[o.namn] || 0) + 1;
      if (/^f[aä]rg$/i.test(o.namn.trim())) continue;
      if (new Set(o.val).size !== o.val.length) { blandat.push(q.id.slice(0, 8) + "|dubblettnamn|" + o.namn); continue; }
      const a = analysera(o.val);
      if (a.typ === "ovrigt") { typer.ovrigt++; ovrigt.push(q.id.slice(0, 8) + "|" + o.namn + "|" + o.val.join(" ; ").slice(0, 110)); continue; }
      if (a.typ === "blandatAntalTal" || a.typ === "blandadeEnheter") { typer.blandat++; blandat.push(q.id.slice(0, 8) + "|" + a.typ + "|" + o.namn + "|" + o.val.join(" ; ").slice(0, 130)); continue; }
      if (a.typ === "bokstav") typer.bokstav++; else typer.tal++;
      if (a.inv) flaggade.push(q.id + "|" + o.namn + "|" + o.val.join(" ; ").slice(0, 160) + " => " + a.mal.join(" ; ").slice(0, 160));
      else if (a.area) diskutabla.push(q.id.slice(0, 8) + "|" + o.namn + "|" + o.val.join(" ; ").slice(0, 130));
    }
  }
  const sortera = function (m) { return Object.keys(m).sort(function (a, b) { return m[b] - m[a]; }).map(function (k) { return k + "=" + m[k]; }); };
  return {
    synliga: SYNLIGA,
    markor: markor,
    lasta: slim.length,
    medFlerval: medFlerval,
    optionnamn: sortera(hist).slice(0, 30),
    bedomda: typer,
    flaggadeAntal: flaggade.length,
    flaggade: flaggade.slice(0, 60),
    diskutablaAntal: diskutabla.length,
    diskutabla: diskutabla.slice(0, 30),
    blandatAntal: blandat.length,
    blandat: blandat.slice(0, 20),
    ovrigtAntal: ovrigt.length,
    ms: Date.now() - T0,
  };
}
