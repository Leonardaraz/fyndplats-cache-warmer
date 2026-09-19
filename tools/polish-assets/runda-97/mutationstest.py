# -*- coding: utf-8 -*-
"""Runda 97 — muterar texten och kräver att grinden fäller.

☠️ SKILLNADEN MOT SJÄLVTESTET I `lint.py`: självtestet bevisar att varje
   REGEL fungerar. Det här bevisar att reglerna TILLSAMMANS täcker de fel
   som faktiskt uppstår när en människa eller en modell skriver om tysk
   marknadsföring till svenska. Ett fel som ingen regel råkar täcka syns
   bara här.

⚠️ Blinda fläckar dokumenteras hellre än göms. En mutation som passerar och
   som vi VET om är en känd lucka; en som passerar utan att någon vet är en
   bugg i produktion.
"""
import re
import sys

import lint
import texter as T


def granska(pid, h=None, n=None, t=None, m=None):
    return lint.granska(pid,
                        h if h is not None else T.beskrivning(pid),
                        n if n is not None else T.namn(pid),
                        t if t is not None else T.seo_titel(pid),
                        m if m is not None else T.seo_beskrivning(pid))


def mutationer():
    ut = []
    for pid in T.PRODUKTER:
        h0 = T.beskrivning(pid)
        m0 = T.seo_beskrivning(pid)
        n0 = T.namn(pid)

        # --- hälsopåståenden, den regel rundan finns för
        ut.append((pid, "hälsa: skonar rygg", "HÄLSOPÅSTÅENDE",
                   lambda p=pid, h=h0: granska(p, h=h + "<p>Skonar hundens rygg.</p>")))
        ut.append((pid, "hälsa: matsmältning", "HÄLSOPÅSTÅENDE",
                   lambda p=pid, h=h0: granska(p, h=h + "<p>Ger bättre matsmältning.</p>")))
        ut.append((pid, "hälsa: mjukad formulering", "HÄLSOPÅSTÅENDE",
                   lambda p=pid, h=h0: granska(
                       p, h=h + "<p>Många väljer en upphöjd skål för att den "
                                "är skonsammare.</p>")))
        ut.append((pid, "hälsa: i metan", "HÄLSOPÅSTÅENDE",
                   lambda p=pid, m=m0: granska(p, m=m[:80] + " Avlastar leder.")))

        # --- tal
        ut.append((pid, "tal: ändrad vikt i brödtext", "ohärlett tal",
                   lambda p=pid, h=h0: granska(
                       p, h=re.sub(r"(\d),(\d) kg", r"\1,\2 kg", h)
                       .replace(" kg", "7 kg", 1))))
        ut.append((pid, "tal: påhittad volym i meta", "ohärlett tal",
                   lambda p=pid, m=m0: granska(p, m=m[:70] + " Rymmer 88 liter foder.")))

        # --- material
        ut.append((pid, "material: bara rostfritt", "skålarnas material",
                   lambda p=pid, h=h0: granska(
                       p, h=h.replace("rostfri", "blank").replace("rostfritt", "blankt"))))

        # --- härkomst och märke
        ut.append((pid, "husmärke i namn", "leverantör/husmärke",
                   lambda p=pid, n=n0: granska(p, n="PawHut " + n)))
        ut.append((pid, "avsändarland", "avsändarland",
                   lambda p=pid, h=h0: granska(p, h=h + "<p>Skickas från Spanien.</p>")))
        # ⚠️ MUTATIONEN MÅSTE FAKTISKT MUTERA. Första versionen bytte
        #    "förvaring" mot "Stauraum" — men två av sex texter innehåller
        #    inte ordet, så mutationen blev en no-op och rapporterades som
        #    "slapp igenom". Grinden var oskyldig; testet mätte ingenting.
        #    "skålar" står i alla sex.
        ut.append((pid, "tyskt ord kvar", "tyska",
                   lambda p=pid, h=h0: granska(p, h=h.replace("skålar", "Näpfe"))))

        # --- struktur
        ut.append((pid, "spec-rad tyst ändrad", "spec-raden",
                   lambda p=pid, h=h0: granska(
                       p, h=h.replace("<strong>Färg:</strong>", "<strong>Farg:</strong>"))))
        ut.append((pid, "självlänk", "länkar till sig själv",
                   lambda p=pid, h=h0: granska(
                       p, h=h + '<p><a href="%s%s">samma sida</a></p>'
                       % (T.BAS, T.SLUGG[p]))))
    return ut


# ✅ INGA KÄNDA LUCKOR I DEN HÄR RUNDAN. De två fall som brukar slinka
#    igenom — kastad ordning på måtten, och två tal som byter plats mellan
#    rader som båda är vitlistade — fångas här av att spec-tabellen krävs
#    ORDAGRANT i html:en. Det är regel 5 som gör det, inte talkontrollen:
#    talen är vitlistade i båda fallen, men raden ser inte likadan ut.
#    Listan står kvar och körs varje gång; blir den tom av fel skäl syns det.
BLINDA = [
    ("kastad ordning på måtten (60 × 30 blir 30 × 60)",
     lambda: granska("868cc038",
                     h=T.beskrivning("868cc038").replace("60 × 30 × 34",
                                                         "30 × 60 × 34"))),
    ("ett tal flyttat mellan två spec-rader som båda är vitlistade",
     lambda: granska("7628983b",
                     h=T.beskrivning("7628983b").replace(
                         "20 kg på ovansidan, 10 kg inuti",
                         "10 kg på ovansidan, 20 kg inuti"))),
]


if __name__ == "__main__":
    fall = mutationer()
    ratt = 0
    for pid, namn, vantat, f in fall:
        brister = f()
        traff = any(vantat in b for b in brister)
        ratt += traff
        if not traff:
            print("  ✗ %s  %-34s SLAPP IGENOM" % (pid, namn))
    print("%d/%d mutationer gav rätt utfall" % (ratt, len(fall)))

    print("\n=== fall som brukar vara blinda fläckar ===")
    for namn, f in BLINDA:
        b = f()
        print("  %s  %-58s %s" % ("⚠️ " if not b else "✓ ", namn,
                                  "passerar (känd lucka)" if not b
                                  else "fälls ändå: " + b[0][:44]))
    sys.exit(0 if ratt == len(fall) else 1)
