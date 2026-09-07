#!/usr/bin/env python3
"""Filgrind för korslänkarnas MÅL — den enda grind som måste vara online.

☠️ VARFÖR DEN FINNS. `gate.py` kontrollerar att en länk har rätt FORM
(absolut mot www.fyndplats.se — en relativ blir `https:/produkt/…` när Wix
sparar den). Den kan inte veta om slugen finns. Runda K2 skrev två länkar ur
minnet — `ergonomisk-kontorsstol-nackstod-natrygg` och
`kontorsstol-i-nat-med-fotstod` — och BÅDA gav 404. De riktiga heter
`ergonomisk-kontorsstol-nackstod` och `kontorsstol-nat-fotstod-135-grader`.

En slug är en ADRESS, inte ett påstående: den går inte att härleda ur
produktnamnet, och den enda kontrollen som duger är att hämta den. Samma
klass som husets övriga: ett svar utan fel är inget kvitto — här är felet
att INGEN frågade.

⚠️ Grinden hör hemma FÖRE skrivningen. `livegrind.py` läser den publicerade
sidan och skulle hitta samma sak, men då ligger den döda länken redan ute.

ANVÄNDNING (från rundans katalog):  python3 ../../polish-gates/gate-lankar.py
  <kort>.html   texterna; alla https://www.fyndplats.se/produkt/<slug> hämtas
"""
import glob
import os
import re
import subprocess
import sys

BAS = "https://www.fyndplats.se/produkt/"
MONSTER = re.compile(r'href="' + re.escape(BAS) + r'([a-z0-9-]+)"')


def kod(slug):
    """HTTP-status för en produktsida, eller 000 när hämtningen inte gick fram."""
    try:
        r = subprocess.run(
            ["curl", "-sS", "-o", "/dev/null", "-w", "%{http_code}",
             "--max-time", "20", BAS + slug],
            capture_output=True, text=True, timeout=40)
        return r.stdout.strip() or "000"
    except Exception:
        return "000"


def main():
    filer = sorted(glob.glob("*.html"))
    if not filer:
        raise SystemExit("  [AVBRYT] inga *.html — kör från rundans katalog")

    # Rundans egna slugar är ännu inte publicerade när grinden körs. De står i
    # slugs.txt och ska därför INTE hämtas; de kontrolleras av livegrind efteråt.
    egna = set()
    if os.path.exists("slugs.txt"):
        egna = {r.split()[1] for r in open("slugs.txt", encoding="utf-8") if r.strip()}

    sedda, fynd, egna_traffar = {}, 0, 0
    for f in filer:
        kort = os.path.basename(f)[:-5]
        for slug in MONSTER.findall(open(f, encoding="utf-8").read()):
            if slug in egna:
                egna_traffar += 1
                continue
            if slug not in sedda:
                sedda[slug] = kod(slug)
            if sedda[slug] != "200":
                print(f"  {kort}: [DÖD LÄNK] {slug} svarar {sedda[slug]}")
                fynd += 1

    inom = f", {egna_traffar} länk(ar) inom rundan hoppades över" if egna_traffar else ""
    print(f"\nGRIND: {fynd} fynd, {len(sedda)} unika mål hämtade{inom}")
    sys.exit(1 if fynd else 0)


if __name__ == "__main__":
    main()
