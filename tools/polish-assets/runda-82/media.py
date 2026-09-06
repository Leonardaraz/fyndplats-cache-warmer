# -*- coding: utf-8 -*-
"""Runda 82 — medialistan per produkt.

⚠️ INGEN BILD PLOCKAS BORT. Alla 40 granskades i Steg 4: måttritningarna bär
   bara siffror, `cm` och `kg`, och ingen bild har tysk text inbränd. `BORT`
   är därför tomt — ett uttryckligt beslut per runda, inte en regel som råkar
   träffa rätt.

⚠️ EN BILD SÅG UT ATT VARA FEL KULÖR och var det inte. `d6a11ae3` bild 4
   visar vad som liknar en grå dyna på en svart produkt. Kontrollmätt i
   pixlarna: RGB (118, 96, 72) på överkanten mot (81, 84, 89) på väven — det
   är varmt solljus på kolgrå textilen. Bilden ligger kvar. Mätt, inte antaget.

⚠️ KORTET LÄGGS PÅ POSITION 3, efter huvudbilden och livsstilsbilden.

☠️ `media.main` skickas ALDRIG — den är read-only i V3 och gav en extra
   omimport av huvudbilden (mätt 2026-08-28).

☠️ ALT-TEXTEN PÅSTÅR INGET ANTAL, och det är en ändring mot runda 81. Varje
   bild visar EN vara ur paketet, inte hela leveransen — en alt-text som säger
   "2-pack" om ett foto av en enda stol beskriver inte bilden. Antalet bärs i
   stället av KORTETS alt-text, som är den enda bild i galleriet där hela
   paketet faktiskt står skrivet. Grinden nedan fäller åt båda håll.
"""
import json, os, sys

HAR = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, os.path.dirname(HAR)); sys.path.insert(0, HAR)
import texter                                                    # noqa: E402
from grindar import HUSMARKEN, LANDORD                           # noqa: E402

BILDER = json.load(open(os.path.join(HAR, "bilder.json"), encoding="utf-8"))
KORT = json.load(open(os.path.join(HAR, "kort-ids.json"), encoding="utf-8"))

BORT = {}   # inget att stryka den här rundan — se docstring

ALT = {
    "d6a11ae3": "Svart solsäng med heltäckande dyna och huvudkudde på silverfärgad ram",
    "f5d857b6": "Grå solsäng i luftig textilenväv med avtagbar huvudkudde",
    "2a16c507": "Svart solsäng i luftig textilenväv med avtagbar huvudkudde",
    "9ed7ad7a": "Grå hopfällbar solstol med stoppat nackstöd och armstöd",
    "85ffb47b": "Svart hopfällbar solstol med stoppat nackstöd och armstöd",
    "1628620b": "Svart fällstol med stoppad sits och rygg i linnelookat tyg",
    "4ca8a6c0": "Svart fällstol med stoppad sits och rygg i konstläder",
}
KORTALT = {
    "d6a11ae3": "Faktakort: solsäng med dyna, mått, sitthöjd och maxlast",
    "f5d857b6": "Faktakort: solsäng grå, mått i sitt- och liggläge, maxlast",
    "2a16c507": "Faktakort: solsäng svart, sittläge, sitthöjd och maxlast",
    "9ed7ad7a": "Faktakort: solstolar 2-pack grå, mått, sits och maxlast",
    "85ffb47b": "Faktakort: solstolar 2-pack svarta, mått, sits och maxlast",
    "1628620b": "Faktakort: fällstolar 4-pack i tyg, mått, sitthöjd och maxlast",
    "4ca8a6c0": "Faktakort: fällstolar 4-pack i konstläder, mått och maxlast",
}

ANTAL = {p["kort"]: p["antal"] for p in texter.PRODUKTER}

# ── Grinden ligger FÖRE planen, inte efter ──────────────────────────────────
fel = []
for k in ANTAL:
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
    # ☠️ Antalet i alt-texten mot antalet i facit — åt BÅDA håll.
    a, ka = ALT[k].lower(), KORTALT[k].lower()
    for m in ("2-pack", "4-pack", "två stolar", "fyra stolar", "tvåpack"):
        if m in a:
            fel.append("%s: alt-texten påstår ett antal (%r) — bilden visar "
                       "EN vara ur paketet" % (k, m))
    if ANTAL[k] > 1 and "%d-pack" % ANTAL[k] not in ka:
        fel.append("%s: kortets alt-text saknar '%d-pack'" % (k, ANTAL[k]))
    for n in (2, 4):
        if n != ANTAL[k] and "%d-pack" % n in ka:
            fel.append("%s: kortets alt-text säger %d-pack om antal=%d"
                       % (k, n, ANTAL[k]))

plan = {}
for k in ANTAL:
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
        print("%s  %d bilder, kortet på plats 3  (antal=%d)" % (k, len(r), ANTAL[k]))
