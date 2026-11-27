"""Provrutor: bygger en tagning en gang, renderar flera rutor (bild och volym) och satter ihop dem med texterna.

    python -m film.provruta --tagning A --rutor 0,60,150 --kvalitet utkast
    python -m film.provruta --tagning C --rutor 380,430 --kvalitet prov --utan-volym

Skriver EXR som vanligt (out/exr/<kvalitet>/<tagning>/) och ett ark i out/prov_rutor/<tagning>_<kvalitet>.jpg,
sa att komposition, ljus och texter kan granskas innan den langa renderingen.
"""
from __future__ import annotations

import argparse
import json
import time

import bpy
import cv2
import numpy as np

from . import render
from .common import UT
from .comp import komponera, till_8bit


def main(argv=None) -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("--tagning", required=True)
    ap.add_argument("--rutor", required=True, help="kommaseparerade rutnummer")
    ap.add_argument("--kvalitet", default="utkast")
    ap.add_argument("--utan-volym", action="store_true")
    ap.add_argument("--look", default=None)
    ap.add_argument("--over", default=None)
    a = ap.parse_args(argv)
    rutor = [int(x) for x in a.rutor.split(",")]
    look = json.loads(a.look) if a.look else None
    over = json.loads(a.over) if a.over else None
    mapp = UT / "exr" / a.kvalitet / a.tagning
    mapp.mkdir(parents=True, exist_ok=True)
    for volym in ([False] if a.utan_volym else [False, True]):
        t0 = time.time()
        sc = render.bygg(a.tagning, volym, look)
        render.installningar(sc, a.kvalitet, volym, over)
        sc.render.use_overwrite = True
        sc.render.use_placeholder = False
        for f in rutor:
            sc.frame_set(f)
            sc.render.filepath = str(mapp / f"{'vol_' if volym else 'bild_'}{f:04d}.exr")
            bpy.ops.render.render(write_still=True)
        print(f"provruta: {'volym' if volym else 'bild'} {len(rutor)} rutor {time.time() - t0:.0f} s", flush=True)
    titlar = UT / "titlar"
    bilder = []
    for f in rutor:
        b = np.ascontiguousarray(till_8bit(komponera(f, a.kvalitet, 0.5, titlar if titlar.exists() else None), f)[..., ::-1])
        cv2.putText(b, str(f), (14, 40), cv2.FONT_HERSHEY_SIMPLEX, 1.1, (90, 200, 255), 2, cv2.LINE_AA)
        bilder.append(b)
    ut = UT / "prov_rutor"
    ut.mkdir(parents=True, exist_ok=True)
    fil = ut / f"{a.tagning}_{a.kvalitet}.jpg"
    cv2.imwrite(str(fil), np.hstack(bilder), [cv2.IMWRITE_JPEG_QUALITY, 90])
    print("provruta: ark ->", fil)


if __name__ == "__main__":
    main()
