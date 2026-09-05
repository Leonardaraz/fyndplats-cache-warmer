# -*- coding: utf-8 -*-
"""Runda 61 — grindar mot texterna INNAN de skrivs till Wix.

☠️ Ordlistan är vald PER FAMILJ. Ord som RÅKAR vara svenska står medvetet INTE
i den: Grill, Timer, Metall, Glas, Rost (rostar!), Filter, Tablett och — värst —
Dörr, som är svenska för door.
"""
import re, sys, os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from texter import P, B

TYSKA = ["Wasserkocher", "Toaster", "Frühstück", "Wasser", "Schwarz", "Grau",
         "Kunststoff", "Edelstahl", "Sieden", "Tassen", "Auftau", "Schlitz",
         "Bedienung", "Leistung", "Spannung", "Kabellänge", "Lieferumfang",
         "Beschreibung", "Farbe", "Kapazität", "Bräunungsstufen", "Wabenmuster",
         "Trockenkochschutz", "Trockengehschutz", "Krümel",
         "Abbrechen", "Aufwärmen", "Abtauen", "Cremeweiß", "Familiengroß",
         # ☠️ "Kalkfilter" stod här i ett utkast och FÄLLDE fyra korrekta
         #    svenska texter: ordet är tyskt OCH svenskt. Exakt den fällan som
         #    kommentaren överst varnar för — och listan växer varje runda, så
         #    varje nytt ord måste prövas mot svenskan innan det läggs in.
         # ☠️ ENGELSKA räknas som utländskt precis som tyskan. Runda 61 var
         #    första gången skräpet var engelskt: "Family-size", "Crumb Tray",
         #    "Wide Slot", "7 Cups" — en grind som bara letade tyska hade
         #    släppt igenom dem.
         "Family-size", "Crumb Tray", "Wide Slot", "Limescale", "Non-slip",
         "Water Level", "Rotating Base", "Cups"]

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
PUBLICERADE_SLUGS = {"frukostset-bikakemonster-vattenkokare",
                     "frukostset-svart-vattenkokare-brodrost",
                     "frukostset-fyra-skivor-brodrost",
                     "vattenkokare-1-7-liter-gra-koppar"}
GILTIGA_LANKMAL = BATCH_SLUGS | PUBLICERADE_SLUGS

MATT = {
 "f523b18d": ["23,6 × 16 × 27,6 cm", "29,2 × 26,5 × 18,8 cm", "5,3 kg", "1850–2200 W", "1560–1860 W"],
 "83d2db1a": ["23,5 × 16 × 24,4 cm", "26,4 × 15,6 × 18,9 cm", "3 kg", "1850–2200 W", "780–930 W"],
 "e7f69e8a": ["23,5 × 16 × 24,4 cm", "26,4 × 15,6 × 18,9 cm", "2,98 kg", "1850–2200 W", "780–930 W"],
 "375bb3c8": ["23,2 × 15,9 × 24,8 cm", "28,7 × 17 × 19,1 cm", "4,17 kg", "40–100 °C", "750–900 W"],
 "7805b8bc": ["23,2 × 15,9 × 24,8 cm", "28,7 × 17 × 19,1 cm", "4,2 kg", "750–900 W"],
 "2f2c1c88": ["21,1 × 16,5 × 25,2 cm", "29,2 × 26,5 × 18,8 cm", "4,4 kg", "1560–1860 W"],
 "0ab3483a": ["24,2 × 19,5 × 23,4 cm", "27,4 × 17,7 × 18,8 cm", "3 kg", "780–930 W"],
}
FARG = {
 "f523b18d": "Grå med polerade metalldetaljer",
 "83d2db1a": "Gräddvit med förkromade detaljer",
 "e7f69e8a": "Svart med förkromade detaljer",
 "375bb3c8": "Gräddfärgad med förkromade detaljer",
 "7805b8bc": "Svart med förkromade detaljer",
 "2f2c1c88": "Gräddvit med rostfritt stål",
 "0ab3483a": "Rosa",
}
# ☠️ Varje sida är ett SET med två apparater på ett uttag. Den summerade
#    effekten är rundans säkerhetsfynd, och en sida utan den är den sida
#    kunden bränner en säkring på. Två av sju ligger dessutom över 16 A.
SUMMA = {"f523b18d": "4060 W", "83d2db1a": "3130 W", "e7f69e8a": "3130 W",
         "375bb3c8": "3100 W", "7805b8bc": "3100 W", "2f2c1c88": "4060 W",
         "0ab3483a": "3130 W"}
# Antal rostfack och rostlägen — de skiljer sig mellan syskonen och är den
# vanligaste förväxlingen när sju texter skrivs i samma pass.
FACK = {"f523b18d": "fyra", "83d2db1a": "två", "e7f69e8a": "två",
        "375bb3c8": "två", "7805b8bc": "två", "2f2c1c88": "fyra",
        "0ab3483a": "två"}
