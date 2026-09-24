async function () {
  // Genererad av runda N50:s bygg-steg.py ur ids.tsv + sku.tsv — facit räknat ur filen, aldrig skrivet av.
  const SUMMA = function (s) {
    let h = 0;
    for (const c of s) h = (h * 31 + (c.codePointAt(0) & 0xFFFF)) % 1000000007;
    return h;
  };
  const PLAN = [
    {"kort": "10fe3278", "pid": "10fe3278-cb72-4cbf-90ff-9038506050cc", "sku": "FP-pokerset-kortblandare"},
    {"kort": "5fce6a95", "pid": "5fce6a95-9304-4bc0-b74a-38f2b89273ca", "sku": "FP-vedstall-svart-60"},
    {"kort": "cc5b0c14", "pid": "cc5b0c14-429c-4263-966a-0bced1ae857d", "sku": "FP-spokdocka-halloween-83"},
    {"kort": "e797e8a4", "pid": "e797e8a4-d87a-4782-8c70-28a6fbe7b21c", "sku": "FP-tvattkorg-bambu-lock"},
    {"kort": "e947f7aa", "pid": "e947f7aa-0251-4a15-881e-25cd878cdab0", "sku": "FP-vattenkokare-glas-tesil"},
    {"kort": "0598eff2", "pid": "0598eff2-7582-4152-9995-fd78563495c4", "sku": "FP-vaggskap-badrum-vitt"},
    {"kort": "007c6422", "pid": "007c6422-b9af-4f68-98c9-73f194dca92b", "sku": "FP-sangbord-eluttag-brun"},
    {"kort": "536e0244", "pid": "536e0244-a8d3-4212-b470-447a558780c6", "sku": "FP-hopfallbar-hage-gra"},
    {"kort": "7fdf42e9", "pid": "7fdf42e9-40fb-4975-bb73-788c01da8ca5", "sku": "FP-sidobord-rokglas-ek"},
    {"kort": "ad88f2b4", "pid": "ad88f2b4-e89b-42ab-8c86-72bcb28e3c9c", "sku": "FP-vedstall-smalt-svart-40"},
    {"kort": "e138b637", "pid": "e138b637-5b47-409d-bca3-7b78463b3578", "sku": "FP-lyftbock-motorcykel-rod"},
    {"kort": "e7bbadb2", "pid": "e7bbadb2-1e3a-423b-8bd1-ecb63b494f6b", "sku": "FP-tvbank-tyglador-svart"},
    {"kort": "17595feb", "pid": "17595feb-4289-4613-aefa-c70ab9e273ea", "sku": "FP-darttavla-sisal-ring"},
    {"kort": "261484e7", "pid": "261484e7-7efd-4384-99d5-7464b7e45647", "sku": "FP-gnistskydd-valvd-svart"},
    {"kort": "a6820dd0", "pid": "a6820dd0-0bf8-4dee-876d-dc6c62ea6bad", "sku": "FP-spokbrud-halloween-178"},
  ];
  const FACIT = { summa: 339020428, tecken: 1062 };

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
