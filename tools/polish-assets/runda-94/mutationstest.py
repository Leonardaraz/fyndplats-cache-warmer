# -*- coding: utf-8 -*-
"""Runda 94 — mutationstest mot de FYRA riktiga texterna.

Sjalvtestet i lint.py provar reglerna pa en konstruerad skada. Det har provar
dem pa de faktiska sidorna: varje mutation ar ett fel som en manniska
verkligen kunde skriva.

☠️ EN MUTATION MASTE TA BORT VARJE BARARE AV FAKTUMET (runda 92). Star ett
   pastaende pa tva stallen och mutationen rader ett, provar den ingenting.

☠️ MUTATIONEN MASTE FAKTISKT ANDRA TEXTEN. En `replace` som inte traffar ar
   en tyst godkand rad. Varje fall kontrolleras darfor mot originalet.

⚠️ TVA MUTATIONER FORVANTAS PASSERA, och det ar dokumenterat i stallet for
   dolt — se `vantas_passera` nedan.
"""
import sys

import texter as T
import lint


def alla(pid):
    return (T.beskrivning(pid), T.namn(pid), T.seo_titel(pid),
            T.seo_beskrivning(pid), T.KORT[pid])


def granska(pid, h, n, t, b, k):
    return lint.granska(pid, h, n, t, b, k)


def byt(s, a, b):
    return s.replace(a, b)


# (namn, produkt, funktion(h,n,t,b,k) -> (h,n,t,b,k), ska_falla)
FALL = [
    # --- matt som paverkar ett kop -------------------------------------
    ("stora duken 300 → 310",
     "df5a7190", lambda h, n, t, b, k: (byt(h, "300 × 300", "310 × 300"), n, t,
                                        byt(b, "300 × 300", "310 × 300"), k), True),
    ("lilla taket 90 → 86 (creme-sidans matt)",
     "df5a7190", lambda h, n, t, b, k: (byt(h, "90 × 90", "86 × 86"), n, t,
                                        byt(b, "90 × 90", "86 × 86"), k), True),
    ("snedstalld kant 173 → 174 (creme-sidans matt)",
     "df5a7190", lambda h, n, t, b, k: (byt(h, "173 cm", "174 cm"), n, t, b, k), True),
    ("oppning 59 → 60",
     "60eaf40e", lambda h, n, t, b, k: (byt(h, "59 × 59", "60 × 60"), n, t, b, k), True),
    ("grupp B 298 → 300",
     "d52c6d1d", lambda h, n, t, b, k: (byt(h, "298 × 298", "300 × 300"), n, t,
                                        byt(b, "298 × 298", "300 × 300"), k), True),
    ("grupp B snedstalld kant 218 → 173 (grupp C:s matt)",
     "d52c6d1d", lambda h, n, t, b, k: (byt(h, "218 cm", "173 cm"), n, t, b, k), True),
    ("ytvikt 370 → 180 i spec OCH text",
     "d01a6d2b", lambda h, n, t, b, k: (byt(h, "370 g/m²", "180 g/m²"),
                                        byt(n, "370 g/m²", "180 g/m²"),
                                        byt(t, "370 g/m²", "180 g/m²"),
                                        byt(b, "370 g/m²", "180 g/m²"), k), True),
    ("vikt 2,9 → 4,8 (syskonmodellens vikt)",
     "df5a7190", lambda h, n, t, b, k: (byt(h, "2,9 kg", "4,8 kg"), n, t, b, k), True),
    ("oljetter 8 → 6",
     "df5a7190", lambda h, n, t, b, k: (byt(h, "Åtta öljetter", "Sex öljetter")
                                        .replace("<strong>Öljetter:</strong> 8",
                                                 "<strong>Öljetter:</strong> 6")
                                        .replace("åtta öljetter", "sex öljetter"),
                                        n, t, byt(b, "åtta", "sex"), k), True),

    # --- husregler ------------------------------------------------------
    ("serienumret 01-0867 slapps in",
     "d52c6d1d", lambda h, n, t, b, k: (byt(h, "med ett taksteg",
                                            "med ett taksteg i serien 01-0867"),
                                        n, t, b, k), True),
    ("avsandarland i skotselstycket",
     "d01a6d2b", lambda h, n, t, b, k: (byt(h, "Mät stommen",
                                            "Duken skickas från Tyskland. Mät stommen"),
                                        n, t, b, k), True),
    ("husmarke i namnet",
     "60eaf40e", lambda h, n, t, b, k: (h, "Outsunny " + n, t, b, k), True),
    ("vattentat som pastaende",
     "d52c6d1d", lambda h, n, t, b, k: (byt(h, "vattenavvisande och",
                                            "vattentät och"), n, t, b, k), True),
    ("leverantoren anger",
     "df5a7190", lambda h, n, t, b, k: (byt(h, "Väven på 180 g/m² är gjord",
                                            "Leverantören anger att väven på 180 g/m² är gjord"),
                                        n, t, b, k), True),
    ("tidslofte om montering",
     "d01a6d2b", lambda h, n, t, b, k: (byt(h, "utan verktyg",
                                            "på 5 minuter"), n, t, b, k), True),
    ("relativ lank",
     "df5a7190", lambda h, n, t, b, k: (byt(h, 'href="' + T.BAS, 'href="/'),
                                        n, t, b, k), True),
    ("ljusgra pa den MORKA duken",
     "df5a7190", lambda h, n, t, b, k: (h, byt(n, "i grå", "i ljusgrå"), t, b, k), True),
    ("kortets underrad far fel farg",
     "60eaf40e", lambda h, n, t, b, k: (h, n, t, b,
                                        (k[0], "Beige duk med mörkbrun topp")), True),
    ("stommen pastas inga",
     "d52c6d1d", lambda h, n, t, b, k: (byt(h, "stommen följer inte med",
                                            "stommen ingår"), n, t, b, k), True),
    # ☠️ TRE barare, inte tva: "Mät stommen", "Mät två saker" OCH det gemena
    #    "mät båda" i skotselstycket. Forsta versionen tog tva och slapptes
    #    igenom — mutationen var ofullstandig, och grinden for slapp.
    ("uppmaningen att mata stryks pa ALLA TRE stallen",
     "d01a6d2b", lambda h, n, t, b, k: (byt(byt(byt(h, "Mät stommen", "Kolla stommen"),
                                                "Mät två saker", "Kolla två saker"),
                                            "mät båda", "kolla båda"),
                                        n, t, b, k), True),
    ("UPF-klassningen stryks",
     "60eaf40e", lambda h, n, t, b, k: (byt(h, "UPF 30+", "bra solskydd"), n, t,
                                        byt(b, "UPF 30+", "bra solskydd"), k), True),
    ("lank till en sida som inte finns",
     "d52c6d1d", lambda h, n, t, b, k: (byt(h, T.POLYESTER, "paviljongtak-hittepa"),
                                        n, t, b, k), True),

    # --- vantas PASSERA, och det ar avsiktligt --------------------------
    ("syskonets farg i LANKSTYCKET (zonen tillater den)",
     "df5a7190", lambda h, n, t, b, k: (h, n, t, b, k), False),
]

