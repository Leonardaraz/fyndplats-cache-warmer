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
from gatelib import (las_facit, GRINDAR, FLIKAR, NORM, tal, kropp, ordtal_i_text,
                     las_kalltext, tal_ur_kalla_brett, las_kvittenser)

# ☠️ TRE LEGITIMA KÄLLOR UTÖVER PRODUKTENS EGEN SPEC — alla smala med flit.
#
# 1. RÅD-TAL. "minst 20 cm fritt bakom ryggstödet" är VÅR placeringsanvisning,
#    inte leverantörens mått. Ett råd-tal måste stå i rundans `rad-tal.txt` för
#    att slippa igenom — det går inte att smyga in ett påhittat produktmått
#    som "råd". Filen är VALFRI: en runda utan råd-tal skriver ingen.
RAD_TAL, FOTO_TAL = las_kvittenser()

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
VARNINGAR = []
# Råa källtexter, bara när facit ÄR källtexten. `las_kalltext` svarar None
# på en runda med härledd sifferlista, och då är varningen överhoppad ändå.
KALLTEXT = las_kalltext() or {}
# ⚠️ Ett upprepat påstående är ETT påstående. Utan den här dedupen gav
# 166fdb52 sju rader om samma två dynor, och sju rader om en sak är brus.
sedda_ord = {}
filer = sorted(glob.glob("*.html"))
for f in filer:
    kort = os.path.basename(f)[:-5]
    txt = open(f, encoding="utf-8").read()
    k = kropp(txt)
    for namn, m in GRINDAR:
        for x in re.finditer(m, k):
            print(f"  {kort}: [{namn}] {x.group(0)!r} …{k[max(0, x.start()-45):x.end()+45].strip()}…")
            fynd += 1
    # ☠️ EN-NORMEN GRINDAS MOT PRODUKTENS EGEN KÄLLA, inte som ett blint
    # mönster. Se gatelib.NORM för varför den flyttades hit: i GRINDAR fyrade
    # den på varje normangivelse, även en källan certifierar ordagrant, och ett
    # falsklarm som alltid fyrar är lika illa som ett fel ingen ser.
    #
    # ⚠️ FAIL-CLOSED: utan källtext (rundan har bara den härledda
    # `kallor-tal.json`) fälls varje norm som förr. Att tiga när grinden inte
    # KAN veta vore att göra den till en vana.
    kalltext = KALLTEXT.get(kort)
    for x in re.finditer(NORM, k):
        normen = re.sub(r"\s+", "", x.group(0))
        if kalltext is not None and normen in re.sub(r"\s+", "", kalltext):
            continue
        skal = ("källan nämner den inte" if kalltext is not None
                else "rundan har ingen källtext att grinda mot")
        print(f"  {kort}: [EN-NORM UTAN KÄLLA] {x.group(0)!r} ({skal}) "
              f"…{k[max(0, x.start()-45):x.end()+45].strip()}…")
        fynd += 1

    op = collections.Counter(re.findall(r"<(\w+)[^>]*>", txt))
    cl = collections.Counter(re.findall(r"</(\w+)>", txt))
    for t in set(op) | set(cl):
        if op[t] != cl[t]:
            print(f"  {kort}: [TAGG] {t}: {op[t]} öppna, {cl[t]} stängda"); fynd += 1
    for r in FLIKAR:
        if f"<h2>{r}</h2>" not in txt:
            print(f"  {kort}: [FLIK] saknar <h2>{r}</h2>"); fynd += 1
    # ☠️ <span class=...> HÖR HEMMA I kort.tsv:S SPEC-VÄRDEN, ALDRIG I
    # plainDescription. Wix stryper spannet tyst vid sparandet (samma klass
    # som `fontagen-weight`) — kundens sida blir aldrig fel, men N14 mätte
    # nio av tio produkter med markeringen läckt in i kroppstexten av
    # misstag, och wixnorm.py:s facit missade det tills det lagades. Se
    # wixnorm.py punkt 6.
    if re.search(r'<span class=', txt):
        print(f"  {kort}: [KORT-MARKUP I KROPPEN] <span class=…> hör hemma i kort.tsv, inte i plainDescription")
        fynd += 1
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

    # ☠️ VARNINGEN GÄLLER BARA MOT HELA KÄLLTEXTEN. `kallor-tal.json` är en
    # HÄRLEDD sifferlista, byggd innan tyska räkneord bryggades över — en källa
    # som säger "sechs Vibrationspunkte" bidrog aldrig med någon 6 dit. Körd mot
    # det formatet flaggar varningen därför sourcade påståenden som osourcade:
    # uppmätt 2026-09-12 gav K3, K10–K13 arton varningar om massagepunkter,
    # lägen och styrkor som med all sannolikhet står i källan med bokstäver.
    #
    # Att låta dem stå hade varit att mäta facit-formatet och kalla det ett fynd
    # — samma familj som "en nolla från en klassificerare mäter klassificeraren",
    # fast åt andra hållet. Rundan måste ha `kallor.json` för att varningen ska
    # betyda något.
    if _facitfil != "kallor.json":
        ordtal_overhoppat = True
    else:
        ordtal_overhoppat = False

    # ⚠️ UTSKRIVNA RÄKNEORD — VARNING, INTE FYND (#241). Siffergrinden ovan ser
    # bara `\d+`, så "delad i TVÅ dynor" passerar ogrindad. Mätt falsklarm
    # ~40 % (prosa som "i stället för fyra eller sex", härledningar som "två
    # hårdheter" = källans 35D och 30D), och en hård grind på det hade lärt
    # mottagaren att sluta läsa. Den listar därför bara, och tystnar för allt
    # som kvitterats i foto-tal.txt eller står som siffra i källan.
    # `kropp()` ersätter varje tagg med ett blanksteg, så ett råklippt utdrag
    # blir ofta en rad blanksteg och några lösryckta tecken. Utdraget klipps
    # därför ur en vitrymdsnormaliserad kopia — en varning som inte går att
    # läsa är en varning ingen agerar på.
    komprimerad = re.sub(r"\s+", " ", k)
    # ☠️ VARNINGEN JÄMFÖR MOT EN BREDARE KÄLLBILD ÄN GRINDEN. Källan skriver
    # talet som förled (`Dreistufiges Dimmen`), och `tal_ur_kalla` matchar bara
    # fristående ord — med flit, den matar den hårda grinden. Breddningen bor
    # därför här, där den bara kan tysta en varning.
    brett = facit | tal_ur_kalla_brett(kropp(KALLTEXT.get(kort, "")))
    for ordet, siffra, _ in ([] if ordtal_overhoppat else ordtal_i_text(komprimerad)):
        if siffra in brett:
            continue
        m = re.search(r"\b" + ordet + r"\b", komprimerad, re.IGNORECASE)
        pos = m.start() if m else 0
        sedda_ord.setdefault(kort, set())
        if (ordet.lower(), siffra) in sedda_ord[kort]:
            continue
        sedda_ord[kort].add((ordet.lower(), siffra))
        VARNINGAR.append(
            f"  {kort}: '{ordet.lower()}' ({siffra}) saknar täckning i källan\n"
            f"      …{komprimerad[max(0, pos - 55):pos + 60].strip()}…")

if _facitfil and _facitfil != "kallor.json":
    print(f"\n[ORDTAL ÖVERHOPPAT] facit är {_facitfil}, en härledd sifferlista. "
          "Tyska räkneord\n  skrivna med bokstäver finns inte i den, så varningen "
          "kunde bara ge falsklarm.")

if VARNINGAR:
    print("\n⚠️ UTSKRIVNA RÄKNEORD UTAN TÄCKNING (varning — fäller inte):")
    for r in VARNINGAR:
        print(r)
    print("  Kvittera ett äkta fotoräknat tal i foto-tal.txt; prosa lämnas som den är.")

sif = "utan siffergrind" if UTAN_FACIT else f"siffergrind mot {_facitfil}"
print(f"\nGRIND: {fynd} fynd i {len(filer)} filer ({sif}), "
      f"{len(VARNINGAR)} varningar")
# Saknat facit fäller fortfarande — en runda utan siffergrind är inte klar.
sys.exit(1 if (fynd or UTAN_FACIT) else 0)
