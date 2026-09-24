async function () {
  // Genererad av runda N40:s bygg-steg.py ur ids.tsv + kategori.tsv — skriv den aldrig för hand.
  const SUMMA = function (s) {
    let h = 0;
    for (const c of s) h = (h * 31 + (c.codePointAt(0) & 0xFFFF)) % 1000000007;
    return h;
  };
  const PLAN = [
    {"kort": "27ff1a8e", "pid": "27ff1a8e-630e-444e-81c5-761f18c478bb", "kat": ["Hem & Inredning", "Dekoration & Prydnad"]},
    {"kort": "c2c6a332", "pid": "c2c6a332-0cb4-49b7-83f9-557ed594ea59", "kat": ["Hem & Inredning", "Dekoration & Prydnad"]},
    {"kort": "e2cfbd07", "pid": "e2cfbd07-845c-47b8-aec0-34357681b8df", "kat": ["Kök & Husgeråd", "Köksredskap & Tillbehör", "Hem & Inredning", "Förvaring & Organisering"]},
    {"kort": "a7d072fc", "pid": "a7d072fc-6409-4f67-9be3-49c94bce9787", "kat": ["Hem & Inredning", "Förvaring & Organisering"]},
    {"kort": "4a4721fa", "pid": "4a4721fa-8f3e-41dc-a544-c9da0e992854", "kat": ["Barn & Familj", "Leksaker & Spel", "Baby & Småbarn"]},
    {"kort": "8ded5e38", "pid": "8ded5e38-585e-48ed-adcc-0f46393004c1", "kat": ["Barn & Familj", "Leksaker & Spel", "Baby & Småbarn"]},
    {"kort": "5cdc868a", "pid": "5cdc868a-a511-4911-af69-ed8a725ccf47", "kat": ["Hem & Inredning", "Förvaring & Organisering"]},
    {"kort": "b0627017", "pid": "b0627017-e6af-45f5-b890-e11c071eabda", "kat": ["Hem & Inredning", "Förvaring & Organisering"]},
    {"kort": "9c456097", "pid": "9c456097-e102-465e-bdc0-f3c67c8c850a", "kat": ["Hem & Inredning", "Förvaring & Organisering"]},
    {"kort": "0c07eb82", "pid": "0c07eb82-7862-452a-8ae4-45486d2f48e6", "kat": ["Hem & Inredning", "Förvaring & Organisering"]},
  ];
  const FACIT = { summa: 900507581, tecken: 936 };

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
