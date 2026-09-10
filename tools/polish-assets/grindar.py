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
           "röd", "gul", "rosa", "silverfärgad", "creme", "turkos", "lila",
           "orange",
           # ⚠️ `orange` lades till i runda 124, av EXAKT samma skäl som
           #    `turkos` en gång: två av rundans elva verktygslådor är
           #    svart-orange, och utan ordet i listan svarade färggrinden
           #    grönt på varje sida — den kan bara se ord som står här.
           #    Tystnaden är felläget, inte ett larm.
           # ⚠️ `turkos` lades till i runda 76, som var först att
           #    använda ordet. Utan det kunde ankartext-grinden inte se
           #    en syskonlänk som ljög om färgen — den letar bara efter
           #    ord som STÅR i listan, så ett ord som saknas ger inte
           #    ett fel utan TYSTNAD.
           # ☠️ Här stod tidigare "Beige" med VERSAL — en död post. Grinden
           #    söker i `text.lower()` utan att lowercasea mönstret, så den
           #    kunde aldrig matcha. En rad som ser ut som täckning men inte är
           #    det är sämre än ingen rad: den får listan att verka längre.
           # runda 66: två uppmätta toner. Ett färgord som inte står här kan
           # grinden inte pröva — den är en uppräkning, inte en härledning.
           "stålgrå", "gråbrun", "mörkblå",
           # runda 67: de mörka träfötterna på fåtöljerna B och E.
           "mörkbrun",
           # runda 68: en blek varm neutral (L 90 %) som källan kallar "Beige".
           # Ordet måste stå här för att grinden ska kunna pröva det alls.
           "ljusbeige",
           # ☠️ runda 74: `petrolblå` SAKNADES trots att runda 72 publicerade
           #    ordet på en sida och lade det i sin `MASTE_STA`. Grinden kunde
           #    alltså aldrig pröva det — den kontrollerade att ordet FANNS på
           #    rätt produkt, men inte att det saknades på de sju andra. Ett
           #    färgord som används utan att stå här passerar genom att vara
           #    OSYNLIGT, inte genom att vara rätt. Raden ovan säger det redan;
           #    den följdes inte.
           "petrolblå",
           # runda 74: rundans första KULÖRTA familj. Sex mättade toner där
           #    nyansen (H) avgör ordet och ljusheten bara kvalificerar.
           "orange", "senapsgul"]


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


def _ar_pastaende(m, m_med_nasta):
    """Är meningen ett PÅSTÅENDE, eller ett förnekande?

    ☠️ EN FRÅGA UTAN SITT SVAR ÄR INGET PÅSTÅENDE. Uppmätt i runda 68:
       `dela_pa_ankare` lägger en FAQ-fråga i `egna` men dess SVAR i `kors`
       när svaret bär länken — och då står frågan ensam sist i listan utan
       nästa mening. "Finns det en med lös fotpall?" lästes som att den här
       produkten HAR en fotpall, och grinden fällde en text vars enda fel var
       att den hänvisade vidare.

       Påståendet bor alltid i svaret, och svaret granskas för sig (i `egna`
       eller mot länkmålets facit i `kors`). En fråga som inte går att döma
       ska därför inte dömas.
    """
    fraga = m.rstrip().endswith("?")
    if fraga and m_med_nasta.strip() == m.strip():
        return False
    sammanhang = m_med_nasta if fraga else m
    return not NEKORD.search(sammanhang.lower())


def pastaenden(text, monster):
    """Träffar på monster som INTE ligger i ett förnekande."""
    ut = []
    for m, m_med_nasta in meningar(text):
        for tr in monster.finditer(m):
            if _ar_pastaende(m, m_med_nasta):
                ut.append((tr.group(0), m))
    return ut


def pastar_i_listan(rader, stam):
    """Nämns `stam` som ett PÅSTÅENDE i någon av de färdigdelade meningarna?

    ☠️ Runda 68: utrustningsgrinden kunde inte skilja ett påstående från ett
       FÖRNEKANDE, medan materialgrinden kunde det hela tiden. Familj G har
       inget löst fotstöd, och dess FAQ säger just det — "Ingår det en
       fotpall?" / "Nej, och den behövs inte" — varpå grinden fällde en text
       vars enda fel var att den svarade kunden på frågan.

    ⚠️ Regeln om förnekande bor i `_ar_pastaende` och delas med `pastaenden`.
       En egen kopia här hade blivit den tvilling huset alltid varnar för.
    """
    bitar = [x.strip() for x in rader if x and x.strip()]
    for i, m in enumerate(bitar):
        if stam not in m.lower():
            continue
        nasta = bitar[i + 1] if i + 1 < len(bitar) else ""
        if _ar_pastaende(m, (m + " " + nasta).strip()):
            return True
    return False


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
    """(egna meningar, [(mål-sluggar, mening)]) — meningar med länk hör till målen.

    ☠️ TVÅ FEL, båda uppmätta i runda 66, och tillsammans stängde de av
       färggrinden på korshänvisningar HELT utan att någon grind blev röd:

    1. Markörborttagningen `\x00[^\x01]*\x01` kunde korsa nästa markörs
       `\x00` och åt därmed upp separatorn mellan två intilliggande länkar.
       "stålgrå, gråbrun och mörkgrå" blev "stålgrågråbrunmörkgrå" — och då
       misslyckas varje ordgränskoll, för orden sitter ihop. Mönstret får
       inte kunna passera ett `\x00`.
    2. Bara `mal[0]` tillskrevs meningen. En mening som länkar till tre
       syskon granskades alltså mot ETT syskons facit, vilket antingen
       missar fel eller fäller korrekt text. Alla mål returneras nu, och
       anroparen får pröva mot unionen av deras facit.
    """
    markerad = _ANKARE_MARK.sub(lambda m: "\x00%s\x01%s\x00" % (m.group(1), m.group(2)),
                                html)
    text = _blockdela(markerad)      # ☠️ blockslut = meningsslut, se ovan
    egna, kors = [], []
    for mening in re.split(r"(?<=[.!?])\s+", text):
        mening = mening.strip()
        if not mening:
            continue
        # Samma fälla som i `ren` nedan: utan `[^\x00…]` sträcker sig
        # uttrycket in i NÄSTA markör och ger ", \x00slug2" som "slug".
        mal = re.findall(r"\x00([^\x00\x01]+)\x01", mening)
        ren = re.sub(r"\x00[^\x00\x01]*\x01", "", mening).replace("\x00", "")
        if mal:
            kors.append((mal, ren))
        else:
            egna.append(ren)
    return egna, kors


