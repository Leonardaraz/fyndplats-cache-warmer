async function () {
  // Genererad av runda N35:s bygg-steg.py ur ids.tsv + sku.tsv — facit räknat ur filen, aldrig skrivet av.
  const SUMMA = function (s) {
    let h = 0;
    for (const c of s) h = (h * 31 + (c.codePointAt(0) & 0xFFFF)) % 1000000007;
    return h;
  };
  const PLAN = [
    {"kort": "8a076c08", "pid": "8a076c08-9287-4f7e-8dab-ed9735d60209", "sku": "FP-barstolar-konstlader-2-pack"},
    {"kort": "b28e1cbe", "pid": "b28e1cbe-fb7f-4866-abfd-5786f34bb596", "sku": "FP-barnsoffa-jordgubbe"},
    {"kort": "1bc0c04e", "pid": "1bc0c04e-4e8d-4daa-9f38-be92490afb0b", "sku": "FP-klatterstallning-5-i-1"},
    {"kort": "69513a61", "pid": "69513a61-9e15-429f-9a28-2d31d2a86a2b", "sku": "FP-gungbank-3-sits-tradgard"},
    {"kort": "3847b7ba", "pid": "3847b7ba-85cc-4c3e-9257-4e159809064d", "sku": "FP-tvasitssoffa-115-cm-gra"},
    {"kort": "965ba956", "pid": "965ba956-907e-4cf6-ae37-4bba05db730d", "sku": "FP-elkamin-konsol-9-farger"},
    {"kort": "c4d8cb93", "pid": "c4d8cb93-732d-4ba5-9d37-77bd165e4a53", "sku": "FP-koksskap-lantstil-170-cm"},
    {"kort": "093aedd2", "pid": "093aedd2-bd79-4bfa-8195-18ee97156187", "sku": "FP-konstvaxt-cypress-2-pack"},
  ];
  const FACIT = { summa: 774911991, tecken: 585 };

  // ☠️ SPÄRREN I SAMMA ANROP SOM SKRIVNINGEN — avbryter HELA batchen.
  const nyckel = PLAN.map(function (p) { return p.kort + "|" + p.pid + "|" + p.sku; }).join("\n");
  if (SUMMA(nyckel) !== FACIT.summa || nyckel.length !== FACIT.tecken) {
    return { AVBRUTET: "transkriberingsfel — ingenting skrivet", fick: SUMMA(nyckel), tecken: nyckel.length };
  }

  const ut = [];
  for (const p of PLAN) {
    // FÄRSK full GET i samma anrop — variantobjektet byggs ALDRIG från grunden.
    const g = await wix.request({ method: "GET", url: "/stores/v3/products/" + p.pid + "?fields=VARIANT_OPTION_CHOICE_NAMES" });
    const prod = (g.data || g).product;
    const vs = ((prod.variantsInfo || {}).variants) || [];
    if (vs.length !== 1) {
      ut.push({ kort: p.kort, ok: false, fel: "oväntat antal varianter: " + vs.length + " — hoppad" });
      continue;
    }
    // Ändra BARA sku på variantens toppnivå; allt annat följer med ur GET:en.
    const varianter = vs.map(function (v) { return Object.assign({}, v, { sku: p.sku }); });
    const produkt = {
      revision: prod.revision,
      visible: prod.visible,
      variantsInfo: {
        variants: varianter
      }
    };
    const vagar = ["variantsInfo", "visible"];
    if (Array.isArray(prod.options)) {
      produkt.options = prod.options;
      vagar.push("options");
    }
    const kropp = {
      product: produkt,
      fieldMask: {
        paths: vagar
      }
    };
    try {
      const r = await wix.request({ method: "PATCH", url: "/stores/v3/products/" + p.pid, body: kropp });
      const efter = (r.data || r).product;
      ut.push({
        kort: p.kort,
        ok: true,
        variantId: vs[0].id,
        skuFore: vs[0].sku,
        variantVisibleFore: vs[0].visible,
        produktVisibleFore: prod.visible,
        prisFore: ((vs[0].price || {}).actualPrice || {}).amount,
        revisionFore: prod.revision,
        revisionEfter: efter.revision
      });
    } catch (e) {
      ut.push({ kort: p.kort, ok: false, fel: String(e && e.message || e).slice(0, 300) });
    }
  }
  const ok = ut.filter(function (r) { return r.ok; }).length;
  return { rader: ut, SAMMANFATTNING: ok + " av " + ut.length + " skrivna" };
}
