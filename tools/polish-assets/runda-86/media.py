# -*- coding: utf-8 -*-
"""Runda 86 — medialistan per produkt.

☠️ EN BILD STRYKS FÖR INBRÄND TYSK TEXT: `364bc564`-4 bär "Multifunktionaler
   Stauraum — zwei eingebaute Regale bieten drei getrennte Ablageflächen".

⚠️ MÅTTRITNINGEN FLYTTAS SIST, inte till plats 3 där leverantören har den.
   Runbookens ordning är hjältebild → verklighetsbild → egna kort → ritning,
   och skälet är att kunden inte ska möta två spec-tabeller i rad.

⚠️ KORTET LÄGGS PÅ POSITION 3, efter huvudbilden och verklighetsbilden.

☠️ VARJE BILD HAR EN EGEN ALT-TEXT som beskriver just den bilden — inte
   samma mening med ett löpnummer efter.

✅ INGA DELADE MILJÖSCENER. `c9a24404` och `bb112e08` är samma skåp i två
   ytor, och det var där runda 85 hittade dubbletten — men här har
   leverantören faktiskt fotograferat dem i olika miljöer (spaljé mot grön
   vägg, vitt hus mot kaktus). Kontrollerat på kontaktarket, inte antaget.

☠️ `media.main` skickas ALDRIG — read-only i V3, och Wix ignorerar tyst
   HELA media-objektet om den är med.

☠️ RUNDANS EGEN ALT-GRIND ÄR MAXLASTEN OCH FÄRGEN. Sju skåp med sex olika
   lasttal och tre färger; en alt-text är text på sidan precis som
   spec-tabellen, och den kan inte bära ett ankare. Grinden läser
   `lint.MAXLAST`, `lint.UTAN_MAXLAST` och `lint.FARG` i stället för egna
   listor: två listor som säger samma sak glider isär.
"""
import json, os, re, sys

HAR = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, os.path.dirname(HAR)); sys.path.insert(0, HAR)
import lint                                                      # noqa: E402
from grindar import HUSMARKEN, LANDORD, ATTRIBUTION             # noqa: E402

BILDER = json.load(open(os.path.join(HAR, "bilder.json"), encoding="utf-8"))
KORT = json.load(open(os.path.join(HAR, "kort-ids.json"), encoding="utf-8"))

# Enheterna och separatorerna som faktiskt förekommer i rundans spec-listor.
# ⚠️ `m²` är med, av samma mätta skäl som i lint.py: en golvyta i m² var
#    OSYNLIG för talgrinden, och en muterad "0,43 m² golvyta" i en
#    alt-text slapp rakt igenom.
_ENHET = r"(cm|kg|liter|m²|%)"
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
    "c9a24404": [1, 2, 5, 4, 3],
    "bb112e08": [1, 2, 4, 5, 3],
    "1e11480e": [1, 2, 4, 5, 3],
    "d6666869": [1, 2, 4, 5, 3],
    "43e312b7": [1, 2, 4, 5, 3],
    "364bc564": [1, 2, 5, 3],          # 4 bär inbränd tysk text
    "8b00022f": [1, 2, 4, 5, 3],
}