# ─────────────────────────────────────────────────────────────────────────────
# API- och cache-regler. Runbooken bar båda LÅNGT innan runda 104 bröt mot dem;
# felet var att varje runda skrev sin EGEN grind och därför inte ärvde dem.
# Det är samma tvillingproblem som modulens inledning beskriver, fast om
# skrivgränser i stället för om ordlistor.
# ─────────────────────────────────────────────────────────────────────────────

NAMN_MAXLANGD = 80


def granska_namn(namn):
    """Wix takar `product.name` på 80 tecken. Returnerar en lista med problem.

    ☠️ Gränsen stod redan i runbooken (runda 94, 2026-09-07) MED en färdig
       kontroll. Runda 104 skrev ändå en egen grind utan den, och Wix avvisade
       det 84 tecken långa turkosa namnet EFTER att de två kortare syskonen
       redan var skrivna — alltså en halvskriven familj, som är svårare att
       upptäcka än en helt misslyckad. Felet lyder:
       `400 … name has size 84, expected 80 or less`.

    ⚠️ Mät på TECKEN, inte byte. Namnen bär å/ä/ö och en byte-räkning hade
       fällt korrekta namn.
    """
    problem = []
    n = len(namn)
    if n > NAMN_MAXLANGD:
        problem.append("namnet är %d tecken, taket är %d: %r" % (n, NAMN_MAXLANGD, namn))
    return problem


def hamta_isr(url, paus=20, ua="Mozilla/5.0", timeout=60):
    """Hämtar en ISR-sida SÅ ATT SVARET ÄR FÄRSKT — två gånger, med paus.

    ☠️ Läs aldrig utfallet av den FÖRSTA hämtningen efter en skrivning. Next.js
       svarar *stale-while-revalidate*: första hämtningen får den GAMLA sidan
       och startar ombyggnaden, andra får den nya. Runda 102:s grind fällde
       åtta av tretton korrekta sidor på exakt det.

    ☠️ Och `?cb=<tidsstämpel>` hjälper INTE — ISR nycklar på RUTTEN, inte på
       okända parametrar. Uppmätt igen 2026-09-08 när runda 104:s kort skulle
       kvitteras: `x-vercel-cache: STALE`, `age: 2531`, och sidan bar de FEM
       gamla bild-id:na. Andra hämtningen gav `HIT`, `age: 19` och kortet.

    Returnerar (html, headers). Kastar hellre än att returnera en halv sida:
    en tyst kapad hämtning såg i runda 104:s måttsvep ut som "noll träffar".
    """
    import urllib.request

    import time

    def _hamta(forsok=3):
        """⚠️ Ett övergående TLS-fel får inte döda ett helt svep. Uppmätt
        2026-09-08: `SSL: UNEXPECTED_EOF_WHILE_READING` på tredje sidan av tre,
        efter att de två första gått igenom. Utan återförsök kastas hela
        körningen och de redan mätta sidorna måste mätas om. Att i stället
        SVÄLJA felet vore värre — då räknas en ohämtad sida som ren."""
        for i in range(forsok):
            try:
                return _en_hamtning()
            except Exception:
                if i == forsok - 1:
                    raise
                time.sleep(2 ** i)

    def _en_hamtning():
        req = urllib.request.Request(url, headers={"User-Agent": ua})
        with urllib.request.urlopen(req, timeout=timeout) as r:
            # ⚠️ Nycklarna GEMENAS. Vercel skickar `X-Vercel-Cache`, och en
            #    grind som slår upp `x-vercel-cache` i en rå dict får None —
            #    alltså en tyst tom läsare, husets dyraste felklass. Uppmätt i
            #    runda 104: kolumnen skrev `?` på sex korrekta sidor.
            return (r.read().decode("utf-8", "replace"),
                    {k.lower(): v for k, v in r.headers.items()})

    _hamta()                                   # väckningen — svaret kastas
    import time
    time.sleep(paus)
    html, headers = _hamta()
    if len(html) < 20000:
        raise SystemExit("ISR-hämtningen gav bara %d tecken för %s — halv sida"
                         % (len(html), url))
    return html, headers


# ═══════════════════════════════════════════════════════════════════════════
# LÖFTESGRINDAR — delade sedan runda 116 (uppgift #423)
#
# ☠️ DE LÅG SOM EN KOPIA I VARJE RUNDAS grind.py, och kopian hann bli fel
#    inom EN session: runda 115:s livegrind.py skrev en egen `leveransloften`
#    där FAQ-undantaget testade `mening.endswith("?")` medan `_mening_kring`
#    klipper FÖRE frågetecknet. Tvillingen läste därför JSON-LD:ns rubrik
#    "Ingår batterier?" som ett löfte på fyra av sex korrekta sidor.
#
#    Husets vanligaste bugg, sjätte gången: SHIP_AXIS_RE, EU_TULL_CODES,
#    mapWithConcurrency, STORE_BACKEND, normaliseraFörSkrivning — och nu den
#    här. En regel om SVENSK TEXT hör hemma på ETT ställe.
# ═══════════════════════════════════════════════════════════════════════════

# ☠️ BÖJNINGARNA SKRIVS SOM ETT MÖNSTER, inte som en uppräkning som kan tappa
#    en form. Ett utkast i runda 115 hade `ingen|inget` men inte `inga`, så
#    "Den har inga pedaler alls" lästes som ett LÖFTE om pedaler.
NEGATION = re.compile(r"\b(inte|aldrig|ing(?:en|et|a)|nej|utan|varken"
                      r"|behöver du|snarare än|i stället för)\b", re.I)


def meningsslut(txt, i):
    """Index för närmaste `.` eller `?` från och med i, annars -1."""
    k = [j for j in (txt.find(".", i), txt.find("?", i)) if j >= 0]
    return min(k) if k else -1


def mening_kring(txt, i):
    """Meningen som omsluter position i. Klipper FÖRE skiljetecknet."""
    a = max(txt.rfind(".", 0, i), txt.rfind("?", 0, i), txt.rfind(">", 0, i))
    b = meningsslut(txt, i)
    return txt[a + 1: b if b >= 0 else len(txt)]


def nasta_mening(txt, i):
    """Meningen EFTER den som omsluter i. Tom sträng om ingen finns."""
    s = meningsslut(txt, i)
    if s < 0:
        return ""
    b = meningsslut(txt, s + 1)
    return txt[s + 1: b if b >= 0 else len(txt)]


