# -*- coding: utf-8 -*-
"""Runda 89 — mutationstest.

☠️ EN GRIND SOM ALDRIG FÄLLER BEVISAR INGENTING. Varje mutation nedan är ett
   fel som VERKLIGEN kunde ha skrivits. Tre av dem är rundans signaturfel:

   1. FOTBOLLSMÖNSTRET. Modell F:s feedtext lovar hjul i "Fußballdesign".
      Tio bilder granskade i Steg 4 — ingen visar ett bollmönster. Det är
      rundans enda påstående där leverantören lovar något bilden motsäger.
   2. LUFTDÄCKEN, INVERTERAT MOT RUNDA 88. Där var hjulen massiv EVA och
      rådet "inget att pumpa". Här har alla sex luftdäck. Ett kopierat
      skötselråd gör att kunden aldrig pumpar ett däck som går platt.
   3. STYRHÖJDEN. A2:s LÄGSTA läge (92 cm) ligger ÖVER D:s HÖGSTA (80 cm).
      Ett lånat spann flyttar produkten en hel storleksklass, och båda
      modellerna anges "från 5 år" — åldern kan alltså inte avslöja bytet.
"""
import io
import os
import subprocess
import sys
import tempfile

HAR = os.path.dirname(os.path.abspath(__file__))
KALLA = io.open(os.path.join(HAR, "texter.py"), encoding="utf-8").read()

