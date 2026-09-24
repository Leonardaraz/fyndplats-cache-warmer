#!/usr/bin/env python3
"""Bygger axelfacit.json MEKANISKT ur rundans kallor.json.

☠️ VARFÖR DEN FINNS SOM SKRIPT. #225 säger att facit aldrig får skrivas för
hand eller av en modell. Fram till runda M2 byggde varje runda sin egen
engångssnutt, och två av dem byggde den fel på var sitt sätt:

  * M1 och M2 skrev talen som STRÄNGAR ("170"). gate-axel.py slår upp
    heltal, så uppslaget gav alltid None och grinden KUNDE INTE FÄLLA.
    Båda rundorna gick igenom med "0 axelfel" utan att ha jämfört något.
  * M1:s första generator kände bara igen etiketten `Gesamtmaße` och missade
    `Gesamtabmessung` i singular, vilket gav en tom facitrad — samma tystnad
    en annan väg.

☠️ OCH AXELBOKSTAVEN ÄR INTE ETT FACIT. Uppmätt i runda M2 mot åtta
måttritningar: Aosom använder TVÅ bokstavsscheman för samma geometri.

    321bdedf   170B x 100T x 245H      B = front,  T = bortre
    80e1a550   140L x 100B x 240H      L = front,  B = bortre
    (och så för sex produkter till)

Bokstaven för den bortre axeln är alltså `T` på en produkt och `B` på sju.
Läser man bokstäverna ordagrant heter SAMMA fysiska axel "djup" på den ena
produkten och "bredd" på den andra, i samma runda.

Vad som DÄREMOT håller: **position**. Tal 1 är den frontvända horisontalen,
tal 2 den bortre, tal 3 höjden — bekräftat mot ritningen på 8 av 8 i M2, mot
1 av 8 för den bokstavstrogna läsningen. Samma regel förklarar K14-fyndet:
där var 242 (position 1) bredden, och buggen var att position 2 lästes som
bredd.

Facit byggs därför POSITIONELLT. Bokstäverna sparas i `bokstaver` så att
gate-axel fortfarande kan rapportera när tyskan och den svenska spec-fliken
är oense — det är en upplysning om källan, inte ett facit om produkten.

ANVÄNDNING (från rundans katalog):
    python3 ../../polish-gates/bygg-axelfacit.py
"""
import io, json, re, sys

# Aosom använder alla fyra omväxlande — M1 föll på att bara känna igen två.
ETIKETT = r"(?:Gesamtabmessungen|Gesamtabmessung|Gesamtgröße|Gesamtgrösse|Gesamtgroesse|Gesamtmaße|Gesamtmasse|Maße|Masse)"

# ☠️ ETIKETTEN KAN BÄRA ETT BESTÄMNINGSORD, OCH DÅ FINNS DET FLER ÄN EN.
# Uppmätt i runda N1 på bäddsoffan d372e8e9, som har BÅDA:
#
#     Gesamtabmessungen Sofa: 203B x 95T x 75H cm
#     Gesamtabmessungen Bett: 203B x 121T x 38H cm
#
# Ett naket `ETIKETT\s*:` hittar ingen av dem och generatorn avbryter —
# rätt beteende, men den kan bättre. Att bara tillåta bestämningsordet
# vore däremot att öppna för att fälla in BÄDDENS mått som produktens,
# och en bäddsoffa är 75 cm hög som soffa och 38 cm som bädd.
#
# Därför två pass, och ordningen är hela spärren:
#   1. etiketten DIREKT följd av kolon — oförändrat beteende för allt
#      som byggts hittills, så M1–M4 regenererar byte-identiskt.
#   2. bara om pass 1 tiger: etiketten + ETT bestämningsord. Ordet
#      skrivs in i `axelkalla`, så en läsare ser vilken rad facit kom
#      ur i stället för att behöva gissa.
KVALIFICERAD = ETIKETT + r"\s+([A-Za-zÄÖÜäöüß]+)\s*:\s*(.+)$"

