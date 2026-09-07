# -*- coding: utf-8 -*-
"""Steg 8: re-synkar SKU:n till den polerade sluggen.

☠️ SKU matchas på `wixVariantId`, ALDRIG på position. Två fält heter `sku`
   och betyder olika saker; positionsmatchning återinför den förväxling som
   lät prissynken skriva till ingenting i en månad.
☠️ `visible: false` skickas uttryckligen på produkten. En PATCH som bär
   `variantsInfo` utan det PUBLICERAR utkastet — tunneltältet `e4b000fa`
   gick ut på sajten 2026-08-29 av exakt den här skrivningen.
⚠️ Produktens `visible:false` speglas ned på varje variant. Det är ett
   normalförlopp att räkna med: Steg 13 sätter båda till true, och
   klart-kriteriet läser om varianten före publiceringen.
⚠️ `options` ekas verbatim tillsammans med `variantsInfo` — annars
   428 MISSING_OPTIONS_ON_UPDATE_VARIANTS.
"""
import json, os

HAR = os.path.dirname(os.path.abspath(__file__))
vid = json.load(open(os.path.join(HAR, "variantid.json"), encoding="utf-8"))

rader = [{"kort": k, "id": v["id"], "variantId": v["variantId"], "sku": v["sku"]}
         for k, v in vid.items()]

JS = """async () => {
  const SITE = "e6d27e90-4749-4720-9afe-0bbe91c1b3d3";
  const RADER = %s;
  const ut = {};
  for (const r of RADER) {
    const g = await wix.request({ scope: "site", siteId: SITE, method: "GET",
      url: "https://www.wixapis.com/stores/v3/products/" + r.id + "?fields=VARIANT_OPTION_CHOICE_NAMES" });
    const p = g.data.product;
    const vinfo = p.variantsInfo ?? {};
    const varianter = vinfo.variants ?? [];
    // ☠️ Matcha pa wixVariantId. Ett okant id ska INTE skrivas alls.
    if (!varianter.some((v) => v.id === r.variantId)) {
      ut[r.kort] = { GRIND: "OKANT VARIANT-ID", radensIdn: varianter.map((v) => v.id) };
      continue;
    }
    const fore = varianter.map((v) => v.sku ?? null);
    const nya = varianter.map((v) => (v.id === r.variantId ? { ...v, sku: r.sku } : v));
    const w = await wix.request({ scope: "site", siteId: SITE, method: "PATCH",
      url: "https://www.wixapis.com/stores/v3/products/" + r.id,
      body: { product: { revision: p.revision,
                         visible: false,                 // annars PUBLICERAS utkastet
                         options: p.options ?? [],
                         variantsInfo: { ...vinfo, variants: nya } } } });
    const np = w.data.product;
    const nv = np.variantsInfo?.variants ?? [];
    const trafF = nv.find((v) => v.id === r.variantId);
    ut[r.kort] = { fore, efter: nv.map((v) => v.sku ?? null),
                   stammer: (trafF?.sku ?? "") === r.sku,
                   synlig: np.visible, revision: np.revision };
  }
  return ut;
}"""

js = JS % json.dumps(rader, ensure_ascii=False)
open(os.path.join(HAR, "sku.js"), "w", encoding="utf-8").write(js)
print("sku.js  %d tecken, %d produkter" % (len(js), len(rader)))
