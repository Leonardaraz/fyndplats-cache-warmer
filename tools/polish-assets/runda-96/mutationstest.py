# -*- coding: utf-8 -*-
"""Runda 96 — mutationstest mot de FYRA riktiga texterna.

Sjalvtestet i lint.py provar reglerna pa en konstruerad skada. Det har provar
dem pa de faktiska sidorna: varje mutation ar ett fel en manniska verkligen
kunde skriva den har rundan.

☠️ EN MUTATION MASTE TA BORT VARJE BARARE AV FAKTUMET. Uppmatt har: "Mät"
   bars av tva meningar, "måttbilden" av tva, "vattenavvisande" av tva (fyra pa
   `22dbd372`) och "följer inte med" av tva.

☠️ RUNDANS EGEN RISK AR TVA HALL:
   1. `b6ebc5ba`:s matt (88 x 88, 2,6 kg, 32 x 43 x 7) pa en A-duk som har
      86 x 86, 2,5 kg, 32 x 7 x 42. De ser ut som samma familj och ar det —
      men de ar INTE samma duk.
   2. De tva PERGOLA-produkterna byter matt med varandra. 286 cm och
      298 x 293 cm hor till olika sidor.
"""
import sys

import texter as T
import lint


def alla(pid):
    return (T.beskrivning(pid), T.namn(pid), T.seo_titel(pid),
            T.seo_beskrivning(pid), T.KORT[pid])


def byt(s, a, b):
    return s.replace(a, b)


