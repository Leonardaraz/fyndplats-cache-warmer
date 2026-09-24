async function () {
  // Genererad av runda N55:s bygg-steg.py ur ids.tsv + sku.tsv — facit räknat ur filen, aldrig skrivet av.
  const SUMMA = function (s) {
    let h = 0;
    for (const c of s) h = (h * 31 + (c.codePointAt(0) & 0xFFFF)) % 1000000007;
    return h;
  };
  const PLAN = [
    {"kort": "07e3cb1d", "pid": "07e3cb1d-855d-4a77-8336-3bd687e24893", "sku": "FP-tomte-slade-tre-renar"},
    {"kort": "16fe3c28", "pid": "16fe3c28-7409-49d8-88f6-e4bcd02d87d8", "sku": "FP-nattduksbord-tva-lador-vit"},
    {"kort": "494e0dab", "pid": "494e0dab-6481-4b44-a6c6-cd1b6c17f77f", "sku": "FP-sittpuff-sammet-svart-guld"},
    {"kort": "4bd41e91", "pid": "4bd41e91-e988-4c57-9fdf-5fb6909bd2cf", "sku": "FP-kapsagsstativ-rullstod"},
    {"kort": "4f0fa784", "pid": "4f0fa784-9661-47d4-9fc0-d4f303e59968", "sku": "FP-gnistskydd-tre-paneler"},
    {"kort": "4fb02f99", "pid": "4fb02f99-ae11-4c9a-8482-bcbdb70e8a11", "sku": "FP-shoppingvagn-trappor-vit"},
    {"kort": "53386372", "pid": "53386372-173f-4c7f-8aa8-c9504de4467b", "sku": "FP-gnistskydd-tva-paneler"},
    {"kort": "6200b3c9", "pid": "6200b3c9-0eba-4dde-810c-9843bf9d9af5", "sku": "FP-sangram-90x200-vit"},
    {"kort": "92afa6e3", "pid": "92afa6e3-103a-4ff7-ad1f-b7a4ab43ff59", "sku": "FP-pallar-stapelbara-gra"},
    {"kort": "a1c98be2", "pid": "a1c98be2-42c2-4e8f-8705-3c8cae9b9684", "sku": "FP-snurrpall-sammet-gra"},
    {"kort": "c40a2b10", "pid": "c40a2b10-6597-4cb6-8b72-840609a8e71a", "sku": "FP-mediahylla-atta-fack-vit"},
    {"kort": "c6ff6fe8", "pid": "c6ff6fe8-2f00-4c3d-881f-06c6630a8150", "sku": "FP-hantelset-sex-stall"},
    {"kort": "cbbabd2c", "pid": "cbbabd2c-d6d3-4364-aaa8-906b6ac7f5eb", "sku": "FP-vinhylla-glas-lada"},
    {"kort": "d5ed3e90", "pid": "d5ed3e90-a4d8-4c1c-8941-6cb570e824e9", "sku": "FP-bambuhylla-sex-plan"},
    {"kort": "d60cd696", "pid": "d60cd696-293a-4c7c-9336-41ea9614413c", "sku": "FP-julby-ljusbage-tra"},
  ];
  const FACIT = { summa: 391510379, tecken: 1069 };

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
