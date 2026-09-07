#!/usr/bin/env python3
"""Filgrind för SEO-titel och metabeskrivning (`seo.tsv`).

☠️ VARFÖR EN EGEN GRIND. Titeln och metabeskrivningen är det Google VISAR i
sökresultatet — alltså kundtext, med precis samma regler som brödtexten. De
gick ändå ogrindade i alla rundor fram till 2026-09-06, för att poleringen
aldrig rör seoData: importen skriver tysk titel och tysk beskrivning, och
ingenting skrev över dem.

⚠️ SKRIV MED TANKSTRECK I SPANN ("228–260"), inte bindestreck. `228-260` är
inte bara fel typografi utan träffar artikelnummer-mönstret \\d{3}-\\d{3}.

☠️ BACKFILL-VARIANT. En backfill-runda har inga egna källfiler — produkterna
polerades i en tidigare runda. Källan för siffergrinden är då den PUBLICERADE
sidan (`live/<id>.html`), vilket är rätt facit: metabeskrivningen ska bara
påstå det sidan redan säger.

ANVÄNDNING (från rundans katalog):  python3 ../../polish-gates/gate-seo.py
"""
import re, sys, os, unicodedata
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from gatelib import MARKEN, ARTNR, LAND, LEV, TYSKA, HOMO, tal

GRINDAR = [("HUSMÄRKE", MARKEN), ("ARTIKELNUMMER", ARTNR), ("FRAKTLAND", LAND),
           ("LEVERANTÖR", LEV), ("TYSK REST", TYSKA), ("HOMOGLYF", HOMO)]

# Googles klipp: titeln kring 60 tecken, beskrivningen kring 160.
MAX_TITEL, MAX_DESC = 60, 160


def kalla(i):
    """Källfilen om den finns, annars den hämtade live-sidan."""
    for kandidat in (f"{i}.html", os.path.join("live", f"{i}.html")):
        if os.path.exists(kandidat):
            return kandidat
    raise SystemExit(f"  {i}: [KÄLLA SAKNAS] varken {i}.html eller live/{i}.html finns")


def main(fil):
    fynd = 0
    rader = [r for r in open(fil, encoding="utf-8").read().splitlines() if r.strip()]
    for rad in rader:
        i, t, d = rad.split("\t")
        text = f"{t} {d}"
        for namn, m in GRINDAR:
            for hit in re.finditer(m, text):
                print(f"  {i}: [{namn}] {hit.group(0)!r}"); fynd += 1
        kalltext = re.sub(r"<[^>]+>", " ", open(kalla(i), encoding="utf-8").read())
        for x in sorted(tal(text) - tal(kalltext)):
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
