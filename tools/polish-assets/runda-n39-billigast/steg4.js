async function () {
  // Genererad av runda N39:s bygg-steg.py ur ids.tsv + sku.tsv — facit räknat ur filen, aldrig skrivet av.
  const SUMMA = function (s) {
    let h = 0;
    for (const c of s) h = (h * 31 + (c.codePointAt(0) & 0xFFFF)) % 1000000007;
    return h;
  };
  const PLAN = [
    {"kort": "a9360e2a", "pid": "a9360e2a-f8ac-47ff-8be6-4664e5f805d6", "sku": "FP-balansbom-236-bla"},
    {"kort": "c694dcaa", "pid": "c694dcaa-c927-414c-8111-9a65a5e55015", "sku": "FP-golvlampa-trebensstativ-vit-skarm"},
    {"kort": "d3655c3e", "pid": "d3655c3e-c066-4226-9860-0e960aa5315f", "sku": "FP-tvattstall-bambu-tva-korgar"},
    {"kort": "e514191b", "pid": "e514191b-9ed9-4e31-b595-4bb3f0f7345a", "sku": "FP-skohylla-fyra-plan-blomdekor"},
    {"kort": "f75a8a17", "pid": "f75a8a17-f7e8-4a9f-9e38-1bba760252c4", "sku": "FP-hornblomstall-tre-plan-svart"},
    {"kort": "ba454107", "pid": "ba454107-f4e8-4e19-b0ec-e4985e647c34", "sku": "FP-pall-morkgra-stoppad-sits"},
    {"kort": "f4bdb64c", "pid": "f4bdb64c-95fa-4127-984c-2e93b416f2f2", "sku": "FP-pilatesbrada-hopfallbar"},
    {"kort": "95b6f5bd", "pid": "95b6f5bd-7b89-45de-98ae-0a535e1e44de", "sku": "FP-tvattsorterare-bambu-vit"},
  ];
  const FACIT = { summa: 816611077, tecken: 604 };

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