# ⚠️ Dokumenterade blinda flackar. Talgrinden ar en VITLISTA: ett tal som redan
#    star pa sidan kan bytas mot ett annat tal pa sidan utan att grinden ser
#    nagot. Bada exemplen nedan ar RIKTIGA risker, och bada fangas i stallet av
#    fakta-avstamningen i Steg 12 — inte av grinden.
VANTAS_PASSERA = [
    ("paketmatt 50 × 29 × 8 → 8 × 29 × 50 (samma tal, kastad ordning)",
     "df5a7190", lambda h, n, t, b, k: (byt(h, "50 × 29 × 8 cm", "8 × 29 × 50 cm"),
                                        n, t, b, k)),
    ("grupp B paketmatt 42 × 35 × 9 → 35 × 42 × 9",
     "d52c6d1d", lambda h, n, t, b, k: (byt(h, "42 × 35 × 9 cm", "35 × 42 × 9 cm"),
                                        n, t, b, k)),
]


def kor():
    fel = 0
    print("=== mutationer som SKA fällas ===")
    for namn_, pid, muta, ska in FALL:
        orig = alla(pid)
        ny = muta(*orig)
        rort = any(a != b for a, b in zip(orig, ny))
        if ska and not rort:
            print("  ☠️ %-52s MUTATIONEN TRÄFFADE INGENTING" % namn_)
            fel += 1
            continue
        brister = granska(pid, *ny)
        if ska and not brister:
            print("  ☠️ %-52s SLAPPS IGENOM" % namn_)
            fel += 1
        elif ska:
            print("  ✓  %-52s %s" % (namn_, brister[0][:44]))
        else:
            print("  ✓  %-52s passerar med flit (%d)" % (namn_, len(brister)))
            if brister:
                print("     ☠️ men gav brister:", brister[:2])
                fel += 1

    print("\n=== dokumenterade blinda fläckar (ska passera) ===")
    for namn_, pid, muta in VANTAS_PASSERA:
        orig = alla(pid)
        ny = muta(*orig)
        if not any(a != b for a, b in zip(orig, ny)):
            print("  ☠️ %-52s MUTATIONEN TRÄFFADE INGENTING" % namn_)
            fel += 1
            continue
        brister = granska(pid, *ny)
        print("  %s %-52s %s" % ("⚠️ " if not brister else "✓ ", namn_,
                                 "passerar (känd lucka)" if not brister
                                 else "fälls ändå: %s" % brister[0][:34]))

    n = len(FALL)
    print("\n%d/%d mutationer gav rätt utfall" % (n - fel, n))
    return fel


if __name__ == "__main__":
    sys.exit(1 if kor() else 0)
