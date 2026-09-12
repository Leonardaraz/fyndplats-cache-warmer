#!/usr/bin/env python3
"""Delad ordlista och hjälpare för poleringens filgrindar.

☠️ VARFÖR DEN FINNS. Grindarna kopierades in i varje rundas katalog, och
kopiorna drev isär. Uppmätt 2026-09-06: **19 kopior av fyra grindar i tre
olika versioner**, och det som skilde var inte strukturen utan ORDLISTAN:

    runda A/F1   …|Kinder|Sofa|Jahre|Maße|robust|niedlich|gemütlich|…
    runda F2     …|Kratzbaum|Katzen|Plüsch|…
    runda G1/G2  …|Stuhl|Bezug|Kufen|Polsterung|Schaukel|kuschelig|flauschig|…

Varje runda ersatte föregående rundas tyska ord med sina egna. UNIONEN har
alltså aldrig körts. Runda H1 (kattlådor) gatades med gungstolarnas vokabulär
— `Katzen`, `Deckel`, `Schaufel` och `Edelstahl` kontrollerades aldrig.

Samma klass som SHIP_AXIS_RE och EU_TULL_CODES: en tvilling glider isär, och
den som glider tystast är den som ser ut att fungera. Grindarna bor därför
HÄR, en gång, och rundorna anropar dem — precis som livegrind.py redan gör.

☠️ ORDEN FÅR BARA LÄGGAS TILL, ALDRIG BYTAS UT. Att ta bort ett ord för att
"det gäller inte den här rundan" är exakt hur listorna drev isär.
"""
import os, re

MARKEN = r"HOMCOM|Outsunny|PawHut|Aiyaplay|Aosom|SportNow|Vinsetto|Kleankin|Zonekiz|Durhand"
ARTNR = r"\b\d{3}-\d{3}[A-Z0-9]*\b|\b\d{2}[A-Z]-\d{3}"
LAND = (r"\b(Tyskland|Deutschland|tysk[at]?|Spanien|spansk|Polen|polsk|Kina|kines"
        r"|EU-lager|skickas fr[åa]n|lagerland)\b")
LEV = r"\b([Ll]everant[öo]r\w*|[Tt]illverkaren anger|vi vet inte|enligt uppgift)\b"
HOMO = r"[Ѐ-ӿͰ-Ͽ]"
NORM = r"\bEN\s?\d{3,5}\b"

# UNIONEN av alla rundors tyska ord, plus de som källtexterna faktiskt bär.
# ⚠️ Ord som ÄR svenska med versal i meningsstart är medvetet uteslutna:
# Metall, Filter, Boden och Hund ger falsklarm på korrekt svenska.
TYSKA_ORD = [
    # bindeord och verb — funnits i alla versioner
    "und", "mit", "für", "der", "die", "das", "ist", "sind",
    # runda A/F1
    "Kinder", "Sessel", "Sofa", "Jahre", "Maße", "Farbe", "Gewicht",
    "Lieferumfang", "Montage", "Rückenlehne", "weich", "robust", "niedlich",
    "gemütlich",
    # runda F2
    "Kratzbaum", "Katzen", "Plüsch",
    # runda G1/G2
    "Stuhl", "Bezug", "Kufen", "Polsterung", "Schaukel", "kuschelig", "flauschig",
    # runda H1 — ord kattlådornas källtexter faktiskt bär
    "Katzenklo", "Katzentoilette", "Katzenhaus", "Streu", "Streuschaufel",
    "Schaufel", "Deckel", "Klappdeckel", "Wanne", "Schrank", "Trennwand",
    "Regal", "Pfosten", "Griff", "Tür", "Kunststoff", "Edelstahl", "Spanplatte",
    "Holz", "Stahl", "Innenraum", "Abmessungen", "Gesamtmaße", "Belastung",
    "Bedienungsanleitung", "Handbuch", "Anleitung", "Höhe", "Breite", "Tiefe",
    "Grau", "Weiß", "Schwarz", "Braun", "Grün", "Hellgrau", "Dunkelgrau",
    # Fordon (rundorna H2–H3). Ord som stavas LIKA på svenska är medvetet
    # utelämnade — "Musik", "Material", "Metall", "Motor" kan inte skilja
    # språken åt och hade fällt varje polerad sida i katalogen.
    "Rutschauto", "Rutscher", "Rutschfahrzeug", "Schiebestange", "Hupe",
    "Verdeck", "Sonnendach", "Sicherheitsumrandung", "Sicherheitszaun",
    "Lenker", "Lenkerhöhe", "Lenkrad", "Belastbarkeit", "Stauraum",
    "Räder", "Reifen", "Bremse", "Sitzfläche", "Kinderauto", "Elektroauto",
    "Motorrad", "Fernbedienung", "Akku", "Ladegerät", "Geschwindigkeit",
    "Federung", "Sicherheitsgurt", "Scheinwerfer", "Spielzeug",
    "Kleinkinder", "Monate", "Batterien", "Pedale", "Pedalen",
]
# ☠️ GRÄNSKLASSEN MÅSTE TÄCKA VERSALER OCKSÅ. Fram till 2026-09-07 stod här
# `(?<![a-zåäöéü])`, alltså bara gemener — och då fyrar varje SVENSKT ord med
# versal som råkar bära ett tyskt bindeord inuti sig: "Rund bädd" träffade
# `und`, för R:et blockerade inte. Felet fanns sedan runda A och överlevde
# hela konsolideringen, eftersom det ser ut som en gräns.
GRANS = r"A-Za-zÅÄÖÉÜåäöéü"
TYSKA = r"(?<![" + GRANS + r"])(" + "|".join(TYSKA_ORD) + r")(?![" + GRANS + r"])"

