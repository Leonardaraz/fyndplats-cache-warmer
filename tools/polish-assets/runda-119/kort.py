# -*- coding: utf-8 -*-
"""Runda 119 Steg 9 — nio Fyndplats-kort.

Klart-kriteriet kräver minst ett eget kort per polerad produkt. Här är kravet
dessutom skarpt av ett andra skäl: elva köksvagnar och två köksöar ligger REDAN
publicerade i samma prisspann, och kortet är det enda som skiljer dem i en
kategorilista.

☠️ RUBRIKEN BOR I texter.py, inte här. Runda 90 och 91 skrev fel färg två
   rundor i rad, och båda gångerna satt felet i kortrubriken, som aldrig
   lintades. `grind.py` läser `T.KORT` och kör den genom samma grindar som
   brödtexten — inklusive homoglyfgrinden.

☠️ INGA TVÅ KORT FÅR BLI IDENTISKA. `kontroll()` fäller före bygget, inte
   efter: ett kort som är fel har redan laddats upp när bygget är klart.
"""
import json
import os
import sys
import urllib.request

HAR = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, os.path.join(HAR, ".."))
sys.path.insert(0, HAR)
import kortbygge as KB                                            # noqa: E402
import matt as M                                                  # noqa: E402
import texter as T                                                # noqa: E402

BILDER = json.load(open(os.path.join(HAR, "bilder.json"), encoding="utf-8"))
RAW = os.path.join(HAR, "kortfoton")

# ☠️ Varje rad är (etikett, mall) och mallen fylls ur matt.py. Inget tal
#    skrivs för hand — kortet ska bära SAMMA siffra som spec-tabellen.
RADER = {
    "ad390a36": [("Mått", "{matt}"), ("Lådor", "{lador} st"),
                 ("Lådmått", "{lada_nedre}"), ("Maxlast", "{maxlast_kort}"),
                 ("Vikt", "{vikt}")],
    "dac7a904": [("Mått", "{matt}"), ("Arbetsyta", "{skiva}"),
                 ("Låda", "{lada_ovre}"), ("Maxlast", "{maxlast_kort}"),
                 ("Vikt", "{vikt}")],
    "c86ff1a6": [("Mått", "{matt}"), ("Vinfack", "{flaskor} platser"),
                 ("Arbetsyta", "{skiva}"), ("Maxlast", "{maxlast_kort}"),
                 ("Vikt", "{vikt}")],
    "5d1696db": [("Mått", "{matt}"), ("Glasyta", "{glasskiva}"),
                 ("Skåp", "{skap}"), ("Maxlast", "{maxlast_kort}"),
                 ("Vikt", "{vikt}")],
    "6cf7cfcf": [("Mått", "{matt}"), ("Lådor", "{lador} st"),
                 ("Bricka", "{bricka}"), ("Maxlast", "{maxlast_kort}"),
                 ("Vikt", "{vikt}")],
    "36526a8d": [("Mått", "{matt}"), ("Rostfri skiva", "{skiva}"),
                 ("Skåp", "{skap}"), ("Maxlast", "{maxlast_kort}"),
                 ("Vikt", "{vikt}")],
    "9e5e788c": [("Mått", "{matt}"), ("Skiva nedfälld", "{skiva_ned}"),
                 ("Skiva uppfälld", "{skiva}"), ("Maxlast", "{maxlast_kort}"),
                 ("Vikt", "{vikt}")],
    "d8bbbdde": [("Mått", "{matt}"), ("Bänkskiva", "{skiva}"),
                 ("Skåp", "{skap}"), ("Maxlast", "{maxlast_kort}"),
                 ("Vikt", "{vikt}")],
    "e0fed2c9": [("Mått", "{matt}"), ("Skiva nedfälld", "{skiva_ned}"),
                 ("Skiva uppfälld", "{skiva}"), ("Maxlast", "{maxlast_kort}"),
                 ("Vikt", "{vikt}")],
}


def specrader(pid):
    return [f"{e}: {mall.format(**M.M[pid])}" for e, mall in RADER[pid]]


def hamta(fid):
    os.makedirs(RAW, exist_ok=True)
    f = os.path.join(RAW, fid.split("_")[1].split("~")[0] + ".jpg")
    if not os.path.exists(f) or os.path.getsize(f) < 5000:
        for _ in range(3):
            with urllib.request.urlopen(
                    "https://static.wixstatic.com/media/%s/v1/fill/w_600,h_600,al_c,q_88/f.jpg" % fid,
                    timeout=90) as r:
                open(f, "wb").write(r.read())
            if os.path.getsize(f) > 5000:
                break
    return f


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
        for f in ("matt", "vikt"):
            if M.M[pid][f] not in rader:
                fel.append(f"{pid}: kortet saknar {f}")
        if len(specrader(pid)) != 5:
            fel.append(f"{pid}: kortet har {len(specrader(pid))} rader, ska ha 5")
    # ☠️ Rundans egen risk är sökordskrocken: elva köksvagnar ligger ute. Två
    #    kort med samma KICKER hjälper inte kunden att skilja dem åt i en lista.
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
    foton = {p: hamta(BILDER[p][0]) for p in M.ALLA}
    namn, facit = KB.bygg(HAR, produkter, kortdata, foton=foton)
    json.dump(facit, open("kort-facit.json", "w"), ensure_ascii=False, indent=1)
    for n in namn:
        print(f"  {n}  {os.path.getsize('jpg/%s.jpg' % n):>7} byte")
