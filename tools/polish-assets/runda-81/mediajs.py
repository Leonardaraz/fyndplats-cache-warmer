# -*- coding: utf-8 -*-
"""Runda 81, Steg 11 — bygger JS för mediaskrivningen.

☠️ `fieldMask: ["media"]` är det som gör skrivningen ofarlig: synlighet,
   varianter, priser och texter rörs inte. `visible: false` skickas ändå med
   i kroppen — inte för att den skriver något, utan för att en framtida
   läsare av koden ska se att utkastläget är AVSETT, inte en slump.

☠️ PATCH-EKOT UTELÄMNAR MEDIA. Läsningen tillbaka måste vara ett EGET anrop
   med `?fields=MEDIA_ITEMS_INFO`, annars är kvittot tomt och ser rätt ut.
"""
import json, os

HAR = os.path.dirname(os.path.abspath(__file__))
PLAN = json.load(open(os.path.join(HAR, "media-plan.json"), encoding="utf-8"))
IDS = {
    "6307893c": "6307893c-03b4-40be-8ffe-e4ab06e0a575",
    "46d2c85a": "46d2c85a-d2e1-4ef7-98d3-d96d2a436237",
    "4401be4f": "4401be4f-1d5b-44db-a1ba-f1fa62b7064a",
    "8b66533f": "8b66533f-0a91-4c55-b60d-d9676c25367b",
    "65c84a9b": "65c84a9b-6ff7-4dc2-867b-cfaf6ae803b3",
    "bdb600fe": "bdb600fe-6d04-4af1-87b9-c28b375b5a60",
    "cce86277": "cce86277-05a1-47c9-98bb-606f24b7c1e6",
    "e39db7dd": "e39db7dd-055d-4958-b618-8da78fbab313",
}
KORT = json.load(open(os.path.join(HAR, "kort-ids.json"), encoding="utf-8"))

data = {k: {"id": IDS[k], "kort": KORT[k], "items": PLAN[k]} for k in IDS}

js = """const P = %s;
const ut = [];
for (const [k, p] of Object.entries(P)) {
  const g = await wix.request({ method: 'GET',
    url: '/stores/v3/products/' + p.id });
  const rev = g.data.product.revision;
  await wix.request({ method: 'PATCH',
    url: '/stores/v3/products/' + p.id,
    body: { product: { revision: rev, visible: false,
                       media: { itemsInfo: { items: p.items } } },
            fieldMask: ['media'] } });
  // ☠️ EGET anrop — PATCH-ekot bär ingen media alls.
  const r = await wix.request({ method: 'GET',
    url: '/stores/v3/products/' + p.id + '?fields=MEDIA_ITEMS_INFO' });
  const pr = r.data.product;
  const it = (pr.media && pr.media.itemsInfo && pr.media.itemsInfo.items) || [];
  const namn = it.map(x => (x.image && x.image.id) || x.id || '');
  const alt = it.map(x => (x.image && x.image.altText) || x.altText || '');
  ut.push({ k,
    antal: it.length,
    vantat: p.items.length,
    kortPos: namn.findIndex(n => String(n).includes(p.kort.split('_').pop().split('~')[0])) + 1,
    utanAlt: alt.filter(a => !a).length,
    synlig: pr.visible,
    rev: pr.revision });
}
return ut;
""" % json.dumps(data, ensure_ascii=False, indent=1)

open(os.path.join(HAR, "media-skrivning.js"), "w", encoding="utf-8").write(js)
print("media-skrivning.js:", len(js), "tecken")
