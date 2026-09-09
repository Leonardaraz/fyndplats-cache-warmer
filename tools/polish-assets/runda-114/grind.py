# -*- coding: utf-8 -*-
"""Runda 114 — textgrinden. Nio sidor, fem konstruktioner.

☠️ TVÅ TONGRINDAR ÄRVS, för att de kostade fyra fel som nådde Wix i runda 111:
   `leverantören` (mot kunden är VI leverantören) och `rundan` (vårt ord för en
   arbetsomgång, inte kundens).

☠️ NEGATIONSREGELN ÄRVS OCKSÅ. Utan den fällde löftesgrindarna fyra KORREKTA
   sidor i runda 113: "blir aldrig helt ljudlös" är motsatsen till ett löfte.
   Grinden pekar på LÖFTET, inte på ordet — och självtestet prövar båda hållen.

Rundans egna grindar, och källan i leverantörens text som var för var finns
för att hindra oss att upprepa:

  ENERGIKLASS   ☠️ ÅT BÅDA HÅLL. (EU) 2019/2016 artikel 1 gäller elnätsdrivna
                kylapparater ÖVER TIO LITER. Två av nio faller innanför och
                MÅSTE bära klassen och skalan; de sju andra får INTE bära dem,
                för de har ingen klass. En grind som bara kollar "finns den?"
                hade släppt igenom en påhittad klass på en passiv kylbox.
  EJ_KYLSKAP    Sju av nio kan inte hålla kylskåpstemperatur. `d754d015` heter
                "Minikühlschrank" i källan och kyler 2–17 °C; `ef0fa603` har
                termostat 4–18 °C och kallas "Getränkekühlschrank". Ordet
                kylskåp på någon av dem är ett returärende.
  MATSAKERHET   4-litersmodellen säljs i källan för "Muttermilch und
                Medikamenten". Den användningen får inte finnas i texten.
  LASLOFTE      `e6d2e70b`:s marknadsföringsgrafik säger "Schloss & Schlüssel".
                Brödtexten nämner inget lås och inget foto visar ett.
  BURKTAL       Den publicerade kylvagnen säger cirka 60 burkar på 56 liter;
                den här källan säger 80 på samma volym och nästan samma box.
                Två av VÅRA sidor med dubbelt burktal är en motsägelse kunden
                kan se. Inget burktal på den här sidan.
"""
import os
import re
import sys

HAR = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, os.path.join(HAR, ".."))
import grindar as G                                             # noqa: E402
sys.path.insert(0, HAR)
import matt                                                     # noqa: E402
import texter as T                                              # noqa: E402

# ── Rundans löftesgrindar ────────────────────────────────────────────────────
TYSTLOFTE = re.compile(
    r"(helt\s+tyst|nästan\s+tyst|tyst\s+(?:drift|kompressor|modell|kyl\w*|skåp\w*)"
    r"|tystgående|tystaste|ljudlös\w*|knappt\s+hörbar|helt\s+utan\s+ljud"
    r"|hörs\s+knappt|viskning)", re.I)
# ⚠️ Ingen av de nio är energisnål i absolut mening — de två som HAR en klass
#    har E, och de sju andra har ingen klass alls att luta sig mot.
SNALLOFTE = re.compile(
    r"(energisnål\w*|låg\s+förbrukning|drar\s+nästan\s+ingen\s+ström"
    r"|energieffektiv\w*|snål\w*\s+med\s+ström|sänker\s+din\s+elräkning)", re.I)
EJ_KYLSKAP = re.compile(r"\bkylskåp\w*\b", re.I)
LASLOFTE = re.compile(r"\b(lås|låset|låsbar\w*|nyckel|nyckellås)\b", re.I)
BURKTAL = re.compile(r"\b\d+\s*(burkar|flaskor)\b", re.I)
MATSAKERHET = re.compile(
    r"\b(bröstmjölk|modersmjölk|läkemedel|medicin\w*|insulin|vaccin|"
    r"färskvaror|kylvaror|råvaror|kött|fisk)\b", re.I)

TONGRINDAR = (
    ("LEVERANTÖRSATTRIBUTION",
     re.compile(r"\bleverant[öo]r(?:en|ens|er|ers)?\b", re.I)),
    ("INTERN JARGONG", re.compile(r"\brundan?s?\b", re.I)),
)