def _urskuldad(txt, i):
    """Sant om träffen på position i är negerad — i sin egen mening, eller,
    när den står i en FRÅGA, av frågans EGET svar i nästa mening.

    ☠️ Negationen får ALDRIG hämtas från en annan fråga. Runda 114 fick en
       falsk godkännande när ett `ingen` 120 tecken bort i en ANNAN FAQ-fråga
       ursäktade ett löfte (uppgift #415).
    """
    if NEGATION.search(mening_kring(txt, i)):
        return True
    s = meningsslut(txt, i)
    return s >= 0 and txt[s] == "?" and bool(NEGATION.search(nasta_mening(txt, i)))


def loftestraff(monster, txt):
    """Första icke-negerade träffen på `monster`, annars None."""
    for m in monster.finditer(txt):
        if not _urskuldad(txt, m.start()):
            return m
    return None


# ── ☠️ LEVERANSLÖFTE: ett TILLBEHÖR som sägs ingå måste stå i INGAR ─────────
# Runda 115 skrev "en hink följer med i lådan" på fb142c5c i FYRA fält — namn,
# ingress, brödtext och metabeskrivning — mot en INGAR som säger
# `fordonet, bruksanvisning`. Ingen dåvarande grind kunde se det: det är
# varken ett tal, ett märke, ett tonfel eller ett förbjudet ord, utan ett
# SUBSTANTIV som ingen mätning stöder. Ett leveranslöfte är den dyraste sortens
# fel på en produktsida — kunden kan räkna det i lådan.
#
# ☠️ FÖRSTA UTKASTET GRINDADE VARJE SUBSTANTIV och fyrade på `ratten`,
#    `skopan` och på verbet `ingår` självt: sju träffar varav sex brus. Ett
#    falsklarm som alltid fyrar lär mottagaren att sluta läsa.
#
# Grinden tittar därför bara på TILLBEHÖR — lösa saker som KAN ligga i en låda.
# En fast del (ratt, sits, hjul, korg, sufflett) hör aldrig hemma i listan och
# kan alltså inte ge falsklarm.
# ☠️ ORDGRÄNSERNA ÄR INTE KOSMETIK. Utan dem matchar `ing[åa]r` inuti
#    **"kopplingar"**, och runda 116:s mening "två kopplingar att fästa i
#    hundens sele" lästes som ett leveranslöfte om en SELE — på alla sju
#    korrekta sidor. Runda 115:s ordförråd råkade inte innehålla ett sådant
#    ord, så kopian levde ett helt varv utan att felet syntes. Ett falsklarm
#    som fyrar på korrekt text lär mottagaren att sluta läsa.
LEVERANS = re.compile(r"\b(ing[åa]r|f[öo]ljer\s+med|medf[öo]ljer|"
                      r"med\s+i\s+l[åa]dan|i\s+l[åa]dan\s+f[öo]ljer)\b", re.I)
TILLBEHOR = (
    "hink", "spann", "skopa", "grep", "kratta", "sandskyffel", "skyffel",
    "spade", "hjälm", "laddare", "batteri", "batterier", "verktyg", "nyckel",
    "nycklar", "insexnyckel", "dyna", "kudde", "väska", "pump", "sugkopp",
    "fjärrkontroll", "reservdel", "klistermärke", "dekal", "bruksanvisning",
    "manual", "monteringsanvisning", "anvisning", "släp", "vagn", "flagga",
    "vimpel", "regnskydd", "myggnät", "koppel", "sele", "filt", "mugg",
    "vattenflaska", "skål", "matskål",
    # Runda 117: köksvagnarnas STYLINGREKVISITA. Leverantörens bilder visar en
    # bestickinsats i lådan, en mikrovågsugn och en brödrost på skivan — inget
    # av det står i `Lieferumfang`, som är `1 x Küchenwagen` + `1 x Anleitung`.
    # Orden är valda för att de aldrig förekommer i en korrekt köksvagnstext:
    # de kan alltså inte ge falsklarm, bara fånga det fel bilden inbjuder till.
    "bestickinsats", "bestickfack", "besticklåda", "mikrovågsugn", "brödrost",
    "kaffebryggare", "vattenkokare",
    # Runda 118: serverings- och barvagnarnas STYLINGREKVISITA. Leverantörens
    # bilder dukar upp glas, karaffer, tallrikar och kryddburkar på varenda
    # vagn, och `Lieferumfang` är `1 x vagn` + `1 x anvisning`. Samma urval som
    # ovan: orden kan inte stå i en korrekt vagntext utan att lova något.
    "glas", "vinglas", "karaff", "tallrik", "bestick", "servett", "isspann",
    "kryddburk", "skärbräda", "fat",
    # Runda 119: köksöarnas och köksvagnarnas STYLINGREKVISITA. Bilderna visar
    # glasburkar med torrvaror i lådan, vinflaskor i vinstället och barstolar
    # inskjutna under klaffen — inget av det står i `Lieferumfang`.
    #
    # ☠️ `glas` fångar INTE `glasburkar`: mönstret slutar i en ordgräns, och
    #    efter `glas` står ett `b`. Den saknade träffen hittades av rundans
    #    EGET självtest, som injicerade ordet i tron att det redan täcktes —
    #    ett ord som ligger nära ett listat ord är inte listat.
    "glasburk", "vinflaska", "barstol", "fruktkorg",
)


def _bojningar(ord_):
    """Regex som matchar ordets svenska böjningsformer.

    ☠️ SVENSK INDEFINIT PLURAL SAKNADES HELT. Mönstret var
    `\b<ord>s?(?:n|en|et|na|erna|arna)?\b` — bestämd form och
    genitiv, men varken `-ar`, `-or` eller `-er`. Uppmätt i runda 119
    på tretton ord ur listans egen mitt: **tolv tappade sin
    pluralform.** `tallrikar`, `skålar`, `hinkar`, `dynor`, `väskor`,
    `flaggor`, `karaffer`, `servetter`, `skärbrädor` — alltså precis
    den form ett leveranslöfte skrivs i ("fyra tallrikar ingår").

    Att `"nycklar"` står listat BREDVID `"nyckel"` är fingeravtrycket:
    någon gick i fällan tidigare och lagade ETT ORD i stället för
    MÖNSTRET. Samma familj som "en grind skriven mot platsen där felet
    hittades täcker inte regeln".

    ⚠️ Stammar på `-a` och `-e` tappar sin vokal i plural (dyna →
    dynor, kudde → kuddar). Den trunkerade stammen får därför BARA
    pluraländelser — annars hade `dyna` matchat ordet `dyn`, som är
    svenska för något helt annat.
    """
    formar = [re.escape(ord_) + r"(?:s|n|en|et|na|ar|or|er|arna|orna|erna)?"]
    if ord_[-1] in "ae":
        formar.append(re.escape(ord_[:-1]) + r"(?:ar|or|er|arna|orna|erna)")
    return r"\b(?:%s)\b" % "|".join(formar)


