# -*- coding: utf-8 -*-
"""Runda 100 — mekanisk grind mot texterna i filen.

☠️ REGEL 1: INGEN SIDA SÄGER NÅGOT OM LEVERANS. Fyra av sex tyska texter bär
   "Wir liefern Ihnen den Artikel kostenfrei bis Bordsteinkante". Det är ett
   villkor som gäller MOT OSS. Samma klass som "leverantören anger…": sant i
   en annan mun, ett löfte i vår. Grinden är en ordlista över LÖFTEN, inte över
   ordet "levereras" — "Levereras omonterat" och "Bordet levereras ensamt" ska
   passera, och gör det.

☠️ REGEL 2 ÄR DEN HÄR RUNDANS EGEN OCH TVÅVÄGS: FAST ELLER UTDRAGBART.
   Ett utdragbart bord måste namnge BÅDA längderna i namn, titel OCH meta —
   det är precis där `c71418ca`:s spec-rad ljuger ("220L" på ett bord som är
   160/220). Ett bord med fast längd får inte bära ett enda utdragningsord.
   Ytan är PROSAN före syskonlistan: korslänkarna namnger med rätta den andra
   gruppens bord, och en regel som läste dem hade fällt varenda sida.

☠️ REGEL 3: MAXLASTEN ÄR PER BORD. 50 / 50 / 80 / 50 / 70 / 70 kg på sex bord
   i samma runda. Grinden kräver det egna talet och FÖRBJUDER de andras.

☠️ REGEL 4: STOLARNA INGÅR INTE. Varenda miljöbild visar bordet dukat med
   stolar; noll av de sex tyska texterna säger att de inte ingår.

☠️ REGEL 5: SITTPLATSANTALET PUBLICERAS BARA DÄR DET GÅR ATT VETA.
   `e71acc53` säger både sex och fyra personer i samma stycke; `4249df4d`
   säger ingenting alls. Båda skriver skivans mått i stället. De fyra andra
   MÅSTE ange sitt tal. Tvåvägs.

☠️ REGEL 6: FÖTTERNA SKRIVS BARA DÄR UNDERLAGET SÄGER DET, och rätt sort.
   `e71acc53` nämner ingenting om fötterna — STEG4-5.md skrev först "alla sex"
   på en fot som syntes på ett SYSKONS närbild. Justerbar och halkfri är inte
   samma sak och får inte bytas mot varandra.

☠️ REGEL 7: ANVISNINGEN. Fem har "1 x Handbuch/Anleitung" i Lieferumfang.
   `4249df4d` har det inte och får därför inte lova någon.

☠️ REGEL 8: TRÄUTSEENDE ÄR INTE TRÄ. `f806eebf` är WPC, `29c688dc` är plast
   med tryckt ådring. Samma regel som MDF aldrig är "massivt trä" (#259).
   Ytan är prosan MINUS FAQ-frågorna: frågan "Är skivan i trä?" är själva
   grinden i kundtext och får inte fälla sin egen sida.
"""
import re
import sys

import texter as T

SLUGGAR = set(T.SLUGG.values())
for _lista in T.PUBLICERADE.values():
    SLUGGAR |= {s for s, _ in _lista}

# ---------------------------------------------------------------- ordlistor

# ☠️ REGEL 1 — löften om leverans, inte ordet "levereras".
LEVERANS = [
    r"trottoarkant", r"bordsteinkante", r"kantsten",
    r"fri(tt)?\s+frakt", r"fraktfri", r"gratis\s+(frakt|leverans)",
    r"kostnadsfri\w*\s+leverans", r"fri\s+leverans", r"hemleverans",
    r"levereras\s+(till|hem|fritt|kostnadsfritt)", r"leveranstid",
    r"leveransvillkor", r"leverans till dörren", r"bärhjälp",
]

