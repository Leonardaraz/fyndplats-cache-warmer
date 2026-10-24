#!/usr/bin/env python3
"""bygg-hjalte-kista.py: hjältefotot till förvaringskistans färgneutrala måttkort (b129d5ae-m och b129d5ae-l), orig/b129d5ae-m.jpg och -l.jpg.

Kör från rundans katalog, före bygg-kort.py:  python3 -P bygg-hjalte-kista.py

Varför ett eget skript: komponera-hjalte.py vitrensar varje bild med cardkits `hero_white`, som kräver vit botten. Kistan i mörk khaki har ett packshot på vit botten
(galleriets plats 1), men den vita kistan har bara miljöfoton (plats 2 och 3), och en vit kista på vit botten går inte att skilja från bakgrunden. Hjälten lägger därför
packshoten till vänster som den är och miljöfotot till höger med rundade hörn, så att båda färgerna syns på samma kort. Båda korten (M och L) får samma hjälte: kistan ser likadan
ut i båda storlekarna, och korten skiljer sig i texten.

Källfilerna är leverantörens foton och checkas aldrig in (`orig/` är gitignorerad). De hämtas ur Wix CDN på fil-id, och de id:n som hjälten byggdes av står här.
☠️ Granska hjälten med ögonen: ett miljöfoto med text eller märke i bilden ska inte användas (plats 3 är rent: en vit kista med öppet lock vid en säng).
"""
import os, sys, urllib.request
import numpy as np
from PIL import Image, ImageDraw

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(HERE))), "scripts"))
import cardkit as ck  # noqa: E402

KHAKI = "b379ce_b5e78ad1e03e4c29bd454386e00c941b~mv2.jpg"   # galleriets plats 1: packshot på vit botten
VIT = "b379ce_4b7331bd27434a57a56f5e0adf413991~mv2.jpeg"    # galleriets plats 3: vit kista med öppet lock vid en säng
W, H = 2832, 1552   # 2 × hjältepanelen i card_spec (1416 × 776)
PAD = 70


def hamta(fil):
    ut = os.path.join("orig", "src", fil.replace("~", "_"))
    if os.path.exists(ut) and os.path.getsize(ut) > 1000:
        return ut
    os.makedirs(os.path.dirname(ut), exist_ok=True)
    data = urllib.request.urlopen(urllib.request.Request("https://static.wixstatic.com/media/" + fil, headers={"User-Agent": "Mozilla/5.0"}), timeout=60).read()
    assert len(data) > 1000, fil
    open(ut, "wb").write(data)
    return ut


def packshot(fil):
    """Packshoten vitrensad med cardkits hero_white (bakgrunden som hänger ihop med bildkanten blir ren vit) och beskuren till produktens ram, som komponera-hjalte.py gör."""
    tmp = "/tmp/bygg-hjalte-kista-%d.jpg" % os.getpid()
    ck.hero_white(hamta(fil), tmp, trosk=245)
    a = np.asarray(Image.open(tmp).convert("RGB"))
    os.remove(tmp)
    ys, xs = np.where(a.min(axis=2) < 250)
    assert len(ys) > 0, "ingen produkt hittades i " + fil
    pad = 6
    return Image.fromarray(a[max(0, ys.min() - pad):ys.max() + pad + 1, max(0, xs.min() - pad):xs.max() + pad + 1])


def inryms(im, bredd, hojd):
    s = min(bredd / im.size[0], hojd / im.size[1])
    return im.resize((int(im.size[0] * s), int(im.size[1] * s)), Image.LANCZOS)


duk = Image.new("RGB", (W, H), "white")
cw, ch = W // 2 - 2 * PAD, H - 2 * PAD
a = inryms(packshot(KHAKI), cw, ch)
duk.paste(a, (PAD + (cw - a.size[0]) // 2, PAD + (ch - a.size[1]) // 2))
b = inryms(Image.open(hamta(VIT)).convert("RGB"), cw, ch)
mask = Image.new("L", b.size, 0)
ImageDraw.Draw(mask).rounded_rectangle([0, 0, b.size[0] - 1, b.size[1] - 1], radius=56, fill=255)
duk.paste(b, (W // 2 + PAD + (cw - b.size[0]) // 2, PAD + (ch - b.size[1]) // 2), mask)
os.makedirs("orig", exist_ok=True)
for k in ("b129d5ae-m", "b129d5ae-l"):
    duk.save(f"orig/{k}.jpg", quality=92)
    print(f"orig/{k}.jpg: {W} × {H}")
