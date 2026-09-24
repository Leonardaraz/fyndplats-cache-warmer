#!/usr/bin/env python3
"""Filgrind för HUSETS EGNA PRODUKTKORT — texten som bränns in i pixlar.

☠️ VARFÖR DEN FINNS. `KORTLACKAN.md` mätte upp nio publicerade sidor där
Aosoms artikelnummer eller husmärket Outsunny står **inbränt i en bild som vi
själva har tillverkat**. Fotnoten citerade källan — gott hantverk överallt
utom just här.

☠️ OCH INGEN BEFINTLIG GRIND KUNDE SE DET. `kodIText` läser text.
Live-grindens sidsvep strippar taggar och läser text. Alt-svepet läser
`alt`-attribut. Alla tre är blinda för en sträng som ligger i PIXLAR. Samma
klass som alt-svepet före 2026-09-07: grinden fanns, var dokumenterad, och
kunde inte se.

☠️ DÄRFÖR GRINDAS INDATAN, INTE BILDEN. Utan OCR i miljön går den renderade
PNG:en inte att läsa mekaniskt. Det som går är att kräva att korten BYGGS ur
en fil — `kort.tsv` — och grinda den filen. Det är samma regel som redan
gäller brödtexten (`<kort>.html`), `seo.tsv` och `namn.tsv`: **bygg
nyttolasten ur filen med ett skript, skriv den aldrig av.** Runda H3 mätte
kostnaden av att bryta mot den: fem av fem avskrivna SEO-fält drev isär, noll
av tre filbyggda.

⚠️ EN KORTDEFINITION SOM INTE STÅR I `kort.tsv` ÄR OGRINDAD. Grinden kan inte
veta att den finns. Kortbyggaren måste läsa samma fil.

FORMAT (tabbseparerat, en rad per kort):

    <kort>  <vit|foto>  <kicker>  <titel>  <fotnot>  <etikett=värde|etikett=värde|…>

VAD DEN FÄLLER
  * allt `gatelib.GRINDAR` fäller: husmärke, artikelnummer, fraktland,
    "leverantören", tysk rest, stavning, homoglyf, EN-norm utan källa
  * ett tal på kortet som inte finns i produktens egen källtext
    (samma facit och samma tre ventiler som `gate.py`: `kallor.json` /
    `kallor-tal.json`, `rad-tal.txt`, `foto-tal.txt`)
  * en rad vars kolumnantal inte stämmer, eller ett kort utan spec-rader
  * en produkt i `slugs.txt` som saknar kortrad — Leonards instruktion är att
    ALLA produkter ska ha kort, och en grind som bara granskar de kort som
    råkar finnas hade varit en påminnelse, inte en spärr
  * en spec-rad vars etikett OCKSÅ finns i produktens `<kort>.html` men med
    ett ANNAT värde. Runda G1:s kortbyggare läste raderna direkt ur sidans
    spec-tabell, uppslagna på ETIKETT, just för att kortet och sidan inte
    skulle kunna säga emot varandra. Den garantin är starkare än en
    handskriven rad och får inte tappas bort när korten flyttar till
    `kort.tsv` — grinden gör samma jämförelse i stället.
  * två kort med IDENTISK TEXT (kicker + titel + fotnot). Regeln kommer från
    runda G1, där sex av åtta produkter delade mått med ett syskon: ett kort
    vars text är identisk med ett annats säger ingenting om vilken av de två
    man tittar på — då är kortet en dubblett, inte ett kort.

    ⚠️ FOTNOTEN RÄKNAS MED, och det är inte kosmetik. Runda F1 bygger åtta
    kort ur TRE familjer: de tre takhöga klösträden delar kicker och titel med
    flit, för de ÄR samma modell, och det som skiljer dem är färgen — som står
    i fotnoten. En regel på bara rubrikparet hade fällt sex korrekta kort och
    tvingat fram påhittade rubrikskillnader. Kravet är att kortets TEXT skiljer
    sig, inte att rubriken gör det.

☠️ ETT GEMENT ARTIKELNUMMER FÄLLS AV SIFFERGRINDEN, INTE AV MÖNSTRET — och
det är MÄTT, inte en brist. `KORTLACKAN.md` återger de nio läckta fotnoterna
gement (`ref <DDL-DDDLDDLL>`, alltså gemener), och `gatelib.ARTNR` är versalkänslig, så mönstret
missar just den formen. Frestelsen är att göra ARTNR skiftlägesokänslig.
**Gör inte det.** Uppmätt över tools/polish-assets 2026-09-16, 1 256 filer:
skiftlägesokänslighet ger exakt EN ny träff, och den är ett FALSKLARM —
`160-185cm`, ett längdintervall i en måttritningsanteckning.

Skälet är att ett äkta artikelnummer och en måttenhet delar form:

    DDD-DDDLL    ett ÄKTA artikelnummer ur feeden, versalt
    160-185cm    DDD-DDDLL   användarlängd, inte ett artikelnummer

☠️ Numret självt skrivs inte ut här — samma regel som gäller kortet gäller
källkoden. Formen räcker för att se att de är omöjliga att skilja åt.

Det ENDA som skiljer dem är versalerna. Uppercase-kravet är alltså
lastbärande, precis som `{2,}`-svansen som håller `220-240V` ute. Ett gement
nummer på ett kort går ändå inte tyst förbi: dess tre siffergrupper saknar
täckning i källan och fälls som [SIFFRA UTAN KÄLLA] — verifierat.

ANVÄNDNING (från rundans katalog):
  python3 ../../polish-gates/gate-kort.py
"""
import os, re, sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from gatelib import GRINDAR, las_facit, tal, las_kvittenser

