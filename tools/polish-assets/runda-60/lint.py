# -*- coding: utf-8 -*-
"""Runda 60 — grindar mot texterna INNAN de skrivs till Wix.

☠️ Ordlistan är vald PER FAMILJ. Ord som RÅKAR vara svenska står medvetet INTE
i den: Grill, Timer, Metall, Glas, Rost (rostar!), Filter, Tablett och — värst —
Dörr, som är svenska för door och skulle fällt varje sida med ett dörrmått.
"""
import re, sys, os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from texter import P, B

TYSKA = ["Wasserkocher", "Toaster", "Frühstück", "Wasser", "Schwarz", "Grau",
         "Kunststoff", "Edelstahl", "Backofen", "Backblech", "Grillrost",
         "Frittierkorb", "Obst", "Sieden", "Tassen", "Auftau", "Schlitz",
         "Bedienung", "Leistung", "Spannung", "Kabellänge", "Lieferumfang",
         "Beschreibung", "Farbe", "Gesamtmaße", "Innenmaße", "Kapazität",
         "Trocknungsrate", "Trockenkochschutz", "Trockengehschutz", "Krümel"]

ICKESVENSKT = re.compile(r"[ßü]")
SUPERLATIV = re.compile(r"\b(bäst|bästa|marknadens|överlägse|perfekt|oslagbar|"
                        r"störst|snabbast|billigast|finast)", re.I)
DEFENSIV = re.compile(r"(?:<strong>|<h2>|<h3>)\s*(?:Det du bör veta|Bra att veta|"
                      r"Innan du köper|Viktigt att tänka på|Att tänka på innan)", re.I)
LEVERANTOR = re.compile(r"\b(leverantören|leverantörens|tillverkaren anger|"
                        r"enligt tillverkaren|vi har inga uppgifter|uppger inte)", re.I)
SPEC_LISTA = re.compile(r"\d+(?:,\d+)?, \d")
LAND_NAMN = re.compile(r"\b(Tyskland|tysk|Kina|kines|Polen|polsk|Spanien|spansk)", re.I)
LAND_FRAS = re.compile(r"\b(EU-lager|skickas från|fraktas från|avsänds från)", re.I)
LAND = re.compile(LAND_NAMN.pattern + "|" + LAND_FRAS.pattern, re.I)
ARTIKELNUMMER = re.compile(r"\b(Artikelnummer|Artikelnr|Modellreferens|Referensnummer|"
                           r"\d{3}-\d{3}[A-Z0-9]{2,})\b")
MARKEN = re.compile(r"\b(HOMCOM|Outsunny|PawHut|Aiyaplay|Vinsetto|Kleankin|Zonekiz|"
                    r"SportNow|Aosom|Otter|Strix)\b", re.I)
CERT = re.compile(r"\b(CE-märk|CE-EMC|RoHS|ErP|LFGB|LVD|certifierad|certifiering|"
                  r"godkänd enligt|uppfyller EN\s?\d)", re.I)
OMATBART = re.compile(r"\b(9[0-9]|8[5-9])\s*%")
SORTIMENT = re.compile(r"\b(i sortimentet|vår (?:minsta|största)|vårt (?:minsta|största)|"
                       r"marknadens)", re.I)
JAMFOR_OMATT = re.compile(r"\b(samma volym som|lika stor som|samma storlek som|"
                          r"lika snabb som|dubbelt så snabb)", re.I)
MATTETIKETT = re.compile(r"\d+(?:,\d+)?\s*(?:cm|centimeter)\s+(?:djup|hög|högt)\b")

RUBRIKER = ["<h2>Tekniska specifikationer</h2>",
            "<h2>Användning och skötsel</h2>",
            "<h2>Vanliga frågor</h2>"]

BATCH_SLUGS = {v["slug"] for v in P.values()}
PUBLICERADE_SLUGS = {"brodrost-vattenkokare-set-gron", "miniugn-21-liter-svart",
                     "miniugn-36-liter-varmluft", "miniugn-32-liter"}
GILTIGA_LANKMAL = BATCH_SLUGS | PUBLICERADE_SLUGS

