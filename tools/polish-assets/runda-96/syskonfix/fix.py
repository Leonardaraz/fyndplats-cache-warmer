# -*- coding: utf-8 -*-
"""Runda 96, efterarbete: fem PUBLICERADE sidor räknade färgerna fel.

☠️ FYNDET. `paviljongtak-3x3-dubbeltak-creme` (507ae3d5) var redan publicerad
   och är SAMMA duk som runda 95:s roströda och runda 96:s två nya: stora
   duken 300 × 300 cm, lilla taket 86 × 86 cm, snedställd kant 18 cm,
   180 g/m², åtta dräneringshål, kardborre. Fyra färger av EN duk ligger
   alltså live — och ingen av de fyra sidorna säger det:

     507ae3d5 creme      inget syskonavsnitt alls
     271327e1 roströd    "en färg till" → pekar på mörkgrön (ANNAN duk)
     3f9fda98 mörkgrå    "tre färger"   → creme saknas
     2bfaf6dd kaffebrun  "tre färger"   → creme saknas
     b6ebc5ba mörkgrön   "en färg till" → är ensam om sitt 88 × 88-mått

☠️ VARFÖR DEN VAR OSYNLIG, och det är hela lärdomen: runda 95 lade creme
   under rubriken "Har du en annan storlek?" med texten "ett dubbeltak i
   creme I SAMMA STORLEK". Rubriken motsäger sin egen mening. Steg 1 i
   runda 96 svepte UTKASTEN, hittade två färgsyskon och räknade tre — den
   fjärde stod i rundans egen källfil, i fel avsnitt, och lästes som en
   annan storlek.

   Regeln: UTKASTLISTAN ÄR INTE FAMILJEN. Ett färgsyskon som redan är
   publicerat syns inte i poleringskön, och en korslänk under fel rubrik
   är sämre än ingen — den svarar "redan kollat" på en fråga den inte
   ställde.

⚠️ DEN HÄR FILEN ÄGER MENINGARNA, INTE SKRIVNINGEN. Själva PATCHen kördes
   mot Wix med identisk logik, eftersom den behövde läsa den lagrade HTML:en
   och hasha före/efter i samma anrop. Bron mellan de två är
   `nya_fragment()` + `linta()`: varje ny mening hashas här, och skrivningen
   assertar samma tal innan den rör något. En handkopia som tappat ett tecken
   faller på hashen i stället för att nå kunden.

⚠️ Skrivningen är KIRURGISK, inte en omgenerering. Sidorna kommer från tre
   olika källor (runda 95:s texter.py, runda 96:s, och en äldre runda som
   inte finns i det här repot). Att bygga om dem ur en generator hade
   ändrat mer än defekten. Varje ersättning nedan kräver EXAKT en träff —
   noll eller två fäller skriptet.
"""
import json
import os
import re
import sys

BAS = "https://www.fyndplats.se/produkt/"

SLUG = {
    "507ae3d5": "paviljongtak-3x3-dubbeltak-creme",
    "271327e1": "paviljongtak-3x3-dubbeltak-rostrod",
    "3f9fda98": "paviljongtak-3x3-dubbeltak-morkgra",
    "2bfaf6dd": "paviljongtak-3x3-dubbeltak-kaffebrun",
    "b6ebc5ba": "paviljongtak-3x3-dubbeltak-morkgron",
}
FARG = {"507ae3d5": "creme", "271327e1": "roströd", "3f9fda98": "mörkgrå",
        "2bfaf6dd": "kaffebrun", "b6ebc5ba": "mörkgrön"}
# formen som står EFTER "reservduken i ..."
FARG_I = {"507ae3d5": "creme", "271327e1": "rostrött", "3f9fda98": "mörkgrått",
          "2bfaf6dd": "kaffebrunt", "b6ebc5ba": "mörkgrönt"}

# ☠️ DE FYRA SOM DELAR DUK. b6ebc5ba står UTANFÖR med flit: dess lilla tak
#    mäter 88 × 88 cm, inte 86 × 86. Att lägga den här hade gjort listan
#    till en lögn av precis det slag den finns för att laga.
SAMMA_DUK = ["507ae3d5", "271327e1", "3f9fda98", "2bfaf6dd"]

# ordningen i en uppräkning: fast, så två sidor aldrig listar olika
ORDNING = ["507ae3d5", "271327e1", "3f9fda98", "2bfaf6dd"]


def lank(pid, text):
    return '<a href="%s%s" target="_self">%s</a>' % (BAS, SLUG[pid], text)


