# -*- coding: utf-8 -*-
"""Runda 93 — muteringstest. Ändra ett FAKTUM, grinden ska fälla.

⚠️ TALGRINDEN ÄR EN VITLISTA, inte en faktakontroll. Den fäller tal som inte
   hör hemma på sidan; den kan INTE se när ett tillåtet tal byter plats med
   ett annat tillåtet tal. Vikten "2 kg" muterad till "3 kg" passerar,
   eftersom 3 är tillåtet (3 × 3 m). Samma egenskap som runda 92 hade.
   Muteringarna nedan som är MEDVETET oupptäckbara står med `fangas=False`
   så att listan inte ljuger om vad grinden kan.
"""
import sys, os
HAR = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HAR)
import texter, lint                                                  # noqa: E402

MUT = [
    ("mått 250 → 260",          lambda h: h.replace("250", "260"), True),
    ("artikelnummer i texten",  lambda h: h.replace("indragbart tak", "84C-054GY"), True),
    ("leverantörens namn",      lambda h: h.replace("Duken", "Outsunny-duken"), True),
    # ☠️ Påståendet står på TVÅ ställen (punktlistan med versal E och spec-raden
    #    med gemen e). En mutering som bara tog det ena tog inte bort påståendet
    #    alls — grinden hade rätt och muteringen var fel byggd.
    ("endast duken ingår bort",
     lambda h: h.replace("endast takduken", "det mesta").replace("Endast takduken", "Det mesta"), True),
    ("avsändarland",            lambda h: h.replace("Duken", "Den tyska duken"), True),
    ("'leverantören anger'",    lambda h: h.replace("Duken är", "Leverantören anger att duken är"), True),
    ("dräneringshål 10 → 12",   lambda h: h.replace("10 st", "12 st"), True),
    ("stångfickor 6 → 8",       lambda h: h.replace("<strong>Stångfickor:</strong> 6", "<strong>Stångfickor:</strong> 8"), True),
    ("väv 180 → 200 g/m²",      lambda h: h.replace("180", "200"), True),
    ("hålets mått 14 → 16 mm",  lambda h: h.replace("14 mm", "16 mm"), True),
    ("ogrundat 'vattentät'",    lambda h: h.replace("Duken är", "Duken är vattentät och"), True),
    ("ogrundat 'säker'",        lambda h: h.replace("Duken är", "Duken är säker och"), True),
    ("pris i texten",           lambda h: h.replace("2 kg", "2 kg och kostar 599 kr"), True),
    ("tysk rest",               lambda h: h.replace("takduken", "Dach"), True),
    ("främmande färg i brödtext",
     lambda h: h.replace("Den är gjord för sol", "Den finns även i brun. Den är gjord för sol"), True),
    # --- medvetet oupptäckbara: två TILLÅTNA tal byter plats ---
    ("vikt 2 → 3 kg (vitlistat tal)",
     lambda h: h.replace("<strong>Vikt:</strong> 2 kg", "<strong>Vikt:</strong> 3 kg"), False),
]

if __name__ == "__main__":
    pid = "8ea111a2"
    farg = texter.FARG[pid]
    ren = texter.beskrivning(pid)
    assert lint.brister(pid, ren, farg) == [], "ren text ska vara ren"
    tr = miss = 0
    for namn, f, ska_fangas in MUT:
        muterad = f(ren)
        assert muterad != ren, "muteringen %r ändrade ingenting" % namn
        fangad = bool(lint.brister(pid, muterad, farg))
        if fangad == ska_fangas:
            tr += 1
            print("  %-34s %s" % (namn, "fälld" if fangad else "slipper igenom (känt)"))
        else:
            miss += 1
            print("  %-34s ☠️ FEL UTFALL" % namn)
    print("\nmuteringstest: %d/%d som förväntat, %d fel" % (tr, len(MUT), miss))
    sys.exit(1 if miss else 0)
