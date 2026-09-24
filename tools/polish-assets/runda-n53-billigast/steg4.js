async function () {
  // Genererad av runda N53:s bygg-steg.py ur ids.tsv + sku.tsv — facit räknat ur filen, aldrig skrivet av.
  const SUMMA = function (s) {
    let h = 0;
    for (const c of s) h = (h * 31 + (c.codePointAt(0) & 0xFFFF)) % 1000000007;
    return h;
  };
  const PLAN = [
    {"kort": "1e139971", "pid": "1e139971-9d92-468b-abc5-1e47e087aaae", "sku": "FP-gavagn-3-i-1-tra"},
    {"kort": "3dc622f9", "pid": "3dc622f9-665e-4e12-a55b-2e69ad330b8a", "sku": "FP-kladstall-bambu-skohylla"},
    {"kort": "4d7268c1", "pid": "4d7268c1-4c06-4dcd-8c71-82666b6d1d47", "sku": "FP-sidobord-marmorlook-guld"},
    {"kort": "560edb9f", "pid": "560edb9f-5d79-4bc9-9f41-fa2f95579378", "sku": "FP-konstbambu-140-svart-kruka"},
    {"kort": "aa7637fb", "pid": "aa7637fb-e145-46bc-9c9a-c0b278a68434", "sku": "FP-vedstall-brasredskap-svart"},
    {"kort": "bd664764", "pid": "bd664764-2bb5-48b2-bd9d-1002f54757f2", "sku": "FP-bokhylla-smal-vit-lador"},
    {"kort": "eca2fa1e", "pid": "eca2fa1e-8c64-43e5-b561-c367c4dc15b2", "sku": "FP-sittbank-furu-svart-102"},
    {"kort": "1ae506e3", "pid": "1ae506e3-a1e6-4d5c-9e95-39762664e253", "sku": "FP-byra-barn-rosa-tre-lador"},
    {"kort": "85b1a737", "pid": "85b1a737-f5b2-4a36-afc4-4ebd1325483e", "sku": "FP-leksaksmotor-traktor"},
    {"kort": "a778baf1", "pid": "a778baf1-f987-40f3-8069-a35506c266bc", "sku": "FP-sensorsoptunna-30-rostfri"},
    {"kort": "b398fe7b", "pid": "b398fe7b-ff80-4911-a267-61ae785d1ce1", "sku": "FP-stegbrada-tre-hojder"},
    {"kort": "db1f6697", "pid": "db1f6697-5cc7-4431-866e-7f7ae0c28a01", "sku": "FP-skrivbord-hopfallbart-vit"},
    {"kort": "12704344", "pid": "12704344-038f-4a8e-8a3d-03d75c84693d", "sku": "FP-konstkaktus-95-tre-stammar"},
    {"kort": "2af51f93", "pid": "2af51f93-6175-437a-acf5-9701c3bd1eae", "sku": "FP-gavagn-tra-xylofon"},
    {"kort": "d8af896a", "pid": "d8af896a-dd56-4a46-808a-c72f5f8187bb", "sku": "FP-skjutdorrsbeslag-vikdorr-122"},
  ];
  const FACIT = { summa: 671717770, tecken: 1097 };

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