FORBJUDET = [
    (r"aosom|outsunny|homcom|pawhut|vinsetto|aiyaplay", "leverantör/husmärke"),
    (r"leverantör|tillverkar|fabrikant|importör",
     "mot kunden är VI leverantören"),
    (r"tyskland|spanien|polen|kina|skickas från", "avsändarland"),
    (r"gartentisch|esstisch|terrassentisch|lattenrost|sicherheitsglas|"
     r"polyrattan\b|verstellbar|hinweis|gesamtabmessungen|st[üu]hle|"
     r"ausziehbar|schmetterling", "tyska"),
    (r"\b\d{2,3}[A-Za-z]?-\d{3,4}[A-Za-z]{0,3}\b", "artikelnummer"),
    (r"artikelnummer|modellreferens|artikelnr", "artikelnummer som etikett"),
    (r"[\U0001F300-\U0001FAFF☀-➿]", "emoji i kundtext"),
    (r"runda \d|steg \d", "intern jargong (#318)"),
    (r"\b\d[\d\s]*\s?(kr|kronor|:-)\b", "pris i kundtext"),
]

# ☠️ REGEL 2 — utdragningsord. Får inte finnas i prosan på ett fast bord.
UTDRAG = (r"utdragbar|utdraget|dras\s+ut|drar\s+ut|hopskjut|il[äa]ggsskiv|"
          r"fj[äa]rilsmekanism|f[öo]rl[äa]ng(er|s|ning)")

# ☠️ REGEL 5 — ett publicerat sittplatsantal.
SITTORD = (r"\b(tv[åa]|tre|fyra|fem|sex|sju|[åa]tta|nio|tio)\s+"
           r"(personer|kuvert|sittplatser|g[äa]ster|stolar)\b"
           r"|\bplats f[öo]r\s+(tv[åa]|tre|fyra|fem|sex|sju|[åa]tta)\b"
           r"|\btar\s+(tv[åa]|tre|fyra|fem|sex|sju|[åa]tta)\s+kuvert\b")

# ☠️ REGEL 6 — fotord.
FOTORD = r"\bf[öo]t(ter|terna)\b|\bfoten\b|\bjusterbar\w*\b|\bhalkfri\w*\b"

# ☠️ REGEL 7 — löfte om en anvisning i lådan.
ANVISNINGSORD = r"bruksanvisning|anvisning|manual|monteringsguide"

# ☠️ REGEL 8 — påstående om att skivan är trä. Mönstret är AVSIKTLIGT smalt:
#    en jämförelse ("som en obehandlad träskiva gör") är inte ett påstående om
#    den här skivan, och en regel som fäller jämförelsen tvingar fram en sämre
#    text i stället för en sannare.
TRAPASTAENDE = (r"massivt\s+tr[äa]\b|skiva[nr]?\s+(?:är|i)\s+tr[äa]\b|"
                r"bordsskiva\s+i\s+tr[äa]\b|skiva[nr]?\s+i\s+massivt")

# Materialord som MÅSTE stå på de två träimitationssidorna.
MATERIALKRAV = {
    "f806eebf": [(r"\bwpc\b", "WPC"), (r"tr[äa]komposit", "träkomposit")],
    "29c688dc": [(r"\bplast\b", "plast"), (r"tr[äa][åa]dring", "träådring")],
}

# ⚠️ Tal som INTE står i spec-tabellen men ändå är riktiga. Varje rad är en
#    motivering; en tom motivering är inte tillåten.
EXTRA_EGNA = {
    "e71acc53": {"60": "tumregel: cm bordskant per kuvert"},
    "f806eebf": {},
    "4249df4d": {"60": "tumregel: cm bordskant per kuvert"},
    "29c688dc": {},
    "74d3c11c": {},
    "c71418ca": {"60": "utdragets längd, 220 − 160 cm"},
}

