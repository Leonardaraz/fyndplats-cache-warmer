#!/usr/bin/env python3
# ocr-yta.py <bild> ...  -> en rad per bild: filnamn<TAB>status<TAB>antal ord<TAB>textyta %<TAB>högsta teckenhöjd %<TAB>ord
# status: REN (ingen text), SIFFROR (bara tal och enheter), TEXT (ord). Samma regler som ocr-forgranska.py, plus textytan.
# Textytan (ordens rutor i procent av bilden) skiljer säljgrafik från en miljöbild med text på rekvisitan: kalibrerat på 288 kandidater
# (omgång 1, 2026-10-21) fångar gränsen 2,5 % 113 av 152 strukna TEXT-bilder och tappar 2 av 40 godkända (båda med ordet SCOOTER på varan).
# Körs med OCR-miljön (python3 -m venv ocrenv && ocrenv/bin/pip install rapidocr-onnxruntime), se ocr-forgranska.py.
import os, re, sys
from rapidocr_onnxruntime import RapidOCR
from PIL import Image
ocr = RapidOCR()
ENHET = re.compile(r"^[\d\s.,×xX*/+\-–°±~:()]*(?:cm|mm|m|kg|g|l|w|v|kw|ah|mah|°|º|%|㎡|m2|m²|qm|st|pcs)?[\d\s.,×xX*/+\-–°±~:()]*(?:cm|mm|m|kg|g|l|w|v|kw|ah|mah|%|m2|m²)?\.?$", re.I)
for fil in sys.argv[1:]:
    W, H = Image.open(fil).size
    res, _ = ocr(fil)
    area = 0.0; maxh = 0.0; ord_ = []; poster = []
    for box, txt, conf in res or []:
        t = txt.strip()
        if float(conf) < 0.55 or len(t) < 2: continue
        poster.append(t)
        if ENHET.match(t) or len(re.findall(r"[A-Za-zÅÄÖåäöÜüß]", t)) < 3: continue
        xs = [p[0] for p in box]; ys = [p[1] for p in box]
        w = max(xs) - min(xs); h = max(ys) - min(ys)
        area += w * h; maxh = max(maxh, h); ord_.append(t)
    status = "TEXT" if ord_ else ("SIFFROR" if poster else "REN")
    visa = " / ".join(ord_)[:200] if ord_ else " / ".join(poster)[:80]
    print("\t".join([os.path.basename(fil)[:40], status, str(len(ord_)), "%.2f" % (100 * area / (W * H)), "%.1f" % (100 * maxh / H), visa]))
