# -*- coding: utf-8 -*-
"""Runda 62 — grindar. Körs på texterna INNAN något skrivs till Wix.

☠️ Ordlistan nedan får bara innehålla ord som är främmande i SVENSKAN. Runda 61
fällde fyra korrekta texter på "Kalkfilter", som är tyskt OCH svenskt. Pröva
varje nytt ord mot svenskan innan du lägger in det.

☠️ Och flera grindar här måste skilja ett PÅSTÅENDE från ett FÖRNEKANDE. Texten
säger med flit "smalare än en kontorsstol" och "Kan jag använda den som
kontorsstol hela arbetsdagen? Nej." — en grind som bara letar efter ordet hade
fällt just de meningar som finns för att uppfylla Steg 2.
"""
import re
import sys

sys.path.insert(0, __file__.rsplit("/", 1)[0])
import texter  # noqa: E402

# Uppmätt ljushet på sittdynan i bild 1 (se LAGE.md, Steg 4/5). Facit för
# grind 20 — ett jämförande färgpåstående ska stämma mot pixlarna.
LJUSHET = {"b5d8eb9c": 227, "6d64de9b": 222, "67bd3628": 181, "9e656e81": 162,
           "c3e0af3f": 126, "b97ac1d8": 114, "9d626528": 88, "05cc1f9c": 81}
KROMATISKA = {"c3e0af3f"}   # RGB 97,134,163 — de sju andra är neutrala

# --------------------------------------------------------------- ordlistor ---
FRAMMANDE = [
    # tyska ur leverantörens text
    "Kniestuhl", "Kniehocker", "Sitzhocker", "Polsterhocker", "Schaukel",
    "Gesundheitsstuhl", "Homeoffice", "Bürostuhl", "Schreibtisch",
    "Birkenholz", "Buchenholz", "Leinenoptik", "Schaumstoff", "Belastbarkeit",
    "Gesamtabmessungen", "Kniematte", "Kniepolster", "Sitzgröße", "Kissenstärke",
    "Lieferumfang", "Handbuch", "Gebrauchsanleitung", "Rückenlehne", "Cremeweiß",
    "Dunkelgrau", "Hellgrau", "Schwarz", "Grau", "Blau", "Neigungsfunktion",
    "verstellbar", "klappbar", "Rundrücken", "Kurzsichtigkeit", "Wirbelsäule",
    # engelska
    "ergonomic", "kneeling", "chair", "stool", "posture", "backrest",
]

# Medicinska och terapeutiska påståenden — Steg 2 stryker dem alla.
MEDICINSKT = [
    "lindr", "botar", "botande", "smärt", "ryggont", "värk",
    "blodcirkulation", "cirkulationen", "närsynt", "kortsynt",
    "ryggbesvär", "ländrygg", "diskbråck", "ischias", "terapeutisk",
    "medicinsk", "ortopedisk", "behandlar", "läker", "motverkar",
    "förebygger", "rätar ut", "korrigerar", "hållningsfel",
]

# Ogrundade superlativ.
SUPERLATIV = [
    "bäst i test", "marknadens bästa", "överlägsen", "perfekt för alla",
    "unik", "revolutionerande", "oslagbar", "världens",
]

HUSMARKEN = ["HOMCOM", "Outsunny", "PawHut", "Aiyaplay", "Vinsetto", "Aosom"]

# Länder får aldrig skrivas ut — avsändar- eller lagerland är husregel.
LANDER = ["Tyskland", "Kina", "Polen", "Spanien", "Nederländerna", "tyska lager",
          "tyskt lager", "EU-lager"]


def synlig_text(html):
    t = re.sub(r"<[^>]+>", " ", html)
    return re.sub(r"\s+", " ", t).strip()


