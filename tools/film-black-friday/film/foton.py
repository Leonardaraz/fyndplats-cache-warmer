"""Forbereder produktfoton for brickorna: vit bakgrund blir helt vit, varan beskars och centreras.

Fotot andras inte i ovrigt: samma bild som i butiken, bara inpassad pa brickans yta.
"""
from __future__ import annotations

from pathlib import Path

import cv2
import numpy as np

from .common import PRODUKTER, UT


def forbered(slug: str, kvot: float = 0.80, hojd_px: int = 1500, marginal: float = 0.07, vitmaska=None) -> Path:
    """Returnerar en PNG (vit bakgrund) med varan centrerad i ett falt med bredd/hojd = kvot."""
    mal = UT / "tex" / f"foto_{slug}_{int(kvot * 1000)}.png"
    kalla = PRODUKTER / f"{slug}.jpg"
    if mal.exists() and mal.stat().st_mtime > kalla.stat().st_mtime:
        return mal
    img = cv2.imread(str(kalla), cv2.IMREAD_COLOR).astype(np.float32) / 255.0
    h, w = img.shape[:2]
    # en infalld extrabild i fotots horn tas bort (varan sjalv ror vi inte): rutor i andelar x0, y0, x1, y1
    for x0, y0, x1, y1 in vitmaska or []:
        img[int(y0 * h):int(y1 * h), int(x0 * w):int(x1 * w)] = 1.0
    # vitpunkt ur bildens kant: bakgrunden ska bli exakt vit
    kant = np.concatenate([img[:12].reshape(-1, 3), img[-12:].reshape(-1, 3), img[:, :12].reshape(-1, 3), img[:, -12:].reshape(-1, 3)])
    vit = np.clip(np.median(kant, axis=0), 0.85, 1.0)
    img = np.clip(img / vit, 0, 1)
    # mjuk upprullning av nastan-vitt till vitt
    morkast = img.min(axis=2)
    lyft = np.clip((morkast - 0.93) / 0.05, 0, 1)[..., None]
    img = img * (1 - lyft) + 1.0 * lyft
    # varans ram: allt som inte ar vitt
    mask = (img.min(axis=2) < 0.94).astype(np.uint8)
    mask = cv2.morphologyEx(mask, cv2.MORPH_OPEN, np.ones((5, 5), np.uint8))
    ys, xs = np.nonzero(mask)
    if len(xs) < 100:
        x0, x1, y0, y1 = 0, w, 0, h
    else:
        x0, x1, y0, y1 = xs.min(), xs.max() + 1, ys.min(), ys.max() + 1
    bw, bh = x1 - x0, y1 - y0
    # falt med ratt kvot runt varan, med marginal
    fh = max(bh, bw / kvot) * (1 + 2 * marginal)
    fw = fh * kvot
    cx, cy = (x0 + x1) / 2, (y0 + y1) / 2
    ut_h, ut_b = hojd_px, int(round(hojd_px * kvot))
    skala = ut_h / fh
    M = np.array([[skala, 0, ut_b / 2 - cx * skala], [0, skala, ut_h / 2 - cy * skala]], dtype=np.float32)
    interp = cv2.INTER_AREA if skala < 1 else cv2.INTER_LANCZOS4
    ut = cv2.warpAffine(img, M, (ut_b, ut_h), flags=interp, borderMode=cv2.BORDER_CONSTANT, borderValue=(1, 1, 1))
    # tona kanten mot vitt sa att faltets grans aldrig syns
    yy, xx = np.mgrid[0:ut_h, 0:ut_b].astype(np.float32)
    d = np.minimum.reduce([xx, ut_b - 1 - xx, yy, ut_h - 1 - yy]) / (0.03 * ut_h)
    ton = np.clip(d, 0, 1)[..., None]
    ut = ut * ton + (1 - ton)
    mal.parent.mkdir(parents=True, exist_ok=True)
    cv2.imwrite(str(mal), (np.clip(ut, 0, 1) * 255 + 0.5).astype(np.uint8))
    return mal
