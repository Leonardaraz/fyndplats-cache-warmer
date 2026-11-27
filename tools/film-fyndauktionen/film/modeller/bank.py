"""Tradgardsbank i akacia 112 cm (tradgardsbank-i-akacia-112-cm).

Produktsidan: 112 x 64 x 92 cm (B x D x H), sittyta 103 x 50 cm, sitthojd 43 cm, armstod 63,5 cm over
mark, massiv akacia, oljad. Sitsen har ribbor pa langden och ryggen lodrata ribbor under ett valvt kron.
"""
from __future__ import annotations

import math

from .. import b3d
from . import delar

SLUG = "tradgardsbank-i-akacia-112-cm"
BEN_X = 0.535
FRAM_Y, BAK_Y = -0.255, 0.255
SITS_Z = 0.43
ARM_Z = 0.635
LUTNING = math.radians(10)
VERT = (0, -math.pi / 2, 0)      # brädans langd lodrat
LANGS_Y = (0, 0, math.pi / 2)    # brädans langd framat-bakat


def _rundad_topp(x: float, bredd: float, botten: float, topp: float, radie: float):
    """Kontur (framifran) for en bradda med rundade ovre horn."""
    k = [(x - bredd / 2, botten), (x + bredd / 2, botten)]
    for i in range(7):
        a = math.pi / 2 * i / 6
        k.append((x + bredd / 2 - radie + radie * math.cos(a), topp - radie + radie * math.sin(a)))
    for i in range(7):
        a = math.pi / 2 + math.pi / 2 * i / 6
        k.append((x - bredd / 2 + radie + radie * math.cos(a), topp - radie + radie * math.sin(a)))
    return k


def bygg(coll=None) -> b3d.bpy.types.Object:
    rot = b3d.tom("bank", coll=coll)
    tra = delar.akacia("bank_akacia")
    d = []
    for sx in (-1, 1):
        x = sx * BEN_X
        d.append(delar.bradda(f"bank_framben{sx}", ARM_Z - 0.025, 0.05, 0.05, tra, coll, 0.004,
                              (x, FRAM_Y, (ARM_Z - 0.025) / 2), VERT))
        d.append(delar.bradda(f"bank_bakben{sx}", 0.46, 0.06, 0.05, tra, coll, 0.004, (x, BAK_Y, 0.23), VERT))
        d.append(delar.bradda(f"bank_arm{sx}", 0.63, 0.075, 0.026, tra, coll, 0.005, (x, -0.005, ARM_Z - 0.013), LANGS_Y))
        d.append(delar.bradda(f"bank_sidoregel{sx}", 0.46, 0.028, 0.06, tra, coll, 0.003, (x * 0.955, 0.0, SITS_Z - 0.05),
                              LANGS_Y))
        d.append(delar.bradda(f"bank_fotregel{sx}", 0.46, 0.03, 0.04, tra, coll, 0.003, (x, 0.0, 0.11), LANGS_Y))
    for y in (FRAM_Y, BAK_Y):
        d.append(delar.bradda(f"bank_regel{y:+.2f}", 1.02, 0.022, 0.06, tra, coll, 0.003, (0, y, SITS_Z - 0.05)))
    # sitsen: sex ribbor pa langden
    for i in range(6):
        y = -0.245 + i * 0.098
        d.append(delar.bradda(f"bank_sitsribba{i}", 1.03, 0.072, 0.02, tra, coll, 0.004, (0, y, SITS_Z - 0.01)))
    # ryggen lutar bakat runt en led strax ovanfor sitsen
    rygg = b3d.tom("bank_rygg", (0, BAK_Y, SITS_Z + 0.02), coll)
    rygg.rotation_euler = (-LUTNING, 0, 0)
    r = []
    hojd = 0.92 - SITS_Z - 0.02
    lodrat = delar.akacia("bank_akacia_lodrat", axel="Z")
    for sx in (-1, 1):
        r.append(delar.profilplatta(f"bank_ryggstolpe{sx}", _rundad_topp(sx * BEN_X, 0.05, 0.0, hojd, 0.02), 0.06,
                                    lodrat, coll, 0.004))
    # tvarreglarna sitter bakom ribborna och syns i springorna
    for z, h in ((0.075, 0.05), (hojd - 0.115, 0.045)):
        r.append(delar.bradda(f"bank_ryggregel{z:.2f}", 1.02, 0.02, h, tra, coll, 0.003, (0, 0.019, z)))
    # tretton lodrata ribbor med rundade toppar som tillsammans bildar en svag bage
    for i in range(13):
        x = -0.462 + i * 0.077
        u = x / 0.47
        topp = hojd - 0.035 + 0.03 * (1 - u * u)
        r.append(delar.profilplatta(f"bank_ryggribba{i}", _rundad_topp(x, 0.05, 0.045, topp, 0.012), 0.016,
                                    lodrat, coll, 0.003, y=0.0))
    delar.foralder(r, rygg)
    rygg.parent = rot
    delar.foralder(d, rot)
    return rot
