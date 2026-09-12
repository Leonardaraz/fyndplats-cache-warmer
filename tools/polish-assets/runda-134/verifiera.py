# -*- coding: utf-8 -*-
"""Runda 134 — kvitto på att texten FAKTISKT lagrades, jämfört mot filen.

☠️ EN BYTEJÄMFÖRELSE AV `plainDescription` FALLER ALLTID. Wix normaliserar
   markupen vid skrivning: varje `<li>text</li>` lagras som
   `<li><p>text</p></li>`. Uppmätt på `f6857ca0`: filen 2 838 tecken, Wix
   3 225 — 387 tecken som ingen av oss skrev.

   Det gör en naiv verifiering värdelös åt BÅDA håll: den rapporterar fel på
   en korrekt skrivning, och den som sett den falla en gång slutar verifiera.

✅ DET SOM GÅR ATT JÄMFÖRA ÄR DEN SYNLIGA TEXTEN — det kunden läser, och det
   enda vi faktiskt påstår något om. Taggarna är Wix sak. Samma normalisering
   med samma FNV-1a på båda sidor ger ett tal som antingen stämmer eller inte.

   `f6857ca0`: 2 233 synliga tecken, fnv1a 528968805, på BÅDA sidor.
"""
import io
import json
import os
import re

HAR = os.path.dirname(os.path.abspath(__file__))


def synligt(html):
    """Samma normalisering som verifieringen kör mot Wix-sidan."""
    return re.sub(r"\s+", " ", re.sub(r"<[^>]+>", " ", html)).strip()


def fnv1a(text):
    h = 2166136261
    for ch in text:
        h ^= ord(ch)
        h = (h * 16777619) & 0xFFFFFFFF
    return h


def facit():
    """{pid: (synliga tecken, fnv1a)} ur steg7.json — det som SKA stå i Wix."""
    d = json.load(io.open(os.path.join(HAR, "steg7.json"), encoding="utf-8"))
    return {pid: (len(synligt(v["plainDescription"])),
                  fnv1a(synligt(v["plainDescription"])))
            for pid, v in d.items()}


if __name__ == "__main__":
    for pid, (n, h) in sorted(facit().items()):
        print("%s  %5d tecken  fnv1a %d" % (pid, n, h))
