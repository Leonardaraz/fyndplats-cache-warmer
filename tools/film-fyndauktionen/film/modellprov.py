"""Bilder av varje varumodell fran fyra vinklar, bredvid produktbilden, sa att Leonard kan godkanna modellerna.

    python -m film.modellprov                      # alla modeller
    python -m film.modellprov sidobord-i-stenlook  # en eller flera
    python -m film.modellprov --spp 24 --px 400    # snabbare prov

Skriver out/modellprov/<slug>.jpg (produktbilden och fyra renderingar i rad) och out/modellprov/alla.jpg.
Studion ar neutral och gra, sa att form och material syns som de ar; filmens ljus kommer senare.
"""
from __future__ import annotations

import argparse
import math
import sys
from pathlib import Path

import bpy
import cv2
import numpy as np
from mathutils import Vector

from . import b3d, modeller
from .common import PRODUKTER, UT
from .modeller import delar

VINKLAR = (-35.0, 0.0, 90.0, 160.0)


def _studio(coll):
    gra = b3d.principled("studio_gra", (0.055, 0.055, 0.058), 0.0, 0.55)
    delar.band("studio_halkal", [(-7.0, 0.0), (2.6, 0.0), (3.6, 0.35), (4.1, 1.3), (4.2, 3.0), (4.2, 8.0)], 30.0, 0.02,
               gra, coll, x=0.0, steg=0.05, fas=0.0)
    for namn, plats, effekt, storlek in (("nyckel", (-2.4, -2.9, 2.7), 520.0, 2.2),
                                         ("fyll", (3.0, -2.2, 1.5), 140.0, 2.6),
                                         ("kant", (1.9, 2.6, 2.5), 420.0, (1.4, 3.0)),
                                         ("tak", (0.0, 0.0, 4.2), 90.0, 3.0)):
        yield namn, b3d.ytljus(namn, plats, effekt, storlek, coll=coll)


def _bbox(rot):
    lo, hi = Vector((1e9, 1e9, 1e9)), Vector((-1e9, -1e9, -1e9))
    bpy.context.view_layer.update()
    for o in [rot] + list(rot.children_recursive):
        if o.type != "MESH":
            continue
        for c in o.bound_box:
            w = o.matrix_world @ Vector(c)
            lo = Vector(map(min, lo, w))
            hi = Vector(map(max, hi, w))
    return lo, hi


def _rendera(slug: str, spp: int, px: int, mapp: Path) -> list[Path]:
    sc = b3d.ny_scen()
    sc.world.node_tree.nodes["Background"].inputs[0].default_value = (0.02, 0.02, 0.022, 1)
    sc.world.node_tree.nodes["Background"].inputs[1].default_value = 1.0
    coll = b3d.samling("prov")
    rot = modeller.bygg(slug, coll)
    lo, hi = _bbox(rot)
    radie = (hi - lo).length / 2
    ljus = dict(_studio(coll))
    for o in ljus.values():
        b3d.sikta_fast(o, Vector((0, 0, (lo.z + hi.z) / 2)))
    sc.render.engine = "CYCLES"
    cy = sc.cycles
    cy.device = "CPU"
    cy.samples = spp
    cy.use_adaptive_sampling = True
    cy.adaptive_threshold = 0.03
    cy.use_denoising = True
    cy.denoiser = "OPENIMAGEDENOISE"
    cy.max_bounces = 8
    cy.transmission_bounces = 8
    cy.glossy_bounces = 5
    cy.caustics_reflective = False
    cy.caustics_refractive = False
    sc.render.resolution_x, sc.render.resolution_y = px, int(px * 1.25)
    sc.render.resolution_percentage = 100
    try:
        sc.view_settings.view_transform = "Khronos PBR Neutral"
    except TypeError:
        sc.view_settings.view_transform = "AgX"
    sc.render.image_settings.file_format = "PNG"
    kam = b3d.kamera("provkamera", 85.0, 8.0, coll)
    kam.data.dof.use_dof = False
    sc.camera = kam
    fov_h = 2 * math.atan(36.0 * 0.8 / 2 / 85.0)
    avstand = radie / math.sin(fov_h / 2) * 1.04
    sc.view_settings.exposure = -0.9
    ut = []
    for v in VINKLAR:
        # varan vrids, kameran och studion star still: bakgrunden ar densamma i alla fyra vinklarna
        rot.rotation_euler = (0, 0, -math.radians(v))
        lo, hi = _bbox(rot)
        mitt = (lo + hi) / 2
        hojd = math.radians(13.0)
        kam.location = (mitt.x, mitt.y - avstand * math.cos(hojd), mitt.z + avstand * math.sin(hojd))
        b3d.sikta_fast(kam, mitt)
        fil = mapp / f"{slug}_{int(v):+04d}.png"
        sc.render.filepath = str(fil)
        bpy.ops.render.render(write_still=True)
        ut.append(fil)
    return ut


