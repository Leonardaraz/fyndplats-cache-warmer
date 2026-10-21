#!/usr/bin/env python3
# ocr-boxar.py <lista.json>   lista = [[sida8, val8, pos, fil], …]
# Skriver textrutornas ytterkanter (x0 y0 x1 y1, i bildens egna pixlar) per bild, så att ett utsnitt kan väljas som lämnar texten
# utanför men rymmer varan. Körs med OCR-miljön (OCR_PYTHON) mot cachen i $FARG_SKRATCH/wxc. Underkanten av en etikett ligger ofta
# vid 1 850–1 950 av 2 000, och ett utsnitt ska sluta minst 20 pixlar före textens överkant.
import json, os, sys
from rapidocr_onnxruntime import RapidOCR
SP = os.environ.get("FARG_SKRATCH", "/tmp/fargbilder")
ocr = RapidOCR()
for s, v, p, fil in json.load(open(sys.argv[1])):
    res, _ = ocr(os.path.join(SP, "wxc", fil.replace("~", "_")))
    print(s, v, p, fil[7:17])
    for box, txt, conf in (res or []):
        xs = [pt[0] for pt in box]; ys = [pt[1] for pt in box]
        print("   ", int(min(xs)), int(min(ys)), int(max(xs)), int(max(ys)), round(float(conf), 2), txt[:50])