# UNIONEN av stavfel och danska/norska former. `gungstol(?=en\b)(?!)` från
# runda G är BORTTAGET: `(?!)` misslyckas alltid, så mönstret var dött.
# ☠️ TVÅ MÖNSTER ÄR BORTTAGNA 2026-09-07, OCH BORTTAGNINGEN ÄR INTE SAMMA SAK
# SOM DEN ORDLISTEDRIFT SOM DOKUMENTERAS OVAN. Regeln "orden får bara läggas
# till" finns för att hindra att någon stryker ett ord med motiveringen "det
# gäller inte den här rundan". De här två ströks för att de MÄTT ALDRIG KAN
# TRÄFFA NÅGOT ÄKTA — de fyrar bara på korrekt svenska.
#
# Uppmätt över samtliga 112 källfiler i 16 rundor: åtta träffar totalt, noll
# äkta.
#
#   storlek(?!en|ar)   4 träffar, alla på "hålor i olika storlek" — obestämd
#                      singular, som är korrekt svenska. Mönstret kom från
#                      runda A och satt i en grupp som annars ENBART är
#                      svenska ord utan diakriter (fatolj, hojd, langd,
#                      sakerhet). "storlek" har inga diakriter att tappa och
#                      hörde aldrig hemma där. Ingen stavning kan göra
#                      mönstret sant — det är en grammatikbedömning.
#   gul[vt]            3 träffar, alla på "i grönt och gult". Danska `gulv`
#                      (golv) är den äkta falska vännen och står kvar; `gult`
#                      betyder gul i BÅDA språken och kan aldrig avslöja
#                      något. Kom från runda G:s danska/norska lista.
#
# Ett falsklarm som alltid fyrar är lika illa som ett fel ingen ser — huset
# har skrivit ned det om token-förnyelsen, om synk-jobbet och om `regelGäller`.
# Lägg inte tillbaka dem. Lägg gärna till nya ord.
STAV_ORD = [
    "dögnsvarv", "engangsjobb", "ihopsattningen", "for hard", "hallbar",
    "fatolj", "hojd", "langd", "sakerhet",
    "rundt", "hvid", "sort", "gulv", "blød", "hjørne", "stof", "læder",
    # ☠️ Måste KONSUMERA hela ordet — STAV lindas i \b(...)\b, så ett
    # lookahead ger ingen ordgräns efter sig och mönstret kan aldrig träffa.
    # Samma klass som runda G:s döda `gungstol(?=en\b)(?!)`.
    "[Kk]ippskydd", "[Kk]ippsäker", "[Kk]ippsäkert",
    "siddehøjde", "ryglæn", r"fod(?=en\b)",
]
STAV = r"\b(" + "|".join(STAV_ORD) + r")\b"

