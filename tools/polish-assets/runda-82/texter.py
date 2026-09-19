# -*- coding: utf-8 -*-
"""Runda 82 — sju solsängar, solstolar och fällstolar.

☠️ Batch 64 mätte skillnaden: fem produkter skrivna inline i API-anropet gav
NIO fel som nådde Wix, tre skrivna via fil gav noll. Texten skrivs därför HÄR.

☠️ RUNDAN ÄR SJU, INTE ÅTTA. `ee610afd` föll på dubblettgrinden — samma stol
   säljs redan på FYRA publicerade sidor under två namnmönster. Beviset står
   i `STEG1.md`; utkastet lämnas osynligt.

☠️ `2a16c507` FÅR INGEN LIGGLÄGES-RAD. Leverantörens text säger 180 × 63,5 ×
   65 cm; leverantörens EGEN måttritning på samma produkt säger 178 och 70 cm.
   Texten är dessutom ordagrant kopierad från syskonet `f5d857b6`. När källan
   motsäger sig själv väljer man inte och medelvärdesbildar inte — man
   utelämnar raden. Samma regel som runda 80:s armstödshöjd.

☠️ ANTALET RYGGLÄGEN OCKSÅ. `f5d857b6` och `2a16c507` säger "fünf Stufen" i
   brödtexten och "7-stufig" i punktlistan, i SAMMA text. Spärrbeslaget går
   inte att räkna på någon bild. De två får därför "flera lägen" utan siffra;
   `d6a11ae3`, där båda källorna säger sju, får sju.

☠️ ORDET KONTORSSTOL ÄR FÖRBJUDET I DEN HÄR RUNDAN. Tyska titeln på de två
   4-packen säger `Tragbare Bürostühle`, men stolen har inga hjul, ingen
   gaslyft, ingen svikt och fast sitthöjd. Samma grind som #123. Linten fäller
   på det.

✅ MAXLASTEN ÄR PER STOL, OCH DET ÄR BEVISAT I PIXLARNA. Måttritningen på båda
   4-packen visar "120 kg" med nedåtpilar över EN stol. Runda 81 fick resonera
   sig till samma sak; här står det i bilden.

⚠️ SOLSÄNGARNA PÅSTÅS INTE VARA FÄRDIGMONTERADE. Källan lägger med en
   `Montageanleitung` och säger ingenting om att montering inte behövs — till
   skillnad från stolarna, där den uttryckligen skriver `Keine Montage
   erforderlich`. Vi skriver bara det källan säger.

⚠️ 4-PACKENS HOPFÄLLDA MÅTT STÅR I FEL ORDNING I KÄLLAN
   (`45B x 97T x 9H`). Ritningen visar stolen stående på kant: 45 bred,
   9 tjock, 97 hög. Vi skriver ritningens ordning.

⚠️ VIKTEN ÄR TOTALVIKT PÅ FLERPACKEN. 14,5 kg för fyra stolar är 3,6 kg per
   stol — talet kan bara vara totalen. Samma läsning på 2-packens 10 kg.

⚠️ KÄLLANS STAVFEL `Polyetser` rättas till polyester. Det är ett mekaniskt fel
   med ett mekaniskt svar.
"""

BAS = "https://www.fyndplats.se/produkt/"

# Publicerade sidor vi länkar till. Talen är LÄSTA i våra egna sidnamn.
PUBL_SOLSANG_187 = ("hopfallbar-solsang-187-cm-beige", "en beige solsäng på 187 cm som tål 120 kg")
PUBL_SOLSANG_2P = ("hopfallbar-solsang-2-pack", "ett tvåpack solsängar med parasoll")
PUBL_SOLSTOL_AKACIA = ("hopfallbar-solstol-akacia-fotdel", "en solstol i akacia som bär 160 kg")
PUBL_FALL_LAG = ("fallstolar-2-pack-lag-sits-37-cm", "fällstolar med 37 cm sitthöjd")
PUBL_TRADG_HOG = ("tradgardsstolar-hog-rygg-2-pack", "trädgårdsstolar med hög rygg")


