# -*- coding: utf-8 -*-
"""Runda 138 — textgrinden, med självtest åt BÅDA hållen.

☠️ ETT SJÄLVTEST SOM BARA PRÖVAR ATT GRINDEN SLÄPPER IGENOM RÄTT TEXT ÄR
   INGEN GRIND. Varje mönster har minst ett fall som SKA fälla och ett som
   INTE ska (uppgift #505).

☠️ TVÅ SAKER ÄR ÄNDRADE MOT RUNDA 137, båda uppmätta i den här rundan:

   1. `SPECIFIKA` går genom `grindar.pastaenden`, inte genom en naken
      `finditer`. Rundans förbud är REGEXAR över påståenden, och en naken
      sökning kan inte skilja ett påstående från ett FÖRNEKANDE. Mätt: den
      fällde `1366a476`:s "står fritt på golvet och inte behöver spännas mot
      taket" — alltså en mening som säger raka motsatsen till det förbjudna.
      Spegelbilden av uppgift #415.

      ⚠️ OCH `NEKORD` SKA INTE VIDGAS för att täcka "A i stället för B".
      Den konstruktionen HÄVDAR A och förnekar B, medan NEKORD är
      meningsnivå — ett tillägg hade ursäktat "Den spänns mot taket i
      stället för att skruvas i väggen", ett äkta påstående. Rätt svar var
      att skriva ut negationen i texten.

   2. `G.TREKONSONANT`, inte `hasattr(G, "trekonsonant")`. Runda 137 kallade
      den vid fel namn bakom en `hasattr`-vakt, så regeln körde ALDRIG och
      raden såg ut att vara på plats. ☠️ En vakt som tystar sin egen regel
      när namnet är fel är värre än ingen vakt: den ser ut som täckning.
"""
import os
import re
import sys

HAR = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, os.path.join(HAR, ".."))
sys.path.insert(0, HAR)
import grindar as G                                              # noqa: E402
import matt as M                                                 # noqa: E402
import texter as T                                               # noqa: E402


def _vikt(ord_):
    """Ordgräns som fungerar på svenska — `\\b` räcker inte (uppgift #324)."""
    return re.compile(r"(?<![0-9A-Za-zÅÄÖåäöÉéÜü])" + ord_
                      + r"(?![0-9A-Za-zÅÄÖåäöÉéÜü])", re.I)