FORBJUDET = [
    ("tyskt ord", re.compile(
        r"\b(K[üu]hlschrank|Gefrierschrank|Gefrierfach|K[üu]hlbox|K[üu]hlwagen|"
        r"Thermobox|Kosmetikk[üu]hlschrank|Lieferumfang|Abmessungen|Gesamtma[ßs]e|"
        r"Innenma[ßs]e|Fassungsverm[öo]gen|T[üu]r[öo]ffnungswinkel|Belastbarkeit|"
        r"Energieeffizienzklasse|Spannung|Ablassventil|Ablaufstopfen|Wei[ßs]|"
        r"Schwarz|Grau|Rosa\b(?!\s)|Khaki\b(?!\s))")),
    ("engelskt skräp", re.compile(r"\b(COMPACT SIZE|Beauty Fridge|Cooler Box)\b", re.I)),
    ("husmärke", re.compile(r"\b(PawHut|HOMCOM|Outsunny|Aiyaplay|Vinsetto|Aosom)\b", re.I)),
    ("lagerland", re.compile(r"Skickas fr[åa]n\s+(Tyskland|Polen|Spanien|Kina)", re.I)),
    ("artikelnummer", G.ARTNR),
    ("trasig relativ länk", re.compile(r"https:/produkt")),
]

# Materialorden härleds ur matt.MATERIAL — en tvilling hade kunnat glida isär.
MATERIALORD = {
    "397b845e": ["plast", "stål"], "412c9f43": ["plast"], "d754d015": ["plast"],
    "758f0a80": ["konstläder"], "d5cc9efa": ["konstläder"],
    "b3e3aac8": ["hdpe", "pu-skum"], "b815de72": ["hdpe", "pu-skum"],
    "e6d2e70b": ["kompressor"], "ef0fa603": ["led"],
}

# ☠️ `nej` HÖR HIT. Ett FAQ-svar som börjar med "Nej" är det renaste nekandet
#    som finns, och utan ordet i listan fastnade fyra korrekta sidor.
NEGATION = re.compile(r"\b(inte|aldrig|ingen|inget|nej|utan att|behöver du|"
                      r"snarare än|i stället för)\b", re.I)


# ☠️ ORDGRÄNS PÅ SKALAN. Ett första utkast skrev `"a till g" in txt.lower()`
#    och fällde kylvagnen på meningen "en hyll**a till g**lasen". Samma lärdom
#    som `\b` i runda 88 och den tyska ordlistan i runda 61: en delsträng är
#    ingen ordkontroll.
SKALAN = re.compile(r"\bA till G\b")


def _slut(txt, i):
    """Första meningsslutet vid eller efter `i`. ☠️ FRÅGETECKEN RÄKNAS.

    Utan det svalde "meningen" runt en FAQ-fråga också hela SVARET, och då
    kunde ett jakande svar ("Ja, absolut.") gömma sig bakom ett nekande i
    meningen därefter. Frågan är en egen mening; svaret är nästa.
    """
    kandidater = [j for j in (txt.find(".", i), txt.find("?", i)) if j >= 0]
    return min(kandidater) if kandidater else -1


def _mening_kring(txt, i):
    start = max(txt.rfind(".", 0, i), txt.rfind("—", 0, i),
                txt.rfind("?", 0, i)) + 1
    slut = _slut(txt, i)
    return txt[start: slut if slut > 0 else len(txt)]


def _nasta_mening(txt, i):
    """EN mening, inte 160 tecken.

    ☠️ ETT FÖNSTER PÅ 160 TECKEN URSÄKTADE FEL SAK. Uppmätt på rundans två
       färgpar: `412c9f43` blev godkänd för att ordet "ingen" stod 120 tecken
       bort i ett HELT ANNAT FAQ-svar, medan den identiska frågan på
       `758f0a80` fälldes för att just den sidans nästa svar råkade sakna ett
       nekande ord. Samma text, olika utfall — alltså mätte grinden avstånd
       och inte mening. Ett falskt GODKÄNNANDE är dessutom värre än ett
       falsklarm: det syns inte.
    """
    slut = _slut(txt, i)
    if slut < 0:
        return ""
    nasta = _slut(txt, slut + 1)
    return txt[slut + 1: nasta if nasta > 0 else len(txt)]


