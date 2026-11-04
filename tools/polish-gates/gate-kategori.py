"""Grind för en KATEGORITEXT (sökordskategori i butiken, `headless-site`).

    python3 ../../polish-gates/gate-kategori.py julgranar-text.json

Filen bär `seo` (title, description) och `content` (intro[], faq[{q, a}]) —
exakt de två poster som läggs i `lib/category-seo.ts` och
`lib/category-content.ts` på butiksgrenen. Grinden kör:

- husets GRINDAR ur gatelib (husmärke, artikelnummer, fraktland, leverantör,
  tyska rester, stavning, homoglyfer, EN-norm),
- teckenlistan (TILLATNA_TECKEN),
- markup: butiken visar intro och FAQ som REN TEXT (`<p>{para}</p>`,
  `<dd>{f.a}</dd>`), så `**fet**`, `<strong>`, `[länk](…)` och `&nbsp;` syns
  ordagrant för kunden. Uppmätt på /kategori/belysning 2026-09-24:
  `**Sockeln**` hade stått med asteriskerna sedan 2026-08-12,
- superlativ i samma mening som ett omfång ("smalast av våra"),
- SORTIMENTSBEROENDE UPPGIFTER (EVERGREEN, sedan 2026-11-04): antal ("fyra av
  speglarna", "två åkhästar"), tak och spann ("upp till 100 × 80 cm", "120 till
  180 cm"), ytterlägen ("de högsta"), `flera har` / `de flesta` / `ingen av dem`,
  en enskild produkt med mått ("ett förrådstält på 13,4 m²") och "står i
  produktnamnet". Sortimentet ändras vid varje poleringsrunda och sidorna cachas
  i sex timmar, så sådana uppgifter blir fel. Fem sökordskategorier hann bli det
  innan spärren kom. En kategoritext beskriver VARUTYPEN, inte sortimentet.
  Mönstren speglar `lib/category-evergreen.ts` i butiken, där
  `lib/category-evergreen.test.ts` fäller dem på ALLA kategorier. Ändra bara
  båda tillsammans. `--självtest` kör ett fall per mönster (och rena meningar),
  för ett mönster som aldrig kan träffa är ingen spärr,
- och butikstesternas längdkrav (`category-seo.test.ts`): titel ≤ 48 + suffix,
  beskrivning 110–165, intro ≥ 90 ord, minst två frågor.

Siffror som är varutypens EGET villkor (IP-klass, kelvin, 499 kr för fri frakt)
får stå och skrivs som facit i filens `facit`-fält. Skriv aldrig en kategoritext
ur minnet: avstäm exempel och typer mot butikens lista
(`/api/lista?k=kategori/<slug>`). Ordlistorna bor i gatelib och importeras där
de är desamma; en egen lista här hade glidit isär (gate-kopior.test.ts).
"""
import json
import os
import re
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import gatelib as G  # noqa: E402

# ── Sortimentsberoende uppgifter ────────────────────────────────────────────
# Speglar EVERGREEN_MONSTER i lib/category-evergreen.ts (butiken, `headless-site`),
# mönster för mönster och i samma ordning. Ändra bara båda tillsammans. `\b` duger
# inte för svenska bokstäver, så gränserna är uttryckliga lookarounds. JS `\p{L}`
# blir `[^\W\d_]` här. Räknorden två–tolv importeras ur gatelib (ORDTAL_SV).
L0, L1 = r"(?<!\w)", r"(?!\w)"
BOKSTAV = r"[^\W\d_]"
RAKNE_FLERA = "|".join(G.ORDTAL_SV)
RAKNE = "en|ett|" + RAKNE_FLERA + r"|tretton|fjorton|femton|sexton|sjutton|arton|nitton|tjugo|\d+"
ENHET = "cm|mm|m²|m2|m|kg|g|l|liter|W|V|K|månader|mån|år|delar|st|stycken|%|timmar|minuter|dagar"
KVANT = "alla|samtliga|flera|många|några|vissa|de flesta"
VERB = ("är|har|kan|passar|står|finns|saknar|levereras|anger|klarar|ingår|fungerar|tål|hänger|väger"
        "|går|bär|kommer|ligger|sitter|följer|visar|behöver|erbjuder|ger")

