# -*- coding: utf-8 -*-
"""Grindar för runda 64. Körs mot texter.py INNAN något skrivs till Wix.

Varje grind är skriven mot REGELN, inte mot platsen där felet en gång hittades.
"""
import re
import sys

from texter import PRODUKTER, bygg

FEL = []


def fal(kort, vad):
    FEL.append("%s  %s" % (kort, vad))


# ---------------------------------------------------------------- fakta ---
# Uppmätt ur leverantörens Technische Daten, en gång, här.
MAXLAST = {
    "5e2dee74": {"150 kg"},
    "e76002c1": {"150 kg"},
    "17620f5b": {"150 kg", "50 kg"},   # sits respektive fotpall
    "b09d20b7": {"120 kg"},
    "b01d8af2": {"120 kg"},
    "ca92e3ce": {"120 kg"},
    "90caeb9d": {"250 kg"},
    "beacff5a": {"120 kg"},
}
# Produkter där egenvikten motsäger sig i källan och därför INTE får skrivas ut.
VIKT_FORBJUDEN = {"b01d8af2", "ca92e3ce"}
VIKT = {
    "5e2dee74": "42,6 kg", "e76002c1": "49,8 kg", "17620f5b": "31,5 kg",
    "b09d20b7": "21 kg", "90caeb9d": "24 kg", "beacff5a": "10,3 kg",
}
# Produkter som INTE har liggfunktion — får inte påstå att ryggen fälls.
UTAN_LIGG = {"b09d20b7", "b01d8af2", "ca92e3ce", "90caeb9d"}
# Produkter som levereras färdigmonterade.
FARDIGMONTERAD = {"90caeb9d"}

# ------------------------------------------------------------- ordlistor ---
# Tyska ord som INTE också är svenska ord. Ordgräns i båda ändar.
TYSKA = ["sessel", "hocker", "liegefunktion", "belastbarkeit", "farbe",
         "gewicht", "rückenlehne", "ruckenlehne", "sitzfläche", "sitzflache",
         "fußstütze", "fussstutze", "schaumstoff", "montage", "abmessungen",
         "gesamtmaße", "gesamtmasse", "lieferumfang", "artikelnummer",
         "drehbar", "verstellbar", "esszimmerstuhl", "drehhocker",
         "gummiholz", "kunstleder", "mikrofaser", "wohnzimmer"]
HUSMARKEN = ["homcom", "outsunny", "pawhut", "aiyaplay", "vinsetto", "aosom"]
LANDORD = ["tyskland", "kina", "polen", "spanien", "tjeckien", "nederländerna",
           "belgien", "frankrike", "italien", "storbritannien"]
# Attribution som skjuter påståendet ifrån oss. Mot kunden ÄR vi leverantören.
ATTRIBUTION = ["leverantör", "leverantören", "leverantörens", "tillverkaren",
               "tillverkarens", "enligt tillverkare", "grossist"]

# ☠️ Mönstret krävde tidigare tre SIFFROR före bindestrecket och missade därmed
# `83F-028V00GY` — som är exakt det nummer som står i b09d20b7:s egen tyska
# brödtext. Aosoms nummer börjar med en siffra men får ha bokstäver redan i
# första ledet. Kravet på minst en versal håller årtal som "2024-2025" utanför.
ARTNR = re.compile(r"\b(?=[0-9A-Z-]*[A-Z])[0-9][0-9A-Z]{1,3}-[0-9A-Z]{4,}\b")
ANKARE = re.compile(r'<a href="([^"]*)"[^>]*>(.*?)</a>', re.S)

SLUGGAR = {p["slug"]: p for p in PRODUKTER}
KORT2SLUG = {p["kort"]: p["slug"] for p in PRODUKTER}


def strip_taggar(h):
    return re.sub(r"\s+", " ", re.sub(r"<[^>]+>", " ", h)).strip()


# --------------------------------------------------------------- SKU-regeln ---
FOGEORD = {"med", "och", "i", "pa", "for", "till", "som", "av", "utan"}


def sku_bas(slug):
    """Speglar lib/import/sku.ts: fogeord bort, bryt på HEL ord vid 24."""
    delar = [d for d in slug.split("-") if d not in FOGEORD]
    ut = ""
    for d in delar:
        kand = d if not ut else ut + "-" + d
        if len(kand) > 24:
            break
        ut = kand
    return ut


# ---------------------------------------------------- påstående vs förnekande ---
# ☠️ Runbokens regel: en påstående-grind måste kunna skilja ett påstående från
# ett FÖRNEKANDE. "Är ramen gummi?" följt av "Nej, den är gummiträ" är inte ett
# materialpåstående — det är motsatsen. En FAQ-fråga läses därför ALLTID
# tillsammans med nästa mening, annars faller svaret utanför.
NEKORD = re.compile(r"\b(inte|nej|ingen|inget|ingenting|aldrig|varken)\b")


def meningar(text):
    """Ger (mening, mening + nästa mening) — samma form som runda 63."""
    bitar = [m.strip() for m in re.split(r"(?<=[.!?])\s+", text) if m.strip()]
    for i, m in enumerate(bitar):
        nasta = bitar[i + 1] if i + 1 < len(bitar) else ""
        yield m, (m + " " + nasta).strip()


def pastaenden(text, monster):
    """Träffar på monster som INTE ligger i ett förnekande. Returnerar
    (traff, mening) för var och en."""
    ut = []
    for m, m_med_nasta in meningar(text):
        for tr in monster.finditer(m):
            sammanhang = m_med_nasta if m.rstrip().endswith("?") else m
            if not NEKORD.search(sammanhang.lower()):
                ut.append((tr.group(0), m))
    return ut


