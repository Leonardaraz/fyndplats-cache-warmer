async function () {
  // Genererad av runda N38:s bygg-steg.py ur ids.tsv + kategori.tsv — skriv den aldrig för hand.
  const SUMMA = function (s) {
    let h = 0;
    for (const c of s) h = (h * 31 + (c.codePointAt(0) & 0xFFFF)) % 1000000007;
    return h;
  };
  const PLAN = [
    {"kort": "0fda8bfe", "pid": "0fda8bfe-67ec-4360-942b-4d25c9573b0c", "kat": ["Hem & Inredning", "Dekoration & Prydnad"]},
    {"kort": "33c51730", "pid": "33c51730-339a-4977-98d6-25f46bffc517", "kat": ["Hem & Inredning", "Förvaring & Organisering"]},
    {"kort": "1a1487a8", "pid": "1a1487a8-4673-4ecb-9eee-4fc60f89a547", "kat": ["Hem & Inredning", "Verktyg & Hemmafix"]},
    {"kort": "084b987b", "pid": "084b987b-b64b-464c-afc6-486da4a4faef", "kat": ["Hem & Inredning", "Förvaring & Organisering"]},
    {"kort": "12e66c66", "pid": "12e66c66-5a33-4d88-8c72-18445fab61e5", "kat": ["Sport & Fritid"]},
    {"kort": "285d9ab7", "pid": "285d9ab7-8ef5-482d-8744-5babf7ac6cda", "kat": ["Kök & Husgeråd"]},
    {"kort": "2af7ec2d", "pid": "2af7ec2d-a4a3-4a23-8ec2-a86f5d7726de", "kat": ["Barn & Familj", "Leksaker & Spel"]},
    {"kort": "3bd54459", "pid": "3bd54459-485b-4a15-b3bb-edfb18066d90", "kat": ["Trädgård & Utemöbler", "Trädgårdsdekor & Belysning"]},
  ];
  const FACIT = { summa: 434168671, tecken: 641 };

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