# ☠️ SUPERLATIV OM VÅRT EGET SORTIMENT — grinden som saknades till 2026-09-08.
# Runda K11 skrev "ställs mellan 45 och 53 cm — lägst i vårt massagesortiment"
# om f809b33e. Det var FALSKT: b78d4cc6 i samma runda går ner till 44 cm.
#
# ⚠️ Ingen befintlig grind kunde se det, och det är hela poängen. Talen stod i
# källan (siffergrinden ren), svenskan var korrekt (mönstergrindarna rena), och
# påståendet handlade om ANDRA produkter — alltså om data som inte finns i den
# här filen. Det hittades bara för att siffergrinden råkat fälla tre påhittade
# jämförelsetal och jag därför sökte superlativen i ALLA åtta filerna.
#
# Grinden fäller BARA när ett superlativ står i samma mening som ett omfång som
# syftar på vårt eget sortiment. "Konstläder är den klädsel som kräver minst av
# dig" är ett påstående om materialet och rörs inte; "lägst i vårt sortiment"
# och "den enda i serien" är rankningar av katalogen och måste kvitteras.
#
# ☠️ Kvitteringen är en FIL, inte en vana: `superlativ.txt` i rundans katalog,
# en rad per godkänt påstående som "<kort> <valfri anteckning>". Samma form som
# `rad-tal.txt`. Utan raden faller grinden. Att bara varna hade gjort den till
# en påminnelse, och huset har redan skrivit ned att en checklista som bara
# hjälper den som kommer ihåg punkten inte är en spärr.
SUPERLATIV_ORD = [
    "lägst", "högst", "störst", "minst", "bredast", "smalast", "djupast",
    "grundast", "tyngst", "lättast", "billigast", "dyrast", "kraftigast",
    "tystast", "snabbast", "enda", "ende", "enastående", "oöverträffad",
    # Tillagda i K13 — ORD FÅR BARA LÄGGAS TILL, aldrig bytas ut (#154).
    "brantast", "brantaste", "mjukast", "hårdast", "varmast", "kallast",
    "starkast", "svagast", "längst", "kortast", "tjockast", "tunnast",
    "rymligast", "stabilast", "främst", "bäst", "sämst",
]
OMFANG_ORD = [
    "vårt sortiment", "vår katalog", "vårt utbud", "i serien", "i den här serien",
    "av våra", "bland våra", "hos oss", "vi säljer", "vi har", "vårt massagesortiment",
    "i vårt", "i vår", "på sidan", "andra stolarna", "övriga stolarna",
]
SUPERLATIV = r"(?<![A-Za-zÅÄÖÉÜåäöéü])(" + "|".join(SUPERLATIV_ORD) + r")(?![A-Za-zÅÄÖÉÜåäöéü])"
OMFANG = r"(" + "|".join(OMFANG_ORD) + r")"


def meningar(text):
    """Grov meningsdelning. Punkt/utrops/frågetecken följt av blanksteg och
    versal, plus radbrytning — nog för att avgöra om två träffar står i SAMMA
    påstående. Ett tankstreck delar INTE: "45 cm — lägst i vårt sortiment" är
    en mening, och det var precis den formen felet hade."""
    return [m for m in re.split(r"(?<=[.!?])\s+(?=[A-ZÅÄÖ])|\n", text) if m.strip()]


GRINDAR = [("HUSMÄRKE", MARKEN), ("ARTIKELNUMMER", ARTNR), ("FRAKTLAND", LAND),
           ("LEVERANTÖR", LEV), ("TYSK REST", TYSKA), ("STAVNING", STAV),
           ("HOMOGLYF", HOMO), ("EN-NORM UTAN KÄLLA", NORM)]

FLIKAR = ("Tekniska specifikationer", "Användning och skötsel", "Vanliga frågor")