EVERGREEN = [
    ("ANTAL_AV", "räknar produkter: 'fyra av speglarna', 'ett av dem', 'två av bodarna'",
     rf"{L0}(?:{RAKNE})\s+av\s+{BOKSTAV}+"),
    ("KVANT_AV", "säger hur stor del av sortimentet det gäller: 'många av växterna', 'flera av dem', 'hälften av modellerna'",
     rf"{L0}(?:(?:{KVANT}|hälften)\s+av\s+{BOKSTAV}+|en\s+del\s+av\s+(?:dem|de|våra){L1})"),
    ("KVANT_SUBJEKT", "'flera har', 'många står', 'de flesta går': ett påstående om sortimentet utan siffra",
     rf"(?<!hur\s)(?<!för\s){L0}(?:{KVANT})\s+(?:{VERB}){L1}"),
    ("KVANT_SUBSTANTIV", "'alla modeller', 'samtliga produkter': en helhet som slutar stämma när något tillkommer",
     rf"{L0}(?:alla|samtliga|flera|många|några|vissa)\s+(?:våra\s+|dessa\s+)?(?:modeller|produkter|artiklar){L1}"),
    ("INGEN_AV", "'ingen av dem', 'inga av': ett nekande om sortimentet",
     rf"{L0}(?:ingen|inga)\s+av\s+{BOKSTAV}+"),
    ("UPP_TILL", "sortimentets tak: 'upp till 100 × 80 cm', 'upp till 180 cm'",
     rf"{L0}upp\s+till\s+\d[\d.,]*"),
    ("FRAN_TILL", "sortimentets spann: 'från 1,1 till 12,4 m²', 'från 25 upp till 60 kg'",
     rf"{L0}från\s+\d[\d\s.,]*\s*(?:{ENHET})?\s*(?:upp\s+)?(?:till|–|-)\s*\d[\d.,]*"),
    ("INTERVALL", "sortimentets spann som intervall: '120 till 180 cm', '12–36 månader', '75–90 cm'",
     rf"\d[\d.,]*\s*(?:–|-|till)\s*\d[\d.,]*\s*(?:{ENHET}){L1}"),
    ("SUPERLATIV", "sortimentets ytterlägen: 'de högsta', 'den största modellen', 'som störst'",
     rf"{L0}(?:(?:de|den|det)\s+(?:högsta|största|längsta|tyngsta|bredaste|smalaste|lättaste|billigaste|dyraste)"
     rf"|som\s+(?:störst|högst|längst|minst|lägst)){L1}"),
    ("FINNS_ANTAL", "'Här finns också två åkhästar', 'finns i två längder': en räkning av vad som finns",
     rf"{L0}(?:finns|hittar du|samlar vi|har vi|erbjuder vi)\s+(?:(?:också|även|här|i|för|bland annat)\s+){{0,2}}"
     rf"(?:{RAKNE_FLERA})\s+{BOKSTAV}+"),
    ("STYCKEN", "'tre stycken', '4 st': en räkning",
     rf"{L0}(?:{RAKNE})\s+(?:stycken|st){L1}"),
    ("STORLEK_PA_ENSKILD", "'ett förrådstält på 13,4 m²', 'boden på 1,1 m²': en enskild produkt med mått",
     rf"{L0}(?:(?:ett|en)\s+(?:{BOKSTAV}+\s+){{0,2}}?{BOKSTAV}+|{BOKSTAV}+(?:n|en|et|na|erna|arna))"
     rf"\s+på\s+\d[\d.,]*\s*(?:cm|mm|m²|m2|m|kg|liter|l|W){L1}"),
    ("NAMN_ANGER", "'står i produktnamnet': produktnamnen skrivs om vid varje runda och bär inte alltid uppgiften",
     rf"{L0}(?:står|finns|anges|syns|framgår)\s+(?:(?:oftast|ofta|alltid|redan)\s+){{0,2}}(?:i|av|på)\s+"
     rf"(?:produkt)?(?:namnet|titeln){L1}"),
]
EVERGREEN = [(n, skal, re.compile(m, re.I)) for n, skal, m in EVERGREEN]

# Ett fall per mönster som MÅSTE träffa, och sanna meningar som INTE får göra det.
# Samma meningar som SJALVTEST i lib/category-evergreen.ts.
SJALVTEST_TRAFFAR = {
    "ANTAL_AV": "Fyra av speglarna har också Bluetooth och klocka.",
    "KVANT_AV": "Många av växterna passar både inne och ute.",
    "KVANT_SUBJEKT": "Flera har justerbara hyllplan, och de flesta går att låsa.",
    "KVANT_SUBSTANTIV": "Samtliga modeller levereras med bruksanvisning.",
    "INGEN_AV": "Ingen av dem har golv.",
    "UPP_TILL": "Storlekarna går upp till 100 × 80 cm.",
    "FRAN_TILL": "Bodar i galvad plåt från 1,1 till 12,4 m².",
    "INTERVALL": "Helkroppsspeglarna är 120 till 180 cm höga.",
    "SUPERLATIV": "Konstväxter, de högsta 180 cm, och häck på rulle.",
    "FINNS_ANTAL": "Här finns också två åkhästar i plysch, en på hjul och en elektrisk.",
    "STYCKEN": "Spegeln levereras med tre stycken fästen.",
    "STORLEK_PA_ENSKILD": "Här finns ett förrådstält på 13,4 m² och bodar i plåt.",
    "NAMN_ANGER": "Åldern står i produktnamnet, så du hittar rätt modell.",
}
SJALVTEST_RENT = [
    "Ljusets färg anges i kelvin: runt 3 000 K ger ett varmt sken, runt 6 000 K liknar dagsljus.",
    "IP44 tål vattenstänk, men placera ändå spegeln så att duschen inte sprutar direkt på den.",
    "Du handlar tryggt med Klarna, får fri frakt över 499 kr och har 30 dagars öppet köp.",
    "Åldern och maxvikten ska du kontrollera i beskrivningen och följa.",
    "Alla barn behöver en vuxen som har uppsikt när de gungar.",
    "Det finns skjutdörrar som inte behöver någon plats framför boden.",
    "Ingen skötsel behövs, och växterna behöver varken vattnas eller beskäras.",
    "En klassisk gunghäst kräver att barnet kan hålla balansen själv.",
    "Ställ spegeln där ljuset kommer in från sidan, till exempel vid ett fönster.",
    "Hur många kan spela med pokersetet?",
    "Domkraften lyfter bara en del av bilen, så välj en som klarar bilens vikt.",
    "Soffborden med LED har en ljuslist i flera färger som styrs med fjärrkontroll.",
    "Här samlar vi leksakskök för barn från tre år, i trä och plast.",
    "Produktnamnet säger vad varan är, och beskrivningen visar måtten.",
]


