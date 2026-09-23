async function () {
  // Genererad av runda N52:s bygg-steg.py ur ids.tsv + sku.tsv — facit räknat ur filen, aldrig skrivet av.
  const SUMMA = function (s) {
    let h = 0;
    for (const c of s) h = (h * 31 + (c.codePointAt(0) & 0xFFFF)) % 1000000007;
    return h;
  };
  const PLAN = [
    {"kort": "80aac077", "pid": "80aac077-d7e4-4d2f-ace1-09d24eb9c284", "sku": "FP-trehjuling-motorcykel-orange"},
    {"kort": "ac160e8e", "pid": "ac160e8e-1e83-4b72-8847-1a73de6c72ae", "sku": "FP-barnstaffli-rosa-tygkorgar"},
    {"kort": "eb7d67a4", "pid": "eb7d67a4-8e1e-4539-b484-437ab0e46847", "sku": "FP-snogubbe-hog-hatt-240"},
    {"kort": "a64af3a4", "pid": "a64af3a4-290c-4417-829d-96910ca5494d", "sku": "FP-dorrgrind-hund-klammontage"},
    {"kort": "0b66ea13", "pid": "0b66ea13-010b-49b3-b126-587c85a11ecd", "sku": "FP-tvattkorg-bambu-tre-korgar"},
    {"kort": "163cd19d", "pid": "163cd19d-d496-4dce-b587-adb01beefb62", "sku": "FP-leksaksdiskmaskin-tra"},
    {"kort": "2487e6bb", "pid": "2487e6bb-4412-4524-86b6-5266b4ec1e48", "sku": "FP-blomhylla-svart-krokar"},
    {"kort": "43d46471", "pid": "43d46471-c159-41d6-9c02-7c043b14c34c", "sku": "FP-skostall-gra-lada"},
    {"kort": "cb08e980", "pid": "cb08e980-5f24-43fd-a143-b98c61dadd29", "sku": "FP-ministepper-band-display"},
    {"kort": "5f833adb", "pid": "5f833adb-164d-4d79-803a-e9b9b0483927", "sku": "FP-spegelskap-gra-55"},
    {"kort": "b0f5b1a5", "pid": "b0f5b1a5-dd26-4c06-8566-446ba23712d0", "sku": "FP-sittpallar-plisse-2-pack"},
    {"kort": "e95efc20", "pid": "e95efc20-1c1c-497c-90fc-aa003b932df8", "sku": "FP-whiteboard-glas-90"},
    {"kort": "e4df6dc7", "pid": "e4df6dc7-91ab-40b7-bdff-3767c14c4a5e", "sku": "FP-vaggspegel-organisk-fura"},
    {"kort": "3edd4198", "pid": "3edd4198-2b09-44e8-9596-f6cb372ac9ca", "sku": "FP-trappkarra-sex-hjul"},
    {"kort": "855bae98", "pid": "855bae98-ef41-4c99-a326-2ebedd70bc72", "sku": "FP-cd-dvd-hylla-vit-140"},
  ];
  const FACIT = { summa: 537245730, tecken: 1082 };

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
