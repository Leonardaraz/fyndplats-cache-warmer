async function () {
  // Genererad av runda N56:s bygg-steg.py ur ids.tsv + kategori.tsv — skriv den aldrig för hand.
  const SUMMA = function (s) {
    let h = 0;
    for (const c of s) h = (h * 31 + (c.codePointAt(0) & 0xFFFF)) % 1000000007;
    return h;
  };
  const PLAN = [
    {"kort": "1355eec8", "pid": "1355eec8-4b26-40ef-ac51-fce1db893004", "kat": ["Sport & Fritid", "Friluftsliv & Resa"]},
    {"kort": "1c908b3f", "pid": "1c908b3f-9029-4dff-a3f9-e424e345da8b", "kat": ["Sport & Fritid"]},
    {"kort": "1da6b037", "pid": "1da6b037-1532-40c6-af48-cb756b693a62", "kat": ["Hem & Inredning"]},
    {"kort": "3ad8c7a4", "pid": "3ad8c7a4-9d12-4480-94b7-fcb625ca69ee", "kat": ["Husdjur", "Lek & Tillbehör för husdjur"]},
    {"kort": "6d0e2d27", "pid": "6d0e2d27-3ffe-4e11-b5c5-90e2c12d9e95", "kat": ["Hem & Inredning"]},
    {"kort": "6f4baeef", "pid": "6f4baeef-f998-4701-8829-63816e0d40a1", "kat": ["Hem & Inredning", "Förvaring & Organisering"]},
    {"kort": "7e3d0a23", "pid": "7e3d0a23-7665-45fe-82db-141e6bc7a720", "kat": ["Trädgård & Utemöbler", "Hem & Inredning", "Förvaring & Organisering"]},
    {"kort": "856bdf7e", "pid": "856bdf7e-bd81-4377-8df8-ad96fbada5a0", "kat": ["Sport & Fritid", "Träning & Gym"]},
    {"kort": "868b82c8", "pid": "868b82c8-5206-45c9-ade5-c6b082a5412b", "kat": ["Barn & Familj", "Leksaker & Spel"]},
    {"kort": "95a0993c", "pid": "95a0993c-df23-499d-acc7-156b42aff4c7", "kat": ["Möbler"]},
    {"kort": "98da447a", "pid": "98da447a-8700-4465-bc57-e6f9271b4c6f", "kat": ["Hem & Inredning"]},
    {"kort": "b62bb65c", "pid": "b62bb65c-d933-4a61-bda5-b12aca4a5b25", "kat": ["Sport & Fritid", "Träning & Gym"]},
    {"kort": "e248e9db", "pid": "e248e9db-a5ce-4f72-8f32-a5689ca18bfe", "kat": ["Hem & Inredning", "Badrum & Hemtextil", "Förvaring & Organisering"]},
    {"kort": "ed39cd4c", "pid": "ed39cd4c-d5a6-41ab-9d95-a677a100e9e0", "kat": ["Hem & Inredning", "Badrum & Hemtextil", "Förvaring & Organisering"]},
    {"kort": "f2756389", "pid": "f2756389-3bbe-4926-9d10-6c189eb090d8", "kat": ["Möbler", "Soffbord & småbord"]},
  ];
  const FACIT = { summa: 607137561, tecken: 1192 };

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
