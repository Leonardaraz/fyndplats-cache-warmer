# -*- coding: utf-8 -*-
"""Steg 14 — live-grind med KONTROLLSIDA.

☠️ En ordlista mot en live-sida mäter SAJTEN, inte din text: header, EU-ribbon,
JSON-LD, footer och skript bär förbudsord av sig själva. Runda 90 fällde 7 av 7
korrekta sidor på just det. Därför hämtas en kontrollsida rundan inte rört, och
bara det som finns på MIN sida men INTE på kontrollens rapporteras.

☠️ Och den körs i PYTHON, inte JS: `\b` är unicode-medveten här, så `kläder`
inte längre slutar på ett fristående `der`.
"""
import re, sys, unicodedata

SIDOR = {
    "cremevit-fotpall-forvaring": ("massagefatolj-cremevit-fotpall-forvaring",
        "Massagefåtölj i cremevitt konstläder på en stomme", "Cremevit"),
    "brun-fotpall-forvaring": ("massagefatolj-brun-fotpall-forvaring",
        "Massagefåtölj i brunt konstläder på en stomme", "Brun"),
    "morkgra-tyg-forvaring": ("massagefatolj-morkgra-tyg-forvaring",
        "Massagefåtölj i mörkgrått tyg på en stomme", "Mörkgrå"),
    "brun-160-kg": ("massagefatolj-brun-160-kg",
        "Massagefåtölj i brunt konstläder med extra hög rygg", "Brun"),
    "svart-160-kg": ("massagefatolj-svart-160-kg",
        "Massagefåtölj i svart konstläder med extra hög rygg", "Svart"),
}
KONTROLL = "nattduksbord-rgb-led-tva-lador"

def synlig(html: str) -> str:
    h = re.sub(r"(?is)<(script|style|noscript)[^>]*>.*?</\1>", " ", html)
    h = re.sub(r"(?s)<[^>]+>", " ", h)
    h = h.replace("&nbsp;", " ").replace("&amp;", "&").replace("&#x27;", "'")
    return re.sub(r"\s+", " ", h)

# Familjens ordförråd: tyska ord UTAN svensk tvilling. `Metall`, `Glas` och
# `Sessel`-lösa ord som stavas lika på båda språken hör inte hemma här.
TYSKA = ["Sessel", "Fußhocker", "Fusshocker", "Massagesessel", "Neigung",
         "Kunstleder", "Lieferumfang", "Beschreibung", "Schlafzimmer",
         "Wohnzimmer", "Rückenlehne", "Sitzhöhe", "Belastbarkeit", "Weiß",
         "Schwarz", "Braun", "Grau", "Hocker", "Stauraum", "Massagepunkte"]
# ☠️ Mot kunden är VI leverantören.
AKTOR = re.compile(r"(?<![A-Za-zÅÄÖåäö0-9])(leverantör\w*|tillverkar\w*|"
                   r"producent\w*|importör\w*|grossist\w*|fabrikant\w*|"
                   r"distributör\w*)(?![A-Za-zÅÄÖåäö0-9])", re.I)
# Aosoms artikelnummer får aldrig nå en kundsida.
ARTNR = re.compile(r"\b\d{3}-\d{3}[A-Z0-9]{3,}\b")
# Sifferstil: kommalista av tal med enheten sist. Listkommat har mellanslag.
KOMMALISTA = re.compile(r"\d+(?:,\d+)?, \d+(?:,\d+)?(?:,| och) ")
OSYNLIGA = {"­": "U+00AD", "​": "U+200B", "﻿": "U+FEFF"}

def fynd(text: str) -> set:
    ut = set()
    for o in TYSKA:
        if re.search(r"(?<![A-Za-zÅÄÖåäöß])" + re.escape(o) + r"(?![A-Za-zÅÄÖåäöß])", text):
            ut.add("tyska:" + o)
    for m in AKTOR.finditer(text):
        ut.add("aktor:" + m.group(0).lower())
    for m in ARTNR.finditer(text):
        ut.add("artnr:" + m.group(0))
    for m in KOMMALISTA.finditer(text):
        ut.add("kommalista:" + m.group(0).strip())
    for tecken, namn in OSYNLIGA.items():
        if tecken in text:
            ut.add("osynligt:" + namn)
    return ut

kontroll = fynd(synlig(open(KONTROLL + ".html", encoding="utf-8").read()))
print("KONTROLLSIDA %s: %d fynd som är sajten, inte texten" % (KONTROLL, len(kontroll)))
for f in sorted(kontroll):
    print("   (dras bort)", f)
print()

fel = 0
for kort, (fil, ingress, farg) in SIDOR.items():
    html = open(fil + ".html", encoding="utf-8").read()
    t = synlig(html)
    egna = fynd(t) - kontroll
    saknas = []
    if ingress not in t:
        saknas.append("ingressen med färgen saknas")
    if ("Färg: " + farg) not in t and ("Färg:" + farg) not in t:
        saknas.append("Färg-raden saknas i spec-tabellen")
    if "Fler massagefåtöljer hos oss" not in t:
        saknas.append("syskonlistan saknas")
    # Sidan ska bära tolv absoluta syskonlänkar
    lankar = len(set(re.findall(r"/produkt/(massagefatolj-[a-z0-9-]+)", html))) - 1
    if lankar < 12:
        saknas.append("bara %d syskonlänkar" % lankar)
    status = "OK " if not egna and not saknas else "FEL"
    if egna or saknas:
        fel += 1
    print("%s %-28s  egna fynd: %-30s %s"
          % (status, kort, sorted(egna) or "inga", "; ".join(saknas) or ""))

print()
print("SUMMA: %d av %d sidor med anmärkning" % (fel, len(SIDOR)))
sys.exit(1 if fel else 0)