# ☠️ EN PÅSTÅENDE-GRIND MÅSTE KUNNA SKILJA ETT PÅSTÅENDE FRÅN ETT FÖRNEKANDE.
#    Ärvd ordagrant från runda 99, och den behövs direkt: "Teaktonen är en
#    tryckt ådring och inte massivt trä" är MOTSATSEN till felet regel 8 finns
#    för att stoppa. Hjälparen bor på ETT ställe och delas av alla regler.
NEKANDE = r"(?:inte|inget|ingen|inga|aldrig|utan|varken)\b[^.]{0,24}$"


def positiv(monster, text):
    """Första träffen på `monster` som INTE föregås av en nekning i meningen."""
    for tr in re.finditer(monster, text, re.I):
        if re.search(NEKANDE, text[max(0, tr.start() - 40):tr.start()], re.I):
            continue
        return tr
    return None


def tal_i(txt):
    return set(re.findall(r"\d+(?:[,.]\d+)?", txt))


def vitlista(pid):
    ut = set()
    for k, v in T.SPEC[pid]:
        ut |= tal_i(v)
    ut |= set(EXTRA_EGNA[pid])
    for _, kortnamn in T.SYSKON[pid]:      # korslänkarnas egna tal
        ut |= tal_i(kortnamn)
    return ut


def synlig(h):
    return re.sub(r"\s+", " ", re.sub(r"<[^>]+>", " ", h)).strip()


def lasform(h):
    """Inline-taggar bort UTAN blanksteg — se runda 96:s lärdom."""
    h = re.sub(r"</?(?:a|span|strong|em|b|i)\b[^>]*>", "", h)
    return re.sub(r"\s+", " ", re.sub(r"<[^>]+>", " ", h)).strip()


SYSKONRUBRIK = "<h2>Fler bord för uteplatsen"


def ytor(h):
    """Tre ytor, och skillnaden mellan dem är hela poängen.

    kropp     = allt utom syskonlistan
    prosa     = kropp utan <ul> — listorna är GENERERADE ur just de fält
                reglerna ska kontrollera, så en regel som läser dem mäter sin
                egen källa och fäller aldrig (runda 99).
    pastaende = prosa utan FAQ-FRÅGORNA. Frågan "Är skivan i trä?" är själva
                grinden formulerad i kundtext och får inte fälla sin egen sida.
    """
    fore = h.split(SYSKONRUBRIK)[0]
    kropp = lasform(fore)
    utan_listor = re.sub(r"<ul>.*?</ul>", " ", fore, flags=re.S)
    prosa = lasform(utan_listor)
    pastaende = lasform(re.sub(r"<p><strong>[^<]*</strong></p>", " ",
                               utan_listor))
    return kropp, prosa, pastaende


