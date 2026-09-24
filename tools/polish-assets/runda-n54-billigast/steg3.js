async function () {
  // Genererad av runda N54:s bygg-steg.py ur ids.tsv + kategori.tsv — skriv den aldrig för hand.
  const SUMMA = function (s) {
    let h = 0;
    for (const c of s) h = (h * 31 + (c.codePointAt(0) & 0xFFFF)) % 1000000007;
    return h;
  };
  const PLAN = [
    {"kort": "f267fdc4", "pid": "f267fdc4-47a0-445b-8542-b776029f2371", "kat": ["Trädgård & Utemöbler", "Hem & Inredning", "Förvaring & Organisering"]},
    {"kort": "0773ceb6", "pid": "0773ceb6-0c35-4825-aaea-33c219e38d73", "kat": ["Kök & Husgeråd", "Hem & Inredning"]},
    {"kort": "0ad9c123", "pid": "0ad9c123-c9b4-4fd2-97eb-6013557a682e", "kat": ["Hem & Inredning", "Dekoration & Prydnad"]},
    {"kort": "1884a543", "pid": "1884a543-6c2e-49f1-981a-f2fdb206cbfe", "kat": ["Sport & Fritid", "Träning & Gym"]},
    {"kort": "2f31a1d9", "pid": "2f31a1d9-5b41-4834-9a75-dd3a58814239", "kat": ["Hem & Inredning", "Belysning"]},
    {"kort": "383d8de2", "pid": "383d8de2-fa39-4205-acae-fe4e04469f43", "kat": ["Hem & Inredning"]},
    {"kort": "403dfd8d", "pid": "403dfd8d-a812-466f-9a24-beb4965b006d", "kat": ["Barn & Familj", "Leksaker & Spel"]},
    {"kort": "50adf7ed", "pid": "50adf7ed-73e8-4050-9e4c-c6444c6f22ce", "kat": ["Hem & Inredning", "Dekoration & Prydnad"]},
    {"kort": "71341341", "pid": "71341341-db6b-44df-a6ac-98535547e94a", "kat": ["Hem & Inredning", "Förvaring & Organisering"]},
    {"kort": "916d2e9f", "pid": "916d2e9f-6a41-4a26-aaed-550dca7f8191", "kat": ["Barn & Familj", "Leksaker & Spel"]},
    {"kort": "b281ec33", "pid": "b281ec33-cadb-447c-8043-972e2fb6d33a", "kat": ["Barn & Familj", "Leksaker & Spel"]},
    {"kort": "d2fb42b1", "pid": "d2fb42b1-2a90-4d35-b716-e88232a01508", "kat": ["Hem & Inredning"]},
    {"kort": "d444fbae", "pid": "d444fbae-a151-422f-8159-8d620461060a", "kat": ["Hem & Inredning", "Dekoration & Prydnad"]},
    {"kort": "f3d0cde9", "pid": "f3d0cde9-3b5c-4631-8646-03236e43f491", "kat": ["Sport & Fritid"]},
    {"kort": "fa0c30ac", "pid": "fa0c30ac-c917-46f3-8bc6-3592ad789d28", "kat": ["Hem & Inredning", "Dekoration & Prydnad", "Trädgård & Utemöbler", "Trädgårdsdekor & Belysning"]},
  ];
  const FACIT = { summa: 182299142, tecken: 1241 };

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