# id8 -> {leverantörens bildposition: alt-text}. En text per bild.
ALT = {
    "c9a24404": {
        1: "Lågt trädgårdsskåp i naturfärgad gran med ett kryss över dörren "
           "och lutande tak",
        2: "Trädgårdsskåpet står öppet framför en spaljé med en spade och ett "
           "par stövlar bredvid",
        5: "Trädgårdsskåpet med dörren stängd, sett rakt framifrån",
        4: "Närbild på skåpets mörka takpapp och skruvinfästningen i taket",
        3: "Måttritning: skåpet är 75 cm brett, 56 cm djupt och 115 cm högt",
    },
    "bb112e08": {
        1: "Lågt trädgårdsskåp med grå stomme, vita lister och mörkt tak",
        2: "Det grå trädgårdsskåpet står öppet mot en grön vägg med "
           "trädgårdsredskap inuti",
        4: "Det grå trädgårdsskåpet står öppet mot en vit husvägg med stövlar "
           "och krukor i hyllorna",
        5: "Det grå trädgårdsskåpet stängt på en stenplatta bredvid en kaktus",
        3: "Måttritning: skåpet är 75 cm brett, 56 cm djupt och 115 cm högt",
    },
    "1e11480e": {
        1: "Smalt och högt trädgårdsskåp i gran med grönt sadeltak och "
           "fönster högst upp",
        2: "Det smala trädgårdsskåpet står mot ett plank med klätterväxter",
        4: "Närbild på en av de tre hörnhyllorna inuti skåpet",
        5: "Närbild på skåpets svarta gångjärn",
        3: "Måttritning: skåpet är 77 cm brett, 54,2 cm djupt och 179 cm högt",
    },
    "d6666869": {
        1: "Högt trädgårdsskåp i massiv gran med båda dörrarna öppna, hyllor "
           "upptill och en nisch nedtill",
        2: "Trädgårdsskåpet står öppet mot en vit panelvägg med krukor och "
           "redskap inuti",
        4: "Närbild på en korg med redskap och rep på en av hyllorna",
        5: "Närbild på sadeltakets gröna takpapp och takkanten",
        3: "Måttritning: skåpet är 79 cm brett, 49 cm djupt och 191,5 cm högt",
    },
    "43e312b7": {
        1: "Grått trädgårdsskåp med vita lister, det fällbara bordet utfällt "
           "och krokar innanför dörren",
        2: "Det grå trädgårdsskåpet står öppet med redskap i och en kanna på "
           "det fällbara bordet",
        4: "Närbild på krokskenan med fem krokar och tre träredskap hängande",
        5: "Närbild på skåpets svarta takyta",
        3: "Måttritning: skåpet är 78 cm brett, 52,5 cm djupt och 182 cm högt",
    },
    "364bc564": {
        1: "Trädgårdsskåp i naturfärgad gran med två lamelldörrar",
        2: "Trädgårdsskåpet med lamelldörrarna öppna och tre fack fyllda med "
           "krukor och stövlar",
        5: "Närbild på skåpets överkant och den lodräta panelen på sidan",
        3: "Måttritning: skåpet är 87 cm brett, 46,5 cm djupt och 160 cm högt",
    },
    "8b00022f": {
        1: "Brett trädgårdsskåp med grå stomme, vita kryss på båda dörrarna "
           "och mörkt tak",
        2: "Det breda trädgårdsskåpet står öppet på en gräsmatta med redskap "
           "inuti och trädgårdsbordet bredvid",
        4: "Närbild underifrån på takets utskjutande kant",
        5: "Närbild på skåpets svarta takyta",
        3: "Måttritning: skåpet är 139 cm brett, 75 cm djupt och 160 cm högt",
    },
}
KORTALT = {
    "c9a24404": "Faktakort: trädgårdsskåp i trä 115 cm, mått, hyllplan, "
                "maxlast och material",
    "bb112e08": "Faktakort: grått trädgårdsskåp i trä 115 cm, mått, hyllplan "
                "och maxlast",
    "1e11480e": "Faktakort: trädgårdsskåp 77 cm brett, mått, golvyta, "
                "hörnhyllor och maxlast",
    "d6666869": "Faktakort: trädgårdsskåp 191,5 cm, mått, grundyta, dörrar "
                "och hyllplan",
    "43e312b7": "Faktakort: grått trädgårdsskåp 182 cm, mått, det fällbara "
                "bordet och tre maxlaster",
    "364bc564": "Faktakort: trädgårdsskåp 160 cm, mått, lamelldörrar, "
                "fackhöjder och maxlast",
    "8b00022f": "Faktakort: trädgårdsskåp 139 cm brett, mått, bottenmått, "
                "dörrar och maxlast",
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
        # ☠️ RUNDANS EGNA GRINDAR: fel maxlast och fel färg. En alt-text kan
        #    inte bära ett ankare, så ett syskons tal eller färgord har ingen
        #    väg att bli korrekt här — bara att bli fel.
        if k in lint.UTAN_MAXLAST:
            if re.search(r"\d+\s*kg", txt):
                fel.append("%s: alt-texten anger en vikt eller last — källan "
                           "ger ingen maxlast för det här skåpet: %r"
                           % (k, txt))
        else:
            for annan_k, tal_lista in lint.MAXLAST.items():
                if annan_k == k:
                    continue
                for tal in tal_lista:
                    if tal in lint.MAXLAST[k]:
                        continue
                    if re.search(r"\b%d kg\b" % tal, txt):
                        fel.append("%s: alt-texten nämner %d kg — det är "
                                   "%s:s maxlast" % (k, tal, annan_k))
        fel_farg = lint.FEL_FARG_RE.get(lint.FARG[k])
        if fel_farg and fel_farg.search(txt):
            fel.append("%s: alt-texten påstår en färg som hör till ett "
                       "SYSKON — den här är %s: %r" % (k, lint.FARG[k], txt))
        for m in lint.BYGGLOV_RE.findall(txt):
            fel.append("%s: alt-texten påstår något om bygglov: %r" % (k, m))
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
MATTRAD = {k: "Yttermått" for k in ORDNING}
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
