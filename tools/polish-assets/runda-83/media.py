# -*- coding: utf-8 -*-
"""Runda 83 — medialistan per produkt.

⚠️ INGEN BILD PLOCKAS BORT. Alla 40 granskades i Steg 4 på två kontaktark:
   måttritningarna bär bara siffror, `cm` och `kg`, ingen bild har tysk text
   inbränd, och inget övre vänsterhörn bär en leverantörslogotyp. `BORT` är
   därför tomt — ett uttryckligt beslut per runda, inte en regel som råkar
   träffa rätt.

⚠️ KORTET LÄGGS PÅ POSITION 3, efter huvudbilden och livsstilsbilden.

☠️ `media.main` skickas ALDRIG — den är read-only i V3 och gav en extra
   omimport av huvudbilden (mätt 2026-08-28).

☠️ RUNDANS EGEN ALT-GRIND ÄR HÖJDEN. Två bänkar har inget höjdspann på sidan
   (`ed7a86fd` 58–82 mot 62–83, `d7eca2ba` 61–87 mot 58–81) — texten och
   produktens egen måttritning säger olika, och talet är utelämnat med flit.
   En alt-text är text på sidan precis som spec-tabellen, så samma tal måste
   hållas ute även DÄR. Grinden läser `lint.UTELAMNAT` i stället för en egen
   lista: två listor som säger samma sak glider isär.
"""
import json, os, sys

HAR = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, os.path.dirname(HAR)); sys.path.insert(0, HAR)
import lint                                                      # noqa: E402
from grindar import HUSMARKEN, LANDORD                           # noqa: E402

BILDER = json.load(open(os.path.join(HAR, "bilder.json"), encoding="utf-8"))
KORT = json.load(open(os.path.join(HAR, "kort-ids.json"), encoding="utf-8"))

BORT = {}   # inget att stryka den här rundan — se docstring

ALT = {
    "a353ea02": "Vit hopfällbar massagebänk i tre delar med ansiktsöppning och aluminiumram",
    "5078bedf": "Svart och röd hopfällbar massagebänk i tre delar med aluminiumram",
    "a9555a7d": "Cremefärgad hopfällbar massagebänk med träställ och ansiktsstöd",
    "754a4749": "Svart hopfällbar massagebänk med träställ och ansiktsstöd",
    "251f0429": "Svart hopfällbar massagebänk med träställ och bred liggyta",
    "ed7a86fd": "Svart hopfällbar massagebänk i aluminium med armstöd och handbrädor",
    "2cfd373a": "Cremevit hopfällbar massagebänk i två delar med träställ",
    "d7eca2ba": "Svart hopfällbar massagebänk i två delar med träställ",
}
KORTALT = {
    "a353ea02": "Faktakort: massagebänk 3 zoner vit, liggyta, höjd och maxlast",
    "5078bedf": "Faktakort: massagebänk 3 zoner svart och röd, liggyta, höjd och maxlast",
    "a9555a7d": "Faktakort: massagebänk i trä creme, liggyta, höjd och maxlast",
    "754a4749": "Faktakort: massagebänk i trä svart, liggyta, höjd och maxlast",
    "251f0429": "Faktakort: massagebänk 70 cm bred, liggyta, höjd och maxlast",
    # ☠️ "höjdlägen", aldrig "höjd" — kortet visar antalet lägen, inte spannet.
    "ed7a86fd": "Faktakort: massagebänk med armstöd, mått, höjdlägen och maxlast",
    "2cfd373a": "Faktakort: massagebänk 2 zoner cremevit, mått, vikt och maxlast",
    # ☠️ Ingen höjd alls — spannet är utelämnat på den här sidan.
    "d7eca2ba": "Faktakort: massagebänk 2 zoner svart, liggyta, vikt och maxlast",
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
# ☠️ De två bänkar som saknar höjdspann får inte lova ett på kortet heller.
for k in lint.UTELAMNAT:
    if "höjd:" in KORTALT[k].lower() or "höjd," in KORTALT[k].lower():
        fel.append("%s: kortets alt-text säger 'höjd' om en bänk vars "
                   "höjdspann är utelämnat" % k)

plan = {}
for k in ALT:
    ids = BILDER[k]
    kvar = [(i + 1, m) for i, m in enumerate(ids)]
    if k in BORT:
        pos, _ = BORT[k]
        kvar = [(i, m) for i, m in kvar if i != pos]
    rader = [{"id": m, "altText": "%s (%d)" % (ALT[k], i)} for i, m in kvar]
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
        print("%s  %d bilder, kortet på plats 3" % (k, len(r)))
