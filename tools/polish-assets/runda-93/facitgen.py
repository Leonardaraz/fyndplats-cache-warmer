# -*- coding: utf-8 -*-
"""Runda 93 — facit för återläsningen.

☠️ NYTT RISKLÄGE: ExecuteWixAPI svarar 403 hela den här rundan, så kroppen
   kan inte byggas i JS inne i anropet utan måste KLISTRAS in i verktygets
   `body`. Det är precis den transkriberingsrisk hashen finns för. Skriv,
   PATCHa, läs tillbaka, jämför hash — ingen produkt räknas som skriven
   förrän hashen stämmer.
"""
import json, os, re, sys
HAR = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HAR)
import texter                                                        # noqa: E402


def synlig(h):
    return re.sub(r"\s+", " ", re.sub(r"<[^>]+>", " ", h)).strip()


def hasha(s):
    h = 0
    for ch in s:
        h = (h * 31 + ord(ch)) % 1000000007
    return h


if __name__ == "__main__":
    ut = {}
    for pid in texter.PRODUKTER:
        html = texter.beskrivning(pid)
        v = synlig(html)
        ut[pid] = {
            "farg": texter.FARG[pid],
            "namn": texter.namn(pid),
            "slug": texter.SLUGG[pid],
            "seoTitel": texter.seo_titel(pid),
            "seoBeskrivning": texter.seo_beskrivning(pid),
            "sokord": texter.SOKORD,
            "sku": texter.SKU[pid],
            "htmlTecken": len(html),
            "synligaTecken": len(v),
            "hash": hasha(v),
        }
        with open(os.path.join(HAR, "html-%s.html" % pid), "w", encoding="utf-8") as f:
            f.write(html)
    with open(os.path.join(HAR, "facit.json"), "w", encoding="utf-8") as f:
        json.dump(ut, f, ensure_ascii=False, indent=1)
    for pid, d in ut.items():
        print("%s %-9s synliga=%4d hash=%10d  sku=%s"
              % (pid, d["farg"], d["synligaTecken"], d["hash"], d["sku"]))
        print("   namn: %s" % d["namn"])
        print("   slug: %s" % d["slug"])
