# -*- coding: utf-8 -*-
"""Runda 113 — textgrinden. Åtta sidor, tre grupper.

☠️ TVÅ TONGRINDAR ÄRVS, för att de kostade fyra fel som nådde Wix i runda 111:
   `leverantören` (mot kunden är VI leverantören) och `rundan` (vårt ord för
   en arbetsomgång, inte kundens).

☠️ FYRA GRINDAR ÄR RUNDANS EGNA, och alla fyra har en KÄLLA i leverantörens
   egen text som de finns för att hindra oss att upprepa:

   TYSTLOFTE     `480849a7` HETER "Weinkühlschrank, leise" och är 41 dB —
                 familjens högsta, mot `47a91a17`:s 37. Leverantören har döpt
                 den tystaste egenskapen på den minst tysta modellen. Inget
                 "tyst" på någon av de fyra vinkylarna; dB-talet får tala.
   FRYS_INTE_KYL `9a33e15f` heter "Mini-Gefrierschrank, 35 L Minikühlschrank"
                 i sitt EGET namn. Den går till −24 °C. Ett "minikylskåp" som
                 fryser sönder mjölken är ett returärende.
   ENERGIKLASS   ☠️ LAGKRAV, inte stil. (EU) 2019/2016 kräver att varje visuell
                 annons för en specifik modell — uttryckligen inklusive på
                 internet — bär energieffektivitetsklassen OCH skalan. Saknas
                 den på en sida fäller grinden.
   UTELAMNAS     `47a91a17` anger 60 Hz (svenska nätet är 50) och `fdbfcea0`
                 anger R600 där de sju andra säger R600a. Båda utelämnas hellre
                 än gissas — och grinden fäller om de smyger tillbaka.
"""
import os, re, sys

HAR = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, os.path.join(HAR, ".."))
import grindar as G                                            # noqa: E402
sys.path.insert(0, HAR)
import matt                                                    # noqa: E402
import texter as T                                             # noqa: E402

# ── Rundans egna löftesgrindar ───────────────────────────────────────────────
# ⚠️ Mönstret pekar på LÖFTET, inte på ordet. `ett tyst arbetsrum` beskriver
#    rummet och ska inte fällas; `helt tyst` beskriver skåpet och ska fällas.
TYSTLOFTE = re.compile(
    r"(helt\s+tyst|nästan\s+tyst|tyst\s+(?:drift|kompressor|modell|kyl\w*)"
    r"|tystgående|tystaste|ljudlös\w*|knappt\s+hörbar|helt\s+utan\s+ljud"
    r"|hörs\s+knappt|viskning)", re.I)
FRYS_INTE_KYL = re.compile(r"\b(kylskåp|kylskåpet|minikylskåp\w*|kyler\s+mat)\b", re.I)
# ⚠️ En vinkyl med EN zon får inte lova två. Leverantören skriver "Rot-,
#    Weißweine oder Biere" på alla fyra, vilket är sant var för sig och blir
#    ett tvåzonslöfte om det skrivs som "samtidigt".
TVAZONSLOFTE = re.compile(
    r"(två\s+zoner|tv[åa]zon\w*|rött\s+och\s+vitt\s+samtidigt\s*(?!\?)"
    r"|olika\s+temperatur\w*\s+i\s+samma)", re.I)
# ⚠️ Ingen av de åtta är energisnål i absolut mening — klasserna är E och G.
SNALLOFTE = re.compile(
    r"(energisnål\w*|låg\s+förbrukning|drar\s+nästan\s+ingen\s+ström"
    r"|energieffektiv\w*|snål\w*\s+med\s+ström)", re.I)

TONGRINDAR = (
    ("LEVERANTÖRSATTRIBUTION",
     re.compile(r"\bleverant[öo]r(?:en|ens|er|ers)?\b", re.I)),
    ("INTERN JARGONG", re.compile(r"\brundan?s?\b", re.I)),
)

FORBJUDET = [
    ("tyskt ord", re.compile(
        r"\b(Kühlschrank|Gefrierschrank|Gefrierbox|Weinkühlschrank|Kühlbox|"
        r"Thermobox|Glastür|Kältemittel|Kühlmittel|Lieferumfang|Abmessungen|"
        r"Gesamtmaße|Innenmaße|Flaschen|Regal|Weiß|Schwarz|Silber|Grau|"
        r"Türöffnungswinkel|Belastbarkeit|Energieeffizienzklasse|Spannung)\b")),
    ("husmärke", re.compile(r"\b(PawHut|HOMCOM|Outsunny|Aiyaplay|Vinsetto|Aosom)\b", re.I)),
    ("lagerland", re.compile(r"Skickas fr[åa]n\s+(Tyskland|Polen|Spanien|Kina)", re.I)),
    ("artikelnummer", G.ARTNR),
    ("trasig relativ länk", re.compile(r"https:/produkt")),
]

