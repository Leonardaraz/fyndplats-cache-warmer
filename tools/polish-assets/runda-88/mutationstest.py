# -*- coding: utf-8 -*-
"""Runda 88 — mutationstest.

☠️ EN GRIND SOM ALDRIG FÄLLER BEVISAR INGENTING. Varje mutation nedan är ett
   fel som VERKLIGEN kunde ha skrivits — de flesta är leverantörens egna
   påståenden, ordagrant översatta. Testet fäller om linten släpper igenom
   en enda av dem.
"""
import io
import os
import re
import subprocess
import sys
import tempfile

HAR = os.path.dirname(os.path.abspath(__file__))
KALLA = io.open(os.path.join(HAR, "texter.py"), encoding="utf-8").read()

# (namn, sök, ersätt, vad linten MÅSTE säga)
MUTATIONER = [
    # ── Rundans kärna: maxlasten och familjepåståendet ────────────────────
    ("A lånar modell I:s maxlast",
     "Maxlast: 50 kg", "Maxlast: 100 kg", "främmande viktangivelse: 100 kg"),
    ("A säljs på hela familjen, som tyskan gör",
     "Vem den är byggd för", "En sparkcykel för hela familjen",
     "familje-/vuxenpåstående"),
    ("A säljs på vägen till jobbet, som tyskan gör",
     "Formen är lånad från BMX-cykeln",
     "Den tar dig till jobbet på tio minuter", "till jobbet"),
    ("B påstår att föräldrar kan åka",
     "Det är ett barns vikt, inte en ", "Föräldrar kan också åka. Inte en ",
     "familje-/vuxenpåstående"),
    # ── Åldern och längden lånas mellan modellerna ────────────────────────
    ("B lånar A:s åldersspann",
     "Rekommenderad ålder: 6–12 år", "Rekommenderad ålder: 5–12 år",
     "ANNAN modells åldersspann"),
    ("A får B:s längdspann",
     "Rekommenderad ålder: 5–12 år",
     "Rekommenderad ålder: 5–12 år, längd 100–150 cm",
     "ANNAN modells längdspann"),
    # ── Bromsen ───────────────────────────────────────────────────────────
    ("A utlovar broms på båda hjulen",
     "Handbroms på bakhjulet, manövrerad från styret",
     "Bromsar på båda hjulen, manövrerade från styret",
     "två bromsar utlovade"),
    ("I tappar sin andra broms",
     "Bromsar: en på framhjulet och en på bakhjulet",
     "Broms: en på bakhjulet",
     "nämner ingen frambroms"),
    # ── Korgen ────────────────────────────────────────────────────────────
    ("B utlovar en korg den inte har",
     "Stöd att parkera på", "Stöd att parkera på och korg fram",
     "korg/skärm på en modell som saknar den"),
    # ── Steg 2-grinden: fordonsklass, standard, hjälm ──────────────────────
    ("elsparkcykelns regler smyger in",
     "Ett barn på sparkcykel räknas som gående i trafiken",
     "En elsparkcykel får inte köras på trottoaren",
     "elfordonsord"),
    ("en standard åberopas",
     "Ram: stål", "Ram: stål, tillverkad enligt EN 14619",
     "obelagd standard"),
    ("produkten kallas certifierad",
     "Material: stål, TPR och EVA", "Material: certifierad stål, TPR och EVA",
     "obelagd standard"),
    ("hjälm framställs som lagkrav",
     "Något lagkrav på hjälm finns det inte för",
     "Hjälm är lagkrav för barn under 15 år, precis som för",
     "hjälm framställd som lagkrav"),
    # ── Talgrinden ────────────────────────────────────────────────────────
    ("ett påhittat mått smyger in",
     "Styrbredd: 52 cm", "Styrbredd: 47 cm", "okänt tal"),
    ("fotplattan blir längre än den är",
     "Fotplatta: 37 cm lång", "Fotplatta: 42 cm lång", "okänt tal"),
    # ── Husets delade regler ──────────────────────────────────────────────
    ("leverantören omnämns",
     "Maxlasten är <strong>50 kg</strong>, och det talet",
     "Leverantören anger 50 kg, och det talet", "leverantör"),
    ("ett husmärke smyger in",
     "Blå ram, svarta hjul och ett styre med tvärstag",
     "HOMCOM-ram, svarta hjul och ett styre med tvärstag", "homcom"),
    ("ett landsnamn smyger in",
     "Formen är lånad från BMX-cykeln", "Formen kommer från Tyskland",
     "tyskland"),
    ("tysk text överlever",
     "Halkfri fotplatta, 32 × 11 cm", "Halkfritt Trittbrett, 32 × 11 cm",
     "trittbrett"),
    ("intern jargong i kundtext",
     "Sju kilo. Ett barn på åtta år bär den uppför en trappa",
     "Sju kilo. Den poleras i rundan efter denna", "intern jargong"),
    ("produktfamiljen kallas familjen igen",
     "Grönt är den ovanligaste av de tre färgerna",
     "Grönt är den ovanligaste färgen i familjen", "intern jargong"),
    ("ett varningsblock byggs",
     "<p><strong>Egenskaper</strong></p>",
     "<p><strong>Bra att veta</strong></p>", "varningsblock"),
    ("I:s spec säger en broms medan FAQ:n säger två",
     "Bromsar: en på framhjulet och en på bakhjulet",
     "Broms: en på bakhjulet", "nämner ingen frambroms"),
    # ☠️ Den REALISTISKA mutationen är inte att skriva om hjälmrådet utan
    #    att koppla bort det — precis som det var dött i första utkastet.
    ("SKYDD kopplas bort från modell A och blir död kod igen",
     "        GAENDE,\n        SKYDD,\n    ])\n\n\nA_FAQ_GEMENSAM",
     "        GAENDE,\n    ])\n\n\nA_FAQ_GEMENSAM",
     "hjälmrådet saknas helt"),
    ("en flikrubrik skrivs om till naturligare svenska",
     "<h2>Tekniska specifikationer</h2>", "<h2>Specifikationer</h2>",
     "flikrubriken 'Tekniska specifikationer' saknas"),
    # ── Modell I:s ohärledda hjulstorlek ──────────────────────────────────
    # Precis felet som stod i namnet till 2026-09-07: "16 tum" är gissat ur
    # den PUBLICERADE syskonsidans spec. Måttritningen anger ingen
    # hjuldiameter, och bilderna visar dessutom ett bakhjul som ser större
    # ut än framhjulet — samma 16/12-uppdelning som syskonet.
    ("modell I får tillbaka sin gissade hjulstorlek i namnet",
     '"name": "Sparkcykel barn 139 cm med korg och stänkskärmar, blå',
     '"name": "Sparkcykel barn 16 tum med korg och stänkskärmar, blå',
     "ohärledd hjulstorlek i namnet"),
    ("modell I påstår hjulstorleken i brödtexten",
     "Hjul: stora gummidäck med mönstrad slitbana",
     "Hjul: 16 tum, gummidäck med mönstrad slitbana",
     "ohärledd hjulstorlek i egen text"),
    # ── SKU:ns särskiljande del ───────────────────────────────────────────
    # Den gamla grinden tog sluggens SISTA ord. Modell I:s sluggar slutar på
    # `stankskarmar`, som BÅDA bär — så en SKU utan färg hade sluppit förbi.
    ("modell I:s båda SKU:er tappar färgen och blir omöjliga att skilja åt",
     '"sku": "FP-sparkcykel-barn-rosa"', '"sku": "FP-sparkcykel-barn-korg"',
     "bär ingen av sluggens särskiljande delar"),
]


