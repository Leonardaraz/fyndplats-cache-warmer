# -*- coding: utf-8 -*-
"""Runda 112 — grinden. Nio sidor, fem konstruktioner.

☠️ TVÅ TONGRINDAR ÄRVS FRÅN RUNDA 111, och de ärvs för att de kostade fyra fel
   som nådde Wix: `leverantören` (mot kunden är VI leverantören) och `rundan`
   (vårt ord för en arbetsomgång, inte kundens). Båda stod redan i runbokens
   Steg 12; ingen av dem stod i en textgrind förrän runda 111.

☠️ TRE GRINDAR ÄR RUNDANS EGNA, och alla tre har en KÄLLA i leverantörens text
   som de finns för att hindra oss att upprepa:

   MORKLAGGNING   fyra av nio: "Dreischichtiges Material blockiert Licht und
                  dient auch als Verdunkelungsvorhang". En projektorduk är
                  ingen mörkläggningsgardin.
   UPPLOSNING     "4K/8K", "Ultra HD", "HD Ready" — en duk har ingen
                  upplösning. Skärpan kommer ur projektorn kunden äger.
                  `77e4a558`s hjältebild bar dessutom påståendet i PIXLARNA.
   BILDYTA        varje sida MÅSTE bära både dukmåttet och den synliga
                  bildytan. Att bara skriva det ena är att välja vilket tal
                  kunden mäter sin vägg mot.
"""
import os, re, sys

HAR = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, os.path.join(HAR, ".."))
import grindar as G                                            # noqa: E402
sys.path.insert(0, HAR)
import matt                                                    # noqa: E402
import texter as T                                             # noqa: E402

# ── Rundans egna löftesgrindar ───────────────────────────────────────────────
MORKLAGGNING = re.compile(
    r"(mörklägg\w*|förmörk\w*|blockerar\s+(ljus|solljus|dagsljus)"
    r"|som\s+en\s+gardin|gardin\b|ljustät\w*|helt\s+tät\w*)", re.I)
UPPLOSNING = re.compile(
    r"(\b[48]\s?K\b|ultra\s*hd|hd\s*ready|full\s*hd|1080p?\b"
    r"|dukens\s+upplösning|upplösning\s+på\s+duken)", re.I)
# ⚠️ `160 grader` är leverantörens tal om ytans betraktningsvinkel. Det är inte
#    fel — men det är oprövbart för kunden, och som LÖFTE ("syns lika bra från
#    alla håll") är det ett påstående vi inte kan stå för.
VINKELLOFTE = re.compile(
    r"(syns\s+lika\s+bra\s+från\s+alla|från\s+vilken\s+vinkel\s+som\s+helst"
    r"|perfekt\s+bild\s+från\s+sidan)", re.I)

TONGRINDAR = (
    ("LEVERANTÖRSATTRIBUTION",
     re.compile(r"\bleverant[öo]r(?:en|ens|er|ers)?\b", re.I)),
    ("INTERN JARGONG", re.compile(r"\brundan?s?\b", re.I)),
)

FORBJUDET = [
    ("tyskt ord", re.compile(
        r"\b(Leinwand|Beamer|Projektionsleinwand|Verdunkelungsvorhang|"
        r"Fernbedienung|Bildschirm|Stativ(?:e|beine)|Bodenpfähle|Seile|"
        r"Motorleinwand|Netzstoff|Kunststoff|Metallgehäuse|Weiß|Schwarz|"
        r"Wandmontage|Deckenmontage|Lieferumfang|Abmessungen)\b")),
    ("husmärke", re.compile(r"\b(PawHut|HOMCOM|Outsunny|Aiyaplay|Vinsetto|Aosom)\b", re.I)),
    ("lagerland", re.compile(r"Skickas fr[åa]n\s+(Tyskland|Polen|Spanien|Kina)", re.I)),
    ("artikelnummer", G.ARTNR),
    ("trasig relativ länk", re.compile(r"https:/produkt")),
]

# Materialord per produkt — sex material på nio sidor, så en delad lista hade
# fällt korrekta sidor och släppt igenom fel material.
MATERIALORD = {k: [o.lower() for o in matt.MATERIAL[k]] for k in matt.MATERIAL}
# ☠️ Grupp A är polyester och aluminium; ordet PLAST får inte stå där, och
#    grupp B/C är plast — där får ordet POLYESTER inte stå.
FORBJUDET_ORD = {
    "1b87909f": re.compile(r"\b(plast|nätväv)\b", re.I),
    "422ab1bd": re.compile(r"\b(polyester|nätväv)\b", re.I),
    "a8c82049": re.compile(r"\b(polyester|nätväv)\b", re.I),
    "ddca577d": re.compile(r"\b(polyester|nätväv)\b", re.I),
    "77d2b35c": re.compile(r"\b(polyester|nätväv)\b", re.I),
    "623b6504": re.compile(r"\b(polyester|plastduk)\b", re.I),
    "77e4a558": re.compile(r"\b(polyester|plastduk)\b", re.I),
}

