# -*- coding: utf-8 -*-
"""Runda 131 Steg 4 — datafil. Reglerna bor i `kontaktrunda`."""
import os
import sys

sys.path.insert(0, "..")
import kontaktrunda as K                                           # noqa: E402

HAR = os.path.dirname(os.path.abspath(__file__))

# ☠️ Färgsyskonen i SAMMA grupp — en färgskillnad syns bara bredvid sitt syskon.
GRUPPER = [
    ["2166c50f", "9a513e9a", "c2be0f30"],   # bilrampen i grå, brun, svart
    ["ed1ea8dc", "15e4c7a7"],               # möbelramper i furu
    ["935cd17b", "1b64abde"],
]

if __name__ == "__main__":
    K.ark(HAR, GRUPPER)
