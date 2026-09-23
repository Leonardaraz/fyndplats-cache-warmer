async function () {
  // Genererad av runda N43:s bygg-steg.py ur ids.tsv + kategori.tsv — skriv den aldrig för hand.
  const SUMMA = function (s) {
    let h = 0;
    for (const c of s) h = (h * 31 + (c.codePointAt(0) & 0xFFFF)) % 1000000007;
    return h;
  };
  const PLAN = [
    {"kort": "5a825b3f", "pid": "5a825b3f-23e6-4733-9868-118784f3ed64", "kat": ["Hem & Inredning", "Badrum & Hemtextil"]},
    {"kort": "923236e5", "pid": "923236e5-ad12-4709-bcf9-7e050dbf6435", "kat": ["Hem & Inredning", "Dekoration & Prydnad"]},
    {"kort": "b0766f63", "pid": "b0766f63-5fb7-4ca0-b31f-5d056ad721ab", "kat": ["Hem & Inredning", "Dekoration & Prydnad"]},
    {"kort": "c61ced0e", "pid": "c61ced0e-46be-4577-99c9-798fd819ad0b", "kat": ["Hem & Inredning", "Förvaring & Organisering"]},
    {"kort": "e01513c6", "pid": "e01513c6-4d23-4ac8-8b72-3b2749439b7c", "kat": ["Hem & Inredning"]},
    {"kort": "5bd95c2c", "pid": "5bd95c2c-eae0-48fb-96d0-91228125a5af", "kat": ["Hem & Inredning", "Dekoration & Prydnad"]},
    {"kort": "60f84a27", "pid": "60f84a27-9823-4d93-9d02-59a18b0bd409", "kat": ["Barn & Familj", "Leksaker & Spel"]},
    {"kort": "a794b9e7", "pid": "a794b9e7-76ba-40bc-8d06-ba09dc0e49da", "kat": ["Hem & Inredning", "Dekoration & Prydnad"]},
    {"kort": "75a38b7b", "pid": "75a38b7b-e6ba-43d5-806b-b378067f148a", "kat": ["Hem & Inredning", "Dekoration & Prydnad"]},
    {"kort": "c4af8541", "pid": "c4af8541-efa6-4fec-8bf5-027e2d3a3f5c", "kat": ["Hem & Inredning", "Dekoration & Prydnad"]},
  ];
  const FACIT = { summa: 775712834, tecken: 821 };

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
