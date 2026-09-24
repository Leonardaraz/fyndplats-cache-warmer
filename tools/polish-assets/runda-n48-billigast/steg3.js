async function () {
  // Genererad av runda N48:s bygg-steg.py ur ids.tsv + kategori.tsv — skriv den aldrig för hand.
  const SUMMA = function (s) {
    let h = 0;
    for (const c of s) h = (h * 31 + (c.codePointAt(0) & 0xFFFF)) % 1000000007;
    return h;
  };
  const PLAN = [
    {"kort": "127ec9c8", "pid": "127ec9c8-2bf5-4512-8fa6-ba516bbeb901", "kat": ["Hem & Inredning", "Kalas & Fest"]},
    {"kort": "876e7e89", "pid": "876e7e89-6330-4427-9603-95ad2445de63", "kat": ["Hem & Inredning", "Förvaring & Organisering"]},
    {"kort": "8cf7b1bb", "pid": "8cf7b1bb-2517-4a6a-96b2-8dcdc7700962", "kat": ["Husdjur", "Lek & Tillbehör för husdjur"]},
    {"kort": "a08404ee", "pid": "a08404ee-bc2c-417c-89cc-76dd344db527", "kat": ["Trädgård & Utemöbler", "Utemöbler"]},
    {"kort": "c031a4bc", "pid": "c031a4bc-ebd7-4e4d-b2b9-71fccfd915cd", "kat": ["Hem & Inredning", "Förvaring & Organisering"]},
    {"kort": "c4c404c5", "pid": "c4c404c5-5b01-4d37-8a11-cc93d22df61b", "kat": ["Hem & Inredning", "Kalas & Fest"]},
    {"kort": "e03a7e2e", "pid": "e03a7e2e-3d5c-40e9-9f5b-f95a4b4fee32", "kat": ["Hem & Inredning", "Trädgård & Utemöbler", "Växthus & Odling"]},
    {"kort": "fa8d498b", "pid": "fa8d498b-2e28-4eb7-8ed5-7922e7ddb718", "kat": ["Hem & Inredning", "Trädgård & Utemöbler", "Växthus & Odling"]},
    {"kort": "fca0d000", "pid": "fca0d000-c3e1-407a-a423-8df1cf087792", "kat": ["Hem & Inredning", "Förvaring & Organisering"]},
    {"kort": "0a5d10dc", "pid": "0a5d10dc-df20-4515-9178-61fbe54a2dbd", "kat": ["Hem & Inredning", "Verktyg & Hemmafix"]},
    {"kort": "5a6001cf", "pid": "5a6001cf-943c-42a8-8338-f85469b73477", "kat": ["Barn & Familj", "Baby & Småbarn", "Leksaker & Spel"]},
    {"kort": "eefbc35f", "pid": "eefbc35f-0b9d-466d-b005-5aa820148fa8", "kat": ["Hem & Inredning", "Kalas & Fest"]},
    {"kort": "a6a16df2", "pid": "a6a16df2-4a9b-46c1-9b19-0b60b6d9bc20", "kat": ["Hem & Inredning"]},
    {"kort": "af9c163f", "pid": "af9c163f-12dc-4204-ae2e-1b52169dcd8c", "kat": ["Kök & Husgeråd"]},
    {"kort": "c311e18f", "pid": "c311e18f-9fce-48ce-b890-8a6169ded050", "kat": ["Trädgård & Utemöbler", "Trädgårdsskötsel & Bevattning"]},
  ];
  const FACIT = { summa: 129484851, tecken: 1268 };

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
