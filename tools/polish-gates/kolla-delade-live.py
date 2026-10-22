#!/usr/bin/env python3
"""kolla-delade-live.py <spec.json> <livekatalog> <prefix> [--fore <katalog> <prefix>]

Kontrollerar butikens vyer live efter att `bygg-lank.py` länkat en måttbild till sitt val (2026-10-22, delade måttbilder på storleksidor).
spec.json är samma fil som gavs till bygg-lank.py: [{"id": "<produkt-id>", "axel": "Storlek", "val": {"<valets namn>": ["<hex6>", ...]}}].
Mätningarna är live-bilder.mjs-filerna (<katalog>/<prefix>_<id8>.json, en per sida, se live-par.sh).

Tre villkor per sida, och alla tre kan fälla (testat mot mätningen FÖRE rättningen, som ska ge avvikelser):
  1. bilden visas under sitt eget val,
  2. bilden visas under INGET annat val på sidan,
  3. varje val visar minst fyra bilder (Leonard: 4 är godkänt).
Med --fore skrivs antal bilder före → efter per val. Skriver ingenting, ändrar ingenting.
"""
import json, os, re, sys

MIN_BILDER = 4


def norm(s):
    return re.sub(r"\s+", " ", str(s or "")).strip().lower()


def las(katalog, prefix, id8):
    p = os.path.join(katalog, "%s_%s.json" % (prefix, id8))
    if not os.path.exists(p):
        return None
    return json.load(open(p, encoding="utf-8"))


def vyer(live):
    """valets namn (normaliserat, efter '=') -> lista med fil-id i butikens ordning"""
    ut = {}
    for k in live.get("kombos", []):
        namn = norm(k.get("val", "").split("=", 1)[-1])
        ut[namn] = k.get("ids", [])
    return ut


def traffar(ids, hexa):
    return [f for f in ids if f[7:7 + len(hexa)] == hexa]


def main():
    args = sys.argv[1:]
    if len(args) < 3:
        print(__doc__)
        sys.exit(2)
    spec = json.load(open(args[0], encoding="utf-8"))
    katalog, prefix = args[1], args[2]
    fore = None
    if "--fore" in args:
        i = args.index("--fore")
        fore = (args[i + 1], args[i + 2])
    avvikelser = 0
    for sida in spec:
        id8 = sida["id"][:8]
        live = las(katalog, prefix, id8)
        if live is None:
            print("%s  ☠️ ingen mätning (%s_%s.json saknas)" % (id8, prefix, id8))
            avvikelser += 1
            continue
        efter = vyer(live)
        fore_vyer = None
        if fore:
            l0 = las(fore[0], fore[1], id8)
            fore_vyer = vyer(l0) if l0 else None
        namnen = list(efter.keys())
        print("%s  %s" % (id8, " | ".join("%s: %d%s" % (n, len(efter[n]), (" (före %d)" % len(fore_vyer[n])) if fore_vyer and n in fore_vyer else "") for n in namnen)))
        for val, hexa_lista in sida["val"].items():
            n = norm(val)
            if n not in efter:
                print("   ☠️ valet %r finns inte i mätningen (valen: %s)" % (val, ", ".join(namnen)))
                avvikelser += 1
                continue
            for h in hexa_lista:
                egen = traffar(efter[n], h)
                if not egen:
                    print("   ☠️ %s visas INTE under sitt eget val %r" % (h, val))
                    avvikelser += 1
                for annat in namnen:
                    if annat == n:
                        continue
                    fel = traffar(efter[annat], h)
                    if fel:
                        print("   ☠️ %s visas under %r, som inte är dess val (%r)" % (h, annat, val))
                        avvikelser += 1
        for n in namnen:
            if len(efter[n]) < MIN_BILDER:
                print("   ☠️ %r visar %d bilder (minst %d)" % (n, len(efter[n]), MIN_BILDER))
                avvikelser += 1
    print("ALLT OK" if avvikelser == 0 else "AVVIKELSER: %d" % avvikelser)
    sys.exit(0 if avvikelser == 0 else 1)


main()
