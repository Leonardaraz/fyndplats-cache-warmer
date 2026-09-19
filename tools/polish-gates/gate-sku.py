#!/usr/bin/env python3
"""Filgrind för `sku.tsv` — längd, form, dubbletter och täckning.

☠️ VARFÖR DEN FINNS: WIX TAKAR VARIANT-SKU:N PÅ 40 TECKEN, och en för lång
SKU faller inte snällt. Uppmätt 2026-09-08 i runda K8:

    sku has size 41, expected 40 or less
    violatedRule: MAX_LENGTH   threshold: 40

Anropet bar TVÅ produkter i en loop. Den första skrevs och publicerades; den
andra föll på valideringen. En runda som inte läser felet lämnar alltså hälften
publicerad och hälften som tyskt utkast — och 400:an ser ut som ett engångsfel
i ett svar man ändå tänkte kasta. Marginalen är dessutom liten i praktiken:
den längsta SKU:n som gick igenom i samma runda var 39 tecken.

☠️ OCH DUBBLETTER INOM RUNDAN. Importen härleder SKU:n ur den tyska titelns
FÖRSTA ORD, så produkter vars titlar börjar likadant får samma sträng. Runda K8
mätte sju av åtta produkter på TVÅ tyska SKU:er (`FP-burostuhl-ergonomischer`
× 4, `FP-burostuhl` × 3). Poängen med steget är att ge varje produkt en EGEN
identitet; två rader med samma svenska SKU hade återinfört exakt det fel de
skrevs för att laga.

⚠️ Grinden kan bara se rundans EGNA rader. Om en SKU krockar med en produkt
utanför rundan syns det bara i `las`-svaren — läs dem mot varandra, som
runbooken säger. Det är ingen brist i grinden utan i vad en fil kan veta:
`variantsInfo` ligger ALDRIG i sökprojektionen, så en katalogomfattande
SKU-revision är ett GET-anrop per produkt.

ANVÄNDNING (från rundans katalog):  python3 ../../polish-gates/gate-sku.py
  sku.tsv   "kort  FP-svensk-sku", en rad per produkt
  ids.tsv   VALFRI: används för att fälla en produkt som saknar SKU-rad
"""
import os
import re
import sys

MAX = 40                       # Wix MAX_LENGTH, uppmätt — inte antaget.
FORM = re.compile(r"^FP-[a-z0-9]+(?:-[a-z0-9]+)*$")

if not os.path.exists("sku.tsv"):
    raise SystemExit("  [AVBRYT] sku.tsv saknas — kör från rundans katalog")

rader = [r.rstrip("\n") for r in open("sku.tsv", encoding="utf-8") if r.strip()]
fynd = 0
sedda = {}

for nr, rad in enumerate(rader, 1):
    delar = rad.split("\t")
    if len(delar) != 2:
        print(f"sku.tsv:{nr}  [FORM] {len(delar)} kolumner, väntade 2")
        fynd += 1
        continue
    kort, sku = delar

    # ☠️ Längden mäts i TECKEN, som Wix gör. Alla husets SKU:er är ASCII, men
    # mät på strängen och inte på bytes — en å i en framtida SKU är ETT tecken
    # för Wix och två för `wc -c`.
    if len(sku) > MAX:
        print(f"sku.tsv:{nr}  [FÖR LÅNG] {len(sku)} tecken > {MAX}: {sku}  ({kort})")
        fynd += 1

    if not FORM.match(sku):
        print(f"sku.tsv:{nr}  [FORM] {sku!r} — väntade FP- följt av gemener, "
              f"siffror och bindestreck  ({kort})")
        fynd += 1

    if sku in sedda:
        print(f"sku.tsv:{nr}  [DUBBLETT] {sku!r} används av både "
              f"{sedda[sku]} och {kort}")
        fynd += 1
    else:
        sedda[sku] = kort

# En produkt utan SKU-rad blir tyst kvar med sin TYSKA SKU. Steget räknas som
# gjort och ingenting säger emot — samma klass som alt-steget som saknades helt
# i runda J2.
if os.path.exists("ids.tsv"):
    har = {r.split("\t")[0] for r in rader if "\t" in r}
    for r in open("ids.tsv", encoding="utf-8"):
        if r.strip():
            kort = r.split("\t")[0]
            if kort not in har:
                print(f"  [SAKNAS] {kort} finns i ids.tsv men har ingen rad i sku.tsv")
                fynd += 1

langst = max((len(s) for s in sedda), default=0)
print(f"\nGRIND: {fynd} fynd i {len(rader)} rader "
      f"(längsta {langst} av {MAX} tecken)")
sys.exit(1 if fynd else 0)
