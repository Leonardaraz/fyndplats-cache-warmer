# -*- coding: utf-8 -*-
"""Runda 134 — textgrinden. Körs FÖRE varje skrivning till Wix.

☠️ SKRIV TEXTEN I EN FIL OCH GRINDA DEN — uppmätt 9 fel mot 0 (2026-09-04).
   En sträng som skrivs direkt i ett JSON-anrop kan inte läsas av en grind
   innan den lämnar chatten, och API-svaret ekar tillbaka exakt det man skrev.
"""
import re
import sys
import os

HAR = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, os.path.join(HAR, ".."))
sys.path.insert(0, HAR)
import grindar as G                                              # noqa: E402
import texter as T                                               # noqa: E402
import matt as M                                                 # noqa: E402

RAKNEORD = {1: "en", 2: "två", 3: "tre", 4: "fyra"}


def _vikt(ord_):
    """Huvudordet som regex där varje ä/å/ö också matchar sin ASCII-form."""
    par = {"ä": "[äa]", "å": "[åa]", "ö": "[öo]"}
    return re.compile("".join(par.get(t, re.escape(t)) for t in ord_), re.I)

FORBJUDET = [
    (re.compile(r"\bCE-?m[äa]rkt\w*|\bCE-?certifi|\btestad\s+enligt"
                r"|\bEN\s*71\b", re.I),
     "CERTIFIERINGSPÅSTÅENDE — ingen källa anger någon norm"),
    (re.compile(r"\bmassivt?\s+tr[äa]\b|\b[äa]kta\s+tr[äa]\b", re.I),
     "MASSIVT TRÄ — källorna säger spånskiva"),
    (re.compile(r"\bv[äa]ger\s+\d|\begenvikt\w*|\bvikt:\s*\d", re.I),
     "VARUVIKT — okänd för alla sex, spec-tabellens tal är fraktvikten"),
    # ☠️ JARGONGEN. Fem förekomster av "rundan" skrevs i den här rundans
    #    första utkast, för att texterna jämfördes MED VARANDRA medan de
    #    skrevs. Uppgift #318, en gång till.
    (G.JARGONG, "INTERN JARGONG i kundtext"),
    (re.compile(r"\brundans?\b|\bbatchen\b|\butkast\w*\b", re.I),
     "INTERN JARGONG — ord ur arbetsprocessen"),
    (re.compile(r"\bmarknadens\b|\bbranschens\b|\bstarkast\w*\b", re.I),
     "SUPERLATIV utan mätvärde"),
    # ☠️ SORTIMENTSSUPERLATIVET. "Den smalaste öppningen VI SÄLJER" pekar på
    #    butiken i stället för på batchen och är värre: de 43 publicerade
    #    klösträden har ingen av oss mätt.
    (re.compile(r"\b(?:h[öo]gst|l[äa]gst|mest|st[öo]rst|minst|tyngst|"
                r"l[äa]ttast|rymligast|smalast|bredast|djupast)\w*\b"
                r"[^.]{0,45}\b(?:vi\s+s[äa]ljer|i\s+(?:v[åa]rt\s+)?"
                r"sortiment\w*|hos\s+oss|i\s+butiken|i\s+familjen)", re.I),
     "SORTIMENTSSUPERLATIV — ogrundad jämförelse mot hela butiken"),
    (re.compile(r"\bleverant[öo]ren\s+(?:anger|uppger|s[äa]ger)", re.I),
     "MOT KUNDEN ÄR VI LEVERANTÖREN"),
    (re.compile(r"PawHut|HOMCOM|Outsunny|Aiyaplay|Aosom|AliExpress", re.I),
     "LEVERANTÖRS- ELLER HUSMÄRKE"),
    (re.compile(r"\bskickas\s+fr[åa]n\b|\bfr[åa]n\s+(?:Tyskland|Kina|Polen)\b"
                r"|\bTyskland\b|\btyska\b", re.I),
     "AVSÄNDARLAND"),
    (re.compile(r"\b\d+\s*(?:kr|SEK|:-)\b|\bpris(?:et|er)?\s+[äa]r\b", re.I),
     "PRIS i kundtext"),
    (re.compile(r"Kratz|Katzen|H[öo]hle\b|Liegefl|Sisalmatte|Wasserhyazinthe"
                r"|Kiefernholz|Seetang|Spanplatte|Pl[üu]sch\b|Wei[ßs]\b"
                r"|Dunkelgrau|Hellbraun|Produktinformation|Gewicht|Rasse",
                re.I),
     "TYSKT ORD kvar i texten"),
    (re.compile(r"\btr[äa]d\b", re.I),
     "TRÄD som material — varan är spånskiva, inte trä"),
]