# ☠️ EN LISTA, INTE TVÅ. Teckenlistan fanns i BÅDE gate-seo.py och
# livegrind.py och hade redan glidit isär: livegrind bar "§", gate-seo inte,
# och ingen av dem bar "²" — som varenda brödtext i huset använder om ytor.
# Följden var att en helt korrekt SEO-rad med "24 m²" fälldes medan samma
# sträng i brödtexten passerade. Samma klass som SHIP_AXIS_RE och
# EU_TULL_CODES: en tvilling glider isär, och den som glider tystast är den
# som ser ut att fungera.
#
# Syftet är att fånga HOMOGLYFER (kyrilliskt/grekiskt) — inte att förbjuda
# typografi vi själva skriver. Lägg bara till tecken som faktiskt används.
# ☠️ Ø ÄR MEDVETET BARA VERSAL. Diametertecknet i "Ø41 cm" är U+00D8, alltid
# versalt — medan danskans egna ord bär det GEMENA ø ("hjørne", "blød"), som
# står i DANSKA nedan. Att släppa in båda hade tagit bort den enda mekaniska
# skillnaden mellan ett mått och en dansk stavning, och det var just en dansk
# stavning ("rundt bord") som en gång tog sig hela vägen till Wix.
#
# Tecknet lades till 2026-09-07 för att grindarna var OENSE om det: gate.py
# släppte igenom "Ø46 cm" i brödtexten (livegrind rapporterar bara kyrilliskt
# och grekiskt), medan gate-seo.py fällde exakt samma sträng i seo.tsv. Ett
# tecken vi redan publicerar på flera sidor ska stå i listan — inte strykas ur
# texten för att en av två grindar inte kände igen det.
TILLATNA_TECKEN = "ÅÄÖåäöÉéÜü×—–…°§²Ø"


# ☠️ TUSENTALSAVSKILJAREN ÄR EN FORMATERING, INTE ETT NYTT TAL. Källan skriver
# tyskt "30.000 Stunden" och den svenska texten skriver "30 000 timmar" — samma
# uppgift, men den naiva extraktionen gav {"30,000"} mot {"30", "000"} och fällde
# en KORREKT text. Samma fälla på "1 100 lm" mot källans "1100 lm". Grinden ska
# fånga påhittade tal, inte svensk sifferformatering.
#
# ⚠️ Sammanslagningen är SNÄV med flit: bara ett mellanslag (eller hårt
# mellanslag, eller punkt) följt av EXAKT tre siffror som inte fortsätter i en
# fjärde. "126 × 53" rörs inte (× emellan), "2 kg och 170 cm" rörs inte (170 är
# tre siffror men föregås av ett ord). Ett för brett mönster hade slagit ihop två
# oberoende mått till ett tal som inte finns i någon källa — och då fäller
# grinden på fel ställe i stället för att inte fälla alls.
_TUSENTAL = re.compile(r"(?<=\d)[ \u00a0.](\d{3})(?!\d)")


def tal(text):
    """Alla tal, normaliserade så 44,5 och 44.5 — och 30 000 och 30.000 — jämförs lika."""
    text = _TUSENTAL.sub(r"\1", text)
    return {t.replace(".", ",").rstrip(",") for t in re.findall(r"\d+(?:[.,]\d+)?", text)}


# ☠️ KÄLLAN SKRIVER IBLAND TALET MED BOKSTÄVER. Uppmätt i runda K14 på
# 5531de28: tyskan säger "Enthält zwei Zierkissen" och specen ger
# "Zierkissengröße: 38L x 32B x 15T cm" — antalet finns alltså i källan, men
# som ORD. Den svenska specraden "Prydnadskuddar: 2 st" fälldes därför som
# [SIFFRA UTAN KÄLLA] trots att påståendet är ordagrant belagt.
#
# Utvidgningen gäller BARA facit-sidan, aldrig textsidan. Räknades ett svenskt
# "två" i brödtexten som siffran 2 skulle grinden i stället KRÄVA täckning för
# varje utskrivet räkneord i prosan — alltså bli strängare på fel ställe och
# fyra på varje "två av sittdynorna". Riktningen spelar roll: här är talet
# bevisligen leverantörens eget.
#
# `ein`/`eine`/`eins` är MED FLIT utelämnade: de är obestämda artiklar och
# står i nästan varje tysk mening. Att låta dem bidra med "1" hade gjort
# siffran 1 fri över hela katalogen.
ORDTAL_DE = {
    "zwei": "2", "drei": "3", "vier": "4", "fünf": "5", "sechs": "6",
    "sieben": "7", "acht": "8", "neun": "9", "zehn": "10", "elf": "11",
    "zwölf": "12",
}


