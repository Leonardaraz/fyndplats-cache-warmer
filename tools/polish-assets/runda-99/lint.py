# -*- coding: utf-8 -*-
"""Runda 99 — mekanisk grind mot texterna i filen.

☠️ REGEL 1 ÄR ÄRVD FRÅN RUNDA 97 OCH GÄLLER ORDAGRANT: INGA HÄLSOPÅSTÅENDEN.
   Alla sju utkast säljer den upphöjda skålen på hälsa, och den största
   studien pekar åt motsatt håll (se `texter.py`). Grinden är en ORDLISTA,
   inte en bedömning — en bedömning glider, en ordlista gör det inte.

☠️ REGEL 2: TALEN FÖRANKRAS I SPEC-TABELLEN. Vitlistan byggs ur `SPEC`, som
   är de MÄTTA värdena. Ett tal i brödtexten som inte står i spec-tabellen
   måste stå i `EXTRA` med en motivering (#326).

☠️ REGEL 3: MATERIALET SKA VARA TVÅDELAT. Alla sju är byggda i träfiberskiva
   men importens spec-rad säger "Edelstahl/Holzwerkstoff" — och 5d7aab1b:s
   säger bara "Edelstahl". Sidan ska säga BÅDA delarna. MDF är aldrig
   "massivt trä" (#259).

☠️ REGEL 4 ÄR DEN HÄR RUNDANS EGEN: MEKANIKEN FÅR INTE LÄCKA MELLAN
   MODELLERNA. Modell C har EN UTDRAGBAR LÅDA på metallskenor; modell D har
   ingen låda alls — hela skivan LYFTS AV i ett stycke. Mätt på a8e376e7-2
   (skivan på golvet), edd89684-5 (skivan uppifrån) och 5eb270ed-5 (lådan
   utdragen med skenan synlig), aldrig antaget ur syskonets text.
   Runda 98:s dörrtypsgrind var samma regel på en annan mekanik; runda 97:s
   868cc038 var felet den finns för att fånga.
   Grinden är tvåvägs på båda grupperna: den fäller BÅDE när fel ord finns
   OCH när rätt ord saknas.

☠️ REGEL 6 ÄR NY: TVÅFÄRGADE SIDOR MÅSTE NAMNGE BÅDA YTORNA. 8c1d08c5 är grå
   stomme med VIT skiva och 31d6a3df vit stomme med GRÅ skiva — leverantörens
   färgfält namnger bara stommen, och 8c1d08c5:s alt-text säger dessutom
   "Weiß" om en grå möbel. En sida som säger bara en kulör beskriver fel vara.

☠️ REGEL 7 ÄR NY: MODELL D:s INVÄNDIGA MÅTT FÅR ALDRIG SKRIVAS UT.
   Leverantören anger 58 × 28 × 39 respektive 52 × 26 × 37 cm i ett hölje som
   är 41 cm högt, med skålar som är 7 cm djupa och hänger ner i utrymmet.
   Talet motsäger sig självt och har inget stöd på någon måttritning.
   Talgrinden (regel 2) skulle råka fånga det — den här säger VARFÖR.
"""
import re
import sys

import texter as T

# Giltiga korslänkmål: rundans egna sluggar PLUS runda 97:s och 98:s publicerade.
SLUGGAR = set(T.SLUGG.values()) | {s for s, _ in T.PUBLICERADE}

# ---------------------------------------------------------------- ordlistor

HALSA = [
    r"magomvridn", r"uppblåsthet", r"matsmältn", r"matspjälkn",
    r"nack(e|en|ar)", r"rygg(en|rad)?", r"led(er|erna)", r"artros",
    r"höftled", r"hållning", r"skonsam", r"skonar", r"avlastar",
    r"belasta(r|s|de)?\b", r"veterinär", r"hälsosam", r"nyttigare",
    r"bättre för", r"ergonomisk", r"kroppshållning", r"sväljer",
    r"äter långsammare", r"böja sig", r"äldre hund",
]
FORBJUDET = [
    (r"aosom|outsunny|homcom|pawhut|vinsetto|aiyaplay", "leverantör/husmärke"),
    (r"leverantör(?!ens siffra)|tillverkar|fabrikant|importör",
     "mot kunden är VI leverantören"),
    (r"tyskland|spanien|skickas från", "avsändarland"),
    (r"futterstation|n[äa]pf|edelstahl|schulterhöhe|hinweis|stauraum|deckel",
     "tyska"),
    (r"\b\d{2,3}[A-Za-z]?-\d{3,4}[A-Za-z]{0,3}\b", "artikelnummer"),
    (r"artikelnummer|modellreferens|artikelnr", "artikelnummer som etikett"),
    (r"[\U0001F300-\U0001FAFF☀-➿]", "emoji i kundtext"),
    (r"runda \d|steg \d", "intern jargong (#318)"),
]

