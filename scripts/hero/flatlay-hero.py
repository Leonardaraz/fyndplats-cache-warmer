#!/usr/bin/env python3
"""Vit hjältebild för hudvårdssetet, byggd ur FLATLAY-bilden (h0).

Varför inte bild 2 (h1), som första hjälten byggdes på: leverantörens egen h1-fil
har en förstörd etikett på rengöringstuben — finstilta raderna är utsmetade och
"100g/" saknas helt ("(/3.53oz."). Leonard såg det direkt. Skadan finns i källan,
inte i vår maskning, och kan inte lagas utan att rita på produkten.

Flatlayen visar samma fem produkter med ALLA etiketter hela och skarpa
(50g/0.71oz, 160ml/5.41fl.oz, 30ml, 50g/1.76oz, 100g/3.53oz). Den är däremot
full-bleed mot två pappersark, så bakgrunden måste bort per produkt.

Metod: rembg körs på EN produkt i taget. Modellen är byggd för ett dominant
motiv — på hela flatlayen gav den mos (behöll rosa papper, tonade bort tre
produkter), på en enskild produkt mot slätt papper är den utmärkt.

Slagskuggan på pappret följer med i rembg:s utdata, men **med låg alpha** — varan
ligger på 246–254, skuggan på 113–216. Alpha är alltså separatorn, inte
luminansen: ett luminanströskel-försök åt både flaskans mörka bottenband och
skulle ha ätit den mörkgröna tuben helt. Vi tar därför en KÄRNA på hög alpha,
vidgar den två pixlar och behåller originalets mjuka kanter innanför den.
"""
from pathlib import Path

import numpy as np
from PIL import Image
from scipy import ndimage

HAR = Path(__file__).resolve().parent
SIDA = 1600
FYLLNAD = 0.86          # gruppens största utsträckning som andel av rutan
KARNA_ALPHA = 225       # varan ligger 246–254, papperskuggan 113–216

# Generösa lådor runt varje produkt, mätta i h0:s 1600-rymd. De får gärna ta med
# lite skugga och rekvisita — rembg + största-komponent städar bort det.
LADOR = {
    "avokado": (130, 750, 570, 1430),
    "toner":   (240, 430, 675, 1165),
    "serum":   (565, 225, 875, 725),
    "burk":    (735, 615, 1165, 1085),
    "yuzu":    (855, 205, 1515, 1035),
}


def friställ(crop):
    from rembg import remove
    a = np.asarray(remove(crop.convert("RGBA"))).astype(int)
    alpha = a[:, :, 3]

    # 1) största sammanhängande objektet — rekvisita (blad, bär, fruktskivor)
    #    som råkat hamna i lådan faller bort här.
    lab, _ = ndimage.label(alpha > 20)
    sz = np.bincount(lab.ravel()); sz[0] = 0
    alpha = np.where(lab == sz.argmax(), alpha, 0)

    # 2) kärna på hög alpha = varan utan papperskuggan
    karna = alpha > KARNA_ALPHA
    lab, _ = ndimage.label(ndimage.binary_closing(karna, iterations=10))
    sz = np.bincount(lab.ravel()); sz[0] = 0
    karna = ndimage.binary_fill_holes(lab == sz.argmax())

    # 3) Kanten byggs om i stället för att ärvas. Originalets yttersta pixlar är
    #    HALVT PAPPER — behåller man dem mot vitt syns en rosa/grön brätte längs
    #    varje vara. Vi krymper därför en pixel in i varan och gör en egen mjuk
    #    kant med gaussisk utsuddning, så ingen pappersfärgad pixel överlever.
    inre = ndimage.binary_erosion(karna, iterations=1)
    kant = np.clip(ndimage.gaussian_filter(inre.astype(float), 0.8) * 1.15, 0, 1)
    ut = a.copy()
    ut[:, :, 3] = (kant * 255).round()
    return Image.fromarray(ut.astype(np.uint8), "RGBA"), int(karna.sum()), int((alpha > 20).sum())


def bygg(kalla, ut_fil):
    im = Image.open(kalla).convert("RGB")
    delar, matt = {}, {}
    for namn, box in LADOR.items():
        bit, karna, rabild = friställ(im.crop(box))
        delar[namn] = (bit, box)
        matt[namn] = {"karna": karna, "rembg": rabild, "skugga_bort": rabild - karna}

    # Behåll flatlayens inbördes placering — den är leverantörens komposition och
    # varje produkts vinkel och ljus hör ihop med den. Vi flyttar inget, vi tar
    # bara bort pappret och drar ihop rutan runt gruppen.
    duk = Image.new("RGBA", im.size, (255, 255, 255, 0))
    for bit, box in delar.values():
        duk.alpha_composite(bit, (box[0], box[1]))

    p = duk.crop(duk.getbbox())
    skala = (SIDA * FYLLNAD) / max(p.width, p.height)
    p = p.resize((round(p.width * skala), round(p.height * skala)), Image.LANCZOS)

    vit = Image.new("RGBA", (SIDA, SIDA), (255, 255, 255, 255))
    vit.alpha_composite(p, ((SIDA - p.width) // 2, (SIDA - p.height) // 2))
    vit.convert("RGB").save(ut_fil, quality=96)

    b = np.asarray(Image.open(ut_fil).convert("RGB")).astype(int)
    ys, xs = np.nonzero(b.sum(axis=2) < 735)
    matt["_ruta"] = {"fyllnad_bredd": round((xs.max() - xs.min()) / SIDA, 3),
                     "fyllnad_hojd": round((ys.max() - ys.min()) / SIDA, 3)}
    return matt


if __name__ == "__main__":
    for k, v in bygg(HAR / "h0.img", HAR / "hud_hero2.jpg").items():
        print(k, v)
