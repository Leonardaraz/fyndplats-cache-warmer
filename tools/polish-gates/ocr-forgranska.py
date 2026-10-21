#!/usr/bin/env python3
# Förgranskar bilder för inbränd text (2026-10-21). Körs före ögonen, aldrig i stället för dem.
#
#   ocr-forgranska.py <bild> [<bild> …]
#   ocr-forgranska.py --tal <bild> [<bild> …]
#
# Skriver en rad per bild: filnamn, status och de ord som hittades.
#   REN      ingen text alls
#   SIFFROR  bara tal och enheter (en måttbild: 86 cm, 45 cm, 240 kg)
#   TEXT     ord, alltså tysk eller engelsk säljtext, ett husmärke eller en etikett. Titta på bilden:
#            text på varan eller rekvisitan får stå kvar (runbooken), säljgrafik och logotyper stryks.
#
# --tal skriver i stället en rad per bild med TALEN i bilden (decimalkomma, stigande ordning). De går till
# kolla-tal-mot-text.js, som jämför dem med sidans text: en måttbild som anger en annan belastning eller ett
# annat mått än sidan stryks (runbooken, N264). Provat på 35 givarbilder 2026-10-21: två sidor sa emot sin text
# (240 kg mot 100 kg per sits, en trappa på 38 × 20 × 2,8 mot 38 × 22 × 12), och tre hade bara fler mått.
#
# Motorn är RapidOCR (ONNX, modellerna ligger i paketet, inget nät behövs efter installationen).
# Den läser latinska bokstäver men tappar umlauter (Größe blir GroBe), vilket inte spelar roll här:
# frågan är om det finns ord, inte vilka. Uppsättning, i en egen katalog utanför repot:
#
#   python3 -m venv ocrenv && ocrenv/bin/pip install rapidocr-onnxruntime
#   ocrenv/bin/python tools/polish-gates/ocr-forgranska.py bild1.jpg bild2.jpg
#
# Provad mot 14 bilder som jag redan bedömt för hand (Nur Kissen, Hinweis, Security Features, en
# etikett med Outsunny, en affisch med tysk text): alla 14 gav samma utfall, och de rena fotona gav REN.
# ☠️ Ett REN är inget bevis: en logotyp utan bokstäver, fel färg och en kollage syns inte här.
import os
import re
import sys

from rapidocr_onnxruntime import RapidOCR

ocr = RapidOCR()
# Tal med enhet: "50 cm", "128,5cm", "240 kg", "2,5 cm", "3 × 4 m".
ENHET = re.compile(
    r"^[\d\s.,×xX*/+\-–°±~:()]*(?:cm|mm|m|kg|g|l|w|v|kw|ah|mah|°|º|%|㎡|m2|m²|qm|st|pcs)?"
    r"[\d\s.,×xX*/+\-–°±~:()]*(?:cm|mm|m|kg|g|l|w|v|kw|ah|mah|%|m2|m²)?\.?$",
    re.I,
)
TAL = re.compile(r"\d+(?:[.,]\d+)?")
TAL_LAGE = "--tal" in sys.argv[1:]
for fil in [a for a in sys.argv[1:] if a != "--tal"]:
    res, _ = ocr(fil)
    if TAL_LAGE:
        tal = set()
        for _box, txt, conf in res or []:
            t = txt.strip()
            if float(conf) >= 0.5 and ENHET.match(t):
                # cm är standard och skrivs utan enhet; kg, l, w, kw, mm skrivs med ("240kg"), så att en belastning
                # inte jämförs mot ett mått.
                enhet = re.search(r"(kg|kw|mm|w|l)\s*\.?$", t, re.I)
                tal.update(x.replace(".", ",") + (enhet.group(1).lower() if enhet else "") for x in TAL.findall(t))
        print(os.path.basename(fil)[:40], " ".join(sorted(tal, key=lambda x: float(TAL.match(x).group(0).replace(",", ".")))))
        continue
    poster = []
    for _box, txt, conf in res or []:
        t = txt.strip()
        if float(conf) < 0.55 or len(t) < 2:
            continue
        poster.append(t)
    ord_ = [t for t in poster if not ENHET.match(t) and len(re.findall(r"[A-Za-zÅÄÖåäöÜüß]", t)) >= 3]
    status = "TEXT" if ord_ else ("SIFFROR" if poster else "REN")
    visa = " / ".join(ord_)[:110] if ord_ else " / ".join(poster)[:60]
    print(os.path.basename(fil)[:40], status, "|", visa)
