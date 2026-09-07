#!/usr/bin/env python3
"""Filgrind för en poleringsrunda — mönster, siffror, taggar och flikar.

☠️ SIFFERGRINDEN är den som biter: varje tal i den svenska texten måste finnas
i produktens EGNA tyska källtext. Facit (`kallor-tal.json`) hämtas mekaniskt ur
Wix, aldrig avskrivet.

Ordlistorna bor i `gatelib.py` — se kommentaren där för varför de INTE får
kopieras in i rundans katalog.

ANVÄNDNING (från rundans katalog):  python3 ../../polish-gates/gate.py
  kallor-tal.json   facit per produkt
  slugs.txt         "kort slug", en rad per produkt
  <kort>.html       texterna
  rad-tal.txt       VALFRI: råd-tal, ett per rad (se nedan)
"""
import re, sys, os, json, glob, collections
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from gatelib import GRINDAR, FLIKAR, tal, kropp

# ☠️ TVÅ LEGITIMA KÄLLOR UTÖVER PRODUKTENS EGEN SPEC — båda smala med flit.
#
# 1. RÅD-TAL. "minst 20 cm fritt bakom ryggstödet" är VÅR placeringsanvisning,
#    inte leverantörens mått. Ett råd-tal måste stå i rundans `rad-tal.txt` för
#    att slippa igenom — det går inte att smyga in ett påhittat produktmått
#    som "råd". Filen är VALFRI: en runda utan råd-tal skriver ingen.
RAD_TAL = set()
if os.path.exists("rad-tal.txt"):
    RAD_TAL = {r.strip() for r in open("rad-tal.txt", encoding="utf-8") if r.strip()}

# Facit: `kallor-tal.json` (lista med tal per produkt) är formen sedan runda G.
# Runda A–F1 sparade i stället HELA källtexten i `kallor.json`. Grinden läser
# båda — annars går en äldre runda inte att grinda om, och det är just
# omgrindningen som avslöjar att ordlistan drivit isär.
def _las_facit():
    for namn in ("kallor-tal.json", "kallor.json"):
        if os.path.exists(namn):
            rå = json.load(open(namn, encoding="utf-8"))
            return {k: (v if isinstance(v, list) else sorted(tal(kropp(v))))
                    for k, v in rå.items()}, namn
    return None, None

# ☠️ SAKNAT FACIT FÅR INTE STÄNGA AV MÖNSTERGRINDARNA. Fram till 2026-09-07
# kastade `_las_facit` här, alltså INNAN en enda fil lästs — och elva av
# sjutton rundor (A–E3, F2) har inget facit. För dem körde varken tyska
# rester, husmärken, artikelnummer, stavning eller homoglyfer: grinden
# rapporterade "[FACIT SAKNAS]" och såg ut att ha gjort sitt jobb.
# Samma klass som runda G:s döda `gungstol(?=en\b)(?!)` — en grind som ser
# komplett ut och kontrollerar ingenting är värre än ingen alls, för den
# räknas som gjord. Mönstergrindarna behöver inget facit; bara siffergrinden
# gör det, och det är BARA den som hoppas över.
kallor, _facitfil = _las_facit()
UTAN_FACIT = kallor is None
if UTAN_FACIT:
    kallor = {}
    print("[FACIT SAKNAS] siffergrinden hoppas över — mönstergrindarna körs ändå")
slug2kort = ({l.split()[1]: l.split()[0] for l in open("slugs.txt", encoding="utf-8") if l.strip()}
             if os.path.exists("slugs.txt") else {})

# 2. SYSKONETS TAL. En korslänk beskriver grannprodukten ("den andra har 50 cm
#    bred sits"), och det talet står i GRANNENS källa. Grinden följer därför
#    länkarna: bara produkter sidan faktiskt länkar till bidrar med sina tal.
def syskontal(html):
    ut = set()
    for m in re.finditer(r'href="[^"]*/produkt/([a-z0-9-]+)"', html):
        k = slug2kort.get(m.group(1))
        if k:
            ut |= set(kallor.get(k, []))
    return ut

fynd = 0
filer = sorted(glob.glob("*.html"))
for f in filer:
    kort = os.path.basename(f)[:-5]
    txt = open(f, encoding="utf-8").read()
    k = kropp(txt)
    for namn, m in GRINDAR:
        for x in re.finditer(m, k):
            print(f"  {kort}: [{namn}] {x.group(0)!r} …{k[max(0, x.start()-45):x.end()+45].strip()}…")
            fynd += 1
    op = collections.Counter(re.findall(r"<(\w+)[^>]*>", txt))
    cl = collections.Counter(re.findall(r"</(\w+)>", txt))
    for t in set(op) | set(cl):
        if op[t] != cl[t]:
            print(f"  {kort}: [TAGG] {t}: {op[t]} öppna, {cl[t]} stängda"); fynd += 1
    for r in FLIKAR:
        if f"<h2>{r}</h2>" not in txt:
            print(f"  {kort}: [FLIK] saknar <h2>{r}</h2>"); fynd += 1
    if UTAN_FACIT:
        continue
    facit = set(kallor.get(kort, []))
    if not facit:
        print(f"  {kort}: [KÄLLA SAKNAS]"); fynd += 1; continue
    facit |= RAD_TAL | syskontal(txt)
    for t in sorted(tal(k) - facit, key=lambda x: (len(x), x)):
        print(f"  {kort}: [SIFFRA UTAN KÄLLA] {t!r}"); fynd += 1

sif = "utan siffergrind" if UTAN_FACIT else f"siffergrind mot {_facitfil}"
print(f"\nGRIND: {fynd} fynd i {len(filer)} filer ({sif})")
# Saknat facit fäller fortfarande — en runda utan siffergrind är inte klar.
sys.exit(1 if (fynd or UTAN_FACIT) else 0)
