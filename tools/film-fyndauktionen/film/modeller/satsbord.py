"""Satsbord 2 st i guld med glasskiva (satsbord-2-st-guld-glasskiva).

Produktsidan: O41 x 57 cm och O36 x 51 cm, guldfargad metall och hardat glas. Varje bord ar en bur av
lodrata stanger mellan en nedre och en ovre ring, med ringar och kulor i metall pa stangerna.
"""
from __future__ import annotations

import math

from .. import b3d
from . import delar

SLUG = "satsbord-2-st-guld-glasskiva"
BORD = [(0.205, 0.57, (-0.115, -0.02), 0.0, 11), (0.18, 0.51, (0.215, 0.07), 0.4, 23)]
STANG_R = 0.0052
RING_R = 0.0042
STANGER = 8


def _bord(namn: str, R: float, H: float, mitt, vrid: float, fro: int, guld, glas, coll):
    s = delar.slump(fro)
    ram = R - 0.012
    glas_t = 0.005
    topp = H - glas_t - 0.0055
    cx, cy = mitt
    delar_ = [
        delar.ring(f"{namn}_nedre", ram, 0.0058, (cx, cy, 0.0058), mat=guld, coll=coll, seg=(120, 12)),
        delar.ring(f"{namn}_ovre", ram, 0.0055, (cx, cy, topp), mat=guld, coll=coll, seg=(120, 12)),
    ]
    for i in range(STANGER):
        a = vrid + 2 * math.pi * i / STANGER
        x, y = cx + ram * math.cos(a), cy + ram * math.sin(a)
        delar_.append(delar.ror(f"{namn}_stang{i}", (x, y, 0.004), (x, y, topp), STANG_R, guld, coll, seg=16))
        # ringar och kulor pa stangen, i ett monster som vaxlar fran stang till stang
        if i % 2 == 0:
            ringar = [(0.12 + 0.03 * s.random(), 0.050), (0.36 + 0.04 * s.random(), 0.036)]
        else:
            ringar = [(0.22 + 0.04 * s.random(), 0.040), (0.47 + 0.03 * s.random(), 0.048)]
        normal = (math.cos(a), math.sin(a), 0.0)
        for k, (h_rel, rr) in enumerate(ringar):
            z = 0.02 + h_rel * (topp - 0.04) + rr
            z = min(z, topp - rr - 0.012)
            delar_.append(delar.ring(f"{namn}_ring{i}_{k}", rr, RING_R, (x, y, z), normal, guld, coll, seg=(64, 10)))
        for k in range(2):
            z = 0.04 + (0.70 + 0.2 * s.random() if (i + k) % 2 else 0.05 + 0.04 * s.random()) * (topp - 0.08)
            delar_.append(delar.kula(f"{namn}_kula{i}_{k}", 0.0085, (x, y, z), guld, coll, seg=20))
    # glasskivan vilar pa den ovre ringen
    zg = topp + 0.0052
    delar_.append(delar.svarv(f"{namn}_glas", [
        (0.0, zg), (R - 0.0025, zg), (R, zg + 0.0015), (R, zg + glas_t - 0.0015), (R - 0.0025, zg + glas_t),
        (0.0, zg + glas_t)], glas, coll, seg=144, plats=(cx, cy, 0), skarp=40))
    return delar_


def bygg(coll=None) -> b3d.bpy.types.Object:
    rot = b3d.tom("satsbord", coll=coll)
    guld = delar.guldmetall("satsbord_guld")
    glas = delar.glas("satsbord_glas")
    alla = []
    for n, (R, H, mitt, vrid, fro) in enumerate(BORD):
        alla += _bord(f"satsbord{n}", R, H, mitt, vrid, fro, guld, glas, coll)
    delar.foralder(alla, rot)
    return rot