def leveransloften(syn, ingar, nyckel=""):
    """Fäller när ett TILLBEHÖR sägs ingå utan att stå i `ingar`.

    `ingar` är produktens leveransomfattning som en lista av strängar.
    """
    fel, har = [], " ".join(ingar).lower()
    for m in LEVERANS.finditer(syn):
        if _urskuldad(syn, m.start()):
            continue
        mening = mening_kring(syn, m.start())
        lag = mening.lower()
        for ord_ in TILLBEHOR:
            if not re.search(_bojningar(ord_), lag):
                continue
            if ord_[:5] in har or any(p.startswith(ord_[:5]) for p in har.split()):
                continue
            fel.append(f"LEVERANSLÖFTE UTAN TÄCKNING: {ord_!r} sägs ingå, men "
                       f"INGAR{'[' + nyckel + ']' if nyckel else ''} är "
                       f"{list(ingar)} — …{mening.strip()[:120]}…")
    return fel


# ── GRANNSTRYKNING: sidans EGEN text är det enda som får granskas ──────────
#
# Butikens rekommendationsrad lägger ANDRA produkters namn på sidan. Ett
# grindat ord i en grannes namn är inte vårt fel, och har fällt korrekta sidor
# tre gånger nu. Kanalerna har hittats en i taget, och det är själva poängen
# med att modulen är DELAD: nästa runda ärver alla sex utan att veta om dem.
#
#   1-2. `"name":"…"` och `\"name\":\"…\"`      (runda 111, uppgift #398)
#   3.   `"slug":"…","name":"…"` i flight-payloaden (runda 115)
#   4.   grannens SLUG — en slug är text        (runda 116, uppgift #431)
#   5-6. ☠️ DEN RENDERADE DOM:EN. `<div class="pname">` och `alt="…"`, i båda
#        serialiseringarna. Uppmätt i runda 117: grannen "Träbänk 175 cm i
#        massiv furu för tre personer" stod på FYRA ställen, och inget av dem
#        var en `"name"`-nyckel — så materialgrinden fällde en korrekt
#        köksvagnssida på ordet `massiv`.
#
# ☠️ EN FRÅGA ÄR INGEN GRANNE. JSON-LD:s FAQ använder `"name"` för FRÅGAN, så
#    sidans egna frågor hamnade i grannlistan och ströks ur texten — varefter
#    grinden rapporterade att frågan SAKNADES (runda 116, uppgift #430).
#   7-8. ☠️ BUTIKENS FÖREGÅENDE/NÄSTA-NAVIGERING, `<span class="pbrowse-namn">`
#        och dess payload-tvilling. Uppmätt i runda 119, och kanalen är
#        SJÄLVFÖRVÅLLAD: raden visar grannarna INOM KATEGORIN, så den fanns
#        inte förrän rundans eget Steg 10 gav produkterna en. Live-grinden
#        var grön före kategoriskrivningen och röd efter — samma sidor, samma
#        text, 7 kB större HTML.
#
#        Klassnamnet matchas därför som ett MÖNSTER (`pname` eller något som
#        slutar på `namn`) i stället för som en uppräkning: nästa modul huset
#        lägger till kommer att heta något tredje, och en lista över kända
#        klassnamn är samma sorts fälla som en svartlista över homoglyfer.
_KLASSNAMN = r"(?:pname|[a-z-]*namn)"
_GRANNKANALER = [
    r'"name"\s*:\s*"([^"]{6,90})"',
    r'\\"name\\":\\"([^"]{6,90})\\"',
    r'<(?:div|span|a|p)[^>]*class="[^"]*\b%s\b[^"]*"[^>]*>([^<]{6,90})</' % _KLASSNAMN,
    r'\balt="([^"]{6,90})"',
    r'\\"alt\\":\\"([^"]{6,90})\\"',
    r'\\"className\\":\\"[^"]*%s[^"]*\\",\\"children\\":\\"([^"]{6,90})\\"'
    % _KLASSNAMN,
]


def grannar(html, slug, eget_namn=None):
    """Produktnamn som tillhör ANDRA sidor."""
    n = set()
    for m in _GRANNKANALER:
        n |= set(re.findall(m, html))
    n |= {namn for s_, namn in
          re.findall(r'"slug":"([a-z0-9-]+)","name":"([^"]+)"', html) if s_ != slug}
    return {x for x in n
            if len(x) > 6 and not x.rstrip().endswith("?") and x != eget_namn}


def grannslugs(html, slug):
    """Slug-strängar som tillhör ANDRA sidor — en slug är också text."""
    s = set(re.findall(r'"slug"\s*:\s*"([a-z0-9-]{6,})"', html))
    s |= set(re.findall(r'\\"slug\\":\\"([a-z0-9-]{6,})\\"', html))
    s |= set(re.findall(r"/produkt/([a-z0-9-]{6,})", html))
    return {x for x in s if x != slug}


def strak_grannar(text, html, slug, eget_namn=None):
    """Sidans text med grannarnas namn OCH slugs strukna."""
    for namn in sorted(grannar(html, slug, eget_namn), key=len, reverse=True):
        text = text.replace(namn, " ")
    for sl in grannslugs(html, slug):
        text = text.replace(sl, " ")
    return text


# ☠️ EN RENDERAD SIDAS EGNA PÅSTÅENDEN ÄR INTE HELA SIDANS TEXT. Runda 118:
#    `fcb86875` fälldes för "Hopfällbar barvagn i bambu" — sant om `820d076b`
#    och skrivet i `fcb86875`:s text som en LÄNK dit. Sidan hänvisar; den
#    påstår inte. `grind.py` delar redan på ankare av precis det skälet, men
#    på KÄLLAN; live-grinden ärvde ordlistorna utan delningen.
#
# ☠️ SIDAN BÄR SIN EGEN BRÖDTEXT TVÅ GÅNGER. Uppmätt: ordet stod på sex
#    ställen — fyra i en GRANNES namn (strukna sedan runda 117) och två i vår
#    EGEN länk, en i renderad DOM och en i RSC-payloadens `<script>`, där
#    markupen är escapad (`\u003ca href=\"…\"`). `dela_pa_ankare` känner bara
#    den första formen.
#
# ☠️ ATT AVKODA PAYLOADEN VAR DEN UPPENBARA FIXEN OCH DEN FEL. Provkörd:
#    delningen såg då båda formerna, men grannstrykningens två halvor kan inte
#    längre köras i samma ordning — och sex av åtta korrekta sidor föll på
#    grannen "Uppvärmt torkställ … hopfällbart". Payloaden droppas i stället:
#    den är en KOPIA av DOM:en, och DOM:en är det kunden läser. Samma
#    iakttagelse som uppgift #413.
SKRIPT = re.compile(r"<script\b[^>]*>.*?</script>", re.S | re.I)


