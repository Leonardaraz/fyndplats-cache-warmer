# -*- coding: utf-8 -*-
"""Runda 135 — textgrinden. Körs FÖRE varje skrivning till Wix.

☠️ SKRIV TEXTEN I EN FIL OCH GRINDA DEN — uppmätt 9 fel mot 0 (2026-09-04).
   En sträng som skrivs direkt i ett JSON-anrop kan inte läsas av en grind
   innan den lämnar chatten, och API-svaret ekar tillbaka exakt det man skrev.

☠️ EN GRIND ÄRVS INTE BLINT. Runda 134 förbjöd ordet "träd" som material,
   för att källan där bara sa spånskiva. Två av den här rundans åtta ÄR av
   trä enligt källan (`5d64f423` har trästolpar, `0696efce` en topplatta i
   trä), så samma rad hade fällt två KORREKT skrivna sidor. Den är ersatt av
   ett förbud mot HELHETSUTSAGAN "massivt trä", som ingen av de åtta stöder.
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


def _vikt(ord_):
    """Huvudordet som regex där varje ä/å/ö också matchar sin ASCII-form."""
    par = {"ä": "[äa]", "å": "[åa]", "ö": "[öo]"}
    return re.compile("".join(par.get(t, re.escape(t)) for t in ord_), re.I)


FORBJUDET = [
    (re.compile(r"\bCE-?m[äa]rkt\w*|\bCE-?certifi|\btestad\s+enligt"
                r"|\bEN\s*71\b|\bklass\s*E1\b", re.I),
     "CERTIFIERINGSPÅSTÅENDE — ingen källa anger någon norm vi kan kontrollera"),
    (re.compile(r"\bmassivt?\s+tr[äa]\b|\b[äa]kta\s+tr[äa]\b", re.I),
     "MASSIVT TRÄ som helhetsutsaga — sockeln är spånskiva eller MDF"),
    # ☠️ TIPPSKYDDET. Ingen av de åtta har väggrem eller takspänne i sin
    #    leveranslista, alltså får ingen sådan utfästelse göras. Runda 25:s
    #    grind för familjen, oförändrad.
    (re.compile(r"\btippskydd\w*|\bv[äa]ggrem\w*|\btakspänn\w*|\bv[äa]ltar\s+inte"
                r"|\bkan\s+inte\s+v[äa]lta", re.I),
     "TIPPSKYDD — ingen av de åtta levereras med rem eller spänne"),
    (re.compile(r"\bv[äa]ger\s+\d|\begenvikt\w*|\bvikt:\s*\d", re.I),
     "VARUVIKT — okänd för alla åtta, spec-blockets tal är fraktvikten"),
    (G.JARGONG, "INTERN JARGONG i kundtext"),
    (re.compile(r"\brundans?\b|\bbatchen\b|\butkast\w*\b", re.I),
     "INTERN JARGONG — ord ur arbetsprocessen"),
    (re.compile(r"\bmarknadens\b|\bbranschens\b|\bstarkast\w*\b", re.I),
     "SUPERLATIV utan mätvärde"),
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
    (re.compile(r"Kratz|Katzen|H[öo]hle\b|Liegefl|Sisalmatte|Spanplatte"
                r"|Pl[üu]sch\b|Wei[ßs]\b|Hellbraun|Hellgrau|Rohrkolben"
                r"|Birnbaumholz|Gesamtabmessung|Lieferumfang|Belastung",
                re.I),
     "TYSKT ORD kvar i texten"),
]

# ☠️ REGLER OM SVENSKAN GÄLLER ÄVEN KORSLÄNKARNAS ANKARTEXT.
#    `utan_korslankar` skär bort korslänksblocket ur `eget`, och det är RÄTT
#    för påståenden: grannens mått och material är inte våra utsagor. Men det
#    är FEL för stavning — ankartexten är en sträng VI skriver, om än om en
#    annan produkt.
#
#    Uppmätt i den här rundan: `giraffform` stod kvar i ankartexten mot
#    grannen `klostrad-101-cm-giraff-med-tunnel` EFTER att grannens eget namn
#    rättats till `girafform` samma dag. Rundans grind var grön på alla åtta;
#    det som fällde ordet var en grep över den SERIALISERADE payloaden.
#
#    Listan nedan körs därför mot HELA den synliga texten, korslänkar
#    inräknade, medan `FORBJUDET` fortsätter köras mot `eget`.
SVENSKAN = [
    (G.TREKONSONANT, "TRE LIKA KONSONANTER — svenskan förenklar till två"),
]

# ☠️ REGLER SOM BARA GÄLLER VÅR KÄLLTEXT, aldrig en renderad sida.
#    Butiken skriver SJÄLV ut priset på varje publicerad produktsida, så en
#    prisgrind mot sidan fäller varje korrekt sida — runda 134 mätte det.
ENDAST_KALLTEXT = [
    (re.compile(r"\b\d+\s*(?:kr|SEK|:-)\b|\bpris(?:et|er)?\s+[äa]r\b", re.I),
     "PRIS i kundtext"),
]

TAL = re.compile(r"(?<![\w,.])(\d+(?:[,.]\d+)?)(?![\w])")
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
    if live:
        # ☠️ LIVE-LÄGET FÅR INTE LÄSA HELA SIDAN — se runda 134:s mätning:
        #    3 942 "fel" på sex KORREKTA sidor när `syn` sattes till den
        #    tvättade men OTOLKADE HTML:en. Rätt underlag är sidans EGNA
        #    meningar plus rundans egna fält.
        egna, _ = G.egna_meningar(html, T.SLUG[pid], T.NAMN[pid])
        syn = G.synlig_meningstext(
            "<p>%s</p><p>%s</p><p>%s</p><p>%s</p><p>%s</p>"
            % (egna, T.NAMN[pid], T.TITEL[pid], T.META[pid], T.SOKORD[pid]))
        eget = syn
    else:
        syn = G.synlig_meningstext(html)
        eget = G.synlig_meningstext(utan_korslankar(html, pid))
    fel = []

    for namn, text in falt(pid):
        if live and namn != "brödtext":
            continue
        provtext = eget if namn == "brödtext" else text
        listor = FORBJUDET if live else FORBJUDET + ENDAST_KALLTEXT
        for monster, skal in listor:
            for m in monster.finditer(provtext):
                fel.append("%s: %s — %r"
                           % (namn, skal, G.mening_kring(provtext, m.start())[:110]))
        # Språkreglerna läser HELA texten, alltså även korslänkarna.
        heltext = syn if namn == "brödtext" else text
        for monster, skal in SVENSKAN:
            for m in monster.finditer(heltext):
                fel.append("%s: %s — %r"
                           % (namn, skal, G.mening_kring(heltext, m.start())[:110]))
        for h in G.homoglyfer(text):
            fel.append("%s: HOMOGLYF %r" % (namn, h))
        # ☠️ VERSAL MITT I ETT ORD. Rundans alt-text bar `inneslL` och
        #    varenda annan grind var grön — se grindar.versalfel(). Körs på
        #    `text`, alltså inte på LIVE-sidans HTML: butikens egen markup
        #    och JSON-LD är full av `camelCase`.
        if not live:
            for ord_, sammanhang in G.versalfel(text):
                fel.append("%s: VERSAL MITT I ORD %r — %r"
                           % (namn, ord_, sammanhang))
        for m in G.ARTNR.finditer(text):
            fel.append("%s: ARTIKELNUMMER %r" % (namn, m.group(0)))

    for namn, text in falt(pid)[:4]:
        if live:
            break
        if not _vikt(huvudord).search(text):
            fel.append("%s: saknar huvudordet %r" % (namn, huvudord))
        if forbjudet_ord and _vikt(forbjudet_ord).search(text):
            fel.append("%s: FÖRBJUDET TYPORD %r — varan är en %s"
                       % (namn, forbjudet_ord, huvudord))

    # ☠️ LIVE-LÄGET SLUTAR HÄR. Allt nedanför prövar RUNDANS KÄLLTEXT mot
    #    facit, och på en LIVE-sida finns butikens egna tal: priset,
    #    telefonnumret, Google-betyget, bloggänkens årtal. Ingen av dem är
    #    ett påstående om VARAN. Runda 134 mätte 25-26 "fel" per korrekt sida
    #    när grinden kördes vidare.
    if live:
        return fel + ["FLIKFEL: %s" % p for p in G.flikfel(html)]

    for namn, text in falt(pid):
        provtext = eget if namn == "brödtext" else text
        for m in TAL.finditer(provtext):
            v = float(m.group(1).replace(",", "."))
            if v in TAL_UNDANTAG or v in f["tal"] or int(v) in f["tal"]:
                continue
            fel.append("%s: OHÄRLETT TAL %s — %r"
                       % (namn, m.group(1), G.mening_kring(provtext, m.start())[:100]))

    # ☠️ MAXLAST ÄR BARA `Maximale Belastung`. `Maximales Katzengewicht` och
    #    `Empfohlenes Haustiergewicht` är KATTENS vikt — ett annat påstående,
    #    och att blanda ihop dem är samma klass som `Vikt` = fraktvikt.
    harm = re.search(r"\b(?:b[äa]r|t[åa]l|maxlast)\w*\b[^.]{0,20}?(\d+)\s*kg",
                     syn, re.I)
    if harm and f["maxlast"] is None:
        fel.append("MAXLAST påstådd men källan har ingen: %r" % harm.group(0))
    if f["maxlast"] is not None:
        if not harm:
            fel.append("MAXLAST %s kg finns i källan men står inte i texten"
                       % f["maxlast"])
        elif int(harm.group(1)) != f["maxlast"]:
            fel.append("MAXLAST i texten är %s kg, facit säger %s"
                       % (harm.group(1), f["maxlast"]))

    # Kattens vikt ska stå där källan har den — det är talet kunden mäter mot.
    if f["kattvikt"] and not re.search(r"katt\w*[^.]{0,60}\d+\s*kg|\d+\s*kg[^.]{0,40}katt",
                                       syn, re.I):
        fel.append("KATTVIKT %r finns i källan men står inte i texten"
                   % f["kattvikt"])

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

    for x in G.granska_namn(T.NAMN[pid]):
        fel.append("NAMN: %s" % x)

    return fel


def sjalvtest():
    """Returnerar (fel-lista, antal fall). ☠️ KONTRAKTET ÄR EN TVÅTUPEL —
    runda 134 returnerade bara antalet och live-grinden dog på det."""
    fel, fall = [], 0

    def pa(text, vantat, vad):
        nonlocal fall
        fall += 1
        # ☠️ BÅDA listorna. Självtestet läste bara FORBJUDET, så när
        #    trekonsonantsregeln flyttades till SVENSKAN slutade dess tre
        #    fall pröva någonting — ett självtest som blir grönt för att
        #    det slutat mäta. Samma familj som en tom läsare.
        traff = any(m.search(text) for m, _ in FORBJUDET + SVENSKAN)
        if traff != vantat:
            fel.append("%s: väntat %s, fick %s (%r)" % (vad, vantat, traff, text))

    pa("En klöspelare i massivt trä", True, "massivt trä fälls")
    pa("Topplatta i trä på 20 × 20 cm", False, "trä som detalj är OK")
    pa("Trästolpar lindade med jute", False, "trästolpar är OK")
    pa("Levereras med tippskydd mot väggen", True, "tippskydd fälls")
    pa("Ställ den mot en vägg", False, "väggplacering är OK")
    pa("Någon väggrem följer inte med", True, "ordet väggrem fälls oavsett riktning")
    pa("En hoppplattform i sisal", True, "tre konsonanter fälls")
    pa("En hopplattform i sisal", False, "rättad form är grön")
    pa("Se www.fyndplats.se", False, "www är ingen sammansättning")
    pa("Klädd i Plüsch", True, "tyskt ord fälls")
    pa("Klädd i plysch", False, "svenska ordet är grönt")
    pa("Testad enligt EN 71", True, "certifieringspåstående fälls")
    pa("MDF av klass E1", True, "E1 fälls — går inte att kontrollera")
    pa("Varan väger 9 kg", True, "varuvikt fälls")

    # Talgrinden mot facit
    fall += 1
    if any("OHÄRLETT" in x for x in granska("0696efce")):
        fel.append("talgrinden fäller en korrekt text")

    # ☠️ Maxlasten får inte gå att påstå där källan saknar den.
    fall += 1
    spar = M.FACIT["cc5da788"]["maxlast"]
    try:
        M.FACIT["cc5da788"]["maxlast"] = None
        if not any("MAXLAST" in x for x in
                   granska("cc5da788", html=T.bygg("cc5da788") + "<p>Den bär 40 kg.</p>")):
            fel.append("maxlastgrinden fångar inte ett påhittat tal")
    finally:
        M.FACIT["cc5da788"]["maxlast"] = spar

    return fel, fall


def kor(pids=None):
    pids = pids or list(T.NAMN)
    tot = 0
    for pid in pids:
        f = granska(pid)
        tot += len(f)
        print("%-9s %s" % (pid, "OK" if not f else "%d FEL" % len(f)))
        for x in f:
            print("     ☠️", x)
    print("\n%d produkter, %d fel" % (len(pids), tot))
    return tot


if __name__ == "__main__":
    sfel, santal = sjalvtest()
    print("grind.sjalvtest(): %d fall, %d fel" % (santal, len(sfel)))
    for x in sfel:
        print("   ☠️", x)
    sys.exit(1 if kor() or sfel else 0)
