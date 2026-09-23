# -*- coding: utf-8 -*-
"""Bygger runda 135:s Steg 7-payload till en FIL, som sedan grindas.

☠️ FILEN ÄR HELA POÄNGEN. En sträng som skrivs direkt i ett JSON-anrop kan
   inte läsas av en grind innan den lämnar chatten, och API-svaret ekar
   tillbaka exakt det man skrev — det ser rätt ut för att det ÄR det man
   skrev. Uppmätt 9 fel mot 0 (2026-09-04).

☠️ `visible` SKICKAS INTE. Att skriva ut `visible: false` ser ut som det
   försiktiga valet men speglas ned på VARIANTEN, och en variant med
   `visible: false` betyder att sidan saknar köpbar variant den dag den
   publiceras (uppmätt runda 120).
"""
import json
import os
import sys

HAR = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, os.path.join(HAR, ".."))
sys.path.insert(0, HAR)
import texter as T                                               # noqa: E402
import matt as M                                                 # noqa: E402
import grind as GR                                               # noqa: E402


def payload(pid):
    return {
        "id": M.WIX[pid],
        "name": T.NAMN[pid],
        "slug": T.SLUG[pid],
        "plainDescription": T.bygg(pid),
        "seoData": {
            "tags": [
                {"type": "title", "children": T.TITEL[pid],
                 "custom": False, "disabled": False},
                {"type": "meta", "children": "",
                 "custom": False, "disabled": False,
                 "props": {"name": "description", "content": T.META[pid]}},
            ]
        },
    }


if __name__ == "__main__":
    fel = 0
    ut = {}
    for pid in T.NAMN:
        p = payload(pid)
        ut[pid] = p
        # Grinda det som faktiskt skickas, inte det som byggdes.
        f = GR.granska(pid)
        fel += len(f)
        for x in f:
            print("☠️ %s: %s" % (pid, x))
        # ☠️ Titeln får ALDRIG vara identisk med namnet — då renderar
        #    butiken mallen "{name} | Fyndplats" i stället, och en titel du
        #    räknat till 52 blir 64 live utan att API-svaret avslöjar det.
        if T.TITEL[pid] == T.NAMN[pid]:
            print("☠️ %s: TITEL == NAMN" % pid)
            fel += 1
        if len(T.NAMN[pid]) > 80:
            print("☠️ %s: NAMN %d tecken (hård Wix-gräns 80)" % (pid, len(T.NAMN[pid])))
            fel += 1
        if "visible" in p:
            print("☠️ %s: payloaden bär `visible`" % pid)
            fel += 1
    with open(os.path.join(HAR, "steg7.json"), "w", encoding="utf-8") as f:
        json.dump(ut, f, ensure_ascii=False, indent=1)
    print("steg7.json: %d produkter, %d fel" % (len(ut), fel))
    sys.exit(1 if fel else 0)
