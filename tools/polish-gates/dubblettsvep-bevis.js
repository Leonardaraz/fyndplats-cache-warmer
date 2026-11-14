async function () {
  // dubblettsvep-bevis.js (2026-10-15): måtttrippel och delade måttsymboler per dolt utkast mot alla PUBLICERADE sidor, med
  // BEVISSTYRKA per träff: ex = antal utkastetrippler som är exakt lika, nr = antal som är ±1/±1/±2, sh = delade måttsymboler.
  // Rader skrivs bara för utkast vars bästa träff har ex >= 1, nr >= 2 eller sh >= 4. Utkast utan rad har ingen stark måttträff.
  // Format: "<id8> <antal trippler>/<antal måttsymboler> <publicerad id8>:<ex>/<nr>/<sh> ..." (tre bästa träffarna).
  // Kör via ExecuteWixAPI (en körning, ~60 s). Svaret kapas vid 100 000 tecken, så filtrera i koden om det blir större.
  //
  // ☠️ DELAR (2026-11-14). Katalogen har över 18 000 produkter, och ett anrop får ta 60 s: det hinner bara ~48 sidor om 100 med
  // PLAIN_DESCRIPTION. Förut stannade svepet tyst vid 120 sidor (12 000 produkter), och de nyaste utkasten ligger sist i standardordningen,
  // så nattens utkast fanns inte med i första skärmen och svaret såg ändå klart ut. Nu rapporteras `klart`, `nasta` och `varning`, och
  // svepet går i delar:
  //   1. Sätt UTKAST_IDN till de HELA Wix-id:n på utkasten som ska kontrolleras (högst 100). Varje del läser dem själv, i ett anrop.
  //   2. Kör med START = null. Svaret har `nasta` (markör) och `klart`. Kör om med START = `nasta` tills `klart` är true.
  //   3. Varje del jämför utkasten mot de publicerade sidorna i just den delen. Resultatet är unionen av `rader` över delarna
  //      (samma utkast kan stå i flera delar med olika träffar; ta den starkaste).
  // Med tom UTKAST_IDN är beteendet som förut (alla dolda sidor som ligger i delen jämförs), men `klart` och `varning` säger om
  // svepet blev avkapat.
  const UTKAST_IDN = [];
  const START = null;
  const MAXSIDOR = 48;
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
  let cursor = START, sidor = 0, utanText = 0;
  const radAv = function (p) {
    if (typeof p.plainDescription !== "string") utanText++;
    const allt = String(p.name || "") + " " + String(p.plainDescription || "");
    const t = trippler(allt);
    return { id: p._id || p.id, n: String(p.name || ""), v: p.visible === true,
      pris: p.actualPriceRange && p.actualPriceRange.minValue ? Number(p.actualPriceRange.minValue.amount) : null,
      t: t, ts: t.map(function (x) { return x.slice().sort(function (a, b) { return a - b; }); }), k: tokens(allt) };
  };
  // De utkast som ska kontrolleras läses för sig, så att varje del har dem oavsett var de ligger i katalogen.
  const valda = [];
  for (let i = 0; i < UTKAST_IDN.length; i += 100) {
    const r0 = await wix.request({ method: "POST", url: "/stores/v3/products/search", body: { search: { filter: { id: { $in: UTKAST_IDN.slice(i, i + 100) } }, cursorPaging: { limit: 100 } }, fields: ["PLAIN_DESCRIPTION"] } });
    for (const p of (r0.data || r0).products || []) valda.push(radAv(p));
  }
  const utkastLasta = valda.length;
  const harUtkast = UTKAST_IDN.length > 0;
  while (sidor < MAXSIDOR) {
    const paging = cursor ? { limit: 100, cursor: cursor } : { limit: 100 };
    const r = await wix.request({ method: "POST", url: "/stores/v3/products/search", body: { search: { cursorPaging: paging }, fields: ["PLAIN_DESCRIPTION"] } });
    const d = r.data || r;
    sidor++;
    for (const p of d.products || []) alla.push(radAv(p));
    cursor = d.pagingMetadata && d.pagingMetadata.cursors && d.pagingMetadata.cursors.next;
    if (!cursor) break;
  }
  const klart = !cursor;
  const kand = harUtkast ? valda : alla.filter(function (p) { return !p.v; });
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
    kandid.delete(k.id); // en sida som anges med id men redan är publicerad ska inte träffa sig själv
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
  return {
    sjalvtest: sjalvtestOk + "/" + SJALVTEST.length,
    publicerade: pub.length,
    dolda: kand.length,
    utkastBegarda: UTKAST_IDN.length,
    utkastLasta: utkastLasta,
    sidor: sidor,
    nasta: cursor || null,
    klart: klart,
    varning: klart ? null : "SVEPET ÄR INTE KLART: " + sidor + " sidor lästa och fler finns. Kör om med START = nasta och slå ihop raderna (UTKAST_IDN = de hela id:n på utkasten).",
    starka: rader.length,
    rader: rader
  };
}