# ☠️ EN PRODUKT KAN HA EN TOTALHÖJD OCH INGET TOTALMÅTT. Uppmätt i runda N2 på
# konstväxten 67ba375c, vars enda måttrader är
#
#     Gesamthöhe: 110 cm
#     Topfgröße:  Ø17 x 14,5H cm
#
# Det finns inget L x B x H att hitta, för bladverket har ingen kant — och
# generatorn avbröt därför på en källa som faktiskt är entydig om det som
# räknas. Etiketten SÄGER totalhöjd, så `{hojd: 110}` är avläst, inte gissat.
#
# Den svenska spec-raden duger INTE här, och det är hela skälet till en egen
# gren: importen skriver `Ø17 x 110H cm`, alltså KRUKANS diameter bredvid
# VÄXTENS höjd. Ett facit byggt på den hade påstått att plantan är 17 cm bred
# när bladverket mäter långt mer, och gate-axel hade fällt varje korrekt
# meningen om bredden. Grenen ger därför höjden ensam och ingen bredd alls.
HOJDETIKETT = r"(?:Gesamthöhe|Gesamthoehe|Gesamthohe)\s*:\s*(\d+(?:[.,]\d+)?)\s*cm"

# ☠️ EN SKENA HAR EN LÄNGD OCH INGET ANNAT. Uppmätt i runda N59 på
# skjutdörrsbeslaget 87888f5f, vars enda mått är
#
#     Schienenlänge: 183 cm
#     Geeignete Türblattbreite: 90 cm
#
# Ingen totalrad och ingen rad med axelbokstav, alltså varken facit eller
# delmått — och generatorn avbröt. Men källan säger sanningen om sig själv:
# produkten är ett beslag, och det enda den mäter är en längd. Vilken axel
# längden är går INTE att läsa ur raden (en skena ligger vågrätt, en stolpe
# står lodrätt), så grenen ger inget facit utan märker raden axellös med
# raden som skäl — samma klass som isbjörnsparet och delmåtten ovan.
#
# Grenen kan bara fyra där den gamla koden avbröt, så ingen tidigare runda
# kan få ett annat facit av den.
#
# ⚠️ OCH EN KABEL MÄTS I METER. Uppmätt i runda N60 på laddkabeln c28af8df,
# vars enda mått är `Kabellänge: 5 m`. Samma sak som skenan — en längd och
# inget annat — men enheten är `m`, och grenen krävde `cm`, så generatorn
# avbröt. `c?m\b` läser båda och släpper fortfarande inte igenom `mm`.
# Etiketten står uttryckligen i listan: mönstret är skiftlägeskänsligt, och
# `Länge` matchar inte `länge` inne i en sammansättning.
LANGDETIKETT = r"(?:Schienenlänge|Gesamtlänge|Kabellänge|Länge)\s*:\s*\d+(?:[.,]\d+)?\s*c?m\b"

# ☠️ OCH EN KRUKVÄXT KAN SKRIVA HÖJDEN UTAN "GESAMT". Uppmätt i runda N65 på
# konstfikusen a6657b3d, vars enda mått är
#
#     Höhe: 150 cm
#     Topfgröße: Ø15 x 12,5 cm
#
# Samma sak som `Gesamthöhe` på 67ba375c (N2), bara ett annat ord — och
# generatorn avbröt. Etiketten är naken, så mönstret kräver att den står FÖRST
# på raden och ensam: `Sitzhöhe:` och `Rückenlehne Höhe:` är delmått och får
# aldrig bli produktens höjd. Grenen ligger dessutom SIST, där den gamla koden
# avbröt, så ingen tidigare runda kan få ett annat facit av den. Fler än en
# sådan rad är tvetydigt, och då avbryter generatorn som förr.
NAKEN_HOJD = r"^(?:✔\s*)?Höhe\s*:\s*(\d+(?:[.,]\d+)?)\s*cm\s*$"

# ☠️ OCH EN RING HAR BARA EN DIAMETER. Uppmätt i runda N66 på kantskyddet till
# en studsmatta, 14fb0f98, vars enda mått är
#
#     Durchmesser: Ø305 cm
#     Dicke der Polsterung: 15 mm
#
# Det finns ingen bredd, inget djup och ingen höjd att binda — produkten är en
# ring som följer ramen. Samma klass som isbjörnsparet (M1): källan säger
# sanningen om sig själv, och generatorn avbröt ändå. Raden märks axellös med
# ett skäl, så gate-axel säger "jämförde inte" i stället för att tiga.
# Etiketten måste stå FÖRST på raden och ensam, och grenen ligger efter den
# nakna höjden: en källa med både diameter och höjd är en cylinder, och då
# finns en höjdaxel att grinda.
DIAMETER = r"^(?:✔\s*)?Durchmesser\s*:\s*Ø?\s*\d+(?:[.,]\d+)?\s*cm\s*$"
AXLAR = ("bredd", "djup", "hojd")


