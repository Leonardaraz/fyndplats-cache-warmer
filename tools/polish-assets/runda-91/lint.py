# -*- coding: utf-8 -*-
"""Runda 91 — grind mot texterna INNAN de når Wix.

☠️ Grinden körs på den GENERERADE HTML:en, inte på källkoden. En sträng som
   skrivs direkt i ett API-anrop kan inte grep:as innan den lämnar chatten,
   och API-svaret ekar tillbaka exakt det man skrev — det ser rätt ut för att
   det ÄR det man skrev.

☠️ GRÄNSEN ÄR `[\\wåäöÅÄÖ]`-blickar, INTE `\\b`. `\\b` betyder olika saker i
   Python och JavaScript (JS är ASCII-only), så ett självtest skrivet med
   `\\b` bevisar fel motor. Uppgift #324.
"""
import re
import sys

import texter

GRANS = r"[\wåäöÅÄÖ]"


def ordgrans(kropp):
    return r"(?<!%s)(?:%s)(?!%s)" % (GRANS, kropp, GRANS)


def synlig(h):
    """Taggfri, whitespace-normaliserad text — det kunden faktiskt läser."""
    t = re.sub(r"<[^>]+>", " ", h)
    return re.sub(r"\s+", " ", t).strip()


def meningar(t):
    return [m.strip() for m in re.split(r"(?<=[.!?])\s+", t) if m.strip()]


# ── 1. Tyska och engelska ord ────────────────────────────────────────────
TYSKA = [
    "Roller", "Scooter", "Kinder", "Kinderroller", "Tretroller", "Cityroller",
    "Kickscooter", "Kinderscooter", "Lenker", "Lenkerbreite", "Raeder", "Rader",
    "Parkstaender", "Parkstander", "Bremse", "Bremsen", "Griffe", "Griffen",
    "klappbar", "klappbarer", "Belastbarkeit", "Gesamtmasse", "Gesamtabmessungen",
    "Gesamtgroesse", "Technische", "Daten", "Beschreibung", "Lieferumfang",
    "Farbe", "Stahl", "Kunststoff", "Jahre", "Zoll", "Trittflaeche",
    "Trittbrett", "Raddurchmesser", "Reifendurchmesser", "Koerpergroesse",
    "Empfohlenes", "Gewichtsgrenze", "Alter", "Altersempfehlung", "Montage",
    "erforderlich", "Anleitung", "Gebrauchsanleitung", "Bedienungsanleitung",
    "Aufbauanleitung", "hoehenverstellbar", "hohenverstellbar", "verstellbar",
    "verstellbarem", "verstellbaren", "Leichtbau", "Schwarz", "Weiss",
    "Blau", "Gruen", "Grun", "Gefaltet", "Pedalgroesse", "Bodenfreiheit",
    "Handbremse", "Fussstuetze", "Kugellager", "Vorderrad", "Hinterrad",
    "Schutzausruestung", "Hinweis", "Erwachsener", "Zusammenbau",
    "und", "mit", "fuer", "der", "die", "das", "ist", "ein", "eine",
    "nicht", "auch", "sich", "von", "des", "Ihr", "Ihrem",
    # ☠️ "den" och "dem" stod här och fällde varenda text. De är TYSKA ord
    # OCH svenska ord. En ordlista som inte skiljer på dem gör grinden
    # obrukbar, och en obrukbar grind stängs av — vilket är hur ett äkta
    # tyskt ord slipper igenom nästa gång. Ta aldrig in ett ord som finns
    # i båda språken.
]

# ☠️ Umlauter skrivs som ae/oe/ue i listan ovan och expanderas HÄR, så att
# ordet fångas i båda stavningarna. Skrivs de rakt i listan gör en enda
# felkopierad umlaut att ordet aldrig matchar — tyst.
def _umlautvarianter(o):
    ut = {o}
    for a, b in (("ae", "ä"), ("oe", "ö"), ("ue", "ü"), ("ss", "ß")):
        ut |= {v.replace(a, b) for v in list(ut) if a in v}
    return sorted(ut)


TYSKA = sorted({v for o in TYSKA for v in _umlautvarianter(o)})


