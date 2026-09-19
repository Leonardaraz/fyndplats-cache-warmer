# -*- coding: utf-8 -*-
"""Runda 78 — bevisar att linten BITER.

En grön lint säger bara att den inte skriker. Testet nedan planterar ett känt
fel i taget och kräver att RÄTT regel fäller det. Fångar den inte, är regeln
dekoration.

☠️ Fyra mutationer är den här rundans egna fynd, inte ärvda:
   * ordet `ergonomisk` (tre av åtta heter så i källan, utan belägg)
   * hälsopåståendena om hållning och ryggrad
   * att sälja en rullpall som kontorsstol
   * ett tal i en LÄNKTEXT som inte är mätt på den länkade sidan

⚠️ Mutationer med scope `"*"` skriver om namn, titel, meta, ingress, punkter,
   spec, skötsel, villkor och FAQ på en gång. Runda 77 mätte varför: en
   mutation som bara rör ingressen kan lämna beviset kvar i spec-tabellen, och
   då fäller grinden av rätt skäl på fel ställe — den ser ut att fungera medan
   den egentligen aldrig prövades.
"""
import copy
import re
import sys

import lint
import texter

MUTATIONER = [
    # (kort, fält, sök, ersätt, förväntad delsträng i felet)
    # ── förbjudna ord ────────────────────────────────────────────────────
    ("5646a8ff", "ingress", "En <strong>verkstadspall</strong>", "En <strong>ergonomisk verkstadspall</strong>", "ergonomisk"),
    ("f18dfc3b", "ingress", "vippar upp till 5°", "vippar upp till 5° och förbättrar din hållning", "hälsopåstående"),
    ("239e68b8", "ingress", "formgjutet skum", "formgjutet skum som avlastar ryggen", "hälsopåstående"),
    ("15ff0d64", "ingress", "En <strong>arbetspall</strong>", "En <strong>kontorsstol</strong>", "kontorsstol"),
    ("d348bf64", "ingress", "En <strong>rullpall</strong>", "En <strong>rullpall</strong> i Kunstleder", "kunstleder"),
    ("fa078e03", "ingress", "En <strong>rullpall</strong> i beige", "En Vinsetto-rullpall i beige", "vinsetto"),
    ("87de04ad", "ingress", "Fotkrysset är brett", "Skickas från Tyskland. Fotkrysset är brett", "landsnamn"),
    ("28532aab", "ingress", "rutstickad sits", "rutstickad sits (art.nr 921-835V00PK)", "artikelnummer"),
    ("5646a8ff", "ingress", "Sitthöjden är fast", "Leverantören uppger att sitthöjden är fast", "leverantör"),
    ("239e68b8", "ingress", "Ingen rygg", "Ligger i EU-lager. Ingen rygg", "lagerfras"),
    # ── talgrinden: ett tal som inte står i produktens egen spec ──────────
    ("5646a8ff", "ingress", "fast på 35 cm", "fast på 38 cm", "38 cm"),
    ("f18dfc3b", "ingress", "56,5 till 71,5 cm", "56,5 till 74 cm", "74 cm"),
    ("239e68b8", "ingress", "9 cm formgjutet", "11 cm formgjutet", "11 cm"),
    ("15ff0d64", "ingress", "går 49–65 cm", "går 49–68 cm", "68 cm"),
    ("d348bf64", "ingress", "Ø 35 cm, och går 43–55", "Ø 37 cm, och går 43–55", "37 cm"),
    ("28532aab", "ingress", "Ø 35,5 cm, och går 48–63", "Ø 35,5 cm, och går 48–66", "66 cm"),
    # ☠️ Rundans egen fälla: ett tal i en LÄNKTEXT som inte är mätt på målet.
    ("239e68b8", "ingress", "rullpallarna i 2-pack", "rullpallarna i 2-pack med 9 cm skum", "som inte är mätt"),
    ("15ff0d64", "ingress", "sitthöjd 51–67 cm", "sitthöjd 51–70 cm", "som inte är mätt"),
    # ── utrustning: påstå något varan saknar ─────────────────────────────
    ("f18dfc3b", "*", "saknar ryggstöd|inte finns något ryggstöd|inget ryggstöd", "har ett ryggstöd", "ryggstöd"),
    ("239e68b8", "*", "Ingen rygg", "Med rygg och ett stadigt ryggstöd", "ryggstöd"),
    # ⚠️ Scope `ingress`, inte `*`: en mutation som ALLTID skriver om specen
    #    gör påståendet sant och prövar därför aldrig grinden.
    ("28532aab", "ingress", "till ett arbetsbord", "till ett arbetsbord, båda med fotring", "fotring"),
    ("f18dfc3b", "ingress", "en pall som står stilla", "en pall som står stilla på bromsade hjul", "broms"),
    # ⚠️ Scope `eg`, inte `*`. Ett tal som byts ÖVERALLT — spec, punkter,
    #    namn och villkor — är internt konsekvent, och linten mäter just
    #    intern konsekvens. Den kan alltså INTE fånga en maxlast som är fel
    #    i hela produkten; det gör bara Steg 5:s läsning mot ritningen.
    #    Mutationen planterar därför felet i punktlistan och låter specen
    #    stå kvar, vilket är det fall grinden finns för.
    ("5646a8ff", "eg", "Bär 135 kg", "Bär 150 kg", "150 kg"),
    ("15ff0d64", "spec", "Montering: krävs", "Verktyg: insexnyckel", "Montering:"),
    # ── längder, sökord och form ─────────────────────────────────────────
    ("5646a8ff", "title", None, "Verkstadspall på hjul med lådor, verktygsfack och bromsade hjul | Fyndplats", "titeln är"),
    ("f18dfc3b", "meta", None, "För kort meta.", "metan är"),
    ("239e68b8", "name", None, "Pall utan rygg", "sökordet"),
    ("87de04ad", "title", None, "Pall med ringrygg 45–57 cm | Fyndplats", "sökordet"),
    ("d348bf64", "ingress", "</p>", "<br></p>", "<br>"),
    # ── slug- och SKU-krock ──────────────────────────────────────────────
    ("fa078e03", "slug", None, "rullpall-svart-rygg-43-55-cm", "slug"),
    ("87de04ad", "slug", None, "rullpall-svart-rygg-43-55-xx", "SKU"),
    # ── FAQ ──────────────────────────────────────────────────────────────
    ("28532aab", "faq", None, [("Är båda likadana?", "Ja.")], "FAQ"),
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