# ☠️ OCH TEXTSIDAN SKRIVER OCKSÅ IBLAND TALET MED BOKSTÄVER (#241).
# `tal()` matchar `\d+`, så varje påstående skrivet ut i ord passerar
# siffergrinden utan att jämföras med källan. Uppmätt i runda K14: 166fdb52
# säger "delad i TVÅ dynor" sju gånger i löptexten och fälldes först när samma
# uppgift också stod som siffra i spec-tabellen. Hade skribenten utelämnat
# specraden vore hela påståendet ogrindat. d2f7876e:s "FEM lösa kuddar"
# kontrollerades aldrig alls.
#
# ⚠️ DEN HÄR LISTAN FÅR INTE ANVÄNDAS SOM EN HÅRD GRIND — falsklarmsfrekvensen
# är mätt. Över K14:s sju produkter ger ett naivt "utskrivet räkneord vars
# siffra saknas i källan" elva träffar, varav två äkta fotohärledda påståenden,
# en legitim härledning ("två hårdheter" = källans 35D och 30D), två ren prosa
# ("åtta ben i stället för FYRA eller SEX") och sex upprepningar. ~40 % falskt
# på distinkta instanser. Huset har skrivit ned tre gånger att ett falsklarm
# som alltid fyrar är lika illa som ett fel ingen ser. Den används därför till
# en VARNING i gate.py, aldrig till ett fynd.
#
# `en`/`ett` är uteslutna av samma skäl som tyskans `ein`: de är obestämda
# artiklar och står i nästan varje mening.
ORDTAL_SV = {
    "två": "2", "tre": "3", "fyra": "4", "fem": "5", "sex": "6",
    "sju": "7", "åtta": "8", "nio": "9", "tio": "10", "elva": "11",
    "tolv": "12",
}


def ordtal_i_text(text):
    """[(ord, siffra, position)] för varje utskrivet svenskt räkneord i texten.

    Returnerar ALLA förekomster, inte en mängd — anroparen vill kunna visa var
    i texten påståendet står.
    """
    ut = []
    for ord_, siffra in ORDTAL_SV.items():
        for m in re.finditer(r"\b" + ord_ + r"\b", text, re.IGNORECASE):
            ut.append((m.group(0), siffra, m.start()))
    return sorted(ut, key=lambda x: x[2])


def tal_ur_kalla(text):

    """Talen i en KÄLLTEXT — siffror plus tyska räkneord skrivna med bokstäver.

    Används bara av `las_facit`. Textsidan använder `tal()` oförändrad.
    """
    ut = tal(text)
    for ord_, siffra in ORDTAL_DE.items():
        if re.search(r"\b" + ord_ + r"\b", text, re.IGNORECASE):
            ut.add(siffra)
    return ut



# ☠️ DEN HÄR BREDDNINGEN FÅR ALDRIG MATA SIFFERGRINDEN (#241).
# `tal_ur_kalla` avgör vad som är ett FYND. Varje tal den lägger till gör den
# HÅRDA grinden mer tillåtande, alltså är dess konservatism poängen: den
# matchar bara fristående räkneord (`\bdrei\b`).
#
# Men källan skriver också talet som FÖRLED i en sammansättning, och då står
# uppgiften där utan att bryggan ser den. Uppmätt 2026-09-12 över alla rundors
# källtexter — de enda två formerna som finns är korrekta:
#
#     Dreistufiges Dimmen (10 %, 50 %, 100 %)   → 79411b09 "dimmas i tre steg"
#     Dreistufige Regale                        → d2dfd1fa "tre hyllplan"
#     Fünfstöckig                               → (ingen text byggd på den än)
#
# Båda påståendena är alltså ORDAGRANNA översättningar av källan, och varningen
# flaggade dem ändå. Det är precis det falsklarm huset har skrivit ned tre
# gånger att man inte får ha.
#
# ⚠️ SKÄLET TILL ATT DEN LIGGER SEPARAT, och inte som en breddning av
# `tal_ur_kalla`: tyskan har ord som BÖRJAR på ett räkneord utan att betyda
# det — `Achtung`, `achten` (8), `Zweig` (2), `Elfenbein` (11), `Viertel` (4),
# `dreißig` (3 → men betyder 30). Ingen av dem finns i dagens källor, men en
# korpusmätning mäter dagens korpus. Låg breddningen i `tal_ur_kalla` skulle
# ett framtida "Achten Sie darauf" lägga en 8 i facit och släppa igenom ett
# OSOURCAT 8 genom den hårda grinden — tyst. Här kan den bara TYSTA en
# varning, och en varning för lite är ofarlig.
def tal_ur_kalla_brett(text):
    """Tal källan nämner, ÄVEN inne i sammansättningar. BARA för varningen."""
    ut = tal_ur_kalla(text)
    for ord_, siffra in ORDTAL_DE.items():
        if re.search(r"\b" + ord_ + r"\w", text, re.IGNORECASE):
            ut.add(siffra)
    return ut


