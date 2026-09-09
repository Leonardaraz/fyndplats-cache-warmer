# -*- coding: utf-8 -*-
"""Runda 113 — genererar facit.json (Steg 7-nyttolasten) för alla åtta."""
import json, sys, os
sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), ".."))
import matt, texter as T

ut = {}
for k in matt.WIX:
    d = T.bygg(k)
    ut[k] = {"id": d["id"], "name": d["namn"], "slug": d["slug"],
             "sku": d["sku"], "plainDescription": d["html"],
             "seoData": {"tags": [
                 {"type": "title", "children": d["titel"]},
                 {"type": "meta", "props": {"name": "description", "content": d["meta"]}}]},
             "sokord": d["sokord"]}
json.dump(ut, open("facit.json", "w"), ensure_ascii=False, indent=1)
print("facit.json  %d produkter  %d byte" % (len(ut), os.path.getsize("facit.json")))
