async function () {
  // Genererad av runda N37:s bygg-steg.py ur ids.tsv + sku.tsv — facit räknat ur filen, aldrig skrivet av.
  const SUMMA = function (s) {
    let h = 0;
    for (const c of s) h = (h * 31 + (c.codePointAt(0) & 0xFFFF)) % 1000000007;
    return h;
  };
  const PLAN = [
    {"kort": "81a3065e", "pid": "81a3065e-df64-4494-8ed4-5641a5ac7d4b", "sku": "FP-vaggkrukor-3-pack-svart"},
    {"kort": "ff10ccf5", "pid": "ff10ccf5-8837-43d8-8d33-aa47252a4b3f", "sku": "FP-sidobord-smalt-tre-plan"},
    {"kort": "e118ae32", "pid": "e118ae32-a429-493b-9b55-27eff563fe9f", "sku": "FP-fagelbogunga-110-bla"},
    {"kort": "ae2ac5e5", "pid": "ae2ac5e5-6506-49b9-aa3a-c634044272f4", "sku": "FP-gnistskydd-96-cm-tre-paneler"},
    {"kort": "f1e0a996", "pid": "f1e0a996-66b8-4386-a846-6d34b7cea24c", "sku": "FP-gunghast-tra-zebra"},
    {"kort": "af4409b8", "pid": "af4409b8-133a-4dda-a2cd-9dec4c26ac25", "sku": "FP-sangbord-lada-hylla-natur"},
    {"kort": "9e16bd7c", "pid": "9e16bd7c-527d-4566-800a-af22bdcc5bf6", "sku": "FP-basketstall-barn-5-i-1"},
    {"kort": "a7bddc08", "pid": "a7bddc08-1d6a-4c51-bb05-677e3a4286ee", "sku": "FP-sadelpall-hjul-svart"},
  ];
  const FACIT = { summa: 125698756, tecken: 578 };

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
