# -*- coding: utf-8 -*-
"""Runda 90 — grind mot texterna INNAN de når Wix.

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
    # Rundans egen grind — runda 57 fällde samma påstående
    (ordgrans(r"rostfri(?:tt|a)?"), "rostfri (lackerad stålram är inte rostfri)"),
    # Intern jargong — uppgift #318
    (ordgrans(r"rundan|batchen|poleringen|utkastet|mappningen"), "intern jargong"),
    # Artikelnummer — det farligaste vi har att läcka
    (r"\d{3}-\d{3}[A-Z0-9]{2,}", "artikelnummer"),
    (ordgrans(r"[Aa]rtikelnummer|[Mm]odellreferens|[Aa]rtikelnr|Referens"), "artikelnummer-etikett"),
    # Husmärken
    (ordgrans(r"HOMCOM|Outsunny|PawHut|Aiyaplay|Aosom|AliExpress|Vinsetto"), "husmärke"),
    # Talen som förkastades i Steg 4/5
    (ordgrans(r"12,5\s*cm"), "förkastat mått (tvetydig pil på skissen)"),
    (ordgrans(r"41\s*cm"), "förkastat mått (skissen säger 41, spec Ø40)"),
    (r"9\s*cm\s+(?:[öo]ver|fr[åa]n)\s+mark", "förkastad markfrigång (9 mot 11)"),
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

LUFTHJUL = {"5129f6b0", "50b28808"}          # modell G — luftdäck
MASSIVHJUL = {"9518db1e", "473084eb", "85be4535", "68f8f1a7", "eb4418ad"}

# ── 4. Tal som får förekomma, per produkt ────────────────────────────────
TAL_OK = {
    "5129f6b0": {"139", "58", "90", "96", "36", "40", "100", "5", "9,5", "99", "16", "52"},
    "50b28808": {"139", "58", "90", "96", "36", "40", "100", "5", "9,5", "99", "16", "52"},
    "9518db1e": {"115", "50", "80", "88", "31", "10,8", "11", "30", "5", "12", "6,5", "102", "14", "45"},
    "473084eb": {"115", "50", "80", "88", "31", "10,8", "11", "30", "5", "12", "6,5", "102", "14", "45"},
    "85be4535": {"115", "50", "80", "88", "31", "10,8", "11", "30", "5", "12", "6,5", "102", "14", "45"},
    "68f8f1a7": {"120", "52", "80", "88", "32", "11", "12", "50", "5", "6,7", "88", "16", "45"},
    "eb4418ad": {"94", "36", "88", "103", "85", "15", "31", "93", "98", "45,5", "14",
                 "20", "7", "100", "110", "130", "6", "8", "87", "15,5", "32"},
}

# ☠️ Tal som beskriver en LÄNKAD sida, inte den här varan. De står i
# ankartexten ("den här modellen för 6–12 år") och är hämtade ur den
# publicerade sidans egen spec — inte påhittade, och inte lånade till den
# här produktens mått. De listas explicit så att en NY siffra i brödtexten
# fortfarande fälls.
TAL_LANK = {
    "5129f6b0": {"5", "16"},      # bd3bdc1b: 16 tum, från 5 år
    "50b28808": {"5", "16"},
    "9518db1e": {"6", "12"},      # 2b8297df: 6–12 år
    "473084eb": {"6", "12"},
    "85be4535": {"6", "12"},
    "68f8f1a7": set(),
    "eb4418ad": {"12", "2", "6"}, # 82b5a517: 12 tum · d3cf8ebc: 2–6 år
}

# Mått som tillhör en ANNAN modell i familjen och alltså aldrig får lånas.
FRAMMANDE = {
    "5129f6b0": ["115", "120", "118", "94", "80–88", "Ø30", "Ø20", "50 kg", "6,5 kg", "6,7 kg"],
    "50b28808": ["115", "120", "118", "94", "80–88", "Ø30", "Ø20", "50 kg", "6,5 kg", "6,7 kg"],
    "9518db1e": ["139", "118", "120", "94", "90–96", "Ø40", "Ø20", "100 kg", "9,5 kg", "6,7 kg"],
    "473084eb": ["139", "118", "120", "94", "90–96", "Ø40", "Ø20", "100 kg", "9,5 kg", "6,7 kg"],
    "85be4535": ["139", "118", "120", "94", "90–96", "Ø40", "Ø20", "100 kg", "9,5 kg", "6,7 kg"],
    "68f8f1a7": ["139", "115", "118", "94", "90–96", "Ø40", "Ø30", "Ø20", "100 kg", "9,5 kg", "6,5 kg"],
    "eb4418ad": ["139", "115", "118", "120", "90–96", "80–88", "Ø40", "Ø30", "50 kg", "6,5 kg", "6,7 kg"],
}

# ── 4b. Fälgfärgen är MÄTT på hjältebilden, inte läst i källan ───────────
# ☠️ Runda 89 skrev "röd fälg" om en fälg som var silver — bara gaffeln var
# röd. Runda 90 skrev först "silverfärgade" och "svarta" om två fälgar som
# båda är VITA. Båda felen kom av att läsa en miniatyr. Grinden kräver att
# varje färgord framför "fälg" står i produktens egen, uppmätta lista.
FALG_RE = re.compile(
    r"(r[öo]d|bl[åa]|gr[öo]n|rosa|orange|turkos|svart|vit|lila|gul|silver)"
    r"(?:a|t|e)?(?:f[äa]rgade?)?\s+f[äa]lg", re.I)

FALG_OK = {
    "5129f6b0": {"vita"},        # vitlackerat fälgband, silverekrar
    "50b28808": {"vita"},        # SAMMA hjul som den vita modellen
    "9518db1e": {"bl[åa]"},
    "473084eb": {"rosa"},
    "85be4535": {"svarta"},      # familjens enda modell C med svarta fälgar
    "68f8f1a7": {"svarta"},
    "eb4418ad": set(),           # nämner ingen fälgfärg
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
        ("<p>Rundan gav sju sidor.</p>", "intern jargong"),
        ("<p>Modellreferens: 371-021YG</p>", "artikelnummer"),
        ("<p>Tillverkad av HOMCOM.</p>", "husmärke"),
        ("<p>Skärmen är 12,5 cm hög.</p>", "förkastat mått"),
        ("<p>Hjulet mäter 41 cm.</p>", "förkastat mått"),
        ("<p>Fotplattan sitter 9 cm över marken.</p>", "förkastad markfrigång"),
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
    if not brister("PROV", "<p>Fyll på med en cykelpump.</p>", hjul="massiv", tal=set(), frammande=[]):
        fel.append("pump-rad pa MASSIVA hjul fangades inte")
    # Främmande mått
    if not brister("PROV", "<p>Ramen är 118 cm lång.</p>", hjul="massiv", tal=set(), frammande=["118"]):
        fel.append("lanat matt fangades inte")
    if not brister("PROV", "<p>Silverfärgade fälgar.</p>", hjul="massiv", tal=set(),
                   frammande=[], falgfarger={"vita"}):
        fel.append("ogrundad falgfarg fangades inte")
    if brister("PROV", "<p>Vita fälgar.</p>", hjul="massiv", tal=set(),
               frammande=[], falgfarger={"vita"}):
        fel.append("RATT falgfarg falldes felaktigt")
    return fel


def brister(pid, h, hjul, tal, frammande, falgfarger=None):
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

    # Fälgfärg mot den uppmätta listan
    if falgfarger is not None:
        for m in FALG_RE.finditer(su):
            ord_ = m.group(0).lower()
            if not any(re.search(g, ord_) for g in falgfarger):
                f.append("ogrundad fälgfärg (mät hjältebilden): %r" % m.group(0))

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
    print("Självtest: %d regler fäller sina egna prov." % 22)

    HJUL = {p: ("luft" if p in LUFTHJUL else "massiv") for p in texter.P}
    allt = 0
    for pid in texter.P:
        h = texter.html(pid)
        f = brister(pid, h, HJUL[pid], TAL_OK[pid] | TAL_LANK[pid], FRAMMANDE[pid],
                    FALG_OK[pid])
        allt += len(f)
        print("%-9s %-6s %4d tecken  %s" % (pid, HJUL[pid], len(h),
                                            "OK" if not f else "%d BRISTER" % len(f)))
        for r in f:
            print("      -", r)
    print("\nTotalt: %d brister" % allt)
    return 1 if allt else 0


if __name__ == "__main__":
    sys.exit(kor())
