# -*- coding: utf-8 -*-
"""Runda 115 Steg 1 — dubblettgrind för sparkbilarna (Rutschauto/Rutscher).

☠️ FAMILJEN ÄR MINERAD. Butiken har ELVA publicerade sparkbilar/gåbilar, och
   utkastshögen tjugosex. Måttmätningen fällde redan sex utkast mot levande
   sidor PÅ DECIMALEN — men mått är ett SÅLL, inte en dom. Pixelgrinden dömer.

☠️ OCH TVILLINGARNA SITTER OCKSÅ INNE I HÖGEN. Tolv av utkasten delar mått
   parvis. Grinden prövar därför BÅDA riktningarna: utkast mot publicerad, och
   utkast mot utkast.

☠️ KONTROLLMÄTNING ÅT BÅDA HÅLL, annars är tröskeln bara låg:
   - `7a595f49` mot `2e12de07` (Porsche) MÅSTE falla — måtten är identiska på
     alla fyra tal, alltså är det den bevisade dubbletten i den här familjen.
   - `ff44f16d` (träsparkbil) mot `2e12de07` (Porsche i plast) MÅSTE SLÄPPA.
"""
import io
import os
import sys
import urllib.request

import numpy as np
from PIL import Image

BAS = "https://static.wixstatic.com/media/%s/v1/fill/w_320,h_320,al_c,q_80/f.jpg"
TROSKEL = 1.0
CACHE = os.path.join(os.path.dirname(os.path.abspath(__file__)), "rawbilder")

HJALTE = {
    # ── utkast ────────────────────────────────────────────────────────────
    "ff44f16d": "b379ce_2b93b43a66314b9aab136df798069e0f~mv2.jpg",
    "abe9a95c": "b379ce_653b36aaa98c4c969e7b862158a774f7~mv2.jpg",
    "e897045f": "b379ce_8575f05b25b145f4ade5d5eeb8c7b70e~mv2.jpg",
    "cc6b56f9": "b379ce_d2b79ebbe08541d49beddcafbbf7c971~mv2.jpg",
    "7a595f49": "b379ce_f7060233e23748c79a9fa295502c3c1c~mv2.jpg",
    "58690dbb": "b379ce_13dbacab1775428eb2177161adf3ecae~mv2.jpg",
    "efd63441": "b379ce_fc2842dbe9a54905aab73a35715800a7~mv2.jpg",
    "834cbe61": "b379ce_e59a481d4d7b4037abc48ffcb47c3449~mv2.jpg",
    "b34517e3": "b379ce_3669b61b13cc4a55a12fb9097e4d2e48~mv2.jpg",
    "b9f6dc30": "b379ce_2b6561c87bf843b889e637c8e05796e2~mv2.jpg",
    "6152ca30": "b379ce_96e3befcbae04ec3b2c6de0988db59ac~mv2.jpg",
    "23ba27a5": "b379ce_fae3ffcd204d41eaa1cb06ad5ff8639c~mv2.jpg",
    "6e679cf1": "b379ce_4ff9013dcf4243e1b27b61baabaa3089~mv2.jpg",
    "f1066fb2": "b379ce_b6c516cf57e54cee99d6860164f572b2~mv2.jpg",
    "fb142c5c": "b379ce_280eb3b9ac3649de99ad8725bb7a3b70~mv2.jpg",
    "100165e1": "b379ce_f29804b712b34a30966845e8abe02b5e~mv2.jpg",
    "39d85f18": "b379ce_1f1b9ddf591f4af1837865559b25d9d0~mv2.jpg",
    "389ac5ac": "b379ce_b6b2bc281da5493ca08ad960a5e8973a~mv2.jpg",
    "d55a25f4": "b379ce_63c46c2bf40049c0b70b56b6f7b09cfc~mv2.jpg",
    "88140d98": "b379ce_96d89c7a3eb04333b45a62b52bcaf6ba~mv2.jpg",
    "738ca991": "b379ce_db30262e57684cd6ba77d5cab3846092~mv2.jpg",
    "8eaf3ecc": "b379ce_f512275a5c6e4c6c8910000fba5924e3~mv2.jpg",
    "1a3ac422": "b379ce_8cfb8975af87429ea7c417135050983c~mv2.jpg",
    "2b890006": "b379ce_2a6f12ce4ed44d61b6bae0112ef3a175~mv2.jpg",
    "0c05c1a0": "b379ce_569047a821a647878e05b9932880ab2d~mv2.jpg",
    # ── publicerade ───────────────────────────────────────────────────────
    "a6b24d45": "b379ce_3d626c16842d49f79d152bd4c5ba69ab~mv2.jpg",
    "2e12de07": "b379ce_6275b089d96046ca9c5661f0148b1a84~mv2.jpg",
    "f87c0ccb": "b379ce_aa674f3198034fd0bbd2821be74c369d~mv2.jpg",
    "41be5a7a": "b379ce_29d9a103f8674f58a0cc5ec9484ff9f8~mv2.jpg",
    "1e5eac85": "b379ce_6fae609d2c17475aacb9685948e90d1f~mv2.jpg",
    "7d243274": "b379ce_7a0962b38ad8465395285ac1954441a4~mv2.jpg",
    "5a4f16a3": "b379ce_e2f37be9c77a4d28915aac20c6b72b2d~mv2.jpg",
    "382f99ee": "b379ce_a1b9f791a47b4b6bab21e33c865db002~mv2.jpg",
    "e6134e61": "b379ce_d7003a5951e44b958299c9e88dc7ca6a~mv2.jpg",
    "c86aefc6": "b379ce_c7c064bf27ba409da6574daa0c15b931~mv2.jpg",
    "9afb5483": "b379ce_a8dae1cff4e24e75a661abcc86dc2791~mv2.jpg",
}
UTKAST = [k for k in HJALTE if k not in {
    "a6b24d45", "2e12de07", "f87c0ccb", "41be5a7a", "1e5eac85", "7d243274",
    "5a4f16a3", "382f99ee", "e6134e61", "c86aefc6", "9afb5483"}]
