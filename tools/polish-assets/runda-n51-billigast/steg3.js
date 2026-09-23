async function () {
  // Genererad av runda N51:s bygg-steg.py ur ids.tsv + kategori.tsv — skriv den aldrig för hand.
  const SUMMA = function (s) {
    let h = 0;
    for (const c of s) h = (h * 31 + (c.codePointAt(0) & 0xFFFF)) % 1000000007;
    return h;
  };
  const PLAN = [
    {"kort": "279635e9", "pid": "279635e9-ff6b-4092-a4ee-d597b3dbab25", "kat": ["Hem & Inredning", "Kalas & Fest"]},
    {"kort": "3068a60b", "pid": "3068a60b-8cce-4dab-9ee0-56d350b473da", "kat": ["Hem & Inredning", "Förvaring & Organisering"]},
    {"kort": "3ae559f2", "pid": "3ae559f2-3ed2-4021-be74-738d9825102e", "kat": ["Hem & Inredning", "Badrum & Hemtextil", "Förvaring & Organisering"]},
    {"kort": "5646de67", "pid": "5646de67-0a1e-4662-a591-25a3f070d799", "kat": ["Sport & Fritid", "Träning & Gym"]},
    {"kort": "5a65a0ea", "pid": "5a65a0ea-b38d-4592-856b-a9249847e40f", "kat": ["Hem & Inredning", "Förvaring & Organisering"]},
    {"kort": "73457d36", "pid": "73457d36-b7f7-45ac-892a-c7342ee37f0d", "kat": ["Hem & Inredning", "Trädgård & Utemöbler", "Växthus & Odling"]},
    {"kort": "7d09edd9", "pid": "7d09edd9-3cc2-45b2-98d9-76de8502f52c", "kat": ["Hem & Inredning", "Förvaring & Organisering"]},
    {"kort": "90c066c0", "pid": "90c066c0-5d13-41a2-a3a7-8c847dc58ac2", "kat": ["Hem & Inredning"]},
    {"kort": "9b3b4255", "pid": "9b3b4255-3ea1-43f4-ad50-3e77ede70f1e", "kat": ["Hem & Inredning"]},
    {"kort": "aab0a1e5", "pid": "aab0a1e5-8edb-43a8-acf4-4c04052d3183", "kat": ["Hem & Inredning", "Dekoration & Prydnad", "Trädgård & Utemöbler", "Trädgårdsdekor & Belysning"]},
    {"kort": "c7424c37", "pid": "c7424c37-16c3-40a1-a6c9-11d33c8aa595", "kat": ["Barn & Familj", "Leksaker & Spel"]},
    {"kort": "ce77f5c4", "pid": "ce77f5c4-7d85-4d24-80c4-bd670362ccc7", "kat": ["Hem & Inredning", "Förvaring & Organisering"]},
    {"kort": "d227861d", "pid": "d227861d-bb87-4fb9-a19d-73dc40154ac8", "kat": ["Trädgård & Utemöbler"]},
    {"kort": "db607b53", "pid": "db607b53-8780-4cfa-8795-3b03f7299edc", "kat": ["Barn & Familj", "Baby & Småbarn", "Leksaker & Spel"]},
    {"kort": "7a70db2c", "pid": "7a70db2c-a5c4-4a80-9c23-d3f36b95bfa6", "kat": ["Sport & Fritid"]},
  ];
  const FACIT = { summa: 197484960, tecken: 1285 };

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
