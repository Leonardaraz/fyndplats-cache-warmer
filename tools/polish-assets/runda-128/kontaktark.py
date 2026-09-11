# -*- coding: utf-8 -*-
"""Kontaktark över rundans nio kort — obligatoriskt FÖRE uppladdningen.

☠️ Runbokens regel: "Granska alltid de färdiga korten i ett kontaktark innan
   uppladdningen — felet syns på en sekund där och aldrig i ett API-svar."
   Grindarna i kort.py läser STRÄNGARNA. De kan inte se om rubriken bärs av
   fotot under den, om varan hamnat utanför panelen eller om två kort ser
   likadana ut för ögat trots olika text.

Arket byggs i två delar med flit: en 3x3-översikt för layout och dubbletter,
och tre närbildsremsor där spec-raderna faktiskt går att läsa. Ett enda 3x3-ark
skalar ner varje kort till en tredjedel, och då är det bara rubriken som syns.
"""
import os
import sys

from PIL import Image, ImageDraw

HAR = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HAR)
import kort as K                                                  # noqa: E402
import texter as T                                                # noqa: E402

ALLA = list(K.KORT)


def las(pid):
    return Image.open(os.path.join(HAR, "kort", f"{pid}_spec.jpg")).convert("RGB")


def oversikt(ut="kontaktark-kort.jpg", ruta=520, etikett=34):
    ark = Image.new("RGB", (ruta * 3, (ruta + etikett) * 3), "white")
    rit = ImageDraw.Draw(ark)
    for i, pid in enumerate(ALLA):
        x, y = (i % 3) * ruta, (i // 3) * (ruta + etikett)
        ark.paste(las(pid).resize((ruta, ruta), Image.LANCZOS), (x, y + etikett))
        rit.text((x + 8, y + 10), f"{pid}  {T.SLUG[pid][:44]}", fill="black")
        rit.rectangle([x, y, x + ruta - 1, y + etikett + ruta - 1], outline="black")
    ark.save(os.path.join(HAR, ut), quality=90)
    return ut, ark.size


def remsa(pids, ut, bredd=760, etikett=30):
    """Tre kort i höjdled — nära 1:1 efter klientens nedskalning."""
    ark = Image.new("RGB", (bredd, (bredd + etikett) * len(pids)), "white")
    rit = ImageDraw.Draw(ark)
    for i, pid in enumerate(pids):
        y = i * (bredd + etikett)
        ark.paste(las(pid).resize((bredd, bredd), Image.LANCZOS), (0, y + etikett))
        rit.text((8, y + 8), f"{pid}   {K.KORT[pid][0]} / {K.KORT[pid][1]}", fill="black")
        rit.rectangle([0, y, bredd - 1, y + etikett + bredd - 1], outline="black")
    ark.save(os.path.join(HAR, ut), quality=90)
    return ut, ark.size


if __name__ == "__main__":
    print("%s  %s" % oversikt())
    for n in range(3):
        print("%s  %s" % remsa(ALLA[n * 3:n * 3 + 3], f"kontaktark-kort-{n + 1}.jpg"))