def kor():
    sedda_sku, sedda_slug = {}, {}

    for p in PRODUKTER:
        k = p["kort"]
        html = bygg(p)
        synlig = strip_taggar(html)
        allt = " ".join([p["name"], p["title"], p["meta"], synlig]).lower()

        # 1. tyska
        for o in TYSKA:
            if re.search(r"\b%s\b" % re.escape(o), allt):
                fal(k, "tyskt ord: %s" % o)

        # 2. artikelnummer
        if ARTNR.search(" ".join([p["name"], p["title"], p["meta"], synlig])):
            fal(k, "artikelnummer i texten")

        # 3. husmärken
        for o in HUSMARKEN:
            if re.search(r"\b%s\b" % o, allt):
                fal(k, "husmärke: %s" % o)

        # 4. avsändarland
        for o in LANDORD:
            if re.search(r"\b%s\b" % o, allt):
                fal(k, "land utskrivet: %s" % o)

        # 5. attribution
        for o in ATTRIBUTION:
            if re.search(r"\b%s\b" % o, allt):
                fal(k, "attribution: %s" % o)

        # 6. spec-etiketten Artikelnummer får aldrig finnas
        if "artikelnr" in allt or "modellreferens" in allt:
            fal(k, "artikelnummer-etikett")

        # 7. maxlast: varje kg-tal som beskriver bärighet måste stå i facit
        for tal in re.findall(r"(?:bär|maxlast|last)[^.]{0,40}?(\d+ kg)", allt):
            if tal not in MAXLAST[k]:
                fal(k, "maxlast %s finns inte i facit %s" % (tal, MAXLAST[k]))

        # 8. vikt
        if k in VIKT_FORBJUDEN:
            if re.search(r"\bvikt\b|\bväger\b", allt):
                fal(k, "vikt nämnd trots att källan motsäger sig")
        else:
            if VIKT[k].lower() not in allt:
                fal(k, "vikt %s saknas" % VIKT[k])

        # 9. liggfunktion får inte påstås på en fåtölj utan sådan
        if k in UTAN_LIGG and re.search(r"\bfälls till\b|\bliggläge\b|\bfälla ryggen\b", allt):
            fal(k, "påstår liggfunktion utan att ha någon")

        # 10. montering — ☠️ måste stå som ett PÅSTÅENDE i egenskaper eller
        # spec, inte bara som ett ord i en FAQ-fråga. Den gamla grinden läste
        # hela texten och blev därför grön av frågan "Behöver den monteras?"
        # även när svaret slutat säga något om montering.
        pastar = " ".join(p["eg"] + p["spec"]).lower()
        if k in FARDIGMONTERAD:
            if not re.search(r"färdigmonterad|inga verktyg", pastar):
                fal(k, "färdigmonterad nämns inte i egenskaper eller spec")
        else:
            if not re.search(r"monter", pastar):
                fal(k, "monteringen nämns inte i egenskaper eller spec")

        # 11. bomull får inte PÅSTÅS — ett förnekande är tillåtet
        for tr, mening in pastaenden(synlig, re.compile(r"\bbomull\w*", re.I)):
            fal(k, "bomull påstås: %.70s" % mening)

        # 12. gummi utan trä — samma sak, och "gummiträ"/"gummiträdet" är trä
        gummi = re.compile(r"\bgummi(?!tr[äa])\w*", re.I)
        for tr, mening in pastaenden(synlig, gummi):
            fal(k, "gummi utan trä (%s): %.70s" % (tr, mening))

        # 13. öronlapp bara där ryggen faktiskt är hög
        if k == "b09d20b7" and "öronlapp" in allt:
            fal(k, "öronlappsfåtölj med 43 cm rygg")

        # 14. matstol
        if re.search(r"\bmatstol|\bmatsalsstol", allt):
            fal(k, "kallas matstol")

        # 15. länkar: absoluta, till en slug i batchen, aldrig till sig själv
        for href, txt in ANKARE.findall(html):
            if not href.startswith("https://www.fyndplats.se/produkt/"):
                fal(k, "relativ eller främmande länk: %s" % href)
                continue
            mal = href.rsplit("/", 1)[-1]
            if mal not in SLUGGAR:
                fal(k, "länk till slug utanför batchen: %s" % mal)
            elif mal == p["slug"]:
                fal(k, "länk till sig själv")

        # 16. fokusordets huvudord ska finnas i namn, titel och meta
        huvud = p["sokord"].split()[0]
        for falt in ("name", "title", "meta"):
            if huvud.lower() not in p[falt].lower():
                fal(k, "fokusordet '%s' saknas i %s" % (huvud, falt))

        # 17. SKU
        vantad = "FP-" + sku_bas(p["slug"])
        if p["sku"] != vantad:
            fal(k, "SKU %s ska vara %s" % (p["sku"], vantad))
        if len(p["sku"]) > 40:
            fal(k, "SKU längre än 40 tecken")
        if p["sku"] in sedda_sku:
            fal(k, "SKU krockar med %s" % sedda_sku[p["sku"]])
        sedda_sku[p["sku"]] = k
        if p["slug"] in sedda_slug:
            fal(k, "slug krockar med %s" % sedda_slug[p["slug"]])
        sedda_slug[p["slug"]] = k

        # 18. längder
        if len(p["title"]) > 60:
            fal(k, "title %d tecken (max 60)" % len(p["title"]))
        if not (110 <= len(p["meta"]) <= 160):
            fal(k, "meta %d tecken (110–160)" % len(p["meta"]))

    return FEL


if __name__ == "__main__":
    fel = kor()
    for f in fel:
        print("FEL  " + f)
    print("\n%d fel i %d produkter" % (len(fel), len(PRODUKTER)))
    sys.exit(1 if fel else 0)
