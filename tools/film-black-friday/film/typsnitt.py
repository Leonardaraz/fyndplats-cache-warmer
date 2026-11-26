"""Bygger fasta typsnittsskarningar ur de variabla filerna (Blender laser inte variabla typsnitt).

    python -m film.typsnitt
"""
from fontTools.ttLib import TTFont
from fontTools.varLib import instancer

from .common import FONTS

SKARNINGAR = [
    ("Newsreader-VF.ttf", "Newsreader-Display-Medium.ttf", {"opsz": 72, "wght": 560}),
    ("Newsreader-VF.ttf", "Newsreader-Display-SemiBold.ttf", {"opsz": 72, "wght": 600}),
    ("Newsreader-VF.ttf", "Newsreader-Display-Bold.ttf", {"opsz": 72, "wght": 700}),
    ("Newsreader-Italic-VF.ttf", "Newsreader-Display-MediumItalic.ttf", {"opsz": 72, "wght": 520}),
    ("Geist-VF.ttf", "Geist-Medium.ttf", {"wght": 500}),
    ("Geist-VF.ttf", "Geist-SemiBold.ttf", {"wght": 600}),
    ("Geist-VF.ttf", "Geist-Bold.ttf", {"wght": 700}),
    ("Geist-VF.ttf", "Geist-ExtraBold.ttf", {"wght": 800}),
    ("Geist-VF.ttf", "Geist-Black.ttf", {"wght": 900}),
]


def main() -> None:
    for kalla, mal, axlar in SKARNINGAR:
        instancer.instantiateVariableFont(TTFont(FONTS / kalla), axlar).save(FONTS / mal)
        print("ok", mal)


if __name__ == "__main__":
    main()
