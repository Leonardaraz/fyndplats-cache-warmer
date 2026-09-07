# -*- coding: utf-8 -*-
"""Genererar Steg 9-anropet ur media-plan.json. Aldrig inline."""
import json, os
HAR = os.path.dirname(os.path.abspath(__file__))
plan = json.load(open(os.path.join(HAR, "media-plan.json"), encoding="utf-8"))
JS = """async () => {
  const SITE = "e6d27e90-4749-4720-9afe-0bbe91c1b3d3";
  const RADER = %s;
  const ut = [];
  for (const r of RADER) {
    const g = await wix.request({ scope: "site", siteId: SITE, method: "GET",
      url: "https://www.wixapis.com/stores/v3/products/" + r.id + "?fields=MEDIA_ITEMS_INFO" });
    const p = g.data.product;
    // ☠️ `id` for filer som REDAN ligger i Media Manager — aldrig `url`.
    //    `media.main` skickas inte: read-only i V3.
    const w = await wix.request({ scope: "site", siteId: SITE, method: "PATCH",
      url: "https://www.wixapis.com/stores/v3/products/" + r.id,
      body: { product: { revision: p.revision, visible: false,
                         media: { itemsInfo: { items: r.items } } },
              fieldMask: { paths: ["media", "visible"] } } });
    // Aterlast i ett EGET anrop — svaret pa en skrivning ar inget kvitto.
    const v = await wix.request({ scope: "site", siteId: SITE, method: "GET",
      url: "https://www.wixapis.com/stores/v3/products/" + r.id + "?fields=MEDIA_ITEMS_INFO" });
    const q = v.data.product;
    const items = q.media?.itemsInfo?.items ?? [];
    ut.push({ kort: r.kort, antal: items.length, synlig: q.visible,
              kortPaPlats3: (items[2]?.image?.url ?? "").includes(r.items[2].id),
              ritningSist: (items[items.length - 1]?.image?.url ?? "").includes(r.items[5].id),
              utanAlt: items.filter((i) => !i.image?.altText).length,
              utanUrl: items.filter((i) => !i.image?.url).length,
              revision: w.data.product.revision });
  }
  return ut;
}"""
js = JS % json.dumps(plan, ensure_ascii=False)
open(os.path.join(HAR, "media-anrop.js"), "w", encoding="utf-8").write(js)
print("media-anrop.js  %d tecken" % len(js))