def lank(slug, text):
    return '<a href="%s%s">%s</a>' % (BAS, slug, text)


def egenskaper(rader):
    return ("<p><strong>Egenskaper</strong></p><ul>"
            + "".join("<li>%s</li>" % r for r in rader) + "</ul>")


def rubrikblock(rubrik, stycken):
    return "<h2>%s</h2>" % rubrik + "".join("<p>%s</p>" % s for s in stycken)


def spec(rader):
    return ("<h2>Tekniska specifikationer</h2><ul>"
            + "".join("<li>%s</li>" % r for r in rader) + "</ul>")


def faq(rader):
    # ☠️ Wix STRIPPAR <br>. Fråga och svar måste vara TVÅ <p>.
    ut = ["<h2>Vanliga frågor</h2>"]
    for f, s in rader:
        ut.append("<p><strong>%s</strong></p><p>%s</p>" % (f, s))
    return "".join(ut)


def bygg(p):
    return "".join([p["ingress"], egenskaper(p["eg"]), spec(p["spec"]),
                    rubrikblock(p["villkor"][0], p["villkor"][1]),
                    rubrikblock("Användning och skötsel", p["skotsel"]),
                    faq(p["faq"])])


# ── Villkorsblock ───────────────────────────────────────────────────────────
def maxlast_solsang(kg):
    return ("Bär %d kg" % kg, [
        "Solsängen är provad för %d kg. Lås ryggstödet i sitt läge innan du "
        "lägger dig — beslaget ska ta hörbart, och en rygg som glider ner "
        "under någon är den verkliga risken med en fällbar solsäng, inte "
        "överlast." % kg,
        "Ställ den på plant underlag. På gräs och sand sjunker ett ben ner "
        "mer än de andra, och då hamnar hela lasten på tre ben i stället för "
        "fyra. Sitt inte på fotdelen när ryggen är uppfälld — tyngdpunkten "
        "hamnar utanför bakbenen.",
    ])


def maxlast_stol(kg, antal):
    return ("Bär %d kg per stol" % kg, [
        "Varje stol är provad för %d kg. Fäll ut den HELT innan du sätter dig "
        "och kontrollera att låsningen tagit — en fällstol som viks ihop under "
        "någon är familjens verkliga risk, inte överlast." % kg,
        "Talet gäller per stol, inte för alla %d tillsammans. Ställ stolen på "
        "plant underlag; på gräs och grus sjunker ett ben ner mer än de andra "
        "och lasten hamnar på tre ben i stället för fyra." % antal,
    ])


# ── Skötseltexter ───────────────────────────────────────────────────────────
TEXTILEN_SKOTSEL = ("Textilenväven torkas av med en fuktig trasa och torkar på "
                    "minuter. Den tål regn, men lämna den inte ute hela "
                    "vintern: det är lederna och skruvarna som rostar, inte "
                    "väven.")
OXFORD_SKOTSEL = ("Oxford-väven borstas ren torr och tvättas vid behov med "
                  "ljummet vatten och lite diskmedel. Låt stolen torka helt "
                  "uppfälld innan den ställs undan — fuktig väv i ett stängt "
                  "förråd möglar på några dagar.")
LEDER_SKOTSEL = ("Fäll och veckla ut den några gånger när den är ny så går "
                 "lederna mjukare. Kärvar en led senare räcker en droppe olja "
                 "i gångjärnet — smörj inte hela röret, oljan drar åt sig sand.")
KUDDE_SKOTSEL = ("Huvudkudden knäpps loss och tvättas för sig. Låt den torka "
                 "helt innan den sätts tillbaka; en fuktig kudde mot väven "
                 "lämnar ränder.")
INNE_SKOTSEL = ("Stolarna är gjorda för inomhusbruk. Torka av sitsen med en "
                "fuktig trasa och eftertorka — låt inte vatten stå kvar i "
                "sömmen. Förvara dem stående på kant, inte liggande i en "
                "trave, så tar stoppningen inga permanenta märken.")


