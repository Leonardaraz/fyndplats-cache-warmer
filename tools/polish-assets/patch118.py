"""Bygger PATCH-kroppen för runda 118: flikrättning + svenska fokusord.

⚠️ `seoData` skickas med BARA `settings`, inte med `tags`. Om Wix behandlar
   det som en helersättning nollas titeln och meta-beskrivningen — därför
   mäts formen först på `ca20d60e`, rundans enda OSYNLIGA utkast.
"""
import json
import sys

REV = {"764a3efc": 5, "820d076b": 5, "15d6fcef": 6, "0fd65541": 6,
       "2e292a70": 5, "a4ee97c1": 5, "8a73caf4": 6, "fcb86875": 5,
       "ca20d60e": 5}
OSYNLIG = {"ca20d60e"}

pid = sys.argv[1]
d = json.load(open("runda-118/skrivning.json"))[pid]
kropp = {"product": {
    "id": d["id"],
    "revision": str(REV[pid]),
    "visible": pid not in OSYNLIG,
    "plainDescription": d["html"],
    "seoData": {"settings": {"preventAutoRedirect": False, "keywords": [
        {"term": t, "isMain": i == 0, "origin": "USER"}
        for i, t in enumerate(d["sokord"])]}},
}}
print(json.dumps(kropp, ensure_ascii=True))
