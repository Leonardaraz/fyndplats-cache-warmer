# -*- coding: utf-8 -*-
"""Bygger Steg 7:s PATCH-kropp ur den GRINDADE texten och skriver den till fil.

☠️ Kroppen far aldrig komponeras for hand i chatten (batch 64, CLAUDE.md:
   inline 9 fel, fil-forst 0 fel). Den byggs har, grindas en sista gang, och
   skrivs till `patch/<pid>.json`. Det som klistras in i API-anropet ar
   alltsa filens exakta innehall.

☠️ SKICKA INTE `visible` I STEG 7. Produktens `false` speglas ned pa
   varianten, och da saknar sidan kopbar variant den dag den publiceras
   (runda 120: 2 av 2 med faltet fick `false`, 6 av 6 utan faltet fick
   `true`). Steg 8:s variantsInfo-PATCH ar undantaget och kraver BADA leden.

Hashgrinden: `sha.json` bar sha256 av `plainDescription` per produkt, och
Steg 7:s aterlasning jamfor Wix svar mot den — sa en felaktig avskrift
fangas av en MATNING och inte av ett oga.
"""
import hashlib, io, json, os, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import grind as _grind
import texter as T
import brodtext as B

IDS = json.load(io.open(os.path.join(os.path.dirname(os.path.abspath(__file__)),
                                     "ids.json"), encoding="utf-8"))

# Farsk revision last ur Wix 2026-09-13 direkt fore skrivningen.
REVISION = {
    # ce8813ce och 93073695 star pa 2: de skrevs med den text
    # inramningsgrinden sedan fallde, och skrivs om har.
    "56cca82a": "2", "ce8813ce": "2", "93073695": "2", "4fe5959f": "2",
    "136a4671": "1", "2730de6f": "2", "2a13cbbe": "1", "95f6280b": "1",
    "c8f6b93f": "1", "a8daef42": "1", "f0430bc5": "1",
}


def kropp(pid):
    fel = _grind.granska(pid)
    assert not fel, "GRINDEN FALLER pa %s: %r" % (pid, fel)
    namn, titel, meta = T.NAMN[pid], T.TITEL[pid], T.META[pid]
    assert titel != namn, "TITEL = NAMN pa %s — storefronten skriver da mallen" % pid
    assert len(namn) <= 80, "NAMN > 80 tecken pa %s" % pid
    assert len(meta) <= 155, "META > 155 tecken pa %s" % pid
    return {"product": {
        "id": IDS[pid],
        "revision": REVISION[pid],
        "name": namn,
        "slug": T.SLUG[pid],
        "plainDescription": B.HTML[pid],
        "seoData": {
            "tags": [
                {"type": "title", "children": titel, "custom": False,
                 "disabled": False},
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
    here = os.path.dirname(os.path.abspath(__file__))
    os.makedirs(os.path.join(here, "patch"), exist_ok=True)
    hashar = {}
    for pid in sys.argv[1:] or sorted(T.SLUG):
        k = kropp(pid)
        j = json.dumps(k, ensure_ascii=False, separators=(",", ":"))
        io.open(os.path.join(here, "patch", "%s.json" % pid), "w",
                encoding="utf-8").write(j)
        hashar[pid] = {"sha": sha(pid), "namn": k["product"]["name"],
                       "slug": k["product"]["slug"],
                       "titel": T.TITEL[pid], "meta": T.META[pid]}
        print("%s  %-42s  %5d tecken kropp  sha %s"
              % (pid, k["product"]["slug"], len(j), hashar[pid]["sha"][:12]))
    io.open(os.path.join(here, "sha.json"), "w", encoding="utf-8").write(
        json.dumps(hashar, ensure_ascii=False, indent=1, sort_keys=True))