# Talgrinden läser ALLA fält, inte bara brödtexten (uppgift #441).
TAL = re.compile(r"(?<![\w,.])(\d+(?:[,.]\d+)?)(?![\w])")

# Tal som alltid är ofarliga: ordningstal och små uppräkningar i löptext.
TAL_UNDANTAG = {1, 2, 3, 4}


def falt(pid):
    """Varje kundsynligt fält, namngivet — talgrinden gäller alla."""
    return [
        ("namn", T.NAMN[pid]),
        ("titel", T.TITEL[pid]),
        ("meta", T.META[pid]),
        ("slug", T.SLUG[pid].replace("-", " ")),
        ("brödtext", G.synlig_meningstext(T.bygg(pid))),
    ]


def utan_korslankar(html, pid):
    """Texten MINUS korslänksblocket — grannarnas namn är inte våra påståenden."""
    return re.split(r"<h2>\s*Passar inte den h[äa]r\?\s*</h2>", html)[0] + \
        html.split("<h2>Tekniska specifikationer</h2>", 1)[-1]


def granska(pid, html=None, live=False):
    """Returnerar en lista fel. Tom lista = grön."""
    f = M.FACIT[pid]
    huvudord, forbjudet_ord = M.TYP[pid]
    html = html if html is not None else T.bygg(pid)
    syn = G.synlig_meningstext(html) if not live else html
    eget = G.synlig_meningstext(utan_korslankar(html, pid)) if not live else syn
    fel = []

    for namn, text in falt(pid):
        if live and namn != "brödtext":
            continue
        provtext = eget if namn == "brödtext" else text
        for monster, skal in FORBJUDET:
            for m in monster.finditer(provtext):
                fel.append("%s: %s — %r" % (namn, skal, G.mening_kring(provtext, m.start())[:110]))
        for h in G.homoglyfer(text):
            fel.append("%s: HOMOGLYF %r" % (namn, h))
        for m in G.ARTNR.finditer(text):
            fel.append("%s: ARTIKELNUMMER %r" % (namn, m.group(0)))

    # ☠️ HUVUDORDET MATCHAS SOM REGEX MED BÅDA FORMERNA. Sluggen är
    #    ASCII-vikt (`klostunna`), så en jämförelse mot den svenska formen
    #    (`klöstunna`) fäller varje KORREKT slug. Samma lösning som runda 133.
    for namn, text in falt(pid)[:4]:
        if live:
            break
        if not _vikt(huvudord).search(text):
            fel.append("%s: saknar huvudordet %r" % (namn, huvudord))
        if forbjudet_ord and forbjudet_ord in text.lower():
            fel.append("%s: FÖRBJUDET TYPORD %r — varan är %s"
                       % (namn, forbjudet_ord, f.get("form", huvudord)))

    # Talgrinden: varje tal i varje fält måste stå i facit.
    for namn, text in falt(pid):
        if live and namn != "brödtext":
            continue
        provtext = eget if namn == "brödtext" else text
        for m in TAL.finditer(provtext):
            v = float(m.group(1).replace(",", "."))
            if v in TAL_UNDANTAG or v in f["tal"] or int(v) in f["tal"]:
                continue
            fel.append("%s: OHÄRLETT TAL %s — %r"
                       % (namn, m.group(1), G.mening_kring(provtext, m.start())[:100]))

    # Maxlast får bara nämnas där källan har en.
    harm = re.search(r"\b(?:b[äa]r|t[åa]l|maxlast)\b[^.]{0,20}\d+\s*kg", syn, re.I)
    if harm and f["maxlast"] is None:
        fel.append("MAXLAST påstådd men källan saknar den: %r" % harm.group(0))
    if f["maxlast"] is not None and not harm:
        fel.append("MAXLAST %s kg finns i källan men står inte i texten" % f["maxlast"])

    # Öppningsantalet, skrivet som räkneord.
    ord_ = RAKNEORD.get(f["oppningar"])
    if not live and ord_:
        fel_ord = [RAKNEORD[n] for n in RAKNEORD if n != f["oppningar"]]
        for fo in fel_ord:
            if re.search(r"\b%s\s+(?:h[åa]lor|ing[åa]ngar|kojor)\b" % fo, syn, re.I):
                fel.append("FEL ANTAL ÖPPNINGAR: texten säger %r, facit %d"
                           % (fo, f["oppningar"]))

    # ☠️ FLIKGRINDEN ÄR EN LIVE-GRIND. `G.flikfel` letar efter <summary>,
    #    som butiken skapar av våra <h2>. Offline finns bara <h2>, alltså
    #    fäller den varje korrekt sida. Offline kontrolleras rubrikerna som
    #    rubriker i stället — och ORDNINGEN, för blockordningen är inte fri.
    if live:
        for x in G.flikfel(html):
            fel.append("FLIK: %s" % x)
    else:
        rubriker = re.findall(r"<h2>([^<]+)</h2>", html)
        for kravd in G.FLIKAR_SOM_KRAVS:
            if rubriker.count(kravd) != 1:
                fel.append("RUBRIK %r förekommer %d gånger, ska vara 1"
                           % (kravd, rubriker.count(kravd)))
        if "Passar inte den här?" in rubriker and \
                rubriker.index("Passar inte den här?") > \
                rubriker.index("Tekniska specifikationer"):
            fel.append("KORSLÄNKSBLOCKET ligger EFTER spec-fliken — "
                       "det hamnar då inne i den fliken")

    if not live:
        for x in G.granska_namn(T.NAMN[pid]):
            fel.append("NAMN: %s" % x)

    return fel