MATERIALORD = {k: [o.lower() for o in matt.MATERIAL[k]] for k in matt.MATERIAL}
# ☠️ Frysarna är stål och plast; vinkylarna metall och härdat glas. Ordet
#    `glasdörr` på en frys vore ett annat skåp, och `plast` på en vinkyl likaså.
FORBJUDET_ORD = {
    "8cfe5171": re.compile(r"\b(glasdörr\w*|härdat\s+glas)\b", re.I),
    "a33ece7a": re.compile(r"\b(glasdörr\w*|härdat\s+glas)\b", re.I),
    "9a33e15f": re.compile(r"\b(glasdörr\w*|härdat\s+glas)\b", re.I),
    "b2c76518": re.compile(r"\b(glasdörr\w*|härdat\s+glas)\b", re.I),
    "47a91a17": re.compile(r"\bfryser\b", re.I),
    "15d30e23": re.compile(r"\bfryser\b", re.I),
    "480849a7": re.compile(r"\bfryser\b", re.I),
    "fdbfcea0": re.compile(r"\bfryser\b", re.I),
}

FLIKAR = ["Tekniska specifikationer", "Användning och skötsel", "Vanliga frågor"]
KOMMALISTA = re.compile(r"\d+(?:,\d+)?, \d")
FOKUS = {"A": "låsbar minifrys", "B": "minifrys", "C": "vinkyl"}


NEGATION = re.compile(r"\b(inte|aldrig|ingen|inget|utan att|behöver du)\b", re.I)


def _mening_kring(txt, i):
    start = max(txt.rfind(".", 0, i), txt.rfind("—", 0, i)) + 1
    slut = txt.find(".", i)
    return txt[start: slut if slut > 0 else len(txt)]


