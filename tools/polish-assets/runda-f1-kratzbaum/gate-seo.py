#!/usr/bin/env python3
"""Filgrind for SEO-titel och metabeskrivning (seo.tsv).

☠️ VARFOR EN EGEN GRIND. Titeln och metabeskrivningen ar det Google VISAR i
sokresultatet — alltsa kundtext, med precis samma regler som brodtexten. De
gick anda ogrindade i alla rundor fram till 2026-09-06, for att poleringen
aldrig ror seoData: importen skriver tysk titel och tysk beskrivning, och
ingenting skrev over dem.

Samma tva sorters kontroll som gate-runda-a.py, och den andra biter hardast:
monstergrind (husmarke, artikelnummer, fraktland, leverantorsomnamnande, tysk
rest, homoglyfer) plus SIFFERGRIND mot produktens egen kalltext — varje tal i
SEO-texten maste ga att belagga i <id>.html.

⚠️ SKRIV MED TANKSTRECK I SPANN ("228–260"), inte bindestreck. `228-260` ar
inte bara fel typografi utan traffar artikelnummer-monstret \\d{3}-\\d{3}.

ANVANDNING (fran rundans katalog):  python3 gate-seo.py seo.tsv
"""
import re, sys, unicodedata

MARKEN = r"HOMCOM|Outsunny|PawHut|Aiyaplay|Aosom|SportNow|Vinsetto|Kleankin|Zonekiz|Durhand"
ARTNR  = r"\b\d{3}-\d{3}[A-Z0-9]*\b|\b\d{2}[A-Z]-\d{3}"
LAND   = r"\b(Tyskland|Deutschland|tysk[at]?|Spanien|spansk|Polen|polsk|Kina|kines|EU-lager|skickas fr[åa]n|lagerland)\b"
LEV    = r"\b([Ll]everant[öo]r\w*|[Tt]illverkaren anger|vi vet inte|enligt uppgift)\b"
TYSKA  = r"(?<![a-zåäöéü])(und|mit|für|der|die|das|ist|sind|Kratzbaum|Katzen|Plüsch|Sessel)(?![a-zåäöéü])"
HOMO   = r"[Ѐ-ӿͰ-Ͽ]"
GRINDAR = [("HUSMÄRKE", MARKEN), ("ARTIKELNUMMER", ARTNR), ("FRAKTLAND", LAND),
           ("LEVERANTÖR", LEV), ("TYSK REST", TYSKA), ("HOMOGLYF", HOMO)]

# Googles klipp: titeln kring 60 tecken, beskrivningen kring 160.
MAX_TITEL, MAX_DESC = 60, 160

def tal(t):
    return {x.replace(".", ",").rstrip(",") for x in re.findall(r"\d+(?:[.,]\d+)?", t)}

def main(fil):
    fynd = 0
    rader = [r for r in open(fil, encoding="utf-8").read().splitlines() if r.strip()]
    for rad in rader:
        i, t, d = rad.split("\t")
        text = f"{t} {d}"
        for namn, m in GRINDAR:
            for hit in re.finditer(m, text):
                print(f"  {i}: [{namn}] {hit.group(0)!r}"); fynd += 1
        kalla = re.sub(r"<[^>]+>", " ", open(f"{i}.html", encoding="utf-8").read())
        for x in sorted(tal(text) - tal(kalla)):
            print(f"  {i}: [SIFFRA UTAN KÄLLA] {x!r}"); fynd += 1
        for ch in sorted(set(text)):
            if ord(ch) > 127 and ch not in "ÅÄÖåäöÉéÜü×—–…°":
                print(f"  {i}: [OVÄNTAT TECKEN] {ch!r} U+{ord(ch):04X} "
                      f"{unicodedata.name(ch, '?')}"); fynd += 1
        if len(t) > MAX_TITEL:
            print(f"  {i}: [TITEL FÖR LÅNG] {len(t)} tecken > {MAX_TITEL}"); fynd += 1
        if len(d) > MAX_DESC:
            print(f"  {i}: [BESKRIVNING FÖR LÅNG] {len(d)} tecken > {MAX_DESC}"); fynd += 1
        if not t.endswith(" | Fyndplats"):
            print(f"  {i}: [SAKNAR SUFFIX] titeln slutar inte på ' | Fyndplats'"); fynd += 1
    print(f"\nGRIND: {fynd} fynd i {len(rader)} rader")
    return 1 if fynd else 0

if __name__ == "__main__":
    sys.exit(main(sys.argv[1] if len(sys.argv) > 1 else "seo.tsv"))
