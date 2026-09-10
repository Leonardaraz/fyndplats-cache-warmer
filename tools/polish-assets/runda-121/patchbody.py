"""Steg 7-kropp per produkt. Utkastet förblir utkast — `visible: false`.

☠️ `seoData` skickas med BÅDE `tags` och `settings`. Uppmätt 2026-09-10 i
   runda 120: en `seoData` med bara `settings` BEVARAR `tags`. Här skrivs båda
   med flit, eftersom titel och meta ska bytas.
"""
import json
import sys

produkter = json.load(open("produkter.json"))
d = json.load(open("skrivning.json"))
pid = sys.argv[1]
p, v = produkter[pid], d[pid]
print(json.dumps({"product": {
    "id": p["id"],
    "revision": str(p["rev"]),
    "visible": False,
    "name": v["namn"],
    "slug": v["slug"],
    "plainDescription": v["html"],
    "seoData": {
        "tags": [
            {"type": "title", "children": v["titel"], "custom": False,
             "disabled": False},
            {"type": "meta", "props": {"name": "description",
                                       "content": v["meta"]},
             "children": "", "custom": True, "disabled": False},
        ],
        "settings": {"preventAutoRedirect": False, "keywords": [
            {"term": t, "isMain": i == 0, "origin": "USER"}
            for i, t in enumerate(v["sokord"])]},
    },
}}, ensure_ascii=True))
