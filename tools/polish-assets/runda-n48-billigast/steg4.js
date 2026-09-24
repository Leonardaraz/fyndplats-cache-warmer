async function () {
  // Genererad av runda N48:s bygg-steg.py ur ids.tsv + sku.tsv — facit räknat ur filen, aldrig skrivet av.
  const SUMMA = function (s) {
    let h = 0;
    for (const c of s) h = (h * 31 + (c.codePointAt(0) & 0xFFFF)) % 1000000007;
    return h;
  };
  const PLAN = [
    {"kort": "127ec9c8", "pid": "127ec9c8-2bf5-4512-8fa6-ba516bbeb901", "sku": "FP-halloweenskelett-marken-70"},
    {"kort": "876e7e89", "pid": "876e7e89-6330-4427-9603-95ad2445de63", "sku": "FP-paraplystall-svart-metall"},
    {"kort": "8cf7b1bb", "pid": "8cf7b1bb-2517-4a6a-96b2-8dcdc7700962", "sku": "FP-agilityset-hund-fyra-bagar"},
    {"kort": "a08404ee", "pid": "a08404ee-bc2c-417c-89cc-76dd344db527", "sku": "FP-overdrag-utemobler-275"},
    {"kort": "c031a4bc", "pid": "c031a4bc-ebd7-4e4d-b2b9-71fccfd915cd", "sku": "FP-forvaringspall-sammet-guld"},
    {"kort": "c4c404c5", "pid": "c4c404c5-5b01-4d37-8a11-cc93d22df61b", "sku": "FP-halloween-docka-76"},
    {"kort": "e03a7e2e", "pid": "e03a7e2e-3d5c-40e9-9f5b-f95a4b4fee32", "sku": "FP-vaxthylla-metall-tre-plan"},
    {"kort": "fa8d498b", "pid": "fa8d498b-2e28-4eb7-8ed5-7922e7ddb718", "sku": "FP-blomstall-trappform-fyra"},
    {"kort": "fca0d000", "pid": "fca0d000-c3e1-407a-a423-8df1cf087792", "sku": "FP-forvaringspall-sherpa-vit"},
    {"kort": "0a5d10dc", "pid": "0a5d10dc-df20-4515-9178-61fbe54a2dbd", "sku": "FP-skjutdorrsbeslag-svart-200cm"},
    {"kort": "5a6001cf", "pid": "5a6001cf-943c-42a8-8338-f85469b73477", "sku": "FP-gavagn-tra-montessori"},
    {"kort": "eefbc35f", "pid": "eefbc35f-0b9d-466d-b005-5aa820148fa8", "sku": "FP-halloween-zombieskelett-75"},
    {"kort": "a6a16df2", "pid": "a6a16df2-4a9b-46c1-9b19-0b60b6d9bc20", "sku": "FP-fotpall-svangd-ljusgra"},
    {"kort": "af9c163f", "pid": "af9c163f-12dc-4204-ae2e-1b52169dcd8c", "sku": "FP-pedalhink-mattsvart-20l"},
    {"kort": "c311e18f", "pid": "c311e18f-9fce-48ce-b890-8a6169ded050", "sku": "FP-grasmattsluftare-45"},
  ];
  const FACIT = { summa: 707777302, tecken: 1105 };

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