def egna_meningar(html, slug, eget_namn=None, tvatta=None):
    """(sidans EGNA meningar som text, [(mål-sluggar, mening)]) ur RENDERAD HTML.

    ⚠️ DE TVÅ HALVORNA AV `strak_grannar` MÅSTE LIGGA PÅ VAR SIN SIDA OM
       DELNINGEN, och det är hela skälet till att den inte går att återanvända
       rakt av här:

       * NAMNEN stryks FÖRE `tvatta` — bildadress-mönstret matchar `\S+` och
         äter annars halva grannens namn ur ett `src`-attribut (runda 117).
       * SLUGGEN stryks EFTER delningen — den står i href:en och ÄR länkens
         mål. Stryks den före blir varje korslänk anonym, och då går den inte
         att pröva mot MÅLETS facit.

    `tvatta` är anroparens egen strykning av bildadresser, SVG-geometri och
    butikens ribbon; den körs på HTML:en efter namnstrykningen.
    """
    text = SKRIPT.sub(" ", html)
    for namn in sorted(grannar(html, slug, eget_namn), key=len, reverse=True):
        text = text.replace(namn, " ")
    egna_rader, kors = dela_pa_ankare(tvatta(text) if tvatta else text)
    egna = " ".join(egna_rader)
    for sl in grannslugs(html, slug):
        egna = egna.replace(sl, " ")
    return egna, kors


# ☠️ BUTIKENS EGEN EU-LAGER-RIBBON ÄR SANKTIONERAD. CLAUDE.md pekar ut den som
#    det ENDA stället där leveransursprunget får nämnas. En live-grind som ärver
#    källtextens `skickas från`-mönster fyrar därför på VARJE korrekt publicerad
#    sida i katalogen — uppmätt på alla åtta i runda 117. Ett larm som alltid
#    fyrar lär mottagaren att sluta läsa; det är samma regel som mot ett rött
#    synk-jobb vid varje svep.
# ⚠️ TVÅ FÖREKOMSTER, inte en. Ribbonen på produktsidan var den uppenbara;
#    den andra är SIDFOTENS navigationslänk "EU-lager & tull", som ligger på
#    varje sida butiken renderar. Att bara stryka ribbonen lämnade alltså
#    larmet kvar på alla åtta — uppmätt, inte antaget.
# ☠️ OCH TECKNET MELLAN ORDEN HAR TRE FORMER. Mönstret kände `&` (i DOM-texten)
#    och `\u0026` (i den JSON-serialiserade payloaden) men INTE `&amp;` — och
#    det är just den formen den renderade HTML:en serverar. Runda 121 mätte
#    kostnaden: sidfotslänken stod kvar i tvätten och fällde alla åtta korrekta
#    sidor med raden `Ångra köp EU-lager &amp; tull Köpvillkor`. Ett mönster som
#    täcker två av tre former ser fullständigt ut i källkoden.
EU_RIBBON = re.compile(
    r'<a[^>]*href="/eu-lager-garanti"[^>]*>.*?</a>'
    r'|Skickas från EU-lager[^<]*'
    r'|\\?"href\\?":\\?"/eu-lager-garanti\\?"[^}]*?\\?"children\\?":\\?"[^"\\\\]*'
    r'|/eu-lager-garanti'
    r'|EU-lager\s*(?:&amp;|\\u0026|&)\s*tull', re.S)


# ── ☠️ BUTIKENS CHROME OCH BILDADRESSER: EN TVÄTT, INTE EN PER RUNDA ───────
# `egna_meningar` tar anroparens tvätt som argument, och den har därför
# skrivits om i varje runda. Runda 121 mätte vad det kostar: rundans egen
# omskrivning tappade `EU_RIBBON` till förmån för två handskrivna mönster
# (som bara täckte HALVA chromet) och breddade bildadressen från
# wixstatic-specifik till `https?://\S+`. Utfallet var **12 fel på 8 korrekta
# sidor**, i två klasser som båda såg ut som produktfel.
#
# ☠️ ETT BRETT `https?://\S+` DÖDAR KORSLÄNKARNA. Tvätten körs FÖRE
#    `dela_pa_ankare`, och ankarmönstret kräver ett intakt `href="…"`. Stryks
#    adressen slutar länken vara en länk — och ankartexten, som NAMNGER
#    grannens färg med flit, faller ned bland sidans EGNA meningar. Fyra
#    färgsyskonsidor fälldes för sina egna korslänkar. `egna_meningar`:s
#    docstring varnar för exakt det här om SLUGGEN; ett adressmönster gör
#    samma sak en nivå bredare. Mönstret är därför wixstatic-SPECIFIKT, och
#    attributstrykningen träffar bara `src`/`srcset` — aldrig `href`.
#
# ☠️ OCH CHROMET HAR TVÅ `EU-lager`-RADER. `EU_RIBBON` täckte båda sedan
#    runda 117; den handskrivna ersättaren täckte bara leveransraden och
#    missade sidfotslänken `EU-lager & tull`, som ligger på varje sida
#    butiken renderar. Den fyrade på alla åtta.
#
# ⚠️ `1080w` i en srcset är en BILDBREDD, inte ett tal i vår text (#403).
BILDADRESS = re.compile(r"https?://static\.wixstatic\.com/\S+|\b\d+w\b")
# ☠️ PATH-DATA-HEURISTIKEN ÄR BORTTAGEN — den åt vår EGEN text. Runda 117–119
#    bar `\b[Mm]\s*[\d.]+[,\s][\d.]+` för att fånga rå SVG-bana (`M 12,4 …`).
#    Uppmätt 2026-09-10 på vanliga svenska meningar:
#
#      "Bredd 0,9 m 1,2 m djup."            → "Bredd 0,9 «» m djup."
#      "…tar 1,8 m 20 30 skaft."            → "…tar 1,8 «» skaft."
#
#    Ett metermått skrivet på det vanligaste sättet försvinner alltså UR
#    grinden — och då kan ingen kontroll längre se det. Det är uppgift #384:s
#    klass åt andra hållet: en strykning som DÖLJER ett fynd i stället för att
#    skapa ett. Runda 120 valde bort den; det var rätt. Kvar står bara de två
#    ENTYDIGA formerna — attributet i HTML och samma attribut i payloadens JSON.
SVG_GEOMETRI = re.compile(r'\b(?:d|points|viewBox|transform)="[^"]*"'
                          r'|"(?:d|points|viewBox|transform)":"[^"]*"')
