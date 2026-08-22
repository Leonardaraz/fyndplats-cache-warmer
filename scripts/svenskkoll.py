#!/usr/bin/env python3
"""Stavningsgrind for svensk produktcopy innan den PATCHas till Wix.

Bakgrund (2026-08-14): fyra stavfel gick live under en och samma eftermiddag --
"instlangd", "hopskattning", "sklapet", "slat vagg". Inget av dem var ett
felstavat ord i vanlig mening. Alla uppstod for att texten skrevs med escapade
tecken i en JSON-body (`hops\\u00e4ttning`), och ett ord skrivet sa gar inte att
lasa igenom. Genomlasning bet darfor inte -- det fanns ingenting lasbart att
lasa.

Grinden gor tva saker:

1. Avkodar `\\uXXXX` innan kontrollen, sa den kan koras pa bodyn EXAKT som den
   skickas. Forsta forsoket var i stallet en regel om att aldrig escapa -- den
   holl inte ens ett anrop efter att den skrivits ned, sa fixen fick flyttas
   fran disciplin till mekanik.
2. Jamfor varje ord mot katalogens egen vokabular -- ord som inte forekommer pa
   nagon av de publicerade produktsidorna flaggas. Katalogen ar ett battre facit
   for produktsvenska an en generisk ordlista, och den kanner igen "hopsattning"
   men aldrig "hopskattning".

Vokabularen byggs en gang fran sitemapen och cachas. Trafflistan ar radgivande:
ett nytt korrekt ord (en ny produkttyp, ett matt) flaggas ocksa. Poangen ar att
tvinga fram en blick pa varje ord som ar nytt for katalogen.

    python3 scripts/svenskkoll.py beskrivning.html
    cat beskrivning.html | python3 scripts/svenskkoll.py -

Avslutar med kod 1 om nagot flaggas.
"""

import os
import re
import subprocess
import sys

CACHE = "/tmp/fyndplats-vokabular.txt"
SITEMAP = "https://www.fyndplats.se/sitemap.xml"
SIDOR = 1000  # hela katalogen -- delmangd ger for manga falsklarm

ORD = re.compile(r"[A-Za-zÅÄÖåäöÉéÜü][A-Za-zÅÄÖåäöÉéÜü-]*")
# matt, modellbeteckningar, versaler och JSON-nycklar (camelCase) ska inte flaggas
SKIP = re.compile(r"^[a-zåäö]?\d|^\d|^[A-ZÅÄÖ]{2,}$|^[a-z]+[A-Z]")


def _hamta(url, timeout=40):
    r = subprocess.run(
        ["curl", "-sS", "--max-time", str(timeout), "--compressed", url],
        capture_output=True, text=True,
    )
    return r.stdout


def bygg_vokabular(sokvag=CACHE, antal=SIDOR):
    """Skrapa katalogens produktsidor och spara alla ord som forekommer."""
    sm = _hamta(SITEMAP, timeout=90)
    urls = re.findall(r"<loc>(https://www\.fyndplats\.se/produkt/[^<]+)</loc>", sm)[:antal]
    if not urls:
        raise SystemExit("Kunde inte lasa sitemapen -- ingen vokabular byggd.")
    ord_ = set()
    for u in urls:
        text = re.sub(r"<[^>]*>", " ", _hamta(u))
        ord_.update(m.group(0).lower() for m in ORD.finditer(text))
    with open(sokvag, "w", encoding="utf-8") as f:
        f.write("\n".join(sorted(ord_)))
    return ord_


def vokabular(sokvag=CACHE):
    if os.path.exists(sokvag) and os.path.getsize(sokvag) > 10000:
        with open(sokvag, encoding="utf-8") as f:
            return set(f.read().split())
    return bygg_vokabular(sokvag)


def avkoda(text):
    r"""Gor `hopsättning` lasbart som `hopsattning` innan kontrollen.

    Grinden maste kunna kora pa bodyn EXAKT som den skickas. Att i stallet
    vagra escaper visade sig vara en for svag fix: regeln "skriv bokstavligt"
    holl inte ens ett anrop efter att den skrivits ned. Avkodning gor grinden
    oberoende av hur texten rakade forfattas.
    """
    return re.sub(
        r"\\u([0-9a-fA-F]{4})",
        lambda m: chr(int(m.group(1), 16)),
        text,
    )


def kolla(text, vok):
    """Returnera (antal avkodade escaper, okanda ord) for en text."""
    escaper = len(re.findall(r"\\u[0-9a-fA-F]{4}", text))
    text = avkoda(text)
    ren = re.sub(r"<[^>]*>", " ", text)
    okanda = []
    sedda = set()
    for m in ORD.finditer(ren):
        o = m.group(0)
        låg = o.lower()
        if låg in vok or låg in sedda or SKIP.match(o) or len(låg) < 3:
            continue
        sedda.add(låg)
        okanda.append(o)
    return escaper, okanda


def main():
    if len(sys.argv) < 2:
        print(__doc__.strip().split("\n\n")[-2])
        return 2
    kalla = sys.argv[1]
    text = sys.stdin.read() if kalla == "-" else open(kalla, encoding="utf-8").read()

    vok = vokabular()
    escaper, okanda = kolla(text, vok)

    if escaper:
        print("(avkodade %d escapade tecken innan kontrollen)" % escaper)
    if okanda:
        print("KOLLA: ord som inte finns pa nagon publicerad produktsida (%d st):" % len(okanda))
        for o in okanda:
            print("       " + o)
        return 1
    print("OK: alla ord finns i katalogen (%d ord i vokabularen)." % len(vok))
    return 0


if __name__ == "__main__":
    sys.exit(main())