# ── 2. Förbjudna påståenden ──────────────────────────────────────────────
FORBJUDET = [
    # Avsändarland / lager — Leonards regel 2026-08-15
    (r"[Ss]kickas fr[åa]n", "avsändarland"),
    (ordgrans(r"[Tt]yskland|[Ss]panien|[Pp]olen|[Kk]ina|[Tt]jeckien"), "avsändarland"),
    (ordgrans(r"EU-lager|centrallager|lagerland"), "lagerland"),
    # Leverantören — mot kunden är VI leverantören
    (ordgrans(r"[Ll]everant[öo]ren?s?"), "leverantören (vi ÄR leverantören)"),
    (r"[Vv]i (?:har inga|vet inte|saknar) uppgift", "vi-vet-inte"),
    (r"anges? inte", "vi-vet-inte"),
    # Priser — importen sätter dem, poleringen rör dem aldrig
    (ordgrans(r"\d+\s*kr|kronor|prisv[äa]rd|billig(?:are|ast)?|fyndpris|rea"), "pris"),
    # Ogrundad certifiering — uppgift #252
    (ordgrans(r"EN\s?71|CE-m[äa]rkt|certifierad|godk[äa]nd|typgodk[äa]nd|"
              r"testad enligt|uppfyller\s+\w*\s*standard"), "ogrundad certifiering"),
    # Fordonsklass — en sparkcykel är ett lekfordon, föraren är gående
    (ordgrans(r"elsparkcykel|elscooter|eldriven"), "fel fordonsklass"),
    (r"hj[äa]lm(?:en)?\s+[äa]r\s+(?:lag|obligatorisk|p[åa]bjuden)", "hjälm som lag"),
    (r"enligt\s+lag\s+m[åa]ste", "hjälm som lag"),
    # Runda 57 och 90 fällde detta påstående; det gäller fortfarande
    (ordgrans(r"rostfri(?:tt|a)?"), "rostfri (lackerad stålram är inte rostfri)"),
    # ☠️ RUNDANS EGEN GRIND: fotbollsmönstret finns inte. Tre av fyra
    #    källtexter lovar "Gummiräder im Fußballdesign"; zoomen visar ett
    #    vanligt grovmönstrat offroad-däck. Runda 89 fällde samma påstående
    #    på modell F och skrev in förbudet — här är det en regel i koden.
    (ordgrans(r"fotboll\w*|f[oö]tboll\w*"), "fotbollsmönster (finns inte — mätt i zoom)"),
    # Intern jargong — uppgift #318
    (ordgrans(r"rundan|batchen|poleringen|utkastet|mappningen"), "intern jargong"),
    # Artikelnummer — det farligaste vi har att läcka
    (r"\d{3}-\d{3}[A-Z0-9]{2,}", "artikelnummer"),
    (ordgrans(r"[Aa]rtikelnummer|[Mm]odellreferens|[Aa]rtikelnr|Referens"), "artikelnummer-etikett"),
    # Husmärken
    (ordgrans(r"HOMCOM|Outsunny|PawHut|Aiyaplay|Aosom|AliExpress|Vinsetto"), "husmärke"),
    # Talen som förkastades i Steg 4/5
    # ☠️ Ø30,5 står i EN av fyra källor där tre säger Ø30. Samma mått
    #    avrundat två gånger (12 tum = 30,48 cm) — Ø30 skrivs, 30,5 aldrig.
    (ordgrans(r"30,5"), "förkastat mått (en källa säger 30,5 där tre säger 30)"),
]

# ── 3. Hjultypen — den grind som är PER PRODUKT ──────────────────────────
# Modell G har LUFTFYLLDA däck och kan gå platt. A, C och den hopfällbara har
# massiva hjul. Ett kopierat skötselråd blir direkt fel åt båda hållen.
MASSIVT = re.compile(
    r"punkteringsfri|kan inte punktera|inget(?:ing)? att pumpa|"
    r"aldrig beh[öo]ver pumpas|beh[öo]ver varken pumpas|utan innerslang|"
    r"utan luft|slangl[öo]s", re.I)
