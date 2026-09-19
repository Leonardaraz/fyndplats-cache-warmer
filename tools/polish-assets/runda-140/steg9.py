# -*- coding: utf-8 -*-
"""Runda 140 Steg 9 — bygger mediaskrivningen till en FIL, som sedan grindas.

GALLERIORDNING (husets konvention sedan runda 139):
    hjälte · miljö · FAKTAKORT · detalj · detalj · måttritning
Måttritningen flyttas alltså SIST; kortet läggs på plats 3, där det syns i
miniatyrraden utan att ta hjältens eller delningsbildens plats.

☠️ `media.main` SKICKAS ALDRIG. Den är read-only i V3, och att skicka den ger
   en extra omimport av huvudbilden (CLAUDE.md, 2026-08-28).

☠️ VARJE POST BÄR `id`, ALDRIG `url`. En wixstatic-adress skickad som `url`
   läses av V3 som "en extern media-URL" och OMIMPORTERAS till en ny fil —
   det var mekanismen bakom 591 kopior av 595 filer.

☠️ FÄLTMASKEN ÄR BARA `media`. Synlighet, varianter, priser och texter rörs
   inte; ett utkast kan inte råka publiceras av den här skrivningen.

☠️ TVÅ LEVERANTÖRSBILDER GÅR BORT, båda på `07ac9918`: bild 4 bar tysk
   marknadsföringstext och bild 5 påstod "PVC MATERIALS · Water-resistant"
   mot ett spec-block som säger plysch, skumstoppning och naturträ.

☠️ `2ba6baf0`s MÅTTRITNING ÄR EN NY FIL — den beskurna. Det gamla id:t får
   inte följa med, för det är den som bär HINWEIS-rutan.
"""
import json
import os
import sys

HAR = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, os.path.join(HAR, ".."))
sys.path.insert(0, HAR)
import matt as M                                                 # noqa: E402
import alttexter as A                                            # noqa: E402
import altgrind as AG                                            # noqa: E402

BILDER = {k: v for k, v in
          json.load(open(os.path.join(HAR, "bilder.json"), encoding="utf-8")).items()
          if not k.startswith("_")}
NYA = json.load(open(os.path.join(HAR, "nya-filer.json"), encoding="utf-8"))
KORT = NYA["kort"]
KAP = NYA["kap"]

# Revision EFTER Steg 8 och benfärgsrättningen — mätt ur varje PATCH-svar.
REV = {
    "01fcdf1d": "3", "bb3cd4ed": "3", "881540a6": "4", "5b8162d1": "3",
    "1835c144": "5", "9ee2fa6e": "4", "c11948ac": "4", "c9ccf5a3": "3",
    "4c5d4687": "4", "68f8cae9": "3", "ee19a8c8": "3", "2ba6baf0": "4",
    "22c7de56": "4", "07ac9918": "3",
}

# Leverantörsbilder som tas bort, angivna som INDEX i `bilder.json`.
BORT = {"07ac9918": [3, 4]}
# Måttritningen ersätts av en beskuren fil.
ERSATT_RITNING = {"2ba6baf0": KAP["2ba6baf0-3"]}

FORBJUDNA_FALT = ("visible", "variantsInfo", "price", "priceData",
                  "costAndProfitData", "name", "slug", "plainDescription",
                  "seoData", "options", "ribbon", "main")


def ordning(pid):
    """Fil-id i den NYA galleriordningen."""
    b = BILDER[pid]
    bort = set(BORT.get(pid, ()))
    ritning = ERSATT_RITNING.get(pid, b[2])
    ut = [b[0], b[1], KORT[pid]]
    ut += [b[i] for i in (3, 4) if i not in bort]
    ut.append(ritning)
    return ut


def payload(pid):
    filer, alt = ordning(pid), A.ALT[pid]
    if len(filer) != len(alt):
        raise SystemExit("%s: %d filer men %d alt-texter" % (pid, len(filer), len(alt)))
    return {
        "product": {
            "revision": REV[pid],
            "media": {"itemsInfo": {"items": [
                {"id": f, "altText": a} for f, a in zip(filer, alt)]}},
        },
        "fieldMask": ["media"],
    }


def grind():
    fel = list(AG.sjalvtest()) + list(AG.kor())
    sedda = {}
    for pid in sorted(BILDER):
        p = payload(pid)
        prod = p["product"]
        for f in FORBJUDNA_FALT:
            if f in prod or f in prod.get("media", {}):
                fel.append("%s: FÖRBJUDET FÄLT %r i payloaden" % (pid, f))
        ids = [i["id"] for i in prod["media"]["itemsInfo"]["items"]]
        if len(set(ids)) != len(ids):
            fel.append("%s: samma fil två gånger i galleriet" % pid)
        if KORT[pid] not in ids:
            fel.append("%s: kortet saknas i galleriet" % pid)
        if ids[2] != KORT[pid]:
            fel.append("%s: kortet ligger inte på plats 3" % pid)
        # ☠️ Den kapade filen SKA ersätta originalet, inte ligga bredvid det.
        if pid in ERSATT_RITNING and BILDER[pid][2] in ids:
            fel.append("%s: den OKAPADE måttritningen ligger kvar" % pid)
        for i in BORT.get(pid, ()):
            if BILDER[pid][i] in ids:
                fel.append("%s: bild %d skulle tagits bort men ligger kvar"
                           % (pid, i + 1))
        for f in ids:
            if f in sedda and sedda[f] != pid:
                fel.append("%s och %s delar fil %s" % (pid, sedda[f], f))
            sedda[f] = pid
    return fel


if __name__ == "__main__":
    fel = grind()
    for f in fel:
        print("☠️", f)
    ut = {}
    for pid in sorted(BILDER):
        p = payload(pid)
        ut[pid] = p
        n = len(p["product"]["media"]["itemsInfo"]["items"])
        print("%s  %s  rev=%s  %d bilder" % (pid, M.ID[pid], REV[pid], n))
    json.dump(ut, open(os.path.join(HAR, "steg9.json"), "w", encoding="utf-8"),
              ensure_ascii=False, indent=1)
    tot = sum(len(v["product"]["media"]["itemsInfo"]["items"]) for v in ut.values())
    print("\n%d produkter, %d bilder totalt, %d fel" % (len(ut), tot, len(fel)))
    sys.exit(1 if fel else 0)