def kor(pids=None):
    pids = pids or list(T.NAMN)
    tot = 0
    for pid in pids:
        f = granska(pid)
        tot += len(f)
        print("%s  %s" % (pid, "OK" if not f else "%d FEL" % len(f)))
        for x in f:
            print("    " + x)
    print("\n%d sidor, %d fel" % (len(pids), tot))
    return tot


if __name__ == "__main__" and "--sjalvtest" not in sys.argv:
    sys.exit(1 if kor() else 0)


# ---------------------------------------------------------------- självtest
# ☠️ ETT SJÄLVTEST BEVISAR ATT KODEN FÖLJER FACIT, ALDRIG ATT FACIT ÄR SANT
#    (uppgift #505). Det det DÄREMOT bevisar är att varje grind FAKTISKT
#    fäller — en grind som aldrig fyrat är skriven, inte mätt. Varje fall
#    nedan muterar en KORREKT text och kräver att rätt grind fäller.

def _fel_pa(pid, gammalt, nytt):
    """Muterar texten och returnerar grindens utfall."""
    import texter
    orig = texter.bygg
    html = orig(pid)
    if gammalt not in html:
        return ["MUTATIONEN BET INTE: %r saknas i texten" % gammalt[:40]]
    return granska(pid, html=html.replace(gammalt, nytt))