FALL = [
    # --- b6ebc5ba:s matt pa en A-duk -----------------------------------
    ("lilla taket 86 → 88 (b6ebc5ba:s matt)",
     "3f9fda98", lambda h, n, t, b, k: (byt(h, "86 × 86", "88 × 88"), n, t,
                                        byt(b, "86 × 86", "88 × 88"), k)),
    ("vikt 2,5 → 2,6 (b6ebc5ba:s vikt)",
     "2bfaf6dd", lambda h, n, t, b, k: (byt(h, "2,5 kg", "2,6 kg"), n, t, b, k)),
    ("paketmatt 32 × 7 × 42 → 32 × 43 × 7 (b6ebc5ba:s)",
     "3f9fda98", lambda h, n, t, b, k: (byt(h, "32 × 7 × 42", "32 × 43 × 7"),
                                        n, t, b, k)),
    ("oppningen 68 → 59 (creme-sidans matt)",
     "2bfaf6dd", lambda h, n, t, b, k: (byt(h, "68 × 68", "59 × 59"), n, t,
                                        byt(b, "68 × 68", "59 × 59"), k)),
    ("kanthojd 18 → 20 (3 × 4-modellens matt)",
     "3f9fda98", lambda h, n, t, b, k: (byt(h, "18 cm", "20 cm"), n, t,
                                        byt(b, "18 cm", "20 cm"), k)),

    # --- de tva pergolorna byter matt -----------------------------------
    ("pergolamarkisen far pergolatakets matt",
     "9a3600f8", lambda h, n, t, b, k: (byt(h, "286 cm", "298 × 293 cm"), n, t,
                                        byt(b, "286 cm", "298 × 293 cm"), k)),
    ("pergolataket far markisens langd",
     "22dbd372", lambda h, n, t, b, k: (byt(h, "298 × 293 cm", "286 cm"), n, t,
                                        byt(b, "298 × 293 cm", "286 cm"), k)),
    ("stolpavstandet 3 × 3 → 2,85 × 2 pa pergolataket",
     "22dbd372", lambda h, n, t, b, k: (byt(h, "3 × 3 m", "2,85 × 2 m"), n, t,
                                        byt(b, "3 × 3 m", "2,85 × 2 m"), k)),
    ("sexton dranhal blir atta",
     "22dbd372", lambda h, n, t, b, k: (byt(h, "sexton", "åtta")
                                        .replace("Sexton", "Åtta"), n, t,
                                        byt(b, "sexton", "åtta"), k)),

    # --- tal kallan BRAKAR med sig sjalv om ------------------------------
    ("☠️ den omtvistade bredden 245 slapps in",
     "9a3600f8", lambda h, n, t, b, k: (byt(h, "Dukens längd:</strong> 286 cm",
                                            "Dukens längd:</strong> 286 × 245 cm"),
                                        n, t, b, k)),
    ("☠️ ritningens 231 slapps in",
     "9a3600f8", lambda h, n, t, b, k: (byt(h, "Duken är 286 cm lång",
                                            "Duken är 231 × 286 cm"), n, t, b, k)),
    ("☠️ ytvikt sätts pa den vars kalla inte anger nagon",
     "9a3600f8", lambda h, n, t, b, k: (byt(h, "polyester med plastbeläggning",
                                            "polyester, 180 g/m², med plastbeläggning"),
                                        n, t, b, k)),
    ("ytvikt 180 → 170 pa en A-duk",
     "2bfaf6dd", lambda h, n, t, b, k: (byt(h, "180 g/m²", "170 g/m²"), n, t,
                                        byt(b, "180 g/m²", "170 g/m²"), k)),

    # --- Steg 2: namnet sager wasserdicht, kroppen gor det inte ----------
    ("☠️ namnets 'wasserdicht' blir 'vattentät' i texten",
     "3f9fda98", lambda h, n, t, b, k: (byt(h, "Vattenavvisande, inte vattentät",
                                            "Vattentät i alla väder")
                                        .replace("den är vattenavvisande",
                                                 "den är vattentät"), n, t, b, k)),
    ("vattentat som fristaende pastaende",
     "22dbd372", lambda h, n, t, b, k: (h + "<p>Duken är vattentät och tål allt.</p>",
                                        n, t, b, k)),

    # --- fargen ----------------------------------------------------------
    ("☠️ MATFALLAN: graset blir dukens farg",
     "2bfaf6dd", lambda h, n, t, b, k: (byt(h, "kaffebrun", "grön"), n, t,
                                        byt(b, "Kaffebrun", "Grön"),
                                        (k[0], byt(k[1], "Kaffebrun", "Grön")))),
    ("morkgra pa den kaffebruna",
     "2bfaf6dd", lambda h, n, t, b, k: (byt(h, "Färg: kaffebrun", "Färg: mörkgrå"),
                                        n, t, b, k)),
    ("kortets underrad far syskonets farg",
     "3f9fda98", lambda h, n, t, b, k: (h, n, t, b,
                                        (k[0], "Kaffebrun duk 300 × 300 cm med litet tak"))),

    # --- husregler --------------------------------------------------------
    ("☠️ artikelnumret 84C-175 ur brodtexten slapps in",
     "9a3600f8", lambda h, n, t, b, k: (byt(h, "med stolpavstånd 2,85 × 2 m",
                                            "med stolpavstånd 2,85 × 2 m, 84C-175"),
                                        n, t, b, k)),
    ("avsandarland i skotselstycket",
     "22dbd372", lambda h, n, t, b, k: (byt(h, "Mät pergolan",
                                            "Duken skickas från Tyskland. Mät pergolan"),
                                        n, t, b, k)),
    ("husmarke i namnet",
     "2bfaf6dd", lambda h, n, t, b, k: (h, "Outsunny " + n, t, b, k)),
    ("leverantoren anger",
     "3f9fda98", lambda h, n, t, b, k: (byt(h, "Ta ned duken vid storm",
                                            "Leverantören anger att duken ska tas ned vid storm"),
                                        n, t, b, k)),
    ("tidslofte om montering",
     "3f9fda98", lambda h, n, t, b, k: (byt(h, "utan verktyg", "på 5 minuter"),
                                        n, t, b, k)),
    ("relativ lank",
     "9a3600f8", lambda h, n, t, b, k: (byt(h, 'href="' + T.BAS, 'href="/'),
                                        n, t, b, k)),
    ("lank till en sida som inte finns",
     "22dbd372", lambda h, n, t, b, k: (byt(h, T.INDRAGBART, "pergolatak-hittepa"),
                                        n, t, b, k)),
    ("sidan lankar till SIG SJALV",
     "9a3600f8", lambda h, n, t, b, k: (byt(h, T.SLUGG["22dbd372"], T.SLUGG["9a3600f8"]),
                                        n, t, b, k)),
    ("stommen pastas inga",
     "22dbd372", lambda h, n, t, b, k: (byt(h, "följer inte med", "ingår"), n, t, b, k)),
    ("uppmaningen att mata stryks pa BADA stallen",
     "2bfaf6dd", lambda h, n, t, b, k: (byt(byt(h, "Mät stommen", "Kolla stommen"),
                                            "Mät tre saker", "Kolla tre saker"),
                                        n, t, b, k)),
    ("hanvisningen till mattbilden stryks pa BADA stallen",
     "9a3600f8", lambda h, n, t, b, k: (byt(h, "måttbilden", "bilden"), n, t, b, k)),
    ("runbookens varningsemoji foljer med in",
     "22dbd372", lambda h, n, t, b, k: (byt(h, "Den här duken spänns",
                                            "⚠️ Den här duken spänns"), n, t, b, k)),
    ("namnet vaxer forbi Wix 80-teckentak",
     "9a3600f8", lambda h, n, t, b, k: (h, n + " i polyester med plastbeläggning",
                                        t, b, k)),
    ("fel storlek i namnet",
     "22dbd372", lambda h, n, t, b, k: (h, byt(n, "298 × 293 cm", "250 × 255 cm"),
                                        t, b, k)),
]

