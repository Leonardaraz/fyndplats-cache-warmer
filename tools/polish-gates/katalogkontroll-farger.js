async function () {
  // katalogkontroll-farger.js (2026-10-21): publicerade och dolda sidor där ett färgval saknar egen kopplad bild (`linkedMedia`),
  // och sidor där två färgval har samma FÖRSTA bild (ett val visar då en annan färgs foto). Skriver ingenting.
  // Kör via ExecuteWixAPI (en körning, ~30 s för 6 100 produkter). `products/search` bär `options` med `linkedMedia` och `visible`
  // per val, så ingen enskild läsning per produkt behövs. `cursorPaging` ligger inuti `search`, utan filter (filter + markör ger 400).
  // Svaret: { produkter, fargoptioner, valMedBild, utan: [...], dubbla: [...] }. ☠️ Kontrollen är bara värd något om `fargoptioner`
  // och `valMedBild` är över noll: en kontroll som inte kan fälla räknas ändå som gjord. 2026-10-21 fann den plåtboden (Brun) som
  // enda dolda träff innan åtgärden, vilket är beviset att den kan fälla.
  const t0 = Date.now();
  const fargRe = /färg|colou?r|kulör/i;
  let cursor = null;
  let produkter = 0, fargoptioner = 0, valMedBild = 0;
  const utan = [];
  const dubbla = [];
  while (true) {
    const search = cursor ? { cursorPaging: { limit: 100, cursor: cursor } } : { cursorPaging: { limit: 100 } };
    const r = await wix.request({ method: "POST", url: "https://www.wixapis.com/stores/v3/products/search", body: { search: search } });
    const ps = r.data.products || [];
    for (const p of ps) {
      produkter++;
      for (const op of (p.options || [])) {
        if (!fargRe.test(op.name || "")) continue;
        const ch = ((op.choicesSettings && op.choicesSettings.choices) || []).filter(function (c) { return c.visible !== false; });
        if (ch.length < 2) continue;
        fargoptioner++;
        const saknar = [];
        const forsta = {};
        for (const c of ch) {
          const l = c.linkedMedia && c.linkedMedia[0] && c.linkedMedia[0].id;
          if (!l) { saknar.push(c.name); continue; }
          valMedBild++;
          (forsta[l] = forsta[l] || []).push(c.name);
        }
        if (saknar.length) utan.push({ id: p.id.slice(0, 8), synlig: p.visible !== false, option: op.name, val: ch.length, saknar: saknar.slice(0, 5) });
        for (const fil of Object.keys(forsta)) {
          if (forsta[fil].length > 1) dubbla.push({ id: p.id.slice(0, 8), synlig: p.visible !== false, option: op.name, val: ch.length, delar: forsta[fil].slice(0, 4) });
        }
      }
    }
    const next = r.data.pagingMetadata && r.data.pagingMetadata.cursors && r.data.pagingMetadata.cursors.next;
    if (!next || ps.length === 0) { cursor = null; break; }
    cursor = next;
    if (Date.now() - t0 > 50000) break;
  }
  return { produkter: produkter, fargoptioner: fargoptioner, valMedBild: valMedBild, utan: utan, dubbla: dubbla, markorKvar: cursor !== null, ms: Date.now() - t0 };
}
