# -*- coding: utf-8 -*-
"""Spec-kortsbygget — delat av alla rundor, aldrig kopierat.

Klart-kriteriet: varje polerad produkt ska ha MINST ett eget kort (Leonards
regel 2026-08-26). Kortet är det enda i galleriet som är VÅRT; utan det är
produktsidan en vidarebefordran av leverantörens marknadsföring. Kravet är
ovillkorligt — det gäller även när leverantörens bilder är rena.

Tre regler koden GARANTERAR, så de inte kan glömmas bort:

☠️ 1. VÄRDET HÄRLEDS ur spec-tabellen, det skrivs aldrig om. Kortet pekar på
      en rad och tar det som står efter kolonet. Runda 60 fick en andra
      sanning när ett kort skrev "3 min 15 s" mot tabellens "3 minuter
      15 sekunder".

☠️ 2. ETIKETTEN MÅSTE HÖRA IHOP MED RADEN. Härledningen ensam räcker inte:
      runda 65:s 2823c605 fick först ("Vikt", 9) där rad 9 är `Färg: grå`,
      och kortet skrev "Vikt: grå" — värdet ordagrant, påståendet nonsens.
      Kortets första ord måste finnas i radens egen etikett.

☠️ 3. TAKET ÄR 215 kB VID q >= 85. Klarar kortet inte det ska FOTOT mjukas
      upp, aldrig kortet — högfrekvent tygtextur är det som inte komprimeras.
      Bygget kastar hellre än sänker kvaliteten under 85.

⚠️ Det koden INTE kan garantera: att RUBRIKEN bärs av fotot under den. Den
   måste väljas mot bild 1 med ögon, och kontrolleras på kontaktarket efteråt.
"""
import os
import sys

from PIL import Image, ImageFilter

sys.path.insert(0, "/home/user/fyndplats-cache-warmer/scripts")
import cardkit as ck                                              # noqa: E402

TAK_BYTE = 215000
KVALITETER = (92, 90, 88, 86, 85)


def varde(specrad, etikett):
    """Det som står efter kolonet — ordagrant, och från RÄTT rad."""
    if ": " not in specrad:
        raise ValueError("spec-raden saknar kolon: %r" % specrad)
    radetikett, v = specrad.split(": ", 1)
    forsta = etikett.split()[0].lower()
    if forsta not in radetikett.lower():
        raise ValueError("etiketten %r hör inte till raden %r" % (etikett, specrad))
    return v


def kalla(har, kort, mjuka):
    """Hjältebilden, mjukad om kortet annars spränger takgränsen.

    ⚠️ Skiljetecknet mellan id och nummer är INTE samma i alla rundor:
       runda 62, 64 och 65 skriver `<id>-1.jpg`, runda 63 `<id>_1.jpg`.
       En hårdkodad separator hade fällt bygget på en runda där allt annat
       stämde — och felmeddelandet hade pekat på en saknad bild.
    """
    for sep in ("-", "_"):
        foto = os.path.join(har, "rawbilder", "%s%s1.jpg" % (kort, sep))
        if os.path.exists(foto):
            break
    else:
        raise SystemExit("saknar foto: %s/rawbilder/%s{-,_}1.jpg" % (har, kort))
    if kort not in mjuka:
        return foto
    ut = os.path.abspath("%s-1-mjuk.jpg" % kort)
    Image.open(foto).filter(ImageFilter.GaussianBlur(mjuka[kort])).save(
        ut, "JPEG", quality=95)
    return ut


def bygg(har, produkter, kortdata, mjuka=None):
    """produkter: [{kort, spec}]  kortdata: kort -> (kicker, rubrik, [(etikett, radindex)])"""
    mjuka = mjuka or {}
    namn, facit = [], {}
    for p in produkter:
        k = p["kort"]
        kicker, rubrik, rader = kortdata[k]
        specrader = [(e, varde(p["spec"][i], e)) for e, i in rader]
        ck.card_spec(k + "_spec", kalla(har, k, mjuka), kicker, rubrik,
                     specrader, fit=True)
        namn.append(k + "_spec")
        facit[k] = {"kicker": kicker, "rubrik": rubrik,
                    "rader": [{"etikett": e, "varde": v} for e, v in specrader]}
    ck.render(namn)

    os.makedirs("jpg", exist_ok=True)
    # ⚠️ ALLA kort mäts innan något kastas. Att dö på det första kostar ett
    #    varv per kort, och en runda vävda korgar spränger taket på flera —
    #    runda 63 hade behövt fyra byggen för att få veta fyra tal.
    forstora = []
    for n in namn:
        im = Image.open("cards/%s.png" % n).convert("RGB").resize(
            (1600, 1600), Image.LANCZOS)
        for q in KVALITETER:
            im.save("jpg/%s.jpg" % n, "JPEG", quality=q, optimize=True,
                    subsampling=0)
            if os.path.getsize("jpg/%s.jpg" % n) <= TAK_BYTE:
                break
        else:
            forstora.append((n, os.path.getsize("jpg/%s.jpg" % n)))
    if forstora:
        raise SystemExit("MJUKA UPP FOTOT på %d kort (aldrig kortet):\n" % len(forstora)
                         + "\n".join("  %-20s %7d byte vid q=85, %+d över taket"
                                     % (n, b, b - TAK_BYTE) for n, b in forstora))
    return namn, facit