def loftestraff(monster, txt):
    """Träffar som INTE står i en negerad mening — alltså faktiska löften.

    ☠️ TVÅ MENINGAR, INTE EN. Runda 113:s regel läste bara meningen omkring
       träffen och fällde därför FYRA korrekta sidor här: FAQ-frågan
       "Kan den ersätta ett kylskåp för mat?" bär ordet, och nekandet står i
       SVARET — nästa mening. En fråga vars svar är "Nej" är motsatsen till
       ett löfte. Frågan ensam räcker alltså inte som ursäkt: självtestet
       prövar också "Kan den ersätta ett kylskåp? Ja, absolut.", som SKA fälla.
    """
    for m in monster.finditer(txt):
        omkring = _mening_kring(txt, m.start())
        if NEGATION.search(omkring):
            continue
        # ⚠️ Frågan slutar VID frågetecknet, så tecknet syns inte i `omkring`.
        #    Om man letar efter "?" i strängen hittar man det aldrig.
        slut = _slut(txt, m.start())
        ar_fraga = slut >= 0 and txt[slut] == "?"
        if ar_fraga and NEGATION.search(_nasta_mening(txt, m.start())):
            continue
        return m
    return None


def granska(nyckel, d):
    fel = []
    html = d["html"]
    txt = G.synlig_meningstext(html)
    allt = " ".join([d["namn"], d["titel"], d["meta"], html])
    g = matt.GRUPPER[nyckel]

    # ── Identitet ────────────────────────────────────────────────────────────
    if len(d["namn"]) > 80:
        fel.append("namnet är %d tecken (max 80)" % len(d["namn"]))
    if len(d["titel"]) > 60:
        fel.append("titeln är %d tecken (max 60)" % len(d["titel"]))
    if d["titel"] == d["namn"]:
        fel.append("titeln är IDENTISK med namnet — storefronten lägger på suffixet")
    if len(d["meta"]) > 155:
        fel.append("metan är %d tecken (max 155)" % len(d["meta"]))
    if len(d["sku"]) > 40:
        fel.append("SKU:n är %d tecken (max 40)" % len(d["sku"]))
    fokus = T.FOKUS[nyckel]
    for falt in ("namn", "titel"):
        if fokus not in d[falt].lower():
            fel.append("fokussökordet %r saknas i %s" % (fokus, falt))
    # Fokusordet i sluggen, ASCII-fierat (å→a, ä→a, ö→o).
    if fokus.translate(str.maketrans("åäöé", "aaoe")) not in d["slug"]:
        fel.append("fokussökordet saknas i sluggen %r" % d["slug"])

    # ── Förbjudet ────────────────────────────────────────────────────────────
    for etikett, monster in FORBJUDET:
        m = monster.search(allt)
        if m:
            fel.append("%s: %r" % (etikett, m.group(0)))
    for etikett, monster in TONGRINDAR:
        m = monster.search(txt)
        if m:
            i = max(0, m.start() - 45)
            fel.append("%s: …%s…" % (etikett, txt[i:m.end() + 45]))

    # ── Löften ───────────────────────────────────────────────────────────────
    #
    # ☠️ SYSKONMENINGEN BÄR EN ANNAN PRODUKTS ORD. `ef0fa603` länkar till
    #    "ett kylskåp på 91 liter" — ett riktigt påstående om ett riktigt
    #    syskon, inte ett påstående om den här varan. Samma klass som runda
    #    111:s materialgrind som läste grannens ord som vårt fel. Strykningen
    #    KONTROLLMÄTS nedan, annars hade "noll löften" kunnat betyda att
    #    strykningen ätit upp texten.
    # ☠️ `[^.]*\.` STANNADE INUTI ADRESSEN. Syskonlänken är ABSOLUT (annars
    #    skriver Wix om den till `https:/produkt/…`), och `www.fyndplats.se`
    #    bär tre punkter — så strykningen kapade mitt i href:en och lämnade
    #    "ett kylskåp på 91 liter" kvar som om det vore ett påstående om DEN
    #    HÄR varan. Stryk hela stycket i stället.
    egen = re.sub(r"<p>Finns också som .*?</p>", "", allt, flags=re.S)
    egen = re.sub(r"Finns också som [^<]*", "", egen)
    if d["namn"] not in egen or T.yttre(nyckel) not in egen:
        fel.append("KONTROLLMÄTNINGEN FALLER — strykningen åt sidans egen text")
    grindar = [("SNÅLHETSLÖFTE", SNALLOFTE), ("MATSÄKERHETSLÖFTE", MATSAKERHET)]
    if nyckel in matt.LJUD:
        grindar.append(("TYSTLÖFTE", TYSTLOFTE))
    if nyckel != "e6d2e70b":
        grindar.append(("SÅLD SOM KYLSKÅP", EJ_KYLSKAP))
    if nyckel == "e6d2e70b":
        grindar.append(("LÅSLÖFTE UTAN UNDERLAG", LASLOFTE))
    if nyckel == "397b845e":
        grindar.append(("BURKTAL SOM MOTSÄGER SYSKONSIDAN", BURKTAL))
    for etikett, monster in grindar:
        m = loftestraff(monster, egen)
        if m:
            i = max(0, m.start() - 50)
            fel.append("%s: …%s…" % (etikett, egen[i:m.end() + 50]))

    # ── ☠️ LAGKRAVET, ÅT BÅDA HÅLL ───────────────────────────────────────────
    har_klass = re.search(r"energiklass\s+[A-G]\b", txt, re.I)
    har_skala = bool(SKALAN.search(txt))
    if nyckel in matt.ENERGIKLASS:
        klass = matt.ENERGIKLASS[nyckel]
        if ("energiklass %s" % klass).lower() not in txt.lower():
            fel.append("ENERGIKLASSEN saknas — (EU) 2019/2016 kräver den i annonsen")
        if not har_skala:
            fel.append("ENERGISKALAN saknas — klassen ensam räcker inte")
    else:
        if har_klass or har_skala:
            fel.append("ENERGIKLASS PÅ EN PRODUKT SOM INTE HAR NÅGON — "
                       "(EU) 2019/2016 gäller elnätsdrivet över tio liter")

    # ── ☠️ De utelämnade fälten får inte smyga tillbaka ──────────────────────
    for ord_ in matt.UTELAMNAS.get(nyckel, []):
        if re.search(r"\b" + re.escape(ord_), allt, re.I):
            fel.append("UTELÄMNAT FÄLT tillbaka på sidan: %r" % ord_)

    # ── Material ─────────────────────────────────────────────────────────────
    for ord_ in MATERIALORD[nyckel]:
        if ord_ not in txt.lower():
            fel.append("nämner inte %r" % ord_)

    # ── Signaturkontroll: yttermått och volym ────────────────────────────────
    if T.yttre(nyckel) not in txt:
        fel.append("yttermåttet %s står inte på sidan" % T.yttre(nyckel))
    if "%s liter" % T.tal(matt.VOLYM[nyckel]) not in txt:
        fel.append("volymen %s liter står inte på sidan" % matt.VOLYM[nyckel])

    # ── Ohärledda tal ────────────────────────────────────────────────────────
    #
    # ☠️ SYSKONMENINGEN BÄR EN ANNAN PRODUKTS TAL och stryks före kontrollen —
    #    med en KONTROLLMÄTNING på strykningen själv, annars hade "noll
    #    ohärledda tal" bara betytt att strykningen ätit upp talen.
    utan_syskon = re.sub(r"Finns också som [^.]*\.", "", txt)
    if T.yttre(nyckel) not in utan_syskon:
        fel.append("KONTROLLMÄTNINGEN FALLER — strykningen åt sidans egna tal")
    kanda = set()
    for m in (matt.YTTERMATT, matt.INNERMATT):
        for v in m.get(nyckel, ()):
            kanda.add(T.tal(v))
    for v in (matt.VOLYM[nyckel], matt.VIKT[nyckel]):
        kanda.add(T.tal(v))
    for d_ in (matt.KYLINTERVALL, matt.VARMEINTERVALL, matt.OMGIVNING):
        for v in d_.get(nyckel, ()):
            kanda.add(T.tal(v))
    for d_ in (matt.LJUD, matt.ARSFORBRUKNING):
        if nyckel in d_:
            kanda.add(T.tal(d_[nyckel]))
    kanda |= {"10", "15", "18", "36", "65", "70", "72", "80", "81", "90", "91",
              "135", "180", "1,5", "1,7", "2", "3", "4", "16", "44"}
    for m in re.finditer(r"\b\d+(?:,\d+)?\b", utan_syskon):
        if m.group(0) not in kanda:
            i = max(0, m.start() - 40)
            fel.append("OHÄRLETT TAL %r: …%s…"
                       % (m.group(0), utan_syskon[i:m.end() + 40]))
    return fel


