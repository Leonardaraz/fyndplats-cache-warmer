# -*- coding: utf-8 -*-
"""Runda 136 Steg 4 — kapa de tyska textrutorna ur fyra bilder.

RUNBOKENS METODVAL (docs/seo-polish-runbook.md, tabellen "Vilken metod?"):

  | Text i ett BAND upptill eller nedtill      | Beskär bort bandet |
  | Måttritning med tysk textruta i ett hörn   | Beskär bort rutan  |

Alla fyra är bandfallet. Ingen inpainting, ingen ommålning, ingen rembg —
bandet ligger i sin egen enfärgade remsa och varan rörs aldrig.

☠️ GRÄNSEN ÄR MÄTT, INTE GISSAD. Varje bild skannas rad för rad mot sin EGNA
   bakgrundsfärg (`np.abs(a-bg).max(axis=2) > 14`); innehållssjoken skrivs ut
   och kapet läggs i GAPET mellan ritningen och textrutan. Runbokens egen
   varning gäller: "en bandbeskärning som ska ta bort text skär in i varan".

☠️ EN MÅTTRITNING MÅSTE PADDAS, INTE BESKÄRAS. PDP:n hämtar galleriet med
   `fill/w_N,h_N,al_c` och centrumbeskär till kvadrat — måttetiketterna sitter
   per definition i kanterna och tas först. Efter kapet är bilden liggande, så
   den paddas tillbaka till kvadrat (runbokens `s = max(size) * 1.02`).

⚠️ PADDNINGSFÄRGEN: vit för de tre ritningarna (deras egen botten är vit).
   För kollaget `05136778-4` är grunden en flat gräddfärg som är MÄTT
   IDENTISK i tre orörda hörn — topp-vänster, botten-vänster och topp-höger
   ger alla (252, 245, 235). Runbokens "padda på VITT, inte på en uppmätt
   kantfärg" vaktar mot att mäta det man just tagit bort; här mäts tre kanter
   som INTE rörs, och vit padding hade gett en synlig tvåtonad ram.

☠️ GRINDEN FÖRE UPPLADDNING är `faith_sheet`: original och polerad sida vid
   sida i SAMMA skala. Frågan är "saknas det yta?", inte "följer kanten?".
"""
import os
import sys

import numpy as np
from PIL import Image, ImageDraw

HAR = os.path.dirname(os.path.abspath(__file__))

# (pid, wix-position, kaplinje i originalets pixlar, paddningsfärg, vad som kapas)
KAP = [
    ("ae1c848f", 3, 1500, (255, 255, 255),
     "MODELL-INFO: 'Rasse — American Shorthair / Gewicht — 5 Kg'"),
    ("f8528666", 3, 1510, (255, 255, 255),
     "Produktinformation: 'Rasse — Britisch Kurzhaar / Gewicht — 5 Kg'"),
    ("63a586da", 3, 1508, (255, 255, 255),
     "Produktinformation: 'Rasse — American Shorthair / Gewicht — 5 Kg'"),
    ("05136778", 4, 300, (252, 245, 235),
     "rubriken 'WARUM BRAUCHEN SIE ES?' (kapas UPPTILL)"),
]
# De tre ritningarna kapas NEDTILL, kollaget UPPTILL.
UPPTILL = {"05136778"}

# Bytestak för en uppladdning till Wix Media, se kommentaren i kapa().
TAK_BYTE = 230_000


def sjok(a, bg, tol=14, golv=3):
    """Innehållssjok rad för rad mot bildens egen bakgrund."""
    rad = (np.abs(a - np.asarray(bg)).max(axis=2) > tol).sum(axis=1)
    ut, s = [], None
    for y in range(a.shape[0]):
        if rad[y] > golv and s is None:
            s = y
        if rad[y] <= golv and s is not None:
            if y - s > 8:
                ut.append((s, y - 1))
            s = None
    if s is not None:
        ut.append((s, a.shape[0] - 1))
    return ut


