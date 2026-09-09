# -*- coding: utf-8 -*-
"""Runda 114 Steg 1 — dubblettgrind för kyl-/frysfamiljens NIO sista utkast.

Samma två grindar och samma ordning som runda 113:

  1. MÅTTGRINDEN sållar. Tre yttermått mot varje publicerad syskonsidas cm-tal;
     3/3 = dubblettmisstanke, 2/3 = nära. Nyckeln SORTERAS inte bort — varje
     tal prövas mot hela talmängden, för leverantören kastar om L/B/H.
  2. PIXELGRINDEN dömer. abs(gray(a)-gray(b)).mean() på 320 × 320.

☠️ MISSTANKEN SOM MÅSTE PRÖVAS: `397b845e` heter "Kühlwagen mit 56L … Rollen,
   Flaschenöffner" och den PUBLICERADE `31d047f9` heter
   `kylvagn-56-liter-hjul-flaskoppnare`. Samma volym, samma hjul, samma
   flasköppnare — det är precis den formen av krock som runda 113 fick 3/3 på
   utan att den var en dubblett. Måtten skiljer (84 × 38 × 83 mot 67 × 35 × 80),
   men mått är ett SÅLL. Bilderna avgör.

☠️ KONTROLLMÄTNING ÅT BÅDA HÅLL. `da0e9379` mot `d4e79563` är runda 113:s
   BEVISADE dubblett (gråskaleavstånd 0,00). Fäller grinden inte på den är den
   skriven och inte mätt. Och `397b845e` mot `2da5b456` (en 8-liters bilkylbox)
   måste SLÄPPA — annars är tröskeln bara låg.
"""
import io
import sys
import urllib.request

import numpy as np
from PIL import Image

BAS = "https://static.wixstatic.com/media/%s/v1/fill/w_320,h_320,al_c,q_80/f.jpg"
TROSKEL = 1.0

# ── måttunderlag: yttermått i cm, exakt som leverantören anger dem ──────────
MATT = {
    "397b845e": (84, 38, 83),        # kylvagn 56 L
    "412c9f43": (24.3, 19.4, 35.6),  # kosmetikkyl 6 L, rosa
    "d754d015": (24.3, 19.4, 35.6),  # kosmetikkyl 6 L, vit
    "758f0a80": (20.3, 26.3, 28),    # beautykyl 4 L, rosa
    "d5cc9efa": (20.3, 26.3, 28),    # beautykyl 4 L, crèmevit
    "b3e3aac8": (66.6, 38.5, 40),    # passiv kylbox 42,6 L
    "b815de72": (84, 42.2, 44.3),    # passiv kylbox 70 L med hjul
    "e6d2e70b": (47.5, 44.2, 84),    # minikyl 91 L med frysfack
    "ef0fa603": (43, 51, 51.3),      # dryckeskyl 44 L
    # kontrollrad: runda 113:s bevisade dubblett, poleras inte
    "da0e9379": (47, 44.2, 48.8),
}

# Publicerade syskonsidor: alla cm-/literstal ur deras spec-block och brödtext.
# De fem första är runda 113:s egna sidor (mätta där), resten lästa idag.
PUBLICERADE = {
    "31d047f9": {67, 35, 80, 66, 36, 32, 62.5, 30.5, 56, 34, 60},   # kylvagn 56 L
    "fc21434f": {75, 35, 78, 30, 34, 56},                            # kylbox på hjul 56 L
    "2da5b456": {53.8, 19, 39, 8},                                   # bilkylbox 8 L
    "ef855cbf": {10, 34},                                            # bröstpumpsväska
    "46d2c85a": {18, 35, 45, 50, 60, 74, 100},                       # campingstolar
    "d4e79563": {47, 44.2, 48.8, 36, 33.3, 15, 19, 20, 35, 45, 41, 1.5, 4},
    "8cfe5171": {47, 44.2, 48.8, 36, 33.3, 35, 15},
    "a33ece7a": {47, 44.2, 48.8, 36, 33.3, 35, 15},
    "9a33e15f": {47, 44.2, 48.8, 36, 33.3, 35, 15},
    "b2c76518": {47, 44.2, 48.8, 36, 33.3, 35, 15},
    "47a91a17": {26.5, 51.5, 65, 12},
    "15d30e23": {43, 45, 56.5, 16},
    "480849a7": {34.5, 45, 78, 18, 50},
    "fdbfcea0": {43, 45, 64, 20, 53},
}

