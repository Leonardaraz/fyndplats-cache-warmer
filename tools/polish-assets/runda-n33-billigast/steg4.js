async function () {
  // Genererad av runda N33:s bygg-steg.py ur ids.tsv + sku.tsv — facit räknat ur filen, aldrig skrivet av.
  const SUMMA = function (s) {
    let h = 0;
    for (const c of s) h = (h * 31 + (c.codePointAt(0) & 0xFFFF)) % 1000000007;
    return h;
  };
  const PLAN = [
    {"kort": "82000c6b", "pid": "82000c6b-7a34-4485-a954-dfc8d37336ba", "sku": "FP-basketkorg-genomskinlig-110x70"},
    {"kort": "2f251ce3", "pid": "2f251ce3-b737-4b27-9394-cc27325b6519", "sku": "FP-matstolar-sammet-gra-2-pack"},
    {"kort": "5c566983", "pid": "5c566983-8079-47a8-9406-0033f451585f", "sku": "FP-matsalsbank-120-ryggstod"},
    {"kort": "07565140", "pid": "07565140-2873-4c43-9d43-c30f8d21d37b", "sku": "FP-sideboard-lantstil-100-cm"},
    {"kort": "30f2151f", "pid": "30f2151f-8142-441b-97db-71236fce027b", "sku": "FP-varmluftsfritos-miniugn-36-l"},
    {"kort": "dbedaf4c", "pid": "dbedaf4c-492b-4221-9259-445f305a8a83", "sku": "FP-sideboard-vit-105-fyra-lador"},
    {"kort": "b2b731c7", "pid": "b2b731c7-fb5b-4c47-8d92-a60ed10d0e77", "sku": "FP-massage-fotter-vader-luft"},
    {"kort": "b3efdd39", "pid": "b3efdd39-70f5-4ad0-bedd-98ab8f4608f0", "sku": "FP-matbord-120x60-dolda-fack"},
  ];
  const FACIT = { summa: 926991554, tecken: 611 };

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