def axelpar(rad):
    """Plockar (tal, bokstav) i ordning ur en tysk måttrad.

    ☠️ AOSOM SKRIVER BOKSTAVEN PÅ BÅDA SIDOR OM TALET. Uppmätt:
        Gesamtabmessungen: 160L x 90B x 240H     <- tal först
        Maße:              L100 x B55 x H120     <- BOKSTAV först
    Ett mönster som bara kan det ena gav tom facit på det andra, alltså en
    grind som inte kunde fälla. Båda former läses här, i radens ordning.

    ☠️ OCH ENHETEN KAN SITTA IHOP MED BOKSTAVEN. Uppmätt i runda M3 på
    d09b1b4c: `Gesamtabmessung: Ø105 x 180Hcm` — utan blanksteg före `cm`.
    Ett `\b` efter axelbokstaven kräver ett icke-ordtecken, och `Hcm` har
    inget, så raden gav NOLL par. Generatorn avbröt (som den ska sedan #225),
    men hade `axellos` funnits på raden hade den i stället tigit.

    Lookaheaden släpper därför igenom `cm`/`mm`/`m` direkt efter bokstaven —
    och BARA dem. `180 Hinweis` matchar fortfarande inte, vilket är hela
    skälet till att `\b` satt där från början.

    ☠️ OCH EN TREVÄGSKEDJA TAPPADE SIN FÖRSTA SIFFRA. Uppmätt i runda N19 på
    campingbordet ecb304cd: `Gesamtabmessungen: 240L x 60B x 54/62/70H cm`.
    Den gamla TAL-gruppen tillät bara EN `/`-förlängning, alltså matchade den
    "54/62" — men då stod "/70H" kvar och bokstaven satt inte omedelbart efter,
    så hela försöket vid position "54" föll. Regexet hittade i stället en
    matchning längre fram, "62/70H", och facit blev `{"hojd": [62, 70]}` —
    tyst utan 54. `tal()` splittar redan på VARJE `/`/`-` och hade hanterat tre
    tal korrekt; det var bara TAL-mönstret som stannade vid en förlängning.
    Gruppen upprepas nu (`*` i stället för `?`), vilket inte ändrar något för
    den vanliga tvåvärdeskedjan (`73-110H`) — den matchar fortfarande exakt en
    gång.
    """
    TAL = r"\d+(?:[.,]\d+)?(?:\s*[/-]\s*\d+(?:[.,]\d+)?)*"
    ENHET = r"(?:(?=[cm]?m\b)|\b)"
    ut = []
    for m in re.finditer(
            r"(?:(%s)\s*([BLTH])%s|\b([BLTH])\s*(%s))" % (TAL, ENHET, TAL), rad):
        if m.group(1) is not None:
            ut.append((m.group(1), m.group(2)))
        else:
            ut.append((m.group(4), m.group(3)))
    if ut:
        return ut
    # ☠️ OCH BOKSTÄVERNA KAN STÅ SOM EN FÖRKLARING EFTER TALEN. Uppmätt i runda
    # N32 på elkaminen 40fb1b24: `Maße: 89,2 x 13,5 x 48 cm (L x B X H)` — tre
    # nakna tal och bokstäverna i en parentes efteråt, med ett VERSALT X som
    # skiljetecken. Varken tal-först eller bokstav-först matchar, alltså NOLL par
    # och en generator som avbröt på en källa som faktiskt är entydig.
    #
    # Grenen fyrar BARA när de två vanliga formerna tiger (ingen rad som byggts
    # hittills kan därför ändras), och BARA när antalet tal före parentesen är
    # exakt lika med antalet bokstäver i den. Skiljer de sig åt vet vi inte vilket
    # tal som hör till vilken axel, och då är inget facit ärligare än ett gissat.
    # Den svenska spec-raden på samma produkt bar dessutom en ANNAN modells mått
    # (`Modell7/88,5 x 13,5 x 56cm`), så fallbacken till den gick inte heller.
    m = re.search(r"\(\s*([BLTH])((?:\s*[x×X]\s*[BLTH])+)\s*\)", rad)
    if m:
        bokstaver = [m.group(1)] + re.findall(r"[BLTH]", m.group(2))
        talen = re.findall(TAL, rad[:m.start()])
        if len(talen) == len(bokstaver):
            return list(zip(talen, bokstaver))
    return ut


