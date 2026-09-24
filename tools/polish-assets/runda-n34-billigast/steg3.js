async function () {
  // Genererad av runda N34:s bygg-steg.py ur ids.tsv + kategori.tsv — skriv den aldrig för hand.
  const SUMMA = function (s) {
    let h = 0;
    for (const c of s) h = (h * 31 + (c.codePointAt(0) & 0xFFFF)) % 1000000007;
    return h;
  };
  const PLAN = [
    {"kort": "5022e9e5", "pid": "5022e9e5-b5af-427a-8d83-3a934aafe654", "kat": ["Hem & Inredning", "Badrum & Hemtextil"]},
    {"kort": "32140f01", "pid": "32140f01-3110-4126-854f-3bd210b880bf", "kat": ["Hem & Inredning", "Hushållsapparater", "Dekoration & Prydnad"]},
    {"kort": "4f9ef409", "pid": "4f9ef409-95a2-427a-9095-eff4c2f0d99a", "kat": ["Hem & Inredning", "Förvaring & Organisering"]},
    {"kort": "8085d0b6", "pid": "8085d0b6-e58a-41c2-b08c-efb2c9d5c36f", "kat": ["Hem & Inredning", "Förvaring & Organisering"]},
    {"kort": "bd2c7da3", "pid": "bd2c7da3-f4ab-4007-93ac-1c6e530b7793", "kat": ["Förvaring & Organisering"]},
    {"kort": "6b91821a", "pid": "6b91821a-de53-4f1e-ba56-d9172d5d3cd9", "kat": ["Hem & Inredning"]},
    {"kort": "3739257b", "pid": "3739257b-c326-443c-95c3-1ff46dc7fbb2", "kat": ["Hem & Inredning"]},
    {"kort": "3bf5bd08", "pid": "3bf5bd08-837b-4c80-863a-21101c27b783", "kat": ["Hem & Inredning"]},
  ];
  const FACIT = { summa: 261203286, tecken: 622 };

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
