async function () {
  // Genererad ur sku.tsv + ids.tsv av ett skript (se LÄS-MIG) — facit räknat ur filen, aldrig skrivet av.
  const SUMMA = function (s) {
    let h = 0;
    for (const c of s) h = (h * 31 + (c.codePointAt(0) & 0xFFFF)) % 1000000007;
    return h;
  };
  const PLAN = [
    { kort: "40fb1b24", pid: "40fb1b24-d4d6-429c-8cbb-012d38678166", sku: "FP-elkamin-vagg-89-cm" },
    { kort: "c6f8a0f1", pid: "c6f8a0f1-b5b6-4b72-9499-abe6b797ba2d", sku: "FP-renfamilj-led-134-cm" },
    { kort: "8f95113c", pid: "8f95113c-33b4-4de1-afc7-44517fffcc3e", sku: "FP-madrass-140x200-20-cm" },
    { kort: "41b2bc81", pid: "41b2bc81-592e-4539-ad28-6983fd25f205", sku: "FP-matstolar-linnelook-2-pack" },
    { kort: "6ab7b3b0", pid: "6ab7b3b0-f67d-4f31-a2f9-b820c4ad86b6", sku: "FP-motionscykel-8-steg" },
    { kort: "b42b4802", pid: "b42b4802-508d-4a7e-af8a-d0bc08b49e07", sku: "FP-skrivbord-vridbart-360" },
    { kort: "2808fff3", pid: "2808fff3-6d80-43e1-9be4-abecf7c9fe7c", sku: "FP-tv-bank-120-skjutdorrar" },
    { kort: "db1d494f", pid: "db1d494f-0fc9-444a-b8ad-7e5c91391e6a", sku: "FP-basketkorg-vagg-110-cm" }
  ];
  const FACIT = { summa: 202425706, tecken: 274 };

  // ☠️ SPÄRREN I SAMMA ANROP SOM SKRIVNINGEN — avbryter HELA batchen.
  const nyckel = PLAN.map(function (p) { return p.kort + "|" + p.sku; }).join("\n");
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
      variantsInfo: { variants: varianter }
    };
    const vagar = ["variantsInfo", "visible"];
    if (Array.isArray(prod.options)) {
      produkt.options = prod.options;
      vagar.push("options");
    }
    const kropp = { product: produkt, fieldMask: { paths: vagar } };
    try {
      const r = await wix.request({ method: "PATCH", url: "/stores/v3/products/" + p.pid, body: kropp });
      const efter = (r.data || r).product;
      ut.push({
        kort: p.kort,
        ok: true,
        variantId: vs[0].id,
        skuFore: vs[0].sku,
        variantVisibleFore: vs[0].visible,
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
