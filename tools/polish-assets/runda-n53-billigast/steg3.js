async function () {
  // Genererad av runda N53:s bygg-steg.py ur ids.tsv + kategori.tsv — skriv den aldrig för hand.
  const SUMMA = function (s) {
    let h = 0;
    for (const c of s) h = (h * 31 + (c.codePointAt(0) & 0xFFFF)) % 1000000007;
    return h;
  };
  const PLAN = [
    {"kort": "1e139971", "pid": "1e139971-9d92-468b-abc5-1e47e087aaae", "kat": ["Barn & Familj", "Baby & Småbarn", "Leksaker & Spel"]},
    {"kort": "3dc622f9", "pid": "3dc622f9-665e-4e12-a55b-2e69ad330b8a", "kat": ["Hem & Inredning", "Förvaring & Organisering"]},
    {"kort": "4d7268c1", "pid": "4d7268c1-4c06-4dcd-8c71-82666b6d1d47", "kat": ["Hem & Inredning"]},
    {"kort": "560edb9f", "pid": "560edb9f-5d79-4bc9-9f41-fa2f95579378", "kat": ["Hem & Inredning", "Dekoration & Prydnad"]},
    {"kort": "aa7637fb", "pid": "aa7637fb-e145-46bc-9c9a-c0b278a68434", "kat": ["Hem & Inredning", "Förvaring & Organisering"]},
    {"kort": "bd664764", "pid": "bd664764-2bb5-48b2-bd9d-1002f54757f2", "kat": ["Hem & Inredning", "Förvaring & Organisering"]},
    {"kort": "eca2fa1e", "pid": "eca2fa1e-8c64-43e5-b561-c367c4dc15b2", "kat": ["Hem & Inredning"]},
    {"kort": "1ae506e3", "pid": "1ae506e3-a1e6-4d5c-9e95-39762664e253", "kat": ["Barn & Familj", "Hem & Inredning", "Förvaring & Organisering"]},
    {"kort": "85b1a737", "pid": "85b1a737-f5b2-4a36-afc4-4ebd1325483e", "kat": ["Barn & Familj", "Leksaker & Spel"]},
    {"kort": "a778baf1", "pid": "a778baf1-f987-40f3-8069-a35506c266bc", "kat": ["Kök & Husgeråd", "Hem & Inredning"]},
    {"kort": "b398fe7b", "pid": "b398fe7b-ff80-4911-a267-61ae785d1ce1", "kat": ["Sport & Fritid", "Träning & Gym"]},
    {"kort": "db1f6697", "pid": "db1f6697-5cc7-4431-866e-7f7ae0c28a01", "kat": ["Hem & Inredning"]},
    {"kort": "12704344", "pid": "12704344-038f-4a8e-8a3d-03d75c84693d", "kat": ["Hem & Inredning", "Dekoration & Prydnad"]},
    {"kort": "2af51f93", "pid": "2af51f93-6175-437a-acf5-9701c3bd1eae", "kat": ["Barn & Familj", "Baby & Småbarn", "Leksaker & Spel"]},
    {"kort": "d8af896a", "pid": "d8af896a-dd56-4a46-808a-c72f5f8187bb", "kat": ["Hem & Inredning", "Verktyg & Hemmafix"]},
  ];
  const FACIT = { summa: 382470042, tecken: 1234 };

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
