#!/usr/bin/env python3
"""Filgrind för SUPERLATIV OM VÅRT EGET SORTIMENT.

☠️ VARFÖR DEN FINNS. Runda K11 skrev "ställs mellan 45 och 53 cm — lägst i
vårt massagesortiment" om `f809b33e`. Det var FALSKT: `b78d4cc6` i SAMMA runda
går ner till 44 cm.

⚠️ Ingen befintlig grind kunde se det. Talen stod i källan, så siffergrinden
var ren. Svenskan var korrekt, så mönstergrindarna var rena. Påståendet
handlade om ANDRA produkter — data som inte finns i den granskade filen. Det
hittades bara för att siffergrinden råkade fälla tre påhittade jämförelsetal
och superlativen därför söktes i alla åtta filerna för hand.

VAD DEN FÄLLER: ett superlativ i SAMMA MENING som ett omfång som syftar på
vårt eget sortiment. Ett påstående om materialet ("konstläder kräver minst av
dig") rörs inte; en rankning av katalogen ("lägst i vårt sortiment", "den enda
i serien") måste kvitteras.

KVITTERINGEN ÄR EN FIL: `superlativ.txt` i rundans katalog, en rad per godkänt
påstående:

    b78d4cc6  enda med vippfunktion — kollat mot ids.tsv, 8/8
    5afb2c39  enda utan massage — kollat mot ids.tsv, 8/8

☠️ Bara `<kort>` i början av raden läses; resten är anteckning åt den som
granskar. Utan raden FÄLLER grinden. Att bara varna hade gjort den till en
påminnelse, och huset har redan skrivit ned att en checklista som bara hjälper
den som kommer ihåg punkten inte är en spärr.

⚠️ OCH KVITTERINGEN BEVISAR INGENTING OM SANNINGEN. Den flyttar bara
påståendet dit en människa ser det. Ett superlativ som sträcker sig utanför
rundan (hela katalogen) går inte att kontrollera från filerna — skriv om det
till rundans omfång, eller mät det.

ANVÄNDNING (från rundans katalog):
  python3 ../../polish-gates/gate-superlativ.py
"""
import glob, os, re, sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import gatelib

kvitterade = set()
if os.path.exists("superlativ.txt"):
    for rad in open("superlativ.txt", encoding="utf-8"):
        rad = rad.strip()
        if rad and not rad.startswith("#"):
            kvitterade.add(rad.split()[0])

filer = sorted(glob.glob("*.html"))
if not filer:
    print("gate-superlativ: inga *.html i katalogen — INGENTING GRANSKAT", file=sys.stderr)
    sys.exit(1)

fel = 0
for sokvag in filer:
    kort = os.path.basename(sokvag)[:-5]
    text = gatelib.kropp(open(sokvag, encoding="utf-8").read())
    text = re.sub(r"\s+", " ", text)
    for mening in gatelib.meningar(text):
        sup = re.search(gatelib.SUPERLATIV, mening, re.I)
        omf = re.search(gatelib.OMFANG, mening, re.I)
        if not (sup and omf):
            continue
        if kort in kvitterade:
            continue
        fel += 1
        print(f"  {kort}: [SUPERLATIV OM SORTIMENTET] '{sup.group(1)}' + '{omf.group(1)}'")
        print(f"      {mening.strip()[:160]}")

if fel:
    print(f"\nGRIND: {fel} fynd i {len(filer)} filer.", file=sys.stderr)
    print("Kontrollera påståendet mot ids.tsv och kvittera i superlativ.txt "
          "— eller skriv om meningen.", file=sys.stderr)
    sys.exit(1)
print(f"\nGRIND REN: {len(filer)} filer, {len(kvitterade)} kvitterade superlativ")