BILDATTRIBUT = re.compile(r'\s(?:src|srcset)="[^"]*"')


def butikstvatt(html):
    """Stryker butikens chrome, bildadresser och SVG-geometri — ALDRIG href."""
    return SVG_GEOMETRI.sub(
        " ", BILDADRESS.sub(
            " ", BILDATTRIBUT.sub(" ", EU_RIBBON.sub(" ", html))))

# ── ☠️ INTERN JARGONG: `rundan`, INTE `runda` ──────────────────────────────
# Husets ord för ett poleringspass har läckt till PUBLICERAD kundtext tre
# gånger (uppgift #318: runda 68, 77 och 83). Grinden som byggdes mot det såg
# olika ut i olika rundor, och skillnaden är mätbar:
#
#   runda 115, 116   `\brundans?\b|\brunda\s+\d`     ← rätt
#   runda 117–119    `\brundan?\b`                   ← ☠️ matchar ADJEKTIVET
#   runda 120        `\brundan\b|\brunda\s+\d+`      ← rätt igen
#
# ☠️ DEN BREDA FORMEN VAR TRASIG I TRE RUNDOR UTAN ATT NÅGON MÄRKTE DET, för
#    ingen produkt i 117, 118 eller 119 var RUND. Runda 120 sålde runda pallar
#    och blev det första underlag som nådde grinden — sju förekomster, två
#    fällda sidor. En trasig grind som aldrig får ett indata som utlöser den
#    ser korrekt ut i källkoden hur länge som helst; det är samma familj som
#    `höj- och sänkbar`-mönstret, som inte kunde fyra på sin egen vanligaste
#    form.
#
# Definitionen bor HÄR sedan runda 120, av samma skäl som `SHIP_AXIS_RE` och
# `EU_TULL_CODES`: en regel som kopieras in i varje runda glider isär.
JARGONG = re.compile(r"\brundan\b|\brunda\s+\d+", re.I)


# ── ☠️ HOMOGLYFER: en VITLISTA, aldrig en svartlista ───────────────────────
# Ett kyrilliskt `а`, `е`, `о`, `с`, `р` eller ett grekiskt `ο` ser ut som sin
# latinska tvilling, renderas likadant och passerar varje ordbaserad grind.
# Runda 119:s egen ingress bar ett; det hittades av ett svep över teckenkoder,
# inte av ögat. En sådan text går inte att söka i och matchar inte kundens
# sökning.
#
# ⚠️ Listan över kända homoglyfer är oändlig. Grinden är därför en VITLISTA:
#    allt utanför latin-1 plus de skiljetecken huset faktiskt använder fälls,
#    och en ny tecken-önskan läggs till här med flit i stället för att smyga in.
TILLATNA_TECKEN = set(
    "abcdefghijklmnopqrstuvwxyzåäöéü"
    "ABCDEFGHIJKLMNOPQRSTUVWXYZÅÄÖÉÜ"
    "0123456789"
    " \t\n\r"
    ".,;:!?-–—()[]{}<>/\\\"'’”“…&%+=*#@_|~^$"
    "×Ø°"
)


def homoglyfer(text):
    """(tecken, unicode-namn, sammanhang) för varje tecken utanför vitlistan."""
    import unicodedata
    ut = []
    for i, ch in enumerate(text):
        if ch in TILLATNA_TECKEN:
            continue
        ut.append((ch, unicodedata.name(ch, "?"), text[max(0, i - 25):i + 15]))
    return ut


# ── ☠️ FÄRG PÅ EN DEL AV VARAN, inte färg var som helst ────────────────────
# Runda 89–91 skrev fel färg tre rundor i rad, och grinden som byggdes mot det
# letade färgord VAR SOM HELST i texten. Runda 120 mätte priset: den fällde
# `Fristående mot vit bakgrund` — husets vanligaste alt-textformulering, och
# en beskrivning av fotostudion snarare än av varan.
#
# Grinden tittar därför bara på färg som sitter på en DEL, i båda svenska
# ordföljderna:
#     "röd skiva"      → färg före del
#     "skivan är röd"  → del före färg
# En bakgrund, en vägg, ett golv eller en matta är ingen del och kan alltså
# inte ge falsklarm. Ett falsklarm som fyrar på korrekt text lär mottagaren
# att sluta läsa — samma regel som mot `ing[åa]r` inuti "kopplingar".
DELORD = (r"skiv\w*|ram\w*|ben\w*|sits\w*|pall\w*|stol\w*|yta|ytan|stomm\w*|"
          r"bord\w*|hyll\w*|dyn\w*|ryggstöd\w*|fotstöd\w*|set\w*|lucka|luckor|"
          r"dörr\w*|låd\w*|klädsel|tyg\w*|kudd\w*|hjul\w*|handtag\w*")


def fargfel(txt, tillatna, facit):
    """Färgord som sitter på en DEL av varan utan att vara belagt av datan."""
    ut = []
    for rx in (rf"\b([a-zåäö]+)\s+(?:{DELORD})\b",
               rf"\b(?:{DELORD})\s+(?:är|i)\s+([a-zåäö]+)\b"):
        for m in re.finditer(rx, txt, re.I):
            ordet = m.group(1).lower()
            stam = next((f for f in FARGORD
                         if ordet == f or ordet.startswith(f)), None)
            if stam and stam not in tillatna:
                ut.append(f"FÄRGORD {ordet!r} på en del av varan — uppmätt är "
                          f"{facit}")
    return ut


# ── Flikraden ──────────────────────────────────────────────────────────────
# ☠️ BUTIKENS FLIKDELARE ÄR EN ALLOWLIST PÅ FYRA STRÄNGAR, inte en rubrikläsare.
#    `components/productview.tsx` → `FLIK_TITLE_PATTERNS`. `splitFlikar` lägger
#    allt FÖRE första träffen i brödtexten och allt EFTER en träff i den fliken
#    tills nästa träff. Två följder som runda 118–120 betalade för:
#
#      1. En rubrik som inte står i listan blir INGEN flik. `Montering och
#         skötsel` gav 26 publicerade sidor där skötseltexten låg gömd inne i
#         spec-fliken och den obligatoriska tredje fliken saknades helt.
#      2. BLOCKORDNINGEN i HTML:en är därmed inte fri. Ett korslänksblock efter
#         `<h2>Tekniska specifikationer</h2>` hamnar inne i spec-fliken.
#
# ☠️ Och grinden räknar FÖREKOMSTER, inte närvaro. En beskrivning som råkat bli
#    skriven två gånger ger TVÅ `<summary>Tekniska specifikationer</summary>`,
#    för delaren öppnar en ny flik vid varje träff. Dubblettkontrollen är alltså
#    gratis i samma hämtning — och den behövdes: runda 119:s `5d1696db` fick sin
#    text dubblerad i avskrivningen till PATCH-kroppen.
_SUMMARY = re.compile(r"<summary[^>]*>\s*(.*?)\s*</summary>", re.S)
FLIKAR_SOM_KRAVS = ("Tekniska specifikationer", "Användning och skötsel",
                    "Vanliga frågor")