def _sjalvtest():
    """☠️ VARJE GRIND PRÖVAS ÅT BÅDA HÅLL. En grind som bara provas på 'fäller
    den?' kan lika gärna vara `return ['fel']`, och en som bara provas på
    'släpper den?' kan vara `return []`."""
    bas = T.bygg("b3e3aac8")

    def med(txt, k="b3e3aac8"):
        d = dict(T.bygg(k))
        d["html"] = d["html"] + T.P(txt)
        return d

    fall = [
        ("A  rakt tystlöfte              ", "TYSTLÖFTE",
         med("Boxen är helt tyst.", "412c9f43"), True),
        ("B  negerat tystlöfte           ", "TYSTLÖFTE",
         med("Den blir aldrig helt ljudlös.", "412c9f43"), False),
        ("C  ordet kylskåp på en kylbox  ", "SÅLD SOM KYLSKÅP",
         med("Fungerar som ett kylskåp."), True),
        ("D  kylskåp i en NEKANDE mening ", "SÅLD SOM KYLSKÅP",
         med("Den ersätter inte ett kylskåp."), False),
        ("E  bröstmjölk i texten         ", "MATSÄKERHETSLÖFTE",
         med("Perfekt för bröstmjölk.", "758f0a80"), True),
        ("F  låslöfte utan underlag      ", "LÅSLÖFTE",
         med("Dörren har ett nyckellås.", "e6d2e70b"), True),
        ("G  energiklass på passiv box   ", "ENERGIKLASS PÅ EN PRODUKT",
         med("Boxen har energiklass A på skalan A till G."), True),
        # ☠️ MUTATIONEN MÅSTE TA BORT VARJE BÄRARE. Ett första utkast bytte
        #    bara ut brödtextens "energiklass E" och fick "inget larm" — inte
        #    för att grinden var trasig, utan för att klassen står på TRE
        #    ställen: brödtexten, spec-raden och FAQ-svaret. En mutation som
        #    lämnar två kvar provar ingenting.
        ("H  energiklassen borttagen     ", "ENERGIKLASSEN saknas",
         {**T.bygg("ef0fa603"),
          "html": re.sub(r"[Ee]nergiklass", "klass",
                         T.bygg("ef0fa603")["html"])},
         True),
        ("H2 skalan borttagen            ", "ENERGISKALAN saknas",
         {**T.bygg("ef0fa603"),
          "html": T.bygg("ef0fa603")["html"].replace("A till G", "sin skala")},
         True),
        ("I  burktal på kylvagnen        ", "BURKTAL",
         med("Rymmer 80 burkar.", "397b845e"), True),
        ("J  ohärlett tal                ", "OHÄRLETT TAL",
         med("Boxen väger 999 kg."), True),
        ("L  fråga besvarad NEKANDE       ", "SÅLD SOM KYLSKÅP",
         med("Kan den ersätta ett kylskåp? Nej, det kan den inte."), False),
        # ☠️ NEKANDET MÅSTE STÅ I SVARET, inte var som helst i närheten.
        ("M  fråga besvarad JAKANDE        ", "SÅLD SOM KYLSKÅP",
         med("Kan den ersätta ett kylskåp? Ja, absolut. "
             "Det finns ingen anledning att tveka."), True),
        ("N  skalan i ett vanligt ord      ", "ENERGIKLASS PÅ EN PRODUKT",
         med("Vi har en hylla till glasen."), False),
        ("K  orörd sida                  ", "", bas, False),
    ]
    fel = 0
    for etikett, sok, d, ska in fall:
        traff = [x for x in granska(d["k"], d) if not sok or sok in x]
        if bool(traff) != ska:
            print("  SJÄLVTEST FEL %s: %s"
                  % (etikett, "inget larm" if ska else "falsklarm: %s" % traff[:1]))
            fel += 1
    print("självtest: %d fall, %d fel" % (len(fall), fel))
    return fel


if __name__ == "__main__":
    matt.kontroll()
    if _sjalvtest():
        sys.exit(2)
    tot = 0
    for k in matt.WIX:
        f = granska(k, T.bygg(k))
        tot += len(f)
        print("%s %s  %s  %s" % ("OK " if not f else "FEL", k,
                                 matt.GRUPPER[k], T.SLUG[k]))
        for x in f:
            print("      ✗", x)
    print("\nSKU: %d unika av %d" % (len(set(T.SKU.values())), len(T.SKU)))
    print("%d sidor, %d fel totalt" % (len(matt.WIX), tot))
    sys.exit(0 if tot == 0 else 1)
