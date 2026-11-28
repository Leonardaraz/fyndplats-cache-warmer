"""Sidobord i stenlook O 37 cm (sidobord-i-stenlook).

Produktsidan: O 37 x 43 cm, cylinder utan ben pa en indragen sockel, organiskt mineralpulver i kramvit
stenlook, bar 90 kg.
"""
from __future__ import annotations

from .. import b3d
from . import delar

SLUG = "sidobord-i-stenlook"
R, H = 0.185, 0.43
SOCKEL_R, SOCKEL_H = 0.150, 0.038


def bygg(coll=None) -> b3d.bpy.types.Object:
    rot = b3d.tom("sidobord", coll=coll)
    sten = delar.stenlook("sidobord_sten")
    kropp = delar.svarv("sidobord_kropp", [
        (0.0, 0.003), (SOCKEL_R - 0.003, 0.003), (SOCKEL_R, 0.006), (SOCKEL_R, SOCKEL_H), (R - 0.004, SOCKEL_H),
        (R - 0.0008, SOCKEL_H + 0.0015), (R, SOCKEL_H + 0.005), (R, H - 0.007), (R - 0.0006, H - 0.0035),
        (R - 0.0024, H - 0.0012), (R - 0.006, H), (0.0, H)], sten, coll, seg=128, skarp=60)
    kropp.parent = rot
    return rot
