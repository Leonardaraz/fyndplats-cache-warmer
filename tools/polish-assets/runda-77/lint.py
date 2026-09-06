# -*- coding: utf-8 -*-
"""Runda 77 — grind före skrivningen.

☠️ TALGRINDEN ÄR HÄRLEDD, INTE HANDSKRIVEN. Runda 76 byggde en handskriven
   `TILLATNA_TAL` per produkt. Den här bygger listan ur produktens EGEN
   spec-lista, som i sin tur är läst ur måttritningen. Varje tal i brödtexten
   måste alltså finnas i mätdatan — och listan kan inte glida från specen,
   för den ÄR specen.

☠️ `ergonomisk` är förbjudet i hela rundan. Fyra av sju heter `Ergonomischer
   Bürostuhl` på tyska och ingen bär någon certifiering.

☠️ FÖRBJUDNA MÅTT: de två tal källan motsäger sig själv om (`d739872f`:s
   ryggstöd, `f1f861ea`:s 64 × 57 × 132) får inte dyka upp någonstans.
"""
import json
import os
import re
import sys

HAR = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, os.path.dirname(HAR))
sys.path.insert(0, HAR)

from grindar import (TYSKA, HUSMARKEN, LANDORD, ATTRIBUTION, ARTNR,  # noqa: E402
                     LAGERFRAS, FARGORD, sku_bas)
from texter import PRODUKTER, bygg                                   # noqa: E402

BILDER = json.load(open(os.path.join(HAR, "bilder.json"), encoding="utf-8"))

# Externa länkmål: sidor som finns men inte poleras i den här rundan.
# ☠️ Måste vara BEVISAD, inte antagen — den här är läst ur katalogsvepet
#    (STEG1.md) och dess mått lästa ur dess egen publicerade spec-tabell.
EXTERN = {"ritstol-fotring-natrygg-55-76-cm": {"kalla": "katalogsvep 2026-09-06"}}

HALSA_RE = re.compile(
    r"\b(lindrar|botar|förebygger|läker|terapeutisk|medicinsk|smärtlindr\w*|"
    r"blodcirkulation|hälsoeffekt\w*|ryggbesvär|ischias|diskbråck)\b", re.I)
ARBETSSTOL_RE = re.compile(r"\barbetsmilj\w*|\bAFS\b|\bEN 1335\b|certifierad\w*", re.I)
ERGONOMI_RE = re.compile(r"ergonomisk\w*", re.I)

# Tal som källan motsäger sig själv om — får inte skrivas.
FORBJUDNA_MATT = {
    "d739872f": ["59 × 49", "49 cm", "59 cm"],          # ryggstödet, oavgörbart
    "f1f861ea": ["64", "57 cm", "64 × 57"],             # andra totalmåttet
}

# Utrustning som MÅSTE nämnas, och som INTE får nämnas, per produkt.
HAR_FOTRING = {"d739872f", "795c5ee2", "3033003c", "83fd57c9", "f1f861ea"}
UTAN_ARMSTOD = {"795c5ee2", "df0d351f", "cc0ec7ba"}
HAR_SVANKSTOD = {"3033003c"}
HAR_HJARTRYGG = {"df0d351f", "cc0ec7ba"}
TEDDY = {"df0d351f", "cc0ec7ba"}

TAL_RE = re.compile(r"(\d+(?:,\d+)?)\s*(cm|kg|%|°)")
# ☠️ Enheten står EN gång efter en trippel eller ett spann: "60 × 60 × 108–132 cm"
#    bär fyra mätvärden men bara ett "cm". En naiv extraktion ser ett enda tal
#    och fäller de tre andra som "påhittade" — grinden gjorde exakt det på sex
#    av sju produkter första körningen.
KEDJA_RE = re.compile(r"((?:\d+(?:,\d+)?\s*(?:[×x]|–|-)\s*)+\d+(?:,\d+)?)\s*(cm|kg|%|°)")


