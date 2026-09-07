# -*- coding: utf-8 -*-
"""Runda 91 — facit över den SYNLIGA texten.

Hashen räknas på taggfri, whitespace-normaliserad text — det kunden läser.
Den överlever Wix omskrivning av <strong> till <span style="font-weight:700">,
vilket en rå strängjämförelse inte gör.

☠️ Samma hashfunktion måste finnas i JavaScript. `h = (h*31 + kodpunkt) % p`
   med heltalsaritmetik ger samma tal i båda språken så länge p är liten nog
   att h*31 + kodpunkt ryms i en double utan avrundning — 1e9 är det.
"""
import json
import re

import texter

P = 1000000007


def synlig(h):
    t = re.sub(r"<[^>]+>", " ", h)
    return re.sub(r"\s+", " ", t).strip()


def hasha(t):
    h = 0
    for ch in t:
        h = (h * 31 + ord(ch)) % P
    return h


facit, plan = {}, {}
for pid, p in texter.P.items():
    h = texter.html(pid)
    s = synlig(h)
    facit[pid] = {"langd": len(s), "hash": hasha(s), "htmlLangd": len(h)}
    plan[pid] = {
        "id": p["id"], "namn": p["namn"], "slug": p["slug"], "titel": p["titel"],
        "meta": p["meta"], "sokord": p["sokord"], "sku": p["sku"], "html": h,
        "facitLangd": len(s), "facitHash": hasha(s),
    }

json.dump(facit, open("facit.json", "w"), ensure_ascii=False, indent=1)
json.dump(plan, open("skrivplan.json", "w"), ensure_ascii=False, indent=1)
for pid, f in facit.items():
    print("%-9s synlig %4d  hash %10d  html %4d" % (pid, f["langd"], f["hash"], f["htmlLangd"]))
