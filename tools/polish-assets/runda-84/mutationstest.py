# -*- coding: utf-8 -*-
"""Runda 84 — bevisar att linten BITER.

En grön lint säger bara att den inte skriker. Testet nedan planterar ett känt
fel i taget och kräver att RÄTT regel fäller det. Fångar den inte, är regeln
dekoration.

☠️ ELVA AV MUTATIONERNA ÄR RUNDANS EGNA FYND:
   * tre sorters rostfri lögn — locket är plast på var enda tunna
   * montering åt BÅDA håll: en hel tunna som påstås monteras, och en som
     monteras men påstås hel
   * fel batterityp i specen, i prosan, och en batterirad på den tunna vars
     källa inte anger någon storlek
   * doftblocket som plötsligt "ingår"
   * en annan tunnas volym i vår egen text
   * innerhink påstådd på en tunna som inte har någon

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
    # ── ☠️ DEN ROSTFRIA LÖGNEN ──────────────────────────────────────────
    ("4ef74d40", "ingress", "55 liter på 41 × 26,5 cm golvyta",
     "En tunna i rostfritt stål, 55 liter på 41 × 26,5 cm golvyta", "rostfri"),
    ("466e799a", "spec", "Lock: plast", "Lock: rostfritt stål", "'Lock:'-rad"),
    ("7846d05f", "spec", "Stomme: rostfritt stål", "Stomme: metall", "'Stomme:'-rad"),
    # ── ☠️ MONTERINGEN, ÅT BÅDA HÅLL ────────────────────────────────────
    ("96beca79", "spec", "Montering: krävs, verktygsfri",
     "Montering: krävs inte", "lösa paneler"),
    ("0cc5c634", "spec", "Montering: krävs inte",
     "Montering: krävs, verktygsfri", "hel men specen"),
    # ── ☠️ BATTERITYPEN ─────────────────────────────────────────────────
    ("0cc5c634", "spec", "Batterier: 4 × D (1,5 V), ingår inte",
     "Batterier: 4 × AA, ingår inte", "källan säger 4 × D"),
    ("466e799a", "spec", "Batterier: 4 × AA, ingår inte",
     "Batterier: 4 × AA", "INTE ingår"),
    ("96beca79", "eg", "Bred locköppning: 34,8 × 17,7 cm",
     "Drivs av 4 × D-batterier", "i sin EGEN text"),
    ("aabcd677", "spec", "Sensoravstånd: 15 cm",
     "Batterier: 4 × AA, ingår inte", "inte anger batteristorlek"),
    # ── ☠️ DOFTBLOCKET INGÅR INTE ───────────────────────────────────────
    ("96beca79", "spec", "Hållare för doftblock: ja, blocket ingår inte",
     "Hållare för doftblock: ja, med block", "INTE ingår"),
    # ── ☠️ VOLYMEN ÄR FAMILJENS JÄMFÖRELSEAXEL ──────────────────────────
    ("7846d05f", "eg", "42 liter i rund form — tar hörnet",
     "60 liter i rund form — tar hörnet", "60 liter"),
    ("dcd756bd", "spec", "Volym: 58 liter", "Volym: 60 liter", "saknar raden"),
    # ── ☠️ TAL SOM ÄR UTELÄMNAT MED FLIT ────────────────────────────────
    ("466e799a", "eg", "Uttagbar innerhink med handtag",
     "Locket öppnar 59 cm", "utelämnat med flit"),
    # ── ☠️ UTRUSTNING SOM INTE STÅR I SPECEN ────────────────────────────
    ("0cc5c634", "eg", "Avtagbart lock med infraröd sensor",
     "Uttagbar innerhink med handtag", "innerhink som inte står i specen"),
    # ── ärvda grindar ────────────────────────────────────────────────────
    ("dcd756bd", "ingress", "Samma ovala form som",
     "Skickas från Tyskland. Samma ovala form som", "landsnamn"),
    ("aabcd677", "ingress", "En <strong>smal 45-litare</strong>",
     "En <strong>smal Outsunny-45-litare</strong>", "outsunny"),
    ("7846d05f", "ingress", "En <strong>rund tunna</strong>",
     "En <strong>rund tunna (art.nr 845-030CG)</strong>",
     "artikelnummer"),
    ("96beca79", "ingress", "Ett lager <strong>aktivt kolfiber</strong>",
     "Leverantören anger att ett lager <strong>aktivt kolfiber</strong>",
     "leverantör"),
    ("4ef74d40", "title", None,
     "Soptunna med sensor 55 liter med fjärilslock i stål | Fyndplats",
     "titeln är"),
    ("0cc5c634", "meta", None, "Oval soptunna.", "metan är"),
    # ── ☠️ INTERN JARGONG (grind 5c) ─────────────────────────────────────
    #    Alla tre är RUNDANS EGNA FEL, ordagrant som de stod i Wix innan
    #    grinden byggdes: brödtext, punktlista och meta-beskrivning.
    ("466e799a", "ingress", "<p><strong>Bara 20 liter",
     "<p><strong>Rundans minsta tunna: 20 liter", "intern jargong"),
    ("dcd756bd", "eg", "58 liter", "58 liter — rundans näst största",
     "intern jargong"),
    ("96beca79", "meta", None,
     "Soptunna med rörelsesensor och 60 liters volym, rundans största.",
     "intern jargong"),
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
