# -*- coding: utf-8 -*-
"""Runda 84 — medialistan per produkt.

☠️ FYRA BILDER PLOCKAS BORT — alla bär INBRÄND TYSK TEXT. Alla 35 granskades
   i Steg 4 på två kontaktark:

   | id8        | bild | vad som står                                        |
   |------------|-----:|-----------------------------------------------------|
   | `466e799a` |    5 | `Küche` · `Badezimmer` · `Wohnzimmer` · `Schlafzimmer` |
   | `4ef74d40` |    4 | `GETEILTE BAUWEISE — Schnelle Montage und Demontage` |
   | `96beca79` |    4 | `GERUCHSKONTROLL-FILTERSYSTEM … nicht enthalten`     |
   | `96beca79` |    5 | `GETEILTE BAUWEISE — Schnelle Montage und Demontage` |

   Inget övre vänsterhörn bär en leverantörslogotyp (runda 64:s fynd).

⚠️ `96beca79` blir därmed TRE leverantörsbilder plus kortet. Det är tunt, och
   det är ett medvetet val: de två som stryks bär rundans två viktigaste fynd
   — kolfiltret och den delade konstruktionen — och båda flyttar in i TEXTEN
   i stället, där de går att läsa på svenska.

⚠️ KORTET LÄGGS PÅ POSITION 3, efter huvudbilden och livsstilsbilden.

☠️ `media.main` skickas ALDRIG — den är read-only i V3 och gav en extra
   omimport av huvudbilden (mätt 2026-08-28).

☠️ RUNDANS EGEN ALT-GRIND ÄR BATTERIET. `aabcd677`:s källa anger ingen
   batteristorlek, och Steg 5 valde att inte gissa. En alt-text är text på
   sidan precis som spec-tabellen, så varken "AA" eller "D" får stå i den
   produktens alt-texter. Grinden läser `lint.BATTERI` i stället för en egen
   lista: två listor som säger samma sak glider isär.
"""
import json, os, re, sys

HAR = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, os.path.dirname(HAR)); sys.path.insert(0, HAR)
import lint                                                      # noqa: E402
from grindar import HUSMARKEN, LANDORD                           # noqa: E402

BILDER = json.load(open(os.path.join(HAR, "bilder.json"), encoding="utf-8"))
KORT = json.load(open(os.path.join(HAR, "kort-ids.json"), encoding="utf-8"))

# id8 -> positioner (1-baserat) att stryka, se docstring
BORT = {"466e799a": {5}, "4ef74d40": {4}, "96beca79": {4, 5}}

ALT = {
    "466e799a": "Liten soptunna med sensor i rostfritt stål med svart lock",
    "7846d05f": "Rund soptunna med sensor i rostfritt stål med svart lock",
    "aabcd677": "Smal hög soptunna med sensor i rostfritt stål med svart lock",
    "0cc5c634": "Oval soptunna med sensor i rostfritt stål med uppfällt svart lock",
    "4ef74d40": "Soptunna med sensor i rostfritt stål med delat fjärilslock",
    "dcd756bd": "Oval soptunna med sensor i rostfritt stål med uppfällt svart lock",
    "96beca79": "Hög soptunna med sensor i borstat rostfritt stål",
}
KORTALT = {
    "466e799a": "Faktakort: soptunna med sensor 20 liter, mått, innerhink och batterier",
    "7846d05f": "Faktakort: rund soptunna med sensor 42 liter, mått, form och batterier",
    # ☠️ Ingen batteristorlek — källan anger ingen för den här tunnan.
    "aabcd677": "Faktakort: soptunna med sensor 45 liter, mått, innerhink och vikt",
    "0cc5c634": "Faktakort: oval soptunna med sensor 48 liter, mått, form och batterier",
    "4ef74d40": "Faktakort: soptunna med sensor 55 liter, mått, locktyp och batterier",
    "dcd756bd": "Faktakort: oval soptunna med sensor 58 liter, mått, form och batterier",
    "96beca79": "Faktakort: soptunna med sensor 60 liter, mått, luktfilter och batterier",
}

# ── Grinden ligger FÖRE planen, inte efter ──────────────────────────────────
fel = []
for k in ALT:
    for txt, var in ((ALT.get(k), "alt"), (KORTALT.get(k), "kortalt")):
        if not txt:
            fel.append("%s: %s saknas" % (k, var)); continue
        låg = txt.lower()
        for m in HUSMARKEN:
            if m.lower() in låg:
                fel.append("%s: husmärke %r i %s" % (k, m, var))
        for o in LANDORD:
            if o.lower() in låg:
                fel.append("%s: landsnamn %r i %s" % (k, o, var))
        # ☠️ Talen som är utelämnade med flit får inte komma in via alt-texten.
        for t in lint.UTELAMNAT.get(k, []):
            if t.replace(" ", "") in låg.replace(" ", ""):
                fel.append("%s: talet %s är utelämnat med flit — men står i %s"
                           % (k, t, var))
        # ☠️ Intern jargong (lint-grind 5c) gäller alt-texten också. En
        #    alt-text läses upp av skärmläsare och indexeras av Google.
        if re.search(r"\brundans?\b|\bi rundan\b", låg):
            fel.append("%s: intern jargong i %s" % (k, var))
# ☠️ Den tunna vars batteristorlek källan inte anger får inte få en via
#    alt-texten heller.
for k, typ in lint.BATTERI.items():
    if typ is None and re.search(r"\b(aa|d)-?batteri|4 ?× ?(aa|d)\b",
                                 KORTALT[k], re.I):
        fel.append("%s: kortets alt-text anger en batteristorlek som "
                   "källan inte ger" % k)

plan = {}
for k in ALT:
    ids = BILDER[k]
    kvar = [(i + 1, m) for i, m in enumerate(ids) if (i + 1) not in BORT.get(k, set())]
    rader = [{"id": m, "altText": "%s (%d)" % (ALT[k], n)}
             for n, (i, m) in enumerate(kvar, 1)]
    rader.insert(2, {"id": KORT[k], "altText": KORTALT[k]})
    plan[k] = rader

if __name__ == "__main__":
    for f in fel:
        print("FEL:", f)
    if fel:
        raise SystemExit("ALT-GRINDEN FÄLLER: %d fel — ingen plan skriven" % len(fel))
    json.dump(plan, open(os.path.join(HAR, "media-plan.json"), "w", encoding="utf-8"),
              ensure_ascii=False, indent=1)
    for k, r in plan.items():
        print("%s  %d bilder (%d strukna), kortet på plats 3"
              % (k, len(r), len(BORT.get(k, ()))))
