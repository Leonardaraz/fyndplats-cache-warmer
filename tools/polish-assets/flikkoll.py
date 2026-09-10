"""Flikraden på PUBLICERADE sidor — Steg 14, körbar mot vilken runda som helst.

    python3 flikkoll.py <pid>=<slug> [<pid>=<slug> ...]

Regeln bor i `grindar.flikfel`, inte här: butikens flikdelare är en allowlist,
och en runda som bar sin egen kopia av listan hade glidit isär vid nästa
rubrik butiken lägger till. Den här filen är bara hämtningen och utskriften.

⚠️ Ett rött utfall ska verifieras mot WIX innan det tros om sidan. `hamta_isr`
   väntar 20 sekunder på ombyggnaden, och det räcker inte alltid direkt efter
   en skrivning — uppmätt 2026-09-10 på `ad390a36`, som föll som SAKNAS medan
   Wix bar rätt text och samma URL svarade korrekt 25 sekunder senare.
"""
import sys

from grindar import flikfel, flikrad, hamta_isr

fel_totalt = 0
sidor = [a.split("=", 1) for a in sys.argv[1:]]
for pid, slug in sidor:
    html, _ = hamta_isr(f"https://www.fyndplats.se/produkt/{slug}")
    fel = flikfel(html)
    fel_totalt += len(fel)
    print(f"{'FEL ' if fel else 'OK  '}{pid} {slug}  flikar={flikrad(html)}")
    for f in fel:
        print(f"      ☠️ {f}")

print(f"\n{len(sidor)} sidor, {fel_totalt} fel")
sys.exit(1 if fel_totalt else 0)
