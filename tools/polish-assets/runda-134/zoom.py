# -*- coding: utf-8 -*-
"""Runda 134 — zoomade utsnitt. Måttritningarna läses i FULL upplösning, aldrig
på ett kontaktark (uppgift #401: en glimt ställer fel fråga)."""
import os
import sys

from PIL import Image

HAR = os.path.dirname(os.path.abspath(__file__))
R133 = os.path.join(os.path.dirname(HAR), "runda-133")
sys.path.insert(0, R133)
import bilder as B                                               # noqa: E402

MAPP = os.path.join(R133, "bytebilder")


def las(pid, nr):
    f = B.GALLERI[pid][nr - 1].replace("~", "_")
    return Image.open(os.path.join(MAPP, f)).convert("RGB")


def stapel(par, ut, bredd=1500):
    """par = [(pid, bildnr), ...] — varje bild skalad till `bredd`, staplade."""
    bilder = []
    for pid, nr in par:
        b = las(pid, nr)
        h = int(b.height * bredd / b.width)
        bilder.append(b.resize((bredd, h), Image.LANCZOS))
    ark = Image.new("RGB", (bredd, sum(b.height for b in bilder)), "white")
    y = 0
    for b in bilder:
        ark.paste(b, (0, y))
        y += b.height
    vag = os.path.join(HAR, ut)
    ark.save(vag, quality=92)
    return vag, ark.size


if __name__ == "__main__":
    print(*stapel([("668e0e0c", 3), ("38022bcb", 3)], "mattritningar-tysk-text.jpg"))
    print(*stapel([("f4e6159e", 3), ("f6857ca0", 3), ("09336fdf", 3)], "mattritningar-rena.jpg"))
