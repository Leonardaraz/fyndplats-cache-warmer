async function () {
  // Genererad av runda N40:s bygg-steg.py ur ids.tsv + sku.tsv — facit räknat ur filen, aldrig skrivet av.
  const SUMMA = function (s) {
    let h = 0;
    for (const c of s) h = (h * 31 + (c.codePointAt(0) & 0xFFFF)) % 1000000007;
    return h;
  };
  const PLAN = [
    {"kort": "27ff1a8e", "pid": "27ff1a8e-630e-444e-81c5-761f18c478bb", "sku": "FP-julgran-60-led-kottar-bar"},
    {"kort": "c2c6a332", "pid": "c2c6a332-0cb4-49b7-83f9-557ed594ea59", "sku": "FP-vaggspegel-40x60-svart-ram"},
    {"kort": "e2cfbd07", "pid": "e2cfbd07-845c-47b8-aec0-34357681b8df", "sku": "FP-mikrovagsugnshylla-utdragbar-svart"},
    {"kort": "a7d072fc", "pid": "a7d072fc-6409-4f67-9be3-49c94bce9787", "sku": "FP-vinstall-16-flaskor-svart"},
    {"kort": "4a4721fa", "pid": "4a4721fa-8f3e-41dc-a544-c9da0e992854", "sku": "FP-lekmatta-stadsmotiv-160x100"},
    {"kort": "8ded5e38", "pid": "8ded5e38-585e-48ed-adcc-0f46393004c1", "sku": "FP-gunghast-lejon-tra"},
    {"kort": "5cdc868a", "pid": "5cdc868a-a511-4911-af69-ed8a725ccf47", "sku": "FP-kladstallning-hjul-justerbar"},
    {"kort": "b0627017", "pid": "b0627017-e6af-45f5-b890-e11c071eabda", "sku": "FP-nattduksbord-hjul-tre-hyllor"},
    {"kort": "9c456097", "pid": "9c456097-e102-465e-bdc0-f3c67c8c850a", "sku": "FP-skobank-bambu-tva-hyllplan"},
    {"kort": "0c07eb82", "pid": "0c07eb82-7862-452a-8ae4-45486d2f48e6", "sku": "FP-kubhylla-metalltrad-sex-kuber"},
  ];
  const FACIT = { summa: 38416661, tecken: 765 };

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
