# -*- coding: utf-8 -*-
"""Runda 117 Steg 9 — åtta Fyndplats-kort.

Klart-kriteriet kräver minst ett eget kort per polerad produkt. För
`63235957` är kravet dessutom akut: dess femte bild plockades ur galleriet
(tysk text inbränd i pixlarna), så utan kortet har den fyra bilder mot
syskonens fem.

☠️ FÄRGSYSKONENS KORT MÅSTE SKILJA SIG. Tre respektive två produkter delar
   varenda tal i spec-tabellen; det enda som skiljer dem är färgen, och den
   måste därför stå i rubriken. `kontroll()` fäller om två kort blir
   identiska — samma spärr som runda 116.
"""
import json
import os
import sys
import urllib.request

HAR = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, os.path.join(HAR, ".."))
sys.path.insert(0, HAR)
import kortbygge as KB                                            # noqa: E402
import matt as M                                                  # noqa: E402

BILDER = json.load(open(os.path.join(HAR, "bilder.json"), encoding="utf-8"))
RAW = os.path.join(HAR, "rawbilder")

KICKER = {"A": "KÖKSVAGN 106 CM MED UTFÄLLBAR SKIVA",
          "B": "KÖKSVAGN 80 CM MED UTDRAGSFACK",
          "C": "KÖKSVAGN 109 CM I MASSIVT GUMMITRÄ",
          "D": "KÖKSVAGN 82 CM MED KRYDDHYLLA"}

RUBRIK = {
    "63235957": "Vit med ekfärgad skiva",
    "37fb1ce1": "Grå med ekfärgad skiva",
    "4d044b44": "Svart med ekfärgad skiva",
    "e16c1515": "Vit med ljus träfärgad skiva",
    "d4db4bbc": "Svart med ekfärgad skiva",
    "4ab392f7": "Vit med gummiträskiva",
    "0af14e23": "Svart med gummiträskiva",
    "41d31478": "Vit med ekfärgad skiva",
}

# ☠️ VÄRDET HÄRLEDS ur raden, och rundans maxlast-sträng är för lång för ett
#    kort på fyra av åtta. Den kortade formen står HÄR, inte i texten, och är
#    en delmängd av samma tal — aldrig ett nytt.
MAXLAST_KORT = {"A": "50 kg totalt", "B": "40 kg totalt",
                "C": "40 kg totalt", "D": "35 kg totalt"}

# Andra raden skiljer grupperna åt: det som är MODELLENS poäng.
ANDRA = {
    "A": ("Skiva utfälld", "skiva_utfalld"),
    "B": ("Hyllplan", "hylla_hoger"),
    "C": ("Arbetsskiva", "skiva"),
    "D": ("Arbetsskiva", "skiva"),
}


def specrader(k):
    g = M.GRUPP[k]
    etikett, falt = ANDRA[g]
    return [f"Mått: {M.MATT[g]['yttermatt']}",
            f"{etikett}: {M.MATT[g][falt]}",
            f"Skåp invändigt: {M.MATT[g]['skap_inuti']}",
            f"Maxlast: {MAXLAST_KORT[g]}",
            f"Vikt: {M.MATT[g]['vikt']}"]


def hamta(fid):
    os.makedirs(RAW, exist_ok=True)
    f = os.path.join(RAW, fid.split("_")[1].split("~")[0] + ".jpg")
    if not os.path.exists(f):
        with urllib.request.urlopen(
                "https://static.wixstatic.com/media/%s/v1/fill/w_600,h_600,al_c,q_88/f.jpg" % fid,
                timeout=90) as r:
            open(f, "wb").write(r.read())
    return f


def kontroll():
    sedda = {}
    for k in M.GRUPP:
        g = M.GRUPP[k]
        n = (KICKER[g], RUBRIK[k], tuple(specrader(k)))
        if n in sedda:
            raise SystemExit(f"☠️ {k} och {sedda[n]} får IDENTISKA kort")
        sedda[n] = k
        if M.FARG_KORT[k] not in RUBRIK[k].lower():
            raise SystemExit(f"☠️ {k}: färgen {M.FARG_KORT[k]!r} står inte i "
                             f"kortrubriken {RUBRIK[k]!r}")
        # Kortets tal måste alla gå att hitta i matt.py.
        rader = " ".join(specrader(k))
        for f in ("yttermatt", "skap_inuti", "vikt"):
            if M.MATT[g][f] not in rader:
                raise SystemExit(f"☠️ {k}: kortet saknar {f}")
        if not MAXLAST_KORT[g].split()[0] in M.MATT[g]["maxlast"]:
            raise SystemExit(f"☠️ {k}: kortets maxlast finns inte i matt.py")
    print(f"kort.kontroll: {len(sedda)} unika kort av {len(M.GRUPP)} produkter   OK")


if __name__ == "__main__":
    kontroll()
    os.chdir(HAR)
    alla = list(M.GRUPP)
    produkter = [{"kort": k, "spec": specrader(k)} for k in alla]
    kortdata = {k: (KICKER[M.GRUPP[k]], RUBRIK[k],
                    [("Mått", 0), (ANDRA[M.GRUPP[k]][0], 1),
                     ("Skåp", 2), ("Maxlast", 3), ("Vikt", 4)]) for k in alla}
    foton = {k: hamta(BILDER[k][0]) for k in alla}
    namn, facit = KB.bygg(HAR, produkter, kortdata, foton=foton)
    json.dump(facit, open("kort-facit.json", "w"), ensure_ascii=False, indent=1)
    for n in namn:
        print(f"  {n}  {os.path.getsize('jpg/%s.jpg' % n):>7} byte")