# ⚠️ Dokumenterade blinda flackar. Talgrinden ar en VITLISTA: tal som redan star
#    pa sidan kan kastas om utan att grinden ser nagot.
VANTAS_PASSERA = [
    ("paketmatt 32 × 7 × 42 → 42 × 7 × 32 (samma tal, kastad ordning)",
     "3f9fda98", lambda h, n, t, b, k: (byt(h, "32 × 7 × 42 cm", "42 × 7 × 32 cm"),
                                        n, t, b, k)),
    ("pergolatakets 298 × 293 → 293 × 298",
     "22dbd372", lambda h, n, t, b, k: (byt(h, "298 × 293 cm", "293 × 298 cm"),
                                        n, t, byt(b, "298 × 293 cm", "293 × 298 cm"),
                                        k)),
]


def kor():
    fel = 0
    print("=== mutationer som SKA fällas ===")
    for namn_, pid, muta in FALL:
        orig = alla(pid)
        ny = muta(*orig)
        if not any(a != b for a, b in zip(orig, ny)):
            print("  ☠️ %-56s MUTATIONEN TRÄFFADE INGENTING" % namn_)
            fel += 1
            continue
        brister = lint.granska(pid, *ny)
        if not brister:
            print("  ☠️ %-56s SLÄPPS IGENOM" % namn_)
            fel += 1
        else:
            print("  ✓  %-56s %s" % (namn_, brister[0][:40]))

    print("\n=== dokumenterade blinda fläckar (får passera) ===")
    for namn_, pid, muta in VANTAS_PASSERA:
        orig = alla(pid)
        ny = muta(*orig)
        if not any(a != b for a, b in zip(orig, ny)):
            print("  ☠️ %-56s MUTATIONEN TRÄFFADE INGENTING" % namn_)
            fel += 1
            continue
        brister = lint.granska(pid, *ny)
        print("  %s %-56s %s" % ("⚠️ " if not brister else "✓ ", namn_,
                                 "passerar (känd lucka)" if not brister
                                 else "fälls ändå: %s" % brister[0][:30]))

    n = len(FALL)
    print("\n%d/%d mutationer gav rätt utfall" % (n - fel, n))
    return fel


if __name__ == "__main__":
    sys.exit(1 if kor() else 0)
