# -*- coding: utf-8 -*-
"""Runda 82 — bevisar att linten BITER.

En grön lint säger bara att den inte skriker. Testet nedan planterar ett känt
fel i taget och kräver att RÄTT regel fäller det. Fångar den inte, är regeln
dekoration.

☠️ SJU MUTATIONER ÄR RUNDANS EGNA FYND, inte ärvda:
   * att sifferssätta ryggstödets lägen på de två produkter där källan säger
     både fem och sju om samma rygg
   * att ta tillbaka `2a16c507`:s liggläges-mått, åt BÅDA håll (178 och 180) —
     det är rundans hela anledning att ha en egen `UTELAMNAT`-tabell
   * att kalla 4-packen kontorsstolar, som källans egen titel gör
   * att sälja ett fyrpack som en ensam möbel och tvärtom
   * att tappa "per stol" ur ett flerpacks maxlast
   * att attribuera ett påstående till leverantören — mot kunden är VI den

⚠️ Mutationer med scope `"*"` skriver om namn, titel, meta, ingress, punkter,
   spec, skötsel, villkor och FAQ på en gång. Runda 77 mätte varför: en
   mutation som bara rör ingressen kan lämna beviset kvar i spec-tabellen, och
   då fäller grinden av rätt skäl på fel ställe.
"""
import copy
import re

import lint
import texter

MUTATIONER = [
    # (kort, fält, sök, ersätt, förväntad delsträng i felet)
    # ── ☠️ RUNDANS EGNA GRINDAR ──────────────────────────────────────────
    # 1. Talet som är utelämnat med flit — åt BÅDA håll.
    ("2a16c507", "spec", "Sitthöjd: 33 cm",
     "Mått liggläge (L × B × H): 180 × 63,5 × 65 cm", "utelämnat med flit"),
    ("2a16c507", "ingress", "Sitthöjden är 33 cm och",
     "Utfälld är den 178 cm, sitthöjden är 33 cm och", "utelämnat med flit"),
    # 2. Sifferssatta rygglägen där källan säger både fem och sju.
    ("f5d857b6", "eg", "Ryggstödet ställs i flera lägen",
     "Ryggstödet ställs i sju lägen", "sifferssätter"),
    ("2a16c507", "*", r"Antalet\s+lägen anges med två olika tal i underlaget",
     "Ryggstödet har fem lägen", "sifferssätter"),
    # 3. Ordet kontorsstol, som källans egen titel bär.
    ("1628620b", "ingress", "Fyra fällstolar med",
     "Fyra kontorsstolar med", "kontorsstol"),
    ("4ca8a6c0", "name", "Fällstolar 4-pack i konstläder",
     "Kontorsstolar 4-pack i konstläder", "kontorsstol"),
    # 4. Antalet, åt båda håll.
    ("1628620b", "ingress", "Fyra fällstolar med",
     "En dubbelstol med två sitsar och", "två sitsar"),
    ("d6a11ae3", "ingress", "En solsäng där",
     "Ett 2-pack solsängar där", "2-pack"),
    ("9ed7ad7a", "spec", "Antal: 2 stolar", "Antal: 3 stolar", "Antal:"),
    # 5. "per stol" ur ett flerpacks maxlast — talet blir tvetydigt.
    ("4ca8a6c0", "spec", "Maxlast: 120 kg per stol",
     "Maxlast: 120 kg", "per stol"),
    # 6. Attribution — mot kunden är VI leverantören.
    ("85ffb47b", "ingress", "Två solstolar i svart",
     "Leverantören anger två solstolar i svart", "leverantör"),
    # ── ärvda grindar ────────────────────────────────────────────────────
    ("d6a11ae3", "ingress", "Ryggstödet ställs i sju lägen",
     "Ryggstödet ställs ergonomiskt i sju lägen", "ergonomisk"),
    ("f5d857b6", "ingress", "En grå solsäng i",
     "En grå solsäng som lindrar ryggbesvär i", "hälsopåstående"),
    ("9ed7ad7a", "ingress", "Två solstolar med",
     "Två Outsunny-solstolar med", "outsunny"),
    ("1628620b", "ingress", "Sitthöjden är 45 cm,",
     "Skickas från Tyskland. Sitthöjden är 45 cm,", "landsnamn"),
    ("85ffb47b", "ingress", "Sitthöjden är 43 cm",
     "Sitthöjden (art.nr 845-030CG) är 43 cm", "artikelnummer"),
    ("4ca8a6c0", "ingress", "Sitthöjden är 45 cm,",
     "Sitthöjden är 49 cm,", "49 cm"),
    ("d6a11ae3", "title", None,
     "Solsäng med dyna och huvudkudde i textilen – sju lägen och 165 kg | Fyndplats",
     "titeln är"),
    ("f5d857b6", "meta", None, "Grå solsäng.", "metan är"),
    ("2a16c507", "ingress", "Den svarta solsängen i seriens",
     "Den svarta solsängen med gaslyft i seriens", "gaslyft"),
]


def kor():
    fangade, missade = 0, []
    for kort, falt, sok, ers, vantat in MUTATIONER:
        lint.FEL = []
        orig = texter.PRODUKTER
        muterade = copy.deepcopy(orig)
        for p in muterade:
            if p["kort"] != kort:
                continue
            if falt == "*":
                for f in ("name", "title", "meta", "ingress"):
                    p[f] = re.sub(sok, ers, p[f], flags=re.I)
                for f in ("eg", "spec", "skotsel"):
                    p[f] = [re.sub(sok, ers, r, flags=re.I) for r in p[f]]
                p["faq"] = [(re.sub(sok, ers, a, flags=re.I),
                             re.sub(sok, ers, b, flags=re.I)) for a, b in p["faq"]]
                p["villkor"] = (re.sub(sok, ers, p["villkor"][0], flags=re.I),
                                [re.sub(sok, ers, r, flags=re.I) for r in p["villkor"][1]])
            elif falt in ("eg", "spec", "skotsel"):
                assert sok in p[falt], "%s: hittade inte %r i %s" % (kort, sok, falt)
                p[falt] = [ers if r == sok else r for r in p[falt]]
            elif sok is None:
                p[falt] = ers
            else:
                assert sok in p[falt], "%s: hittade inte %r" % (kort, sok)
                p[falt] = p[falt].replace(sok, ers, 1)
        lint.PRODUKTER = muterade
        try:
            lint.kor()
            traff = [f for f in lint.FEL
                     if f.startswith(kort) and vantat.lower() in f.lower()]
            if traff:
                fangade += 1
            else:
                missade.append("%s/%s → väntade %r, fick: %s"
                               % (kort, falt, vantat, lint.FEL or "INGET FEL"))
        finally:
            lint.PRODUKTER = orig

    lint.FEL = []
    lint.PRODUKTER = texter.PRODUKTER
    lint.kor()
    print("orörd text: %d fel" % len(lint.FEL))
    for f in lint.FEL:
        print("   ", f)
    print("mutationer: %d/%d fångade" % (fangade, len(MUTATIONER)))
    for m in missade:
        print("MISSAD:", m)
    return not missade and not lint.FEL


if __name__ == "__main__":
    raise SystemExit(0 if kor() else 1)