FORBJUDET = [
    (re.compile(r"\b(?:som|se)\s+(?:ovan|nedan|ovanst[åa]ende|f[öo]reg[åa]ende)\b"
                r"|\b(?:ovanst[åa]ende|nedanst[åa]ende)\b", re.I),
     "SIDHÄNVISNING — en produktsida har inget 'ovan'"),
    (re.compile(r"^Samma\s+\w+", re.I),
     "DINGLANDE SYSKONREFERENS — en ingress som börjar med `Samma` syftar "
     "på en ordning som bara finns i filen, inte på sidan"),
    (re.compile(r"\brundan\b|\brunda\s+\d+|\bbatch\b|\butkast\b", re.I),
     "INTERN JARGONG — ord ur arbetsprocessen"),
    (re.compile(r"\bmarknadens\b|\bbranschens\b|\bstarkast\w*\b", re.I),
     "SUPERLATIV utan mätvärde"),
    # ☠️ OMLJUDET. `grovast` FINNS INTE i svenskan — grov böjs `grövst`, och
    #    runda 137:s mönster bar bara o-formen. Dess självtest använde
    #    dessutom `grovaste`, alltså exakt den stavning grinden kunde se, så
    #    gapet var grönt hela rundan. Ett självtest skrivet efter MÖNSTRET i
    #    stället för efter SPRÅKET bevisar bara att mönstret är sig självt likt.
    #    Samma familj som uppgift #467 och #442. Tillagt: grövst, längst,
    #    tjockast, tätast.
    (re.compile(r"\b(?:h[öo]gst|l[äa]gst|mest|st[öo]rst|minst|tyngst|"
                r"l[äa]ttast|rymligast|smalast|bredast|djupast|gr[öo]vst|"
                r"l[äa]ngst|tjockast|t[äa]tast)\w*\b"
                r"[^.]{0,45}\b(?:vi\s+(?:s[äa]ljer|har|f[öo]r)|i\s+(?:v[åa]rt\s+)?"
                r"sortiment\w*|hos\s+oss|i\s+butiken|av\s+v[åa]ra)", re.I),
     "SORTIMENTSSUPERLATIV — ogrundad jämförelse mot hela butiken"),
    # ⚠️ `i familjen` är BORTTAGET ur mönstret mot runda 137. Rundans egna
    #    FAQ:er jämför medvetet inom SERIEN ("den grövsta stammen i serien"),
    #    och det är en mätbar jämförelse mellan sju kända tal — inte ett
    #    påstående om butiken. Sortimentsordet är kvar.
    (re.compile(r"\ben\s+(?:\w+[^t\s]\s+)?(?:fogmunstycke|m[öo]belmunstycke"
                r"|munstycke|utrymme|material|sn[öo]re|golv|rum|tecken|l[äa]ge"
                r"|st[äa]lle|m[åa]tt|plan|tak|hus|katthus|kl[öo]str[äa]d|steg"
                r"|underlag|glapp|sp[äa]nne|taksp[äa]nne|kliv|rep|bomullsrep"
                r"|varv|f[äa]ste|halkskydd|slitage)\b", re.I),
     "GENUSFEL — ordet är neutrum och tar `ett`, inte `en`"),
    (re.compile(r"\bleverant[öo]r(?:en|ens)?\b", re.I),
     "MOT KUNDEN ÄR VI LEVERANTÖREN"),
    (re.compile(r"PawHut|HOMCOM|Outsunny|Aiyaplay|Aosom|AliExpress|Vinsetto", re.I),
     "LEVERANTÖRS- ELLER HUSMÄRKE"),
    (re.compile(r"\bskickas\s+fr[åa]n\b|\bfr[åa]n\s+v[åa]rt\s+lager\s+i\b"
                r"|\bTyskland\b|\bSpanien\b|\bPolen\b|\bKina\b", re.I),
     "AVSÄNDARLAND — bara EU-lager-ribbonen får bära det"),
    (re.compile(r"\bkattr[äa]d\b", re.I),
     "FELSTAVNING — katt+träd = kattträd, och husets ord är `klösträd`"),
]

# ☠️ REGLER SOM BARA FÅR LÄSA KÄLLTEXTEN. Båda träffar BUTIKENS EGET chrome
#    på varje korrekt publicerad sida — runda 137 mätte 112 falska fel, varav
#    102 kom härifrån. Se `grindar.livetext`.
ENDAST_KALLTEXT = [
    (re.compile(r"\b\d+\s*(?:kr|kronor|SEK)\b|\bpris(?:et|er)?\s+[äa]r\b", re.I),
     "PRIS I BRÖDTEXTEN"),
    (re.compile(r"\b(?:levereras|kommer fram|hos dig|leverans)\s+(?:inom|p[åa])\s+"
                r"\d+|\b\d+\s*[-–]\s*\d+\s*(?:arbetsdag|vardag|dag)\w*", re.I),
     "LEVERANSLÖFTE — vi lovar ingen leveranstid i produkttexten"),
]

# ☠️ Rundans egna förbud är REGEXAR (`50\s*%`, `\bsisal`), inte ord — därför
#    kompileras de rakt av, inte via `_vikt`.
SPECIFIKA = {pid: [(re.compile(m, re.I),
                    "FÖRBJUDET PÅSTÅENDE %r för %s" % (m, pid))
                   for m in monster]
             for pid, monster in M.FORBJUDNA_PASTAENDEN.items()}

TAL_RE = re.compile(r"(?<![\w,.])(\d{1,3}(?:,\d{1,2})?)(?![\w])")

# Ordningstal och antal som inte är mått.
TAL_FRIA = {1, 2, 3, 4}


