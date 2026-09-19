# -*- coding: utf-8 -*-
"""Runda 79 — bevisar att linten BITER.

En grön lint säger bara att den inte skriker. Testet nedan planterar ett känt
fel i taget och kräver att RÄTT regel fäller det. Fångar den inte, är regeln
dekoration.

☠️ Fem mutationer är den här rundans egna fynd, inte ärvda:
   * ordet `ergonomisk` (källan kallar tre av åtta så, utan belägg)
   * hälsopåståendena om hållning och ryggrad
   * att sälja en rullpall som kontorsstol
   * ett tal i en LÄNKTEXT som inte är mätt på den länkade sidan
   * TVÅPACKETS maxlast skriven som summan i stället för per pall

⚠️ `1d0ba82d` bär 110 kg, ensam i serien. Två mutationer prövar just det:
   att skriva 120 i punktlistan, och att låta ett syskons tal stå UTANFÖR
   ankartexten. Båda var verkliga fel i första utkastet av texten.

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
    ("983fe163", "ingress", "En <strong>rullpall med rygg</strong>", "En <strong>ergonomisk rullpall med rygg</strong>", "ergonomisk"),
    ("12ce97db", "ingress", "höfterna hamnar öppnare", "höfterna hamnar öppnare och hållningen blir rakare", "hälsopåstående"),
    ("93b7d87b", "ingress", "mer stoppning än pallarna", "avlastar ryggraden och har mer stoppning än pallarna", "hälsopåstående"),
    ("711f7859", "ingress", "En <strong>salongspall</strong>", "En <strong>kontorsstol</strong>", "kontorsstol"),
    ("98c1b3cb", "ingress", "Den svarta <strong>rullpallen", "Den svarta Kunstleder-<strong>rullpallen", "kunstleder"),
    ("20782c24", "ingress", "Den rosa <strong>sadelpallen</strong>", "Den rosa Vinsetto-<strong>sadelpallen</strong>", "vinsetto"),
    ("c328a7c0", "ingress", "Priset gäller båda", "Skickas från Tyskland. Priset gäller båda", "landsnamn"),
    ("1d0ba82d", "ingress", "Sitsen är Ø 32 cm", "Sitsen (art.nr 921-835V00PK) är Ø 32 cm", "artikelnummer"),
    ("983fe163", "ingress", "Ryggstödet är 33 cm brett", "Leverantören uppger att ryggstödet är 33 cm brett", "leverantör"),
    ("93b7d87b", "ingress", "Klädseln är vattentät", "Ligger i EU-lager. Klädseln är vattentät", "lagerfras"),
    # ── talgrinden: ett tal som inte står i produktens egen spec ──────────
    ("983fe163", "ingress", "höjer du sitsen till 64 cm", "höjer du sitsen till 67 cm", "67 cm"),
    ("711f7859", "ingress", "Sitthöjden går till 73 cm", "Sitthöjden går till 76 cm", "76 cm"),
    ("93b7d87b", "ingress", "seriens högsta rygg: 28 cm", "seriens högsta rygg: 30 cm", "30 cm"),
    ("12ce97db", "ingress", "45 cm i understa läget", "44 cm i understa läget", "44 cm"),
    ("1d0ba82d", "ingress", "vid 64 cm sitthöjd", "vid 66 cm sitthöjd", "66 cm"),
    ("c328a7c0", "ingress", "34 cm brett och 4,5 cm högt", "34 cm brett och 6 cm högt", "6 cm"),
    # ☠️ Rundans egen fälla: ett tal i en LÄNKTEXT som inte är mätt på målet.
    ("12ce97db", "ingress", "den bruna sadelpallen med sitthöjd 49–61 cm", "den bruna sadelpallen med sitthöjd 49–64 cm", "som inte är mätt"),
    ("1d0ba82d", "ingress", "arbetspallen med hjul, sitthöjd 48–63 cm", "arbetspallen med hjul, sitthöjd 48–66 cm", "som inte är mätt"),
    # ── utrustning: påstå något varan saknar ─────────────────────────────
    ("12ce97db", "*", "Helt utan ryggstöd", "Med ett stadigt ryggstöd", "ryggstöd"),
    ("20782c24", "*", "Helt utan ryggstöd", "Med ett stadigt ryggstöd", "ryggstöd"),
    # ⚠️ Scope `ingress`, inte `*`: en mutation som ALLTID skriver om specen
    #    gör påståendet sant och prövar därför aldrig grinden.
    ("711f7859", "ingress", "Skummet är 8 cm", "Fotringen sitter runt pelaren. Skummet är 8 cm", "fotring"),
    ("93b7d87b", "ingress", "Klädseln är vattentät", "Hjulen har broms. Klädseln är vattentät", "broms"),
    # ⚠️ Scope `eg`, inte `*`. Ett tal som byts ÖVERALLT — spec, punkter,
    #    namn och villkor — är internt konsekvent, och linten mäter just
    #    intern konsekvens. Den kan alltså INTE fånga en maxlast som är fel
    #    i hela produkten; det gör bara Steg 5:s läsning mot ritningen.
    ("1d0ba82d", "eg", "Bär 110 kg", "Bär 120 kg", "120 kg"),
    ("c328a7c0", "eg", "Bär 120 kg per pall", "Bär 240 kg", "240 kg"),
    ("983fe163", "spec", "Montering: krävs", "Verktyg: insexnyckel", "Montering:"),
    # ── längder, sökord och form ─────────────────────────────────────────
    ("983fe163", "title", None, "Rullpall vit med oval rygg på fjäderstam och fotring runt pelaren | Fyndplats", "titeln är"),
    ("98c1b3cb", "meta", None, "För kort meta.", "metan är"),
    ("12ce97db", "name", None, "Pall utan rygg", "sökordet"),
    ("1d0ba82d", "title", None, "Vit modell 50–64 cm | Fyndplats", "sökordet"),
    ("20782c24", "ingress", "</p>", "<br></p>", "<br>"),
    # ── slug- och SKU-krock ──────────────────────────────────────────────
    ("98c1b3cb", "slug", None, "rullpall-vit-oval-rygg-48-64-cm", "slug"),
    ("93b7d87b", "slug", None, "salongspall-kupad-rygg-53-73-xx", "SKU"),
    # ── FAQ ──────────────────────────────────────────────────────────────
    ("c328a7c0", "faq", None, [("Är båda likadana?", "Ja.")], "FAQ"),
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
