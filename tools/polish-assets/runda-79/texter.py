# -*- coding: utf-8 -*-
"""Runda 79 — åtta rullpallar och salongspallar ur samma tyska familj.

☠️ Batch 64 mätte skillnaden: fem produkter skrivna inline i API-anropet gav
NIO fel som nådde Wix, tre skrivna via fil gav noll. Texten skrivs därför HÄR.

☠️ RITNINGEN ÄR FACIT, precis som i runda 78. Två av åtta anger SITSENS mått i
   fältet för produktens totalmått (`711f7859` Ø35 mot ritningens Ø50;
   `93b7d87b` har L och B omkastade mot ritningen). Måtten nedan är lästa ur
   måttritningen där den och spec-listan säger olika.

☠️ `c328a7c0` ÄR ETT TVÅPACK. Den tyska brödtexten säger "Dieses Set aus 2 …
   Stühlen" och `Lieferumfang: 2 x Hocker`. Steg 1 förde upp den som en ensam
   pall. Priset är för BÅDA.

☠️ `c328a7c0`:s TOTALHÖJD UTELÄMNAS. Källan anger tre olika tal för samma
   pall — 52–72 i brödtexten, 57–72 i spec-listan, och ritningen är otydlig.
   SITTHÖJDEN 47–62 står i både spec-listan och ritningen och är det enda
   höjdtal som går att belägga. Vi anger fotavtrycket och sitthöjden, inget
   annat. Samma hållning som runda 78 tog till vikten.

☠️ TVÅ UTKAST UR FAMILJEN ÄR DUBBLETTER och ingår INTE här: `df3a97c6` (samma
   fotografi som publicerade `arbetsstol-hjul-51-67-cm-avtagbar-rygg`) och
   `9c6fde71` (samma chassi och samma måttritning som publicerade
   `arbetspall-med-hjul`). Se `STEG1-TILLAGG.md`.

☠️ `ergonomisk` FÅR INTE FÖREKOMMA — samma regel som runda 78. Tre av källans
   texter kallar pallarna ergonomiska utan någon certifiering bakom ordet.

☠️ INGEN AV DE ÅTTA SÄLJS SOM KONTORSSTOL. Ryggstöden är 4,5 till 28 cm höga
   eller saknas helt; en rullpall är inte en arbetsstol för heldagsarbete.

☠️ TRE HÄLSOPÅSTÅENDEN STRUKNA. Källan skriver att sadelsitsen "sorgt
   automatisch für ein aufrechtes Sitzen, welches die Wirbelsäule entlastet",
   att sitsen "fördert eine gesunde Sitzhaltung" och att ryggstödet ger
   "hervorragende Rückenstütze". Kvar står formen och måtten; vad det gör med
   ryggen får kunden avgöra.

⚠️ FÄRGEN ÄR MÄTT, INTE AVSKRIVEN. Källan säger `Weiß` om `711f7859`, men
   sitsens pixlar ger R−B = +21 mot +1…+5 för de tre andra vita — den är
   gräddvit. Och `12ce97db` kallas `Schwarz` i brödtexten och `Grau` i den
   svenska raden; sitsens medianluminans är 75 mot 46–62 för de tre som
   verkligen är svarta. Den är grå med svart fot. Samma klass som runda 65:s
   salviagröna fåtölj.

⚠️ MATERIALET: brödtexten säger konstläder på alla åtta, medan den svenska
   raden på `983fe163`/`98c1b3cb` säger "Polyester/Stahl". Bilderna visar
   blank läderimitation. Vi skriver konstläder.
"""

BAS = "https://www.fyndplats.se/produkt/"

# --- Publicerade sidor vi länkar till. Talen är LÄSTA på dem, inte gissade. --
PUBL_SADELPALL_BRUN = ("sadelpall-hjul-49-61-cm-brun", "49–61 cm")
PUBL_ARBETSPALL = ("arbetspall-med-hjul", "48–63 cm")
# Runda 78:s egna sidor
R78_ARBETSPALL = ("arbetspall-rygg-och-fotring", "49–65 cm")
R78_TVAPACK = ("rullpallar-2-pack-48-63-cm", "48–63 cm")
R78_SALONGSPALL = "salongspall-utan-rygg-9-cm-skum"


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


# ☠️ MAXLASTEN FÅR EGEN RUBRIK — ett positivt villkor, aldrig en varningsruta.
def maxlast(kg, extra=None, ordet="Pallen"):
    st = ["%s är provad för %d kg. Talet gäller EN person som sitter, inte "
          "att stå på sitsen — en pall med gaslyft är ingen trappstege, och en "
          "sits som vrider sig under en fot gör det inte under en kropp."
          % (ordet, kg)]
    if extra:
        st.append(extra)
    st.append("Efterdra skruvarna efter någon månads användning. Det är den "
              "enskilt vanligaste orsaken till att en pall börjar glappa, och "
              "det tar en minut.")
    return ("Bär %d kg" % kg, st)