KOLUMNER = 6


if not os.path.exists("kort.tsv"):
    print("[AVBRYT] kort.tsv saknas — korten går inte att grinda.\n"
          "  Bygg korten ur en fil; en kortdefinition i ett skript är ogrindad.")
    sys.exit(1)

# ☠️ EN TREDJE KOPIA, BORTTAGEN. Kommentaren här motiverade kopian med att
# gate.py byggde ventilerna på modulnivå och inte gick att importera från.
# Definitionen bor sedan N8 i gatelib, alltså föll skälet — och kopian hade
# redan glidit: den här läste `rad.split()` där gate.py läste
# `rad.split(None, 2)`, och den avbröt med ett kortare meddelande. Tre
# ordlistor i tre versioner är precis vad #154 städade bort en gång.
RAD_TAL, FOTO_TAL = las_kvittenser()

# ☠️ EN KOMPRIMERING ÄR INTE EN MOTSÄGELSE — MEN DEN SKA KVITTERAS.
# Runda F2:s kort skriver `3 × 40 × 30 cm` där sidan räknar upp `40 × 30,
# 40 × 30 och 40 × 30`. Samma fakta, och kortets `3` är ett riktigt antal —
# men talet finns inte i sidans rad, så delmängdsregeln fäller. Rätt svar är
# inte att luckra upp regeln (då slutar den fånga ett FEL tal) utan att kräva
# en rad i `kort-avvik.txt`:
#
#     55dc854b  Plan uppåt  tre likadana plan komprimerade till "3 ×"
#
# Formen är `<kort>\t<etikett>\t<skäl>`, och skälet är obligatoriskt — filen
# blir ett protokoll över vad någon faktiskt tittat på, precis som
# `superlativ.txt` och `foto-tal.txt`. Kvitteringen bevisar ingenting om
# sanningen; den flyttar påståendet dit en människa ser det.
AVVIK_KVITTERADE = set()
if os.path.exists("kort-avvik.txt"):
    for rad in open("kort-avvik.txt", encoding="utf-8"):
        rad = rad.rstrip("\n")
        if not rad.strip() or rad.startswith("#"):
            continue
        d = [x.strip() for x in rad.split("\t")]
        if len(d) < 3 or not d[2]:
            print(f"  [AVBRYT] kort-avvik.txt: raden {rad!r} saknar skäl.")
            sys.exit(1)
        AVVIK_KVITTERADE.add((d[0], d[1].lower()))

kallor, facitfil = las_facit()
UTAN_FACIT = kallor is None
if UTAN_FACIT:
    kallor = {}