def sjalvtest():
    fall, fel = 0, 0

    def prov(vad, ok):
        nonlocal fall, fel
        fall += 1
        if not ok:
            fel += 1
            print("  SJÄLVTEST FALLER: " + vad)

    # 1. Talgrinden fäller ett ohärlett tal.
    prov("ohärlett tal fälls",
         any("OHÄRLETT TAL" in x for x in _fel_pa("09336fdf", "50 cm hög", "52 cm hög")))
    # 2. ... och släpper igenom ett tal som STÅR i facit.
    prov("facittal släpps igenom",
         not any("OHÄRLETT TAL" in x for x in _fel_pa("09336fdf", "Ø18 cm", "Ø18 cm")))
    # 3. Tyskt ord.
    prov("tyskt ord fälls",
         any("TYSKT ORD" in x for x in _fel_pa("d0b80807", "plysch och sisal", "Plüsch och sisal")))
    # 4. Husmärke.
    prov("husmärke fälls",
         any("HUSMÄRKE" in x for x in _fel_pa("d0b80807", "Två kojor", "PawHut. Två kojor")))
    # 5. Avsändarland.
    prov("avsändarland fälls",
         any("AVSÄNDARLAND" in x for x in _fel_pa("f6857ca0", "Vagga i furu", "Skickas från Tyskland. Vagga i furu")))
    # 6. Pris.
    prov("pris fälls",
         any("PRIS" in x for x in _fel_pa("f6857ca0", "Levereras omonterad", "Kostar 899 kr")))
    # 7. Intern jargong — rundans EGET fel, fem gånger i första utkastet.
    prov("intern jargong fälls",
         any("JARGONG" in x for x in _fel_pa("38022bcb", "Sockeln på", "Rundans högsta. Sockeln på")))
    # 8. Sortimentssuperlativ — evaderar #7 genom att peka på butiken.
    prov("sortimentssuperlativ fälls",
         any("SORTIMENTSSUPERLATIV" in x
             for x in _fel_pa("f4e6159e", "vilket är en smal öppning",
                              "vilket är den smalaste öppningen vi säljer")))
    # 9. Varuvikt — okänd för alla sex.
    prov("varuvikt fälls",
         any("VARUVIKT" in x for x in _fel_pa("668e0e0c", "Levereras omonterad", "Den väger 15 kg")))
    # 10. Maxlast där källan saknar den.
    prov("ogrundad maxlast fälls",
         any("MAXLAST påstådd" in x for x in _fel_pa("09336fdf", "Kommer hopmonterad", "Bär 20 kg")))
    # 11. ... och den maxlast som FINNS måste stå kvar.
    #     ☠️ MUTATIONEN MÅSTE TA BORT ALLA FÖREKOMSTER. Första versionen bytte
    #     bara punktlistans "Bär 10 kg" och lämnade brödtextens "bär 10 kg
    #     totalt" kvar — grinden hittade den och fyrade riktigt, alltså föll
    #     testet på sin egen mutation. Rätta per ORD, inte per förekomst.
    #     Maxlasten står på FYRA ställen (punktlista, brödtext, spec-rad, FAQ),
    #     så mutationen är ett regex över alla — inte fyra strängbyten.
    #     ☠️ MÖNSTRET MÅSTE FÅ KORSA TAGGAR — och `</strong>` innehåller
    #     BOKSTÄVER. Spec-raden är `<li><strong>Maxlast:</strong> 10 kg</li>`,
    #     så varken `[^<]` eller `[^a-zåäö]` mellan etikett och värde kan
    #     matcha den. Tre försök i rad föll på just den raden; en naken `.`
    #     är det som fungerar i en testmutation.
    _h = re.sub(r"(?:b[äa]r|maxlast).{0,30}?10\s*kg",
                "stadig", T.bygg("f4e6159e"), flags=re.I | re.S)
    prov("saknad maxlast fälls",
         any("står inte i texten" in x for x in granska("f4e6159e", html=_h)))
    # 12. ☠️ TYPORDET. `668e0e0c` är en LÅDA — ordet "tunna" i namnet är det
    #     fel hela rundans Steg 5 handlade om.
    import texter as _T
    _spara = _T.NAMN["668e0e0c"]
    _T.NAMN["668e0e0c"] = "Klöstunna 81 cm i mörkgrått"
    prov("förbjudet typord i namnet fälls",
         any("FÖRBJUDET TYPORD" in x for x in granska("668e0e0c")))
    _T.NAMN["668e0e0c"] = _spara
    # 13. ... och den korrekta texten är GRÖN efter återställningen.
    prov("korrekt text är grön igen", not granska("668e0e0c"))
    # 14. Fel antal öppningar.
    prov("fel öppningsantal fälls",
         any("FEL ANTAL ÖPPNINGAR" in x
             for x in _fel_pa("38022bcb", "tre plan och tre hålor",
                              "tre plan och två hålor")))
    # 15. Blockordningen: korslänkarna EFTER spec-fliken hamnar inne i den.
    prov("korslänk efter spec-fliken fälls",
         any("KORSLÄNKSBLOCKET" in x for x in granska(
             "f6857ca0",
             html=T.bygg("f6857ca0").replace(
                 "<h2>Passar inte den här?</h2>", "<h2>ZZZ</h2>")
             + "<h2>Passar inte den här?</h2>")))
    # 16. En dubblerad flikrubrik.
    prov("dubblerad flikrubrik fälls",
         any("förekommer 2" in x for x in granska(
             "f6857ca0",
             html=T.bygg("f6857ca0") + "<h2>Vanliga frågor</h2>")))

    print("%d fall, %d fel" % (fall, fel))
    return fel


if __name__ == "__main__" and "--sjalvtest" in sys.argv:
    sys.exit(1 if sjalvtest() else 0)
