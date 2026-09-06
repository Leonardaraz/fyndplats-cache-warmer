# -*- coding: utf-8 -*-
"""Runda 77 — bevisar att linten BITER.

En grön lint säger bara att den inte skriker. Testet nedan planterar ett känt
fel i taget och kräver att RÄTT regel fäller det. Fångar den inte, är regeln
dekoration.

☠️ Tre av mutationerna är den här rundans egna fynd, inte ärvda:
   * ordet `ergonomisk` (fyra av sju heter så på tyska, utan belägg)
   * `d739872f`:s oavgörbara ryggstödsmått
   * `f1f861ea`:s andra totalmått
"""
import copy
import re
import sys

import lint
import texter

MUTATIONER = [
    # (kort, fält, sök, ersätt, förväntad delsträng i felet)
    ("d739872f", "ingress", "En <strong>ritstol</strong>", "En <strong>ergonomisk ritstol</strong>", "ergonomisk"),
    ("795c5ee2", "ingress", "nätad, 41 cm bred", "nätad, 41 cm bred och EN 1335-certifierad", "certifiering"),
    ("3033003c", "ingress", "när du sitter länge", "när du sitter länge, och lindrar ryggbesvär", "hälsopåstående"),
    ("83fd57c9", "ingress", "fasta armstöd", "fasta armstöd i Kunstleder", "tyskt ord"),
    ("f1f861ea", "ingress", "höga arbetsbänkar", "höga arbetsbänkar. Vinsetto bygger bra stolar", "husmärke"),
    ("df0d351f", "ingress", "med kort, krusig lugg", "med kort, krusig lugg. Skickas från Tyskland", "landsnamn"),
    ("cc0ec7ba", "ingress", "hjärtformad rygg", "hjärtformad rygg (art.nr 921-762V00PK)", "artikelnummer"),
    ("d739872f", "ingress", "Ryggen är av nätväv", "Leverantören anger att ryggen är av nätväv", "attribution"),
    ("795c5ee2", "ingress", "Utan armstöd tar", "Skickas från EU-lager. Utan armstöd tar", "lagerfras"),
    # talgrinden
    ("d739872f", "ingress", "26,5 cm över sitsen", "31 cm över sitsen", "31 cm"),
    ("3033003c", "ingress", "40 × 37 cm", "40 × 44 cm", "44 cm"),
    ("83fd57c9", "ingress", "95 cm nere", "94 cm nere", "94 cm"),
    ("f1f861ea", "ingress", "18 och 46 cm", "18 och 41 cm", "41 cm"),
    ("df0d351f", "ingress", "45 cm bred och 56 cm djup", "47 cm bred och 56 cm djup", "47 cm"),
    # mått källan motsäger sig själv om
    ("d739872f", "ingress", "Ryggen är av nätväv", "Ryggstödet är 59 cm brett. Ryggen är av nätväv", "motsägelsefullt"),
    ("f1f861ea", "ingress", "Fotringen flyttas", "Stolen är 64 cm bred. Fotringen flyttas", "motsägelsefullt"),
    # utrustning
    ("795c5ee2", "*", "utan armstöd|inga armstöd|saknar armstöd", "med armstöd", "armstöd"),
    ("3033003c", "*", "svankstöd", "ländstöd", "svankstödet nämns inte"),
    ("df0d351f", "*", "hjärtformad", "rundad", "hjärtformen"),
    ("df0d351f", "*", "teddytyg", "sammet", "teddytyget nämns inte"),
    ("d739872f", "*", "fotring", "fotplatta", "fotringen nämns inte"),
    ("cc0ec7ba", "*", "120 kg", "130 kg", "120 kg"),
    ("83fd57c9", "spec", "Montering: krävs", "Verktyg: insexnyckel", "monteringen"),
    # längder och sökord
    ("d739872f", "title", None, "Ritstol med uppfällbara armstöd och krommad fotring för höga bord | Fyndplats", "title"),
    ("795c5ee2", "meta", None, "För kort meta.", "meta"),
    ("3033003c", "name", None, "Stol med svankstöd", "huvudsökordet"),
    ("f1f861ea", "title", None, "Kontorsstol upp till 87 cm | Fyndplats", "huvudsökordet"),
    # form
    ("83fd57c9", "ingress", "</p>", "<br></p>", "<br>"),
    ("cc0ec7ba", "ingress", "<p>Finns också", "<p></p><p>Finns också", "tomt <p>"),
    # priset
    ("d739872f", "ingress", "Sitshöjden ställs", "Den kostar 1399 kr. Sitshöjden ställs", "priset"),
    # länkar
    ("795c5ee2", "ingress", "ritstol-95-115-cm", "ritstol-som-inte-finns", "okänd sida"),
    ("3033003c", "ingress", "ritstol-uppfallbara-armstod", "ritstol-med-svankstod", "sig själv"),
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
                for f in ("eg", "spec"):
                    p[f] = [re.sub(sok, ers, r, flags=re.I) for r in p[f]]
                p["faq"] = [(re.sub(sok, ers, a, flags=re.I),
                             re.sub(sok, ers, b, flags=re.I)) for a, b in p["faq"]]
                p["skotsel"] = [re.sub(sok, ers, r, flags=re.I) for r in p["skotsel"]]
                p["villkor"] = (p["villkor"][0],
                                [re.sub(sok, ers, r, flags=re.I) for r in p["villkor"][1]])
            elif falt in ("eg", "spec"):
                p[falt] = [ers if r == sok else r for r in p[falt]]
            elif sok is None:
                p[falt] = ers
            else:
                assert sok in p[falt], "%s: hittade inte %r" % (kort, sok)
                p[falt] = p[falt].replace(sok, ers, 1)
        texter.PRODUKTER = muterade
        lint.PRODUKTER = muterade
        try:
            lint.kor()
            traff = [f for f in lint.FEL if f.startswith(kort) and vantat.lower() in f.lower()]
            if traff:
                fangade += 1
            else:
                missade.append("%s/%s → väntade %r, fick: %s"
                               % (kort, falt, vantat, lint.FEL or "INGET FEL"))
        finally:
            texter.PRODUKTER = orig
            lint.PRODUKTER = orig

    # orörd text ska ge noll fel
    lint.FEL = []
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
