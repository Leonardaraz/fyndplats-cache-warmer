# -*- coding: utf-8 -*-
"""Wix normaliserar HTML:en vid sparandet. Fyra atgarder, uppmatta 2026-09-03
mot skarpa V3 genom att jamfora skickad kalla med lagrad plainDescription:

  1. radbrytningar mellan block strippas     >\\n<  ->  ><
  2. <strong> blir en span med font-weight   (+21 per par)
  3. <a href> far target="_self"             (+15 per lank)
  4. varje <li> far sitt innehall inslaget i <p>   (+7 per <li>)

Punkt 4 saknades i runbookens langdformel och ar hela avvikelsen: aatta
produkter foll pa den, och en formel som ar fel ar samre an ingen formel —
den lar en att avfarda ett verkligt larm som brus.
"""
import re

def normalisera(h):
    h = re.sub(r">\s*\n\s*<", "><", h)
    h = h.replace("<strong>", '<span style="font-weight: 700">').replace("</strong>", "</span>")
    h = re.sub(r'(<a href="[^"]+")>', r'\1 target="_self">', h)
    h = re.sub(r"<li>(?!<p>)(.*?)</li>", r"<li><p>\1</p></li>", h, flags=re.S)
    return h