LAGEN = {"f523b18d": "sju", "83d2db1a": "sju", "e7f69e8a": "sju",
         "375bb3c8": "sex", "7805b8bc": "sex", "2f2c1c88": "sju",
         "0ab3483a": "sju"}

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
                fel.append("%s: utländskt ord kvar — %r" % (k, t))
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
        if SUMMA[k] not in h:
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

        # ── rundans egna fynd ────────────────────────────────────────────────
        # ☠️ Fackantalet skiljer syskonen åt och är lätt att kopiera fel.
        #    BÅDA riktningarna krävs. En grind som bara kräver att rätt tal
        #    STÅR någonstans godkänner en text som säger fyra i ingressen och
        #    två i frågorna — mutationstestet fällde inte förrän den negativa
        #    halvan kom på plats, precis som rostlägena redan hade.
        def fackuttryck(tal):
            return r"\b%s (separata )?fack\b|för %s skivor\b" % (tal, tal)
        if not re.search(fackuttryck(FACK[k]), s, re.I):
            fel.append("%s: säger inte att brödrosten har %s fack" % (k, FACK[k]))
        fel_fack = {"fyra": "två", "två": "fyra"}[FACK[k]]
        if re.search(fackuttryck(fel_fack), s, re.I):
            fel.append("%s: påstår %s fack — underlaget säger %s"
                       % (k, fel_fack, FACK[k]))
        fel_lage = {"sju": "sex", "sex": "sju"}[LAGEN[k]]
        if re.search(r"\b%s rostlägen\b" % fel_lage, s, re.I):
            fel.append("%s: påstår %s rostlägen — underlaget säger %s"
                       % (k, fel_lage, LAGEN[k]))
        if not re.search(r"\b%s rostlägen\b" % LAGEN[k], s, re.I):
            fel.append("%s: anger inte %s rostlägen" % (k, LAGEN[k]))

    # ☠️ Fokussökorden får inte krocka INOM batchen.
    for a in P:
        for b in P:
            if a == b: continue
            if P[a]["ord"].lower() in " ".join([P[b]["name"], P[b]["title"]]).lower():
                fel.append("%s: fokussökordet %r står också i %s:s namn/titel"
                           % (a, P[a]["ord"], b))

    # ☠️ 83d2db1a och e7f69e8a påstår i tyskan att en FULL kanna kokar på fyra
    #    minuter. 1,7 liter från 20 °C kräver ~569 kJ; vid 2200 W är det 259 s
    #    i teorin och ~4,8 min med verklig verkningsgrad. Talet får inte följa med.
    for k in ("83d2db1a", "e7f69e8a"):
        if re.search(r"\b(fyra|4)\s*minuter", synlig(P[k]["html"]), re.I):
            fel.append("%s: bär kvar fyraminuterspåståendet" % k)

    # ☠️ "3 Min. 15 Sek." står på en MARKNADSFÖRINGSBILD som återanvänds på
    #    minst tre olika artikelnummer (800-287, 800-286 och runda 60:s 800-2xx).
    #    Ett tal som är identiskt över flera modeller mäter ingen av dem.
    for k, v in P.items():
        if re.search(r"3\s*min(uter)?\s*15\s*sek", synlig(v["html"]), re.I):
            fel.append("%s: bär marknadsföringsbildens 3 min 15 s" % k)

    # ☠️ 7805b8bc:s eget underlag ger INGET temperaturspann. Syskonet 375bb3c8
    #    gör det (40–100 °C). Samma basartikel är inte samma påstående —
    #    runda 59 mätte fyra ugnar som såldes "mit Kochplatten" utan att ha några.
    if re.search(r"40\s*[–-]\s*100\s*°C", P["7805b8bc"]["html"]):
        fel.append("7805b8bc: bär syskonets temperaturspann utan eget underlag")

    # ☠️ Kopparantalet är per produkt, inte per familj.
    KOPPAR = {"2f2c1c88": ("sju", "sex"), "0ab3483a": ("sex", "sju")}
    for k, (ratt, fel_ord) in KOPPAR.items():
        s = synlig(P[k]["html"])
        if not re.search(r"\b%s koppar\b" % ratt, s, re.I):
            fel.append("%s: anger inte %s koppar" % (k, ratt))
        if re.search(r"\b%s koppar\b" % fel_ord, s, re.I):
            fel.append("%s: påstår %s koppar — underlaget säger %s" % (k, fel_ord, ratt))

    return fel

if __name__ == "__main__":
    fel = kontrollera()
    for f in fel:
        print("FEL:", f)
    print()
    print("Lint: alla %d texter rena." % len(P) if not fel
          else "LINTEN FÄLLER: %d fel" % len(fel))
    raise SystemExit(1 if fel else 0)
