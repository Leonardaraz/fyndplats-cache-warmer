# -*- coding: utf-8 -*-
"""Runda 81 — medialistan per produkt.

⚠️ INGEN BILD PLOCKAS BORT. Runda 80 strök tre bilder med TYSK TEXT inbränd i
   pixlarna; den här rundans 40 bilder granskades i Steg 4 och ingen bär text.
   `BORT` är därför tomt — ett uttryckligt beslut per runda, inte en regel som
   råkar träffa rätt.

☠️ HUSMÄRKET LIGGER I PIXLARNA på bild 1 hos `6307893c`, `4401be4f`,
   `8b66533f` och `65c84a9b` — TRYCKT PÅ TYGET, alltså på VARAN och inte i
   bakgrunden. Bilden ligger kvar (huset skrev ned regeln i runda 64), och
   märket nämns aldrig i alt-texten. Alt-texterna nedan är kontrollmätta mot
   `grindar.HUSMARKEN` innan de skrivs.

⚠️ KORTET LÄGGS PÅ POSITION 3, efter huvudbilden och livsstilsbilden. Det är
   först där en kund som scrollar möter något som är VÅRT.

☠️ `media.main` skickas ALDRIG — den är read-only i V3 och gav en extra
   omimport av huvudbilden (mätt 2026-08-28).

☠️ ALT-TEXTEN BÄR RUNDANS EGEN SKILJELINJE. "två stolar" mot "en stol med två
   sitsar" är hela poängen med runda 81, och alt-texten är det enda ställe där
   en skärmläsare får svaret. Den följer `texter.PRODUKTER[...]["antal"]`, inte
   min läsning av bilden — samma facit som lintens antal-grind.
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
    "6307893c": "Grå hopfällbar campingstol i mesh med fotstöd och mugghållare",
    "46d2c85a": "Svart campingstol med grå nackstöd, mugghållare och kylficka",
    "4401be4f": "Blå dubbel campingstol med två sitsar och gräddvit stoppning",
    "8b66533f": "Khakifärgad dubbel campingstol med två sitsar och svart ram",
    "65c84a9b": "Grön dubbel campingstol med två sitsar och svart stålram",
    "bdb600fe": "Svart hopfällbar fällstol i luftig textilväv med låg sits",
    "cce86277": "Svart hopfällbar trädgårdsstol med hög rygg och armstöd",
    "e39db7dd": "Hopfällbar trädgårdsstol i akacia med flätad beige rygg och sits",
}
KORTALT = {
    "6307893c": "Faktakort: campingstolar 2-pack, mått, sitthöjd och maxlast",
    "46d2c85a": "Faktakort: campingstolar 2-pack med nackstöd, mått och maxlast",
    "4401be4f": "Faktakort: dubbel campingstol blå, bredd, sitthöjd och maxlast",
    "8b66533f": "Faktakort: dubbel campingstol khaki, bredd, sitthöjd och maxlast",
    "65c84a9b": "Faktakort: dubbel campingstol grön, bredd, sitthöjd och maxlast",
    "bdb600fe": "Faktakort: fällstolar 2-pack, mått, låg sitthöjd och maxlast",
    "cce86277": "Faktakort: trädgårdsstolar 2-pack, mått, sitthöjd och maxlast",
    "e39db7dd": "Faktakort: trädgårdsstolar i akacia, mått, sitthöjd och maxlast",
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
    a = ALT[k].lower()
    if ANTAL[k] == 1 and ("2-pack" in a or "två stolar" in a):
        fel.append("%s: alt-texten säger tvåpack om en ENSAM möbel" % k)
    if ANTAL[k] == 2 and ("två sitsar" in a or "dubbel" in a):
        fel.append("%s: alt-texten säger dubbelstol om ett TVÅPACK" % k)
    if ANTAL[k] == 1 and "två sitsar" not in KORTALT[k].lower() \
            and "dubbel" not in KORTALT[k].lower():
        fel.append("%s: kortets alt-text säger inte att det är EN stol" % k)

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
