# -*- coding: utf-8 -*-
"""Runda 116 Steg 9 — vilka leverantörsbilder som får ligga kvar, och i vilken ordning.

☠️ TVÅ SORTERS BILDER PLOCKAS BORT, och båda bär leverantörens märke:

   1. **Måttritningen** (position 3 i båda grupperna) har ordmärket nere till
      vänster, tasstryck nere till höger och en blek vattenstämpel längs
      högerkanten. Katalogen har redan svarat på vad som ska hända: den
      publicerade `hundvagn-regnskydd-mugghallare` bär SAMMA ritning utan
      ordmärke, och den bäst polerade sidan i familjen har ingen
      leverantörsritning alls — måtten står på våra egna kort.

   2. **Reklamaffischen** (position 5 på tre av rundans sju) är ingen
      produktbild alls: en golden retriever, husmärket två gånger och tysk
      annonstext inbränd i pixlarna. Uppmätt på gul yta över familjens 253
      bilder: fem affischer, alla på position 5, alla på utkast.

⚠️ `eb02039b` är den enda i grupp B vars position 5 är ett livsstilsfoto och
   inte en affisch. Planen är därför INTE gemensam per grupp — den är per
   produkt, och `kontroll()` fäller om någon rad pekar på en bild som inte
   finns.
"""
import json
import os
import sys

HAR = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HAR)
import matt as M                                                 # noqa: E402

BILDER = json.load(open(os.path.join(HAR, "bilder.json"), encoding="utf-8"))

# Leverantörsbilder som BEHÅLLS, i den ordning de ska ligga (1-indexerat mot
# produktens nuvarande galleri). Kortet skjuts in på plats 3 vid skrivningen.
BEHALL = {
    "40f46441": [1, 2, 4, 5],
    "adc81917": [1, 2, 4, 5],
    "cbb38884": [1, 2, 4, 5],
    "eb02039b": [1, 2, 4, 5],
    "3b0aca0a": [1, 2, 4],
    "1f311250": [1, 2, 4],
    "0fdf9aba": [1, 2, 4],
}
BORT = {
    "40f46441": {3: "måttritning med ordmärke"},
    "adc81917": {3: "måttritning med ordmärke"},
    "cbb38884": {3: "måttritning med ordmärke"},
    "eb02039b": {3: "måttritning med ordmärke"},
    "3b0aca0a": {3: "måttritning med ordmärke", 5: "reklamaffisch med tysk text"},
    "1f311250": {3: "måttritning med ordmärke", 5: "reklamaffisch med tysk text"},
    "0fdf9aba": {3: "måttritning med ordmärke", 5: "reklamaffisch med tysk text"},
}
# Vad varje behållen bild FÖRESTÄLLER — underlaget för alt-texterna.
MOTIV = {
    1: "hjälte", 2: "livsstil", 4: "detalj", 5: "extra",
}
KORTPLATS = 3          # vårt eget faktakort skjuts in här


def galleri(k):
    """Ordnad lista: ('kort', None) eller ('bild', position)."""
    ut = []
    for i, pos in enumerate(BEHALL[k]):
        if i + 1 == KORTPLATS:
            ut.append(("kort", None))
        ut.append(("bild", pos))
    return ut


def kontroll():
    for k in M.ALLA:
        n = len(BILDER[k])
        alla = set(BEHALL[k]) | set(BORT[k])
        if alla != set(range(1, n + 1)):
            raise SystemExit(f"☠️ {k}: planen täcker {sorted(alla)} men "
                             f"produkten har {n} bilder — varje bild måste "
                             f"antingen behållas eller strykas med skäl")
        if set(BEHALL[k]) & set(BORT[k]):
            raise SystemExit(f"☠️ {k}: en bild står både i BEHALL och BORT")
        if 3 in BEHALL[k]:
            raise SystemExit(f"☠️ {k}: måttritningen (bild 3) bär ordmärket "
                             f"och får inte ligga kvar")
        g = galleri(k)
        if g[KORTPLATS - 1][0] != "kort":
            raise SystemExit(f"☠️ {k}: kortet hamnade inte på plats {KORTPLATS}")
    borttagna = sum(len(v) for v in BORT.values())
    print(f"bildplan.kontroll: {len(M.ALLA)} produkter, "
          f"{sum(len(v) for v in BEHALL.values())} leverantörsbilder behålls, "
          f"{borttagna} stryks   OK")


if __name__ == "__main__":
    kontroll()
    for k in M.ALLA:
        rad = " → ".join("KORT" if t == "kort" else f"bild{p}"
                         for t, p in galleri(k))
        skal = ", ".join(f"bild{p}: {s}" for p, s in sorted(BORT[k].items()))
        print(f"  {k}  {rad}")
        print(f"            bort: {skal}")