HJUL_SKOTSEL = ("Hjulen samlar hår och damm i navet. Vänd pallen upp och ned "
                "ett par gånger om året och dra ut det som fastnat, så rullar "
                "den lätt igen.")
KONSTLADER_SKOTSEL = ("Konstlädret torkas av med en fuktig trasa och lite "
                      "diskmedel. Undvik lösningsmedel och sprit — de torkar ut "
                      "ytan och gör den spröd med tiden.")
GASLYFT_FAQ = ("Hur ställer jag in höjden?",
               "Med spaken under sitsen. Lyft den medan du står upp så går "
               "pallen upp, tryck den medan du sitter så går den ner. "
               "Gaslyften stannar där du släpper.")
MONTERING_FAQ = ("Behöver den monteras?",
                 "Ja, men det är få delar och går på några minuter: fotkryss, "
                 "gaslyft och sits sätts ihop, och hjulen trycks i. "
                 "Bruksanvisning ingår.")


PRODUKTER = [
    # ====================================== O · OVAL RYGG PÅ FJÄDER (2) ===
    {
        "kort": "983fe163", "pris": 799,
        "slug": "rullpall-vit-oval-rygg-48-64-cm",
        "name": "Rullpall vit med oval rygg och fotring – sitthöjd 48–64 cm",
        "title": "Rullpall vit med rygg 48–64 cm | Fyndplats",
        "meta": "Vit rullpall med oval rygg på fjäderstam och fotring runt "
                "pelaren. Sitthöjd 48–64 cm, sits Ø32,5 cm med 6 cm skum, "
                "femarmad fot på hjul, bär 120 kg.",
        "ingress":
            "<p>En <strong>rullpall med rygg</strong> för den som sitter framåtlutad "
            "en stor del av dagen och ändå vill ha något att luta sig mot mellan "
            "momenten. Ryggstödet är 33 cm brett och 23 cm högt och sitter på en "
            "fjädrande stam, så det följer med när du lutar dig bakåt i stället "
            "för att ta emot som en vägg.</p>"
            "<p>Runt pelaren löper en fotring. Den är där för att du ska kunna "
            "sitta högt utan att benen hänger — höjer du sitsen till 64 cm blir "
            "ringen ditt fotstöd.</p>"
            "<p>Samma pall finns i svart: "
            + lank("rullpall-svart-oval-rygg-48-64-cm", "den svarta rullpallen med oval rygg")
            + ". Vill du ha fotringen men klara dig utan ryggstöd finns "
            + lank("salongspall-vit-fotring-50-64-cm",
                   "den vita salongspallen med fotring")
            + ".</p>",
        "eg": [
            "Oval rygg 33 × 23 cm på fjädrande stam",
            "Fotring runt pelaren — fungerar som fotstöd i höga lägen",
            "Sitthöjd 48–64 cm med gaslyft",
            "Rund sits Ø 32,5 cm med 6 cm skum",
            "Femarmad metallfot på hjul, sitsen vrider 360°",
            "Bär 120 kg",
        ],
        "spec": [
            "Mått (B × D × H): 32 × 40 × 70–86 cm",
            "Sits: Ø 32,5 cm",
            "Sitthöjd: 48–64 cm",
            "Skummets tjocklek: 6 cm",
            "Ryggstöd (B × H): 33 × 23 cm",
            "Fotring: ja, runt pelaren",
            "Vridning: 360°",
            "Maxlast: 120 kg",
            "Vikt: 5,1 kg",
            "Klädsel: konstläder",
            "Höjdreglering: gaslyft",
            "Fot: femarmad, på hjul",
            "Färg: vit",
            "Montering: krävs",
            "Ingår: rullpall och bruksanvisning",
        ],
        "villkor": maxlast(120,
            "Ryggstödet är ett stöd att luta sig mot, inte ett att luta sig "
            "över. Det sitter på en fjäder och är byggt för ryggens tyngd i "
            "vila — inte för att bära en kropp som hänger bakåt."),
        "skotsel": [
            KONSTLADER_SKOTSEL,
            "Fotringen får mest slitage av alla ytor på pallen, eftersom skorna "
            "vilar där. Torka av den när den blir smutsig; kromet tål vatten "
            "och diskmedel men inte skurmedel.",
            HJUL_SKOTSEL,
        ],
        "faq": [
            GASLYFT_FAQ,
            ("Går ryggstödet att ta bort?",
             "Nej, ryggen sitter fast på sin fjäderstam. Vill du ha en pall "
             "helt utan rygg finns " + lank(R78_SALONGSPALL,
                 "salongspallen utan rygg") + " i stället."),
            ("Kan man ställa in ryggstödets höjd?",
             "Nej, ryggen står i fast läge i förhållande till sitsen. Det som "
             "ställs in är sitthöjden, 48–64 cm, och då följer ryggen med."),
            MONTERING_FAQ,
        ],
    },
    {
        "kort": "98c1b3cb", "pris": 799,
        "slug": "rullpall-svart-oval-rygg-48-64-cm",
        "name": "Rullpall svart med oval rygg och fotring – sitthöjd 48–64 cm",
        "title": "Rullpall svart med rygg 48–64 cm | Fyndplats",
        "meta": "Svart rullpall med oval rygg på fjäderstam och fotring runt "
                "pelaren. Sitthöjd 48–64 cm, sits Ø32,5 cm med 6 cm skum, "
                "femarmad fot på hjul, bär 120 kg.",
        "ingress":
            "<p>Den svarta <strong>rullpallen med rygg</strong> — samma pall som "
            "den vita, i en kulör som inte visar varje fingeravtryck. Ryggstödet "
            "på 33 × 23 cm sitter på en fjädrande stam och ger något att luta "
            "sig mot mellan momenten, utan att stå i vägen när du lutar dig "
            "framåt igen.</p>"
            "<p>Fotringen runt pelaren gör de höga lägena användbara. Vid 64 cm "
            "sitthöjd når fötterna inte golvet på de flesta, och då är ringen "
            "skillnaden mellan att sitta och att balansera.</p>"
            "<p>Samma pall i vitt: "
            + lank("rullpall-vit-oval-rygg-48-64-cm", "den vita rullpallen med oval rygg")
            + ". Vill du ha ett lägre, bredare ryggstöd finns "
            + lank(R78_ARBETSPALL[0],
                   "arbetspallen med rygg och fotring på " + R78_ARBETSPALL[1])
            + ".</p>",
        "eg": [
            "Oval rygg 33 × 23 cm på fjädrande stam",
            "Fotring runt pelaren — fungerar som fotstöd i höga lägen",
            "Sitthöjd 48–64 cm med gaslyft",
            "Rund sits Ø 32,5 cm med 6 cm skum",
            "Femarmad metallfot på hjul, sitsen vrider 360°",
            "Bär 120 kg",
        ],
        "spec": [
            "Mått (B × D × H): 32 × 40 × 70–86 cm",
            "Sits: Ø 32,5 cm",
            "Sitthöjd: 48–64 cm",
            "Skummets tjocklek: 6 cm",
            "Ryggstöd (B × H): 33 × 23 cm",
            "Fotring: ja, runt pelaren",
            "Vridning: 360°",
            "Maxlast: 120 kg",
            "Vikt: 5,1 kg",
            "Klädsel: konstläder",
            "Höjdreglering: gaslyft",
            "Fot: femarmad, på hjul",
            "Färg: svart",
            "Montering: krävs",
            "Ingår: rullpall och bruksanvisning",
        ],
        "villkor": maxlast(120,
            "Ryggstödet är ett stöd att luta sig mot, inte ett att luta sig "
            "över. Det sitter på en fjäder och är byggt för ryggens tyngd i "
            "vila — inte för att bära en kropp som hänger bakåt."),
        "skotsel": [
            KONSTLADER_SKOTSEL,
            "Svart konstläder visar damm och ludd tydligare än ljust. En torr "
            "mikrofiberduk tar det mesta utan att lämna ränder.",
            HJUL_SKOTSEL,
        ],
        "faq": [
            GASLYFT_FAQ,
            ("Vad skiljer den från den vita?",
             "Bara kulören. Mått, sitthöjd, ryggstöd, fotring och maxlast är "
             "identiska på " + lank("rullpall-vit-oval-rygg-48-64-cm",
                 "den vita rullpallen med oval rygg") + "."),
            ("Rullar den på mjukt golv?",
             "Hjulen är gjorda för hårda golv — klinker, laminat och trä. På "
             "hög matta rullar de trögt, och där gör en matta av hård plast "
             "under pallen stor skillnad."),
            MONTERING_FAQ,
        ],
    },
    # ======================================== K · KUPAD OCH HÖG RYGG (2) ===
    {
        "kort": "711f7859", "pris": 899,
        "slug": "salongspall-kupad-rygg-53-73-cm",
        "name": "Salongspall gräddvit med kupad rygg – sitthöjd 53–73 cm",
        "title": "Salongspall med kupad rygg 53–73 cm | Fyndplats",
        "meta": "Gräddvit salongspall med kupad rygg som följer sitsens kant. "
                "Sitthöjd 53–73 cm, rund sits Ø35 cm med 8 cm skum, femarmad "
                "kromad fot på fem hjul, bär 120 kg.",
        "ingress":
            "<p>En <strong>salongspall</strong> med hög sitthöjd och en rygg som "
            "kupar sig runt sitsens bakkant i stället för att resa sig rakt upp. "
            "Stödet är bara 11,5 cm högt men löper 35 cm på bredden, så det "
            "fångar upp korsryggen utan att komma i vägen för armarna.</p>"
            "<p>Sitthöjden går till 73 cm. Det är ovanligt högt för en pall och "
            "är gjort för att arbeta över någon som ligger eller sitter i en "
            "högre stol — vid 53 cm fungerar den som en vanlig pall vid ett "
            "bord.</p>"
            "<p>Skummet är 8 cm, det tjockaste i den här serien. Behöver du en "
            "högre rygg finns "
            + lank("salongspall-svart-hog-rygg-51-66-cm",
                   "salongspallen med hög svängd rygg")
            + " i svart.</p>",
        "eg": [
            "Kupad rygg 35 cm bred och 11,5 cm hög, följer sitsens kant",
            "Hög sitthöjd 53–73 cm med gaslyft",
            "Rund sits Ø 35 cm med 8 cm skum",
            "Femarmad kromad stålfot på fem hjul",
            "Sitsen vrider 360°",
            "Bär 120 kg",
        ],
        "spec": [
            "Mått (Ø × H): 50 × 63–83 cm",
            "Sits: Ø 35 cm",
            "Sitthöjd: 53–73 cm",
            "Skummets tjocklek: 8 cm",
            "Ryggstöd (B × D × H): 35 × 4 × 11,5 cm",
            "Vridning: 360°",
            "Maxlast: 120 kg",
            "Vikt: 7 kg",
            "Klädsel: konstläder",
            "Stativ: kromat stål",
            "Höjdreglering: gaslyft",
            "Fot: femarmad, fem hjul",
            "Färg: gräddvit",
            "Montering: krävs",
            "Ingår: salongspall och bruksanvisning",
        ],
        "villkor": maxlast(120,
            "Ju högre du ställer pallen, desto mindre marginal har den mot att "
            "tippa när du sträcker dig åt sidan. Vid de översta lägena är "
            "fotkryssets Ø 50 cm det som håller emot — låt fötterna vara kvar "
            "i golvet när du sträcker dig."),
        "skotsel": [
            KONSTLADER_SKOTSEL,
            "Gräddvitt tar färg av mörka jeans och nya textilier på samma sätt "
            "som ljusa bilklädslar gör. Torka av avfärgning tidigt — den "
            "sitter hårdare ju längre den får ligga.",
            HJUL_SKOTSEL,
        ],
        "faq": [
            GASLYFT_FAQ,
            ("Hur hög är ryggen egentligen?",
             "11,5 cm över sitsen, och 35 cm bred. Den är ett stöd för "
             "korsryggen, inte ett ryggstöd att luta hela ryggen mot."),
            ("Är den vit eller gräddvit?",
             "Gräddvit. Kulören går åt det varma hållet och är inte samma vita "
             "som " + lank("salongspall-vit-fotring-50-64-cm",
                 "salongspallen med fotring") + " har."),
            MONTERING_FAQ,
        ],
    },
    {
        "kort": "93b7d87b", "pris": 919,
        "slug": "salongspall-svart-hog-rygg-51-66-cm",
        "name": "Salongspall svart med hög svängd rygg – sitthöjd 51–66 cm",
        "title": "Salongspall svart med hög rygg | Fyndplats",
        "meta": "Svart salongspall med 28 cm hög svängd rygg och 7 cm sittdyna. "
                "Sitthöjd 51–66 cm, rund sits Ø36 cm, femarmad kromad fot på "
                "fem hjul, bär 120 kg.",
        "ingress":
            "<p>Den här <strong>salongspallen</strong> har seriens högsta rygg: "
            "28 cm, svängd så att den omsluter ryggen i stället för att möta "
            "den platt. Dynan i ryggen är 5 cm och sittdynan 7 cm — mer "
            "stoppning än pallarna med lågt stöd, och det märks på ett längre "
            "arbetspass.</p>"
            "<p>Klädseln är vattentät konstläder, alltså den sortens yta som "
            "tål att torkas av flera gånger om dagen utan att spricka. Det är "
            "därför pallen är svart: en ljus yta som torkas ofta blir aldrig "
            "riktigt ren igen.</p>"
            "<p>Vill du ha ett lägre, kupat stöd i stället finns "
            + lank("salongspall-kupad-rygg-53-73-cm",
                   "salongspallen med kupad rygg")
            + " i gräddvitt.</p>",
        "eg": [
            "Hög svängd rygg 38 × 28 cm med 5 cm dyna",
            "Sittdyna 7 cm, rund sits Ø 36 cm",
            "Sitthöjd 51–66 cm med gaslyft",
            "Femarmad kromad stålfot på fem hjul",
            "Vattentät konstläderklädsel som tål att torkas av ofta",
            "Bär 120 kg",
        ],
        "spec": [
            "Mått (B × D × H): 45 × 54 × 73–88 cm",
            "Sits: Ø 36 cm",
            "Sitthöjd: 51–66 cm",
            "Sittdynans tjocklek: 7 cm",
            "Ryggstöd (B × H): 38 × 28 cm",
            "Ryggdynans tjocklek: 5 cm",
            "Vridning: 360°",
            "Maxlast: 120 kg",
            "Vikt: 7,8 kg",
            "Klädsel: konstläder, vattentät",
            "Stativ: kromat stål",
            "Höjdreglering: gaslyft",
            "Fot: femarmad, fem hjul",
            "Färg: svart",
            "Montering: krävs",
            "Ingår: salongspall och bruksanvisning",
        ],
        "villkor": maxlast(120,
            "Ryggen är hög nog att luta sig mot på riktigt. Luta dig bakåt, "
            "inte bakåt OCH åt sidan — det är kombinationen som lyfter ett av "
            "fotkryssets ben från golvet."),
        "skotsel": [
            "Klädseln är vattentät, så den tål att torkas av med fuktig trasa "
            "flera gånger om dagen. Det är det den är gjord för; det den inte "
            "tål är sprit och lösningsmedel, som torkar ut ytan.",
            "Svart konstläder visar damm och ludd tydligare än ljust. En torr "
            "mikrofiberduk tar det mesta utan att lämna ränder.",
            HJUL_SKOTSEL,
        ],
        "faq": [
            GASLYFT_FAQ,
            ("Går ryggen att fälla eller vinkla?",
             "Nej, ryggen står i fast läge. Det som ställs in är sitthöjden, "
             "51–66 cm."),
            ("Är den bekvämare än de med lågt stöd?",
             "Den har mer stoppning — 7 cm i sitsen och 5 cm i ryggen — och en "
             "rygg på 28 cm i stället för 11,5. Vad som passar dig beror på om "
             "du sitter framåtlutad eller lutar dig tillbaka."),
            MONTERING_FAQ,
        ],
    },
    # ================================================== T · TVÅPACKET (1) ===
    {
        "kort": "c328a7c0", "pris": 1229,
        "slug": "rullpallar-2-pack-lag-rygg-47-62-cm",
        "name": "Rullpallar 2-pack med låg rygg – sitthöjd 47–62 cm, 120 kg per pall",
        "title": "Rullpallar 2-pack med rygg | Fyndplats",
        "meta": "Två svarta rullpallar med låg rygg och fotring. Sitthöjd "
                "47–62 cm, sits 37 × 33 cm, femarmad kromad fot på fem hjul, "
                "bär 120 kg per pall.",
        "ingress":
            "<p><strong>Två rullpallar</strong> i samma köp, för den som behöver "
            "en åt sig själv och en åt den som hjälper till — eller helt enkelt "
            "en i varje rum. Priset gäller båda pallarna.</p>"
            "<p>Ryggstödet är lågt: 34 cm brett och 4,5 cm högt, ett smalt band "
            "i höjd med korsryggen. Det stör inte armarna och gör pallen lätt "
            "att skjuta in under ett bord, men det är inget att luta hela "
            "ryggen mot.</p>"
            "<p>Vi säljer också "
            + lank(R78_TVAPACK[0], "ett tvåpack rullpallar utan rygg med sitthöjd " + R78_TVAPACK[1])
            + ". Behöver du bara en pall med samma sitsmått finns "
            + lank(R78_ARBETSPALL[0], "arbetspallen med rygg och fotring")
            + ".</p>",
        "eg": [
            "Två pallar ingår — priset gäller båda",
            "Låg rygg 34 × 4,5 cm med 4 cm dyna",
            "Sits 37 × 33 cm med 4 cm dyna",
            "Sitthöjd 47–62 cm med gaslyft",
            "Fotring runt pelaren, femarmad kromad fot på fem hjul",
            "Bär 120 kg per pall",
        ],
        "spec": [
            "Antal: 2 pallar",
            "Mått per pall (B × D): 38 × 38 cm",
            "Sits (B × D): 37 × 33 cm",
            "Sitthöjd: 47–62 cm",
            "Sittdynans tjocklek: 4 cm",
            "Ryggstöd (B × H): 34 × 4,5 cm",
            "Ryggdynans tjocklek: 4 cm",
            "Fotring: ja, runt pelaren",
            "Vridning: 360°",
            "Maxlast: 120 kg per pall",
            "Vikt: 10 kg för båda",
            "Klädsel: konstläder",
            "Stativ: kromat stål",
            "Höjdreglering: gaslyft",
            "Fot: femarmad, fem hjul",
            "Färg: svart",
            "Montering: krävs för båda pallarna",
            "Ingår: två rullpallar och bruksanvisning",
        ],
        "villkor": maxlast(120,
            "Talet gäller per pall, inte för de två tillsammans. Två pallar "
            "bredvid varandra bär inte det dubbla — de är inte hopkopplade och "
            "ska aldrig användas som underlag för något som ligger över båda.",
            ordet="Varje pall"),
        "skotsel": [
            KONSTLADER_SKOTSEL,
            "Efterdra båda pallarna, inte bara den du använder mest. Den som "
            "står oanvänd i ett hörn glappar lika gärna när den väl tas fram.",
            HJUL_SKOTSEL,
        ],
        "faq": [
            ("Får jag verkligen två pallar?",
             "Ja. Priset gäller båda, och båda ligger i samma paket. De "
             "monteras var för sig."),
            GASLYFT_FAQ,
            ("Hur högt är ryggstödet?",
             "4,5 cm över sitsen och 34 cm brett — ett smalt stödband i höjd "
             "med korsryggen. Vill du luta hela ryggen mot något är "
             + lank("salongspall-svart-hog-rygg-51-66-cm",
                    "salongspallen med hög svängd rygg") + " rätt pall."),
            MONTERING_FAQ,
        ],
    },
    # ================================================= S · SADELPALLAR (2) ===
    {
        "kort": "12ce97db", "pris": 829,
        "slug": "sadelpall-gra-svart-fot-45-59-cm",
        "name": "Sadelpall grå med svart fot – sitthöjd 45–59 cm, utan ryggstöd",
        "title": "Sadelpall grå 45–59 cm | Fyndplats",
        "meta": "Grå sadelpall utan ryggstöd med svart femarmad nylonfot och "
                "fem dubbelhjul. Sitthöjd 45–59 cm, sits 35 × 36 cm, "
                "bär 120 kg.",
        "ingress":
            "<p>En <strong>sadelpall</strong> med sitsen formad som en sadel — "
            "delad framtill så att låren får var sitt stöd och höfterna hamnar "
            "öppnare än på en plan sits. Den saknar rygg helt, vilket är själva "
            "poängen: du ska kunna vrida dig och sträcka dig åt alla håll utan "
            "att något är i vägen.</p>"
            "<p>Foten är svart nylon i stället för krom, och sitshöjden är "
            "seriens lägsta: 45 cm i understa läget. Det gör den till den pall "
            "man väljer när arbetsytan sitter lågt.</p>"
            "<p>Samma sadelform i rosa med kromad fot finns som "
            + lank("sadelpall-hjul-49-61-cm-rosa", "den rosa sadelpallen")
            + ", och i brunt som "
            + lank(PUBL_SADELPALL_BRUN[0],
                   "den bruna sadelpallen med sitthöjd " + PUBL_SADELPALL_BRUN[1])
            + ".</p>",
        "eg": [
            "Sadelformad sits 35 × 36 cm, delad framtill",
            "Helt utan ryggstöd — fri rörlighet åt alla håll",
            "Seriens lägsta sitthöjd: 45–59 cm",
            "Svart femarmad nylonfot med fem dubbelhjul",
            "Halkfria hjul, sitsen vrider 360°",
            "Bär 120 kg",
        ],
        "spec": [
            "Mått (L × B × H): 48 × 47 × 45–59 cm",
            "Sits (B × D): 35 × 36 cm, sadelformad",
            "Sitthöjd: 45–59 cm",
            "Ryggstöd: nej",
            "Vridning: 360°",
            "Maxlast: 120 kg",
            "Vikt: 5,2 kg",
            "Klädsel: konstläder",
            "Höjdreglering: gaslyft",
            "Fot: femarmad nylon, fem dubbelhjul",
            "Färg: grå sits, svart fot",
            "Montering: krävs",
            "Ingår: sadelpall och bruksanvisning",
        ],
        "villkor": maxlast(120,
            "Utan rygg är det ingenting som hejdar dig bakåt. Det är avsikten "
            "med formen, men det betyder också att du ska ha fötterna i golvet "
            "när du sträcker dig — sadeln är inget att luta sig mot."),
        "skotsel": [
            KONSTLADER_SKOTSEL,
            "Dubbelhjulen har två nav vardera och samlar därför dubbelt så "
            "mycket hår som vanliga. Vänd pallen ett par gånger om året och "
            "rensa båda hjulhalvorna.",
        ],
        "faq": [
            GASLYFT_FAQ,
            ("Vad är skillnaden mot den rosa sadelpallen?",
             "Foten och höjden. Den här har svart nylonfot och går 45–59 cm; "
             + lank("sadelpall-hjul-49-61-cm-rosa",
                    "den rosa sadelpallen på 49–61 cm") +
             " har kromad fot. Sadeln är 35 × 36 cm på båda."),
            ("Är sitsen grå eller svart?",
             "Grå. Foten och hjulen är svarta, och det är kontrasten mellan "
             "dem som syns tydligast på bilderna."),
            MONTERING_FAQ,
        ],
    },
    {
        "kort": "20782c24", "pris": 899,
        "slug": "sadelpall-hjul-49-61-cm-rosa",
        "name": "Sadelpall på hjul 49–61 cm – rosa, utan ryggstöd",
        "title": "Sadelpall rosa 49–61 cm | Fyndplats",
        "meta": "Rosa sadelpall utan ryggstöd, sitthöjd 49–61 cm och sadel "
                "35 × 36 cm. Kromat femarmat kryss med fem avtagbara "
                "nylonhjul för hårda golv, bär 120 kg.",
        "ingress":
            "<p>Den rosa <strong>sadelpallen</strong> — samma modell som "
            + lank(PUBL_SADELPALL_BRUN[0],
                   "den bruna sadelpallen på hjul " + PUBL_SADELPALL_BRUN[1])
            + ", i en kulör som syns. Sadeln är 35 × 36 cm och delad framtill, "
            "så låren får var sitt stöd och höfterna öppnas mer än på en plan "
            "sits.</p>"
            "<p>Krysset är kromat och bär fem nylonhjul som går att dra av. "
            "Nylon är hårt och rullar lätt på klinker, laminat och trä — på "
            "heltäckningsmatta går det trögt, och där behövs en hård "
            "skyddsmatta under.</p>"
            "<p>Stoppningen är 3–5 cm och tjockast i mitten där sadeln är som "
            "högst. Vill du ha en lägre pall med svart fot finns "
            + lank("sadelpall-gra-svart-fot-45-59-cm", "den grå sadelpallen")
            + ".</p>",
        "eg": [
            "Sadelformad sits 35 × 36 cm, delad framtill",
            "Helt utan ryggstöd — fri rörlighet åt alla håll",
            "Sitthöjd 49–61 cm med gaslyft, spak under sitsen",
            "Kromat femarmat kryss med fem avtagbara nylonhjul",
            "Stoppning 3–5 cm",
            "Bär 120 kg",
        ],
        "spec": [
            "Mått (B × D × H): 52 × 53 × 49–61 cm",
            "Sits (B × D): 35 × 36 cm, sadelformad",
            "Sitthöjd: 49–61 cm",
            "Stoppningens tjocklek: 3–5 cm",
            "Ryggstöd: nej",
            "Vridning: 360°",
            "Maxlast: 120 kg",
            "Vikt: 5,2 kg",
            "Klädsel: konstläder",
            "Stativ: kromat kryss",
            "Höjdreglering: gaslyft",
            "Fot: fem avtagbara nylonhjul för hårda golv",
            "Färg: rosa",
            "Montering: krävs",
            "Ingår: sadelpall och bruksanvisning",
        ],
        "villkor": maxlast(120,
            "Utan rygg är det ingenting som hejdar dig bakåt. Det är avsikten "
            "med formen, men det betyder också att du ska ha fötterna i golvet "
            "när du sträcker dig — sadeln är inget att luta sig mot."),
        "skotsel": [
            KONSTLADER_SKOTSEL,
            "Ljusa kulörer tar färg av mörka jeans. Torka av avfärgning tidigt "
            "— den sitter hårdare ju längre den får ligga kvar.",
            "Hjulen går att dra av rakt ut ur krysset. Det gör dem lättare att "
            "rensa än fasta hjul, och ett hjul som gått sönder byts ut för sig.",
        ],
        "faq": [
            GASLYFT_FAQ,
            ("Finns den i andra färger?",
             "Ja, samma modell finns i brunt som "
             + lank(PUBL_SADELPALL_BRUN[0], "sadelpallen på hjul i brunt") +
             ". Måtten är identiska; bara kulören skiljer."),
            ("Fungerar hjulen på matta?",
             "Nylonhjul är gjorda för hårda golv. På heltäckningsmatta rullar "
             "de trögt, och då behövs en hård skyddsmatta under pallen."),
            MONTERING_FAQ,
        ],
    },
    # ============================================ F · FOTRING UTAN RYGG (1) ===
    {
        "kort": "1d0ba82d", "pris": 829,
        "slug": "salongspall-vit-fotring-50-64-cm",
        "name": "Salongspall vit med fotring – sitthöjd 50–64 cm, bär 110 kg",
        "title": "Salongspall vit med fotring | Fyndplats",
        "meta": "Vit salongspall utan ryggstöd med fotring runt pelaren. "
                "Sitthöjd 50–64 cm, rund sits Ø32 cm med 8 cm stoppning, "
                "femarmad fot på hjul, bär 110 kg.",
        "ingress":
            "<p>En rund, slät <strong>salongspall</strong> utan rygg, med en "
            "fotring runt pelaren. Ringen är det som gör de höga lägena "
            "användbara — vid 64 cm sitthöjd når fötterna sällan golvet, och då "
            "är ringen skillnaden mellan att sitta stadigt och att balansera.</p>"
            "<p>Sitsen är Ø 32 cm med 8 cm stoppning, alltså liten i ytan men "
            "tjock i dynan. Hela pallen väger 4 kg och är seriens lättaste, "
            "vilket märks när den ska flyttas mellan rum.</p>"
            "<p>Vill du ha fotringen tillsammans med ett ryggstöd finns "
            + lank("rullpall-vit-oval-rygg-48-64-cm",
                   "den vita rullpallen med oval rygg")
            + ". En rutstickad sits utan fotring har "
            + lank(PUBL_ARBETSPALL[0],
                   "arbetspallen med hjul, sitthöjd " + PUBL_ARBETSPALL[1])
            + ".</p>",
        "eg": [
            "Fotring runt pelaren — fotstöd i de höga lägena",
            "Rund slät sits Ø 32 cm med 8 cm stoppning",
            "Sitthöjd 50–64 cm med gaslyft",
            "Femarmad fot på hjul, sitsen vrider 360°",
            "Väger 4 kg — seriens lättaste",
            "Bär 110 kg",
        ],
        "spec": [
            "Mått (Ø × H): 42 × 50–64 cm",
            "Sits: Ø 32 cm",
            "Sitthöjd: 50–64 cm",
            "Stoppningens tjocklek: 8 cm",
            "Ryggstöd: nej",
            "Fotring: ja, runt pelaren",
            "Vridning: 360°",
            "Maxlast: 110 kg",
            "Vikt: 4 kg",
            "Klädsel: konstläder",
            "Höjdreglering: gaslyft",
            "Fot: femarmad, på hjul",
            "Färg: vit",
            "Montering: krävs",
            "Ingår: salongspall och bruksanvisning",
        ],
        "villkor": maxlast(110,
            "Läs talet noga: 110 kg, inte 120 som de andra pallarna i den här "
            "serien bär. Den här är den enda med lägre gräns, och skillnaden "
            "hänger ihop med att den också är den lättaste och har det "
            "smalaste fotkrysset."),
        "skotsel": [
            KONSTLADER_SKOTSEL,
            "Fotringen får mest slitage av alla ytor på pallen, eftersom skorna "
            "vilar där. Torka av den när den blir smutsig; kromet tål vatten "
            "och diskmedel men inte skurmedel.",
            HJUL_SKOTSEL,
        ],
        "faq": [
            GASLYFT_FAQ,
            ("Varför bär den 110 kg och inte 120?",
             "Den är byggd lättare och smalare än de övriga i serien — 4 kg "
             "och en fot på Ø 42 cm. Behöver du mer marginal finns "
             + lank("rullpall-vit-oval-rygg-48-64-cm",
                    "den vita rullpallen med oval rygg, som bär 120 kg")
             + "."),
            ("Går det att sätta på ett ryggstöd?",
             "Nej, pallen är byggd utan rygg och har inget fäste för ett. "
             "Vill du ha rygg är det en annan modell."),
            MONTERING_FAQ,
        ],
    },
]
