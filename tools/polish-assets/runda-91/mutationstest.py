# -*- coding: utf-8 -*-
"""Runda 91 — mutationstest.

Självtestet i `lint.py` bevisar att varje regel fäller en sträng SKRIVEN FÖR
ATT FÄLLAS. Det här testet skadar de VERKLIGA texterna på ett realistiskt sätt
och kräver att grinden fäller. Varje rad är ett fel som faktiskt begåtts.
"""
import sys
import lint
import texter

HJUL = {p: ("luft" if p in lint.LUFTHJUL else "massiv") for p in texter.P}


def kor(pid, h):
    return lint.brister(pid, h, HJUL[pid], lint.TAL_OK[pid] | lint.TAL_LANK[pid],
                        lint.FRAMMANDE[pid], lint.FALG_OK[pid], lint.RAM_OK[pid],
                        lint.RAND_OK[pid])


MUTATIONER = [
    ("369b4b2c", "Pulverlackerad stålram", "Ram i rostfritt stål",
     "runda 57 och 90:s rostfria lögn"),
    ("369b4b2c", "luftfyllda gummidäck på ekerfälg i silver",
     "punkteringsfria gummidäck på ekerfälg i silver",
     "massivt-hjul-påstående på LUFTDÄCK — grinden pekar åt andra hållet här"),
    ("369b4b2c", "grovt mönster", "fotbollsmönster",
     "runda 89:s dödade fotbollspåstående"),
    ("369b4b2c", "Ø30 cm, luftfyllda", "Ø30,5 cm, luftfyllda",
     "en källa av fyra säger 30,5 där tre säger 30"),
    ("369b4b2c", "Den är byggd från 5 år", "Leverantören anger från 5 år",
     "mot kunden är VI leverantören"),
    ("feac1d03", "120 × 58 × 85–95 cm", "139 × 58 × 85–95 cm",
     "modell G:s längd på en modell E-sida"),
    ("feac1d03", "turkos ram", "silverfärgad ram",
     "ogrundad färg — zoomen visar turkos"),
    # ☠️ De fyra nedan är felet runda 91 FAKTISKT gjorde: randbandet skrevs
    #    "guld- och svartrandning" om ett band som i 6x zoom är guld, vitt
    #    OCH svart. Grinden fanns inte då.
    ("feac1d03", "randband i guld, vitt och svart", "randband i guld och svart",
     "vitbandet struket ur en tresvart rand — fel åt UTELÄMNANDE hållet"),
    ("369b4b2c", "randband i guld och vitt", "randband i guld och svart",
     "svart rand påstådd på ett band som är guld/vitt/guld"),
    ("1b1d4842", "randband i guld, vitt och svart", "randband i guld, vitt och rosa",
     "rosa rand som inte finns"),
    ("c851d101", "svarta ränder", "gröna ränder",
     "fel randfärg i ordföljden <färg>a ränder"),
    ("feac1d03", "Maxlast", "Artikelnummer",
     "artikelnummer-etikett i spec-tabellen"),
    ("c851d101", "styret är svart", "styret är svart, skickas från Tyskland",
     "avsändarland i kundtext"),
    ("c851d101", "Väger 8,2 kg", "Väger 9,5 kg",
     "modell G:s vikt på en modell E-sida"),
    ("c851d101", "Pulverlackerad stålram, byggd",
     "Pulverlackerad stålram, testad enligt EN 71, byggd",
     "ogrundad certifiering"),
    ("1b1d4842", "En sparkcykel för barn", "En smidig elsparkcykel för barn",
     "fel fordonsklass"),
    ("1b1d4842", "Hjälm och skydd", "Hjälm är lag och skydd",
     "hjälm framställd som lag"),
    ("1b1d4842", "beige ram", "beige ram från HOMCOM",
     "husmärke i kundtext"),
    ("1b1d4842", "30 × 11 cm", "30 x 11 cm",
     "x i stället för ×"),
    ("1b1d4842", "85 och 95 cm", "85-95 cm",
     "bindestreck i stället för tankstreck"),
    ("feac1d03", "En sparkcykel för barn", "Rundan gav en sparkcykel för barn",
     "intern jargong i kundtext"),
    ("c851d101", "silver", "svarta",
     "ogrundad fälgfärg — alla fyra har silverfälg"),
]


def main():
    for pid in texter.P:
        f = kor(pid, texter.html(pid))
        if f:
            print("☠️ %s är inte ren FÖRE mutation: %s" % (pid, f))
            return 1
    ratt = 0
    for pid, sok, ers, vad in MUTATIONER:
        h = texter.html(pid)
        if sok not in h:
            print("☠️ MUTATIONEN GÅR INTE ATT GÖRA: %r saknas i %s (%s)" % (sok, pid, vad))
            continue
        f = kor(pid, h.replace(sok, ers, 1))
        if f:
            ratt += 1
            print("  ✔ %-9s %-52s → %s" % (pid, vad, f[0][:62]))
        else:
            print("  ☠️ %-9s %-52s → GRINDEN MISSADE DEN" % (pid, vad))
    print("\n%d/%d mutationer fångade." % (ratt, len(MUTATIONER)))
    return 0 if ratt == len(MUTATIONER) else 1


if __name__ == "__main__":
    sys.exit(main())
