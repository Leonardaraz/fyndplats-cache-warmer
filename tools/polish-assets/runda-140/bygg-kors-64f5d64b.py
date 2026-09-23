# -*- coding: utf-8 -*-
"""#480 — korslank pa den PUBLICERADE grannen 64f5d64b.

Grupp A:s tre nya farger lankar alla hit ("samma soffa i morkgratt"). Sidan
lankar inte tillbaka: den har inget "Passar inte den har?"-block alls. Det ar
exakt #480:s monster, och STEG1-DUBBLETT.md skrev ut kravet redan i Steg 1.

☠️ SIDAN AR RUNDANS KONTROLLSIDA i live-grinden. Allt som skrivs har
   SUBTRAHERAS fran rundans tretton sidor som "butikens". Ett fynd i den har
   texten hade alltsa maskerat samma fynd pa tretton sidor. Blocket grindas
   darfor FORE skrivningen, och live-grinden kors OM efterat.

☠️ Den gamla texten passerar mina hander (Wix ersatter hela faltet), och en
   aterlasning mot samma handavskrift bevisar ingenting — #485. Avskriften ar
   darfor grindad mot den RENDERADE sidan: 31 av 31 element ordagrant.
"""
import io, json, re, sys

sys.path.insert(0, "..")
import grind, grindar, texter                                     # noqa: E402

SP = ("/tmp/claude-0/-home-user-fyndplats-cache-warmer/"
      "eb17b2de-4de7-58dd-bb95-41c9768b38cf/scratchpad/")
REVISION = "13"
BAS = "https://www.fyndplats.se/produkt/"
LANKAR = [("01fcdf1d", "ljusgrått"), ("bb3cd4ed", "grönt"), ("881540a6", "blått")]
ANKARE = "<h2>Tekniska specifikationer</h2>"

block = "<h2>%s</h2><p>%s %s.</p>" % (
    texter.KORS_INGRESS["01fcdf1d"],
    texter.KORS_TEXT["01fcdf1d"],
    ", ".join('<a href="%s%s">samma soffa i %s</a>' % (BAS, texter.SLUG[p], f)
              for p, f in LANKAR))

beskr = io.open(SP + "64f5d64b-fore.html", encoding="utf-8").read().rstrip("\n")

fel = []
if beskr.count(ANKARE) != 1:
    fel.append("ankaret finns %d ggr, vantade 1" % beskr.count(ANKARE))
if "Passar inte" in beskr:
    fel.append("sidan bar REDAN ett korslankblock")
for pid, _f in LANKAR:
    if texter.SLUG[pid] in beskr:
        fel.append("sluggen %s star redan i texten" % texter.SLUG[pid])

for monster, skal in grind.FORBJUDET:
    if monster.search(block):
        fel.append("FORBJUDET traffar blocket: %s (%s)" % (skal, monster.pattern))

# ☠️ Den STARKASTE grinden: blocket far inte innehalla ett enda ord som inte
#    REDAN passerat rundans fulla grind pa en av de fjorton sidorna. Boilerplaten
#    ar texter.KORS_INGRESS/KORS_TEXT ordagrant och fargorden star i grupp A:s
#    egna korslankar — alltsa ar hela blocket redan granskat text.
gammalt = " ".join(texter.bygg(p) for p in texter.SLUG)
for ord_ in re.findall(r"[A-Za-zÅÄÖåäö]+", grindar.strip_taggar(block)):
    if ord_ not in gammalt:
        fel.append("ORD som aldrig passerat rundans grind: %r" % ord_)
for tecken in grindar.homoglyfer(block):
    fel.append("osynligt/homoglyf: %r" % (tecken,))
for artnr in grindar.ARTNR.findall(block):
    fel.append("ARTIKELNUMMER i blocket: %r" % (artnr,))

ny = beskr.replace(ANKARE, block + ANKARE)
if len(ny) - len(beskr) != len(block):
    fel.append("langden andrades med %d, blocket ar %d"
               % (len(ny) - len(beskr), len(block)))
if beskr not in ny.replace(block, "", 1):
    fel.append("den gamla texten star inte kvar ordagrant")
if ny.index(block) >= ny.index(ANKARE):
    fel.append("blocket hamnade EFTER ankaret")

if fel:
    print("GRINDEN FALLER — inget skrivet:")
    for f in fel:
        print("  ☠️", f)
    raise SystemExit(1)

json.dump({"product": {"revision": REVISION, "plainDescription": ny},
           "fieldMask": ["plainDescription"]},
          io.open("kors-64f5d64b.json", "w", encoding="utf-8"),
          ensure_ascii=False)
print("GRINDEN GRON — kors-64f5d64b.json skriven")
print("  revision    %s" % REVISION)
print("  blocket     %d tecken" % len(block))
print("  beskrivning %d → %d tecken" % (len(beskr), len(ny)))
print()
print(block)
