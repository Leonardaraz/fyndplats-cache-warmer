# -*- coding: utf-8 -*-
"""Runda 115 Steg 9 — sju Fyndplats-kort.

☠️ FÄRGSYSKONENS KORT MÅSTE SKILJA SIG. De två traktorerna delar varenda tal;
   det som skiljer är färgen och den står i rubriken. `kontroll()` fäller om
   två kort blir identiska.
"""
import os
import sys

HAR = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, os.path.join(HAR, ".."))
sys.path.insert(0, HAR)
import kortbygge as KB                                            # noqa: E402
import matt as M                                                  # noqa: E402
import texter as T                                                # noqa: E402
import bildark as B                                               # noqa: E402

KICKER = {
    "cc6b56f9": "GRÄVMASKIN ATT SITTA PÅ",
    "fb142c5c": "HJULLASTARE ATT SITTA PÅ",
    "738ca991": "BANDGRÄVARE ATT SITTA PÅ",
    "0c05c1a0": "FRONTLASTARE ATT SITTA PÅ",
    "23ba27a5": "SPARKTRAKTOR MED SLÄP",
    "39d85f18": "SPARKTRAKTOR MED SLÄP",
    "389ac5ac": "SPARKTRAKTOR MED SLÄP",
}
RUBRIK = {
    "cc6b56f9": "Skopan styrs med två spakar",
    "fb142c5c": "Skopan sitter framtill",
    "738ca991": "Larvband och grävarm med spärr",
    "0c05c1a0": "Stor skopa och växelspak",
    "23ba27a5": "Skopa och grep i lådan",
    "39d85f18": "Sandskyffel och kratta, gul",
    "389ac5ac": "Sandskyffel och kratta, blå",
}


def sits(k):
    return (f"{T.tal(M.SITS[k][2])} cm över golvet" if M.SITS.get(k)
            else f"{T.tal(M.SITSHOJD[k])} cm över golvet")


def specrader(k):
    return [f"Mått: {T.yttre(k)}",
            f"Bär: {T.tal(M.MAXLAST[k])} kg",
            f"Ålder: {T.alder(k)}",
            f"Sitshöjd: {sits(k)}"]


def kontroll():
    sedda = {}
    for k in M.YTTRE:
        n = (KICKER[k], RUBRIK[k], tuple(specrader(k)))
        if n in sedda:
            raise SystemExit(f"☠️ {k} och {sedda[n]} får IDENTISKA kort — "
                             f"färgsyskon måste skilja sig")
        sedda[n] = k
    print(f"kort.kontroll: {len(sedda)} unika kort av {len(M.YTTRE)} produkter")


if __name__ == "__main__":
    kontroll()
    os.chdir(HAR)
    produkter = [{"kort": k, "spec": specrader(k)} for k in M.YTTRE]
    kortdata = {k: (KICKER[k], RUBRIK[k],
                    [("Mått", 0), ("Bär", 1), ("Ålder", 2), ("Sitshöjd", 3)])
                for k in M.YTTRE}
    # ☠️ Hjältebilden ligger under sitt FILHASH-namn, inte `<id>-1.jpg`.
    foton = {k: B.hamta(B.BILDER[k][0]) for k in M.YTTRE}
    namn, facit = KB.bygg(HAR, produkter, kortdata, foton=foton)
    import json
    json.dump(facit, open("kort-facit.json", "w"), ensure_ascii=False, indent=1)
    for n in namn:
        print(f"  {n}  {os.path.getsize('jpg/%s.jpg' % n):>7} byte")
