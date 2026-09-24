async function () {
  // Genererad av runda N34:s bygg-steg.py ur ids.tsv + sku.tsv — facit räknat ur filen, aldrig skrivet av.
  const SUMMA = function (s) {
    let h = 0;
    for (const c of s) h = (h * 31 + (c.codePointAt(0) & 0xFFFF)) % 1000000007;
    return h;
  };
  const PLAN = [
    {"kort": "5022e9e5", "pid": "5022e9e5-b5af-427a-8d83-3a934aafe654", "sku": "FP-tvattskap-tva-korgar"},
    {"kort": "32140f01", "pid": "32140f01-3110-4126-854f-3bd210b880bf", "sku": "FP-vaggkamin-led-lagor"},
    {"kort": "4f9ef409", "pid": "4f9ef409-95a2-427a-9095-eff4c2f0d99a", "sku": "FP-tv-bank-skap-oppet-fack"},
    {"kort": "8085d0b6", "pid": "8085d0b6-e58a-41c2-b08c-efb2c9d5c36f", "sku": "FP-hogskap-hyllor-lador"},
    {"kort": "bd2c7da3", "pid": "bd2c7da3-f4ab-4007-93ac-1c6e530b7793", "sku": "FP-skoskap-sju-nivaer"},
    {"kort": "6b91821a", "pid": "6b91821a-de53-4f1e-ba56-d9172d5d3cd9", "sku": "FP-sminkbord-led-spegel"},
    {"kort": "3739257b", "pid": "3739257b-c326-443c-95c3-1ff46dc7fbb2", "sku": "FP-matstolar-tunnform-2-pack"},
    {"kort": "3bf5bd08", "pid": "3bf5bd08-837b-4c80-863a-21101c27b783", "sku": "FP-matgrupp-5-delar"},
  ];
  const FACIT = { summa: 322921361, tecken: 560 };

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
