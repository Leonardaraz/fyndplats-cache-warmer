# -*- coding: utf-8 -*-
"""Wix normaliserar HTML:en vid sparandet. Sex atgarder, uppmatta mot skarpa
V3 genom att jamfora skickad kalla med lagrad plainDescription:

  1. radbrytningar mellan block strippas     >\\n<  ->  ><
  2. <strong> blir en span med font-weight   (+21 per par)
  3. <a href> far target="_self"             (+15 per lank)
  4. varje <li> far sitt innehall inslaget i <p>   (+7 per <li>)
  5. filens AVSLUTANDE radbrytning strippas        (-1, uppmatt 2026-09-12)
  6. <span class=X>TEXT</span> med okand class strips till TEXT  (-21 per span,
     uppmatt 2026-09-18)

Punkt 4 saknades i runbookens langdformel och ar hela avvikelsen: aatta
produkter foll pa den, och en formel som ar fel ar samre an ingen formel —
den lar en att avfarda ett verkligt larm som brus.

Punkt 5 ar samma lardom en gang till, en byte stor. Regel 1 kraver ett `<`
efter radbrytningen, sa filens sista `\n` — som inte har nagot efter sig —
overlevde normaliseringen men inte Wix. Varje kvitto lag darfor exakt EN
byte fel, i varje runda vars fil slutar med radbrytning, alltsa alla.
Uppmatt i runda L3 pa 8802b999 (3038 mot lagrade 3037) och 45fd6bc6 (3124
mot 3123); med radbrytningen bortstrippad stammer bada checksummorna exakt.

Punkt 6 ar SAMMA KLASS SOM `fontagen-weight` (Wix stryper okand markup tyst
i stallet for att avvisa den) men i en ny skepnad: `<span class=u>` hor
hemma i kort.tsv:s spec-varden — det ar `cardkit.py`:s lokala CSS for
FAKTAKORTET, och betyder ingenting pa den levande sajten. Nio av tio N14-
produkter fick markeringen kopierad in i sjalva `plainDescription` av
misstag, och Wix svarade 200 och strop span-omslaget tyst och behol bara
textinnehallet — exakt matt mot skarpa V3 pa 2177e112: skickat
`75&nbsp;<span class=u>cm</span>`, lagrat `75&nbsp;cm`. Diffen per span ar
`<span class=u>` (14) + `</span>` (7) = 21 tecken, oavsett vilken enhet
spannet omslot. Kundens sida var aldrig fel — `.u` fanns aldrig i butikens
stylesheet — men aterlasningens FACIT var det, och foljden ar densamma
regel som forr: en korrekt skrivning ser ut som en som misslyckats.

⚠️ En avvikelse pa en byte ser ut som en struntsak och ar just darfor farlig:
den ar omojlig att skilja fran ett aakta transkriberingsfel pa ett tecken,
och den som sett den nog manga ganger slutar titta efter vilket det var.

☠️ REGELN FRAMAT: `<span class=...>` HOR ALDRIG HEMMA I plainDescription.
Konventionen ar reserverad for kort.tsv:s spec-varden. gate.py fangar den
sedan denna rad skrevs.
"""
import re

def normalisera(h):
    h = re.sub(r">\s*\n\s*<", "><", h)
    h = h.replace("<strong>", '<span style="font-weight: 700">').replace("</strong>", "</span>")
    h = re.sub(r'(<a href="[^"]+")>', r'\1 target="_self">', h)
    h = re.sub(r"<li>(?!<p>)(.*?)</li>", r"<li><p>\1</p></li>", h, flags=re.S)
    h = re.sub(r'<span class=u>(.*?)</span>', r'\1', h)
    return h.rstrip("\n")