FLIKAR = ["Tekniska specifikationer", "Användning och skötsel", "Vanliga frågor"]
# ☠️ Sifferstil: en kommalista av tal med enheten sist. Mellanslaget efter
#    kommat är skiljetecknet — utan det fälls varje decimaltal i katalogen.
KOMMALISTA = re.compile(r"\d+(?:,\d+)?, \d")


def granska(nyckel, d):
    fel = []
    html = d["html"]
    txt = G.synlig_meningstext(html)
    allt = " ".join([d["namn"], d["titel"], d["meta"], html])
    tum, form, b, h, vikt, paket, pris = matt.RUNDAN[nyckel]

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
    if not d["namn"].lower().startswith("projektorduk"):
        fel.append("namnet börjar inte med fokussökordet")

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
    for etikett, monster in (("MÖRKLÄGGNINGSLÖFTE", MORKLAGGNING),
                             ("UPPLÖSNINGSLÖFTE", UPPLOSNING),
                             ("VINKELLÖFTE", VINKELLOFTE)):
        m = monster.search(allt)
        if m:
            i = max(0, m.start() - 50)
            fel.append(f"{etikett}: …{allt[i:m.end() + 50]}…")

    # ── Material ─────────────────────────────────────────────────────────────
    for ord_ in MATERIALORD[nyckel]:
        if ord_ not in txt.lower():
            fel.append(f"nämner inte sitt material {ord_!r}")
    if nyckel in FORBJUDET_ORD:
        m = FORBJUDET_ORD[nyckel].search(txt)
        if m:
            fel.append(f"FEL MATERIAL på sidan: {m.group(0)!r}")

    # ── ☠️ Rundans signaturkontroll: BÅDA måtten måste stå på sidan ──────────
    dukstr = "%s × %s cm" % (T.tal(b), T.tal(h))
    bildstr = "%s × %s cm" % (T.tal(matt.BILDYTA[nyckel][0]),
                              T.tal(matt.BILDYTA[nyckel][1]))
    if dukstr not in txt:
        fel.append(f"dukmåttet {dukstr} står inte på sidan")
    if bildstr not in txt:
        fel.append(f"bildytan {bildstr} står inte på sidan")
    if f"{T.tal(tum)} tum" not in txt:
        fel.append(f"tumtalet {T.tal(tum)} står inte på sidan")

    # ── Mått och tal: allt som ser ut som ett mått måste vara härlett ────────
    #
    # ☠️ SYSKONRADEN BÄR EN ANNAN PRODUKTS TAL, och den fällde fem korrekta
    #    sidor: "samma motorduk i 85 tum" är ett riktigt påstående om ett
    #    riktigt syskon, inte ett ohärlett tal om den här varan. Raden stryks
    #    därför före talkontrollen — precis som runda 111 fick stryka butikens
    #    rekommendationsrad, och av exakt samma skäl.
    #
    # ☠️ MED EN KONTROLLMÄTNING PÅ STRYKNINGEN SJÄLV. En strykning som åt för
    #    mycket hade gjort "noll ohärledda tal" meningslöst: den hade tagit bort
    #    talen i stället för att godkänna dem. Kravet är att sidans EGET
    #    dukmått fortfarande står kvar efteråt.
    syskon_slug = T.SLUG[T.SYSKON[nyckel][0]]
    utan_syskon = re.sub(r"Finns också som [^.]*\.", "", txt)
    if len(utan_syskon) < len(txt) - 140:
        fel.append("KONTROLLMÄTNINGEN FALLER — strykningen av syskonraden åt för mycket")
    if dukstr not in utan_syskon:
        fel.append("KONTROLLMÄTNINGEN FALLER — syskonstrykningen tog sidans eget mått")

    kanda = {T.tal(x) for x in (tum, b, h, vikt) }
    kanda |= {T.tal(x) for x in matt.BILDYTA[nyckel]}
    kanda |= {T.tal(x) for x in paket}
    if nyckel in matt.NAT:
        kanda |= {T.tal(x) for x in matt.NAT[nyckel]}
    if nyckel in matt.SVARTKANT:
        kanda.add(T.tal(matt.SVARTKANT[nyckel]))
    if nyckel in matt.RAMOPPNING:
        kanda |= {T.tal(x) for x in matt.RAMOPPNING[nyckel]}
    kanda |= set(re.findall(r"\d+(?:,\d+)?", matt.YTTRE[nyckel]))
    # ☠️ OCH UR `UNIKT`, produktens egna mätta leverantörsuppgifter. Ett första
    #    utkast lät `30` och `2,1` stå i en FRI LISTA i stället — och en fri
    #    lista är precis vad grinden finns för att slippa: talet såg härlett ut
    #    för att det stod i grindens undantag, inte för att det stod i mätningen.
    kanda |= set(re.findall(r"\d+(?:,\d+)?", matt.UNIKT[nyckel]))
    # Format och rena räkneord får stå fritt.
    kanda |= {"1", "2", "3", "4"}
    # ☠️ ENHETEN KAN VARA UTSKRIVEN. Uppmätt i Steg 12: `upp till 30 meter` och
    #    `kabeln 2,1 meter` gick genom grinden helt OGRANSKADE, eftersom
    #    alternationen bara tog `m\b`. Två tal i kundtexten som ingen regel såg.
    for m in re.finditer(r"(\d+(?:,\d+)?)\s*(cm|mm|kg|tum|meter\b|m\b|V\b|W\b|Hz)",
                         utan_syskon):
        if m.group(1) not in kanda:
            i = max(0, m.start() - 40)
            fel.append(f"OHÄRLETT TAL {m.group(0)!r}: …{utan_syskon[i:m.end() + 30]}…")

    # ── Elsäkerhet: bara de motoriserade får nämna volt ──────────────────────
    namner_nat = bool(re.search(r"\b230\s*V\b", txt))
    if namner_nat != (nyckel in matt.NAT):
        fel.append(f"nätdrift={nyckel in matt.NAT} men texten nämner 230 V="
                   f"{namner_nat}")

    # ── Struktur ─────────────────────────────────────────────────────────────
    for f in FLIKAR:
        if f"<h2>{f}</h2>" not in html:
            fel.append(f"rubriken {f!r} saknas")
    # ☠️ Wix strippar <br>: fråga och svar ska vara två <p>.
    if re.search(r"<strong>[^<]*\?</strong>[^<]", html):
        fel.append("FAQ-fråga och svar sitter i samma <p>")
    if KOMMALISTA.search(txt):
        fel.append(f"kommalista av tal: {KOMMALISTA.search(txt).group(0)!r}")
    # Upprepade meningar inom sidan
    ms = [m.strip() for m in re.split(r"(?<=[.!?])\s+", txt) if len(m.strip()) > 45]
    for m in ms:
        if ms.count(m) > 1:
            fel.append(f"upprepad mening: {m[:60]!r}")
            break
    # Syskonlänken ska peka på en slug som finns i rundan
    for slug in re.findall(r'href="https://www\.fyndplats\.se/produkt/([a-z0-9-]+)"', html):
        if slug not in T.SLUG.values():
            fel.append(f"syskonlänk till okänd slug {slug!r}")
    return fel


