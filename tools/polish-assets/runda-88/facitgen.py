# -*- coding: utf-8 -*-
"""Facit: längd och hash på den SYNLIGA texten, per produkt.

☠️ Facit räknas ur den fil linten godkänt, aldrig ur något som typats för
   hand. Talet är det som gör en felskriven text omöjlig att publicera:
   grinden ligger INNE i skrivningen och i publiceringen.
"""
import json
import os
import re
import subprocess
import sys

HAR = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, os.path.dirname(HAR))
sys.path.insert(0, HAR)

# ☠️ Facit får inte räknas på en text linten inte godkänt.
p = subprocess.run([sys.executable, os.path.join(HAR, "lint.py")],
                   cwd=HAR, capture_output=True, text=True)
if p.returncode != 0:
    raise SystemExit("LINTEN FÄLLER — inget facit räknas:\n" + p.stdout + p.stderr)

import texter                                                        # noqa: E402


def hasha(s):
    h = 0
    for c in s:
        h = (h * 31 + ord(c)) % 1000000007
    return h


def synlig(h):
    return re.sub(r"\s+", " ", re.sub(r"<[^>]+>", " ", h)).strip()


facit, plan = {}, []
for pr in texter.PRODUKTER:
    h = texter.bygg(pr)
    s = synlig(h)
    facit[pr["kort"]] = {"synligLangd": len(s), "synligHash": hasha(s)}
    plan.append({"kort": pr["kort"], "slug": pr["slug"], "name": pr["name"],
                 "title": pr["title"], "meta": pr["meta"], "sku": pr["sku"],
                 "html": h, "langd": len(s), "hash": hasha(s)})

json.dump(facit, open(os.path.join(HAR, "facit.json"), "w", encoding="utf-8"),
          ensure_ascii=False, indent=1)
json.dump(plan, open(os.path.join(HAR, "skrivplan.json"), "w", encoding="utf-8"),
          ensure_ascii=False, indent=1)
for k, v in facit.items():
    print("%-9s %5d  %d" % (k, v["synligLangd"], v["synligHash"]))
print("facit.json + skrivplan.json skrivna, %d produkter" % len(plan))