def rakna_upp(bitar):
    """a, b och c — svensk uppräkning, aldrig oxfordkomma."""
    if len(bitar) == 1:
        return bitar[0]
    return ", ".join(bitar[:-1]) + " och " + bitar[-1]


def andra_tre(pid):
    return [p for p in ORDNING if p != pid]


def syskonstycke(pid):
    """Stycket som ersätter/utgör syskonavsnittet på en 86 × 86-sida."""
    lankar = [lank(p, "reservduken i %s" % FARG_I[p]) for p in andra_tre(pid)]
    return ("Duken är densamma i alla fyra färgerna — samma mått, samma väv "
            "och samma infästning. Den här är %s; de andra tre är %s."
            % (FARG[pid], rakna_upp(lankar)))


def morkgron_stycke():
    lankar = [lank(p, "reservduken i %s" % FARG_I[p]) for p in ORDNING]
    return ("Den här duken är mörkgrön, och den är ensam om sitt mått: det "
            "lilla taket mäter 88 × 88 cm. Samma slags dubbeltak finns i fyra "
            "färger till med ett litet tak på 86 × 86 cm — två centimeter "
            "mindre. Jämför spec-tabellerna innan du väljer: %s."
            % rakna_upp(lankar))


def byt(html, gammalt, nytt, vad):
    """☠️ EXAKT en träff. Noll = källan har ändrats under fötterna på oss
       (annan session, egen tidigare körning); två = mönstret är för brett
       och skriver på ett ställe vi inte tittat på."""
    n = html.count(gammalt)
    if n != 1:
        raise SystemExit("FÄLLER: %s gav %d träffar, förväntade 1\n  %r"
                         % (vad, n, gammalt[:120]))
    return html.replace(gammalt, nytt)


# ------------------------------------------------------------- per sida

def fixa_507ae3d5(h):
    """Creme: har inget syskonavsnitt alls — ett läggs in före skötseln."""
    nytt = ("<h2>Samma tak i fyra färger</h2><p>%s</p>"
            % syskonstycke("507ae3d5"))
    h = byt(h, "<h2>Användning och skötsel</h2>",
            nytt + "<h2>Användning och skötsel</h2>", "creme: nytt avsnitt")
    h = byt(h,
            "<p>Creme, alltså gulvit. Den är varmare i tonen än en helvit "
            "duk.</p>",
            "<p>Creme, alltså gulvit. Den är varmare i tonen än en helvit "
            "duk. Exakt samma duk finns också i rostrött, mörkgrått och "
            "kaffebrunt.</p>", "creme: färg-FAQ")
    return h


def fixa_86x86_r95(h, pid):
    """271327e1: rubriken sa "en annan färg" och pekade på ANNAN duk."""
    h = byt(h, "<h2>Samma tak i en annan färg</h2>",
            "<h2>Samma tak i fyra färger</h2>", "%s: rubrik" % pid)
    gammal = ('<p>Den här duken är roströd; samma slags tak finns också i '
              'mörkgrön. Måtten på det lilla taket skiljer sig två centimeter '
              'mellan de två, så jämför spec-tabellerna innan du väljer: '
              '<a href="%spaviljongtak-3x3-dubbeltak-morkgron" '
              'target="_self">reservduken i mörkgrönt</a>.</p>' % BAS)
    ny = ("<p>%s</p><p>Det finns dessutom ett dubbeltak i %s till samma "
          "storlek på paviljong, men det är inte samma duk: dess lilla tak "
          "mäter 88 × 88 cm i stället för 86 × 86 cm. Jämför spec-tabellerna "
          "innan du väljer.</p>"
          % (syskonstycke(pid), lank("b6ebc5ba", "mörkgrönt")))
    h = byt(h, gammal, ny, "%s: syskonstycke" % pid)
    # creme låg under "annan storlek" med texten "i samma storlek"
    h = byt(h,
            '<p>Det finns också ett dubbeltak i creme i samma storlek: '
            '<a href="%spaviljongtak-3x3-dubbeltak-creme" target="_self">'
            'paviljongtak 3 × 3 m med dubbeltak, creme</a>.</p>' % BAS,
            "", "%s: creme ur storleksavsnittet" % pid)
    h = byt(h,
            "<p>Den här duken är roströd. Samma tak finns i en färg till.</p>",
            "<p>Den här duken är roströd. Samma tak finns i fyra färger.</p>",
            "%s: färg-FAQ" % pid)
    return h


