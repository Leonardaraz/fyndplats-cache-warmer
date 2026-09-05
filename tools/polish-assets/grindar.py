# -*- coding: utf-8 -*-
"""Regler som gäller VARJE poleringsrunda, på ETT ställe.

☠️ Runda 64 bar sina egna kopior av allt det här. Husets vanligaste bugg är att
tvillingar glider isär (`SHIP_AXIS_RE`, `EU_TULL_CODES`, `mapWithConcurrency`),
och en runda som fixar en ordlista utan att den andra får rättelsen är exakt
den formen. Från runda 65 importeras de härifrån.

⚠️ `runda-64/lint.py` har fortfarande sina egna kopior. Den rundan är klar och
publicerad, så den lämnas orörd — men flyttas hit nästa gång den ändå ska röras.
"""
import re

# --- Tyska ord som INTE också är svenska ord. Ordgräns i båda ändar. --------
TYSKA = [
    "sessel", "hocker", "liegefunktion", "belastbarkeit", "farbe", "gewicht",
    "rückenlehne", "ruckenlehne", "sitzfläche", "sitzflache", "fußstütze",
    "fussstutze", "schaumstoff", "montage", "abmessungen", "gesamtmaße",
    "gesamtmasse", "lieferumfang", "artikelnummer", "drehbar", "verstellbar",
    "esszimmerstuhl", "drehhocker", "gummiholz", "kunstleder", "mikrofaser",
    "wohnzimmer", "bodensofa", "massagestuhl", "freischwinger", "knopfheftung",
    "birkenfurnier", "holzrahmen", "sperrholz",
]

HUSMARKEN = ["homcom", "outsunny", "pawhut", "aiyaplay", "vinsetto", "aosom"]

LANDORD = ["tyskland", "kina", "polen", "spanien", "tjeckien", "nederländerna",
           "belgien", "frankrike", "italien", "storbritannien"]

# Butikens egen chrome-rad säger "Skickas från EU-lager". Den är butikens, inte
# vår — därför läses de här BARA inuti vår textregion, aldrig på hela sidan.
LAGERFRAS = ["eu-lager", "skickas från", "fraktas från", "lagerland"]

# ☠️ Mot kunden är VI leverantören. Runda 53 hittade fem defensiva
#    formuleringar som alla sköt ifrån sig tal ur vår egen spec-tabell.
ATTRIBUTION = ["leverantör", "leverantören", "leverantörens", "tillverkaren",
               "tillverkarens", "grossist"]

# ☠️ Mönstret krävde tidigare tre SIFFROR före bindestrecket och missade därmed
#    `83F-028V00GY` — numret som står i en produkts EGEN tyska brödtext. Aosoms
#    nummer börjar med en siffra men får ha bokstäver redan i första ledet.
#    Kravet på minst en versal håller årtal som "2024-2025" utanför.
ARTNR = re.compile(r"\b(?=[0-9A-Z-]*[A-Z])[0-9][0-9A-Z]{1,3}-[0-9A-Z]{4,}\b")

ANKARE = re.compile(r'<a href="([^"]*)"[^>]*>(.*?)</a>', re.S)

# ☠️ En färg som INTE står här är osynlig för grinden. Runda 65: `89c89322`
#    beskrevs som "grå" och är på fotot tydligt SALVIAGRÖN — och `grågrön`
#    fanns inte i listan, så grinden hade inte kunnat säga ifrån åt något håll.
#    Lägg till ordet samtidigt som du använder det.
FARGORD = ["brun", "beige", "vit", "svart", "grå", "ljusgrå", "mörkgrå",
           "gräddvit", "gråbeige", "ljusbrun", "blå", "grön", "grågrön",
           "röd", "gul", "rosa", "silverfärgad", "creme"]


# ------------------------------------------------ påstående vs förnekande ---
# ☠️ En påstående-grind måste kunna skilja ett påstående från ett FÖRNEKANDE.
#    "Är ramen gummi?" följt av "Nej, den är gummiträ" är inte ett
#    materialpåstående — det är motsatsen. En FAQ-fråga läses därför ALLTID
#    tillsammans med nästa mening, annars faller svaret utanför.
NEKORD = re.compile(r"\b(inte|nej|ingen|inget|ingenting|aldrig|varken)\b")


def strip_taggar(h):
    return re.sub(r"\s+", " ", re.sub(r"<[^>]+>", " ", h)).strip()