# mätvärden som MÅSTE stå i texten — hämtade ur underlaget, inte ur minnet
MATT = {
 "4ac902ed": ["43 × 39 × 39 cm", "34,5 × 31,8 × 25,6 cm", "1600 W", "90–230 °C", "10 kg"],
 "0ceeb412": ["32 × 32 × 27 cm", "Ø32 × 3,5 cm", "245 W", "35–70 °C", "3,5 kg"],
 "d8c2dec6": ["24,2 × 19,5 × 23,4 cm", "2200 W", "9,1 A", "1,3 kg"],
 "1121b59a": ["20,4 × 15,6 × 23,3 cm", "27,4 × 17,8 × 19,2 cm", "3,1 kg"],
 "b330de9c": ["24,2 × 19,5 × 23,4 cm", "27,4 × 17,7 × 18,8 cm", "3 kg"],
 "106eafc5": ["22,2 × 16,7 × 23,2 cm", "26,6 × 16,4 × 18,3 cm", "2,6 kg"],
 "70b6bfe2": ["22,5 × 15 × 26,3 cm", "26 × 17 × 18,5 cm", "2,9 kg"],
 "6edbe425": ["24,2 × 19,3 × 26,8 cm", "26 × 27 × 18,8 cm", "4,5 kg"],
}
FARG = {
 "4ac902ed": "Svart",
 "0ceeb412": "Grå",
 "d8c2dec6": "Grå med kopparfärgade detaljer",
 "1121b59a": "Svart med silverfärgade detaljer",
 "b330de9c": "Svart med kopparfärgade detaljer",
 "106eafc5": "Svart med silverfärgade detaljer",
 "70b6bfe2": "Svart med silverfärgade detaljer",
 "6edbe425": "Svart med polerade metalldetaljer",
}
# ☠️ Set-sidorna MÅSTE bära den summerade effekten. Det är rundans enda
#    verkliga säkerhetsfynd, och en sida utan den är den sida kunden bränner
#    en säkring på.
SUMMA = {"1121b59a": "3280 W", "b330de9c": "3130 W",
         "106eafc5": "3100 W", "70b6bfe2": "3130 W", "6edbe425": "4060 W"}

def synlig(html):
    return re.sub(r"<[^>]+>", " ", html)