def kapa():
    fel, gjorda = [], []
    for pid, pos, linje, farg, vad in KAP:
        kalla = os.path.join(HAR, "orig", "%s-%d.jpg" % (pid, pos))
        im = Image.open(kalla).convert("RGB")
        a = np.asarray(im).astype(int)
        bg = tuple(int(v) for v in a[2, 2]) if pid in UPPTILL else (255, 255, 255)
        fore = sjok(a, bg)

        if pid in UPPTILL:
            ut = im.crop((0, linje, im.width, im.height))
            kvar = [(s - linje, e - linje) for s, e in fore if e > linje]
            kapat = [(s, e) for s, e in fore if e <= linje]
        else:
            ut = im.crop((0, 0, im.width, linje))
            kvar = [(s, e) for s, e in fore if s < linje]
            kapat = [(s, e) for s, e in fore if s >= linje]

        # ☠️ KAPLINJEN FÅR ALDRIG LIGGA I ETT SJOK. Skär den igenom ett
        #    innehållssjok har den skurit in i ritningen eller i ett foto.
        for s, e in fore:
            if s < linje < e:
                fel.append("%s-%d: kaplinjen %d ligger MITT I sjoket %d-%d"
                           % (pid, pos, linje, s, e))
        if not kapat:
            fel.append("%s-%d: kapet tog INGET sjok — textrutan sitter kvar"
                       % (pid, pos))
        if len(kvar) < 1:
            fel.append("%s-%d: kapet tog ALLT innehåll" % (pid, pos))

        # Padda tillbaka till kvadrat på bildens egen grund.
        s_sida = int(max(ut.size) * 1.02)
        duk = Image.new("RGB", (s_sida, s_sida), farg)
        duk.paste(ut, ((s_sida - ut.width) // 2, (s_sida - ut.height) // 2))
        # ☠️ 1600², INTE 2040². `UploadImageToWixSite` svarar `success: true`
        #    med `operationStatus: "PENDING"` och kan sedan hamna i FAILED — och
        #    ett fileId i FAILED utelämnas TYST ur media-PATCHen, så galleriet
        #    går från fem bilder till fyra utan ett enda fel. Husets mätning:
        #    1600² på ~200 kB går igenom där 2000² på 380 kB föll.
        # ⚠️ RITNINGEN ÄR FORTFARANDE KVADRATISK. PDP:n centrumbeskär till
        #    kvadrat och måttetiketterna sitter i kanterna; en NEDSKALNING
        #    bevarar dem, en beskärning hade tagit dem först.
        duk = duk.resize((1600, 1600), Image.LANCZOS)
        mal = os.path.join(HAR, "fix", "%s-%d.jpg" % (pid, pos))
        os.makedirs(os.path.dirname(mal), exist_ok=True)
        # ⚠️ OCH TAKET ÄR EN BYTESTORLEK, INTE BARA EN UPPLÖSNING. Husets
        #    mätning gäller "1600² på ~200 kB"; kollaget är fyra foton på en
        #    flat botten och landade på 316 kB vid q=85, alltså i ett ospröv-
        #    at mellanläge. Kvaliteten sänks tills filen ryms under taket.
        for q in (85, 80, 76, 72, 68):
            duk.save(mal, quality=q, optimize=True)
            if os.path.getsize(mal) <= TAK_BYTE:
                break
        if os.path.getsize(mal) > TAK_BYTE:
            fel.append("%s-%d: %d byte även vid lägsta kvalitet"
                       % (pid, pos, os.path.getsize(mal)))

        # Kvadratgrinden: PDP:ns centrumbeskärning får inte kapa innehåll.
        b = np.asarray(duk).astype(int)
        innehall = (np.abs(b - np.asarray(farg)).max(axis=2) > 14)
        sida = min(duk.size)
        vx, vy = (duk.width - sida) // 2, (duk.height - sida) // 2
        if innehall[vy:vy + sida, vx:vx + sida].sum() != innehall.sum():
            fel.append("%s-%d: kvadratbeskärningen kapar innehåll" % (pid, pos))

        gjorda.append((pid, pos, im.size, ut.size, duk.size, fore, kapat, vad))
    return gjorda, fel


def faith_sheet(gjorda):
    """Original och polerad SIDA VID SIDA I SAMMA SKALA — runbokens grind."""
    H = 520
    paneler = []
    for pid, pos, _, _, _, _, _, _ in gjorda:
        f = Image.open(os.path.join(HAR, "orig", "%s-%d.jpg" % (pid, pos)))
        e = Image.open(os.path.join(HAR, "fix", "%s-%d.jpg" % (pid, pos)))
        # SAMMA SKALA: båda skalas med originalets faktor, inte var för sig.
        k = H / f.height
        paneler.append(("%s-%d fore" % (pid, pos),
                        f.resize((int(f.width * k), int(f.height * k)))))
        paneler.append(("%s-%d efter" % (pid, pos),
                        e.resize((int(e.width * k), int(e.height * k)))))
    KOL = 4
    bredd = max(p.width for _, p in paneler) + 10
    rader = (len(paneler) + KOL - 1) // KOL
    ark = Image.new("RGB", (KOL * bredd, rader * (H + 24)), "white")
    d = ImageDraw.Draw(ark)
    for i, (namn, p) in enumerate(paneler):
        r, c = divmod(i, KOL)
        x, y = c * bredd, r * (H + 24)
        ark.paste(p, (x + 5, y))
        d.text((x + 5, y + H + 6), namn, fill="black")
    mal = os.path.join(HAR, "faith-steg4.jpg")
    ark.save(mal, quality=90)
    return mal


if __name__ == "__main__":
    gjorda, fel = kapa()
    for pid, pos, f, u, d, fore, kapat, vad in gjorda:
        print("%s-%d  %s -> kap %s -> kvadrat %s" % (pid, pos, f, u, d))
        print("     sjok fore: %s" % (fore,))
        print("     kapade sjok: %s  (%s)" % (kapat, vad))
    for x in fel:
        print("☠️", x)
    print("faith:", os.path.basename(faith_sheet(gjorda)))
    print("%d bilder, %d fel" % (len(gjorda), len(fel)))
    sys.exit(1 if fel else 0)
