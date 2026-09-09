# -*- coding: utf-8 -*-
"""Runda 114 — genererar Steg 7- och Steg 9-nyttolasterna som färdig JS."""
import json
import os
import sys

HAR = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HAR)
import matt, media, texter as T                                   # noqa: E402

STEG7 = """async () => {
  const D = %s;
  const ut = [];
  for (const d of D) {
    const g = await wix.request({ scope: "site", method: "GET",
      url: "https://www.wixapis.com/stores/v3/products/" + d.id });
    const rev = g.data.product.revision;
    const r = await wix.request({ scope: "site", method: "PATCH",
      url: "https://www.wixapis.com/stores/v3/products/" + d.id,
      body: { product: { revision: rev, name: d.name, slug: d.slug,
                         brand: null, plainDescription: d.plainDescription,
                         seoData: d.seoData },
              fieldMask: ["name", "slug", "brand", "plainDescription", "seoData"] } });
    const p = r.data.product;
    ut.push({ k: d.k, rev: p.revision, namn: p.name === d.name,
              slug: p.slug === d.slug, brand: p.brand || null,
              textLangd: (p.plainDescription || "").length });
  }
  return ut;
}"""

STEG9 = """async () => {
  const M = %s;
  const ut = [];
  for (const m of M) {
    const g = await wix.request({ scope: "site", method: "GET",
      url: "https://www.wixapis.com/stores/v3/products/" + m.id });
    const rev = g.data.product.revision;
    await wix.request({ scope: "site", method: "PATCH",
      url: "https://www.wixapis.com/stores/v3/products/" + m.id,
      body: { product: { revision: rev,
                         media: { itemsInfo: { items: m.items } } },
              fieldMask: ["media.itemsInfo"] } });
    // ☠️ EGEN GET MED fields=MEDIA_ITEMS_INFO. PATCH-svaret bär aldrig
    //    itemsInfo, och en GET utan fältet svarar TOMT.
    const v = await wix.request({ scope: "site", method: "GET",
      url: "https://www.wixapis.com/stores/v3/products/" + m.id
           + "?fields=MEDIA_ITEMS_INFO" });
    const items = ((v.data.product.media || {}).itemsInfo || {}).items || [];
    ut.push({ k: m.k, skickade: m.items.length, laster: items.length,
              alt: items.filter((i) => i.altText).length,
              forsta: (items[0] || {}).id === m.items[0].id });
  }
  return ut;
}"""

if __name__ == "__main__":
    if media.kontroll():
        raise SystemExit("mediaplanen faller")
    d7 = []
    for k in matt.WIX:
        d = T.bygg(k)
        d7.append({"k": k, "id": d["id"], "name": d["namn"], "slug": d["slug"],
                   "plainDescription": d["html"],
                   "seoData": {"tags": [
                       {"type": "title", "children": d["titel"]},
                       {"type": "meta",
                        "props": {"name": "description", "content": d["meta"]}}]}})
    nycklar = list(matt.WIX)
    for i in range(0, len(nycklar), 3):
        del_ = [x for x in d7 if x["k"] in nycklar[i:i + 3]]
        fil = os.path.join(HAR, "js-%d.txt" % (i // 3 + 1))
        open(fil, "w", encoding="utf-8").write(
            STEG7 % json.dumps(del_, ensure_ascii=False))
        print("%s  %d produkter  %d byte" % (os.path.basename(fil), len(del_),
                                             os.path.getsize(fil)))
    dm = [{"k": k, "id": matt.WIX[k], "items": media.lista(k)} for k in matt.WIX]
    for i in range(0, len(dm), 5):
        fil = os.path.join(HAR, "js-media-%d.txt" % (i // 5 + 1))
        open(fil, "w", encoding="utf-8").write(
            STEG9 % json.dumps(dm[i:i + 5], ensure_ascii=False))
        print("%s  %d produkter  %d byte" % (os.path.basename(fil), len(dm[i:i + 5]),
                                             os.path.getsize(fil)))
