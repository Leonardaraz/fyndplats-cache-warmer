async function () {
  // Genererad av runda N47:s bygg-steg.py ur ids.tsv + kategori.tsv — skriv den aldrig för hand.
  const SUMMA = function (s) {
    let h = 0;
    for (const c of s) h = (h * 31 + (c.codePointAt(0) & 0xFFFF)) % 1000000007;
    return h;
  };
  const PLAN = [
    {"kort": "ccae0705", "pid": "ccae0705-a08d-41de-ae5b-0a48c32f3cc2", "kat": ["Hem & Inredning", "Badrum & Hemtextil"]},
    {"kort": "f787a854", "pid": "f787a854-c96d-458c-9640-e3d33c5b5c54", "kat": ["Hem & Inredning", "Dekoration & Prydnad"]},
    {"kort": "f6e74878", "pid": "f6e74878-d96a-4bdd-af71-8cc870658fa4", "kat": ["Hem & Inredning"]},
    {"kort": "0d42d53f", "pid": "0d42d53f-7470-4f92-a41c-14543893ce24", "kat": ["Hem & Inredning", "Dekoration & Prydnad"]},
    {"kort": "114d37e5", "pid": "114d37e5-692b-47eb-919c-63fc4b15032b", "kat": ["Hem & Inredning", "Kalas & Fest"]},
    {"kort": "760dd23c", "pid": "760dd23c-fe45-41f5-9e11-fce3c51172b4", "kat": ["Hem & Inredning", "Verktyg & Hemmafix"]},
    {"kort": "b8002629", "pid": "b8002629-89d6-4409-b429-ad6b612d734c", "kat": ["Hem & Inredning", "Verktyg & Hemmafix"]},
    {"kort": "26ec5761", "pid": "26ec5761-9d0c-4c8a-ac99-2a7aae5cb206", "kat": ["Barn & Familj", "Baby & Småbarn", "Leksaker & Spel"]},
    {"kort": "3b3705f5", "pid": "3b3705f5-1faa-40c0-a089-86313c8422a8", "kat": ["Hem & Inredning", "Förvaring & Organisering"]},
    {"kort": "934297b1", "pid": "934297b1-51c5-48d6-b570-8b1ab4dae1dd", "kat": ["Husdjur", "Burar, Kläder & Tillbehör"]},
    {"kort": "a62db5fd", "pid": "a62db5fd-b7b0-4b98-9cb1-7675949e2958", "kat": ["Hem & Inredning", "Dekoration & Prydnad", "Trädgård & Utemöbler", "Trädgårdsdekor & Belysning"]},
    {"kort": "b51b6e6c", "pid": "b51b6e6c-c86d-4de4-ad1e-9c795aa4d0d7", "kat": ["Hem & Inredning", "Dekoration & Prydnad"]},
    {"kort": "b94fab48", "pid": "b94fab48-8509-42a9-9590-fff84a19172f", "kat": ["Hem & Inredning", "Badrum & Hemtextil", "Förvaring & Organisering"]},
    {"kort": "f2aa99d9", "pid": "f2aa99d9-3c12-4c3f-ab09-ffac3d4ed5f9", "kat": ["Hem & Inredning", "Kalas & Fest"]},
    {"kort": "0db7e560", "pid": "0db7e560-2f60-416b-8bd2-84b09838f798", "kat": ["Husdjur", "Burar, Kläder & Tillbehör"]},
  ];
  const FACIT = { summa: 333108527, tecken: 1314 };

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