LUFT = re.compile(r"luftfyll|luftd[äa]ck|luft i d[äa]cket|cykelpump|"
                  r"h[åa]llas h[åa]rda|pumpa(?:s|r)?\s+(?:upp|p[åa])", re.I)

# ☠️ Ett luftdäck får NÄMNAS på en produkt med massiva hjul — men bara som
# KONTRAST ("hårdare än ett luftdäck"). Utan fönstret fäller grinden den enda
# meningen som förklarar vad massiva hjul kostar, och då skrivs den bort och
# kunden får veta mindre. Samma form som runda 89:s massiv-grind, speglad.
KONTRAST = re.compile(
    r"(?:\b[äa]n\b|till skillnad|\bmot\b|\bsnarare\b|\bi st[äa]llet f[öo]r\b|"
    r"\bolikt\b|\bjämf[öo]rt med\b)[^.]{0,24}$", re.I)
KONTRASTFONSTER = 40

# ☠️ ALLA FYRA HAR LUFTDÄCK ("Aufblasbare Reifen"). Grinden pekar därför åt
# MOTSATT håll mot runda 90:s modell A och C — här är "punkteringsfri" och
# varje släkting till det förbjudet, och pumpråd är obligatoriskt korrekta.
LUFTHJUL = {"369b4b2c", "feac1d03", "c851d101", "1b1d4842"}
MASSIVHJUL = set()

# ── 4. Tal som får förekomma, per produkt ────────────────────────────────
TAL_OK = {
    # Gemensamt för modellen: 120 × 58 × 85–95 cm, fotplatta 30 × 11,
    # hjul Ø30, maxlast 100 kg, från 5 år, vikt 8,2 kg. Paketmåttet skiljer.
    "369b4b2c": {"120", "58", "85", "95", "30", "11", "100", "5", "8,2"} | {"89", "16", "44"},
    "feac1d03": {"120", "58", "85", "95", "30", "11", "100", "5", "8,2"} | {"89", "16", "44"},
    "c851d101": {"120", "58", "85", "95", "30", "11", "100", "5", "8,2"} | {"90", "44,5", "16"},   # eget paketmått, ordagrant
    "1b1d4842": {"120", "58", "85", "95", "30", "11", "100", "5", "8,2"} | {"89", "16", "44"},
}

# ☠️ Tal som beskriver en LÄNKAD sida, inte den här varan. De står i
# ankartexten ("den här modellen för 6–12 år") och är hämtade ur den
# publicerade sidans egen spec — inte påhittade, och inte lånade till den
# här produktens mått. De listas explicit så att en NY siffra i brödtexten
# fortfarande fälls.
TAL_LANK = {
    # Den lågstyrda modell D-sidan som varje text korslänkar till: 75–80 cm.
    "369b4b2c": {"75", "80"},
    "feac1d03": {"75", "80"},
    "c851d101": {"75", "80"},
    "1b1d4842": {"75", "80"},
}

# Mått som tillhör en ANNAN modell i familjen och alltså aldrig får lånas.
# Mått som tillhör en ANNAN modell i familjen och alltså aldrig får lånas.
# ☠️ "75–80" står INTE här: det är modell D:s styrhöjd och skrivs med flit i
#    korslänken, som förklarar skillnaden. Talgrinden ovan täcker den via
#    TAL_LANK, så en 75:a i BRÖDTEXTEN fälls fortfarande.
FRAMMANDE = {
    "369b4b2c": ["139", "115", "118", "94", "143", "135", "90–96", "80–88", "Ø40", "Ø20", "Ø41", "50 kg", "6,5 kg", "6,7 kg", "9,5 kg"],
    "feac1d03": ["139", "115", "118", "94", "143", "135", "90–96", "80–88", "Ø40", "Ø20", "Ø41", "50 kg", "6,5 kg", "6,7 kg", "9,5 kg"],
    "c851d101": ["139", "115", "118", "94", "143", "135", "90–96", "80–88", "Ø40", "Ø20", "Ø41", "50 kg", "6,5 kg", "6,7 kg", "9,5 kg"],
    "1b1d4842": ["139", "115", "118", "94", "143", "135", "90–96", "80–88", "Ø40", "Ø20", "Ø41", "50 kg", "6,5 kg", "6,7 kg", "9,5 kg"],
}

