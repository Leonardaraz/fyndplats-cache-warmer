async function () {
  // Genererad av runda N47:s bygg-steg.py ur ids.tsv + sku.tsv — facit räknat ur filen, aldrig skrivet av.
  const SUMMA = function (s) {
    let h = 0;
    for (const c of s) h = (h * 31 + (c.codePointAt(0) & 0xFFFF)) % 1000000007;
    return h;
  };
  const PLAN = [
    {"kort": "ccae0705", "pid": "ccae0705-a08d-41de-ae5b-0a48c32f3cc2", "sku": "FP-medicinskap-rostfritt-tryck"},
    {"kort": "f787a854", "pid": "f787a854-c96d-458c-9640-e3d33c5b5c54", "sku": "FP-julgirlang-180-50-led"},
    {"kort": "f6e74878", "pid": "f6e74878-d96a-4bdd-af71-8cc870658fa4", "sku": "FP-skrivbord-hylla-84-vit-ek"},
    {"kort": "0d42d53f", "pid": "0d42d53f-7470-4f92-a41c-14543893ce24", "sku": "FP-vaggspegel-hylla-svart-70"},
    {"kort": "114d37e5", "pid": "114d37e5-692b-47eb-919c-63fc4b15032b", "sku": "FP-halloween-fagelskramma-77"},
    {"kort": "760dd23c", "pid": "760dd23c-fe45-41f5-9e11-fce3c51172b4", "sku": "FP-transportvagn-hopfallbar-200"},
    {"kort": "b8002629", "pid": "b8002629-89d6-4409-b429-ad6b612d734c", "sku": "FP-skarmtak-100x75-polykarbonat"},
    {"kort": "26ec5761", "pid": "26ec5761-9d0c-4c8a-ac99-2a7aae5cb206", "sku": "FP-gavagn-tra-aktivitet-gron"},
    {"kort": "3b3705f5", "pid": "3b3705f5-1faa-40c0-a089-86313c8422a8", "sku": "FP-bokhylla-tradform-136cm-vit"},
    {"kort": "934297b1", "pid": "934297b1-51c5-48d6-b570-8b1ab4dae1dd", "sku": "FP-hundsang-solskydd-106cm"},
    {"kort": "a62db5fd", "pid": "a62db5fd-b7b0-4b98-9cb1-7675949e2958", "sku": "FP-uppblasbar-tomte-slade-ren"},
    {"kort": "b51b6e6c", "pid": "b51b6e6c-c86d-4de4-ad1e-9c795aa4d0d7", "sku": "FP-tva-granar-120cm-kruka"},
    {"kort": "b94fab48", "pid": "b94fab48-8509-42a9-9590-fff84a19172f", "sku": "FP-badrumsspegel-hyllor-60-vit"},
    {"kort": "f2aa99d9", "pid": "f2aa99d9-3c12-4c3f-ab09-ffac3d4ed5f9", "sku": "FP-halloween-hangande-183"},
    {"kort": "0db7e560", "pid": "0db7e560-2f60-416b-8bd2-84b09838f798", "sku": "FP-smadjurshage-36-paneler"},
  ];
  const FACIT = { summa: 59588095, tecken: 1123 };

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
