async function () {
  // Genererad av runda N35:s bygg-steg.py ur ids.tsv + kategori.tsv — skriv den aldrig för hand.
  const SUMMA = function (s) {
    let h = 0;
    for (const c of s) h = (h * 31 + (c.codePointAt(0) & 0xFFFF)) % 1000000007;
    return h;
  };
  const PLAN = [
    {"kort": "8a076c08", "pid": "8a076c08-9287-4f7e-8dab-ed9735d60209", "kat": ["Hem & Inredning"]},
    {"kort": "b28e1cbe", "pid": "b28e1cbe-fb7f-4866-abfd-5786f34bb596", "kat": ["Barn & Familj", "Hem & Inredning"]},
    {"kort": "1bc0c04e", "pid": "1bc0c04e-4e8d-4daa-9f38-be92490afb0b", "kat": ["Barn & Familj", "Leksaker & Spel"]},
    {"kort": "69513a61", "pid": "69513a61-9e15-429f-9a28-2d31d2a86a2b", "kat": ["Utemöbler"]},
    {"kort": "3847b7ba", "pid": "3847b7ba-85cc-4c3e-9257-4e159809064d", "kat": ["Hem & Inredning"]},
    {"kort": "965ba956", "pid": "965ba956-907e-4cf6-ae37-4bba05db730d", "kat": ["Hushållsapparater", "Dekoration & Prydnad"]},
    {"kort": "c4d8cb93", "pid": "c4d8cb93-732d-4ba5-9d37-77bd165e4a53", "kat": ["Hem & Inredning", "Förvaring & Organisering"]},
    {"kort": "093aedd2", "pid": "093aedd2-bd79-4bfa-8195-18ee97156187", "kat": ["Dekoration & Prydnad", "Trädgårdsdekor & Belysning"]},
  ];
  const FACIT = { summa: 181114540, tecken: 607 };

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