# ⚠️ Tal som INTE står i spec-tabellen men ändå är riktiga. Varje rad är en
#    motivering; en tom motivering är inte tillåten.
_C_EXTRA = {
    "5": "femkilossäck torrfoder",
    "41": "korslänk till modell D",
    "82": "korslänk r97, husdjursskåp 82 cm",
    "46": "korslänk r98, matskåp 46 cm",
    "3": "korslänk r97, matplats i tre höjder",
}
_D_EXTRA = {
    "36": "korslänk till modell C",
    "21": "korslänk till modell C, låda 21 liter",
    "82": "korslänk r97, husdjursskåp 82 cm",
    "46": "korslänk r98, matskåp 46 cm",
    "50": "korslänk r98, 50 liter",
    "3": "korslänk r97, matplats i tre höjder",
}
EXTRA = {pid: (dict(_C_EXTRA) if T.GRUPP[pid] == "C" else dict(_D_EXTRA))
         for pid in T.PRODUKTER}

# ☠️ Leverantörens invändiga mått på modell D, ordagrant. Regel 7.
FORBJUDNA_INRE = [r"58\s*[×x]\s*28", r"52\s*[×x]\s*26",
                  r"invändig[a-zt]*\s+m[åa]tt", r"39\s*cm\s+inv", r"37\s*cm\s+inv"]

# ☠️ EN PÅSTÅENDE-GRIND MÅSTE KUNNA SKILJA ETT PÅSTÅENDE FRÅN ETT FÖRNEKANDE.
#    Runbokens egen regel, och den bet direkt: regel 4 fällde meningen "Det är
#    alltså inget lock på gångjärn" och regel 7 fällde "Vi anger inget
#    invändigt mått" — båda är MOTSATSEN till felet de finns för att stoppa.
#    Hjälparen bor på ETT ställe och delas av båda reglerna: två grindar med
#    var sin kopia av samma undantag glider isär (runbokens lärdom).
NEKANDE = r"(?:inte|inget|ingen|inga|aldrig|utan)\b[^.]{0,24}$"


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
    ut |= set(EXTRA[pid])
    return ut


def synlig(h):
    return re.sub(r"\s+", " ", re.sub(r"<[^>]+>", " ", h)).strip()


def lasform(h):
    """Inline-taggar bort UTAN blanksteg — se runda 96:s lärdom."""
    h = re.sub(r"</?(?:a|span|strong|em|b|i)\b[^>]*>", "", h)
    return re.sub(r"\s+", " ", re.sub(r"<[^>]+>", " ", h)).strip()


