async function () {
  // Genererad av runda N49:s bygg-steg.py ur ids.tsv + sku.tsv — facit räknat ur filen, aldrig skrivet av.
  const SUMMA = function (s) {
    let h = 0;
    for (const c of s) h = (h * 31 + (c.codePointAt(0) & 0xFFFF)) % 1000000007;
    return h;
  };
  const PLAN = [
    {"kort": "115d3831", "pid": "115d3831-2ca2-4b50-9d32-8e9736a84d0a", "sku": "FP-springcykel-tra-ljusbla"},
    {"kort": "5eb079d2", "pid": "5eb079d2-4018-43a4-8b1a-dec5cbb2e48d", "sku": "FP-forvaringspall-jute-beige"},
    {"kort": "0dff6d43", "pid": "0dff6d43-4deb-47d2-a7a3-3b43e1b64cb5", "sku": "FP-pokerset-aluminiumvaska"},
    {"kort": "12c11f43", "pid": "12c11f43-1791-4828-8463-d4ef2abd9f25", "sku": "FP-pall-fransk-lantstil-beige"},
    {"kort": "4c8d9de4", "pid": "4c8d9de4-fd02-4879-a248-e4bb444980c3", "sku": "FP-smal-julgran-konstsno"},
    {"kort": "63a725ab", "pid": "63a725ab-9224-41b7-8e35-c1fe1a2aa5fc", "sku": "FP-golvlampa-guld-fjarrkontroll"},
    {"kort": "7720d168", "pid": "7720d168-8e4d-4391-bd54-15f33ab87191", "sku": "FP-lekkok-92-delar-mintgron"},
    {"kort": "8382289b", "pid": "8382289b-0e16-463b-a09e-17fa2bd242b5", "sku": "FP-blomstall-sex-runda-hyllor"},
    {"kort": "875ca38b", "pid": "875ca38b-a1fc-4fc2-979c-36dc2033b107", "sku": "FP-vinhylla-vagg-atta-flaskor"},
    {"kort": "96451d83", "pid": "96451d83-733f-4ade-bc8d-e02b4f8fb9cc", "sku": "FP-rutschkana-giraff-bla"},
    {"kort": "b69e5b38", "pid": "b69e5b38-0903-4e32-871d-84df5dd899a1", "sku": "FP-blomstall-trappform-tre-plan"},
    {"kort": "cc7ab001", "pid": "cc7ab001-a015-4640-89c6-de69e41dd546", "sku": "FP-agilityset-hund-tre-delar"},
    {"kort": "ce59dcf5", "pid": "ce59dcf5-f188-4d89-8633-a17a66915f02", "sku": "FP-bambuhylla-fyra-plan"},
    {"kort": "f0817bea", "pid": "f0817bea-845b-454a-bf32-8e91ceda1c9c", "sku": "FP-julby-tra-20-led"},
    {"kort": "e0d0d880", "pid": "e0d0d880-9121-4682-8fc3-81c2bb603b16", "sku": "FP-pedalhink-gradvit-20l"},
  ];
  const FACIT = { summa: 145595291, tecken: 1102 };

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
