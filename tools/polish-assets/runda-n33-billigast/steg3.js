async function () {
  // Genererad av runda N33:s bygg-steg.py ur ids.tsv + kategori.tsv — skriv den aldrig för hand.
  const SUMMA = function (s) {
    let h = 0;
    for (const c of s) h = (h * 31 + (c.codePointAt(0) & 0xFFFF)) % 1000000007;
    return h;
  };
  const PLAN = [
    {"kort": "82000c6b", "pid": "82000c6b-7a34-4485-a954-dfc8d37336ba", "kat": ["Trädgård & Utemöbler", "Utelek & Spel"]},
    {"kort": "2f251ce3", "pid": "2f251ce3-b737-4b27-9394-cc27325b6519", "kat": ["Hem & Inredning"]},
    {"kort": "5c566983", "pid": "5c566983-8079-47a8-9406-0033f451585f", "kat": ["Hem & Inredning"]},
    {"kort": "07565140", "pid": "07565140-2873-4c43-9d43-c30f8d21d37b", "kat": ["Hem & Inredning", "Förvaring & Organisering"]},
    {"kort": "30f2151f", "pid": "30f2151f-8142-441b-97db-71236fce027b", "kat": ["Kök & Husgeråd", "Köksmaskiner & Apparater"]},
    {"kort": "dbedaf4c", "pid": "dbedaf4c-492b-4221-9259-445f305a8a83", "kat": ["Hem & Inredning", "Förvaring & Organisering"]},
    {"kort": "b2b731c7", "pid": "b2b731c7-fb5b-4c47-8d92-a60ed10d0e77", "kat": ["Skönhet & Hälsa", "Massage & Återhämtning"]},
    {"kort": "b3efdd39", "pid": "b3efdd39-70f5-4ad0-bedd-98ab8f4608f0", "kat": ["Hem & Inredning"]},
  ];
  const FACIT = { summa: 119486795, tecken: 621 };

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
        // Attribution på radens EGET id först; originalIndex (saknas när det är 0 i proto3) bara som reserv.
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