def flikrad(html):
    """Flikrubrikerna sidan FAKTISKT renderar, i ordning."""
    return [re.sub(r"<[^>]+>", "", m).strip() for m in _SUMMARY.findall(html)]


def flikfel(html, kravs=FLIKAR_SOM_KRAVS):
    """Fel i flikraden: saknad flik, dubblerad flik, eller en död rubrik kvar.

    ⚠️ Läs ett rött utfall mot WIX innan du tror det om sidan. `hamta_isr`:s
       paus räcker inte alltid direkt efter en skrivning — uppmätt 2026-09-10
       på `ad390a36`, som föll som SAKNAS medan Wix bar rätt text och samma URL
       svarade korrekt 25 sekunder senare.
    """
    flikar = flikrad(html)
    fel = []
    for f in kravs:
        n = flikar.count(f)
        if n == 0:
            fel.append(f"FLIKEN {f!r} är ingen <summary> — sidan har {flikar}")
        elif n > 1:
            fel.append(f"FLIKEN {f!r} förekommer {n} gånger — dubblerad text?")
    if "Montering och skötsel" in html:
        fel.append("DÖD RUBRIK: 'Montering och skötsel' matchar ingen flik")
    return fel


# ── Självtest ──────────────────────────────────────────────────────────────
# ☠️ `grindar.py` hade inget självtest alls fram till runda 120, trots att den
#    är den fil ALLA rundor delar. Ett fel här slår mot varje kommande runda
#    samtidigt, och de tre nyaste reglerna är alla skrivna EFTER ett falsklarm.
def _sjalvtest():
    fall = [
        ("flik: alla tre finns", lambda: bool(flikfel(
            "<summary>Tekniska specifikationer</summary>"
            "<summary>Användning och skötsel</summary>"
            "<summary>Vanliga frågor</summary>")), False),
        ("flik: död rubrik fälls", lambda: bool(flikfel(
            "<summary>Tekniska specifikationer</summary>"
            "<h2>Montering och skötsel</h2>"
            "<summary>Vanliga frågor</summary>")), True),
        ("flik: DUBBLERAD text fälls", lambda: bool(flikfel(
            "<summary>Tekniska specifikationer</summary>"
            "<summary>Användning och skötsel</summary>"
            "<summary>Vanliga frågor</summary>"
            "<summary>Tekniska specifikationer</summary>"
            "<summary>Användning och skötsel</summary>"
            "<summary>Vanliga frågor</summary>")), True),
        ("flik: butikens egen fjärde flik stör inte", lambda: bool(flikfel(
            "<summary>Tekniska specifikationer</summary>"
            "<summary>Användning och skötsel</summary>"
            "<summary>Vanliga frågor</summary>"
            "<summary>Kontakta oss</summary>")), False),
        ("jargong: bestämd form", lambda: JARGONG.search("Den här rundan blev bra"), True),
        ("jargong: numret", lambda: JARGONG.search("Runda 120 polerades"), True),
        ("jargong: ADJEKTIVET går fritt", lambda: JARGONG.search("två runda pallar"), False),
        ("jargong: rundade hörn går fritt", lambda: JARGONG.search("rundade hörn"), False),
        ("homoglyf: kyrilliskt a", lambda: homoglyfer("Bordet är brа"), True),
        ("homoglyf: grekiskt o", lambda: homoglyfer("Bordet är stοrt"), True),
        ("homoglyf: ren svenska", lambda: homoglyfer("Skivan är grå, Ø36 cm, 90,5 × 40"), False),
        ("färg före del", lambda: fargfel("En röd skiva", {"grå"}, "grå"), True),
        ("färg efter del", lambda: fargfel("Skivan är röd", {"grå"}, "grå"), True),
        ("belagd färg går fritt", lambda: fargfel("En grå skiva", {"grå"}, "grå"), False),
        ("SCENEN går fritt", lambda: fargfel("mot vit bakgrund", {"grå"}, "grå"), False),
        ("väggen går fritt", lambda: fargfel("mot en vit vägg i köket", {"grå"}, "grå"), False),
        # ☠️ Svepet mot tvillingar måste själv gå att pröva — dess första
        #    utkast fällde varje ALIAS och hittade noll äkta kopior.
        ("svep: alias går fritt",
         lambda: definierar_om("TILLATNA_TECKEN = G.TILLATNA_TECKEN\n"), False),
        ("svep: alias utan mellanslag går fritt",
         lambda: definierar_om("DELORD=G.DELORD\n"), False),
        ("svep: egen konstant fälls",
         lambda: definierar_om('DELORD = (r"skiv\\w*")\n'), True),
        ("svep: egen mängd fälls",
         lambda: definierar_om('TILLATNA_TECKEN = set("abc")\n'), True),
        ("svep: egen regex fälls",
         lambda: definierar_om('JARGONG = re.compile(r"x")\n'), True),
        ("svep: egen funktion fälls",
         lambda: definierar_om("def homoglyfer(text):\n    return []\n"), True),
        ("svep: funktionsalias går fritt",
         lambda: definierar_om("homoglyfer = G.homoglyfer\n"), False),
        ("svep: indragen definition är inte en modulnivå-definition",
         lambda: definierar_om("    DELORD = 1\n"), False),
        # ── butikstvatt: fallen är runda 121:s tolv fällda korrekta sidor ──
        # ☠️ Tvätten går inte att pröva mot en levande sida — dess fel SER UT
        #    som produktfel. Den måste därför ha egna strängfall.
        ("tvatt: href ÖVERLEVER — korslänken får inte bli anonym", lambda:
         'href="https://www.fyndplats.se/produkt/x-bla"' not in butikstvatt(
             '<a href="https://www.fyndplats.se/produkt/x-bla">Samma i blått</a>'),
         False),
        ("tvatt: srcset och src stryks", lambda: "wixstatic" in butikstvatt(
            '<img srcset="https://static.wixstatic.com/a.jpg 1080w" '
            'src="https://static.wixstatic.com/a.jpg">'), False),
        ("tvatt: bildbredden 1080w räknas inte som vårt tal", lambda:
         "1080w" in butikstvatt('<img srcset="https://x/a.jpg 1080w">'), False),
        ("tvatt: chromets leveransrad stryks", lambda: "EU-lager" in butikstvatt(
            "Skickas från EU-lager – ingen importtull."), False),
        ("tvatt: chromets SIDFOTSLÄNK stryks — &amp;-formen", lambda:
         "EU-lager" in butikstvatt("Ångra köp EU-lager &amp; tull Köpvillkor"),
         False),
        ("tvatt: sidfotslänken i ren &-form stryks", lambda:
         "EU-lager" in butikstvatt("Ångra köp EU-lager & tull Köpvillkor"),
         False),
        ("tvatt: sidfotslänken i JSON-payloaden stryks", lambda:
         "EU-lager" in butikstvatt(r"x EU-lager \u0026 tull y"), False),
        ("tvatt: vår EGEN text om EU-lager står kvar (ingen övertvätt)", lambda:
         "EU-lagret" in butikstvatt("Varan ligger i EU-lagret."), True),
        ("tvatt: ett METERMÅTT överlever — path-heuristiken åt det förr",
         lambda: "1,2" not in butikstvatt("Bredd 0,9 m 1,2 m djup."), False),
        ("tvatt: SVG-attributet stryks (HTML-formen)", lambda:
         "12,4" in butikstvatt('<path d="M 12,4 L 30,8"/>'), False),
        ("tvatt: SVG-attributet stryks (payloadens JSON-form)", lambda:
         "12,4" in butikstvatt('{"d":"M 12,4 L 30,8"}'), False),
        ("tvatt: id=\"…\" är INTE ett SVG-attribut", lambda:
         "abc" not in butikstvatt('<div id="abc">Text</div>'), False),
    ]
    fel = []
    for namn, kor, ska_falla in fall:
        # ☠️ `bool()` på BÅDA sidor. Ett fall som skrev `[]` i stället för
        #    `False` gav `False != []` → fel, med meddelandet "fick ingen
        #    träff, väntade ingen träff". Ett larm som beskriver två identiska
        #    utfall går inte att handla på — samma familj som ett falsklarm
        #    som alltid fyrar.
        traff, ska_falla = bool(kor()), bool(ska_falla)
        if traff != ska_falla:
            fel.append(f"{namn}: fick {'träff' if traff else 'ingen träff'}, "
                       f"väntade {'träff' if ska_falla else 'ingen träff'}")
    return fel, len(fall)


