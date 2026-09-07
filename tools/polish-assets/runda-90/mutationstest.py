# -*- coding: utf-8 -*-
"""Runda 90 — mutationstest.

Självtestet i `lint.py` bevisar att varje regel fäller en sträng SKRIVEN FÖR
ATT FÄLLAS. Det här testet gör något svårare: det skadar de VERKLIGA texterna
på ett realistiskt sätt och kräver att grinden fäller. En regel som bara
träffar sitt eget laboratorieprov är en regel som inte biter i drift.

Varje rad är ett fel som faktiskt begåtts i en tidigare runda.
"""
import sys

import lint
import texter

HJUL = {p: ("luft" if p in lint.LUFTHJUL else "massiv") for p in texter.P}


def kor_grind(pid, h):
    return lint.brister(pid, h, HJUL[pid], lint.TAL_OK[pid] | lint.TAL_LANK[pid],
                        lint.FRAMMANDE[pid])


MUTATIONER = [
    # (produkt, sök, ersätt, vad felet är)
    ("5129f6b0", "Ram i stål och aluminium", "Ram i rostfritt stål",
     "runda 57:s rostfria lögn"),
    ("5129f6b0", "Ø40 cm, luftfyllda", "Ø41 cm, luftfyllda",
     "skissens 41 i stället för spec-tabellens 40"),
    ("5129f6b0", "Bred fotplatta, 36 cm lång", "Bred fotplatta, 12,5 cm hög",
     "det tvetydiga måttet på skissen"),
    ("5129f6b0", "luftfyllda gummidäck på ekerfälg rullar",
     "punkteringsfria gummidäck rullar",
     "massivt-hjul-påstående på en produkt med LUFTDÄCK"),
    ("5129f6b0", "Den är byggd från 5 år", "Leverantören anger från 5 år",
     "mot kunden är VI leverantören"),
    ("5129f6b0", "139 × 58 × 90–96 cm", "118 × 52 × 90–96 cm",
     "lånat mått från modell B"),
    ("50b28808", "Maxlast", "Artikelnummer",
     "artikelnummer-etikett i spec-tabellen"),
    ("50b28808", "svart ram, röd framgaffel", "svart ram från Tyskland",
     "avsändarland i kundtext"),
    ("9518db1e", "Ø30 cm massiva EVA-hjul som aldrig behöver pumpas",
     "Ø30 cm hjul som ska hållas hårda och fyllas med en cykelpump",
     "luftdäcks-skötselråd på massiva hjul"),
    ("9518db1e", "115 × 50 × 80–88 cm", "118 × 52 × 80–88 cm",
     "modell B:s mått på en modell C-sida"),
    ("9518db1e", "Stålram med plastdetaljer", "Stålram, testad enligt EN 71",
     "ogrundad certifiering"),
    ("473084eb", "Handbroms på bakhjulet, förmonterad",
     "Handbroms på bakhjulet, Bremse förmonterad",
     "tyskt ord kvar i brödtexten"),
    ("473084eb", "31 × 10,8 cm med halkmönster", "31 x 10.8 cm med halkmönster",
     "engelsk sifferstil: x och decimalpunkt"),
    ("85be4535", "Väger 6,5 kg", "Väger 9,5 kg",
     "modell G:s vikt på en modell C-sida"),
    ("85be4535", "räcker från 5 till 12 år", "räcker från 5-12 år",
     "bindestreck i stället för tankstreck"),
    ("68f8f1a7", "Rosa version av vår 12-tumssparkcykel",
     "Rosa version av vår smidiga elsparkcykel",
     "fel fordonsklass"),
    ("68f8f1a7", "Hjälm och skydd för knän", "Hjälm är lag och skydd för knän",
     "hjälm framställd som lag"),
    ("68f8f1a7", "rosa ram, svarta hjul", "rosa ram från HOMCOM",
     "husmärke i kundtext"),
    ("eb4418ad", "Ø20 cm hjul i massiv PU", "Ø30 cm hjul i massiv PU",
     "modell C:s hjul på den hopfällbara"),
    ("eb4418ad", "Fotplatta", "Fotplatta 9 cm över marken,",
     "den förkastade markfrigången"),
    ("eb4418ad", "94 × 36 × 88–103 cm", "94 x 36 x 88-103 cm",
     "x i stället för × och bindestreck"),
    ("eb4418ad", "En sparkcykel för asfalt", "Rundan gav en sparkcykel för asfalt",
     "intern jargong i kundtext"),
]


def main():
    # 1. Otouchad text ska vara REN — annars mäter testet ingenting.
    for pid in texter.P:
        f = kor_grind(pid, texter.html(pid))
        if f:
            print("☠️ %s är inte ren FÖRE mutation: %s" % (pid, f))
            return 1

    ratt = 0
    for pid, sok, ers, vad in MUTATIONER:
        h = texter.html(pid)
        if sok not in h:
            print("☠️ MUTATIONEN GÅR INTE ATT GÖRA: %r finns inte i %s (%s)"
                  % (sok, pid, vad))
            continue
        f = kor_grind(pid, h.replace(sok, ers, 1))
        if f:
            ratt += 1
            print("  ✔ %-9s %-52s → %s" % (pid, vad, f[0][:64]))
        else:
            print("  ☠️ %-9s %-52s → GRINDEN MISSADE DEN" % (pid, vad))
    print("\n%d/%d mutationer fångade." % (ratt, len(MUTATIONER)))
    return 0 if ratt == len(MUTATIONER) else 1


if __name__ == "__main__":
    sys.exit(main())
