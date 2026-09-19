#!/usr/bin/env python3
"""Bygger textskrivningen MEKANISKT ur rundans filer — inget skrivs för hand
i API-anropet. Se CLAUDE.md: filen är källan, men bara en diff mot den lagrade
texten bevisar att källan kom fram."""
import json, sys

rev = {"25405611":"1","3b5a67d9":"1","3dbd4f08":"1","48432e48":"1",
       "bde44d3c":"2","4f98b924":"2","dd4e1e06":"2","b4441140":"2"}
namn = {}
for l in open("namn.tsv"):
    c = l.rstrip("\n").split("\t")
    if len(c) >= 5: namn[c[0]] = {"id": c[1], "namn": c[3]}
slug = {l.split()[0]: l.split()[1] for l in open("slugs.txt") if l.strip()}
seo = {}
for l in open("seo.tsv"):
    c = l.rstrip("\n").split("\t")
    if len(c) == 3: seo[c[0]] = (c[1], c[2])
nyck = {}
for l in open("nyckelord.tsv"):
    c = l.rstrip("\n").split("\t")
    if len(c) >= 4: nyck[c[0]] = c[1:4]

ordning = ["25405611","3b5a67d9","3dbd4f08","48432e48","bde44d3c","4f98b924","dd4e1e06","b4441140"]
prods = []
for k in ordning:
    t, d = seo[k]
    prods.append({"product": {
        "id": namn[k]["id"],
        "revision": rev[k],
        "name": namn[k]["namn"],
        "slug": slug[k],
        "plainDescription": open(f"{k}.html", encoding="utf-8").read(),
        # ☠️ seoData ERSÄTTS I SIN HELHET. Två taggar, inte fem — butiken
        # härleder og:title/og:description/twitter:title ur dem. Importens
        # tyska og-taggar ska BORT, inte skrivas om.
        "seoData": {
            "tags": [
                {"type": "title", "children": t, "custom": False, "disabled": False},
                {"type": "meta", "props": {"name": "description", "content": d},
                 "children": "", "custom": True, "disabled": False},
            ],
            "settings": {"preventAutoRedirect": False, "keywords": [
                {"term": n, "isMain": i == 0, "origin": "USER"} for i, n in enumerate(nyck[k])]},
        },
    }})

par = int(sys.argv[1])
bit = prods[par*2:par*2+2]
print(json.dumps({"products": bit}, ensure_ascii=False, separators=(",", ":")))