def _talgrind(pid, stycke):
    """Ett tal måste finnas i facit. Zonindelat per STYCKE; länkstycken bär
    SYSKONENS tal och hoppas över (uppgift #437, #507)."""
    if "<a href" in stycke:
        return []
    fel = []
    txt = G.strip_taggar(stycke)
    for m in TAL_RE.finditer(txt):
        v = float(m.group(1).replace(",", "."))
        if v in TAL_FRIA:
            continue
        if v not in M.TAL[pid]:
            fel.append("OHÄRLETT TAL %s — %r"
                       % (m.group(1), G.mening_kring(txt, m.start())[:90]))
    return fel


RAKNEORD = {"två": 2, "tre": 3, "fyra": 4, "fem": 5, "sex": 6,
            "sju": 7, "åtta": 8, "nio": 9, "tio": 10}


def _antalsgrind(pid, html):
    """Ett räkneord framför en spec-etikett måste stämma med spec-radens antal."""
    fel = []
    antal = {}
    for etikett, varde in T.SPEC[pid]:
        m = re.match(r"^(\d+)(?:\s*st\b|,)", varde.strip())
        if m:
            antal[etikett.lower()] = int(m.group(1))
    if not antal:
        return fel
    for stycke in re.split(r"(?=<p|<li)", html):
        if "<a href" in stycke:
            continue
        txt = G.strip_taggar(stycke)
        for etikett, n in antal.items():
            m = re.compile(r"(?<![0-9A-Za-zÅÄÖåäöÉé])(%s)\s+(?:\w+\s+){0,2}%s"
                           r"(?![0-9A-Za-zÅÄÖåäö])"
                           % ("|".join(RAKNEORD), re.escape(etikett)), re.I)
            for t in m.finditer(txt):
                v = RAKNEORD[t.group(1).lower()]
                if v != n:
                    fel.append("FEL ANTAL %r — spec säger %d, texten %d: %r"
                               % (etikett, n, v, G.mening_kring(txt, t.start())[:90]))
    return fel


def _klosytegrind(pid, syn):
    """Klösytan i texten måste vara den som `matt.KLOSYTA` anger.

    ☠️ TRE AV SJU ÄR INTE SISAL, och det är rundans farligaste förväxling:
       familjen ser likadan ut och grannens ord smyger lätt in. Spec-raden
       `Klösstam`/`Klösstammar` är facit och byggs ur tyskans Technische
       Daten; prosan måste säga samma sak.
    """
    ratt = M.KLOSYTA[pid]
    andra = {"sisal", "bomullsrep", "jute"} - {ratt}
    fel = []
    for ord_ in andra:
        for m in G.pastaenden(syn, _vikt(ord_)):
            fel.append("FEL KLÖSYTA %r — facit är %r: %r" % (ord_, ratt, m[1][:90]))
    if not _vikt(ratt).search(syn):
        fel.append("KLÖSYTAN %r nämns inte alls" % ratt)
    return fel


