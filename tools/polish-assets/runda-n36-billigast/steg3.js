async function () {
  // Genererad av runda N36:s bygg-steg.py ur ids.tsv + kategori.tsv — skriv den aldrig för hand.
  const SUMMA = function (s) {
    let h = 0;
    for (const c of s) h = (h * 31 + (c.codePointAt(0) & 0xFFFF)) % 1000000007;
    return h;
  };
  const PLAN = [
    {"kort": "46c0fe07", "pid": "46c0fe07-2912-46ca-8fbe-10d87770ce22", "kat": ["Hem & Inredning"]},
    {"kort": "3bfee58b", "pid": "3bfee58b-2473-4149-9864-2c223e576565", "kat": ["Verktyg & Hemmafix"]},
    {"kort": "265b0f61", "pid": "265b0f61-93f9-4e78-b8e0-d93e994f44e2", "kat": ["Hem & Inredning"]},
    {"kort": "69ba5b8b", "pid": "69ba5b8b-b143-4904-a4cf-406762ad4e10", "kat": ["Barn & Familj", "Leksaker & Spel"]},
    {"kort": "2b27c2a4", "pid": "2b27c2a4-449b-4eb4-91f6-8a9a039ca605", "kat": ["Kök & Husgeråd", "Köksmaskiner & Apparater"]},
    {"kort": "37804a40", "pid": "37804a40-bc18-4d88-8d4a-83681440edd9", "kat": ["Hem & Inredning", "Förvaring & Organisering"]},
    {"kort": "6707c9dd", "pid": "6707c9dd-0970-4d6d-99ed-fdfe59c7761c", "kat": ["Förvaring & Organisering", "Hem & Inredning"]},
    {"kort": "676e567f", "pid": "676e567f-e41e-421d-9831-36c436f27ea2", "kat": ["Hem & Inredning", "Trädgård & Utemöbler"]},
  ];
  const FACIT = { summa: 519522326, tecken: 617 };

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
