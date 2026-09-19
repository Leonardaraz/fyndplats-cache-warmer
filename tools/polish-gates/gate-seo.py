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
import re, sys, os, io, unicodedata
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from gatelib import MARKEN, ARTNR, LAND, LEV, TYSKA, HOMO, tal, TILLATNA_TECKEN

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


def kvitterade_tal(kort):
    """De tal rundan redan kvitterat — SAMMA tre källor som gate.py godtar.

    ☠️ TVÅ GRINDAR SOM ÄR OENSE OM SAMMA TAL TVINGAR FRAM ETT FEL. Uppmätt i
    runda M1: `2` i titeln "Lysande isbjörnar 2-pack" är kvitterat i
    `foto-tal.txt` (två björnar räknade i produktbilden, och källans
    Lieferumfang listar dem som två rader), så gate.py släpper det — men
    gate-seo.py kände inte till filen och fällde det. Den som möter det har
    två utvägar och båda är sämre än att laga grinden: skriva om en sann och
    användbar titel för att blidka en grind, eller sluta läsa grinden.

    Samma tvilling-lärdom som SHIP_AXIS_RE, EU_TULL_CODES och de nitton
    grindkopiorna: det som ska vara en delad sanning måste ha EN definition.
    """
    ut = set()
    for filnamn, styckvis in (("rad-tal.txt", False), ("foto-tal.txt", True)):
        if not os.path.exists(filnamn):
            continue
        for rad in io.open(filnamn, encoding="utf-8"):
            delar = rad.split()
            if not delar:
                continue
            if styckvis:
                # "<kort> <tal> <skäl>" — talet gäller BARA sin egen produkt.
                if len(delar) >= 2 and delar[0] == kort:
                    ut.add(delar[1].replace(",", "."))
            else:
                ut.add(delar[0].replace(",", "."))
    return ut


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
        for x in sorted(tal(text) - tal(kalltext) - kvitterade_tal(i)):
            print(f"  {i}: [SIFFRA UTAN KÄLLA] {x!r}"); fynd += 1
        for ch in sorted(set(text)):
            if ord(ch) > 127 and ch not in TILLATNA_TECKEN:
                print(f"  {i}: [OVÄNTAT TECKEN] {ch!r} U+{ord(ch):04X} "
                      f"{unicodedata.name(ch, '?')}"); fynd += 1
        if len(t) > MAX_TITEL:
            print(f"  {i}: [TITEL FÖR LÅNG] {len(t)} tecken > {MAX_TITEL}"); fynd += 1
        if len(d) > MAX_DESC:
            print(f"  {i}: [BESKRIVNING FÖR LÅNG] {len(d)} tecken > {MAX_DESC}"); fynd += 1
        if not t.endswith(" | Fyndplats"):
            print(f"  {i}: [SAKNAR SUFFIX] titeln slutar inte på ' | Fyndplats'"); fynd += 1
    fynd += _grinda_namn()
    print(f"\nGRIND: {fynd} fynd i {len(rader)} rader")
    return 1 if fynd else 0


# ☠️ WIX KAPAR PRODUKTNAMNET VID 80 TECKEN — och avvisar hela PATCHen på 81:
#
#   product is invalid: `-- name has size 81, expected 80 or less
#
# Uppmätt i runda H2, där tre av åtta namn låg över. Felet är dyrare än det
# ser ut: skrivningen görs i samma anrop som beskrivningen och SEO-taggarna, så
# en enda för lång rubrik fäller ALLT för den produkten. Utan den här grinden
# syns det först när återläsningen visar den tyska texten kvar.
#
# ⚠️ RÄKNA TECKEN, INTE BYTES. Kontrollen gjordes först med `${#n}` i bash,
# som räknar bytes: å/ä/ö är två och tankstreck tre. Ett namn på 78 tecken
# rapporterades som 85 och ett på 81 som 87 — talen var fel åt båda hållen
# samtidigt, alltså oanvändbara.
MAX_NAMN = 80


def _grinda_namn(fil="namn.tsv"):
    """Rundans namn.tsv är VALFRI: äldre rundor har ingen."""
    if not os.path.exists(fil):
        return 0
    fynd = 0
    for rad in open(fil, encoding="utf-8"):
        rad = rad.rstrip("\n")
        if not rad.strip():
            continue
        delar = rad.split("\t")
        kort, namn = delar[0], delar[-1]
        if len(namn) > MAX_NAMN:
            print(f"  {kort}: [NAMN FÖR LÅNGT] {len(namn)} tecken > {MAX_NAMN} "
                  f"— Wix avvisar hela skrivningen")
            fynd += 1
    return fynd


if __name__ == "__main__":
    sys.exit(main(sys.argv[1] if len(sys.argv) > 1 else "seo.tsv"))
