async function () {
  // Genererad av runda N51:s bygg-steg.py ur ids.tsv + sku.tsv — facit räknat ur filen, aldrig skrivet av.
  const SUMMA = function (s) {
    let h = 0;
    for (const c of s) h = (h * 31 + (c.codePointAt(0) & 0xFFFF)) % 1000000007;
    return h;
  };
  const PLAN = [
    {"kort": "279635e9", "pid": "279635e9-ff6b-4092-a4ee-d597b3dbab25", "sku": "FP-spokbrudgum-halloween-189"},
    {"kort": "3068a60b", "pid": "3068a60b-8cce-4dab-9ee0-56d350b473da", "sku": "FP-sittbank-forvaring-beige"},
    {"kort": "3ae559f2", "pid": "3ae559f2-3ed2-4021-be74-738d9825102e", "sku": "FP-badrumsskap-smalt-vitt"},
    {"kort": "5646de67", "pid": "5646de67-0a1e-4662-a591-25a3f070d799", "sku": "FP-pedaltranare-display"},
    {"kort": "5a65a0ea", "pid": "5a65a0ea-b38d-4592-856b-a9249847e40f", "sku": "FP-rund-pall-sherpa-38"},
    {"kort": "73457d36", "pid": "73457d36-b7f7-45ac-892a-c7342ee37f0d", "sku": "FP-blomstall-sju-nivaer"},
    {"kort": "7d09edd9", "pid": "7d09edd9-3cc2-45b2-98d9-76de8502f52c", "sku": "FP-vagghylla-kuber-vit"},
    {"kort": "90c066c0", "pid": "90c066c0-5d13-41a2-a3a7-8c847dc58ac2", "sku": "FP-datorbord-svart-80"},
    {"kort": "9b3b4255", "pid": "9b3b4255-3ea1-43f4-ad50-3e77ede70f1e", "sku": "FP-pianobank-forvaring-svart"},
    {"kort": "aab0a1e5", "pid": "aab0a1e5-8edb-43a8-acf4-4c04052d3183", "sku": "FP-snogubbe-uppblasbar-240"},
    {"kort": "c7424c37", "pid": "c7424c37-16c3-40a1-a6c9-11d33c8aa595", "sku": "FP-barnstaffli-pappersrulle"},
    {"kort": "ce77f5c4", "pid": "ce77f5c4-7d85-4d24-80c4-bd670362ccc7", "sku": "FP-vagghylla-metall-nio-fack"},
    {"kort": "d227861d", "pid": "d227861d-bb87-4fb9-a19d-73dc40154ac8", "sku": "FP-fagelmatare-stativ"},
    {"kort": "db607b53", "pid": "db607b53-8780-4cfa-8795-3b03f7299edc", "sku": "FP-rutschkana-raket-bla"},
    {"kort": "7a70db2c", "pid": "7a70db2c-a5c4-4a80-9c23-d3f36b95bfa6", "sku": "FP-fotbollsbord-22-spelare"},
  ];
  const FACIT = { summa: 903430506, tecken: 1074 };

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