def granska(pid, h, namn, titel, meta):
    f = []
    txt = lasform(h)
    allt = (txt + " " + namn + " " + titel + " " + meta).lower()

    # 1 — hälsopåståenden
    for m in HALSA:
        tr = re.search(m, allt)
        if tr:
            f.append("HÄLSOPÅSTÅENDE %r — Steg 2-grinden" % tr.group(0))

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
                     ("namn", namn),
                     ("seo-titel", titel),
                     ("meta", meta)):
        tr = re.search(r"\d+(?:,\d+)?, \d", yta)
        if tr:
            f.append("kommalista av tal i %s: %r" % (vad, tr.group(0)))

    # 3 — ohärledda tal
    vit = vitlista(pid)
    for tal in tal_i(txt + " " + namn + " " + titel + " " + meta):
        if tal not in vit:
            f.append("ohärlett tal %r (står inte i spec och inte i EXTRA)" % tal)

    # 4 — materialet tvådelat
    if not re.search(r"skålar(na)?.{0,40}rostfritt", txt, re.S) and \
       not re.search(r"rostfria skålar", txt):
        f.append("skålarnas material sägs inte")
    stomme = dict(T.SPEC[pid]).get("Stomme", "")
    if "träfiberskiva" in stomme and "träfiberskiva" not in txt:
        f.append("stommen är träfiberskiva men ordet står inte i texten")
    if "träfiberskiva" in stomme and re.search(
            r"\bm[öo]bel i (rostfritt|stål)\b", txt):
        f.append("möbeln kallas stål trots träfiberstomme")

    # ☠️ REGEL 4 — MEKANIKEN. Ytan är texten FÖRE syskonlistan: korslänkarna
    #    namnger med rätta den ANDRA modellens mekanik, och en regel som läste
    #    dem hade fällt varje sida i familjen.
    kropp = lasform(h.split("<h2>Fler matplatser")[0])
    # ☠️ REGEL 4 OCH 6 MÄTS PÅ PROSAN, INTE PÅ LISTORNA. Första versionen läste
    #    hela `kropp` — och där ligger spec-tabellen och egenskapspunkterna,
    #    som är GENERERADE ur exakt de fält reglerna ska kontrollera. Regel 6
    #    uppfylldes alltså av raden "Färg: grå stomme, vit skiva" som den var
    #    satt att bevaka. En regel som mäter sin egen källa fäller aldrig
    #    (runbokens lärdom om normaliseringen, samma form).
    prosa = lasform(re.sub(r"<ul>.*?</ul>", " ",
                           h.split("<h2>Fler matplatser")[0], flags=re.S))
    LADA = r"l[åa]d(a|an)\b|utdragbar|dras ut|metallsken|l[åa]dsken|kuphandtag"
    LYFT = (r"lyfts av|lyft(er|s)? rakt upp i ett stycke|l[öo]stagbar skiva|"
            r"hela skivan")
    if T.GRUPP[pid] == "C":
        if not re.search(LADA, prosa, re.I):
            f.append("lådan nämns inte (regel 4)")
        tr = re.search(LYFT, prosa, re.I)
        if tr:
            f.append("lyftskivsord %r på en lådmodell (regel 4)" % tr.group(0))
        if not re.search(r"metallsken|l[åa]dsken", prosa, re.I):
            f.append("metallskenorna nämns inte (regel 4)")
    else:
        if not re.search(LYFT, prosa, re.I):
            f.append("den avlyftbara skivan nämns inte (regel 4)")
        tr = re.search(LADA, prosa, re.I)
        if tr:
            f.append("lådord %r på en lyftskivsmodell (regel 4)" % tr.group(0))
        tr = positiv(r"lock(et|en)?\b", prosa)
        if tr:
            f.append("skivan kallas %r — den sitter inte i gångjärn (regel 4)"
                     % tr.group(0))

    # ☠️ REGEL 5 — måttet är modellens eget, inte syskonets. 8c1d08c5:s
    #    alt-text säger 42 cm, som ingen av de sju har.
    egen = dict(T.SPEC[pid])["Mått"]
    if egen not in txt:
        f.append("måttet %r står inte i brödtexten (regel 5)" % egen)

    # ☠️ REGEL 6 — tvåfärgade sidor namnger BÅDA ytorna.
    farg = dict(T.SPEC[pid])["Färg"]
    if "," in farg:
        for del_ in [d.strip() for d in farg.split(",")]:
            kulor, yta = del_.split()[0], del_.split()[-1]
            if not re.search(r"%s\w*\s+%s|%s\w*\s+är\s+%s" %
                             (kulor, yta, yta, kulor), prosa, re.I):
                f.append("tvåtonen säger inte %r i brödtexten (regel 6)" % del_)

    # ☠️ REGEL 7 — modell D:s invändiga mått publiceras aldrig.
    if T.GRUPP[pid] == "D":
        for m in FORBJUDNA_INRE:
            tr = positiv(m, allt)
            if tr:
                f.append("invändigt mått på modell D: %r (regel 7)" % tr.group(0))

    # 5 — spec-tabellen ska stå ordagrant i html
    for k, v in T.SPEC[pid]:
        if ("<strong>%s:</strong> %s" % (k, v)) not in h:
            f.append("spec-raden %r saknas eller avviker" % k)

    # 6 — länkar
    for href in re.findall(r'href="([^"]+)"', h):
        if not href.startswith(T.BAS):
            f.append("icke-absolut länk %r" % href)
            continue
        slug = href[len(T.BAS):]
        if slug not in SLUGGAR:
            f.append("länk till okänd slug %r" % slug)
        if slug == T.SLUGG[pid]:
            f.append("länkar till sig själv")

    # 7 — längder
    if len(namn) > 80:
        f.append("namnet är %d tecken (max 80)" % len(namn))
    if len(titel) > 60:
        f.append("seo-titeln är %d tecken" % len(titel))
    if not (110 <= len(meta) <= 165):
        f.append("meta är %d tecken (110–165)" % len(meta))

    # 8 — sökordet ska stå i namn och meta
    huvud = T.SOKORD[pid].split()[0]
    if huvud not in namn.lower() or huvud not in meta.lower():
        f.append("sökordet %r saknas i namn eller meta" % huvud)

    # 9 — struktur
    for rubrik in ("Tekniska specifikationer", "Användning och skötsel",
                   "Vanliga frågor"):
        if ("<h2>%s</h2>" % rubrik) not in h:
            f.append("rubriken %r saknas" % rubrik)
    return f


