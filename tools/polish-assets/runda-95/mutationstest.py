# -*- coding: utf-8 -*-
"""Runda 95 — mutationstest mot de FYRA riktiga texterna.

Sjalvtestet i lint.py provar reglerna pa en konstruerad skada. Det har provar
dem pa de faktiska sidorna: varje mutation ar ett fel en manniska verkligen
kunde skriva den har rundan.

☠️ EN MUTATION MASTE TA BORT VARJE BARARE AV FAKTUMET (runda 92/94). Star ett
   pastaende pa tva stallen och mutationen rader ett, provar den ingenting.
   Uppmatt har: uppmaningen att mata bars av TVA meningar ("Mät stommen",
   "Mät tre saker"), medan de gemena "mäter" ar beskrivande och inte barare.

☠️ MUTATIONEN MASTE FAKTISKT ANDRA TEXTEN. En `replace` som inte traffar ar en
   tyst godkand rad — runda 94 fangade en sadan. Varje fall jamfors mot
   originalet innan utfallet bedoms.

☠️ RUNDANS EGEN RISK AR SYSKONBYTET. De tva 3 x 3-taken ar INTE samma duk:
   88 x 88 mot 86 x 86 cm, 174 cm mot en oppning pa 68 x 68 cm. Sex mutationer
   nedan later ett syskon bara det andras matt.
"""
import sys

import texter as T
import lint


def alla(pid):
    return (T.beskrivning(pid), T.namn(pid), T.seo_titel(pid),
            T.seo_beskrivning(pid), T.KORT[pid])


def byt(s, a, b):
    return s.replace(a, b)


