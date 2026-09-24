async function () {
  // Genererad av runda N41:s bygg-steg.py ur ids.tsv + kategori.tsv — skriv den aldrig för hand.
  const SUMMA = function (s) {
    let h = 0;
    for (const c of s) h = (h * 31 + (c.codePointAt(0) & 0xFFFF)) % 1000000007;
    return h;
  };
  const PLAN = [
    {"kort": "e3256412", "pid": "e3256412-1ee1-44cb-93aa-c8125eda1e31", "kat": ["Sport & Fritid", "Bil & Cykel"]},
    {"kort": "3d3f90d3", "pid": "3d3f90d3-4bb3-49a4-8ab2-9e504e2afc02", "kat": ["Hem & Inredning", "Belysning", "Dekoration & Prydnad"]},
    {"kort": "6baeb38b", "pid": "6baeb38b-464a-4c56-b450-45efbf212fae", "kat": ["Hem & Inredning", "Förvaring & Organisering"]},
    {"kort": "8fc578fc", "pid": "8fc578fc-cd6e-4b42-bb5a-2af7af926727", "kat": ["Barn & Familj", "Baby & Småbarn", "Trädgård & Utemöbler", "Utelek & Spel"]},
    {"kort": "acc9ab97", "pid": "acc9ab97-9144-4524-8cea-976cf53a4957", "kat": ["Kök & Husgeråd", "Köksmaskiner & Apparater"]},
    {"kort": "42949f67", "pid": "42949f67-2136-49c9-b5cd-b7c74080d8aa", "kat": ["Hem & Inredning", "Kalas & Fest", "Trädgård & Utemöbler", "Trädgårdsdekor & Belysning"]},
    {"kort": "5e126c2f", "pid": "5e126c2f-23bd-49cd-a7de-b5a761b3973a", "kat": ["Hem & Inredning", "Kalas & Fest"]},
    {"kort": "050db4d8", "pid": "050db4d8-da66-4e13-b0bd-ef13c2abb3dd", "kat": ["Hem & Inredning", "Dekoration & Prydnad"]},
    {"kort": "1c92e587", "pid": "1c92e587-3c14-49af-bf37-1b3efe4431bf", "kat": ["Barn & Familj", "Leksaker & Spel", "Baby & Småbarn"]},
    {"kort": "1f887213", "pid": "1f887213-5574-4b53-9b7e-19d017afa754", "kat": ["Hem & Inredning", "Dekoration & Prydnad"]},
  ];
  const FACIT = { summa: 386497028, tecken: 935 };

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
