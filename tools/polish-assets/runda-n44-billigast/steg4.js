async function () {
  // Genererad av runda N44:s bygg-steg.py ur ids.tsv + sku.tsv — facit räknat ur filen, aldrig skrivet av.
  const SUMMA = function (s) {
    let h = 0;
    for (const c of s) h = (h * 31 + (c.codePointAt(0) & 0xFFFF)) % 1000000007;
    return h;
  };
  const PLAN = [
    {"kort": "cf92c3bd", "pid": "cf92c3bd-a793-4728-884f-c65c7db5590a", "sku": "FP-konstvaxt-dieffenbachia-95"},
    {"kort": "e36dab73", "pid": "e36dab73-19e8-4136-9dcf-7b4df9d7cc0e", "sku": "FP-julgran-150-294-spetsar"},
    {"kort": "a7e88a1b", "pid": "a7e88a1b-c751-4d26-945a-71be8dd7d7f5", "sku": "FP-sittdyna-ergonomisk-memoryskum"},
    {"kort": "b5b3b852", "pid": "b5b3b852-94da-4b85-a08d-1b122fdf8227", "sku": "FP-darttavla-elektronisk-lcd"},
    {"kort": "e90dcc5a", "pid": "e90dcc5a-2d4d-4389-b455-979da533367f", "sku": "FP-balansstenar-tpr-sex"},
    {"kort": "0dfaa38b", "pid": "0dfaa38b-6792-4598-8dca-c6c71d1578b7", "sku": "FP-medicinskap-rostfritt-25x48"},
    {"kort": "10cd6afb", "pid": "10cd6afb-34b0-40dc-9c9b-4f7dc510fa58", "sku": "FP-konsolbord-75-marmorlook-vit"},
    {"kort": "00d6f785", "pid": "00d6f785-c15c-4315-afaa-269c53b42fd7", "sku": "FP-led-bjork-150-120-varmvit"},
    {"kort": "0feec456", "pid": "0feec456-5102-4095-990c-b8e2da80727c", "sku": "FP-tipitalt-katt-hund"},
    {"kort": "1476f00c", "pid": "1476f00c-8e41-4fef-af8f-ea10972f1002", "sku": "FP-leksakshylla-sex-tygboxar-gron"},
  ];
  const FACIT = { summa: 571135889, tecken: 751 };

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
