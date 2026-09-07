#!/usr/bin/env python3
"""Filgrind för TILLÄGGSFRAGMENT — text som ska läggas till en redan
publicerad produkt, inte ersätta den.

☠️ VARFÖR EN EGEN GRIND. `gate.py` kräver alla tre flikarna i varje fil, för
den grindar en HEL produkttext. Ett fragment som bara lägger till skötsel- och
FAQ-fliken på en produkt vars spec-flik redan står i Wix faller därför på
`[FLIK] saknar Tekniska specifikationer` — ett korrekt fynd om filen vore en
hel text, och ett falsklarm när den inte är det.

Att stänga av flik-kollen hade varit fel svar: en grind man lär sig att
ignorera är ingen grind. Den här vänder i stället på kravet och kontrollerar
det som FAKTISKT gäller ett fragment:

  * ordlistorna och siffergrinden gäller oförändrat (samma gatelib)
  * de flikar fragmentet SKA bära måste finnas
  * spec-fliken får INTE finnas — skriver fragmentet om den, ersätter det
    text som redan är korrekt i butiken

⚠️ Den här grinden är halva kvittot. Den andra halvan är att läsa tillbaka den
SAMMANFOGADE texten ur Wix och kontrollera alla tre flikarna där — ett fragment
kan vara felfritt och ändå hamna på fel ställe i produkten.

ANVÄNDNING (från fragmentkatalogen):
  python3 ../../polish-gates/gate-fragment.py [flik ...]
  Utan argument krävs "Användning och skötsel" och "Vanliga frågor".
"""
import sys, os, re, io, glob, unicodedata
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from gatelib import GRINDAR, tal, TILLATNA_TECKEN, las_facit

FORBJUDEN = "Tekniska specifikationer"


def main(kravda):
    facit, filnamn = las_facit()
    if facit is None:
        raise SystemExit("  [AVBRYT] varken kallor-tal.json eller kallor.json finns")
    filer = sorted(glob.glob("*.html"))
    if not filer:
        raise SystemExit("  [AVBRYT] inga *.html i katalogen")
    fynd = 0
    for f in filer:
        kort = os.path.basename(f)[:-5]
        t = io.open(f, encoding="utf-8").read()
        ren = re.sub(r"<[^>]+>", " ", t)
        for namn, m in GRINDAR:
            for hit in sorted({x.group(0) for x in re.finditer(m, ren)}):
                print(f"  {kort}: [{namn}] {hit!r}"); fynd += 1
        kalla = facit.get(kort)
        if kalla is None:
            print(f"  {kort}: [FACIT SAKNAS] står inte i {filnamn}"); fynd += 1
        else:
            kalltal = kalla if isinstance(kalla, (set, list)) else tal(kalla)
            for x in sorted(tal(ren) - set(kalltal)):
                print(f"  {kort}: [SIFFRA UTAN KÄLLA] {x!r}"); fynd += 1
        for ch in sorted(set(ren)):
            if ord(ch) > 127 and ch not in TILLATNA_TECKEN:
                print(f"  {kort}: [OVÄNTAT TECKEN] {ch!r} U+{ord(ch):04X} "
                      f"{unicodedata.name(ch, '?')}"); fynd += 1
        for flik in kravda:
            if f"<h2>{flik}</h2>" not in t:
                print(f"  {kort}: [FLIK SAKNAS] fragmentet ska bära <h2>{flik}</h2>"); fynd += 1
        if f"<h2>{FORBJUDEN}</h2>" in t:
            print(f"  {kort}: [SKRIVER OM SPEC-FLIKEN] <h2>{FORBJUDEN}</h2> finns "
                  f"redan i butiken — fragmentet ska bara LÄGGA TILL"); fynd += 1
    print(f"\nFRAGMENTGRIND: {fynd} fynd i {len(filer)} filer (facit: {filnamn})")
    sys.exit(1 if fynd else 0)


main(sys.argv[1:] or ["Användning och skötsel", "Vanliga frågor"])
