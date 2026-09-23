async function () {
  // Genererad av runda N41:s bygg-steg.py ur ids.tsv + sku.tsv — facit räknat ur filen, aldrig skrivet av.
  const SUMMA = function (s) {
    let h = 0;
    for (const c of s) h = (h * 31 + (c.codePointAt(0) & 0xFFFF)) % 1000000007;
    return h;
  };
  const PLAN = [
    {"kort": "e3256412", "pid": "e3256412-1ee1-44cb-93aa-c8125eda1e31", "sku": "FP-regnskydd-cykelvagn-genomskinligt"},
    {"kort": "3d3f90d3", "pid": "3d3f90d3-4bb3-49a4-8ab2-9e504e2afc02", "sku": "FP-ledbjork-120-72-lampor"},
    {"kort": "6baeb38b", "pid": "6baeb38b-464a-4c56-b450-45efbf212fae", "sku": "FP-vinstall-bambu-16-flaskor"},
    {"kort": "8fc578fc", "pid": "8fc578fc-cd6e-4b42-bb5a-2af7af926727", "sku": "FP-babygunga-3i1-ryggstod-bygel"},
    {"kort": "acc9ab97", "pid": "acc9ab97-9144-4524-8cea-976cf53a4957", "sku": "FP-vattenkokare-17l-temperaturval"},
    {"kort": "42949f67", "pid": "42949f67-2136-49c9-b5cd-b7c74080d8aa", "sku": "FP-halloween-spoken-tre-lysande"},
    {"kort": "5e126c2f", "pid": "5e126c2f-23bd-49cd-a7de-b5a761b3973a", "sku": "FP-halloween-zombie-krypande-140"},
    {"kort": "050db4d8", "pid": "050db4d8-da66-4e13-b0bd-ef13c2abb3dd", "sku": "FP-vaggdekor-metall-blad-tva"},
    {"kort": "1c92e587", "pid": "1c92e587-3c14-49af-bf37-1b3efe4431bf", "sku": "FP-balanscykel-tre-hjul-12-36"},
    {"kort": "1f887213", "pid": "1f887213-5574-4b53-9b7e-19d017afa754", "sku": "FP-julgran-vit-180-smal"},
  ];
  const FACIT = { summa: 863741307, tecken: 765 };

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