def granska(pid, html=None, live=False):
    fel = []
    h = html if html is not None else T.bygg(pid)
    falt = [("namn", T.NAMN[pid]), ("titel", T.TITEL[pid]), ("meta", T.META[pid]),
            ("slug", T.SLUG[pid]), ("sokord", T.SOKORD[pid])]

    if live:
        fel.extend("FLIKSTRUKTUR: %s" % x for x in G.flikfel(h))
        # ☠️ LIVE-UNDERLAGET ÄR SIDANS EGNA MENINGAR (grindar.livetext).
        #    Tvätten görs av `liverunda.kor`, inte här (uppgift #452).
        syn = G.livetext(h, T.SLUG[pid], T.NAMN[pid])
    else:
        syn = G.strip_taggar(h)

    allt = syn + " " + " ".join(v for _, v in falt)

    for monster, skal in (FORBJUDET if live else FORBJUDET + ENDAST_KALLTEXT):
        for m in monster.finditer(allt):
            fel.append("%s: %r" % (skal, G.mening_kring(allt, m.start())[:110]))

    # ☠️ PÅSTÅENDEGRIND, inte finditer — se modulens docstring.
    for monster, skal in SPECIFIKA.get(pid, []):
        for _traff, mening in G.pastaenden(allt, monster):
            fel.append("%s: %r" % (skal, mening[:110]))

    if not live:
        fel.extend(_antalsgrind(pid, h))
        fel.extend(_klosytegrind(pid, allt))

    for m in G.ARTNR.finditer(allt):
        fel.append("ARTIKELNUMMER %r" % m.group(0))
    for o, s in G.versalfel(allt):
        fel.append("VERSAL MITT I ORD %r — %r" % (o, s))
    # ☠️ RÄTT NAMN, ingen hasattr-vakt — se modulens docstring.
    for m in G.TREKONSONANT.finditer(allt):
        fel.append("TRE LIKA KONSONANTER %r" % G.mening_kring(allt, m.start())[:90])

    if not live:
        # Butikens chrome bär `🚚`, `·`, `⤢` och `→` — inget av det är vår text.
        for x in G.homoglyfer(allt):
            fel.append("OSYNLIGT TECKEN %r" % (x,))
        for st in re.split(r"(?i)</(?:p|li)>", h):
            fel.extend(_talgrind(pid, st))
        if len(T.NAMN[pid]) > 80:
            fel.append("NAMN %d tecken (tak 80)" % len(T.NAMN[pid]))
        if T.TITEL[pid] == T.NAMN[pid]:
            fel.append("TITEL == NAMN")
        if len(T.TITEL[pid]) > 60:
            fel.append("TITEL %d tecken (tak 60)" % len(T.TITEL[pid]))
        if len(T.META[pid]) > 155:
            fel.append("META %d tecken (tak 155)" % len(T.META[pid]))
        ratt, forbjudna = M.TYP[pid]
        for falt_namn, v in falt[:3]:
            if not _vikt(ratt).search(v):
                fel.append("%s saknar huvudordet %r" % (falt_namn, ratt))
            for f in forbjudna:
                if _vikt(f).search(v):
                    fel.append("%s bär FEL TYPORD %r" % (falt_namn, f))
        # ⚠️ BARA `7bdc47b8` HAR ETT SYSKON i den här rundan, till skillnad
        #    från runda 137 där alla åtta var färgpar. En naken `M.SYSKON[pid]`
        #    hade kastat KeyError på sex av sju.
        if pid in M.SYSKON:
            slug = M.SYSKON[pid][0]
            if slug not in h:
                fel.append("korslänken till syskonet %s saknas" % slug)
    return fel


# ── självtest ────────────────────────────────────────────────────────────
FALL = [
    ("Samma takspända konstruktion som ovan, men i grått.", True, "sidhänvisning ovan"),
    ("Se nedan för mått.", True, "sidhänvisning nedan"),
    ("Stammen är lindad med jute hela vägen upp.", False, "ren mening"),
    ("Katten kan klättra upp ovanpå bädden.", False, "ovanpå är ingen hänvisning"),
    ("Det här är den grövsta stammen vi har.", True, "sortimentssuperlativ vi har"),
    ("Det är den längsta stammen vi säljer.", True, "omljud längst"),
    ("Den tjockaste dynan i vårt sortiment.", True, "tjockast"),
    ("Det är den grövsta stammen i serien.", False,
     "jämförelse inom serien, mot sju kända tal"),
    ("Trädet har en steg som är brett.", True, "genusfel en steg"),
    ("Trädet har ett steg som är brett.", False, "rätt neutrum"),
    ("Ett smalt fogmunstycke når in.", False, "rätt neutrum fogmunstycke"),
    ("En smal fogmunstycke når in.", True, "genusfel fogmunstycke"),
    ("Ett varv som lossnat trycks tillbaka.", False, "rätt neutrum varv"),
    ("En varv som lossnat trycks tillbaka.", True, "genusfel varv"),
    ("Leverantören rekommenderar en vägg.", True, "vi är leverantören"),
    ("Möbeln skickas från Tyskland.", True, "avsändarland"),
    ("Priset är 899 kr.", True, "pris i brödtexten"),
    ("Levereras inom 3 dagar.", True, "leveranslöfte"),
    ("Ett katträd för katten.", True, "felstavat katträd"),
    ("Ett klösträd för katten.", False, "rätt husord"),
    ("Kojan mäter 30 × 30 cm i rundan.", True, "intern jargong"),
]


