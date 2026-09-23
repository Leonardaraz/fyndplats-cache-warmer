async function () {
  // Genererad av runda N43:s bygg-steg.py ur ids.tsv + sku.tsv — facit räknat ur filen, aldrig skrivet av.
  const SUMMA = function (s) {
    let h = 0;
    for (const c of s) h = (h * 31 + (c.codePointAt(0) & 0xFFFF)) % 1000000007;
    return h;
  };
  const PLAN = [
    {"kort": "5a825b3f", "pid": "5a825b3f-23e6-4733-9868-118784f3ed64", "sku": "FP-medicinskap-rostfritt-glasdorr"},
    {"kort": "923236e5", "pid": "923236e5-ad12-4709-bcf9-7e050dbf6435", "sku": "FP-vaggdekor-metall-monstera-guld"},
    {"kort": "b0766f63", "pid": "b0766f63-5fb7-4ca0-b31f-5d056ad721ab", "sku": "FP-julgran-92-led-batteri"},
    {"kort": "c61ced0e", "pid": "c61ced0e-46be-4577-99c9-798fd819ad0b", "sku": "FP-hylla-bambu-tre-plan-62"},
    {"kort": "e01513c6", "pid": "e01513c6-4d23-4ac8-8b72-3b2749439b7c", "sku": "FP-sidobord-hjul-c-form-hojdjust"},
    {"kort": "5bd95c2c", "pid": "5bd95c2c-eae0-48fb-96d0-91228125a5af", "sku": "FP-vaggspegel-50x70-svart-ram"},
    {"kort": "60f84a27", "pid": "60f84a27-9823-4d93-9d02-59a18b0bd409", "sku": "FP-balansstenar-sex-tre-storlekar"},
    {"kort": "a794b9e7", "pid": "a794b9e7-76ba-40bc-8d06-ba09dc0e49da", "sku": "FP-julgran-smal-180-sno-492"},
    {"kort": "75a38b7b", "pid": "75a38b7b-e6ba-43d5-806b-b378067f148a", "sku": "FP-julgran-fiberoptik-120-stjarna"},
    {"kort": "c4af8541", "pid": "c4af8541-efa6-4fec-8bf5-027e2d3a3f5c", "sku": "FP-julgirlang-1-8m-led-bar"},
  ];
  const FACIT = { summa: 438468245, tecken: 766 };

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