def kontrollera():
    fel = []
    for k, v in P.items():
        h = v["html"]
        s = synlig(h)
        allt = " ".join([v["name"], v["title"], v["meta"], s])

        for t in TYSKA:
            if re.search(r"\b" + re.escape(t), allt, re.I):
                fel.append("%s: tyskt ord kvar — %r" % (k, t))
        m = ICKESVENSKT.search(allt)
        if m:
            fel.append("%s: icke-svenskt tecken %r" % (k, m.group(0)))

        for namn, rx in (("superlativ", SUPERLATIV), ("leverantörsröst", LEVERANTOR),
                         ("spec-kommalista", SPEC_LISTA), ("avsändarland", LAND),
                         ("artikelnummer", ARTIKELNUMMER), ("husmärke", MARKEN),
                         ("ogrundad certifiering", CERT),
                         ("omätbart procenttal", OMATBART),
                         ("sortimentspåstående", SORTIMENT),
                         ("omätt jämförelse", JAMFOR_OMATT),
                         ("måttetikett på ensamt tal", MATTETIKETT)):
            m = rx.search(allt)
            if m:
                fel.append("%s: %s — %r i %r" % (k, namn, m.group(0),
                                                 allt[max(0, m.start()-40):m.start()+40]))

        md = DEFENSIV.search(h)
        if md:
            fel.append("%s: defensivt block — %r" % (k, md.group(0)))

        for r in RUBRIKER:
            if h.count(r) != 1:
                fel.append("%s: rubriken %r förekommer %d gånger" % (k, r, h.count(r)))

        for mv in MATT[k]:
            if mv not in h:
                fel.append("%s: mätvärdet %r saknas" % (k, mv))
        if ("Färg: " + FARG[k]) not in h:
            fel.append("%s: spec-raden saknar 'Färg: %s'" % (k, FARG[k]))

        if k in SUMMA and SUMMA[k] not in h:
            fel.append("%s: den summerade effekten %r saknas — det är rundans "
                       "säkerhetsfynd" % (k, SUMMA[k]))

        for href in re.findall(r'<a href="([^"]+)"', h):
            if not href.startswith("https://www.fyndplats.se/produkt/"):
                fel.append("%s: relativ eller främmande länk %r" % (k, href)); continue
            mal = href.rsplit("/", 1)[-1]
            if mal not in GILTIGA_LANKMAL:
                fel.append("%s: länk till okänd slug %r" % (k, mal))
            if mal == v["slug"]:
                fel.append("%s: länkar till sig själv" % k)

        if len(v["name"]) > 80: fel.append("%s: name %d tecken (max 80)" % (k, len(v["name"])))
        if len(v["title"]) > 60: fel.append("%s: title %d tecken (max 60)" % (k, len(v["title"])))
        if v["title"] == v["name"]: fel.append("%s: title identisk med name" % k)
        if len(v["meta"]) > 155: fel.append("%s: meta %d tecken (max 155)" % (k, len(v["meta"])))
        if not re.match(r"^[a-z0-9-]+$", v["slug"]):
            fel.append("%s: sluggen är inte ASCII-gemener — %r" % (k, v["slug"]))
        if v["ord"].lower() not in allt.lower():
            fel.append("%s: fokussökordet %r finns inte i texten" % (k, v["ord"]))

    # ☠️ Fokussökorden får inte krocka INOM batchen. Runda 58: två sidor bar
    #    samma sökord och konkurrerade med varandra i stället för med marknaden.
    for a in P:
        for b in P:
            if a == b: continue
            if P[a]["ord"].lower() in " ".join([P[b]["name"], P[b]["title"]]).lower():
                fel.append("%s: fokussökordet %r står också i %s:s namn/titel"
                           % (a, P[a]["ord"], b))

    # ☠️ 6edbe425 påstår i tyskan att en kopp kokar på 5 minuter. En 2200 W-kokare
    #    gör det på ~45 s; syskonen anger 42 och 50 s. Talet får inte följa med.
    if re.search(r"kopp[^.]{0,40}5 minuter|5 minuter[^.]{0,40}kopp",
                 synlig(P["6edbe425"]["html"]), re.I):
        fel.append("6edbe425: bär kvar femminuterspåståendet")

    # ☠️ Koktiden gäller EN KOPP, inte 1,7 liter. Utan ordet blir talet en lögn.
    #    ORDGRÄNSEN ÄR HELA GRINDEN: utan \b uppfylldes den av "koppar" — alltså
    #    av meningen "sex till åtta koppar", som säger raka motsatsen. Mätt med
    #    mutationstestet: grinden fällde inte förrän \b kom på plats.
    KOPP = re.compile(r"\bkopp\b", re.I)
    for k, tal in (("1121b59a", "42 sekunder"), ("d8c2dec6", "50 sekunder")):
        h = synlig(P[k]["html"])
        for m in re.finditer(re.escape(tal), h):
            if not KOPP.search(h[max(0, m.start()-90):m.end()]):
                fel.append("%s: %r utan att säga EN KOPP" % (k, tal))

    # ☠️ Miniugnen säljs som sju lägen men underlaget räknar upp SEX.
    hu = synlig(P["4ac902ed"]["html"])
    if re.search(r"\bsju (lägen|tillagningslägen|program)|\b7 (lägen|program)", hu, re.I):
        fel.append("4ac902ed: påstår sju lägen — underlaget räknar upp sex")
    if "Sex lägen: uppvärmning, grillning, varmluft, rostning, bakning och fritering" not in P["4ac902ed"]["html"]:
        fel.append("4ac902ed: raden som räknar upp de sex lägena saknas")

    return fel

if __name__ == "__main__":
    fel = kontrollera()
    for f in fel:
        print("FEL:", f)
    print()
    print("Lint: alla %d texter rena." % len(P) if not fel
          else "LINTEN FÄLLER: %d fel" % len(fel))
    raise SystemExit(1 if fel else 0)
