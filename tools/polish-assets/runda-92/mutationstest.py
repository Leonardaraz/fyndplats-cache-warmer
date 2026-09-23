# -*- coding: utf-8 -*-
"""Runda 92 — mutationstest.

Självtestet i `lint.py` bevisar att varje regel fäller en sträng SKRIVEN FÖR
ATT FÄLLAS. Det här testet skadar den VERKLIGA texten på ett realistiskt sätt
och kräver att grinden fäller. Varje rad är ett fel som faktiskt begåtts —
eller, för den här rundan, ett som ligger nära till hands eftersom katalogen
har tre andra 16-tumssidor att låna mått från.
"""
import sys
import lint
import texter

HJUL = {p: ("luft" if p in lint.LUFTHJUL else "massiv") for p in texter.P}


def kor(pid, h):
    return lint.brister(pid, h, HJUL[pid], lint.TAL_OK[pid],
                        lint.FRAMMANDE[pid], lint.FALG_OK[pid], lint.RAM_OK[pid],
                        lint.RAND_OK[pid], lint.TAL_LANK[pid])


MUTATIONER = [
    # ── Rundans egna risker: tre andra 16-tumssidor att låna från ──────
    ("ea013fde", "135 × 58 × 92–100 cm", "143 × 58 × 92–100 cm",
     "143 cm-modellens längd på 135 cm-sidan"),
    ("ea013fde", "Väger 9,8 kg", "Väger 10,6 kg",
     "143 cm-modellens vikt — 10,6 står i korslänken, inte i specen"),
    ("ea013fde", "16 tum fram, drygt 40 cm", "16 tum fram, drygt 41 cm",
     "källans avrundning 41 mot syskonsidans 40 — samma hjul, två tal"),
    ("ea013fde", "Halkmönstrad fotplatta, 36 × 12 cm",
     "Halkmönstrad fotplatta, 30 × 11 cm",
     "modell E:s fotplatta på en 16-tumssida"),
    # ── Färggrindarna ──────────────────────────────────────────────────
    ("ea013fde", "ekerfälg i silver", "ekerfälg i svart",
     "ogrundad fälgfärg — zoomen visar silver"),
    ("ea013fde", "svart ram med randband", "vit ram med randband",
     "ogrundad ramfärg"),
    ("ea013fde", "randband i guld och vitt", "randband i guld och svart",
     "svart rand påstådd på ett band som är guld/vitt/guld"),
    ("ea013fde", "randband i guld och vitt", "randband i guld",
     "vitbandet utelämnat — kravet är LIKHET mot mätningen, inte delmängd"),
    # ── Husreglerna ────────────────────────────────────────────────────
    ("ea013fde", "Stålram med kromat styre", "Ram i rostfritt stål",
     "runda 57, 90 och 91:s rostfria lögn"),
    ("ea013fde", "Den är byggd från 5 år", "Leverantören anger från 5 år",
     "mot kunden är VI leverantören"),
    ("ea013fde", "Maxlast", "Artikelnummer",
     "artikelnummer-etikett i spec-tabellen"),
    ("ea013fde", "Rekommenderad ålder", "Testad enligt EN 71",
     "ogrundad certifiering"),
    ("ea013fde", "Stödben under ramen", "Stödben under ramen, skickas från Tyskland",
     "avsändarland i kundtext"),
    ("ea013fde", "En sparkcykel för barn", "En elsparkcykel för barn",
     "fel fordonsklass"),
    ("ea013fde", "Hjälm och skydd för knän", "Hjälm är lag och skydd för knän",
     "hjälm framställd som lag"),
    ("ea013fde", "Stålram med kromat", "HOMCOM stålram med kromat",
     "husmärke i kundtext"),
    # ── Sifferstil ─────────────────────────────────────────────────────
    ("ea013fde", "36 × 12 cm, 11 cm över marken", "36 x 12 cm, 11 cm över marken",
     "x i stället för ×"),
    ("ea013fde", "92–100 cm, justerbar", "92-100 cm, justerbar",
     "bindestreck i stället för tankstreck"),
    # ── Luftdäcksgrinden pekar åt andra hållet här ─────────────────────
    ("ea013fde", "Luftdäck på ekerfälg", "Punkteringsfria däck på ekerfälg",
     "massivt-hjul-påstående på en produkt med LUFTDÄCK"),
    ("ea013fde", "Det är riktiga luftdäck", "Det är inget att pumpa",
     "inget-att-pumpa på luftdäck"),
    # ── Intern jargong ─────────────────────────────────────────────────
    ("ea013fde", "Det är samma bromstyp", "Rundan visar att det är samma bromstyp",
     "intern jargong i kundtext"),
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
        f = kor(pid, h.replace(sok, ers))
        if f:
            ratt += 1
            print("  ✔ %-9s %-58s → %s" % (pid, vad, f[0][:60]))
        else:
            print("  ☠️ %-9s %-58s → GRINDEN MISSADE DEN" % (pid, vad))
    print("\n%d/%d mutationer fångade." % (ratt, len(MUTATIONER)))
    return 0 if ratt == len(MUTATIONER) else 1


if __name__ == "__main__":
    sys.exit(main())
