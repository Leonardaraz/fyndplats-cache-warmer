# -*- coding: utf-8 -*-
"""Runda 109 — familjens ÅTTA sidor: de två nya färgerna, och de sex live.

☠️ TEXTEN SKRIVS I FIL FÖRST (runda 64: 9 fel mot 0).

Modulen bär hela familjen, inte bara rundans två. Skälet är korslänkarna:
`syskon()` räknas ur PRODUKTER_IN, så när sexpanelsraden går från två färger
till fyra ändras fyra av runda 108:s redan publicerade sidor. Härleds deras
text ur den här källan blir listan riktig överallt samtidigt — och runbookens
regel gäller: härled ALDRIG en syskonsidas text ur det Wix lagrat, eftersom
Wix skriver om markupen vid sparning.

☠️ EN RÄTTELSE AV RUNDA 108, mätt på den nya färgens närbild. Runda 108 skrev
   att tallspjälorna "syns som ljusa streck i mellanrummen … tydligast på de
   ljusa modellerna och som svaga glimtar på de bruna". Den fjärde färgen
   fäller den meningen:

     färg    trä-%   trä L   väv L   kontrast
     vit       8,7     223     226          4   (ögat ser dem; mätaren kan
     natur    97,9     179     125         54    inte skilja trä från väv när
     brun      0,0     131      62         69    de har samma ton)
     svart     2,0     159      37        123   ← STARKAST kontrast av alla

   På svart är träet alltså TYDLIGAST, inte onämnt; på natur har trä och väv
   samma ton och läses inte som streck alls. En uppräkning av färger i ett
   DELAT block går sönder så fort familjen får en färg till. Meningen är
   därför omskriven till det som gäller på alla fyra fotona: väven är öppen
   och träet innanför syns i mellanrummen. Punkt.

☠️ OCH EN RÄTTELSE TILL, som inte går att mäta i efterhand. Runda 108 tog bort
   "massiv tall" med motiveringen att leverantören skriver `Kiefernholz`, inte
   `Massivholz`. De två utkasten i den här rundan — samma familj, samma
   textmall — skriver ordagrant "Der Rahmen des Raumtrenners aus **massivem
   Kiefernholz**". Motiveringen var alltså fel. Ändringen står kvar (kortare
   och lika sann), men LAGE.md:s andra halva — att den publicerade syskonsidan
   "skriver riktigt nog bara tallram" — är mätbart falsk: `d4118d39` säger
   "Ramen är av massiv tall" på två ställen.
"""

BAS = "https://www.fyndplats.se/produkt/"

L = lambda slug, text: f'<a href="{BAS}{slug}">{text}</a>'
P = lambda t: f"<p>{t}</p>"
H = lambda t: f"<h2>{t}</h2>"
LI = lambda t: f"<li>{t}</li>"
UL = lambda rader: "<ul>" + "".join(LI(f"<strong>{a}:</strong> {b}") for a, b in rader) + "</ul>"
F = lambda q, s: f"<p><strong>{q}</strong></p><p>{s}</p>"

# paneler -> (bredd, hopfällt djup, gångjärn, skarvar, ord för antalet)
STORLEK = {
    4: (160, "6,4", 9, 3, "fyra"),
    6: (240, "12,5", 15, 5, "sex"),
    8: (320, "16", 21, 7, "åtta"),
}
#            (paneler, färgens namn, färg i slug, vikt, paketmått)
PRODUKTER_IN = {
 "5f14c112": (4, "vit",         "vit",   "6 kg",    "173 × 43 × 9 cm"),
 "957b042d": (4, "brun",        "brun",  "6 kg",    "173 × 43 × 9 cm"),
 "ffb5239f": (6, "vit",         "vit",   "7,9 kg",  "173 × 43 × 15 cm"),
 "7bd4f691": (6, "svart",       "svart", "7,9 kg",  "173 × 43 × 15 cm"),
 "6649471e": (6, "naturfärgad", "natur", "7,9 kg",  "173 × 43 × 15 cm"),
 "854371fe": (6, "brun",        "brun",  "7,9 kg",  "173 × 43 × 15 cm"),
 "da1a8a75": (8, "vit",         "vit",   "9,65 kg", "173 × 43 × 18,5 cm"),
 "64c0809d": (8, "naturfärgad", "natur", "9,6 kg",  "173 × 43 × 18,5 cm"),
}
NYA = ("ffb5239f", "7bd4f691")
# Färgordet i löptext och spec — "naturfärgad" böjs illa i vissa lägen.
KORT_FARG = {"vit": "vit", "brun": "brun", "natur": "natur", "svart": "svart"}


