async function () {
  // Genererad av runda N49:s bygg-steg.py ur ids.tsv + kategori.tsv — skriv den aldrig för hand.
  const SUMMA = function (s) {
    let h = 0;
    for (const c of s) h = (h * 31 + (c.codePointAt(0) & 0xFFFF)) % 1000000007;
    return h;
  };
  const PLAN = [
    {"kort": "115d3831", "pid": "115d3831-2ca2-4b50-9d32-8e9736a84d0a", "kat": ["Barn & Familj", "Leksaker & Spel"]},
    {"kort": "5eb079d2", "pid": "5eb079d2-4018-43a4-8b1a-dec5cbb2e48d", "kat": ["Hem & Inredning", "Förvaring & Organisering"]},
    {"kort": "0dff6d43", "pid": "0dff6d43-4deb-47d2-a7a3-3b43e1b64cb5", "kat": ["Sport & Fritid"]},
    {"kort": "12c11f43", "pid": "12c11f43-1791-4828-8463-d4ef2abd9f25", "kat": ["Hem & Inredning"]},
    {"kort": "4c8d9de4", "pid": "4c8d9de4-fd02-4879-a248-e4bb444980c3", "kat": ["Hem & Inredning", "Dekoration & Prydnad"]},
    {"kort": "63a725ab", "pid": "63a725ab-9224-41b7-8e35-c1fe1a2aa5fc", "kat": ["Hem & Inredning", "Belysning"]},
    {"kort": "7720d168", "pid": "7720d168-8e4d-4391-bd54-15f33ab87191", "kat": ["Barn & Familj", "Leksaker & Spel"]},
    {"kort": "8382289b", "pid": "8382289b-0e16-463b-a09e-17fa2bd242b5", "kat": ["Hem & Inredning", "Trädgård & Utemöbler", "Växthus & Odling"]},
    {"kort": "875ca38b", "pid": "875ca38b-a1fc-4fc2-979c-36dc2033b107", "kat": ["Kök & Husgeråd", "Servering & Glas"]},
    {"kort": "96451d83", "pid": "96451d83-733f-4ade-bc8d-e02b4f8fb9cc", "kat": ["Barn & Familj", "Baby & Småbarn", "Leksaker & Spel"]},
    {"kort": "b69e5b38", "pid": "b69e5b38-0903-4e32-871d-84df5dd899a1", "kat": ["Hem & Inredning", "Trädgård & Utemöbler", "Växthus & Odling"]},
    {"kort": "cc7ab001", "pid": "cc7ab001-a015-4640-89c6-de69e41dd546", "kat": ["Husdjur", "Lek & Tillbehör för husdjur"]},
    {"kort": "ce59dcf5", "pid": "ce59dcf5-f188-4d89-8633-a17a66915f02", "kat": ["Hem & Inredning", "Förvaring & Organisering", "Badrum & Hemtextil"]},
    {"kort": "f0817bea", "pid": "f0817bea-845b-454a-bf32-8e91ceda1c9c", "kat": ["Hem & Inredning", "Dekoration & Prydnad"]},
    {"kort": "e0d0d880", "pid": "e0d0d880-9121-4682-8fc3-81c2bb603b16", "kat": ["Kök & Husgeråd"]},
  ];
  const FACIT = { summa: 433428969, tecken: 1249 };

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
