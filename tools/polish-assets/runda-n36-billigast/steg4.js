async function () {
  // Genererad av runda N36:s bygg-steg.py ur ids.tsv + sku.tsv — facit räknat ur filen, aldrig skrivet av.
  const SUMMA = function (s) {
    let h = 0;
    for (const c of s) h = (h * 31 + (c.codePointAt(0) & 0xFFFF)) % 1000000007;
    return h;
  };
  const PLAN = [
    {"kort": "46c0fe07", "pid": "46c0fe07-2912-46ca-8fbe-10d87770ce22", "sku": "FP-sidobord-c-form-hjul-valnot"},
    {"kort": "3bfee58b", "pid": "3bfee58b-2473-4149-9864-2c223e576565", "sku": "FP-mopphink-20-l-press-svart"},
    {"kort": "265b0f61", "pid": "265b0f61-93f9-4e78-b8e0-d93e994f44e2", "sku": "FP-matta-170x120-morkgra"},
    {"kort": "69ba5b8b", "pid": "69ba5b8b-b143-4904-a4cf-406762ad4e10", "sku": "FP-staffli-barn-kritt-whiteboard"},
    {"kort": "2b27c2a4", "pid": "2b27c2a4-449b-4eb4-91f6-8a9a039ca605", "sku": "FP-brodrost-4-skivor-gra-vag"},
    {"kort": "37804a40", "pid": "37804a40-bc18-4d88-8d4a-83681440edd9", "sku": "FP-modulgarderob-111x183-cm"},
    {"kort": "6707c9dd", "pid": "6707c9dd-0970-4d6d-99ed-fdfe59c7761c", "sku": "FP-forvaringshurts-barn-3-lador"},
    {"kort": "676e567f", "pid": "676e567f-e41e-421d-9831-36c436f27ea2", "sku": "FP-brevlada-vagg-tidningshallare"},
  ];
  const FACIT = { summa: 285341069, tecken: 607 };

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