def slug_av(paneler, fargslug):
    """☠️ Kort med flit. SKU:n byggs ur sluggen och kapas vid 24 tecken från
    VÄNSTER, så en lång mitt hade ätit upp det som skiljer sidorna åt.
    Räknat för rundans två: `rumsavdelare-240-vit` är 20 tecken och
    `rumsavdelare-240-svart` 22 — båda under taket, båda behåller färgen."""
    return f"rumsavdelare-{STORLEK[paneler][0]}-{fargslug}"


def foga(delar):
    """Svensk uppräkning: 'a', 'a och b', 'a, b och c'."""
    if len(delar) <= 1:
        return "".join(delar)
    return ", ".join(delar[:-1]) + " och " + delar[-1]


def syskon(nyckel):
    """Samma bredd i annan färg, och samma färg i annan bredd.

    ☠️ Listan är INTE alltid två rader — det stod i runda 108 och slutade
    gälla när sexpanelsraden fick fyra färger. Sorteringen är fast (bredd,
    sedan färgens namn) så att en omkörning ger byte-identisk text."""
    pan, _f, fargslug, _v, _pm = PRODUKTER_IN[nyckel]
    ut = []
    for k, (p2, _f2, fs2, _v2, _pm2) in PRODUKTER_IN.items():
        if k == nyckel:
            continue
        if p2 == pan:
            ut.append((0, KORT_FARG[fs2], f"samma bredd i {KORT_FARG[fs2]}", slug_av(p2, fs2)))
        elif fs2 == fargslug:
            ut.append((1, "%03d" % p2, f"samma {KORT_FARG[fs2]} i {STORLEK[p2][0]} cm",
                       slug_av(p2, fs2)))
    ut.sort()
    return [(t, s) for _a, _b, t, s in ut]


STADIGT = (
    H("Den står genom att vinklas")
    + P("En fristående skärm bär sig själv på formen, inte på tyngden. Vecklas "
        "panelerna ut i en mjuk sicksack står den stadigt på egen hand; dras de "
        "ut spikrakt har den ingenting att stödja sig mot. Så fungerar en "
        "fristående vikskärm, och det avgör var den kan stå.")
    + P("Foten är 6,5 cm hög och vilar på golvet utan att skruvas fast. Det finns "
        "ingen väggförankring, och därför hör skärmen hemma där den får stå "
        "ifred — utmed en vägg, runt ett hörn av rummet, bakom en soffa. Den är "
        "en avskärmning, inte en barriär, och ska inte användas för att stänga "
        "inne barn eller djur.")
)

VAVEN = (
    H("Skymmer insyn, mörklägger inte")
    + P("Väven är gjord av polypropen som flätats över en ram i tall. "
        "Mönstret är tätt nog att bryta blicken men inte tätt nog att stänga "
        "ute ljus — sett rakt framifrån är den en vägg, sett i motljus anas "
        "konturer igenom. Det gör den till en bra avdelare framför en "
        "arbetsplats eller en säng, och till ett dåligt mörkläggningsdraperi.")
    + P("Polypropen är samma sorts plastfiber som i utemattor. Den tål att "
        "torkas av och tappar inte formen om någon lutar sig mot den.")
    + P("Träet är inte bara en ram runt kanten. Banden är flätade över stående "
        "stommar av trä inne i panelen, och eftersom flätningen är öppen syns "
        "träet i mellanrummen mellan raderna — närmast som en glimt av ljust "
        "virke bakom väven.")
)

SKOTSEL = (
    H("Användning och skötsel")
    + P("Torka av väven med en fuktig trasa och torka efter med en torr. "
        "Polypropen tål vatten, men tallramen ska inte bli stående blöt — "
        "dammsug hellre med möbelmunstycke än att skölja.")
    + P("Fäll ihop den när den inte används. Hopfälld blir den en smal packe på "
        "40 cm bredd som får plats bakom en dörr eller under en säng, och "
        "gångjärnen mår bättre av att stå avlastade än utfällda i månader.")
    + P("Skärmen är gjord för inomhusbruk. Tallramen är obehandlad och väven är "
        "inte UV-stabiliserad för säsonger ute, så låt den stanna inne — på en "
        "inglasad balkong går det bra, i regn gör det inte det.")
    + P("Lyft i ramen, aldrig i väven. Flätningen bär sin egen vikt men är inte "
        "gjord för att ta hela skärmens.")
)


