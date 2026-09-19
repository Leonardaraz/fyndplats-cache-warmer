# -*- coding: utf-8 -*-
"""Runda 85 — medialistan per produkt.

☠️ FYRA BILDER STRYKS FÖR INBRÄND TYSK TEXT, alla på position 4. Se STEG4.md:
   `17fb1869`, `b10b80ee` och `10c47f8e` bär "RAHMEN AUS EDELSTAHL" plus
   Wasserdicht/Fingerabdrucksicher/Leicht zu reinigen, och `ec672f4d` bär
   "Deckelblöcke Geruch", "Zuverlässiger Rahmen", "Herausnehmbare
   Innenbehälter", "Sockel Montiert".

☠️ TVÅ MILJÖSCENER FÖRDELAS MELLAN SYSKONEN. `b10b80ee` och `10c47f8e` är
   samma tunna i två ytor, och leverantören har klistrat in dem i EXAKT samma
   två scener: samma marmorköksö med samma växt, och samma kontor med samma
   person i samma pose. Att lägga båda scenerna på båda sidorna hade gett två
   av VÅRA egna URL:er nästan identiska foton — den dubblett Google straffar,
   och den uppstår av oss, inte av leverantören. Köket går till silvret,
   kontoret till svarta. Priset är fyra bilder per sida i stället för fem.

⚠️ MÅTTRITNINGEN FLYTTAS SIST, inte till plats 4 där leverantören har den.
   Runbookens ordning är hjältebild → verklighetsbild → egna kort → ritning,
   och skälet är Leonards regel från 2026-08-22: kunden ska inte möta två
   spec-tabeller i rad. Med kortet på plats 3 och ritningen på plats 4 blir
   det precis det. Runda 84 lämnade ritningen på plats 4; det här är rättat.

⚠️ KORTET LÄGGS PÅ POSITION 3, efter huvudbilden och verklighetsbilden.

☠️ VARJE BILD HAR EN EGEN ALT-TEXT som beskriver just den bilden. Runda 84
   satte samma mening på alla fem med ett löpnummer efter — det är samma mall
   fem gånger, vilket runbooken uttryckligen säger att man inte ska göra, och
   en skärmläsare läser upp "(4)" utan att det betyder något.

☠️ `media.main` skickas ALDRIG — den är read-only i V3 och gav en extra
   omimport av huvudbilden (mätt 2026-08-28).

☠️ RUNDANS EGEN ALT-GRIND ÄR MATERIALET. Sex syskon har tre olika stommar,
   och en alt-text är text på sidan precis som spec-tabellen. Grinden läser
   `lint.MATERIAL` och `lint.FEL_MATERIAL_RE` i stället för en egen lista:
   två listor som säger samma sak glider isär.
"""
import json, os, re, sys

HAR = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, os.path.dirname(HAR)); sys.path.insert(0, HAR)
import lint                                                      # noqa: E402
from grindar import HUSMARKEN, LANDORD, ATTRIBUTION             # noqa: E402

BILDER = json.load(open(os.path.join(HAR, "bilder.json"), encoding="utf-8"))
KORT = json.load(open(os.path.join(HAR, "kort-ids.json"), encoding="utf-8"))

# Enheterna och separatorerna som faktiskt förekommer i rundans spec-listor.
_ENHET = r"(cm|kg|liter|%)"
_ENKEL = re.compile(r"(\d+(?:,\d+)?)\s*" + _ENHET)
_KEDJA = re.compile(r"((?:\d+(?:,\d+)?\s*(?:[×x+–-]|plus)\s*)+\d+(?:,\d+)?)"
                    r"\s*" + _ENHET)


def tal_med_enhet(text):
    ut = set("%s %s" % (a, e) for a, e in _ENKEL.findall(text))
    for kedja, enhet in _KEDJA.findall(text):
        for d in re.findall(r"\d+(?:,\d+)?", kedja):
            ut.add("%s %s" % (d, enhet))
    return ut


TILLATNA = {p["kort"]: tal_med_enhet(" ".join(p["spec"]))
            for p in lint.PRODUKTER}

# id8 -> leverantörsbildernas ordning i galleriet (1-baserat), måttritningen
# sist. Positioner som inte står med stryks; se docstring för varför.
ORDNING = {
    "17fb1869": [1, 2, 5, 3],
    "b10b80ee": [1, 2, 3],          # kontorsscenen går till 10c47f8e
    "10c47f8e": [1, 5, 3],          # köksscenen går till b10b80ee
    "213be879": [1, 2, 4, 5, 3],
    "a00882ed": [1, 2, 4, 5, 3],
    "ec672f4d": [1, 2, 5, 3],
}

