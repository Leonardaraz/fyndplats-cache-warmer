# -*- coding: utf-8 -*-
"""Runda 100 — ett eget Fyndplats-kort per bord (Leonards krav 2026-08-26).

Kortet är det enda i galleriet som är VÅRT. Utan det är sidan en
vidarebefordran av leverantörens marknadsföring.

☠️ VÄRDET HÄRLEDS ur spec-tabellen — `kortbygge.varde()` läser raden och tar
   det som står efter kolonet. Ett kort kan alltså inte skriva ett tal som
   inte står i tabellen.

⚠️ RUBRIKEN MÅSTE BÄRAS AV FOTOT, och bild 1 är på alla sex en ren
   studiorendering av bordet:
     e71acc53  lamellskivan syns rakt uppifrån
     f806eebf  teaktonad skiva mot mörka vinklade ben
     4249df4d  glasskivan OCH hyllan under den syns båda
     29c688dc  bordet står HALVT utdraget, båda skivhalvorna syns
     74d3c11c  bordet står utdraget
     c71418ca  bordet står utdraget
   Därav rubrikerna: de tre fasta beskriver skivan, de tre utdragbara
   beskriver utdraget — som är det fotot faktiskt visar.

☠️ SAMMA TVÅVÄGSGRIND SOM lint.py:s REGEL 2. Kortet är det första kunden ser;
   ett kort som lovar ett utdrag på ett bord med fast längd vore felet på den
   mest synliga ytan. Grinden kräver båda längderna på ett utdragbart kort och
   förbjuder varje utdragningsord på ett fast.

☠️ MAXLASTEN STÅR PÅ VARJE KORT, och den är per bord: 50 / 50 / 80 / 50 / 70 /
   70 kg. Grinden kontrollerar att kortets tal är produktens eget.
"""
import re
import sys

sys.path.insert(0, "/home/user/fyndplats-cache-warmer/tools/polish-assets")
import kortbygge                                                  # noqa: E402
import texter as T                                                # noqa: E402

KORT = {
    "e71acc53": ("Trädgårdsbord", "Lamellskiva i aluminium",
                 ["Mått", "Maxlast", "Vikt"]),
    "f806eebf": ("Trädgårdsbord", "WPC-skiva i teakton på metallram",
                 ["Mått", "Fri höjd under skivan", "Maxlast"]),
    "4249df4d": ("Trädgårdsbord", "Glasskiva med hylla under",
                 ["Mått", "Hylla under skivan", "Maxlast"]),
    "29c688dc": ("Utdragbart trädgårdsbord", "Dras ut från 80 till 160 cm",
                 ["Mått hopskjutet", "Mått utdraget", "Maxlast"]),
    "74d3c11c": ("Utdragbart trädgårdsbord", "Dras ut från 81 till 162 cm",
                 ["Mått hopskjutet", "Mått utdraget", "Maxlast"]),
    "c71418ca": ("Utdragbart trädgårdsbord", "Dras ut från 160 till 220 cm",
                 ["Mått hopskjutet", "Mått utdraget", "Maxlast"]),
}

UTDRAG = r"utdragbar|utdraget|dras\s+ut|drar\s+ut|hopskjut|iläggsskiv|fjärilsmekanism"


def specrader(pid):
    """Spec-tabellen som "Etikett: värde"-strängar — kortbyggets indataform."""
    return ["%s: %s" % (k, v) for k, v in T.SPEC[pid]]


def granska_kort(pid, kicker, rubrik):
    """Tvåvägsgrinden, spegling av lint.py:s regel 2 — plus maxlasten."""
    hel = (kicker + " " + rubrik).lower()
    if T.GRUPP[pid] == "U":
        if not re.search(UTDRAG, hel):
            raise SystemExit("kortet på %s säger inte att bordet dras ut" % pid)
        spec = dict(T.SPEC[pid])
        for vad, rad in (("hopskjutna", "Mått hopskjutet"),
                         ("utdragna", "Mått utdraget")):
            langd = spec[rad].split(" ×")[0]
            if langd not in rubrik:
                raise SystemExit("kortet på %s saknar det %s måttet %s"
                                 % (pid, vad, langd))
    else:
        tr = re.search(UTDRAG, hel)
        if tr:
            raise SystemExit("kortet på %s bär utdragningsordet %r på ett bord "
                             "med fast längd" % (pid, tr.group(0)))
    # ☠️ Maxlasten ska vara produktens EGEN, aldrig ett syskons.
    egen = "%d kg" % T.MAXLAST[pid]
    if dict(T.SPEC[pid])["Maxlast"] != egen:
        raise SystemExit("spec-tabellens maxlast på %s är inte %s" % (pid, egen))


if __name__ == "__main__":
    produkter, kortdata = [], {}
    for pid in T.PRODUKTER:
        kicker, rubrik, etiketter = KORT[pid]
        granska_kort(pid, kicker, rubrik)
        rader = specrader(pid)
        idx = []
        for e in etiketter:
            traff = [i for i, r in enumerate(rader) if r.startswith(e + ":")]
            if not traff:
                raise SystemExit("kortet på %s pekar på raden %r som inte finns"
                                 % (pid, e))
            idx.append((e, traff[0]))
        produkter.append({"kort": pid, "spec": rader})
        kortdata[pid] = (kicker, rubrik, idx)
    namn, facit = kortbygge.bygg(".", produkter, kortdata)
    import json
    json.dump(facit, open("kort-facit.json", "w", encoding="utf-8"),
              ensure_ascii=False, indent=1)

    # ☠️ KOPIERINGEN LIGGER HÄR, INTE I HANDEN (runda 97:s lärdom): kort/ var
    #    en handkopia och gled isär från jpg/ utan att bygget märkte något.
    import shutil, os
    os.makedirs("kort", exist_ok=True)
    for n_ in namn:
        shutil.copy2("jpg/%s.jpg" % n_, "kort/%s.jpg" % n_)
    print("\n%d kort byggda och kopierade till kort/" % len(namn))