def bygg(nyckel):
    pan, farg, fargslug, vikt, paketmatt = PRODUKTER_IN[nyckel]
    bredd, hopfallt, gangjarn, skarvar, panelord = STORLEK[pan]
    kf = KORT_FARG[fargslug]
    lankar = syskon(nyckel)
    return dict(
        namn=f"Rumsavdelare {bredd} cm med {pan} paneler – {farg} polypropenväv på tallram",
        slug=slug_av(pan, fargslug),
        titel=f"Rumsavdelare {bredd} cm, {pan} paneler, {kf} | Fyndplats",
        meta=(f"Rumsavdelare {bredd} × 1,6 × 170 cm med {panelord} paneler i {farg} "
              f"polypropenväv på tallram. Vecklas ut direkt, ingen montering."),
        sokord=[("rumsavdelare", True),
                (f"rumsavdelare {pan} paneler", False),
                ("vikbar skärmvägg", False),
                ("insynsskydd inomhus", False)],
        html=(
            P(f"En <strong>rumsavdelare</strong> med {panelord} paneler som mäter "
              f"{bredd} × 1,6 × 170 cm utfälld. Varje panel är 40 cm bred och 170 cm "
              f"hög, och väven är {farg} polypropen på en tallram. Den "
              "kommer färdigmonterad — vik ut den och ställ den där du vill ha den.")
            + H("Så mycket den delar av")
            + P(f"Utfälld i rak linje täcker de {panelord} panelerna {bredd} cm. I "
                "praktiken ställer man den i vinkel, och då blir den kortare men "
                "stadigare: en mjuk sicksack över en bit av rummet räcker för att "
                "skilja en arbetsplats från en soffa eller dölja en säng i ett "
                "enrumsboende.")
            + P(f"Höjden är 170 cm mätt till bågens topp. Panelernas ovankant är "
                f"nämligen inte rak utan svängd, så kanten dippar en aning vid varje "
                f"skarv och stiger igen mitt på panelen. Sittande ser man ingenting "
                f"över kanten; stående beror det på hur lång du är.")
            + STADIGT
            + VAVEN
            + P(f"Skärmen väger {vikt} och fälls ihop till 40 × {hopfallt} × 170 cm. "
                f"Skarvarna hålls av {gangjarn} metallgångjärn, tre per skarv, och de "
                f"viker åt båda hållen så att sicksacken kan gå i vilken riktning "
                f"rummet kräver.")
            + P("Finns också som " + foga([L(s, t) for t, s in lankar]) + ".")
            + H("Tekniska specifikationer")
            + UL([
                ("Mått utfälld", f"{bredd} × 1,6 × 170 cm (B × D × H)"),
                ("Mått hopfälld", f"40 × {hopfallt} × 170 cm"),
                ("Panel", "40 × 1,6 × 170 cm"),
                ("Antal paneler", str(pan)),
                ("Gångjärn", f"{gangjarn} i metall, tre per skarv"),
                ("Fothöjd", "6,5 cm"),
                ("Material", "polypropenväv på tallram"),
                ("Färg", kf),
                ("Vikt", vikt),
                ("Paketmått", paketmatt),
                ("Montering", "ingen — levereras färdig"),
                ("Användning", "inomhus"),
            ])
            + SKOTSEL
            + H("Vanliga frågor")
            + F("Står den stadigt?",
                "Ja, så länge panelerna vinklas. Rakt utfälld har den inget stöd i "
                "sidled — så är en fristående vikskärm byggd. Ställ den i en mjuk sicksack, "
                "gärna med en av ändarna mot en vägg.")
            + F("Går det att se igenom den?",
                "Väven bryter blicken rakt framifrån men släpper igenom ljus. I "
                "motljus anas konturer. Den skymmer insyn, den mörklägger inte.")
            + F("Behöver den monteras?",
                "Nej. Den kommer hopfälld och färdig — du viker ut den och ställer "
                "den på plats.")
            + F("Kan den stå ute?",
                "Nej. Tallramen är obehandlad och väven är inte gjord för väder och "
                "sol över tid. På en inglasad balkong fungerar den, i regn inte.")
            + F("Hur mycket plats tar den hopfälld?",
                f"40 × {hopfallt} × 170 cm — en smal packe som ryms bakom en dörr "
                "eller under en säng.")
            + F("Går den att tvätta?",
                "Torka av med fuktig trasa och torka efter. Polypropen tål vatten, "
                "men låt inte tallramen bli stående blöt.")
            + F("Vad väger den?",
                f"{vikt}. En person bär den utan problem — lyft i ramen och inte i "
                "väven.")
        ),
    )


PRODUKTER = {k: bygg(k) for k in PRODUKTER_IN}

if __name__ == "__main__":
    for k, d in PRODUKTER.items():
        ny = " NY" if k in NYA else ""
        print(f"=== {k}{ny}")
        print(f"  namn  {len(d['namn']):>3}  {d['namn']}")
        print(f"  slug       {d['slug']}   SKU-del {len(d['slug'])} tecken")
        print(f"  titel {len(d['titel']):>3}  {d['titel']}")
        print(f"  meta  {len(d['meta']):>3}  {d['meta']}")
        print(f"  html  {len(d['html']):>4} tecken   syskon: {len(syskon(k))}")
