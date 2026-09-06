# -*- coding: utf-8 -*-
"""Runda 84 — Fyndplats eget faktakort, ett per sensorsoptunna.

⚠️ RADERNA SLÅS UPP PÅ ETIKETT, aldrig på position. Rundans spec-listor är
   olika långa och olika uppbyggda: `7846d05f` mäts `B × D × H` där de andra
   mäts `L × B × H`, tre tunnor har `Form` och fyra har ingen, två har
   `Lockets öppning` och `Montering: krävs` där resten säger `krävs inte`.
   Ett fast index hade pekat på fel rad på nästan varje kort.

☠️ `aabcd677` HAR INGEN BATTERIRAD ATT SLÅ UPP — leverantören anger ingen
   storlek för just den tunnan, och Steg 5 valde att inte gissa. Kortet
   byggs ur `p["spec"]`, så en uppgift som inte finns i specen kan inte smyga
   in via kortet. Det är hela poängen med att bygga kortet ur samma lista
   linten granskar.

☠️ AVSAKNADEN FÅR INTE BLI KORTETS RUBRIK — husets regel sedan runda 82.
   `aabcd677`:s kort bär innerhinken, som är det tunnan ÄR; att batteristorleken
   saknas står som sidans vanliga fråga, där den som undrar faktiskt letar.

☠️ RUBRIKERNA ÄR VALDA MOT FOTOT, INTE MOT TEXTEN. Ett första utkast bar
   "Rundans minsta", "Rundans största" och "Samma golvyta som 48-litaren" —
   och alla tre är fel av samma skäl som lint-grind 5c beskriver: kortet
   ligger ensamt i galleriet, så "rundan" och "48-litaren" är ord utan
   referent för den som tittar. De två som kvarstår beskriver något som
   faktiskt SYNS i bilden ovanför: den låga proportionen, den runda formen,
   den smala stommen, det uppfällda locket, den borstade ytan.

⚠️ VOLYMEN LIGGER FÖRST PÅ VARJE KORT, med flit. Familjen är sju tunnor som
   skiljer sig på i praktiken en enda axel, och det är den axeln kunden
   jämför på — Steg 1 valde ut de sju just för att volymerna är lediga.
"""
import json
import os
import sys

HAR = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, os.path.dirname(HAR))
sys.path.insert(0, HAR)

from kortbygge import bygg                                            # noqa: E402
from texter import PRODUKTER                                          # noqa: E402

KORTPLAN = {
    "466e799a": ("Soptunna med sensor, 20 liter", "Låg och kompakt — 42,5 cm hög",
                 ["Volym", "Mått", "Innerhinkens mått", "Sensoravstånd",
                  "Batterier", "Vikt"]),
    "7846d05f": ("Soptunna med sensor, 42 liter", "Rund form som tar hörnet",
                 ["Volym", "Mått", "Form", "Öppningstid", "Batterier",
                  "Påshållare"]),
    # ☠️ Ingen `Batterier`-rad att slå upp — leverantören anger ingen storlek.
    "aabcd677": ("Soptunna med sensor, 45 liter", "Smal och hög — 38 cm bred",
                 ["Volym", "Mått", "Höjd med locket uppfällt",
                  "Innerhinkens mått", "Vikt", "Montering"]),
    "0cc5c634": ("Soptunna med sensor, 48 liter", "Låg oval — 48 liter på 57 cm",
                 ["Volym", "Mått", "Form", "Innerhink", "Batterier", "Vikt"]),
    "4ef74d40": ("Soptunna med sensor, 55 liter", "Fjärilslock som öppnas från mitten",
                 ["Volym", "Mått", "Locktyp", "Batterier", "Vikt", "Montering"]),
    "dcd756bd": ("Soptunna med sensor, 58 liter", "Oval form, lock som lyfts av",
                 ["Volym", "Mått", "Form", "Innerhink", "Batterier", "Vikt"]),
    "96beca79": ("Soptunna med sensor, 60 liter", "Borstat stål, 66 cm högt",
                 ["Volym", "Mått", "Lockets öppning", "Luktfilter", "Batterier",
                  "Montering"]),
}


def index_for(spec, etikett):
    """Radens plats i spec-listan, uppslagen på etikett — aldrig gissad."""
    for i, rad in enumerate(spec):
        if rad.split(":")[0].split("(")[0].strip() == etikett:
            return i
    raise SystemExit("saknar spec-raden %r i %s" % (etikett, spec))


KORT = {}
for _p in PRODUKTER:
    _k = _p["kort"]
    _rub, _und, _etiketter = KORTPLAN[_k]
    KORT[_k] = (_rub, _und,
                [(e, index_for(_p["spec"], e)) for e in _etiketter])

# ☠️ FOTOT MJUKAS UPP, ALDRIG KORTET — husets regel sedan runda 63. Fylls i
#    först när ett kort faktiskt spränger 215 kB-taket, inte i förväg.
MJUKA = {}

if __name__ == "__main__":
    namn, facit = bygg(HAR, PRODUKTER, KORT, MJUKA)
    with open(os.path.join(HAR, "kort-facit.json"), "w", encoding="utf-8") as f:
        json.dump(facit, f, ensure_ascii=False, indent=1)
    for n in namn:
        print("%-26s %7d byte" % (n, os.path.getsize(os.path.join(HAR, "jpg/%s.jpg" % n))))