def fixa_b6ebc5ba(h):
    h = byt(h, "<h2>Samma tak i en annan färg</h2>",
            "<h2>Liknande tak i fyra färger till</h2>", "b6ebc5ba: rubrik")
    gammal = ('<p>Den här duken är mörkgrön; samma slags tak finns också i '
              'roströd. Måtten på det lilla taket skiljer sig två centimeter '
              'mellan de två, så jämför spec-tabellerna innan du väljer: '
              '<a href="%spaviljongtak-3x3-dubbeltak-rostrod" '
              'target="_self">reservduken i rostrött</a>.</p>' % BAS)
    h = byt(h, gammal, "<p>%s</p>" % morkgron_stycke(), "b6ebc5ba: syskonstycke")
    h = byt(h,
            '<p>Det finns också ett dubbeltak i creme i samma storlek: '
            '<a href="%spaviljongtak-3x3-dubbeltak-creme" target="_self">'
            'paviljongtak 3 × 3 m med dubbeltak, creme</a>.</p>' % BAS,
            "", "b6ebc5ba: creme ur storleksavsnittet")
    h = byt(h,
            "<p>Den här duken är mörkgrön. Samma tak finns i en färg till.</p>",
            "<p>Den här duken är mörkgrön. Samma slags tak finns i creme, "
            "rostrött, mörkgrått och kaffebrunt, men de dukarna har ett två "
            "centimeter mindre litet tak.</p>", "b6ebc5ba: färg-FAQ")
    return h


# ☠️ ORDNINGEN I DEN PUBLICERADE TEXTEN ÄR INTE ORDNING. Runda 96 skrev
#    syskonet först och roströd sist. En härledd ordning
#    (`ORDNING` minus egen minus creme) gav kaffebrun/roströd i fel följd
#    och `byt()` fällde på 0 träffar — INNAN något skickades. Det är exakt
#    den asymmetri som gör sökmönstret ogrindat och ersättningen grindad.
GAMMALT_PAR = {"3f9fda98": ["2bfaf6dd", "271327e1"],
               "2bfaf6dd": ["3f9fda98", "271327e1"]}


def fixa_86x86_r96(h, pid):
    """3f9fda98 / 2bfaf6dd: sa "tre färger" — creme fattades."""
    h = byt(h, "<h2>Samma tak i tre färger</h2>",
            "<h2>Samma tak i fyra färger</h2>", "%s: rubrik" % pid)
    andra = GAMMALT_PAR[pid]
    gammal = ('<p>Duken är densamma i alla tre färgerna — samma mått, samma '
              'väv och samma infästning. Den här är %s; de andra två är %s '
              'och %s.</p>'
              % (FARG[pid],
                 lank(andra[0], "reservduken i %s" % FARG_I[andra[0]]),
                 lank(andra[1], "reservduken i %s" % FARG_I[andra[1]])))
    h = byt(h, gammal, "<p>%s</p>" % syskonstycke(pid), "%s: syskonstycke" % pid)
    h = byt(h,
            "<p>Den här duken är %s. Samma tak finns i tre färger.</p>"
            % FARG[pid],
            "<p>Den här duken är %s. Samma tak finns i fyra färger.</p>"
            % FARG[pid], "%s: färg-FAQ" % pid)
    return h


FIXARE = {
    "507ae3d5": fixa_507ae3d5,
    "271327e1": lambda h: fixa_86x86_r95(h, "271327e1"),
    "b6ebc5ba": fixa_b6ebc5ba,
    "3f9fda98": lambda h: fixa_86x86_r96(h, "3f9fda98"),
    "2bfaf6dd": lambda h: fixa_86x86_r96(h, "2bfaf6dd"),
}


def synlig(h):
    return re.sub(r"\s+", " ", re.sub(r"<[^>]+>", " ", h)).strip()


def hasha(s):
    h = 0
    for ch in s:
        h = (h * 31 + ord(ch)) % 1000000007
    return h


# ------------------------------------------------------- nya meningarna

def nya_fragment():
    """De ENDA strängar den här fixen tillför. Allt annat är befintlig text
       som flyttas eller lämnas. Hashas så att JS-sidan kan bevisa att den
       bär samma tecken — en handskriven kopia är ogrindad annars."""
    f = {}
    for pid in ORDNING:
        f["stycke:" + pid] = syskonstycke(pid)
    f["stycke:b6ebc5ba"] = morkgron_stycke()
    f["creme:rubrik"] = "Samma tak i fyra färger"
    f["creme:faq"] = ("Creme, alltså gulvit. Den är varmare i tonen än en "
                      "helvit duk. Exakt samma duk finns också i rostrött, "
                      "mörkgrått och kaffebrunt.")
    f["271327e1:caveat"] = (
        "Det finns dessutom ett dubbeltak i mörkgrönt till samma storlek på "
        "paviljong, men det är inte samma duk: dess lilla tak mäter "
        "88 × 88 cm i stället för 86 × 86 cm. Jämför spec-tabellerna innan "
        "du väljer.")
    # creme har sin egen FAQ-formulering (creme:faq) — den ärvs från den
    # äldre rundan och byggs inte om här
    for pid in ORDNING:
        if pid == "507ae3d5":
            continue
        f["faq:" + pid] = ("Den här duken är %s. Samma tak finns i fyra "
                           "färger." % FARG[pid])
    f["faq:b6ebc5ba"] = ("Den här duken är mörkgrön. Samma slags tak finns i "
                         "creme, rostrött, mörkgrått och kaffebrunt, men de "
                         "dukarna har ett två centimeter mindre litet tak.")
    return f


