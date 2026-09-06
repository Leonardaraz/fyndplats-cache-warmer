# -*- coding: utf-8 -*-
"""Runda 80 — bevisar att linten BITER.

En grön lint säger bara att den inte skriker. Testet nedan planterar ett känt
fel i taget och kräver att RÄTT regel fäller det. Fångar den inte, är regeln
dekoration.

☠️ Rundans egna fynd, inte ärvda:
   * HJUL på en stol som står på fast fot — fyra av åtta har ingen enda rulle,
     och källan kallar en av dem `Arbeitshocker`, alltså precis den sortens
     stol man ANTAR rullar
   * ordet `kontorsstol` på de fyra som INTE är kontorsstolar (och tillåtet på
     de fyra som ÄR det — förbudet är per produkt, avgjort på sluggen)
   * ett ogrundat tal om ANDRA möbler: bordshöjder och andra stolars sitsbredd
   * sökordsgrinden mot ett huvudord med å (`snurrfåtölj` mot `snurrfatolj-`)

"""
import copy
import re
import sys

import lint
import texter

MUTATIONER = [
    # (kort, fält, sök, ersätt, förväntad delsträng i felet)
    # ── förbjudna ord ────────────────────────────────────────────────────
    ("b9ab45db", "ingress", "En <strong>snurrfåtölj</strong>", "En <strong>ergonomisk snurrfåtölj</strong>", "ergonomisk"),
    ("2cae1147", "ingress", "möbelutseende i stället för ett", "bättre hållning och ett möbelutseende i stället för ett", "hälsopåstående"),
    ("5302daf2", "ingress", "Sittdynan är fickfjädrad", "Sittdynan avlastar ryggen och är fickfjädrad", "hälsopåstående"),
    ("57ae1ddf", "ingress", "Den svarta <strong>snurrfåtöljen</strong>", "Den svarta <strong>Kunstleder-snurrfåtöljen</strong>", "kunstleder"),
    ("0fe80797", "ingress", "Den mörkgrå <strong>snurrfåtöljen</strong>", "Den mörkgrå Vinsetto-<strong>snurrfåtöljen</strong>", "vinsetto"),
    ("558eb67a", "ingress", "Stoppningen är 10 cm", "Skickas från Tyskland. Stoppningen är 10 cm", "landsnamn"),
    ("7046314f", "ingress", "Sitsen är rund", "Sitsen (art.nr 921-835V00PK) är rund", "artikelnummer"),
    ("bd554433", "ingress", "Sitthöjden går 50–60 cm", "Leverantören uppger att sitthöjden går 50–60 cm", "leverantör"),
    ("2cae1147", "ingress", "Stoppningen är 10 cm", "Ligger i EU-lager. Stoppningen är 10 cm", "lagerfras"),
    # ── rundans egen grind: HJUL på en stol som står på fast fot ──────────
    ("b9ab45db", "ingress", "snurrar på stället", "rullar mjukt på sina hjul", "hjul"),
    ("558eb67a", "eg", "Sitsen snurrar 360°", "Sitsen snurrar 360° och stolen rullar på hjul", "hjul"),
    # ── rundans egen grind: kontorsstol på en stol som inte är det ────────
    ("b9ab45db", "ingress", "En <strong>snurrfåtölj</strong>", "En <strong>kontorsstol</strong>", "kontorsstol"),
    ("558eb67a", "ingress", "En <strong>reclinerfåtölj</strong>", "En <strong>arbetsstol</strong>", "arbetsstol"),
    # ── talgrinden: ett tal som inte står i produktens egen spec ──────────
    ("b9ab45db", "ingress", "höjden ställs med gaslyft", "höjden ställs 45–58 cm med gaslyft", "58 cm"),
    ("558eb67a", "ingress", "till 130° och sitsen", "till 140° och sitsen", "140"),
    ("7046314f", "ingress", "Sitthöjden går 43–53 cm", "Sitthöjden går 43–55 cm", "55 cm"),
    ("2cae1147", "ingress", "Stoppningen är 10 cm", "Stoppningen är 12 cm", "12 cm"),
    ("5302daf2", "ingress", "ryggen 69 cm hög", "ryggen 72 cm hög", "72 cm"),
    ("bd554433", "ingress", "tillsammans 12 cm", "tillsammans 14 cm", "14 cm"),
    # ☠️ Ett tal i en LÄNKTEXT som inte är mätt på målet.
    ("558eb67a", "ingress", "på träfötter som bär 150 kg", "på träfötter som bär 160 kg", "som inte är mätt"),
    # ── utrustning: påstå något varan saknar ─────────────────────────────
    ("57ae1ddf", "*", "Rund kromad fot", "Nackstöd och rund kromad fot", "nackstöd"),
    ("7046314f", "ingress", "Sitsen är rund", "Sitsen har fotring och är rund", "fotring"),
    ("bd554433", "ingress", "Hjulen är av den tystgående sorten", "Hjulen har broms och är av den tystgående sorten", "broms"),
    # ── maxlast planterad i punktlistan, spec kvar (se runda 78) ──────────
    ("b9ab45db", "eg", "Bär 136 kg", "Bär 150 kg", "150 kg"),
    ("7046314f", "eg", "Bär 120 kg", "Bär 130 kg", "130 kg"),
    ("2cae1147", "spec", "Montering: krävs", "Verktyg: insexnyckel", "Montering:"),
    # ── längder, sökord och form ─────────────────────────────────────────
    ("b9ab45db", "title", None, "Snurrfåtölj ljusgrå i linnelook med U-formad rygg och rund kromad fot | Fyndplats", "titeln är"),
    ("0fe80797", "meta", None, "För kort meta.", "metan är"),
    ("57ae1ddf", "name", None, "Fåtölj i linnelook", "sökordet"),
    ("5302daf2", "title", None, "Bred modell 150 kg | Fyndplats", "sökordet"),
    ("bd554433", "ingress", "</p>", "<br></p>", "<br>"),
    # ── slug- och SKU-krock ──────────────────────────────────────────────
    ("0fe80797", "slug", None, "snurrfatolj-ljusgra-linnelook-fast-fot", "slug"),
    ("57ae1ddf", "slug", None, "snurrfatolj-morkgra-linnelook-fast-xx", "SKU"),
    # ── FAQ ──────────────────────────────────────────────────────────────
    ("5302daf2", "faq", None, [("Är den bred?", "Ja.")], "FAQ"),
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
                # ☠️ RUBRIKEN med. "Bär 135 kg" renderas som <h2> och lämnades
                #    orörd, så en mutation av maxlasten lämnade kvar det gamla
                #    talet och grinden fällde av rätt skäl på fel ställe.
                p["villkor"] = (re.sub(sok, ers, p["villkor"][0], flags=re.I),
                                [re.sub(sok, ers, r, flags=re.I) for r in p["villkor"][1]])
            elif falt in ("eg", "spec", "skotsel"):
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