def sjalvtest():
    """Returnerar (fel, antal körda fall) — tupeln krävs av `liverunda.kor`."""
    fel, fall = [], 0
    for txt, ska, etikett in FALL:
        fall += 1
        traff = any(m.search(txt) for m, _ in FORBJUDET + ENDAST_KALLTEXT)
        if traff != ska:
            fel.append("SJÄLVTEST %r: förväntade %s, fick %s"
                       % (etikett, "FÄLL" if ska else "SLÄPP",
                          "FÄLL" if traff else "SLÄPP"))

    # ☠️ PÅSTÅENDEGRINDEN, båda hållen — rundans egen lärdom. Ett naket
    #    `search` klarar bara det första fallet.
    tak = SPECIFIKA["1366a476"]
    fall += 1
    if not any(G.pastaenden("Trädet spänns mot taket.", m) for m, _ in tak):
        fel.append("SJÄLVTEST: påståendegrinden släpper ett ÄKTA påstående")
    fall += 1
    if any(G.pastaenden("Trädet spänns inte mot taket.", m) for m, _ in tak):
        fel.append("SJÄLVTEST: påståendegrinden fäller ett FÖRNEKANDE")
    fall += 1
    if not any(G.pastaenden("Konstruktionen ger 50 % bättre stabilitet.", m)
               for m, _ in tak):
        fel.append("SJÄLVTEST: 50 %-påståendet fälls inte")

    # Klösytegrinden, båda hållen.
    fall += 1
    if not _klosytegrind("fecadb3e", "Stammen är lindad med sisal."):
        fel.append("SJÄLVTEST: klösytegrinden släpper FEL material")
    fall += 1
    if _klosytegrind("fecadb3e", "Stammen är lindad med jute."):
        fel.append("SJÄLVTEST: klösytegrinden fäller RÄTT material")
    fall += 1
    if not _klosytegrind("fecadb3e", "Stammen är grov."):
        fel.append("SJÄLVTEST: klösytegrinden släpper en text UTAN klösyta")

    # Talgrinden, båda hållen.
    fall += 1
    if not _talgrind("505a0dde", "<p>Stammen är 22 cm.</p>"):
        fel.append("SJÄLVTEST: talgrinden släpper ett ohärlett tal")
    fall += 1
    if _talgrind("505a0dde", "<p>Stammen är 9,1 cm.</p>"):
        fel.append("SJÄLVTEST: talgrinden fäller ett härlett tal")
    fall += 1
    if _talgrind("505a0dde", '<p>Se <a href="x">klösträd 140 cm</a>.</p>'):
        fel.append("SJÄLVTEST: talgrinden fäller ett tal i ett LÄNKstycke")

    # Trekonsonantgrinden — den som runda 137 kallade vid FEL NAMN.
    fall += 1
    if not G.TREKONSONANT.search("En hoppplattform i plysch."):
        fel.append("SJÄLVTEST: trekonsonantgrinden släpper `hoppplattform`")
    fall += 1
    if G.TREKONSONANT.search("En hopplattform i plysch."):
        fel.append("SJÄLVTEST: trekonsonantgrinden fäller korrekt stavning")

    return fel, fall


if __name__ == "__main__":
    st, fall = sjalvtest()
    for x in st:
        print("☠️", x)
    print("grind.sjalvtest(): %d fall, %d fel" % (fall, len(st)))
    print()
    tot = 0
    for pid in T.NAMN:
        f = granska(pid)
        tot += len(f)
        print("%-10s %s" % (pid, "OK" if not f else "%d fel" % len(f)))
        for x in f:
            print("     ☠️", x)
    print("\n%d produkter, %d fel" % (len(T.NAMN), tot))
    raise SystemExit(1 if (st or tot) else 0)