# ------------------------------------------------------------------ lint

TILLATNA_TAL = {"88", "86", "3", "4"}
FORBJUDET = [
    (r"aosom|outsunny|homcom|pawhut|vinsetto|aiyaplay", "leverantör/husmärke"),
    (r"leverantör|tillverkar|fabrikant|importör", "mot kunden är VI leverantören"),
    (r"tyskland|spanien|skickas från", "avsändarland"),
    (r"ersatzdach|pavillon|kaffee|rostrot|cremeweiss", "tyska"),
    (r"runda|steg \d", "intern jargong"),
    (r"\b\d{2,3}[A-Za-z]?-\d{3,4}[A-Za-z]{0,3}\b", "artikelnummer"),
    (r"[\U0001F300-\U0001FAFF\u2600-\u27BF]", "emoji i kundtext"),
    (r"\bgrön\b(?!t)", "grön — mätfällan (bild 1 är en miljöbild)"),
    (r"  |\s,|\s\.", "dubbla blanksteg eller hängande skiljetecken"),
]


def lasform(txt):
    """⚠️ INTE samma sak som facitgen.synlig(), och skillnaden är avsiktlig.

       Hashen ersätter VARJE tagg med ett blanksteg — den mäter identitet och
       får aldrig ändras. Linten mäter LÄSBARHET, och en inline-tagg står mitt
       i en mening: `</a>, <a` blir " , " med hashens regel och ser ut som ett
       hängande komma som inte finns på sidan. Inline-taggarna tas därför bort
       utan blanksteg här, blocktaggarna med."""
    txt = re.sub(r"</?(?:a|span|strong|em|b|i)\b[^>]*>", "", txt)
    return re.sub(r"\s+", " ", re.sub(r"<[^>]+>", " ", txt)).strip()


def linta(f):
    brister = []
    for nyckel, txt in sorted(f.items()):
        naken = lasform(txt)
        lag = naken.lower()
        for m, vad in FORBJUDET:
            tr = re.search(m, lag)
            if tr:
                brister.append("%s: %s %r" % (nyckel, vad, tr.group(0)))
        for tal in re.findall(r"\d+(?:[,.]\d+)?", naken):
            if tal not in TILLATNA_TAL:
                brister.append("%s: ohärlett tal %r" % (nyckel, tal))
        if naken != naken.strip() or "  " in naken:
            brister.append("%s: blankstegsfel" % nyckel)
        if not naken.endswith((".", "!", "?")) and ":" not in nyckel[-7:]:
            pass
    # varje 86x86-sida ska lista exakt de tre andra, aldrig sig själv
    for pid in ORDNING:
        s = f["stycke:" + pid]
        if SLUG[pid] in s:
            brister.append("stycke:%s länkar till SIG SJÄLV" % pid)
        for annan in ORDNING:
            if annan != pid and SLUG[annan] not in s:
                brister.append("stycke:%s saknar %s" % (pid, SLUG[annan]))
        if SLUG["b6ebc5ba"] in s:
            brister.append("stycke:%s tar med 88x88-duken i fyrfärgslistan" % pid)
    # mörkgröna sidan ska lista alla fyra och INTE påstå samma duk
    mg = f["stycke:b6ebc5ba"]
    for annan in ORDNING:
        if SLUG[annan] not in mg:
            brister.append("stycke:b6ebc5ba saknar %s" % SLUG[annan])
    if "densamma" in mg:
        brister.append("stycke:b6ebc5ba påstår samma duk — den är 88 × 88")
    return brister


if __name__ == "__main__":
    f = nya_fragment()
    brister = linta(f)
    for b in brister:
        print("  x", b)
    print("%d brister\n" % len(brister))
    for nyckel, txt in sorted(f.items()):
        naken = lasform(txt)
        print("%-20s hash %-12d %s" % (nyckel, hasha(naken), naken[:100]))
    if brister:
        sys.exit(1)