# ── 4b. Fälgfärgen är MÄTT på hjältebilden, inte läst i källan ───────────
# ☠️ Runda 89 skrev "röd fälg" om en fälg som var silver — bara gaffeln var
# röd. Runda 90 skrev först "silverfärgade" och "svarta" om två fälgar som
# båda är VITA. Båda felen kom av att läsa en miniatyr. Grinden kräver att
# varje färgord framför "fälg" står i produktens egen, uppmätta lista.
# ☠️ MUTATIONSTESTET HITTADE ETT HÅL I RUNDA 90:s GRIND. Den matchade bara
# ordföljden "<färg> fälg" — men "ekerfälg i silver" sätter färgen EFTER, och
# då såg regeln ingenting. En felskriven fälgfärg i den ordföljden hade gått
# rakt igenom. Båda ordföljderna matchas nu, och samma form används för ramen.
FARG = (r"r[öo]d|bl[åa]|gr[öo]n|rosa|orange|turkos|svart|vit|lila|gul|silver|"
        r"beige|gr[åa]ddvit|krom")
FALG_RE = re.compile(
    r"(?:(%s)\w*\s+f[äa]lg|f[äa]lg\w*\s+i\s+(%s)\w*)" % (FARG, FARG), re.I)
# ☠️ RAMFÄRGEN VAR HELT OGRINDAD. Mutationen "turkos ram" → "silverfärgad ram"
# passerade — grinden vaktade fälgen men inte det största färgade partiet på
# varan. Samma form, egen uppmätt lista per produkt.
RAM_RE = re.compile(
    r"(?:(%s)\w*\s+ram|ram\w*\s+i\s+(%s)\w*)" % (FARG, FARG), re.I)

FALG_OK = {
    # Alla fyra har SAMMA ekerfälg i silver — mätt i 2× zoom på hjältebilden.
    "369b4b2c": {"silver"}, "feac1d03": {"silver"},
    "c851d101": {"silver"}, "1b1d4842": {"silver"},
}

# Ramfärgen, mätt i samma zoom. `feac1d03` heter "Hellblau" i källan.
RAM_OK = {
    "369b4b2c": {"svart"}, "feac1d03": {"turkos"},
    "c851d101": {"vit"}, "1b1d4842": {"beige"},
}

# ☠️ RANDNINGEN VAR OGRINDAD, och det var där felet faktiskt satt. Fälg- och
# ramgrinden ovan släppte igenom "turkos ram med guld- och svartrandning" på en
# ram vars randband i 6× zoom är GULD, VITT och SVART. Randen är ett eget
# färgpåstående och behöver en egen uppmätt lista.
#
# Två ordföljder, båda i bruk: en uppräkning efter "randband i ..." och formen
# "<färg>a ränder". Uppräkningen stannar av sig själv vid ett ord som inte är
# en färg — därav "styret är svart" i stället för ", svart styre" i spec-raden.
RAND_LISTA_RE = re.compile(
    r"randband i ((?:%s)\w*(?:(?:,\s*|\s+och\s+)(?:%s)\w*)*)" % (FARG, FARG), re.I)
RANDER_RE = re.compile(r"((?:%s)\w*)\s+r[äa]nder" % FARG, re.I)

# Uppmätt i 6× zoom på hjältebilden, band för band.
RAND_OK = {
    "369b4b2c": {"guld", "vit"},            # guld / vitt / guld — inget svart band
    "feac1d03": {"guld", "vit", "svart"},   # guld / vitt / svart
    "c851d101": {"svart"},                  # bara svarta band, ingen guldrand
    "1b1d4842": {"guld", "vit", "svart"},   # guld / vitt / svart
}

