async function () {
  // dubblettsvep-bevis.js (2026-10-15): måtttrippel och delade måttsymboler per dolt utkast mot alla PUBLICERADE sidor, med
  // BEVISSTYRKA per träff: ex = antal utkastetrippler som är exakt lika, nr = antal som är ±1/±1/±2, sh = delade måttsymboler.
  // Rader skrivs bara för utkast vars bästa träff har ex >= 1, nr >= 2 eller sh >= 4. Utkast utan rad har ingen stark måttträff.
  // Format: "<id8> <antal trippler>/<antal måttsymboler> <publicerad id8>:<ex>/<nr>/<sh> ..." (tre bästa träffarna).
  // Kör via ExecuteWixAPI (en körning, ~60 s). Svaret kapas vid 100 000 tecken, så filtrera i koden om det blir större.
  const NUM = "(\\d{1,3}(?:[.,]\\d+)?)(?:\\/\\d{1,3}(?:[.,]\\d+)?)?";
  const AX = "[LBHTlbht]?";
  const SEP = "\\s*[x×X]\\s*";
  const RE = new RegExp(AX + "\\s*" + NUM + "\\s*" + AX + SEP + AX + "\\s*" + NUM + "\\s*" + AX + SEP + AX + "\\s*" + NUM + "\\s*" + AX + "\\s*cm", "g");
  const TOK = /(ø\s?)?(\d{1,4}(?:[.,]\d+)?)\s?(cm|mm|kg|liter|l|w)\b/gi;
  const tal = function (s) { return parseFloat(String(s).replace(",", ".")); };
  const ren = function (t) { return String(t || "").replace(/<[^>]+>/g, " ").replace(/&nbsp;/g, " "); };
  const trippler = function (text) {
    const ut = [];
    for (const m of ren(text).matchAll(RE)) ut.push([tal(m[1]), tal(m[2]), tal(m[3])]);
    return ut;
  };
  const tokens = function (text) {
    const s = new Set();
    for (const m of ren(text).matchAll(TOK)) {
      let enh = m[3].toLowerCase();
      if (enh === "liter") enh = "l";
      s.add((m[1] ? "ø" : "") + tal(m[2]) + enh);
    }
    return s;
  };
  const SJALVTEST = [
    ["60 x 30 x 90 cm", [60, 30, 90]], ["60 × 30 × 90 cm", [60, 30, 90]],
    ["60L x 30B x 90H cm", [60, 30, 90]], ["L60 x B30 x H90 cm", [60, 30, 90]],
    ["60,5 x 30 x 90 cm", [60.5, 30, 90]], ["60 x 30 x 90cm", [60, 30, 90]],
    ["60B x 30T x 35,2Hcm", [60, 30, 35.2]], ["242B x 87/156T x 87H cm", [242, 87, 87]],
    ["Maße: 150L x 50B x 30H cm (L x B x H)", [150, 50, 30]]
  ];
  let sjalvtestOk = 0;
  for (const [s, v] of SJALVTEST) {
    const t = trippler(s)[0];
    if (t && t[0] === v[0] && t[1] === v[1] && t[2] === v[2]) sjalvtestOk++;
  }
  const alla = [];
  let cursor = null, sidor = 0, utanText = 0;
  while (sidor < 120) {
    const paging = cursor ? { limit: 100, cursor: cursor } : { limit: 100 };
    const r = await wix.request({ method: "POST", url: "/stores/v3/products/search", body: { search: { cursorPaging: paging }, fields: ["PLAIN_DESCRIPTION"] } });
    const d = r.data || r;
    sidor++;
    for (const p of d.products || []) {
      if (typeof p.plainDescription !== "string") utanText++;
      const allt = String(p.name || "") + " " + String(p.plainDescription || "");
      const t = trippler(allt);
      alla.push({ id: p._id || p.id, n: String(p.name || ""), v: p.visible === true,
        pris: p.actualPriceRange && p.actualPriceRange.minValue ? Number(p.actualPriceRange.minValue.amount) : null,
        t: t, ts: t.map(function (x) { return x.slice().sort(function (a, b) { return a - b; }); }), k: tokens(allt) });
    }
    cursor = d.pagingMetadata && d.pagingMetadata.cursors && d.pagingMetadata.cursors.next;
    if (!cursor) break;
  }
  const kand = alla.filter(function (p) { return !p.v; });
  const pub = alla.filter(function (p) { return p.v; });
  const pubById = new Map();
  for (const p of pub) pubById.set(p.id, p);
  const idxPub = new Map();
  for (const p of pub) for (const x of p.ts) {
    const key = Math.round(x[0]);
    if (!idxPub.has(key)) idxPub.set(key, []);
    idxPub.get(key).push({ id: p.id, x: x });
  }
  const nar = function (xs, ys) {
    return Math.abs(xs[0] - ys[0]) <= 1 && Math.abs(xs[1] - ys[1]) <= 1 && Math.abs(xs[2] - ys[2]) <= 2;
  };
  const exakt = function (xs, ys) {
    return Math.abs(xs[0] - ys[0]) < 0.06 && Math.abs(xs[1] - ys[1]) < 0.06 && Math.abs(xs[2] - ys[2]) < 0.06;
  };
  const rader = [];
  for (const k of kand) {
    const kandid = new Set();
    for (const xs of k.ts) {
      const bas = Math.round(xs[0]);
      for (let d = -2; d <= 2; d++) {
        const lst = idxPub.get(bas + d);
        if (!lst) continue;
        for (const e of lst) if (nar(xs, e.x)) kandid.add(e.id);
      }
    }
    if (k.k.size >= 3) {
      for (const o of pub) {
        if (kandid.has(o.id)) continue;
        let delade = 0;
        for (const x of k.k) if (o.k.has(x)) delade++;
        if (delade >= 3 && delade / Math.max(1, Math.min(k.k.size, o.k.size)) >= 0.5) kandid.add(o.id);
      }
    }
    const lista = [];
    for (const pid of kandid) {
      const o = pubById.get(pid);
      let ex = 0, nr = 0;
      for (const xs of k.ts) {
        let e1 = false, n1 = false;
        for (const ys of o.ts) {
          if (exakt(xs, ys)) { e1 = true; n1 = true; break; }
          if (nar(xs, ys)) n1 = true;
        }
        if (e1) ex++;
        if (n1) nr++;
      }
      let sh = 0;
      for (const x of k.k) if (o.k.has(x)) sh++;
      lista.push({ id: String(pid).slice(0, 8), ex: ex, nr: nr, sh: sh, sc: 100 * ex + 20 * nr + sh });
    }
    lista.sort(function (a, b) { return b.sc - a.sc; });
    const best = lista[0];
    if (!best) continue;
    if (best.ex >= 1 || best.nr >= 2 || best.sh >= 4) {
      rader.push(String(k.id).slice(0, 8) + " " + k.ts.length + "/" + k.k.size + " " + lista.slice(0, 3).map(function (e) { return e.id + ":" + e.ex + "/" + e.nr + "/" + e.sh; }).join(" "));
    }
  }
  return { sjalvtest: sjalvtestOk + "/" + SJALVTEST.length, publicerade: pub.length, dolda: kand.length, starka: rader.length, rader: rader };
}
