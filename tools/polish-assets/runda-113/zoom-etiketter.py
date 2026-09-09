# -*- coding: utf-8 -*-
"""Zoom på de två EU-energietiketterna som ligger som produktbild.

☠️ Båda bär Aosoms ARTIKELNUMMER inbränt i pixlarna. Det är det farligaste vi
   har att läcka (CLAUDE.md): numret står i Aosoms egen produkt-URL, och
   dealproffsen.se publicerar samma sträng som `sku`/`mpn` i sin JSON-LD.

⚠️ Men etiketten är samtidigt den enda REGLERADE källan till årsförbrukning och
   ljudklass. Den ska läsas — och sedan inte publiceras som den är.
"""
import io, urllib.request
from PIL import Image

BAS = "https://static.wixstatic.com/media/%s/v1/fill/w_1400,h_1400,al_c,q_92/f.jpg"
FALL = [("b2c76518-etikett.jpg", "b379ce_023e8f2102a74a72b68c9b1272a30eb2~mv2.jpg"),
        ("480849a7-etikett.jpg", "b379ce_033b615b5c964793a53b81a9e784a479~mv2.jpg")]
for namn, fil in FALL:
    req = urllib.request.Request(BAS % fil, headers={"User-Agent": "Mozilla/5.0"})
    b = Image.open(io.BytesIO(urllib.request.urlopen(req, timeout=90).read())).convert("RGB")
    w, h = b.size
    b.crop((int(w * .22), int(h * .05), int(w * .82), int(h * .95))).save(namn, quality=95)
    print(namn, b.size)
