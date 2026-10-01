#!/usr/bin/env python3
"""Bygger campingtältets fyra kort ur `kortrader.tsv`, efter att ha grindat texten.

Varför en egen byggare: `bygg-kort.py` och `gate-kort.py` bygger ETT spec-kort per
produkt, och den här produkten behöver ett kort per storlek (valen pekar på dem)
plus ett fotokort. Grindningen är densamma: `gatelib.GRINDAR` på all text, och
varje tal ska finnas i produktens källtext (`kallor.json`), i rundans kvittenser
eller i `avrundat.tsv`, där tillverkarens vikter står avrundade till en decimal.

Kör från rundans katalog:
  python3 bygg-kortrader.py
  → cards/<id>.png (3200², ignoreras) och <id>.png (1600², laddas upp)
"""
import os
import re
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, os.path.join(HERE, "..", "..", "polish-gates"))
sys.path.insert(0, os.path.join(HERE, "..", "..", "..", "scripts"))
from gatelib import GRINDAR, tal, las_facit, las_kvittenser  # noqa: E402
import cardkit as ck  # noqa: E402
from PIL import Image  # noqa: E402

KORT = "9a911ab5"
ENHETER = ("m", "kg", "st", "cm", "min")

facit, _ = las_facit()
rad_tal, foto_tal = las_kvittenser()
avrundat = set()
for rad in open("avrundat.tsv", encoding="utf-8"):
    if rad.strip() and not rad.startswith("#"):
        avrundat.add(rad.split("\t")[0].strip())
tillatna = set(facit.get(KORT, [])) | rad_tal | foto_tal.get(KORT, set()) | avrundat

kort = []
for rad in open("kortrader.tsv", encoding="utf-8"):
    rad = rad.rstrip("\n")
    if not rad.strip() or rad.startswith("#"):
        continue
    delar = rad.split("\t")
    if len(delar) != 7:
        sys.exit(f"[AVBRYT] fel antal kolumner: {rad[:60]}")
    kort.append(delar)

fynd = 0
for kid, typ, foto, kicker, titel, fotnot, innehall in kort:
    text = " ".join([kicker, titel, fotnot, innehall.replace("|", " ").replace("=", " ")])
    for namn, m in GRINDAR:
        for x in re.finditer(m, text):
            print(f"  {kid}: [{namn}] {x.group(0)!r}")
            fynd += 1
    for t in sorted(tal(text) - tillatna):
        print(f"  {kid}: [SIFFRA UTAN KÄLLA] {t!r}")
        fynd += 1
    if not os.path.exists(foto):
        print(f"  {kid}: [FOTO SAKNAS] {foto}")
        fynd += 1
if fynd:
    sys.exit(f"[AVBRYT] {fynd} fynd — ingenting renderat.")


def markera(varde):
    """Talet i svart och enheten i husets orange, som i alla kort."""
    varde = varde.replace("Ø ", "Ø&nbsp;")
    for e in ENHETER:
        if varde.endswith(" " + e):
            return varde[: -len(e) - 1] + f"&nbsp;<span class=u>{e}</span>"
    return varde


namn = []
for kid, typ, foto, kicker, titel, fotnot, innehall in kort:
    rubrik = markera(titel) if typ == "spec" else titel
    if typ == "foto":
        ck.card_photo(kid, foto, kicker, rubrik, innehall, note=fotnot, fit=False)
    else:
        rader = [tuple(p.split("=", 1)) for p in innehall.split("|")]
        ck.card_spec(kid, foto, kicker, rubrik, [(k, markera(v)) for k, v in rader], note=fotnot)
    namn.append(kid)

for p in ck.render(namn):
    im = Image.open(p).convert("RGB")
    assert im.size == (3200, 3200), f"{p}: {im.size}"
    # Inga mörka rader i nederkant (viewport-fällan i bildmetoderna)
    px = im.load()
    for y in range(3199, 3100, -1):
        rad = [sum(px[x, y]) / 3 for x in range(0, 3200, 50)]
        assert sum(rad) / len(rad) > 40, f"{p}: mörk rad {y}"
    ut = os.path.basename(p)
    im.resize((1600, 1600), Image.LANCZOS).save(ut, optimize=True)
    print(f"  {ut}: 1600 × 1600, {os.path.getsize(ut) // 1024} kB")
print(f"KORT: {len(namn)} renderade, 0 fynd")
