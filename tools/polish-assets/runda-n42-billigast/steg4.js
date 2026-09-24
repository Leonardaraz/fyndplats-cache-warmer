async function () {
  // Genererad av runda N42:s bygg-steg.py ur ids.tsv + sku.tsv — facit räknat ur filen, aldrig skrivet av.
  const SUMMA = function (s) {
    let h = 0;
    for (const c of s) h = (h * 31 + (c.codePointAt(0) & 0xFFFF)) % 1000000007;
    return h;
  };
  const PLAN = [
    {"kort": "2cfd222e", "pid": "2cfd222e-ab50-4a1c-a020-b9f749a27a5b", "sku": "FP-konstvaxt-95-33-blad"},
    {"kort": "3e2c7389", "pid": "3e2c7389-93ae-4f21-a556-f7186ff0cdb9", "sku": "FP-skobank-bambu-70-tva-plan"},
    {"kort": "5c5aedca", "pid": "5c5aedca-4952-4ead-b2eb-716d2be7d125", "sku": "FP-julgran-vit-150-med-pynt"},
    {"kort": "7f21945e", "pid": "7f21945e-3b7b-4700-a943-6558ebe7de08", "sku": "FP-forvaringskorgar-lock-3-gra"},
    {"kort": "985ff6d3", "pid": "985ff6d3-41a8-4214-8b90-b990a2880bd8", "sku": "FP-brodrost-2-skivor-7-lagen"},
    {"kort": "988ac121", "pid": "988ac121-4920-4ec1-8c14-5e8f525bc8bb", "sku": "FP-brasskarm-3-delar-svart"},
    {"kort": "b138effc", "pid": "b138effc-0e30-4c25-9bea-36aae4b04545", "sku": "FP-trimningsarm-hund-klamma"},
    {"kort": "cfb722e4", "pid": "cfb722e4-b588-4fd8-b609-56c5fd15d26e", "sku": "FP-rullvagn-smal-5-plan"},
    {"kort": "dcf149d1", "pid": "dcf149d1-bc0f-43f7-a8e1-82df588a3a78", "sku": "FP-pall-barn-3-steg-handtag"},
    {"kort": "fd940665", "pid": "fd940665-60f6-472c-922d-11d09cac17bb", "sku": "FP-sidobord-skap-industri"},
  ];
  const FACIT = { summa: 492699307, tecken: 733 };

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
