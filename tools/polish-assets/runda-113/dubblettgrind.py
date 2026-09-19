# -*- coding: utf-8 -*-
"""Runda 113 Steg 1 — dubblettgrind för kyl-/frysfamiljen.

Två grindar, i runbookens ordning:

  1. MÅTTGRINDEN fäller. Tre yttermått mot varje jämförelsesidas cm-tal;
     3/3 = dubblettmisstanke, 2/3 = nära, annars unik. Nyckeln SORTERAS —
     leverantören kastar om L/B/H mellan sina egna sidor.
  2. PIXELGRINDEN bekräftar. abs(gray(a)-gray(b)).mean() på 320 × 320;
     under 1,0 är samma bild och därmed samma fysiska vara.

☠️ Pixelgrinden BEVISAR en dubblett men UTESLUTER ingen: AliExpress-listningen
   och Aosom-feeden fotograferar samma vara var för sig, så ett avstånd över
   1,0 betyder ingenting alls. Måttgrinden är den som fäller.

☠️ KONTROLLMÄTNING: `da0e9379` mot publicerade `d4e79563` är den KÄNDA
   dubbletten (identiska yttermått, innermått, effekt och temperaturområde).
   Fäller grinden inte på den är den skriven, inte mätt.
"""
import io
import itertools
import sys
import urllib.request

import numpy as np
from PIL import Image

BAS = "https://static.wixstatic.com/media/%s/v1/fill/w_320,h_320,al_c,q_80/f.jpg"
TROSKEL = 1.0

# ── måttunderlag ────────────────────────────────────────────────────────────
# Yttermått i cm, exakt som leverantören/sidan anger dem.
MATT = {
    # 35 L-minifrysarna — fem utkast, alla med samma yttermått
    "8cfe5171": (47, 44.2, 48.8),   # Weiß,   161 W
    "a33ece7a": (47, 44.2, 48.8),   # Grau,   161 W
    "da0e9379": (47, 44.2, 48.8),   # Weiß,    45 W
    "9a33e15f": (47, 44.2, 48.8),   # Silber,  45 W
    "b2c76518": (47, 44.2, 48.8),   # Schwarz, 45 W
    # kylvagnen
    "397b845e": (84, 38, 83),
    # kosmetikkylarna
    "412c9f43": (24.3, 19.4, 35.6),  # Rosa
    "d754d015": (24.3, 19.4, 35.6),  # Weiß
    "758f0a80": (20.3, 26.3, 28),    # Rosa
    "d5cc9efa": (20.3, 26.3, 28),    # Cremeweiß
    # övriga i familjen
    "b3e3aac8": (66.6, 38.5, 40),
    "b815de72": (84, 42.2, 44.3),
    "ef0fa603": (43, 51, 51.3),
    "15d30e23": (43, 45, 56.5),
    "47a91a17": (26.5, 51.5, 65),
    "fdbfcea0": (43, 45, 64),
    "480849a7": (34.5, 45, 78),
    "e6d2e70b": (47.5, 44.2, 84),
}

# Publicerade syskonsidor: alla cm-tal ur deras spec-block.
PUBLICERADE = {
    "d4e79563": {  # minifrys-35-liter-vandbar-dorr
        47, 44.2, 48.8, 36, 33.3, 15, 19, 20, 35, 45, 41, 1.5, 4},
    "31d047f9": {  # kylvagn-56-liter-hjul-flaskoppnare
        67, 35, 80, 66, 36, 32, 62.5, 30.5, 56, 34, 60},
    "fc21434f": {  # kylbox-pa-hjul-56l
        75, 35, 78},
    "2da5b456": {  # kylbox-bil-8l-armstod-kompressor
        53.8, 19, 39},
}