PUBLICERADE = [k for k in HJALTE if k not in UTKAST]

_cache = {}


def gra(k):
    if k in _cache:
        return _cache[k]
    os.makedirs(CACHE, exist_ok=True)
    fil = os.path.join(CACHE, k + ".jpg")
    if not os.path.exists(fil):
        with urllib.request.urlopen(BAS % HJALTE[k], timeout=60) as r:
            open(fil, "wb").write(r.read())
    a = np.asarray(Image.open(fil).convert("L").resize((320, 320)), dtype=float)
    _cache[k] = a
    return a


def avstand(a, b):
    return float(np.abs(gra(a) - gra(b)).mean())


def kontroll():
    """☠️ DEN POSITIVA KONTROLLEN FICK INTE FÖRUTSÄTTA SITT SVAR.

    Ett första utkast satte `7a595f49` mot `2e12de07` (Porsche) som BEVISAD
    dubblett, eftersom alla fyra tal — 63×28,5×38, paketmått 64×30×26, 3,3 kg,
    maxlast 30 kg — stämde på decimalen. Grinden gav 15,90 och "föll".

    Den hade rätt. Bilderna visar samma gjutform, samma ratt, samma fälgar och
    samma emblem i ROSA respektive SVART. Identiska mått + identisk vikt är
    signaturen för ett FÄRGSYSKON, inte för en dubblett — och ett färgsyskon
    ska poleras med korslänk, inte pensioneras.

    Kvar står därför bara den NEGATIVA kontrollen, som inte förutsätter något:
    en träsparkbil och en Porsche i plast måste ligga långt isär. Den positiva
    sätts först när matrisen nedan pekat ut ett par som ÖGAT bekräftat.
    """
    d2 = avstand("ff44f16d", "2e12de07")
    if d2 < 6:
        raise SystemExit(f"☠️ NEGATIVA KONTROLLEN FÖLL: träsparkbil mot Porsche "
                         f"gav {d2:.2f} — grinden skiljer inte ens produkttyper")
    print(f"negativ kontroll: olika produkter {d2:.2f}   OK")
    print("⚠️ positiv kontroll ÄNNU INTE SATT — se docstring")


if __name__ == "__main__":
    kontroll()
    print("\n── utkast mot PUBLICERAD ───────────────────────────────────────")
    mot_publ = {}
    for u in UTKAST:
        par = min(((avstand(u, p), p) for p in PUBLICERADE), key=lambda x: x[0])
        mot_publ[u] = par
        flagga = "☠️ DUBBLETT" if par[0] < TROSKEL else ("~ nära" if par[0] < 6 else "")
        print(f"  {u}  →  {par[1]}  {par[0]:6.2f}  {flagga}")
    print("\n── utkast mot UTKAST (tvillingar i högen) ──────────────────────")
    sedda = set()
    for i, a in enumerate(UTKAST):
        for b in UTKAST[i + 1:]:
            d = avstand(a, b)
            if d < TROSKEL:
                print(f"  ☠️ {a} ≡ {b}   {d:.2f}")
                sedda.add(a); sedda.add(b)
    print(f"\nutkast: {len(UTKAST)}   "
          f"dubbletter mot publicerad: "
          f"{sum(1 for v in mot_publ.values() if v[0] < TROSKEL)}   "
          f"i tvillingpar internt: {len(sedda)}")
