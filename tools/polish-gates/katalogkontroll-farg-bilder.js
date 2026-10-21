async function () {
  // katalogkontroll-farg-bilder.js (2026-10-21): hur många bilder visar varje FÄRGVAL i butiken? Listar publicerade sidor där
  // minst ett färgval visar GRANS bilder eller färre. Skriver ingenting. Kör via ExecuteWixAPI (en körning, ~30 s för 6 100
  // produkter). Leonard 2026-10-21: "varianter som har 4 bilder eller mindre" ska få fler bilder (CLAUDE.md, Färgval med få bilder).
  //
  // Räknar som butiken gör, uppmätt mot den publicerade sidan (live-bilder.mjs) 2026-10-21 på 69 sidor med en axel: 60 stämmer
  // exakt (lib/aosom/livsbild.ts `fargVy` stämde på 47). Reglerna: en länkad bild visas bara för det FÖRSTA val som länkar den
  // (en bild som två val länkar, som huvudbilden på en sida med storlek och färg i valnamnet, tillhör det första). En bild bara en
  // annan axel länkar visas inte. Olänkade bilder: ett kort eller en måttbild är gemensam, en alt-text som nämner exakt en färg
  // hör till den, flera färger är gemensamt, och en bild utan färgnamn hör till huvudbildens färg BARA när varje färgval är ett
  // enda färgord (Svart, Vit). Heter något val "Nattsvart M" eller "Base 210T Rosa" går färgnamnen inte att läsa ur alt-texten, och
  // då visas bilden för alla färger. De 9 sidor som inte stämde visar fler eller färre bilder än regeln ger (okänd orsak), så
  // `lista` är en uppskattning: mät den enskilda sidan live innan den tas som given.
  //
  // `products/search` bär `options` med `linkedMedia` och `visible` per val, och `MEDIA_ITEMS_INFO` ger galleriet med alt-texter.
  // `fields` ligger på kroppens toppnivå och skickas om på varje sida, `cursorPaging` inuti `search`, utan filter (filter + markör
  // ger 400). Svaret: { produkter, publicerade, medFargval, valTotalt, histogram, sidorUnderGrans, valUnderGrans, lista, ... }.
  // `lista` är "wix-id8:minsta:antal val:galleri;…", sorterad på minsta antal bilder. ☠️ Kontrollen är bara värd något om
  // `medFargval` och `valTotalt` är över noll: en kontroll som inte kan fälla räknas ändå som gjord.
  //
  // Utfall 2026-10-21 före åtgärderna: se CLAUDE.md, Färgval med få bilder.
  const GRANS = 4;
  const t0 = Date.now();
  const lika = function (a, b) {
    return String(a || "").trim().toLowerCase() === String(b || "").trim().toLowerCase();
  };
  const FORE = "(?<![\\p{L}\\p{N}])";
  const EFTER = "(?![\\p{L}\\p{N}])";
  const BAKGRUND = /(?<![\p{L}])(?:vit|vita|vitt|grå|gråa|grått|svart|svarta|ljus|ljusa|ljusgrå|beige)\s+(?:bakgrund|bakgrunden|studiobakgrund|yta|ytan)(?![\p{L}])/giu;
  const esc = function (s) {
    return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  };
  const fargFormer = function (etikett) {
    const w = String(etikett || "").trim().toLowerCase();
    if (!/^\p{L}{3,}$/u.test(w)) return null;
    const former = new Set([w, w + "a", w + "t", w + "tt"]);
    if (w.endsWith("d")) former.add(w.slice(0, -1) + "tt");
    if (w.endsWith("t")) former.add(w + "t");
    return Array.from(former);
  };
  const nammdaFarger = function (alt, etiketter) {
    const text = String(alt || "").replace(BAKGRUND, " ");
    const traffar = [];
    for (const e of etiketter) {
      const former = fargFormer(e);
      if (!former) continue;
      const re = new RegExp(FORE + "(?:" + former.map(esc).join("|") + ")" + EFTER, "iu");
      if (re.test(text)) traffar.push(e);
    }
    return traffar;
  };
  const arKort = function (alt) {
    return (
      /^\s*(?:fyndplats|mått|specifikation)/i.test(alt) ||
      /(?:spec(?:ifikations)?|mått|färg|fakta|storleks)kort/i.test(alt) ||
      /mått(?:bild|ritning|skiss|skisser|uppgifter)/i.test(alt)
    );
  };

  // En sida: färgvalens bildantal, som fargVy.
  const farg = function (p) {
    const items = (p.media && p.media.itemsInfo && p.media.itemsInfo.items) || [];
    const bilder = items.map(function (m) { return { id: m.id, alt: String(m.altText || "") }; }).filter(function (b) { return b.id; });
    const optioner = (p.options || []).map(function (o) {
      return {
        namn: o.name || "",
        val: ((o.choicesSettings && o.choicesSettings.choices) || []).map(function (c) {
          return {
            id: c.choiceId,
            namn: c.name || "",
            synligt: c.visible !== false,
            lankade: (c.linkedMedia || []).map(function (m) { return m.id; }).filter(Boolean),
          };
        }),
      };
    });
    const fo = optioner.find(function (o) { return lika(o.namn, "Färg"); });
    if (!fo) return null;
    const synliga = fo.val.filter(function (v) { return v.synligt; });
    if (synliga.length < 2) return null;
    const allaLankade = new Set();
    for (const o of optioner) for (const v of o.val) for (const id of v.lankade) allaLankade.add(id);
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
      const t = nammdaFarger(b.alt, etiketter);
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
    return { antal: antal, galleri: bilder.length };
  };

  let cursor = null;
  let produkter = 0;
  let publicerade = 0;
  let medFargval = 0;
  let valTotalt = 0;
  let valUnderGrans = 0;
  const histogram = {};
  const flaggade = [];
  while (true) {
    const search = cursor ? { cursorPaging: { limit: 100, cursor: cursor } } : { cursorPaging: { limit: 100 } };
    const r = await wix.request({
      method: "POST",
      url: "https://www.wixapis.com/stores/v3/products/search",
      body: { search: search, fields: ["MEDIA_ITEMS_INFO"] },
    });
    const ps = r.data.products || [];
    for (const p of ps) {
      produkter++;
      if (p.visible !== true) continue;
      publicerade++;
      const f = farg(p);
      if (!f) continue;
      medFargval++;
      valTotalt += f.antal.length;
      const minsta = Math.min.apply(null, f.antal);
      const nyckel = minsta > 10 ? "11+" : String(minsta);
      histogram[nyckel] = (histogram[nyckel] || 0) + 1;
      valUnderGrans += f.antal.filter(function (n) { return n <= GRANS; }).length;
      if (minsta <= GRANS) flaggade.push({ id: p.id, minsta: minsta, val: f.antal.length, galleri: f.galleri });
    }
    const next = r.data.pagingMetadata && r.data.pagingMetadata.cursors && r.data.pagingMetadata.cursors.next;
    if (!next || ps.length === 0) { cursor = null; break; }
    cursor = next;
    if (Date.now() - t0 > 50000) break;
  }
  flaggade.sort(function (a, b) { return a.minsta - b.minsta || (a.id < b.id ? -1 : 1); });
  return {
    produkter: produkter,
    publicerade: publicerade,
    medFargval: medFargval,
    valTotalt: valTotalt,
    histogram: histogram,
    gransen: GRANS,
    sidorUnderGrans: flaggade.length,
    valUnderGrans: valUnderGrans,
    lista: flaggade.map(function (x) { return x.id.slice(0, 8) + ":" + x.minsta + ":" + x.val + ":" + x.galleri; }).join(";"),
    markorKvar: cursor !== null,
    ms: Date.now() - t0,
  };
}
