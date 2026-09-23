# -*- coding: utf-8 -*-
"""Runda 140 Steg 9 — kapa den tyska textrutan ur `2ba6baf0` bild 3.

RUNBOKENS METODVAL (docs/seo-polish-runbook.md, tabellen "Vilken metod?"):
måttritning med tysk textruta NEDTILL → beskär bort bandet. Ingen inpainting,
ingen ommålning. Varan rörs aldrig — det som kapas är en grafik BREDVID den.

Vad som står i pixlarna (Steg 4, `STEG4.md`):
    "HINWEIS: Bitte messen Sie die Körperlänge Ihres Haustieres vor dem Kauf.
     Körperlänge < 50cm"  +  "Geeignet für Hunde bis zu 20 kg"
Övre halvan ÄR produktens enda måttritning (82 × 54 × 36, sits 72 × 50 × 16,
ben 10 cm) — kastas hela bilden tappar sidan sitt måttunderlag.

☠️ GRÄNSEN ÄR MÄTT, INTE GISSAD. En radskanning mot bildens egen vita botten
   ger fyra vita band; det enda som ligger mellan ritningen och textrutan är
   **1150–1243**. Kaplinjen läggs mitt i det, på 1197. Grinden nedan fäller
   om linjen skär genom ett innehållssjok.

☠️ EN MÅTTRITNING MÅSTE PADDAS, INTE BESKÄRAS (#354). PDP:n hämtar galleriet
   med `fill/w_N,h_N,al_c` och centrumbeskär till kvadrat — måttetiketterna
   sitter per definition i kanterna och tas först. Efter kapet är bilden
   liggande, så den paddas tillbaka till kvadrat på VITT (ritningens egen
   botten är vit, mätt i tre orörda hörn).

☠️ 1600², INTE 2000². `UploadImageToWixSite` svarar `success: true` med
   `operationStatus: "PENDING"` och kan sedan hamna i FAILED — och ett fileId
   i FAILED utelämnas TYST ur media-PATCHen, så galleriet går från fem bilder
   till fyra utan ett enda fel. Husets mätning: 1600² på ~200 kB går igenom
   där 2000² på 380 kB föll.
"""
import os
import sys

import numpy as np
from PIL import Image, ImageDraw

HAR = os.path.dirname(os.path.abspath(__file__))

# (pid, wix-position, kaplinje i originalets pixlar, paddningsfärg, vad som kapas)
KAP = [
    ("2ba6baf0", 3, 1197, (255, 255, 255),
     "HINWEIS-rutan + hundsiluetten + 'Geeignet fur Hunde bis zu 20 kg'"),
]
UPPTILL = set()          # alla kapas NEDTILL i den här rundan

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
        #    innehållssjok har den skurit in i ritningen.
        for s, e in fore:
            if s < linje < e:
                fel.append("%s-%d: kaplinjen %d ligger MITT I sjoket %d-%d"
                           % (pid, pos, linje, s, e))
        if not kapat:
            fel.append("%s-%d: kapet tog INGET sjok — textrutan sitter kvar"
                       % (pid, pos))
        if len(kvar) < 1:
            fel.append("%s-%d: kapet tog ALLT innehåll" % (pid, pos))

        s_sida = int(max(ut.size) * 1.02)
        duk = Image.new("RGB", (s_sida, s_sida), farg)
        duk.paste(ut, ((s_sida - ut.width) // 2, (s_sida - ut.height) // 2))
        duk = duk.resize((1600, 1600), Image.LANCZOS)

        mal = os.path.join(HAR, "fix", "%s-%d.jpg" % (pid, pos))
        os.makedirs(os.path.dirname(mal), exist_ok=True)
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

        gjorda.append((pid, pos, im.size, ut.size, duk.size, fore, kapat, vad,
                       os.path.getsize(mal)))
    return gjorda, fel


def faith_sheet(gjorda):
    """Original och polerad SIDA VID SIDA I SAMMA SKALA — runbokens grind."""
    H = 620
    paneler = []
    for pid, pos in [(g[0], g[1]) for g in gjorda]:
        f = Image.open(os.path.join(HAR, "orig", "%s-%d.jpg" % (pid, pos)))
        e = Image.open(os.path.join(HAR, "fix", "%s-%d.jpg" % (pid, pos)))
        k = H / f.height
        paneler.append(("%s-%d fore" % (pid, pos),
                        f.resize((int(f.width * k), int(f.height * k)))))
        paneler.append(("%s-%d efter" % (pid, pos),
                        e.resize((int(e.width * k), int(e.height * k)))))
    KOL = 2
    bredd = max(p.width for _, p in paneler) + 10
    rader = (len(paneler) + KOL - 1) // KOL
    ark = Image.new("RGB", (KOL * bredd, rader * (H + 24)), "white")
    d = ImageDraw.Draw(ark)
    for i, (namn, p) in enumerate(paneler):
        r, c = divmod(i, KOL)
        x, y = c * bredd, r * (H + 24)
        ark.paste(p, (x + 5, y))
        d.text((x + 5, y + H + 6), namn, fill="black")
    mal = os.path.join(HAR, "faith-steg9.jpg")
    ark.save(mal, quality=90)
    return mal


if __name__ == "__main__":
    gjorda, fel = kapa()
    for pid, pos, f, u, dd, fore, kapat, vad, byte in gjorda:
        print("%s-%d  %s -> kap %s -> kvadrat %s  (%d kB)"
              % (pid, pos, f, u, dd, byte // 1024))
        print("     sjok fore:   %s" % (fore,))
        print("     kapade sjok: %s" % (kapat,))
        print("     vad:         %s" % vad)
    for x in fel:
        print("☠️", x)
    print("faith:", os.path.basename(faith_sheet(gjorda)))
    print("%d bilder, %d fel" % (len(gjorda), len(fel)))
    sys.exit(1 if fel else 0)
