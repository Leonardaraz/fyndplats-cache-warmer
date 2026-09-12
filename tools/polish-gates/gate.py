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
  foto-tal.txt      VALFRI: fotoräknade tal, "<kort> <tal> <skäl>" (se nedan)
"""
import re, sys, os, json, glob, collections
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from gatelib import las_facit, GRINDAR, FLIKAR, tal, kropp

# ☠️ TRE LEGITIMA KÄLLOR UTÖVER PRODUKTENS EGEN SPEC — alla smala med flit.
#
# 1. RÅD-TAL. "minst 20 cm fritt bakom ryggstödet" är VÅR placeringsanvisning,
#    inte leverantörens mått. Ett råd-tal måste stå i rundans `rad-tal.txt` för
#    att slippa igenom — det går inte att smyga in ett påhittat produktmått
#    som "råd". Filen är VALFRI: en runda utan råd-tal skriver ingen.
RAD_TAL = set()
if os.path.exists("rad-tal.txt"):
    RAD_TAL = {r.strip() for r in open("rad-tal.txt", encoding="utf-8") if r.strip()}

# 3. FOTO-TAL. ☠️ Runbookens egen J1-regel säger att BILDEN är facit för
#    konstruktion — "titta på bilderna FÖRE texten" — men grinden kunde bara
#    se den tyska texten. Ett tal som bara går att RÄKNA på fotot hade därför
#    ingen laglig väg igenom, och de två utvägarna var båda fel: skriva om
#    talet till bokstäver för att gömma det för grinden, eller stryka ett sant
#    och användbart påstående för att blidka den.
#
#    Uppmätt i runda K14 på 166fdb52: texten säger "Sittdynor: 2 st" och
#    källan nämner aldrig något antal — men produktfotot visar två sittdynor
#    och två ryggkuddar. Påståendet är sant och osynligt för varje textgrind.
#
#    Formen är SMAL med flit, som rad-tal: "<kort> <tal> <vad som räknades>".
#    Talet gäller bara den produkt raden nämner — ett foto hör till en produkt,
#    inte till rundan — och skälet är obligatoriskt, så filen blir ett protokoll
#    över vad någon faktiskt tittat på och inte en generell ventil.
FOTO_TAL = {}
if os.path.exists("foto-tal.txt"):
    for rad in open("foto-tal.txt", encoding="utf-8"):
        rad = rad.strip()
        if not rad or rad.startswith("#"):
            continue
        delar = rad.split(None, 2)
        if len(delar) < 3:
            raise SystemExit(
                f"  [AVBRYT] foto-tal.txt: raden {rad!r} saknar skäl.\n"
                "  Formen är '<kort> <tal> <vad som räknades på bilden>'. Ett tal\n"
                "  utan skäl är en ventil, inte ett protokoll."
            )
        FOTO_TAL.setdefault(delar[0], set()).add(delar[1])

# Facit: `kallor-tal.json` (lista med tal per produkt) är formen sedan runda G.
# Runda A–F1 sparade i stället HELA källtexten i `kallor.json`. Grinden läser
# båda — annars går en äldre runda inte att grinda om, och det är just
# omgrindningen som avslöjar att ordlistan drivit isär.

# ☠️ SAKNAT FACIT FÅR INTE STÄNGA AV MÖNSTERGRINDARNA. Fram till 2026-09-07
# kastade `_las_facit` här, alltså INNAN en enda fil lästs — och elva av
# sjutton rundor (A–E3, F2) har inget facit. För dem körde varken tyska
# rester, husmärken, artikelnummer, stavning eller homoglyfer: grinden
# rapporterade "[FACIT SAKNAS]" och såg ut att ha gjort sitt jobb.
# Samma klass som runda G:s döda `gungstol(?=en\b)(?!)` — en grind som ser
# komplett ut och kontrollerar ingenting är värre än ingen alls, för den
# räknas som gjord. Mönstergrindarna behöver inget facit; bara siffergrinden
# gör det, och det är BARA den som hoppas över.
kallor, _facitfil = las_facit()
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
    # ☠️ EN RELATIV KORSLÄNK BLIR EN DÖD LÄNK. Uppmätt 2026-09-07 på runda K1:
    # `href="/produkt/x"` lagras av Wix som `href="https:/produkt/x"` — ett
    # snedstreck, alltså en adress som inte går någonstans. Skrivningen svarar
    # 200 och den lagrade texten ser rimlig ut i ett svar. Det som fångade det
    # var transkriptionshashen, som inte stämde efteråt.
    # Katalogen mättes samma dag: 1 778 av 1 779 korslänkar på publicerade
    # sidor är absoluta. Formen är alltså husets, inte en smaksak.
    for x in re.finditer(r'href="(?!https://www\.fyndplats\.se/)([^"]*)"', txt):
        print(f"  {kort}: [RELATIV LÄNK] {x.group(1)!r} — Wix gör om den till https:/… (död länk)")
        fynd += 1
    if UTAN_FACIT:
        continue
    facit = set(kallor.get(kort, []))
    if not facit:
        print(f"  {kort}: [KÄLLA SAKNAS]"); fynd += 1; continue
    facit |= RAD_TAL | syskontal(txt) | FOTO_TAL.get(kort, set())
    for t in sorted(tal(k) - facit, key=lambda x: (len(x), x)):
        print(f"  {kort}: [SIFFRA UTAN KÄLLA] {t!r}"); fynd += 1

sif = "utan siffergrind" if UTAN_FACIT else f"siffergrind mot {_facitfil}"
print(f"\nGRIND: {fynd} fynd i {len(filer)} filer ({sif})")
# Saknat facit fäller fortfarande — en runda utan siffergrind är inte klar.
sys.exit(1 if (fynd or UTAN_FACIT) else 0)
