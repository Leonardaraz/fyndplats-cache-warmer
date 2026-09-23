# -*- coding: utf-8 -*-
"""Genererar bildskrivningen till Wix UR media-plan.json + kort-ids.json.

Samma skäl som jsgen.py: nyttolasten måste passera chatten, alltså flyttas
grinden in i anropet. Här är facit en hash över "id|altText" per produkt.
"""
import json
import os

HAR = os.path.dirname(os.path.abspath(__file__))
PLAN = json.load(open(os.path.join(HAR, "media-plan.json"), encoding="utf-8"))
KORT = json.load(open(os.path.join(HAR, "kort-ids.json"), encoding="utf-8"))


def hash_(t):
    h = 0
    for c in t:
        h = (h * 31 + ord(c)) % 1000000007
    return h


rader = []
facit = {}
for k, v in PLAN.items():
    poster = []
    for post in v["poster"]:
        mid = KORT[k] if post["kalla"] == "kort" else post["kalla"]
        poster.append({"id": mid, "altText": post["altText"]})
    sig = "\n".join("%s|%s" % (p["id"], p["altText"]) for p in poster)
    facit[k] = {"n": len(poster), "H": hash_(sig)}
    rader.append("{k:%s,id:%s,n:%d,H:%d,m:%s}"
                 % (json.dumps(k), json.dumps(v["id"]), len(poster), hash_(sig),
                    json.dumps(poster, ensure_ascii=False)))

json.dump(facit, open(os.path.join(HAR, "media-facit.json"), "w"),
          ensure_ascii=False, indent=1)
print("const M=[\n" + ",\n".join(rader) + "\n];")
