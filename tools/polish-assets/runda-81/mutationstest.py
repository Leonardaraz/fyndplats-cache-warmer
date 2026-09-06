# -*- coding: utf-8 -*-
"""Runda 81 — bevisar att linten BITER.

En grön lint säger bara att den inte skriker. Testet nedan planterar ett känt
fel i taget och kräver att RÄTT regel fäller det. Fångar den inte, är regeln
dekoration.

☠️ SEX MUTATIONER ÄR RUNDANS EGNA FYND, inte ärvda:
   * att sälja dubbelstolen som ett 2-PACK (rundans hela anledning att finnas)
   * att sälja ett tvåpack som EN dubbelstol — samma fel åt andra hållet
   * att skriva 250 kg som ett tal PER PERSON
   * hälsopåståendet källan gör om `bdb600fe`
   * ordet `gaslyft`, som runda 80:s villkorstext bar med sig
   * ett tal i en LÄNKTEXT som inte är mätt på den länkade sidan

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
    # ── ☠️ RUNDANS EGEN GRIND: antalet ───────────────────────────────────
    ("4401be4f", "ingress", "En <strong>dubbel campingstol</strong>",
     "Ett 2-pack <strong>campingstolar</strong>", "2-pack"),
    ("8b66533f", "eg", "EN stol med två stoppade sitsar, inte två lösa stolar",
     "Två stolar i leveransen", "två stolar"),
    ("65c84a9b", "spec", "Antal sitsar: 2 i samma stol",
     "Antal: 2 stolar", "Antal sitsar:"),
    ("6307893c", "ingress", "Två <strong>campingstolar</strong>",
     "En <strong>dubbelstol</strong>", "dubbelstol"),
    ("46d2c85a", "eg", "Två stolar i leveransen",
     "Två sitsar i samma stol", "två sitsar"),
    ("cce86277", "spec", "Antal: 2 stolar", "Antal: 4 stolar", "Antal:"),
    # ── förbjudna ord ────────────────────────────────────────────────────
    ("bdb600fe", "ingress", "med hög rygg och armstöd",
     "med hög rygg som lindrar muskelvärk", "hälsopåstående"),
    ("e39db7dd", "ingress", "Två hopfällbara <strong>trädgårdsstolar</strong>",
     "Två ergonomiska <strong>trädgårdsstolar</strong>", "ergonomisk"),
    ("cce86277", "ingress", "Sitthöjden är 44 cm",
     "Höjden ställs med gaslyft och sitthöjden är 44 cm", "gaslyft"),
    ("4401be4f", "ingress", "En <strong>dubbel campingstol</strong>",
     "En <strong>dubbel kontorsstol</strong>", "kontorsstol"),
    ("46d2c85a", "ingress", "Två stoppade <strong>campingstolar</strong>",
     "Två stoppade Outsunny-<strong>campingstolar</strong>", "outsunny"),
    ("e39db7dd", "ingress", "De kommer färdigmonterade",
     "Skickas från Tyskland. De kommer färdigmonterade", "landsnamn"),
    ("bdb600fe", "ingress", "Sitthöjden är 37 cm",
     "Sitthöjden (art.nr 845-030CG) är 37 cm", "artikelnummer"),
    ("cce86277", "ingress", "Stommen är pulverlackerat stål",
     "Leverantören uppger att stommen är pulverlackerat stål", "leverantör"),
    ("6307893c", "ingress", "Fotstödet är avtagbart",
     "Ligger i EU-lager. Fotstödet är avtagbart", "lagerfras"),
    # ── talgrinden: ett tal som inte står i produktens egen spec ──────────
    ("6307893c", "ingress", "nästan liggande i fyra lägen",
     "nästan liggande i fyra lägen med 55 cm sits", "55 cm"),
    ("46d2c85a", "ingress", "armstöden ligger 74 cm över marken",
     "armstöden ligger 78 cm över marken", "78 cm"),
    ("4401be4f", "ingress", "är 143 cm bred", "är 150 cm bred", "150 cm"),
    ("bdb600fe", "ingress", "Sitthöjden är 37 cm", "Sitthöjden är 39 cm", "39 cm"),
    ("cce86277", "ingress", "med 60 cm hög rygg", "med 65 cm hög rygg", "65 cm"),
    # ⚠️ 49, inte 48. Talgrinden frågar "står talet NÅGONSTANS i produktens
    #    egen spec?", inte "står det på RÄTT rad". 48 cm står i `Hopfälld
    #    (L × B × H): 100 × 48 × 10 cm`, så en felskriven sitthöjd på 48 cm
    #    hade passerat — och det är ingen bugg i grinden, det är dess kända
    #    räckvidd. Samma gräns som runda 79 skrev ned om maxlasten: intern
    #    konsekvens är allt linten kan mäta. Rätt rad är Steg 5:s jobb.
    ("e39db7dd", "ingress", "Sitthöjden är 46 cm", "Sitthöjden är 49 cm", "49 cm"),
    # ☠️ Rundans egen fälla: ett tal i en LÄNKTEXT som inte är mätt på målet.
    ("6307893c", "ingress", "en enkel campingstol som bär 159 kg",
     "en enkel campingstol som bär 165 kg", "som inte är mätt"),
    ("cce86277", "ingress", "fällstolarna med sitthöjd 37 cm",
     "fällstolarna med sitthöjd 35 cm", "som inte är mätt"),
    # ── utrustning: påstå något varan saknar ─────────────────────────────
    ("e39db7dd", "ingress", "Rottingflätningen ger efter",
     "Nackstödet är stoppat. Rottingflätningen ger efter", "nackstöd"),
    ("bdb600fe", "ingress", "Den låga sitsen gör dem",
     "En kylficka sitter på sidan. Den låga sitsen gör dem", "kylficka"),
    ("cce86277", "ingress", "Under benen sitter fottassar",
     "Under benen sitter mugghållare", "mugghållare"),
    # ── längder, sökord och form ─────────────────────────────────────────
    ("6307893c", "title", None,
     "Campingstolar 2-pack i grått med avtagbart fotstöd och fyra rygglägen | Fyndplats",
     "titeln är"),
    ("46d2c85a", "meta", None, "För kort meta.", "metan är"),
    ("4401be4f", "name", None, "Campingmöbel med två sitsar", "sökordet"),
    ("e39db7dd", "title", None, "Två stolar i akacia | Fyndplats", "sökordet"),
    ("cce86277", "ingress", "</p>", "<br></p>", "<br>"),
    # ── slug- och SKU-krock ──────────────────────────────────────────────
    ("8b66533f", "slug", None, "dubbel-campingstol-bla-tva-sitsar", "slug"),
    ("e39db7dd", "slug", None, "tradgardsstolar-hog-rygg-xx-pack", "SKU"),
    # ── FAQ ──────────────────────────────────────────────────────────────
    ("bdb600fe", "faq", None, [("Hur många?", "Två.")], "FAQ"),
    # ── spec-tabellens obligatoriska rader ───────────────────────────────
    ("e39db7dd", "spec", "Vikt: 13 kg för båda", "Nettovikt cirka 13 kg", "Vikt:"),
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