# ☠️ ETT <li> SAKNAR SKILJETECKEN — och utan ett blir HELA listan en enda
#    mening. Då räcker ETT förnekande var som helst i listan för att skugga
#    varje påstående i den, och en påstående-grind slutar tyst att bita.
#    Uppmätt i runda 65: ett påhittat "Blir en säng på 108 cm" i en <li> gick
#    rakt igenom sovplats-grinden, eftersom en annan punkt i samma lista sa
#    "ingen montering". Mutationstestet hittade det; grinden var grön.
#
#    Samma sak drabbar dela_pa_ankare: ligger en länk i en <li> hade HELA
#    listan tillskrivits länkmålet, och då slutar produktens egna punkter
#    granskas — exakt det fel runda 63 redan förkastade en gång.
#
#    Blockslut blir därför meningsslut FÖRE taggarna strippas. Ett block som
#    redan slutar med skiljetecken får inget till: annars blir en FAQ-fråga
#    "Är ramen massiv björk?" följd av en tom mening ".", och då tappar
#    pastaenden() svaret som frågan ska läsas ihop med.
BLOCKSLUT = re.compile(r"(?is)</(li|p|h[1-6]|div|tr|td|ul|ol|table|blockquote)>")


def _blockdela(html):
    t = strip_taggar(BLOCKSLUT.sub("\x02", html))
    t = re.sub(r"(?:\s*\x02)+", "\x02", t)          # flera blockslut i rad = ett
    t = re.sub(r"([.!?])\s*\x02", r"\1 ", t)        # redan avslutad mening
    return re.sub(r"\s+", " ", t.replace("\x02", ". ")).strip()


def synlig_meningstext(html):
    """Synlig text där varje BLOCK slutar som en egen mening."""
    return _blockdela(html)


def meningar(text):
    """Ger (mening, mening + nästa mening)."""
    bitar = [m.strip() for m in re.split(r"(?<=[.!?])\s+", text) if m.strip()]
    for i, m in enumerate(bitar):
        nasta = bitar[i + 1] if i + 1 < len(bitar) else ""
        yield m, (m + " " + nasta).strip()


def pastaenden(text, monster):
    """Träffar på monster som INTE ligger i ett förnekande."""
    ut = []
    for m, m_med_nasta in meningar(text):
        for tr in monster.finditer(m):
            sammanhang = m_med_nasta if m.rstrip().endswith("?") else m
            if not NEKORD.search(sammanhang.lower()):
                ut.append((tr.group(0), m))
    return ut


# ------------------------------------------------------------- SKU-regeln ---
FOGEORD = {"med", "och", "i", "pa", "for", "till", "som", "av", "utan"}


def sku_bas(slug):
    """Speglar lib/import/sku.ts: fogeord bort, bryt på HELT ord vid 24."""
    delar = [d for d in slug.split("-") if d not in FOGEORD]
    ut = ""
    for d in delar:
        kand = d if not ut else ut + "-" + d
        if len(kand) > 24:
            break
        ut = kand
    return ut


# ------------------------------------------------------- korshänvisningar ---
# ☠️ En mening som innehåller en länk är ett påstående om den LÄNKADE
#    produkten, inte om den här. Runda 64 fällde två korrekta texter på det:
#    "En reclinerfåtölj med snurrfot … bär 150 kg" lästes som källans lasttal.
#
#    Två designer som INTE fungerar, båda provade i runda 63:
#      · ta bort hela stycket  → FAQ-svaret blir föräldralöst
#      · markera hela stycket  → källans egna påståenden slutar granskas
#    Det som fungerar är att markera i den SYNLIGA texten före taggarna
#    strippas, och sedan dela per MENING.
_ANKARE_MARK = re.compile(
    r'<a href="https://www\.fyndplats\.se/produkt/([^"]+)"[^>]*>(.*?)</a>', re.S)


def dela_pa_ankare(html):
    """(egna meningar, [(mål-slug, mening)]) — meningar med länk hör till målet."""
    markerad = _ANKARE_MARK.sub(lambda m: "\x00%s\x01%s\x00" % (m.group(1), m.group(2)),
                                html)
    text = _blockdela(markerad)      # ☠️ blockslut = meningsslut, se ovan
    egna, kors = [], []
    for mening in re.split(r"(?<=[.!?])\s+", text):
        mening = mening.strip()
        if not mening:
            continue
        mal = re.findall(r"\x00([^\x01]+)\x01", mening)
        ren = re.sub(r"\x00[^\x01]*\x01", "", mening).replace("\x00", "")
        if mal:
            kors.append((mal[0], ren))
        else:
            egna.append(ren)
    return egna, kors
