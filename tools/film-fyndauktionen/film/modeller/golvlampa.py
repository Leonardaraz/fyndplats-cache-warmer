"""LED-golvlampa 134 cm i massing (led-golvlampa-134-cm-massing).

Produktsidan: O25 x 134 cm, skarm 23 x 7 cm i glas, fot 20 x 2,5 cm, 18 lysdioder 5 W, 3000 K, massing.
"""
from __future__ import annotations

import math

from .. import b3d
from . import delar

SLUG = "led-golvlampa-134-cm-massing"
HOJD = 1.34
FOT_R, FOT_H = 0.100, 0.025
SKARM_R, SKARM_H = 0.115, 0.070
STANG_R = 0.0068


def bygg(coll=None, glod: float = 1.0) -> b3d.bpy.types.Object:
    rot = b3d.tom("golvlampa", coll=coll)
    mas = delar.massing("lampa_massing", riktning="Z")
    mas_fot = delar.massing("lampa_massing_fot", strav=0.18, riktning="X")
    delar_ = []
    # foten: en tung, rundad skiva med en krage dar stangen sitter
    delar_.append(delar.svarv("lampa_fot", [
        (0.0, 0.0015), (FOT_R - 0.004, 0.0015), (FOT_R - 0.0008, 0.0035), (FOT_R, 0.006), (FOT_R, FOT_H - 0.006),
        (FOT_R - 0.0008, FOT_H - 0.0025), (FOT_R - 0.004, FOT_H), (0.016, FOT_H), (0.0125, FOT_H + 0.004),
        (0.0105, FOT_H + 0.016), (STANG_R + 0.0004, FOT_H + 0.020), (0.0, FOT_H + 0.020)], mas_fot, coll))
    toppz = HOJD - SKARM_H + 0.004
    delar_.append(delar.ror("lampa_stang", (0, 0, FOT_H + 0.015), (0, 0, toppz - 0.02), STANG_R, mas, coll, seg=32))
    # sockeln under skarmen och en tunn massingsring runt glasets kant
    delar_.append(delar.svarv("lampa_sockel", [
        (0.0, toppz - 0.035), (STANG_R + 0.0012, toppz - 0.035), (0.0135, toppz - 0.024), (0.0175, toppz - 0.008),
        (0.0215, toppz), (0.0, toppz)], mas, coll))
    kant_z = toppz
    delar_.append(delar.ring("lampa_kant", SKARM_R - 0.001, 0.0024, (0, 0, kant_z), mat=mas, coll=coll, seg=(96, 10)))
    # glaskupan: ett slutet skal, 3 mm tjockt: utsidan fran kanten upp till toppen, insidan tillbaka ned
    n = 24
    utsida, insida = [], []
    for i in range(n):
        t = i / n
        r = SKARM_R * math.cos(t * math.pi / 2) ** 0.85
        z = kant_z + (HOJD - kant_z - 0.006) * math.sin(t * math.pi / 2) ** 0.75
        utsida.append((r, z))
        insida.append((max(0.004, r - 0.003), z - 0.003))
    topp_ut = HOJD - 0.006
    profil = utsida + [(0.0, topp_ut), (0.0, topp_ut - 0.003)] + insida[::-1] + [utsida[0]]
    delar_.append(delar.svarv("lampa_kupa", profil, delar.kupolglas("lampa_glas", glod=2.2 * glod), coll, skarp=80))
    # toppknoppen i massing
    delar_.append(delar.svarv("lampa_knopp", [
        (0.0, HOJD - 0.008), (0.010, HOJD - 0.008), (0.0115, HOJD - 0.004), (0.0095, HOJD - 0.0005), (0.0, HOJD)],
        mas, coll))
    # lysdiodsringen under kupan: den lyser nedat och in i glaset
    delar_.append(delar.svarv("lampa_led", [(0.0, kant_z + 0.006), (0.075, kant_z + 0.006), (0.075, kant_z + 0.0075),
                                            (0.0, kant_z + 0.0075)], delar.lysdiod("lampa_ljus", 30.0 * glod), coll))
    delar.foralder(delar_, rot)
    return rot