fynd = 0
kort_sedda = []
rubrikpar = []
spec_per_kort = []
for radnr, rad in enumerate(open("kort.tsv", encoding="utf-8"), 1):
    rad = rad.rstrip("\n")
    if not rad.strip() or rad.startswith("#"):
        continue
    d = rad.split("\t")
    if len(d) != KOLUMNER:
        print(f"  rad {radnr}: [FORM] {len(d)} kolumner, väntade {KOLUMNER}")
        fynd += 1
        continue
    kort, lage, kicker, titel, fotnot, spec = d
    kort_sedda.append(kort)
    rubrikpar.append((kort, kicker, titel, fotnot))
    spec_per_kort.append(
        (kort, [(p.split("=", 1)[0], p.split("=", 1)[1])
                for p in spec.split("|") if "=" in p]))
    if lage not in ("vit", "foto"):
        print(f"  {kort}: [FORM] okänt läge {lage!r} (vit eller foto)")
        fynd += 1
    par = [p for p in spec.split("|") if p.strip()]
    if not par:
        print(f"  {kort}: [FORM] inga spec-rader — ett kort utan mått är ingen "
              f"ersättning för en måttritning")
        fynd += 1

    # ☠️ ALLA fält granskas, inte bara fotnoten. Läckan i KORTLACKAN satt i
    # fotnoten, men ett artikelnummer i en spec-etikett ("Modellreferens")
    # läcker exakt lika mycket — och husregeln säger uttryckligen att ett
    # omdöpt namn inte gör numret ofarligt.
    #
    # ⚠️ `<u>`-taggarna i värdena ersätts med blanksteg, inte strippas: annars
    # klistras enheten ihop med talet ("10kg") och siffergrinden ser ett tal
    # som inte finns i källan.
    delar = [("kicker", kicker), ("titel", titel), ("fotnot", fotnot)]
    delar += [("spec", p.replace("=", ": ")) for p in par]
    rentext = " ".join(re.sub(r"<[^>]*>", " ", t) for _, t in delar)
    rentext = rentext.replace(" ", " ")

    # ☠️ EN ENHET FÖLJER PÅ ETT TAL — se docstringen (341 av 342 uppmätta).
    for x in re.finditer(r"(.{0,14})(?:&nbsp;|\s)<span class=u>(.*?)</span>", spec):
        fore = x.group(1).rstrip()
        if not fore or not fore[-1].isdigit():
            print(f"  {kort}: [ENHET UTAN TAL] ...{fore!r} + {x.group(2)!r} — "
                  f"en enhet följer på ett tal; här står en bokstav, alltså "
                  f"har ett ord delats av enhetsavdelaren")
            fynd += 1

    # ☠️ ENHETEN MÅSTE BÄRA `<span class=u>` — se docstringen.
    for x in re.finditer(r"<(?!span class=u>)(?!/span>)([^>]+)>", spec):
        print(f"  {kort}: [FEL ENHETSMARKUP] <{x.group(1)}> — cardkit stylar "
              f"bara .u, så allt annat renderas med webbläsarens default")
        fynd += 1

    for namn, m in GRINDAR:
        for x in re.finditer(m, rentext):
            print(f"  {kort}: [{namn}] {x.group(0)!r} "
                  f"…{rentext[max(0, x.start()-45):x.end()+45].strip()}…")
            fynd += 1

    if UTAN_FACIT:
        continue
    facit = set(kallor.get(kort, []))
    if not facit:
        print(f"  {kort}: [KÄLLA SAKNAS]")
        fynd += 1
        continue
    facit |= RAD_TAL | FOTO_TAL.get(kort, set())
    for t in sorted(tal(rentext) - facit, key=lambda x: (len(x), x)):
        print(f"  {kort}: [SIFFRA UTAN KÄLLA] {t!r}")
        fynd += 1

# ☠️ KORTET FÅR INTE SÄGA EMOT SIDAN. Etiketterna jämförs mot produktens egen
# spec-tabell; en etikett som bara finns på kortet är tillåten (kortet väljer
# sina åtta rader), men en etikett som finns på BÅDA måste bära samma värde.
def _sidans_spec(kort):
    fil = f"{kort}.html"
    if not os.path.exists(fil):
        return None
    h = open(fil, encoding="utf-8").read()
    m = re.search(r"<h2>Tekniska specifikationer</h2>(.*?)(?=<h2>|\Z)", h, re.S)
    if not m:
        return None
    # ☠️ TVÅ FORMER, OCH BARA DEN ENA VAR IMPLEMENTERAD. Runda G1:s kortbyggare
    # delade raden på TAGGARNA (`<strong>Mått</strong> 42 cm`). Runda N2 skriver
    # samma rad som ren text (`Mått: 33,5 × 28 × 42 cm`) — och då blir
    # taggdelningen EN bit, raden hoppas över, och jämförelsen blir tyst tom.
    # Uppmätt när regeln byggdes: 0 av 64 spec-rader matchade sidan, alltså en
    # kontroll som inte KAN fälla. Elfte gången samma familj, så båda formerna
    # läses och `utan_etikett` räknas i stället för att tigas ihjäl.
    ut, utan_etikett = {}, 0
    for li in re.findall(r"<li>(.*?)</li>", m.group(1), re.S):
        bitar = [b.strip() for b in re.sub(r"<[^>]+>", "\x00", li).split("\x00") if b.strip()]
        if len(bitar) == 2:
            etikett, varde = bitar
        else:
            rent = re.sub(r"<[^>]+>", " ", li).strip()
            if ":" not in rent:
                utan_etikett += 1
                continue
            etikett, varde = rent.split(":", 1)
        ut[etikett.rstrip(":").strip().lower()] = re.sub(r"\s*\(.*?\)\s*$", "", varde).strip()
    return ut


