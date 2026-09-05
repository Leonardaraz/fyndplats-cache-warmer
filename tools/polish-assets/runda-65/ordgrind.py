# -*- coding: utf-8 -*-
"""Ordgrind mot skrivning.json — läser FILEN, inte Python-objekten.

☠️ Batch 64 mätte upp skillnaden: fem produkter skrivna inline gav NIO fel som
nådde Wix, tre skrivna via fil gav noll. Den här grinden är vad "via fil"
betyder — texten går att granska innan den lämnar chatten.

Utan svensk stavningskontroll i miljön används det som faktiskt finns: ALLA
tidigare rundors texter som korpus. Ett stavfel är per konstruktion ett ord
som ingen tidigare runda har använt, så listan över OSEDDA ord är kort nog att
läsas med ögonen — och den innehåller garanterat varje felstavning.

⚠️ Rätta per ORD, inte per förekomst. `dögnsvarv` hittades tre gånger i tre
rundor för att varje fynd lagades där det syntes. Sök i HELA batchen.
"""
import glob
import io
import json
import os
import re
import sys

HAR = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, os.path.dirname(HAR))
from grindar import (TYSKA, HUSMARKEN, LANDORD, ATTRIBUTION, ARTNR,   # noqa: E402
                     LAGERFRAS, strip_taggar)

POSTER = json.load(io.open(os.path.join(HAR, "skrivning.json"), encoding="utf-8"))
ORD = re.compile(r"[A-Za-zÅÄÖåäöÉé]{3,}")


def ord_i(text):
    return set(o.lower() for o in ORD.findall(text))


# --- korpus: varje tidigare rundas texter.py ------------------------------
korpus, rundor = set(), 0
for fil in sorted(glob.glob(os.path.join(os.path.dirname(HAR), "runda-*", "texter.py"))):
    if os.path.dirname(fil) == HAR:
        continue
    korpus |= ord_i(io.open(fil, encoding="utf-8").read())
    rundor += 1

fel, osedda = [], {}
for post in POSTER:
    k = post["kort"]
    synlig = strip_taggar(post["plainDescription"])
    allt = " ".join([post["name"], synlig,
                     post["seoData"]["tags"][0]["children"],
                     post["seoData"]["tags"][1]["props"]["content"]])
    lag = allt.lower()

    for o in TYSKA + HUSMARKEN + LANDORD + ATTRIBUTION:
        if re.search(r"\b%s\b" % re.escape(o), lag):
            fel.append("%s: %r i den SKRIVNA texten" % (k, o))
    for f in LAGERFRAS:
        if f in lag:
            fel.append("%s: lagerfras i den SKRIVNA texten — %r" % (k, f))
    if ARTNR.search(allt):
        fel.append("%s: artikelnummer i den SKRIVNA texten" % k)
    if "�" in allt or "&Auml" in post["plainDescription"]:
        fel.append("%s: trasig teckenkodning" % k)
    if post["slug"] != post["slug"].lower() or re.search(r"[^a-z0-9-]", post["slug"]):
        fel.append("%s: slug är inte ren ASCII-gemener" % k)
    if post["name"] == post["seoData"]["tags"][0]["children"]:
        fel.append("%s: title identisk med name — storefronten skriver då sin mall" % k)
    if len(post["name"]) > 80:
        fel.append("%s: name %d tecken (max 80)" % (k, len(post["name"])))

    nya = sorted(ord_i(allt) - korpus)
    if nya:
        osedda[k] = nya

print("Korpus: %d ord ur %d tidigare rundor.\n" % (len(korpus), rundor))
print("OSEDDA ORD — läs varje rad, ett stavfel kan bara stå här:")
for k, nya in osedda.items():
    print("  %s  %s" % (k, ", ".join(nya)))
if not osedda:
    print("  (inga)")
print()
for f in fel:
    print("FEL:", f)
print("\n%d fel i %d poster" % (len(fel), len(POSTER)))
sys.exit(1 if fel else 0)