def _rubrik(slug: str, bredd: int, px: int) -> np.ndarray:
    """Rubrikrad med varans namn och butikens pris (fran varudata), i Geist sa att a, a och o syns."""
    import json

    from PIL import Image, ImageDraw, ImageFont

    from .common import FONTS
    namn, pris = slug, ""
    fil = PRODUKTER / "varor.json"
    if fil.exists():
        v = json.loads(fil.read_text(encoding="utf-8")).get(slug, {})
        namn = (v.get("namn") or slug).split(" – ")[0]
        if v.get("pris"):
            pris = f"{int(round(float(v['pris']))):,} kr".replace(",", " ")
    h = max(40, px // 9)
    im = Image.new("RGB", (bredd, h), (16, 16, 16))
    d = ImageDraw.Draw(im)
    f = ImageFont.truetype(str(FONTS / "Geist-SemiBold.ttf"), int(h * 0.45))
    d.text((int(h * 0.4), int(h * 0.24)), f"{namn}   ·   {pris}   ·   produktbilden och modellen från fyra vinklar",
           font=f, fill=(233, 190, 98))
    return np.array(im)[..., ::-1].copy()


def _ark(slug: str, renderingar: list[Path], px: int, mapp: Path) -> Path:
    h = int(px * 1.25)
    foto = cv2.imread(str(PRODUKTER / slug / "01.jpg"))
    duk = np.full((h, px, 3), 255, np.uint8)
    if foto is not None:
        s = min(px / foto.shape[1], h / foto.shape[0]) * 0.94
        f = cv2.resize(foto, (int(foto.shape[1] * s), int(foto.shape[0] * s)), interpolation=cv2.INTER_AREA)
        y0, x0 = (h - f.shape[0]) // 2, (px - f.shape[1]) // 2
        duk[y0:y0 + f.shape[0], x0:x0 + f.shape[1]] = f
    rad = [duk] + [cv2.imread(str(r)) for r in renderingar]
    sep = np.full((h, 6, 3), 30, np.uint8)
    bild = rad[0]
    for r in rad[1:]:
        bild = np.hstack([bild, sep, r])
    bild = np.vstack([_rubrik(slug, bild.shape[1], px), bild])
    ut = mapp / f"{slug}.jpg"
    cv2.imwrite(str(ut), bild, [cv2.IMWRITE_JPEG_QUALITY, 92])
    return ut


def main(argv=None) -> None:
    argv = sys.argv[1:] if argv is None else argv
    ap = argparse.ArgumentParser()
    ap.add_argument("slugs", nargs="*")
    ap.add_argument("--spp", type=int, default=48)
    ap.add_argument("--px", type=int, default=640)
    a = ap.parse_args(argv)
    mapp = UT / "modellprov"
    mapp.mkdir(parents=True, exist_ok=True)
    ark = []
    for slug in a.slugs or list(modeller.MODULER):
        ark.append(_ark(slug, _rendera(slug, a.spp, a.px, mapp), a.px, mapp))
        print("modellprov:", ark[-1], flush=True)
    bilder = [cv2.imread(str(p)) for p in ark]
    bredd = max(b.shape[1] for b in bilder)
    alla = np.vstack([np.pad(b, ((0, 8), (0, bredd - b.shape[1]), (0, 0)), constant_values=30) for b in bilder])
    cv2.imwrite(str(mapp / "alla.jpg"), alla, [cv2.IMWRITE_JPEG_QUALITY, 90])
    print("modellprov: alla ->", mapp / "alla.jpg")


if __name__ == "__main__":
    main()
