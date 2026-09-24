async function () {
  // Genererad av runda N38:s bygg-steg.py ur ids.tsv + sku.tsv — facit räknat ur filen, aldrig skrivet av.
  const SUMMA = function (s) {
    let h = 0;
    for (const c of s) h = (h * 31 + (c.codePointAt(0) & 0xFFFF)) % 1000000007;
    return h;
  };
  const PLAN = [
    {"kort": "0fda8bfe", "pid": "0fda8bfe-67ec-4360-942b-4d25c9573b0c", "sku": "FP-buxbomstrad-90-cm-tre-klot"},
    {"kort": "33c51730", "pid": "33c51730-339a-4977-98d6-25f46bffc517", "sku": "FP-paraplystall-droppskal-svart"},
    {"kort": "1a1487a8", "pid": "1a1487a8-4673-4ecb-9eee-4fc60f89a547", "sku": "FP-skarmtak-103-cm-polykarbonat"},
    {"kort": "084b987b", "pid": "084b987b-b64b-464c-afc6-486da4a4faef", "sku": "FP-sidobord-skap-oppet-fack-brun"},
    {"kort": "12e66c66", "pid": "12e66c66-5a33-4d88-8c72-18445fab61e5", "sku": "FP-darttavla-elektronisk-dorrar"},
    {"kort": "285d9ab7", "pid": "285d9ab7-8ef5-482d-8744-5babf7ac6cda", "sku": "FP-pedalhink-30-l-kramvit"},
    {"kort": "2af7ec2d", "pid": "2af7ec2d-a4a3-4a23-8ec2-a86f5d7726de", "sku": "FP-staffli-barn-2-i-1-rosa"},
    {"kort": "3bd54459", "pid": "3bd54459-485b-4a15-b3bb-edfb18066d90", "sku": "FP-fagelmatarstation-208-cm"},
  ];
  const FACIT = { summa: 781405103, tecken: 607 };

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
