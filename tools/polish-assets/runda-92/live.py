# -*- coding: utf-8 -*-
"""Runda 92 Steg 12/14: läs sidorna som kund.

☠️ HÄMTA TVÅ GÅNGER, LITA PÅ DEN ANDRA. ISR svarar stale-while-revalidate:
   `x-vercel-cache: HIT` på ett utgånget svar betyder att du fick det GAMLA
   innehållet och att ombyggnaden startade i bakgrunden. Runda 60 fällde åtta
   korrekta sidor på just det.

☠️ MÄT MOT EN KONTROLLSIDA, INTE MOT EN ORDLISTA. Första utkastet av den här
   grinden fällde 7 av 7 sidor på tre saker som ALLA fanns på en publicerad
   sida jag aldrig rört:
     · "Skickas från EU-lager" — sajtens EU-ribbon, och enligt husets regel
       den enda plats där avsändarlandet FÅR synas.
     · `688-5623` och fyra tal till i formen \\d{3}-\\d{3}\\w — sajtens egen
       Organization-JSON-LD (en Maps-URL), inte ett artikelnummer.
     · en tom kropp — en enda misslyckad huvud/kropp-delning; sidan svarade
       200 med 145 kB vid omhämtning.
   Ett larm som fyrar på varje korrekt sida lär mottagaren att sluta läsa.
   Grinden jämför därför mot en KONTROLLSIDA och rapporterar bara det som
   finns på MIN sida men inte på kontrollens.
"""
import json
import re
import subprocess
import sys

BAS = "https://www.fyndplats.se/produkt/"
KONTROLL = "sparkcykel-barn-12-tum-svart"     # publicerad, orörd av den här rundan
plan = json.load(open("skrivplan.json"))


def hamta(slug):
    url = BAS + slug
    subprocess.run(["curl", "-sS", "-o", "/dev/null", url], timeout=90)  # beställer ombyggnad
    r = subprocess.run(["curl", "-sS", "-w", "\n@@%{http_code}", url],
                       capture_output=True, text=True, timeout=90)
    h, _, kod = r.stdout.rpartition("\n@@")
    return h, kod.strip()


def text(h):
    t = re.sub(r"<script[^>]*>.*?</script>", " ", h, flags=re.S)
    return re.sub(r"\s+", " ", re.sub(r"<[^>]+>", " ", t))


TYSKA = re.compile(r"(?<![\wåäö])(Kinderroller|Tretroller|Cityroller|Kinderscooter|"
                   r"Lenker|Bremse|Belastbarkeit|Gesamtma|Jahre|Zoll|Farbe|Stahl|"
                   r"Kunststoff|erforderlich|verstellbar|Beschreibung|Lieferumfang|"
                   r"Empfohlenes|Gewichtsgrenze)(?![\wåäö])")
LACKOR = re.compile(r"rostfri|Artikelnummer|Modellreferens|HOMCOM|Outsunny|PawHut|"
                    r"Aiyaplay|Aosom|elsparkcykel|[0-9]{3}-[0-9]{3}[A-Z]{2}")

k_html, k_kod = hamta(KONTROLL)
k_txt = text(k_html)
k_lackor = set(m.group(0) for m in LACKOR.finditer(k_txt))
print("Kontrollsida %s: %s, %d kB, %d kromträffar att bortse från\n"
      % (KONTROLL, k_kod, len(k_html) // 1000, len(k_lackor)))

fel = 0
for pid, p in plan.items():
    html, kod = hamta(p["slug"])
    t = text(html)
    problem = []
    if kod != "200":
        problem.append("status %s" % kod)
    for n in [p["namn"].split(" – ")[0], p["titel"].split(" – ")[0]]:
        if n not in t:
            problem.append("saknar %r" % n[:38])
    ty = TYSKA.search(t)
    if ty:
        problem.append("TYSKT ORD: %r" % ty.group(0))
    # ☠️ Bara det som INTE finns på kontrollsidan räknas som min läcka.
    for m in LACKOR.finditer(t):
        if m.group(0) not in k_lackor:
            problem.append("LÄCKA: %r" % m.group(0))
            break
    kort = "Faktakort" in t
    if problem:
        fel += 1
    print("%-9s %-4s %5d kB  kort:%-3s %s" % (
        pid, kod, len(html) // 1000, "ja" if kort else "NEJ",
        "OK" if not problem else " | ".join(problem)))

# ⚠️ KORSLÄNKEN MÅSTE PEKA PÅ EN SIDA SOM FINNS. Alla fyra länkar till den
#    publicerade lågstyrda modellen; en död länk är en 404 mitt i brödtexten.
LANK = "sparkcykel-barn-rosa-16-tum-luftdack"
_, lkod = hamta(LANK)
print("\nKorslänk %s: %s" % (LANK, lkod))
_, l2 = hamta("sparkcykel-barn-143-cm-16-tum-svart")
print("Korslänk sparkcykel-barn-143-cm-16-tum-svart: %s" % l2)
if l2 != "200":
    fel += 1
    print("☠️ ANDRA KORSLÄNKEN ÄR DÖD")
if lkod != "200":
    fel += 1
    print("☠️ KORSLÄNKEN ÄR DÖD")

print("\n%d av %d sidor med problem." % (fel, len(plan)))
sys.exit(1 if fel else 0)
