# -*- coding: utf-8 -*-
"""Bygger runda 136:s Steg 9-payload till en FIL, som sedan grindas.

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
    items = [{"id": B.filid(pid, n), "altText": B.ALT[pid][n]}
             for n in B.ORDNING[pid]]
    return {"id": M.WIX[pid], "media": {"itemsInfo": {"items": items}}}


if __name__ == "__main__":
    fel = B.altfel()
    ut = {}
    strukna = set()
    for pid, poss in B.BORT.items():
        for p in poss:
            strukna.add(B.GALLERI[pid][p - 1])
    for pid in B.PRODUKTER:
        p = payload(pid)
        ut[pid] = p
        ids = [it["id"] for it in p["media"]["itemsInfo"]["items"]]
        # ☠️ Ett fil-id får förekomma EN gång — en dubblett hade gett kunden
        #    samma bild två gånger i galleriet.
        if len(set(ids)) != len(ids):
            fel.append("%s: samma fil-id två gånger i galleriet" % pid)
        if any(not it.get("altText") for it in p["media"]["itemsInfo"]["items"]):
            fel.append("%s: ett item saknar altText" % pid)
        if "main" in p["media"]:
            fel.append("%s: payloaden bär media.main" % pid)
        # ☠️ Kortet får aldrig ligga först — då blir det produktkortet.
        if ids[0] == B.KORTFIL[pid]:
            fel.append("%s: Faktakortet ligger på plats 1" % pid)
        if B.KORTFIL[pid] not in ids:
            fel.append("%s: Faktakortet saknas i galleriet" % pid)
        # ☠️ EN STRUKEN LEVERANTÖRSREKLAM FÅR INTE SMYGA IN via ett fil-id.
        for f in ids:
            if f in strukna:
                fel.append("%s: en STRUKEN bild ligger i payloaden (%s)"
                           % (pid, f[:20]))
        # ☠️ OCH DEN BESKURNA VERSIONEN MÅSTE ERSÄTTA ORIGINALET, inte ligga
        #    bredvid det. Originalet bär den tyska textrutan.
        for (p2, pos), ny in B.BESKURNA.items():
            if p2 != pid:
                continue
            org = B.GALLERI[pid][pos - 1]
            if org in ids:
                fel.append("%s: ORIGINALET till den beskurna bilden ligger "
                           "kvar (%s)" % (pid, org[:20]))
            if B.BESKUREN_FIL[(pid, pos)] not in ids:
                fel.append("%s: den beskurna bilden saknas i galleriet" % pid)
    for x in fel:
        print("☠️", x)
    with open(os.path.join(HAR, "steg9.json"), "w", encoding="utf-8") as f:
        json.dump(ut, f, ensure_ascii=False, indent=1)
    print("steg9.json: %d produkter, %d bilder, %d fel"
          % (len(ut), sum(len(p["media"]["itemsInfo"]["items"])
                          for p in ut.values()), len(fel)))
    sys.exit(1 if fel else 0)