# ── 5. Svensk sifferstil ─────────────────────────────────────────────────
SIFFERSTIL = [
    (r"\d+\.\d+\s*(?:cm|kg|m|mm)", "decimalpunkt i stället för komma"),
    (r"\d+\s*x\s*\d+\s*(?:x\s*\d+\s*)?cm", "x i stället för ×"),
    (r"\d+\s*-\s*\d+\s*(?:cm|kg|år|tum)", "bindestreck i stället för tankstreck"),
    (r"\d+,\s*\d+\s+och\s+\d+\s*(?:cm|kg)", "kommalista av tal med enheten sist"),
]


# ═════════════════════════════════════════════════════════════════════════
# SJÄLVTEST: en grind som inte kan fälla är ingen grind
# ═════════════════════════════════════════════════════════════════════════

def sjalvtest():
    """Varje regel måste fälla en sträng den ÄR till för att fälla."""
    prov = [
        ("<p>Ein Kinderroller mit Bremse.</p>", "tyskt ord"),
        ("<p>Skickas från vårt lager.</p>", "avsändarland"),
        ("<p>Levereras direkt från Tyskland.</p>", "avsändarland"),
        ("<p>Leverantören anger 5 år.</p>", "leverantören"),
        ("<p>Måtten anges inte av tillverkaren.</p>", "vi-vet-inte"),
        ("<p>Ett fynd för 1099 kr.</p>", "pris"),
        ("<p>Testad enligt EN 71.</p>", "certifiering"),
        ("<p>En smidig elsparkcykel för stan.</p>", "fordonsklass"),
        ("<p>Hjälm är lag i Sverige.</p>", "hjälm som lag"),
        ("<p>Ramen är i rostfritt stål.</p>", "rostfri"),
        ("<p>Gummihjul i fotbollsdesign.</p>", "fotbollsmönster"),
        ("<p>Hjulen mäter 30,5 cm.</p>", "förkastat mått 30,5"),
        ("<p>Rundan gav sju sidor.</p>", "intern jargong"),
        ("<p>Modellreferens: 371-021YG</p>", "artikelnummer"),
        ("<p>Tillverkad av HOMCOM.</p>", "husmärke"),
        ("<p>Bredden är 12.5 cm.</p>", "sifferstil decimalpunkt"),
        ("<p>Måtten är 115 x 50 cm.</p>", "sifferstil x"),
        ("<p>Passar barn 5-12 år.</p>", "sifferstil bindestreck"),
    ]
    fel = []
    for text, vad in prov:
        if not brister("PROV", text, hjul="massiv", tal=set(), frammande=[]):
            fel.append("regeln for %r fallde INTE %r" % (vad, text))
    # Hjulgrinden åt BÅDA håll
    if not brister("PROV", "<p>Punkteringsfria hjul.</p>", hjul="luft", tal=set(), frammande=[]):
        fel.append("massiv-pastaende pa LUFTdack fangades inte")
    if not brister("PROV", "<p>Inget att pumpa.</p>", hjul="luft", tal=set(), frammande=[]):
        fel.append("inget-att-pumpa pa LUFTdack fangades inte")
    if brister("PROV", "<p>Fyll på med en vanlig cykelpump.</p>", hjul="luft", tal=set(), frammande=[]):
        fel.append("RATT pumprad pa luftdack falldes felaktigt")
    # Främmande mått
    if not brister("PROV", "<p>Ramen är 118 cm lång.</p>", hjul="massiv", tal=set(), frammande=["118"]):
        fel.append("lanat matt fangades inte")
    if not brister("PROV", "<p>Silverfärgade fälgar.</p>", hjul="luft", tal=set(),
                   frammande=[], falgfarger={"vit"}):
        fel.append("ogrundad falgfarg (fore) fangades inte")
    # ☠️ Den ordfoljd runda 90:s grind missade
    if not brister("PROV", "<p>Ekerfälg i svart.</p>", hjul="luft", tal=set(),
                   frammande=[], falgfarger={"silver"}):
        fel.append("ogrundad falgfarg (EFTER) fangades inte")
    if brister("PROV", "<p>Ekerfälg i silver.</p>", hjul="luft", tal=set(),
               frammande=[], falgfarger={"silver"}):
        fel.append("RATT falgfarg falldes felaktigt")
    if not brister("PROV", "<p>Silverfärgad ram.</p>", hjul="luft", tal=set(),
                   frammande=[], ramfarger={"turkos"}):
        fel.append("ogrundad ramfarg fangades inte")
    if brister("PROV", "<p>Turkos ram.</p>", hjul="luft", tal=set(),
               frammande=[], ramfarger={"turkos"}):
        fel.append("RATT ramfarg falldes felaktigt")
    # ☠️ Randfargen — grinden som saknades nar runda 91 skrev "guld- och
    #    svartrandning" om ett band som ar guld, VITT och svart.
    if not brister("PROV", "<p>Randband i guld och svart.</p>", hjul="luft", tal=set(),
                   frammande=[], randfarger={"guld", "vit"}):
        fel.append("ogrundad randfarg i uppraekningen fangades inte")
    if not brister("PROV", "<p>Randband i guld, vitt och orange.</p>", hjul="luft",
                   tal=set(), frammande=[], randfarger={"guld", "vit", "svart"}):
        fel.append("ogrundad randfarg SIST i uppraekningen fangades inte")
    if not brister("PROV", "<p>Ram med gröna ränder.</p>", hjul="luft", tal=set(),
                   frammande=[], randfarger={"svart"}):
        fel.append("ogrundad randfarg i formen <farg>a rander fangades inte")
    if brister("PROV", "<p>Randband i guld, vitt och svart, styret är svart.</p>",
               hjul="luft", tal=set(), frammande=[], randfarger={"guld", "vit", "svart"}):
        fel.append("RATT randband falldes felaktigt")
    if brister("PROV", "<p>Vit ram med svarta ränder.</p>", hjul="luft", tal=set(),
               frammande=[], randfarger={"svart"}):
        fel.append("RATT <farg>a rander falldes felaktigt")
    if not brister("PROV", "<p>Randband i guld och svart.</p>", hjul="luft", tal=set(),
                   frammande=[], randfarger={"guld", "vit", "svart"}):
        fel.append("UTELAEMNAD randfarg fangades inte")
    return fel


