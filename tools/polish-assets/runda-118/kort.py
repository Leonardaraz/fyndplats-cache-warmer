# -*- coding: utf-8 -*-
"""Runda 118 Steg 9 — nio Fyndplats-kort.

Klart-kriteriet kräver minst ett eget kort per polerad produkt. Här är kravet
dessutom skarpt av ett andra skäl: nio vagnar som liknar varandra behöver
något som skiljer dem i en kategorilista, och kortet är det enda vi styr över.

☠️ FÄRGSYSKONENS KORT MÅSTE SKILJA SIG. `15d6fcef` och `0fd65541` delar varenda
   tal; det enda som skiljer dem är skivans yta. `kontroll()` fäller om två kort
   blir identiska — samma spärr som runda 116 och 117.

☠️ RUBRIKEN BOR I texter.py, inte här. Runda 90 och 91 skrev fel färg två
   rundor i rad, och båda gångerna satt felet i kortrubriken, som aldrig
   lintades. `grind.py` läser `T.KORT` och kör den genom samma grindar som
   brödtexten.
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
    "764a3efc": [("Mått", "{matt}"), ("Lådor", "{antal_fack}"),
                 ("Lådmått", "{fack}"), ("Maxlast", "{maxlast_kort}"),
                 ("Vikt", "{vikt}")],
    "820d076b": [("Mått", "{matt}"), ("Brickor", "{antal_fack}"),
                 ("Brickmått", "{skiva}"), ("Maxlast", "{maxlast_kort}"),
                 ("Vikt", "{vikt}")],
    "15d6fcef": [("Mått", "{matt}"), ("Korgar", "{antal_fack}"),
                 ("Arbetsyta", "{skiva}"), ("Maxlast", "{maxlast_kort}"),
                 ("Vikt", "{vikt}")],
    "0fd65541": [("Mått", "{matt}"), ("Korgar", "{antal_fack}"),
                 ("Arbetsyta", "{skiva}"), ("Maxlast", "{maxlast_kort}"),
                 ("Vikt", "{vikt}")],
    "2e292a70": [("Mått", "{matt}"), ("Korgar", "{antal_fack}"),
                 ("Hylla", "{skiva}"), ("Maxlast", "{maxlast_kort}"),
                 ("Vikt", "{vikt}")],
    "a4ee97c1": [("Mått", "{matt}"), ("Låda", "{fack}"),
                 ("Hylla", "{hylla}"), ("Maxlast", "{maxlast_kort}"),
                 ("Vikt", "{vikt}")],
    "8a73caf4": [("Mått", "{matt}"), ("Arbetsyta", "{skiva}"),
                 ("Flaskhållare", "{flaskor}"), ("Maxlast", "{maxlast_kort}"),
                 ("Vikt", "{vikt}")],
    "fcb86875": [("Mått", "{matt}"), ("Övre plan", "{skiva}"),
                 ("Undre plan", "{fack}"), ("Maxlast", "{maxlast_kort}"),
                 ("Vikt", "{vikt}")],
    "ca20d60e": [("Mått", "{matt}"), ("Övre hylla", "{skiva}"),
                 ("Undre hylla", "{fack}"), ("Maxlast", "{maxlast_kort}"),
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
    """Fäller före bygget, inte efter — ett kort som är fel har redan laddats upp."""
    sedda, fel = {}, []
    for pid in M.ALLA:
        kicker, rubrik = T.KORT[pid]
        n = (kicker, rubrik, tuple(specrader(pid)))
        if n in sedda:
            fel.append(f"{pid} och {sedda[n]} får IDENTISKA kort")
        sedda[n] = pid
        # Kortets tal måste alla gå att hitta i matt.py-raden.
        rader = " ".join(specrader(pid))
        for f in ("matt", "vikt"):
            if M.M[pid][f] not in rader:
                fel.append(f"{pid}: kortet saknar {f}")
        if len(specrader(pid)) != 5:
            fel.append(f"{pid}: kortet har {len(specrader(pid))} rader, ska ha 5")
    # ☠️ Färgsyskonen delar varje tal — deras kort MÅSTE skilja sig i rubriken.
    a, b = M.A
    if T.KORT[a][1] == T.KORT[b][1]:
        fel.append(f"färgsyskonen {a} och {b} har samma kortrubrik")
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
