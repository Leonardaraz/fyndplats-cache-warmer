# -*- coding: utf-8 -*-
"""Runda 65 — ett spec-kort per produkt (Klart-kriteriet: minst ett eget kort).

☠️ VÄRDENA HÄRLEDS UR spec-tabellen, de skrivs aldrig om. Kortet pekar på en
RAD (index i p["spec"]) och tar det som står efter kolonet. Runda 60 fick en
andra sanning när ett kort skrev "3 min 15 s" där tabellen sa "3 minuter
15 sekunder"; med härledning kan det inte hända.

☠️ RUBRIKEN MÅSTE BÄRAS AV FOTOT under den. Varje titel nedan är vald mot
bild 1 (produkten på vit botten) och beskriver något som syns i den — aldrig
en egenskap man måste läsa sig till.
"""
import os
import sys

from PIL import Image, ImageFilter

HAR = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HAR)
sys.path.insert(0, "/home/user/fyndplats-cache-warmer/scripts")
import cardkit as ck                                              # noqa: E402
from texter import PRODUKTER                                      # noqa: E402

# kort -> (kicker, rubrik buren av foto 1, [(kort etikett, spec-radindex)])
KORT = {
    "db645ff8": ("Golvfåtölj i blått", "Sitter direkt på golvet", [
        ("Mått uppställd", 0), ("Helt utfälld", 1), ("Stoppning", 2),
        ("Ryggens lägen", 3), ("Maxlast", 4), ("Vikt", 7)]),
    "88425b27": ("Böjd träfanér", "Fåtölj och fotpall i samma ram", [
        ("Fåtölj", 0), ("Fotpall", 1), ("Sitthöjd", 3),
        ("Nackkudde", 5), ("Maxlast stol", 6), ("Maxlast fotpall", 7)]),
    "03c9d570": ("Liten fåtölj, 60 cm", "Fyra smala metallben", [
        ("Mått", 0), ("Sits", 1), ("Ryggstöd", 2),
        ("Armstöd", 4), ("Maxlast", 5), ("Vikt", 8)]),
    "bb7b7bd4": ("Loungefåtölj i björkfanér", "Böjd ram utan bakben", [
        ("Mått", 0), ("Sits", 1), ("Ryggstöd", 2),
        ("Armstödshöjd", 3), ("Maxlast", 4), ("Vikt", 7)]),
    "89c89322": ("Armlös snurrfåtölj", "Hela bredden är sittyta", [
        ("Mått", 0), ("Sits", 1), ("Sittdyna", 2),
        ("Ryggstöd", 3), ("Sockel", 4), ("Maxlast", 5)]),
    "3dab61f0": ("Reclinerfåtölj i konstläder", "Fotpallen står på egen fot", [
        ("Fåtölj", 0), ("Fotpall", 3), ("Sits", 1),
        ("Fotplattan", 4), ("Maxlast stol", 5), ("Maxlast fotpall", 6)]),
    "eb400961": ("Fåtölj i konstläder", "Medar i stället för bakben", [
        ("Mått", 0), ("Sits", 1), ("Sittdyna", 2),
        ("Ryggstöd", 3), ("Maxlast", 5), ("Vikt", 8)]),
    "2823c605": ("Reclinerfåtölj med snurrfot", "Bas i böjt trä", [
        ("Mått upprätt", 0), ("Fullt fälld", 1), ("Fotpall", 2),
        ("Fritt bakom", 6), ("Maxlast", 7), ("Vikt", 10)]),
}


def varde(specrad, etikett):
    """Det som står efter kolonet — ordagrant ur spec-tabellen.

    ☠️ ETIKETTEN MÅSTE HÖRA IHOP MED RADEN. Härledningen garanterar att
    VÄRDET är ordagrant, men inte att jag pekat på rätt rad: runda 65:s
    2823c605 fick först ("Vikt", 9) där rad 9 är `Färg: grå`, och kortet
    skrev "Vikt: grå". Värdet var ordagrant och påståendet nonsens.
    Kortets första ord måste därför finnas i radens egen etikett.
    """
    if ": " not in specrad:
        raise ValueError("spec-raden saknar kolon: %r" % specrad)
    radetikett, v = specrad.split(": ", 1)
    forsta = etikett.split()[0].lower()
    if forsta not in radetikett.lower():
        raise ValueError("etiketten %r hör inte till raden %r" % (etikett, specrad))
    return v


# ☠️ Mjuka upp FOTOT, aldrig kortet. 89c89322:s bouclé är högfrekvent brus
#    som JPEG inte kan komprimera: kortet landade på 215 107 byte vid q=85,
#    över husets tak. En hårsmal oskärpa på FOTOT tar bort bruset utan att
#    röra texten eller varans form, och kortet klarar 215 kB vid q=88.
MJUKA = {"89c89322": 0.6}


def kalla(k):
    foto = os.path.join(HAR, "rawbilder", "%s-1.jpg" % k)
    if not os.path.exists(foto):
        raise SystemExit("saknar foto: %s" % foto)
    if k not in MJUKA:
        return foto
    ut = os.path.abspath("%s-1-mjuk.jpg" % k)
    Image.open(foto).filter(ImageFilter.GaussianBlur(MJUKA[k])).save(
        ut, "JPEG", quality=95)
    return ut


def bygg():
    namn, facit = [], {}
    for p in PRODUKTER:
        k = p["kort"]
        kicker, rubrik, rader = KORT[k]
        specrader = [(etikett, varde(p["spec"][i], etikett)) for etikett, i in rader]
        foto = kalla(k)
        ck.card_spec(k + "_spec", foto, kicker, rubrik, specrader, fit=True)
        namn.append(k + "_spec")
        facit[k] = {"kicker": kicker, "rubrik": rubrik,
                    "rader": [{"etikett": e, "varde": v} for e, v in specrader]}
    ck.render(namn)
    # ☠️ Husets tak: under 215 kB vid q >= 85. Sjunk aldrig under 85 —
    #    mjuka upp FOTOT i stället (se MJUKA ovan).
    os.makedirs("jpg", exist_ok=True)
    for n in namn:
        im = Image.open("cards/%s.png" % n).convert("RGB").resize(
            (1600, 1600), Image.LANCZOS)
        for q in (92, 90, 88, 86, 85):
            im.save("jpg/%s.jpg" % n, "JPEG", quality=q, optimize=True,
                    subsampling=0)
            if os.path.getsize("jpg/%s.jpg" % n) <= 215000:
                break
        else:
            raise SystemExit("%s klarar inte 215 kB vid q=85 — mjuka upp fotot" % n)
    return namn, facit


if __name__ == "__main__":
    import json
    import io
    namn, facit = bygg()
    io.open(os.path.join(HAR, "kort-facit.json"), "w", encoding="utf-8").write(
        json.dumps(facit, ensure_ascii=False, indent=1))
    for n in namn:
        print("%-22s %7d byte" % (n, os.path.getsize("jpg/%s.jpg" % n)))
