# -*- coding: utf-8 -*-
"""Runda 120 Steg 11 — åtta Fyndplats-kort.

Klart-kriteriet kräver minst ett eget kort per polerad produkt. Här är kravet
skarpt av ett andra skäl: **noll publicerade barbordsset finns**, så de åtta
sidorna konkurrerar bara med varandra — och kortet är det enda som skiljer dem
i en kategorilista.

☠️ RUBRIKEN BOR I texter.py, inte här. Runda 90 och 91 skrev fel färg två
   rundor i rad, och båda gångerna satt felet i kortrubriken, som aldrig
   lintades. `grind.py` läser `T.KORT` och kör den genom samma grindar som
   brödtexten — inklusive homoglyfgrinden.

☠️ INGA TVÅ KORT FÅR BLI IDENTISKA. `kontroll()` fäller FÖRE bygget: ett kort
   som är fel har redan laddats upp när bygget är klart. Färgsyskonen
   `c88b5bbb` och `63a37524` gör risken konkret — identiska mått, identisk
   vikt, identisk last, och bara ytan skiljer.
"""
import json
import os
import sys

HAR = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, os.path.join(HAR, ".."))
sys.path.insert(0, HAR)
import kortbygge as KB                                            # noqa: E402
import matt as M                                                  # noqa: E402
import texter as T                                                # noqa: E402

# ☠️ Varje rad är (etikett, mall) och mallen fylls ur matt.py. Inget tal
#    skrivs för hand — kortet ska bära SAMMA siffra som spec-tabellen.
RADER = {
    "441d2209": [("Bord", "{bord}"), ("Pall", "{sits}"),
                 ("Sitthöjd", "{sitthojd} cm"), ("Maxlast skiva", "{bordlast}"),
                 ("Vikt", "{vikt}")],
    "394de213": [("Bord", "{bord}"), ("Hylla", "{hylla}"),
                 ("Sitthöjd", "{sitthojd} cm"), ("Maxlast skiva", "{bordlast}"),
                 ("Vikt", "{vikt}")],
    "f4ed1264": [("Bord", "{bord}"), ("Pall", "{sits}"),
                 ("Sitthöjd", "{sitthojd} cm"), ("Maxlast skiva", "{bordlast}"),
                 ("Vikt", "{vikt}")],
    "3b38e191": [("Bord", "{bord}"), ("Stol", "{sits}"),
                 ("Sitthöjd", "{sitthojd} cm"), ("Maxlast skiva", "{bordlast}"),
                 ("Vikt", "{vikt}")],
    "51c43e67": [("Bord", "{bord}"), ("Sittyta", "{sitsyta}"),
                 ("Ryggstöd", "{rygg}"), ("Maxlast skiva", "{bordlast}"),
                 ("Vikt", "{vikt}")],
    # ☠️ c3bda64a saknar VIKT med flit — se regel 7 i matt.py. Kortet visar
    #    maxlasten på hyllplanen i stället, som är produktens egen särart.
    "c3bda64a": [("Bord", "{bord}"), ("Hyllplan", "{hylla_kort}"),
                 ("Sitthöjd", "{sitthojd} cm"), ("Maxlast skiva", "{bordlast}"),
                 ("Maxlast hyllplan", "{hyllast}")],
    "c88b5bbb": [("Bord", "{bord}"), ("Yta", "{yta}"),
                 ("Sitthöjd", "{sitthojd} cm"), ("Maxlast skiva", "{bordlast}"),
                 ("Vikt", "{vikt}")],
    "63a37524": [("Bord", "{bord}"), ("Yta", "{yta}"),
                 ("Sitthöjd", "{sitthojd} cm"), ("Maxlast skiva", "{bordlast}"),
                 ("Vikt", "{vikt}")],
}


def specrader(pid):
    return [f"{e}: {mall.format(**M.M[pid])}" for e, mall in RADER[pid]]


def kontroll():
    """Fäller FÖRE bygget — ett kort som är fel har redan laddats upp efteråt."""
    sedda, fel = {}, []
    for pid in M.ALLA:
        kicker, rubrik = T.KORT[pid]
        n = (kicker, rubrik, tuple(specrader(pid)))
        if n in sedda:
            fel.append(f"{pid} och {sedda[n]} får IDENTISKA kort")
        sedda[n] = pid
        rader = " ".join(specrader(pid))
        # Bordets mått och rundans säkerhetssiffra måste stå på varje kort.
        for f_ in ("bord", "bordlast"):
            if M.M[pid][f_] not in rader:
                fel.append(f"{pid}: kortet saknar {f_}")
        # ☠️ Ett OVERIFIERAT fält får aldrig nå ett kort. `None` renderas som
        #    strängen "None" av format() och hade sett ut som en produktuppgift.
        if "None" in rader:
            fel.append(f"{pid}: kortet bär ett OVERIFIERAT fält — {rader}")
        if len(specrader(pid)) != 5:
            fel.append(f"{pid}: kortet har {len(specrader(pid))} rader, ska ha 5")
    # ☠️ Två kort med samma KICKER hjälper inte kunden att skilja sidorna åt.
    kickers = {}
    for pid in M.ALLA:
        k = T.KORT[pid][0]
        if k in kickers:
            fel.append(f"{pid} och {kickers[k]} delar kicker {k!r}")
        kickers[k] = pid
    return fel


if __name__ == "__main__":
    f = kontroll()
    print(f"kort.kontroll: {len(M.ALLA)} produkter, {len(f)} fel")
    for x in f:
        print("  ✗", x)
    if f:
        sys.exit(1)
    os.chdir(HAR)
    produkter = [{"kort": p, "spec": specrader(p)} for p in M.ALLA]
    kortdata = {p: (T.KORT[p][0], T.KORT[p][1],
                    [(e, i) for i, (e, _) in enumerate(RADER[p])]) for p in M.ALLA}
    # Hjältebilden ligger redan nerladdad i rawbilder/ från Steg 4 — ingen
    # extra hämtning behövs, och den bilden är exakt den kunden ser först.
    foton = {p: os.path.join(HAR, "rawbilder", f"{p}-01.jpg") for p in M.ALLA}
    namn, facit = KB.bygg(HAR, produkter, kortdata, foton=foton)
    json.dump(facit, open("kort-facit.json", "w"), ensure_ascii=False, indent=1)
    for n in namn:
        print(f"  {n}  {os.path.getsize('jpg/%s.jpg' % n):>7} byte")
