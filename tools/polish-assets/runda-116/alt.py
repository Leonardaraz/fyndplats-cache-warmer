# -*- coding: utf-8 -*-
"""Runda 116 Steg 9 — alt-texterna.

☠️ ALT-TEXTEN PASSERAR INGEN AV PRODUKTTEXTENS GRINDAR om man inte kör den
   genom en (uppgift #381). Den är kundtext: en skärmläsare läser den högt,
   och Google läser den som text. Här grindas den på samma tongrindar,
   samma märkesförbud, samma förbjudna ord och samma talregel som brödtexten.

☠️ KORTETS ALT BÖRJAR MED "Faktakort: " så att det går att skilja vårt eget
   kort från leverantörens foton i en granskning — och så att den som hör
   sidan uppläst vet att nästa bild är en sammanfattning, inte en ny vy.
"""
import os
import re
import sys

HAR = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, os.path.join(HAR, ".."))
import grindar as G                                              # noqa: E402
sys.path.insert(0, HAR)
import bildplan as B                                             # noqa: E402
import grind as GR                                               # noqa: E402
import matt as M                                                 # noqa: E402
import texter as T                                               # noqa: E402


def _hjulord(k):
    return "fyra hjul" if M.GRUPP[k] == "A" else "tre hjul"


def _detalj(k):
    if M.GRUPP[k] == "A":
        return ("Närbilder på handtaget med mugghållare, ett av hjulen och "
                "korgen under sitsen")
    return ("Närbild på korgen under sitsen med termos och påse, och på "
            "korgens undersida")


def _extra(k):
    if M.GRUPP[k] == "A":
        return (f"De två säkerhetskopplingarna utlagda på den "
                f"{M.FARG_BEST[k]} klädseln")
    return "Vagnen ute på en gångväg med en liten hund i"


def _alt(k, motiv):
    f = M.FARG[k]
    if motiv == 1:
        return (f"{f.capitalize()} hundvagn med {_hjulord(k)}, sedd snett "
                "framifrån mot vit bakgrund")
    if motiv == 2:
        return (f"Den {M.FARG_BEST[k]} hundvagnen skjuts på en gångväg "
                "utomhus, med en liten hund i")
    if motiv == 4:
        return _detalj(k)
    return _extra(k)


ALT = {k: {"kort": f"Faktakort: {T.NAMN[k].split(' – ')[0]}, mått och vikt"}
       for k in M.ALLA}
for _k in M.ALLA:
    for _t, _p in B.galleri(_k):
        if _t == "bild":
            ALT[_k][_p] = _alt(_k, _p)


def granska():
    """Samma grindar som brödtexten, på varje alt-text."""
    fel = []
    for k in M.ALLA:
        egna = GR.sidans_tal(k)
        for nyckel, txt in ALT[k].items():
            var = f"{k} alt[{nyckel}]"
            for etikett, monster in GR.TONGRINDAR:
                if monster.search(txt):
                    fel.append(f"{var}: {etikett} — {txt!r}")
            if GR.MARKE.search(txt):
                fel.append(f"{var}: OLICENSIERAT MÄRKE — {txt!r}")
            for etikett, monster in GR.FORBJUDET:
                m = monster.search(txt)
                if m:
                    fel.append(f"{var}: {etikett} {m.group(0)!r}")
            for etikett, monster in (
                    ("CYKELLÖFTE", GR.CYKELLOFTE),
                    ("BOSTADSLÖFTE", GR.BOSTADSLOFTE),
                    ("REGNSKYDDSLÖFTE", GR.REGNLOFTE),
                    ("TERRÄNGLÖFTE", GR.TERRANGLOFTE)):
                if G.loftestraff(monster, txt):
                    fel.append(f"{var}: {etikett} — {txt!r}")
            for m in GR.TAL.finditer(txt):
                if m.group(1) not in egna:
                    fel.append(f"{var}: OHÄRLETT TAL {m.group(1)!r} — {txt!r}")
            if M.GRUPP[k] == "B" and re.search(r"\b4\s*kg\b", txt):
                fel.append(f"{var}: FÖRVÄXLAD HUNDVIKT — {txt!r}")
            if len(txt) > 125:
                fel.append(f"{var}: {len(txt)} tecken, för lång för en alt-text")
            if not txt or txt[0].islower():
                fel.append(f"{var}: börjar inte med versal — {txt!r}")
    return fel


def _sjalvtest():
    """☠️ En grind som inte fäller på ett fall du VET är fel är inte mätt."""
    spar = dict(ALT["3b0aca0a"])
    fall = [("märke", "PawHut-vagnen sedd framifrån", True),
            ("tyskt ord", "Hundebuggy sedd framifrån", True),
            ("ohärlett tal", "Vagnen med 99 cm brett handtag", True),
            ("förväxlad hundvikt", "Vagnen som väger 4 kg", True),
            ("cykellöfte", "Vagnen kopplad efter en cykel", True),
            ("ren text", "Blå hundvagn med tre hjul mot vit bakgrund", False)]
    fel = 0
    for etikett, txt, ska in fall:
        ALT["3b0aca0a"] = {"kort": txt}
        if bool([x for x in granska() if x.startswith("3b0aca0a")]) != ska:
            print(f"  SJÄLVTEST FEL {etikett}")
            fel += 1
    ALT["3b0aca0a"] = spar
    print(f"alt-självtest: {len(fall)} fall, {fel} fel")
    return fel


if __name__ == "__main__":
    f = _sjalvtest()
    fel = granska()
    for k in M.ALLA:
        print(f"\n{k}  {T.SLUG[k]}")
        for t, p in B.galleri(k):
            nyckel = "kort" if t == "kort" else p
            print(f"   {str(nyckel):<5} {ALT[k][nyckel]}")
    print()
    for x in fel:
        print("  ✗", x)
    print(f"{sum(len(v) for v in ALT.values())} alt-texter, {len(fel)} fel, "
          f"{f} fel i självtestet")
    sys.exit(1 if (fel or f) else 0)
