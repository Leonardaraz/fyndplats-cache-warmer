# -*- coding: utf-8 -*-
"""Runda 85 — bevisar att linten BITER.

En grön lint säger bara att den inte skriker. Testet nedan planterar ett känt
fel i taget och kräver att RÄTT regel fäller det. Fångar den inte, är regeln
dekoration.

☠️ TIO AV MUTATIONERNA ÄR RUNDANS EGNA FYND:
   * materialet åt TRE håll — rostfritt på den pulverlackerade, rostfritt på
     plastlådan, och "helt i rostfritt" på en som har plastlock
   * montering åt BÅDA håll: en som skruvas fast påstås ställas på plats,
     och tvärtom
   * doftblockshållare på en tunna som inte har någon, och en hållarrad som
     tappar "ingår inte"
   * barnsäkerhet påstådd där källan lovar ett MOTSTÅND
   * det absoluta ordet om ytan
   * en annan tunnas volym i vår egen text
   * en av de tre 40-litersmodellerna utan sin särskiljare

⚠️ Mutationer med scope `"*"` skriver om namn, titel, meta, ingress, punkter,
   spec, skötsel, villkor och FAQ på en gång. Runda 77 mätte varför: en
   mutation som bara rör ingressen kan lämna beviset kvar i spec-tabellen.
"""
import copy
import re

import lint
import texter

MUTATIONER = [
    # (kort, fält, sök, ersätt, förväntad delsträng i felet)
    # ── ☠️ MATERIALET, ÅT TRE HÅLL ──────────────────────────────────────
    ("a00882ed", "ingress", "Stommen är pulverlackerad plåt, inte rostfritt "
     "stål.", "Stommen är rostfritt stål.", "hör till ett SYSKON"),
    ("ec672f4d", "eg", "Stomme i ABS och plast, skenor i metall",
     "Stomme i rostfritt stål, skenor i metall", "hör till ett SYSKON"),
    ("17fb1869", "ingress", "Två fack på 15 liter vardera",
     "En tunna helt i rostfritt stål med två fack på 15 liter vardera",
     "hela tunnan är rostfri"),
    ("a00882ed", "spec", "Stomme: pulverlackerad plåt",
     "Stomme: 410 rostfritt stål", "'Stomme:'-raden"),
    # ── ☠️ MONTERINGEN, ÅT BÅDA HÅLL ────────────────────────────────────
    ("ec672f4d", "spec", "Montering: krävs, skruvar ingår",
     "Montering: krävs inte", "skruvas fast men specen"),
    ("17fb1869", "spec", "Montering: krävs inte",
     "Montering: krävs, skruvar ingår", "ställs bara på plats"),
    # ── ☠️ DOFTBLOCKEN ──────────────────────────────────────────────────
    ("213be879", "eg", "Dolda handtag i sidorna",
     "Hållare för doftblock i locken", "källan ger den ingen hållare"),
    ("b10b80ee", "spec", "Doftblockshållare: ja, blocken ingår inte",
     "Doftblockshållare: ja", "INTE ingår"),
    # ── ☠️ BARNSÄKERHETEN ───────────────────────────────────────────────
    ("ec672f4d", "eg", "Dämpade metallskenor, glider tyst",
     "Dämpade metallskenor med barnspärr", "barnsäkerhetspåstående"),
    # ── ☠️ DET ABSOLUTA ORDET OM YTAN ───────────────────────────────────
    ("b10b80ee", "eg", "Polerad yta som motstår fingeravtryck",
     "Polerad yta som är fingeravtrycksfri", "absolut påstående"),
    # ── ☠️ VOLYM OCH FACK ───────────────────────────────────────────────
    ("17fb1869", "spec", "Antal fack: 2", "Antal fack: 3", "Antal fack: 2"),
    ("b10b80ee", "eg", "2 × 20 liter, 40 liter totalt",
     "2 × 20 liter, och rymmer mer än en tunna på 30 liter",
     "det är 17fb1869:s volym"),
    ("a00882ed", "name", None, "Soptunna med 2 fack 50 liter – vit",
     "bär inte tunnans volym"),
    # ── ☠️ SÄRSKILJAREN mellan de tre 40-litersmodellerna ────────────────
    ("213be879", "name", None, "Soptunna med 2 fack 40 liter – 40 cm bred",
     "bär inte särskiljaren"),
    ("10c47f8e", "title", None,
     "Soptunna med 2 fack 40 liter, mörk | Fyndplats",
     "bär inte särskiljaren"),
    # ── husets delade regler ────────────────────────────────────────────
    # ☠️ Ett ord ur den RUNDEGNA tyska listan: husets delade lista är
    #    skriven för möbelrundorna och känner inte igen en enda av den här
    #    familjens termer.
    ("17fb1869", "spec", "Innerhinkar: uttagbara, med hål för påsen",
     "Inneneimer: uttagbara, med hål för påsen", "förbjudet ord"),
    ("b10b80ee", "eg", "2 × 20 liter, 40 liter totalt",
     "2 × 20 liter, 40 liter totalt, art.nr 851-011V01", "artikelnummer"),
    ("213be879", "ingress", "den smalaste tunnan med två fack här",
     "rundans smalaste tunna med två fack", "intern jargong"),
    ("a00882ed", "eg", "67 cm hög — 48,8 × 39,5 cm på golvet",
     "67 cm hög — 48,8 × 39,5 cm på golvet, väger 25 kg",
     "inte står i produktens egen spec"),
    ("ec672f4d", "eg", "Ram 47 × 33 × 32 cm — måttet skåpet ska rymma",
     "Ram 47, 33 och 32 cm — måttet skåpet ska rymma", "kommalista"),
    ("17fb1869", "title", None,
     "Soptunna med 2 fack 30 liter, låg modell i rostfritt stål | Fyndplats",
     "titeln är"),
    ("b10b80ee", "meta", None, "Soptunna med 2 fack 40 liter.", "metan är"),
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