def granska(p):
    """Returnerar en lista med fel för EN produkt. Tom lista = godkänd."""
    fel = []
    k = p["kort"]
    html = texter.bygg(p)
    s = synlig_text(html)
    allt = " ".join([p["name"], p["title"], p["meta"], s])

    # 1 — främmande ord
    for ord_ in FRAMMANDE:
        if re.search(r"\b%s" % re.escape(ord_), allt, re.I):
            fel.append("%s: främmande ord '%s'" % (k, ord_))

    # 2 — medicinska påståenden
    for m in MEDICINSKT:
        if re.search(re.escape(m), allt, re.I):
            fel.append("%s: medicinskt påstående '%s'" % (k, m))

    # 3 — superlativ
    for sup in SUPERLATIV:
        if re.search(re.escape(sup), allt, re.I):
            fel.append("%s: ogrundat superlativ '%s'" % (k, sup))

    # 4 — husmärken och länder
    for h in HUSMARKEN:
        if re.search(r"\b%s\b" % re.escape(h), allt, re.I):
            fel.append("%s: husmärke '%s'" % (k, h))
    for l in LANDER:
        if re.search(re.escape(l), allt, re.I):
            fel.append("%s: land utskrivet '%s'" % (k, l))

    # 5 ☠️ — får inte SÄLJAS som kontorsstol, men får jämföras med och förnekas.
    #        Ett påstående är ordet utan förnekande/jämförande omgivning.
    # ☠️ Den ordagranna förnekelsen måste finnas. Ett tidigare utkast lät
    #    "hela arbetsdagen" ensamt godkänna en mening — då hade
    #    "perfekt som kontorsstol hela arbetsdagen" passerat grinden.
    FORNEKELSE = ("kontorsstol hela arbetsdagen?</strong></p><p>Nej.")
    if FORNEKELSE not in html:
        fel.append("%s: FAQ:n förnekar inte uttryckligen kontorsstolsbruk" % k)
    JAMFORANDE = ("smalare än en kontorsstol", "än en kontorsstol")
    for m in re.finditer(r"[^.?!]*\bkontorsstol\w*[^.?!]*[.?!]", s):
        mening = m.group(0)
        if "kontorsstol hela arbetsdagen?" in mening:
            continue          # frågan själv — förnekelsen är kontrollerad ovan
        if not any(j in mening for j in JAMFORANDE):
            fel.append("%s: säljer den som kontorsstol — '%s'" % (k, mening.strip()[:70]))
    for ord_ in ["skrivbordsstol", "arbetsstol", "ersätter din kontorsstol"]:
        if re.search(re.escape(ord_), allt, re.I):
            fel.append("%s: säljs som arbetsstol ('%s')" % (k, ord_))

    # 6 ☠️ — Steg 2 kräver att leverantörens pausråd står kvar.
    if not re.search(r"15–30", s):
        fel.append("%s: pausrådet (15–30 minuter) saknas" % k)
    if not re.search(r"\bryggstöd\b", s):
        fel.append("%s: säger inte att den saknar ryggstöd" % k)

    # 7 ☠️ — ingen justerbarhet får påstås (intervall är inget bevis)
    for ord_ in ["höjdjusterbar", "justerbar höjd", "ställbar", "steglöst",
                 "justeras i höjd", "sex lägen"]:
        if re.search(re.escape(ord_), allt, re.I):
            fel.append("%s: påstår justerbarhet ('%s')" % (k, ord_))

    # 8 ☠️ — träslag: modell D får inte namnge art, modell G måste säga björk
    if p["modell"] == "D":
        for art in ["björk", "bok ", "boken", "ek ", "eken", "furu"]:
            if re.search(re.escape(art), allt, re.I):
                fel.append("%s: namnger träslag på modell D ('%s') — leverantören "
                           "säger två olika" % (k, art.strip()))
        if "formpressad plywood" not in allt:
            fel.append("%s: säger inte formpressad plywood" % k)
    else:
        if not re.search(r"björk", allt, re.I):
            fel.append("%s: modell G ska säga björk" % k)

    # 9 ☠️ — måtten i tysk axelordning, och 85/69 får inte kallas bredd
    if p["modell"] == "D":
        if "55 × 85 × 55 cm" not in allt:
            fel.append("%s: saknar måttet 55 × 85 × 55 cm" % k)
        if re.search(r"85\s*cm\s*bred|bredd[^.]{0,20}85", allt, re.I):
            fel.append("%s: kallar djupet (85 cm) för bredd" % k)
    else:
        if "51 × 69 × 58 cm" not in allt:
            fel.append("%s: saknar måttet 51 × 69 × 58 cm" % k)
        if re.search(r"69\s*cm\s*bred|bredd[^.]{0,20}69", allt, re.I):
            fel.append("%s: kallar djupet (69 cm) för bredd" % k)

    # 10 — maxlasten ska stå, och bara med leverantörens tal
    if "120 kg" not in allt:
        fel.append("%s: maxlasten 120 kg saknas" % k)
    for annat in ["100 kg", "110 kg", "130 kg", "150 kg"]:
        if annat in allt:
            fel.append("%s: fel maxlast '%s'" % (k, annat))

    # 11 ☠️ — svart får inte överdrivas; den mäter #515151
    if p["farg"] == "Svart":
        for ord_ in ["djupsvart", "helsvart", "kolsvart", "becksvart"]:
            if re.search(re.escape(ord_), allt, re.I):
                fel.append("%s: överdriver svärtan ('%s') — mätt #515151" % (k, ord_))

    # 12 ☠️ — artikelnumret får aldrig nå kunden
    if re.search(r"\b\d{3}-\d{3}[A-Z0-9]{0,8}\b", allt):
        fel.append("%s: artikelnummer i texten" % k)
    for etikett in ["Artikelnummer", "Modellreferens", "Artikelnr", "Referens:"]:
        if etikett in allt:
            fel.append("%s: spec-etiketten '%s' får inte finnas" % (k, etikett))

    # 13 ☠️ — korshänvisningen måste vara ABSOLUT
    for a in re.finditer(r'href="([^"]+)"', html):
        if not a.group(1).startswith("https://www.fyndplats.se/"):
            fel.append("%s: relativ länk '%s' — blir https:/… med ett snedstreck"
                       % (k, a.group(1)))

    # 14 ☠️ — FAQ som TVÅ <p>, aldrig <br>
    if "<br" in html:
        fel.append("%s: <br> i beskrivningen — Wix strippar den" % k)
    if not re.search(r"<h2>Vanliga frågor</h2>", html):
        fel.append("%s: saknar FAQ-rubrik" % k)

    # 15 — svensk sifferstil
    if re.search(r"\d+\.\d", s):
        fel.append("%s: decimalpunkt i stället för komma" % k)
    if re.search(r"\d+\s*,\s*\d+\s*(och|,)\s*\d+\s*(cm|kg|mm)", s):
        fel.append("%s: kommalista av tal med enheten sist" % k)
    if re.search(r"\d+x\d+|\d+\s*x\s*\d+", s):
        fel.append("%s: 'x' i stället för '×' mellan mått" % k)

    # 16 — sökordet ska stå i namn, slug OCH titel
    ord_i_sokord = texter.__dict__ and p["sokord"].split()
    for w in ord_i_sokord:
        ascii_w = (w.replace("ä", "a").replace("å", "a").replace("ö", "o"))
        if w.lower() not in p["name"].lower():
            fel.append("%s: sökordet '%s' saknas i namnet" % (k, w))
        if ascii_w.lower() not in p["slug"]:
            fel.append("%s: sökordet '%s' saknas i sluggen" % (k, w))
        if w.lower() not in p["title"].lower():
            fel.append("%s: sökordet '%s' saknas i titeln" % (k, w))

    # 17 ☠️ — titeln får ALDRIG vara identisk med namnet
    if p["title"].strip() == p["name"].strip():
        fel.append("%s: titeln är identisk med namnet — mallen slår till" % k)

    # 18 — hårda Wix-gränser
    if len(p["name"]) > 80:
        fel.append("%s: namnet är %d tecken (max 80)" % (k, len(p["name"])))
    if len(p["title"]) > 60:
        fel.append("%s: titeln är %d tecken (max 60)" % (k, len(p["title"])))

    # 20 ☠️ — JÄMFÖRANDE påståenden inom egen batch grindas mot den UPPMÄTTA
    #     ljusheten (LAGE.md, Steg 4/5). Ett utkast sa "den mörkaste av de ljusa
    #     tonerna" om en klädsel som mäter 88 och alltså är näst mörkast av fem.
    #     Superlativ om färg är inte en smaksak — de går att räkna.
    for m in re.finditer(r"[^.!?]*\b(ljusast\w*|mörkast\w*)\b[^.!?]*[.!?]", s):
        mening = m.group(0)
        if "ryggstöd" in mening:
            continue                      # "enda stol vid ett heldagsarbete"
        syskon = [LJUSHET[q["kort"]] for q in texter.PRODUKTER
                  if q["modell"] == p["modell"]]
        egen = LJUSHET[k]
        if re.search(r"\bljusast", mening) and egen != max(syskon):
            fel.append("%s: påstår ljusast men mäter %d, syskonens max är %d"
                       % (k, egen, max(syskon)))
        if re.search(r"\bmörkast", mening) and egen != min(syskon):
            fel.append("%s: påstår mörkast men mäter %d, syskonens min är %d"
                       % (k, egen, min(syskon)))
    # 21 — "enda med kulör" får bara den kromatiska säga
    if re.search(r"enda med kulör", s) and k not in KROMATISKA:
        fel.append("%s: påstår sig vara enda med kulör men är neutral" % k)

    # 19 — färgen ska stå, och bara den egna
    if p["farg"].lower() not in allt.lower():
        fel.append("%s: den egna färgen '%s' står inte i texten" % (k, p["farg"]))

    return fel


def batchgrindar(produkter):
    """Fel som bara syns när hela batchen granskas tillsammans."""
    fel = []
    for falt in ("slug", "name", "title"):
        sett = {}
        for p in produkter:
            v = p[falt].lower()
            if v in sett:
                fel.append("BATCH: %s krockar mellan %s och %s ('%s')"
                           % (falt, sett[v], p["kort"], p[falt]))
            sett[v] = p["kort"]
    # Två sidor får inte bära samma färgord inom samma modell
    for modell in ("D", "G"):
        farger = {}
        for p in produkter:
            if p["modell"] != modell:
                continue
            if p["farg"] in farger:
                fel.append("BATCH: modell %s har två sidor i färgen %s (%s, %s)"
                           % (modell, p["farg"], farger[p["farg"]], p["kort"]))
            farger[p["farg"]] = p["kort"]
    return fel


def main():
    alla = []
    for p in texter.PRODUKTER:
        alla += granska(p)
    alla += batchgrindar(texter.PRODUKTER)
    if alla:
        for f in alla:
            print("FEL  " + f)
        print("\n%d fel — INGENTING skrivs." % len(alla))
        return 1
    print("Alla %d produkter passerar %s." % (len(texter.PRODUKTER), "19 grindar"))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