# ── bildunderlag: de tre första galleri-bilderna per produkt ───────────────
BILDER = {
    "397b845e": ["b379ce_949fc91f16c34c43a0a0a8187c327d1e~mv2.jpg",
                 "b379ce_c70686202d5f4b44b42ce6670cbce052~mv2.jpg",
                 "b379ce_e3244c823af443a594524c7e674a5288~mv2.jpg"],
    "412c9f43": ["b379ce_a4829ee6ce2848cca599a067bfdfcb3b~mv2.jpg",
                 "b379ce_850048de72514ff382dbdbb63266d29e~mv2.jpg",
                 "b379ce_01e5c5e20aac472e9cfbb917dd878fde~mv2.jpg"],
    "d754d015": ["b379ce_48d8089ee5ce410aabca1db02b44ddbe~mv2.jpg",
                 "b379ce_e5b528aa57bd49d1a16b0db8ac00b95c~mv2.jpg",
                 "b379ce_0ecf623771bf4bb2971091e9e2b297bd~mv2.jpg"],
    "758f0a80": ["b379ce_51f9cc2fdc6a4990ba23318332422e41~mv2.jpg",
                 "b379ce_9f972ac433fb4de6b5d1a19ef73b81a9~mv2.jpg",
                 "b379ce_9d5077943db24203b1def52cdae6856e~mv2.jpg"],
    "d5cc9efa": ["b379ce_aef303369a614151b8bd481ce96b69b8~mv2.jpg",
                 "b379ce_316e81ae25ae455c93eb90980c8e43d5~mv2.jpg",
                 "b379ce_086841f717374c23a5a9e56ec5648f3b~mv2.jpg"],
    "b3e3aac8": ["b379ce_cf10a2ce0f3546c990f9da9163851b09~mv2.jpg",
                 "b379ce_0ce89287f6524f8e956fd6e0f3695a8a~mv2.jpg",
                 "b379ce_b2911e928df04f27b062db336b884918~mv2.jpg"],
    "b815de72": ["b379ce_6a521d37d9754bba88d76aab443ca445~mv2.jpg",
                 "b379ce_d0c0e5286ed64c3a9dfd828e9b9e18f3~mv2.jpg",
                 "b379ce_fff12cfa865f497c84a8455731d43ff1~mv2.jpg"],
    "e6d2e70b": ["b379ce_d53415af78df43ec9a169fcaae8670ce~mv2.jpg",
                 "b379ce_d600148642934909ba96fbc0f6e5197c~mv2.jpg",
                 "b379ce_7dc8c3a4f1c2414d874081149da0c59b~mv2.jpg"],
    "ef0fa603": ["b379ce_986b1b2a7d5e4a10a1ea7c493dcd60b9~mv2.jpg",
                 "b379ce_7fad58fa23fe4aaa8d2ff788a8b05fe9~mv2.jpg",
                 "b379ce_99603e41500c4f2f859806c6aeb4c87a~mv2.jpg"],
    # kontrollrad — runda 113 mätte 0,00 mot d4e79563
    "da0e9379": ["b379ce_e79aac26569047079c41c464e4cb86b5~mv2.jpg",
                 "b379ce_b754e17851e443158f1b1f0cf2ccafe4~mv2.jpg",
                 "b379ce_2ef52a215a1d488a885dff48534b0921~mv2.jpg"],
    # publicerade
    "31d047f9": ["b379ce_b860ea535dd84159942ef1b3dcca17d9~mv2.jpg",
                 "b379ce_006c25569542470daaa5771c7cb8d97a~mv2.jpg",
                 "b379ce_4aa1909e886845fb91ee9190d2adf092~mv2.jpg"],
    "fc21434f": ["b379ce_53e77c8f69a74328bd128a9313bfe07b~mv2.jpg",
                 "b379ce_678c99c01e754cc2a06dc0c15a08e90d~mv2.jpg",
                 "b379ce_094bbcbe0fe74b0da53c380d5e2964b0~mv2.jpeg"],
    "2da5b456": ["b379ce_b14333eb0b914a22bce0b98b2abdea72~mv2.jpg",
                 "b379ce_42d04d3dce704e798171026e9dd3853b~mv2.png",
                 "b379ce_3464b96abc564543a9835af4afffce32~mv2.png"],
    "d4e79563": ["b379ce_ee87e66c613a4826b9d06ccf6f5dcea9~mv2.jpg",
                 "b379ce_3b0c98e75ae94596a9d87071aad77d41~mv2.png",
                 "b379ce_8d2d90ad1fac43d3960b52fabd035230~mv2.png"],
}