# ------------------------------------------------------------- självtest

def sjalvtest():
    """Varje regel ska fälla när den bryts. En grind ingen testat är ingen.

    ⚠️ Mutationer LÄGGS TILL före syskonrubriken, aldrig genom att byta ut ett
       uppmätt värde — annars fäller talgrinden först och regeln som testas kan
       vara helt avväpnad utan att testet märker något (runda 98).
    """
    pid = "8c1d08c5"    # modell C, tvåfärgad (grå stomme, vit skiva)
    pid_d = "a8e376e7"  # modell D, lyftbar skiva
    h0 = T.beskrivning(pid)
    n0, t0, m0 = T.namn(pid), T.seo_titel(pid), T.seo_beskrivning(pid)
    RUB = "<h2>Fler matplatser"

    def kor(h=h0, n=n0, t=t0, m=m0):
        return granska(pid, h, n, t, m)

    def kor_d(h=None, n=None, t=None, m=None):
        return granska(pid_d, h if h is not None else T.beskrivning(pid_d),
                       n or T.namn(pid_d), t or T.seo_titel(pid_d),
                       m or T.seo_beskrivning(pid_d))

    def infoga(h, bit):
        """Muteringen måste hamna INNANFÖR regelns yta (runda 98:s lärdom)."""
        assert RUB in h
        return h.replace(RUB, bit + RUB)

    fall = [
        ("hälsa: nacke", "HÄLSOPÅSTÅENDE",
         lambda: kor(h=infoga(h0, "<p>Skonar hundens nacke.</p>"))),
        ("hälsa: magomvridning", "HÄLSOPÅSTÅENDE",
         lambda: kor(h=infoga(h0, "<p>Minskar risken för magomvridning.</p>"))),
        ("hälsa: böja sig", "HÄLSOPÅSTÅENDE",
         lambda: kor(h=infoga(h0, "<p>Hunden slipper böja sig ner.</p>"))),
        ("hälsa: äldre hund", "HÄLSOPÅSTÅENDE",
         lambda: kor(h=infoga(h0, "<p>Bra för en äldre hund.</p>"))),
        ("hälsa: ergonomisk", "HÄLSOPÅSTÅENDE",
         lambda: kor(m=m0.replace("Matskåp", "Ergonomiskt matskåp"))),
        ("husmärke", "leverantör/husmärke",
         lambda: kor(h=h0.replace("Matskåp", "PawHut matskåp"))),
        ("leverantören anger", "mot kunden är VI",
         lambda: kor(h=infoga(h0, "<p>Leverantören anger 12 kg.</p>"))),
        ("avsändarland", "avsändarland",
         lambda: kor(h=infoga(h0, "<p>Skickas från Tyskland.</p>"))),
        ("tyska", "tyska",
         lambda: kor(h=h0.replace("skålar", "Näpfe"))),
        ("tyska: Deckel", "tyska",
         lambda: kor_d(h=infoga(T.beskrivning(pid_d), "<p>Ett Deckel.</p>"))),
        ("artikelnummer", "artikelnummer",
         lambda: kor(h=infoga(h0, "<p>Modellreferens: D08-041V80GY.</p>"))),
        ("emoji", "emoji",
         lambda: kor(h=infoga(h0, "<p>Bra val ✅</p>"))),
        ("jargong", "intern jargong",
         lambda: kor(h=infoga(h0, "<p>Se runda 4.</p>"))),
        ("ohärlett tal", "ohärlett tal",
         lambda: kor(h=infoga(h0, "<p>Hyllan tål 17 kg.</p>"))),
        ("ohärlett tal i meta", "ohärlett tal",
         lambda: kor(m=m0.replace("12 kg", "11 kg"))),
        ("spec-rad ändrad", "spec-raden",
         lambda: kor(h=h0.replace("<strong>Vikt:</strong> 12 kg",
                                  "<strong>Vikt:</strong> 12,4 kg"))),
        ("skålmaterial borta", "skålarnas material",
         lambda: kor(h=h0.replace("rostfri", "blank").replace("rostfritt", "blankt"))),
        ("träfiberskivan borta", "stommen är träfiberskiva",
         lambda: kor(h=h0.replace("träfiberskiva", "skivmaterial"))),
        ("relativ länk", "icke-absolut länk",
         lambda: kor(h=h0.replace('href="%s' % T.BAS, 'href="/'))),
        ("okänd slug", "okänd slug",
         lambda: kor(h=h0.replace(T.SLUGG["5eb270ed"], "hittepa"))),
        ("självlänk", "länkar till sig själv",
         lambda: kor(h=h0.replace(T.SLUGG["5eb270ed"], T.SLUGG[pid]))),
        ("för långt namn", "namnet är",
         lambda: kor(n=n0 + " " + "x" * 40)),
        ("för lång titel", "seo-titeln är",
         lambda: kor(t=t0 + " " + "x" * 40)),
        ("för kort meta", "meta är",
         lambda: kor(m="Kort.")),
        ("sökord borta ur namn", "sökordet",
         lambda: kor(n=n0.replace("Matskåp", "Möbel"))),
        ("rubrik borta", "rubriken",
         lambda: kor(h=h0.replace("<h2>Vanliga frågor</h2>", ""))),
        ("dubbelt blanksteg", "dubbelt blanksteg",
         lambda: kor(h=h0.replace("Matskåp", "Mat  skåp"))),
        ("kommalista i brödtext", "kommalista av tal i brödtext",
         lambda: kor(h=infoga(h0, "<p>Facken är 22, 22 och 16 cm.</p>"))),
        ("kommalista i meta", "kommalista av tal i meta",
         lambda: kor(m="Matskåp för hund med fack på 22, 22 och 16 cm samt två "
                       "rostfria skålar i träfiberskiva, och "
                       "monteringsanvisning ingår i leveransen.")),
        # ☠️ REGEL 4 — sex riktningar, för regeln är tvåvägs på två modeller
        #    OCH har ett eget krav per grupp.
        ("lyftskivsord på C", "lyftskivsord",
         lambda: kor(h=infoga(h0, "<p>Hela skivan lyfts av.</p>"))),
        ("lådan borta på C", "lådan nämns inte",
         lambda: granska(pid, _utan_lada(h0), n0, t0, m0)),
        # ⚠️ Mutationen måste ta bort VARJE bärare. Första versionen bytte bara
        #    "metallskenor" och lämnade "lådskenorna" kvar i skötselstycket —
        #    regeln matchade den och testet rapporterade ett hål som inte fanns.
        ("metallskenorna borta på C", "metallskenorna nämns inte",
         lambda: kor(h=h0.replace("metallskenor", "glidlister")
                          .replace("lådskenorna", "listerna"))),
        ("lådord på D", "lådord",
         lambda: kor_d(h=infoga(T.beskrivning(pid_d),
                                "<p>Lådan dras ut framifrån.</p>"))),
        ("lyftskivan borta på D", "den avlyftbara skivan nämns inte",
         lambda: kor_d(h=_utan_lyft(T.beskrivning(pid_d)))),
        ("skivan kallas lock på D", "skivan kallas",
         lambda: kor_d(h=infoga(T.beskrivning(pid_d),
                                "<p>Locket fälls upp bakåt.</p>"))),
        # ☠️ REGEL 5 — måttet är modellens eget.
        ("syskonets mått i brödtexten", "står inte i brödtexten",
         lambda: kor(h=h0.replace("60 × 30 × 36 cm", "60 × 30 × 41 cm"))),
        # ☠️ REGEL 6 — tvåtonen namnger båda ytorna, i PROSAN.
        ("ena ytan borta i prosan", "tvåtonen säger inte",
         lambda: kor(h=h0.replace("Skåpet har grå stomme och vit skiva – de "
                                  "två ytorna har olika kulör.",
                                  "Skåpet är grått."))),
        # ☠️ REGEL 7 — modell D:s invändiga mått publiceras aldrig.
        ("invändigt mått på D", "invändigt mått på modell D",
         lambda: kor_d(h=infoga(T.beskrivning(pid_d),
                                "<p>Utrymmet är 58 × 28 cm.</p>"))),
    ]
    ok = 0
    for namn_t, vantat, fn in fall:
        brister = fn()
        traff = any(vantat in b for b in brister)
        print("  %s %-30s %s" % ("✓" if traff else "✗", namn_t,
                                 "" if traff else "FÄLLDE INTE"))
        ok += traff

    for p in T.PRODUKTER:
        rent = granska(p, T.beskrivning(p), T.namn(p), T.seo_titel(p),
                       T.seo_beskrivning(p))
        print("  %s %-30s %s" % ("✓" if not rent else "✗",
                                 "ren text passerar: " + p,
                                 "" if not rent else rent[:2]))
        ok += not rent

    # ☠️ FRIA RIKTNINGAR. Utan dem kan mönstren skärpas tills de fäller allt,
    #    och varenda fällande självtest fortsätter vara grönt.
    fria = [
        ("decimaltal", lambda: [x for x in kor(h=infoga(h0, "<p>Väger 13,5 kg.</p>"))
                                if "kommalista" in x]),
        ("uppräkning utan tal", lambda: [x for x in
                                         kor(h=infoga(h0, "<p>Foder, koppel och godis.</p>"))
                                         if "kommalista" in x]),
        # ☠️ FÖRNEKANDET SKA PASSERA. Det är hela skälet till `positiv()`:
        #    "Det är inget lock" och "Vi anger inget invändigt mått" är
        #    MOTSATSEN till felet, och båda står i den skarpa texten.
        ("'inget lock' passerar", lambda: [x for x in
                                           kor_d(h=infoga(T.beskrivning(pid_d),
                                                          "<p>Det är inget lock.</p>"))
                                           if "kallas" in x]),
        ("'inget invändigt mått' passerar",
         lambda: [x for x in kor_d(h=infoga(T.beskrivning(pid_d),
                                            "<p>Vi anger inget invändigt mått.</p>"))
                  if "regel 7" in x]),
    ]
    for namn_t, fn in fria:
        b = fn()
        print("  %s %-30s %s" % ("✓" if not b else "✗", namn_t + " passerar",
                                 "" if not b else b))
        ok += not b

    n_fall = len(fall) + len(T.PRODUKTER) + len(fria)
    print("\n%d/%d självtest" % (ok, n_fall))
    return ok == n_fall


def _utan_lada(h):
    """Tar bort VARJE bärare av lådan ur prosan — en mutation som lämnar en
    kvar testar ingenting (runbokens regel)."""
    for a, b in (("Lådan", "Facket"), ("lådan", "facket"), ("lådskenor", "lister"),
                 ("låda", "utrymme"), ("metallskenor", "glidlister"),
                 ("Kuphandtaget", "Greppet"), ("kuphandtag", "grepp"),
                 ("utdragbar", "öppningsbar"),
                 ("kommer ut i sin helhet", "öppnas"), ("dras ut", "öppnas")):
        h = h.replace(a, b)
    return h


def _utan_lyft(h):
    for a, b in (("lyfts av", "öppnas"), ("Hela skivan", "Ovansidan"),
                 ("hela skivan", "ovansidan"), ("löstagbar skiva", "öppningsbar topp"),
                 ("lyfts rakt upp i ett stycke", "öppnas")):
        h = h.replace(a, b)
    return h


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