def granska(pid, h, namn, titel, meta):
    f = []
    txt = lasform(h)
    allt = (txt + " " + namn + " " + titel + " " + meta).lower()
    kropp, prosa, pastaende = ytor(h)
    spec = dict(T.SPEC[pid])

    # 1 — leveranslöften
    for m in LEVERANS:
        tr = re.search(m, allt)
        if tr:
            f.append("LEVERANSLÖFTE %r — regel 1" % tr.group(0))

    # 2 — förbjudna ord
    for m, vad in FORBJUDET:
        tr = re.search(m, allt)
        if tr:
            f.append("%s: %r" % (vad, tr.group(0)))

    # ☠️ Dubbelt blanksteg mäts på RÅ html — lasform() normaliserar bort just
    #    det den letar efter (runda 98).
    if re.search(r"(?<!>)  (?!<)", re.sub(r"<[^>]+>", "", h)):
        f.append("dubbelt blanksteg i brödtexten")

    # ☠️ Kommalista av tal med enheten sist. Skiljetecknet är MELLANSLAGET:
    #    listkommat har alltid ett efter sig, decimalkommat aldrig.
    for vad, yta in (("brödtext", re.sub(r"<[^>]+>", " ", h)),
                     ("namn", namn), ("seo-titel", titel), ("meta", meta)):
        tr = re.search(r"\d+(?:,\d+)?, \d", yta)
        if tr:
            f.append("kommalista av tal i %s: %r" % (vad, tr.group(0)))

    # 3 — ohärledda tal
    vit = vitlista(pid)
    for tal in tal_i(txt + " " + namn + " " + titel + " " + meta):
        if tal not in vit:
            f.append("ohärlett tal %r (står inte i spec och inte i EXTRA)" % tal)

    # ---------------------------------------------- REGEL 2: fast/utdragbart
    if T.GRUPP[pid] == "U":
        kort = spec["Mått hopskjutet"].split(" ×")[0]
        lang = spec["Mått utdraget"].split(" ×")[0]
        for vad, yta in (("namn", namn), ("seo-titel", titel), ("meta", meta)):
            saknas = [x for x in (kort, lang) if x not in yta]
            if saknas:
                f.append("utdragbart bord: %s saknar längden %s (regel 2)"
                         % (vad, "/".join(saknas)))
        if not re.search(UTDRAG, prosa, re.I):
            f.append("utdragningen beskrivs inte i prosan (regel 2)")
        for x in (kort, lang):
            if x not in prosa:
                f.append("längden %r saknas i prosan (regel 2)" % x)
    else:
        tr = positiv(UTDRAG, prosa)
        if tr:
            f.append("utdragningsord %r på ett bord med fast längd (regel 2)"
                     % tr.group(0))

    # ---------------------------------------------------- REGEL 3: maxlasten
    egen = "%d kg" % T.MAXLAST[pid]
    if egen not in kropp:
        f.append("den egna maxlasten %r står inte i texten (regel 3)" % egen)
    for annan in sorted(set(T.MAXLAST.values()) - {T.MAXLAST[pid]}):
        if re.search(r"\b%d kg" % annan, kropp):
            f.append("främmande maxlast '%d kg' i texten (regel 3)" % annan)

    # ------------------------------------------------------- REGEL 4: stolar
    if not re.search(r"stolar(na)?[^.]{0,60}ing[åa]r inte", txt, re.I):
        f.append("sidan säger inte att stolarna inte ingår (regel 4)")

    # -------------------------------------------------- REGEL 5: sittplatser
    tr = positiv(SITTORD, kropp)
    if T.SITTPLATSER[pid] is None:
        if tr:
            f.append("sittplatsantal %r på en sida utan underlag (regel 5)"
                     % tr.group(0))
    elif not tr:
        f.append("sittplatsantalet saknas i texten (regel 5)")

    # ------------------------------------------------------- REGEL 6: fötter
    tr = positiv(FOTORD, kropp)
    if T.FOTTER[pid] is None:
        if tr:
            f.append("fotpåstående %r utan underlag (regel 6)" % tr.group(0))
    else:
        vantat = T.FOTTER[pid][:-1]          # "justerbara" -> "justerbar"
        fel = {"justerbara": "halkfri", "halkfria": "justerbar"}[T.FOTTER[pid]]
        if not re.search(vantat, kropp, re.I):
            f.append("fötterna beskrivs inte som %r (regel 6)" % T.FOTTER[pid])
        if re.search(fel, kropp, re.I):
            f.append("fel sorts fot (%r) på sidan (regel 6)" % fel)

    # ---------------------------------------------------- REGEL 7: anvisning
    tr = positiv(ANVISNINGSORD, kropp)
    if T.ANVISNING[pid]:
        if not tr:
            f.append("anvisningen nämns inte (regel 7)")
    elif tr:
        f.append("lovar en anvisning som inte ingår: %r (regel 7)" % tr.group(0))

    # ------------------------------------------------------- REGEL 8: trä
    if pid in MATERIALKRAV:
        tr = positiv(TRAPASTAENDE, pastaende)
        if tr:
            f.append("skivan påstås vara trä: %r (regel 8)" % tr.group(0))
        for m, vad in MATERIALKRAV[pid]:
            if not re.search(m, kropp, re.I):
                f.append("materialordet %r saknas (regel 8)" % vad)

    # 9 — måttet är bordets eget
    matt = spec.get("Mått") or spec["Mått utdraget"]
    if matt not in kropp:
        f.append("måttet %r står inte i texten" % matt)

    # 10 — spec-tabellen ska stå ordagrant i html
    for k, v in T.SPEC[pid]:
        if ("<strong>%s:</strong> %s" % (k, v)) not in h:
            f.append("spec-raden %r saknas eller avviker" % k)

    # 11 — länkar
    for href in re.findall(r'href="([^"]+)"', h):
        if not href.startswith(T.BAS):
            f.append("icke-absolut länk %r" % href)
            continue
        slug = href[len(T.BAS):]
        if slug not in SLUGGAR:
            f.append("länk till okänd slug %r" % slug)
        if slug == T.SLUGG[pid]:
            f.append("länkar till sig själv")

    # 12 — längder
    if len(namn) > 80:
        f.append("namnet är %d tecken (max 80)" % len(namn))
    if len(titel) > 60:
        f.append("seo-titeln är %d tecken" % len(titel))
    if titel.strip() == namn.strip():
        f.append("seo-titeln är identisk med namnet")
    if not (110 <= len(meta) <= 165):
        f.append("meta är %d tecken (110–165)" % len(meta))

    # 13 — sökordet ska stå i namn och meta
    huvud = "trädgårdsbord"
    if huvud not in namn.lower() or huvud not in meta.lower():
        f.append("sökordet %r saknas i namn eller meta" % huvud)

    # 14 — struktur
    for rubrik in ("Tekniska specifikationer", "Användning och skötsel",
                   "Vanliga frågor"):
        if ("<h2>%s</h2>" % rubrik) not in h:
            f.append("rubriken %r saknas" % rubrik)
    return f


