"""Steg 13-rättelse: skriver om plainDescription med rätt flikrubriker.

☠️ ensure_ascii=True — handeskapning gav "Fristlående" i galleri-PATCHen.
"""
import json
import sys

REV = {"441d2209": 6, "394de213": 6, "f4ed1264": 6, "3b38e191": 5,
       "51c43e67": 8, "c3bda64a": 5, "c88b5bbb": 8, "63a37524": 7}
WIX = {k: v["id"] for k, v in json.load(open("produkter.json")).items()}

pid = sys.argv[1]
d = json.load(open("skrivning.json"))[pid]
print(json.dumps({"product": {"id": WIX[pid], "revision": str(REV[pid]),
                              "visible": True,
                              "plainDescription": d["html"]}}, ensure_ascii=True))
