# -*- coding: utf-8 -*-
"""Kvitterar Steg 7 mot FACITFILEN, inte mot det jag skrev i anropet.

☠️ FACIT ÄR `steg7.json`. Jämför man mot sin egen inmatning bevisar kvittot
   bara att man skrev det man skrev — uppgift #485 kostade en runda på det.

☠️ OCH JÄMFÖRELSEN MÅSTE GÅ MOT `G.wix_normalisera(källan)`. En återläsning
   av `plainDescription` är INTE strängen som skickades: Wix lägger till
   `<p>` i varje `<li>`, byter `<strong>` mot `<span style="font-weight:
   700">` och sätter `target="_self"` på varje länk. Rått jämfört ger åtta
   avvikelser på åtta korrekta produkter — ett larm som lär en att sluta läsa.

Hashen räknas med FNV-1a över UTF-16-kodenheter, alltså samma aritmetik i
JavaScript (`charCodeAt` + `Math.imul`) och Python (`ord`, allt är BMP).
Ett längdtal ensamt duger inte: tecknen kan vara fel medan talet stämmer.
"""
import json
import os
import sys

HAR = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, os.path.join(HAR, ".."))
import grindar as G                                              # noqa: E402


def fnv(s):
    x = 2166136261
    for c in s:
        x ^= ord(c)
        x = (x * 16777619) & 0xFFFFFFFF
    return x


def taggar(p):
    t = p["seoData"]["tags"]
    titel = [x for x in t if x["type"] == "title"][0]["children"]
    meta = [x for x in t
            if x.get("props", {}).get("name") == "description"][0]["props"]["content"]
    return titel, meta


def granska(wixsvar, facit):
    """Returnerar (rader, antal jämförelser, avvikelser)."""
    rader, jamforelser, fel = [], 0, 0
    for rad in wixsvar:
        pid = rad["pid"]
        f = facit[pid]
        titel, meta = taggar(f)
        lagrad = G.wix_normalisera(f["plainDescription"])
        kontroller = [
            ("slug", rad["slug"], f["slug"]),
            ("namn", rad["h_namn"], fnv(f["name"])),
            ("beskrivning", rad["h_beskr"], fnv(lagrad)),
            ("beskr-längd", rad["len_beskr"], len(lagrad)),
            ("titel", rad["h_titel"], fnv(titel)),
            ("meta", rad["h_meta"], fnv(meta)),
            # ☠️ `visible` ska stå kvar FALSE. Steg 7 skickar den inte, och
            #    en PATCH som satt den hade slagit ner varianten (runda 120).
            ("visible", rad["visible"], False),
        ]
        jamforelser += len(kontroller)
        avvik = [(n, a, b) for n, a, b in kontroller if a != b]
        fel += len(avvik)
        rader.append("%-9s %-32s %s"
                     % (pid, rad["slug"],
                        "OK" if not avvik else "☠️ " + repr(avvik)))
    return rader, jamforelser, fel


if __name__ == "__main__":
    wixsvar = json.loads(os.environ["WIXSVAR"])
    facit = json.load(open(os.path.join(HAR, "steg7.json"), encoding="utf-8"))
    rader, jamforelser, fel = granska(wixsvar, facit)
    for r in rader:
        print(r)
    print("\n%d produkter, %d jämförelser, %d avvikelser"
          % (len(rader), jamforelser, fel))
    sys.exit(1 if fel else 0)
