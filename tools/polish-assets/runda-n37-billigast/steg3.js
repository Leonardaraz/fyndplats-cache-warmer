async function () {
  // Genererad av runda N37:s bygg-steg.py ur ids.tsv + kategori.tsv — skriv den aldrig för hand.
  const SUMMA = function (s) {
    let h = 0;
    for (const c of s) h = (h * 31 + (c.codePointAt(0) & 0xFFFF)) % 1000000007;
    return h;
  };
  const PLAN = [
    {"kort": "81a3065e", "pid": "81a3065e-df64-4494-8ed4-5641a5ac7d4b", "kat": ["Hem & Inredning", "Dekoration & Prydnad"]},
    {"kort": "ff10ccf5", "pid": "ff10ccf5-8837-43d8-8d33-aa47252a4b3f", "kat": ["Hem & Inredning", "Förvaring & Organisering"]},
    {"kort": "e118ae32", "pid": "e118ae32-a429-493b-9b55-27eff563fe9f", "kat": ["Barn & Familj", "Leksaker & Spel", "Utelek & Spel"]},
    {"kort": "ae2ac5e5", "pid": "ae2ac5e5-6506-49b9-aa3a-c634044272f4", "kat": ["Hem & Inredning", "Dekoration & Prydnad"]},
    {"kort": "f1e0a996", "pid": "f1e0a996-66b8-4386-a846-6d34b7cea24c", "kat": ["Barn & Familj", "Leksaker & Spel", "Baby & Småbarn"]},
    {"kort": "af4409b8", "pid": "af4409b8-133a-4dda-a2cd-9dec4c26ac25", "kat": ["Hem & Inredning", "Förvaring & Organisering"]},
    {"kort": "9e16bd7c", "pid": "9e16bd7c-527d-4566-800a-af22bdcc5bf6", "kat": ["Barn & Familj", "Leksaker & Spel"]},
    {"kort": "a7bddc08", "pid": "a7bddc08-1d6a-4c51-bb05-677e3a4286ee", "kat": ["Hem & Inredning"]},
  ];
  const FACIT = { summa: 865677036, tecken: 676 };

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