def las_kalltext(katalog="."):
    """Rundans RÅA källtexter {kort: text} — bara när facit är hela källtexten.

    `las_facit` returnerar en sifferlista, och den räcker för siffergrinden.
    Ordtalsvarningen behöver TEXTEN: den ska kunna fråga om källan nämner talet
    med bokstäver. Returnerar None när rundan bara har `kallor-tal.json`, som är
    härledd och därför inte kan svara på den frågan.
    """
    import json as _json
    if os.path.exists(os.path.join(katalog, "kallor-tal.json")):
        return None
    sokvag = os.path.join(katalog, "kallor.json")
    if not os.path.exists(sokvag):
        return None
    ra = _json.load(open(sokvag, encoding="utf-8"))
    return {k: (v if isinstance(v, str) else _json.dumps(v, ensure_ascii=False))
            for k, v in ra.items()}

def las_facit(katalog="."):
    """Rundans facit som {kort: [tal]}, oavsett vilket av de två formaten som finns.

    ☠️ DEN BOR HÄR FÖR ATT GRINDARNA VAR OENSE. gate.py läste båda formaten;
    gate-alt.py läste bara `kallor-tal.json` och KRASCHADE på en runda med
    `kallor.json` — alltså föll alt-grinden bort helt på just de rundor där
    facit är hela källtexten. En grind som kraschar är en grind man kör förbi.

    Returnerar (facit, filnamn) eller (None, None) när ingetdera finns; det är
    anroparens sak att avgöra om det ska fälla eller bara hoppa över
    siffergrinden.
    """
    import json as _json
    for namn in ("kallor-tal.json", "kallor.json"):
        sokvag = os.path.join(katalog, namn)
        if os.path.exists(sokvag):
            ra = _json.load(open(sokvag, encoding="utf-8"))
            return {k: (v if isinstance(v, list) else sorted(tal_ur_kalla(kropp(v))))
                    for k, v in ra.items()}, namn
    return None, None


def kropp(html):
    """Brödtext utan taggar. ☠️ href MÅSTE bort före siffergrinden — en slug
    bär produktens mått ("baddfatolj-190-cm"), och de siffrorna är en ADRESS,
    inte ett påstående om varan."""
    html = re.sub(r'href="[^"]*"', 'href=""', html)
    return re.sub(r"<[^>]+>", " ", html)


def normalisera(s):
    """Wix normaliserar två saker: blanksteg mellan blockelement strippas och
    target="_self" läggs till på varje <a href>. En rå strängjämförelse ger
    därför "alla skiljer" på en felfri skrivning."""
    s = s.replace(' target="_self"', "")
    return re.sub(r">\s+<", "><", s).strip()


def fnv(s):
    """FNV-1a 64-bitars. Samma funktion går att skriva i sandlådans JS utan
    require/crypto, så hashen kan räknas på BÅDA sidor och jämföras."""
    h = 0xcbf29ce484222325
    for c in s.encode("utf-8"):
        h ^= c
        h = (h * 0x100000001b3) & 0xFFFFFFFFFFFFFFFF
    return f"{h:016x}"