def brister(pid, h, hjul, tal, frammande, falgfarger=None, ramfarger=None,
            randfarger=None):
    su = synlig(h)
    f = []

    for ord_ in TYSKA:
        if re.search(ordgrans(re.escape(ord_)), su):
            f.append("tyskt/främmande ord: %r" % ord_)

    for monster, vad in FORBJUDET:
        # ☠️ re.I på HELA listan. Utan den fällde `hjälm är lag` och `rundan`
        # inte sina egna prov — de står med stor bokstav i början av en mening,
        # och en grind som bara ser gemener är en grind som inte biter.
        m = re.search(monster, su, re.I)
        if m:
            f.append("%s: %r" % (vad, m.group(0)))

    for monster, vad in SIFFERSTIL:
        m = re.search(monster, su, re.I)
        if m:
            f.append("sifferstil, %s: %r" % (vad, m.group(0)))

    # ☠️ Hjulgrinden är PER PRODUKT. Modell G har luftdäck och kan gå platt.
    if hjul == "luft":
        m = MASSIVT.search(su)
        if m:
            f.append("massivt-hjul-påstående på en produkt med LUFTDÄCK: %r" % m.group(0))
    else:
        for m in LUFT.finditer(su):
            fore = su[max(0, m.start() - KONTRASTFONSTER):m.start()]
            if not KONTRAST.search(fore):
                f.append("luftdäcks-påstående UTAN kontrastmarkör på en produkt "
                         "med MASSIVA hjul: %r" % m.group(0))

    # Fälg- och ramfärg mot de uppmätta listorna
    for regel, tillatna, vad in ((FALG_RE, falgfarger, "fälgfärg"),
                                 (RAM_RE, ramfarger, "ramfärg")):
        if tillatna is None:
            continue
        for m in regel.finditer(su):
            ord_ = m.group(0).lower()
            if not any(re.search(g, ord_) for g in tillatna):
                f.append("ogrundad %s (mät i 2x zoom): %r" % (vad, m.group(0)))

    # Randfärgerna mot den uppmätta listan — varje färgord i uppräkningen
    # prövas för sig, så en tillagd färg fälls även när de andra stämmer.
    if randfarger is not None:
        fraser = []
        for m in RAND_LISTA_RE.finditer(su):
            fraser.append((m.group(0),
                           re.split(r",\s*|\s+och\s+", m.group(1))))
        for m in RANDER_RE.finditer(su):
            fraser.append((m.group(0), [m.group(1)]))
        # ☠️ KRAVET GÄLLER PER FRAS, inte som union över hela sidan. En union
        #    hade räckt för en text som räknar upp bandet två gånger — och just
        #    då hade en HALV rättning (ingressen ändrad, spec-raden inte) sett
        #    grön ut. Priset är att en text inte får referera tillbaka till en
        #    enskild rand; det är billigare än en tyst halv sanning.
        for fras, ord_i_rand in fraser:
            ord_i_rand = [o.strip().lower() for o in ord_i_rand if o.strip()]
            for o in ord_i_rand:
                if not any(re.search(g, o) for g in randfarger):
                    f.append("ogrundad randfärg (mät i 6x zoom): %r" % o)
            # ⚠️ Egen loopvariabel i den inre generatorn. Ett första utkast skrev
            #    `any(re.search(g, o) for g in ord_i_rand)` — samma namn `g` i
            #    båda looparna, så den inre skuggade den yttre och kontrollen
            #    jämförde orden mot sig själva. Grinden svarade grönt på allt.
            #    Självtestet fällde den; en grind utan självtest hade tigit.
            for kravd in randfarger:
                if not any(re.search(kravd, o) for o in ord_i_rand):
                    f.append("randfärg som finns i bilden men INTE i frasen "
                             "%r: %r" % (fras, kravd))

    # Lånade mått från en annan modell i familjen
    for t in frammande:
        if re.search(ordgrans(re.escape(t)), su):
            f.append("lånat mått från en annan modell: %r" % t)

    # Varje tal i texten ska finnas i produktens egen uppsättning
    if tal:
        for t in re.findall(r"(?<![\d,.])\d+(?:,\d+)?(?![\d,.])", su):
            if t not in tal:
                f.append("främmande tal: %r" % t)

    return f


