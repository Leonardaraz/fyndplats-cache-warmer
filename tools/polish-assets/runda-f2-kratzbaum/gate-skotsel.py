#!/usr/bin/env python3
"""Filgrind for skotseltexten (skotsel.tsv) — samma disciplin som ovriga grindar.

☠️ Skotselfliken ar KUNDTEXT och lyder under exakt samma regler som brodtexten:
inga husmarken, inget artikelnummer, inget fraktland, ingen hanvisning till
"leverantoren" (mot kunden ar VI leverantoren), inga tyska rester, inga
homoglyfer — och varje tal maste ga att belagga i produktens egen publicerade
text. Kravet finns for att fliken ar obligatorisk sedan 2026-08-30 och darfor
skrivs i mangd; en mall som glider igenom pa 41 sidor ar dyrare an en pa en.

ANVANDNING (fran rundans katalog):  python3 gate-skotsel.py skotsel.tsv
"""
import os, re, sys, unicodedata

MARKEN = r"HOMCOM|Outsunny|PawHut|Aiyaplay|Aosom|SportNow|Vinsetto|Kleankin|Zonekiz|Durhand"
ARTNR  = r"\b\d{3}-\d{3}[A-Z0-9]*\b|\b\d{2}[A-Z]-\d{3}"
LAND   = r"\b(Tyskland|Deutschland|tysk[at]?|Spanien|spansk|Polen|polsk|Kina|kines|EU-lager|skickas fr[åa]n|lagerland)\b"
LEV    = r"\b([Ll]everant[öo]r\w*|[Tt]illverkaren anger|[Tt]illverkaren rekommenderar|vi vet inte|enligt uppgift)\b"
TYSKA  = r"(?<![a-zåäöéü])(und|mit|für|der|die|das|ist|sind|Kratzbaum|Katzen|Plüsch|Sessel)(?![a-zåäöéü])"
HOMO   = r"[Ѐ-ӿͰ-Ͽ]"
GRINDAR = [("HUSMÄRKE", MARKEN), ("ARTIKELNUMMER", ARTNR), ("FRAKTLAND", LAND),
           ("LEVERANTÖR", LEV), ("TYSK REST", TYSKA), ("HOMOGLYF", HOMO)]

def tal(t):
    return {x.replace(".", ",").rstrip(",") for x in re.findall(r"\d+(?:[.,]\d+)?", t)}

def main(fil):
    fynd = 0
    rader = [r for r in open(fil, encoding="utf-8").read().splitlines() if r.strip()]
    for rad in rader:
        i, text = rad.split("\t", 1)
        for namn, m in GRINDAR:
            for hit in re.finditer(m, text):
                print(f"  {i}: [{namn}] {hit.group(0)!r}"); fynd += 1
        kalla_fil = f"{i}.html" if os.path.exists(f"{i}.html") else os.path.join("live", f"{i}.html")
        if not os.path.exists(kalla_fil):
            print(f"  {i}: [KÄLLA SAKNAS] varken {i}.html eller live/{i}.html"); fynd += 1
            continue
        kalla = re.sub(r"<[^>]+>", " ", open(kalla_fil, encoding="utf-8").read())
        for x in sorted(tal(text) - tal(kalla)):
            print(f"  {i}: [SIFFRA UTAN KÄLLA] {x!r}"); fynd += 1
        for ch in sorted(set(text)):
            if ord(ch) > 127 and ch not in "ÅÄÖåäöÉéÜü×—–…°":
                print(f"  {i}: [OVÄNTAT TECKEN] {ch!r} U+{ord(ch):04X} "
                      f"{unicodedata.name(ch, '?')}"); fynd += 1
    print(f"\nGRIND: {fynd} fynd i {len(rader)} rader")
    return 1 if fynd else 0

if __name__ == "__main__":
    sys.exit(main(sys.argv[1] if len(sys.argv) > 1 else "skotsel.tsv"))
