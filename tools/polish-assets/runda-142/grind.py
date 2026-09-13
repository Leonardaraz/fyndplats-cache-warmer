# -*- coding: utf-8 -*-
"""Runda 142 — textgrinden, med självtest åt BÅDA hållen (#505).

☠️ RUNDANS EGNA FÖRBUD, utöver den delade modulen:

  1. **Ingen ÅLDER.** `56cca82a` säger `Geeignet für Jugendliche` medan dess
     livsstilsbild visar ett barn i sjuårsåldern (STEG4.md). `f0430bc5` säger
     `Kinder und Jugendliche` där dess egen färgtvilling säger
     `Jugendlichen und Erwachsenern` — samma vara, två olika målgrupper i
     leverantörens underlag. Rundan påstår ingen ålder alls: höjden är det
     som avgör, och den står i spec-tabellen.

  2. **Ingen CERTIFIERING.** Ingenting i underlaget namnger en standard.
     Ordet "certifierad" utan norm är exakt den ogrundade certifiering som
     fälldes i runda 54 (#252).

  3. **Fyllningen INGÅR INTE.** Nio av elva har en fot som ska fyllas, och
     `93073695`:s viktsäck likaså. Att sälja "fylls med 45 kg sand" utan att
     säga att sanden inte följer med är ett löfte vi inte håller.

  4. **`röd och svart` om `136a4671`:s boll.** Båda specfälten säger det.
     Zoomen säger vit, röd OCH blå (STEG4.md). Bilden vinner om en SYNLIG
     egenskap — regel 16.

  5. **Husmärket i TEXTEN.** `HOMCOM` står tryckt på två av säckarna och det
     rör vi inte i bilden (Leonards regel). Ordet får däremot aldrig nå
     namn, titel, meta, slug, sökord, SKU eller alt-text.

☠️ SUPERLATIVGRINDEN ÄR MEKANISK, inte en läsning. Ett jämförande påstående
   inom egen batch går att grinda på tre kodrader (runda 42), och den här
   rundan har tio tal att jämföra: höjdspann och fotens sandkapacitet.
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
import brodtext as B                                             # noqa: E402


def _ordvikt(o):
    """Ordgräns som fungerar på svenska — `\\b` är ASCII-bunden (#324)."""
    return re.compile(r"(?<![0-9A-Za-zÅÄÖåäöÉéÜü])(?:" + o
                      + r")(?![0-9A-Za-zÅÄÖåäöÉéÜü])", re.I)


FORBJUDET = [
    (_ordvikt(r"barn|barnet|barnen|ungdom\w*|tonår\w*|\d+\s*års?\s*ålder"),
     "ÅLDER — rundan påstår ingen ålder, höjden avgör (förbud 1)"),
    (re.compile(r"fr[åa]n\s+\d+\s*[åa]r|\d+\s*[åa]r\s+och\s+upp[åa]t", re.I),
     "ÅLDERSGRÄNS — samma skäl (förbud 1)"),
    (_ordvikt(r"certifierad|certifiering|CE-m[äa]rkt"),
     "OGRUNDAD CERTIFIERING — inget i underlaget namnger en standard"),
    # ☠️ VERSALKANSLIG med flit. `EN 957` ar en standard; `En 205
    #    centimeter hog pelare` ar svenskans obestamda artikel. Under
    #    re.I ar de samma strang, och grinden fallde en korrekt
    #    mening. Samma familj som `Gelb` inne i `regelbundet`.
    (re.compile(r"(?<![0-9A-Za-zÅÄÖåäö])EN[\s-]?\d{3,5}"
                r"(?![0-9A-Za-zÅÄÖåäö])"),
     "OGRUNDAD CERTIFIERING — en namngiven standard utan belägg"),
    (_ordvikt(r"homcom|outsunny|pawhut|aiyaplay|vinsetto|aosom"),
     "HUSMÄRKE i texten — bilden får bära det, texten aldrig"),
    (re.compile(r"sand(?:en)?\s+(?:ing[åa]r|f[öo]ljer\s+med|medf[öo]ljer)"
                r"(?!\s+inte)", re.I),
     "LOVAR FYLLNING — sanden ingår inte (förbud 3)"),
    (re.compile(r"(?:de\s+flesta|m[åa]nga\s+andra|vanliga)\s+"
                r"(?:fristående\s+)?(?:boxningss[äa]ck|punchingboll)", re.I),
     "MARKNADSPÅSTÅENDE om andra tillverkares produkter — inte mätt"),
    # ☠️ Monstret var for SMALT i forsta utkastet: det tog `familjens`
    #    och `seriens` men slappte `i familjen` och `de andra i
    #    familjen` — samma defekt, annan bojning. Tva meningar gick
    #    igenom en gron grind. `omg[åa]ng` ar MEDVETET UTE: "en lang
    #    omgang" ar ett traningsord i den har familjen, inte en
    #    inramning, och ett falsklarm per sida lar lasaren att sluta
    #    lasa grinden.
    (re.compile(r"\bfamilj\w*|\bserien\b|\bseriens\b|\bsortiment\w*"
                r"|\bi\s+den\s+h[äa]r\s+(?:gruppen|omg[åa]ngen)\b", re.I),
     "INTERN INRAMNING — kunden landar på EN sida och ser ingen familj"),
    (re.compile(r"storleksklass", re.I),
     "ODEFINIERAD JÄMFÖRELSEMÄNGD — 'storleksklass' är inte mätt"),
    # ☠️ VI VET INTE-FORMELN. Runbookens Steg 7: "Att skriva att vi inte
    #    vet ... Mot kunden är VI leverantören. Vet vi inte — utelämna,
    #    eller ta reda på det." Grinden saknades i runda 142:s forsta
    #    utkast, och `4fe5959f` skrev "Vikten anges inte for den har
    #    modellen" rakt in i en FAQ. Den PASSIVA formen ar den farliga:
    #    "anges inte", "uppges inte" later som en uppgift om varan i
    #    stallet for ett erkannande att vi inte kollat.
    (re.compile(r"(?:anges|uppges|specificeras|redovisas|framg[åa]r)"
                r"\s+inte|leverant[öo]ren\s+(?:uppger|anger|specificerar)"
                r"\s+inte|vi\s+har\s+(?:inga|ingen)\s+uppgift"
                r"|(?:uppgift|uppgifter)\s+saknas|okla[rt]\b"
                r"|g[åa]r\s+inte\s+att\s+(?:f[åa]\s+fram|ta\s+reda)", re.I),
     "VI VET INTE — mot kunden är VI leverantören; utelämna i stället",
     True),
]

# Farg som SPECEN pastar men bilden motsager (forbud 4).
FARG_FEL = {"136a4671": re.compile(r"bollen\s+[äa]r\s+r[öo]d\s+och\s+svart"
                                   r"|r[öo]d\s+och\s+svart\s+boll", re.I)}


def _falt(pid):
    """Alla fält en grind ska läsa. Regeln säger 'aldrig' — då är ytan ALL
    kundtext, inte bara brödtexten (#441)."""
    return {
        "namn": T.NAMN[pid],
        "titel": T.TITEL[pid],
        "meta": T.META[pid],
        "slug": T.SLUG[pid],
        # ☠️ Fogas med RADBRYTNING, inte med en middot. Separatorn ar
        #    grindens egen och far aldrig bli ett fynd (runda 107).
        "sokord": "\n".join(T.SOKORD[pid]),
        "html": B.HTML[pid],
    }


def _superlativ():
    """Ett jämförande påstående inom EGEN batch går att grinda mekaniskt.

    Rundan har två mätbara axlar: höjdspannets storlek och fotens
    sandkapacitet. Ett 'störst', 'tyngst' eller 'mest' på fel sida är
    välformulerat, har ett sant tal i sig, och är ändå falskt.
    """
    fel = []
    spann, sand = {}, {}
    for pid, d in M.P.items():
        h = d["hojd"]
        if "-" in h:
            lo, hi = (float(x.replace(",", ".")) for x in h.split("-"))
            spann[pid] = hi - lo
        if d.get("sand"):
            sand[pid] = float(str(d["sand"]).replace(",", "."))
    storst_spann = max(spann, key=spann.get)
    tyngst_fot = max(sand, key=sand.get)
    SUP = re.compile(r"st[öo]rst\w*|tyngst\w*|mest\b|h[öo]gst\w*|"
                     r"bredast\w*|l[äa]ngst\w*|djupast\w*", re.I)
    for pid in T.SLUG:
        for namn, txt in _falt(pid).items():
            syn = G.strip_taggar(txt) if namn == "html" else txt
            for m in SUP.finditer(syn):
                mening = G.mening_kring(syn, m.start())
                # En jamforelse INOM produkten ar legitim: vatten,
                # sand och blandning ar tre fyllningar av samma fot.
                if re.search(r"(blandningen|sanden|vattnet)\s+"
                             r"(?:\w+\s+){0,2}(?:är|ar|blir)\s*$",
                             syn[max(0, m.start() - 40):m.start()], re.I):
                    continue
                # ☠️ `längst ner` är en PLATS, inte en jämförelse.
                #    Grinden fällde "tyngden längst ner" som ett
                #    batch-superlativ om foten.
                if re.match(r"l[äa]ngst\s+(ner|ned|upp|bak|fram|ut|in|"
                            r"bort|till\s+h[öo]ger|till\s+v[äa]nster)",
                            syn[m.start():m.start() + 24], re.I):
                    continue
                # ☠️ Ett superlativ om produktens EGNA lägen jämför inte
                #    mot något annat. "Kör den högsta inställningen" är
                #    en instruktion, inte ett påstående om sortimentet.
                if re.match(r"\w+\s+(inst[äa]llning\w*|l[äa]g\w*|"
                            r"h[öo]jd\w*|position\w*|steg\w*)",
                            syn[m.start():m.start() + 34], re.I):
                    continue
                if re.search(r"h[öo]jdspann|spann", mening, re.I):
                    if pid != storst_spann:
                        fel.append("%s %s: superlativ om HÖJDSPANN — %s har "
                                   "%.0f cm, den här %.0f"
                                   % (pid, namn, storst_spann,
                                      spann[storst_spann], spann.get(pid, 0)))
                elif re.search(r"fot\w*|sand", mening, re.I):
                    if pid != tyngst_fot:
                        fel.append("%s %s: superlativ om FOTEN — %s tar %.0f "
                                   "kg sand, den här %.0f"
                                   % (pid, namn, tyngst_fot, sand[tyngst_fot],
                                      sand.get(pid, 0)))
    return fel


def _superlativprov():
    """☠️ Bevisar att `_superlativ` FALLER på ett äkta korsproduktspåstående
    — och att den är TYST på den orörda texten. En grind som aldrig fällt är
    obevisad, och den här har fyra undantag som var och ett kan avväpna den.
    """
    fel = []
    if _superlativ():
        fel.append("superlativgrinden faller pa OROD text")
    orig = B.HTML["ce8813ce"]
    B.HTML["ce8813ce"] = orig + ("<p>Det ar den storsta foten av alla, och den "
                                 "tar mest sand.</p>")
    try:
        if not _superlativ():
            fel.append("MUTATION SLAPP IGENOM: 'storsta foten ... mest sand' "
                       "pa ce8813ce (som tar 33 kg mot f0430bc5:s 45)")
    finally:
        B.HTML["ce8813ce"] = orig
    return fel


def granska(pid, html=None, live=False):
    """Grindar EN produkt. `html` låter live-grinden skicka in sidan."""
    fel = []
    falt = _falt(pid)
    if html is not None:
        falt = {"live": html} if live else dict(falt, html=html)
    for namn, txt in falt.items():
        syn = G.strip_taggar(txt) if namn in ("html", "live") else txt
        for rad in FORBJUDET:
            monster, beskrivning = rad[0], rad[1]
            # ☠️ Ett monster som SJALVT bar en negation kan aldrig fyra
            #    genom en negationsursakt. `VI VET INTE` matchar "anges
            #    inte" — ursakten ser ordet `inte`, doper hela traffen
            #    till ett korrekt nekande och slapper den. Bada
            #    planterade mutationerna gick igenom, och den akta
            #    meningen i 4fe5959f med dem. Sadana rader markeras
            #    `alltid=True` och gar forbi ursakten.
            alltid = len(rad) > 2 and rad[2]
            for m in monster.finditer(syn):
                # ☠️ loftestraff ger forsta ICKE-negerade traffen. Ar
                #    den None ar varje traff i meningen negerad, och
                #    DA ska den ursaktas. Villkoret var inverterat i
                #    forsta utkastet: grinden slappte varje akta fynd
                #    och fallde bara korrekta nekanden.
                if not alltid and not G.loftestraff(
                        monster, G.mening_kring(syn, m.start())):
                    continue
                fel.append("%s: %s — %r" % (namn, beskrivning,
                                            G.mening_kring(syn, m.start())[:90]))
        if pid in FARG_FEL and FARG_FEL[pid].search(syn):
            fel.append("%s: FEL FÄRG om bollen — zoomen säger vit, röd och blå"
                       % namn)
        for ch, unamn, sammanhang in G.homoglyfer(syn):
            fel.append("%s: HOMOGLYF %r (%s) i %r"
                       % (namn, ch, unamn, sammanhang))
        for m in G.TREKONSONANT.finditer(syn):
            fel.append("%s: TRE KONSONANTER i rad — %r"
                       % (namn, G.mening_kring(syn, m.start())[:70]))
        if G.JARGONG.search(syn):
            fel.append("%s: INTERN JARGONG" % namn)
    if not live:
        fel += G.granska_namn(T.NAMN[pid])
        if T.TITEL[pid] == T.NAMN[pid]:
            fel.append("titel identisk med namn — butiken renderar mallen")
        if len(T.META[pid]) > 155:
            fel.append("meta %d tecken, taket är 155" % len(T.META[pid]))
    return fel


PLANTERADE = [
    ("56cca82a", "namn", "Punchingboll för barn 125–145 cm", "ÅLDER"),
    ("ce8813ce", "html", "<p>Bollen är CE-märkt och provad.</p>",
     "OGRUNDAD CERTIFIERING"),
    ("93073695", "html", "<p>Sanden ingår i leveransen.</p>", "LOVAR FYLLNING"),
    ("136a4671", "html", "<p>Bollen är röd och svart.</p>", "FEL FÄRG"),
    ("2730de6f", "meta", "En HOMCOM-punchingboll i svart.", "HUSMÄRKE"),
    ("95f6280b", "html", "<p>Till skillnad från de flesta boxningssäckar.</p>",
     "MARKNADSPÅSTÅENDE"),
    ("2a13cbbe", "html", "<p>Djupare än familjens mindre modeller.</p>",
     "INTERN INRAMNING"),
    # Bevisar att versalkansligheten inte avvapnade grinden.
    ("f0430bc5", "html", "<p>Stationen är provad mot EN 957.</p>",
     "OGRUNDAD CERTIFIERING"),
    # ☠️ Den PASSIVA formen — den som faktiskt stod i 4fe5959f.
    ("4fe5959f", "html", "<p>Vikten anges inte för den här modellen.</p>",
     "VI VET INTE"),
    ("c8f6b93f", "html", "<p>Leverantören uppger inte maxlasten.</p>",
     "VI VET INTE"),
    # ☠️ Bojningarna grinden SLAPPTE igenom i forsta utkastet.
    ("93073695", "html", "<p>Något de andra i familjen saknar.</p>",
     "INTERN INRAMNING"),
    ("ce8813ce", "html", "<p>Nästa steg upp i familjen.</p>",
     "INTERN INRAMNING"),
]


def _sjalvtest():
    """Varje förbud provas åt BÅDA hållen: det planterade felet ska fällas
    av RÄTT grind, och den orörda texten ska släppas igenom."""
    fel = []
    for pid in T.SLUG:
        if granska(pid):
            continue  # rapporteras av huvudkörningen
    for pid, falt, mut, vantad in PLANTERADE:
        if falt == "html":
            traffar = granska(pid, html=B.HTML[pid] + mut)
        else:
            orig = getattr(T, falt.upper())[pid]
            getattr(T, falt.upper())[pid] = mut
            try:
                traffar = granska(pid)
            finally:
                getattr(T, falt.upper())[pid] = orig
        egna = [t for t in traffar if vantad in t]
        if not egna:
            fel.append("MUTATION SLAPP IGENOM: %s %s %r — väntade %s (fick %s)"
                       % (pid, falt, mut[:40], vantad, traffar[:1] or "inget"))
    return fel


def sjalvtest():
    """Kontraktet live-grinden kräver: `(fel-lista, antal fall)`.

    ☠️ NAMNET ÄR GRINDEN. `liverunda.sjalvtester` gör
       `getattr(GR, "sjalvtest", None)` — en runda som bara har `_sjalvtest`
       får den TYST överhoppad (#556)."""
    return _sjalvtest(), len(PLANTERADE) + len(T.SLUG)


if __name__ == "__main__":
    alla = []
    for pid in T.SLUG:
        for f in granska(pid):
            alla.append("%s  %s" % (pid, f))
    sup = _superlativ() + _superlativprov()
    st = _sjalvtest()
    print("grind: %d produkter, %d textfel, %d superlativfel, %d självtestfel"
          % (len(T.SLUG), len(alla), len(sup), len(st)))
    for r in alla + sup + st:
        print("  ☠️", r)
    raise SystemExit(1 if (alla or sup or st) else 0)
