"""Varorna som riktiga 3D-modeller, byggda i kod med produktsidans matt.

Varje modul har SLUG och bygg(coll) -> tomt rotobjekt vid golvets mitt, framsidan mot -Y, i meter.

    from film import modeller
    rot = modeller.bygg("loungefatolj-bjorkfaner-vippande", coll)
"""
from __future__ import annotations

from importlib import import_module

MODULER = {
    "loungefatolj-bjorkfaner-vippande": "fatolj",
    "satsbord-2-st-guld-glasskiva": "satsbord",
    "led-golvlampa-134-cm-massing": "golvlampa",
    "tradgardsbank-i-akacia-112-cm": "bank",
    "sidobord-i-stenlook": "sidobord",
}


def modul(slug: str):
    return import_module(f".{MODULER[slug]}", __name__)


def bygg(slug: str, coll=None):
    return modul(slug).bygg(coll)