def _talen(rad):
    """Talen i en måttrad, normaliserade — för att jämföra tysk mot svensk.

    Bara siffrorna jämförs: bokstaven är ju precis det som skiljer raderna åt,
    och `,`/`.` som decimaltecken är notation och inte ett annat mått.
    """
    return [x.replace(",", ".") for x in re.findall(r"\d+(?:[.,]\d+)?", rad)]


def tal(s):
    """'170' -> 170, '87/156' -> [87, 156], '53,5' -> 53.5 (jämförs inte)."""
    delar = re.split(r"[/-]", s)
    ut = []
    for d in delar:
        d = d.strip().replace(",", ".")
        v = float(d)
        ut.append(int(v) if v == int(v) else v)
    return ut[0] if len(ut) == 1 else ut


def main():
    kallor = json.load(io.open("kallor.json", encoding="utf-8"))
    ut = {"_om": "Genererad mekaniskt av polish-gates/bygg-axelfacit.py ur kallor.json. "
                 "POSITIONELL: tal 1 = frontvänd horisontal, tal 2 = bortre, tal 3 = höjd. "
                 "Bokstäverna är källans, inte facit — se skriptets docstring."}
    tomma = []
    for kort in sorted(kallor):
        ren = re.sub(r"<[^>]+>", "\n", kallor[kort])
        rader = [x.strip() for x in ren.split("\n") if x.strip()]
        tysk = ""
        kvalificerare = ""
        for rad in rader:
            m = re.search(ETIKETT + r"\s*:\s*(.+)$", rad)
            if m:
                tysk = m.group(1).strip()
                break
        if not tysk:
            for rad in rader:
                m = re.search(KVALIFICERAD, rad)
                if m:
                    kvalificerare = m.group(1)
                    tysk = m.group(2).strip()
                    break
        svensk = ""
        for i, rad in enumerate(rader):
            if rad == "Mått:" and i + 1 < len(rader):
                svensk = rader[i + 1].strip()
                break
        d = {"tyska": tysk, "svenska": svensk}
        if kvalificerare:
            d["axelkalla"] = f"tyska raden '{kvalificerare}' (etiketten bar ett bestämningsord)"
        par = axelpar(tysk)
        # ☠️ DEN TYSKA TOTALRADEN BÄR INTE ALLTID EN AXELBOKSTAV. Uppmätt i
        # runda M4 på 86fdd9af: `Gesamtabmessung: Ø70 x 210 cm` — ingen `H`
        # alls, alltså noll par och en generator som avbryter. Men den SVENSKA
        # spec-raden på samma produkt säger `Ø70 x 210H cm` och bär bokstaven.
        #
        # Båda raderna är källans egna och båda är kundsynliga, så det är
        # ingen gissning att läsa den andra när den första tiger. Ordningen är
        # däremot inte godtycklig: den tyska går FÖRST, eftersom det är den
        # gate-axel jämför bokstäverna mot när de två är oense (#226).
        # Fallbacken noteras i `axelkalla` så att en läsare ser vilken rad
        # facit faktiskt kommer ur.
        #
        # ☠️ OCH DEN FÅR BARA FYRA NÄR DET FINNS EN TYSK TOTALRAD ATT RÄDDA.
        # Första utkastet villkorade bara på `svensk`, och regressionen fann
        # direkt vad det kostar: isbjörnsparet 5a14cc4d i M1 har INGEN tysk
        # totalrad (bara `Große`/`Kleine Bärenabmessungen`, två figurer utan
        # gemensamt mått) — men en svensk `Mått:`-rad med den STORA björnens
        # tal. Fallbacken gjorde då om ett korrekt `axellös` till ett facit
        # som påstår att setet är 80 x 30 x 60. Ett facit som ljuger är värre
        # än inget facit: grinden fäller då på korrekt text.
        #
        # `tysk` är villkoret, inte `delmatt`: skillnaden mellan de två fallen
        # är precis om källan PÅSTÅR ett totalmått överhuvudtaget.
        #
        # ☠️ OCH TALEN MÅSTE VARA SAMMA TAL. Den svenska raden är en
        # översättning av den tyska, inte en andra mätning — skiljer de sig åt
        # är det inte en saknad bokstav utan två olika mått, och då vet vi inte
        # vilket som gäller. Generatorn avbryter hellre än väljer.
        if not par and tysk and svensk:
            kandidat = axelpar(svensk)
            if kandidat and _talen(svensk) == _talen(tysk):
                par = kandidat
                d["axelkalla"] = "svenska spec-raden (tyska raden saknar axelbokstav)"
        # ☠️ TVÅ TAL UTAN H ELLER T GÅR INTE ATT LÄGGA UT POSITIONELLT.
        # Uppmätt i runda N2 på häckrullen c8376256: `Gesamtmaße: L300 x B100 cm`.
        # Den positionella regeln gav {bredd: 300, djup: 100} — men produkten är
        # en platt rulle som hängs på ett staket, och Aosoms EGEN måttritning
        # sätter 100 som HÖJD. Facit hade alltså fällt varje korrekt mening om
        # höjden, och släppt igenom "100 cm djup" på något som är två centimeter
        # tjockt.
        #
        # Positionsregeln vilar på att H och T är utlästa ur bokstaven och bara
        # de två horisontalerna skiljs åt av ordningen. Saknas BÅDA de
        # bokstäverna finns ingen tredje axel att räkna bakåt från, och B mot L
        # säger ingenting om vilken av de två återstående axlarna talet är.
        # Då är enda ärliga facit inget facit: raden märks axellös och
        # gate-axel uttalar sig inte om produktens tal.
        if par and len(par) == 2 and not any(b in ("H", "T") for _, b in par):
            d["axellos"] = ("totalraden har tva tal utan H eller T (%s) — vilken axel "
                            "det andra talet ar gar inte att avgora ur raden" % tysk)
            par = []

        if not par:
            # ☠️ EN TOTALHÖJD ÄR ETT ENTYDIGT MÅTT ÄVEN NÄR TOTALMÅTTET SAKNAS.
            # Se HOJDETIKETT ovan: `Gesamthöhe: 110 cm` på en krukväxt. Grenen
            # ligger EFTER de vanliga passen, så allt som byggts hittills
            # regenererar oförändrat — den fyrar bara där de tiger.
            for rad in rader:
                m = re.search(HOJDETIKETT, rad)
                if m:
                    d["tyska"] = rad.strip()
                    d["bokstaver"] = "H"
                    d["hojd"] = tal(m.group(1))
                    d["axelkalla"] = "tyska raden 'Gesamthöhe' (kallan har ingen totalmattrad)"
                    d.pop("axellos", None)
                    break

        if not par and "hojd" not in d:
            # ☠️ EN PRODUKT KAN SAKNA TOTALMÅTT PÅ RIKTIGT. Uppmätt i M1 på
            # isbjörnsparet 5a14cc4d: källan har "Große Bärenabmessungen" och
            # "Kleine Bärenabmessungen" men inget mått för setet, för det finns
            # inget — det är två figurer. Skillnaden mot ett trasigt facit måste
            # SYNAS: raden märks axellös så att gate-axel kan säga "jämförde
            # inte" i stället för att tiga. En tom rad utan förklaring är en
            # grind som inte kan fälla.
            #
            # ☠️ OCH DETEKTORN VAR LEXIKAL, ALLTSÅ FÖR SMAL. Den kände igen ETT
            # tyskt ord. Runda N4 gav två källor som säger exakt samma sak med
            # andra ord och därför avbröt hela generatorn:
            #
            #   b7b5b37e  `Großer Tisch Größe: 50L x 50B x 52Hcm`  (två bord)
            #   6b8cd35b  `Einzelnes Paneel: 61L x 91B cm`         (en hage)
            #
            # Båda är samma klass som isbjörnsparet: källan mäter DELARNA för
            # att produkten inte HAR ett totalmått. Villkoret är därför
            # STRUKTURELLT i stället för lexikalt — en rad som bär ett
            # axelmärkt tal är en måttrad, vad den än heter. En ordlista
            # glider; formen gör det inte.
            #
            # ⚠️ OCH ETIKETTEN FÅR INTE VIDGAS I STÄLLET. Att lägga `Größe` i
            # ETIKETT var första utkastet, och mätningen slog ihjäl det: över
            # husets alla källor finns sex `<ord> Größe:` och FYRA av dem är en
            # DEL (`Armlehnen`, `Rückenlehne`, `Ottomane`). Generatorn hade då
            # bokfört ett armstöd som produktens totalmått. Ett facit som
            # ljuger är värre än inget facit — den här grenen gör ett avbrott
            # till ett FÖRKLARAT utfall, aldrig till ett felaktigt facit.
            #
            # ☠️ OCH DEN FÅR INTE SKRIVA ÖVER ETT REDAN SATT `axellos`.
            # Regressionen mot alla tidigare rundor fällde direkt: häckrullen
            # c8376256 (N2) är märkt av tvåtals-spärren ovan med det PRECISA
            # skälet "totalraden har tva tal utan H eller T (L300 x B100 cm)".
            # Den strukturella detektorn ser samma rad som ett delmått och
            # ersatte skälet med "inget totalmått i källan" — vilket är fel:
            # totalraden FINNS, den går bara inte att lägga ut positionellt.
            # Ett mindre sant skäl är en tystare sorts fel än ett avbrott.
            delmatt = [r for r in rader
                       if re.search(r"abmessungen\s*:", r, re.I)
                       or (":" in r and axelpar(r.split(":", 1)[1]))]
            langd = [r for r in rader if re.search(LANGDETIKETT, r)]
            naken = [m for m in (re.search(NAKEN_HOJD, r) for r in rader) if m]
            diameter = [r for r in rader if re.search(DIAMETER, r)]
            if delmatt and "axellos" not in d:
                d["axellos"] = "inget totalmått i källan; bara delmått: " + " | ".join(delmatt)
            elif langd and "axellos" not in d:
                d["axellos"] = "inget totalmått i källan; bara en längd: " + " | ".join(langd)
            elif len(naken) == 1 and "axellos" not in d:
                d["tyska"] = naken[0].group(0).strip()
                d["bokstaver"] = "H"
                d["hojd"] = tal(naken[0].group(1))
                d["axelkalla"] = "tyska raden 'Höhe' (kallan har ingen totalmattrad)"
            elif diameter and "axellos" not in d:
                d["axellos"] = "inget totalmått i källan; bara en diameter: " + " | ".join(diameter)
            elif "axellos" not in d:
                # En rad som redan är märkt axellös av tvåtals-spärren ovan är
                # ett FÖRKLARAT utfall, inte en tom facitrad. Att avbryta på den
                # hade betytt att en källa som säger sanningen om sig själv
                # stoppar hela rundan.
                tomma.append(kort)
        if par:
            d["bokstaver"] = "".join(b for _, b in par)
            # ☠️ REN POSITION RÄCKER INTE HELLER. Uppmätt i M1 på 3225c539:
            # "Ø30 x 51H" — diametern bär ingen bokstav, så 51H hamnade på
            # position 1 och HÖJDEN bokfördes som bredd.
            #
            # Bokstäverna är entydiga där de FINNS: H är alltid höjd, T alltid
            # djup, i varje uppmätt rad. Tvetydigheten gäller bara B mot L för
            # de två horisontalerna — Aosom kallar frontmåttet B på en produkt
            # och L på sju. Regeln blir därför: läs H och T ur bokstaven, och
            # låt POSITIONEN skilja de återstående två åt (första = frontvänd
            # = bredd, andra = bortre = djup). Bekräftat mot måttritningen på
            # 8 av 8 i M2 och 7 av 7 måttbärande i M1.
            for t_, b in par:
                if b == "H" and "hojd" not in d:
                    d["hojd"] = tal(t_)
                elif b == "T" and "djup" not in d:
                    d["djup"] = tal(t_)
            horisontal = [x for x in par if x[1] in ("B", "L")]
            # ett B som redan tagits som djup (BTH-schemat) räknas inte om
            for i, (t_, _b) in enumerate(horisontal):
                axel = "bredd" if i == 0 else "djup"
                if axel not in d:
                    d[axel] = tal(t_)
        ut[kort] = d
    io.open("axelfacit.json", "w", encoding="utf-8").write(
        json.dumps(ut, ensure_ascii=False, indent=1))
    for kort in sorted(kallor):
        v = ut[kort]
        print("%-9s %-26s bokstäver=%-4s %s" % (
            kort, v.get("tyska", "—"), v.get("bokstaver", "—"),
            {a: v[a] for a in AXLAR if a in v}))
    if tomma:
        raise SystemExit("\n  [AVBRYT] ingen måttrad hittad för: %s\n"
                         "  En tom facitrad är en grind som inte kan fälla." % ", ".join(tomma))
    print("\nFACIT: %d produkter, alla med måttrad." % len(kallor))


main()
