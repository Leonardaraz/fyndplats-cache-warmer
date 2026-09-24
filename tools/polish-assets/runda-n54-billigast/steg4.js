async function () {
  // Genererad av runda N54:s bygg-steg.py ur ids.tsv + sku.tsv — facit räknat ur filen, aldrig skrivet av.
  const SUMMA = function (s) {
    let h = 0;
    for (const c of s) h = (h * 31 + (c.codePointAt(0) & 0xFFFF)) % 1000000007;
    return h;
  };
  const PLAN = [
    {"kort": "f267fdc4", "pid": "f267fdc4-47a0-445b-8542-b776029f2371", "sku": "FP-vedstall-overdrag-200"},
    {"kort": "0773ceb6", "pid": "0773ceb6-0c35-4825-aaea-33c219e38d73", "sku": "FP-sensorsoptunna-50-rostfri"},
    {"kort": "0ad9c123", "pid": "0ad9c123-c9b4-4fd2-97eb-6013557a682e", "sku": "FP-golvspegel-helkropp-vit"},
    {"kort": "1884a543", "pid": "1884a543-6c2e-49f1-981a-f2fdb206cbfe", "sku": "FP-pedaltranare-armar-ben"},
    {"kort": "2f31a1d9", "pid": "2f31a1d9-5b41-4834-9a75-dd3a58814239", "sku": "FP-baglampa-marmorfot-vit"},
    {"kort": "383d8de2", "pid": "383d8de2-fa39-4205-acae-fe4e04469f43", "sku": "FP-fotpall-chenille-morkgra"},
    {"kort": "403dfd8d", "pid": "403dfd8d-a812-466f-9a24-beb4965b006d", "sku": "FP-elfyrhjuling-barn-bla"},
    {"kort": "50adf7ed", "pid": "50adf7ed-73e8-4050-9e4c-c6444c6f22ce", "sku": "FP-vaxtpiedestal-3-set-svart"},
    {"kort": "71341341", "pid": "71341341-db6b-44df-a6ac-98535547e94a", "sku": "FP-bokhylla-8-fack-vit"},
    {"kort": "916d2e9f", "pid": "916d2e9f-6a41-4a26-aaed-550dca7f8191", "sku": "FP-leksaksmotor-hjullastare"},
    {"kort": "b281ec33", "pid": "b281ec33-cadb-447c-8043-972e2fb6d33a", "sku": "FP-aktivitetstavla-vagg-larv"},
    {"kort": "d2fb42b1", "pid": "d2fb42b1-2a90-4d35-b716-e88232a01508", "sku": "FP-knastol-bjork-gra"},
    {"kort": "d444fbae", "pid": "d444fbae-a151-422f-8159-8d620461060a", "sku": "FP-konstfikus-fiol-150"},
    {"kort": "f3d0cde9", "pid": "f3d0cde9-3b5c-4631-8646-03236e43f491", "sku": "FP-darttavla-elektronisk-27"},
    {"kort": "fa0c30ac", "pid": "fa0c30ac-c917-46f3-8bc6-3592ad789d28", "sku": "FP-eukalyptusklot-2-set-65"},
  ];
  const FACIT = { summa: 138117297, tecken: 1083 };

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