# ── ☠️ GRINDEN MOT TVILLINGAR ──────────────────────────────────────────────
# Husets vanligaste bugg är att en kopierad regel glider isär, och den här
# filens egen docstring säger det sedan runda 65. Det hindrade ändå inte att
# jargongmönstret kopierades in i sex rundors `grind.py` och blev fel i tre.
#
# Ett källkodstest är det som faktiskt biter — samma mekanism som
# `store-access-audit.test.ts` och `backend.test.ts` i motorn: leta efter
# DEFINITIONEN utanför den fil som äger den.
#
# ⚠️ BARA RUNDA 120 OCH FRAMÅT. Runda 115–119 är klara och publicerade; deras
#    filer lämnas orörda av samma skäl som `runda-64/lint.py` gjorde 2026.
#    Att fälla på dem hade gett ett larm som fyrar varje körning utan att
#    någon tänker laga det — och ett sådant larm lär mottagaren att sluta läsa.
ADE_HAR = ["JARGONG", "TILLATNA_TECKEN", "DELORD",
           "EU_RIBBON", "BILDADRESS", "SVG_GEOMETRI"]
# `_tvatta` står med under sitt gamla namn: runda 120 och 121 döpte den
# så, och det är just den funktionen som gled isär.
ADE_FUNKTIONER = ["homoglyfer", "fargfel", "butikstvatt", "_tvatta"]
FORSTA_GRINDADE_RUNDAN = 120


def definierar_om(kod):
    """Namn som källkoden DEFINIERAR i stället för att importera.

    ☠️ FÖRSTA UTKASTET SLÄPPTE IGENOM NOLL OCH FÄLLDE ALIASEN. Mönstret var
       `^NAMN\s*=\s*(?!G\.)` — och `\s*` backtrackar till noll tecken, så
       lookaheaden hamnade på MELLANSLAGET i stället för på `G`. `NAMN = G.NAMN`
       lästes därmed som en egen definition. Negationen måste sitta EFTER
       likhetstecknet och själv äta blanktecknen: `=(?!\s*G\.)`.

       Det är samma familj som `höj- och sänkbar`-mönstret och den breda
       jargongregexen: en grind vars egen form aldrig prövats.
    """
    ut = []
    for namn in ADE_HAR:
        # `X = G.X` är ett ALIAS och helt i sin ordning; `X = re.compile(`
        # eller `X = set(` är en egen definition.
        if re.search(rf"^{namn}\s*=(?!\s*G\.)", kod, re.M):
            ut.append(namn)
    for namn in ADE_FUNKTIONER:
        if re.search(rf"^def {namn}\s*\(", kod, re.M):
            ut.append(namn + "()")
    return ut


def tvillingsvep(rot=None):
    """Rundor som DEFINIERAR om något `grindar.py` äger."""
    import glob
    import os
    rot = rot or os.path.dirname(os.path.abspath(__file__))
    fel = []
    for fil in sorted(glob.glob(os.path.join(rot, "runda-*", "*.py"))):
        rnr = os.path.basename(os.path.dirname(fil)).replace("runda-", "")
        if not rnr.isdigit() or int(rnr) < FORSTA_GRINDADE_RUNDAN:
            continue
        for namn in definierar_om(open(fil, encoding="utf-8").read()):
            fel.append(f"{os.path.relpath(fil, rot)}: definierar om {namn} "
                       f"— den ägs av grindar.py")
    return fel


if __name__ == "__main__":
    import sys
    fel, antal = _sjalvtest()
    print(f"grindar._sjalvtest(): {antal} fall, {len(fel)} fel")
    for x in fel:
        print("  ☠️", x)
    tv = tvillingsvep()
    print(f"tvillingsvep(): {len(tv)} egna kopior i runda "
          f"{FORSTA_GRINDADE_RUNDAN}+")
    for x in tv:
        print("  ☠️", x)
    sys.exit(1 if (fel or tv) else 0)
