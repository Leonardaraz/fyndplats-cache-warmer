# -*- coding: utf-8 -*-
"""Runda 139 — Faktakorten. EN DATAFIL: reglerna bor i `kortrunda.py`.

☠️ RUBRIKEN MÅSTE BÄRAS AV FOTOT, inte av spec-tabellen. Varje rubrik nedan är
   vald mot BILD 1 i ett kontaktark (`ark9-1.jpg`, `ark9-2.jpg`) och beskriver
   något man ser i samma ögonkast som man läser den. Runbokens mätning: sju av
   sextiofem kort föll för att rubriken tog ett TAL ur tabellen i stället för
   ett INTRYCK ur bilden.

⚠️ TIO OLIKA MODELLER, inga färgpar. `kortrunda.kontroll` fäller ändå på delad
   kicker, och det är kontrollen som gäller.

☠️ TRE AV TIO HAR INGEN MÅTTRITNING KVAR i galleriet — `3addfbf8` och
   `8d074911` fick sina borttagna i Steg 4 (tysk text i pixlarna). För dem är
   kortet det ENDA stället på sidan där måtten står som bild, inte bara som
   tabellrad. Radvalet för de två är därför måttbärande, inte illustrativt.
"""
import json
import os
import sys

HAR = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, os.path.join(HAR, ".."))
sys.path.insert(0, HAR)
import kortrunda as KR                                           # noqa: E402
import grind as GR                                               # noqa: E402
import texter as T                                               # noqa: E402

KORT = {
    # Bild 1: en ovanligt grov sisalstam bär hela möbeln — den är bredare än
    # allt annat i bilden, och det syns direkt.
    "1467588a": ("Klösträd 92 cm, mörkgrått", "Ovanligt tjock sisalstam"),
    # Bild 1: pelaren är fyrkantig och toppas av en ekfärgad träplatta.
    "27b607dc": ("Klöspelare 80 cm, ekfärgad", "Fyrkantig pelare med trätopp"),
    # Bild 1: hängbädden är slängd mellan två stolpar LÄNGST NER, inte i mitten.
    "3a96740e": ("Klösträd 153 cm, kaffebrunt", "Hängbädden sitter längst ner"),
    # Bild 1: den U-formade rännan ligger överst, tvärs över hela bredden.
    "3addfbf8": ("Klösträd 76 cm, ljusgrått", "U-formad bädd överst"),
    # Bild 1: en sisalklädd ramp lutar från golvet upp till hålans öppning.
    "4faf9f4c": ("Klösträd 113 cm, ljusgrått", "Ramp upp till hålan"),
    # Bild 1: de fyra delarna ligger utspridda med luft emellan — de hänger
    # inte ihop till en kolumn, och det är hela poängen med setet.
    "8d074911": ("Väggklösträd i fyra delar", "Delarna placeras var för sig"),
    # Bild 1: en enda smal grön stolpe går hela vägen upp till taket.
    "90573e36": ("Klösträd 220–240 cm, grönt", "Grön stolpe från golv till tak"),
    # Bild 1: två runda hål i sisalmanteln, ett övre och ett nedre.
    "a4d8feca": ("Klöstunna 60 cm, naturbrun", "Två ingångar i sisalytan"),
    # Bild 1: tre fristående runda klivsteg i en stigande linje till vänster.
    "b04b5375": ("Väggklösträd 73 cm, beige", "Tre klivsteg leder upp"),
    # Bild 1: bottenplattan är en rund skiva — resten av rundan har rektangulära.
    # ☠️ FÖRSTA RUBRIKEN SA "Rund bas, fyra plan ovanpå" OCH RÄKNADE FEL.
    #    Brödtexten räknar basen SOM ett av de fyra planen ("bas, mellanplan,
    #    hus och toppbädd"); rubriken lade fyra OVANPÅ den, alltså fem. Kortet
    #    och sidan hade motsagt varandra i samma ögonkast. Kontaktarket fällde
    #    den — ingen textgrind kan, för båda talen är härledda och inget ord
    #    är förbjudet. Det är RÄKNINGEN som är fel.
    "b813d037": ("Klösträd 104 cm, grått", "Fyra plan, underst en rund platta"),
}

# Fem rader per kort, alla HÄRLEDDA ur `texter.SPEC` — kortet skriver aldrig
# ett eget värde.
# ☠️ KORTETIKETTENS FÖRSTA ORD MÅSTE FINNAS I SPEC-ETIKETTEN (`kortbygge.varde`).
RADER = {
    "1467588a": ["Mått", "Bädd", "Övre plan", "Stam",
                 ("Rekommenderad kattvikt", "Rekommenderad vikt")],
    "27b607dc": ["Mått", "Sisalyta", "Stolpe", "Topplatta",
                 ("Rekommenderad kattvikt", "Rekommenderad vikt")],
    "3a96740e": ["Mått", "Håla", "Stam", "Vikt",
                 ("Rekommenderad kattvikt", "Rekommenderad vikt")],
    # Ingen måttritning kvar i galleriet — korten bär måtten.
    "3addfbf8": ["Mått", "Toppbädd", "Mellanplan", "Rund bädd", "Klösbräda"],
    "4faf9f4c": ["Mått", "Håla", "Toppbädd", "Ramp", "Bärförmåga"],
    # Ingen måttritning kvar i galleriet — korten bär måtten.
    "8d074911": [("Mått, klösstolpen", "Klösstolpen"), ("Antal delar", "Antal delar"),
                 "Håla", ("Mjuk stege", "Mjuk stege"), "Kattbädd"],
    "90573e36": ["Mått", "Takhöjd", "Håla", ("Blomformade plan", "Blomformade plan"),
                 "Ramp"],
    "a4d8feca": ["Mått", "Nedre rum", "Övre rum", "Ingång", "Bärförmåga"],
    "b04b5375": [("Mått, huvuddelen", "Huvuddelen"), ("Antal delar", "Antal delar"),
                 "Klösstam", "Hängmatta", "Klivsteg"],
    "b813d037": ["Mått", "Bas", "Hus", "Toppbädd", "Bärförmåga"],
}

# ☠️ Bild 1 per produkt HÄRLEDS ur `galleri.json`, aldrig avskriven.
GALLERI = json.load(open(os.path.join(HAR, "galleri.json"), encoding="utf-8"))
FILER = {pid: GALLERI[pid][0] for pid in KORT}

MJUKA = {
    # ☠️ Sisalväven pa tunnan ar exakt det fall runda 108 matte upp: en tat
    #    textur gar inte att krympa eller nedsampla under taket, men gaussisk
    #    oskarpa ger 43–50 % vid r=3. Lagd pa den BESKURNA varan, aldrig pa
    #    den fardiga panelen — efterat blir produktens kant en gra gloria.
    # ⚠️ NYCKELN AR PRODUKT-ID, inte kortnamnet: `mjuka_upp(k, ...)` anropas
    #    med `k`, medan verktyget skriver ut `a4d8feca_spec`. Fel nyckel ar en
    #    TYST no-op — samma utfall som runda 130:s doda kod.
    "a4d8feca": 3,
}

if __name__ == "__main__":
    KR.kor(HAR, T, KORT, RADER, FILER, forbjudet=GR.FORBJUDET, mjuka=MJUKA)