MONTERING_FAQ_STOL = ("Behöver stolarna monteras?",
                      "Nej. Stolarna kommer färdiga och fälls ut på plats — "
                      "ingen montering krävs.")
MONTERING_FAQ_SOLSANG = (
    "Behöver den monteras?",
    "En monteringsanvisning följer med i kartongen. Till skillnad från "
    "fällstolar i vårt sortiment finns ingen uppgift om att solsängen skulle "
    "komma färdigmonterad, så räkna med några moment vid uppackningen.")


# ── Delade specbyggare ──────────────────────────────────────────────────────
def solsang_spec(farg, vikt, paket, liggrad, material, ingar):
    rader = ["Mått sittläge (L × B × H): 137 × 63,5 × 100,5 cm"]
    if liggrad:
        rader.append(liggrad)
    rader += [
        "Hopfälld (L × B × H): 81,5 × 20,5 × 64,5 cm",
        "Liggyta (B × L): 53,5 × 115 cm",
        "Sitthöjd: 33 cm",
        "Maxlast: 165 kg",
        "Vikt: %s kg" % vikt,
        "Paketmått: %s cm" % paket,
        "Material: %s" % material,
        "Färg: %s" % farg,
        "Montering: monteringsanvisning ingår",
        "Ingår: %s" % ingar,
    ]
    return rader


def solstol_spec(farg):
    return [
        "Antal: 2 stolar",
        "Mått utfälld (B × D × H): 62 × 70 × 109 cm",
        "Hopfälld (L × B × H): 99 × 62 × 10 cm",
        "Sits (B × D × H): 47 × 41 × 43 cm",
        "Ryggstöd (L × H): 72 × 47 cm",
        "Ryggstödets lägen: 5",
        "Maxlast: 120 kg per stol",
        "Vikt: 10 kg totalt",
        "Paketmått: 103 × 18 × 63,5 cm",
        "Stomme: pulverlackerat stål",
        "Klädsel: Oxford-väv och nätväv, nackstöd med skumstoppning",
        "Färg: %s" % farg,
        "Montering: krävs inte",
        "Ingår: 2 stolar och bruksanvisning",
    ]


def fallstol_spec(material):
    return [
        "Antal: 4 stolar",
        "Mått (B × D × H): 45 × 46 × 78 cm",
        "Hopfälld (B × D × H): 45 × 9 × 97 cm",
        "Sits (B × D × H): 37 × 37 × 45 cm",
        "Ryggstöd (B × H): 42 × 36 cm",
        "Sitthöjd: 45 cm",
        "Maxlast: 120 kg per stol",
        "Vikt: 14,5 kg totalt",
        "Paketmått: 98 × 46 × 22 cm",
        "Stomme: pulverlackerat stål",
        "Klädsel: %s" % material,
        "Färg: svart",
        "Montering: krävs inte",
        "Ingår: 4 stolar och bruksanvisning",
    ]


