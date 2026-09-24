async function () {
  // Genererad av runda N55:s bygg-steg.py ur ids.tsv + kategori.tsv — skriv den aldrig för hand.
  const SUMMA = function (s) {
    let h = 0;
    for (const c of s) h = (h * 31 + (c.codePointAt(0) & 0xFFFF)) % 1000000007;
    return h;
  };
  const PLAN = [
    {"kort": "07e3cb1d", "pid": "07e3cb1d-855d-4a77-8336-3bd687e24893", "kat": ["Hem & Inredning", "Dekoration & Prydnad", "Trädgård & Utemöbler", "Trädgårdsdekor & Belysning"]},
    {"kort": "16fe3c28", "pid": "16fe3c28-7409-49d8-88f6-e4bcd02d87d8", "kat": ["Hem & Inredning", "Förvaring & Organisering"]},
    {"kort": "494e0dab", "pid": "494e0dab-6481-4b44-a6c6-cd1b6c17f77f", "kat": ["Hem & Inredning", "Förvaring & Organisering"]},
    {"kort": "4bd41e91", "pid": "4bd41e91-e988-4c57-9fdf-5fb6909bd2cf", "kat": ["Hem & Inredning", "Verktyg & Hemmafix"]},
    {"kort": "4f0fa784", "pid": "4f0fa784-9661-47d4-9fc0-d4f303e59968", "kat": ["Hem & Inredning"]},
    {"kort": "4fb02f99", "pid": "4fb02f99-ae11-4c9a-8482-bcbdb70e8a11", "kat": ["Hem & Inredning", "Förvaring & Organisering"]},
    {"kort": "53386372", "pid": "53386372-173f-4c7f-8aa8-c9504de4467b", "kat": ["Hem & Inredning"]},
    {"kort": "6200b3c9", "pid": "6200b3c9-0eba-4dde-810c-9843bf9d9af5", "kat": ["Hem & Inredning"]},
    {"kort": "92afa6e3", "pid": "92afa6e3-103a-4ff7-ad1f-b7a4ab43ff59", "kat": ["Hem & Inredning"]},
    {"kort": "a1c98be2", "pid": "a1c98be2-42c2-4e8f-8705-3c8cae9b9684", "kat": ["Hem & Inredning", "Förvaring & Organisering"]},
    {"kort": "c40a2b10", "pid": "c40a2b10-6597-4cb6-8b72-840609a8e71a", "kat": ["Hem & Inredning", "Förvaring & Organisering"]},
    {"kort": "c6ff6fe8", "pid": "c6ff6fe8-2f00-4c3d-881f-06c6630a8150", "kat": ["Sport & Fritid", "Träning & Gym"]},
    {"kort": "cbbabd2c", "pid": "cbbabd2c-d6d3-4364-aaa8-906b6ac7f5eb", "kat": ["Hem & Inredning", "Förvaring & Organisering"]},
    {"kort": "d5ed3e90", "pid": "d5ed3e90-a4d8-4c1c-8941-6cb570e824e9", "kat": ["Hem & Inredning", "Förvaring & Organisering"]},
    {"kort": "d60cd696", "pid": "d60cd696-293a-4c7c-9336-41ea9614413c", "kat": ["Hem & Inredning", "Dekoration & Prydnad"]},
  ];
  const FACIT = { summa: 540661754, tecken: 1252 };

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
