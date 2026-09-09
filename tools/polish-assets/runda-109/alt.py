# -*- coding: utf-8 -*-
"""Runda 109 Steg 9 — alt-texter för de två nya färgerna, och grinden.

⚠️ DE TVÅ GALLERIERNA ÄR INTE LIKA, och det är en MÄTNING (Steg 4) och inte en
   familjeregel. Svart har runda 108:s struktur — 1 studio, 2 miljö,
   3 måttritning, 4 närbild på väven, 5 närbild på foten. **Vit har tre
   miljöbilder och ingen enda närbild.** Alt-texterna följer därför fotona var
   för sig; en ärvd rad hade skrivit "närbild på väven" på ett rumsfoto.

☠️ OCH FAMILJENS EGET BILDORDFÖRRÅD LÄCKTE INTO EN BILD SOM INTE VISAR DET.
   Första utkastet skrev "ett bord med en ljus pläd över kanten" om vit bild 5
   — en fras lånad från runda 108:s naturfärgade sida, där en rutig pläd
   FAKTISKT hänger över skärmens kant. På det här fotot är det ljusa tyget en
   BORDSDUK, och skärmen är orörd. Fyndet kom av att bilden lästes i full
   storlek i stället för i kontaktarkets miniatyr; i miniatyren såg tyget ut
   att ligga över kanten. Samma klass som färguppräkningen i `texter.py`: ett
   påstående som var sant om ett SYSKON och falskt om den här sidan.

   ⚠️ Alt-texten passerar ingen grind som kan se det. **Läs varje bild i full
   storlek innan du beskriver den** — kontaktarket säger vilken TYP av bild
   det är, inte vad som finns i den.

☠️ ALT-TEXTEN PASSERAR INGEN AV DE VANLIGA GRINDARNA. `grind.py` läser `html`,
   `namn`, `titel` och `meta`; alt-texterna finns inte i den filen. Runda 106
   blev grön på alla sex sidor och hade ändå kaniner i fem alt-texter.

   Grinden nedan ärver `grindar`-listorna OCH rundans egna löftesmönster ur
   `grind.py` — inklusive `morklaggningslofte`, som skiljer ett löfte från dess
   förnekande. En kopia som "gör ungefär samma sak" är precis den tvilling
   huset förlorat tid på förr.

☠️ UTGÅNGSLÄGET VAR EN LÄCKA. Alla trettio bilderna bar leverantörens RÅA
   TYSKA TITEL som alt-text, ordagrant och identisk på varje bild i galleriet:
   "4-teiliger Raumtrenner, Faltbarer Sichtschutz, …". Tyska mot kunden, samma
   text på fem olika motiv, och noll beskrivning av vad bilden visar.

⚠️ BESKRIV VARAN OCH RUMMET DEN STÅR I, inte vad man ska tycka om den. Miljö-
   bilderna är iscensatta; att skriva ut lampan och puffen är en beskrivning av
   bilden, medan "ger rummet lugn" hade varit ett påstående om produkten.
"""
import os, re, sys

HAR = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, os.path.dirname(HAR))
import grindar as G                                     # noqa: E402
sys.path.insert(0, HAR)
import texter as T                                      # noqa: E402
from grind import (TAL, TALMONSTER, TYSKA_HAR, BARRIAR,  # noqa: E402
                   UTOMHUSLOFTE, morklaggningslofte)

# Ordningen ÄR galleriordningen efter Steg 9. "kort" är vårt eget spec-kort.
ALT = {
 # ☠️ Vit har INGEN närbild — plats 4 och 5 är två ytterligare miljöbilder.
 "ffb5239f": [
  "Rumsavdelare i vit polypropenväv med sex paneler, uppställd i sicksack.",
  "Skärmen står i ett ljust rum med valvöppning, bakom en låg soffa och ett mörkt soffbord.",
  "kort",
  "Skärmen står mot en ljus vägg bredvid en beige soffa, med ett litet sidobord i trä och en vas torkade blommor.",
  "Skärmen delar av ett kök, med ett bord i ljus duk på ena sidan och köksinredning i trä på den andra.",
  "Måttritning av rumsavdelaren: 240 cm bred, 170 cm hög och 40 cm per panel.",
 ],
 "7bd4f691": [
  "Rumsavdelare i svart polypropenväv med sex paneler, uppställd i sicksack.",
  "Skärmen står i ett vardagsrum bakom en grön soffa och ett soffbord i trä med ljus.",
  "kort",
  "Närbild på skärmens svarta väv där banden är flätade över ljusa trästommar.",
  "Närbild på skärmens svarta fötter mot ett ljust trägolv.",
  "Måttritning av rumsavdelaren: 240 cm bred, 170 cm hög och 40 cm per panel.",
 ],
}

# Kortets alt-text byggs ur kortets EGNA rader, inte skrivs för hand — samma
# princip som kortbygget: värdet härleds, det formuleras inte om.
import kort as K                                        # noqa: E402


