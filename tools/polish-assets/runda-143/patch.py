# -*- coding: utf-8 -*-
"""Bygger Steg 7:s PATCH-kropp ur den GRINDADE texten och skriver den till fil.

☠️ Kroppen far aldrig komponeras for hand i chatten (batch 64, CLAUDE.md:
   inline 9 fel, fil-forst 0 fel). Den byggs har, grindas en sista gang, och
   skrivs till `patch/<pid>.json`. Det som skickas till Wix ar alltsa filens
   exakta innehall.

☠️ SKICKA INTE `visible` I STEG 7. Produktens `false` speglas ned pa varianten,
   och da saknar sidan kopbar variant den dag den publiceras (runda 120: 2 av 2
   med faltet fick `false`, 6 av 6 utan faltet fick `true`). Steg 8:s
   variantsInfo-PATCH ar undantaget och kraver BADA leden.

☠️ TITELN FAR ALDRIG VARA IDENTISK MED NAMNET — da behandlar storefronten
   titeln som osatt och renderar mallen `{name} | Fyndplats`.

`sha.json` bar sha256 av `plainDescription` per produkt. Aterlasningen jamfor
Wix svar mot den, sa en felaktig avskrift fangas av en MATNING, inte av ett oga.
"""
import hashlib
import io
import json
import os
import sys

HAR = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HAR)
import grind as _grind                                           # noqa: E402
import texter as T                                               # noqa: E402
import brodtext as B                                             # noqa: E402

# Fullt id + farsk revision, last ur Wix direkt fore skrivningen.
IDS = json.load(io.open(os.path.join(HAR, "ids.json"), encoding="utf-8"))


def kropp(pid):
    fel = _grind.granska(pid)
    assert not fel, "GRINDEN FALLER pa %s: %r" % (pid, fel)
    namn, titel, meta = T.NAMN[pid], T.TITEL[pid], T.META[pid]
    assert titel != namn, "TITEL = NAMN pa %s — storefronten skriver da mallen" % pid
    assert len(namn) <= 80, "NAMN > 80 tecken pa %s (%d)" % (pid, len(namn))
    assert len(meta) <= 165, "META > 165 tecken pa %s (%d)" % (pid, len(meta))
    pid_full, revision = IDS[pid]
    return {"product": {
        "id": pid_full,
        "revision": revision,
        "name": namn,
        "slug": T.SLUG[pid],
        "plainDescription": B.HTML[pid],
        "seoData": {
            "tags": [
                {"type": "title", "children": titel,
                 "custom": False, "disabled": False},
                {"type": "meta", "props": {"property": "og:title",
                                           "content": titel},
                 "children": "", "custom": True, "disabled": False},
                {"type": "meta", "props": {"name": "description",
                                           "content": meta},
                 "children": "", "custom": True, "disabled": False},
                {"type": "meta", "props": {"property": "og:description",
                                           "content": meta},
                 "children": "", "custom": True, "disabled": False},
                {"type": "meta", "props": {"property": "og:type",
                                           "content": "product"},
                 "children": "", "custom": True, "disabled": False},
            ],
            "settings": {"preventAutoRedirect": False, "keywords": [
                {"term": o, "isMain": i == 0, "origin": "USER"}
                for i, o in enumerate(T.SOKORD[pid])]},
        },
    }}


def sha(pid):
    return hashlib.sha256(B.HTML[pid].encode("utf-8")).hexdigest()


if __name__ == "__main__":
    os.makedirs(os.path.join(HAR, "patch"), exist_ok=True)
    hashar = {}
    for pid in sys.argv[1:] or T.BATCH:
        k = kropp(pid)
        j = json.dumps(k, ensure_ascii=False, separators=(",", ":"))
        io.open(os.path.join(HAR, "patch", "%s.json" % pid), "w",
                encoding="utf-8").write(j)
        hashar[pid] = {"sha": sha(pid), "namn": k["product"]["name"],
                       "slug": k["product"]["slug"], "titel": T.TITEL[pid],
                       "meta": T.META[pid], "rev_fore": IDS[pid][1]}
        print("%s  %-40s  %5d tecken  sha %s"
              % (pid, k["product"]["slug"], len(j), hashar[pid]["sha"][:12]))
    io.open(os.path.join(HAR, "sha.json"), "w", encoding="utf-8").write(
        json.dumps(hashar, ensure_ascii=False, indent=1, sort_keys=True))
