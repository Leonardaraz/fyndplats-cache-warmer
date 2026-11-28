"""Loungefatolj i bjorkfaner, vippande ram (loungefatolj-bjorkfaner-vippande). Huvudvaran i trappan.

Produktsidan: 67 x 83 x 105 cm (B x D x H), sits 55 x 45 x 45 cm och 12 cm tjock, ryggstod 74 x 55 cm och
12 cm tjockt, armstod 51 cm over golv, ram i bojd bjorkfaner, dyna i sammetslook, gradvit.

Ramen ar tva sidoramar (golvmede som bojer upp i armstodet) och en sits-ryggram som dynan ligger pa.
Dynan ar kanalsydd: sju stoppade sektioner som foljer sits-ryggramens boj, overst ett nackstod.
"""
from __future__ import annotations

import math

from .. import b3d
from . import delar

SLUG = "loungefatolj-bjorkfaner-vippande"
SIDA_X, SIDA_B, SIDA_T = 0.307, 0.048, 0.025
SITS_X, SITS_B, SITS_T = 0.262, 0.042, 0.020
DYNA_B, DYNA_H = 0.55, 0.12

# sidoprofilerna (y, z) i meter, framsidan mot -y
SIDA = [(0.41, 0.019), (0.20, 0.019), (-0.18, 0.019), (-0.29, 0.043), (-0.334, 0.12), (-0.326, 0.27),
        (-0.292, 0.40), (-0.22, 0.486), (-0.10, 0.499), (0.03, 0.494), (0.12, 0.462), (0.168, 0.40), (0.18, 0.33)]
SITS = [(-0.33, 0.335), (-0.30, 0.347), (-0.15, 0.338), (0.02, 0.308), (0.13, 0.296), (0.205, 0.34),
        (0.27, 0.52), (0.335, 0.74), (0.395, 0.955)]
# dynans sektioner som andelar av sits-ryggramens langd: (start, slut, tjocklek, puff)
SEKTIONER = [(0.0, 0.19, 0.12, 0.16), (0.19, 0.38, 0.12, 0.16), (0.40, 0.535, 0.115, 0.20), (0.535, 0.67, 0.115, 0.20),
             (0.67, 0.80, 0.115, 0.20), (0.80, 0.915, 0.115, 0.20), (0.905, 1.02, 0.14, 0.26)]


def bygg(coll=None) -> b3d.bpy.types.Object:
    rot = b3d.tom("fatolj", coll=coll)
    bjork = delar.bjork("fatolj_bjork")
    bjork_obj = delar.bjork("fatolj_bjork_tvar", koord="OBJECT")
    tyg = delar.sammet("fatolj_sammet", "#CFCDC6")
    gummi = b3d.principled("fatolj_gummi", (0.012, 0.012, 0.012), 0.0, 0.7)
    d = []
    for sx in (-1, 1):
        d.append(delar.band(f"fatolj_sida{sx}", SIDA, SIDA_B, SIDA_T, bjork, coll, x=sx * SIDA_X, fas=0.005))
        d.append(delar.band(f"fatolj_sits{sx}", SITS, SITS_B, SITS_T, bjork, coll, x=sx * SITS_X, fas=0.004))
        # sma svarta gummifotter under medarna, fram och bak
        for y in (-0.17, 0.36):
            d.append(b3d.lada(f"fatolj_fot{sx}{y:+.2f}", (0.034, 0.03, 0.006), (sx * SIDA_X, y, 0.0032), gummi, fas=0.002,
                              coll=coll))
    # tvarslar: bak pa medarna, fram under sitsen, under sitsens svacka och overst i ryggen
    d.append(delar.bradda("fatolj_medtvar", 2 * SIDA_X, 0.05, 0.022, bjork_obj, coll, 0.004, (0, 0.375, 0.041)))
    for andel, namn in ((0.03, "fram"), (0.40, "svacka"), (0.985, "topp")):
        q, t, n, _ = delar.bana_punkt(SITS, andel)
        lage = q - n * (SITS_T / 2 + 0.011)
        vinkel = math.atan2(t.y, t.x)
        d.append(delar.bradda(f"fatolj_tvar_{namn}", 2 * SITS_X, 0.045, 0.02, bjork_obj, coll, 0.004,
                              (0, lage.x, lage.y), (vinkel, 0, 0)))
    # dynan: sektioner som foljer bojen, var och en vriden efter ramens tangent
    _, _, _, langd = delar.bana_punkt(SITS, 0.0)
    for i, (a, b, h, puff) in enumerate(SEKTIONER):
        mitt = (a + b) / 2
        q, t, n, _ = delar.bana_punkt(SITS, min(mitt, 0.995))
        sek = (b - a) * langd * 1.06
        lage = q + n * (SITS_T / 2 + h * 0.46)
        o = delar.dyna(f"fatolj_dyna{i}", DYNA_B, sek, h, tyg, coll, puff=puff, rundning=4.2)
        o.location = (0, lage.x, lage.y)
        o.rotation_euler = (math.atan2(t.y, t.x), 0, 0)
        delar.forfina(o, 1)
        d.append(o)
    delar.foralder(d, rot)
    return rot