# id8 -> {leverantörens bildposition: alt-text}. En text per bild.
ALT = {
    "17fb1869": {
        1: "Låg soptunna med två fack i mörk borstad stålyta, sedd snett "
           "framifrån med de två fotpedalerna",
        2: "Den låga soptunnan med två fack står mot en ribbad vägg vid en "
           "dörröppning",
        5: "Två låga soptunnor med två fack står intill en köksbänk i trä",
        3: "Måttritning: soptunnan med två fack är 41,7 cm bred, 36,6 cm djup "
           "och 43,2 cm hög",
    },
    "b10b80ee": {
        1: "Soptunna med två fack i polerat silverfärgat stål, sedd framifrån "
           "med de två fotpedalerna",
        2: "Soptunnan i silver står intill en köksö med vit marmorskiva",
        3: "Måttritning: soptunnan i silver är 45,8 cm bred, 36 cm djup och "
           "51,6 cm hög",
    },
    "10c47f8e": {
        1: "Soptunna med två fack i blank svart yta, sedd framifrån med de "
           "två fotpedalerna",
        5: "Den svarta soptunnan står vid en dörr på ett kontor medan någon "
           "trampar på pedalen",
        3: "Måttritning: den svarta soptunnan är 45,8 cm bred, 36 cm djup och "
           "51,6 cm hög",
    },
    "213be879": {
        1: "Smal och hög soptunna med två fack i silverfärgat stål med "
           "fotpedal längst ned",
        2: "Den smala soptunnan står mellan en grön köksstomme och en "
           "krukväxt",
        4: "Den smala soptunnan med locket uppfällt, med de två facken synliga "
           "uppifrån",
        5: "De två svarta innerhinkarna lyfta ur den smala soptunnan",
        3: "Måttritning: den smala soptunnan är 40 cm bred, 34,8 cm djup och "
           "59 cm hög",
    },
    "a00882ed": {
        1: "Vit soptunna med två fack, svart lockram och svart sockel med två "
           "fotpedaler",
        2: "Den vita soptunnan står under kanten på ett mörkt matbord",
        4: "Den vita soptunnan med båda locken uppfällda intill en mörk "
           "köksbänk",
        5: "Närbild på den vita soptunnans svarta sockel och de två "
           "förkromade pedalbyglarna",
        3: "Måttritning: den vita soptunnan är 48,8 cm bred, 39,5 cm djup och "
           "67 cm hög",
    },
    "ec672f4d": {
        1: "Utdragbar soptunna med tre fack i ljusgrå plast, med ram, skenor "
           "och lock i en enhet",
        2: "Den utdragbara soptunnan halvvägs utdragen ur ett vitt köksskåp",
        5: "Den utdragbara soptunnan monterad i skåpet under en diskbänk",
        3: "Måttritning: den utdragbara soptunnan rymmer 15 liter plus två på "
           "8, och mäter 48 × 34,3 × 35,1 cm utdragen",
    },
}
KORTALT = {
    "17fb1869": "Faktakort: soptunna med två fack 30 liter, mått, öppning, "
                "lock och stommens material",
    "b10b80ee": "Faktakort: soptunna med två fack 40 liter i silver, mått, "
                "innerhinkar och stommens material",
    "10c47f8e": "Faktakort: soptunna med två fack 40 liter i svart, mått, "
                "innerhinkar och stommens material",
    "213be879": "Faktakort: smal soptunna med två fack 40 liter, mått, "
                "handtag och stommens material",
    "a00882ed": "Faktakort: soptunna med två fack 60 liter, mått, lock, "
                "innerhinkar och stommens material",
    "ec672f4d": "Faktakort: utdragbar soptunna med tre fack 31 liter, "
                "rammått och de tre hinkarnas mått",
}