def evergreen_traffar(text):
    """[(namn, skäl, träffad bit)] för varje mönster som träffar texten."""
    ut = []
    for namn, skal, re_ in EVERGREEN:
        m = re_.search(text)
        if m:
            ut.append((namn, skal, m.group(0)))
    return ut


def sjalvtest():
    """Varje mönster träffar sitt fall, och de sanna meningarna träffar inget."""
    fel = []
    namn_i_listan = [n for n, _, _ in EVERGREEN]
    for n in namn_i_listan:
        if n not in SJALVTEST_TRAFFAR:
            fel.append(f"{n}: saknar självtest")
    for n, text in SJALVTEST_TRAFFAR.items():
        if n not in namn_i_listan:
            fel.append(f"{n}: självtest för ett mönster som inte finns")
        elif n not in [x[0] for x in evergreen_traffar(text)]:
            fel.append(f"{n}: träffar inte sitt eget fall {text!r}")
    for text in SJALVTEST_RENT:
        tr = evergreen_traffar(text)
        if tr:
            fel.append(f"falsk träff {[x[0] for x in tr]} på {text!r}")
    return fel


if len(sys.argv) == 2 and sys.argv[1] == "--självtest":
    fel = sjalvtest()
    for f in fel:
        print("SJÄLVTEST", f)
    print(f"självtest: {len(EVERGREEN)} mönster, {len(SJALVTEST_RENT)} rena meningar, {len(fel)} fel")
    sys.exit(1 if fel else 0)

if len(sys.argv) != 2:
    sys.exit("användning: gate-kategori.py <kategoritext.json>  |  gate-kategori.py --självtest")

d = json.load(open(sys.argv[1], encoding="utf-8"))
texter = [("seo.title", d["seo"]["title"]), ("seo.description", d["seo"]["description"])]
texter += [(f"intro[{i}]", t) for i, t in enumerate(d["content"]["intro"])]
for i, f in enumerate(d["content"]["faq"]):
    texter += [(f"faq[{i}].q", f["q"]), (f"faq[{i}].a", f["a"])]

# Butiken renderar texterna som ren text; allt här syns ordagrant för kunden.
MARKUP = re.compile(r"\*+|`+|_+|<[^>]*>|\[[^\]]*\]\([^)]*\)|&[A-Za-z0-9#]+;|^#{1,6}\s", re.M)

fynd = []
for namn, t in texter:
    for etikett, monster in G.GRINDAR:
        for m in re.finditer(monster, t):
            fynd.append(f"{namn}: {etikett} {m.group(0)!r}")
    for m in MARKUP.finditer(t):
        fynd.append(f"{namn}: MARKUP {m.group(0)!r} (butiken visar ren text)")
    for ch in t:
        if ord(ch) > 127 and ch not in G.TILLATNA_TECKEN:
            fynd.append(f"{namn}: TECKEN {ch!r} U+{ord(ch):04X}")
    for men in G.meningar(t):
        if re.search(G.SUPERLATIV, men, re.I) and re.search(G.OMFANG, men, re.I):
            fynd.append(f"{namn}: SUPERLATIV+OMFÅNG {men!r}")
    for monster_namn, skal, traff in evergreen_traffar(t):
        fynd.append(f"{namn}: EVERGREEN/{monster_namn} {traff!r} ({skal}). Skriv om så att meningen beskriver varutypen, inte sortimentet")

title, desc = d["seo"]["title"], d["seo"]["description"]
if len(title) + len(" | Fyndplats") > 60:
    fynd.append(f"title {len(title)} tecken + suffix > 60")
if not 110 <= len(desc) <= 165:
    fynd.append(f"description {len(desc)} tecken (110–165)")
ord_ = len(" ".join(d["content"]["intro"]).split())
if ord_ < 90:
    fynd.append(f"intro {ord_} ord (minst 90)")
if len(d["content"]["faq"]) < 2:
    fynd.append("färre än två FAQ")

print(f"title {len(title)} · description {len(desc)} · intro {ord_} ord · faq {len(d['content']['faq'])}")
for f in fynd:
    print("FYND", f)
print("RENT" if not fynd else f"{len(fynd)} FYND")
sys.exit(1 if fynd else 0)
