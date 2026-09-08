# -*- coding: utf-8 -*-
"""Runda 104 — ett eget Fyndplats-kort per elbil (Leonards regel 2026-08-26).

Sju sidor publicerades utan eget kort. Det upptäcktes först vid omläsningen av
runbooken efter publiceringen, inte under rundan — samma miss som runda 62–65
gjorde (uppgift #285). Korten byggs därför i efterhand och patchas in.

TRE MODELLER, tre spec-tabeller, tre rubriker. Spec-raderna nedan är HÄMTADE UR
SIDANS EGEN spec-tabell — mekaniskt, med regex, aldrig omskrivna för hand.
Kortet pekar på ett radindex och `kortbygge.varde` tar det som står efter
kolonet; etiketten måste dessutom finnas i radens egen etikett, så ett kort inte
kan skriva "Vikt: grå".

⚠️ RUBRIKEN MÅSTE BÄRAS AV FOTOT. Granskat mot varje hjältebild i ett kontaktark:

  Kawasaki    störtbåge OCH frontbygel, båda i vagnens färg mot svart kaross
              -> "Störtbåge och frontbygel i samma färg"
  UTV modell B svart störtbåge över sitsen, tända lyktor, grovmönstrade däck
              -> "Störtbåge, tända lyktor och grova däck"
  Maserati    treudden i grillen, båda strålkastarna tända, låg öppen sittbrunn
              -> "Treudden i grillen och tända strålkastare"

☠️ Samma sex etiketter på alla tre modellerna, med flit: korten är syskon i en
   och samma familj och ska gå att jämföra rad för rad. Alla sex finns i alla
   tre spec-tabellerna — men på OLIKA index, för Maseratin och Kawasakin har en
   `Sitthöjd`-rad som UTV:n saknar. Därav index per modell och inte en delad
   lista.

☠️ FOTOT ÄR FÖRBEHANDLAT, se `kortbygge.bygg(foton=...)`. Panelen är 1,83 och
   `fit=True` ger `object-fit: contain`; ett kvadratiskt foto krymper då till
   ~55 % av panelens bredd. Bilarna är HÖGRE än panelen, så en beskärning till
   1,83 hade kapat dem — runda 93:s regel gäller: fyll ut med vitt i sidled,
   beskär aldrig varan. Fyllnaden blev 63–77 %.
"""
import sys

BAS = "/home/user/fyndplats-cache-warmer/tools/polish-assets"
sys.path.insert(0, BAS)
import kortbygge                                                   # noqa: E402

HAR = BAS + "/runda-104"

# ── spec-tabellerna, ordagrant ur sidornas <li>-rader ────────────────────────
UTV = [
    "Mått: 96 × 61 × 56 cm (L × B × H)",                           # 0
    "Sits: 36 cm bred, 18 cm djup",                                # 1
    "Hjul: Ø 24 cm",                                               # 2
    "Rekommenderad ålder: 3–5 år",                                 # 3
    "Maxvikt: 30 kg",                                              # 4
    "Hastighet: 3–7 km/h",                                         # 5
]
MASERATI = [
    "Mått: 98 × 59 × 43 cm (L × B × H)",                           # 0
    "Sits: 32 cm bred, 19 cm djup",                                # 1
    "Sitthöjd: 14 cm över marken",                                 # 2
    "Hjul: Ø 19 cm",                                               # 3
    "Platser: 1",                                                  # 4
    "Rekommenderad ålder: 3–5 år",                                 # 5
    "Maxvikt: 25 kg",                                              # 6
    "Hastighet: 3–5 km/h",                                         # 7
]
KAWASAKI = [
    "Mått: 100 × 64 × 56 cm (L × B × H)",                          # 0
    "Sits: 31 cm bred, 19 cm djup",                                # 1
    "Sitthöjd: 27 cm",                                             # 2
    "Hjul: Ø 24 cm i plast",                                       # 3
    "Platser: 1",                                                  # 4
    "Rekommenderad ålder: 3–5 år",                                 # 5
    "Maxvikt: 30 kg",                                              # 6
    "Hastighet: 3–5 km/h",                                         # 7
]

R_UTV = [("Mått", 0), ("Sits", 1), ("Hjul", 2),
         ("Ålder", 3), ("Maxvikt", 4), ("Hastighet", 5)]
R_MAS = [("Mått", 0), ("Sits", 1), ("Hjul", 3),
         ("Ålder", 5), ("Maxvikt", 6), ("Hastighet", 7)]
R_KAW = [("Mått", 0), ("Sits", 1), ("Hjul", 3),
         ("Ålder", 5), ("Maxvikt", 6), ("Hastighet", 7)]

KICKER = "Elbil för barn 12 V"
RUB_UTV = "Störtbåge, tända lyktor och grova däck"
RUB_KAW = "Störtbåge och frontbygel i samma färg"
RUB_MAS = "Treudden i grillen och tända strålkastare"

# id8 -> (spec, rader, rubrik, panelfoto)
PRODUKTER = {
    "f15febb2": (UTV,      R_UTV, RUB_UTV, "utv_rosa"),
    "3d9dff8a": (UTV,      R_UTV, RUB_UTV, "utv_orange"),
    "2f6ff71c": (UTV,      R_UTV, RUB_UTV, "utv_bla"),
    "c0abfddd": (MASERATI, R_MAS, RUB_MAS, "maserati"),
    "ed84746c": (KAWASAKI, R_KAW, RUB_KAW, "kawa_vit"),
    "3b992525": (KAWASAKI, R_KAW, RUB_KAW, "kawa_beige"),
    "60ab2042": (KAWASAKI, R_KAW, RUB_KAW, "kawa_turkos"),
}

if __name__ == "__main__":
    kortdata = {k: (KICKER, v[2], v[1]) for k, v in PRODUKTER.items()}
    produkter = [{"kort": k, "spec": v[0]} for k, v in PRODUKTER.items()]
    foton = {k: "%s/panelfoton/%s.jpg" % (HAR, v[3])
             for k, v in PRODUKTER.items()}

    print("=== spec-rader som kommer på korten ===")
    for k, (spec, rader, rubrik, _) in PRODUKTER.items():
        print("  %s  %s" % (k, rubrik))
        for e, i in rader:
            print("        %-11s %s" % (e + ":", kortbygge.varde(spec[i], e)))

    print("\n=== bygger ===")
    namn, facit = kortbygge.bygg(HAR, produkter, kortdata, foton=foton)
    print("  %d kort byggda" % len(namn))