# (namn, sök, ersätt, vad linten MÅSTE säga)
MUTATIONER = [
    # ── Signatur 1: fotbollsmönstret ──────────────────────────────────────
    ("modell F får tillbaka leverantörens fotbollshjul i punktlistan",
     '    "Uppblåsbara gummidäck på ekerfälg",\n'
     '    "Höjdjusterbart styre, 88 till 94 cm över marken",',
     '    "Uppblåsbara gummidäck med fotbollsmönster",\n'
     '    "Höjdjusterbart styre, 88 till 94 cm över marken",',
     "OBELAGT FOTBOLLSMÖNSTER"),
    ("fotbollen smyger in som ett bollmönster i brödtexten",
     "Framhjulet tar stöten först, och Ø41 cm rullar över en kant som ett ",
     "Däcken har ett bollmönster i slitbanan. Ø41 cm rullar över en kant som ett ",
     "OBELAGT FOTBOLLSMÖNSTER"),

    # ── Signatur 2: luftdäcken blir massiva ───────────────────────────────
    ("runda 88:s skötselråd kopieras rakt in i LUFT",
     "LUFT = (\"Känn på däcken innan säsongens första tur.",
     "LUFT = (\"Hjulen är punkteringsfria och har ingenting att pumpa.",
     "MASSIVT-HJUL-PÅSTÅENDE"),
    ("däcken kallas EVA, som runda 88:s var",
     '"Hjul: Ø12 tum, uppblåsbara gummidäck"',
     '"Hjul: Ø12 tum, EVA-hjul utan innerslang"',
     "MASSIVT-HJUL-PÅSTÅENDE"),
    ("kontrastmeningen tappar sitt 'inte' och blir ett påstående om varan",
     "Ja. Det är uppblåsbara gummidäck, inte massiva plasthjul, så de tappar ",
     "Ja. Det är gummidäck med massiva plasthjul, så de tappar ",
     "UTAN kontrastmarkör"),
    ("luftdäcken nämns inte alls när skötselblocket kopplas bort",
     "A2_SKOTSEL = [RAM, LUFT, VAJER, FORVARING]",
     "A2_SKOTSEL = [RAM, VAJER, FORVARING]",
     "LUFT-rådet saknas"),

    # ── Signatur 3: styrhöjden lånas mellan modellerna ────────────────────
    ("modell D får A2:s styrhöjd i spec-raden",
     '"Mått: 120 × 58 × 75–80 cm (L × B × styrhöjd)"',
     '"Mått: 120 × 58 × 92–100 cm (L × B × styrhöjd)"',
     "ANNAN modells styrhöjd"),
    ("modell F får D:s styrhöjd i punktlistan",
     '    "Höjdjusterbart styre, 88 till 94 cm över marken",\n'
     '    "Bred halkfri fotplatta lågt över marken",',
     '    "Höjdjusterbart styre, 75 till 80 cm över marken",\n'
     '    "Bred halkfri fotplatta lågt över marken",',
     "ANNAN modells styrhöjd"),

    # ── Måtten och vikterna ───────────────────────────────────────────────
    ("modell A2 får runda 88:s maxlast",
     '"Maxlast: 100 kg"', '"Maxlast: 50 kg"',
     "främmande viktangivelse: 50 kg"),
    ("modell A2 får modell F:s längd",
     '"Mått: 143 × 58 × 92–100 cm (L × B × styrhöjd)"',
     '"Mått: 135 × 58 × 92–100 cm (L × B × styrhöjd)"',
     "ANNAN modells längd"),
    ("hjulstorleken hittas på",
     '"Hjul: 16 tum fram och bak, luftdäck på ekerfälg"',
     '"Hjul: 20 tum fram och bak, luftdäck på ekerfälg"',
     "okänt tal: '20 tum'"),
    ("egenvikten skrivs av från fel modell",
     '"Vikt: 9,5 kg"', '"Vikt: 8,2 kg"', "okänt tal: '8,2 kg'"),

    # ── Bromsen ───────────────────────────────────────────────────────────
    ("modell A2:s spec-rad tappar frambromsen",
     '"Bromsar: V-broms fram och bak"', '"Broms: bara bakbroms"',
     "nämner ingen frambroms"),
    ("brödtexten lovar bara en broms",
     "Med handtagen på styret, som tar på var sitt hjul.",
     "Med handtaget på styret. Den har endast bakbroms.",
     "bara EN broms utlovad"),

    # ── Husets stående regler ─────────────────────────────────────────────
    ("attributionen kommer tillbaka — mot kunden är VI leverantören",
     "\"Den är avsedd från 5 år. <strong>Titta på styret i \"",
     "\"Leverantören anger den från 5 år. <strong>Titta på styret i \"",
     "ORDLISTAN TRÄFFAR VÅR EGEN TEXT: leverantören"),
    ("ett tyskt ord blir kvar i punktlistan",
     '"Bred halkfri fotplatta lågt över marken",',
     '"Brett halkfritt Trittbrett lågt över marken",',
     "ORDLISTAN TRÄFFAR VÅR EGEN TEXT: trittbrett"),
    ("lagerlandet skrivs ut",
     "Ja, enkel montering krävs. Styret och framhjulet ska sättas på och dras ",
     "Ja. Den skickas från Tyskland, och styret ska sättas på och dras ",
     "förbjudet ord: 'tyskland'"),
    ("artikelnumret smyger in i spec-tabellen UTAN att heta artikelnummer",
     '"Montering krävs",\n]\nF_SKOTSEL',
     '"Ram: pulverlackerat stål (371-042V01)",\n]\nF_SKOTSEL',
     "artikelnummer i texten"),
    ("en certifiering hittas på",
     "Pulverlackerad stålram, maxlast 100 kg\",\n    \"Väger 8,2 kg",
     "Pulverlackerad stålram, testad enligt EN 14619\",\n    \"Väger 8,2 kg",
     "obelagd standard"),
    ("den blir en elsparkcykel",
     "Stora nog \"\n                    \"att ta en trottoarkant",
     "Motorn tar 20 km/h. Stora nog \"\n                    \"att ta en trottoarkant",
     "elfordonsord"),
    ("hjälmen framställs som lagkrav",
     "Något lagkrav på hjälm finns det inte för \"\n         \"en sparkcykel",
     "Hjälm är enligt lag påbjuden på \"\n         \"en sparkcykel",
     "hjälm framställd som lagkrav"),
    ("SKYDD kopplas bort och blir död kod",
     "        GAENDE, SKYDD,\n    ])\n\n\nA2_FAQ_GEMENSAM",
     "        GAENDE,\n    ])\n\n\nA2_FAQ_GEMENSAM",
     "hjälmrådet saknas helt"),
    ("intern jargong slinker med i kundtexten",
     "Den ser mer ut som en cykel utan \"",
     "Den är ny i rundan och ser mer ut som en cykel utan \"",
     "intern jargong"),
    ("en flikrubrik skrivs om till naturligare svenska",
     "<h2>Tekniska specifikationer</h2>", "<h2>Specifikationer</h2>",
     "flikrubriken 'Tekniska specifikationer' saknas"),

    # ── Färgen: sex produkter i tre par där bara färgen skiljer ───────────
    ("turkos F får den orange systerns Färg-rad",
     '"spec": F_SPEC[:8] + ["Färg: turkos ram"] + F_SPEC[8:]',
     '"spec": F_SPEC[:8] + ["Färg: orange ram"] + F_SPEC[8:]',
     "står i namnet men inte i Färg-raden"),
    ("Färg-raden faller bort helt ur modell D",
     '"spec": D_SPEC[:7] + ["Färg: turkos ram"] + D_SPEC[7:]',
     '"spec": D_SPEC',
     "ingen Färg-rad i spec-tabellen"),
    # ── Fälgfärgen: mätt i Steg 4, inte läst ur feeden ────────────────────
    ("den röda fälgen kommer tillbaka — bara gaffeln är röd i bild",
     '"Gaffeln är röd, fälgarna silverfärgade och resten "',
     '"Gaffeln och den röda fälgen syns fram, och resten är "',
     "OMÄTT FÄLGFÄRG"),
    ("ett annat färgord smyger in före fälgen",
     '"Hjul: Ø12 tum, uppblåsbara gummidäck"',
     '"Hjul: Ø12 tum på turkos fälg, uppblåsbara gummidäck"',
     "OMÄTT FÄLGFÄRG"),

    ("SKU:n tappar färgen och blir omöjlig att skilja från syskonet",
     '"sku": "FP-sparkcykel-framhjul-turkos"',
     '"sku": "FP-sparkcykel-framhjul-stort"',
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
        missade.append("%s — söksträngen finns inte: %r" % (namn, sok[:60]))
        continue
    kod, ut = kor(KALLA.replace(sok, ers, 1))
    if kod == 0:
        missade.append("%s — SLAPP IGENOM" % namn)
    elif vantat.lower() not in ut.lower():
        missade.append("%s — fälldes på FEL regel:\n      %s"
                       % (namn, "\n      ".join(
                           [l for l in ut.splitlines() if l.startswith("FEL")]
                           or ut.splitlines())[:300]))
    else:
        fangade += 1

for m in missade:
    print("MISS:", m)
print("\nMutationstest: %d/%d fångade." % (fangade, len(MUTATIONER)))
raise SystemExit(1 if missade else 0)
