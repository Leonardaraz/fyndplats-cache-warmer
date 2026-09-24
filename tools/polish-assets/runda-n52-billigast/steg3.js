async function () {
  // Genererad av runda N52:s bygg-steg.py ur ids.tsv + kategori.tsv — skriv den aldrig för hand.
  const SUMMA = function (s) {
    let h = 0;
    for (const c of s) h = (h * 31 + (c.codePointAt(0) & 0xFFFF)) % 1000000007;
    return h;
  };
  const PLAN = [
    {"kort": "80aac077", "pid": "80aac077-d7e4-4d2f-ace1-09d24eb9c284", "kat": ["Barn & Familj", "Baby & Småbarn", "Leksaker & Spel"]},
    {"kort": "ac160e8e", "pid": "ac160e8e-1e83-4b72-8847-1a73de6c72ae", "kat": ["Barn & Familj", "Leksaker & Spel"]},
    {"kort": "eb7d67a4", "pid": "eb7d67a4-8e1e-4539-b484-437ab0e46847", "kat": ["Hem & Inredning", "Dekoration & Prydnad", "Trädgård & Utemöbler", "Trädgårdsdekor & Belysning"]},
    {"kort": "a64af3a4", "pid": "a64af3a4-290c-4417-829d-96910ca5494d", "kat": ["Husdjur", "Burar, Kläder & Tillbehör"]},
    {"kort": "0b66ea13", "pid": "0b66ea13-010b-49b3-b126-587c85a11ecd", "kat": ["Hem & Inredning", "Badrum & Hemtextil", "Förvaring & Organisering"]},
    {"kort": "163cd19d", "pid": "163cd19d-d496-4dce-b587-adb01beefb62", "kat": ["Barn & Familj", "Leksaker & Spel"]},
    {"kort": "2487e6bb", "pid": "2487e6bb-4412-4524-86b6-5266b4ec1e48", "kat": ["Hem & Inredning", "Trädgård & Utemöbler", "Växthus & Odling"]},
    {"kort": "43d46471", "pid": "43d46471-c159-41d6-9c02-7c043b14c34c", "kat": ["Hem & Inredning", "Förvaring & Organisering"]},
    {"kort": "cb08e980", "pid": "cb08e980-5f24-43fd-a143-b98c61dadd29", "kat": ["Sport & Fritid", "Träning & Gym"]},
    {"kort": "5f833adb", "pid": "5f833adb-164d-4d79-803a-e9b9b0483927", "kat": ["Hem & Inredning", "Badrum & Hemtextil", "Förvaring & Organisering"]},
    {"kort": "b0f5b1a5", "pid": "b0f5b1a5-dd26-4c06-8566-446ba23712d0", "kat": ["Hem & Inredning", "Förvaring & Organisering"]},
    {"kort": "e95efc20", "pid": "e95efc20-1c1c-497c-90fc-aa003b932df8", "kat": ["Hem & Inredning"]},
    {"kort": "e4df6dc7", "pid": "e4df6dc7-91ab-40b7-bdff-3767c14c4a5e", "kat": ["Hem & Inredning", "Dekoration & Prydnad"]},
    {"kort": "3edd4198", "pid": "3edd4198-2b09-44e8-9596-f6cb372ac9ca", "kat": ["Hem & Inredning", "Verktyg & Hemmafix"]},
    {"kort": "855bae98", "pid": "855bae98-ef41-4c99-a326-2ebedd70bc72", "kat": ["Hem & Inredning", "Förvaring & Organisering"]},
  ];
  const FACIT = { summa: 767152802, tecken: 1367 };

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
