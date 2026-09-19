# -*- coding: utf-8 -*-
"""Bygg kontaktkartor för Steg 4 + hörnremsan för logotypkollen."""
import pathlib, math, sys
from PIL import Image, ImageDraw

HAR = pathlib.Path(__file__).parent
RAW = HAR / "rawbilder"


def filer(pid):
    return [p for p in sorted(RAW.glob(f"{pid}-*.jpg")) if p.stat().st_size > 2000]


def ark(pids, namn, s=330, kol=5):
    rader = []
    for pid in pids:
        rader.append((pid, filer(pid)))
    h = sum(math.ceil(len(f) / kol) for _, f in rader) * s + 26 * len(rader)
    ut = Image.new("RGB", (kol * s, h), (255, 255, 255))
    d = ImageDraw.Draw(ut)
    y = 0
    for pid, f in rader:
        d.text((6, y + 6), f"── {pid} ({len(f)} bilder)", fill=(0, 90, 180))
        y += 26
        for i, p in enumerate(f):
            im = Image.open(p).convert("RGB")
            im.thumbnail((s - 18, s - 26))
            x = (i % kol) * s
            yy = y + (i // kol) * s
            ut.paste(im, (x + 9, yy + 22))
            d.text((x + 9, yy + 5), f"{i+1:02d}", fill=(200, 60, 0))
        y += math.ceil(len(f) / kol) * s
    ut.save(HAR / namn, quality=86)
    print(namn, ut.size)


def hornremsa(pids, namn, br=470, ho=190):
    """Övre vänstra 45 x 17 % ur bild 1 och 2 — leverantörens logotyp bor där."""
    rutor = []
    for pid in pids:
        for i in (1, 2):
            f = filer(pid)
            if len(f) < i:
                continue
            im = Image.open(f[i - 1]).convert("RGB")
            w, h = im.size
            bit = im.crop((0, 0, int(w * 0.45), int(h * 0.17))).resize((br, ho))
            rutor.append((f"{pid} b{i}", bit))
    kol = 2
    s_h = ho + 24
    ut = Image.new("RGB", (kol * br, math.ceil(len(rutor) / kol) * s_h), (250, 250, 250))
    d = ImageDraw.Draw(ut)
    for i, (etikett, bit) in enumerate(rutor):
        x, y = (i % kol) * br, (i // kol) * s_h
        d.text((x + 6, y + 5), etikett, fill=(180, 0, 0))
        ut.paste(bit, (x, y + 22))
    ut.save(HAR / namn, quality=92)
    print(namn, ut.size, len(rutor), "hörn")


if __name__ == "__main__":
    BATCH = ["820d076b", "15d6fcef", "0fd65541", "2e292a70",
             "a4ee97c1", "8a73caf4", "fcb86875", "ca20d60e"]
    ark(BATCH[:4], "kontaktark-a.jpg")
    ark(BATCH[4:], "kontaktark-b.jpg")
    ark(["764a3efc", "0910f983", "fba157f2"], "kontroll-dubblett.jpg", kol=6)
    hornremsa(BATCH, "kontroll-hornen.jpg")
