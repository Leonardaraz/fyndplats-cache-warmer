# -*- coding: utf-8 -*-
"""Runda 131 — mutationstest: bevisar att VARJE grind kan fälla, och att det
är RÄTT grind som fäller.

☠️ MUTERA GENOM ATT LÄGGA TILL, INTE BYTA UT (runda 55). Ett utbyte tar bort
   ett uppmätt värde, så måttgrinden fäller först och den grind man tror sig
   testa kan vara helt avväpnad utan att testet märker något.

☠️ VARJE MUTATION PÅSTÅR ATT DEN LANDADE. Runda 47: en mutation som inte tog
   rapporterades som "grinden fyrar inte".

☠️ VARJE MUTATION PÅSTÅR VILKEN GRIND SOM SKA FÄLLA. Runda 47: sökords-
   grinden låg före krockgrinden och maskerade den.
"""
import sys

import grind as GR
import texter as T

TRAPPA = "2166c50f"      # biltrappa, 25 kg
RAMP = "15e4c7a7"        # möbelramp, 40 kg
RAMP_15 = "ed1ea8dc"     # möbelramp, 15 kg

# (namn, pid, fält, tillägg, väntad etikett)
MUTATIONER = [
    ("tyskt ord", TRAPPA, "INTRO", " Die Hunderampe ist klappbar.", "TYSKT ORD"),
    ("aktörsord", TRAPPA, "INTRO",
     " Leverantören anger höjden till 82 centimeter.", "AKTÖRSORD"),
    ("land", TRAPPA, "INTRO", " Trappan kommer från Tyskland.", "LAND"),
    ("lagerfras", TRAPPA, "INTRO", " Den skickas från vårt lager.", "LAGERFRAS"),
    ("husmärke", TRAPPA, "INTRO", " Tillverkad av PawHut.", "HUSMÄRKE"),
    ("superlativ", TRAPPA, "INTRO",
     " Det är marknadens stabilaste hundtrappa.", "SUPERLATIV"),
    ("batchsuperlativ", TRAPPA, "INTRO",
     " Den är den högsta i den här uppsättningen.", "BATCHSUPERLATIV"),
    ("leveranslöfte", TRAPPA, "INTRO",
     " Vi har fri frakt på den här trappan.", "LEVERANSLÖFTE"),
    ("artikelnummeretikett", TRAPPA, "INTRO",
     " Artikelnummer finns i kartongen.", "ARTIKELNUMMER-ETIKETT"),
    ("certifiering", TRAPPA, "INTRO", " Trappan är CE-märkt.", "CERTIFIERINGS"),
    ("rasnamn", TRAPPA, "INTRO",
     " Den passar en labrador utan problem.", "RASNAMN"),
    ("väderpåstående", TRAPPA, "INTRO",
     " Trappan är vattentät.", "VÄDERPÅSTÅENDE"),
    ("massivt trä", RAMP, "INTRO",
     " Rampen är byggd i massivt trä.", "MASSIVT TRÄ"),
    ("justerbar höjd på fast ramp", RAMP, "INTRO",
     " Rampen är höjdjusterbar.", "JUSTERBAR HÖJD"),
    ("ohärlett tal", TRAPPA, "INTRO",
     " Stegen sitter 17 centimeter isär.", "OHÄRLETT TAL 17"),
    ("kommalista av tal", RAMP_15, "INTRO",
     " Lägena är 24, 32,5 och 40 centimeter.", "KOMMALISTA"),
    ("montering i egen text", TRAPPA, "INTRO",
     " Trappan kräver ingen montering.", "MONTERING i egen text"),
    ("annans last i egen text", TRAPPA, "INTRO",
     " Trappan bär 50 kilo.", "ANNANS LAST 50 kg"),
]

# Fältmutationer: namn/titel/meta prövas var för sig, för typ- och
# lastgrinden läser just dem och inte brödtexten.
FALTMUTATIONER = [
    ("fel typord i namn (ramp på trappa)", TRAPPA, "NAMN",
     lambda s: s.replace("Hundtrappa", "Hundramp"), "TYP: namn bär FEL typord"),
    ("fel typord i slug (trappa på ramp)", RAMP, "SLUG",
     lambda s: "hundtrappa-45-cm-40-kg", "TYP: slug bär FEL typord"),
    ("typordet borta ur titeln", TRAPPA, "TITEL",
     lambda s: s.replace("Hundtrappa", "Produkt"), "TYP: titel saknar"),
    ("maxlasten borta ur namnet", TRAPPA, "NAMN",
     lambda s: s.replace("max 25 kg", "hopfällbar"), "LAST: namn saknar"),
    ("maxlasten borta ur metan", RAMP, "META",
     lambda s: s.replace("Bär 40 kg.", "Stadig."), "LAST: meta saknar"),
    ("namnet över 80 tecken", TRAPPA, "NAMN",
     lambda s: s + " med extra lång svans som spränger Wix hårda gräns",
     "NAMN:"),
    ("SKU skriven för hand", TRAPPA, "SKU",
     lambda s: "FP-hundtrappa-bil", "SKU: filen säger"),
]


def _kor(namn, pid, falt, tillagg, vantad):
    d = getattr(T, falt)
    orig = d[pid]
    d[pid] = orig + tillagg
    try:
        assert tillagg.strip() in T.bygg(pid), "mutationen landade inte"
        fel = GR.granska(pid)
        if not fel:
            return "SLÄPPER IGENOM"
        if not any(vantad in f for f in fel):
            return "FEL GRIND föll: %s" % fel[0][:70]
        return None
    finally:
        d[pid] = orig


def _kor_falt(namn, pid, falt, f, vantad):
    d = getattr(T, falt)
    orig = d[pid]
    d[pid] = f(orig)
    try:
        assert d[pid] != orig, "mutationen landade inte"
        fel = GR.granska(pid)
        if not fel:
            return "SLÄPPER IGENOM"
        if not any(vantad in x for x in fel):
            return "FEL GRIND föll: %s" % fel[0][:70]
        return None
    finally:
        d[pid] = orig


if __name__ == "__main__":
    rent = sum(len(GR.granska(p)) for p in T.NAMN)
    print("kontrollprov, orörd text: %d fel (ska vara 0)" % rent)

    miss = []
    for namn, pid, falt, tillagg, vantad in MUTATIONER:
        r = _kor(namn, pid, falt, tillagg, vantad)
        print("  %-32s %s" % (namn, "FÅNGAD" if r is None else "☠️ " + r))
        if r is not None:
            miss.append(namn)
    for namn, pid, falt, f, vantad in FALTMUTATIONER:
        r = _kor_falt(namn, pid, falt, f, vantad)
        print("  %-32s %s" % (namn, "FÅNGAD" if r is None else "☠️ " + r))
        if r is not None:
            miss.append(namn)

    efter = sum(len(GR.granska(p)) for p in T.NAMN)
    print("\nkontrollprov efter: %d fel (ska vara 0)" % efter)
    n = len(MUTATIONER) + len(FALTMUTATIONER)
    print("%d mutationer, %d missade" % (n, len(miss)))
    sys.exit(1 if (miss or rent or efter) else 0)
