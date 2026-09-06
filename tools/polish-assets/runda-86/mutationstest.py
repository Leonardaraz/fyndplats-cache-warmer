# -*- coding: utf-8 -*-
"""Runda 86 — bevisar att linten BITER.

En grön lint säger bara att den inte skriker. Testet nedan planterar ett känt
fel i taget och kräver att RÄTT regel fäller det. Fångar den inte, är regeln
dekoration.

☠️ RUNDANS EGNA FYND, MUTERADE ETT I TAGET:
   * maxlasten åt tre håll — ett syskons tal, ett saknat tal, och ett tal
     på den produkt vars källa inte anger något
   * avsaknaden av maxlast som SIDANS RUBRIK i stället för som en fråga
   * förankringen åt BÅDA håll: en som saknar den påstår att den ingår, och
     en som har den tappar den ur `Ingår:`
   * en färgrad som får syskonets färg, och ett färgpåstående i brödtexten
   * ett bygglovspåstående
   * "vattentät" på ett skåp vars tak källan aldrig kallar vattentätt
   * ett främmande stommaterial

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
    # ── ☠️ MAXLASTEN, ÅT TRE HÅLL ───────────────────────────────────────
    ("c9a24404", "spec", "Maxlast: 6 kg per hyllplan",
     "Maxlast: 20 kg per hyllplan", "saknar 6 kg"),
    ("c9a24404", "eg", "6 kg per hyllplan", "20 kg per hyllplan",
     "det är 364bc564:s maxlast"),
    ("d6666869", "spec", "Yttermått (B × D × H): 79 × 49 × 191,5 cm",
     "Maxlast: 20 kg per hyllplan", "källan anger ingen"),
    # ── ☠️ AVSAKNADEN SOM RUBRIK ────────────────────────────────────────
    ("d6666869", "title", "Trädgårdsskåp 191,5 cm med sadeltak | Fyndplats",
     "Trädgårdsskåp utan angiven maxlast | Fyndplats",
     "avsaknaden av maxlast står i namn"),
    # ── ☠️ FÖRANKRINGEN, ÅT BÅDA HÅLL ───────────────────────────────────
    ("c9a24404", "spec", "Ingår: skåp och monteringsanvisning",
     "Ingår: skåp, fyra markpinnar och monteringsanvisning",
     "lovar förankring"),
    ("43e312b7", "spec",
     "Ingår: skåp, fyra markpinnar och monteringsanvisning",
     "Ingår: skåp och monteringsanvisning", "levereras med markpinnar"),
    ("364bc564", "eg", "Monteras, förankring ingår inte",
     "Monteras. L-järn och markpinnar ingår",
     "påstår att förankring ingår"),
    # ── ☠️ FÄRGEN ───────────────────────────────────────────────────────
    ("43e312b7", "spec", "Färg: grå med vita lister",
     "Färg: naturträ", "men färgen är grå"),
    ("c9a24404", "ingress", "115 cm högt — det låga skåpet i familjen",
     "En grå stomme i 115 cm — det låga skåpet i familjen",
     "hör till ett SYSKON"),
    # ── ☠️ BYGGLOV ──────────────────────────────────────────────────────
    ("1e11480e", "ingress", "Golvytan är 0,30 kvadratmeter",
     "Skåpet är bygglovsfritt och golvytan är 0,30 kvadratmeter",
     "bygglov"),
    # ── ☠️ ABSOLUTA PÅSTÅENDEN ──────────────────────────────────────────
    ("364bc564", "eg", "Tak klätt med bitumenpapp",
     "Vattentätt tak klätt med bitumenpapp",
     "bara asfalttaket på 8b00022f"),
    ("d6666869", "eg", "Massiv gran, naturfärgad",
     "Massiv gran, naturfärgad och underhållsfri",
     "absolut påstående"),
    # ── ☠️ MATERIALET ───────────────────────────────────────────────────
    ("8b00022f", "spec", "Material: lackerad gran",
     "Material: lackerad furu", "familjen är gran"),
    ("bb112e08", "eg", "Grå stomme med vita lister, mörkt tak",
     "Stomme i pulverlackerad metall, mörkt tak", "stommen är gran"),
    # ── ☠️ HUSREGLER SOM GÄLLER VARJE RUNDA ─────────────────────────────
    ("8b00022f", "*", "trädgårdsskåp", "Outsunny-trädgårdsskåp",
     "förbjudet ord"),
    ("1e11480e", "ingress", "Fönstret högst upp släpper ut fukt",
     "Leverantören uppger att fönstret högst upp släpper ut fukt",
     "förbjudet ord"),
    ("43e312b7", "eg", "Krokar i sidorna och på insidan av dörren",
     "Krokar i sidorna, samma lösning som i rundans andra skåp",
     "intern jargong"),
    # ☠️ Muterad genom att LÄGGA TILL, inte byta ut. Ett byte i spec-raden
    #    ändrar BÅDA sidor av jämförelsen och provar därför ingenting —
    #    runbokens egen varning, mätt en gång till här.
    ("364bc564", "ingress", "87 cm brett och 46,5 cm djupt",
     "87 cm brett och 46,5 cm djupt, med 0,43 m² golvyta",
     "tal som inte står i produktens egen spec"),
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
