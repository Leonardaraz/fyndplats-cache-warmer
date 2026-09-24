async function () {
  // Genererad av runda N44:s bygg-steg.py ur ids.tsv + kategori.tsv — skriv den aldrig för hand.
  const SUMMA = function (s) {
    let h = 0;
    for (const c of s) h = (h * 31 + (c.codePointAt(0) & 0xFFFF)) % 1000000007;
    return h;
  };
  const PLAN = [
    {"kort": "cf92c3bd", "pid": "cf92c3bd-a793-4728-884f-c65c7db5590a", "kat": ["Hem & Inredning", "Dekoration & Prydnad"]},
    {"kort": "e36dab73", "pid": "e36dab73-19e8-4136-9dcf-7b4df9d7cc0e", "kat": ["Hem & Inredning", "Dekoration & Prydnad"]},
    {"kort": "a7e88a1b", "pid": "a7e88a1b-c751-4d26-945a-71be8dd7d7f5", "kat": ["Skönhet & Hälsa", "Kropp & Välbefinnande"]},
    {"kort": "b5b3b852", "pid": "b5b3b852-94da-4b85-a08d-1b122fdf8227", "kat": ["Sport & Fritid"]},
    {"kort": "e90dcc5a", "pid": "e90dcc5a-2d4d-4389-b455-979da533367f", "kat": ["Barn & Familj", "Leksaker & Spel"]},
    {"kort": "0dfaa38b", "pid": "0dfaa38b-6792-4598-8dca-c6c71d1578b7", "kat": ["Hem & Inredning", "Badrum & Hemtextil"]},
    {"kort": "10cd6afb", "pid": "10cd6afb-34b0-40dc-9c9b-4f7dc510fa58", "kat": ["Hem & Inredning", "Förvaring & Organisering"]},
    {"kort": "00d6f785", "pid": "00d6f785-c15c-4315-afaa-269c53b42fd7", "kat": ["Hem & Inredning", "Belysning", "Dekoration & Prydnad"]},
    {"kort": "0feec456", "pid": "0feec456-5102-4095-990c-b8e2da80727c", "kat": ["Husdjur", "Burar, Kläder & Tillbehör"]},
    {"kort": "1476f00c", "pid": "1476f00c-8e41-4fef-af8f-ea10972f1002", "kat": ["Barn & Familj", "Hem & Inredning", "Förvaring & Organisering"]},
  ];
  const FACIT = { summa: 384168619, tecken: 850 };

  // ☠️ SPÄRREN I SAMMA ANROP SOM SKRIVNINGEN — avbryter HELA batchen.
  const nyckel = PLAN.map(function (p) { return p.kort + "|" + p.pid + "|" + p.kat.join(" + "); }).join("\n");
  if (SUMMA(nyckel) !== FACIT.summa || nyckel.length !== FACIT.tecken) {
    return { AVBRUTET: "transkriberingsfel — ingenting skrivet", fick: SUMMA(nyckel), tecken: nyckel.length };
  }

  // Kategori-id slås upp på NAMN i en FÄRSK fråga, i samma anrop.
  const qbody = {
    query: {
      cursorPaging: {
        limit: 200
      }
    },
    treeReference: {
      appNamespace: "@wix/stores"
    }
  };
  const q = await wix.request({ method: "POST", url: "https://www.wixapis.com/categories/v1/categories/query", body: qbody });
  const namnTillId = {};
  let antal = 0;
  for (const c of ((q.data || q).categories || [])) { namnTillId[c.name] = c.id; antal++; }
  const saknas = [];
  for (const p of PLAN) for (const n of p.kat) if (!namnTillId[n]) saknas.push(p.kort + ": " + n);
  if (saknas.length) return { AVBRUTET: "okänt kategorinamn — ingenting skrivet", saknas: saknas, antalKategorier: antal };

  const perKat = {};
  for (const p of PLAN) for (const n of p.kat) (perKat[n] = perKat[n] || []).push(p);
  const ut = [];
  for (const n of Object.keys(perKat)) {
    const items = perKat[n].map(function (p) { return { catalogItemId: p.pid, appId: "215238eb-22a5-4c36-9e7b-e7c08025e04e" }; });
    const kropp = {
      items: items,
      treeReference: {
        appNamespace: "@wix/stores"
      }
    };
    try {
      const r = await wix.request({ method: "POST", url: "https://www.wixapis.com/categories/v1/bulk/categories/" + namnTillId[n] + "/add-items", body: kropp });
      const d = r.data || r;
      const res = d.results || [];
      for (let i = 0; i < perKat[n].length; i++) {
        const hit = res.find(function (x) { return (((x.itemMetadata || {}).item) || {}).catalogItemId === perKat[n][i].pid; }) || res.find(function (x) { return ((x.itemMetadata || {}).originalIndex || 0) === i; });
        const m = (hit || {}).itemMetadata || null;
        ut.push({ kort: perKat[n][i].kort, kat: n, success: !!(m && m.success), id: m && m.item ? m.item.catalogItemId === perKat[n][i].pid : null, fel: m && m.error ? JSON.stringify(m.error).slice(0, 200) : null });
      }
      ut.push({ kat: n, bulk: d.bulkActionMetadata || null });
    } catch (e) {
      ut.push({ kat: n, AVBRUTET: String(e && e.message || e).slice(0, 300) });
    }
  }
  const rader = ut.filter(function (x) { return x.kort; });
  const ok = rader.filter(function (x) { return x.success && x.id === true; }).length;
  return { rader: ut, antalKategorier: antal, SAMMANFATTNING: ok + " av " + rader.length + " rader success" };
}
