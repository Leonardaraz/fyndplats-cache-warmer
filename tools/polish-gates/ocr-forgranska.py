#!/usr/bin/env python3
# Förgranskar bilder för inbränd text (2026-10-21). Körs före ögonen, aldrig i stället för dem.
#
#   ocr-forgranska.py <bild> [<bild> …]
#
# Skriver en rad per bild: filnamn, status och de ord som hittades.
#   REN      ingen text alls
#   SIFFROR  bara tal och enheter (en måttbild: 86 cm, 45 cm, 240 kg)
#   TEXT     ord, alltså tysk eller engelsk säljtext, ett husmärke eller en etikett. Titta på bilden:
#            text på varan eller rekvisitan får stå kvar (runbooken), säljgrafik och logotyper stryks.
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
for fil in sys.argv[1:]:
    res, _ = ocr(fil)
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