def _jamforbar(v):
    """Kortet skriver enheten i en tagg och binder den med hårt blanksteg;
    sidan skriver den som vanlig text. Jämför på innehållet, inte på formen."""
    v = re.sub(r"<[^>]*>", " ", v).replace("\u00a0", " ")
    return re.sub(r"\s+", " ", v).strip().lower()


# ☠️ TALEN JÄMFÖRS, INTE ORDALYDELSEN — och det är inte slapphet, det är vad
# regeln faktiskt handlar om. Kortet är ett KOMPRIMERAT medium: åtta rader med
# plats för några tecken var. Uppmätt på runda N2 gav en ordagrann jämförelse
# fem träffar och FYRA av dem var ren omskrivning:
#
#     kortet "Ø17 × 14,5 cm"      sidan "17 cm i diameter, 14,5 cm hög"
#     kortet "Polyeten på väv"    sidan "Polyeten, väv"
#
# Samma fakta, kortare form. Ett falsklarm som alltid fyrar lär mottagaren att
# sluta läsa — och då är även det äkta larmet borta.
#
# Det FARLIGA är ett annat TAL. Runda F1 skrev "fyra plattformar" där fotot
# visade tre; det är den klassen kortet kan skada kunden med. Regeln är därför
# att kortets tal måste vara en DELMÄNGD av sidans: kortet får visa färre
# uppgifter, aldrig ett tal sidan inte har.
for kort, spec in spec_per_kort:
    sidan = _sidans_spec(kort)
    if sidan is None:
        continue
    for etikett, varde in spec:
        e = etikett.strip().lower()
        if e not in sidan:
            continue
        if (kort, e) in AVVIK_KVITTERADE:
            continue
        pa_kortet, pa_sidan = tal(_jamforbar(varde)), tal(_jamforbar(sidan[e]))
        extra = pa_kortet - pa_sidan
        if extra:
            print(f"  {kort}: [KORT MOT SIDA] {etikett!r} — kortet har "
                  f"{sorted(extra)} som sidan inte har; kortet säger "
                  f"{_jamforbar(varde)!r}, sidan säger {_jamforbar(sidan[e])!r}")
            print(f"      Kvittera i kort-avvik.txt med raden: {kort}\t{etikett}\t<skäl>")
            fynd += 1

# ☠️ TVÅ KORT MED SAMMA TEXT ÄR ETT KORT (runda G1). Kickern, titeln och
# fotnoten är det enda handskrivna på kortet; är alla tre identiska på två
# produkter går korten inte att skilja åt, och då gör de inte sitt jobb.
rubriker = {}
for kort, kicker, titel, fotnot in rubrikpar:
    nyckel = tuple(x.strip().lower() for x in (kicker, titel, fotnot))
    rubriker.setdefault(nyckel, []).append(kort)
for (kicker, _titel, _fotnot), korten in rubriker.items():
    if len(korten) > 1:
        print(f"  {', '.join(korten)}: [SAMMA KORTTEXT] {kicker!r} — korten går "
              f"inte att skilja åt")
        fynd += len(korten)

# ☠️ ETT KORT PER PRODUKT, och rundans egen produktlista är facit. Utan den
# kollen fäller grinden aldrig på det vanligaste felet: att ett kort helt
# enkelt inte blev gjort. Leonards instruktion är att ALLA produkter ska ha
# kort — en grind som bara granskar de kort som råkar finnas hade varit en
# påminnelse, inte en spärr.
if os.path.exists("slugs.txt"):
    vantade = [r.split()[0] for r in open("slugs.txt", encoding="utf-8")
               if r.strip() and not r.startswith("#")]
    saknas = [k for k in vantade if k not in kort_sedda]
    for k in saknas:
        print(f"  {k}: [KORT SAKNAS] produkten står i slugs.txt men har ingen rad "
              f"i kort.tsv")
        fynd += 1
    extra = [k for k in kort_sedda if k not in vantade]
    for k in extra:
        print(f"  {k}: [OKÄND PRODUKT] raden i kort.tsv matchar ingen produkt i "
              f"slugs.txt")
        fynd += 1

sif = "utan siffergrind" if UTAN_FACIT else f"siffergrind mot {facitfil}"
print(f"\nKORTGRIND: {fynd} fynd i {len(kort_sedda)} kort ({sif})")
sys.exit(1 if (fynd or UTAN_FACIT) else 0)