PRODUKTER = [
    # ── Tre solsängar ───────────────────────────────────────────────────────
    {
        "kort": "d6a11ae3", "pris": 1249, "antal": 1,
        "name": "Solsäng med dyna och huvudkudde – ryggstöd i sju lägen, 165 kg",
        "slug": "solsang-dyna-huvudkudde-sju-lagen",
        "title": "Solsäng med dyna och huvudkudde – 165 kg | Fyndplats",
        "meta": ("Hopfällbar solsäng med heltäckande sittdyna och avtagbar "
                 "huvudkudde. Ryggstödet ställs i sju lägen, 178 cm utfälld "
                 "och bär 165 kg."),
        "ingress": (
            "<p>En solsäng där <strong>dynan följer med</strong> — en "
            "heltäckande sittdyna över hela liggytan plus en avtagbar "
            "huvudkudde, inte bara en liten nackrulle. Det är skillnaden mot "
            "en bar väv när man ligger en hel eftermiddag.</p>"
            "<p>Ryggstödet ställs i sju lägen, från upprätt sittande till "
            "nästan plant. Utfälld mäter den 178 cm och sitthöjden är 33 cm; "
            "hopfälld är den 20,5 cm tjock och kan ställas på högkant mot en "
            "vägg.</p>"
            "<p>Vill du ha samma stomme utan dyna finns den " +
            lank("solsang-svart-sitthojd-33-cm", "i svart") + " och " +
            lank("solsang-gra-180-cm-huvudkudde", "i grått") + ". Vi har också " +
            lank(*PUBL_SOLSANG_187) + ".</p>"),
        "eg": [
            "Heltäckande sittdyna över hela liggytan ingår",
            "Avtagbar och tvättbar huvudkudde",
            "Ryggstöd i sju lägen, från sittande till nästan plant",
            "Armstöd på båda sidor",
            "Textilenväv under dynan som släpper igenom luft",
            "Fälls ihop till 20,5 cm tjocklek",
            "Bär 165 kg",
        ],
        "spec": solsang_spec(
            "svart med silverfärgad ram", "11,4", "64 × 24 × 83",
            "Mått liggläge (L × B × H): 178 × 63,5 × 70 cm",
            "metall, textilen, polyester och bomullsvadd",
            "solsäng, sittdyna, huvudkudde och monteringsanvisning"),
        "villkor": maxlast_solsang(165),
        "skotsel": [
            "Dynan och huvudkudden knäpps loss och tvättas för sig. "
            "Låt dem torka helt innan de sätts tillbaka — fuktig vadd mot "
            "väven lämnar ränder.",
            TEXTILEN_SKOTSEL, LEDER_SKOTSEL,
        ],
        "faq": [
            ("Ingår dynan, eller är det en tillbehörsbild?",
             "Dynan ingår. Sittdyna och huvudkudde ligger som två separata "
             "delar i förpackningen, utöver själva solsängen."),
            ("Hur långt bak går ryggstödet?",
             "Sju lägen, från upprätt sittande till nästan plant. I det "
             "flackaste läget är solsängen 178 cm lång och 70 cm hög."),
            ("Går den att ställa undan på vintern?",
             "Ja. Hopfälld är den 81,5 × 20,5 × 64,5 cm och står stadigt på "
             "högkant mot en vägg. Ta in dynan separat."),
            MONTERING_FAQ_SOLSANG,
        ],
    },
    {
        "kort": "f5d857b6", "pris": 1099, "antal": 1,
        "name": "Solsäng grå 180 cm – ställbart ryggstöd och huvudkudde",
        "slug": "solsang-gra-180-cm-huvudkudde",
        "title": "Solsäng grå 180 cm – ställbar rygg, bär 165 kg | Fyndplats",
        "meta": ("Grå hopfällbar solsäng i luftig textilenväv med avtagbar "
                 "huvudkudde. 180 cm i liggläget, 33 cm sitthöjd, bär 165 kg "
                 "och fälls ihop till 20,5 cm."),
        "ingress": (
            "<p>En grå solsäng i <strong>textilenväv</strong> — den luftiga "
            "väven som torkar på minuter efter regn i stället för att suga åt "
            "sig som en dyna. Huvudkudden är avtagbar och tvättbar.</p>"
            "<p>Utfälld mäter den 180 cm och 65 cm på höjden; sitthöjden är "
            "33 cm, alltså lägre än en matstol — man sitter tillbakalutad. "
            "Hopfälld är den 20,5 cm tjock.</p>"
            "<p>Samma solsäng finns " +
            lank("solsang-svart-sitthojd-33-cm", "i svart") +
            ". Vill du ha en heltäckande dyna på köpet finns " +
            lank("solsang-dyna-huvudkudde-sju-lagen",
                 "modellen med sittdyna och huvudkudde") + ", och i sortimentet "
            "ligger också " + lank(*PUBL_SOLSTOL_AKACIA) + ".</p>"),
        "eg": [
            "Textilenväv som släpper igenom luft och torkar snabbt",
            "Avtagbar och tvättbar huvudkudde",
            "Ryggstödet ställs i flera lägen",
            "Armstöd på båda sidor",
            "Låg sitthöjd på 33 cm för tillbakalutat sittande",
            "Fälls ihop till 20,5 cm tjocklek",
            "Bär 165 kg",
        ],
        "spec": solsang_spec(
            "grå", "10,4", "63,5 × 22 × 83",
            "Mått liggläge (L × B × H): 180 × 63,5 × 65 cm",
            "metall och textilen",
            "solsäng, huvudkudde och monteringsanvisning"),
        "villkor": maxlast_solsang(165),
        "skotsel": [TEXTILEN_SKOTSEL, KUDDE_SKOTSEL, LEDER_SKOTSEL],
        "faq": [
            ("I hur många lägen går ryggstödet?",
             "Ryggstödet går från upprätt sittande till nästan plant. Antalet "
             "lägen anges med två olika tal i underlaget för just den här "
             "modellen, så vi skriver inget — hellre inget tal än ett vi inte "
             "kan stå för."),
            ("Blir väven varm i solen?",
             "Textilen är en gles väv med luft rakt igenom, så den blir inte "
             "het på samma sätt som ett stoppat tyg. Den torkar också på "
             "minuter efter en skur."),
            ("Vad är skillnaden mot den svarta?",
             "Bara kulören på väven. Sittläge, hopfällt mått, sitthöjd och "
             "maxlast är desamma."),
            MONTERING_FAQ_SOLSANG,
        ],
    },
    {
        "kort": "2a16c507", "pris": 1129, "antal": 1,
        "name": "Solsäng svart i textilen – sitthöjd 33 cm, bär 165 kg",
        "slug": "solsang-svart-sitthojd-33-cm",
        "title": "Solsäng svart i textilen – sitthöjd 33 cm | Fyndplats",
        "meta": ("Svart hopfällbar solsäng i textilenväv med avtagbar "
                 "huvudkudde. Låg sitthöjd på 33 cm, bär 165 kg och fälls "
                 "ihop till 20,5 cm."),
        "ingress": (
            "<p>Den svarta solsängen i seriens två kulörer. "
            "<strong>Textilenväv</strong> med luft rakt igenom, avtagbar "
            "huvudkudde och armstöd på båda sidor.</p>"
            "<p>Sitthöjden är 33 cm och sittläget mäter 137 × 63,5 × 100,5 cm. "
            "Hopfälld är den 81,5 × 20,5 × 64,5 cm och står på högkant mot en "
            "vägg. Svart är den minst känsliga för pollen och damm av de två "
            "kulörerna — det är hela skillnaden mot syskonet, för sittläge, "
            "hopfällt mått och maxlast är desamma.</p>"
            "<p>Samma solsäng finns " +
            lank("solsang-gra-180-cm-huvudkudde", "i grått") +
            ", och med heltäckande dyna som " +
            lank("solsang-dyna-huvudkudde-sju-lagen",
                 "modellen med sittdyna och huvudkudde") + ".</p>"),
        "eg": [
            "Textilenväv som släpper igenom luft och torkar snabbt",
            "Avtagbar och tvättbar huvudkudde",
            "Ryggstödet ställs i flera lägen",
            "Armstöd på båda sidor",
            "Låg sitthöjd på 33 cm för tillbakalutat sittande",
            "Fälls ihop till 20,5 cm tjocklek",
            "Bär 165 kg",
        ],
        # ☠️ INGEN LIGGLÄGES-RAD. Källans text säger 180 × 63,5 × 65 och
        #    källans egen måttritning säger 178 och 70 — se STEG1.md.
        "spec": solsang_spec(
            "svart", "10,4", "63,5 × 22 × 83",
            None,
            "metall och textilen",
            "solsäng, huvudkudde och monteringsanvisning"),
        "villkor": maxlast_solsang(165),
        "skotsel": [TEXTILEN_SKOTSEL, KUDDE_SKOTSEL, LEDER_SKOTSEL],
        "faq": [
            ("Hur lång är den i liggläget?",
             "Det talet står inte här med flit. Underlaget för just den här "
             "kulören anger två olika längder — produkttexten säger ett tal "
             "och måttritningen ett annat — och vi skriver hellre inget mått "
             "än ett vi inte kan stå för. Sittläget är entydigt och stämmer i "
             "båda: 137 × 63,5 × 100,5 cm."),
            ("I hur många lägen går ryggstödet?",
             "Ryggstödet går från upprätt sittande till nästan plant. Antalet "
             "lägen anges med två olika tal i underlaget, så vi skriver "
             "inget."),
            ("Vad är skillnaden mot den grå?",
             "Kulören på väven. Sittläge, hopfällt mått, sitthöjd och maxlast "
             "är desamma."),
            MONTERING_FAQ_SOLSANG,
        ],
    },
]