# ------------------------------------------------------------- självtest

def _utan_utdrag(h):
    """Tar bort VARJE bärare av utdragningen ur prosan — en mutation som
    lämnar en kvar testar ingenting (runbokens regel)."""
    for a, b in (("Dras ut från", "Mäter"), ("dras ut", "öppnas"),
                 ("drar ut", "öppnar"), ("drar isär", "delar"),
                 ("utdraget", "i stort läge"), ("Utdraget", "I stort läge"),
                 ("utdragbart", "stort"), ("Utdragbart", "Stort"),
                 ("hopskjutet", "i litet läge"), ("Hopskjutet", "I litet läge"),
                 ("iläggsskivan", "mittdelen"), ("Iläggsskivan", "Mittdelen"),
                 ("iläggsskiva", "mittdel"),
                 ("fjärilsmekanism", "gångjärn"), ("Fjärilsmekanismen", "Gångjärnet")):
        h = h.replace(a, b)
    return h


def _utan_stolar(h):
    return h.replace(T._ENSAM, "Bordet levereras i en kartong") \
            .replace("bordet levereras ensamt", "bordet packas i en kartong")


def sjalvtest():
    """Varje regel ska fälla när den bryts. En grind ingen testat är ingen.

    ⚠️ Mutationer LÄGGS TILL före syskonrubriken, aldrig genom att byta ut ett
       uppmätt värde — annars fäller talgrinden först och regeln som testas kan
       vara helt avväpnad utan att testet märker något (runda 98).
    """
    fast_ = "f806eebf"     # fast längd, sex kuvert, justerbara fötter
    tyst = "e71acc53"      # fast längd, INGET sittplatsantal, INGA fötter
    glas = "4249df4d"      # fast längd, INGEN anvisning, halkfria fötter
    utdr = "c71418ca"      # utdragbart 160/220
    plast = "29c688dc"     # utdragbart, plastskiva i träimitation

    def kor(pid, h=None, n=None, t=None, m=None):
        return granska(pid,
                       h if h is not None else T.beskrivning(pid),
                       n if n is not None else T.namn(pid),
                       t if t is not None else T.seo_titel(pid),
                       m if m is not None else T.seo_beskrivning(pid))

    def infoga(pid, bit, h=None):
        h = h if h is not None else T.beskrivning(pid)
        assert SYSKONRUBRIK in h
        return h.replace(SYSKONRUBRIK, bit + SYSKONRUBRIK)

    h_fast = T.beskrivning(fast_)
    fall = [
        # ---- regel 1
        ("leverans: trottoarkant", "LEVERANSLÖFTE",
         lambda: kor(fast_, h=infoga(fast_, "<p>Vi kör fram till trottoarkanten.</p>"))),
        ("leverans: fri frakt", "LEVERANSLÖFTE",
         lambda: kor(fast_, h=infoga(fast_, "<p>Fri frakt på det här bordet.</p>"))),
        ("leverans: levereras till dörren", "LEVERANSLÖFTE",
         lambda: kor(fast_, h=infoga(fast_, "<p>Bordet levereras till dörren.</p>"))),
        ("leverans i meta", "LEVERANSLÖFTE",
         lambda: kor(fast_, m=T.seo_beskrivning(fast_).replace(
             "Sex kuvert", "Fraktfritt, sex kuvert"))),
        # ---- generella ordlistor
        ("husmärke", "leverantör/husmärke",
         lambda: kor(fast_, h=h_fast.replace("Trädgårdsbord", "Outsunny trädgårdsbord"))),
        ("leverantören anger", "mot kunden är VI",
         lambda: kor(fast_, h=infoga(fast_, "<p>Leverantören anger 50 kg.</p>"))),
        ("avsändarland", "avsändarland",
         lambda: kor(fast_, h=infoga(fast_, "<p>Skickas från Tyskland.</p>"))),
        ("tyska", "tyska",
         lambda: kor(fast_, h=infoga(fast_, "<p>Ein Gartentisch.</p>"))),
        ("artikelnummer", "artikelnummer",
         lambda: kor(fast_, h=infoga(fast_, "<p>Modellreferens: 845-030CG.</p>"))),
        ("emoji", "emoji",
         lambda: kor(fast_, h=infoga(fast_, "<p>Snyggt ✅</p>"))),
        ("jargong", "intern jargong",
         lambda: kor(fast_, h=infoga(fast_, "<p>Se runda 4.</p>"))),
        ("pris i texten", "pris i kundtext",
         lambda: kor(fast_, h=infoga(fast_, "<p>Bordet kostar 2779 kr.</p>"))),
        ("ohärlett tal", "ohärlett tal",
         lambda: kor(fast_, h=infoga(fast_, "<p>Skivan är 17 mm tjock.</p>"))),
        ("ohärlett tal i meta", "ohärlett tal",
         lambda: kor(fast_, m=T.seo_beskrivning(fast_).replace("71 cm", "72 cm"))),
        ("spec-rad ändrad", "spec-raden",
         lambda: kor(fast_, h=h_fast.replace("<strong>Vikt:</strong> 23,5 kg",
                                             "<strong>Vikt:</strong> 23,5 kilo"))),
        ("dubbelt blanksteg", "dubbelt blanksteg",
         lambda: kor(fast_, h=h_fast.replace("Trädgårdsbord", "Träd  gårdsbord"))),
        ("kommalista i brödtext", "kommalista av tal i brödtext",
         lambda: kor(fast_, h=infoga(fast_, "<p>Skivan är 140, 80 och 75 cm.</p>"))),
        ("relativ länk", "icke-absolut länk",
         lambda: kor(fast_, h=h_fast.replace('href="%s' % T.BAS, 'href="/'))),
        ("okänd slug", "okänd slug",
         lambda: kor(fast_, h=h_fast.replace(T.SLUGG["e71acc53"], "hittepa"))),
        ("självlänk", "länkar till sig själv",
         lambda: kor(fast_, h=h_fast.replace(T.SLUGG["e71acc53"], T.SLUGG[fast_]))),
        ("för långt namn", "namnet är",
         lambda: kor(fast_, n=T.namn(fast_) + " " + "x" * 40)),
        ("för lång titel", "seo-titeln är",
         lambda: kor(fast_, t=T.seo_titel(fast_) + " " + "x" * 40)),
        ("titel = namn", "identisk med namnet",
         lambda: kor(fast_, t=T.namn(fast_))),
        ("för kort meta", "meta är",
         lambda: kor(fast_, m="Kort.")),
        ("sökord borta ur namn", "sökordet",
         lambda: kor(fast_, n=T.namn(fast_).replace("Trädgårdsbord", "Utebord"))),
        ("rubrik borta", "rubriken",
         lambda: kor(fast_, h=h_fast.replace("<h2>Vanliga frågor</h2>", ""))),
        # ---- REGEL 2, båda riktningarna
        ("utdragningsord på fast bord", "på ett bord med fast längd",
         lambda: kor(fast_, h=infoga(fast_, "<p>Bordet dras ut till 200 cm.</p>"))),
        ("utdragningen borta på utdragbart", "utdragningen beskrivs inte",
         lambda: kor(utdr, h=_utan_utdrag(T.beskrivning(utdr)))),
        ("bara långa måttet i namnet", "namn saknar längden",
         lambda: kor(utdr, n="Utdragbart trädgårdsbord 220 cm i aluminium")),
        ("bara långa måttet i titeln", "seo-titel saknar längden",
         lambda: kor(utdr, t="Utdragbart trädgårdsbord 220 cm i aluminium")),
        ("bara långa måttet i metan", "meta saknar längden",
         lambda: kor(utdr, m=T.seo_beskrivning(utdr).replace("160 till 220", "220"))),
        # ---- REGEL 3, båda riktningarna
        ("egen maxlast borta", "den egna maxlasten",
         lambda: kor(fast_, h=h_fast.replace("50 kg", "femtio kilo"))),
        ("främmande maxlast", "främmande maxlast",
         lambda: kor(fast_, h=infoga(fast_, "<p>Hyllan tål 80 kg.</p>"))),
        # ---- REGEL 4
        ("stolarna borta", "stolarna inte ingår",
         lambda: kor(fast_, h=_utan_stolar(h_fast))),
        # ---- REGEL 5, båda riktningarna
        ("sittplatsantal på tyst sida", "på en sida utan underlag",
         lambda: kor(tyst, h=infoga(tyst, "<p>Bordet tar sex personer.</p>"))),
        ("sittplatsantal borta", "sittplatsantalet saknas",
         lambda: kor(fast_, h=h_fast.replace("tar sex kuvert", "är rymligt")
                                    .replace("Sex, tre på var långsida",
                                             "Tre på var långsida")
                                    .replace("Hur många får plats?",
                                             "Hur stort är bordet?"))),
        # ---- REGEL 6, tre riktningar
        ("fotpåstående utan underlag", "fotpåstående",
         lambda: kor(tyst, h=infoga(tyst, "<p>Fötterna är justerbara.</p>"))),
        ("fötterna borta", "beskrivs inte som",
         lambda: kor(fast_, h=h_fast.replace("justerbara", "stabila")
                                    .replace("Justerbara", "Stabila"))),
        ("fel sorts fot", "fel sorts fot",
         lambda: kor(fast_, h=infoga(fast_, "<p>Bordet har halkfria tassar.</p>"))),
        # ---- REGEL 7, båda riktningarna
        ("anvisning lovas utan täckning", "lovar en anvisning",
         lambda: kor(glas, h=infoga(glas, "<p>Bruksanvisning ingår.</p>"))),
        ("anvisningen borta", "anvisningen nämns inte",
         lambda: kor(fast_, h=h_fast.replace("bruksanvisning", "skruvsats")
                                    .replace("Bruksanvisning", "Skruvsats"))),
        # ---- REGEL 8, båda riktningarna på båda sidorna
        ("skivan påstås vara trä (WPC)", "påstås vara trä",
         lambda: kor(fast_, h=infoga(fast_, "<p>Skivan är trä rakt igenom.</p>"))),
        ("skivan påstås vara massivt trä (plast)", "påstås vara trä",
         lambda: kor(plast, h=infoga(plast, "<p>Byggd i massivt trä.</p>"))),
        ("WPC-ordet borta", "materialordet",
         lambda: kor(fast_, h=h_fast.replace("WPC", "skivmaterialet"))),
        ("träådringen borta", "materialordet",
         lambda: kor(plast, h=T.beskrivning(plast).replace("träådring", "ytstruktur"))),
        # ---- måttet
        ("syskonets mått i texten", "står inte i texten",
         lambda: kor(fast_, h=h_fast.replace("140 × 80 × 75 cm", "145 × 90 × 74 cm"))),
    ]

    ok = 0
    for namn_t, vantat, fn in fall:
        brister = fn()
        traff = any(vantat in b for b in brister)
        print("  %s %-38s %s" % ("✓" if traff else "✗", namn_t,
                                 "" if traff else "FÄLLDE INTE"))
        ok += traff

    for p in T.PRODUKTER:
        rent = granska(p, T.beskrivning(p), T.namn(p), T.seo_titel(p),
                       T.seo_beskrivning(p))
        print("  %s %-38s %s" % ("✓" if not rent else "✗",
                                 "ren text passerar: " + p,
                                 "" if not rent else rent[:3]))
        ok += not rent

    # ☠️ FRIA RIKTNINGAR. Utan dem kan mönstren skärpas tills de fäller allt,
    #    och varenda fällande självtest fortsätter vara grönt.
    fria = [
        ("'Levereras omonterat'",
         lambda: [x for x in kor(fast_, h=infoga(fast_, "<p>Levereras omonterat.</p>"))
                  if "LEVERANSLÖFTE" in x]),
        ("'inte massivt trä'",
         lambda: [x for x in kor(fast_, h=infoga(
             fast_, "<p>Det är inte massivt trä.</p>")) if "regel 8" in x]),
        ("jämförelse med en träskiva",
         lambda: [x for x in kor(fast_, h=infoga(
             fast_, "<p>Ytan beter sig annorlunda än en oljad träskiva.</p>"))
             if "regel 8" in x]),
        ("FAQ-frågan 'Är skivan i trä?'",
         lambda: [x for x in kor(fast_) if "regel 8" in x]),
        ("decimaltal utan kommalista",
         lambda: [x for x in kor(fast_, h=infoga(fast_, "<p>Väger 23,5 kg.</p>"))
                  if "kommalista" in x]),
        ("'inga justerbara fötter' på tyst sida",
         lambda: [x for x in kor(tyst, h=infoga(
             tyst, "<p>Bordet har inga justerbara fötter.</p>"))
             if "regel 6" in x]),
    ]
    for namn_t, fn in fria:
        b = fn()
        print("  %s %-38s %s" % ("✓" if not b else "✗", namn_t + " passerar",
                                 "" if not b else b))
        ok += not b

    n_fall = len(fall) + len(T.PRODUKTER) + len(fria)
    print("\n%d/%d självtest" % (ok, n_fall))
    return ok == n_fall


if __name__ == "__main__":
    print("=== självtest ===")
    allt_ok = sjalvtest()
    print("\n=== granskning ===")
    fel = 0
    for pid in T.PRODUKTER:
        h = T.beskrivning(pid)
        b = granska(pid, h, T.namn(pid), T.seo_titel(pid), T.seo_beskrivning(pid))
        print("%s  %s  %4d tecken  %s" % (pid, T.GRUPP[pid], len(synlig(h)),
                                          "OK" if not b else "%d BRISTER" % len(b)))
        for x in b:
            print("    ✗", x)
            fel += 1
    print("\n%d brister" % fel)
    sys.exit(0 if (allt_ok and not fel) else 1)
