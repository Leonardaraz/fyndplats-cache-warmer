# -*- coding: utf-8 -*-
"""Runda 101 Steg 14 — live-grind med KONTROLLPROV.

☠️ Runda 90: ett svep utan kontrollprov fällde 7 av 7 KORREKTA sidor. Sajtens
   egen krom (EU-lager-ribbon, Organization-JSON-LD, footer) innehåller både
   "Skickas från" och tal i formen \\d{3}-\\d{3}\\w. Varje träff som ALLTID
   finns dras därför bort mot en publicerad sida rundan aldrig rört.

☠️ Hämta TVÅ gånger. ISR svarar stale-while-revalidate: första anropet kan ge
   den gamla sidan OCH beställa ombyggnaden. Det andra är mätningen.

☠️ Ordlistan väljs per FAMILJ. Ord som stavas lika på svenska och tyska
   (massage, komfort, material, metall, design, motor) hör inte hemma i den.
   Gränsen skrivs explicit med svenska bokstäver i lookaround.
"""
import json
import re
import subprocess
import sys

sys.path.insert(0, ".")
import texter as T                                                # noqa: E402

BAS = "https://www.fyndplats.se/produkt/"
KONTROLL = "massagefatolj-uppresning-konstlader-svart"   # publicerad, orörd

# ☠️ TVÅ LISTOR, för gränsen sitter olika.
#    Sammansatta substantiv boundas bara i BÖRJAN, så böjda former
#    (Sitzbänke) fastnar. Funktionsord MÅSTE boundas i BÅDA ändar:
#    `und` matchar annars svenskans under, underlag och används — nio
#    falsklarm per sida i första svepet.
TYSKA_NOMEN = ["Massagesessel", "Relaxsessel", "Sessel", "Hocker", "Fußhocker",
               "Kunstleder", "Rückenlehne", "Liegefunktion", "Fernbedienung",
               "Belastbarkeit", "Lieferumfang", "Sitzfläche", "verstellbar",
               "Wohnzimmer", "Stauraum", "versteckter", "Farbe", "Weiß",
               "Schwarz", "Braun", "Leinenoptik", "Armlehne", "drehbar"]

# ☠️ BORTVALDA MED FLIT — tyska ord som är PREFIX till svenska ord.
#    `Massagepunkte` sitter i svenskans massagepunkter, `Grau` i grausam-
#    ingenting men `Grad`/`gradvis` är nära nog att inte vara värt risken.
#    Samma lärdom som runbookens Gelb i re·gelb·undet: kurering hjälper inte,
#    och en ledande gräns räcker inte när ORDET är en delsträng.
TYSKA_PREFIX_TILL_SVENSKA = ["Massagepunkte", "Grau"]

TYSKA_FUNKTION = ["für", "mit", "und", "der", "die", "das", "ohne", "oder",
                  "auch", "sehr", "sowie"]

FORE = r"(?<![A-Za-zÅÄÖåäö0-9])"
EFTER = r"(?![A-Za-zÅÄÖåäö0-9])"


def nomen(o):
    """Sammansatt substantiv: gräns bara i BÖRJAN, så Sitzbänke fastnar."""
    return re.compile(FORE + re.escape(o), re.IGNORECASE)


def funktion(o):
    """Funktionsord: gräns i BÅDA ändar. Utan den matchar `und` svenskans
       under, underlag och används — nio falsklarm per sida i första svepet."""
    return re.compile(FORE + re.escape(o) + EFTER, re.IGNORECASE)


MONSTER = ([("tyskt ord: " + o, nomen(o)) for o in TYSKA_NOMEN]
           + [("tyskt ord: " + o, funktion(o)) for o in TYSKA_FUNKTION] + [
    ("artikelnummer", re.compile(r"\b\d{3}-\d{3}\w{0,8}\b")),
    ("artikelnummer-etikett", re.compile(r"Artikelnummer|Artikelnr|Modellreferens|Referensnummer", re.I)),
    ("avsändarland", re.compile(r"Tyskland|Deutschland|Skickas från", re.I)),
    ("vi-är-leverantören", re.compile(r"[Ll]everantör(en|ens)?\s+(anger|uppger|säger)")),
    ("husmärke", re.compile(r"HOMCOM|Outsunny|PawHut|Aiyaplay|Vinsetto|Aosom", re.I)),
    ("kommalista av tal", re.compile(r"\d+(?:,\d+)?, \d")),
    # ☠️ "runda" är svenska för rund — texten säger "runda stålfot". Jargongen
    #    är rundan / runda 101, och bara den ska fällas.
    ("intern jargong", re.compile(FORE + r"(?:rundan|runda \d+|batchen|batch \d+)" + EFTER, re.I)),
])

FLIKAR = ["Tekniska specifikationer", "Användning och skötsel", "Vanliga frågor"]


def hamta(slug):
    adress = BAS + slug
    subprocess.run(["curl", "-s", "-o", "/dev/null", adress],
                   capture_output=True)          # bestaller ombyggnaden
    r = subprocess.run(["curl", "-s", adress], capture_output=True)
    return r.stdout.decode("utf-8", "replace")


def synligt(html):
    h = re.sub(r"(?is)<(script|style|noscript)\b.*?</\1>", " ", html)
    h = re.sub(r"<[^>]+>", " ", h)
    return re.sub(r"\s+", " ", h)


def traffar(text):
    ut = {}
    for namn, m in MONSTER:
        f = m.findall(text)
        if f:
            ut[namn] = sorted({x if isinstance(x, str) else x[0] for x in f})
    return ut


if __name__ == "__main__":
    kontroll_html = hamta(KONTROLL)
    kontroll = traffar(synligt(kontroll_html))
    print("=== KONTROLLPROV: %s (%d kB) ===" % (KONTROLL, len(kontroll_html) // 1024))
    for k, v in sorted(kontroll.items()):
        print("  krom: %-28s %s" % (k, v[:6]))
    print()

    brister = 0
    for pid in T.PRODUKTER:
        slug = T.SLUGG[pid]
        html = hamta(BAS and slug)
        txt = synligt(html)
        egna = {}
        for namn, funna in traffar(txt).items():
            kvar = [f for f in funna if f not in kontroll.get(namn, [])]
            if kvar:
                egna[namn] = kvar
        saknade = [f for f in FLIKAR if f not in txt]
        # Egen text ska finnas på sidan — annars är det en cachad gammal sida.
        prov = re.sub(r"\s+", " ",
                      re.sub(r"<[^>]+>", " ", T.bygg(pid))).strip()[:70]
        harEgen = prov in txt
        ok = not egna and not saknade and harEgen and len(html) > 40000
        brister += 0 if ok else 1
        print("  %s %s  %s  %d kB  egen text: %s" %
              ("✅" if ok else "☠️", pid, slug, len(html) // 1024,
               "JA" if harEgen else "NEJ"))
        for k, v in sorted(egna.items()):
            print("       %-28s %s" % (k, v[:6]))
        if saknade:
            print("       saknar flik: %s" % saknade)
    print("\n  %d sidor med brister av %d" % (brister, len(T.PRODUKTER)))
    sys.exit(1 if brister else 0)
