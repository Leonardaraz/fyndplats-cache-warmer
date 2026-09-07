# -*- coding: utf-8 -*-
"""Runda 97 — ett eget Fyndplats-kort per produkt (Leonards krav 2026-08-26).

Kortet är det enda i galleriet som är VÅRT. Utan det är sidan en
vidarebefordran av leverantörens marknadsföring.

☠️ VÄRDET HÄRLEDS ur spec-tabellen — `kortbygge.varde()` läser raden och tar
   det som står efter kolonet, och kräver att kortets etikett hör ihop med
   raden. Ett kort kan alltså inte skriva ett tal som inte står i tabellen.

⚠️ RUBRIKEN MÅSTE BÄRAS AV FOTOT. Den kontrollen är min, inte kodens: varje
   rubrik nedan pekar på något som SYNS i bild 1. "Fyra höjder" fungerar för
   att bild 1 på 1fc55b3d har de fyra lägena som småbilder under produkten.
"""
import sys

sys.path.insert(0, "/home/user/fyndplats-cache-warmer/tools/polish-assets")
import kortbygge                                                  # noqa: E402
import texter as T                                                # noqa: E402

KORT = {
    "e8102582": ("Upphöjd matskål", "Höjden ställs mellan 11 och 33 cm",
                 ["Skålhöjd över golv", "Skålar", "Vikt"]),
    "1fc55b3d": ("Matskålsställ", "Fyra höjder och tre lutningar",
                 ["Höjdlägen", "Lutningslägen", "Skålar"]),
    "2e2b2366": ("Matplats för hund", "Tre höjdlägen i kaffebrunt",
                 ["Höjdlägen", "Skålar", "Mått"]),
    "868cc038": ("Matskåp för hund", "34 cm högt, med skjutdörrar",
                 ["Mått", "Förvaring invändigt", "Skålar"]),
    "7628983b": ("Matskåp för hund", "42 cm högt, 30 liter förvaring",
                 ["Mått", "Förvaring invändigt", "Skålar"]),
    "75556831": ("Husdjursskåp", "82 cm med matplats i låda",
                 ["Mått", "Stängt skåp", "Skålar"]),
}


def specrader(pid):
    """Spec-tabellen som "Etikett: värde"-strängar — kortbyggets indataform."""
    return ["%s: %s" % (k, v) for k, v in T.SPEC[pid]]


if __name__ == "__main__":
    produkter, kortdata = [], {}
    for pid in T.PRODUKTER:
        kicker, rubrik, etiketter = KORT[pid]
        rader = specrader(pid)
        idx = []
        for e in etiketter:
            träff = [i for i, r in enumerate(rader) if r.startswith(e + ":")]
            if not träff:
                raise SystemExit("kortet på %s pekar på raden %r som inte finns"
                                 % (pid, e))
            idx.append((e, träff[0]))
        produkter.append({"kort": pid, "spec": rader})
        kortdata[pid] = (kicker, rubrik, idx)
    namn, facit = kortbygge.bygg(".", produkter, kortdata)
    import json
    json.dump(facit, open("kort-facit.json", "w", encoding="utf-8"),
              ensure_ascii=False, indent=1)
    print("\n%d kort byggda" % len(namn))