def kortalt(nyckel):
    spec = K.specrader(nyckel)
    import kortbygge                                     # noqa
    delar = ["%s %s" % (e.lower(), kortbygge.varde(spec[i], e))
             for e, i in K.RADER[nyckel][:3]]
    return "Faktakort: " + ", ".join(delar) + "."


def galleri(nyckel):
    return [kortalt(nyckel) if a == "kort" else a for a in ALT[nyckel]]


def granska():
    fel = []
    for k in K.RUNDAN:
        for i, a in enumerate(galleri(k), 1):
            plats = "%s bild %d" % (k, i)
            lag = a.lower()
            if not a.endswith("."):
                fel.append("%s: saknar avslutande punkt" % plats)
            if len(a) > 125:
                fel.append("%s: %d tecken (max 125)" % (plats, len(a)))
            if "rumsavdelare" not in lag and "skärmen" not in lag \
                    and not a.startswith("Faktakort"):
                fel.append("%s: varken sökordet eller 'skärmen' finns" % plats)
            for ord_ in list(G.TYSKA) + TYSKA_HAR:
                if re.search(rf"\b{re.escape(ord_)}", lag):
                    fel.append("%s: tyskt ord %r" % (plats, ord_))
            for m in G.HUSMARKEN:
                if m in lag:
                    fel.append("%s: husmärke %r" % (plats, m))
            for o in G.LANDORD:
                if re.search(rf"\b{re.escape(o)}\b", lag):
                    fel.append("%s: lagerland utskrivet %r" % (plats, o))
            for f in G.LAGERFRAS:
                if f in lag:
                    fel.append("%s: lagerfras %r" % (plats, f))
            for at in G.ATTRIBUTION:
                if re.search(rf"\b{re.escape(at)}\b", lag):
                    fel.append("%s: leverantörsattribution %r" % (plats, at))
            if G.ARTNR.search(a):
                fel.append("%s: artikelnummer %r" % (plats, G.ARTNR.search(a).group(0)))
            # ☠️ Rundans EGNA löften, samma mönster som brödtexten prövas mot.
            if BARRIAR.search(a):
                fel.append("%s: BARRIÄRLÖFTE i alt-texten: %s" % (plats, a))
            if morklaggningslofte(a):
                fel.append("%s: MÖRKLÄGGNINGSLÖFTE i alt-texten: %s" % (plats, a))
            if UTOMHUSLOFTE.search(a):
                fel.append("%s: UTOMHUSLÖFTE i alt-texten: %s" % (plats, a))
            for tal in TALMONSTER.findall(a):
                if tal not in TAL[k]:
                    fel.append("%s: ohärlett tal %r" % (plats, tal))
    return fel


def sjalvtest():
    """Grinden ska fälla det som inte får nå en alt-text."""
    prov = [
        ("husmärke", "Rumsavdelare från Outsunny i ett vardagsrum.", "husmärke"),
        ("artikelnummer", "Rumsavdelare 845-030CG i ett vardagsrum.", "artikelnummer"),
        ("ohärlett tal", "Rumsavdelare 999 cm bred i ett vardagsrum.", "ohärlett tal"),
        ("tyskt ord", "Rumsavdelare som Sichtschutz i ett vardagsrum.", "tyskt ord"),
        ("barriärlöfte", "Rumsavdelare som stänger inne barn i ett rum.", "BARRIÄRLÖFTE"),
        ("mörkläggning", "Rumsavdelare som mörklägger sovrummet helt.", "MÖRKLÄGGNING"),
        ("utomhuslöfte", "Väderbeständig rumsavdelare på en altan.", "UTOMHUSLÖFTE"),
        ("saknar sökord", "En bild av något i ett vardagsrum.", "varken sökordet"),
        ("för lång", "Rumsavdelare " + "x" * 130 + ".", "tecken (max 125)"),
    ]
    ok = True
    for namn, text, vantat in prov:
        sparad = ALT["ffb5239f"][1]
        ALT["ffb5239f"][1] = text
        traff = [f for f in granska() if vantat in f]
        ALT["ffb5239f"][1] = sparad
        print("  %-16s %s" % (namn, "fälls ✓" if traff else "SLÄPPS IGENOM ✗"))
        ok = ok and bool(traff)
    return ok


if __name__ == "__main__":
    print("=== självtest ===")
    if not sjalvtest():
        raise SystemExit("grinden fångar inte allt den ska")
    print("\n=== alt-texter ===")
    for k in K.RUNDAN:
        print("  %s" % k)
        for i, a in enumerate(galleri(k), 1):
            print("    %d  %3d  %s" % (i, len(a), a))
    fel = granska()
    print("\n=== grind: %d fel ===" % len(fel))
    for f in fel:
        print("  ✗", f)
    if fel:
        raise SystemExit(1)
