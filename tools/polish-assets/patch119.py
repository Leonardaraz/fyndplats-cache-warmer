"""Runda 119: bara flikrättningen. Sökorden är redan svenska — uppmätt."""
import json
import sys

REV = {"ad390a36": 7, "dac7a904": 7, "c86ff1a6": 7, "5d1696db": 7,
       "6cf7cfcf": 6, "36526a8d": 6, "9e5e788c": 5, "d8bbbdde": 7,
       "e0fed2c9": 6}
pid = sys.argv[1]
d = json.load(open("runda-119/skrivning.json"))[pid]
print(json.dumps({"product": {"id": d["id"], "revision": str(REV[pid]),
                              "visible": True,
                              "plainDescription": d["html"]}}, ensure_ascii=True))
