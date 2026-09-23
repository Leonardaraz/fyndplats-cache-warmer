async function () {
  // Genererad av runda N50:s bygg-steg.py ur ids.tsv + kategori.tsv — skriv den aldrig för hand.
  const SUMMA = function (s) {
    let h = 0;
    for (const c of s) h = (h * 31 + (c.codePointAt(0) & 0xFFFF)) % 1000000007;
    return h;
  };
  const PLAN = [
    {"kort": "10fe3278", "pid": "10fe3278-cb72-4cbf-90ff-9038506050cc", "kat": ["Sport & Fritid"]},
    {"kort": "5fce6a95", "pid": "5fce6a95-9304-4bc0-b74a-38f2b89273ca", "kat": ["Hem & Inredning", "Förvaring & Organisering"]},
    {"kort": "cc5b0c14", "pid": "cc5b0c14-429c-4263-966a-0bced1ae857d", "kat": ["Hem & Inredning", "Kalas & Fest"]},
    {"kort": "e797e8a4", "pid": "e797e8a4-d87a-4782-8c70-28a6fbe7b21c", "kat": ["Hem & Inredning", "Badrum & Hemtextil", "Förvaring & Organisering"]},
    {"kort": "e947f7aa", "pid": "e947f7aa-0251-4a15-881e-25cd878cdab0", "kat": ["Kök & Husgeråd", "Köksmaskiner & Apparater"]},
    {"kort": "0598eff2", "pid": "0598eff2-7582-4152-9995-fd78563495c4", "kat": ["Hem & Inredning", "Badrum & Hemtextil", "Förvaring & Organisering"]},
    {"kort": "007c6422", "pid": "007c6422-b9af-4f68-98c9-73f194dca92b", "kat": ["Hem & Inredning"]},
    {"kort": "536e0244", "pid": "536e0244-a8d3-4212-b470-447a558780c6", "kat": ["Husdjur", "Burar, Kläder & Tillbehör"]},
    {"kort": "7fdf42e9", "pid": "7fdf42e9-40fb-4975-bb73-788c01da8ca5", "kat": ["Hem & Inredning"]},
    {"kort": "ad88f2b4", "pid": "ad88f2b4-e89b-42ab-8c86-72bcb28e3c9c", "kat": ["Hem & Inredning", "Förvaring & Organisering"]},
    {"kort": "e138b637", "pid": "e138b637-5b47-409d-bca3-7b78463b3578", "kat": ["Sport & Fritid", "Bil & Cykel"]},
    {"kort": "e7bbadb2", "pid": "e7bbadb2-1e3a-423b-8bd1-ecb63b494f6b", "kat": ["Hem & Inredning", "Förvaring & Organisering"]},
    {"kort": "17595feb", "pid": "17595feb-4289-4613-aefa-c70ab9e273ea", "kat": ["Sport & Fritid"]},
    {"kort": "261484e7", "pid": "261484e7-7efd-4384-99d5-7464b7e45647", "kat": ["Hem & Inredning"]},
    {"kort": "a6820dd0", "pid": "a6820dd0-0bf8-4dee-876d-dc6c62ea6bad", "kat": ["Hem & Inredning", "Kalas & Fest"]},
  ];
  const FACIT = { summa: 334264400, tecken: 1193 };

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
