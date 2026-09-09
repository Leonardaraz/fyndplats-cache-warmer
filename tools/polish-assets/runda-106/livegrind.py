# -*- coding: utf-8 -*-
"""Runda 106 Steg 14 — läs de sex publicerade sidorna som kunden ser dem.

☠️ `?cb=` BUSTAR INTE ISR-cachen. Next.js nycklar på RUTTEN, inte på query.
   `grindar.hamta_isr` hämtar därför TVÅ gånger: den första beställer
   ombyggnaden, den andra är mätningen. Runda 104 rapporterade "0 av 6" på sex
   korrekta sidor för att den grinden saknade det.

☠️ KONTROLLMÄTNING: hjältebildens media-id MÅSTE hittas i HTML:en. Utan den vet
   man inte om ett "noll fel" betyder ren sida eller tom hämtning.

☠️ RUNDANS EGNA KRAV. Familjen är djurbostäder, och hela Steg 2 gick ut på att
   INGEN av dem räcker till en normalstor kanin. Två saker måste därför stå på
   varje sida, och grinden är den enda som kan bevisa att de gör det live:
     • den rättsliga upplysningen (SJVFS 2019:15) med raden att hagen inte
       säljs som kaninbostad, och
     • ordet "kanin" NÅGON ANNANSTANS ÄN i den upplysningen är ett löfte vi
       inte kan hålla. Samma regel som grind.py:s KANINLÖFTE, men mot den
       renderade sidan i stället för mot källtexten.
"""
import os, re, sys
sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), ".."))
import grindar as G                                              # noqa: E402
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import texter as T                                               # noqa: E402

BAS = "https://www.fyndplats.se/produkt/"

#            slug                       nyckel      hjältebild (pos 1)                       vårt kort (pos 3)                        golvyta
SIDOR = {
 "smadjurshage-181-natur":  ("a4c0595f", "b379ce_354ea92a266f4673b02e22eae81a3485~mv2",
                             "b379ce_f5ee4f0eee7d4154a47bb5d2dceb57e5~mv2", "1,81 m²"),
 "smadjurshage-181-gra":    ("7eebd0eb", "b379ce_c01e783000ef405da367d3fdb3d45115~mv2",
                             "b379ce_788d6dd4cbf64404978260dbe8ee0c35~mv2", "1,81 m²"),
 "smadjurshage-125-gra":    ("b54e7a23", "b379ce_a65587e01a184e3588b9110b26a1e68f~mv2",
                             "b379ce_0b51f860614545afae7be8a3cd37d158~mv2", "0,72 m²"),
 "smadjurshage-125-natur":  ("1f7ebf33", "b379ce_07d02d1cb4fb405e802e9b2ab9d20c92~mv2",
                             "b379ce_45e1710eeb094392ac8e04af4ef078f8~mv2", "0,72 m²"),
 "smadjurshage-123-cm-hus": ("edc81021", "b379ce_3f84c2832402418ba7991d4b103fa03c~mv2",
                             "b379ce_0d40fe545097445cb7e14a3bc89b3858~mv2", "1,48 m²"),
 "hopfallbar-hage-110-cm":  ("117691b5", "b379ce_5449898caa754a0c811988f31b3a1c5a~mv2",
                             "b379ce_fa8f9105e6b84c09bd21a2e60791453d~mv2", "1,16 m²"),
}

# ☠️ Ordlistan är vald för DEN HÄR familjen. `Stall`, `Gitter` och `Dach` står
#    INTE här: "stall" är svenska, och de två andra saknar svensk tvilling men
#    finns inte i källtexten heller. Orden nedan är de som FAKTISKT ligger i
#    leverantörens tyska brödtext för de sex produkterna.
FORBJUDET = [
  ("tyskt ord", re.compile(r"\b(Hasenstall|Kaninchenstall|Kaninchenk|Kleintier|Freigehege|"
                           r"Bodenwanne|Meerschweinchen|Zwergkaninchen|aufklappbar|"
                           r"Abmessungen|Lieferumfang|Geeignet f|Tannenholz|Massivholz)", re.I)),
  ("husmärke", re.compile(r"\b(PawHut|HOMCOM|Outsunny|Aiyaplay|Vinsetto|Aosom)\b", re.I)),
  ("lagerland", re.compile(r"Skickas fr[åa]n\s+(Tyskland|Polen|Spanien|Kina)", re.I)),
  ("artikelnummer", G.ARTNR),
  ("trasig relativ länk", re.compile(r"https:/produkt")),
  ("leverantörsattribution", re.compile(r"\bleverant[öo]ren?s?\b", re.I)),
]

# Den sanktionerade meningen, ordagrant ur texter.py — inte omskriven här, så
# de två inte kan glida isär.
UPPLYSNING = G.synlig_meningstext(T.KANINRADEN)
KANINORD = re.compile(r"kanin", re.I)


def granska(html, hjalte, kort, yta):
    fel = []
    if hjalte not in html:
        fel.append("KONTROLLMÄTNINGEN FALLER — hjältebilden finns inte i HTML:en")
    if kort not in html:
        fel.append("vårt eget kort saknas i galleriet")
    if yta not in html:
        fel.append(f"golvytan {yta} står inte på sidan")
    if "SJVFS" not in html:
        fel.append("den rättsliga upplysningen (SJVFS 2019:15) saknas")
    if "säljs inte som kaninbostad" not in html:
        fel.append("raden om att hagen inte säljs som kaninbostad saknas")

    # ☠️ Meningen står TVÅ gånger i svaret — en gång som HTML och en gång i
    #    Next.js JSON-nyttolast med `\u003c`-escapade taggar. SJÄLVA MENINGEN
    #    är identisk i båda, så `str.replace` (som byter ALLA förekomster)
    #    städar bort båda. Mätt på smadjurshage-181-natur: fyra träffar på
    #    "kanin", alla fyra inne i upplysningen, noll i butikens krom.
    utan = html.replace(UPPLYSNING, "")
    m = KANINORD.search(utan)
    if m:
        i = max(0, m.start() - 60)
        fel.append(f"KANINLÖFTE utanför upplysningen: …{utan[i:m.end() + 60]}…")

    for etikett, monster in FORBJUDET:
        t = monster.search(html)
        if t:
            fel.append(f"{etikett}: {t.group(0)!r}")
    return fel


if __name__ == "__main__":
    grona = 0
    for slug, (k, hjalte, kort, yta) in SIDOR.items():
        html, hdr = G.hamta_isr(BAS + slug)
        fel = granska(html, hjalte, kort, yta)
        if not fel:
            grona += 1
        print(f"{'OK ' if not fel else 'FEL'} {slug:<26} {len(html):>7} tecken  "
              f"cache={hdr.get('x-vercel-cache')} age={hdr.get('age')}")
        for f in fel:
            print("      ✗", f)
    print(f"\n{grona} av {len(SIDOR)} sidor gröna")
    sys.exit(0 if grona == len(SIDOR) else 1)