# ── bildunderlag ────────────────────────────────────────────────────────────
BILDER = {
    "8cfe5171": ["b379ce_16f9c2ffe18c431b893c1059567ed0e5~mv2.jpg",
                 "b379ce_1de48f85b68e4c34a4858adb98348588~mv2.jpg",
                 "b379ce_ca2fa703560d4c4bbba301e22c5114d0~mv2.jpg"],
    "a33ece7a": ["b379ce_7b8b67da9138416dab17206945d4a580~mv2.jpg",
                 "b379ce_7d989a27cbd24ddbbd900e4552b18b9d~mv2.jpg",
                 "b379ce_321627a9394b43e28a38a709380b7f09~mv2.jpg"],
    "da0e9379": ["b379ce_e79aac26569047079c41c464e4cb86b5~mv2.jpg",
                 "b379ce_b754e17851e443158f1b1f0cf2ccafe4~mv2.jpg",
                 "b379ce_2ef52a215a1d488a885dff48534b0921~mv2.jpg"],
    "9a33e15f": ["b379ce_a3b5e96f90a84516a6222e7ab5652276~mv2.jpg",
                 "b379ce_bdca47c9a6104e2a8c7e3727084ff41b~mv2.jpg",
                 "b379ce_25a477f9de234b78bed87668898c4d7a~mv2.jpg"],
    "b2c76518": ["b379ce_388edd9604864bcba20715861e9238f9~mv2.jpg",
                 "b379ce_0e5c796a260d4121b93487b082cc9226~mv2.jpg",
                 "b379ce_3c8d3dd08c524e77af16b2520e53d2ff~mv2.jpg"],
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
    "397b845e": ["b379ce_949fc91f16c34c43a0a0a8187c327d1e~mv2.jpg",
                 "b379ce_c70686202d5f4b44b42ce6670cbce052~mv2.jpg",
                 "b379ce_e3244c823af443a594524c7e674a5288~mv2.jpg"],
    # publicerade
    "d4e79563": ["b379ce_ee87e66c613a4826b9d06ccf6f5dcea9~mv2.jpg",
                 "b379ce_792e98a402d747729f75f76a8e065aee~mv2.jpg",
                 "b379ce_6f54ba3ca9654056a0da1f1956b7422f~mv2.jpg",
                 "b379ce_c0dea6bc5d6a44b696d563926ae3380e~mv2.jpg"],
    "31d047f9": ["b379ce_b860ea535dd84159942ef1b3dcca17d9~mv2.jpg",
                 "b379ce_006c25569542470daaa5771c7cb8d97a~mv2.jpg",
                 "b379ce_4aa1909e886845fb91ee9190d2adf092~mv2.jpg",
                 "b379ce_3e795ea982f041169d49ea04c95d1e70~mv2.jpg"],
    "fc21434f": ["b379ce_53e77c8f69a74328bd128a9313bfe07b~mv2.jpg",
                 "b379ce_678c99c01e754cc2a06dc0c15a08e90d~mv2.jpg",
                 "b379ce_094bbcbe0fe74b0da53c380d5e2964b0~mv2.jpeg",
                 "b379ce_4ab03a0ade05408fbb6e7374963152f8~mv2.jpg"],
}

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
            d = float(np.abs(gray(x) - gray(y)).mean())
            bäst = min(bäst, d)
    return bäst


def mattraff(trippel, tal):
    return sum(1 for v in trippel if any(abs(v - x) <= 1.0 for x in tal))


def kontroll():
    """Grinden måste fälla på det fall vi VET är sant."""
    t = mattraff(MATT["da0e9379"], PUBLICERADE["d4e79563"])
    if t != 3:
        raise SystemExit("☠️ KONTROLLMÄTNINGEN FÖLL: da0e9379 mot d4e79563 gav %d/3" % t)
    # och den måste SLÄPPA ett fall vi vet är olika
    t2 = mattraff(MATT["397b845e"], PUBLICERADE["fc21434f"])
    if t2 >= 3:
        raise SystemExit("☠️ KONTROLLMÄTNINGEN FÖLL: 397b845e mot fc21434f gav %d/3" % t2)
    print("✅ kontrollmätning: känd dubblett 3/3, känd olikhet %d/3\n" % t2)


if __name__ == "__main__":
    kontroll()

    print("── MÅTTGRINDEN: utkast mot publicerade syskon ──")
    misstankta = []
    for u in sorted(MATT):
        rader = []
        for p, tal in PUBLICERADE.items():
            t = mattraff(MATT[u], tal)
            if t >= 2:
                rader.append((t, p))
        if rader:
            rader.sort(reverse=True)
            dom = "DUBBLETTMISSTANKE" if rader[0][0] == 3 else "nära"
            print("  %s  %s  %s" % (u, dom, ", ".join("%s %d/3" % (p, t) for t, p in rader)))
            if rader[0][0] == 3:
                misstankta.append((u, rader[0][1]))
        else:
            print("  %s  unik" % u)

    print("\n── MÅTTGRINDEN: utkast mot utkast (interna tvillingar) ──")
    interna = []
    for a, b in itertools.combinations(sorted(MATT), 2):
        t = mattraff(MATT[a], set(MATT[b]))
        if t == 3:
            print("  %s ↔ %s  identiska yttermått" % (a, b))
            interna.append((a, b))

    print("\n── PIXELGRINDEN: lägsta bildavstånd på paren måttgrinden pekar ut ──")
    for a, b in misstankta + interna:
        if a not in BILDER or b not in BILDER:
            print("  %s ↔ %s  (bilder saknas i underlaget)" % (a, b))
            continue
        d = lagsta(a, b)
        dom = "SAMMA BILD → DUBBLETT" if d < TROSKEL else "olika foton (bevisar inget)"
        print("  %-9s ↔ %-9s  %8.2f  %s" % (a, b, d, dom))
