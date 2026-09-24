async function () {
  // Genererad av runda N56:s bygg-steg.py ur ids.tsv + sku.tsv — facit räknat ur filen, aldrig skrivet av.
  const SUMMA = function (s) {
    let h = 0;
    for (const c of s) h = (h * 31 + (c.codePointAt(0) & 0xFFFF)) % 1000000007;
    return h;
  };
  const PLAN = [
    {"kort": "1355eec8", "pid": "1355eec8-4b26-40ef-ac51-fce1db893004", "sku": "FP-handbagage-koffert-56-gra"},
    {"kort": "1c908b3f", "pid": "1c908b3f-9029-4dff-a3f9-e424e345da8b", "sku": "FP-pokerset-marker-400"},
    {"kort": "1da6b037", "pid": "1da6b037-1532-40c6-af48-cb756b693a62", "sku": "FP-gnistskydd-svart-bagmonster"},
    {"kort": "3ad8c7a4", "pid": "3ad8c7a4-9d12-4480-94b7-fcb625ca69ee", "sku": "FP-klattervagg-katt-fyra-delar"},
    {"kort": "6d0e2d27", "pid": "6d0e2d27-3ffe-4e11-b5c5-90e2c12d9e95", "sku": "FP-gnistskydd-guld-dubbeldorrar"},
    {"kort": "6f4baeef", "pid": "6f4baeef-f998-4701-8829-63816e0d40a1", "sku": "FP-vinstall-30-flaskor"},
    {"kort": "7e3d0a23", "pid": "7e3d0a23-7665-45fe-82db-141e6bc7a720", "sku": "FP-vedstall-overdrag-barvaska"},
    {"kort": "856bdf7e", "pid": "856bdf7e-bd81-4377-8df8-ad96fbada5a0", "sku": "FP-hantlar-skivstang-20kg"},
    {"kort": "868b82c8", "pid": "868b82c8-5206-45c9-ade5-c6b082a5412b", "sku": "FP-leksaksaffar-tra-kassa"},
    {"kort": "95a0993c", "pid": "95a0993c-df23-499d-acc7-156b42aff4c7", "sku": "FP-fotpall-manchester-graddvit"},
    {"kort": "98da447a", "pid": "98da447a-8700-4465-bc57-e6f9271b4c6f", "sku": "FP-staffli-boktra-lada"},
    {"kort": "b62bb65c", "pid": "b62bb65c-d933-4a61-bda5-b12aca4a5b25", "sku": "FP-hantelstall-tva-hyllor"},
    {"kort": "e248e9db", "pid": "e248e9db-a5ce-4f72-8f32-a5689ca18bfe", "sku": "FP-badrumsskap-bambu-30"},
    {"kort": "ed39cd4c", "pid": "ed39cd4c-d5a6-41ab-9d95-a677a100e9e0", "sku": "FP-toaletthylla-bambu"},
    {"kort": "f2756389", "pid": "f2756389-3bbe-4926-9d10-6c189eb090d8", "sku": "FP-satsbord-tre-stalram"},
  ];
  const FACIT = { summa: 169448362, tecken: 1090 };

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