# (namn, produkt, funktion(h,n,t,b,k) -> (h,n,t,b,k))
FALL = [
    # --- syskonbytet: rundans farligaste fel ----------------------------
    ("lilla taket 88 → 86 (syskonets matt)",
     "b6ebc5ba", lambda h, n, t, b, k: (byt(h, "88 × 88", "86 × 86"), n, t,
                                        byt(b, "88 × 88", "86 × 86"), k)),
    ("lilla taket 86 → 88 (syskonets matt)",
     "271327e1", lambda h, n, t, b, k: (byt(h, "86 × 86", "88 × 88"), n, t,
                                        byt(b, "86 × 86", "88 × 88"), k)),
    ("snedstalld kant 174 lanas till syskonet",
     "271327e1", lambda h, n, t, b, k: (byt(h, "<strong>Kanthöjd:</strong> 18 cm",
                                            "<strong>Snedställd kant, stora taket:</strong> 174 cm"),
                                        n, t, b, k)),
    ("oppningen 68 lanas av syskonet",
     "b6ebc5ba", lambda h, n, t, b, k: (byt(h, "<strong>Kanthöjd:</strong> 18 cm",
                                            "<strong>Öppning i stora taket:</strong> 68 × 68 cm"),
                                        n, t, b, k)),
    ("grupp E far grupp D:s lilla tak",
     "ef0a812d", lambda h, n, t, b, k: (byt(h, "94 × 47", "88 × 88"), n, t,
                                        byt(b, "94 × 47", "88 × 88"), k)),
    ("kanthojd 20 → 18 (andra gruppens matt)",
     "dc7d2513", lambda h, n, t, b, k: (byt(h, "20 cm", "18 cm"), n, t,
                                        byt(b, "20 cm", "18 cm"), k)),

    # --- matt och tal som paverkar ett kop ------------------------------
    ("stora duken 300 → 310",
     "271327e1", lambda h, n, t, b, k: (byt(h, "300 × 300", "310 × 300"), n, t,
                                        byt(b, "300 × 300", "310 × 300"), k)),
    ("stommen 3 × 3 → 3 × 4 i namnet",
     "b6ebc5ba", lambda h, n, t, b, k: (h, byt(n, "3 × 3 m", "3 × 4 m"), t, b, k)),
    ("vikt 2,6 → 2,5 (syskonets vikt)",
     "b6ebc5ba", lambda h, n, t, b, k: (byt(h, "2,6 kg", "2,5 kg"), n, t, b, k)),
    ("paketmatt 32 × 43 × 7 → 32 × 7 × 42 (syskonets)",
     "b6ebc5ba", lambda h, n, t, b, k: (byt(h, "32 × 43 × 7", "32 × 7 × 42"),
                                        n, t, b, k)),

    # --- ytvikten, at bada hallen ---------------------------------------
    ("ytvikt 180 → 170 i spec OCH text",
     "b6ebc5ba", lambda h, n, t, b, k: (byt(h, "180 g/m²", "170 g/m²"), n, t,
                                        byt(b, "180 g/m²", "170 g/m²"), k)),
    ("☠️ ytvikt SATTS pa den sida vars kalla motsager sig sjalv",
     "271327e1", lambda h, n, t, b, k: (byt(h, "polyester med PA-beläggning",
                                            "polyester, 180 g/m², med PA-beläggning"),
                                        n, t, b, k)),
    ("spec-Material tappar ytvikten helt",
     "ef0a812d", lambda h, n, t, b, k: (byt(h, "<strong>Material:</strong> polyester, 180 g/m², med PA-beläggning",
                                            "<strong>Material:</strong> polyester med PA-beläggning"),
                                        n, t, b, k)),

    # --- fargen, som tyskan har fel om ----------------------------------
    ("tyskans 'Kohlegrau' slapps in pa den MATT grona",
     "b6ebc5ba", lambda h, n, t, b, k: (byt(h, "mörkgrön", "kolgrå"),
                                        byt(n, "mörkgrön", "kolgrå"), t,
                                        byt(b, "Mörkgrön", "Kolgrå"),
                                        (k[0], byt(k[1], "Mörkgrön", "Kolgrå")))),
    ("produktnamnets 'Kaffee' slapps in pa den MATT rostroda",
     "ef0a812d", lambda h, n, t, b, k: (byt(h, "roströd", "kaffebrun"), n, t,
                                        byt(b, "Roströd", "Kaffebrun"), k)),
    ("kortets underrad far syskonets farg",
     "dc7d2513", lambda h, n, t, b, k: (h, n, t, b,
                                        (k[0], "Roströd duk med litet tak 94 × 47 cm"))),

    # --- husregler -------------------------------------------------------
    ("artikelnumret 84C-041 slapps in",
     "271327e1", lambda h, n, t, b, k: (byt(h, "med tak i två nivåer",
                                            "med tak i två nivåer, 84C-041"),
                                        n, t, b, k)),
    ("avsandarland i skotselstycket",
     "dc7d2513", lambda h, n, t, b, k: (byt(h, "Mät stommen",
                                            "Duken skickas från Tyskland. Mät stommen"),
                                        n, t, b, k)),
    ("husmarke i namnet",
     "ef0a812d", lambda h, n, t, b, k: (h, "Outsunny " + n, t, b, k)),
    ("vattentat som pastaende",
     "b6ebc5ba", lambda h, n, t, b, k: (h + "<p>Duken är vattentät och tål allt väder.</p>",
                                        n, t, b, k)),
    ("'Vattenavvisande, inte vattentät' blir 'vattentät'",
     "271327e1", lambda h, n, t, b, k: (byt(h, "Vattenavvisande, inte vattentät",
                                            "Vattentät i alla väder"), n, t, b, k)),
    ("tillverkaren sager",
     "b6ebc5ba", lambda h, n, t, b, k: (byt(h, "Vattenavvisande, inte vattentät",
                                            "Vattenavvisande, det säger tillverkaren"),
                                        n, t, b, k)),
    ("leverantoren anger",
     "ef0a812d", lambda h, n, t, b, k: (byt(h, "Ta ned duken vid storm",
                                            "Leverantören anger att duken ska tas ned vid storm"),
                                        n, t, b, k)),
    ("tidslofte om montering",
     "b6ebc5ba", lambda h, n, t, b, k: (byt(h, "utan verktyg", "på 5 minuter"),
                                        n, t, b, k)),
    ("relativ lank",
     "dc7d2513", lambda h, n, t, b, k: (byt(h, 'href="' + T.BAS, 'href="/'),
                                        n, t, b, k)),
    ("lank till en sida som inte finns",
     "271327e1", lambda h, n, t, b, k: (byt(h, T.CREME, "paviljongtak-hittepa"),
                                        n, t, b, k)),
    ("sidan lankar till SIG SJALV",
     "ef0a812d", lambda h, n, t, b, k: (byt(h, T.SLUGG["dc7d2513"], T.SLUGG["ef0a812d"]),
                                        n, t, b, k)),
    ("stommen pastas inga",
     "b6ebc5ba", lambda h, n, t, b, k: (byt(h, "stommen följer inte med",
                                            "stommen ingår"), n, t, b, k)),
    # ☠️ TVA barare: "Mät stommen" och "Mät tre saker". De gemena "mäter" ar
    #    beskrivande och baar inte uppmaningen — uppmatt, inte antaget.
    ("uppmaningen att mata stryks pa BADA stallen",
     "271327e1", lambda h, n, t, b, k: (byt(byt(h, "Mät stommen", "Kolla stommen"),
                                            "Mät tre saker", "Kolla tre saker"),
                                        n, t, b, k)),
    ("hanvisningen till mattbilden stryks pa BADA stallen",
     "b6ebc5ba", lambda h, n, t, b, k: (byt(h, "måttbilden", "bilden"), n, t, b, k)),
    ("runbookens varningsemoji foljer med in i syskonlanken",
     "271327e1", lambda h, n, t, b, k: (byt(h, "Måtten på", "⚠️ Måtten på"), n, t, b, k)),
    ("namnet vaxer forbi Wix 80-teckentak",
     "dc7d2513", lambda h, n, t, b, k: (h, n + " i polyester med PA-beläggning",
                                        t, b, k)),
]

# ⚠️ Dokumenterade blinda flackar. Talgrinden ar en VITLISTA: tal som redan star
#    pa sidan kan kastas om utan att grinden ser nagot. Bada ar riktiga risker
#    och bada fangas i stallet av fakta-avstamningen i Steg 12.
VANTAS_PASSERA = [
    ("paketmatt 35 × 9 × 42 → 42 × 9 × 35 (samma tal, kastad ordning)",
     "ef0a812d", lambda h, n, t, b, k: (byt(h, "35 × 9 × 42 cm", "42 × 9 × 35 cm"),
                                        n, t, b, k)),
    ("grupp D paketmatt 32 × 7 × 42 → 42 × 7 × 32",
     "271327e1", lambda h, n, t, b, k: (byt(h, "32 × 7 × 42 cm", "42 × 7 × 32 cm"),
                                        n, t, b, k)),
    ("lilla taket 94 × 47 → 47 × 94 (samma tal, kastad ordning)",
     "dc7d2513", lambda h, n, t, b, k: (byt(h, "94 × 47", "47 × 94"), n, t,
                                        byt(b, "94 × 47", "47 × 94"), k)),
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
