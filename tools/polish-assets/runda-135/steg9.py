# -*- coding: utf-8 -*-
"""Bygger runda 135:s Steg 9-payload till en FIL, som sedan grindas.

☠️ `media.itemsInfo.items` ERSÄTTS I SIN HELHET vid varje PATCH. Därav:
   - varje item måste bära `altText`, även de vi inte rör
   - `altText` sätts på ITEM-nivå, inte på `image.altText` (som är readOnly)
   - fil-id skickas som `id`, ALDRIG som `url` — `url` betyder "extern
     adress" för V3, och en wixstatic-adress importeras då om till en NY fil
   - `media.main` skickas INTE (readOnly; skickar man den ignoreras hela
     `media`-objektet TYST med 200 OK)
"""
import json
import os
import sys

HAR = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, os.path.join(HAR, ".."))
sys.path.insert(0, HAR)
import bilder as B                                               # noqa: E402
import matt as M                                                 # noqa: E402


def payload(pid):
    items = []
    for nyckel in B.ORDNING[pid]:
        filid = (B.KORTFIL[pid] if nyckel == "kort"
                 else B.GALLERI[pid][nyckel - 1])
        items.append({"id": filid, "altText": B.ALT[pid][nyckel]})
    return {"id": M.WIX[pid], "media": {"itemsInfo": {"items": items}}}


if __name__ == "__main__":
    fel = B.altfel()
    ut = {}
    for pid in B.PRODUKTER:
        p = payload(pid)
        ut[pid] = p
        # ☠️ Ett fil-id får förekomma EN gång — en dubblett hade gett kunden
        #    samma bild två gånger i galleriet.
        ids = [it["id"] for it in p["media"]["itemsInfo"]["items"]]
        if len(set(ids)) != len(ids):
            fel.append("%s: samma fil-id två gånger i galleriet" % pid)
        if any("altText" not in it or not it["altText"]
               for it in p["media"]["itemsInfo"]["items"]):
            fel.append("%s: ett item saknar altText" % pid)
        if "main" in p["media"]:
            fel.append("%s: payloaden bär media.main" % pid)
        # ☠️ Kortet får aldrig ligga först — då blir det produktkortet.
        if ids[0] == B.KORTFIL[pid]:
            fel.append("%s: Faktakortet ligger på plats 1" % pid)
        if B.KORTFIL[pid] not in ids:
            fel.append("%s: Faktakortet saknas i galleriet" % pid)
    for x in fel:
        print("☠️", x)
    with open(os.path.join(HAR, "steg9.json"), "w", encoding="utf-8") as f:
        json.dump(ut, f, ensure_ascii=False, indent=1)
    print("steg9.json: %d produkter, %d bilder, %d fel"
          % (len(ut), sum(len(p["media"]["itemsInfo"]["items"])
                          for p in ut.values()), len(fel)))
    sys.exit(1 if fel else 0)