def loftestraff(monster, txt):
    """Träffar som INTE står i en negerad mening — alltså faktiska löften.

    ☠️ Utan den här regeln fällde grinden fyra korrekta sidor. `blir aldrig
       helt ljudlös` och `behöver du två zoner, och det har den här inte` är
       motsatsen till löften, och `ett tyst arbetsrum` handlar om rummet.
    """
    for m in monster.finditer(txt):
        if not NEGATION.search(_mening_kring(txt, m.start())):
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
        fel.append(f"namnet är {len(d['namn'])} tecken (max 80)")
    if len(d["titel"]) > 60:
        fel.append(f"titeln är {len(d['titel'])} tecken (max 60)")
    if d["titel"] == d["namn"]:
        fel.append("titeln är IDENTISK med namnet — storefronten lägger på suffixet")
    if len(d["meta"]) > 155:
        fel.append(f"metan är {len(d['meta'])} tecken (max 155)")
    if len(d["sku"]) > 40:
        fel.append(f"SKU:n är {len(d['sku'])} tecken (max 40)")
    # Fokussökordet MÅSTE stå i namn, titel OCH slug.
    fokus = FOKUS[g]
    for falt in ("namn", "titel"):
        if fokus not in d[falt].lower():
            fel.append(f"fokussökordet {fokus!r} saknas i {falt}")
    if fokus.split()[-1] not in d["slug"]:
        fel.append(f"fokussökordet saknas i sluggen {d['slug']!r}")

    # ── Förbjudet ────────────────────────────────────────────────────────────
    for etikett, monster in FORBJUDET:
        m = monster.search(allt)
        if m:
            fel.append(f"{etikett}: {m.group(0)!r}")
    for etikett, monster in TONGRINDAR:
        m = monster.search(txt)
        if m:
            i = max(0, m.start() - 45)
            fel.append(f"{etikett}: …{txt[i:m.end() + 45]}…")

    # ── Rundans löften ───────────────────────────────────────────────────────
    grindar = [("SNÅLHETSLÖFTE", SNALLOFTE)]
    if g == "C":
        grindar += [("TYSTLÖFTE", TYSTLOFTE), ("TVÅZONSLÖFTE", TVAZONSLOFTE)]
    else:
        grindar += [("FRYS SÅLD SOM KYLSKÅP", FRYS_INTE_KYL)]
    for etikett, monster in grindar:
        m = loftestraff(monster, allt)
        if m:
            i = max(0, m.start() - 50)
            fel.append(f"{etikett}: …{allt[i:m.end() + 50]}…")

    # ── ☠️ LAGKRAVET: klass OCH skala på varje sida ──────────────────────────
    klass = matt.ENERGIKLASS[nyckel]
    if f"energiklass {klass}".lower() not in txt.lower():
        fel.append(f"ENERGIKLASSEN saknas — (EU) 2019/2016 kräver klassen på sidan")
    if "a till g" not in txt.lower():
        fel.append("ENERGISKALAN saknas — klassen ensam räcker inte enligt (EU) 2019/2016")

    # ── ☠️ De två fält som INTE får skrivas ut ───────────────────────────────
    if nyckel in matt.UTELAMNAS:
        for ord_ in matt.UTELAMNAS[nyckel]:
            if re.search(r"\b" + re.escape(ord_), allt, re.I):
                fel.append(f"UTELÄMNAT FÄLT tillbaka på sidan: {ord_!r} "
                           f"(leverantörens tal är obrukbart för den här modellen)")

    # ── Material ─────────────────────────────────────────────────────────────
    for ord_ in MATERIALORD[nyckel]:
        if ord_ not in txt.lower():
            fel.append(f"nämner inte sitt material {ord_!r}")
    m = FORBJUDET_ORD[nyckel].search(txt)
    if m:
        fel.append(f"FEL SKÅPTYP på sidan: {m.group(0)!r}")

    # ── Rundans signaturkontroll: yttermåttet och volymen måste stå ──────────
    if T.yttre(nyckel) not in txt:
        fel.append(f"yttermåttet {T.yttre(nyckel)} står inte på sidan")
    if f"{T.tal(matt.VOLYM[nyckel])} liter" not in txt:
        fel.append(f"volymen {matt.VOLYM[nyckel]} liter står inte på sidan")

    # ── Mått och tal: allt som ser ut som ett mått måste vara härlett ────────
    #
    # ☠️ SYSKONRADEN OCH KORSLÄNKARNA BÄR EN ANNAN PRODUKTS TAL. "vinkyl för 20
    #    flaskor" är ett riktigt påstående om ett riktigt syskon, inte ett
    #    ohärlett tal om den här varan. De stryks före talkontrollen — med en
    #    KONTROLLMÄTNING på strykningen själv, annars hade "noll ohärledda tal"
    #    bara betytt att strykningen ätit upp talen i stället för att godkänna dem.
    utan_syskon = re.sub(r"Finns också som [^.]*\.", "", txt)
    utan_syskon = re.sub(r"<[^>]*>", "", utan_syskon)
    utan_syskon = re.sub(r"(vår|vinkylen för|smalare vinkyl för|lägre vinkyl för)"
                         r"[^.,]*?(minifrys utan lås|\d+ flaskor)", "", utan_syskon)
    if len(utan_syskon) < len(txt) - 220:
        fel.append("KONTROLLMÄTNINGEN FALLER — strykningen åt för mycket")
    if T.yttre(nyckel) not in utan_syskon:
        fel.append("KONTROLLMÄTNINGEN FALLER — strykningen tog sidans eget mått")

    kanda = {T.tal(x) for x in matt.YTTRE[nyckel]}
    kanda |= {T.tal(x) for x in matt.PAKET[nyckel]}
    kanda |= {T.tal(matt.VOLYM[nyckel]), T.tal(matt.VIKT[nyckel]),
              T.tal(matt.EFFEKT[nyckel]), T.tal(matt.LJUD[nyckel]),
              T.tal(matt.SLADD[nyckel]), T.tal(matt.HYLLAST[nyckel])}
    kanda |= set(re.findall(r"\d+(?:,\d+)?", matt.TEMPERATUR[nyckel]))
    if nyckel in matt.INNERFACK:
        for fack in matt.INNERFACK[nyckel]:
            kanda |= {T.tal(x) for x in fack}
    if nyckel in matt.DORRVINKEL:
        kanda.add(T.tal(matt.DORRVINKEL[nyckel]))
    if nyckel in matt.FLASKOR:
        kanda.add(T.tal(matt.FLASKOR[nyckel]))
    if nyckel in matt.ARSFORBRUKNING:
        kanda.add(T.tal(matt.ARSFORBRUKNING[nyckel]))
    if nyckel in matt.SPANNING:
        kanda |= set(re.findall(r"\d+(?:,\d+)?", matt.SPANNING[nyckel]))
    kanda |= set(re.findall(r"\d+(?:,\d+)?", matt.FLASKMATT))
    kanda.add(T.tal(matt.FLASKVOLYM_ML))
    # ☠️ OCH UR `UNIKT`, produktens egna mätta uppgifter — inte ur en fri lista.
    #    En fri lista är precis vad grinden finns för att slippa: talet ser
    #    härlett ut för att det står i grindens undantag, inte i mätningen.
    kanda |= set(re.findall(r"\d+(?:,\d+)?", matt.UNIKT[nyckel]))
    # Rena räkneord (två fack, fem lägen, två nycklar) får stå fritt.
    kanda |= {"1", "2", "3", "4", "5"}
    # ☠️ Serveringstemperaturerna är allmängods och står med i UNIKT-tabellen
    #    för vinkylarna via spannet; de rena serveringstalen skrivs ut i texten
    #    och måste därför vara härledda någonstans. De ligger här, uttryckligen
    #    märkta, i stället för att smyga in i en fri lista.
    if matt.GRUPPER[nyckel] == "C":
        kanda |= {"16", "18", "8", "12"}          # rött 16–18 °C, vitt 8–12 °C
        kanda.add("90")                            # standardbänkhöjd
    # ☠️ ENHETEN KAN VARA UTSKRIVEN — `30 meter` gick ogranskat i runda 112.
    for m in re.finditer(
            r"(\d+(?:,\d+)?)\s*(cm|mm|kg|liter\b|meter\b|m\b|°C|grader\b|dB\b|"
            r"kWh|W\b|V\b|Hz|ml\b)", utan_syskon):
        if m.group(1) not in kanda:
            i = max(0, m.start() - 40)
            fel.append(f"OHÄRLETT TAL {m.group(0)!r}: …{utan_syskon[i:m.end() + 30]}…")

    # ── Struktur ─────────────────────────────────────────────────────────────
    for f in FLIKAR:
        if f"<h2>{f}</h2>" not in html:
            fel.append(f"rubriken {f!r} saknas")
    if re.search(r"<strong>[^<]*\?</strong>[^<]", html):
        fel.append("FAQ-fråga och svar sitter i samma <p>")
    if "<br" in html:
        fel.append("<br> i texten — Wix strippar den")
    if KOMMALISTA.search(txt):
        fel.append(f"kommalista av tal: {KOMMALISTA.search(txt).group(0)!r}")
    ms = [m.strip() for m in re.split(r"(?<=[.!?])\s+", txt) if len(m.strip()) > 45]
    for m in ms:
        if ms.count(m) > 1:
            fel.append(f"upprepad mening: {m[:60]!r}")
            break
    # Länkar ska peka på rundans egna slugs ELLER den publicerade syskonsidan.
    kanda_slugs = set(T.SLUG.values()) | {matt.SYSKON["slug"]}
    for slug in re.findall(r'href="https://www\.fyndplats\.se/produkt/([a-z0-9-]+)"', html):
        if slug not in kanda_slugs:
            fel.append(f"länk till okänd slug {slug!r}")
    return fel