def _sjalvtest():
    """☠️ Varje grind provas mot sin egen bugg — och bara mot den."""
    fall = [
        ("mörkläggning", "ddca577d", "Ytan är slät",
         "Ytan är slät och duken mörklägger rummet", "MÖRKLÄGGNINGSLÖFTE"),
        ("upplösning 4K", "ddca577d", "Ytan är slät",
         "Ytan är slät och klarar 4K Ultra HD", "UPPLÖSNINGSLÖFTE"),
        ("leverantör", "ddca577d", "Ytan är slät",
         "Ytan är slät enligt leverantören", "LEVERANTÖRSATTRIBUTION"),
        ("jargong", "ddca577d", "Ytan är slät",
         "Ytan är slät och rundans bästa", "INTERN JARGONG"),
        ("ohärlett tal", "ddca577d", "Ytan är slät",
         "Ytan är slät och väger 99 kg", "OHÄRLETT TAL"),
        ("fel material", "ddca577d", "Ytan är slät",
         "Ytan är slät polyester", "FEL MATERIAL"),
        ("kommalista", "ddca577d", "Ytan är slät",
         "Måtten är 10, 20 och 30 cm", "kommalista"),
    ]
    fel = 0
    for etikett, k, gammal, ny, vantat in fall:
        d = dict(T.bygg(k))
        assert gammal in d["html"], f"ankaret {gammal!r} finns inte"
        d["html"] = d["html"].replace(gammal, ny, 1)
        traff = [x for x in granska(k, d) if vantat in x]
        if not traff:
            print(f"  SJÄLVTEST FEL {etikett}: ingen {vantat}")
            fel += 1
    print(f"självtest: {len(fall)} fall, {fel} fel")
    return fel


if __name__ == "__main__":
    if _sjalvtest():
        sys.exit(2)
    tot = 0
    for k in matt.RUNDAN:
        f = granska(k, T.bygg(k))
        tot += len(f)
        print(f"{'OK ' if not f else 'FEL'} {k}  {matt.GRUPPER[k]}  {T.SLUG[k]}")
        for x in f:
            print("      ✗", x)
    # ☠️ SKU-kapning: fem slugs börjar `projektorduk-84-tum`. Kontrollera att de
    #    handgjorda SKU:erna verkligen är unika, och att den MEKANISKA regeln
    #    hade krockat — annars vet vi inte om undantaget behövdes.
    print("\nSKU:")
    mek = {}
    for k in matt.RUNDAN:
        m = G.sku_bas(T.SLUG[k])
        mek.setdefault(m, []).append(k)
        print(f"  {k}  {T.SKU[k]:<32} mekanisk regel hade gett  FP-{m}")
    krockar = {m: ks for m, ks in mek.items() if len(ks) > 1}
    print(f"  mekaniska krockar: {len(krockar)} "
          f"{ {m: ks for m, ks in krockar.items()} }")
    print(f"  handgjorda unika:  {len(set(T.SKU.values()))} av {len(T.SKU)}")
    print(f"\n{len(matt.RUNDAN)} sidor, {tot} fel totalt")
    sys.exit(0 if tot == 0 else 1)
