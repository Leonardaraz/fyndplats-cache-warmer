async function () {
  // Genererad av runda N42:s bygg-steg.py ur ids.tsv + kategori.tsv — skriv den aldrig för hand.
  const SUMMA = function (s) {
    let h = 0;
    for (const c of s) h = (h * 31 + (c.codePointAt(0) & 0xFFFF)) % 1000000007;
    return h;
  };
  const PLAN = [
    {"kort": "2cfd222e", "pid": "2cfd222e-ab50-4a1c-a020-b9f749a27a5b", "kat": ["Hem & Inredning", "Dekoration & Prydnad"]},
    {"kort": "3e2c7389", "pid": "3e2c7389-93ae-4f21-a556-f7186ff0cdb9", "kat": ["Hem & Inredning", "Förvaring & Organisering"]},
    {"kort": "5c5aedca", "pid": "5c5aedca-4952-4ead-b2eb-716d2be7d125", "kat": ["Hem & Inredning", "Dekoration & Prydnad"]},
    {"kort": "7f21945e", "pid": "7f21945e-3b7b-4700-a943-6558ebe7de08", "kat": ["Hem & Inredning", "Förvaring & Organisering"]},
    {"kort": "985ff6d3", "pid": "985ff6d3-41a8-4214-8b90-b990a2880bd8", "kat": ["Kök & Husgeråd", "Köksmaskiner & Apparater"]},
    {"kort": "988ac121", "pid": "988ac121-4920-4ec1-8c14-5e8f525bc8bb", "kat": ["Hem & Inredning"]},
    {"kort": "b138effc", "pid": "b138effc-0e30-4c25-9bea-36aae4b04545", "kat": ["Husdjur", "Pälsvård & Skötsel"]},
    {"kort": "cfb722e4", "pid": "cfb722e4-b588-4fd8-b609-56c5fd15d26e", "kat": ["Hem & Inredning", "Förvaring & Organisering", "Kök & Husgeråd"]},
    {"kort": "dcf149d1", "pid": "dcf149d1-bc0f-43f7-a8e1-82df588a3a78", "kat": ["Barn & Familj", "Baby & Småbarn"]},
    {"kort": "fd940665", "pid": "fd940665-60f6-472c-922d-11d09cac17bb", "kat": ["Hem & Inredning", "Förvaring & Organisering"]},
  ];
  const FACIT = { summa: 633353376, tecken: 844 };

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