def _sjalvtest():
    """☠️ Varje grind provas mot sin egen bugg — och bara mot den."""
    fall = [
        ("tystlöfte", "480849a7", "Det är en kompressorkyl",
         "Den är helt tyst. Det är en kompressorkyl", "TYSTLÖFTE"),
        ("frys som kylskåp", "b2c76518", "Termostatvredet har fem lägen",
         "Ett smidigt kylskåp. Termostatvredet har fem lägen", "FRYS SÅLD SOM KYLSKÅP"),
        ("tvåzonslöfte", "fdbfcea0", "Kompressorn håller",
         "Två zoner ingår. Kompressorn håller", "TVÅZONSLÖFTE"),
        ("snålhetslöfte", "15d30e23", "Kompressorn håller",
         "Den är energisnål. Kompressorn håller", "SNÅLHETSLÖFTE"),
        ("leverantör", "9a33e15f", "Termostatvredet har fem lägen",
         "Enligt leverantören. Termostatvredet har fem lägen", "LEVERANTÖRSATTRIBUTION"),
        ("jargong", "9a33e15f", "Termostatvredet har fem lägen",
         "Rundans bästa. Termostatvredet har fem lägen", "INTERN JARGONG"),
        ("ohärlett tal", "9a33e15f", "Termostatvredet har fem lägen",
         "Skåpet väger 99 kg. Termostatvredet har fem lägen", "OHÄRLETT TAL"),
        ("fel skåptyp", "8cfe5171", "Termostatvredet har fem lägen",
         "Dörren är en glasdörr. Termostatvredet har fem lägen", "FEL SKÅPTYP"),
        ("60 Hz tillbaka", "47a91a17", "Kompressorn håller",
         "Skåpet går på 50 Hz. Kompressorn håller", "UTELÄMNAT FÄLT"),
        ("R600 tillbaka", "fdbfcea0", "Kompressorn håller",
         "Köldmedium R600a används. Kompressorn håller", "UTELÄMNAT FÄLT"),
        ("kommalista", "9a33e15f", "Termostatvredet har fem lägen",
         "Måtten är 10, 20 och 30 cm. Termostatvredet har fem lägen", "kommalista"),
    ]
    fel = 0
    for etikett, k, gammal, ny, vantat in fall:
        d = dict(T.bygg(k))
        assert gammal in d["html"], f"ankaret {gammal!r} finns inte i {k}"
        d["html"] = d["html"].replace(gammal, ny, 1)
        traff = [x for x in granska(k, d) if vantat in x]
        if not traff:
            print(f"  SJÄLVTEST FEL {etikett}: ingen {vantat}")
            fel += 1
    # ☠️ NEGATIONSREGELN ÅT BÅDA HÅLLEN. Den finns för att släppa igenom
    #    "blir aldrig helt ljudlös" — men om den släpper igenom ALLT är
    #    löftesgrindarna avstängda utan att något självtest märker det.
    for etikett, txt_, ska_falla in [
            ("negerat tystlöfte", "Skåpet blir aldrig helt tyst i ett rum.", False),
            ("rakt tystlöfte", "Skåpet är helt tyst i ett rum.", True),
            ("negerat tvåzon", "Vill du ha två zoner har den här inte det.", False),
            ("rakt tvåzon", "Skåpet har två zoner för rött och vitt.", True)]:
        monster = TYSTLOFTE if "tyst" in etikett else TVAZONSLOFTE
        traff = loftestraff(monster, txt_) is not None
        if traff != ska_falla:
            print(f"  SJÄLVTEST FEL {etikett}: fällde={traff}, väntat={ska_falla}")
            fel += 1

    # ☠️ OCH ÅT ANDRA HÅLLET: energiklassgrinden måste fälla när klassen tas bort.
    d = dict(T.bygg("15d30e23"))
    d["html"] = d["html"].replace("energiklass G", "bra klass").replace(
        "Energiklass", "Klass").replace("A till G", "skalan")
    if not [x for x in granska("15d30e23", d) if "ENERGIKLASSEN saknas" in x]:
        print("  SJÄLVTEST FEL energiklass: grinden fäller inte när klassen tas bort")
        fel += 1
    if not [x for x in granska("15d30e23", d) if "ENERGISKALAN saknas" in x]:
        print("  SJÄLVTEST FEL energiskala: grinden fäller inte när skalan tas bort")
        fel += 1
    print(f"självtest: {len(fall) + 6} fall, {fel} fel")
    return fel


if __name__ == "__main__":
    if _sjalvtest():
        sys.exit(2)
    tot = 0
    for k in matt.WIX:
        f = granska(k, T.bygg(k))
        tot += len(f)
        print(f"{'OK ' if not f else 'FEL'} {k}  {matt.GRUPPER[k]}  {T.SLUG[k]}")
        for x in f:
            print("      ✗", x)
    print("\nSKU:")
    mek = {}
    for k in matt.WIX:
        m = G.sku_bas(T.SLUG[k])
        mek.setdefault(m, []).append(k)
        print(f"  {k}  {T.SKU[k]:<26} mekanisk regel hade gett  FP-{m}")
    krockar = {m: ks for m, ks in mek.items() if len(ks) > 1}
    print(f"  mekaniska krockar: {len(krockar)} {krockar}")
    print(f"  handgjorda unika:  {len(set(T.SKU.values()))} av {len(T.SKU)}")
    print(f"\n{len(matt.WIX)} sidor, {tot} fel totalt")
    sys.exit(0 if tot == 0 else 1)
