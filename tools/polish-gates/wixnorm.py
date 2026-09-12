# -*- coding: utf-8 -*-
"""Wix normaliserar HTML:en vid sparandet. Fem atgarder, uppmatta mot skarpa
V3 genom att jamfora skickad kalla med lagrad plainDescription:

  1. radbrytningar mellan block strippas     >\\n<  ->  ><
  2. <strong> blir en span med font-weight   (+21 per par)
  3. <a href> far target="_self"             (+15 per lank)
  4. varje <li> far sitt innehall inslaget i <p>   (+7 per <li>)
  5. filens AVSLUTANDE radbrytning strippas        (-1, uppmatt 2026-09-12)

Punkt 4 saknades i runbookens langdformel och ar hela avvikelsen: aatta
produkter foll pa den, och en formel som ar fel ar samre an ingen formel —
den lar en att avfarda ett verkligt larm som brus.

Punkt 5 ar samma lardom en gang till, en byte stor. Regel 1 kraver ett `<`
efter radbrytningen, sa filens sista `\n` — som inte har nagot efter sig —
overlevde normaliseringen men inte Wix. Varje kvitto lag darfor exakt EN
byte fel, i varje runda vars fil slutar med radbrytning, alltsa alla.
Uppmatt i runda L3 pa 8802b999 (3038 mot lagrade 3037) och 45fd6bc6 (3124
mot 3123); med radbrytningen bortstrippad stammer bada checksummorna exakt.

⚠️ En avvikelse pa en byte ser ut som en struntsak och ar just darfor farlig:
den ar omojlig att skilja fran ett aakta transkriberingsfel pa ett tecken,
och den som sett den nog manga ganger slutar titta efter vilket det var.
"""
import re

def normalisera(h):
    h = re.sub(r">\s*\n\s*<", "><", h)
    h = h.replace("<strong>", '<span style="font-weight: 700">').replace("</strong>", "</span>")
    h = re.sub(r'(<a href="[^"]+")>', r'\1 target="_self">', h)
    h = re.sub(r"<li>(?!<p>)(.*?)</li>", r"<li><p>\1</p></li>", h, flags=re.S)
    return h.rstrip("\n")
