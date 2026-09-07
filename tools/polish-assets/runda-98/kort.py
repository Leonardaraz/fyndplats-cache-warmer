# -*- coding: utf-8 -*-
"""Runda 98 — ett eget Fyndplats-kort per produkt (Leonards krav 2026-08-26).

Kortet är det enda i galleriet som är VÅRT. Utan det är sidan en
vidarebefordran av leverantörens marknadsföring.

☠️ VÄRDET HÄRLEDS ur spec-tabellen — `kortbygge.varde()` läser raden och tar
   det som står efter kolonet. Ett kort kan alltså inte skriva ett tal som
   inte står i tabellen.

⚠️ RUBRIKEN MÅSTE BÄRAS AV FOTOT — runda 97:s dyraste kortlärdom: tre rubriker
   skrev spec-tabellens starkaste TAL i stället för fotots starkaste MOTIV, och
   ingen av dem var osann. Här visar bild 1 på alla sex ett STÄNGT skåp
   framifrån. Rubrikerna beskriver därför dörrarna och kulören, som är precis
   det man ser — inte förvaringsvolymen, som är dold i just den bilden.

☠️ OCH DE TRE MODELLERNAS DÖRRTYP FÅR INTE BLANDAS IHOP HÄR HELLER. Kortet är
   det första kunden ser; ett kort som säger "två luckor" på skjutdörrsskåpet
   hade varit runda 97:s 868cc038 en gång till, på den mest synliga ytan.
"""
import sys

sys.path.insert(0, "/home/user/fyndplats-cache-warmer/tools/polish-assets")
import kortbygge                                                  # noqa: E402
import texter as T                                                # noqa: E402

KORT = {
    "9cfc2f50": ("Matskåp för hund", "Vitt, två luckor och skålar i skivan",
                 ["Mått", "Förvaring invändigt", "Skålar"]),
    "18b9ec99": ("Matskåp för hund", "Grått, två luckor och skålar i skivan",
                 ["Mått", "Förvaring invändigt", "Skålar"]),
    "f8594223": ("Matskåp för hund", "Svart, två luckor och skålar i skivan",
                 ["Mått", "Förvaring invändigt", "Skålar"]),
    "d362f9b3": ("Matskåp för hund", "Vitt, med gallerluckor och svart regel",
                 ["Mått", "Förvaring invändigt", "Luckor"]),
    "9a600fda": ("Matskåp för hund", "Grått, med gallerluckor och svart regel",
                 ["Mått", "Förvaring invändigt", "Luckor"]),
    "143bef7b": ("Matskåp för hund", "Skjutdörrar i räfflad akryl",
                 ["Mått", "Förvaring invändigt", "Dörrar"]),
}

# ☠️ Dörrtypsgrind även på kortet, samma tvåvägsregel som lint.py:s regel 4.
DORR = {"A": ("luck", ("skjutdörr", "galler")),
        "B": ("galler", ("skjutdörr", "magnet")),
        "C": ("skjutdörr", ("gallerluck", "magnet"))}


def specrader(pid):
    """Spec-tabellen som "Etikett: värde"-strängar — kortbyggets indataform."""
    return ["%s: %s" % (k, v) for k, v in T.SPEC[pid]]


if __name__ == "__main__":
    produkter, kortdata = [], {}
    for pid in T.PRODUKTER:
        kicker, rubrik, etiketter = KORT[pid]
        kravs, forbjudna = DORR[T.GRUPP[pid]]
        lag = rubrik.lower()
        if kravs not in lag:
            raise SystemExit("kortrubriken på %s saknar %r" % (pid, kravs))
        for f in forbjudna:
            if f in lag:
                raise SystemExit("kortrubriken på %s bär %r — fel dörrtyp"
                                 % (pid, f))
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

    # ☠️ KOPIERINGEN LIGGER HÄR, INTE I HANDEN (runda 97:s lärdom): kort/ var
    #    en handkopia och glred isär från jpg/ utan att bygget märkte något.
    import shutil, os
    os.makedirs("kort", exist_ok=True)
    for n_ in namn:
        shutil.copy2("jpg/%s.jpg" % n_, "kort/%s.jpg" % n_)
    print("\n%d kort byggda och kopierade till kort/" % len(namn))
