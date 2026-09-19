# -*- coding: utf-8 -*-
"""Runda 83 — bevisar att linten BITER.

En grön lint säger bara att den inte skriker. Testet nedan planterar ett känt
fel i taget och kräver att RÄTT regel fäller det. Fångar den inte, är regeln
dekoration.

☠️ ÅTTA MUTATIONER ÄR RUNDANS EGNA FYND:
   * sex sorters vård- och behandlingspåstående — rundans tyngsta grind, för
     en massagebänk är ingen medicinteknisk produkt
   * en påhittad EN-norm och en påhittad CE-märkning på en möbel någon ligger på
   * att ta tillbaka `d7eca2ba`:s höjdrad, som är utelämnad med flit
   * att jämna ut "rekommenderad maxlast" till "maxlast"
   * att skriva 81 cm som bäddens bredd när det är bredden över armhyllorna
   * att ge `ed7a86fd` ett höjdspann — texten säger 58–82, ritningen 62–83

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
    # ── ☠️ RUNDANS TYNGSTA GRIND: vård och behandling ────────────────────
    ("a353ea02", "ingress", "En massagebänk i <strong>tre zoner</strong>",
     "En massagebänk för behandling i <strong>tre zoner</strong>", "behandl"),
    ("5078bedf", "eg", "Ram i aluminium",
     "Ram i aluminium för terapirummet", "terapi"),
    ("a9555a7d", "ingress", "Familjens <strong>starkaste bänk</strong>",
     "Familjens <strong>starkaste rehabbänk</strong>", "rehab"),
    ("754a4749", "eg", "Bärväska ingår",
     "Bärväska ingår — lindrar ryggen vid transport", "lindr"),
    ("251f0429", "eg", "Stomme i trä",
     "Stomme i trä, byggd för patienter", "patient"),
    ("ed7a86fd", "eg", "9 cm dyna — rundans tjockaste",
     "9 cm dyna som dämpar smärta", "smärt"),
    # ── ☠️ PÅHITTAD NORM ────────────────────────────────────────────────
    ("2cfd373a", "eg", "Två zoner, träställ",
     "Två zoner, träställ, provad enligt EN 1729", "standard"),
    ("d7eca2ba", "eg", "Två zoner, träställ",
     "Två zoner, träställ, CE-märkt", "standard"),
    # ── ☠️ TAL SOM ÄR UTELÄMNAT MED FLIT ────────────────────────────────
    ("d7eca2ba", "spec", "Skummets tjocklek: 4 cm",
     "Höjd: 61–87 cm", "utelämnat med flit"),
    ("d7eca2ba", "ingress", "Två zoner, träställ och en liggyta",
     "Höjden ställs mellan 58 och 81 cm, två zoner och en liggyta",
     "utelämnat med flit"),
    # ── ☠️ REKOMMENDERAD FÅR INTE JÄMNAS UT ─────────────────────────────
    ("2cfd373a", "spec", "Rekommenderad maxlast: 150 kg",
     "Maxlast: 150 kg", "rekommenderad"),
    # ── ☠️ MÅTTEN MOT PRODUKTENS EGEN RITNING ───────────────────────────
    # Båda nedan är fel som FAKTISKT stod i texten innan raderna ställdes
    # mot måttritningarna. De ligger här för att inte kunna komma tillbaka.
    # ☠️ Höjdspannet är UTELÄMNAT: texten säger 58–82, ritningen 62–83.
    ("ed7a86fd", "spec", "Höjdlägen: 7",
     "Höjd: 58–82 cm", "utelämnat med flit"),
    ("ed7a86fd", "eg", "Höjden ställs i sju steg",
     "Höjden ställs mellan 62 och 83 cm", "utelämnat med flit"),
    # Måttraden får inte tappa sitt facit.
    ("ed7a86fd", "spec", "Hopfälld (L × B × H): 92,5 × 70 × 18 cm",
     "Hopfälld (L × B × H): 93 × 71 × 19 cm", "facit säger"),
    # ── ☠️ 81 CM ÄR INTE BÄDDENS BREDD ──────────────────────────────────
    ("a353ea02", "spec", "Liggyta (L × B): 185 × 60 cm",
     "Liggyta (L × B): 185 × 81 cm", "81 cm"),
    # ── ärvda grindar ────────────────────────────────────────────────────
    ("a9555a7d", "ingress", "Familjens <strong>starkaste bänk</strong>",
     "Familjens <strong>ergonomiska bänk</strong>", "ergonomisk"),
    ("754a4749", "ingress", "Den svarta av familjens",
     "Den svarta Outsunny-bänken av familjens", "outsunny"),
    ("251f0429", "ingress", "Liggytan är 185 × 70 cm",
     "Skickas från Tyskland. Liggytan är 185 × 70 cm", "landsnamn"),
    ("ed7a86fd", "ingress", "Den enda i rundan med",
     "Den enda i rundan (art.nr 845-030CG) med", "artikelnummer"),
    ("2cfd373a", "ingress", "<strong>Rundans lättaste bänk: 13 kg.</strong>",
     "<strong>Rundans lättaste bänk: 11 kg.</strong>", "11 kg"),
    ("5078bedf", "ingress", "Samma treszonsbänk som den vita",
     "Leverantören säger att det är samma treszonsbänk som den vita",
     "leverantör"),
    ("a353ea02", "title", None,
     "Massagebänk med tre zoner i aluminium, vit – bär 225 kg | Fyndplats",
     "titeln är"),
    ("754a4749", "meta", None, "Svart massagebänk.", "metan är"),
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
