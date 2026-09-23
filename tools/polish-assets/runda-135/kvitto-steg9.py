# -*- coding: utf-8 -*-
"""Kvitterar Steg 9 mot FACITFILEN `steg9.json`, inte mot anropet.

☠️ PATCH-svaret kan inte skilja "sparat" från "raderat" — `media.itemsInfo`
   kommer bara med när man begär `fields=MEDIA_ITEMS_INFO`, och PATCH tar
   inte det. Kvittot är därför en SEPARAT läsning, och den räknar bilderna.
"""
import json
import os
import sys

HAR = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HAR)
import bilder as B                                               # noqa: E402


def fnv(s):
    x = 2166136261
    for c in s:
        x ^= ord(c)
        x = (x * 16777619) & 0xFFFFFFFF
    return x


def granska(wixsvar, facit):
    rader, jamforelser, fel = [], 0, 0
    for rad in wixsvar:
        pid = rad["pid"]
        vantade = facit[pid]["media"]["itemsInfo"]["items"]
        avvik = []
        jamforelser += 3 + 2 * len(vantade)
        if rad["antal"] != len(vantade):
            avvik.append(("antal", rad["antal"], len(vantade)))
        # ☠️ `visible` ska stå kvar false — en media-PATCH får inte publicera.
        if rad["visible"] is not False:
            avvik.append(("visible", rad["visible"], False))
        # ☠️ `media.main` sätts av Wix till FÖRSTA item:et. Är det Faktakortet
        #    blir kortet produktkortet i butiken.
        if rad["mainAr"] != vantade[0]["id"]:
            avvik.append(("main", rad["mainAr"], vantade[0]["id"]))
        if rad["mainAr"] == B.KORTFIL[pid]:
            avvik.append(("main", "FAKTAKORTET", "hjältebilden"))
        for i, v in enumerate(vantade):
            if i >= len(rad["rader"]):
                avvik.append(("plats %d" % (i + 1), "SAKNAS", v["id"][:20]))
                continue
            f = rad["rader"][i]
            if f["id"] != v["id"]:
                avvik.append(("plats %d id" % (i + 1), f["id"][:20], v["id"][:20]))
            if f["h"] != fnv(v["altText"]):
                avvik.append(("plats %d alt" % (i + 1), f["h"], fnv(v["altText"])))
        fel += len(avvik)
        rader.append("%-9s %d bilder  %s"
                     % (pid, rad["antal"], "OK" if not avvik else "☠️ " + repr(avvik)))
    return rader, jamforelser, fel


if __name__ == "__main__":
    wixsvar = json.loads(os.environ["WIXSVAR"])
    facit = json.load(open(os.path.join(HAR, "steg9.json"), encoding="utf-8"))
    rader, jamforelser, fel = granska(wixsvar, facit)
    for r in rader:
        print(r)
    print("\n%d produkter, %d jämförelser, %d avvikelser"
          % (len(rader), jamforelser, fel))
    sys.exit(1 if fel else 0)
