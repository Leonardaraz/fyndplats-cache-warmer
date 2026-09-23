# -*- coding: utf-8 -*-
"""Runda 116 Steg 9 — sju Fyndplats-kort.

☠️ KORTET BÄR MÅTTEN NU, för leverantörens måttritning har plockats ur
   galleriet: den bär husmärket tre gånger. Det är samma linje som den bäst
   polerade sidan i familjen redan följer — `hundvagn-hopfallbar-liten-hund-
   sufflett-broms` har ingen leverantörsritning alls och tre egna kort.

☠️ FÄRGSYSKONENS KORT MÅSTE SKILJA SIG. Tre respektive fyra produkter delar
   varenda tal; det enda som skiljer är färgen, och den står i rubriken.
   `kontroll()` fäller om två kort blir identiska.
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
RAW = os.path.join(HAR, "rawbilder")
BAS = "https://static.wixstatic.com/media/%s/v1/fill/w_600,h_600,al_c,q_88/f.jpg"

KICKER = {k: ("HUNDVAGN, UPP TILL 4 KG" if M.GRUPP[k] == "A"
              else "HUNDVAGN MED KORG, UPP TILL 10 KG") for k in M.ALLA}
RUBRIK = {
    "40f46441": "Fyra hjul och sufflett, röd",
    "adc81917": "Fyra hjul och sufflett, grå",
    "cbb38884": "Fyra hjul och sufflett, blå",
    "eb02039b": "Tre hjul och stor korg, röd",
    "3b0aca0a": "Tre hjul och stor korg, blå",
    "1f311250": "Tre hjul och stor korg, dammrosa",
    "0fdf9aba": "Tre hjul och stor korg, ljusgrå",
}


def hamta(fid):
    os.makedirs(RAW, exist_ok=True)
    f = os.path.join(RAW, fid.split("_")[1].split("~")[0] + ".jpg")
    if not os.path.exists(f):
        with urllib.request.urlopen(BAS % fid, timeout=90) as r:
            open(f, "wb").write(r.read())
    return f


def specrader(k):
    g = M.GRUPP[k]
    return [f"Mått: {M.MATT[g]['yttermatt']}",
            f"Hopfälld: {M.MATT[g]['hopfalld']}",
            f"Liggyta: {M.MATT[g]['liggdel']}",
            f"Största hund: {M.MATT[g]['maxvikt_hund']}",
            f"Vagnens vikt: {M.MATT[g]['vikt']}"]


def kontroll():
    sedda = {}
    for k in M.ALLA:
        n = (KICKER[k], RUBRIK[k], tuple(specrader(k)))
        if n in sedda:
            raise SystemExit(f"☠️ {k} och {sedda[n]} får IDENTISKA kort — "
                             f"färgsyskon måste skilja sig")
        sedda[n] = k
        if M.FARG[k] not in RUBRIK[k]:
            raise SystemExit(f"☠️ {k}: färgen {M.FARG[k]!r} står inte i "
                             f"kortrubriken {RUBRIK[k]!r}")
        # ☠️ Kortet ersätter måttritningen. Saknas ett av dess tal har kunden
        #    inget att gå på alls.
        for f in ("yttermatt", "hopfalld", "liggdel", "maxvikt_hund", "vikt"):
            if M.MATT[M.GRUPP[k]][f] not in " ".join(specrader(k)):
                raise SystemExit(f"☠️ {k}: kortet saknar {f}")
    print(f"kort.kontroll: {len(sedda)} unika kort av {len(M.ALLA)} produkter, "
          f"alla fem talen med   OK")


if __name__ == "__main__":
    kontroll()
    os.chdir(HAR)
    produkter = [{"kort": k, "spec": specrader(k)} for k in M.ALLA]
    kortdata = {k: (KICKER[k], RUBRIK[k],
                    [("Mått", 0), ("Hopfälld", 1), ("Liggyta", 2),
                     ("Största hund", 3), ("Vikt", 4)]) for k in M.ALLA}
    foton = {k: hamta(BILDER[k][0]) for k in M.ALLA}
    namn, facit = KB.bygg(HAR, produkter, kortdata, foton=foton)
    json.dump(facit, open("kort-facit.json", "w"), ensure_ascii=False, indent=1)
    for n in namn:
        print(f"  {n}  {os.path.getsize('jpg/%s.jpg' % n):>7} byte")