def kor(kalla):
    with tempfile.TemporaryDirectory() as d:
        for f in ("lint.py", "grindar.py"):
            src = os.path.join(HAR, f)
            if not os.path.exists(src):
                src = os.path.join(os.path.dirname(HAR), f)
            io.open(os.path.join(d, f), "w", encoding="utf-8").write(
                io.open(src, encoding="utf-8").read())
        io.open(os.path.join(d, "texter.py"), "w", encoding="utf-8").write(kalla)
        p = subprocess.run([sys.executable, "lint.py"], cwd=d,
                           capture_output=True, text=True)
        return p.returncode, p.stdout + p.stderr


kod, ut = kor(KALLA)
if kod != 0:
    raise SystemExit("OMUTERAD KÄLLA FÄLLER REDAN:\n" + ut)

fangade, missade = 0, []
for namn, sok, ers, vantat in MUTATIONER:
    if KALLA.count(sok) < 1:
        missade.append("%s — söksträngen finns inte: %r" % (namn, sok[:50]))
        continue
    kod, ut = kor(KALLA.replace(sok, ers, 1))
    if kod == 0:
        missade.append("%s — SLAPP IGENOM" % namn)
    elif vantat.lower() not in ut.lower():
        missade.append("%s — fälldes på FEL regel:\n      %s"
                       % (namn, "\n      ".join(
                           l for l in ut.splitlines() if l.startswith("FEL"))[:300]))
    else:
        fangade += 1

for m in missade:
    print("MISS:", m)
print("\nMutationstest: %d/%d fångade." % (fangade, len(MUTATIONER)))
raise SystemExit(1 if missade else 0)
