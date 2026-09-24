async function () {
  // Genererad av runda N46:s bygg-steg.py ur ids.tsv + sku.tsv — facit räknat ur filen, aldrig skrivet av.
  const SUMMA = function (s) {
    let h = 0;
    for (const c of s) h = (h * 31 + (c.codePointAt(0) & 0xFFFF)) % 1000000007;
    return h;
  };
  const PLAN = [
    {"kort": "2fc13340", "pid": "2fc13340-bd10-406e-9c6b-57c90bffe7de", "sku": "FP-luftmadrass-tva-203x152"},
    {"kort": "308cabee", "pid": "308cabee-0aeb-4ad7-b685-405a672eadfd", "sku": "FP-konstpalm-100-27-blad"},
    {"kort": "423edb5d", "pid": "423edb5d-c816-49f0-9d19-8f788ef65d23", "sku": "FP-barnbokhylla-fyra-hyllor-vit"},
    {"kort": "4dc2759a", "pid": "4dc2759a-9220-4c3c-a89c-30e53112c502", "sku": "FP-husdjurssang-upphojd-gra"},
    {"kort": "61917e9a", "pid": "61917e9a-2313-47aa-9d23-bdd49cece265", "sku": "FP-sidobord-svart-stal-hylla"},
    {"kort": "6690086e", "pid": "6690086e-9276-43f6-887a-42add3ff880b", "sku": "FP-skohylla-bambu-fyra-plan"},
    {"kort": "7ba0423b", "pid": "7ba0423b-ec29-4e31-a0f3-1407e1f18364", "sku": "FP-blomsterhylla-tra-sex-plan"},
    {"kort": "80de1b65", "pid": "80de1b65-144d-4be1-be23-1fe5546c672e", "sku": "FP-lavendeltrad-60-tva"},
    {"kort": "8aab4f48", "pid": "8aab4f48-6761-4663-9e6a-46fc25d91925", "sku": "FP-badrumsskap-bambu-67"},
    {"kort": "97cf9327", "pid": "97cf9327-56b9-4ce2-bb32-f8a6d7c182d9", "sku": "FP-snogubbe-uppblasbar-180"},
    {"kort": "9c3b6e2f", "pid": "9c3b6e2f-e7af-42a5-b768-387ab99c05cb", "sku": "FP-rosentrad-rosa-90"},
    {"kort": "af994f2d", "pid": "af994f2d-da41-4aff-adac-e17d052c04a9", "sku": "FP-barstol-gaslyft-svart"},
    {"kort": "b73863ff", "pid": "b73863ff-e852-49d6-9dcc-757415d25f2f", "sku": "FP-vinstall-vagg-sex-flaskor"},
    {"kort": "b8d8a982", "pid": "b8d8a982-2c2c-4fe0-b527-f90bbdabfbfe", "sku": "FP-darttavla-skap-31-spel"},
    {"kort": "cc18bc6f", "pid": "cc18bc6f-957e-4134-8346-fa664415ffda", "sku": "FP-bananvaxt-150-18-blad"},
  ];
  const FACIT = { summa: 316679610, tecken: 1088 };

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