def tal_i(text):
    """Alla mätvärden i en text, som '48 cm'/'120 kg'."""
    ut = set("%s %s" % (a, e) for a, e in TAL_RE.findall(text))
    for kedja, enhet in KEDJA_RE.findall(text):
        for d in re.findall(r"\d+(?:,\d+)?", kedja):
            ut.add("%s %s" % (d, enhet))
    return ut


# Tal som beskriver en ANNAN produkt (den publicerade ritstolen i korslänken),
# alltså mätdata — men inte den här produktens.
EXTERN_TAL = {"55 cm", "76 cm"}


def strip_taggar(h):
    return re.sub(r"\s+", " ", re.sub(r"<[^>]+>", " ", h)).strip()


FEL = []


def fal(k, m):
    FEL.append("%s: %s" % (k, m))


def kor():
    sedda_slug, sedda_sku = {}, {}
    interna = set(p["slug"] for p in PRODUKTER)

    for p in PRODUKTER:
        k = p["kort"]
        html = bygg(p)
        synlig = strip_taggar(html)
        allt = " ".join([p["name"], p["title"], p["meta"], synlig])
        lagt = allt.lower()

        # --- språk och husregler ---------------------------------------
        for o in TYSKA:
            if re.search(r"\b%s\b" % re.escape(o), lagt):
                fal(k, "tyskt ord: %s" % o)
        for o in HUSMARKEN:
            if re.search(r"\b%s\b" % o, lagt):
                fal(k, "husmärke: %s" % o)
        for o in LANDORD:
            if re.search(r"\b%s\b" % o, lagt):
                fal(k, "landsnamn: %s" % o)
        for f in ATTRIBUTION:
            if re.search(f, allt, re.I):
                fal(k, "attribution: %s" % f)
        for f in LAGERFRAS:
            if re.search(re.escape(f), lagt):
                fal(k, "lagerfras: %s" % f)
        if ARTNR.search(allt):
            fal(k, "artikelnummer i texten")
        if HALSA_RE.search(allt):
            fal(k, "hälsopåstående: %s" % HALSA_RE.search(allt).group(0))
        if ARBETSSTOL_RE.search(allt):
            fal(k, "ogrundad norm/certifiering: %s" % ARBETSSTOL_RE.search(allt).group(0))
        if ERGONOMI_RE.search(allt):
            fal(k, "ordet 'ergonomisk' — inget belägg finns")
        if re.search(r"\b%d\b|\bkr\b" % p["pris"], synlig):
            fal(k, "priset står i texten")

        # --- längder ----------------------------------------------------
        if len(p["name"]) > 80:
            fal(k, "name %d tecken (max 80)" % len(p["name"]))
        if len(p["title"]) > 60:
            fal(k, "title %d tecken (max 60)" % len(p["title"]))
        if not (110 <= len(p["meta"]) <= 160):
            fal(k, "meta %d tecken (110–160)" % len(p["meta"]))

        # --- sökordet i namn, titel OCH slug ----------------------------
        huvud = "ritstol" if p["slug"].startswith("ritstol") else "skrivbordsstol"
        for falt in ("name", "title"):
            if huvud not in p[falt].lower():
                fal(k, "huvudsökordet %r saknas i %s" % (huvud, falt))

        # --- unika slug och SKU -----------------------------------------
        sedda_slug.setdefault(p["slug"], []).append(k)
        sku = "FP-" + sku_bas(p["slug"])
        if len(sku) > 40:
            fal(k, "SKU %d tecken (max 40): %s" % (len(sku), sku))
        sedda_sku.setdefault(sku, []).append(k)

        # --- talgrinden: härledd ur produktens egen spec -----------------
        # ⚠️ En korslänk beskriver en ANNAN produkt, och dess sitthöjd är
        #    mätt för den. Tillåt därför de länkade produkternas spec-tal —
        #    men bara deras, aldrig ett fritt tal.
        tillatna = tal_i(" ".join(p["spec"]))
        # ⚠️ Syskonets tal gäller BARA inuti länktexten. Ett undantag som gällde
        #    hela sidan var för brett: mutationstestet skrev om svankstödet till
        #    40 × 44 cm och slapp igenom, eftersom 44 råkade stå i ett syskons
        #    sitsmått. Grinden läser därför texten med länkarna BORTTAGNA.
        utan_lankar = strip_taggar(re.sub(r"<a\b[^>]*>.*?</a>", " ", html))
        i_lankar = " ".join(re.findall(r"<a\b[^>]*>(.*?)</a>", html))
        lankade = set()
        for mal in re.findall(r'href="[^"]*/produkt/([^"]+)"', html):
            for q in PRODUKTER:
                if q["slug"] == mal:
                    lankade |= tal_i(" ".join(q["spec"]))
        for t in sorted(tal_i(utan_lankar) - tillatna):
            fal(k, "tal som inte står i produktens egen spec: %s" % t)
        for t in sorted(tal_i(strip_taggar(i_lankar)) - tillatna - lankade - EXTERN_TAL):
            fal(k, "tal i länktext som inte är mätt för den länkade sidan: %s" % t)

        # --- mått källan motsäger sig själv om ---------------------------
        for m in FORBJUDNA_MATT.get(k, []):
            if m in synlig:
                fal(k, "motsägelsefullt mått skrivet: %s" % m)

        # --- utrustning --------------------------------------------------
        if k in HAR_FOTRING and "fotring" not in lagt:
            fal(k, "fotringen nämns inte")
        pastatt = " ".join(p["spec"] + p["eg"]).lower()
        if k not in HAR_FOTRING and "fotring" in pastatt:
            fal(k, "fotring nämns men finns inte")
        if k in UTAN_ARMSTOD and not re.search(r"utan armstöd|inga armstöd|saknar armstöd", lagt):
            fal(k, "saknar armstöd men det står inte")
        if k in HAR_SVANKSTOD and "svankstöd" not in lagt:
            fal(k, "svankstödet nämns inte")
        if k not in HAR_SVANKSTOD and "svankstöd" in pastatt:
            fal(k, "svankstöd nämns men finns inte")
        if k in HAR_HJARTRYGG and "hjärtformad" not in lagt:
            fal(k, "hjärtformen nämns inte")
        if k in TEDDY and "teddytyg" not in lagt:
            fal(k, "teddytyget nämns inte")
        if k not in TEDDY and "teddytyg" in pastatt:
            fal(k, "teddytyg nämns men stolen är nätklädd")
        if "120 kg" not in synlig:
            fal(k, "maxlasten 120 kg står inte i texten")
        if "Montering" not in " ".join(p["spec"]):
            fal(k, "monteringen står inte i specen")

        # --- färgordet ---------------------------------------------------
        if k in BILDER and BILDER[k]["kallfarg"] != "?":
            if not any(f in lagt for f in FARGORD):
                fal(k, "inget färgord i texten trots att kulören är mätt")

        # --- länkar ------------------------------------------------------
        for slug in re.findall(r'href="[^"]*/produkt/([^"]+)"', html):
            if slug not in interna and slug not in EXTERN:
                fal(k, "länk till okänd sida: %s" % slug)
            if slug == p["slug"]:
                fal(k, "sidan länkar till sig själv")

        # --- form --------------------------------------------------------
        if "<br" in html:
            fal(k, "<br> i texten — Wix strippar den")
        if re.search(r"<p>\s*</p>", html):
            fal(k, "tomt <p>")
        if len([1 for _ in re.finditer(r"<h2>", html)]) < 4:
            fal(k, "färre än fyra <h2>-avsnitt")
        if len(p["faq"]) < 3:
            fal(k, "färre än tre FAQ-par")

    for s, ks in sedda_slug.items():
        if len(ks) > 1:
            fal("SLUG", "%s delas av %s" % (s, ", ".join(ks)))
    for s, ks in sedda_sku.items():
        if len(ks) > 1:
            fal("SKU", "%s delas av %s" % (s, ", ".join(ks)))


if __name__ == "__main__":
    kor()
    for f in FEL:
        print("FEL:", f)
    print("\n%d fel i %d produkter" % (len(FEL), len(PRODUKTER)))
    raise SystemExit(1 if FEL else 0)