# Vilka par pixelgrinden faktiskt ska väga: en utkastprodukt och den
# publicerade sida vars NAMN eller mått gör den till en rimlig kandidat.
PIXELPAR = [
    ("397b845e", "31d047f9"),   # båda "kylvagn 56 liter, hjul, flasköppnare"
    ("397b845e", "fc21434f"),   # båda kylbox på hjul, 56 L
    ("b815de72", "fc21434f"),   # båda kylbox på hjul
    ("b815de72", "31d047f9"),
    ("b3e3aac8", "fc21434f"),
    ("b3e3aac8", "2da5b456"),
    ("e6d2e70b", "d4e79563"),   # delar 44,2 cm djup — samma kabinettfamilj?
    ("ef0fa603", "2da5b456"),
    ("da0e9379", "d4e79563"),   # KONTROLL: känd dubblett, ska ge 0,00
]

_cache = {}


def gray(filid):
    if filid not in _cache:
        req = urllib.request.Request(BAS % filid, headers={"User-Agent": "Mozilla/5.0"})
        rå = urllib.request.urlopen(req, timeout=90).read()
        bild = Image.open(io.BytesIO(rå)).convert("L").resize((320, 320))
        _cache[filid] = np.asarray(bild, dtype=np.float32)
    return _cache[filid]


def lagsta(a, b):
    """Lägsta gråskaleavstånd mellan två produkters bilduppsättningar."""
    bäst = 1e9
    for x in BILDER[a]:
        for y in BILDER[b]:
            bäst = min(bäst, float(np.abs(gray(x) - gray(y)).mean()))
    return bäst


def mattraff(trippel, tal):
    return sum(1 for v in trippel if any(abs(v - x) <= 1.0 for x in tal))


def kontroll():
    """Grinden måste fälla på det vi VET är sant OCH släppa det vi vet är falskt."""
    t = mattraff(MATT["da0e9379"], PUBLICERADE["d4e79563"])
    if t != 3:
        raise SystemExit("☠️ KONTROLLEN FÖLL: da0e9379 mot d4e79563 gav %d/3" % t)
    t2 = mattraff(MATT["397b845e"], PUBLICERADE["2da5b456"])
    if t2 >= 3:
        raise SystemExit("☠️ KONTROLLEN FÖLL: 397b845e mot 2da5b456 gav %d/3" % t2)
    d = lagsta("da0e9379", "d4e79563")
    if d >= TROSKEL:
        raise SystemExit("☠️ PIXELKONTROLLEN FÖLL: känd dubblett gav %.2f" % d)
    print("✅ kontroll: känd dubblett 3/3 och %.2f i pixelavstånd, "
          "känd olikhet %d/3\n" % (d, t2))


if __name__ == "__main__":
    kontroll()

    print("── MÅTTGRINDEN: nio utkast mot fjorton publicerade syskon ──")
    for u in sorted(k for k in MATT if k != "da0e9379"):
        rader = sorted(((mattraff(MATT[u], t), p) for p, t in PUBLICERADE.items()),
                       reverse=True)
        rader = [r for r in rader if r[0] >= 2]
        if rader:
            dom = "DUBBLETTMISSTANKE" if rader[0][0] == 3 else "nära"
            print("  %s  %-17s %s" % (u, dom,
                  ", ".join("%s %d/3" % (p, t) for t, p in rader)))
        else:
            print("  %s  unik             (högst 1/3 mot alla)" % u)

    print("\n── PIXELGRINDEN: namn- och måttnära par ──")
    fel = 0
    for a, b in PIXELPAR:
        d = lagsta(a, b)
        dom = "☠️ SAMMA BILD → DUBBLETT" if d < TROSKEL else "olika bild"
        if d < TROSKEL and a != "da0e9379":
            fel += 1
        print("  %s ↔ %s  %6.2f  %s" % (a, b, d, dom))

    print("\n%s" % ("☠️ %d oväntade dubbletter — polera dem INTE" % fel if fel
                    else "✅ noll oväntade dubbletter: de nio utkasten är egna produkter"))
    sys.exit(1 if fel else 0)