PRODUKTER += [
    # ── Två solstolar i tvåpack ─────────────────────────────────────────────
    {
        "kort": "9ed7ad7a", "pris": 1129, "antal": 2,
        "name": "Solstolar 2-pack grå – stoppat nackstöd, rygg i fem lägen",
        "slug": "solstolar-2-pack-gra-nackstod",
        "title": "Solstolar 2-pack grå – nackstöd, fem lägen | Fyndplats",
        "meta": ("Två grå hopfällbara solstolar med stoppat nackstöd och "
                 "ryggstöd i fem lägen. 43 cm sitthöjd, bär 120 kg per stol "
                 "och kräver ingen montering."),
        "ingress": (
            "<p>Två solstolar med <strong>nackstödet stoppat och fastsytt i "
            "ryggen</strong>, inte som en lös kudde som glider ner så fort man "
            "reser sig. Det är skillnaden mot en enklare fällstol när man "
            "sitter en hel eftermiddag.</p>"
            "<p>Ryggstödet ställs i fem lägen, från upprätt till kraftigt "
            "tillbakalutat. Sitthöjden är 43 cm och ryggen 72 cm hög. "
            "Hopfällda är stolarna 10 cm tjocka och ligger platt i "
            "bagageluckan.</p>"
            "<p>Samma stolar finns " +
            lank("solstolar-2-pack-svarta-nackstod", "i svart") +
            ". Behöver du något lägre och mer loungeaktigt har vi " +
            lank(*PUBL_FALL_LAG) + ", och för matbordet ute " +
            lank(*PUBL_TRADG_HOG) + ".</p>"),
        "eg": [
            "Två stolar i leveransen",
            "Stoppat nackstöd fastsytt i ryggen",
            "Ryggstöd i fem lägen",
            "Armstöd på båda sidor",
            "Väderbeständig väv med nätparti som släpper igenom luft",
            "Fälls ihop till 10 cm tjocklek",
            "Bär 120 kg per stol",
        ],
        "spec": solstol_spec("grå"),
        "villkor": maxlast_stol(120, 2),
        "skotsel": [OXFORD_SKOTSEL, LEDER_SKOTSEL,
                    "Nackstödet sitter fast i ryggen och tas inte av. "
                    "Torka det med en fuktig trasa och lite diskmedel; "
                    "blötlägg det inte, eftersom skumstoppningen håller kvar "
                    "fukten länge."],
        "faq": [
            ("Går nackstödet att ta av?",
             "Nej, det är stoppat och sytt i ryggen. Fördelen är att det inte "
             "glider ner när du reser dig; nackdelen är att det inte kan "
             "tvättas separat."),
            ("Hur tjocka är de hopfällda?",
             "10 cm var, och 99 × 62 cm i de andra riktningarna. De ligger "
             "platt i en bagagelucka i stället för att ta höjd."),
            ("Är 120 kg för båda stolarna tillsammans?",
             "Nej, per stol."),
            MONTERING_FAQ_STOL,
        ],
    },
    {
        "kort": "85ffb47b", "pris": 1099, "antal": 2,
        "name": "Solstolar 2-pack svarta – stoppat nackstöd, rygg i fem lägen",
        "slug": "solstolar-2-pack-svarta-nackstod",
        "title": "Solstolar 2-pack svarta – nackstöd, fem lägen | Fyndplats",
        "meta": ("Två svarta hopfällbara solstolar med stoppat nackstöd och "
                 "ryggstöd i fem lägen. 43 cm sitthöjd, bär 120 kg per stol "
                 "och kräver ingen montering."),
        "ingress": (
            "<p>Två solstolar i svart med <strong>stoppat nackstöd sytt i "
            "ryggen</strong> och ryggstöd i fem lägen. Svart är den minst "
            "känsliga kulören för pollen och damm — det är hela skillnaden "
            "mot syskonet, för mått, vikt och maxlast är desamma.</p>"
            "<p>Sitthöjden är 43 cm och ryggen 72 cm hög. Hopfällda är "
            "stolarna 10 cm tjocka.</p>"
            "<p>Samma stolar finns " +
            lank("solstolar-2-pack-gra-nackstod", "i grått") +
            ". Behöver du en lägre loungestol har vi " + lank(*PUBL_FALL_LAG) +
            ", och för matbordet ute " + lank(*PUBL_TRADG_HOG) + ".</p>"),
        "eg": [
            "Två stolar i leveransen",
            "Stoppat nackstöd fastsytt i ryggen",
            "Ryggstöd i fem lägen",
            "Armstöd på båda sidor",
            "Väderbeständig väv med nätparti som släpper igenom luft",
            "Fälls ihop till 10 cm tjocklek",
            "Bär 120 kg per stol",
        ],
        "spec": solstol_spec("svart"),
        "villkor": maxlast_stol(120, 2),
        "skotsel": [OXFORD_SKOTSEL, LEDER_SKOTSEL,
                    "Nackstödet sitter fast i ryggen och tas inte av. "
                    "Torka det med en fuktig trasa och lite diskmedel; "
                    "blötlägg det inte, eftersom skumstoppningen håller kvar "
                    "fukten länge."],
        "faq": [
            ("Vad är skillnaden mot den grå?",
             "Bara kulören. Mått, ryggstödets fem lägen, vikten och maxlasten "
             "är desamma."),
            ("Hur tjocka är de hopfällda?",
             "10 cm var, och 99 × 62 cm i de andra riktningarna."),
            ("Är 120 kg för båda stolarna tillsammans?",
             "Nej, per stol."),
            MONTERING_FAQ_STOL,
        ],
    },

    # ── Två fyrpack fällstolar ──────────────────────────────────────────────
    {
        "kort": "1628620b", "pris": 1099, "antal": 4,
        "name": "Fällstolar 4-pack i linnelookat tyg – sitthöjd 45 cm, 120 kg",
        "slug": "fallstolar-linnelook-4-pack",
        "title": "Fällstolar 4-pack i linnelookat tyg – 45 cm sits | Fyndplats",
        "meta": ("Fyra hopfällbara stolar med stoppad sits och rygg i "
                 "linnelookat tyg. 45 cm sitthöjd, bär 120 kg per stol och "
                 "fälls ihop till 9 cm."),
        "ingress": (
            "<p>Fyra fällstolar med <strong>stoppad sits och stoppad "
            "rygg</strong> klädda i ett linnelookat tyg. Det är skillnaden mot "
            "en naken plåtstol: man kan sitta hela middagen utan att räkna "
            "minuterna.</p>"
            "<p>Sitthöjden är 45 cm, alltså samma som en vanlig matstol, så de "
            "fungerar vid ett bord och inte bara som extraplatser längs "
            "väggen. Hopfällda är de 9 cm tjocka och 97 cm höga — fyra stolar "
            "på rad tar 36 cm i en garderob.</p>"
            "<p>Samma stol finns " +
            lank("fallstolar-konstlader-4-pack", "klädd i konstläder") +
            " om du hellre torkar av än borstar. Ska stolarna stå ute finns " +
            lank(*PUBL_TRADG_HOG) + " i stället.</p>"),
        "eg": [
            "Fyra stolar i leveransen",
            "Stoppad sits och stoppad rygg i linnelookat tyg",
            "Sitthöjd 45 cm, samma som en vanlig matstol",
            "Öppen rygg som ger luft mot ryggen",
            "Fälls ihop till 9 cm tjocklek",
            "Ram i pulverlackerat stål",
            "Bär 120 kg per stol",
        ],
        "spec": fallstol_spec("linnelookat tyg, 100 % polyester, över skum"),
        "villkor": maxlast_stol(120, 4),
        "skotsel": [INNE_SKOTSEL,
                    "Tyget borstas rent torrt. En fläck tas med lite ljummet "
                    "vatten och diskmedel på en trasa — arbeta utifrån och in "
                    "mot fläcken så bildas ingen rand.",
                    LEDER_SKOTSEL],
        "faq": [
            ("Går de att ha ute?",
             "De är gjorda för inomhusbruk. Tyget och stoppningen suger åt sig "
             "fukt, och stommen är lackerat stål — en natt i regn räcker för "
             "att lämna spår. Vill du ha stolar som står ute har vi "
             "hopfällbara trädgårdsstolar i sortimentet."),
            ("Hur mycket plats tar de hopfällda?",
             "9 cm var på tjockleken, 45 cm breda och 97 cm höga. Fyra stolar "
             "på rad blir 36 cm."),
            ("Vad är skillnaden mot konstlädermodellen?",
             "Bara klädseln. Mått, sitthöjd, vikt och maxlast är desamma."),
            MONTERING_FAQ_STOL,
        ],
    },
    {
        "kort": "4ca8a6c0", "pris": 1099, "antal": 4,
        "name": "Fällstolar 4-pack i konstläder – sitthöjd 45 cm, 120 kg",
        "slug": "fallstolar-konstlader-4-pack",
        "title": "Fällstolar 4-pack i konstläder – 45 cm sits | Fyndplats",
        "meta": ("Fyra hopfällbara stolar med stoppad sits och rygg i svart "
                 "konstläder. 45 cm sitthöjd, bär 120 kg per stol och fälls "
                 "ihop till 9 cm."),
        "ingress": (
            "<p>Fyra fällstolar med stoppad sits och rygg i <strong>svart "
            "konstläder</strong>. Ytan torkas av med en trasa i stället för att "
            "borstas, vilket är hela poängen om stolarna ska fram när det "
            "serveras mat.</p>"
            "<p>Sitthöjden är 45 cm, alltså samma som en vanlig matstol. "
            "Hopfällda är de 9 cm tjocka och 97 cm höga — fyra stolar på rad "
            "tar 36 cm i en garderob.</p>"
            "<p>Samma stol finns " +
            lank("fallstolar-linnelook-4-pack", "i linnelookat tyg") +
            " om du hellre har en matt textil yta. Ska stolarna stå ute finns " +
            lank(*PUBL_TRADG_HOG) + " i stället.</p>"),
        "eg": [
            "Fyra stolar i leveransen",
            "Stoppad sits och stoppad rygg i konstläder",
            "Torkas av med en fuktig trasa",
            "Sitthöjd 45 cm, samma som en vanlig matstol",
            "Fälls ihop till 9 cm tjocklek",
            "Ram i pulverlackerat stål",
            "Bär 120 kg per stol",
        ],
        "spec": fallstol_spec("konstläder över skum"),
        "villkor": maxlast_stol(120, 4),
        "skotsel": [INNE_SKOTSEL,
                    "Konstläder torkas av med en fuktig trasa. Använd inte "
                    "lösningsmedel, sprit eller slipande rengöring — ytan är "
                    "ett tunt skikt och krackelerar när det torkar ut.",
                    LEDER_SKOTSEL],
        "faq": [
            ("Går de att ha ute?",
             "De är gjorda för inomhusbruk. Konstläder spricker av kyla och "
             "UV-ljus, och stommen är lackerat stål. Vill du ha stolar som "
             "står ute har vi hopfällbara trädgårdsstolar i sortimentet."),
            ("Hur mycket plats tar de hopfällda?",
             "9 cm var på tjockleken, 45 cm breda och 97 cm höga. Fyra stolar "
             "på rad blir 36 cm."),
            ("Vad är skillnaden mot tygmodellen?",
             "Bara klädseln. Mått, sitthöjd, vikt och maxlast är desamma."),
            MONTERING_FAQ_STOL,
        ],
    },
]
