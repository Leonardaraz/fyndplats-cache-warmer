#!/usr/bin/env python3
"""Delad ordlista och hjälpare för poleringens filgrindar.

☠️ VARFÖR DEN FINNS. Grindarna kopierades in i varje rundas katalog, och
kopiorna drev isär. Uppmätt 2026-09-06: **19 kopior av fyra grindar i tre
olika versioner**, och det som skilde var inte strukturen utan ORDLISTAN:

    runda A/F1   …|Kinder|Sofa|Jahre|Maße|robust|niedlich|gemütlich|…
    runda F2     …|Kratzbaum|Katzen|Plüsch|…
    runda G1/G2  …|Stuhl|Bezug|Kufen|Polsterung|Schaukel|kuschelig|flauschig|…

Varje runda ersatte föregående rundas tyska ord med sina egna. UNIONEN har
alltså aldrig körts. Runda H1 (kattlådor) gatades med gungstolarnas vokabulär
— `Katzen`, `Deckel`, `Schaufel` och `Edelstahl` kontrollerades aldrig.

Samma klass som SHIP_AXIS_RE och EU_TULL_CODES: en tvilling glider isär, och
den som glider tystast är den som ser ut att fungera. Grindarna bor därför
HÄR, en gång, och rundorna anropar dem — precis som livegrind.py redan gör.

☠️ ORDEN FÅR BARA LÄGGAS TILL, ALDRIG BYTAS UT. Att ta bort ett ord för att
"det gäller inte den här rundan" är exakt hur listorna drev isär.
"""
import re

MARKEN = r"HOMCOM|Outsunny|PawHut|Aiyaplay|Aosom|SportNow|Vinsetto|Kleankin|Zonekiz|Durhand"
ARTNR = r"\b\d{3}-\d{3}[A-Z0-9]*\b|\b\d{2}[A-Z]-\d{3}"
LAND = (r"\b(Tyskland|Deutschland|tysk[at]?|Spanien|spansk|Polen|polsk|Kina|kines"
        r"|EU-lager|skickas fr[åa]n|lagerland)\b")
LEV = r"\b([Ll]everant[öo]r\w*|[Tt]illverkaren anger|vi vet inte|enligt uppgift)\b"
HOMO = r"[Ѐ-ӿͰ-Ͽ]"
NORM = r"\bEN\s?\d{3,5}\b"

# UNIONEN av alla rundors tyska ord, plus de som källtexterna faktiskt bär.
# ⚠️ Ord som ÄR svenska med versal i meningsstart är medvetet uteslutna:
# Metall, Filter, Boden och Hund ger falsklarm på korrekt svenska.
TYSKA_ORD = [
    # bindeord och verb — funnits i alla versioner
    "und", "mit", "für", "der", "die", "das", "ist", "sind",
    # runda A/F1
    "Kinder", "Sessel", "Sofa", "Jahre", "Maße", "Farbe", "Gewicht",
    "Lieferumfang", "Montage", "Rückenlehne", "weich", "robust", "niedlich",
    "gemütlich",
    # runda F2
    "Kratzbaum", "Katzen", "Plüsch",
    # runda G1/G2
    "Stuhl", "Bezug", "Kufen", "Polsterung", "Schaukel", "kuschelig", "flauschig",
    # runda H1 — ord kattlådornas källtexter faktiskt bär
    "Katzenklo", "Katzentoilette", "Katzenhaus", "Streu", "Streuschaufel",
    "Schaufel", "Deckel", "Klappdeckel", "Wanne", "Schrank", "Trennwand",
    "Regal", "Pfosten", "Griff", "Tür", "Kunststoff", "Edelstahl", "Spanplatte",
    "Holz", "Stahl", "Innenraum", "Abmessungen", "Gesamtmaße", "Belastung",
    "Bedienungsanleitung", "Handbuch", "Anleitung", "Höhe", "Breite", "Tiefe",
    "Grau", "Weiß", "Schwarz", "Braun", "Grün", "Hellgrau", "Dunkelgrau",
]
TYSKA = r"(?<![a-zåäöéü])(" + "|".join(TYSKA_ORD) + r")(?![a-zåäöéü])"

# UNIONEN av stavfel och danska/norska former. `gungstol(?=en\b)(?!)` från
# runda G är BORTTAGET: `(?!)` misslyckas alltid, så mönstret var dött.
STAV_ORD = [
    "dögnsvarv", "engangsjobb", "ihopsattningen", "for hard", "hallbar",
    "fatolj", "hojd", "langd", "sakerhet", r"storlek(?!en|ar)",
    "rundt", "hvid", "sort", r"gul[vt]", "blød", "hjørne", "stof", "læder",
    "siddehøjde", "ryglæn", r"fod(?=en\b)",
]
STAV = r"\b(" + "|".join(STAV_ORD) + r")\b"

GRINDAR = [("HUSMÄRKE", MARKEN), ("ARTIKELNUMMER", ARTNR), ("FRAKTLAND", LAND),
           ("LEVERANTÖR", LEV), ("TYSK REST", TYSKA), ("STAVNING", STAV),
           ("HOMOGLYF", HOMO), ("EN-NORM UTAN KÄLLA", NORM)]

FLIKAR = ("Tekniska specifikationer", "Användning och skötsel", "Vanliga frågor")


def tal(text):
    """Alla tal, normaliserade så 44,5 och 44.5 jämförs lika."""
    return {t.replace(".", ",").rstrip(",") for t in re.findall(r"\d+(?:[.,]\d+)?", text)}


def kropp(html):
    """Brödtext utan taggar. ☠️ href MÅSTE bort före siffergrinden — en slug
    bär produktens mått ("baddfatolj-190-cm"), och de siffrorna är en ADRESS,
    inte ett påstående om varan."""
    html = re.sub(r'href="[^"]*"', 'href=""', html)
    return re.sub(r"<[^>]+>", " ", html)


def normalisera(s):
    """Wix normaliserar två saker: blanksteg mellan blockelement strippas och
    target="_self" läggs till på varje <a href>. En rå strängjämförelse ger
    därför "alla skiljer" på en felfri skrivning."""
    s = s.replace(' target="_self"', "")
    return re.sub(r">\s+<", "><", s).strip()


def fnv(s):
    """FNV-1a 64-bitars. Samma funktion går att skriva i sandlådans JS utan
    require/crypto, så hashen kan räknas på BÅDA sidor och jämföras."""
    h = 0xcbf29ce484222325
    for c in s.encode("utf-8"):
        h ^= c
        h = (h * 0x100000001b3) & 0xFFFFFFFFFFFFFFFF
    return f"{h:016x}"