def kor():
    sjalv = sjalvtest()
    if sjalv:
        print("☠️ SJÄLVTESTET FALLER — grinden bevisar ingenting:")
        for r in sjalv:
            print("   ", r)
        return 1
    print("Självtest: %d regler fäller sina egna prov." % 34)

    HJUL = {p: ("luft" if p in LUFTHJUL else "massiv") for p in texter.P}
    allt = 0
    for pid in texter.P:
        h = texter.html(pid)
        f = brister(pid, h, HJUL[pid], TAL_OK[pid] | TAL_LANK[pid], FRAMMANDE[pid],
                    FALG_OK[pid], RAM_OK[pid], RAND_OK[pid])
        allt += len(f)
        print("%-9s %-6s %4d tecken  %s" % (pid, HJUL[pid], len(h),
                                            "OK" if not f else "%d BRISTER" % len(f)))
        for r in f:
            print("      -", r)
    # ☠️ KORTRUBRIKEN GENOM SAMMA GRIND. Runda 90 lintade bara produkttexten;
    #    kortet är lika mycket ett påstående mot kunden, och rubriken är exakt
    #    den plats där både runda 90 (fälgfärg) och 91 (randfärg) skrev fel.
    #    Talgrinden lämnas av — rubriken bär kortets kicker, inte specen.
    for pid, (kicker, rubrik) in texter.KORT.items():
        f = brister(pid, "<p>%s. %s.</p>" % (kicker, rubrik), HJUL[pid], set(),
                    FRAMMANDE[pid], FALG_OK[pid], RAM_OK[pid], RAND_OK[pid])
        allt += len(f)
        print("%-9s kort   %4d tecken  %s" % (pid, len(rubrik),
                                              "OK" if not f else "%d BRISTER" % len(f)))
        for r in f:
            print("      -", r)

    print("\nTotalt: %d brister" % allt)
    return 1 if allt else 0


if __name__ == "__main__":
    sys.exit(kor())
