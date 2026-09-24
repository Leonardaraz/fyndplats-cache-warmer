async function () {
  // Genererad av runda N45:s bygg-steg.py ur ids.tsv + sku.tsv — facit räknat ur filen, aldrig skrivet av.
  const SUMMA = function (s) {
    let h = 0;
    for (const c of s) h = (h * 31 + (c.codePointAt(0) & 0xFFFF)) % 1000000007;
    return h;
  };
  const PLAN = [
    {"kort": "173bc5bd", "pid": "173bc5bd-59f3-4668-b0c0-824537e1336e", "sku": "FP-julgran-smal-195-556-spetsar"},
    {"kort": "300d3415", "pid": "300d3415-01c8-4443-badd-9dfb5280a2e9", "sku": "FP-julby-tra-10-led"},
    {"kort": "2cb5b77e", "pid": "2cb5b77e-4d59-4b08-99a7-20beb2ad40f4", "sku": "FP-led-bjork-180-96-led"},
    {"kort": "badc577d", "pid": "badc577d-42a4-408b-9a05-d357932656f2", "sku": "FP-nattduksbord-dold-lada-svart"},
    {"kort": "db4808e6", "pid": "db4808e6-a557-4345-b6e6-7c5a7aca4981", "sku": "FP-hula-hoop-viktkula-rosa"},
    {"kort": "edac1214", "pid": "edac1214-56f4-4815-a06f-b18cdad35855", "sku": "FP-konstbambu-90-504-blad"},
    {"kort": "06675244", "pid": "06675244-e3da-4f4a-9ddb-3176bffd5fe5", "sku": "FP-julgran-100-sno-kottar"},
    {"kort": "119c6052", "pid": "119c6052-0e5f-4dd2-9d97-56d69328bc1a", "sku": "FP-medicinskap-kodlas-30x30"},
    {"kort": "2f1246a1", "pid": "2f1246a1-0966-4a50-ac55-c8c9e3d5bb26", "sku": "FP-halloween-mumie-142"},
    {"kort": "5f8aed80", "pid": "5f8aed80-bf3c-4b2c-a7f0-b8112ecce559", "sku": "FP-skap-tva-tyglador-rustik"},
    {"kort": "80558327", "pid": "80558327-0d74-4b04-b720-a79686326646", "sku": "FP-duschpall-bambu-hylla"},
    {"kort": "b99bb9cc", "pid": "b99bb9cc-c99d-4100-84ce-5e2594ceb839", "sku": "FP-bokhylla-hjul-tre-plan-vit"},
    {"kort": "be52938b", "pid": "be52938b-94bf-4eea-b33c-f861a929c8f3", "sku": "FP-lekmatta-196x176-dubbelsidig"},
    {"kort": "30fe3828", "pid": "30fe3828-a510-4f3e-b32d-6874a4ce81bd", "sku": "FP-sidobord-laddstation-tyglador"},
    {"kort": "33cf9b15", "pid": "33cf9b15-0375-416c-8bd5-4fb4392bf15f", "sku": "FP-snoskyffel-45-extra-handtag"},
  ];
  const FACIT = { summa: 68046349, tecken: 1106 };

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