# ── Grinden ligger FÖRE planen, inte efter ──────────────────────────────────
fel = []
for k, ord_ in ORDNING.items():
    texter = [ALT[k].get(n) for n in ord_] + [KORTALT.get(k)]
    if any(t is None for t in texter):
        fel.append("%s: alt-text saknas för någon bild" % k); continue
    if len(set(texter)) != len(texter):
        fel.append("%s: två bilder delar alt-text" % k)
    for txt in texter:
        låg = txt.lower()
        for m in HUSMARKEN:
            if m.lower() in låg:
                fel.append("%s: husmärke %r i alt-text %r" % (k, m, txt))
        for o in LANDORD:
            if o.lower() in låg:
                fel.append("%s: landsnamn %r i alt-text %r" % (k, o, txt))
        # ☠️ Mot kunden är VI leverantören — samma regel som i brödtexten.
        for a in ATTRIBUTION:
            if re.search(r"\b%s\b" % re.escape(a.lower()), låg):
                fel.append("%s: attribution %r i alt-text %r" % (k, a, txt))
        # ☠️ Intern jargong (lint-grind 5c) gäller alt-texten också: en
        #    alt-text läses upp av skärmläsare och indexeras av Google.
        if re.search(r"\brundans?\b|\bi rundan\b|\bpolering|\butkast", låg):
            fel.append("%s: intern jargong i alt-text %r" % (k, txt))
        # ☠️ Tyskan får inte smyga in via alt-texten heller.
        for t in lint.TYSKA_BANK:
            if re.search(r"\b%s\b" % re.escape(t.lower()), låg):
                fel.append("%s: tyskt ord %r i alt-text %r" % (k, t, txt))
        # ☠️ RUNDANS EGEN GRIND: fel stommaterial. Alt-texten kan inte bära
        #    ett ankare, så ett materialord som motsäger lint.MATERIAL är
        #    lika illa här som i brödtexten.
        if lint.FEL_MATERIAL_RE[lint.MATERIAL[k]].search(txt):
            fel.append("%s: alt-texten påstår ett material produkten inte "
                       "har: %r" % (k, txt))
        # ☠️ VARJE TAL I EN ALT-TEXT MÅSTE STÅ I PRODUKTENS EGEN SPEC.
        #    En alt-text kan inte bära ett ankare, så ett syskons volym eller
        #    en konkurrents mått har ingen väg att bli korrekt här — de kan
        #    bara bli fel. Samma regel som lint kör på brödtexten (grind
        #    "tal som inte står i produktens egen spec"), men med `liter`
        #    och `+` med i mönstret: rundans volymer skrivs "15 + 8 + 8
        #    liter", och lints egna TAL_RE känner varken enheten eller
        #    separatorn.
        for t in sorted(tal_med_enhet(txt) - TILLATNA[k]):
            fel.append("%s: talet %r i alt-texten står inte i produktens "
                       "egen spec: %r" % (k, t, txt))

# ☠️ MÅTTRITNINGENS ALT-TEXT MÅSTE ÅTERGE MÅTTRADEN EXAKT.
#    Grinden ovan ("talet står i produktens egen spec") räcker inte just här,
#    och det är MÄTT: byter man b10b80ee:s "45,8 cm bred" mot syskonets
#    "40 cm bred" släpps det igenom, eftersom 40 cm står i den produktens
#    PAKETMÅTT. Ritningen påstår sig återge en bestämd rad, så den får jämföras
#    med just den raden i stället för med hela specen.
MATTRAD = {"17fb1869": "Mått", "b10b80ee": "Mått", "10c47f8e": "Mått",
           "213be879": "Mått", "a00882ed": "Mått",
           "ec672f4d": "Yttermått utdragen"}
SPEC = {p["kort"]: p["spec"] for p in lint.PRODUKTER}
for k, etikett in MATTRAD.items():
    rad = [r for r in SPEC[k]
           if r.split(":")[0].split("(")[0].strip() == etikett]
    if len(rad) != 1:
        fel.append("%s: hittar inte spec-raden %r" % (k, etikett)); continue
    vantat = {t for t in tal_med_enhet(rad[0]) if t.endswith(" cm")}
    fick = {t for t in tal_med_enhet(ALT[k][3]) if t.endswith(" cm")}
    if fick != vantat:
        fel.append("%s: måttritningens alt-text säger %s men raden %r säger %s"
                   % (k, sorted(fick), etikett, sorted(vantat)))

plan = {}
for k, ord_ in ORDNING.items():
    rader = [{"id": BILDER[k][n - 1], "altText": ALT[k][n]} for n in ord_]
    rader.insert(2, {"id": KORT[k], "altText": KORTALT[k]})
    plan[k] = rader

if __name__ == "__main__":
    for f in fel:
        print("FEL:", f)
    if fel:
        raise SystemExit("ALT-GRINDEN FÄLLER: %d fel — ingen plan skriven" % len(fel))
    json.dump(plan, open(os.path.join(HAR, "media-plan.json"), "w", encoding="utf-8"),
              ensure_ascii=False, indent=1)
    for k, r in plan.items():
        strukna = 5 - len(ORDNING[k])
        print("%s  %d bilder (%d leverantörsbilder strukna), kortet på plats 3, "
              "måttritningen sist" % (k, len(r), strukna))
