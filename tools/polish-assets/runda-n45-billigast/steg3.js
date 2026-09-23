async function () {
  // Genererad av runda N45:s bygg-steg.py ur ids.tsv + kategori.tsv — skriv den aldrig för hand.
  const SUMMA = function (s) {
    let h = 0;
    for (const c of s) h = (h * 31 + (c.codePointAt(0) & 0xFFFF)) % 1000000007;
    return h;
  };
  const PLAN = [
    {"kort": "173bc5bd", "pid": "173bc5bd-59f3-4668-b0c0-824537e1336e", "kat": ["Hem & Inredning", "Dekoration & Prydnad"]},
    {"kort": "300d3415", "pid": "300d3415-01c8-4443-badd-9dfb5280a2e9", "kat": ["Hem & Inredning", "Dekoration & Prydnad"]},
    {"kort": "2cb5b77e", "pid": "2cb5b77e-4d59-4b08-99a7-20beb2ad40f4", "kat": ["Hem & Inredning", "Belysning", "Dekoration & Prydnad"]},
    {"kort": "badc577d", "pid": "badc577d-42a4-408b-9a05-d357932656f2", "kat": ["Hem & Inredning", "Förvaring & Organisering"]},
    {"kort": "db4808e6", "pid": "db4808e6-a557-4345-b6e6-7c5a7aca4981", "kat": ["Sport & Fritid", "Träning & Gym"]},
    {"kort": "edac1214", "pid": "edac1214-56f4-4815-a06f-b18cdad35855", "kat": ["Hem & Inredning", "Dekoration & Prydnad"]},
    {"kort": "06675244", "pid": "06675244-e3da-4f4a-9ddb-3176bffd5fe5", "kat": ["Hem & Inredning", "Dekoration & Prydnad"]},
    {"kort": "119c6052", "pid": "119c6052-0e5f-4dd2-9d97-56d69328bc1a", "kat": ["Hem & Inredning", "Badrum & Hemtextil"]},
    {"kort": "2f1246a1", "pid": "2f1246a1-0966-4a50-ac55-c8c9e3d5bb26", "kat": ["Hem & Inredning", "Kalas & Fest"]},
    {"kort": "5f8aed80", "pid": "5f8aed80-bf3c-4b2c-a7f0-b8112ecce559", "kat": ["Hem & Inredning", "Förvaring & Organisering"]},
    {"kort": "80558327", "pid": "80558327-0d74-4b04-b720-a79686326646", "kat": ["Hem & Inredning", "Badrum & Hemtextil"]},
    {"kort": "b99bb9cc", "pid": "b99bb9cc-c99d-4100-84ce-5e2594ceb839", "kat": ["Hem & Inredning", "Förvaring & Organisering"]},
    {"kort": "be52938b", "pid": "be52938b-94bf-4eea-b33c-f861a929c8f3", "kat": ["Barn & Familj", "Baby & Småbarn"]},
    {"kort": "30fe3828", "pid": "30fe3828-a510-4f3e-b32d-6874a4ce81bd", "kat": ["Hem & Inredning", "Förvaring & Organisering"]},
    {"kort": "33cf9b15", "pid": "33cf9b15-0375-416c-8bd5-4fb4392bf15f", "kat": ["Hem & Inredning", "Verktyg & Hemmafix"]},
  ];
  const FACIT = { summa: 189655672, tecken: 1272 };

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
